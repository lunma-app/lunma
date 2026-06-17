import { beforeEach, describe, expect, test } from 'vitest';
import type { LiveTab, Space } from '../shared/types';
import { makeCoordinator, sidebar } from './coordinator.test-helpers';
import { installTabGroupsChrome, type TabGroupsController } from './tab-groups.test-helpers';

function space(id: string, name = id, color = 'blue'): Space {
  return { id, name, color, icon: 'star' };
}

function live(
  tabId: number,
  windowId: number,
  url = 'https://github.com/',
  title = 'GitHub',
): LiveTab {
  return { tabId, windowId, title, url, active: false, status: 'complete' };
}

let chrome: TabGroupsController;
beforeEach(() => {
  chrome = installTabGroupsChrome();
});

describe('Coordinator handler: favoriteTab (mint a global favorite)', () => {
  test('mints an ungrouped favorite, binds it, leaves the live tab open', async () => {
    const { coordinator, store } = makeCoordinator();
    store.state.spaces.push(space('work'));
    store.state.activeSpaceByWindow[100] = 'work';
    store.state.spaceInstancesByWindow[100] = {
      work: { spaceId: 'work', groupId: 1, tempTabIds: [42], tempTabTitles: {} },
    };
    store.state.liveTabsById[42] = { ...live(42, 100), active: true };
    chrome.addGroup({ id: 1, windowId: 100, collapsed: false });
    chrome.addTab({ id: 42, windowId: 100, groupId: 1, active: true });

    coordinator.enqueue(
      sidebar({ kind: 'favoriteTab', payload: { tabId: 42, windowId: 100 } }, 'c1'),
    );
    await coordinator.idle();

    expect(store.state.faviconRow).toHaveLength(1);
    const favId = store.state.faviconRow[0] as string;
    expect(store.state.savedTabs[favId]).toMatchObject({
      spaceId: null,
      title: 'GitHub',
      originalURL: 'https://github.com/',
      currentURL: 'https://github.com/',
    });
    // Bound in window 100; removed from Temporary; live tab ungrouped but OPEN.
    expect(store.state.tabBindings[favId]).toEqual({ 100: 42 });
    expect(store.state.spaceInstancesByWindow[100]?.work?.tempTabIds).toEqual([]);
    expect(chrome.tabs.get(42)?.groupId).toBe(-1);
    expect(chrome.tabs.has(42)).toBe(true);
    expect(chrome.calls).toContain('tabs.ungroup:[42]');
    // …and PARKED at the tab-strip start (D10) so a later Space switch that
    // collapses its old group can never sweep it invisible.
    expect(chrome.calls).toContain('tabs.move:42->0');
    expect(chrome.tabs.get(42)?.index).toBe(0);
  });

  test('is a no-op on a tab already bound to any saved tab (idempotent)', async () => {
    const { coordinator, store } = makeCoordinator();
    store.state.spaces.push(space('work'));
    store.state.activeSpaceByWindow[100] = 'work';
    store.state.savedTabs.t1 = {
      id: 't1',
      spaceId: 'work',
      title: 'x',
      originalURL: 'https://x/',
      currentURL: 'https://x/',
    };
    store.state.tabBindings.t1 = { 100: 42 };
    store.state.liveTabsById[42] = live(42, 100);
    chrome.addTab({ id: 42, windowId: 100, groupId: -1 });

    coordinator.enqueue(
      sidebar({ kind: 'favoriteTab', payload: { tabId: 42, windowId: 100 } }, 'c1'),
    );
    await coordinator.idle();

    expect(store.state.faviconRow).toEqual([]);
    expect(Object.keys(store.state.savedTabs)).toEqual(['t1']);
  });

  test('is a no-op when Lunma has no live record of the tab', async () => {
    const { coordinator, store } = makeCoordinator();
    store.state.spaces.push(space('work'));
    store.state.activeSpaceByWindow[100] = 'work';
    // No liveTabsById entry for tab 42.
    coordinator.enqueue(
      sidebar({ kind: 'favoriteTab', payload: { tabId: 42, windowId: 100 } }, 'c1'),
    );
    await coordinator.idle();

    expect(store.state.faviconRow).toEqual([]);
    expect(Object.keys(store.state.savedTabs)).toEqual([]);
  });
});

describe('Coordinator handler: favoriteSavedTab (decouple)', () => {
  test('decouples a pinned tab and ungroups it in every bound window', async () => {
    const { coordinator, store } = makeCoordinator();
    store.state.spaces.push(space('work'));
    store.state.activeSpaceByWindow[100] = 'work';
    store.state.activeSpaceByWindow[200] = 'work';
    store.state.spaceInstancesByWindow[100] = {
      work: { spaceId: 'work', groupId: 1, tempTabIds: [], tempTabTitles: {} },
    };
    store.state.spaceInstancesByWindow[200] = {
      work: { spaceId: 'work', groupId: 2, tempTabIds: [], tempTabTitles: {} },
    };
    store.state.savedTabs.t1 = {
      id: 't1',
      spaceId: 'work',
      title: 'GH',
      originalURL: 'https://github.com/',
      currentURL: 'https://github.com/',
    };
    store.state.tabBindings.t1 = { 100: 42, 200: 77 };
    store.setPinned('work', [{ kind: 'tab', id: 't1' }]);
    store.state.liveTabsById[42] = live(42, 100);
    store.state.liveTabsById[77] = live(77, 200);
    chrome.addGroup({ id: 1, windowId: 100 });
    chrome.addGroup({ id: 2, windowId: 200 });
    chrome.addTab({ id: 42, windowId: 100, groupId: 1 });
    chrome.addTab({ id: 77, windowId: 200, groupId: 2 });

    coordinator.enqueue(sidebar({ kind: 'favoriteSavedTab', payload: { savedTabId: 't1' } }, 'c1'));
    await coordinator.idle();

    expect(store.state.savedTabs.t1?.spaceId).toBeNull();
    expect(store.state.faviconRow).toEqual(['t1']);
    expect(store.state.pinnedBySpace.work).toEqual([]);
    expect(chrome.tabs.get(42)?.groupId).toBe(-1);
    expect(chrome.tabs.get(77)?.groupId).toBe(-1);
    // Both bound tabs are parked at their window's strip start (D10).
    expect(chrome.calls).toContain('tabs.move:42->0');
    expect(chrome.calls).toContain('tabs.move:77->0');
  });

  test('a favorited tab stays ungrouped AND parked across a subsequent Space switch', async () => {
    // Reproduces the reported "favorite disappears when switching space": after
    // favoriting, switching to another Space must NOT re-group or strand the tab.
    const { coordinator, store } = makeCoordinator();
    store.state.spaces.push(space('work'), space('reading', 'Reading', 'orange'));
    store.state.activeSpaceByWindow[100] = 'work';
    store.state.spaceInstancesByWindow[100] = {
      work: { spaceId: 'work', groupId: 1, tempTabIds: [42], tempTabTitles: {} },
    };
    store.state.liveTabsById[42] = { ...live(42, 100), active: true };
    chrome.addGroup({ id: 1, windowId: 100, collapsed: false });
    chrome.addTab({ id: 42, windowId: 100, groupId: 1, active: true });

    coordinator.enqueue(
      sidebar({ kind: 'favoriteTab', payload: { tabId: 42, windowId: 100 } }, 'c1'),
    );
    coordinator.enqueue(
      sidebar({ kind: 'activateSpace', payload: { windowId: 100, spaceId: 'reading' } }, 'c2'),
    );
    await coordinator.idle();

    // The favorite's tab is global (ungrouped) and parked at the strip start, so
    // collapsing the outgoing "work" group leaves it untouched and visible.
    expect(chrome.tabs.get(42)?.groupId).toBe(-1);
    expect(chrome.tabs.get(42)?.index).toBe(0);
    expect(chrome.tabs.has(42)).toBe(true);
  });

  test('a SELECTED favorite KEEPS focus when switching to an empty Space (no blank tab spawned)', async () => {
    // sidebar-favicon-row: a favorite belongs to no Space, so switching Space
    // while it is the selected tab keeps it focused + visible, and the empty
    // incoming Space spawns NO blank tab (it materializes lazily on entry).
    const { coordinator, store } = makeCoordinator();
    store.state.spaces.push(space('work'), space('reading', 'Reading', 'orange'));
    store.state.activeSpaceByWindow[100] = 'work';
    store.state.spaceInstancesByWindow[100] = {
      work: { spaceId: 'work', groupId: 1, tempTabIds: [42], tempTabTitles: {} },
    };
    store.state.liveTabsById[42] = { ...live(42, 100), active: true };
    chrome.addGroup({ id: 1, windowId: 100, collapsed: false });
    chrome.addTab({ id: 42, windowId: 100, groupId: 1, active: true });

    coordinator.enqueue(
      sidebar({ kind: 'favoriteTab', payload: { tabId: 42, windowId: 100 } }, 'c1'),
    );
    await coordinator.idle();
    expect(chrome.tabs.get(42)?.groupId).toBe(-1); // ungrouped at favorite-time

    coordinator.enqueue(
      sidebar({ kind: 'activateSpace', payload: { windowId: 100, spaceId: 'reading' } }, 'c2'),
    );
    await coordinator.idle();

    // The favorite stays OPEN, global, AND selected — focus was not yanked away.
    expect(chrome.tabs.has(42)).toBe(true);
    expect(chrome.tabs.get(42)?.groupId).toBe(-1);
    expect(chrome.tabs.get(42)?.active).toBe(true);
    // No blank/home tab was created for the empty incoming Space — the window
    // still holds only the favorite.
    expect([...chrome.tabs.values()].filter((t) => t.windowId === 100)).toHaveLength(1);
  });

  test('switching to a NON-empty Space while a favorite is selected keeps the favorite focused but expands that Space', async () => {
    const { coordinator, store } = makeCoordinator();
    store.state.spaces.push(space('work'), space('reading', 'Reading', 'orange'));
    store.state.activeSpaceByWindow[100] = 'work';
    // "work" keeps a second tab (50) so it stays non-empty (and tracked) after 42
    // is favorited; "reading" already has a temp tab (99) in its own group (2).
    store.state.spaceInstancesByWindow[100] = {
      work: { spaceId: 'work', groupId: 1, tempTabIds: [42, 50], tempTabTitles: {} },
      reading: { spaceId: 'reading', groupId: 2, tempTabIds: [99], tempTabTitles: {} },
    };
    store.state.liveTabsById[42] = { ...live(42, 100), active: true };
    store.state.liveTabsById[50] = live(50, 100, 'https://w/', 'W');
    store.state.liveTabsById[99] = live(99, 100, 'https://r/', 'R');
    chrome.addGroup({ id: 1, windowId: 100, collapsed: false });
    chrome.addGroup({ id: 2, windowId: 100, collapsed: true });
    chrome.addTab({ id: 42, windowId: 100, groupId: 1, active: true });
    chrome.addTab({ id: 50, windowId: 100, groupId: 1 });
    chrome.addTab({ id: 99, windowId: 100, groupId: 2 });

    coordinator.enqueue(
      sidebar({ kind: 'favoriteTab', payload: { tabId: 42, windowId: 100 } }, 'c1'),
    );
    coordinator.enqueue(
      sidebar({ kind: 'activateSpace', payload: { windowId: 100, spaceId: 'reading' } }, 'c2'),
    );
    await coordinator.idle();

    // The favorite (42) keeps focus; reading's existing tab (99) is NOT activated.
    expect(chrome.tabs.get(42)?.active).toBe(true);
    expect(chrome.tabs.get(99)?.active).toBe(false);
    // …but reading's group is expanded (its tabs are ready) and work's collapsed.
    expect(chrome.groups.get(2)?.collapsed).toBe(false);
    expect(chrome.groups.get(1)?.collapsed).toBe(true);
  });
});

describe('Coordinator handler: pinSavedTab (couple)', () => {
  test('couples a favorite and groups it into the Space in every bound window', async () => {
    const { coordinator, store } = makeCoordinator();
    store.state.spaces.push(space('work'));
    store.state.activeSpaceByWindow[100] = 'work';
    store.state.activeSpaceByWindow[200] = 'work';
    store.state.spaceInstancesByWindow[100] = {
      work: { spaceId: 'work', groupId: 1, tempTabIds: [], tempTabTitles: {} },
    };
    store.state.spaceInstancesByWindow[200] = {
      work: { spaceId: 'work', groupId: 2, tempTabIds: [], tempTabTitles: {} },
    };
    store.state.savedTabs.f1 = {
      id: 'f1',
      spaceId: null,
      title: 'GH',
      originalURL: 'https://github.com/',
      currentURL: 'https://github.com/',
    };
    store.state.tabBindings.f1 = { 100: 42, 200: 77 };
    store.state.faviconRow = ['f1'];
    store.state.liveTabsById[42] = live(42, 100);
    store.state.liveTabsById[77] = live(77, 200);
    chrome.addGroup({ id: 1, windowId: 100 });
    chrome.addGroup({ id: 2, windowId: 200 });
    chrome.addTab({ id: 42, windowId: 100, groupId: -1 });
    chrome.addTab({ id: 77, windowId: 200, groupId: -1 });

    coordinator.enqueue(
      sidebar({ kind: 'pinSavedTab', payload: { savedTabId: 'f1', spaceId: 'work' } }, 'c1'),
    );
    await coordinator.idle();

    expect(store.state.savedTabs.f1?.spaceId).toBe('work');
    expect(store.state.faviconRow).toEqual([]);
    expect(store.state.pinnedBySpace.work).toEqual([{ kind: 'tab', id: 'f1' }]);
    expect(chrome.tabs.get(42)?.groupId).toBe(1);
    expect(chrome.tabs.get(77)?.groupId).toBe(2);
  });
});

describe('Coordinator handler: reorderFavorites', () => {
  test('applies the post-drop order', async () => {
    const { coordinator, store } = makeCoordinator();
    store.state.faviconRow = ['f1', 'f2', 'f3'];
    coordinator.enqueue(
      sidebar({ kind: 'reorderFavorites', payload: { ids: ['f3', 'f1', 'f2'] } }, 'c1'),
    );
    await coordinator.idle();
    expect(store.state.faviconRow).toEqual(['f3', 'f1', 'f2']);
  });
});

describe('Coordinator handler: openSavedTab for a favorite', () => {
  test('opens an ungrouped tab, not added to any Space group', async () => {
    const { coordinator, store } = makeCoordinator();
    store.state.spaces.push(space('work'));
    store.state.activeSpaceByWindow[100] = 'work';
    store.state.spaceInstancesByWindow[100] = {
      work: { spaceId: 'work', groupId: 1, tempTabIds: [17], tempTabTitles: {} },
    };
    store.state.liveTabsById[17] = live(17, 100, 'https://t/', 't');
    store.state.savedTabs.fav = {
      id: 'fav',
      spaceId: null,
      title: 'GH',
      originalURL: 'https://github.com/',
      currentURL: null,
    };
    store.state.faviconRow = ['fav'];
    store.state.tabBindings.fav = {};
    chrome.addGroup({ id: 1, windowId: 100 });
    chrome.addTab({ id: 17, windowId: 100, groupId: 1 });

    coordinator.enqueue(
      sidebar({ kind: 'openSavedTab', payload: { savedTabId: 'fav', windowId: 100 } }, 'c1'),
    );
    await coordinator.idle();

    const newTabId = store.state.tabBindings.fav?.[100];
    expect(newTabId).toBeDefined();
    // The favorite's freshly-opened tab is ungrouped (global), never in group 1.
    expect(chrome.tabs.get(newTabId as number)?.groupId).toBe(-1);
    // No tabs.group call adopted the favorite into a Space group.
    expect(chrome.calls.some((c) => c.startsWith('tabs.group'))).toBe(false);
  });

  // In-place open (newtab-hearth, spaces-and-tabs rule 2b): a favorite activated on
  // the home navigates the home's OWN tab via `replaceTabId`. The navigated tab —
  // which already sits inside the active Space's group from new-tab grouping — is
  // ungrouped + parked so the favorite invariant holds regardless of prior membership.
  test('opening a favorite in place ungroups the navigated home tab (no new tab)', async () => {
    const { coordinator, store } = makeCoordinator();
    store.state.spaces.push(space('work'));
    store.state.activeSpaceByWindow[100] = 'work';
    // Home tab 42 sits inside the active Space's group G_work (grouped on creation).
    store.state.spaceInstancesByWindow[100] = {
      work: { spaceId: 'work', groupId: 1, tempTabIds: [42], tempTabTitles: {} },
    };
    store.state.liveTabsById[42] = live(42, 100, 'chrome://newtab/', 'New Tab');
    store.state.savedTabs.fav = {
      id: 'fav',
      spaceId: null,
      title: 'GH',
      originalURL: 'https://github.com/',
      currentURL: null,
    };
    store.state.faviconRow = ['fav'];
    store.state.tabBindings.fav = {};
    chrome.addGroup({ id: 1, windowId: 100 });
    chrome.addTab({ id: 42, windowId: 100, groupId: 1, active: true });

    coordinator.enqueue(
      sidebar(
        { kind: 'openSavedTab', payload: { savedTabId: 'fav', windowId: 100, replaceTabId: 42 } },
        'c1',
      ),
    );
    await coordinator.idle();

    // Navigated in place — tab 42 was bound, no new tab created.
    expect(store.state.tabBindings.fav).toEqual({ 100: 42 });
    expect(chrome.calls).toContain('tabs.update:url:42');
    expect(chrome.calls.some((c) => c.startsWith('tabs.create'))).toBe(false);
    // The navigated home tab ends ungrouped (global) and parked at the strip start,
    // a member of no Space group despite its prior G_work membership.
    expect(chrome.tabs.get(42)?.groupId).toBe(-1);
    expect(chrome.calls).toContain('tabs.ungroup:[42]');
    expect(chrome.calls).toContain('tabs.move:42->0');
  });
});

describe('null-spaceId favorite flows through coordinator paths without crashing (D8)', () => {
  test('open ungrouped → excluded from a rebuilt Space group → removeSavedTab cleans it', async () => {
    const { coordinator, store } = makeCoordinator();
    store.state.spaces.push(space('work'), space('away'));
    // Start on a DIFFERENT Space so step (2) is a genuine cross-Space switch INTO
    // work (cross-space-tab-switch: activating the already-active Space no-ops, so
    // the stale-group rebuild must be driven by a real switch, not a re-activate).
    store.state.activeSpaceByWindow[100] = 'away';
    // work's persisted groupId is STALE (999, not in Chrome) so activation rebuilds
    // its group from the membership filter — which must exclude the favorite.
    store.state.spaceInstancesByWindow[100] = {
      work: { spaceId: 'work', groupId: 999, tempTabIds: [17], tempTabTitles: {} },
      away: { spaceId: 'away', groupId: 2, tempTabIds: [18], tempTabTitles: {} },
    };
    store.state.savedTabs.fav = {
      id: 'fav',
      spaceId: null,
      title: 'GH',
      originalURL: 'https://github.com/',
      currentURL: null,
    };
    store.state.faviconRow = ['fav'];
    store.state.tabBindings.fav = {};
    store.state.liveTabsById[17] = live(17, 100, 'https://t/', 't');
    store.state.liveTabsById[18] = live(18, 100, 'https://a/', 'a');
    chrome.addGroup({ id: 2, windowId: 100, collapsed: false });
    chrome.addTab({ id: 17, windowId: 100, groupId: -1 });
    chrome.addTab({ id: 18, windowId: 100, groupId: 2 });

    // (1) openSavedTab a dormant favorite → ungrouped, bound (the null branch).
    // (2) switch away → work → work's group is rebuilt from [17]; the favorite excluded.
    // (3) deleteSavedTab → removeSavedTab closes the bound tab + cleans faviconRow.
    coordinator.enqueue(
      sidebar({ kind: 'openSavedTab', payload: { savedTabId: 'fav', windowId: 100 } }, 'c1'),
    );
    coordinator.enqueue(
      sidebar({ kind: 'activateSpace', payload: { windowId: 100, spaceId: 'work' } }, 'c2'),
    );
    await coordinator.idle();

    const favTabId = store.state.tabBindings.fav?.[100] as number;
    const workGroup = store.state.spaceInstancesByWindow[100]?.work?.groupId as number;
    expect(workGroup).toBeGreaterThan(0);
    expect(chrome.tabs.get(17)?.groupId).toBe(workGroup); // real member grouped
    expect(chrome.tabs.get(favTabId)?.groupId).toBe(-1); // favorite excluded/global

    coordinator.enqueue(sidebar({ kind: 'deleteSavedTab', payload: { savedTabId: 'fav' } }, 'c3'));
    await coordinator.idle();
    expect(store.state.savedTabs.fav).toBeUndefined();
    expect(store.state.faviconRow).toEqual([]);
    expect(chrome.tabs.has(favTabId)).toBe(false); // bound tab closed
  });
});
