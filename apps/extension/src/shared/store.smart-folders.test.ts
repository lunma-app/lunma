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
    sources: [
      { source: 'gitlab', baseUrl: 'https://gitlab.example.com', query: 'review-requested' },
    ],
    maxItems: 20,
    hideRead: false,
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
      icon: 'folder-git-2',
      name: 'Assigned',
      sources: [{ source: 'gitlab', baseUrl: 'https://gitlab.example.com', query: 'assigned' }],
      maxItems: 20,
      refreshMinutes: 30,
    });
    expect(store.state.pinnedBySpace.work?.[0]).toMatchObject({
      name: 'Assigned',
      sources: [{ query: 'assigned' }],
      refreshMinutes: 30,
    });
  });

  test('a query change invalidates the runtime fetchedAt (immediately due)', () => {
    store.addSmartFolder(
      'work',
      smartNode({
        sources: [{ source: 'gitlab', baseUrl: 'https://gitlab.example.com', query: 'assigned' }],
      }),
    );
    store.setSmartSectionRuntime('sf-1', 'gitlab:gitlab.example.com', {
      state: 'ok',
      items: items('A'),
      fetchedAt: 123,
    });
    store.updateSmartFolder('work', 'sf-1', {
      icon: 'folder-git-2',
      name: 'Review requests',
      sources: [
        { source: 'gitlab', baseUrl: 'https://gitlab.example.com', query: 'review-requested' },
      ],
      maxItems: 20,
      refreshMinutes: 10,
    });
    expect(
      store.state.smartFolders['sf-1']?.sections['gitlab:gitlab.example.com']?.fetchedAt,
    ).toBeNull();
  });

  test('a baseUrl change invalidates fetchedAt; a name-only change does not', () => {
    store.addSmartFolder('work', smartNode());
    store.setSmartSectionRuntime('sf-1', 'gitlab:gitlab.example.com', {
      state: 'ok',
      items: [],
      fetchedAt: 123,
    });
    store.updateSmartFolder('work', 'sf-1', {
      icon: 'folder-git-2',
      name: 'Renamed only',
      sources: [
        { source: 'gitlab', baseUrl: 'https://gitlab.example.com', query: 'review-requested' },
      ],
      maxItems: 20,
      refreshMinutes: 10,
    });
    expect(store.state.smartFolders['sf-1']?.sections['gitlab:gitlab.example.com']?.fetchedAt).toBe(
      123,
    );
    store.updateSmartFolder('work', 'sf-1', {
      icon: 'folder-git-2',
      name: 'Renamed only',
      sources: [
        { source: 'gitlab', baseUrl: 'https://gitlab.other.com', query: 'review-requested' },
      ],
      maxItems: 20,
      refreshMinutes: 10,
    });
    expect(
      store.state.smartFolders['sf-1']?.sections['gitlab:gitlab.example.com']?.fetchedAt,
    ).toBeNull();
  });

  test('a maxItems change invalidates fetchedAt (rss-connector design D5)', () => {
    store.addSmartFolder('work', smartNode());
    store.setSmartSectionRuntime('sf-1', 'gitlab:gitlab.example.com', {
      state: 'ok',
      items: items('A'),
      fetchedAt: 123,
    });
    store.updateSmartFolder('work', 'sf-1', {
      icon: 'folder-git-2',
      name: 'Review requests',
      sources: [
        { source: 'gitlab', baseUrl: 'https://gitlab.example.com', query: 'review-requested' },
      ],
      maxItems: 50,
      refreshMinutes: 10,
    });
    expect(store.state.pinnedBySpace.work?.[0]).toMatchObject({ maxItems: 50 });
    expect(
      store.state.smartFolders['sf-1']?.sections['gitlab:gitlab.example.com']?.fetchedAt,
    ).toBeNull();
  });

  test('a source-only change invalidates fetchedAt and persists the new source', () => {
    store.addSmartFolder(
      'work',
      smartNode({
        sources: [
          { source: 'gitlab', baseUrl: 'https://forge.example.com', query: 'review-requested' },
        ],
      }),
    );
    store.setSmartSectionRuntime('sf-1', 'gitlab:forge.example.com', {
      state: 'ok',
      items: items('A'),
      fetchedAt: 123,
    });
    store.updateSmartFolder('work', 'sf-1', {
      icon: 'folder-git-2',
      name: 'Review requests',
      sources: [
        { source: 'github', baseUrl: 'https://forge.example.com', query: 'review-requested' },
      ],
      maxItems: 20,
      refreshMinutes: 10,
    });
    expect(store.state.pinnedBySpace.work?.[0]).toMatchObject({ sources: [{ source: 'github' }] });
    expect(
      store.state.smartFolders['sf-1']?.sections['gitlab:forge.example.com']?.fetchedAt,
    ).toBeNull();
  });

  test('preserves hideRead (owned by setSmartFolderHideRead, not the editor)', () => {
    store.addSmartFolder('work', smartNode());
    store.setSmartFolderHideRead('sf-1', true);
    store.updateSmartFolder('work', 'sf-1', {
      icon: 'folder-git-2',
      name: 'Renamed',
      sources: [
        { source: 'gitlab', baseUrl: 'https://gitlab.example.com', query: 'review-requested' },
      ],
      maxItems: 20,
      refreshMinutes: 10,
    });
    expect(store.state.pinnedBySpace.work?.[0]).toMatchObject({ hideRead: true });
  });

  test('unknown folder is a logged no-op (the handler owns the throw)', () => {
    store.updateSmartFolder('work', 'nope', {
      icon: 'folder-git-2',
      name: 'X',
      sources: [{ source: 'gitlab', baseUrl: 'https://gitlab.example.com', query: 'authored' }],
      maxItems: 20,
      refreshMinutes: 10,
    });
    expect(store.state.pinnedBySpace.work).toBeUndefined();
  });
});

describe('feed read-state (rss-connector design D3)', () => {
  function feedNode() {
    return smartNode({
      id: 'feed-1',
      sources: [{ source: 'rss', baseUrl: 'https://news.example.com/rss' }],
    });
  }

  test('markSmartItemRead is idempotent and seeds the folder entry', () => {
    store.markSmartItemRead('feed-1', 'a');
    store.markSmartItemRead('feed-1', 'a'); // dup -- no-op
    store.markSmartItemRead('feed-1', 'b');
    expect(store.state.smartReadState['feed-1']).toEqual(['a', 'b']);
  });

  test('markAllSmartItemsRead unions with the existing read set', () => {
    store.markSmartItemRead('feed-1', 'a');
    store.markAllSmartItemsRead('feed-1', ['b', 'c', 'a']);
    expect(store.state.smartReadState['feed-1']?.sort()).toEqual(['a', 'b', 'c']);
  });

  test('setSmartFolderHideRead writes the node preference', () => {
    store.addSmartFolder('work', feedNode());
    store.setSmartFolderHideRead('feed-1', true);
    expect(store.state.pinnedBySpace.work?.[0]).toMatchObject({ hideRead: true });
  });

  test('pruneSmartReadState drops read ids absent from the live window (18 → 12 live → 6 dropped)', () => {
    const all = Array.from({ length: 18 }, (_, i) => `item-${i}`);
    for (const id of all) store.markSmartItemRead('feed-1', id);
    expect(store.state.smartReadState['feed-1']).toHaveLength(18);
    const live = all.slice(0, 12); // the latest fetch only returned 12 of them
    store.pruneSmartReadState('feed-1', live);
    expect(store.state.smartReadState['feed-1']).toEqual(live);
    expect(store.state.smartReadState['feed-1']).toHaveLength(12);
  });

  test('pruneSmartReadState removes the folder entry once empty', () => {
    store.markSmartItemRead('feed-1', 'a');
    store.pruneSmartReadState('feed-1', ['x', 'y']); // none survive
    expect(store.state.smartReadState['feed-1']).toBeUndefined();
  });

  test("deleteSmartFolder drops the folder's read-state", () => {
    store.addSmartFolder('work', feedNode());
    store.markSmartItemRead('feed-1', 'a');
    store.markSmartItemRead('feed-1', 'b');
    store.deleteSmartFolder('work', 'feed-1');
    expect(store.state.smartReadState['feed-1']).toBeUndefined();
  });
});

describe('deleteSmartFolder', () => {
  test('removes the node AND drops its runtime entry', () => {
    store.addSmartFolder('work', smartNode());
    store.setSmartSectionRuntime('sf-1', 'gitlab:gitlab.example.com', {
      state: 'ok',
      items: items('A'),
      fetchedAt: 1,
    });
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

describe('setSmartSectionRuntime', () => {
  const KEY = 'gitlab:gitlab.example.com';

  test('an ok runtime replaces wholesale', () => {
    store.setSmartSectionRuntime('sf-1', KEY, {
      state: 'ok',
      items: items('A', 'B'),
      fetchedAt: 10,
    });
    expect(store.state.smartFolders['sf-1']?.sections[KEY]).toMatchObject({
      state: 'ok',
      fetchedAt: 10,
    });
    expect(store.state.smartFolders['sf-1']?.sections[KEY]?.items).toHaveLength(2);
  });

  test('a pending mark preserves last-known items and fetchedAt (the list never blinks)', () => {
    store.setSmartSectionRuntime('sf-1', KEY, {
      state: 'ok',
      items: items('A', 'B'),
      fetchedAt: 10,
    });
    store.setSmartSectionRuntime('sf-1', KEY, { state: 'pending', items: [], fetchedAt: null });
    expect(store.state.smartFolders['sf-1']?.sections[KEY]).toEqual({
      state: 'pending',
      items: items('A', 'B'),
      fetchedAt: 10,
    });
  });

  test('a first-ever pending (no prior runtime) lands as-is -- the ghost-rows state', () => {
    store.setSmartSectionRuntime('sf-1', KEY, { state: 'pending', items: [], fetchedAt: null });
    expect(store.state.smartFolders['sf-1']?.sections[KEY]).toEqual({
      state: 'pending',
      items: [],
      fetchedAt: null,
    });
  });

  test('an error keeps last-known items while stamping the attempt time', () => {
    store.setSmartSectionRuntime('sf-1', KEY, { state: 'ok', items: items('A'), fetchedAt: 10 });
    store.setSmartSectionRuntime('sf-1', KEY, { state: 'error', items: [], fetchedAt: 99 });
    expect(store.state.smartFolders['sf-1']?.sections[KEY]).toEqual({
      state: 'error',
      items: items('A'),
      fetchedAt: 99,
    });
  });

  test('signed-out replaces wholesale (the sign-in row, not stale items)', () => {
    store.setSmartSectionRuntime('sf-1', KEY, { state: 'ok', items: items('A'), fetchedAt: 10 });
    store.setSmartSectionRuntime('sf-1', KEY, { state: 'signed-out', items: [], fetchedAt: 99 });
    expect(store.state.smartFolders['sf-1']?.sections[KEY]).toEqual({
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
      smartNode(), // duplicate id -- dropped
    ];
    store.setPinned('work', tree);
    expect(store.state.pinnedBySpace.work).toEqual([{ kind: 'tab', id: 'st-1' }, smartNode()]);
  });
});

describe('smart-item bindings (smart-folder-item-bindings)', () => {
  // A live (window 100, Space work) instance so the temp classifier has a
  // Temporary list to (not) claim into.
  beforeEach(() => {
    store.state.activeSpaceByWindow[100] = 'work';
    store.state.spaceInstancesByWindow[100] = {
      work: { spaceId: 'work', groupId: -1, tempTabIds: [], tempTabTitles: {} },
    };
  });

  test('bindSmartItem / unbindSmartItemsForTab round-trip', () => {
    store.bindSmartItem('sf-1', '42', 100, 7, '');
    expect(store.state.smartItemBindings).toEqual({
      'sf-1': { '42': { 100: { tabId: 7, allowGlob: '' } } },
    });

    store.unbindSmartItemsForTab(7);
    // Emptied item AND folder records prune away -- no empty husks persist.
    expect(store.state.smartItemBindings).toEqual({});
  });

  test("unbindSmartItemsForTab drops only the closing tab's slot", () => {
    store.bindSmartItem('sf-1', '42', 100, 7, '');
    store.bindSmartItem('sf-1', '42', 200, 8, ''); // same item bound in another window
    store.bindSmartItem('sf-1', '43', 100, 9, '');

    store.unbindSmartItemsForTab(7);

    expect(store.state.smartItemBindings).toEqual({
      'sf-1': {
        '42': { 200: { tabId: 8, allowGlob: '' } },
        '43': { 100: { tabId: 9, allowGlob: '' } },
      },
    });
  });

  test('bindSmartItem enforces bound-not-temp for the window', () => {
    const instance = store.state.spaceInstancesByWindow[100]?.work;
    instance?.tempTabIds.push(7);
    store.bindSmartItem('sf-1', '42', 100, 7, '');
    expect(instance?.tempTabIds).toEqual([]);
  });

  test('onTabCreated skips a smart-item-bound tab (never temp)', () => {
    store.bindSmartItem('sf-1', '42', 100, 7, '');
    store.onTabCreated({ id: 7, windowId: 100 });
    expect(store.state.spaceInstancesByWindow[100]?.work?.tempTabIds).toEqual([]);
  });

  test('onTabRemoved unbinds the closed tab', () => {
    store.bindSmartItem('sf-1', '42', 100, 7, '');
    store.onTabRemoved(7, { windowId: 100 });
    expect(store.state.smartItemBindings).toEqual({});
  });

  test('dropSmartFolderBindings returns the still-open tab ids and clears the slice', () => {
    store.bindSmartItem('sf-1', '42', 100, 7, '');
    store.bindSmartItem('sf-1', '43', 100, 9, '');
    store.bindSmartItem('sf-2', '50', 100, 11, ''); // another folder -- untouched
    // Tab 7 is live; tab 9 already closed (no live record) -- a stale slot.
    store.state.liveTabsById[7] = {
      tabId: 7,
      windowId: 100,
      title: 'MR 42',
      url: 'https://gitlab.example.com/mr/42',
      active: false,
      status: 'complete',
    };

    const orphaned = store.dropSmartFolderBindings('sf-1');

    expect(orphaned).toEqual([7]);
    expect(store.state.smartItemBindings).toEqual({
      'sf-2': { '50': { 100: { tabId: 11, allowGlob: '' } } },
    });
  });

  test('dropSmartFolderBindings on an unknown folder returns []', () => {
    expect(store.dropSmartFolderBindings('sf-nope')).toEqual([]);
  });

  test("deleteSmartFolder drops the folder's bindings", () => {
    store.addSmartFolder('work', smartNode());
    store.bindSmartItem('sf-1', '42', 100, 7, '');
    store.deleteSmartFolder('work', 'sf-1');
    expect(store.state.smartItemBindings).toEqual({});
  });
});

// ---------------------------------------------------------------------------
// nextUnreadFeedItemAfterClose
// ---------------------------------------------------------------------------

function feedNode(overrides: Partial<SmartNode> = {}): SmartNode {
  return {
    kind: 'smart',
    id: 'sf-feed',
    name: 'News',
    icon: 'rss',
    sources: [{ source: 'rss', baseUrl: 'https://news.example.com/feed.xml' }],
    maxItems: 10,
    hideRead: false,
    refreshMinutes: 30,
    ...overrides,
  };
}

function seedFeedSection(folderId: string, sk: string, itemIds: string[]): void {
  store.setSmartSectionRuntime(folderId, sk, {
    state: 'ok',
    items: itemIds.map((id) => ({ id, title: id, url: `https://news.example.com/${id}` })),
    fetchedAt: 0,
  });
}

describe('nextUnreadFeedItemAfterClose', () => {
  const SK = 'rss:news.example.com';
  const W = 1;

  beforeEach(() => {
    store.addSmartFolder('work', feedNode());
    seedFeedSection('sf-feed', SK, ['a', 'b', 'c', 'd']);
  });

  test('returns the first unread item after the closing one', () => {
    store.bindSmartItem('sf-feed', `${SK}:a`, W, 10, '');
    const result = store.nextUnreadFeedItemAfterClose(10, W);
    expect(result).toEqual({
      spaceId: 'work',
      folderId: 'sf-feed',
      itemId: `${SK}:b`,
      windowId: W,
    });
  });

  test('skips already-read items', () => {
    store.bindSmartItem('sf-feed', `${SK}:a`, W, 10, '');
    store.markSmartItemRead('sf-feed', `${SK}:b`);
    store.markSmartItemRead('sf-feed', `${SK}:c`);
    const result = store.nextUnreadFeedItemAfterClose(10, W);
    expect(result?.itemId).toBe(`${SK}:d`);
  });

  test('skips items already bound (open) in this window', () => {
    store.bindSmartItem('sf-feed', `${SK}:a`, W, 10, '');
    store.bindSmartItem('sf-feed', `${SK}:b`, W, 11, '');
    const result = store.nextUnreadFeedItemAfterClose(10, W);
    expect(result?.itemId).toBe(`${SK}:c`);
  });

  test('returns undefined when all remaining items are read', () => {
    store.bindSmartItem('sf-feed', `${SK}:a`, W, 10, '');
    store.markSmartItemRead('sf-feed', `${SK}:b`);
    store.markSmartItemRead('sf-feed', `${SK}:c`);
    store.markSmartItemRead('sf-feed', `${SK}:d`);
    expect(store.nextUnreadFeedItemAfterClose(10, W)).toBeUndefined();
  });

  test('returns undefined when the closed tab is not a smart item', () => {
    expect(store.nextUnreadFeedItemAfterClose(99, W)).toBeUndefined();
  });

  test('returns undefined for a non-feed folder (e.g. GitLab)', () => {
    store.addSmartFolder('work', {
      ...smartNode({ id: 'sf-gl' }),
      sources: [{ source: 'gitlab', baseUrl: 'https://gitlab.example.com', query: 'authored' }],
    });
    store.bindSmartItem('sf-gl', 'gitlab:gitlab.example.com:mr-1', W, 20, '');
    expect(store.nextUnreadFeedItemAfterClose(20, W)).toBeUndefined();
  });

  test('the closing item itself is never returned as the next', () => {
    // Only item a exists and is bound -- no next item available.
    store.state.smartFolders['sf-feed']!.sections[SK]!.items = [
      { id: 'a', title: 'a', url: 'https://news.example.com/a' },
    ];
    store.bindSmartItem('sf-feed', `${SK}:a`, W, 10, '');
    expect(store.nextUnreadFeedItemAfterClose(10, W)).toBeUndefined();
  });
});
