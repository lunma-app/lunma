import { describe, expect, test } from 'vitest';
import type { LunmaStore } from './store.svelte';
import { makeStore, seedSpace } from './store.test-helpers';
import type { SpaceId, TabId, WindowId } from './types';

const WINDOW: WindowId = 100;

/** Seed a Space instance in WINDOW with `tempTabIds`, and a live tab per entry
 * of `urls` (keyed by the same id). An id absent from `urls` gets NO live tab. */
function seed(
  store: LunmaStore,
  tempTabIds: TabId[],
  urls: Record<number, string>,
  windowOf: Record<number, WindowId> = {},
): SpaceId {
  const space = seedSpace(store);
  store.state.spaceInstancesByWindow[WINDOW] = {
    [space.id]: { spaceId: space.id, groupId: 1, tempTabIds, tempTabTitles: {} },
  };
  store.state.activeSpaceByWindow[WINDOW] = space.id;
  for (const [id, url] of Object.entries(urls)) {
    const tabId = Number(id);
    store.state.liveTabsById[tabId] = {
      tabId,
      windowId: windowOf[tabId] ?? WINDOW,
      title: '',
      url,
      active: false,
      status: 'complete',
    };
  }
  return space.id;
}

const order = (store: LunmaStore, spaceId: SpaceId): TabId[] | undefined =>
  store.state.spaceInstancesByWindow[WINDOW]?.[spaceId]?.tempTabIds;

describe('LunmaStore.groupTempTabsBySite', () => {
  test('clusters same-host tabs and reports the change', () => {
    const store = makeStore();
    const spaceId = seed(store, [1, 2, 3, 4, 5], {
      1: 'https://a.com/1',
      2: 'https://b.com/1',
      3: 'https://a.com/2',
      4: 'https://c.com/1',
      5: 'https://b.com/2',
    });
    expect(store.groupTempTabsBySite(WINDOW, spaceId)).toBe(true);
    expect(order(store, spaceId)).toEqual([1, 3, 2, 5, 4]);
  });

  test('returns false and does not mutate an already-clustered list', () => {
    const store = makeStore();
    const spaceId = seed(store, [1, 2, 3], {
      1: 'https://a.com/1',
      2: 'https://a.com/2',
      3: 'https://b.com/1',
    });
    const before = [...(order(store, spaceId) ?? [])];
    expect(store.groupTempTabsBySite(WINDOW, spaceId)).toBe(false);
    expect(order(store, spaceId)).toEqual(before);
  });

  test('is idempotent — a second call reports no change', () => {
    const store = makeStore();
    const spaceId = seed(store, [1, 2, 3], {
      1: 'https://a.com/1',
      2: 'https://b.com/1',
      3: 'https://a.com/2',
    });
    expect(store.groupTempTabsBySite(WINDOW, spaceId)).toBe(true);
    const once = [...(order(store, spaceId) ?? [])];
    expect(store.groupTempTabsBySite(WINDOW, spaceId)).toBe(false);
    expect(order(store, spaceId)).toEqual(once);
  });

  test('leaves an id with no live tab in its current slot', () => {
    const store = makeStore();
    // 2 has no live tab: it must stay at index 1 while 1/3/4 cluster around it.
    const spaceId = seed(store, [1, 2, 3, 4], {
      1: 'https://a.com/1',
      3: 'https://b.com/1',
      4: 'https://a.com/2',
    });
    expect(store.groupTempTabsBySite(WINDOW, spaceId)).toBe(true);
    expect(order(store, spaceId)).toEqual([1, 2, 4, 3]);
  });

  test('a row whose live tab reports another window still clusters — it is rendered, so it moves', () => {
    // Regression: filtering by windowId here left such a row pinned in place as an
    // immovable pivot, splitting a site's cluster around it ("What's new" stuck
    // mid-list). TempTabs renders any id with a live record, so grouping must move
    // the same set.
    const store = makeStore();
    const spaceId = seed(
      store,
      [1, 2, 3, 4],
      { 1: 'https://a.com/1', 2: 'https://z.com/1', 3: 'https://b.com/1', 4: 'https://a.com/2' },
      { 2: 999 },
    );
    expect(store.groupTempTabsBySite(WINDOW, spaceId)).toBe(true);
    expect(order(store, spaceId)).toEqual([1, 4, 2, 3]);
  });

  test('browser pages are collected after the sites', () => {
    const store = makeStore();
    const spaceId = seed(store, [1, 2, 3, 4], {
      1: 'https://a.com/1',
      2: 'chrome://whats-new/',
      3: 'https://a.com/2',
      4: 'chrome://extensions/',
    });
    expect(store.groupTempTabsBySite(WINDOW, spaceId)).toBe(true);
    expect(order(store, spaceId)).toEqual([1, 3, 2, 4]);
  });

  test('tabs whose url has no parseable host land with the browser pages, last', () => {
    const store = makeStore();
    const spaceId = seed(store, [1, 2, 3, 4], {
      1: 'https://a.com/1',
      2: 'blob:xyz',
      3: 'https://a.com/2',
      4: 'not a url',
    });
    expect(store.groupTempTabsBySite(WINDOW, spaceId)).toBe(true);
    expect(order(store, spaceId)).toEqual([1, 3, 2, 4]);
  });

  test('returns false without throwing when the (window, Space) has no instance', () => {
    const store = makeStore();
    const space = seedSpace(store);
    expect(() => store.groupTempTabsBySite(WINDOW, space.id)).not.toThrow();
    expect(store.groupTempTabsBySite(WINDOW, space.id)).toBe(false);
  });

  test('scoped by spaceId — a background Space groups its own instance only', () => {
    const store = makeStore();
    const active = seedSpace(store, { id: 'active', name: 'Active' });
    const background = seedSpace(store, { id: 'background', name: 'Background' });
    store.state.spaceInstancesByWindow[WINDOW] = {
      [active.id]: { spaceId: active.id, groupId: 1, tempTabIds: [10, 20], tempTabTitles: {} },
      [background.id]: {
        spaceId: background.id,
        groupId: 2,
        tempTabIds: [30, 40, 50],
        tempTabTitles: {},
      },
    };
    store.state.activeSpaceByWindow[WINDOW] = active.id;
    for (const [id, url] of [
      [10, 'https://a.com/'],
      [20, 'https://b.com/'],
      [30, 'https://x.com/1'],
      [40, 'https://y.com/1'],
      [50, 'https://x.com/2'],
    ] as const) {
      store.state.liveTabsById[id] = {
        tabId: id,
        windowId: WINDOW,
        title: '',
        url,
        active: false,
        status: 'complete',
      };
    }
    expect(store.groupTempTabsBySite(WINDOW, background.id)).toBe(true);
    expect(store.state.spaceInstancesByWindow[WINDOW]?.[background.id]?.tempTabIds).toEqual([
      30, 50, 40,
    ]);
    expect(store.state.spaceInstancesByWindow[WINDOW]?.[active.id]?.tempTabIds).toEqual([10, 20]);
  });
});
