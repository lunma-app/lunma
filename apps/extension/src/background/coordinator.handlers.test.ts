import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { LunmaStore } from '../shared/store.svelte';
import type { PinNode, SavedTab } from '../shared/types';
import {
  makeCoordinator,
  sidebar,
  tabActivated,
  tabCreated,
  tabUpdated,
  windowCreated,
} from './coordinator.test-helpers';

function savedTab(id: string, originalURL: string, currentURL: string | null): SavedTab {
  return { id, spaceId: 'work', title: id, originalURL, currentURL };
}

/** Tab-node list for a pinned tree (the V5 PinNode shape). */
const tabs = (...ids: string[]): PinNode[] => ids.map((id) => ({ kind: 'tab', id }));

/** Seed `savedTabs` records so `setPinned`'s validation keeps these ids. */
function seedSaved(store: LunmaStore, ...ids: string[]): void {
  for (const id of ids) store.state.savedTabs[id] = savedTab(id, 'https://x/', null);
}

describe('Coordinator handlers for tabs', () => {
  test('tabs.onCreated forwards to store.onTabCreated', async () => {
    const { coordinator, store } = makeCoordinator();
    store.state.spaces.push({ id: 'work', name: 'Work', color: 'blue', icon: 'star' });
    store.state.activeSpaceByWindow[100] = 'work';
    store.state.spaceInstancesByWindow[100] = {
      work: {
        spaceId: 'work',
        groupId: 1,
        tempTabIds: [],
        tempTabTitles: {},
      },
    };
    coordinator.enqueue(tabCreated(42, 100));
    await coordinator.idle();
    expect(store.state.spaceInstancesByWindow[100]?.work?.tempTabIds).toEqual([42]);
  });

  test('tabs.onRemoved forwards to store.onTabRemoved', async () => {
    const { coordinator, store } = makeCoordinator();
    store.state.savedTabs['st-1'] = savedTab('st-1', 'https://x/', 'https://x/');
    store.state.tabBindings['st-1'] = { 100: 42 };
    coordinator.enqueue({
      source: 'chrome',
      kind: 'tabs.onRemoved',
      payload: {
        tabId: 42,
        info: { windowId: 100, isWindowClosing: false } as chrome.tabs.OnRemovedInfo,
      },
    });
    await coordinator.idle();
    expect(store.state.tabBindings['st-1']).toEqual({});
  });

  test('tabs.onUpdated with only status (no url) still forwards to store', async () => {
    const { coordinator, store } = makeCoordinator();
    const spy = vi.spyOn(store, 'onTabUpdated');
    coordinator.enqueue(tabUpdated(42, { status: 'complete' }));
    await coordinator.idle();
    expect(spy).toHaveBeenCalledWith(42, { status: 'complete' });
  });

  test('tabs.onUpdated with neither url nor status is a no-op', async () => {
    const { coordinator, persist } = makeCoordinator();
    coordinator.enqueue(tabUpdated(42, {}));
    await coordinator.idle();
    expect(persist).not.toHaveBeenCalled();
  });
});

describe('Coordinator maintains liveTabsById', () => {
  test('tabs.onCreated mirrors the tab into liveTabsById', async () => {
    const { coordinator, store } = makeCoordinator();
    store.state.spaces.push({ id: 'work', name: 'Work', color: 'blue', icon: 'star' });
    store.state.spaceInstancesByWindow[100] = {
      work: { spaceId: 'work', groupId: 1, tempTabIds: [], tempTabTitles: {} },
    };
    coordinator.enqueue({
      source: 'chrome',
      kind: 'tabs.onCreated',
      payload: {
        tab: {
          id: 42,
          windowId: 100,
          title: 'New',
          url: 'https://new/',
          active: false,
          status: 'loading',
        } as chrome.tabs.Tab,
      },
    });
    await coordinator.idle();
    expect(store.state.liveTabsById[42]).toMatchObject({
      tabId: 42,
      windowId: 100,
      title: 'New',
      status: 'loading',
    });
  });

  test('tabs.onUpdated syncs visible metadata into the existing entry', async () => {
    const { coordinator, store } = makeCoordinator();
    store.state.liveTabsById[42] = {
      tabId: 42,
      windowId: 100,
      title: 'Old',
      url: 'https://old/',
      active: true,
      status: 'loading',
    };
    coordinator.enqueue(tabUpdated(42, { title: 'Fresh', status: 'complete' }));
    await coordinator.idle();
    expect(store.state.liveTabsById[42]).toMatchObject({
      title: 'Fresh',
      status: 'complete',
      active: true, // preserved from existing entry
    });
  });

  test('tabs.onRemoved prunes the liveTabsById entry', async () => {
    const { coordinator, store } = makeCoordinator();
    store.state.liveTabsById[42] = {
      tabId: 42,
      windowId: 100,
      title: 'x',
      url: 'https://x/',
      active: false,
      status: 'complete',
    };
    coordinator.enqueue({
      source: 'chrome',
      kind: 'tabs.onRemoved',
      payload: {
        tabId: 42,
        info: { windowId: 100, isWindowClosing: false } as chrome.tabs.OnRemovedInfo,
      },
    });
    await coordinator.idle();
    expect(store.state.liveTabsById[42]).toBeUndefined();
  });

  test('tabs.onActivated sets the active flag and persists', async () => {
    const { coordinator, store, persist } = makeCoordinator();
    store.state.liveTabsById[17] = {
      tabId: 17,
      windowId: 100,
      title: 'a',
      url: 'https://a/',
      active: true,
      status: 'complete',
    };
    store.state.liveTabsById[22] = {
      tabId: 22,
      windowId: 100,
      title: 'b',
      url: 'https://b/',
      active: false,
      status: 'complete',
    };
    coordinator.enqueue(tabActivated(22, 100));
    await coordinator.idle();
    expect(store.state.liveTabsById[22]?.active).toBe(true);
    expect(store.state.liveTabsById[17]?.active).toBe(false);
    expect(persist).toHaveBeenCalledTimes(1);
  });
});

describe('Coordinator handlers for windows', () => {
  test('windows.onCreated forwards to store.onWindowOpened', async () => {
    const { coordinator, store } = makeCoordinator();
    store.state.spaces.push({ id: 'work', name: 'Work', color: 'blue', icon: 'star' });
    store.state.lastActivatedSpaceId = 'work';
    coordinator.enqueue(windowCreated(200));
    await coordinator.idle();
    expect(store.state.activeSpaceByWindow[200]).toBe('work');
  });

  test('windows.onCreated with undefined id is a no-op', async () => {
    const { coordinator, persist } = makeCoordinator();
    coordinator.enqueue({
      source: 'chrome',
      kind: 'windows.onCreated',
      payload: { window: {} as chrome.windows.Window },
    });
    await coordinator.idle();
    expect(persist).not.toHaveBeenCalled();
  });

  test('windows.onRemoved forwards to store.onWindowClosed', async () => {
    const { coordinator, store } = makeCoordinator();
    store.state.spaceInstancesByWindow[100] = {
      sp: {
        spaceId: 'sp',
        groupId: 1,
        tempTabIds: [],
        tempTabTitles: {},
      },
    };
    coordinator.enqueue({
      source: 'chrome',
      kind: 'windows.onRemoved',
      payload: { windowId: 100 },
    });
    await coordinator.idle();
    expect(store.state.spaceInstancesByWindow[100]).toBeUndefined();
  });
});

// =====================================================================
// Saved-tab sidebar command handlers (lunma-bookmark-bindings,
// typed-message-bus). Lunma-owned records (ADR 0005): no chrome.bookmarks.
// =====================================================================

interface SavedTabChromeStub {
  tabs: {
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
  };
  windows: { update: ReturnType<typeof vi.fn> };
  runtime: {
    sendMessage: ReturnType<typeof vi.fn>;
    onMessage: { addListener: () => void; removeListener: () => void };
  };
}

function installSavedTabChromeStub(): SavedTabChromeStub {
  const stub: SavedTabChromeStub = {
    tabs: {
      create: vi.fn(() => Promise.resolve({ id: 999, windowId: 100 } as chrome.tabs.Tab)),
      update: vi.fn(() => Promise.resolve({ id: 999, windowId: 100 } as chrome.tabs.Tab)),
      remove: vi.fn(() => Promise.resolve()),
    },
    windows: { update: vi.fn(() => Promise.resolve({ id: 100 } as chrome.windows.Window)) },
    runtime: {
      sendMessage: vi.fn(() => Promise.resolve()),
      onMessage: { addListener: () => undefined, removeListener: () => undefined },
    },
  };
  (globalThis as unknown as { chrome: SavedTabChromeStub }).chrome = stub;
  return stub;
}

describe('Coordinator handlers: openSavedTab', () => {
  beforeEach(() => vi.restoreAllMocks());

  test('happy path: creates a tab, binds, acks ok', async () => {
    const chromeStub = installSavedTabChromeStub();
    const { coordinator, store, emitAck } = makeCoordinator();
    store.state.savedTabs['st-1'] = savedTab('st-1', 'https://x/', null);
    coordinator.enqueue(
      sidebar({ kind: 'openSavedTab', payload: { savedTabId: 'st-1', windowId: 100 } }, 'sess:1'),
    );
    await coordinator.idle();
    expect(chromeStub.tabs.create).toHaveBeenCalledWith({ url: 'https://x/', windowId: 100 });
    expect(store.state.tabBindings['st-1']).toEqual({ 100: 999 });
    expect(emitAck).toHaveBeenCalledWith({ type: 'lunma/command-ack', id: 'sess:1', result: 'ok' });
  });

  test('unknown savedTabId throws → error ack', async () => {
    installSavedTabChromeStub();
    const { coordinator, emitAck } = makeCoordinator();
    coordinator.enqueue(
      sidebar({ kind: 'openSavedTab', payload: { savedTabId: 'nope', windowId: 100 } }, 'sess:1'),
    );
    await coordinator.idle();
    expect(emitAck.mock.calls[0]?.[0]).toMatchObject({
      id: 'sess:1',
      result: { error: expect.stringContaining("unknown savedTabId 'nope'") },
    });
  });

  test('chrome.tabs.create rejection → error ack', async () => {
    const chromeStub = installSavedTabChromeStub();
    chromeStub.tabs.create.mockRejectedValueOnce(new Error('window gone'));
    const { coordinator, store, emitAck } = makeCoordinator();
    store.state.savedTabs['st-1'] = savedTab('st-1', 'https://x/', null);
    coordinator.enqueue(
      sidebar({ kind: 'openSavedTab', payload: { savedTabId: 'st-1', windowId: 100 } }, 'sess:1'),
    );
    await coordinator.idle();
    expect(emitAck.mock.calls[0]?.[0]).toMatchObject({
      id: 'sess:1',
      result: { error: 'window gone' },
    });
  });

  test('created tab without id → error ack', async () => {
    const chromeStub = installSavedTabChromeStub();
    chromeStub.tabs.create.mockResolvedValueOnce({ windowId: 100 } as chrome.tabs.Tab);
    const { coordinator, store, emitAck } = makeCoordinator();
    store.state.savedTabs['st-1'] = savedTab('st-1', 'https://x/', null);
    coordinator.enqueue(
      sidebar({ kind: 'openSavedTab', payload: { savedTabId: 'st-1', windowId: 100 } }, 'sess:1'),
    );
    await coordinator.idle();
    expect(emitAck.mock.calls[0]?.[0]).toMatchObject({
      id: 'sess:1',
      result: { error: expect.stringContaining('no id') },
    });
  });
});

describe('Coordinator handlers: focusSavedTab', () => {
  test('happy path: updates tab + window, acks ok', async () => {
    const chromeStub = installSavedTabChromeStub();
    const { coordinator, store, emitAck } = makeCoordinator();
    store.state.tabBindings['st-1'] = { 100: 42 };
    coordinator.enqueue(
      sidebar({ kind: 'focusSavedTab', payload: { savedTabId: 'st-1', windowId: 100 } }, 'sess:1'),
    );
    await coordinator.idle();
    expect(chromeStub.tabs.update).toHaveBeenCalledWith(42, { active: true });
    expect(chromeStub.windows.update).toHaveBeenCalledWith(100, { focused: true });
    expect(emitAck.mock.calls[0]?.[0]).toEqual({
      type: 'lunma/command-ack',
      id: 'sess:1',
      result: 'ok',
    });
  });

  test('dormant binding throws → error ack', async () => {
    installSavedTabChromeStub();
    const { coordinator, store, emitAck } = makeCoordinator();
    store.state.tabBindings['st-1'] = {};
    coordinator.enqueue(
      sidebar({ kind: 'focusSavedTab', payload: { savedTabId: 'st-1', windowId: 100 } }, 'sess:1'),
    );
    await coordinator.idle();
    expect(emitAck.mock.calls[0]?.[0]).toMatchObject({
      id: 'sess:1',
      result: { error: expect.stringContaining('dormant') },
    });
  });
});

describe('Coordinator handlers: goHome', () => {
  test('happy path: navigates tab, no store mutation, acks ok', async () => {
    const chromeStub = installSavedTabChromeStub();
    const { coordinator, store, emitAck, persist } = makeCoordinator();
    store.state.savedTabs['st-1'] = savedTab('st-1', 'https://x/', 'https://x/y');
    store.state.tabBindings['st-1'] = { 100: 42 };
    coordinator.enqueue(
      sidebar({ kind: 'goHome', payload: { savedTabId: 'st-1', windowId: 100 } }, 'sess:1'),
    );
    await coordinator.idle();
    expect(chromeStub.tabs.update).toHaveBeenCalledWith(42, { url: 'https://x/' });
    expect(persist).not.toHaveBeenCalled();
    expect(emitAck.mock.calls[0]?.[0]).toEqual({
      type: 'lunma/command-ack',
      id: 'sess:1',
      result: 'ok',
    });
  });

  test('dormant binding throws → error ack', async () => {
    installSavedTabChromeStub();
    const { coordinator, store, emitAck } = makeCoordinator();
    store.state.savedTabs['st-1'] = savedTab('st-1', 'https://x/', null);
    store.state.tabBindings['st-1'] = {};
    coordinator.enqueue(
      sidebar({ kind: 'goHome', payload: { savedTabId: 'st-1', windowId: 100 } }, 'sess:1'),
    );
    await coordinator.idle();
    expect(emitAck.mock.calls[0]?.[0]).toMatchObject({
      id: 'sess:1',
      result: { error: expect.stringContaining('dormant') },
    });
  });

  test('unknown savedTabId throws → error ack', async () => {
    installSavedTabChromeStub();
    const { coordinator, emitAck } = makeCoordinator();
    coordinator.enqueue(
      sidebar({ kind: 'goHome', payload: { savedTabId: 'nope', windowId: 100 } }, 'sess:1'),
    );
    await coordinator.idle();
    expect(emitAck.mock.calls[0]?.[0]).toMatchObject({
      id: 'sess:1',
      result: { error: expect.stringContaining("unknown savedTabId 'nope'") },
    });
  });
});

describe('Coordinator handlers: makeThisHome', () => {
  test('happy path: mutates store originalURL only (no chrome.bookmarks), persists, acks ok', async () => {
    const { coordinator, store, persist, emitAck } = makeCoordinator();
    store.state.savedTabs['st-1'] = savedTab('st-1', 'https://x/', 'https://x/new');
    coordinator.enqueue(
      sidebar({ kind: 'makeThisHome', payload: { savedTabId: 'st-1' } }, 'sess:1'),
    );
    await coordinator.idle();
    expect(store.state.savedTabs['st-1']?.originalURL).toBe('https://x/new');
    expect(persist).toHaveBeenCalledTimes(1);
    expect(emitAck.mock.calls[0]?.[0]).toEqual({
      type: 'lunma/command-ack',
      id: 'sess:1',
      result: 'ok',
    });
  });

  test('null currentURL throws → error ack', async () => {
    const { coordinator, store, emitAck } = makeCoordinator();
    store.state.savedTabs['st-1'] = savedTab('st-1', 'https://x/', null);
    coordinator.enqueue(
      sidebar({ kind: 'makeThisHome', payload: { savedTabId: 'st-1' } }, 'sess:1'),
    );
    await coordinator.idle();
    expect(emitAck.mock.calls[0]?.[0]).toMatchObject({
      id: 'sess:1',
      result: { error: expect.stringContaining('currentURL is null') },
    });
  });

  test('unknown savedTabId throws → error ack', async () => {
    const { coordinator, emitAck } = makeCoordinator();
    coordinator.enqueue(
      sidebar({ kind: 'makeThisHome', payload: { savedTabId: 'nope' } }, 'sess:1'),
    );
    await coordinator.idle();
    expect(emitAck.mock.calls[0]?.[0]).toMatchObject({
      id: 'sess:1',
      result: { error: expect.stringContaining("unknown savedTabId 'nope'") },
    });
  });
});

describe('Coordinator handlers: deleteSavedTab', () => {
  test('happy path bound: closes tab, removes the record, acks ok', async () => {
    const chromeStub = installSavedTabChromeStub();
    const { coordinator, store, emitAck } = makeCoordinator();
    store.state.savedTabs['st-1'] = savedTab('st-1', 'https://x/', 'https://x/');
    store.state.tabBindings['st-1'] = { 100: 42 };
    store.setPinned('work', tabs('st-1'));
    coordinator.enqueue(
      sidebar({ kind: 'deleteSavedTab', payload: { savedTabId: 'st-1' } }, 'sess:1'),
    );
    await coordinator.idle();
    expect(chromeStub.tabs.remove).toHaveBeenCalledWith(42);
    expect(store.state.savedTabs['st-1']).toBeUndefined();
    expect(store.state.pinnedBySpace.work).toEqual([]);
    expect(emitAck.mock.calls[0]?.[0]).toEqual({
      type: 'lunma/command-ack',
      id: 'sess:1',
      result: 'ok',
    });
  });

  test('bound in two windows: closes both bound tabs, removes the record', async () => {
    const chromeStub = installSavedTabChromeStub();
    const { coordinator, store, emitAck } = makeCoordinator();
    store.state.savedTabs['st-1'] = savedTab('st-1', 'https://x/', 'https://x/');
    store.state.tabBindings['st-1'] = { 100: 42, 200: 77 };
    store.setPinned('work', tabs('st-1'));
    coordinator.enqueue(
      sidebar({ kind: 'deleteSavedTab', payload: { savedTabId: 'st-1' } }, 'sess:1'),
    );
    await coordinator.idle();
    expect(chromeStub.tabs.remove).toHaveBeenCalledWith(42);
    expect(chromeStub.tabs.remove).toHaveBeenCalledWith(77);
    expect(store.state.savedTabs['st-1']).toBeUndefined();
    expect(emitAck.mock.calls[0]?.[0]).toMatchObject({ id: 'sess:1', result: 'ok' });
  });

  test('dormant saved tab: skips tabs.remove, removes record, acks ok', async () => {
    const chromeStub = installSavedTabChromeStub();
    const { coordinator, store, emitAck } = makeCoordinator();
    store.state.savedTabs['st-1'] = savedTab('st-1', 'https://x/', null);
    store.state.tabBindings['st-1'] = {};
    coordinator.enqueue(
      sidebar({ kind: 'deleteSavedTab', payload: { savedTabId: 'st-1' } }, 'sess:1'),
    );
    await coordinator.idle();
    expect(chromeStub.tabs.remove).not.toHaveBeenCalled();
    expect(store.state.savedTabs['st-1']).toBeUndefined();
    expect(emitAck.mock.calls[0]?.[0]).toEqual({
      type: 'lunma/command-ack',
      id: 'sess:1',
      result: 'ok',
    });
  });

  test('tab-close failure is tolerated (best-effort), record removal succeeds → ok', async () => {
    const chromeStub = installSavedTabChromeStub();
    chromeStub.tabs.remove.mockRejectedValueOnce(new Error('tab gone'));
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { coordinator, store, emitAck } = makeCoordinator();
    store.state.savedTabs['st-1'] = savedTab('st-1', 'https://x/', 'https://x/');
    store.state.tabBindings['st-1'] = { 100: 42 };
    coordinator.enqueue(
      sidebar({ kind: 'deleteSavedTab', payload: { savedTabId: 'st-1' } }, 'sess:1'),
    );
    await coordinator.idle();
    expect(store.state.savedTabs['st-1']).toBeUndefined();
    expect(emitAck.mock.calls[0]?.[0]).toEqual({
      type: 'lunma/command-ack',
      id: 'sess:1',
      result: 'ok',
    });
    errSpy.mockRestore();
  });

  test('unknown savedTabId throws → error ack', async () => {
    installSavedTabChromeStub();
    const { coordinator, emitAck } = makeCoordinator();
    coordinator.enqueue(
      sidebar({ kind: 'deleteSavedTab', payload: { savedTabId: 'nope' } }, 'sess:1'),
    );
    await coordinator.idle();
    expect(emitAck.mock.calls[0]?.[0]).toMatchObject({
      id: 'sess:1',
      result: { error: expect.stringContaining("unknown savedTabId 'nope'") },
    });
  });
});

describe('Coordinator handlers: createSpace', () => {
  test('happy path: mints a Lunma-owned Space, activates in window, no chrome.bookmarks', async () => {
    const { coordinator, store, persist, broadcast, emitAck } = makeCoordinator();
    coordinator.enqueue(
      sidebar(
        {
          kind: 'createSpace',
          payload: { name: 'Work', color: 'blue', icon: 'star', windowId: 42 },
        },
        'sess:1',
      ),
    );
    await coordinator.idle();

    expect(store.state.spaces).toHaveLength(1);
    const created = store.state.spaces[0];
    expect(created?.name).toBe('Work');
    expect(created?.color).toBe('blue');
    expect(created && 'bookmarkFolderId' in created).toBe(false);
    expect(store.state.activeSpaceByWindow[42]).toBe(created?.id);
    expect(persist).toHaveBeenCalledTimes(1);
    expect(broadcast).toHaveBeenCalledTimes(1);
    const broadcastedState = broadcast.mock.calls[0]?.[0]?.state;
    expect(broadcastedState?.spaces?.[0]?.color).toBe('blue');
    expect(broadcastedState?.activeSpaceByWindow?.[42]).toBe(created?.id);
    expect(emitAck.mock.calls[0]?.[0]).toEqual({
      type: 'lunma/command-ack',
      id: 'sess:1',
      result: 'ok',
    });
  });

  test('respects supplied windowId, not the focused window', async () => {
    const { coordinator, store } = makeCoordinator();
    coordinator.enqueue(
      sidebar(
        { kind: 'createSpace', payload: { name: 'W', color: 'green', icon: 'star', windowId: 10 } },
        'sess:1',
      ),
    );
    await coordinator.idle();
    const newId = store.state.spaces[0]?.id;
    expect(store.state.activeSpaceByWindow[10]).toBe(newId);
    expect(store.state.activeSpaceByWindow[20]).toBeUndefined();
  });
});

describe('Coordinator handlers for recolourSpace', () => {
  test('happy path: mutates state, persists, broadcasts once, acks ok', async () => {
    const { coordinator, store, persist, broadcast, emitAck } = makeCoordinator();
    store.state.spaces.push({ id: 'work', name: 'Work', color: 'blue', icon: 'star' });
    coordinator.enqueue(
      sidebar({ kind: 'recolourSpace', payload: { spaceId: 'work', color: 'red' } }, 'sess:1'),
    );
    await coordinator.idle();
    expect(store.state.spaces[0]?.color).toBe('red');
    expect(persist).toHaveBeenCalledTimes(1);
    expect(broadcast).toHaveBeenCalledTimes(1);
    expect(emitAck).toHaveBeenCalledOnce();
    expect(emitAck.mock.calls[0]?.[0]).toMatchObject({ id: 'sess:1', result: 'ok' });
  });

  test('unknown spaceId throws and acks with error', async () => {
    const { coordinator, persist, broadcast, emitAck } = makeCoordinator();
    coordinator.enqueue(
      sidebar({ kind: 'recolourSpace', payload: { spaceId: 'ghost', color: 'red' } }, 'sess:1'),
    );
    await coordinator.idle();
    expect(persist).not.toHaveBeenCalled();
    expect(broadcast).not.toHaveBeenCalled();
    expect(emitAck.mock.calls[0]?.[0]).toMatchObject({
      id: 'sess:1',
      result: { error: expect.stringContaining("unknown spaceId 'ghost'") },
    });
  });

  test('two rapid recolour clicks: both apply, final wins, one persist + broadcast', async () => {
    const { coordinator, store, persist, broadcast, emitAck } = makeCoordinator();
    store.state.spaces.push({ id: 'work', name: 'Work', color: 'blue', icon: 'star' });
    coordinator.enqueue(
      sidebar({ kind: 'recolourSpace', payload: { spaceId: 'work', color: 'red' } }, 'sess:1'),
    );
    coordinator.enqueue(
      sidebar({ kind: 'recolourSpace', payload: { spaceId: 'work', color: 'green' } }, 'sess:2'),
    );
    await coordinator.idle();
    expect(store.state.spaces[0]?.color).toBe('green');
    expect(persist).toHaveBeenCalledTimes(1);
    expect(broadcast).toHaveBeenCalledTimes(1);
    expect(emitAck).toHaveBeenCalledTimes(2);
  });
});

describe('Coordinator handlers: focusTab', () => {
  test('happy path: activates tab + focuses window, no state mutation, acks ok', async () => {
    const chromeStub = installSavedTabChromeStub();
    const { coordinator, persist, emitAck } = makeCoordinator();
    coordinator.enqueue(sidebar({ kind: 'focusTab', payload: { tabId: 22 } }, 'sess:1'));
    await coordinator.idle();
    expect(chromeStub.tabs.update).toHaveBeenCalledWith(22, { active: true });
    expect(chromeStub.windows.update).toHaveBeenCalledWith(100, { focused: true });
    // No direct store mutation → nothing dirty → no persist.
    expect(persist).not.toHaveBeenCalled();
    expect(emitAck.mock.calls[0]?.[0]).toEqual({
      type: 'lunma/command-ack',
      id: 'sess:1',
      result: 'ok',
    });
  });

  test('chrome.tabs.update rejection → error ack', async () => {
    const chromeStub = installSavedTabChromeStub();
    chromeStub.tabs.update.mockRejectedValueOnce(new Error('no such tab'));
    const { coordinator, emitAck } = makeCoordinator();
    coordinator.enqueue(sidebar({ kind: 'focusTab', payload: { tabId: 22 } }, 'sess:1'));
    await coordinator.idle();
    expect(emitAck.mock.calls[0]?.[0]).toMatchObject({
      id: 'sess:1',
      result: { error: 'no such tab' },
    });
  });
});

describe('Coordinator handlers: closeTab', () => {
  test('happy path: removes the Chrome tab, no direct state mutation, acks ok', async () => {
    const chromeStub = installSavedTabChromeStub();
    const { coordinator, store, persist, emitAck } = makeCoordinator();
    store.state.liveTabsById[22] = {
      tabId: 22,
      windowId: 100,
      title: 'x',
      url: 'https://x/',
      active: false,
      status: 'complete',
    };
    coordinator.enqueue(sidebar({ kind: 'closeTab', payload: { tabId: 22 } }, 'sess:1'));
    await coordinator.idle();
    expect(chromeStub.tabs.remove).toHaveBeenCalledWith(22);
    // The handler does NOT delete liveTabsById[22] — onRemoved does.
    expect(store.state.liveTabsById[22]).toBeDefined();
    expect(persist).not.toHaveBeenCalled();
    expect(emitAck.mock.calls[0]?.[0]).toEqual({
      type: 'lunma/command-ack',
      id: 'sess:1',
      result: 'ok',
    });
  });

  test('chrome.tabs.remove rejection → error ack', async () => {
    const chromeStub = installSavedTabChromeStub();
    chromeStub.tabs.remove.mockRejectedValueOnce(new Error('tab gone'));
    const { coordinator, emitAck } = makeCoordinator();
    coordinator.enqueue(sidebar({ kind: 'closeTab', payload: { tabId: 22 } }, 'sess:1'));
    await coordinator.idle();
    expect(emitAck.mock.calls[0]?.[0]).toMatchObject({
      id: 'sess:1',
      result: { error: 'tab gone' },
    });
  });
});

describe('Coordinator handlers for changeSpaceIcon', () => {
  test('happy path: mutates state, persists, broadcasts once, acks ok', async () => {
    const { coordinator, store, persist, broadcast, emitAck } = makeCoordinator();
    store.state.spaces.push({ id: 'work', name: 'Work', color: 'blue', icon: 'star' });
    coordinator.enqueue(
      sidebar(
        { kind: 'changeSpaceIcon', payload: { spaceId: 'work', icon: 'briefcase' } },
        'sess:1',
      ),
    );
    await coordinator.idle();
    expect(store.state.spaces[0]?.icon).toBe('briefcase');
    expect(persist).toHaveBeenCalledTimes(1);
    expect(broadcast).toHaveBeenCalledTimes(1);
    expect(emitAck).toHaveBeenCalledOnce();
    expect(emitAck.mock.calls[0]?.[0]).toMatchObject({ id: 'sess:1', result: 'ok' });
  });

  test('unknown spaceId throws and acks with error', async () => {
    const { coordinator, persist, broadcast, emitAck } = makeCoordinator();
    coordinator.enqueue(
      sidebar(
        { kind: 'changeSpaceIcon', payload: { spaceId: 'ghost', icon: 'briefcase' } },
        'sess:1',
      ),
    );
    await coordinator.idle();
    expect(persist).not.toHaveBeenCalled();
    expect(broadcast).not.toHaveBeenCalled();
    expect(emitAck.mock.calls[0]?.[0]).toMatchObject({
      id: 'sess:1',
      result: { error: expect.stringContaining("unknown spaceId 'ghost'") },
    });
  });
});

describe('Coordinator handlers: pinTab', () => {
  function seedLiveTab(
    store: ReturnType<typeof makeCoordinator>['store'],
    tabId: number,
    windowId: number,
    url: string,
    title: string,
  ): void {
    store.state.liveTabsById[tabId] = {
      tabId,
      windowId,
      title,
      url,
      active: true,
      status: 'complete',
    };
  }

  test('mints a bound SavedTab, places it in pinnedBySpace, one persist+broadcast', async () => {
    const { coordinator, store, persist, broadcast, emitAck } = makeCoordinator();
    store.state.spaces.push({ id: 'work', name: 'Work', color: 'blue', icon: 'star' });
    store.state.spaceInstancesByWindow[100] = {
      work: { spaceId: 'work', groupId: 1, tempTabIds: [42], tempTabTitles: {} },
    };
    seedLiveTab(store, 42, 100, 'https://github.com/', 'GitHub');

    coordinator.enqueue(
      sidebar(
        { kind: 'pinTab', payload: { tabId: 42, windowId: 100, spaceId: 'work', targetIndex: 0 } },
        'sess:1',
      ),
    );
    await coordinator.idle();

    const ids = Object.keys(store.state.savedTabs);
    expect(ids).toHaveLength(1);
    const newId = ids[0] as string;
    expect(store.state.savedTabs[newId]).toMatchObject({
      spaceId: 'work',
      title: 'GitHub',
      originalURL: 'https://github.com/',
      currentURL: 'https://github.com/',
    });
    expect(store.state.tabBindings[newId]).toEqual({ 100: 42 });
    expect(store.state.pinnedBySpace.work).toEqual([{ kind: 'tab', id: newId }]);
    // Binding removed the id from tempTabIds (bound-tab-is-not-temp invariant).
    expect(store.state.spaceInstancesByWindow[100]?.work?.tempTabIds).toEqual([]);
    expect(persist).toHaveBeenCalledTimes(1);
    expect(broadcast).toHaveBeenCalledTimes(1);
    expect(emitAck.mock.calls[0]?.[0]).toMatchObject({ id: 'sess:1', result: 'ok' });
  });

  test('respects targetIndex when inserting into a non-empty list', async () => {
    const { coordinator, store } = makeCoordinator();
    store.state.spaces.push({ id: 'work', name: 'Work', color: 'blue', icon: 'star' });
    seedSaved(store, 'a', 'b');
    store.setPinned('work', tabs('a', 'b'));
    seedLiveTab(store, 42, 100, 'https://github.com/', 'GitHub');

    coordinator.enqueue(
      sidebar(
        { kind: 'pinTab', payload: { tabId: 42, windowId: 100, spaceId: 'work', targetIndex: 1 } },
        'sess:1',
      ),
    );
    await coordinator.idle();

    const list = store.state.pinnedBySpace.work ?? [];
    expect(list).toHaveLength(3);
    expect(list[0]).toEqual({ kind: 'tab', id: 'a' });
    expect(list[2]).toEqual({ kind: 'tab', id: 'b' });
    // The minted id landed at index 1 as a tab node.
    const mid = list[1];
    expect(mid?.kind).toBe('tab');
    expect(store.state.tabBindings[(mid as { id: string }).id]).toEqual({ 100: 42 });
  });

  test('no-op when the tab is already bound (idempotent), no persist', async () => {
    const { coordinator, store, persist, broadcast } = makeCoordinator();
    store.state.spaces.push({ id: 'work', name: 'Work', color: 'blue', icon: 'star' });
    store.state.savedTabs['st-1'] = savedTab('st-1', 'https://x/', 'https://x/');
    store.state.tabBindings['st-1'] = { 100: 42 };
    seedLiveTab(store, 42, 100, 'https://x/', 'X');

    coordinator.enqueue(
      sidebar(
        { kind: 'pinTab', payload: { tabId: 42, windowId: 100, spaceId: 'work', targetIndex: 0 } },
        'sess:1',
      ),
    );
    await coordinator.idle();

    expect(Object.keys(store.state.savedTabs)).toEqual(['st-1']);
    expect(persist).not.toHaveBeenCalled();
    expect(broadcast).not.toHaveBeenCalled();
  });

  test('no-op when there is no live tab record, no persist', async () => {
    const { coordinator, store, persist } = makeCoordinator();
    store.state.spaces.push({ id: 'work', name: 'Work', color: 'blue', icon: 'star' });

    coordinator.enqueue(
      sidebar(
        { kind: 'pinTab', payload: { tabId: 99, windowId: 100, spaceId: 'work', targetIndex: 0 } },
        'sess:1',
      ),
    );
    await coordinator.idle();

    expect(Object.keys(store.state.savedTabs)).toHaveLength(0);
    expect(persist).not.toHaveBeenCalled();
  });

  // --- placement targets (pin-temp-tab-into-folder) ------------------------
  // Count how many times `savedTabId` is placed in the Space's tree (top level
  // + every folder's children). The no-orphan invariant is "exactly 1".
  function placementsOf(
    store: ReturnType<typeof makeCoordinator>['store'],
    spaceId: string,
    savedTabId: string,
  ): number {
    let count = 0;
    for (const node of store.state.pinnedBySpace[spaceId] ?? []) {
      if (node.kind === 'tab') {
        if (node.id === savedTabId) count += 1;
      } else if (node.children.includes(savedTabId)) {
        count += 1;
      }
    }
    return count;
  }

  /** Assert every savedTab for the Space is placed exactly once (no orphan). */
  function expectNoOrphans(
    store: ReturnType<typeof makeCoordinator>['store'],
    spaceId: string,
  ): void {
    for (const [id, saved] of Object.entries(store.state.savedTabs)) {
      if (saved.spaceId !== spaceId) continue;
      expect(placementsOf(store, spaceId, id)).toBe(1);
    }
  }

  test('placement { into } files the minted tab into the folder, binds, leaves Temporary', async () => {
    const { coordinator, store } = makeCoordinator();
    store.state.spaces.push({ id: 'work', name: 'Work', color: 'blue', icon: 'star' });
    store.state.spaceInstancesByWindow[100] = {
      work: { spaceId: 'work', groupId: 1, tempTabIds: [42], tempTabTitles: {} },
    };
    store.state.pinnedBySpace.work = [
      { kind: 'folder', id: 'fld', name: 'Reading', icon: 'folder', color: 'gray', children: [] },
    ];
    seedLiveTab(store, 42, 100, 'https://github.com/', 'GitHub');

    coordinator.enqueue(
      sidebar(
        {
          kind: 'pinTab',
          payload: {
            tabId: 42,
            windowId: 100,
            spaceId: 'work',
            targetIndex: 0,
            placement: { into: 'fld' },
          },
        },
        'sess:1',
      ),
    );
    await coordinator.idle();

    const newId = Object.keys(store.state.savedTabs)[0] as string;
    const list = store.state.pinnedBySpace.work ?? [];
    expect(list).toHaveLength(1);
    expect(list[0]).toEqual({
      kind: 'folder',
      id: 'fld',
      name: 'Reading',
      icon: 'folder',
      color: 'gray',
      children: [newId],
    });
    // Bound + removed from Temporary, exactly one placement (no orphan).
    expect(store.state.tabBindings[newId]).toEqual({ 100: 42 });
    expect(store.state.spaceInstancesByWindow[100]?.work?.tempTabIds).toEqual([]);
    expectNoOrphans(store, 'work');
  });

  test('placement { into } with a missing folder falls back to a top-level pin and still binds', async () => {
    const { coordinator, store } = makeCoordinator();
    store.state.spaces.push({ id: 'work', name: 'Work', color: 'blue', icon: 'star' });
    store.state.spaceInstancesByWindow[100] = {
      work: { spaceId: 'work', groupId: 1, tempTabIds: [42], tempTabTitles: {} },
    };
    seedSaved(store, 'a');
    store.setPinned('work', tabs('a')); // no folder named 'gone'
    seedLiveTab(store, 42, 100, 'https://github.com/', 'GitHub');

    coordinator.enqueue(
      sidebar(
        {
          kind: 'pinTab',
          payload: {
            tabId: 42,
            windowId: 100,
            spaceId: 'work',
            targetIndex: 1,
            placement: { into: 'gone' },
          },
        },
        'sess:1',
      ),
    );
    await coordinator.idle();

    const newId = Object.keys(store.state.savedTabs).find((k) => k !== 'a') as string;
    const list = store.state.pinnedBySpace.work ?? [];
    // Fell back to a top-level insert at targetIndex 1 (after 'a').
    expect(list).toEqual([
      { kind: 'tab', id: 'a' },
      { kind: 'tab', id: newId },
    ]);
    expect(store.state.tabBindings[newId]).toEqual({ 100: 42 });
    expect(store.state.spaceInstancesByWindow[100]?.work?.tempTabIds).toEqual([]);
    expectNoOrphans(store, 'work');
  });

  test('placement { withSavedTabId } folds the minted tab and the target tab into a new folder', async () => {
    const { coordinator, store } = makeCoordinator();
    store.state.spaces.push({ id: 'work', name: 'Work', color: 'blue', icon: 'star' });
    store.state.spaceInstancesByWindow[100] = {
      work: { spaceId: 'work', groupId: 1, tempTabIds: [42], tempTabTitles: {} },
    };
    seedSaved(store, 'a', 'st-1');
    store.setPinned('work', tabs('a', 'st-1'));
    seedLiveTab(store, 42, 100, 'https://github.com/', 'GitHub');

    coordinator.enqueue(
      sidebar(
        {
          kind: 'pinTab',
          payload: {
            tabId: 42,
            windowId: 100,
            spaceId: 'work',
            targetIndex: 0,
            placement: { withSavedTabId: 'st-1' },
          },
        },
        'sess:1',
      ),
    );
    await coordinator.idle();

    const newId = Object.keys(store.state.savedTabs).find(
      (k) => k !== 'a' && k !== 'st-1',
    ) as string;
    const list = store.state.pinnedBySpace.work ?? [];
    // 'a' stays; 'st-1' is folded with the minted tab into a folder at st-1's slot.
    expect(list).toHaveLength(2);
    expect(list[0]).toEqual({ kind: 'tab', id: 'a' });
    const folder = list[1];
    expect(folder?.kind).toBe('folder');
    expect((folder as { children: string[] }).children).toEqual(['st-1', newId]);
    expect(store.state.tabBindings[newId]).toEqual({ 100: 42 });
    expect(store.state.spaceInstancesByWindow[100]?.work?.tempTabIds).toEqual([]);
    expectNoOrphans(store, 'work');
  });

  test('placement { withSavedTabId } with a missing target falls back to a top-level pin', async () => {
    const { coordinator, store } = makeCoordinator();
    store.state.spaces.push({ id: 'work', name: 'Work', color: 'blue', icon: 'star' });
    store.state.spaceInstancesByWindow[100] = {
      work: { spaceId: 'work', groupId: 1, tempTabIds: [42], tempTabTitles: {} },
    };
    seedSaved(store, 'a');
    store.setPinned('work', tabs('a'));
    seedLiveTab(store, 42, 100, 'https://github.com/', 'GitHub');

    coordinator.enqueue(
      sidebar(
        {
          kind: 'pinTab',
          payload: {
            tabId: 42,
            windowId: 100,
            spaceId: 'work',
            targetIndex: 1,
            placement: { withSavedTabId: 'ghost' },
          },
        },
        'sess:1',
      ),
    );
    await coordinator.idle();

    const newId = Object.keys(store.state.savedTabs).find((k) => k !== 'a') as string;
    const list = store.state.pinnedBySpace.work ?? [];
    expect(list).toEqual([
      { kind: 'tab', id: 'a' },
      { kind: 'tab', id: newId },
    ]);
    expect(store.state.tabBindings[newId]).toEqual({ 100: 42 });
    expectNoOrphans(store, 'work');
  });
});

describe('Coordinator handlers: unpinTab', () => {
  test('returns the bound tab to Temporary, removes the record, does not close it', async () => {
    const { coordinator, store, persist, emitAck } = makeCoordinator();
    store.state.spaces.push({ id: 'work', name: 'Work', color: 'blue', icon: 'star' });
    store.state.activeSpaceByWindow[100] = 'work';
    store.state.spaceInstancesByWindow[100] = {
      work: { spaceId: 'work', groupId: 1, tempTabIds: [], tempTabTitles: {} },
    };
    store.state.savedTabs['st-1'] = savedTab('st-1', 'https://x/', 'https://x/');
    store.state.tabBindings['st-1'] = { 100: 42 };
    store.setPinned('work', tabs('st-1'));

    coordinator.enqueue(
      sidebar({ kind: 'unpinTab', payload: { savedTabId: 'st-1', windowId: 100 } }, 'sess:1'),
    );
    await coordinator.idle();

    expect(store.state.savedTabs['st-1']).toBeUndefined();
    expect(store.state.pinnedBySpace.work).toEqual([]);
    expect(store.state.spaceInstancesByWindow[100]?.work?.tempTabIds).toEqual([42]);
    expect(persist).toHaveBeenCalledTimes(1);
    expect(emitAck.mock.calls[0]?.[0]).toMatchObject({ id: 'sess:1', result: 'ok' });
  });

  test('dormant saved tab: removes the record, nothing returned to Temporary', async () => {
    const { coordinator, store } = makeCoordinator();
    store.state.spaces.push({ id: 'work', name: 'Work', color: 'blue', icon: 'star' });
    store.state.spaceInstancesByWindow[100] = {
      work: { spaceId: 'work', groupId: 1, tempTabIds: [], tempTabTitles: {} },
    };
    store.state.savedTabs['st-1'] = savedTab('st-1', 'https://x/', null);
    store.state.tabBindings['st-1'] = {};
    store.setPinned('work', tabs('st-1'));

    coordinator.enqueue(
      sidebar({ kind: 'unpinTab', payload: { savedTabId: 'st-1', windowId: 100 } }, 'sess:1'),
    );
    await coordinator.idle();

    expect(store.state.savedTabs['st-1']).toBeUndefined();
    expect(store.state.spaceInstancesByWindow[100]?.work?.tempTabIds).toEqual([]);
  });

  test("bound in two windows: returns each window's tab to its own Temporary", async () => {
    const { coordinator, store } = makeCoordinator();
    store.state.spaces.push({ id: 'work', name: 'Work', color: 'blue', icon: 'star' });
    store.state.activeSpaceByWindow[100] = 'work';
    store.state.activeSpaceByWindow[200] = 'work';
    store.state.spaceInstancesByWindow[100] = {
      work: { spaceId: 'work', groupId: 1, tempTabIds: [], tempTabTitles: {} },
    };
    store.state.spaceInstancesByWindow[200] = {
      work: { spaceId: 'work', groupId: 2, tempTabIds: [], tempTabTitles: {} },
    };
    store.state.savedTabs['st-1'] = savedTab('st-1', 'https://x/', 'https://x/');
    store.state.tabBindings['st-1'] = { 100: 42, 200: 77 };
    store.setPinned('work', tabs('st-1'));

    coordinator.enqueue(
      sidebar({ kind: 'unpinTab', payload: { savedTabId: 'st-1', windowId: 100 } }, 'sess:1'),
    );
    await coordinator.idle();

    expect(store.state.savedTabs['st-1']).toBeUndefined();
    // Each window's bound tab returns to THAT window's Temporary (no tab closed).
    expect(store.state.spaceInstancesByWindow[100]?.work?.tempTabIds).toEqual([42]);
    expect(store.state.spaceInstancesByWindow[200]?.work?.tempTabIds).toEqual([77]);
  });

  test('unknown savedTabId throws → error ack, no persist', async () => {
    const { coordinator, persist, emitAck } = makeCoordinator();
    coordinator.enqueue(
      sidebar({ kind: 'unpinTab', payload: { savedTabId: 'nope', windowId: 100 } }, 'sess:1'),
    );
    await coordinator.idle();
    expect(persist).not.toHaveBeenCalled();
    expect(emitAck.mock.calls[0]?.[0]).toMatchObject({
      id: 'sess:1',
      result: { error: expect.stringContaining("unknown savedTabId 'nope'") },
    });
  });
});

describe('Coordinator handlers: reorderPinned', () => {
  test('replaces the tree with the post-drop nodes, one persist+broadcast, acks ok', async () => {
    const { coordinator, store, persist, broadcast, emitAck } = makeCoordinator();
    store.state.spaces.push({ id: 'work', name: 'Work', color: 'blue', icon: 'star' });
    seedSaved(store, 't1', 't2', 't3');
    store.setPinned('work', tabs('t1', 't2', 't3'));

    coordinator.enqueue(
      sidebar(
        { kind: 'reorderPinned', payload: { spaceId: 'work', nodes: tabs('t3', 't1', 't2') } },
        'sess:1',
      ),
    );
    await coordinator.idle();

    expect(store.state.pinnedBySpace.work).toEqual(tabs('t3', 't1', 't2'));
    expect(persist).toHaveBeenCalledTimes(1);
    expect(broadcast).toHaveBeenCalledTimes(1);
    expect(emitAck.mock.calls[0]?.[0]).toMatchObject({ id: 'sess:1', result: 'ok' });
  });

  test('a tree-replace that moves a tab into a folder persists the folder shape', async () => {
    const { coordinator, store } = makeCoordinator();
    store.state.spaces.push({ id: 'work', name: 'Work', color: 'blue', icon: 'star' });
    seedSaved(store, 't1', 't2');
    store.setPinned('work', tabs('t1', 't2'));

    coordinator.enqueue(
      sidebar(
        {
          kind: 'reorderPinned',
          payload: {
            spaceId: 'work',
            nodes: [
              {
                kind: 'folder',
                id: 'f1',
                name: 'F',
                icon: 'folder',
                color: 'gray',
                children: ['t1', 't2'],
              },
            ],
          },
        },
        'sess:1',
      ),
    );
    await coordinator.idle();

    expect(store.state.pinnedBySpace.work).toEqual([
      {
        kind: 'folder',
        id: 'f1',
        name: 'F',
        icon: 'folder',
        color: 'gray',
        children: ['t1', 't2'],
      },
    ]);
  });

  test('unknown spaceId throws → error ack, no partial persist', async () => {
    const { coordinator, persist, broadcast, emitAck } = makeCoordinator();
    coordinator.enqueue(
      sidebar(
        { kind: 'reorderPinned', payload: { spaceId: 'ghost', nodes: tabs('t1') } },
        'sess:1',
      ),
    );
    await coordinator.idle();
    expect(persist).not.toHaveBeenCalled();
    expect(broadcast).not.toHaveBeenCalled();
    expect(emitAck.mock.calls[0]?.[0]).toMatchObject({
      id: 'sess:1',
      result: { error: expect.stringContaining("unknown spaceId 'ghost'") },
    });
  });
});

describe('Coordinator handlers: folder commands', () => {
  test('createFolder mints an empty folder at the top', async () => {
    const { coordinator, store, persist } = makeCoordinator();
    store.state.spaces.push({ id: 'work', name: 'Work', color: 'blue', icon: 'star' });
    seedSaved(store, 't1');
    store.setPinned('work', tabs('t1'));

    coordinator.enqueue(sidebar({ kind: 'createFolder', payload: { spaceId: 'work' } }, 'sess:1'));
    await coordinator.idle();

    const list = store.state.pinnedBySpace.work ?? [];
    expect(list[0]?.kind).toBe('folder');
    expect(list[1]).toEqual({ kind: 'tab', id: 't1' });
    expect(persist).toHaveBeenCalledTimes(1);
  });

  test('createFolderFromTabs wraps both tabs at the drop index', async () => {
    const { coordinator, store } = makeCoordinator();
    store.state.spaces.push({ id: 'work', name: 'Work', color: 'blue', icon: 'star' });
    seedSaved(store, 't1', 't2', 't3');
    store.setPinned('work', tabs('t1', 't2', 't3'));

    coordinator.enqueue(
      sidebar(
        {
          kind: 'createFolderFromTabs',
          payload: { spaceId: 'work', tabIdA: 't3', tabIdB: 't1', index: 0 },
        },
        'sess:1',
      ),
    );
    await coordinator.idle();

    const list = store.state.pinnedBySpace.work ?? [];
    expect(list[0]).toMatchObject({ kind: 'folder', children: ['t1', 't3'] });
    expect(list[1]).toEqual({ kind: 'tab', id: 't2' });
  });

  test('renameFolder / setFolderIcon / setFolderColor mutate the node', async () => {
    const { coordinator, store } = makeCoordinator();
    store.state.spaces.push({ id: 'work', name: 'Work', color: 'blue', icon: 'star' });
    store.state.pinnedBySpace.work = [
      { kind: 'folder', id: 'f1', name: 'F', icon: 'folder', color: 'gray', children: [] },
    ];

    coordinator.enqueue(
      sidebar(
        { kind: 'renameFolder', payload: { spaceId: 'work', folderId: 'f1', name: 'Reading' } },
        'sess:1',
      ),
    );
    coordinator.enqueue(
      sidebar(
        { kind: 'setFolderIcon', payload: { spaceId: 'work', folderId: 'f1', icon: 'book' } },
        'sess:2',
      ),
    );
    coordinator.enqueue(
      sidebar(
        { kind: 'setFolderColor', payload: { spaceId: 'work', folderId: 'f1', color: 'blue' } },
        'sess:3',
      ),
    );
    await coordinator.idle();

    expect(store.state.pinnedBySpace.work).toEqual([
      { kind: 'folder', id: 'f1', name: 'Reading', icon: 'book', color: 'blue', children: [] },
    ]);
  });

  test('deleteFolder spills children to top-level at the folder position', async () => {
    const { coordinator, store } = makeCoordinator();
    store.state.spaces.push({ id: 'work', name: 'Work', color: 'blue', icon: 'star' });
    seedSaved(store, 'a', 'b');
    store.state.pinnedBySpace.work = [
      { kind: 'tab', id: 'a' },
      { kind: 'folder', id: 'f1', name: 'F', icon: 'folder', color: 'gray', children: ['b'] },
    ];

    coordinator.enqueue(
      sidebar({ kind: 'deleteFolder', payload: { spaceId: 'work', folderId: 'f1' } }, 'sess:1'),
    );
    await coordinator.idle();

    expect(store.state.pinnedBySpace.work).toEqual(tabs('a', 'b'));
  });
});

describe('Coordinator active-tab tracking across close + auto-activate', () => {
  test('closing the active tab and activating another flips active to the new tab', async () => {
    const { coordinator, store, broadcast } = makeCoordinator();
    store.state.liveTabsById[42] = {
      tabId: 42,
      windowId: 100,
      title: 'A',
      url: 'https://a/',
      active: true,
      status: 'complete',
    };
    store.state.liveTabsById[43] = {
      tabId: 43,
      windowId: 100,
      title: 'B',
      url: 'https://b/',
      active: false,
      status: 'complete',
    };

    // Chrome closes 42 and auto-activates 43 (order: remove then activate).
    coordinator.enqueue({
      source: 'chrome',
      kind: 'tabs.onRemoved',
      payload: {
        tabId: 42,
        info: { windowId: 100, isWindowClosing: false } as chrome.tabs.OnRemovedInfo,
      },
    });
    coordinator.enqueue(tabActivated(43, 100));
    await coordinator.idle();

    expect(store.state.liveTabsById[42]).toBeUndefined();
    expect(store.state.liveTabsById[43]?.active).toBe(true);
    const lastState = broadcast.mock.calls.at(-1)?.[0]?.state;
    expect(lastState?.liveTabsById?.[43]?.active).toBe(true);
  });
});

describe('Coordinator handlers: reorderTemp', () => {
  test('reorders the window instance tempTabIds, one persist+broadcast', async () => {
    const { coordinator, store, persist, broadcast, emitAck } = makeCoordinator();
    store.state.spaces.push({ id: 'work', name: 'Work', color: 'blue', icon: 'star' });
    store.state.activeSpaceByWindow[100] = 'work';
    store.state.spaceInstancesByWindow[100] = {
      work: {
        spaceId: 'work',
        groupId: 1,
        tempTabIds: [1, 2, 3],
        tempTabTitles: {},
      },
    };

    coordinator.enqueue(
      sidebar({ kind: 'reorderTemp', payload: { windowId: 100, tabIds: [3, 1, 2] } }, 'sess:1'),
    );
    await coordinator.idle();

    expect(store.state.spaceInstancesByWindow[100]?.work?.tempTabIds).toEqual([3, 1, 2]);
    expect(persist).toHaveBeenCalledTimes(1);
    expect(broadcast).toHaveBeenCalledTimes(1);
    expect(emitAck.mock.calls[0]?.[0]).toMatchObject({ id: 'sess:1', result: 'ok' });
  });
});

describe('Coordinator handlers: openUrl', () => {
  beforeEach(() => vi.restoreAllMocks());

  test('happy path: creates a tab in the target window, acks ok, no direct state mutation', async () => {
    const chromeStub = installSavedTabChromeStub();
    const { coordinator, store, emitAck } = makeCoordinator();
    coordinator.enqueue(
      sidebar(
        { kind: 'openUrl', payload: { url: 'https://example.com/', windowId: 100 } },
        'sess:1',
      ),
    );
    await coordinator.idle();
    expect(chromeStub.tabs.create).toHaveBeenCalledWith({
      url: 'https://example.com/',
      windowId: 100,
    });
    // No direct mutation — tabs.onCreated adopts the new tab, not this handler.
    expect(Object.keys(store.state.liveTabsById)).toHaveLength(0);
    expect(Object.keys(store.state.tabBindings)).toHaveLength(0);
    expect(emitAck).toHaveBeenCalledWith({ type: 'lunma/command-ack', id: 'sess:1', result: 'ok' });
  });

  test('chrome.tabs.create rejection → error ack', async () => {
    const chromeStub = installSavedTabChromeStub();
    chromeStub.tabs.create.mockRejectedValueOnce(new Error('window gone'));
    const { coordinator, emitAck } = makeCoordinator();
    coordinator.enqueue(
      sidebar(
        { kind: 'openUrl', payload: { url: 'https://example.com/', windowId: 100 } },
        'sess:1',
      ),
    );
    await coordinator.idle();
    expect(emitAck.mock.calls[0]?.[0]).toMatchObject({
      id: 'sess:1',
      result: { error: 'window gone' },
    });
  });
});
