import { beforeEach, describe, expect, test } from 'vitest';
import { LunmaStore } from '../shared/store.svelte';
import type { LiveTab } from '../shared/types';
import {
  fromGroupColor,
  type GroupDescriptor,
  matchGroupToSpace,
  reconcileTabGroupsOnBoot,
  type SpaceCandidate,
} from './tab-group-adoption';
import { installTabGroupsChrome, type TabGroupsController } from './tab-groups.test-helpers';

function group(partial: Partial<GroupDescriptor> & { id: number }): GroupDescriptor {
  return {
    windowId: 100,
    title: undefined,
    color: undefined,
    memberTabIds: [],
    ...partial,
  };
}

function candidate(partial: Partial<SpaceCandidate> & { spaceId: string }): SpaceCandidate {
  return { name: partial.spaceId, color: 'blue', tempTabIds: [], ...partial };
}

function live(tabId: number, windowId: number): LiveTab {
  return { tabId, windowId, title: '', url: '', active: false, status: 'complete' };
}

describe('matchGroupToSpace', () => {
  test('tab-membership overlap wins', () => {
    const matched = matchGroupToSpace(group({ id: 77, memberTabIds: [17, 22] }), [
      candidate({ spaceId: 'work', tempTabIds: [17, 22] }),
      candidate({ spaceId: 'side', tempTabIds: [99] }),
    ]);
    expect(matched).toBe('work');
  });

  test('higher overlap beats a lower one', () => {
    const matched = matchGroupToSpace(group({ id: 77, memberTabIds: [17, 22, 23] }), [
      candidate({ spaceId: 'work', tempTabIds: [17] }),
      candidate({ spaceId: 'side', tempTabIds: [22, 23] }),
    ]);
    expect(matched).toBe('side');
  });

  test('falls back to title + colour when overlap is zero', () => {
    const matched = matchGroupToSpace(
      group({ id: 77, memberTabIds: [], title: 'Side', color: 'cyan' }),
      [
        candidate({
          spaceId: 'work',
          name: 'Work',
          color: 'blue',
          tempTabIds: [],
        }),
        candidate({
          spaceId: 'side',
          name: 'Side',
          color: 'cyan',
          tempTabIds: [],
        }), // cyan → cyan (1:1, no fold)
      ],
    );
    expect(matched).toBe('side');
  });

  test('no overlap and no title/colour hit → null (a user group is left untouched)', () => {
    const matched = matchGroupToSpace(
      group({ id: 5, memberTabIds: [50], title: 'Mine', color: 'grey' }),
      [
        candidate({
          spaceId: 'work',
          name: 'Work',
          color: 'blue',
          tempTabIds: [17],
        }),
      ],
    );
    expect(matched).toBeNull();
  });

  test('a tie on overlap breaks deterministically by candidate (spaces[]) order', () => {
    const matched = matchGroupToSpace(group({ id: 77, memberTabIds: [17] }), [
      candidate({ spaceId: 'work', tempTabIds: [17] }),
      candidate({ spaceId: 'side', tempTabIds: [17] }),
    ]);
    expect(matched).toBe('work');
  });
});

let chrome: TabGroupsController;
beforeEach(() => {
  chrome = installTabGroupsChrome();
});

function makeStore() {
  let counter = 0;
  return new LunmaStore({ idFactory: () => `id-${++counter}` });
}

describe('reconcileTabGroupsOnBoot — adoption', () => {
  test('a restored group is adopted (re-bound), not rebuilt', async () => {
    const store = makeStore();
    store.state.spaces.push({ id: 'work', name: 'Work', color: 'blue', icon: 'star' });
    store.state.activeSpaceByWindow[100] = 'work';
    store.state.spaceInstancesByWindow[100] = {
      work: { spaceId: 'work', groupId: 12, tempTabIds: [17, 22], tempTabTitles: {} }, // 12 is stale
    };
    for (const id of [17, 22]) store.state.liveTabsById[id] = live(id, 100);
    chrome.addGroup({ id: 77, windowId: 100, collapsed: false });
    chrome.addTab({ id: 17, windowId: 100, groupId: 77 });
    chrome.addTab({ id: 22, windowId: 100, groupId: 77 });

    await reconcileTabGroupsOnBoot(store);

    expect(store.state.spaceInstancesByWindow[100]?.work?.groupId).toBe(77);
    // Re-bind only — no new group was created.
    expect(chrome.calls.some((c) => c.startsWith('tabs.group'))).toBe(false);
  });

  test('an untracked user group is never adopted', async () => {
    const store = makeStore();
    store.state.spaces.push({ id: 'work', name: 'Work', color: 'blue', icon: 'star' });
    store.state.activeSpaceByWindow[100] = 'work';
    store.state.spaceInstancesByWindow[100] = {
      work: { spaceId: 'work', groupId: 77, tempTabIds: [17], tempTabTitles: {} },
    };
    store.state.liveTabsById[17] = live(17, 100);
    chrome.addGroup({ id: 77, windowId: 100, collapsed: false });
    chrome.addTab({ id: 17, windowId: 100, groupId: 77 });
    // The user's own group — overlaps no instance, matches no title/colour.
    chrome.addGroup({ id: 5, windowId: 100, collapsed: false, title: 'Mine', color: 'grey' });
    chrome.addTab({ id: 50, windowId: 100, groupId: 5 });

    await reconcileTabGroupsOnBoot(store);

    // 'work' keeps its already-live group; nothing got re-bound to 5.
    expect(store.state.spaceInstancesByWindow[100]?.work?.groupId).toBe(77);
    expect(chrome.groups.get(5)?.title).toBe('Mine'); // not retitled
  });

  test('two same-title zero-overlap groups bind to at most one Space (claim-guard)', async () => {
    const store = makeStore();
    store.state.spaces.push({ id: 'work', name: 'Work', color: 'blue', icon: 'star' });
    store.state.activeSpaceByWindow[100] = 'work';
    // No temp tabs → zero overlap, so BOTH groups match "work" only by title+colour.
    store.state.spaceInstancesByWindow[100] = {
      work: { spaceId: 'work', groupId: -1, tempTabIds: [], tempTabTitles: {} },
    };
    // Chrome restored two groups both titled "Work" (e.g. one hand-titled by the
    // user to match). They share no tabs with the Space's persisted tempTabIds.
    chrome.addGroup({ id: 77, windowId: 100, collapsed: false, title: 'Work', color: 'blue' });
    chrome.addGroup({ id: 88, windowId: 100, collapsed: false, title: 'Work', color: 'blue' });
    chrome.addTab({ id: 17, windowId: 100, groupId: 77 });
    chrome.addTab({ id: 30, windowId: 100, groupId: 88 });

    await reconcileTabGroupsOnBoot(store);

    // The first group claims "work"; the second is left untracked (never bound).
    expect(store.state.spaceInstancesByWindow[100]?.work?.groupId).toBe(77);
    const heldGroupIds = Object.values(store.state.spaceInstancesByWindow[100] ?? {}).map(
      (i) => i?.groupId,
    );
    expect(heldGroupIds).not.toContain(88);
  });
});

describe('reconcileTabGroupsOnBoot — materialization', () => {
  test('the active Space group is materialized when missing', async () => {
    const store = makeStore();
    store.state.spaces.push({ id: 'work', name: 'Work', color: 'cyan', icon: 'star' });
    store.state.activeSpaceByWindow[100] = 'work';
    store.state.spaceInstancesByWindow[100] = {
      work: { spaceId: 'work', groupId: -1, tempTabIds: [17, 18], tempTabTitles: {} },
    };
    for (const id of [17, 18]) store.state.liveTabsById[id] = live(id, 100);
    chrome.addTab({ id: 17, windowId: 100, groupId: -1 });
    chrome.addTab({ id: 18, windowId: 100, groupId: -1 });

    await reconcileTabGroupsOnBoot(store);

    const groupId = store.state.spaceInstancesByWindow[100]?.work?.groupId;
    expect(groupId).toBeGreaterThan(0);
    expect(chrome.tabs.get(17)?.groupId).toBe(groupId);
    expect(chrome.tabs.get(18)?.groupId).toBe(groupId);
    expect(chrome.groups.get(groupId as number)?.title).toBe('Work');
    expect(chrome.groups.get(groupId as number)?.color).toBe('cyan'); // cyan → cyan (1:1)
  });

  test('materializes the active Space group from a lone home tab at boot', async () => {
    // After Clear + reopen the window's only tab is a home tab. The active Space
    // has no temp/bound tabs, but the home tab is grouped into it so the strip
    // reflects the active Space from load (no orphan ungrouped home tab).
    const store = makeStore();
    store.state.spaces.push({ id: 'work', name: 'Work', color: 'blue', icon: 'star' });
    store.state.activeSpaceByWindow[100] = 'work';
    store.state.spaceInstancesByWindow[100] = {
      work: { spaceId: 'work', groupId: -1, tempTabIds: [], tempTabTitles: {} },
    };
    store.state.liveTabsById[50] = {
      tabId: 50,
      windowId: 100,
      title: '',
      url: 'chrome://newtab/',
      active: true,
      status: 'complete',
    };
    chrome.addTab({ id: 50, windowId: 100, groupId: -1 });

    await reconcileTabGroupsOnBoot(store);

    const groupId = store.state.spaceInstancesByWindow[100]?.work?.groupId;
    expect(groupId).toBeGreaterThan(0);
    expect(chrome.tabs.get(50)?.groupId).toBe(groupId);
    // Grouped, but never listed as a temp tab.
    expect(store.state.spaceInstancesByWindow[100]?.work?.tempTabIds).toEqual([]);
  });

  test('(A) groups ALL home tabs in the window, leaving none orphaned', async () => {
    const store = makeStore();
    store.state.spaces.push({ id: 'work', name: 'Work', color: 'blue', icon: 'star' });
    store.state.activeSpaceByWindow[100] = 'work';
    store.state.spaceInstancesByWindow[100] = {
      work: { spaceId: 'work', groupId: -1, tempTabIds: [], tempTabTitles: {} },
    };
    for (const id of [50, 51]) {
      store.state.liveTabsById[id] = {
        tabId: id,
        windowId: 100,
        title: '',
        url: 'chrome://newtab/',
        active: id === 50,
        status: 'complete',
      };
      chrome.addTab({ id, windowId: 100, groupId: -1 });
    }

    await reconcileTabGroupsOnBoot(store);

    const groupId = store.state.spaceInstancesByWindow[100]?.work?.groupId;
    expect(groupId).toBeGreaterThan(0);
    // BOTH home tabs are grouped — neither is left ungrouped.
    expect(chrome.tabs.get(50)?.groupId).toBe(groupId);
    expect(chrome.tabs.get(51)?.groupId).toBe(groupId);
  });

  test('(A) sweeps a stray ungrouped home tab into the existing live group', async () => {
    const store = makeStore();
    store.state.spaces.push({ id: 'work', name: 'Work', color: 'blue', icon: 'star' });
    store.state.activeSpaceByWindow[100] = 'work';
    // Live group 7 already holds home tab 50; home tab 51 is stray (ungrouped).
    store.state.spaceInstancesByWindow[100] = {
      work: { spaceId: 'work', groupId: 7, tempTabIds: [], tempTabTitles: {} },
    };
    for (const id of [50, 51]) {
      store.state.liveTabsById[id] = {
        tabId: id,
        windowId: 100,
        title: '',
        url: 'chrome://newtab/',
        active: id === 50,
        status: 'complete',
      };
    }
    chrome.addGroup({ id: 7, windowId: 100, collapsed: false });
    chrome.addTab({ id: 50, windowId: 100, groupId: 7 });
    chrome.addTab({ id: 51, windowId: 100, groupId: -1 }); // orphan

    await reconcileTabGroupsOnBoot(store);

    expect(chrome.tabs.get(51)?.groupId).toBe(7); // swept in
    expect(chrome.tabs.get(50)?.groupId).toBe(7); // already there, untouched
  });

  test('(B) a stale persisted groupId still materializes (does not skip)', async () => {
    const store = makeStore();
    store.state.spaces.push({ id: 'work', name: 'Work', color: 'blue', icon: 'star' });
    store.state.activeSpaceByWindow[100] = 'work';
    // groupId 999 is stale — no such Chrome group exists.
    store.state.spaceInstancesByWindow[100] = {
      work: { spaceId: 'work', groupId: 999, tempTabIds: [17], tempTabTitles: {} },
    };
    store.state.liveTabsById[17] = live(17, 100);
    chrome.addTab({ id: 17, windowId: 100, groupId: -1 });

    await reconcileTabGroupsOnBoot(store);

    const groupId = store.state.spaceInstancesByWindow[100]?.work?.groupId;
    expect(groupId).toBeGreaterThan(0);
    expect(groupId).not.toBe(999); // stale id replaced, not skipped
    expect(chrome.tabs.get(17)?.groupId).toBe(groupId);
  });

  test('an empty active Space stays groupless and no tab is opened / focus changed', async () => {
    const store = makeStore();
    store.state.spaces.push({ id: 'work', name: 'Work', color: 'blue', icon: 'star' });
    store.state.activeSpaceByWindow[100] = 'work';
    store.state.spaceInstancesByWindow[100] = {
      work: { spaceId: 'work', groupId: -1, tempTabIds: [], tempTabTitles: {} },
    };

    await reconcileTabGroupsOnBoot(store);

    expect(store.state.spaceInstancesByWindow[100]?.work?.groupId).toBe(-1);
    expect(chrome.calls.some((c) => c.startsWith('tabs.create'))).toBe(false);
    expect(chrome.calls.some((c) => c.startsWith('tabs.update:active'))).toBe(false);
  });

  test('does NOT convert groups when freshInstall is false (default)', async () => {
    const store = makeStore();
    store.state.spaces.push({ id: 'default', name: 'Default', color: 'gray', icon: 'star' });
    store.state.activeSpaceByWindow[100] = 'default';
    store.state.spaceInstancesByWindow[100] = {
      default: { spaceId: 'default', groupId: -1, tempTabIds: [17], tempTabTitles: {} },
    };
    store.state.liveTabsById[17] = live(17, 100);
    chrome.addGroup({ id: 77, windowId: 100, collapsed: false, title: 'Work', color: 'blue' });
    chrome.addTab({ id: 17, windowId: 100, groupId: 77, active: true });

    await reconcileTabGroupsOnBoot(store); // freshInstall defaults to false

    // No new Space minted from the group; only the Default exists.
    expect(store.state.spaces.map((s) => s.name)).toEqual(['Default']);
  });

  test('best-effort declutter skips a collapse Chrome refuses', async () => {
    const store = makeStore();
    store.state.spaces.push(
      { id: 'work', name: 'Work', color: 'blue', icon: 'star' },
      { id: 'side', name: 'Side', color: 'red', icon: 'star' },
    );
    store.state.activeSpaceByWindow[100] = 'work';
    store.state.spaceInstancesByWindow[100] = {
      work: { spaceId: 'work', groupId: -1, tempTabIds: [17], tempTabTitles: {} },
      side: { spaceId: 'side', groupId: 2, tempTabIds: [30], tempTabTitles: {} },
    };
    for (const id of [17, 30]) store.state.liveTabsById[id] = live(id, 100);
    chrome.addTab({ id: 17, windowId: 100, groupId: -1 });
    chrome.addGroup({ id: 2, windowId: 100, collapsed: false });
    chrome.addTab({ id: 30, windowId: 100, groupId: 2 });
    chrome.failGroupUpdate = (id) => id === 2; // Chrome refuses to collapse group 2

    await expect(reconcileTabGroupsOnBoot(store)).resolves.toBeUndefined();

    // The active group still materialized despite the collapse refusal.
    const groupId = store.state.spaceInstancesByWindow[100]?.work?.groupId;
    expect(groupId).toBeGreaterThan(0);
    expect(chrome.groups.get(2)?.collapsed).toBe(false); // refusal skipped, not retried
  });
});

describe('reconcileTabGroupsOnBoot — untracked-group protection (preserve-user-tab-groups)', () => {
  test('the stray-sweep skips a bound member held by an untracked group', async () => {
    const store = makeStore();
    store.state.spaces.push({ id: 'work', name: 'Work', color: 'blue', icon: 'star' });
    store.state.activeSpaceByWindow[100] = 'work';
    store.state.spaceInstancesByWindow[100] = {
      work: { spaceId: 'work', groupId: 77, tempTabIds: [17], tempTabTitles: {} },
    };
    // Bound tab 40, owned by "work", currently sits in the user's untracked group 55.
    store.state.savedTabs['st-1'] = {
      id: 'st-1',
      spaceId: 'work',
      title: 'X',
      originalURL: 'https://x/',
      currentURL: 'https://x/',
    };
    store.state.tabBindings['st-1'] = { 100: 40 };
    for (const id of [17, 40]) store.state.liveTabsById[id] = live(id, 100);
    chrome.addGroup({ id: 77, windowId: 100, collapsed: false, title: 'Work', color: 'blue' });
    chrome.addTab({ id: 17, windowId: 100, groupId: -1 }); // stray, ungrouped
    chrome.addGroup({ id: 55, windowId: 100, collapsed: false, title: 'Mine', color: 'orange' });
    chrome.addTab({ id: 40, windowId: 100, groupId: 55 });

    await reconcileTabGroupsOnBoot(store);

    // Ungrouped member is swept in; the untracked-group member is left alone.
    expect(chrome.tabs.get(17)?.groupId).toBe(77);
    expect(chrome.tabs.get(40)?.groupId).toBe(55);
    expect(chrome.groups.get(55)?.title).toBe('Mine'); // never retitled
  });

  test('a member currently in another TRACKED group is still swept', async () => {
    const store = makeStore();
    store.state.spaces.push(
      { id: 'work', name: 'Work', color: 'blue', icon: 'star' },
      { id: 'side', name: 'Side', color: 'red', icon: 'star' },
    );
    store.state.activeSpaceByWindow[100] = 'work';
    store.state.spaceInstancesByWindow[100] = {
      work: { spaceId: 'work', groupId: 77, tempTabIds: [18], tempTabTitles: {} },
      side: { spaceId: 'side', groupId: 9, tempTabIds: [], tempTabTitles: {} },
    };
    store.state.liveTabsById[18] = live(18, 100);
    chrome.addGroup({ id: 77, windowId: 100, collapsed: false, title: 'Work', color: 'blue' });
    chrome.addGroup({ id: 9, windowId: 100, collapsed: false, title: 'Side', color: 'red' });
    // Tab 18 is a "work" temp tab but currently sits in "side"'s TRACKED group.
    chrome.addTab({ id: 18, windowId: 100, groupId: 9 });

    await reconcileTabGroupsOnBoot(store);

    expect(chrome.tabs.get(18)?.groupId).toBe(77); // swept into work's group, not excluded
  });

  test('a home tab inside an untracked group is not swept, while an ungrouped home tab is', async () => {
    const store = makeStore();
    store.state.spaces.push({ id: 'work', name: 'Work', color: 'blue', icon: 'star' });
    store.state.activeSpaceByWindow[100] = 'work';
    store.state.spaceInstancesByWindow[100] = {
      work: { spaceId: 'work', groupId: 77, tempTabIds: [], tempTabTitles: {} },
    };
    store.state.liveTabsById[50] = {
      tabId: 50,
      windowId: 100,
      title: '',
      url: 'chrome://newtab/',
      active: true,
      status: 'complete',
    };
    store.state.liveTabsById[51] = {
      tabId: 51,
      windowId: 100,
      title: '',
      url: 'chrome://newtab/',
      active: false,
      status: 'complete',
    };
    chrome.addGroup({ id: 77, windowId: 100, collapsed: false, title: 'Work', color: 'blue' });
    chrome.addTab({ id: 50, windowId: 100, groupId: -1, url: 'chrome://newtab/' }); // ungrouped home
    chrome.addGroup({ id: 55, windowId: 100, collapsed: false, title: 'Mine', color: 'orange' });
    chrome.addTab({ id: 51, windowId: 100, groupId: 55, url: 'chrome://newtab/' }); // home in user's group

    await reconcileTabGroupsOnBoot(store);

    expect(chrome.tabs.get(50)?.groupId).toBe(77); // ungrouped home tab swept in
    expect(chrome.tabs.get(51)?.groupId).toBe(55); // home tab in user's group left alone
  });

  test('release strips a lingering temp tab in an untracked group after adoption', async () => {
    const store = makeStore();
    store.state.spaces.push({ id: 'work', name: 'Work', color: 'blue', icon: 'star' });
    store.state.activeSpaceByWindow[100] = 'work';
    // Stale state: tab 30 is still listed as a "work" temp tab, but it now lives
    // in the user's untracked group 55 (e.g. a missed mid-session release event).
    store.state.spaceInstancesByWindow[100] = {
      work: { spaceId: 'work', groupId: 77, tempTabIds: [30], tempTabTitles: { 30: 'Mine' } },
    };
    store.state.liveTabsById[30] = live(30, 100);
    chrome.addGroup({ id: 77, windowId: 100, collapsed: false, title: 'Work', color: 'blue' });
    chrome.addGroup({ id: 55, windowId: 100, collapsed: false, title: 'Mine', color: 'orange' });
    chrome.addTab({ id: 30, windowId: 100, groupId: 55 });

    await reconcileTabGroupsOnBoot(store);

    expect(store.state.spaceInstancesByWindow[100]?.work?.tempTabIds).toEqual([]);
    expect(store.state.spaceInstancesByWindow[100]?.work?.tempTabTitles).toEqual({});
    expect(chrome.tabs.get(30)?.groupId).toBe(55); // never moved
  });

  test('release runs AFTER adoption — a restored tracked group keeps its members', async () => {
    const store = makeStore();
    store.state.spaces.push({ id: 'work', name: 'Work', color: 'blue', icon: 'star' });
    store.state.activeSpaceByWindow[100] = 'work';
    // Persisted groupId 12 is stale (session-scoped ids reset across "restart");
    // Chrome restored the same tabs under a NEW group id, 88.
    store.state.spaceInstancesByWindow[100] = {
      work: { spaceId: 'work', groupId: 12, tempTabIds: [17, 22], tempTabTitles: {} },
    };
    for (const id of [17, 22]) store.state.liveTabsById[id] = live(id, 100);
    chrome.addGroup({ id: 88, windowId: 100, collapsed: false });
    chrome.addTab({ id: 17, windowId: 100, groupId: 88 });
    chrome.addTab({ id: 22, windowId: 100, groupId: 88 });

    await reconcileTabGroupsOnBoot(store);

    // Adoption re-binds 88 to "work" on tab-overlap BEFORE release runs, so
    // release must not treat 88 as untracked and must not strip 17/22.
    expect(store.state.spaceInstancesByWindow[100]?.work?.groupId).toBe(88);
    expect(store.state.spaceInstancesByWindow[100]?.work?.tempTabIds).toEqual([17, 22]);
  });

  test('full-pass repro: a user group of formerly-tracked tabs survives untouched alongside the Space group', async () => {
    const store = makeStore();
    store.state.spaces.push({ id: 'work', name: 'Default', color: 'blue', icon: 'star' });
    store.state.activeSpaceByWindow[100] = 'work';
    // The mid-session release already ran (D6) — 30/31 are no longer temp tabs —
    // but the Space still has its own live group with other tabs.
    store.state.spaceInstancesByWindow[100] = {
      work: { spaceId: 'work', groupId: 77, tempTabIds: [17], tempTabTitles: {} },
    };
    for (const id of [17, 30, 31]) store.state.liveTabsById[id] = live(id, 100);
    chrome.addGroup({ id: 77, windowId: 100, collapsed: false, title: 'Default', color: 'blue' });
    chrome.addTab({ id: 17, windowId: 100, groupId: 77 });
    // The user's own group, same title/colour as the Space's — worst-case collision.
    chrome.addGroup({ id: 55, windowId: 100, collapsed: false, title: 'Default', color: 'blue' });
    chrome.addTab({ id: 30, windowId: 100, groupId: 55 });
    chrome.addTab({ id: 31, windowId: 100, groupId: 55 });

    await reconcileTabGroupsOnBoot(store);

    // Both groups survive, each with its own tabs intact.
    const groupIds = [...chrome.groups.keys()];
    expect(groupIds).toContain(77);
    expect(groupIds).toContain(55);
    expect(chrome.tabs.get(17)?.groupId).toBe(77);
    expect(chrome.tabs.get(30)?.groupId).toBe(55);
    expect(chrome.tabs.get(31)?.groupId).toBe(55);
    expect(store.state.spaceInstancesByWindow[100]?.work?.tempTabIds).toEqual([17]);
  });

  test('a fresh-install same-title group fold is unaffected — release/sweep exclusion are skipped', async () => {
    // Regression guard (design.md D3 "Implementation-discovered refinement"):
    // conversion folds two same-titled groups into ONE Space and assigns BOTH
    // groups' tabs into its tempTabIds; adoption's claim-guard binds only the
    // first group's id. Without the fresh-install exemption, the second
    // group would be wrongly treated as the user's own and its tabs stripped
    // instead of merged — regressing the pre-existing fold behaviour.
    const store = makeStore();
    // No persisted Spaces — freshInstall.
    for (const id of [17, 30]) store.state.liveTabsById[id] = live(id, 100);
    chrome.addGroup({ id: 77, windowId: 100, collapsed: false, title: 'Work', color: 'blue' });
    chrome.addGroup({ id: 88, windowId: 100, collapsed: false, title: 'Work', color: 'red' });
    chrome.addTab({ id: 17, windowId: 100, groupId: 77, active: true });
    chrome.addTab({ id: 30, windowId: 100, groupId: 88 });

    await reconcileTabGroupsOnBoot(store, true);

    const work = store.state.spaces.find((s) => s.name === 'Work');
    expect(work).toBeDefined();
    // Both tabs end up in a single live Chrome group for "Work" — merged, not
    // stripped or left split across two groups.
    const finalGroupId = chrome.tabs.get(17)?.groupId;
    expect(finalGroupId).toBeGreaterThan(0);
    expect(chrome.tabs.get(30)?.groupId).toBe(finalGroupId);
    expect(
      store.state.spaceInstancesByWindow[100]?.[work?.id ?? '']?.tempTabIds.slice().sort(),
    ).toEqual([17, 30]);
  });
});

describe('fromGroupColor', () => {
  test("maps Chrome 'grey' to Lunma 'gray'", () => {
    expect(fromGroupColor('grey')).toBe('gray');
  });
  test('passes through shared colour names', () => {
    expect(fromGroupColor('blue')).toBe('blue');
    expect(fromGroupColor('cyan')).toBe('cyan');
  });
  test('folds unknown / undefined to gray', () => {
    expect(fromGroupColor('chartreuse')).toBe('gray');
    expect(fromGroupColor(undefined)).toBe('gray');
  });
});

describe('reconcileTabGroupsOnBoot — fresh-install conversion', () => {
  /** Simulate the post-seed boot state: a single Default Space holding every open
   * tab (what `ensureAtLeastOneSpace` + `seedExistingTabs` produce). */
  function seedFreshInstall(store: LunmaStore, windowId: number, tabIds: number[]) {
    store.state.spaces.push({ id: 'default', name: 'Default', color: 'gray', icon: 'star' });
    store.state.lastActivatedSpaceId = 'default';
    store.state.activeSpaceByWindow[windowId] = 'default';
    store.state.spaceInstancesByWindow[windowId] = {
      default: { spaceId: 'default', groupId: -1, tempTabIds: [...tabIds], tempTabTitles: {} },
    };
    for (const id of tabIds) store.state.liveTabsById[id] = live(id, windowId);
  }

  test('mints one Space per existing group and discards the emptied Default', async () => {
    const store = makeStore();
    seedFreshInstall(store, 100, [17, 22, 30, 31]);
    chrome.addGroup({ id: 77, windowId: 100, collapsed: false, title: 'Work', color: 'blue' });
    chrome.addGroup({ id: 88, windowId: 100, collapsed: false, title: 'Side', color: 'red' });
    chrome.addTab({ id: 17, windowId: 100, groupId: 77, active: true });
    chrome.addTab({ id: 22, windowId: 100, groupId: 77 });
    chrome.addTab({ id: 30, windowId: 100, groupId: 88 });
    chrome.addTab({ id: 31, windowId: 100, groupId: 88 });

    await reconcileTabGroupsOnBoot(store, true);

    // Two Spaces, no leftover empty Default.
    expect(store.state.spaces.map((s) => s.name).sort()).toEqual(['Side', 'Work']);
    expect(store.state.spaces.find((s) => s.id === 'default')).toBeUndefined();

    const work = store.state.spaces.find((s) => s.name === 'Work');
    const side = store.state.spaces.find((s) => s.name === 'Side');
    const inst = store.state.spaceInstancesByWindow[100];
    expect(inst?.[work?.id ?? '']?.tempTabIds).toEqual([17, 22]);
    expect(inst?.[work?.id ?? '']?.groupId).toBe(77);
    expect(inst?.[side?.id ?? '']?.tempTabIds).toEqual([30, 31]);
    expect(inst?.[side?.id ?? '']?.groupId).toBe(88);
    // The window activates the Space whose group held the active tab (17 → Work).
    expect(store.state.activeSpaceByWindow[100]).toBe(work?.id);
    // Lunma colour derived from the Chrome group colour.
    expect(work?.color).toBe('blue');
    expect(side?.color).toBe('red');
  });

  test('keeps the Default for ungrouped tabs and materializes its group when active', async () => {
    const store = makeStore();
    seedFreshInstall(store, 100, [17, 22, 99]);
    chrome.addGroup({ id: 77, windowId: 100, collapsed: false, title: 'Work', color: 'blue' });
    chrome.addTab({ id: 17, windowId: 100, groupId: 77 });
    chrome.addTab({ id: 22, windowId: 100, groupId: 77 });
    chrome.addTab({ id: 99, windowId: 100, groupId: -1, active: true }); // ungrouped + active

    await reconcileTabGroupsOnBoot(store, true);

    // Default survives (holds the ungrouped tab) alongside the new Work Space.
    expect(store.state.spaces.map((s) => s.name).sort()).toEqual(['Default', 'Work']);
    const inst = store.state.spaceInstancesByWindow[100];
    expect(inst?.default?.tempTabIds).toEqual([99]);
    // Default stays active (active tab is ungrouped) and its group is materialized.
    expect(store.state.activeSpaceByWindow[100]).toBe('default');
    expect(inst?.default?.groupId).toBeGreaterThan(0);
  });

  test('keeps untitled groups separate and numbers them', async () => {
    const store = makeStore();
    seedFreshInstall(store, 100, [17, 22, 30, 31]);
    // Two label-less groups (no title). They must NOT fold together.
    chrome.addGroup({ id: 77, windowId: 100, collapsed: false, color: 'blue' });
    chrome.addGroup({ id: 88, windowId: 100, collapsed: false, color: 'blue' });
    chrome.addTab({ id: 17, windowId: 100, groupId: 77, active: true });
    chrome.addTab({ id: 22, windowId: 100, groupId: 77 });
    chrome.addTab({ id: 30, windowId: 100, groupId: 88 });
    chrome.addTab({ id: 31, windowId: 100, groupId: 88 });

    await reconcileTabGroupsOnBoot(store, true);

    // Two distinct Spaces, numbered, Default discarded.
    expect(store.state.spaces.map((s) => s.name).sort()).toEqual(['Group 1', 'Group 2']);
    const g1 = store.state.spaces.find((s) => s.name === 'Group 1');
    const g2 = store.state.spaces.find((s) => s.name === 'Group 2');
    const inst = store.state.spaceInstancesByWindow[100];
    expect(inst?.[g1?.id ?? '']?.groupId).toBe(77);
    expect(inst?.[g1?.id ?? '']?.tempTabIds).toEqual([17, 22]);
    expect(inst?.[g2?.id ?? '']?.groupId).toBe(88);
    expect(inst?.[g2?.id ?? '']?.tempTabIds).toEqual([30, 31]);
  });

  test('an untitled group does not fold into a titled one of the same colour', async () => {
    const store = makeStore();
    seedFreshInstall(store, 100, [17, 30]);
    chrome.addGroup({ id: 77, windowId: 100, collapsed: false, title: 'Work', color: 'blue' });
    chrome.addGroup({ id: 88, windowId: 100, collapsed: false, color: 'blue' }); // untitled
    chrome.addTab({ id: 17, windowId: 100, groupId: 77, active: true });
    chrome.addTab({ id: 30, windowId: 100, groupId: 88 });

    await reconcileTabGroupsOnBoot(store, true);

    expect(store.state.spaces.map((s) => s.name).sort()).toEqual(['Group 1', 'Work']);
  });

  test('folds same-title+colour groups across windows into one Space', async () => {
    const store = makeStore();
    seedFreshInstall(store, 100, [17]);
    seedFreshInstall(store, 200, [18]);
    chrome.addGroup({ id: 77, windowId: 100, collapsed: false, title: 'Work', color: 'blue' });
    chrome.addGroup({ id: 78, windowId: 200, collapsed: false, title: 'Work', color: 'blue' });
    chrome.addTab({ id: 17, windowId: 100, groupId: 77, active: true });
    chrome.addTab({ id: 18, windowId: 200, groupId: 78, active: true });

    await reconcileTabGroupsOnBoot(store, true);

    const work = store.state.spaces.filter((s) => s.name === 'Work');
    expect(work).toHaveLength(1); // one Space, two window instances
    const id = work[0]?.id ?? '';
    expect(store.state.spaceInstancesByWindow[100]?.[id]?.groupId).toBe(77);
    expect(store.state.spaceInstancesByWindow[200]?.[id]?.groupId).toBe(78);
  });

  test('folds same-name groups of different colours into one Space (first colour wins)', async () => {
    const store = makeStore();
    seedFreshInstall(store, 100, [17, 30]);
    // Same title "Work", different colours. Fold by name → one Space, blue (first).
    chrome.addGroup({ id: 77, windowId: 100, collapsed: false, title: 'Work', color: 'blue' });
    chrome.addGroup({ id: 88, windowId: 100, collapsed: false, title: 'Work', color: 'red' });
    chrome.addTab({ id: 17, windowId: 100, groupId: 77, active: true });
    chrome.addTab({ id: 30, windowId: 100, groupId: 88 });

    await reconcileTabGroupsOnBoot(store, true);

    const work = store.state.spaces.filter((s) => s.name === 'Work');
    expect(work).toHaveLength(1);
    expect(work[0]?.color).toBe('blue'); // first folded group's colour
    const id = work[0]?.id ?? '';
    // Both groups' member tabs belong to the single "Work" instance.
    expect([...(store.state.spaceInstancesByWindow[100]?.[id]?.tempTabIds ?? [])].sort()).toEqual([
      17, 30,
    ]);
  });

  test('folds groups whose titles differ only by case/whitespace into one Space', async () => {
    const store = makeStore();
    seedFreshInstall(store, 100, [17, 30]);
    chrome.addGroup({ id: 77, windowId: 100, collapsed: false, title: 'Work', color: 'blue' });
    chrome.addGroup({ id: 88, windowId: 100, collapsed: false, title: '  work ', color: 'blue' });
    chrome.addTab({ id: 17, windowId: 100, groupId: 77, active: true });
    chrome.addTab({ id: 30, windowId: 100, groupId: 88 });

    await reconcileTabGroupsOnBoot(store, true);

    // "Work" and "  work " normalize alike → one Space (keeps the first's title).
    expect(store.state.spaces.map((s) => s.name)).toEqual(['Work']);
  });

  test('disambiguates a minted name that collides with a pre-existing Default', async () => {
    const store = makeStore();
    // The auto-created Default is (unusually) named "Group 1"; an untitled group
    // would mint "Group 1" too — disambiguation makes it "Group 1 2" instead of
    // throwing. The Default is kept here because it still holds an ungrouped tab.
    store.state.spaces.push({ id: 'default', name: 'Group 1', color: 'gray', icon: 'star' });
    store.state.lastActivatedSpaceId = 'default';
    store.state.activeSpaceByWindow[100] = 'default';
    store.state.spaceInstancesByWindow[100] = {
      default: { spaceId: 'default', groupId: -1, tempTabIds: [17, 99], tempTabTitles: {} },
    };
    for (const id of [17, 99]) store.state.liveTabsById[id] = live(id, 100);
    chrome.addGroup({ id: 88, windowId: 100, collapsed: false }); // untitled → "Group 1"
    chrome.addTab({ id: 17, windowId: 100, groupId: 88 });
    chrome.addTab({ id: 99, windowId: 100, groupId: -1, active: true }); // ungrouped keeps Default

    await reconcileTabGroupsOnBoot(store, true);

    const names = store.state.spaces.map((s) => s.name).sort();
    expect(names).toEqual(['Group 1', 'Group 1 2']);
  });

  test('untitled "Group N" numbering is unchanged', async () => {
    const store = makeStore();
    seedFreshInstall(store, 100, [17, 22, 30, 31]);
    chrome.addGroup({ id: 77, windowId: 100, collapsed: false }); // untitled
    chrome.addGroup({ id: 88, windowId: 100, collapsed: false }); // untitled
    chrome.addTab({ id: 17, windowId: 100, groupId: 77, active: true });
    chrome.addTab({ id: 22, windowId: 100, groupId: 77 });
    chrome.addTab({ id: 30, windowId: 100, groupId: 88 });
    chrome.addTab({ id: 31, windowId: 100, groupId: 88 });

    await reconcileTabGroupsOnBoot(store, true);

    expect(store.state.spaces.map((s) => s.name).sort()).toEqual(['Group 1', 'Group 2']);
  });

  test('a group titled "Default" folds into the auto-created Default (no "Default 2")', async () => {
    const store = makeStore();
    // The auto-created Default holds the to-be-folded group's tabs (17, 22) plus
    // an ungrouped, active tab (99) that keeps it alive.
    seedFreshInstall(store, 100, [17, 22, 99]);
    chrome.addGroup({ id: 77, windowId: 100, collapsed: false, title: 'Default', color: 'blue' });
    chrome.addTab({ id: 17, windowId: 100, groupId: 77 });
    chrome.addTab({ id: 22, windowId: 100, groupId: 77 });
    chrome.addTab({ id: 99, windowId: 100, groupId: -1, active: true }); // ungrouped keeps Default

    await reconcileTabGroupsOnBoot(store, true);

    // Exactly ONE "Default" — the titled group folded in rather than minting "Default 2".
    expect(store.state.spaces.map((s) => s.name)).toEqual(['Default']);
    const inst = store.state.spaceInstancesByWindow[100];
    // The Default now holds the folded group's tabs (bound to 77) and keeps tab 99.
    expect(inst?.default?.groupId).toBe(77);
    expect([...(inst?.default?.tempTabIds ?? [])].sort((a, b) => a - b)).toEqual([17, 22, 99]);
  });

  test('an unavailable read (freshInstall=false, empty store) converts no groups', async () => {
    const store = makeStore();
    // An `unavailable` boot leaves an empty in-memory store and freshInstall=false
    // (computed in index.ts), so conversion must NOT run over the user's groups.
    chrome.addGroup({ id: 77, windowId: 100, collapsed: false, title: 'Work', color: 'blue' });
    chrome.addTab({ id: 17, windowId: 100, groupId: 77, active: true });

    await reconcileTabGroupsOnBoot(store, false);

    // No Space minted from the group; the store stays empty (on-disk left intact).
    expect(store.state.spaces).toEqual([]);
  });

  test('a recovery boot recovers a "Work" Space from a restored group title without poisoning it', async () => {
    const store = makeStore();
    // Recovery boot (outcome 'recovered'): the empty store was seeded a Default by
    // ensureAtLeastOneSpace, and seedExistingTabs lumped the restored group's tabs
    // into it. Conversion must claim the restored "Work" group for its own Space
    // BEFORE the Default could bind+retitle it (design D7).
    seedFreshInstall(store, 100, [17, 22]);
    chrome.addGroup({ id: 77, windowId: 100, collapsed: false, title: 'Work', color: 'blue' });
    chrome.addTab({ id: 17, windowId: 100, groupId: 77, active: true });
    chrome.addTab({ id: 22, windowId: 100, groupId: 77 });

    await reconcileTabGroupsOnBoot(store, true);

    // A "Work" Space holding the group's tabs; the empty auto-Default is discarded.
    expect(store.state.spaces.map((s) => s.name)).toEqual(['Work']);
    expect(store.state.spaces.find((s) => s.name === 'Default')).toBeUndefined();
    // The group is NOT retitled to "Default" (poisoning is unreachable).
    expect(chrome.groups.get(77)?.title).toBe('Work');
    const work = store.state.spaces.find((s) => s.name === 'Work');
    expect(store.state.spaceInstancesByWindow[100]?.[work?.id ?? '']?.groupId).toBe(77);
  });
});

describe('reconcileTabGroupsOnBoot — favorite ungroup reconciliation (D4)', () => {
  test('a favorite restored still grouped is ungrouped at boot', async () => {
    const store = makeStore();
    store.state.spaces.push({ id: 'work', name: 'Work', color: 'blue', icon: 'star' });
    store.state.activeSpaceByWindow[100] = 'work';
    store.state.spaceInstancesByWindow[100] = {
      work: { spaceId: 'work', groupId: 77, tempTabIds: [17], tempTabTitles: {} },
    };
    // A global favorite bound to tab 42 in window 100, which Chrome restored
    // still inside "work"'s restored group 77.
    store.state.savedTabs.fav = {
      id: 'fav',
      spaceId: null,
      title: 'GitHub',
      originalURL: 'https://github.com/',
      currentURL: 'https://github.com/',
    };
    store.state.tabBindings.fav = { 100: 42 };
    store.state.faviconRow = ['fav'];
    for (const id of [17, 42]) store.state.liveTabsById[id] = live(id, 100);
    chrome.addGroup({ id: 77, windowId: 100, collapsed: false });
    chrome.addTab({ id: 17, windowId: 100, groupId: 77 });
    chrome.addTab({ id: 42, windowId: 100, groupId: 77 }); // favorite restored grouped

    await reconcileTabGroupsOnBoot(store);

    // The favorite's tab is ungrouped; the Space group + its real member survive.
    expect(chrome.tabs.get(42)?.groupId).toBe(-1);
    expect(chrome.calls).toContain('tabs.ungroup:[42]');
    expect(store.state.spaceInstancesByWindow[100]?.work?.groupId).toBe(77);
    expect(chrome.tabs.get(17)?.groupId).toBe(77);
  });

  test('a favorite restored already ungrouped is a no-op', async () => {
    const store = makeStore();
    store.state.spaces.push({ id: 'work', name: 'Work', color: 'blue', icon: 'star' });
    store.state.activeSpaceByWindow[100] = 'work';
    store.state.spaceInstancesByWindow[100] = {
      work: { spaceId: 'work', groupId: 77, tempTabIds: [17], tempTabTitles: {} },
    };
    store.state.savedTabs.fav = {
      id: 'fav',
      spaceId: null,
      title: 'GitHub',
      originalURL: 'https://github.com/',
      currentURL: 'https://github.com/',
    };
    store.state.tabBindings.fav = { 100: 43 };
    store.state.faviconRow = ['fav'];
    for (const id of [17, 43]) store.state.liveTabsById[id] = live(id, 100);
    chrome.addGroup({ id: 77, windowId: 100, collapsed: false });
    chrome.addTab({ id: 17, windowId: 100, groupId: 77 });
    chrome.addTab({ id: 43, windowId: 100, groupId: -1 }); // favorite already global

    await reconcileTabGroupsOnBoot(store);

    expect(chrome.calls.some((c) => c === 'tabs.ungroup:[43]')).toBe(false);
    expect(chrome.tabs.get(43)?.groupId).toBe(-1);
  });
});

describe('reconcileTabGroupsOnBoot — duplicate-Space cleanup (D9)', () => {
  test('a duplicate exposed only after the boot group query is cleaned up before the broadcast', async () => {
    const store = makeStore();
    // The current "Default" holds an open tab; the leftover empty one is a
    // duplicate from a prior boot's fresh-install conversion that missed
    // folding a stale Chrome group whose window had not finished restoring.
    store.state.spaces.push(
      { id: 'current', name: 'Default', color: 'gray', icon: 'star' },
      { id: 'stale', name: 'Default', color: 'gray', icon: 'star' },
    );
    store.state.activeSpaceByWindow[100] = 'current';
    store.state.spaceInstancesByWindow[100] = {
      current: { spaceId: 'current', groupId: -1, tempTabIds: [17], tempTabTitles: {} },
    };
    store.state.liveTabsById[17] = live(17, 100);

    await reconcileTabGroupsOnBoot(store);

    expect(store.state.spaces.map((s) => s.id)).toEqual(['current']);
  });

  test('a two-content-holding-Spaces pair is left untouched by this step', async () => {
    const store = makeStore();
    store.state.spaces.push(
      { id: 's1', name: 'Default', color: 'gray', icon: 'star' },
      { id: 's2', name: 'Default', color: 'gray', icon: 'star' },
    );
    store.state.activeSpaceByWindow[100] = 's1';
    store.state.activeSpaceByWindow[200] = 's2';
    store.state.spaceInstancesByWindow[100] = {
      s1: { spaceId: 's1', groupId: -1, tempTabIds: [17], tempTabTitles: {} },
    };
    store.state.spaceInstancesByWindow[200] = {
      s2: { spaceId: 's2', groupId: -1, tempTabIds: [30], tempTabTitles: {} },
    };
    store.state.liveTabsById[17] = live(17, 100);
    store.state.liveTabsById[30] = live(30, 200);

    await reconcileTabGroupsOnBoot(store);

    // Both Spaces survive, still named "Default" — the boot pass never renames.
    expect(store.state.spaces.map((s) => s.id).sort()).toEqual(['s1', 's2']);
    expect(store.state.spaces.every((s) => s.name === 'Default')).toBe(true);
  });

  test('a no-op when state.spaces has no name collisions', async () => {
    const store = makeStore();
    store.state.spaces.push(
      { id: 'work', name: 'Work', color: 'blue', icon: 'star' },
      { id: 'side', name: 'Side', color: 'red', icon: 'star' },
    );
    store.state.activeSpaceByWindow[100] = 'work';

    await reconcileTabGroupsOnBoot(store);

    expect(store.state.spaces.map((s) => s.id)).toEqual(['work', 'side']);
  });

  test('the last-remaining-Space guard is exercised (no-op in practice)', async () => {
    const store = makeStore();
    // Only one Space exists — no collision group is possible — but this
    // asserts `removeEmptySpace`'s own last-Space refusal is never bypassed
    // by this step even if grouping/partition ever disagreed.
    store.state.spaces.push({ id: 'only', name: 'Default', color: 'gray', icon: 'star' });
    store.state.activeSpaceByWindow[100] = 'only';

    await reconcileTabGroupsOnBoot(store);

    expect(store.state.spaces.map((s) => s.id)).toEqual(['only']);
  });
});
