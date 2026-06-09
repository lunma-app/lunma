import { describe, expect, test } from 'vitest';
import type { LauncherResult, ResultSource } from '../../shared/launcher-contract';
import { scoreResult } from './scoring';

function candidate(
  partial: Partial<LauncherResult> & { source: ResultSource; title: string; url: string },
): LauncherResult {
  return { id: 'x', score: 0, ...partial };
}

describe('scoreResult — match quality', () => {
  test('prefix > word-boundary > plain substring (title)', () => {
    const base = { source: 'tab' as const, url: 'https://x/' };
    const prefix = scoreResult('doc', candidate({ ...base, title: 'documentation' }));
    const wordBoundary = scoreResult('doc', candidate({ ...base, title: 'my docs site' }));
    const substring = scoreResult('doc', candidate({ ...base, title: 'abcdocxyz' }));
    expect(prefix).toBeGreaterThan(wordBoundary);
    expect(wordBoundary).toBeGreaterThan(substring);
    expect(substring).toBeGreaterThan(0);
  });

  test('no match scores 0', () => {
    expect(
      scoreResult('zzz', candidate({ source: 'tab', title: 'abc', url: 'https://abc/' })),
    ).toBe(0);
  });

  test('empty query scores 0', () => {
    expect(scoreResult('   ', candidate({ source: 'tab', title: 'abc', url: 'https://x/' }))).toBe(
      0,
    );
  });
});

describe('scoreResult — field weight', () => {
  test('a title match outranks the same-quality URL match', () => {
    const titleMatch = scoreResult(
      'docs',
      candidate({ source: 'tab', title: 'docs', url: 'https://nomatch/' }),
    );
    const urlMatch = scoreResult(
      'docs',
      candidate({ source: 'tab', title: 'nomatch', url: 'docs://x/' }),
    );
    expect(titleMatch).toBeGreaterThan(urlMatch);
  });
});

describe('scoreResult — source weight', () => {
  test('tab > saved > bookmark > history for the same match', () => {
    const score = (source: ResultSource) =>
      scoreResult('docs', candidate({ source, title: 'docs', url: 'https://x/' }));
    expect(score('tab')).toBeGreaterThan(score('saved'));
    expect(score('saved')).toBeGreaterThan(score('bookmark'));
    expect(score('bookmark')).toBeGreaterThan(score('history'));
  });

  test('recency reorders history among itself but never flips source order', () => {
    const now = 1_000_000_000_000;
    const recent = scoreResult(
      'docs',
      candidate({ source: 'history', title: 'docs', url: 'https://x/', lastVisitTime: now }),
      now,
    );
    const old = scoreResult(
      'docs',
      candidate({ source: 'history', title: 'docs', url: 'https://x/', lastVisitTime: 0 }),
      now,
    );
    expect(recent).toBeGreaterThan(old);
    // Even the most recent history never beats a weaker-source bookmark of equal match.
    const bookmark = scoreResult(
      'docs',
      candidate({ source: 'bookmark', title: 'docs', url: 'https://x/' }),
      now,
    );
    expect(bookmark).toBeGreaterThan(recent);
  });
});
