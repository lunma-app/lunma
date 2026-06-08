import { describe, expect, test, vi } from 'vitest';
import type { LauncherResult, ResultSource } from '../../shared/launcher-contract';
import { log } from '../../shared/logger';
import { MAX_RESULTS, runSearch, type SearchSources } from './search-engine';

function result(source: ResultSource, url: string, title = url): LauncherResult {
  return { id: `${source}:${url}`, source, title, url, score: 0 };
}

function sources(partial: Partial<SearchSources>): SearchSources {
  return { tabs: [], saved: [], bookmarks: [], history: [], ...partial };
}

describe('runSearch — empty query', () => {
  test('returns [] for an empty or whitespace query', () => {
    expect(runSearch('', sources({ tabs: [result('tab', 'https://docs/')] }))).toEqual([]);
    expect(runSearch('   ', sources({ tabs: [result('tab', 'https://docs/')] }))).toEqual([]);
  });
});

describe('runSearch — de-dup precedence', () => {
  test('an open tab suppresses its history duplicate', () => {
    const out = runSearch(
      'example',
      sources({
        tabs: [result('tab', 'https://example.com/')],
        history: [result('history', 'https://example.com/')],
      }),
    );
    expect(out).toHaveLength(1);
    expect(out[0]?.source).toBe('tab');
  });

  test('a saved tab suppresses its bookmark duplicate', () => {
    const out = runSearch(
      'example',
      sources({
        saved: [result('saved', 'https://example.com/')],
        bookmarks: [result('bookmark', 'https://example.com/')],
      }),
    );
    expect(out).toHaveLength(1);
    expect(out[0]?.source).toBe('saved');
  });

  test('distinct URLs all survive', () => {
    const out = runSearch(
      'site',
      sources({
        tabs: [result('tab', 'https://site-a/')],
        history: [result('history', 'https://site-b/')],
      }),
    );
    expect(out).toHaveLength(2);
  });
});

describe('runSearch — ordering, cap, and truncation log', () => {
  test('orders by score descending', () => {
    const out = runSearch(
      'docs',
      sources({
        history: [result('history', 'https://h/', 'mid docs here')], // word-boundary
        tabs: [result('tab', 'https://t/', 'docs first')], // prefix + best source
      }),
    );
    expect(out.map((r) => r.source)).toEqual(['tab', 'history']);
  });

  test('caps to MAX_RESULTS and logs truncation', () => {
    const spy = vi.spyOn(log, 'debug').mockImplementation(() => undefined);
    const many = Array.from({ length: MAX_RESULTS + 5 }, (_, i) =>
      result('history', `https://docs-${i}/`, `docs ${i}`),
    );
    const out = runSearch('docs', sources({ history: many }));
    expect(out).toHaveLength(MAX_RESULTS);
    expect(spy).toHaveBeenCalledWith(
      'LAUNCHER_RESULTS_TRUNCATED',
      expect.objectContaining({ cap: MAX_RESULTS, total: MAX_RESULTS + 5 }),
    );
    spy.mockRestore();
  });

  test('does not log when under the cap', () => {
    const spy = vi.spyOn(log, 'debug').mockImplementation(() => undefined);
    runSearch('docs', sources({ tabs: [result('tab', 'https://docs/')] }));
    expect(spy).not.toHaveBeenCalledWith('LAUNCHER_RESULTS_TRUNCATED', expect.anything());
    spy.mockRestore();
  });
});
