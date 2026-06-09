import { describe, expect, test } from 'vitest';
import type { SavedTab } from '../../../shared/types';
import { bookmarksProvider } from './bookmarks';
import { historyProvider } from './history';
import { openTabsProvider } from './open-tabs';
import { savedTabsProvider } from './saved-tabs';

describe('openTabsProvider', () => {
  test('maps tabs to tab results carrying tabId + windowId', () => {
    const results = openTabsProvider(
      [{ id: 7, windowId: 100, title: 'Docs', url: 'https://docs.example/', active: false }],
      100,
    );
    expect(results).toEqual([
      {
        id: 'tab:7',
        source: 'tab',
        title: 'Docs',
        url: 'https://docs.example/',
        score: 0,
        tabId: 7,
        windowId: 100,
      },
    ]);
  });

  test("excludes the active window's active tab", () => {
    const results = openTabsProvider(
      [
        { id: 1, windowId: 100, url: 'https://here/', active: true },
        { id: 2, windowId: 100, url: 'https://other/', active: false },
        { id: 3, windowId: 200, url: 'https://otherwin/', active: true },
      ],
      100,
    );
    expect(results.map((r) => r.tabId)).toEqual([2, 3]);
  });

  test('drops tabs without an id or url and falls back title to url', () => {
    const results = openTabsProvider(
      [
        { id: undefined, windowId: 100, url: 'https://noid/' },
        { id: 4, windowId: 100, url: undefined },
        { id: 5, windowId: 100, url: 'https://x/' },
      ],
      100,
    );
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({ tabId: 5, title: 'https://x/' });
  });
});

describe('savedTabsProvider', () => {
  const saved = (id: string, currentURL: string | null, originalURL: string): SavedTab => ({
    id,
    spaceId: 'work',
    title: id,
    originalURL,
    currentURL,
  });

  test('uses currentURL when bound, originalURL when dormant', () => {
    const results = savedTabsProvider({
      a: saved('a', 'https://live/', 'https://home/'),
      b: saved('b', null, 'https://dormant-home/'),
    });
    const byId = Object.fromEntries(results.map((r) => [r.savedTabId, r.url]));
    expect(byId).toEqual({ a: 'https://live/', b: 'https://dormant-home/' });
    expect(results.every((r) => r.source === 'saved')).toBe(true);
  });

  test('carries the bound tabId only when bound to a live tab', () => {
    const results = savedTabsProvider(
      {
        bound: saved('bound', 'https://b/', 'https://b/'),
        dormant: saved('dormant', null, 'https://d/'),
      },
      { bound: { 100: 42 }, dormant: {} },
      100,
    );
    const byId = Object.fromEntries(results.map((r) => [r.savedTabId, r.tabId]));
    expect(byId).toEqual({ bound: 42, dormant: undefined });
  });
});

describe('bookmarksProvider', () => {
  test('drops folder nodes (no url) and maps the rest', () => {
    const results = bookmarksProvider([
      { id: 'f1', title: 'Folder' },
      { id: 'b1', title: 'Example', url: 'https://example.com/' },
    ]);
    expect(results).toEqual([
      {
        id: 'bookmark:b1',
        source: 'bookmark',
        title: 'Example',
        url: 'https://example.com/',
        score: 0,
      },
    ]);
  });
});

describe('historyProvider', () => {
  test('maps items and carries lastVisitTime', () => {
    const results = historyProvider([
      { url: 'https://h/', title: 'Hist', lastVisitTime: 1234 },
      { url: undefined, title: 'no url' },
    ]);
    expect(results).toEqual([
      {
        id: 'history:https://h/',
        source: 'history',
        title: 'Hist',
        url: 'https://h/',
        score: 0,
        lastVisitTime: 1234,
      },
    ]);
  });
});
