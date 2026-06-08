import { describe, expect, test, vi } from 'vitest';
import { makeStore, seedSpace } from './store.test-helpers';
import type { Space } from './types';

describe('LunmaStore.createSpace', () => {
  test('appends a Space and sets lastActivatedSpaceId on first', () => {
    const store = makeStore();
    store.createSpace({ name: 'Work', color: 'blue', icon: 'star' });
    expect(store.state.spaces).toHaveLength(1);
    expect(store.state.spaces[0]?.name).toBe('Work');
    expect(store.state.lastActivatedSpaceId).toBe(store.state.spaces[0]?.id);
  });

  test('a distinctly-named second call produces a distinct Space', () => {
    const store = makeStore();
    store.createSpace({ name: 'Work', color: 'blue', icon: 'star' });
    store.createSpace({ name: 'Side', color: 'red', icon: 'star' });
    expect(store.state.spaces).toHaveLength(2);
    expect(store.state.spaces[0]?.id).not.toBe(store.state.spaces[1]?.id);
  });

  test('throws on a duplicate name and adds no second Space (casefold + trim)', () => {
    const store = makeStore();
    store.createSpace({ name: 'Work', color: 'blue', icon: 'star' });
    // Differently-cased + whitespace-padded names normalize to the same key.
    expect(() => store.createSpace({ name: '  work ', color: 'red', icon: 'book' })).toThrow();
    expect(store.state.spaces).toHaveLength(1);
    expect(store.state.spaces[0]?.color).toBe('blue');
  });

  test('does not overwrite lastActivatedSpaceId on subsequent creates', () => {
    const store = makeStore();
    store.createSpace({ name: 'Work', color: 'blue', icon: 'star' });
    const firstId = store.state.lastActivatedSpaceId;
    store.createSpace({ name: 'Side', color: 'red', icon: 'star' });
    expect(store.state.lastActivatedSpaceId).toBe(firstId);
  });

  test('mints a Lunma-owned record with no bookmark folder id', () => {
    const store = makeStore();
    store.createSpace({ name: 'Work', color: 'blue', icon: 'briefcase' });
    const space = store.state.spaces[0];
    expect(space).toEqual({ id: 'id-1', name: 'Work', color: 'blue', icon: 'briefcase' });
    expect(space && 'bookmarkFolderId' in space).toBe(false);
  });
});

describe('LunmaStore.renameSpace', () => {
  test('updates the Space record', () => {
    const store = makeStore();
    store.createSpace({ name: 'Work', color: 'blue', icon: 'star' });
    const id = store.state.spaces[0]?.id ?? '';
    store.renameSpace(id, 'Day Job');
    expect(store.state.spaces[0]?.name).toBe('Day Job');
  });

  test('unknown id is a no-op with logged error', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const store = makeStore();
    store.createSpace({ name: 'Work', color: 'blue', icon: 'star' });
    store.renameSpace('nope', 'X');
    expect(store.state.spaces[0]?.name).toBe('Work');
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  test('throws when renaming to another Space’s name and leaves the record unchanged (casefold + trim)', () => {
    const store = makeStore();
    store.createSpace({ name: 'Work', color: 'blue', icon: 'star' });
    store.createSpace({ name: 'Personal', color: 'red', icon: 'star' });
    const personalId = store.state.spaces[1]?.id ?? '';
    expect(() => store.renameSpace(personalId, '  WORK ')).toThrow();
    expect(store.state.spaces[1]?.name).toBe('Personal');
  });

  test('allows a Space to keep its own name (casing-only edit is not a collision)', () => {
    const store = makeStore();
    store.createSpace({ name: 'Work', color: 'blue', icon: 'star' });
    const id = store.state.spaces[0]?.id ?? '';
    store.renameSpace(id, 'work'); // same Space, casing-only change
    expect(store.state.spaces[0]?.name).toBe('work');
  });
});

describe('LunmaStore.recolourSpace', () => {
  test('updates the Space colour', () => {
    const store = makeStore();
    store.createSpace({ name: 'Work', color: 'blue', icon: 'star' });
    const id = store.state.spaces[0]?.id ?? '';
    store.recolourSpace(id, 'red');
    expect(store.state.spaces[0]?.color).toBe('red');
  });

  test('does not touch other fields', () => {
    const store = makeStore();
    store.createSpace({ name: 'Work', color: 'blue', icon: 'star' });
    const id = store.state.spaces[0]?.id ?? '';
    store.recolourSpace(id, 'green');
    const space = store.state.spaces[0];
    expect(space?.name).toBe('Work');
    expect(space?.icon).toBe('star');
  });

  test('unknown id is a no-op with logged error', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const store = makeStore();
    store.createSpace({ name: 'Work', color: 'blue', icon: 'star' });
    store.recolourSpace('nope', 'red');
    expect(store.state.spaces[0]?.color).toBe('blue');
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});

describe('LunmaStore.changeSpaceIcon', () => {
  test('updates the Space icon', () => {
    const store = makeStore();
    store.createSpace({ name: 'Work', color: 'blue', icon: 'star' });
    const id = store.state.spaces[0]?.id ?? '';
    store.changeSpaceIcon(id, 'briefcase');
    expect(store.state.spaces[0]?.icon).toBe('briefcase');
  });

  test('does not touch other fields', () => {
    const store = makeStore();
    store.createSpace({ name: 'Work', color: 'blue', icon: 'star' });
    const id = store.state.spaces[0]?.id ?? '';
    store.changeSpaceIcon(id, 'briefcase');
    const space = store.state.spaces[0];
    expect(space?.name).toBe('Work');
    expect(space?.color).toBe('blue');
  });

  test('unknown id is a no-op with logged error', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const store = makeStore();
    store.createSpace({ name: 'Work', color: 'blue', icon: 'star' });
    store.changeSpaceIcon('nope', 'briefcase');
    expect(store.state.spaces[0]?.icon).toBe('star');
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});

describe('LunmaStore.deleteSpace', () => {
  test('moves the Space to trash and clears window state (with another Space remaining)', () => {
    const store = makeStore();
    const space = seedSpace(store);
    seedSpace(store, { id: 'other' });
    store.state.activeSpaceByWindow[100] = space.id;
    store.state.activeSpaceByWindow[200] = space.id;
    store.state.spaceInstancesByWindow[100] = {
      [space.id]: { spaceId: space.id, groupId: 1, tempTabIds: [9], tempTabTitles: {} },
    };
    store.state.spaceInstancesByWindow[200] = {
      [space.id]: { spaceId: space.id, groupId: 2, tempTabIds: [], tempTabTitles: {} },
    };

    store.deleteSpace(space.id);

    expect(store.state.spaces).toHaveLength(1);
    expect(store.state.trash[space.id]).toBeDefined();
    expect(store.state.trash[space.id]?.deletedAt).toBeTypeOf('string');
    expect(store.state.spaceInstancesByWindow[100]).toBeUndefined();
    expect(store.state.spaceInstancesByWindow[200]).toBeUndefined();
    expect(store.state.activeSpaceByWindow[100]).toBeNull();
    expect(store.state.activeSpaceByWindow[200]).toBeNull();
  });

  test('refuses to delete the last remaining Space (at-least-one-Space invariant)', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const store = makeStore();
    const space = seedSpace(store);
    store.deleteSpace(space.id);
    expect(store.state.spaces).toHaveLength(1);
    expect(store.state.trash[space.id]).toBeUndefined();
    expect(errorSpy).toHaveBeenCalled();
    const calls = errorSpy.mock.calls.flat().filter((v) => typeof v === 'string');
    expect(calls.some((s) => s.includes('LAST_SPACE_DELETION_REFUSED'))).toBe(true);
    errorSpy.mockRestore();
  });

  test('deletes normally when two or more Spaces exist', () => {
    const store = makeStore();
    const a = seedSpace(store, { id: 'a' });
    seedSpace(store, { id: 'b' });
    store.deleteSpace(a.id);
    expect(store.state.spaces).toHaveLength(1);
    expect(store.state.spaces[0]?.id).toBe('b');
    expect(store.state.trash[a.id]).toBeDefined();
  });

  test('unknown id logs error and is a no-op', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const store = makeStore();
    seedSpace(store);
    store.deleteSpace('nope');
    expect(store.state.spaces).toHaveLength(1);
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  test('falls back to first remaining Space when deleting the last-activated one', () => {
    const store = makeStore();
    seedSpace(store, { id: 'a' });
    seedSpace(store, { id: 'b' });
    store.state.lastActivatedSpaceId = 'a';
    store.deleteSpace('a');
    expect(store.state.lastActivatedSpaceId).toBe('b');
  });

  test('does not change lastActivatedSpaceId when deleting a different Space', () => {
    const store = makeStore();
    seedSpace(store, { id: 'a' });
    seedSpace(store, { id: 'b' });
    store.state.lastActivatedSpaceId = 'a';
    store.deleteSpace('b');
    expect(store.state.lastActivatedSpaceId).toBe('a');
  });
});

describe('LunmaStore.restoreSpaceFromTrash', () => {
  test('returns the Space to spaces and clears deletedAt', () => {
    const store = makeStore();
    const space = seedSpace(store);
    seedSpace(store, { id: 'keep' });
    store.deleteSpace(space.id);
    expect(store.state.trash[space.id]).toBeDefined();
    store.restoreSpaceFromTrash(space.id);
    expect(store.state.trash[space.id]).toBeUndefined();
    expect(store.state.spaces.some((s) => s.id === space.id)).toBe(true);
    const restored = store.state.spaces.find((s) => s.id === space.id);
    expect(restored).toBeDefined();
    expect((restored as Space & { deletedAt?: string }).deletedAt).toBeUndefined();
  });

  test('unknown id logs error', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const store = makeStore();
    store.restoreSpaceFromTrash('nope');
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  test('disambiguates a restored name that is now taken by a newer Space', () => {
    const store = makeStore();
    const work = seedSpace(store, { id: 'work', name: 'Work' });
    seedSpace(store, { id: 'keep', name: 'Keep' });
    store.deleteSpace(work.id);
    // A new "Work" (any casing) is created while the old one sits in trash.
    seedSpace(store, { id: 'work2', name: 'work' });
    store.restoreSpaceFromTrash('work');
    const restored = store.state.spaces.find((s) => s.id === 'work');
    expect(restored?.name).toBe('Work 2');
    // Both coexist with distinct names.
    expect(store.state.spaces.filter((s) => s.name.toLowerCase().startsWith('work'))).toHaveLength(
      2,
    );
  });
});

describe('LunmaStore.recordSpaceGroup', () => {
  test('evicts a prior holder of the same live groupId in the window', () => {
    const store = makeStore();
    seedSpace(store, { id: 'work' });
    seedSpace(store, { id: 'side' });
    store.state.spaceInstancesByWindow[100] = {
      work: { spaceId: 'work', groupId: 77, tempTabIds: [7], tempTabTitles: {} },
      side: { spaceId: 'side', groupId: -1, tempTabIds: [9], tempTabTitles: {} },
    };
    // Binding 77 to "side" must evict it from "work" — a live groupId is never shared.
    store.recordSpaceGroup(100, 'side', 77);
    expect(store.state.spaceInstancesByWindow[100]?.side?.groupId).toBe(77);
    expect(store.state.spaceInstancesByWindow[100]?.work?.groupId).toBe(-1);
  });

  test('does not evict the -1 sentinel from sibling groupless instances', () => {
    const store = makeStore();
    seedSpace(store, { id: 'work' });
    seedSpace(store, { id: 'side' });
    store.state.spaceInstancesByWindow[100] = {
      work: { spaceId: 'work', groupId: -1, tempTabIds: [7], tempTabTitles: {} },
      side: { spaceId: 'side', groupId: -1, tempTabIds: [9], tempTabTitles: {} },
    };
    store.recordSpaceGroup(100, 'side', -1);
    // The unrelated groupless instance keeps its -1 (the sentinel is shared freely).
    expect(store.state.spaceInstancesByWindow[100]?.work?.groupId).toBe(-1);
    expect(store.state.spaceInstancesByWindow[100]?.side?.groupId).toBe(-1);
  });
});

describe('LunmaStore.activateSpace', () => {
  test('creates an instance when none exists', () => {
    const store = makeStore();
    const space = seedSpace(store);
    store.activateSpace(100, space.id);
    expect(store.state.activeSpaceByWindow[100]).toBe(space.id);
    expect(store.state.spaceInstancesByWindow[100]).toEqual({
      [space.id]: {
        spaceId: space.id,
        groupId: -1,
        tempTabIds: [],
        tempTabTitles: {},
      },
    });
    expect(store.state.lastActivatedSpaceId).toBe(space.id);
  });

  test('reuses an existing instance for the same Space', () => {
    const store = makeStore();
    const space = seedSpace(store);
    store.state.spaceInstancesByWindow[100] = {
      [space.id]: {
        spaceId: space.id,
        groupId: 42,
        tempTabIds: [7, 8],
        tempTabTitles: {},
      },
    };
    store.activateSpace(100, space.id);
    expect(store.state.spaceInstancesByWindow[100]?.[space.id]?.groupId).toBe(42);
    expect(store.state.spaceInstancesByWindow[100]?.[space.id]?.tempTabIds).toEqual([7, 8]);
  });

  test('adds a new instance when switching to a different Space without discarding the old one', () => {
    const store = makeStore();
    const work = seedSpace(store, { id: 'work', name: 'Work' });
    seedSpace(store, { id: 'side', name: 'Side' });
    store.state.spaceInstancesByWindow[100] = {
      [work.id]: { spaceId: work.id, groupId: 42, tempTabIds: [7], tempTabTitles: {} },
    };
    store.activateSpace(100, 'side');
    expect(store.state.spaceInstancesByWindow[100]?.side?.spaceId).toBe('side');
    expect(store.state.spaceInstancesByWindow[100]?.side?.groupId).toBe(-1);
    expect(store.state.spaceInstancesByWindow[100]?.work).toEqual({
      spaceId: 'work',
      groupId: 42,
      tempTabIds: [7],
      tempTabTitles: {},
    });
  });

  test('unknown spaceId logs error and no-ops', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const store = makeStore();
    store.activateSpace(100, 'nope');
    expect(store.state.activeSpaceByWindow[100]).toBeUndefined();
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});

describe('LunmaStore.forgetSpaceGroup', () => {
  test('resets the matching instance to -1, keeping the Space and its tabs', () => {
    const store = makeStore();
    seedSpace(store, { id: 'work' });
    store.state.spaceInstancesByWindow[100] = {
      work: { spaceId: 'work', groupId: 42, tempTabIds: [7, 8], tempTabTitles: {} },
    };
    store.forgetSpaceGroup(42);
    expect(store.state.spaceInstancesByWindow[100]?.work?.groupId).toBe(-1);
    // The Space instance + its temp tabs survive — only the group binding drops.
    expect(store.state.spaceInstancesByWindow[100]?.work?.tempTabIds).toEqual([7, 8]);
    expect(store.state.spaces.find((s) => s.id === 'work')).toBeDefined();
  });

  test('no-ops for an unknown group id', () => {
    const store = makeStore();
    seedSpace(store, { id: 'work' });
    store.state.spaceInstancesByWindow[100] = {
      work: { spaceId: 'work', groupId: 42, tempTabIds: [7], tempTabTitles: {} },
    };
    store.forgetSpaceGroup(999);
    expect(store.state.spaceInstancesByWindow[100]?.work?.groupId).toBe(42);
  });

  test('no-ops for the -1 sentinel (does not clobber an unrelated groupless instance)', () => {
    const store = makeStore();
    seedSpace(store, { id: 'work' });
    store.state.spaceInstancesByWindow[100] = {
      work: { spaceId: 'work', groupId: -1, tempTabIds: [7], tempTabTitles: {} },
    };
    store.forgetSpaceGroup(-1);
    expect(store.state.spaceInstancesByWindow[100]?.work?.groupId).toBe(-1);
  });

  test('leaves other instances untouched', () => {
    const store = makeStore();
    seedSpace(store, { id: 'work' });
    seedSpace(store, { id: 'side' });
    store.state.spaceInstancesByWindow[100] = {
      work: { spaceId: 'work', groupId: 42, tempTabIds: [7], tempTabTitles: {} },
      side: { spaceId: 'side', groupId: 43, tempTabIds: [9], tempTabTitles: {} },
    };
    store.forgetSpaceGroup(42);
    expect(store.state.spaceInstancesByWindow[100]?.work?.groupId).toBe(-1);
    expect(store.state.spaceInstancesByWindow[100]?.side?.groupId).toBe(43);
  });
});

describe('LunmaStore.assignSpaceTabs', () => {
  test('moves tabs into the target instance, out of others in the window', () => {
    const store = makeStore();
    seedSpace(store, { id: 'default' });
    seedSpace(store, { id: 'work' });
    store.state.spaceInstancesByWindow[100] = {
      default: { spaceId: 'default', groupId: -1, tempTabIds: [7, 8, 9], tempTabTitles: {} },
    };
    store.assignSpaceTabs(100, 'work', [8, 9]);
    expect(store.state.spaceInstancesByWindow[100]?.work?.tempTabIds).toEqual([8, 9]);
    expect(store.state.spaceInstancesByWindow[100]?.default?.tempTabIds).toEqual([7]);
  });

  test('creates the target instance when absent and preserves the given order', () => {
    const store = makeStore();
    seedSpace(store, { id: 'work' });
    store.assignSpaceTabs(100, 'work', [3, 1, 2]);
    expect(store.state.spaceInstancesByWindow[100]?.work?.tempTabIds).toEqual([3, 1, 2]);
  });

  test('skips bound (saved) tabs', () => {
    const store = makeStore();
    seedSpace(store, { id: 'work' });
    store.state.savedTabs['st-1'] = {
      id: 'st-1',
      spaceId: 'work',
      title: 'Pinned',
      originalURL: 'https://x/',
      currentURL: 'https://x/',
    };
    store.state.tabBindings['st-1'] = { 100: 8 }; // tab 8 is bound
    store.assignSpaceTabs(100, 'work', [7, 8]);
    expect(store.state.spaceInstancesByWindow[100]?.work?.tempTabIds).toEqual([7]);
  });
});

describe('LunmaStore.removeEmptySpace', () => {
  test('removes an empty Space and repoints active/last refs', () => {
    const store = makeStore();
    seedSpace(store, { id: 'default' });
    seedSpace(store, { id: 'work' });
    store.state.activeSpaceByWindow[100] = 'default';
    store.state.lastActivatedSpaceId = 'default';
    store.state.spaceInstancesByWindow[100] = {
      default: { spaceId: 'default', groupId: -1, tempTabIds: [], tempTabTitles: {} },
      work: { spaceId: 'work', groupId: 5, tempTabIds: [7], tempTabTitles: {} },
    };
    store.removeEmptySpace('default');
    expect(store.state.spaces.find((s) => s.id === 'default')).toBeUndefined();
    expect(store.state.trash.default).toBeUndefined(); // hard delete, not trashed
    expect(store.state.activeSpaceByWindow[100]).toBe('work');
    expect(store.state.lastActivatedSpaceId).toBe('work');
  });

  test('no-op when the Space still has temp tabs', () => {
    const store = makeStore();
    seedSpace(store, { id: 'default' });
    seedSpace(store, { id: 'work' });
    store.state.spaceInstancesByWindow[100] = {
      default: { spaceId: 'default', groupId: -1, tempTabIds: [7], tempTabTitles: {} },
    };
    store.removeEmptySpace('default');
    expect(store.state.spaces.find((s) => s.id === 'default')).toBeDefined();
  });

  test('no-op when the Space has pinned tabs', () => {
    const store = makeStore();
    seedSpace(store, { id: 'default' });
    seedSpace(store, { id: 'work' });
    store.state.pinnedBySpace.default = [{ kind: 'tab', id: 'st-1' }];
    store.removeEmptySpace('default');
    expect(store.state.spaces.find((s) => s.id === 'default')).toBeDefined();
  });

  test('no-op when it is the last remaining Space', () => {
    const store = makeStore();
    seedSpace(store, { id: 'default' });
    store.removeEmptySpace('default');
    expect(store.state.spaces.find((s) => s.id === 'default')).toBeDefined();
  });
});

describe('LunmaStore.reorderSpaces', () => {
  test('reorders state.spaces to the given id order, in place', () => {
    const store = makeStore();
    seedSpace(store, { id: 'a' });
    seedSpace(store, { id: 'b' });
    seedSpace(store, { id: 'c' });
    const ref = store.state.spaces;
    store.reorderSpaces(['c', 'a', 'b']);
    expect(store.state.spaces.map((s) => s.id)).toEqual(['c', 'a', 'b']);
    // Mutated in place — same array proxy, so $state subscribers survive.
    expect(store.state.spaces).toBe(ref);
  });

  test('drops ids that no longer exist', () => {
    const store = makeStore();
    seedSpace(store, { id: 'a' });
    seedSpace(store, { id: 'b' });
    store.reorderSpaces(['b', 'ghost', 'a']);
    expect(store.state.spaces.map((s) => s.id)).toEqual(['b', 'a']);
  });

  test('appends any current id the caller omitted (race safety)', () => {
    const store = makeStore();
    seedSpace(store, { id: 'a' });
    seedSpace(store, { id: 'b' });
    seedSpace(store, { id: 'c' });
    // The caller only knew about a + c; b is appended in its current relative order.
    store.reorderSpaces(['c', 'a']);
    expect(store.state.spaces.map((s) => s.id)).toEqual(['c', 'a', 'b']);
  });

  test('is a no-op when the resulting order is unchanged', () => {
    const store = makeStore();
    seedSpace(store, { id: 'a' });
    seedSpace(store, { id: 'b' });
    const ref = store.state.spaces;
    store.reorderSpaces(['a', 'b']);
    expect(store.state.spaces.map((s) => s.id)).toEqual(['a', 'b']);
    expect(store.state.spaces).toBe(ref);
  });

  test('leaves the active Space and instances untouched', () => {
    const store = makeStore();
    seedSpace(store, { id: 'a' });
    seedSpace(store, { id: 'b' });
    store.state.activeSpaceByWindow[100] = 'b';
    store.state.spaceInstancesByWindow[100] = {
      b: { spaceId: 'b', groupId: -1, tempTabIds: [], tempTabTitles: {} },
    };
    store.reorderSpaces(['b', 'a']);
    expect(store.state.activeSpaceByWindow[100]).toBe('b');
    expect(store.state.spaceInstancesByWindow[100]?.b).toBeDefined();
  });
});
