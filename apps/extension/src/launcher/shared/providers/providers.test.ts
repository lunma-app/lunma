import { describe, expect, test } from 'vitest';
import type { SavedTab, SmartFolderRuntime } from '../../../shared/types';
import { bookmarksProvider } from './bookmarks';
import { historyProvider } from './history';
import { openTabsProvider } from './open-tabs';
import { savedTabsProvider } from './saved-tabs';
import { smartFoldersProvider } from './smart-folders';

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

  test('carries folderName when the saved tab is in a folder, none otherwise', () => {
    const results = savedTabsProvider(
      {
        infolder: saved('infolder', 'https://f/', 'https://f/'),
        loose: saved('loose', 'https://l/', 'https://l/'),
      },
      {},
      undefined,
      { infolder: 'Work' },
    );
    const byId = Object.fromEntries(results.map((r) => [r.savedTabId, r.folderName]));
    expect(byId).toEqual({ infolder: 'Work', loose: undefined });
  });

  test('carries spaceId for a pinned saved tab, none for a favorite (spaceId null)', () => {
    const results = savedTabsProvider({
      pinned: {
        id: 'pinned',
        spaceId: 'work',
        title: 'p',
        originalURL: 'https://p/',
        currentURL: null,
      },
      fav: { id: 'fav', spaceId: null, title: 'f', originalURL: 'https://f/', currentURL: null },
    });
    const byId = Object.fromEntries(results.map((r) => [r.savedTabId, r.spaceId]));
    expect(byId).toEqual({ pinned: 'work', fav: undefined });
  });
});

describe('smartFoldersProvider', () => {
  const runtime = (
    state: SmartFolderRuntime['state'],
    items: SmartFolderRuntime['items'],
  ): SmartFolderRuntime => ({ state, items, fetchedAt: state === 'ok' ? 1 : null });

  const item = (id: string, title: string, url: string) => ({ id, title, url });

  test('flattens every folder’s items to smart results with folderName + spaceId', () => {
    const results = smartFoldersProvider(
      {
        'sf-1': runtime('ok', [item('i1', 'Fix the parser', 'https://github.com/o/r/pull/12')]),
      },
      { 'sf-1': 'Work PRs' },
      { 'sf-1': 'work' },
    );
    expect(results).toEqual([
      {
        id: 'smart:i1',
        source: 'smart',
        title: 'Fix the parser',
        url: 'https://github.com/o/r/pull/12',
        score: 0,
        folderName: 'Work PRs',
        spaceId: 'work',
      },
    ]);
  });

  test('carries no spaceId when no folder-space index is passed', () => {
    const results = smartFoldersProvider({
      'sf-1': runtime('ok', [item('i1', 'Title', 'https://x/1')]),
    });
    expect(results[0]?.spaceId).toBeUndefined();
  });

  test('a pending refresh keeps its last-known items', () => {
    const results = smartFoldersProvider({
      'sf-1': runtime('pending', [item('i1', 'Stale but matchable', 'https://x/1')]),
    });
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({ source: 'smart', url: 'https://x/1' });
    expect(results[0]?.folderName).toBeUndefined(); // no index passed
  });

  test('signed-out and error folders (empty items) contribute nothing', () => {
    const results = smartFoldersProvider({
      out: runtime('signed-out', []),
      err: runtime('error', []),
    });
    expect(results).toEqual([]);
  });

  test('includes items from all folders and skips items without a url', () => {
    const results = smartFoldersProvider({
      a: runtime('ok', [item('a1', 'A one', 'https://a/1'), item('a2', 'no url', '')]),
      b: runtime('ok', [item('b1', 'B one', 'https://b/1')]),
    });
    expect(results.map((r) => r.url)).toEqual(['https://a/1', 'https://b/1']);
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
