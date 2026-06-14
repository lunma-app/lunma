import { describe, expect, test } from 'vitest';
import type { LauncherResult, ResultSource } from '../../shared/launcher-contract';
import { scoreCandidates } from './scoring';

function candidate(
  partial: Partial<LauncherResult> & { source: ResultSource; title: string; url: string },
): LauncherResult {
  return { id: 'x', score: 0, ...partial };
}

/** Score a single candidate (the engine batches; tests usually want one). */
function score1(query: string, c: LauncherResult, now?: number): number {
  return scoreCandidates(query, [c], now)[0] as number;
}

describe('scoreCandidates — match strength tiers', () => {
  test('prefix > word-boundary > scattered (title)', () => {
    const base = { source: 'tab' as const, url: 'https://x/' };
    const prefix = score1('doc', candidate({ ...base, title: 'documentation' }));
    const wordBoundary = score1('doc', candidate({ ...base, title: 'my docs site' }));
    const scattered = score1('doc', candidate({ ...base, title: 'abcdocxyz' }));
    expect(prefix).toBeGreaterThan(wordBoundary);
    expect(wordBoundary).toBeGreaterThan(scattered);
    expect(scattered).toBeGreaterThan(0);
  });

  test('an exact prefix outranks a scattered fuzzy match (spec)', () => {
    const base = { source: 'tab' as const, url: 'https://x/' };
    const prefix = score1('parse', candidate({ ...base, title: 'parser internals' }));
    const scattered = score1(
      'parse',
      candidate({ ...base, title: 'pages are nicely styled extra' }),
    );
    expect(scattered).toBeGreaterThan(0);
    expect(prefix).toBeGreaterThan(scattered);
  });

  test('no match scores 0', () => {
    expect(score1('zzz', candidate({ source: 'tab', title: 'abc', url: 'https://abc/' }))).toBe(0);
  });

  test('empty / whitespace query scores 0', () => {
    expect(score1('   ', candidate({ source: 'tab', title: 'abc', url: 'https://x/' }))).toBe(0);
  });
});

describe('scoreCandidates — fuzzy + typo tolerance', () => {
  test('a non-contiguous subsequence matches (prsfix → "PRs: fix parser")', () => {
    const matched = score1(
      'prsfix',
      candidate({ source: 'tab', title: 'PRs: fix parser', url: 'https://x/' }),
    );
    expect(matched).toBeGreaterThan(0);
  });

  test('a query that cannot be threaded scores 0 and is dropped', () => {
    // "fixzzz" — "fix" threads, but the "zzz" tail occurs nowhere after it and is
    // too far from any single-typo of a term, so the whole query cannot be threaded.
    expect(
      score1('fixzzz', candidate({ source: 'tab', title: 'PRs: fix parser', url: 'https://no/' })),
    ).toBe(0);
  });

  test('a single-character typo still matches (recieve → "Receive webhook")', () => {
    const matched = score1(
      'recieve',
      candidate({ source: 'tab', title: 'Receive webhook', url: 'https://x/' }),
    );
    expect(matched).toBeGreaterThan(0);
  });

  test('a typo in a URL still matches', () => {
    const matched = score1(
      'exmaple',
      candidate({ source: 'bookmark', title: 'no', url: 'https://example.com/' }),
    );
    expect(matched).toBeGreaterThan(0);
  });
});

describe('scoreCandidates — field weight', () => {
  test('a title match outranks the same-quality URL match', () => {
    const titleMatch = score1(
      'docs',
      candidate({ source: 'tab', title: 'docs', url: 'https://nomatch/' }),
    );
    const urlMatch = score1(
      'docs',
      candidate({ source: 'tab', title: 'nomatch', url: 'docs://x/' }),
    );
    expect(titleMatch).toBeGreaterThan(urlMatch);
  });

  test('a folder-name match never outranks a same-strength title match (FOLDER_WEIGHT ≤ URL_WEIGHT)', () => {
    const titleHit = score1(
      'work',
      candidate({ source: 'saved', title: 'work', url: 'https://nomatch/' }),
    );
    const folderHit = score1(
      'work',
      candidate({ source: 'saved', title: 'nomatch', url: 'https://nomatch/', folderName: 'work' }),
    );
    expect(folderHit).toBeGreaterThan(0);
    expect(titleHit).toBeGreaterThan(folderHit);
  });

  test('a result matches the name of its folder (spec)', () => {
    const saved = score1(
      'work',
      candidate({ source: 'saved', title: 'Standup doc', url: 'https://s/', folderName: 'Work' }),
    );
    const smart = score1(
      'work',
      candidate({
        source: 'smart',
        title: 'Fix the parser',
        url: 'https://g/',
        folderName: 'Work PRs',
      }),
    );
    expect(saved).toBeGreaterThan(0);
    expect(smart).toBeGreaterThan(0);
  });
});

describe('scoreCandidates — source weight', () => {
  test('tab > saved > smart > bookmark > history for the same match', () => {
    const score = (source: ResultSource) =>
      score1('docs', candidate({ source, title: 'docs', url: 'https://x/' }));
    expect(score('tab')).toBeGreaterThan(score('saved'));
    expect(score('saved')).toBeGreaterThan(score('smart'));
    expect(score('smart')).toBeGreaterThan(score('bookmark'));
    expect(score('bookmark')).toBeGreaterThan(score('history'));
  });

  test('recency reorders history among itself but never flips source order', () => {
    const now = 1_000_000_000_000;
    const recent = score1(
      'docs',
      candidate({ source: 'history', title: 'docs', url: 'https://x/', lastVisitTime: now }),
      now,
    );
    const old = score1(
      'docs',
      candidate({ source: 'history', title: 'docs', url: 'https://x/', lastVisitTime: 0 }),
      now,
    );
    expect(recent).toBeGreaterThan(old);
    // Even the most recent history never beats a weaker-source bookmark of equal match.
    const bookmark = score1(
      'docs',
      candidate({ source: 'bookmark', title: 'docs', url: 'https://x/' }),
      now,
    );
    expect(bookmark).toBeGreaterThan(recent);
  });
});

describe('scoreCandidates — current-Space boost (design D9)', () => {
  const inSpace = () =>
    candidate({ source: 'smart', title: 'docs', url: 'https://x/', spaceId: 'work' });
  const crossSpace = () =>
    candidate({ source: 'smart', title: 'docs', url: 'https://y/', spaceId: 'home' });

  test('an in-Space result outscores its same-source cross-Space peer', () => {
    const [inS, cross] = scoreCandidates('docs', [inSpace(), crossSpace()], undefined, 'work');
    expect(inS as number).toBeGreaterThan(cross as number);
  });

  test('no boost when no active Space is passed (global scope)', () => {
    const [inS, cross] = scoreCandidates('docs', [inSpace(), crossSpace()]);
    expect(inS).toBeCloseTo(cross as number, 10);
  });

  test('a global row (no spaceId) is never boosted even in the active Space', () => {
    const globalRow = candidate({ source: 'bookmark', title: 'docs', url: 'https://b/' });
    const withActive = scoreCandidates('docs', [globalRow], undefined, 'work')[0] as number;
    const withoutActive = scoreCandidates('docs', [globalRow])[0] as number;
    expect(withActive).toBeCloseTo(withoutActive, 10);
  });

  test('the boost never resurrects a non-matching candidate', () => {
    const noMatch = candidate({
      source: 'smart',
      title: 'zzz',
      url: 'https://z/',
      spaceId: 'work',
    });
    expect(scoreCandidates('docs', [noMatch], undefined, 'work')[0]).toBe(0);
  });
});

describe('scoreCandidates — batch shape', () => {
  test('returns one score per candidate, parallel to input', () => {
    const scores = scoreCandidates('docs', [
      candidate({ source: 'tab', title: 'docs first', url: 'https://a/' }),
      candidate({ source: 'tab', title: 'no match here', url: 'https://b/' }),
    ]);
    expect(scores).toHaveLength(2);
    expect(scores[0]).toBeGreaterThan(0);
    expect(scores[1]).toBe(0);
  });
});
