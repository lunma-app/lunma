import { describe, expect, test } from 'vitest';
import { clusterIdsByHost } from './cluster-by-host';

/** Ids 1..n mapped to the urls given, in order. */
function fixture(urls: string[]): { ids: number[]; urlOf: (id: number) => string | undefined } {
  const byId = new Map(urls.map((u, i) => [i + 1, u]));
  return { ids: [...byId.keys()], urlOf: (id) => byId.get(id) };
}

describe('clusterIdsByHost', () => {
  test('makes same-host ids contiguous, clusters ordered by first appearance', () => {
    const { ids, urlOf } = fixture([
      'https://a.com/1',
      'https://b.com/1',
      'https://a.com/2',
      'https://c.com/1',
      'https://b.com/2',
    ]);
    expect(clusterIdsByHost(ids, urlOf)).toEqual([1, 3, 2, 5, 4]);
  });

  test('preserves relative order within a cluster', () => {
    const { ids, urlOf } = fixture([
      'https://a.com/1',
      'https://b.com/1',
      'https://a.com/2',
      'https://a.com/3',
    ]);
    expect(clusterIdsByHost(ids, urlOf)).toEqual([1, 3, 4, 2]);
  });

  test('treats an exact hostname as the key — subdomains do not merge', () => {
    const { ids, urlOf } = fixture([
      'https://mail.example.com/1',
      'https://docs.example.com/1',
      'https://mail.example.com/2',
    ]);
    expect(clusterIdsByHost(ids, urlOf)).toEqual([1, 3, 2]);
  });

  test('collects non-http(s) pages into one cluster pinned LAST', () => {
    const { ids, urlOf } = fixture([
      'chrome://whats-new/',
      'https://a.com/1',
      'chrome://extensions/',
      'https://a.com/2',
    ]);
    // The browser pages leave the middle and land together at the end, keeping
    // their relative order; the real site closes ranks.
    expect(clusterIdsByHost(ids, urlOf)).toEqual([2, 4, 1, 3]);
  });

  test('treats extension pages and unparseable urls as browser pages too', () => {
    const { ids, urlOf } = fixture([
      'chrome-extension://abc/newtab.html',
      'https://a.com/1',
      'blob:xyz',
      'not a url',
      'https://a.com/2',
    ]);
    expect(clusterIdsByHost(ids, urlOf)).toEqual([2, 5, 1, 3, 4]);
  });

  test('treats a missing url as a browser page', () => {
    const urlOf = (id: number): string | undefined =>
      id === 2 ? undefined : `https://a.com/${id}`;
    expect(clusterIdsByHost([1, 2, 3], urlOf)).toEqual([1, 3, 2]);
  });

  test('a list of only browser pages keeps its order', () => {
    const { ids, urlOf } = fixture(['chrome://extensions/', 'chrome://whats-new/']);
    expect(clusterIdsByHost(ids, urlOf)).toEqual([1, 2]);
  });

  test('is idempotent — an already-clustered list is returned in the same order', () => {
    const { ids, urlOf } = fixture([
      'https://a.com/1',
      'https://a.com/2',
      'https://b.com/1',
      'chrome://extensions/',
    ]);
    const once = clusterIdsByHost(ids, urlOf);
    expect(once).toEqual(ids);
    expect(clusterIdsByHost(once, urlOf)).toEqual(once);
  });

  test('returns a new array and never mutates its input', () => {
    const { ids, urlOf } = fixture(['https://b.com/1', 'https://a.com/1', 'https://b.com/2']);
    const snapshot = [...ids];
    const out = clusterIdsByHost(ids, urlOf);
    expect(ids).toEqual(snapshot);
    expect(out).not.toBe(ids);
  });

  test('handles empty and single-element inputs', () => {
    expect(clusterIdsByHost([], () => undefined)).toEqual([]);
    expect(clusterIdsByHost([7], () => 'https://a.com/')).toEqual([7]);
  });
});
