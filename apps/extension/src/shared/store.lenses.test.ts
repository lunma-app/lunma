import { beforeEach, describe, expect, test, vi } from 'vitest';
import { LunmaStore } from './store.svelte';
import type { LensItem, PinNode } from './types';

type LensNode = Extract<PinNode, { kind: 'lens' }>;

function lensNode(overrides: Partial<LensNode> = {}): LensNode {
  return {
    kind: 'lens',
    lensKind: 'general',
    id: 'sf-1',
    name: 'Review requests',
    icon: 'folder-git-2',
    sources: [
      { source: 'gitlab', baseUrl: 'https://gitlab.example.com', queries: ['review-requested'] },
    ],
    maxItems: 20,
    hideRead: false,
    refreshMinutes: 10,
    ...overrides,
  };
}

function items(...titles: string[]): LensItem[] {
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

describe('addLens', () => {
  test('inserts the node at the top of the pinned list (like createFolder)', () => {
    store.state.savedTabs['st-1'] = {
      id: 'st-1',
      spaceId: 'work',
      title: 'T',
      originalURL: 'https://x/',
      currentURL: null,
    };
    store.state.pinnedBySpace.work = [{ kind: 'tab', id: 'st-1' }];
    store.addLens('work', lensNode());
    expect(store.state.pinnedBySpace.work?.map((n) => n.id)).toEqual(['sf-1', 'st-1']);
  });

  test('creates the Space list when none exists', () => {
    store.addLens('work', lensNode());
    expect(store.state.pinnedBySpace.work?.[0]).toMatchObject({ kind: 'lens', id: 'sf-1' });
  });
});

describe('updateLens', () => {
  test('edits config fields in place', () => {
    store.addLens('work', lensNode());
    store.updateLens('work', 'sf-1', {
      lensKind: 'general',
      icon: 'folder-git-2',
      name: 'Assigned',
      sources: [{ source: 'gitlab', baseUrl: 'https://gitlab.example.com', queries: ['assigned'] }],
      maxItems: 20,
      refreshMinutes: 30,
    });
    expect(store.state.pinnedBySpace.work?.[0]).toMatchObject({
      name: 'Assigned',
      sources: [{ queries: ['assigned'] }],
      refreshMinutes: 30,
    });
  });

  test('a query change prunes the removed section runtime (multi-filter design D6)', () => {
    store.addLens(
      'work',
      lensNode({
        sources: [
          { source: 'gitlab', baseUrl: 'https://gitlab.example.com', queries: ['assigned'] },
        ],
      }),
    );
    store.setLensSectionRuntime('sf-1', 'gitlab:gitlab.example.com:assigned', {
      state: 'ok',
      items: items('A'),
      fetchedAt: 123,
    });
    store.updateLens('work', 'sf-1', {
      lensKind: 'general',
      icon: 'folder-git-2',
      name: 'Review requests',
      sources: [
        { source: 'gitlab', baseUrl: 'https://gitlab.example.com', queries: ['review-requested'] },
      ],
      maxItems: 20,
      refreshMinutes: 10,
    });
    // The removed filter's section is dropped; the new one is added by the
    // coordinator's refetch, not the store.
    expect(
      store.state.lenses['sf-1']?.sections['gitlab:gitlab.example.com:assigned'],
    ).toBeUndefined();
  });

  test('a baseUrl change prunes the old section; a name-only change keeps it intact', () => {
    store.addLens('work', lensNode());
    store.setLensSectionRuntime('sf-1', 'gitlab:gitlab.example.com:review-requested', {
      state: 'ok',
      items: [],
      fetchedAt: 123,
    });
    // Name-only change: the section (same resolved key) keeps its fetchedAt.
    store.updateLens('work', 'sf-1', {
      lensKind: 'general',
      icon: 'folder-git-2',
      name: 'Renamed only',
      sources: [
        { source: 'gitlab', baseUrl: 'https://gitlab.example.com', queries: ['review-requested'] },
      ],
      maxItems: 20,
      refreshMinutes: 10,
    });
    expect(
      store.state.lenses['sf-1']?.sections['gitlab:gitlab.example.com:review-requested']?.fetchedAt,
    ).toBe(123);
    // baseUrl change → the old section key no longer resolves → pruned.
    store.updateLens('work', 'sf-1', {
      lensKind: 'general',
      icon: 'folder-git-2',
      name: 'Renamed only',
      sources: [
        { source: 'gitlab', baseUrl: 'https://gitlab.other.com', queries: ['review-requested'] },
      ],
      maxItems: 20,
      refreshMinutes: 10,
    });
    expect(
      store.state.lenses['sf-1']?.sections['gitlab:gitlab.example.com:review-requested'],
    ).toBeUndefined();
  });

  test('a maxItems change invalidates the remaining sections fetchedAt (rss-connector design D5)', () => {
    store.addLens('work', lensNode());
    store.setLensSectionRuntime('sf-1', 'gitlab:gitlab.example.com:review-requested', {
      state: 'ok',
      items: items('A'),
      fetchedAt: 123,
    });
    store.updateLens('work', 'sf-1', {
      lensKind: 'general',
      icon: 'folder-git-2',
      name: 'Review requests',
      sources: [
        { source: 'gitlab', baseUrl: 'https://gitlab.example.com', queries: ['review-requested'] },
      ],
      maxItems: 50,
      refreshMinutes: 10,
    });
    expect(store.state.pinnedBySpace.work?.[0]).toMatchObject({ maxItems: 50 });
    expect(
      store.state.lenses['sf-1']?.sections['gitlab:gitlab.example.com:review-requested']?.fetchedAt,
    ).toBeNull();
  });

  test('a source change prunes the old section and persists the new source', () => {
    store.addLens(
      'work',
      lensNode({
        sources: [
          { source: 'gitlab', baseUrl: 'https://forge.example.com', queries: ['review-requested'] },
        ],
      }),
    );
    store.setLensSectionRuntime('sf-1', 'gitlab:forge.example.com:review-requested', {
      state: 'ok',
      items: items('A'),
      fetchedAt: 123,
    });
    store.updateLens('work', 'sf-1', {
      lensKind: 'general',
      icon: 'folder-git-2',
      name: 'Review requests',
      sources: [
        { source: 'github', baseUrl: 'https://forge.example.com', queries: ['review-requested'] },
      ],
      maxItems: 20,
      refreshMinutes: 10,
    });
    expect(store.state.pinnedBySpace.work?.[0]).toMatchObject({ sources: [{ source: 'github' }] });
    expect(
      store.state.lenses['sf-1']?.sections['gitlab:forge.example.com:review-requested'],
    ).toBeUndefined();
  });

  test('preserves hideRead (owned by setLensHideRead, not the editor)', () => {
    store.addLens('work', lensNode());
    store.setLensHideRead('sf-1', true);
    store.updateLens('work', 'sf-1', {
      lensKind: 'general',
      icon: 'folder-git-2',
      name: 'Renamed',
      sources: [
        { source: 'gitlab', baseUrl: 'https://gitlab.example.com', queries: ['review-requested'] },
      ],
      maxItems: 20,
      refreshMinutes: 10,
    });
    expect(store.state.pinnedBySpace.work?.[0]).toMatchObject({ hideRead: true });
  });

  test('unknown folder is a logged no-op (the handler owns the throw)', () => {
    store.updateLens('work', 'nope', {
      lensKind: 'general',
      icon: 'folder-git-2',
      name: 'X',
      sources: [{ source: 'gitlab', baseUrl: 'https://gitlab.example.com', queries: ['authored'] }],
      maxItems: 20,
      refreshMinutes: 10,
    });
    expect(store.state.pinnedBySpace.work).toBeUndefined();
  });
});

describe('feed read-state (rss-connector design D3)', () => {
  function feedNode() {
    return lensNode({
      id: 'feed-1',
      sources: [{ source: 'rss', baseUrl: 'https://news.example.com/rss', queries: [] }],
    });
  }

  test('markLensItemRead is idempotent and seeds the folder entry', () => {
    store.markLensItemRead('feed-1', 'a');
    store.markLensItemRead('feed-1', 'a'); // dup -- no-op
    store.markLensItemRead('feed-1', 'b');
    expect(store.state.lensReadState['feed-1']).toEqual(['a', 'b']);
  });

  test('markAllLensItemsRead unions with the existing read set', () => {
    store.markLensItemRead('feed-1', 'a');
    store.markAllLensItemsRead('feed-1', ['b', 'c', 'a']);
    expect(store.state.lensReadState['feed-1']?.sort()).toEqual(['a', 'b', 'c']);
  });

  test('setLensHideRead writes the node preference', () => {
    store.addLens('work', feedNode());
    store.setLensHideRead('feed-1', true);
    expect(store.state.pinnedBySpace.work?.[0]).toMatchObject({ hideRead: true });
  });

  test('pruneLensReadState drops read ids absent from the live window (18 → 12 live → 6 dropped)', () => {
    const sk = 'rss:a.example.com';
    const all = Array.from({ length: 18 }, (_, i) => `${sk}:item-${i}`);
    for (const id of all) store.markLensItemRead('feed-1', id);
    expect(store.state.lensReadState['feed-1']).toHaveLength(18);
    const live = all.slice(0, 12); // the latest fetch only returned 12 of them
    store.pruneLensReadState('feed-1', sk, live);
    expect(store.state.lensReadState['feed-1']).toEqual(live);
    expect(store.state.lensReadState['feed-1']).toHaveLength(12);
  });

  test('pruneLensReadState removes the folder entry once empty', () => {
    const sk = 'rss:a.example.com';
    store.markLensItemRead('feed-1', `${sk}:a`);
    store.pruneLensReadState('feed-1', sk, [`${sk}:x`, `${sk}:y`]); // none survive
    expect(store.state.lensReadState['feed-1']).toBeUndefined();
  });

  test('pruneLensReadState leaves OTHER sections read ids intact (multi-section / OPML)', () => {
    const skA = 'rss:a.example.com';
    const skB = 'rss:b.example.com';
    store.markLensItemRead('feed-1', `${skA}:post-1`);
    store.markLensItemRead('feed-1', `${skB}:post-1`);
    // Section B refetches; its window omits its own read id, but MUST NOT touch A.
    store.pruneLensReadState('feed-1', skB, [`${skB}:post-9`]);
    expect(store.state.lensReadState['feed-1']).toContain(`${skA}:post-1`);
    expect(store.state.lensReadState['feed-1']).not.toContain(`${skB}:post-1`);
  });

  test("deleteLens drops the folder's read-state", () => {
    store.addLens('work', feedNode());
    store.markLensItemRead('feed-1', 'a');
    store.markLensItemRead('feed-1', 'b');
    store.deleteLens('work', 'feed-1');
    expect(store.state.lensReadState['feed-1']).toBeUndefined();
  });
});

describe('deleteLens', () => {
  test('removes the node AND drops its runtime entry', () => {
    store.addLens('work', lensNode());
    store.setLensSectionRuntime('sf-1', 'gitlab:gitlab.example.com', {
      state: 'ok',
      items: items('A'),
      fetchedAt: 1,
    });
    store.deleteLens('work', 'sf-1');
    expect(store.state.pinnedBySpace.work).toEqual([]);
    expect(store.state.lenses['sf-1']).toBeUndefined();
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
    store.addLens('work', lensNode());
    store.deleteLens('work', 'sf-1');
    expect(store.state.pinnedBySpace.work).toEqual([{ kind: 'tab', id: 'st-1' }]);
  });

  test('a Space with no pinned list is a logged no-op', () => {
    store.deleteLens('work', 'sf-1');
    expect(store.state.pinnedBySpace.work).toBeUndefined();
  });

  test('an unknown folderId in a populated list is a logged no-op', () => {
    store.addLens('work', lensNode());
    store.deleteLens('work', 'nope');
    expect(store.state.pinnedBySpace.work).toHaveLength(1);
  });
});

describe('setLensSectionRuntime', () => {
  const KEY = 'gitlab:gitlab.example.com';

  test('an ok runtime replaces wholesale', () => {
    store.setLensSectionRuntime('sf-1', KEY, {
      state: 'ok',
      items: items('A', 'B'),
      fetchedAt: 10,
    });
    expect(store.state.lenses['sf-1']?.sections[KEY]).toMatchObject({
      state: 'ok',
      fetchedAt: 10,
    });
    expect(store.state.lenses['sf-1']?.sections[KEY]?.items).toHaveLength(2);
  });

  test('a pending mark preserves last-known items and fetchedAt (the list never blinks)', () => {
    store.setLensSectionRuntime('sf-1', KEY, {
      state: 'ok',
      items: items('A', 'B'),
      fetchedAt: 10,
    });
    store.setLensSectionRuntime('sf-1', KEY, { state: 'pending', items: [], fetchedAt: null });
    expect(store.state.lenses['sf-1']?.sections[KEY]).toEqual({
      state: 'pending',
      items: items('A', 'B'),
      fetchedAt: 10,
    });
  });

  test('a first-ever pending (no prior runtime) lands as-is -- the ghost-rows state', () => {
    store.setLensSectionRuntime('sf-1', KEY, { state: 'pending', items: [], fetchedAt: null });
    expect(store.state.lenses['sf-1']?.sections[KEY]).toEqual({
      state: 'pending',
      items: [],
      fetchedAt: null,
    });
  });

  test('an error keeps last-known items while stamping the attempt time', () => {
    store.setLensSectionRuntime('sf-1', KEY, { state: 'ok', items: items('A'), fetchedAt: 10 });
    store.setLensSectionRuntime('sf-1', KEY, { state: 'error', items: [], fetchedAt: 99 });
    expect(store.state.lenses['sf-1']?.sections[KEY]).toEqual({
      state: 'error',
      items: items('A'),
      fetchedAt: 99,
    });
  });

  test('signed-out replaces wholesale (the sign-in row, not stale items)', () => {
    store.setLensSectionRuntime('sf-1', KEY, { state: 'ok', items: items('A'), fetchedAt: 10 });
    store.setLensSectionRuntime('sf-1', KEY, { state: 'signed-out', items: [], fetchedAt: 99 });
    expect(store.state.lenses['sf-1']?.sections[KEY]).toEqual({
      state: 'signed-out',
      items: [],
      fetchedAt: 99,
    });
  });
});

describe('setPinned round-trips lens nodes', () => {
  test('a full-tree replace keeps the lens node config intact and de-dupes by id', () => {
    store.state.savedTabs['st-1'] = {
      id: 'st-1',
      spaceId: 'work',
      title: 'T',
      originalURL: 'https://x/',
      currentURL: null,
    };
    const tree: PinNode[] = [
      { kind: 'tab', id: 'st-1' },
      lensNode(),
      lensNode(), // duplicate id -- dropped
    ];
    store.setPinned('work', tree);
    expect(store.state.pinnedBySpace.work).toEqual([{ kind: 'tab', id: 'st-1' }, lensNode()]);
  });
});

describe('lens-item bindings (smart-folder-item-bindings)', () => {
  // A live (window 100, Space work) instance so the temp classifier has a
  // Temporary list to (not) claim into.
  beforeEach(() => {
    store.state.activeSpaceByWindow[100] = 'work';
    store.state.spaceInstancesByWindow[100] = {
      work: { spaceId: 'work', groupId: -1, tempTabIds: [], tempTabTitles: {} },
    };
  });

  test('bindLensItem / unbindLensItemsForTab round-trip', () => {
    store.bindLensItem('sf-1', '42', 100, 7, '');
    expect(store.state.lensItemBindings).toEqual({
      'sf-1': { '42': { 100: { tabId: 7, allowGlob: '' } } },
    });

    store.unbindLensItemsForTab(7);
    // Emptied item AND folder records prune away -- no empty husks persist.
    expect(store.state.lensItemBindings).toEqual({});
  });

  test("unbindLensItemsForTab drops only the closing tab's slot", () => {
    store.bindLensItem('sf-1', '42', 100, 7, '');
    store.bindLensItem('sf-1', '42', 200, 8, ''); // same item bound in another window
    store.bindLensItem('sf-1', '43', 100, 9, '');

    store.unbindLensItemsForTab(7);

    expect(store.state.lensItemBindings).toEqual({
      'sf-1': {
        '42': { 200: { tabId: 8, allowGlob: '' } },
        '43': { 100: { tabId: 9, allowGlob: '' } },
      },
    });
  });

  test('bindLensItem enforces bound-not-temp for the window', () => {
    const instance = store.state.spaceInstancesByWindow[100]?.work;
    instance?.tempTabIds.push(7);
    store.bindLensItem('sf-1', '42', 100, 7, '');
    expect(instance?.tempTabIds).toEqual([]);
  });

  test('onTabCreated skips a lens-item-bound tab (never temp)', () => {
    store.bindLensItem('sf-1', '42', 100, 7, '');
    store.onTabCreated({ id: 7, windowId: 100 });
    expect(store.state.spaceInstancesByWindow[100]?.work?.tempTabIds).toEqual([]);
  });

  test('onTabRemoved unbinds the closed tab', () => {
    store.bindLensItem('sf-1', '42', 100, 7, '');
    store.onTabRemoved(7, { windowId: 100 });
    expect(store.state.lensItemBindings).toEqual({});
  });

  test('dropLensBindings returns the still-open tab ids and clears the slice', () => {
    store.bindLensItem('sf-1', '42', 100, 7, '');
    store.bindLensItem('sf-1', '43', 100, 9, '');
    store.bindLensItem('sf-2', '50', 100, 11, ''); // another folder -- untouched
    // Tab 7 is live; tab 9 already closed (no live record) -- a stale slot.
    store.state.liveTabsById[7] = {
      tabId: 7,
      windowId: 100,
      title: 'MR 42',
      url: 'https://gitlab.example.com/mr/42',
      active: false,
      status: 'complete',
    };

    const orphaned = store.dropLensBindings('sf-1');

    expect(orphaned).toEqual([7]);
    expect(store.state.lensItemBindings).toEqual({
      'sf-2': { '50': { 100: { tabId: 11, allowGlob: '' } } },
    });
  });

  test('dropLensBindings on an unknown folder returns []', () => {
    expect(store.dropLensBindings('sf-nope')).toEqual([]);
  });

  test("deleteLens drops the folder's bindings", () => {
    store.addLens('work', lensNode());
    store.bindLensItem('sf-1', '42', 100, 7, '');
    store.deleteLens('work', 'sf-1');
    expect(store.state.lensItemBindings).toEqual({});
  });
});

// ---------------------------------------------------------------------------
// nextUnreadFeedItemAfterClose
// ---------------------------------------------------------------------------

function feedNode(overrides: Partial<LensNode> = {}): LensNode {
  return {
    kind: 'lens',
    lensKind: 'general',
    id: 'sf-feed',
    name: 'News',
    icon: 'rss',
    sources: [{ source: 'rss', baseUrl: 'https://news.example.com/feed.xml', queries: [] }],
    maxItems: 10,
    hideRead: false,
    refreshMinutes: 30,
    ...overrides,
  };
}

function seedFeedSection(folderId: string, sk: string, itemIds: string[]): void {
  store.setLensSectionRuntime(folderId, sk, {
    state: 'ok',
    items: itemIds.map((id) => ({ id, title: id, url: `https://news.example.com/${id}` })),
    fetchedAt: 0,
  });
}

describe('nextUnreadFeedItemAfterClose', () => {
  const SK = 'rss:news.example.com';
  const W = 1;

  beforeEach(() => {
    store.addLens('work', feedNode());
    seedFeedSection('sf-feed', SK, ['a', 'b', 'c', 'd']);
  });

  test('returns undefined when the closing item was already read (consume=close, no runaway advance)', () => {
    store.bindLensItem('sf-feed', `${SK}:a`, W, 10, '');
    // The drain marked 'a' read BEFORE closing its tab — this is a consume, not
    // a manual close of an unread reading tab, so it must NOT auto-advance
    // (else consume → open next → consume → … drains the whole section).
    store.markLensItemRead('sf-feed', `${SK}:a`);
    expect(store.nextUnreadFeedItemAfterClose(10, W)).toBeUndefined();
  });

  test('returns the first unread item after the closing one', () => {
    store.bindLensItem('sf-feed', `${SK}:a`, W, 10, '');
    const result = store.nextUnreadFeedItemAfterClose(10, W);
    expect(result).toEqual({
      spaceId: 'work',
      folderId: 'sf-feed',
      itemId: `${SK}:b`,
      windowId: W,
    });
  });

  test('skips already-read items', () => {
    store.bindLensItem('sf-feed', `${SK}:a`, W, 10, '');
    store.markLensItemRead('sf-feed', `${SK}:b`);
    store.markLensItemRead('sf-feed', `${SK}:c`);
    const result = store.nextUnreadFeedItemAfterClose(10, W);
    expect(result?.itemId).toBe(`${SK}:d`);
  });

  test('skips items already bound (open) in this window', () => {
    store.bindLensItem('sf-feed', `${SK}:a`, W, 10, '');
    store.bindLensItem('sf-feed', `${SK}:b`, W, 11, '');
    const result = store.nextUnreadFeedItemAfterClose(10, W);
    expect(result?.itemId).toBe(`${SK}:c`);
  });

  test('returns undefined when all remaining items are read', () => {
    store.bindLensItem('sf-feed', `${SK}:a`, W, 10, '');
    store.markLensItemRead('sf-feed', `${SK}:b`);
    store.markLensItemRead('sf-feed', `${SK}:c`);
    store.markLensItemRead('sf-feed', `${SK}:d`);
    expect(store.nextUnreadFeedItemAfterClose(10, W)).toBeUndefined();
  });

  test('returns undefined when the closed tab is not a lens item', () => {
    expect(store.nextUnreadFeedItemAfterClose(99, W)).toBeUndefined();
  });

  test('returns undefined for a non-feed folder (e.g. GitLab)', () => {
    store.addLens('work', {
      ...lensNode({ id: 'sf-gl' }),
      sources: [{ source: 'gitlab', baseUrl: 'https://gitlab.example.com', queries: ['authored'] }],
    });
    store.bindLensItem('sf-gl', 'gitlab:gitlab.example.com:mr-1', W, 20, '');
    expect(store.nextUnreadFeedItemAfterClose(20, W)).toBeUndefined();
  });

  test('the closing item itself is never returned as the next', () => {
    // Only item a exists and is bound -- no next item available.
    const feedSection = store.state.lenses['sf-feed']?.sections[SK];
    if (!feedSection) throw new Error('sf-feed section not found');
    feedSection.items = [{ id: 'a', title: 'a', url: 'https://news.example.com/a' }];
    store.bindLensItem('sf-feed', `${SK}:a`, W, 10, '');
    expect(store.nextUnreadFeedItemAfterClose(10, W)).toBeUndefined();
  });
});
