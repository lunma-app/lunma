import { describe, expect, test, vi } from 'vitest';
import type { LunmaStore } from './store.svelte';
import { makeStore, seedSpace } from './store.test-helpers';
import type { PinNode, SavedTab } from './types';

function savedTab(partial: Partial<SavedTab> = {}): SavedTab {
  return {
    id: partial.id ?? 'st-1',
    // `spaceId` may legitimately be `null` (a favorite), so don't `??`-coalesce it.
    spaceId: partial.spaceId === undefined ? 'work' : partial.spaceId,
    title: partial.title ?? 'GitHub',
    originalURL: partial.originalURL ?? 'https://github.com/',
    currentURL: partial.currentURL ?? null,
  };
}

const tabs = (...ids: string[]): PinNode[] => ids.map((id) => ({ kind: 'tab', id }));

/** Seed `savedTabs` records for `ids` so placement validation keeps them. */
function seedSaved(store: LunmaStore, ...ids: string[]): void {
  for (const id of ids) store.state.savedTabs[id] = savedTab({ id });
}

describe('LunmaStore.addFavorite', () => {
  test('splices a favorite into faviconRow at the given index', () => {
    const store = makeStore();
    store.state.faviconRow = ['f1', 'f3'];
    store.addFavorite('f2', 1);
    expect(store.state.faviconRow).toEqual(['f1', 'f2', 'f3']);
  });

  test('clamps an out-of-range index', () => {
    const store = makeStore();
    store.state.faviconRow = ['f1'];
    store.addFavorite('f2', 99);
    expect(store.state.faviconRow).toEqual(['f1', 'f2']);
  });

  test('is a no-op when the id is already present', () => {
    const store = makeStore();
    store.state.faviconRow = ['f1', 'f2'];
    store.addFavorite('f1', 0);
    expect(store.state.faviconRow).toEqual(['f1', 'f2']);
  });
});

describe('LunmaStore.reorderFavorites', () => {
  test('replaces the order with the requested one', () => {
    const store = makeStore();
    store.state.faviconRow = ['f1', 'f2', 'f3'];
    store.reorderFavorites(['f3', 'f1', 'f2']);
    expect(store.state.faviconRow).toEqual(['f3', 'f1', 'f2']);
  });

  test('keeps only present ids and appends an omitted present id (race safety)', () => {
    const store = makeStore();
    store.state.faviconRow = ['f1', 'f2', 'f3'];
    // 'ghost' is not present (dropped); 'f3' was omitted (appended).
    store.reorderFavorites(['f2', 'ghost', 'f1']);
    expect(store.state.faviconRow).toEqual(['f2', 'f1', 'f3']);
  });
});

describe('LunmaStore decouple/couple (favicon-row-model)', () => {
  test('moveSavedTabToFavorites decouples a pinned tab to a global favorite', () => {
    const store = makeStore();
    const space = seedSpace(store);
    store.state.savedTabs.t1 = savedTab({ id: 't1', spaceId: space.id });
    seedSaved(store, 't2');
    store.state.savedTabs.t2 = savedTab({ id: 't2', spaceId: space.id });
    store.setPinned(space.id, tabs('t1', 't2'));

    store.moveSavedTabToFavorites('t1');

    // spaceId flips to null, the record leaves pinnedBySpace and enters faviconRow.
    expect(store.state.savedTabs.t1?.spaceId).toBeNull();
    expect(store.state.pinnedBySpace[space.id]).toEqual(tabs('t2'));
    expect(store.state.faviconRow).toEqual(['t1']);
  });

  test('moveSavedTabToFavorites keeps exactly one placement (no duplicate)', () => {
    const store = makeStore();
    const space = seedSpace(store);
    store.state.savedTabs.t1 = savedTab({ id: 't1', spaceId: space.id });
    store.setPinned(space.id, tabs('t1'));
    store.moveSavedTabToFavorites('t1');
    const inPinned = (store.state.pinnedBySpace[space.id] ?? []).some(
      (n) => n.kind === 'tab' && n.id === 't1',
    );
    expect(inPinned).toBe(false);
    expect(store.state.faviconRow.filter((id) => id === 't1')).toEqual(['t1']);
  });

  test('moveSavedTabToFavorites is an idempotent no-op when already a favorite', () => {
    const store = makeStore();
    store.state.savedTabs.f1 = savedTab({ id: 'f1', spaceId: null });
    store.state.faviconRow = ['f1'];
    store.moveSavedTabToFavorites('f1');
    expect(store.state.savedTabs.f1?.spaceId).toBeNull();
    expect(store.state.faviconRow).toEqual(['f1']);
  });

  test('moveSavedTabToSpace couples a favorite into a Space at the index', () => {
    const store = makeStore();
    const space = seedSpace(store);
    store.state.savedTabs.f1 = savedTab({ id: 'f1', spaceId: null });
    store.state.savedTabs.p1 = savedTab({ id: 'p1', spaceId: space.id });
    store.state.faviconRow = ['f1'];
    store.setPinned(space.id, tabs('p1'));

    store.moveSavedTabToSpace('f1', space.id, 0);

    expect(store.state.savedTabs.f1?.spaceId).toBe(space.id);
    expect(store.state.faviconRow).toEqual([]);
    expect(store.state.pinnedBySpace[space.id]).toEqual(tabs('f1', 'p1'));
  });

  test('couple then decouple round-trips placement and spaceId', () => {
    const store = makeStore();
    const space = seedSpace(store);
    store.state.savedTabs.f1 = savedTab({ id: 'f1', spaceId: null });
    store.state.faviconRow = ['f1'];

    store.moveSavedTabToSpace('f1', space.id, 0);
    expect(store.state.savedTabs.f1?.spaceId).toBe(space.id);
    expect(store.state.faviconRow).toEqual([]);

    store.moveSavedTabToFavorites('f1');
    expect(store.state.savedTabs.f1?.spaceId).toBeNull();
    expect(store.state.faviconRow).toEqual(['f1']);
    expect(store.state.pinnedBySpace[space.id]).toEqual([]);
  });

  test('move mutators log on an unknown id', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const store = makeStore();
    store.moveSavedTabToFavorites('nope');
    store.moveSavedTabToSpace('nope', 'work', 0);
    expect(errorSpy).toHaveBeenCalledTimes(2);
    errorSpy.mockRestore();
  });
});

describe('LunmaStore.removeSavedTab cleans faviconRow', () => {
  test('drops a favorite from faviconRow and savedTabs with no dangling id', () => {
    const store = makeStore();
    store.state.savedTabs.f1 = savedTab({ id: 'f1', spaceId: null });
    store.state.savedTabs.f2 = savedTab({ id: 'f2', spaceId: null });
    store.state.tabBindings.f1 = { 100: 42 };
    store.state.faviconRow = ['f1', 'f2'];

    store.removeSavedTab('f1');

    expect(store.state.savedTabs.f1).toBeUndefined();
    expect(store.state.tabBindings.f1).toBeUndefined();
    expect(store.state.faviconRow).toEqual(['f2']);
  });
});

describe('LunmaStore.registerSavedTab accepts a null-Space favorite', () => {
  test('stores a spaceId:null record verbatim with an empty binding', () => {
    const store = makeStore();
    const fav = savedTab({ id: 'f1', spaceId: null });
    store.registerSavedTab(fav);
    expect(store.state.savedTabs.f1?.spaceId).toBeNull();
    expect(store.state.tabBindings.f1).toEqual({});
  });
});
