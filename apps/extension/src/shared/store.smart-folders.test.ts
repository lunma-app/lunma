import { beforeEach, describe, expect, test, vi } from 'vitest';
import { LunmaStore } from './store.svelte';
import type { PinNode, SmartFolderItem } from './types';

type SmartNode = Extract<PinNode, { kind: 'smart' }>;

function smartNode(overrides: Partial<SmartNode> = {}): SmartNode {
  return {
    kind: 'smart',
    id: 'sf-1',
    name: 'Review requests',
    icon: 'folder-git-2',
    source: 'gitlab',
    baseUrl: 'https://gitlab.example.com',
    query: 'review-requested',
    refreshMinutes: 10,
    ...overrides,
  };
}

function items(...titles: string[]): SmartFolderItem[] {
  return titles.map((title, i) => ({
    id: `mr-${i}`,
    title,
    url: `https://gitlab.example.com/mr/${i}`,
  }));
}

let store: LunmaStore;

beforeEach(() => {
  let counter = 0;
  store = new LunmaStore({ idFactory: () => `id-${++counter}` });
  store.state.spaces.push({ id: 'work', name: 'Work', color: 'blue', icon: 'star' });
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

describe('addSmartFolder', () => {
  test('inserts the node at the top of the pinned list (like createFolder)', () => {
    store.state.savedTabs['st-1'] = {
      id: 'st-1',
      spaceId: 'work',
      title: 'T',
      originalURL: 'https://x/',
      currentURL: null,
    };
    store.state.pinnedBySpace.work = [{ kind: 'tab', id: 'st-1' }];
    store.addSmartFolder('work', smartNode());
    expect(store.state.pinnedBySpace.work?.map((n) => n.id)).toEqual(['sf-1', 'st-1']);
  });

  test('creates the Space list when none exists', () => {
    store.addSmartFolder('work', smartNode());
    expect(store.state.pinnedBySpace.work?.[0]).toMatchObject({ kind: 'smart', id: 'sf-1' });
  });
});

describe('updateSmartFolder', () => {
  test('edits config fields in place', () => {
    store.addSmartFolder('work', smartNode());
    store.updateSmartFolder('work', 'sf-1', {
      source: 'gitlab',
      name: 'Assigned',
      baseUrl: 'https://gitlab.example.com',
      query: 'assigned',
      refreshMinutes: 30,
    });
    expect(store.state.pinnedBySpace.work?.[0]).toMatchObject({
      name: 'Assigned',
      query: 'assigned',
      refreshMinutes: 30,
    });
  });

  test('a query change invalidates the runtime fetchedAt (immediately due)', () => {
    store.addSmartFolder('work', smartNode({ query: 'assigned' }));
    store.setSmartFolderRuntime('sf-1', { state: 'ok', items: items('A'), fetchedAt: 123 });
    store.updateSmartFolder('work', 'sf-1', {
      source: 'gitlab',
      name: 'Review requests',
      baseUrl: 'https://gitlab.example.com',
      query: 'review-requested',
      refreshMinutes: 10,
    });
    expect(store.state.smartFolders['sf-1']?.fetchedAt).toBeNull();
  });

  test('a baseUrl change invalidates fetchedAt; a name-only change does not', () => {
    store.addSmartFolder('work', smartNode());
    store.setSmartFolderRuntime('sf-1', { state: 'ok', items: [], fetchedAt: 123 });
    store.updateSmartFolder('work', 'sf-1', {
      source: 'gitlab',
      name: 'Renamed only',
      baseUrl: 'https://gitlab.example.com',
      query: 'review-requested',
      refreshMinutes: 10,
    });
    expect(store.state.smartFolders['sf-1']?.fetchedAt).toBe(123);
    store.updateSmartFolder('work', 'sf-1', {
      source: 'gitlab',
      name: 'Renamed only',
      baseUrl: 'https://gitlab.other.com',
      query: 'review-requested',
      refreshMinutes: 10,
    });
    expect(store.state.smartFolders['sf-1']?.fetchedAt).toBeNull();
  });

  test('a source-only change invalidates fetchedAt and persists the new source', () => {
    store.addSmartFolder('work', smartNode({ baseUrl: 'https://forge.example.com' }));
    store.setSmartFolderRuntime('sf-1', { state: 'ok', items: items('A'), fetchedAt: 123 });
    store.updateSmartFolder('work', 'sf-1', {
      source: 'github',
      name: 'Review requests',
      baseUrl: 'https://forge.example.com',
      query: 'review-requested',
      refreshMinutes: 10,
    });
    expect(store.state.pinnedBySpace.work?.[0]).toMatchObject({ source: 'github' });
    expect(store.state.smartFolders['sf-1']?.fetchedAt).toBeNull();
  });

  test('unknown folder is a logged no-op (the handler owns the throw)', () => {
    store.updateSmartFolder('work', 'nope', {
      source: 'gitlab',
      name: 'X',
      baseUrl: 'https://gitlab.example.com',
      query: 'authored',
      refreshMinutes: 10,
    });
    expect(store.state.pinnedBySpace.work).toBeUndefined();
  });
});

describe('deleteSmartFolder', () => {
  test('removes the node AND drops its runtime entry', () => {
    store.addSmartFolder('work', smartNode());
    store.setSmartFolderRuntime('sf-1', { state: 'ok', items: items('A'), fetchedAt: 1 });
    store.deleteSmartFolder('work', 'sf-1');
    expect(store.state.pinnedBySpace.work).toEqual([]);
    expect(store.state.smartFolders['sf-1']).toBeUndefined();
  });

  test('leaves sibling nodes untouched', () => {
    store.state.savedTabs['st-1'] = {
      id: 'st-1',
      spaceId: 'work',
      title: 'T',
      originalURL: 'https://x/',
      currentURL: null,
    };
    store.state.pinnedBySpace.work = [{ kind: 'tab', id: 'st-1' }];
    store.addSmartFolder('work', smartNode());
    store.deleteSmartFolder('work', 'sf-1');
    expect(store.state.pinnedBySpace.work).toEqual([{ kind: 'tab', id: 'st-1' }]);
  });

  test('a Space with no pinned list is a logged no-op', () => {
    store.deleteSmartFolder('work', 'sf-1');
    expect(store.state.pinnedBySpace.work).toBeUndefined();
  });

  test('an unknown folderId in a populated list is a logged no-op', () => {
    store.addSmartFolder('work', smartNode());
    store.deleteSmartFolder('work', 'nope');
    expect(store.state.pinnedBySpace.work).toHaveLength(1);
  });
});

describe('setSmartFolderRuntime', () => {
  test('an ok runtime replaces wholesale', () => {
    store.setSmartFolderRuntime('sf-1', { state: 'ok', items: items('A', 'B'), fetchedAt: 10 });
    expect(store.state.smartFolders['sf-1']).toMatchObject({ state: 'ok', fetchedAt: 10 });
    expect(store.state.smartFolders['sf-1']?.items).toHaveLength(2);
  });

  test('a pending mark preserves last-known items and fetchedAt (the list never blinks)', () => {
    store.setSmartFolderRuntime('sf-1', { state: 'ok', items: items('A', 'B'), fetchedAt: 10 });
    store.setSmartFolderRuntime('sf-1', { state: 'pending', items: [], fetchedAt: null });
    expect(store.state.smartFolders['sf-1']).toEqual({
      state: 'pending',
      items: items('A', 'B'),
      fetchedAt: 10,
    });
  });

  test('a first-ever pending (no prior runtime) lands as-is — the ghost-rows state', () => {
    store.setSmartFolderRuntime('sf-1', { state: 'pending', items: [], fetchedAt: null });
    expect(store.state.smartFolders['sf-1']).toEqual({
      state: 'pending',
      items: [],
      fetchedAt: null,
    });
  });

  test('an error keeps last-known items while stamping the attempt time', () => {
    store.setSmartFolderRuntime('sf-1', { state: 'ok', items: items('A'), fetchedAt: 10 });
    store.setSmartFolderRuntime('sf-1', { state: 'error', items: [], fetchedAt: 99 });
    expect(store.state.smartFolders['sf-1']).toEqual({
      state: 'error',
      items: items('A'),
      fetchedAt: 99,
    });
  });

  test('signed-out replaces wholesale (the sign-in row, not stale items)', () => {
    store.setSmartFolderRuntime('sf-1', { state: 'ok', items: items('A'), fetchedAt: 10 });
    store.setSmartFolderRuntime('sf-1', { state: 'signed-out', items: [], fetchedAt: 99 });
    expect(store.state.smartFolders['sf-1']).toEqual({
      state: 'signed-out',
      items: [],
      fetchedAt: 99,
    });
  });
});

describe('setPinned round-trips smart nodes', () => {
  test('a full-tree replace keeps the smart node config intact and de-dupes by id', () => {
    store.state.savedTabs['st-1'] = {
      id: 'st-1',
      spaceId: 'work',
      title: 'T',
      originalURL: 'https://x/',
      currentURL: null,
    };
    const tree: PinNode[] = [
      { kind: 'tab', id: 'st-1' },
      smartNode(),
      smartNode(), // duplicate id — dropped
    ];
    store.setPinned('work', tree);
    expect(store.state.pinnedBySpace.work).toEqual([{ kind: 'tab', id: 'st-1' }, smartNode()]);
  });
});
