import { beforeEach, describe, expect, test } from 'vitest';
import type { LiveTab, Space, SpaceColor } from '../shared/types';
import { makeCoordinator, sidebar, tabCreated, tabUpdated } from './coordinator.test-helpers';
import { installTabGroupsChrome, type TabGroupsController } from './tab-groups.test-helpers';

const NEWTAB = 'chrome://newtab/';

function space(id: string, name = id, color: SpaceColor = 'blue'): Space {
  return { id, name, color, icon: 'star' };
}

function live(
  tabId: number,
  windowId: number,
  opts: { url?: string; active?: boolean } = {},
): LiveTab {
  return {
    tabId,
    windowId,
    title: '',
    url: opts.url ?? '',
    active: opts.active ?? false,
    status: 'complete',
  };
}

let chrome: TabGroupsController;
beforeEach(() => {
  chrome = installTabGroupsChrome();
});

describe('home tabs (Lunma new-tab page)', () => {
  // Chrome reports `chrome://newtab/`; other Chromium forks report their own
  // internal scheme transiently before the override resolves (Edge → `edge://`).
  test.each([
    'chrome://newtab/',
    'edge://newtab/',
  ])('a created home tab (%s) is grouped into the active Space but NOT listed as temp', async (newtabUrl) => {
    const { coordinator, store } = makeCoordinator();
    store.state.spaces.push(space('work'));
    store.state.activeSpaceByWindow[100] = 'work';
    store.state.spaceInstancesByWindow[100] = {
      work: { spaceId: 'work', groupId: 1, tempTabIds: [], tempTabTitles: {} },
    };
    chrome.addGroup({ id: 1, windowId: 100, collapsed: false });
    chrome.addTab({ id: 50, windowId: 100, groupId: -1 });

    coordinator.enqueue(tabCreated(50, 100, newtabUrl));
    await coordinator.idle();

    // Grouped (window shows it) but never adopted into the Temporary list.
    expect(chrome.tabs.get(50)?.groupId).toBe(1);
    expect(store.state.spaceInstancesByWindow[100]?.work?.tempTabIds).not.toContain(50);
  });

  test('navigating a home tab to a real URL adopts it as a temporary tab', async () => {
    const { coordinator, store } = makeCoordinator();
    store.state.spaces.push(space('work'));
    store.state.activeSpaceByWindow[100] = 'work';
    store.state.spaceInstancesByWindow[100] = {
      work: { spaceId: 'work', groupId: 1, tempTabIds: [], tempTabTitles: {} },
    };
    // A home tab already grouped into work, present in liveTabsById, unlisted.
    store.state.liveTabsById[50] = live(50, 100, { url: NEWTAB });
    chrome.addGroup({ id: 1, windowId: 100, collapsed: false });
    chrome.addTab({ id: 50, windowId: 100, groupId: 1 });

    coordinator.enqueue(tabUpdated(50, { url: 'https://example.com/' }));
    await coordinator.idle();

    expect(store.state.spaceInstancesByWindow[100]?.work?.tempTabIds).toContain(50);
    expect(chrome.tabs.get(50)?.groupId).toBe(1);
  });

  test('navigating an already-listed temp tab does not regroup it', async () => {
    const { coordinator, store } = makeCoordinator();
    store.state.spaces.push(space('work'));
    store.state.activeSpaceByWindow[100] = 'work';
    store.state.spaceInstancesByWindow[100] = {
      work: { spaceId: 'work', groupId: 1, tempTabIds: [17], tempTabTitles: {} },
    };
    store.state.liveTabsById[17] = live(17, 100, { url: 'https://a/' });
    chrome.addGroup({ id: 1, windowId: 100, collapsed: false });
    chrome.addTab({ id: 17, windowId: 100, groupId: 1 });

    coordinator.enqueue(tabUpdated(17, { url: 'https://b/' }));
    await coordinator.idle();

    // Already tracked → no redundant tabs.group call from the onUpdated path.
    expect(chrome.calls.some((c) => c.startsWith('tabs.group'))).toBe(false);
    expect(store.state.spaceInstancesByWindow[100]?.work?.tempTabIds).toEqual([17]);
  });

  test('entering an empty Space reuses the focused home tab (no second create)', async () => {
    const { coordinator, store } = makeCoordinator();
    store.state.spaces.push(space('work'), space('reading'));
    store.state.activeSpaceByWindow[100] = 'work';
    store.state.spaceInstancesByWindow[100] = {
      // 'work' is itself home-only: its only tab is the focused home tab 50.
      work: { spaceId: 'work', groupId: 7, tempTabIds: [], tempTabTitles: {} },
      reading: { spaceId: 'reading', groupId: -1, tempTabIds: [], tempTabTitles: {} },
    };
    store.state.liveTabsById[50] = live(50, 100, { url: NEWTAB, active: true });
    chrome.addGroup({ id: 7, windowId: 100, collapsed: false });
    chrome.addTab({ id: 50, windowId: 100, groupId: 7, active: true, url: NEWTAB });

    coordinator.enqueue(
      sidebar({ kind: 'activateSpace', payload: { windowId: 100, spaceId: 'reading' } }, 'c1'),
    );
    await coordinator.idle();

    // No new tab was created — the focused home tab was reused.
    expect(chrome.calls.some((c) => c.startsWith('tabs.create'))).toBe(false);
    const readingGroup = store.state.spaceInstancesByWindow[100]?.reading?.groupId;
    expect(readingGroup).toBeGreaterThan(0);
    // Reading's group contains exactly that one home tab.
    expect(chrome.tabs.get(50)?.groupId).toBe(readingGroup);
    const inGroup = [...chrome.tabs.values()].filter((t) => t.groupId === readingGroup);
    expect(inGroup.map((t) => t.id)).toEqual([50]);
    // The reused home tab is never listed as a temp tab.
    expect(store.state.spaceInstancesByWindow[100]?.reading?.tempTabIds).toEqual([]);
  });

  test('entering an empty Space reuses a home tab the SW mirror has not caught up on', async () => {
    // The race behind duplicate New Tabs: a home tab exists in Chrome but its
    // tabs.onCreated has not drained yet, so liveTabsById (the mirror) does not
    // know about it. A mirror-based reuse check would miss it and spawn a
    // SECOND home tab; the authoritative query reuses the live one.
    const { coordinator, store } = makeCoordinator();
    store.state.spaces.push(space('work'), space('reading'));
    store.state.activeSpaceByWindow[100] = 'work';
    store.state.spaceInstancesByWindow[100] = {
      work: { spaceId: 'work', groupId: 1, tempTabIds: [17], tempTabTitles: {} },
      reading: { spaceId: 'reading', groupId: -1, tempTabIds: [], tempTabTitles: {} },
    };
    // Mirror knows only the real tab 17 — NOT the live home tab 50 in Chrome.
    store.state.liveTabsById[17] = live(17, 100, { url: 'https://a/' });
    chrome.addGroup({ id: 1, windowId: 100, collapsed: false });
    chrome.addTab({ id: 17, windowId: 100, groupId: 1, active: true });
    chrome.addTab({ id: 50, windowId: 100, groupId: -1, url: NEWTAB });

    coordinator.enqueue(
      sidebar({ kind: 'activateSpace', payload: { windowId: 100, spaceId: 'reading' } }, 'c1'),
    );
    await coordinator.idle();

    // No second home tab was spawned — the live one was reused despite the
    // stale mirror, and the window still has exactly one home tab.
    expect(chrome.calls.some((c) => c.startsWith('tabs.create'))).toBe(false);
    const homeTabs = [...chrome.tabs.values()].filter((t) => t.url === NEWTAB);
    expect(homeTabs.map((t) => t.id)).toEqual([50]);
    const readingGroup = store.state.spaceInstancesByWindow[100]?.reading?.groupId;
    expect(readingGroup).toBeGreaterThan(0);
    expect(chrome.tabs.get(50)?.groupId).toBe(readingGroup);
  });

  test('entering an empty Space collapses duplicate home tabs to one', async () => {
    // A prior race left TWO home tabs in the window. Activation must self-heal:
    // keep the active one, close the rest, restoring "≤1 home tab per window".
    const { coordinator, store } = makeCoordinator();
    store.state.spaces.push(space('work'), space('reading'));
    store.state.activeSpaceByWindow[100] = 'work';
    store.state.spaceInstancesByWindow[100] = {
      work: { spaceId: 'work', groupId: 1, tempTabIds: [17], tempTabTitles: {} },
      reading: { spaceId: 'reading', groupId: -1, tempTabIds: [], tempTabTitles: {} },
    };
    store.state.liveTabsById[17] = live(17, 100, { url: 'https://a/' });
    chrome.addGroup({ id: 1, windowId: 100, collapsed: false });
    chrome.addTab({ id: 17, windowId: 100, groupId: 1 });
    // Two stray home tabs from an earlier race; 50 is the active (focused) one.
    chrome.addTab({ id: 50, windowId: 100, groupId: -1, active: true, url: NEWTAB });
    chrome.addTab({ id: 51, windowId: 100, groupId: -1, url: NEWTAB });

    coordinator.enqueue(
      sidebar({ kind: 'activateSpace', payload: { windowId: 100, spaceId: 'reading' } }, 'c1'),
    );
    await coordinator.idle();

    // The duplicate is closed; exactly one home tab remains, reused (not created).
    expect(chrome.calls.some((c) => c.startsWith('tabs.create'))).toBe(false);
    expect(chrome.tabs.has(51)).toBe(false);
    const homeTabs = [...chrome.tabs.values()].filter((t) => t.url === NEWTAB);
    expect(homeTabs.map((t) => t.id)).toEqual([50]);
    const readingGroup = store.state.spaceInstancesByWindow[100]?.reading?.groupId;
    expect(chrome.tabs.get(50)?.groupId).toBe(readingGroup);
  });

  test('leaving a home-only Space closes its home tab and resets groupId to -1', async () => {
    const { coordinator, store } = makeCoordinator();
    store.state.spaces.push(space('work'), space('reading'));
    store.state.activeSpaceByWindow[100] = 'reading';
    store.state.spaceInstancesByWindow[100] = {
      // 'reading' is home-only (home tab 50); 'work' has a real temp tab 17.
      reading: { spaceId: 'reading', groupId: 7, tempTabIds: [], tempTabTitles: {} },
      work: { spaceId: 'work', groupId: 1, tempTabIds: [17], tempTabTitles: {} },
    };
    store.state.liveTabsById[50] = live(50, 100, { url: NEWTAB, active: true });
    store.state.liveTabsById[17] = live(17, 100, { url: 'https://a/' });
    chrome.addGroup({ id: 7, windowId: 100, collapsed: false });
    chrome.addGroup({ id: 1, windowId: 100, collapsed: true });
    chrome.addTab({ id: 50, windowId: 100, groupId: 7, active: true });
    chrome.addTab({ id: 17, windowId: 100, groupId: 1 });

    coordinator.enqueue(
      sidebar({ kind: 'activateSpace', payload: { windowId: 100, spaceId: 'work' } }, 'c1'),
    );
    await coordinator.idle();

    // Reading's home tab is closed; Reading returns to "no live group".
    expect(chrome.tabs.has(50)).toBe(false);
    expect(store.state.spaceInstancesByWindow[100]?.reading?.groupId).toBe(-1);
    // Work is shown (expanded) and keeps its real tab.
    expect(chrome.groups.get(1)?.collapsed).toBe(false);
    expect(chrome.tabs.has(17)).toBe(true);
  });

  test('New Tab focuses an existing home tab instead of creating a second', async () => {
    const { coordinator, store } = makeCoordinator();
    store.state.spaces.push(space('work'));
    store.state.activeSpaceByWindow[100] = 'work';
    store.state.spaceInstancesByWindow[100] = {
      work: { spaceId: 'work', groupId: 7, tempTabIds: [], tempTabTitles: {} },
    };
    // An unused home tab already open in the window.
    store.state.liveTabsById[50] = live(50, 100, { url: NEWTAB });
    chrome.addGroup({ id: 7, windowId: 100, collapsed: false });
    chrome.addTab({ id: 50, windowId: 100, groupId: 7 });

    coordinator.enqueue(sidebar({ kind: 'newTab', payload: { windowId: 100 } }, 'c1'));
    await coordinator.idle();

    // No second tab created — the existing home tab is focused instead.
    expect(chrome.calls.some((c) => c.startsWith('tabs.create'))).toBe(false);
    expect(chrome.calls).toContain('tabs.update:active:50');
  });

  test('New Tab creates a tab when the window has no home tab', async () => {
    const { coordinator, store } = makeCoordinator();
    store.state.spaces.push(space('work'));
    store.state.activeSpaceByWindow[100] = 'work';
    store.state.spaceInstancesByWindow[100] = {
      work: { spaceId: 'work', groupId: 7, tempTabIds: [17], tempTabTitles: {} },
    };
    store.state.liveTabsById[17] = live(17, 100, { url: 'https://a/' });
    chrome.addGroup({ id: 7, windowId: 100, collapsed: false });
    chrome.addTab({ id: 17, windowId: 100, groupId: 7 });

    coordinator.enqueue(sidebar({ kind: 'newTab', payload: { windowId: 100 } }, 'c1'));
    await coordinator.idle();

    expect(chrome.calls.some((c) => c.startsWith('tabs.create:100'))).toBe(true);
  });

  test('Clear leaving the window empty lands on a home tab that is NOT listed', async () => {
    // After Clear closes the last temp tab, Chrome spawns its window-can't-be-
    // empty NTP — which is now the Lunma home. It must be grouped into the
    // active Space but never re-added to the Temporary list.
    const { coordinator, store } = makeCoordinator();
    store.state.spaces.push(space('work'));
    store.state.activeSpaceByWindow[100] = 'work';
    store.state.spaceInstancesByWindow[100] = {
      work: { spaceId: 'work', groupId: -1, tempTabIds: [], tempTabTitles: {} },
    };
    chrome.addTab({ id: 50, windowId: 100, groupId: -1 });

    coordinator.enqueue(tabCreated(50, 100, NEWTAB));
    await coordinator.idle();

    expect(store.state.spaceInstancesByWindow[100]?.work?.tempTabIds).toEqual([]);
    const groupId = store.state.spaceInstancesByWindow[100]?.work?.groupId;
    expect(groupId).toBeGreaterThan(0);
    expect(chrome.tabs.get(50)?.groupId).toBe(groupId);
  });
});
