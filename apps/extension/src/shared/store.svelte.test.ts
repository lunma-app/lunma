import { describe, expect, test } from 'vitest';
import type { CURRENT_SCHEMA_VERSION } from './schemas';
import { LunmaStore, SCHEMA_VERSION } from './store.svelte';

// Compile-time guard: SCHEMA_VERSION must stay in lockstep with CURRENT_SCHEMA_VERSION.
const _schemaVersionCheck: typeof CURRENT_SCHEMA_VERSION = SCHEMA_VERSION;

import { makeStore, seedSpace } from './store.test-helpers';
import type { SavedTab } from './types';

function savedTab(partial: Partial<SavedTab> = {}): SavedTab {
  return {
    id: partial.id ?? 'st-1',
    spaceId: partial.spaceId ?? 'work',
    title: partial.title ?? 'GitHub',
    originalURL: partial.originalURL ?? 'https://github.com/',
    currentURL: partial.currentURL ?? null,
  };
}

describe('LunmaStore defaults', () => {
  test('default idFactory produces unique non-empty ids', () => {
    const store = new LunmaStore();
    store.createSpace({ name: 'A', color: 'red', icon: 'star' });
    store.createSpace({ name: 'B', color: 'blue', icon: 'star' });
    expect(store.state.spaces[0]?.id).toBeTruthy();
    expect(store.state.spaces[1]?.id).toBeTruthy();
    expect(store.state.spaces[0]?.id).not.toBe(store.state.spaces[1]?.id);
  });
});

describe('LunmaStore invariants', () => {
  test('a tab id is never in both tempTabIds and tabBindings', () => {
    const store = makeStore();
    const space = seedSpace(store);
    store.state.savedTabs['st-1'] = savedTab({ spaceId: space.id });
    store.state.spaceInstancesByWindow[100] = {
      [space.id]: {
        spaceId: space.id,
        groupId: 1,
        tempTabIds: [42],
        tempTabTitles: {},
      },
    };
    store.bindSavedTab('st-1', 100, 42, 'https://github.com/');
    expect(store.state.spaceInstancesByWindow[100]?.[space.id]?.tempTabIds).not.toContain(42);
    expect(store.state.tabBindings['st-1']).toEqual({ 100: 42 });
  });

  test('persisted state shape has no order field on Space records', () => {
    const store = makeStore();
    const space = seedSpace(store);
    expect(Object.hasOwn(space, 'order')).toBe(false);
    const first = store.state.spaces[0];
    expect(first).toBeDefined();
    expect(Object.hasOwn(first as object, 'order')).toBe(false);
  });

  test('persisted state shape has no order field on saved-tab records', () => {
    const store = makeStore();
    store.state.savedTabs['st-1'] = savedTab();
    const st = store.state.savedTabs['st-1'];
    expect(st).toBeDefined();
    expect(Object.hasOwn(st as object, 'order')).toBe(false);
  });

  test('two consecutive mutator calls land in $state in source order with no microtask between them', () => {
    const store = makeStore();
    store.createSpace({ name: 'A', color: 'red', icon: 'star' });
    store.createSpace({ name: 'B', color: 'blue', icon: 'star' });
    expect(store.state.spaces.map((s) => s.name)).toEqual(['A', 'B']);
  });

  test('mutator returns undefined (not a Promise) and effect is visible on the next line', () => {
    const store = makeStore();
    const result: unknown = store.createSpace({ name: 'A', color: 'red', icon: 'star' });
    expect(result).toBeUndefined();
    expect(store.state.spaces).toHaveLength(1);
  });
});

describe('LunmaStore constructor rejects persist/broadcast options', () => {
  test('persist/broadcast are not part of LunmaStoreOptions', () => {
    // @ts-expect-error - persist option must not be accepted
    new LunmaStore({ persist: () => undefined });
    // @ts-expect-error - broadcast option must not be accepted
    new LunmaStore({ broadcast: () => undefined });
  });
});

describe('LunmaStore tolerates undefined entries in window maps', () => {
  test('deleteSpace skips undefined instance entries', () => {
    const store = makeStore();
    const space = seedSpace(store);
    seedSpace(store, { id: 'keep' });
    store.state.spaceInstancesByWindow[100] = {
      [space.id]: { spaceId: space.id, groupId: 1, tempTabIds: [], tempTabTitles: {} },
    };
    store.state.spaceInstancesByWindow[200] = undefined;
    store.state.activeSpaceByWindow[100] = space.id;
    store.state.activeSpaceByWindow[200] = null;
    store.deleteSpace(space.id);
    expect(store.state.spaceInstancesByWindow[100]).toBeUndefined();
  });

  test('onTabRemoved skips undefined instance entries', () => {
    const store = makeStore();
    store.state.spaceInstancesByWindow[100] = undefined;
    store.onTabRemoved(42, {});
    expect(store.state.spaceInstancesByWindow[100]).toBeUndefined();
  });

  test('bindSavedTab skips undefined instance entries', () => {
    const store = makeStore();
    store.state.savedTabs['st-1'] = savedTab();
    store.state.spaceInstancesByWindow[100] = undefined;
    store.bindSavedTab('st-1', 100, 42, 'https://github.com/');
    expect(store.state.tabBindings['st-1']).toEqual({ 100: 42 });
  });

  test('applyRestartRecovery skips undefined instance entries', () => {
    const store = makeStore();
    store.state.savedTabs['st-1'] = savedTab();
    store.state.spaceInstancesByWindow[100] = undefined;
    store.applyRestartRecovery({ 'st-1': { 100: { tabId: 42 } } });
    expect(store.state.tabBindings['st-1']).toEqual({ 100: 42 });
  });
});

describe('LunmaStore.snapshot()', () => {
  test('returns plain arrays/objects that survive structuredClone', () => {
    const store = new LunmaStore({ idFactory: () => 'sp-1' });
    store.createSpace({ name: 'A', color: 'red', icon: 'star' });
    store.state.savedTabs['st-1'] = savedTab();
    store.state.tabBindings['st-1'] = { 100: 42 };

    const snap = store.snapshot();

    // The bug this fixes: $state proxies for arrays serialize as {} under
    // structuredClone, silently corrupting the persisted shape.
    expect(Array.isArray(snap.spaces)).toBe(true);
    expect(snap.spaces).toHaveLength(1);
    expect(snap.spaces[0]?.name).toBe('A');

    const cloned = structuredClone(snap);
    expect(Array.isArray(cloned.spaces)).toBe(true);
    expect(cloned.spaces).toEqual(snap.spaces);
    expect(cloned.savedTabs).toEqual({ 'st-1': savedTab() });
  });

  test('JSON round-trip preserves spaces as an array (regression for STORAGE_CORRUPT)', () => {
    const store = new LunmaStore({ idFactory: () => 'sp-1' });
    store.createSpace({ name: 'A', color: 'red', icon: 'star' });
    const snap = store.snapshot();
    const roundTripped = JSON.parse(JSON.stringify(snap));
    expect(Array.isArray(roundTripped.spaces)).toBe(true);
    expect(roundTripped.spaces).toHaveLength(1);
  });

  test('snapshot is detached from the live store (mutating the snap does not affect state)', () => {
    const store = new LunmaStore({ idFactory: () => 'sp-1' });
    store.createSpace({ name: 'A', color: 'red', icon: 'star' });
    const snap = store.snapshot();
    snap.spaces.push({
      id: 'leak',
      name: 'Leak',
      color: 'green',
      icon: 'star',
    });
    expect(store.state.spaces).toHaveLength(1);
    expect(store.state.spaces.find((s) => s.id === 'leak')).toBeUndefined();
  });
});

describe('LunmaStore.replaceState (data-backup)', () => {
  test('swaps all portable slices in place', () => {
    const store = makeStore();
    seedSpace(store);
    store.state.savedTabs['st-1'] = savedTab();

    const next = {
      ...store.state,
      spaces: [{ id: 'sp-new', name: 'New', color: 'green' as const, icon: 'star' }],
      savedTabs: { 'st-new': savedTab({ id: 'st-new', spaceId: 'sp-new' }) },
      lastActivatedSpaceId: 'sp-new',
      faviconRow: ['st-new'],
      archivedTabs: [],
    };
    const stateBefore = store.state;
    store.replaceState(next);

    // state object identity is preserved (same reactive proxy)
    expect(store.state).toBe(stateBefore);
    expect(store.state.spaces).toHaveLength(1);
    expect(store.state.spaces[0]?.id).toBe('sp-new');
    expect(Object.keys(store.state.savedTabs)).toEqual(['st-new']);
    expect(store.state.lastActivatedSpaceId).toBe('sp-new');
    expect(store.state.faviconRow).toEqual(['st-new']);
  });

  test('arrays are mutated in place (same array reference)', () => {
    const store = makeStore();
    seedSpace(store);
    const spacesBefore = store.state.spaces;
    const archivedBefore = store.state.archivedTabs;
    const faviconBefore = store.state.faviconRow;

    const next = { ...store.state, spaces: [], archivedTabs: [], faviconRow: [] };
    store.replaceState(next);

    expect(store.state.spaces).toBe(spacesBefore);
    expect(store.state.archivedTabs).toBe(archivedBefore);
    expect(store.state.faviconRow).toBe(faviconBefore);
    expect(store.state.spaces).toHaveLength(0);
  });
});
