import { describe, expect, test } from 'vitest';
import { makeStore } from './store.test-helpers';
import type { LiveTab, SavedTab, SpaceId, SpaceInstance } from './types';

function makeInstance(spaceId: SpaceId, groupId: number, tempTabIds: number[]): SpaceInstance {
  return { spaceId, groupId, tempTabIds, tempTabTitles: {} };
}

function liveTab(partial: Partial<LiveTab> = {}): LiveTab {
  return {
    tabId: partial.tabId ?? 42,
    windowId: partial.windowId ?? 100,
    title: partial.title ?? 'Example',
    url: partial.url ?? 'https://example.com/',
    active: partial.active ?? false,
    status: partial.status ?? 'complete',
  };
}

function savedTab(partial: Partial<SavedTab> = {}): SavedTab {
  return {
    id: partial.id ?? 'st-1',
    spaceId: partial.spaceId ?? 'work',
    title: partial.title ?? 'GitHub',
    originalURL: partial.originalURL ?? 'https://github.com/',
    currentURL: partial.currentURL ?? null,
  };
}

describe('LunmaStore.reconcileTabOwnership (prevent-space-group-collapse)', () => {
  test('keeps a duplicated tab in the group-matching owner and strips the rest', () => {
    const store = makeStore();
    store.state.spaceInstancesByWindow[100] = {
      work: makeInstance('work', 11, [42]),
      side: makeInstance('side', 22, [42]),
    };
    store.state.activeSpaceByWindow[100] = 'work';
    // Tab 42's live Chrome group is 22 → "side" is the correct owner.
    store.reconcileTabOwnership(new Map([[42, 22]]));
    expect(store.state.spaceInstancesByWindow[100]?.side?.tempTabIds).toEqual([42]);
    expect(store.state.spaceInstancesByWindow[100]?.work?.tempTabIds).toEqual([]);
  });

  test('a tab in three instances converges to the group-matching owner', () => {
    const store = makeStore();
    store.state.spaceInstancesByWindow[100] = {
      a: makeInstance('a', 11, [7]),
      b: makeInstance('b', 22, [7]),
      c: makeInstance('c', 33, [7]),
    };
    store.state.activeSpaceByWindow[100] = 'a';
    store.reconcileTabOwnership(new Map([[7, 33]])); // live group 33 → "c"
    expect(store.state.spaceInstancesByWindow[100]?.a?.tempTabIds).toEqual([]);
    expect(store.state.spaceInstancesByWindow[100]?.b?.tempTabIds).toEqual([]);
    expect(store.state.spaceInstancesByWindow[100]?.c?.tempTabIds).toEqual([7]);
  });

  test('falls back to the active instance when the live group maps nowhere', () => {
    const store = makeStore();
    store.state.spaceInstancesByWindow[100] = {
      work: makeInstance('work', 11, [42]),
      side: makeInstance('side', 22, [42]),
    };
    store.state.activeSpaceByWindow[100] = 'side';
    // Tab 42's live group (99) matches no instance → keep it in the active "side".
    store.reconcileTabOwnership(new Map([[42, 99]]));
    expect(store.state.spaceInstancesByWindow[100]?.side?.tempTabIds).toEqual([42]);
    expect(store.state.spaceInstancesByWindow[100]?.work?.tempTabIds).toEqual([]);
  });

  test('prunes the tempTabTitles of evicted instances', () => {
    const store = makeStore();
    const work = makeInstance('work', 11, [42]);
    work.tempTabTitles = { 42: 'Renamed in work' };
    const side = makeInstance('side', 22, [42]);
    side.tempTabTitles = { 42: 'Renamed in side' };
    store.state.spaceInstancesByWindow[100] = { work, side };
    store.state.activeSpaceByWindow[100] = 'work';
    store.reconcileTabOwnership(new Map([[42, 22]])); // owner is "side"
    expect(store.state.spaceInstancesByWindow[100]?.work?.tempTabTitles).toEqual({});
    expect(store.state.spaceInstancesByWindow[100]?.side?.tempTabTitles).toEqual({
      42: 'Renamed in side',
    });
  });

  test('is idempotent — a second pass makes no further change', () => {
    const store = makeStore();
    store.state.spaceInstancesByWindow[100] = {
      work: makeInstance('work', 11, [42]),
      side: makeInstance('side', 22, [42]),
    };
    store.state.activeSpaceByWindow[100] = 'work';
    const map = new Map([[42, 22]]);
    store.reconcileTabOwnership(map);
    store.reconcileTabOwnership(map);
    expect(store.state.spaceInstancesByWindow[100]?.side?.tempTabIds).toEqual([42]);
    expect(store.state.spaceInstancesByWindow[100]?.work?.tempTabIds).toEqual([]);
  });

  test('does not touch a tab owned by exactly one instance', () => {
    const store = makeStore();
    store.state.spaceInstancesByWindow[100] = {
      work: makeInstance('work', 11, [1, 2]),
      side: makeInstance('side', 22, [3]),
    };
    store.state.activeSpaceByWindow[100] = 'work';
    store.reconcileTabOwnership(
      new Map([
        [1, 11],
        [2, 11],
        [3, 22],
      ]),
    );
    expect(store.state.spaceInstancesByWindow[100]?.work?.tempTabIds).toEqual([1, 2]);
    expect(store.state.spaceInstancesByWindow[100]?.side?.tempTabIds).toEqual([3]);
  });

  test('does not cross-evict the same Space active in two windows', () => {
    const store = makeStore();
    store.state.spaceInstancesByWindow[100] = { work: makeInstance('work', 11, [42]) };
    store.state.spaceInstancesByWindow[200] = { work: makeInstance('work', 33, [99]) };
    store.state.activeSpaceByWindow[100] = 'work';
    store.state.activeSpaceByWindow[200] = 'work';
    store.reconcileTabOwnership(
      new Map([
        [42, 11],
        [99, 33],
      ]),
    );
    expect(store.state.spaceInstancesByWindow[100]?.work?.tempTabIds).toEqual([42]);
    expect(store.state.spaceInstancesByWindow[200]?.work?.tempTabIds).toEqual([99]);
  });

  test("heals the reporter's Anonymous / Anonymous 2 / Stars overlap (one group -1)", () => {
    const store = makeStore();
    // The reported window: tabs 478359468 / 392 / 393 listed in all three
    // instances at once; "Anonymous 2" had lost its live group (groupId -1).
    const shared = [478359468, 392, 393];
    store.state.spaceInstancesByWindow[100] = {
      anon: makeInstance('anon', 11, [...shared]),
      anon2: makeInstance('anon2', -1, [...shared]),
      stars: makeInstance('stars', 22, [...shared]),
    };
    store.state.activeSpaceByWindow[100] = 'anon2';
    // All three tabs live in Chrome group 11 (Anonymous's real group).
    store.reconcileTabOwnership(new Map(shared.map((id): [number, number] => [id, 11])));
    expect(store.state.spaceInstancesByWindow[100]?.anon?.tempTabIds).toEqual(shared);
    expect(store.state.spaceInstancesByWindow[100]?.anon2?.tempTabIds).toEqual([]);
    expect(store.state.spaceInstancesByWindow[100]?.stars?.tempTabIds).toEqual([]);
  });
});

describe('LunmaStore.releaseTabsInUntrackedGroups (preserve-user-tab-groups D5)', () => {
  test('strips a temp tab whose live group is untracked', () => {
    const store = makeStore();
    store.state.spaceInstancesByWindow[100] = {
      work: makeInstance('work', 11, [30, 31]),
    };
    // Tab 30 lives in untracked group 55; tab 31 is ungrouped (-1, absent from the map).
    store.releaseTabsInUntrackedGroups(new Map([[30, 55]]));
    expect(store.state.spaceInstancesByWindow[100]?.work?.tempTabIds).toEqual([31]);
  });

  test('leaves a tab in a tracked group untouched', () => {
    const store = makeStore();
    store.state.spaceInstancesByWindow[100] = {
      work: makeInstance('work', 11, [30]),
      side: makeInstance('side', 22, []),
    };
    // Tab 30's live group (11) is tracked by "work" itself.
    store.releaseTabsInUntrackedGroups(new Map([[30, 11]]));
    expect(store.state.spaceInstancesByWindow[100]?.work?.tempTabIds).toEqual([30]);
  });

  test('leaves an ungrouped tab (absent from the map) untouched', () => {
    const store = makeStore();
    store.state.spaceInstancesByWindow[100] = { work: makeInstance('work', 11, [30]) };
    store.releaseTabsInUntrackedGroups(new Map());
    expect(store.state.spaceInstancesByWindow[100]?.work?.tempTabIds).toEqual([30]);
  });

  test('drops the released tab tempTabTitles entry', () => {
    const store = makeStore();
    const work = makeInstance('work', 11, [30]);
    work.tempTabTitles = { 30: 'Renamed' };
    store.state.spaceInstancesByWindow[100] = { work };
    store.releaseTabsInUntrackedGroups(new Map([[30, 55]]));
    expect(store.state.spaceInstancesByWindow[100]?.work?.tempTabTitles).toEqual({});
  });

  test('is idempotent — a second pass with the same map finds nothing left', () => {
    const store = makeStore();
    store.state.spaceInstancesByWindow[100] = { work: makeInstance('work', 11, [30]) };
    const map = new Map([[30, 55]]);
    store.releaseTabsInUntrackedGroups(map);
    store.releaseTabsInUntrackedGroups(map);
    expect(store.state.spaceInstancesByWindow[100]?.work?.tempTabIds).toEqual([]);
  });

  test('scopes release per window — the same Space active in two windows is unaffected across windows', () => {
    const store = makeStore();
    store.state.spaceInstancesByWindow[100] = { work: makeInstance('work', 11, [30]) };
    store.state.spaceInstancesByWindow[200] = { work: makeInstance('work', 33, [99]) };
    // Tab 30 (window 100) is in an untracked group; tab 99 (window 200) is tracked there.
    store.releaseTabsInUntrackedGroups(
      new Map([
        [30, 55],
        [99, 33],
      ]),
    );
    expect(store.state.spaceInstancesByWindow[100]?.work?.tempTabIds).toEqual([]);
    expect(store.state.spaceInstancesByWindow[200]?.work?.tempTabIds).toEqual([99]);
  });
});

describe('LunmaStore.onTabGroupIdChanged (preserve-user-tab-groups D6)', () => {
  test('releases a temp tab moved into an untracked group', () => {
    const store = makeStore();
    store.state.spaceInstancesByWindow[100] = { work: makeInstance('work', 11, [30]) };
    store.state.liveTabsById[30] = liveTab({ tabId: 30, windowId: 100 });
    store.onTabGroupIdChanged(30, 55); // 55 is recorded by no instance
    expect(store.state.spaceInstancesByWindow[100]?.work?.tempTabIds).toEqual([]);
  });

  test('drops tempTabTitles for the released tab', () => {
    const store = makeStore();
    const work = makeInstance('work', 11, [30]);
    work.tempTabTitles = { 30: 'Renamed' };
    store.state.spaceInstancesByWindow[100] = { work };
    store.state.liveTabsById[30] = liveTab({ tabId: 30, windowId: 100 });
    store.onTabGroupIdChanged(30, 55);
    expect(store.state.spaceInstancesByWindow[100]?.work?.tempTabTitles).toEqual({});
  });

  test('reassigns a tab moved into a tracked group to that Space', () => {
    const store = makeStore();
    store.state.spaceInstancesByWindow[100] = {
      work: makeInstance('work', 11, [30]),
      side: makeInstance('side', 22, []),
    };
    store.state.liveTabsById[30] = liveTab({ tabId: 30, windowId: 100 });
    store.onTabGroupIdChanged(30, 22); // 22 is "side"'s live group
    expect(store.state.spaceInstancesByWindow[100]?.work?.tempTabIds).toEqual([]);
    expect(store.state.spaceInstancesByWindow[100]?.side?.tempTabIds).toEqual([30]);
  });

  test('is a no-op (no reorder) when the target Space already solely owns the tab', () => {
    const store = makeStore();
    store.state.spaceInstancesByWindow[100] = { work: makeInstance('work', 11, [7, 30]) };
    store.state.liveTabsById[30] = liveTab({ tabId: 30, windowId: 100 });
    store.onTabGroupIdChanged(30, 11); // 11 is "work"'s own live group; 30 already owned solely by "work"
    expect(store.state.spaceInstancesByWindow[100]?.work?.tempTabIds).toEqual([7, 30]);
  });

  test('groupId -1 (ungrouped) is a no-op', () => {
    const store = makeStore();
    store.state.spaceInstancesByWindow[100] = { work: makeInstance('work', 11, [30]) };
    store.state.liveTabsById[30] = liveTab({ tabId: 30, windowId: 100 });
    store.onTabGroupIdChanged(30, -1);
    expect(store.state.spaceInstancesByWindow[100]?.work?.tempTabIds).toEqual([30]);
  });

  test('a bound tab is never released or moved', () => {
    const store = makeStore();
    store.state.savedTabs['st-1'] = savedTab({ id: 'st-1', spaceId: 'work' });
    store.state.tabBindings['st-1'] = { 100: 30 };
    store.state.spaceInstancesByWindow[100] = {
      work: makeInstance('work', 11, []),
      side: makeInstance('side', 22, []),
    };
    store.state.liveTabsById[30] = liveTab({ tabId: 30, windowId: 100 });
    // Bound tab 30 moves into "side"'s tracked group — assignSpaceTabs skips bound
    // tabs, so it must not appear as a temp tab anywhere, and the binding stands.
    store.onTabGroupIdChanged(30, 22);
    expect(store.state.spaceInstancesByWindow[100]?.work?.tempTabIds).toEqual([]);
    expect(store.state.spaceInstancesByWindow[100]?.side?.tempTabIds).toEqual([]);
    expect(store.state.tabBindings['st-1']).toEqual({ 100: 30 });
  });

  test('is a no-op when the tab is not yet mirrored in liveTabsById', () => {
    const store = makeStore();
    store.state.spaceInstancesByWindow[100] = { work: makeInstance('work', 11, [30]) };
    // Tab 30 has no liveTabsById entry — window cannot be resolved.
    store.onTabGroupIdChanged(30, 55);
    expect(store.state.spaceInstancesByWindow[100]?.work?.tempTabIds).toEqual([30]);
  });

  test('scopes reconciliation per window — the same Space active in two windows is unaffected across windows', () => {
    const store = makeStore();
    store.state.spaceInstancesByWindow[100] = { work: makeInstance('work', 11, [30]) };
    store.state.spaceInstancesByWindow[200] = { work: makeInstance('work', 33, [99]) };
    store.state.liveTabsById[30] = liveTab({ tabId: 30, windowId: 100 });
    store.onTabGroupIdChanged(30, 77); // untracked in window 100
    expect(store.state.spaceInstancesByWindow[100]?.work?.tempTabIds).toEqual([]);
    expect(store.state.spaceInstancesByWindow[200]?.work?.tempTabIds).toEqual([99]);
  });
});
