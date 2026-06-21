import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { LiveTab, Space, SpaceColor } from '../shared/types';
import type { PendingEvent } from './coordinator';
import { makeCoordinator, sidebar, tabActivated, tabCreated } from './coordinator.test-helpers';
import { installTabGroupsChrome, type TabGroupsController } from './tab-groups.test-helpers';

function space(id: string, name = id, color: SpaceColor = 'blue'): Space {
  return { id, name, color, icon: 'star' };
}

function groupRemoved(groupId: number): PendingEvent {
  return { source: 'chrome', kind: 'tabGroups.onRemoved', payload: { groupId } };
}

function groupUpdated(group: { id: number; title?: string; color?: string }): PendingEvent {
  return {
    source: 'chrome',
    kind: 'tabGroups.onUpdated',
    payload: { group: group as chrome.tabGroups.TabGroup },
  };
}

function live(tabId: number, windowId: number): LiveTab {
  return { tabId, windowId, title: '', url: '', active: false, status: 'complete' };
}

let chrome: TabGroupsController;
beforeEach(() => {
  chrome = installTabGroupsChrome();
});

describe('activation orchestration (Space tab groups)', () => {
  test('activates a tab in the incoming group BEFORE collapsing the outgoing one', async () => {
    const { coordinator, store } = makeCoordinator();
    store.state.spaces.push(space('work'), space('side'));
    store.state.activeSpaceByWindow[100] = 'work';
    store.state.spaceInstancesByWindow[100] = {
      work: { spaceId: 'work', groupId: 1, tempTabIds: [17, 22], tempTabTitles: {} },
      side: { spaceId: 'side', groupId: 2, tempTabIds: [30], tempTabTitles: {} },
    };
    for (const id of [17, 22, 30]) store.state.liveTabsById[id] = live(id, 100);
    chrome.addGroup({ id: 1, windowId: 100, collapsed: false });
    chrome.addGroup({ id: 2, windowId: 100, collapsed: true });
    chrome.addTab({ id: 17, windowId: 100, groupId: 1 });
    chrome.addTab({ id: 22, windowId: 100, groupId: 1 });
    chrome.addTab({ id: 30, windowId: 100, groupId: 2 });

    coordinator.enqueue(
      sidebar({ kind: 'activateSpace', payload: { windowId: 100, spaceId: 'side' } }, 'c1'),
    );
    await coordinator.idle();

    expect(chrome.groups.get(2)?.collapsed).toBe(false); // incoming expanded
    expect(chrome.groups.get(1)?.collapsed).toBe(true); // outgoing collapsed
    const activateIdx = chrome.calls.indexOf('tabs.update:active:30');
    const collapseIdx = chrome.calls.indexOf('tabGroups.update:collapsed=true:1');
    expect(activateIdx).toBeGreaterThanOrEqual(0);
    expect(collapseIdx).toBeGreaterThan(activateIdx);
  });

  test('reuses a live persisted groupId without rebuilding', async () => {
    const { coordinator, store } = makeCoordinator();
    store.state.spaces.push(space('work'), space('side'));
    store.state.activeSpaceByWindow[100] = 'work';
    store.state.spaceInstancesByWindow[100] = {
      work: { spaceId: 'work', groupId: 1, tempTabIds: [17], tempTabTitles: {} },
      side: { spaceId: 'side', groupId: 2, tempTabIds: [30], tempTabTitles: {} },
    };
    for (const id of [17, 30]) store.state.liveTabsById[id] = live(id, 100);
    chrome.addGroup({ id: 1, windowId: 100, collapsed: false });
    chrome.addGroup({ id: 2, windowId: 100, collapsed: true });
    chrome.addTab({ id: 17, windowId: 100, groupId: 1 });
    chrome.addTab({ id: 30, windowId: 100, groupId: 2 });

    coordinator.enqueue(
      sidebar({ kind: 'activateSpace', payload: { windowId: 100, spaceId: 'side' } }, 'c1'),
    );
    await coordinator.idle();

    expect(chrome.calls.some((c) => c.startsWith('tabs.group'))).toBe(false);
    expect(store.state.spaceInstancesByWindow[100]?.side?.groupId).toBe(2);
  });

  test('rebuilds the group when the persisted groupId is stale', async () => {
    const { coordinator, store } = makeCoordinator();
    store.state.spaces.push(space('work'), space('side'));
    store.state.activeSpaceByWindow[100] = 'work';
    store.state.spaceInstancesByWindow[100] = {
      work: { spaceId: 'work', groupId: 1, tempTabIds: [17], tempTabTitles: {} },
      side: { spaceId: 'side', groupId: 999, tempTabIds: [30, 31], tempTabTitles: {} },
    };
    for (const id of [17, 30, 31]) store.state.liveTabsById[id] = live(id, 100);
    chrome.addGroup({ id: 1, windowId: 100, collapsed: false });
    chrome.addTab({ id: 17, windowId: 100, groupId: 1 });
    chrome.addTab({ id: 30, windowId: 100, groupId: -1 });
    chrome.addTab({ id: 31, windowId: 100, groupId: -1 });

    coordinator.enqueue(
      sidebar({ kind: 'activateSpace', payload: { windowId: 100, spaceId: 'side' } }, 'c1'),
    );
    await coordinator.idle();

    const newGroupId = store.state.spaceInstancesByWindow[100]?.side?.groupId;
    expect(newGroupId).toBeGreaterThan(0);
    expect(newGroupId).not.toBe(999);
    expect(chrome.tabs.get(30)?.groupId).toBe(newGroupId);
    expect(chrome.tabs.get(31)?.groupId).toBe(newGroupId);
  });

  test('never collapses an untracked (user-created) group', async () => {
    const { coordinator, store } = makeCoordinator();
    store.state.spaces.push(space('work'), space('side'));
    store.state.activeSpaceByWindow[100] = 'work';
    store.state.spaceInstancesByWindow[100] = {
      work: { spaceId: 'work', groupId: 1, tempTabIds: [17], tempTabTitles: {} },
      side: { spaceId: 'side', groupId: 2, tempTabIds: [30], tempTabTitles: {} },
    };
    for (const id of [17, 30]) store.state.liveTabsById[id] = live(id, 100);
    chrome.addGroup({ id: 1, windowId: 100, collapsed: false });
    chrome.addGroup({ id: 2, windowId: 100, collapsed: true });
    chrome.addGroup({ id: 5, windowId: 100, collapsed: false }); // user's own group
    chrome.addTab({ id: 17, windowId: 100, groupId: 1 });
    chrome.addTab({ id: 30, windowId: 100, groupId: 2 });

    coordinator.enqueue(
      sidebar({ kind: 'activateSpace', payload: { windowId: 100, spaceId: 'side' } }, 'c1'),
    );
    await coordinator.idle();

    expect(chrome.groups.get(5)?.collapsed).toBe(false); // untouched
    expect(chrome.groups.get(1)?.collapsed).toBe(true);
  });

  test('titles + recolours the activated group with the Space identity', async () => {
    const { coordinator, store } = makeCoordinator();
    store.state.spaces.push(space('work', 'Work'), space('side', 'Side', 'cyan'));
    store.state.activeSpaceByWindow[100] = 'work';
    store.state.spaceInstancesByWindow[100] = {
      work: { spaceId: 'work', groupId: 1, tempTabIds: [17], tempTabTitles: {} },
      side: { spaceId: 'side', groupId: 2, tempTabIds: [30], tempTabTitles: {} },
    };
    for (const id of [17, 30]) store.state.liveTabsById[id] = live(id, 100);
    chrome.addGroup({ id: 1, windowId: 100, collapsed: false });
    chrome.addGroup({ id: 2, windowId: 100, collapsed: true });
    chrome.addTab({ id: 17, windowId: 100, groupId: 1 });
    chrome.addTab({ id: 30, windowId: 100, groupId: 2 });

    coordinator.enqueue(
      sidebar({ kind: 'activateSpace', payload: { windowId: 100, spaceId: 'side' } }, 'c1'),
    );
    await coordinator.idle();

    expect(chrome.groups.get(2)?.title).toBe('Side');
    expect(chrome.groups.get(2)?.color).toBe('cyan'); // cyan → cyan (1:1, no fold)
  });

  test('preserveFavoriteFocus: groups expand/collapse but focus is NOT moved when active tab is a global favorite', async () => {
    const { coordinator, store } = makeCoordinator();
    store.state.spaces.push(space('work'), space('side'));
    store.state.activeSpaceByWindow[100] = 'work';
    store.state.spaceInstancesByWindow[100] = {
      work: { spaceId: 'work', groupId: 1, tempTabIds: [17], tempTabTitles: {} },
      side: { spaceId: 'side', groupId: 2, tempTabIds: [30], tempTabTitles: {} },
    };
    // f1 is a global favorite (spaceId: null) bound to tab 88.
    store.state.savedTabs.f1 = {
      id: 'f1',
      spaceId: null,
      title: 'Fav',
      originalURL: 'https://fav/',
      currentURL: null,
    };
    store.state.tabBindings.f1 = { 100: 88 };
    for (const id of [17, 30, 88]) store.state.liveTabsById[id] = live(id, 100);
    chrome.addGroup({ id: 1, windowId: 100, collapsed: false });
    chrome.addGroup({ id: 2, windowId: 100, collapsed: true });
    chrome.addTab({ id: 17, windowId: 100, groupId: 1 });
    chrome.addTab({ id: 30, windowId: 100, groupId: 2 });
    // Tab 88 is ungrouped (global favorite) and Chrome's currently active tab.
    chrome.addTab({ id: 88, windowId: 100, groupId: -1, active: true });

    coordinator.enqueue(
      sidebar({ kind: 'activateSpace', payload: { windowId: 100, spaceId: 'side' } }, 'c1'),
    );
    await coordinator.idle();

    expect(store.state.activeSpaceByWindow[100]).toBe('side');
    // Step (d) still runs: incoming group expanded, outgoing group collapsed.
    expect(chrome.groups.get(2)?.collapsed).toBe(false);
    expect(chrome.groups.get(1)?.collapsed).toBe(true);
    // Step (c) is skipped: focus is NOT yanked from the favorite into side's tab.
    expect(chrome.calls).not.toContain('tabs.update:active:30');
  });
});

describe('recolour / rename identity propagation (stale-group resilience)', () => {
  test('recolour persists + acks ok when the persisted group is STALE (the recolour bug)', async () => {
    // Regression: a Space instance carries a groupId that no longer resolves in
    // Chrome (group dissolved by a restart / ungrouped). Recolour must NOT revert
    // and reject — the user's colour change is primary; the ghost group is skipped.
    const { coordinator, store, persist, broadcast, emitAck } = makeCoordinator();
    store.state.spaces.push(space('work', 'Work', 'blue'));
    store.state.spaceInstancesByWindow[100] = {
      work: { spaceId: 'work', groupId: 999, tempTabIds: [], tempTabTitles: {} }, // 999 not in Chrome → stale
    };

    coordinator.enqueue(
      sidebar({ kind: 'recolourSpace', payload: { spaceId: 'work', color: 'red' } }, 'c1'),
    );
    await coordinator.idle();

    expect(store.state.spaces[0]?.color).toBe('red'); // applied, not reverted
    expect(persist).toHaveBeenCalledTimes(1);
    expect(broadcast).toHaveBeenCalledTimes(1);
    expect(emitAck.mock.calls[0]?.[0]).toMatchObject({ id: 'c1', result: 'ok' });
  });

  test('recolour updates the LIVE Chrome group colour and persists', async () => {
    const { coordinator, store, emitAck } = makeCoordinator();
    store.state.spaces.push(space('work', 'Work', 'blue'));
    store.state.spaceInstancesByWindow[100] = {
      work: { spaceId: 'work', groupId: 1, tempTabIds: [17], tempTabTitles: {} },
    };
    store.state.liveTabsById[17] = live(17, 100);
    chrome.addGroup({ id: 1, windowId: 100, collapsed: false });
    chrome.addTab({ id: 17, windowId: 100, groupId: 1 });

    coordinator.enqueue(
      sidebar({ kind: 'recolourSpace', payload: { spaceId: 'work', color: 'red' } }, 'c1'),
    );
    await coordinator.idle();

    expect(store.state.spaces[0]?.color).toBe('red');
    expect(chrome.groups.get(1)?.color).toBe('red');
    expect(emitAck.mock.calls[0]?.[0]).toMatchObject({ id: 'c1', result: 'ok' });
  });

  test('recolour still reverts + errors when a LIVE group genuinely fails to update', async () => {
    // Atomicity is preserved for the case that risks real state↔Chrome drift.
    const { coordinator, store, emitAck } = makeCoordinator();
    store.state.spaces.push(space('work', 'Work', 'blue'));
    store.state.spaceInstancesByWindow[100] = {
      work: { spaceId: 'work', groupId: 1, tempTabIds: [17], tempTabTitles: {} },
    };
    store.state.liveTabsById[17] = live(17, 100);
    chrome.addGroup({ id: 1, windowId: 100, collapsed: false });
    chrome.addTab({ id: 17, windowId: 100, groupId: 1 });
    chrome.failGroupUpdate = (id) => id === 1; // live group, update rejects

    coordinator.enqueue(
      sidebar({ kind: 'recolourSpace', payload: { spaceId: 'work', color: 'red' } }, 'c1'),
    );
    await coordinator.idle();

    expect(store.state.spaces[0]?.color).toBe('blue'); // reverted
    expect(emitAck.mock.calls[0]?.[0]).toMatchObject({
      id: 'c1',
      result: { error: expect.stringContaining('recolourSpace') },
    });
  });
});

describe('new-tab grouping + create flow', () => {
  test('opening a tab groups it into the active Space group', async () => {
    const { coordinator, store } = makeCoordinator();
    store.state.spaces.push(space('work'));
    store.state.activeSpaceByWindow[100] = 'work';
    store.state.spaceInstancesByWindow[100] = {
      work: { spaceId: 'work', groupId: 1, tempTabIds: [17], tempTabTitles: {} },
    };
    store.state.liveTabsById[17] = live(17, 100);
    chrome.addGroup({ id: 1, windowId: 100, collapsed: false });
    chrome.addTab({ id: 17, windowId: 100, groupId: 1 });
    chrome.addTab({ id: 50, windowId: 100, groupId: -1 });

    coordinator.enqueue(tabCreated(50, 100));
    await coordinator.idle();

    expect(store.state.spaceInstancesByWindow[100]?.work?.tempTabIds).toContain(50);
    expect(chrome.tabs.get(50)?.groupId).toBe(1);
  });

  test('a new tab in a Space with no group yet groups it WITH the existing tabs (not a lonely group)', async () => {
    // Boot state: the active Space has open tabs adopted as temp tabs but no
    // materialized group (groupId -1). Cmd+T must not spawn a one-tab group.
    const { coordinator, store } = makeCoordinator();
    store.state.spaces.push(space('work'));
    store.state.activeSpaceByWindow[100] = 'work';
    store.state.spaceInstancesByWindow[100] = {
      work: { spaceId: 'work', groupId: -1, tempTabIds: [17, 18], tempTabTitles: {} },
    };
    for (const id of [17, 18]) store.state.liveTabsById[id] = live(id, 100);
    chrome.addTab({ id: 17, windowId: 100, groupId: -1 });
    chrome.addTab({ id: 18, windowId: 100, groupId: -1 });
    chrome.addTab({ id: 50, windowId: 100, groupId: -1 });

    coordinator.enqueue(tabCreated(50, 100));
    await coordinator.idle();

    const groupId = store.state.spaceInstancesByWindow[100]?.work?.groupId;
    expect(groupId).toBeGreaterThan(0);
    // All three tabs share the one group — the existing tabs were swept in too.
    expect(chrome.tabs.get(17)?.groupId).toBe(groupId);
    expect(chrome.tabs.get(18)?.groupId).toBe(groupId);
    expect(chrome.tabs.get(50)?.groupId).toBe(groupId);
  });

  test('opening a saved (pinned) tab groups it into its Space group', async () => {
    const { coordinator, store } = makeCoordinator();
    store.state.spaces.push(space('work'));
    store.state.activeSpaceByWindow[100] = 'work';
    store.state.spaceInstancesByWindow[100] = {
      work: { spaceId: 'work', groupId: 1, tempTabIds: [17], tempTabTitles: {} },
    };
    store.state.savedTabs['st-1'] = {
      id: 'st-1',
      spaceId: 'work',
      title: 'Saved',
      originalURL: 'https://x/',
      currentURL: null,
    };
    store.state.tabBindings['st-1'] = {};
    store.state.liveTabsById[17] = live(17, 100);
    chrome.addGroup({ id: 1, windowId: 100, collapsed: false });
    chrome.addTab({ id: 17, windowId: 100, groupId: 1 });

    coordinator.enqueue(
      sidebar({ kind: 'openSavedTab', payload: { savedTabId: 'st-1', windowId: 100 } }, 'c1'),
    );
    await coordinator.idle();

    // The created tab is bound and lives inside the Space's group.
    const boundTabId = store.state.tabBindings['st-1']?.[100];
    expect(typeof boundTabId).toBe('number');
    if (typeof boundTabId === 'number') {
      expect(chrome.tabs.get(boundTabId)?.groupId).toBe(1);
    }
  });

  test('rebuilding a stale group includes the Space bound tabs', async () => {
    const { coordinator, store } = makeCoordinator();
    store.state.spaces.push(space('work'), space('side'));
    store.state.activeSpaceByWindow[100] = 'work';
    store.state.spaceInstancesByWindow[100] = {
      work: { spaceId: 'work', groupId: 1, tempTabIds: [17], tempTabTitles: {} },
      side: { spaceId: 'side', groupId: 999, tempTabIds: [30], tempTabTitles: {} }, // stale group
    };
    // A bound (pinned) tab 31 belongs to 'side' and is open in window 100.
    store.state.savedTabs['st-1'] = {
      id: 'st-1',
      spaceId: 'side',
      title: 'Saved',
      originalURL: 'https://x/',
      currentURL: 'https://x/',
    };
    store.state.tabBindings['st-1'] = { 100: 31 };
    for (const id of [17, 30, 31]) store.state.liveTabsById[id] = live(id, 100);
    chrome.addGroup({ id: 1, windowId: 100, collapsed: false });
    chrome.addTab({ id: 17, windowId: 100, groupId: 1 });
    chrome.addTab({ id: 30, windowId: 100, groupId: -1 });
    chrome.addTab({ id: 31, windowId: 100, groupId: -1 });

    coordinator.enqueue(
      sidebar({ kind: 'activateSpace', payload: { windowId: 100, spaceId: 'side' } }, 'c1'),
    );
    await coordinator.idle();

    const newGroupId = store.state.spaceInstancesByWindow[100]?.side?.groupId;
    expect(newGroupId).toBeGreaterThan(0);
    expect(chrome.tabs.get(30)?.groupId).toBe(newGroupId); // temp tab
    expect(chrome.tabs.get(31)?.groupId).toBe(newGroupId); // bound tab too
  });

  test('the first tab in a Space creates its group', async () => {
    const { coordinator, store } = makeCoordinator();
    store.state.spaces.push(space('work'));
    store.state.activeSpaceByWindow[100] = 'work';
    store.state.spaceInstancesByWindow[100] = {
      work: { spaceId: 'work', groupId: -1, tempTabIds: [], tempTabTitles: {} },
    };
    chrome.addTab({ id: 50, windowId: 100, groupId: -1 });

    coordinator.enqueue(tabCreated(50, 100));
    await coordinator.idle();

    const groupId = store.state.spaceInstancesByWindow[100]?.work?.groupId;
    expect(groupId).toBeGreaterThan(0);
    expect(chrome.tabs.get(50)?.groupId).toBe(groupId);
  });

  test('createSpace leaves the new Space group expanded and others collapsed', async () => {
    const { coordinator, store } = makeCoordinator();
    store.state.spaces.push(space('work'));
    store.state.activeSpaceByWindow[100] = 'work';
    store.state.spaceInstancesByWindow[100] = {
      work: { spaceId: 'work', groupId: 1, tempTabIds: [17], tempTabTitles: {} },
    };
    store.state.liveTabsById[17] = live(17, 100);
    chrome.addGroup({ id: 1, windowId: 100, collapsed: false });
    chrome.addTab({ id: 17, windowId: 100, groupId: 1 });

    coordinator.enqueue(
      sidebar(
        {
          kind: 'createSpace',
          payload: { name: 'New', color: 'green', icon: 'star', windowId: 100 },
        },
        'c1',
      ),
    );
    await coordinator.idle();

    // The created Space's id is the next from the test idFactory ('id-1').
    const newInstance = store.state.spaceInstancesByWindow[100]?.['id-1'];
    expect(newInstance?.groupId).toBeGreaterThan(0);
    expect(chrome.groups.get(newInstance?.groupId as number)?.collapsed).toBe(false);
    expect(chrome.groups.get(1)?.collapsed).toBe(true);
  });
});

describe('rename / recolour / delete propagation', () => {
  test('rename updates the Space group title in every window', async () => {
    const { coordinator, store } = makeCoordinator();
    store.state.spaces.push(space('work', 'Work'));
    store.state.spaceInstancesByWindow[100] = {
      work: { spaceId: 'work', groupId: 1, tempTabIds: [17], tempTabTitles: {} },
    };
    store.state.spaceInstancesByWindow[200] = {
      work: { spaceId: 'work', groupId: 2, tempTabIds: [18], tempTabTitles: {} },
    };
    chrome.addGroup({ id: 1, windowId: 100, collapsed: false });
    chrome.addGroup({ id: 2, windowId: 200, collapsed: false });

    coordinator.enqueue(
      sidebar({ kind: 'renameSpace', payload: { spaceId: 'work', newName: 'Renamed' } }, 'c1'),
    );
    await coordinator.idle();

    expect(chrome.groups.get(1)?.title).toBe('Renamed');
    expect(chrome.groups.get(2)?.title).toBe('Renamed');
  });

  test('rename reverts the name when a group update fails', async () => {
    const { coordinator, store, emitAck } = makeCoordinator();
    store.state.spaces.push(space('work', 'Work'));
    store.state.spaceInstancesByWindow[100] = {
      work: { spaceId: 'work', groupId: 1, tempTabIds: [17], tempTabTitles: {} },
    };
    chrome.addGroup({ id: 1, windowId: 100, collapsed: false });
    chrome.failGroupUpdate = (id) => id === 1;

    coordinator.enqueue(
      sidebar({ kind: 'renameSpace', payload: { spaceId: 'work', newName: 'Renamed' } }, 'c1'),
    );
    await coordinator.idle();

    expect(store.state.spaces.find((s) => s.id === 'work')?.name).toBe('Work'); // reverted
    expect(emitAck).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'c1',
        result: expect.objectContaining({ error: expect.any(String) }),
      }),
    );
  });

  test('a createSpace command for an in-use name rejects via the ack', async () => {
    const { coordinator, store, emitAck } = makeCoordinator();
    store.state.spaces.push(space('work', 'Work'));
    store.state.activeSpaceByWindow[100] = 'work';
    store.state.spaceInstancesByWindow[100] = {
      work: { spaceId: 'work', groupId: 1, tempTabIds: [17], tempTabTitles: {} },
    };

    // "work" normalizes to the existing "Work" → the store throws, ack rejects.
    coordinator.enqueue(
      sidebar(
        {
          kind: 'createSpace',
          payload: { name: 'work', color: 'red', icon: 'star', windowId: 100 },
        },
        'c1',
      ),
    );
    await coordinator.idle();

    expect(emitAck).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'c1',
        result: expect.objectContaining({ error: expect.any(String) }),
      }),
    );
    expect(store.state.spaces).toHaveLength(1); // no second Space added
  });

  test('a renameSpace command to an in-use name rejects via the ack', async () => {
    const { coordinator, store, emitAck } = makeCoordinator();
    store.state.spaces.push(space('work', 'Work'), space('side', 'Side'));
    store.state.spaceInstancesByWindow[100] = {
      side: { spaceId: 'side', groupId: 2, tempTabIds: [30], tempTabTitles: {} },
    };
    chrome.addGroup({ id: 2, windowId: 100, collapsed: false });

    coordinator.enqueue(
      sidebar({ kind: 'renameSpace', payload: { spaceId: 'side', newName: 'Work' } }, 'c1'),
    );
    await coordinator.idle();

    expect(emitAck).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'c1',
        result: expect.objectContaining({ error: expect.any(String) }),
      }),
    );
    expect(store.state.spaces.find((s) => s.id === 'side')?.name).toBe('Side'); // unchanged
  });

  test('delete closes the Space groups in every window', async () => {
    const { coordinator, store } = makeCoordinator();
    store.state.spaces.push(space('work'), space('side')); // 2 spaces so delete is allowed
    store.state.spaceInstancesByWindow[100] = {
      work: { spaceId: 'work', groupId: 1, tempTabIds: [17], tempTabTitles: {} },
    };
    store.state.spaceInstancesByWindow[200] = {
      work: { spaceId: 'work', groupId: 2, tempTabIds: [18], tempTabTitles: {} },
    };
    chrome.addGroup({ id: 1, windowId: 100, collapsed: false });
    chrome.addGroup({ id: 2, windowId: 200, collapsed: false });
    chrome.addTab({ id: 17, windowId: 100, groupId: 1 });
    chrome.addTab({ id: 18, windowId: 200, groupId: 2 });

    coordinator.enqueue(sidebar({ kind: 'deleteSpace', payload: { spaceId: 'work' } }, 'c1'));
    await coordinator.idle();

    expect(chrome.tabs.has(17)).toBe(false); // closed
    expect(chrome.tabs.has(18)).toBe(false);
    expect(store.state.spaces.find((s) => s.id === 'work')).toBeUndefined();
  });
});

describe('newTab / clearTempTabs commands', () => {
  test('newTab opens a tab in the window (no direct state mutation)', async () => {
    const { coordinator, store } = makeCoordinator();
    store.state.spaces.push(space('work'));
    store.state.activeSpaceByWindow[100] = 'work';
    store.state.spaceInstancesByWindow[100] = {
      work: { spaceId: 'work', groupId: 1, tempTabIds: [], tempTabTitles: {} },
    };

    coordinator.enqueue(sidebar({ kind: 'newTab', payload: { windowId: 100 } }, 'c1'));
    await coordinator.idle();

    expect(chrome.calls.some((c) => c.startsWith('tabs.create:100'))).toBe(true);
  });

  test('clearTempTabs closes only the active Space temp tabs, not pinned/bound', async () => {
    const { coordinator, store } = makeCoordinator();
    store.state.spaces.push(space('work'));
    store.state.activeSpaceByWindow[100] = 'work';
    store.state.spaceInstancesByWindow[100] = {
      work: { spaceId: 'work', groupId: 1, tempTabIds: [17, 22], tempTabTitles: {} },
    };
    // A bound (pinned) tab 31 belongs to work but is NOT a temp tab.
    store.state.savedTabs['st-1'] = {
      id: 'st-1',
      spaceId: 'work',
      title: 'Pinned',
      originalURL: 'https://x/',
      currentURL: 'https://x/',
    };
    store.state.tabBindings['st-1'] = { 100: 31 };
    for (const id of [17, 22, 31]) store.state.liveTabsById[id] = live(id, 100);
    for (const id of [17, 22, 31]) chrome.addTab({ id, windowId: 100, groupId: 1 });

    coordinator.enqueue(sidebar({ kind: 'clearTempTabs', payload: { windowId: 100 } }, 'c1'));
    await coordinator.idle();

    expect(chrome.calls).toContain('tabs.remove:[17,22]');
    expect(chrome.tabs.has(31)).toBe(true); // bound/pinned tab survives
  });

  test('clearTempTabs opens the Space home first when clearing would empty the window', async () => {
    // Regression: Clear must never close the window (and quit the browser). When
    // the temp tabs are the window's ONLY tabs, a home tab is opened BEFORE the
    // temps are removed, so the window survives on its home.
    const { coordinator, store } = makeCoordinator();
    store.state.spaces.push(space('work'));
    store.state.activeSpaceByWindow[100] = 'work';
    store.state.spaceInstancesByWindow[100] = {
      work: { spaceId: 'work', groupId: 1, tempTabIds: [17, 22], tempTabTitles: {} },
    };
    for (const id of [17, 22]) store.state.liveTabsById[id] = live(id, 100);
    for (const id of [17, 22]) chrome.addTab({ id, windowId: 100, groupId: 1 });

    coordinator.enqueue(sidebar({ kind: 'clearTempTabs', payload: { windowId: 100 } }, 'c1'));
    await coordinator.idle();

    const createIdx = chrome.calls.findIndex((c) => c.startsWith('tabs.create:100'));
    const removeIdx = chrome.calls.findIndex((c) => c.startsWith('tabs.remove'));
    expect(createIdx).toBeGreaterThanOrEqual(0); // a home tab was opened
    expect(removeIdx).toBeGreaterThan(createIdx); // ...before the temps were closed
  });

  test('clearTempTabs does NOT open a home tab when other tabs survive', async () => {
    const { coordinator, store } = makeCoordinator();
    store.state.spaces.push(space('work'));
    store.state.activeSpaceByWindow[100] = 'work';
    store.state.spaceInstancesByWindow[100] = {
      work: { spaceId: 'work', groupId: 1, tempTabIds: [17], tempTabTitles: {} },
    };
    // A bound (pinned) tab 31 survives the clear, so no home tab is needed.
    store.state.savedTabs['st-1'] = {
      id: 'st-1',
      spaceId: 'work',
      title: 'Pinned',
      originalURL: 'https://x/',
      currentURL: 'https://x/',
    };
    store.state.tabBindings['st-1'] = { 100: 31 };
    for (const id of [17, 31]) store.state.liveTabsById[id] = live(id, 100);
    for (const id of [17, 31]) chrome.addTab({ id, windowId: 100, groupId: 1 });

    coordinator.enqueue(sidebar({ kind: 'clearTempTabs', payload: { windowId: 100 } }, 'c1'));
    await coordinator.idle();

    expect(chrome.calls.some((c) => c.startsWith('tabs.create'))).toBe(false);
    expect(chrome.tabs.has(31)).toBe(true);
  });

  test('clearTempTabs archives each cleared tab (recoverable, not a hard delete)', async () => {
    const { coordinator, store } = makeCoordinator();
    store.state.spaces.push(space('work'));
    store.state.activeSpaceByWindow[100] = 'work';
    store.state.spaceInstancesByWindow[100] = {
      work: { spaceId: 'work', groupId: 1, tempTabIds: [17, 22], tempTabTitles: {} },
    };
    // A bound (pinned) tab 31 survives, so the window-empty home branch is skipped.
    store.state.savedTabs['st-1'] = {
      id: 'st-1',
      spaceId: 'work',
      title: 'Pinned',
      originalURL: 'https://x/',
      currentURL: 'https://x/',
    };
    store.state.tabBindings['st-1'] = { 100: 31 };
    store.state.liveTabsById[17] = {
      tabId: 17,
      windowId: 100,
      url: 'https://a/',
      title: 'A',
      active: false,
      status: 'complete',
    };
    store.state.liveTabsById[22] = {
      tabId: 22,
      windowId: 100,
      url: 'https://b/',
      title: 'B',
      active: false,
      status: 'complete',
    };
    store.state.liveTabsById[31] = live(31, 100);
    for (const id of [17, 22, 31]) chrome.addTab({ id, windowId: 100, groupId: 1 });

    coordinator.enqueue(sidebar({ kind: 'clearTempTabs', payload: { windowId: 100 } }, 'c1'));
    await coordinator.idle();

    expect(chrome.calls).toContain('tabs.remove:[17,22]');
    // Both cleared temps are archived (so the toast Undo + options Recently-archived
    // can recover them); the pinned survivor is NOT archived.
    expect(store.state.archivedTabs).toHaveLength(2);
    expect(store.state.archivedTabs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ tabId: 17, url: 'https://a/', title: 'A', spaceId: 'work' }),
        expect.objectContaining({ tabId: 22, url: 'https://b/', title: 'B', spaceId: 'work' }),
      ]),
    );
    // The whole batch shares one archivedAt (the undo path relies on this).
    const batchTimestamps = new Set(store.state.archivedTabs.map((e) => e.archivedAt));
    expect(batchTimestamps.size).toBe(1);
  });

  test('clearTempTabs is a no-op when the active Space has no temp tabs', async () => {
    const { coordinator, store } = makeCoordinator();
    store.state.spaces.push(space('work'));
    store.state.activeSpaceByWindow[100] = 'work';
    store.state.spaceInstancesByWindow[100] = {
      work: { spaceId: 'work', groupId: 1, tempTabIds: [], tempTabTitles: {} },
    };

    coordinator.enqueue(sidebar({ kind: 'clearTempTabs', payload: { windowId: 100 } }, 'c1'));
    await coordinator.idle();

    expect(chrome.calls.some((c) => c.startsWith('tabs.remove'))).toBe(false);
  });

  test('clearTempTabs targets the carried spaceId, not the active Space', async () => {
    // Every carousel panel carries its OWN spaceId now. Clear on a background panel
    // closes THAT Space's temps in place — the active Space's temps are untouched.
    const { coordinator, store } = makeCoordinator();
    store.state.spaces.push(space('work'), space('side'));
    store.state.activeSpaceByWindow[100] = 'work';
    store.state.spaceInstancesByWindow[100] = {
      work: { spaceId: 'work', groupId: 1, tempTabIds: [17], tempTabTitles: {} },
      side: { spaceId: 'side', groupId: 2, tempTabIds: [30, 31], tempTabTitles: {} },
    };
    for (const id of [17, 30, 31]) store.state.liveTabsById[id] = live(id, 100);
    chrome.addTab({ id: 17, windowId: 100, groupId: 1 });
    chrome.addTab({ id: 30, windowId: 100, groupId: 2 });
    chrome.addTab({ id: 31, windowId: 100, groupId: 2 });

    coordinator.enqueue(
      sidebar({ kind: 'clearTempTabs', payload: { windowId: 100, spaceId: 'side' } }, 'c1'),
    );
    await coordinator.idle();

    expect(chrome.calls).toContain('tabs.remove:[30,31]'); // side's temps cleared
    expect(chrome.tabs.has(17)).toBe(true); // the ACTIVE Space's temp is untouched
    expect(store.state.activeSpaceByWindow[100]).toBe('work'); // Clear never switches
  });

  test('newTab on a non-active target Space activates it first, then opens the tab', async () => {
    // A non-centre panel's New Tab targets its own Space. A new tab is focused, so the
    // SW activates that Space first (expand its group, collapse the outgoing) — the
    // freshly opened tab is then visible in it.
    const { coordinator, store } = makeCoordinator();
    store.state.spaces.push(space('work'), space('side'));
    store.state.activeSpaceByWindow[100] = 'work';
    store.state.spaceInstancesByWindow[100] = {
      work: { spaceId: 'work', groupId: 1, tempTabIds: [17], tempTabTitles: {} },
      side: { spaceId: 'side', groupId: 2, tempTabIds: [30], tempTabTitles: {} },
    };
    for (const id of [17, 30]) store.state.liveTabsById[id] = live(id, 100);
    chrome.addGroup({ id: 1, windowId: 100, collapsed: false });
    chrome.addGroup({ id: 2, windowId: 100, collapsed: true });
    chrome.addTab({ id: 17, windowId: 100, groupId: 1 });
    chrome.addTab({ id: 30, windowId: 100, groupId: 2 });

    coordinator.enqueue(
      sidebar({ kind: 'newTab', payload: { windowId: 100, spaceId: 'side' } }, 'c1'),
    );
    await coordinator.idle();

    expect(store.state.activeSpaceByWindow[100]).toBe('side'); // activated
    expect(chrome.groups.get(2)?.collapsed).toBe(false); // incoming expanded
    expect(chrome.groups.get(1)?.collapsed).toBe(true); // outgoing collapsed
    expect(chrome.calls.some((c) => c.startsWith('tabs.create:100'))).toBe(true); // tab opened
  });

  test('newTab on the active Space does NOT re-orchestrate activation (common path)', async () => {
    // The centred panel's spaceId IS the active Space — newTab must skip activation
    // entirely (no group churn) and behave exactly as the historical no-spaceId path.
    const { coordinator, store } = makeCoordinator();
    store.state.spaces.push(space('work'), space('side'));
    store.state.activeSpaceByWindow[100] = 'work';
    store.state.spaceInstancesByWindow[100] = {
      work: { spaceId: 'work', groupId: 1, tempTabIds: [], tempTabTitles: {} },
      side: { spaceId: 'side', groupId: 2, tempTabIds: [], tempTabTitles: {} },
    };
    chrome.addGroup({ id: 1, windowId: 100, collapsed: false });
    chrome.addGroup({ id: 2, windowId: 100, collapsed: true });

    coordinator.enqueue(
      sidebar({ kind: 'newTab', payload: { windowId: 100, spaceId: 'work' } }, 'c1'),
    );
    await coordinator.idle();

    // No activation orchestration: no collapse churn, the other group stays as it was.
    expect(chrome.calls.some((c) => c.startsWith('tabGroups.update:collapsed'))).toBe(false);
    expect(chrome.groups.get(2)?.collapsed).toBe(true);
    expect(chrome.calls.some((c) => c.startsWith('tabs.create:100'))).toBe(true);
  });
});

describe('tab-group lifecycle hints (non-destructive)', () => {
  test('ungrouping a Space group resets groupId to -1 but keeps the Space + pins', async () => {
    const { coordinator, store } = makeCoordinator();
    store.state.spaces.push(space('work'));
    store.state.spaceInstancesByWindow[100] = {
      work: { spaceId: 'work', groupId: 42, tempTabIds: [17], tempTabTitles: {} },
    };
    store.state.savedTabs['st-1'] = {
      id: 'st-1',
      spaceId: 'work',
      title: 'Pinned',
      originalURL: 'https://x/',
      currentURL: null,
    };

    coordinator.enqueue(groupRemoved(42));
    await coordinator.idle();

    expect(store.state.spaceInstancesByWindow[100]?.work?.groupId).toBe(-1);
    expect(store.state.spaces.find((s) => s.id === 'work')).toBeDefined();
    expect(store.state.savedTabs['st-1']).toBeDefined();
  });

  test('renaming a group in Chrome renames the Space', async () => {
    const { coordinator, store } = makeCoordinator();
    store.state.spaces.push(space('work', 'Work'));
    store.state.spaceInstancesByWindow[100] = {
      work: { spaceId: 'work', groupId: 42, tempTabIds: [17], tempTabTitles: {} },
    };

    coordinator.enqueue(groupUpdated({ id: 42, title: 'Research', color: 'blue' }));
    await coordinator.idle();

    expect(store.state.spaces.find((s) => s.id === 'work')?.name).toBe('Research');
  });

  test('a Lunma-initiated retitle echo does not loop into renameSpace', async () => {
    const { coordinator, store } = makeCoordinator();
    store.state.spaces.push(space('work', 'Work'));
    store.state.spaceInstancesByWindow[100] = {
      work: { spaceId: 'work', groupId: 42, tempTabIds: [17], tempTabTitles: {} },
    };

    // The echoed onUpdated carries the title Lunma already set (= the Space name).
    coordinator.enqueue(groupUpdated({ id: 42, title: 'Work', color: 'red' }));
    await coordinator.idle();

    expect(store.state.spaces.find((s) => s.id === 'work')?.name).toBe('Work');
  });

  test('a Chrome-side group rename to an in-use name disambiguates instead of throwing', async () => {
    const { coordinator, store, persist } = makeCoordinator();
    store.state.spaces.push(space('work', 'Work'), space('side', 'Side'));
    store.state.spaceInstancesByWindow[100] = {
      work: { spaceId: 'work', groupId: 1, tempTabIds: [17], tempTabTitles: {} },
      side: { spaceId: 'side', groupId: 2, tempTabIds: [30], tempTabTitles: {} },
    };
    chrome.addGroup({ id: 1, windowId: 100, collapsed: false, title: 'Work', color: 'blue' });
    chrome.addGroup({ id: 2, windowId: 100, collapsed: false, title: 'Side', color: 'blue' });

    // The user renames "Side"'s Chrome group to "Work" (already in use by "work").
    coordinator.enqueue(groupUpdated({ id: 2, title: 'Work', color: 'blue' }));
    await coordinator.idle();

    // "Side" is disambiguated to "Work 2", NOT renamed to a duplicate "Work".
    expect(store.state.spaces.find((s) => s.id === 'side')?.name).toBe('Work 2');
    expect(store.state.spaces.find((s) => s.id === 'work')?.name).toBe('Work'); // untouched
    // Its Chrome group is re-titled to the disambiguated name (group ↔ record lockstep).
    expect(chrome.groups.get(2)?.title).toBe('Work 2');
    // The drain completed and committed (no throw aborted it).
    expect(persist).toHaveBeenCalled();
  });

  test('lifecycle events for an untracked group are ignored', async () => {
    const { coordinator, store, persist } = makeCoordinator();
    store.state.spaces.push(space('work', 'Work'));
    store.state.spaceInstancesByWindow[100] = {
      work: { spaceId: 'work', groupId: 42, tempTabIds: [17], tempTabTitles: {} },
    };

    coordinator.enqueue(groupRemoved(999)); // not tracked
    coordinator.enqueue(groupUpdated({ id: 999, title: 'Whatever', color: 'pink' }));
    await coordinator.idle();

    expect(store.state.spaceInstancesByWindow[100]?.work?.groupId).toBe(42);
    expect(store.state.spaces.find((s) => s.id === 'work')?.name).toBe('Work');
    // Neither handler dirtied state → no persist/broadcast for these events.
    expect(persist).not.toHaveBeenCalled();
  });

  test('onRemoved during a Lunma deleteSpace is a no-op (instance already gone)', async () => {
    const { coordinator, store } = makeCoordinator();
    store.state.spaces.push(space('work'), space('side'));
    store.state.spaceInstancesByWindow[100] = {
      work: { spaceId: 'work', groupId: 42, tempTabIds: [17], tempTabTitles: {} },
    };
    chrome.addGroup({ id: 42, windowId: 100, collapsed: false });
    chrome.addTab({ id: 17, windowId: 100, groupId: 42 });

    // Lunma deletes the Space (closes group 42), then Chrome's onRemoved(42) fires.
    coordinator.enqueue(sidebar({ kind: 'deleteSpace', payload: { spaceId: 'work' } }, 'c1'));
    coordinator.enqueue(groupRemoved(42));
    await coordinator.idle();

    // The Space is in trash and no instance holds 42 → forgetSpaceGroup no-ops.
    expect(store.state.spaces.find((s) => s.id === 'work')).toBeUndefined();
    expect(store.state.trash.work).toBeDefined();
  });
});

// =====================================================================
// Cross-Space saved-tab activation (cross-space-tab-switch). Activating a
// COUPLED (pinned) saved tab whose Space is not the window's active one switches
// the window to that Space — open joins the now-shown group, focus lands in it.
// Favorites and same-Space activations never switch.
// =====================================================================

/** Did any group get collapsed during the drain? The fingerprint of a Space
 * switch's orchestration (a same-Space/favorite activation never collapses). */
function didOrchestrateSwitch(calls: string[]): boolean {
  return calls.some((c) => c.startsWith('tabGroups.update:collapsed=true'));
}

describe('cross-Space saved-tab activation switches Space', () => {
  test('opening a dormant pin from another Space switches the window and groups it visibly', async () => {
    const { coordinator, store, broadcast } = makeCoordinator();
    store.state.spaces.push(space('work'), space('home'));
    store.state.activeSpaceByWindow[100] = 'work';
    store.state.spaceInstancesByWindow[100] = {
      work: { spaceId: 'work', groupId: 1, tempTabIds: [17], tempTabTitles: {} },
      home: { spaceId: 'home', groupId: 2, tempTabIds: [30], tempTabTitles: {} },
    };
    store.state.savedTabs.p1 = {
      id: 'p1',
      spaceId: 'home',
      title: 'P1',
      originalURL: 'https://p1/',
      currentURL: null,
    };
    store.state.tabBindings.p1 = {};
    for (const id of [17, 30]) store.state.liveTabsById[id] = live(id, 100);
    chrome.addGroup({ id: 1, windowId: 100, collapsed: false });
    chrome.addGroup({ id: 2, windowId: 100, collapsed: true });
    chrome.addTab({ id: 17, windowId: 100, groupId: 1 });
    chrome.addTab({ id: 30, windowId: 100, groupId: 2 });

    coordinator.enqueue(
      sidebar({ kind: 'openSavedTab', payload: { savedTabId: 'p1', windowId: 100 } }, 'c1'),
    );
    await coordinator.idle();

    // The window switched to Home: Home's group is shown, Work's collapsed.
    expect(store.state.activeSpaceByWindow[100]).toBe('home');
    expect(chrome.groups.get(2)?.collapsed).toBe(false);
    expect(chrome.groups.get(1)?.collapsed).toBe(true);
    // The broadcast the sidebar receives carries the switched active Space (this is
    // what drives the sidebar's reconcile to glide to Home — App.test.ts).
    const lastBroadcast = broadcast.mock.calls.at(-1)?.[0];
    expect(lastBroadcast?.state.activeSpaceByWindow[100]).toBe('home');
    // The new tab is bound and joins Home's now-visible group (not hidden in a bg one).
    const boundTabId = store.state.tabBindings.p1?.[100];
    expect(typeof boundTabId).toBe('number');
    if (typeof boundTabId === 'number') {
      expect(chrome.tabs.get(boundTabId)?.groupId).toBe(2);
    }
  });

  test('opening a dormant pin already in the active Space does NOT re-activate', async () => {
    const { coordinator, store } = makeCoordinator();
    store.state.spaces.push(space('work'));
    store.state.activeSpaceByWindow[100] = 'work';
    store.state.spaceInstancesByWindow[100] = {
      work: { spaceId: 'work', groupId: 1, tempTabIds: [17], tempTabTitles: {} },
    };
    store.state.savedTabs.p2 = {
      id: 'p2',
      spaceId: 'work',
      title: 'P2',
      originalURL: 'https://p2/',
      currentURL: null,
    };
    store.state.tabBindings.p2 = {};
    store.state.liveTabsById[17] = live(17, 100);
    chrome.addGroup({ id: 1, windowId: 100, collapsed: false });
    chrome.addTab({ id: 17, windowId: 100, groupId: 1 });

    coordinator.enqueue(
      sidebar({ kind: 'openSavedTab', payload: { savedTabId: 'p2', windowId: 100 } }, 'c1'),
    );
    await coordinator.idle();

    // Same Space → no orchestration ran; the new tab still joins Work's group.
    expect(store.state.activeSpaceByWindow[100]).toBe('work');
    expect(didOrchestrateSwitch(chrome.calls)).toBe(false);
    const boundTabId = store.state.tabBindings.p2?.[100];
    expect(typeof boundTabId).toBe('number');
    if (typeof boundTabId === 'number') {
      expect(chrome.tabs.get(boundTabId)?.groupId).toBe(1);
    }
  });

  test('opening a dormant favorite never switches the window Space', async () => {
    const { coordinator, store } = makeCoordinator();
    store.state.spaces.push(space('work'), space('home'));
    store.state.activeSpaceByWindow[100] = 'work';
    store.state.spaceInstancesByWindow[100] = {
      work: { spaceId: 'work', groupId: 1, tempTabIds: [17], tempTabTitles: {} },
    };
    store.state.savedTabs.f1 = {
      id: 'f1',
      spaceId: null,
      title: 'F1',
      originalURL: 'https://f1/',
      currentURL: null,
    };
    store.state.faviconRow = ['f1'];
    store.state.tabBindings.f1 = {};
    store.state.liveTabsById[17] = live(17, 100);
    chrome.addGroup({ id: 1, windowId: 100, collapsed: false });
    chrome.addTab({ id: 17, windowId: 100, groupId: 1 });

    coordinator.enqueue(
      sidebar({ kind: 'openSavedTab', payload: { savedTabId: 'f1', windowId: 100 } }, 'c1'),
    );
    await coordinator.idle();

    // A global favorite (spaceId === null) is ungrouped and never switches.
    expect(store.state.activeSpaceByWindow[100]).toBe('work');
    expect(didOrchestrateSwitch(chrome.calls)).toBe(false);
    const boundTabId = store.state.tabBindings.f1?.[100];
    expect(typeof boundTabId).toBe('number');
    if (typeof boundTabId === 'number') {
      expect(chrome.tabs.get(boundTabId)?.groupId).toBe(-1);
    }
  });

  test('focusing a bound saved tab in another Space switches the window first', async () => {
    const winUpdate = vi.fn(async () => ({ id: 100 }) as chrome.windows.Window);
    (
      globalThis as unknown as { chrome: { windows: { update: typeof winUpdate } } }
    ).chrome.windows = { update: winUpdate };
    const { coordinator, store } = makeCoordinator();
    store.state.spaces.push(space('work'), space('home'));
    store.state.activeSpaceByWindow[100] = 'work';
    store.state.spaceInstancesByWindow[100] = {
      work: { spaceId: 'work', groupId: 1, tempTabIds: [17], tempTabTitles: {} },
      home: { spaceId: 'home', groupId: 2, tempTabIds: [], tempTabTitles: {} },
    };
    store.state.savedTabs.p3 = {
      id: 'p3',
      spaceId: 'home',
      title: 'P3',
      originalURL: 'https://p3/',
      currentURL: 'https://p3/',
      boundary: { mode: 'off' },
    };
    store.state.tabBindings.p3 = { 100: 31 };
    for (const id of [17, 31]) store.state.liveTabsById[id] = live(id, 100);
    chrome.addGroup({ id: 1, windowId: 100, collapsed: false });
    chrome.addGroup({ id: 2, windowId: 100, collapsed: true });
    chrome.addTab({ id: 17, windowId: 100, groupId: 1 });
    chrome.addTab({ id: 31, windowId: 100, groupId: 2 });

    coordinator.enqueue(
      sidebar({ kind: 'focusSavedTab', payload: { savedTabId: 'p3', windowId: 100 } }, 'c1'),
    );
    await coordinator.idle();

    // Switched to Home BEFORE focusing; the bound tab is focused, no new tab opened.
    expect(store.state.activeSpaceByWindow[100]).toBe('home');
    expect(chrome.groups.get(2)?.collapsed).toBe(false);
    expect(chrome.groups.get(1)?.collapsed).toBe(true);
    expect(chrome.tabs.get(31)?.active).toBe(true);
    expect(winUpdate).toHaveBeenCalledWith(100, { focused: true });
    expect(chrome.calls.some((c) => c.startsWith('tabs.create'))).toBe(false);
  });

  test('focusing a bound saved tab in the active Space does NOT switch', async () => {
    const winUpdate = vi.fn(async () => ({ id: 100 }) as chrome.windows.Window);
    (
      globalThis as unknown as { chrome: { windows: { update: typeof winUpdate } } }
    ).chrome.windows = { update: winUpdate };
    const { coordinator, store } = makeCoordinator();
    store.state.spaces.push(space('work'));
    store.state.activeSpaceByWindow[100] = 'work';
    store.state.spaceInstancesByWindow[100] = {
      work: { spaceId: 'work', groupId: 1, tempTabIds: [42], tempTabTitles: {} },
    };
    store.state.savedTabs.p4 = {
      id: 'p4',
      spaceId: 'work',
      title: 'P4',
      originalURL: 'https://p4/',
      currentURL: 'https://p4/',
      boundary: { mode: 'off' },
    };
    store.state.tabBindings.p4 = { 100: 42 };
    store.state.liveTabsById[42] = live(42, 100);
    chrome.addGroup({ id: 1, windowId: 100, collapsed: false });
    chrome.addTab({ id: 42, windowId: 100, groupId: 1 });

    coordinator.enqueue(
      sidebar({ kind: 'focusSavedTab', payload: { savedTabId: 'p4', windowId: 100 } }, 'c1'),
    );
    await coordinator.idle();

    // Same Space → no orchestration; the tab is simply focused.
    expect(store.state.activeSpaceByWindow[100]).toBe('work');
    expect(didOrchestrateSwitch(chrome.calls)).toBe(false);
    expect(chrome.tabs.get(42)?.active).toBe(true);
    expect(winUpdate).toHaveBeenCalledWith(100, { focused: true });
  });
});

// =====================================================================
// Activation-driven cross-Space switch (focused-tab-switches-space). Activating
// a tab whose owning Space is not the window's active one switches the window to
// that Space — the open/temporary-tab gap cross-space-tab-switch left open. Every
// activation path (launcher open-tab, sidebar temp-tab click, Chrome tab strip,
// keyboard) funnels through `tabs.onActivated`, so this one chokepoint covers all.
// =====================================================================

describe('activating a cross-Space tab switches the window Space', () => {
  test('activating a temp tab that lives in another Space switches + broadcasts the new active Space', async () => {
    const { coordinator, store, broadcast } = makeCoordinator();
    store.state.spaces.push(space('work'), space('home'));
    store.state.activeSpaceByWindow[100] = 'work';
    store.state.spaceInstancesByWindow[100] = {
      work: { spaceId: 'work', groupId: 1, tempTabIds: [17], tempTabTitles: {} },
      home: { spaceId: 'home', groupId: 2, tempTabIds: [30], tempTabTitles: {} },
    };
    for (const id of [17, 30]) store.state.liveTabsById[id] = live(id, 100);
    chrome.addGroup({ id: 1, windowId: 100, collapsed: false });
    chrome.addGroup({ id: 2, windowId: 100, collapsed: true });
    chrome.addTab({ id: 17, windowId: 100, groupId: 1 });
    chrome.addTab({ id: 30, windowId: 100, groupId: 2 });

    // Tab 30 lives in Home — activating it (e.g. an open-tab launcher result, or a
    // Chrome tab-strip click) moves the window to Home.
    coordinator.enqueue(tabActivated(30, 100));
    await coordinator.idle();

    // The window switched to Home: Home's group is shown, Work's collapsed.
    expect(store.state.activeSpaceByWindow[100]).toBe('home');
    expect(chrome.groups.get(2)?.collapsed).toBe(false);
    expect(chrome.groups.get(1)?.collapsed).toBe(true);
    // The broadcast the sidebar reconciles against carries the switched Space.
    const lastBroadcast = broadcast.mock.calls.at(-1)?.[0];
    expect(lastBroadcast?.state.activeSpaceByWindow[100]).toBe('home');
  });

  test('activating a temp tab already in the active Space does NOT re-switch', async () => {
    const { coordinator, store } = makeCoordinator();
    store.state.spaces.push(space('work'), space('home'));
    store.state.activeSpaceByWindow[100] = 'work';
    store.state.spaceInstancesByWindow[100] = {
      work: { spaceId: 'work', groupId: 1, tempTabIds: [17, 22], tempTabTitles: {} },
      home: { spaceId: 'home', groupId: 2, tempTabIds: [30], tempTabTitles: {} },
    };
    for (const id of [17, 22, 30]) store.state.liveTabsById[id] = live(id, 100);
    chrome.addGroup({ id: 1, windowId: 100, collapsed: false });
    chrome.addGroup({ id: 2, windowId: 100, collapsed: true });

    coordinator.enqueue(tabActivated(22, 100));
    await coordinator.idle();

    // Same Space → the idempotent helper no-ops; no orchestration ran.
    expect(store.state.activeSpaceByWindow[100]).toBe('work');
    expect(didOrchestrateSwitch(chrome.calls)).toBe(false);
  });

  test('activating a global favorite never switches the window Space', async () => {
    const { coordinator, store } = makeCoordinator();
    store.state.spaces.push(space('work'), space('home'));
    store.state.activeSpaceByWindow[100] = 'work';
    store.state.spaceInstancesByWindow[100] = {
      work: { spaceId: 'work', groupId: 1, tempTabIds: [17], tempTabTitles: {} },
      home: { spaceId: 'home', groupId: 2, tempTabIds: [], tempTabTitles: {} },
    };
    store.state.savedTabs.f1 = {
      id: 'f1',
      spaceId: null,
      title: 'F1',
      originalURL: 'https://f1/',
      currentURL: null,
    };
    store.state.faviconRow = ['f1'];
    store.state.tabBindings.f1 = { 100: 88 };
    for (const id of [17, 88]) store.state.liveTabsById[id] = live(id, 100);
    chrome.addGroup({ id: 1, windowId: 100, collapsed: false });
    chrome.addGroup({ id: 2, windowId: 100, collapsed: true });

    // 88 is a bound global favorite (spaceId === null) — no owning Space.
    coordinator.enqueue(tabActivated(88, 100));
    await coordinator.idle();

    expect(store.state.activeSpaceByWindow[100]).toBe('work');
    expect(didOrchestrateSwitch(chrome.calls)).toBe(false);
  });

  test('activating an ungrouped/untracked tab never switches the window Space', async () => {
    const { coordinator, store } = makeCoordinator();
    store.state.spaces.push(space('work'));
    store.state.activeSpaceByWindow[100] = 'work';
    store.state.spaceInstancesByWindow[100] = {
      work: { spaceId: 'work', groupId: 1, tempTabIds: [17], tempTabTitles: {} },
    };
    store.state.liveTabsById[17] = live(17, 100);
    chrome.addGroup({ id: 1, windowId: 100, collapsed: false });

    // 999 is untracked — no instance lists it, no binding holds it.
    coordinator.enqueue(tabActivated(999, 100));
    await coordinator.idle();

    expect(store.state.activeSpaceByWindow[100]).toBe('work');
    expect(didOrchestrateSwitch(chrome.calls)).toBe(false);
  });

  test('a single activation produces a single switch — the re-fired onActivated in the now-active Space does NOT switch again (D4)', async () => {
    const { coordinator, store } = makeCoordinator();
    store.state.spaces.push(space('work'), space('home'));
    store.state.activeSpaceByWindow[100] = 'work';
    store.state.spaceInstancesByWindow[100] = {
      work: { spaceId: 'work', groupId: 1, tempTabIds: [17], tempTabTitles: {} },
      home: { spaceId: 'home', groupId: 2, tempTabIds: [30, 31], tempTabTitles: {} },
    };
    for (const id of [17, 30, 31]) store.state.liveTabsById[id] = live(id, 100);
    chrome.addGroup({ id: 1, windowId: 100, collapsed: false });
    chrome.addGroup({ id: 2, windowId: 100, collapsed: true });

    // First activation: tab 30 in Home → switch to Home (one collapse of Work).
    coordinator.enqueue(tabActivated(30, 100));
    await coordinator.idle();
    expect(store.state.activeSpaceByWindow[100]).toBe('home');
    const collapsesAfterFirst = chrome.calls.filter((c) =>
      c.startsWith('tabGroups.update:collapsed=true'),
    ).length;
    expect(collapsesAfterFirst).toBe(1);

    // The switch's own focus-tab activation re-fires onActivated for a tab now in
    // the active Space (Home). It must NOT switch again — the owner equals the
    // active Space, so the helper no-ops: still exactly one switch.
    coordinator.enqueue(tabActivated(31, 100));
    await coordinator.idle();
    expect(store.state.activeSpaceByWindow[100]).toBe('home');
    const collapsesAfterSecond = chrome.calls.filter((c) =>
      c.startsWith('tabGroups.update:collapsed=true'),
    ).length;
    expect(collapsesAfterSecond).toBe(1);
  });
});
