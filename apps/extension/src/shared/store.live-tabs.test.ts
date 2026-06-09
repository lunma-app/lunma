import { describe, expect, test } from 'vitest';
import { LunmaStore } from './store.svelte';
import { makeStore } from './store.test-helpers';
import type { LiveTab } from './types';

function liveTab(partial: Partial<LiveTab> = {}): LiveTab {
  return {
    tabId: partial.tabId ?? 17,
    windowId: partial.windowId ?? 100,
    title: partial.title ?? 'Example',
    url: partial.url ?? 'https://example.com/',
    active: partial.active ?? false,
    status: partial.status ?? 'complete',
  };
}

describe('LunmaStore.syncLiveTab', () => {
  test('inserts a new LiveTab from a full tab', () => {
    const store = makeStore();
    store.syncLiveTab({
      id: 17,
      windowId: 100,
      title: 'GitHub',
      url: 'https://github.com/',
      active: true,
      status: 'loading',
    });
    expect(store.state.liveTabsById[17]).toEqual({
      tabId: 17,
      windowId: 100,
      title: 'GitHub',
      url: 'https://github.com/',
      active: true,
      status: 'loading',
    });
  });

  test('partial update preserves windowId/active from the existing entry', () => {
    const store = makeStore();
    store.state.liveTabsById[17] = liveTab({ tabId: 17, windowId: 100, active: true });
    store.syncLiveTab({ id: 17, title: 'New title', url: 'https://example.com/page' });
    expect(store.state.liveTabsById[17]).toMatchObject({
      windowId: 100,
      active: true,
      title: 'New title',
      url: 'https://example.com/page',
    });
  });

  test('captures favIconUrl and keeps the last good one when omitted', () => {
    const store = makeStore();
    store.syncLiveTab({
      id: 17,
      windowId: 100,
      url: 'https://example.com/',
      favIconUrl: 'https://example.com/icon.png',
    });
    expect(store.state.liveTabsById[17]?.favIconUrl).toBe('https://example.com/icon.png');
    // A later update without favIconUrl (e.g. a title-only change) keeps it.
    store.syncLiveTab({ id: 17, title: 'Example' });
    expect(store.state.liveTabsById[17]?.favIconUrl).toBe('https://example.com/icon.png');
  });

  test('a favicon-only change updates the entry', () => {
    const store = makeStore();
    store.state.liveTabsById[17] = liveTab({ tabId: 17, windowId: 100 });
    store.syncLiveTab({ id: 17, favIconUrl: 'https://example.com/new.png' });
    expect(store.state.liveTabsById[17]?.favIconUrl).toBe('https://example.com/new.png');
  });

  test('an empty incoming title does not clobber a previously-resolved title', () => {
    const store = makeStore();
    store.state.liveTabsById[17] = liveTab({ tabId: 17, windowId: 100, title: 'Real Title' });
    // Chrome emits title: '' mid-navigation — must keep the last good title.
    store.syncLiveTab({ id: 17, title: '', url: 'https://example.com/loading' });
    expect(store.state.liveTabsById[17]?.title).toBe('Real Title');
  });

  test('non-loading status normalizes to complete', () => {
    const store = makeStore();
    store.syncLiveTab({ id: 5, windowId: 1, status: 'unloaded' });
    expect(store.state.liveTabsById[5]?.status).toBe('complete');
  });

  test('no-op when visible fields are unchanged (same object identity)', () => {
    const store = makeStore();
    store.state.liveTabsById[17] = liveTab({ tabId: 17 });
    const before = store.state.liveTabsById[17];
    store.syncLiveTab({
      id: 17,
      windowId: 100,
      title: 'Example',
      url: 'https://example.com/',
      active: false,
      status: 'complete',
    });
    expect(store.state.liveTabsById[17]).toBe(before);
  });

  test('missing tab.id is a no-op', () => {
    const store = makeStore();
    store.syncLiveTab({ windowId: 100, title: 'x' });
    expect(Object.keys(store.state.liveTabsById)).toHaveLength(0);
  });

  test('no existing entry and no windowId is a no-op', () => {
    const store = makeStore();
    store.syncLiveTab({ id: 17, title: 'x' });
    expect(store.state.liveTabsById[17]).toBeUndefined();
  });
});

describe('LunmaStore.removeLiveTab', () => {
  test('deletes the entry', () => {
    const store = makeStore();
    store.state.liveTabsById[17] = liveTab({ tabId: 17 });
    store.removeLiveTab(17);
    expect(store.state.liveTabsById[17]).toBeUndefined();
  });

  test('removing an unknown id is harmless', () => {
    const store = makeStore();
    store.removeLiveTab(999);
    expect(store.state.liveTabsById[999]).toBeUndefined();
  });
});

describe('LunmaStore.setActiveTab', () => {
  test('sets the target active and clears others in the same window', () => {
    const store = makeStore();
    store.state.liveTabsById[17] = liveTab({ tabId: 17, windowId: 100, active: true });
    store.state.liveTabsById[22] = liveTab({ tabId: 22, windowId: 100, active: false });
    store.setActiveTab(100, 22);
    expect(store.state.liveTabsById[22]?.active).toBe(true);
    expect(store.state.liveTabsById[17]?.active).toBe(false);
  });

  test('does not touch tabs in other windows', () => {
    const store = makeStore();
    store.state.liveTabsById[17] = liveTab({ tabId: 17, windowId: 100, active: true });
    store.state.liveTabsById[99] = liveTab({ tabId: 99, windowId: 200, active: true });
    store.setActiveTab(100, 17);
    expect(store.state.liveTabsById[99]?.active).toBe(true);
  });
});

describe('LunmaStore.rebuildLiveTabs', () => {
  test('seeds the whole map from query results, skipping tabs without id/windowId', () => {
    const store = new LunmaStore();
    store.state.liveTabsById[1] = liveTab({ tabId: 1 }); // stale, should be replaced
    store.rebuildLiveTabs([
      { id: 17, windowId: 100, title: 'A', url: 'https://a/', active: true, status: 'complete' },
      { id: 22, windowId: 100, title: 'B', url: 'https://b/', active: false, status: 'loading' },
      { windowId: 100, title: 'no id' },
      { id: 33, title: 'no window' },
    ]);
    expect(Object.keys(store.state.liveTabsById).sort()).toEqual(['17', '22']);
    expect(store.state.liveTabsById[17]).toEqual({
      tabId: 17,
      windowId: 100,
      title: 'A',
      url: 'https://a/',
      active: true,
      status: 'complete',
    });
    expect(store.state.liveTabsById[22]?.status).toBe('loading');
  });
});

describe('LunmaStore.ensureSpaceInstance', () => {
  test('creates an empty instance for a window with an active Space', () => {
    const store = makeStore();
    store.state.spaces.push({ id: 'work', name: 'Work', color: 'blue', icon: 'star' });
    store.state.activeSpaceByWindow[100] = 'work';
    store.ensureSpaceInstance(100);
    expect(store.state.spaceInstancesByWindow[100]).toEqual({
      work: {
        spaceId: 'work',
        groupId: -1,
        tempTabIds: [],
        tempTabTitles: {},
      },
    });
  });

  test('is a no-op when the window has no active Space', () => {
    const store = makeStore();
    store.state.activeSpaceByWindow[100] = null;
    store.ensureSpaceInstance(100);
    expect(store.state.spaceInstancesByWindow[100]).toBeUndefined();
  });

  test('does not clobber an existing instance or touch lastActivatedSpaceId', () => {
    const store = makeStore();
    store.state.spaces.push({ id: 'work', name: 'Work', color: 'blue', icon: 'star' });
    store.state.activeSpaceByWindow[100] = 'work';
    store.state.spaceInstancesByWindow[100] = {
      work: { spaceId: 'work', groupId: 7, tempTabIds: [42], tempTabTitles: {} },
    };
    store.state.lastActivatedSpaceId = 'other';
    store.ensureSpaceInstance(100);
    expect(store.state.spaceInstancesByWindow[100]).toEqual({
      work: {
        spaceId: 'work',
        groupId: 7,
        tempTabIds: [42],
        tempTabTitles: {},
      },
    });
    expect(store.state.lastActivatedSpaceId).toBe('other');
  });
});
