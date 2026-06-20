// Direct unit tests for GroupOrchestrator.orchestrateActivation:
// the activeTabIsGlobalFavorite throw→false branch and the
// preserveFavoriteFocus skip/proceed branches.

import { beforeEach, describe, expect, test, vi } from 'vitest';
import { makeStore } from '../shared/store.test-helpers';
import { GroupOrchestrator } from './group-orchestrator';
import { installTabGroupsChrome, type TabGroupsController } from './tab-groups.test-helpers';

let chrome: TabGroupsController;
beforeEach(() => {
  chrome = installTabGroupsChrome();
});

describe('GroupOrchestrator.orchestrateActivation — activeTabIsGlobalFavorite', () => {
  test('query failure (throw) → false: normal flow proceeds, home tab is created for an empty Space', async () => {
    // When chrome.tabs.query throws inside activeTabIsGlobalFavorite, the method
    // returns false, so keepFavoriteFocus is false and the empty-Space home-tab
    // creation path (step b) runs normally.
    const store = makeStore();
    store.state.spaces.push({ id: 'work', name: 'Work', color: 'blue', icon: 'star' });
    store.state.activeSpaceByWindow[100] = 'work';
    store.state.spaceInstancesByWindow[100] = {
      work: { spaceId: 'work', groupId: -1, tempTabIds: [], tempTabTitles: {} },
    };

    // Make tabs.query throw to simulate the error branch inside activeTabIsGlobalFavorite.
    const origQuery = (globalThis as unknown as { chrome: { tabs: { query: unknown } } }).chrome
      .tabs.query;
    let callCount = 0;
    (globalThis as unknown as { chrome: { tabs: { query: unknown } } }).chrome.tabs.query = vi.fn(
      async (q: Record<string, unknown>) => {
        // The first call is the activeTabIsGlobalFavorite query (active: true);
        // subsequent calls (homeTabIdsInWindow) must work normally.
        if (q.active === true && callCount === 0) {
          callCount++;
          throw new Error('tabs.query failed');
        }
        callCount++;
        return (origQuery as (q: unknown) => Promise<unknown[]>)(q);
      },
    );

    const orchestrator = new GroupOrchestrator(store);
    await orchestrator.orchestrateActivation(100, 'work', undefined, true);

    // keepFavoriteFocus was false (query threw → false), so the empty Space created
    // a home tab (step b) — a tabs.create call must appear.
    expect(chrome.calls.some((c) => c.startsWith('tabs.create:100'))).toBe(true);
  });

  test('query returns no active tab → false: normal flow proceeds', async () => {
    // When the query succeeds but returns an empty array (no active tab),
    // activeTabIsGlobalFavorite returns false → normal home-tab creation for
    // the empty Space.
    const store = makeStore();
    store.state.spaces.push({ id: 'work', name: 'Work', color: 'blue', icon: 'star' });
    store.state.activeSpaceByWindow[100] = 'work';
    store.state.spaceInstancesByWindow[100] = {
      work: { spaceId: 'work', groupId: -1, tempTabIds: [], tempTabTitles: {} },
    };
    // No active tab in Chrome (empty array from query).
    // installTabGroupsChrome's tabs.query filters by q.active; since no tab has
    // active=true in window 100, it returns [].

    const orchestrator = new GroupOrchestrator(store);
    await orchestrator.orchestrateActivation(100, 'work', undefined, true);

    expect(chrome.calls.some((c) => c.startsWith('tabs.create:100'))).toBe(true);
  });
});

describe('GroupOrchestrator.orchestrateActivation — preserveFavoriteFocus skip branch', () => {
  test('active tab IS a global favorite: steps (b)+(c) skipped, no home tab created, no focus move', async () => {
    // When preserveFavoriteFocus=true AND the active tab is a bound global
    // favorite (spaceId===null), the empty-Space home-tab creation (step b)
    // and the focus-move (step c) are both skipped.
    const store = makeStore();
    store.state.spaces.push(
      { id: 'work', name: 'Work', color: 'blue', icon: 'star' },
      { id: 'reading', name: 'Reading', color: 'cyan', icon: 'star' },
    );
    store.state.activeSpaceByWindow[100] = 'work';
    store.state.spaceInstancesByWindow[100] = {
      work: { spaceId: 'work', groupId: 1, tempTabIds: [17], tempTabTitles: {} },
      // reading has no tabs — it would normally get a home tab, but must not.
      reading: { spaceId: 'reading', groupId: -1, tempTabIds: [], tempTabTitles: {} },
    };
    // A global favorite bound to tab 77 in window 100.
    store.state.savedTabs.fav = {
      id: 'fav',
      spaceId: null,
      title: 'GH',
      originalURL: 'https://github.com/',
      currentURL: null,
    };
    store.state.tabBindings.fav = { 100: 77 };
    store.state.faviconRow = ['fav'];
    store.state.liveTabsById[17] = {
      tabId: 17,
      windowId: 100,
      title: 'T',
      url: 'https://t/',
      active: false,
      status: 'complete',
    };

    // Tab 77 (the favorite) is the active tab in window 100.
    chrome.addGroup({ id: 1, windowId: 100, collapsed: false });
    chrome.addTab({ id: 17, windowId: 100, groupId: 1 });
    chrome.addTab({ id: 77, windowId: 100, groupId: -1, active: true });

    const orchestrator = new GroupOrchestrator(store);
    // Activate 'reading' from 'work' with preserveFavoriteFocus=true.
    await orchestrator.orchestrateActivation(100, 'reading', 'work', true);

    // Step (b) skipped: no home tab created for the empty 'reading' Space.
    expect(chrome.calls.some((c) => c.startsWith('tabs.create'))).toBe(false);
    // Step (c) skipped: focus was NOT moved to a reading tab.
    expect(chrome.calls.some((c) => c.startsWith('tabs.update:active'))).toBe(false);
  });
});

describe('GroupOrchestrator.orchestrateActivation — preserveFavoriteFocus proceed branch', () => {
  test('active tab is NOT a global favorite: steps (b)+(c) proceed normally', async () => {
    // When preserveFavoriteFocus=true but the active tab is a Space temp tab
    // (not a global favorite), keepFavoriteFocus=false and the normal activation
    // sequence runs: focus moves into the incoming Space.
    const store = makeStore();
    store.state.spaces.push(
      { id: 'work', name: 'Work', color: 'blue', icon: 'star' },
      { id: 'reading', name: 'Reading', color: 'cyan', icon: 'star' },
    );
    store.state.activeSpaceByWindow[100] = 'work';
    store.state.spaceInstancesByWindow[100] = {
      work: { spaceId: 'work', groupId: 1, tempTabIds: [17], tempTabTitles: {} },
      reading: { spaceId: 'reading', groupId: 2, tempTabIds: [30], tempTabTitles: {} },
    };
    store.state.liveTabsById[17] = {
      tabId: 17,
      windowId: 100,
      title: 'T',
      url: 'https://t/',
      active: true,
      status: 'complete',
    };
    store.state.liveTabsById[30] = {
      tabId: 30,
      windowId: 100,
      title: 'R',
      url: 'https://r/',
      active: false,
      status: 'complete',
    };

    chrome.addGroup({ id: 1, windowId: 100, collapsed: false });
    chrome.addGroup({ id: 2, windowId: 100, collapsed: true });
    chrome.addTab({ id: 17, windowId: 100, groupId: 1, active: true });
    chrome.addTab({ id: 30, windowId: 100, groupId: 2 });

    const orchestrator = new GroupOrchestrator(store);
    // Active tab 17 is a temp tab in 'work', NOT a global favorite.
    await orchestrator.orchestrateActivation(100, 'reading', 'work', true);

    // Step (c) ran: focus moved to the first tab in 'reading' (tab 30).
    expect(chrome.calls).toContain('tabs.update:active:30');
    // Step (d) ran: reading's group expanded, work's collapsed.
    expect(chrome.groups.get(2)?.collapsed).toBe(false);
    expect(chrome.groups.get(1)?.collapsed).toBe(true);
  });
});
