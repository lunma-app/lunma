import { describe, expect, test, vi } from 'vitest';
import { makeStore, seedSpace } from './store.test-helpers';
import type { SavedTab } from './types';

function savedTab(partial: Partial<SavedTab> = {}): SavedTab {
  return {
    id: partial.id ?? 'st-1',
    spaceId: partial.spaceId ?? 'work',
    title: partial.title ?? 'GitHub',
    originalURL: partial.originalURL ?? 'https://github.com/',
    currentURL: partial.currentURL ?? null,
  };
}

describe('LunmaStore.onTabCreated', () => {
  test('adds tab to tempTabIds when not bound', () => {
    const store = makeStore();
    const space = seedSpace(store);
    store.state.spaceInstancesByWindow[100] = {
      [space.id]: { spaceId: space.id, groupId: 1, tempTabIds: [], tempTabTitles: {} },
    };
    store.state.activeSpaceByWindow[100] = space.id;
    store.onTabCreated({ id: 42, windowId: 100 });
    expect(store.state.spaceInstancesByWindow[100]?.[space.id]?.tempTabIds).toEqual([42]);
  });

  test('does not add a bound tab', () => {
    const store = makeStore();
    const space = seedSpace(store);
    store.state.spaceInstancesByWindow[100] = {
      [space.id]: { spaceId: space.id, groupId: 1, tempTabIds: [], tempTabTitles: {} },
    };
    store.state.activeSpaceByWindow[100] = space.id;
    store.state.savedTabs['st-1'] = savedTab({ currentURL: 'https://github.com/' });
    store.state.tabBindings['st-1'] = { 100: 42 };
    store.onTabCreated({ id: 42, windowId: 100 });
    expect(store.state.spaceInstancesByWindow[100]?.[space.id]?.tempTabIds).toEqual([]);
  });

  test('is a no-op when the window has no instance', () => {
    const store = makeStore();
    store.onTabCreated({ id: 42, windowId: 999 });
    expect(store.state.spaceInstancesByWindow[999]).toBeUndefined();
  });

  test('logs error when tab.id or tab.windowId is missing', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const store = makeStore();
    store.onTabCreated({ windowId: 100 });
    store.onTabCreated({ id: 42 });
    expect(errorSpy).toHaveBeenCalledTimes(2);
    errorSpy.mockRestore();
  });

  test('does not add a tab id that is already in tempTabIds', () => {
    const store = makeStore();
    const space = seedSpace(store);
    store.state.spaceInstancesByWindow[100] = {
      [space.id]: { spaceId: space.id, groupId: 1, tempTabIds: [42], tempTabTitles: {} },
    };
    store.state.activeSpaceByWindow[100] = space.id;
    store.onTabCreated({ id: 42, windowId: 100 });
    expect(store.state.spaceInstancesByWindow[100]?.[space.id]?.tempTabIds).toEqual([42]);
  });
});

describe('LunmaStore.onTabRemoved', () => {
  test('removes tab from tempTabIds and clears any matching binding', () => {
    const store = makeStore();
    const space = seedSpace(store);
    store.state.spaceInstancesByWindow[100] = {
      [space.id]: { spaceId: space.id, groupId: 1, tempTabIds: [42, 43], tempTabTitles: {} },
    };
    store.state.savedTabs['st-1'] = savedTab({ currentURL: 'https://github.com/sub' });
    store.state.tabBindings['st-1'] = { 100: 43 };
    store.onTabRemoved(42, { windowId: 100, isWindowClosing: false });
    expect(store.state.spaceInstancesByWindow[100]?.[space.id]?.tempTabIds).toEqual([43]);
    store.onTabRemoved(43, { windowId: 100, isWindowClosing: false });
    // Closing the last bound tab drops the window slot AND clears currentURL.
    expect(store.state.tabBindings['st-1']).toEqual({});
    expect(store.state.savedTabs['st-1']?.currentURL).toBeNull();
  });

  test('handles a tab that is not bound to any saved tab', () => {
    const store = makeStore();
    const space = seedSpace(store);
    store.state.spaceInstancesByWindow[100] = {
      [space.id]: { spaceId: space.id, groupId: 1, tempTabIds: [42], tempTabTitles: {} },
    };
    store.state.savedTabs['st-1'] = savedTab({ currentURL: 'https://github.com/' });
    store.state.tabBindings['st-1'] = { 100: 99 };
    store.onTabRemoved(42, {});
    expect(store.state.tabBindings['st-1']).toEqual({ 100: 99 });
    expect(store.state.spaceInstancesByWindow[100]?.[space.id]?.tempTabIds).toEqual([]);
  });

  test('handles a removed bound tab whose saved-tab record is missing', () => {
    const store = makeStore();
    store.state.tabBindings['st-orphan'] = { 100: 77 };
    store.onTabRemoved(77, {});
    expect(store.state.tabBindings['st-orphan']).toEqual({});
  });

  test('handles a tab that was never in any tempTabIds list', () => {
    const store = makeStore();
    const space = seedSpace(store);
    store.state.spaceInstancesByWindow[100] = {
      [space.id]: { spaceId: space.id, groupId: 1, tempTabIds: [42], tempTabTitles: {} },
    };
    store.onTabRemoved(9999, {});
    expect(store.state.spaceInstancesByWindow[100]?.[space.id]?.tempTabIds).toEqual([42]);
  });
});

describe('LunmaStore.onTabUpdated', () => {
  test('updates currentURL on in-site navigation', () => {
    const store = makeStore();
    store.state.savedTabs['st-1'] = savedTab({ currentURL: 'https://github.com/' });
    store.state.tabBindings['st-1'] = { 100: 42 };
    store.onTabUpdated(42, { url: 'https://github.com/notifications', status: 'complete' });
    expect(store.state.savedTabs['st-1']?.currentURL).toBe('https://github.com/notifications');
  });

  test('updates currentURL on cross-origin navigation and keeps the binding', () => {
    const store = makeStore();
    store.state.savedTabs['st-1'] = savedTab({ currentURL: 'https://github.com/' });
    store.state.tabBindings['st-1'] = { 100: 42 };
    store.onTabUpdated(42, { url: 'https://news.ycombinator.com/', status: 'complete' });
    expect(store.state.savedTabs['st-1']?.currentURL).toBe('https://news.ycombinator.com/');
    expect(store.state.tabBindings['st-1']).toEqual({ 100: 42 });
  });

  test('ignores updates with no url change', () => {
    const store = makeStore();
    store.state.savedTabs['st-1'] = savedTab({ currentURL: 'https://github.com/' });
    store.state.tabBindings['st-1'] = { 100: 42 };
    store.onTabUpdated(42, { status: 'loading' });
    expect(store.state.savedTabs['st-1']?.currentURL).toBe('https://github.com/');
  });

  test('records lastActivity timestamp on URL change for any tab', () => {
    const store = makeStore();
    store.onTabUpdated(77, { url: 'https://x/' });
    expect(store.state.tabLastActivity[77]).toBeTypeOf('number');
  });

  test('does not match unrelated bindings', () => {
    const store = makeStore();
    store.state.savedTabs['st-1'] = savedTab({ currentURL: 'https://github.com/' });
    store.state.tabBindings['st-1'] = { 100: 1 };
    store.onTabUpdated(2, { url: 'https://y/' });
    expect(store.state.savedTabs['st-1']?.currentURL).toBe('https://github.com/');
  });
});

describe('LunmaStore.restoreTempTab', () => {
  test('returns a tab id to the window instance tempTabIds', () => {
    const store = makeStore();
    const space = seedSpace(store);
    store.state.spaceInstancesByWindow[100] = {
      [space.id]: { spaceId: space.id, groupId: 1, tempTabIds: [], tempTabTitles: {} },
    };
    store.state.activeSpaceByWindow[100] = space.id;
    store.restoreTempTab(100, 42);
    expect(store.state.spaceInstancesByWindow[100]?.[space.id]?.tempTabIds).toEqual([42]);
  });

  test('is a no-op when the window has no instance', () => {
    const store = makeStore();
    store.restoreTempTab(999, 42);
    expect(store.state.spaceInstancesByWindow[999]).toBeUndefined();
  });

  test('is a no-op when the tab is still bound', () => {
    const store = makeStore();
    const space = seedSpace(store);
    store.state.spaceInstancesByWindow[100] = {
      [space.id]: { spaceId: space.id, groupId: 1, tempTabIds: [], tempTabTitles: {} },
    };
    store.state.activeSpaceByWindow[100] = space.id;
    store.state.savedTabs['st-1'] = savedTab({ currentURL: 'https://github.com/' });
    store.state.tabBindings['st-1'] = { 100: 42 };
    store.restoreTempTab(100, 42);
    expect(store.state.spaceInstancesByWindow[100]?.[space.id]?.tempTabIds).toEqual([]);
  });

  test('is idempotent when the tab is already temporary', () => {
    const store = makeStore();
    const space = seedSpace(store);
    store.state.spaceInstancesByWindow[100] = {
      [space.id]: { spaceId: space.id, groupId: 1, tempTabIds: [42], tempTabTitles: {} },
    };
    store.state.activeSpaceByWindow[100] = space.id;
    store.restoreTempTab(100, 42);
    expect(store.state.spaceInstancesByWindow[100]?.[space.id]?.tempTabIds).toEqual([42]);
  });
});

describe('LunmaStore.promoteTempTab', () => {
  test('moves a temp tab from the middle to the top', () => {
    const store = makeStore();
    const space = seedSpace(store);
    store.state.spaceInstancesByWindow[100] = {
      [space.id]: { spaceId: space.id, groupId: 1, tempTabIds: [1, 42, 2], tempTabTitles: {} },
    };
    store.promoteTempTab(100, space.id, 42);
    expect(store.state.spaceInstancesByWindow[100]?.[space.id]?.tempTabIds).toEqual([42, 1, 2]);
  });

  test('is a no-op when the tab is already at the top', () => {
    const store = makeStore();
    const space = seedSpace(store);
    store.state.spaceInstancesByWindow[100] = {
      [space.id]: { spaceId: space.id, groupId: 1, tempTabIds: [42, 1, 2], tempTabTitles: {} },
    };
    store.promoteTempTab(100, space.id, 42);
    expect(store.state.spaceInstancesByWindow[100]?.[space.id]?.tempTabIds).toEqual([42, 1, 2]);
  });

  test('is a no-op when the tab is not a temp tab in that instance (e.g. pinned)', () => {
    const store = makeStore();
    const space = seedSpace(store);
    store.state.spaceInstancesByWindow[100] = {
      [space.id]: { spaceId: space.id, groupId: 1, tempTabIds: [1, 2], tempTabTitles: {} },
    };
    store.promoteTempTab(100, space.id, 77);
    expect(store.state.spaceInstancesByWindow[100]?.[space.id]?.tempTabIds).toEqual([1, 2]);
  });

  test('is a no-op when the (window, Space) has no instance', () => {
    const store = makeStore();
    const space = seedSpace(store);
    store.promoteTempTab(999, space.id, 42);
    expect(store.state.spaceInstancesByWindow[999]).toBeUndefined();
  });
});

describe('LunmaStore.onTabCreated order (newest-first)', () => {
  test('new tabs are prepended to tempTabIds', () => {
    const store = makeStore();
    const space = seedSpace(store);
    store.state.spaceInstancesByWindow[100] = {
      [space.id]: { spaceId: space.id, groupId: 1, tempTabIds: [], tempTabTitles: {} },
    };
    store.state.activeSpaceByWindow[100] = space.id;
    store.onTabCreated({ id: 1, windowId: 100 });
    store.onTabCreated({ id: 2, windowId: 100 });
    expect(store.state.spaceInstancesByWindow[100]?.[space.id]?.tempTabIds).toEqual([2, 1]);
  });
});

describe('LunmaStore per-window ownership guard (prevent-space-group-collapse)', () => {
  test('onTabCreated claims the tab from a sibling instance in the same window', () => {
    const store = makeStore();
    const work = seedSpace(store, { id: 'work', name: 'Work' });
    const side = seedSpace(store, { id: 'side', name: 'Side' });
    store.state.spaceInstancesByWindow[100] = {
      [work.id]: { spaceId: work.id, groupId: 11, tempTabIds: [], tempTabTitles: {} },
      [side.id]: {
        spaceId: side.id,
        groupId: 22,
        tempTabIds: [42],
        tempTabTitles: { 42: 'Renamed in side' },
      },
    };
    store.state.activeSpaceByWindow[100] = work.id;
    store.onTabCreated({ id: 42, windowId: 100 });
    // Tab 42 moves into the active "work" instance and is evicted from "side"
    // (along with its temp-tab title) — owned by exactly one instance.
    expect(store.state.spaceInstancesByWindow[100]?.work?.tempTabIds).toEqual([42]);
    expect(store.state.spaceInstancesByWindow[100]?.side?.tempTabIds).toEqual([]);
    expect(store.state.spaceInstancesByWindow[100]?.side?.tempTabTitles).toEqual({});
  });

  test('restoreTempTab claims the tab from a sibling instance in the same window', () => {
    const store = makeStore();
    const work = seedSpace(store, { id: 'work', name: 'Work' });
    const side = seedSpace(store, { id: 'side', name: 'Side' });
    store.state.spaceInstancesByWindow[100] = {
      [work.id]: { spaceId: work.id, groupId: 11, tempTabIds: [], tempTabTitles: {} },
      [side.id]: { spaceId: side.id, groupId: 22, tempTabIds: [42], tempTabTitles: {} },
    };
    store.state.activeSpaceByWindow[100] = work.id;
    store.restoreTempTab(100, 42);
    expect(store.state.spaceInstancesByWindow[100]?.work?.tempTabIds).toEqual([42]);
    expect(store.state.spaceInstancesByWindow[100]?.side?.tempTabIds).toEqual([]);
  });

  test('does not cross-evict the same Space active in another window', () => {
    const store = makeStore();
    const work = seedSpace(store, { id: 'work', name: 'Work' });
    // "work" is active in BOTH windows; window 100 holds tab 42.
    store.state.spaceInstancesByWindow[100] = {
      [work.id]: { spaceId: work.id, groupId: 11, tempTabIds: [42], tempTabTitles: {} },
    };
    store.state.spaceInstancesByWindow[200] = {
      [work.id]: { spaceId: work.id, groupId: 33, tempTabIds: [], tempTabTitles: {} },
    };
    store.state.activeSpaceByWindow[100] = work.id;
    store.state.activeSpaceByWindow[200] = work.id;
    // A tab created in window 200's "work" must NOT touch window 100's "work" —
    // eviction is scoped per window.
    store.onTabCreated({ id: 42, windowId: 200 });
    expect(store.state.spaceInstancesByWindow[100]?.work?.tempTabIds).toEqual([42]);
    expect(store.state.spaceInstancesByWindow[200]?.work?.tempTabIds).toEqual([42]);
  });
});

describe('LunmaStore.reorderTemp', () => {
  test('replaces the order with the requested one', () => {
    const store = makeStore();
    const space = seedSpace(store);
    store.state.spaceInstancesByWindow[100] = {
      [space.id]: { spaceId: space.id, groupId: 1, tempTabIds: [1, 2, 3], tempTabTitles: {} },
    };
    store.state.activeSpaceByWindow[100] = space.id;
    store.reorderTemp(100, space.id, [3, 1, 2]);
    expect(store.state.spaceInstancesByWindow[100]?.[space.id]?.tempTabIds).toEqual([3, 1, 2]);
  });

  test('keeps only currently-present ids and leaves any omitted one in its current slot', () => {
    const store = makeStore();
    const space = seedSpace(store);
    store.state.spaceInstancesByWindow[100] = {
      [space.id]: { spaceId: space.id, groupId: 1, tempTabIds: [1, 2, 3], tempTabTitles: {} },
    };
    store.state.activeSpaceByWindow[100] = space.id;
    // 9 is not present (ignored); 3 omitted — its slot (last) is left untouched.
    store.reorderTemp(100, space.id, [2, 9, 1]);
    expect(store.state.spaceInstancesByWindow[100]?.[space.id]?.tempTabIds).toEqual([2, 1, 3]);
  });

  test('a tab unshifted to the top after the client snapshot stays on top (race safety)', () => {
    // Reproduces: client snapshots [1, 2] and drags to reorder to [2, 1], but
    // before the command drains, a brand-new tab 3 is created and unshifted to
    // the front by `onTabCreated` — tempTabIds is now [3, 1, 2]. The omitted id
    // 3 must keep its slot (index 0), not be appended to the bottom.
    const store = makeStore();
    const space = seedSpace(store);
    store.state.spaceInstancesByWindow[100] = {
      [space.id]: { spaceId: space.id, groupId: 1, tempTabIds: [3, 1, 2], tempTabTitles: {} },
    };
    store.state.activeSpaceByWindow[100] = space.id;
    store.reorderTemp(100, space.id, [2, 1]);
    expect(store.state.spaceInstancesByWindow[100]?.[space.id]?.tempTabIds).toEqual([3, 2, 1]);
  });

  test('scoped by spaceId, not the window active Space — a background panel reorders its own instance', () => {
    const store = makeStore();
    const active = seedSpace(store, { id: 'active', name: 'Active' });
    const background = seedSpace(store, { id: 'background', name: 'Background' });
    store.state.spaceInstancesByWindow[100] = {
      [active.id]: { spaceId: active.id, groupId: 1, tempTabIds: [10, 20], tempTabTitles: {} },
      [background.id]: {
        spaceId: background.id,
        groupId: 2,
        tempTabIds: [30, 40],
        tempTabTitles: {},
      },
    };
    store.state.activeSpaceByWindow[100] = active.id;
    // Reorder dispatched from the (non-active) background panel.
    store.reorderTemp(100, background.id, [40, 30]);
    expect(store.state.spaceInstancesByWindow[100]?.[background.id]?.tempTabIds).toEqual([40, 30]);
    // The active Space's own order is untouched.
    expect(store.state.spaceInstancesByWindow[100]?.[active.id]?.tempTabIds).toEqual([10, 20]);
  });

  test('is a no-op when the window has no instance', () => {
    const store = makeStore();
    const space = seedSpace(store);
    store.reorderTemp(999, space.id, [1, 2]);
    expect(store.state.spaceInstancesByWindow[999]).toBeUndefined();
  });
});
