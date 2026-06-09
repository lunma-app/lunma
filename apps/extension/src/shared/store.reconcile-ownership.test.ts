import { describe, expect, test } from 'vitest';
import { makeStore } from './store.test-helpers';
import type { SpaceId, SpaceInstance } from './types';

function makeInstance(spaceId: SpaceId, groupId: number, tempTabIds: number[]): SpaceInstance {
  return { spaceId, groupId, tempTabIds, tempTabTitles: {} };
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
