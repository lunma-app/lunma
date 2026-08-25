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

  test('clusters hostless urls together at their first-appearance position', () => {
    const { ids, urlOf } = fixture(['https://a.com/1', 'blob:xyz', 'https://a.com/2', 'not a url']);
    expect(clusterIdsByHost(ids, urlOf)).toEqual([1, 3, 2, 4]);
  });

  test('treats a missing url like a hostless one', () => {
    const urlOf = (id: number): string | undefined =>
      id === 2 ? undefined : `https://a.com/${id}`;
    expect(clusterIdsByHost([1, 2, 3], urlOf)).toEqual([1, 3, 2]);
  });

  test('is idempotent — an already-clustered list is returned in the same order', () => {
    const { ids, urlOf } = fixture([
      'https://a.com/1',
      'https://a.com/2',
      'https://b.com/1',
      'https://c.com/1',
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
