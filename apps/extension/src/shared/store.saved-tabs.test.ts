import { describe, expect, test, vi } from 'vitest';
import type { LunmaStore } from './store.svelte';
import { makeStore, seedSpace } from './store.test-helpers';
import type { PinNode, SavedTab } from './types';

function savedTab(partial: Partial<SavedTab> = {}): SavedTab {
  return {
    id: partial.id ?? 'st-1',
    spaceId: partial.spaceId ?? 'work',
    title: partial.title ?? 'GitHub',
    originalURL: partial.originalURL ?? 'https://github.com/',
    currentURL: partial.currentURL ?? null,
  };
}

/** Tab-node list for a pinned tree (the V5 PinNode shape). */
const tabs = (...ids: string[]): PinNode[] => ids.map((id) => ({ kind: 'tab', id }));

/** Seed `savedTabs` records for `ids` so `setPinned`'s validation keeps them
 * (it drops tab nodes with no matching record — design D7). */
function seedSaved(store: LunmaStore, ...ids: string[]): void {
  for (const id of ids) store.state.savedTabs[id] = savedTab({ id });
}

describe('LunmaStore.bindSavedTab', () => {
  test('removes the tabId from tempTabIds and sets the binding', () => {
    const store = makeStore();
    const space = seedSpace(store);
    store.state.savedTabs['st-1'] = savedTab({ spaceId: space.id });
    store.state.spaceInstancesByWindow[100] = {
      [space.id]: {
        spaceId: space.id,
        groupId: 1,
        tempTabIds: [99],
        tempTabTitles: {},
      },
    };
    store.bindSavedTab('st-1', 100, 99, 'https://github.com/');
    expect(store.state.tabBindings['st-1']).toEqual({ 100: 99 });
    expect(store.state.savedTabs['st-1']?.currentURL).toBe('https://github.com/');
    expect(store.state.spaceInstancesByWindow[100]?.[space.id]?.tempTabIds).toEqual([]);
  });

  test('binds the same saved tab independently in two windows', () => {
    const store = makeStore();
    const space = seedSpace(store);
    store.state.savedTabs['st-1'] = savedTab({ spaceId: space.id });
    store.bindSavedTab('st-1', 100, 42, 'https://github.com/');
    store.bindSavedTab('st-1', 200, 77, 'https://github.com/');
    expect(store.state.tabBindings['st-1']).toEqual({ 100: 42, 200: 77 });
  });

  test('unknown savedTabId logs error', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const store = makeStore();
    store.bindSavedTab('nope', 100, 99, 'https://x/');
    expect(store.state.tabBindings.nope).toBeUndefined();
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});

describe('LunmaStore.unbindSavedTab', () => {
  test("drops one window's slot, leaving other windows and currentURL intact", () => {
    const store = makeStore();
    store.state.savedTabs['st-1'] = savedTab({ currentURL: 'https://github.com/sub' });
    store.state.tabBindings['st-1'] = { 100: 42, 200: 77 };
    store.unbindSavedTab('st-1', 100);
    // Window 100's slot is gone; window 200 keeps its binding. currentURL is the
    // single-canonical field written by onTabUpdated (design D3) — untouched here.
    expect(store.state.tabBindings['st-1']).toEqual({ 200: 77 });
    expect(store.state.savedTabs['st-1']?.currentURL).toBe('https://github.com/sub');
  });

  test('unknown savedTabId logs error', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const store = makeStore();
    store.unbindSavedTab('nope', 100);
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});

describe('LunmaStore.makeSavedTabHomeCurrent', () => {
  test('sets originalURL := currentURL', () => {
    const store = makeStore();
    store.state.savedTabs['st-1'] = savedTab({ currentURL: 'https://github.com/sub' });
    store.state.tabBindings['st-1'] = { 100: 42 };
    store.makeSavedTabHomeCurrent('st-1');
    expect(store.state.savedTabs['st-1']?.originalURL).toBe('https://github.com/sub');
  });

  test('no-op with logged error if currentURL is null', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const store = makeStore();
    store.state.savedTabs['st-1'] = savedTab({ currentURL: null });
    store.makeSavedTabHomeCurrent('st-1');
    expect(store.state.savedTabs['st-1']?.originalURL).toBe('https://github.com/');
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  test('unknown savedTabId logs error', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const store = makeStore();
    store.makeSavedTabHomeCurrent('nope');
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});

describe('LunmaStore.applyRestartRecovery', () => {
  test('applies a per-window recovery map, preserving drift state', () => {
    const store = makeStore();
    store.state.savedTabs['st-1'] = savedTab({ currentURL: 'https://github.com/sub' });
    store.state.tabBindings['st-1'] = {};
    store.state.savedTabs['st-2'] = savedTab({
      id: 'st-2',
      originalURL: 'https://y/',
      currentURL: 'https://y/',
    });
    store.state.tabBindings['st-2'] = {};

    store.applyRestartRecovery({
      'st-1': { 100: { tabId: 500 } },
      'st-2': { 100: null },
    });

    expect(store.state.tabBindings['st-1']).toEqual({ 100: 500 });
    expect(store.state.savedTabs['st-1']?.currentURL).toBe('https://github.com/sub');
    // A null window-entry drops that window's slot without touching the
    // single-canonical currentURL (recovery rebinds by URL, design D5).
    expect(store.state.tabBindings['st-2']).toEqual({});
    expect(store.state.savedTabs['st-2']?.currentURL).toBe('https://y/');
  });

  test('rebinds two windows independently while clearing a no-match slot', () => {
    const store = makeStore();
    store.state.savedTabs['st-1'] = savedTab({ currentURL: 'https://github.com/sub' });
    store.state.tabBindings['st-1'] = { 100: 1, 200: 2 };

    store.applyRestartRecovery({
      'st-1': { 100: { tabId: 500 }, 200: null },
    });

    expect(store.state.tabBindings['st-1']).toEqual({ 100: 500 });
  });

  test('overwrites currentURL when explicitly provided', () => {
    const store = makeStore();
    store.state.savedTabs['st-1'] = savedTab({ currentURL: 'https://github.com/sub' });
    store.state.tabBindings['st-1'] = {};

    store.applyRestartRecovery({
      'st-1': { 100: { tabId: 7, currentURL: 'https://github.com/other' } },
    });

    expect(store.state.savedTabs['st-1']?.currentURL).toBe('https://github.com/other');
  });

  test('unknown savedTabId in map is skipped with a logged error', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const store = makeStore();
    store.state.savedTabs['st-1'] = savedTab({ currentURL: null });
    store.state.tabBindings['st-1'] = {};
    store.applyRestartRecovery({
      'st-1': { 100: { tabId: 1 } },
      unknown: { 100: { tabId: 2 } },
    });
    expect(store.state.tabBindings['st-1']).toEqual({ 100: 1 });
    expect(store.state.tabBindings.unknown).toBeUndefined();
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  test("removes the rebound tabId from that window's tempTabIds list", () => {
    const store = makeStore();
    const space = seedSpace(store);
    store.state.savedTabs['st-1'] = savedTab({
      spaceId: space.id,
      currentURL: 'https://github.com/sub',
    });
    store.state.tabBindings['st-1'] = {};
    store.state.spaceInstancesByWindow[100] = {
      [space.id]: {
        spaceId: space.id,
        groupId: 1,
        tempTabIds: [501],
        tempTabTitles: {},
      },
    };
    store.applyRestartRecovery({ 'st-1': { 100: { tabId: 501 } } });
    expect(store.state.spaceInstancesByWindow[100]?.[space.id]?.tempTabIds).toEqual([]);
  });
});

describe('LunmaStore.setTabBoundary', () => {
  test('sets an explicit boundary on a saved tab', () => {
    const store = makeStore();
    store.state.savedTabs['st-1'] = savedTab();
    store.setTabBoundary('st-1', { mode: 'locked', allow: ['*.example.com'] });
    expect(store.state.savedTabs['st-1']?.boundary).toEqual({
      mode: 'locked',
      allow: ['*.example.com'],
    });
  });

  test('null clears the boundary back to inherit (removes the field)', () => {
    const store = makeStore();
    store.state.savedTabs['st-1'] = { ...savedTab(), boundary: { mode: 'off' } };
    store.setTabBoundary('st-1', null);
    expect(store.state.savedTabs['st-1']?.boundary).toBeUndefined();
  });

  test('no-ops (logs, no throw) on an unknown id', () => {
    const store = makeStore();
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() => store.setTabBoundary('missing', { mode: 'off' })).not.toThrow();
    expect(store.state.savedTabs.missing).toBeUndefined();
    spy.mockRestore();
  });
});

describe('LunmaStore.registerSavedTab', () => {
  test('seeds a saved tab record and initialises an empty per-window binding', () => {
    const store = makeStore();
    const tab = savedTab();
    store.registerSavedTab(tab);
    expect(store.state.savedTabs['st-1']).toEqual(tab);
    expect(store.state.tabBindings['st-1']).toEqual({});
  });

  test('is a no-op if the saved tab already exists', () => {
    const store = makeStore();
    store.state.savedTabs['st-1'] = savedTab({ currentURL: 'https://github.com/sub' });
    store.state.tabBindings['st-1'] = { 100: 42 };
    store.registerSavedTab(savedTab({ originalURL: 'https://different/' }));
    expect(store.state.savedTabs['st-1']?.originalURL).toBe('https://github.com/');
    expect(store.state.tabBindings['st-1']).toEqual({ 100: 42 });
  });

  test('keeps an existing non-empty binding when registering same id', () => {
    const store = makeStore();
    store.state.tabBindings['st-1'] = { 100: 50 };
    store.registerSavedTab(savedTab());
    expect(store.state.tabBindings['st-1']).toEqual({ 100: 50 });
  });
});

describe('LunmaStore.removeSavedTab', () => {
  test('drops the record, binding, and placement', () => {
    const store = makeStore();
    const space = seedSpace(store);
    store.state.savedTabs['st-1'] = savedTab({ spaceId: space.id });
    store.state.savedTabs['st-2'] = savedTab({ id: 'st-2', spaceId: space.id });
    store.state.tabBindings['st-1'] = { 100: 42 };
    store.setPinned(space.id, tabs('st-1', 'st-2'));
    store.removeSavedTab('st-1');
    expect(store.state.savedTabs['st-1']).toBeUndefined();
    expect(store.state.tabBindings['st-1']).toBeUndefined();
    expect(store.state.pinnedBySpace[space.id]).toEqual(tabs('st-2'));
  });

  test('unknown savedTabId logs error', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const store = makeStore();
    store.removeSavedTab('nope');
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});

describe('LunmaStore pinned-ordering mutators', () => {
  test('setPinned replaces the tree for that Space', () => {
    const store = makeStore();
    const space = seedSpace(store);
    seedSaved(store, 'a', 'b', 'c', 'z');
    store.setPinned(space.id, tabs('a', 'b', 'c'));
    expect(store.state.pinnedBySpace[space.id]).toEqual(tabs('a', 'b', 'c'));
    store.setPinned(space.id, tabs('z'));
    expect(store.state.pinnedBySpace[space.id]).toEqual(tabs('z'));
  });

  test('setPinned does not alias the input array', () => {
    const store = makeStore();
    const space = seedSpace(store);
    seedSaved(store, 'a', 'b', 'c');
    const nodes = tabs('a', 'b');
    store.setPinned(space.id, nodes);
    nodes.push({ kind: 'tab', id: 'c' });
    expect(store.state.pinnedBySpace[space.id]).toEqual(tabs('a', 'b'));
  });

  test('setPinned drops tab nodes with no savedTabs record (drift safety, D7)', () => {
    const store = makeStore();
    const space = seedSpace(store);
    seedSaved(store, 'a', 'c');
    store.setPinned(space.id, tabs('a', 'ghost', 'c'));
    expect(store.state.pinnedBySpace[space.id]).toEqual(tabs('a', 'c'));
  });

  test('setPinned de-duplicates ids across the whole tree', () => {
    const store = makeStore();
    const space = seedSpace(store);
    seedSaved(store, 'a', 'b');
    store.setPinned(space.id, [
      { kind: 'tab', id: 'a' },
      { kind: 'folder', id: 'f1', name: 'F', icon: 'folder', color: 'gray', children: ['a', 'b'] },
      { kind: 'tab', id: 'b' },
    ]);
    expect(store.state.pinnedBySpace[space.id]).toEqual([
      { kind: 'tab', id: 'a' },
      // 'a' already seen at top level → dropped from the folder; 'b' kept here.
      { kind: 'folder', id: 'f1', name: 'F', icon: 'folder', color: 'gray', children: ['b'] },
      // 'b' already seen in the folder → dropped at top level.
    ]);
  });

  test('addPinned splices a tab node at the given index', () => {
    const store = makeStore();
    const space = seedSpace(store);
    seedSaved(store, 'a', 'b', 'c');
    store.setPinned(space.id, tabs('a', 'c'));
    store.addPinned(space.id, 'b', 1);
    expect(store.state.pinnedBySpace[space.id]).toEqual(tabs('a', 'b', 'c'));
  });

  test('addPinned clamps index out-of-range', () => {
    const store = makeStore();
    const space = seedSpace(store);
    seedSaved(store, 'a', 'z');
    store.setPinned(space.id, tabs('a'));
    store.addPinned(space.id, 'z', 99);
    expect(store.state.pinnedBySpace[space.id]).toEqual(tabs('a', 'z'));
  });

  test('addPinned seeds a fresh array when the Space has none', () => {
    const store = makeStore();
    const space = seedSpace(store);
    store.addPinned(space.id, 'a', 0);
    expect(store.state.pinnedBySpace[space.id]).toEqual(tabs('a'));
  });

  test('addPinned is a no-op when the id is already placed (top level or folder)', () => {
    const store = makeStore();
    const space = seedSpace(store);
    seedSaved(store, 'a', 'b');
    store.setPinned(space.id, [
      { kind: 'tab', id: 'a' },
      { kind: 'folder', id: 'f1', name: 'F', icon: 'folder', color: 'gray', children: ['b'] },
    ]);
    store.addPinned(space.id, 'a', 0);
    store.addPinned(space.id, 'b', 0); // already inside the folder
    expect(store.state.pinnedBySpace[space.id]).toEqual([
      { kind: 'tab', id: 'a' },
      { kind: 'folder', id: 'f1', name: 'F', icon: 'folder', color: 'gray', children: ['b'] },
    ]);
  });

  test('addPinnedToFolder appends to the folder children and returns true', () => {
    const store = makeStore();
    const space = seedSpace(store);
    seedSaved(store, 'a', 'b', 'z');
    store.setPinned(space.id, [
      { kind: 'tab', id: 'a' },
      { kind: 'folder', id: 'f1', name: 'F', icon: 'folder', color: 'gray', children: ['b'] },
    ]);
    const placed = store.addPinnedToFolder(space.id, 'f1', 'z');
    expect(placed).toBe(true);
    expect(store.state.pinnedBySpace[space.id]).toEqual([
      { kind: 'tab', id: 'a' },
      { kind: 'folder', id: 'f1', name: 'F', icon: 'folder', color: 'gray', children: ['b', 'z'] },
    ]);
  });

  test('addPinnedToFolder returns false and no-ops for an unknown folderId', () => {
    const store = makeStore();
    const space = seedSpace(store);
    seedSaved(store, 'a', 'z');
    store.setPinned(space.id, tabs('a'));
    const placed = store.addPinnedToFolder(space.id, 'ghost-folder', 'z');
    expect(placed).toBe(false);
    expect(store.state.pinnedBySpace[space.id]).toEqual(tabs('a'));
  });

  test('addPinnedToFolder returns false when the Space has no pinned list', () => {
    const store = makeStore();
    const space = seedSpace(store);
    seedSaved(store, 'z');
    const placed = store.addPinnedToFolder(space.id, 'f1', 'z');
    expect(placed).toBe(false);
    expect(store.state.pinnedBySpace[space.id]).toBeUndefined();
  });

  test('addPinnedToFolder is a no-op (false) when the id is already placed', () => {
    const store = makeStore();
    const space = seedSpace(store);
    seedSaved(store, 'a', 'b');
    store.setPinned(space.id, [
      { kind: 'tab', id: 'a' },
      { kind: 'folder', id: 'f1', name: 'F', icon: 'folder', color: 'gray', children: ['b'] },
    ]);
    // 'a' is top-level, 'b' already inside the folder — neither re-places.
    expect(store.addPinnedToFolder(space.id, 'f1', 'a')).toBe(false);
    expect(store.addPinnedToFolder(space.id, 'f1', 'b')).toBe(false);
    expect(store.state.pinnedBySpace[space.id]).toEqual([
      { kind: 'tab', id: 'a' },
      { kind: 'folder', id: 'f1', name: 'F', icon: 'folder', color: 'gray', children: ['b'] },
    ]);
  });

  test('addPinnedToFolder leaves other folders and the top level untouched', () => {
    const store = makeStore();
    const space = seedSpace(store);
    seedSaved(store, 'a', 'b', 'z');
    store.setPinned(space.id, [
      { kind: 'tab', id: 'a' },
      { kind: 'folder', id: 'f1', name: 'F1', icon: 'folder', color: 'gray', children: [] },
      { kind: 'folder', id: 'f2', name: 'F2', icon: 'folder', color: 'gray', children: ['b'] },
    ]);
    store.addPinnedToFolder(space.id, 'f1', 'z');
    expect(store.state.pinnedBySpace[space.id]).toEqual([
      { kind: 'tab', id: 'a' },
      { kind: 'folder', id: 'f1', name: 'F1', icon: 'folder', color: 'gray', children: ['z'] },
      { kind: 'folder', id: 'f2', name: 'F2', icon: 'folder', color: 'gray', children: ['b'] },
    ]);
  });

  test('removePinned drops a top-level id', () => {
    const store = makeStore();
    const space = seedSpace(store);
    seedSaved(store, 'a', 'b', 'c');
    store.setPinned(space.id, tabs('a', 'b', 'c'));
    store.removePinned(space.id, 'b');
    expect(store.state.pinnedBySpace[space.id]).toEqual(tabs('a', 'c'));
  });

  test('removePinned drops an id nested inside a folder (folder kept)', () => {
    const store = makeStore();
    const space = seedSpace(store);
    seedSaved(store, 'a', 'b');
    store.setPinned(space.id, [
      { kind: 'folder', id: 'f1', name: 'F', icon: 'folder', color: 'gray', children: ['a', 'b'] },
    ]);
    store.removePinned(space.id, 'a');
    expect(store.state.pinnedBySpace[space.id]).toEqual([
      { kind: 'folder', id: 'f1', name: 'F', icon: 'folder', color: 'gray', children: ['b'] },
    ]);
  });

  test('removePinned is a no-op for unknown ids', () => {
    const store = makeStore();
    const space = seedSpace(store);
    seedSaved(store, 'a');
    store.setPinned(space.id, tabs('a'));
    store.removePinned(space.id, 'nope');
    expect(store.state.pinnedBySpace[space.id]).toEqual(tabs('a'));
  });

  test('removePinned is a no-op when the Space has no array', () => {
    const store = makeStore();
    const space = seedSpace(store);
    store.removePinned(space.id, 'a');
    expect(store.state.pinnedBySpace[space.id]).toBeUndefined();
  });
});

describe('LunmaStore folder mutators', () => {
  test('createFolder prepends an empty "New Folder" with a minted id', () => {
    const store = makeStore({ idFactory: () => 'fid' });
    const space = seedSpace(store);
    seedSaved(store, 'a');
    store.setPinned(space.id, tabs('a'));
    store.createFolder(space.id);
    expect(store.state.pinnedBySpace[space.id]).toEqual([
      {
        kind: 'folder',
        id: 'fid',
        name: 'New Folder',
        icon: 'folder',
        color: 'gray',
        children: [],
      },
      { kind: 'tab', id: 'a' },
    ]);
  });

  test('createFolderFromTabs wraps [B, A] at the drop index, removing both', () => {
    const store = makeStore({ idFactory: () => 'fid' });
    const space = seedSpace(store);
    seedSaved(store, 'a', 'b', 'c');
    store.setPinned(space.id, tabs('a', 'b', 'c'));
    // Drag 'c' (A) onto 'a' (B): folder lands at B's index 0 with children [B, A].
    store.createFolderFromTabs(space.id, 'c', 'a', 0);
    expect(store.state.pinnedBySpace[space.id]).toEqual([
      {
        kind: 'folder',
        id: 'fid',
        name: 'New Folder',
        icon: 'folder',
        color: 'gray',
        children: ['a', 'c'],
      },
      { kind: 'tab', id: 'b' },
    ]);
  });

  test('createFolderFromTabs no-ops on an unknown tab', () => {
    const store = makeStore({ idFactory: () => 'fid' });
    const space = seedSpace(store);
    seedSaved(store, 'a');
    store.setPinned(space.id, tabs('a'));
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    store.createFolderFromTabs(space.id, 'a', 'ghost', 0);
    expect(store.state.pinnedBySpace[space.id]).toEqual(tabs('a'));
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  test('rename / setFolderIcon / setFolderColor update the folder node', () => {
    const store = makeStore({ idFactory: () => 'fid' });
    const space = seedSpace(store);
    store.createFolder(space.id);
    store.renameFolder(space.id, 'fid', 'Reading');
    store.setFolderIcon(space.id, 'fid', 'book');
    store.setFolderColor(space.id, 'fid', 'blue');
    expect(store.state.pinnedBySpace[space.id]).toEqual([
      { kind: 'folder', id: 'fid', name: 'Reading', icon: 'book', color: 'blue', children: [] },
    ]);
  });

  test('folder metadata mutators log on an unknown folder', () => {
    const store = makeStore();
    const space = seedSpace(store);
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    store.renameFolder(space.id, 'nope', 'X');
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  test('deleteFolder spills children to top-level tab nodes at the folder position', () => {
    const store = makeStore({ idFactory: () => 'fid' });
    const space = seedSpace(store);
    seedSaved(store, 'a', 'b', 'c');
    store.setPinned(space.id, [
      { kind: 'tab', id: 'a' },
      { kind: 'folder', id: 'fid', name: 'F', icon: 'folder', color: 'gray', children: ['b', 'c'] },
    ]);
    store.deleteFolder(space.id, 'fid');
    expect(store.state.pinnedBySpace[space.id]).toEqual(tabs('a', 'b', 'c'));
  });

  test('deleteFolder does not create a top-level duplicate when a spilled child already exists', () => {
    const store = makeStore({ idFactory: () => 'fid' });
    const space = seedSpace(store);
    seedSaved(store, 'a', 'b');
    // Seed an already-violated tree directly (a child also present top-level);
    // setPinned would sanitize it away, so bypass it to exercise the guard.
    store.state.pinnedBySpace[space.id] = [
      { kind: 'tab', id: 'b' },
      { kind: 'folder', id: 'fid', name: 'F', icon: 'folder', color: 'gray', children: ['a', 'b'] },
    ];
    store.deleteFolder(space.id, 'fid');
    // 'b' already exists top-level → not re-spilled; 'a' spills in at the slot.
    expect(store.state.pinnedBySpace[space.id]).toEqual(tabs('b', 'a'));
  });

  test('setAutoRenameNextFolder arms/disarms a per-window flag, independent across windows', () => {
    const store = makeStore();
    const aug = store.state as unknown as {
      autoRenameNextFolderByWindow?: Record<number, boolean>;
    };
    expect(aug.autoRenameNextFolderByWindow).toBeUndefined();
    store.setAutoRenameNextFolder(100, true);
    expect(aug.autoRenameNextFolderByWindow?.[100]).toBe(true);
    // A different window keys its own flag and is unaffected (per-window-local).
    expect(aug.autoRenameNextFolderByWindow?.[200]).toBeUndefined();
    store.setAutoRenameNextFolder(200, true);
    store.setAutoRenameNextFolder(100, false);
    expect(aug.autoRenameNextFolderByWindow?.[100]).toBe(false);
    expect(aug.autoRenameNextFolderByWindow?.[200]).toBe(true);
  });

  test('an empty folder is kept when its last child is removed', () => {
    const store = makeStore({ idFactory: () => 'fid' });
    const space = seedSpace(store);
    seedSaved(store, 'a');
    store.setPinned(space.id, [
      { kind: 'folder', id: 'fid', name: 'F', icon: 'folder', color: 'gray', children: ['a'] },
    ]);
    store.removePinned(space.id, 'a');
    expect(store.state.pinnedBySpace[space.id]).toEqual([
      { kind: 'folder', id: 'fid', name: 'F', icon: 'folder', color: 'gray', children: [] },
    ]);
  });
});
