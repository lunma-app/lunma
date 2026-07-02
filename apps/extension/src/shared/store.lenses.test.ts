import { beforeEach, describe, expect, test, vi } from 'vitest';
import { LunmaStore } from './store.svelte';
import type { LensItem, PinNode, SourceAccount } from './types';

type LensNode = Extract<PinNode, { kind: 'lens' }>;

// Connected accounts the fixtures reference (connector-accounts). Seeded into
// `store.state.sources` in `beforeEach` so each lens reference resolves to a
// provider/baseUrl when the store derives section keys / feed-folder status.
const ACCOUNTS: SourceAccount[] = [
  { id: 'acc-gl-ex', provider: 'gitlab', baseUrl: 'https://gitlab.example.com' },
  { id: 'acc-gl-other', provider: 'gitlab', baseUrl: 'https://gitlab.other.com' },
  { id: 'acc-gl-forge', provider: 'gitlab', baseUrl: 'https://forge.example.com' },
  { id: 'acc-gh-forge', provider: 'github', baseUrl: 'https://forge.example.com' },
  { id: 'acc-rss-news', provider: 'rss', baseUrl: 'https://news.example.com/rss' },
  { id: 'acc-rss-feed', provider: 'rss', baseUrl: 'https://news.example.com/feed.xml' },
];

function lensNode(overrides: Partial<LensNode> = {}): LensNode {
  return {
    kind: 'lens',
    lensKind: 'general',
    id: 'sf-1',
    name: 'Review requests',
    icon: 'folder-git-2',
    sources: [{ sourceId: 'acc-gl-ex', queries: ['review-requested'] }],
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
  for (const account of ACCOUNTS) store.addSource({ ...account });
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

describe('reconcileLensKinds (sources-redesign D9)', () => {
  test('a pre-existing general lens holding a git source flips to review', () => {
    // Buildable before this change: a general lens that contains a github source.
    store.addLens(
      'work',
      lensNode({
        lensKind: 'general',
        sources: [{ sourceId: 'acc-gh-forge', queries: ['authored'] }],
      }),
    );
    const changed = store.reconcileLensKinds();
    expect(changed).toBe(true);
    expect((store.state.pinnedBySpace.work?.[0] as LensNode).lensKind).toBe('review');
  });

  test('a feed-only general lens is left general (no change)', () => {
    store.addLens(
      'work',
      lensNode({ lensKind: 'general', sources: [{ sourceId: 'acc-rss-news', queries: [] }] }),
    );
    const changed = store.reconcileLensKinds();
    expect(changed).toBe(false);
    expect((store.state.pinnedBySpace.work?.[0] as LensNode).lensKind).toBe('general');
  });

  test('a review lens whose git source was removed flips back to general', () => {
    store.addLens(
      'work',
      lensNode({ lensKind: 'review', sources: [{ sourceId: 'acc-rss-news', queries: [] }] }),
    );
    const changed = store.reconcileLensKinds();
    expect(changed).toBe(true);
    expect((store.state.pinnedBySpace.work?.[0] as LensNode).lensKind).toBe('general');
  });
});

describe('account mutators (connector-accounts)', () => {
  test('addSource / renameSource / removeSource round-trip', () => {
    store.removeSource('acc-gl-ex'); // start from a clean known state
    store.addSource({ id: 'acc-x', provider: 'github', baseUrl: 'https://github.com' });
    expect(store.state.sources['acc-x']).toEqual({
      id: 'acc-x',
      provider: 'github',
      baseUrl: 'https://github.com',
    });
    store.renameSource('acc-x', 'Work');
    expect(store.state.sources['acc-x']?.name).toBe('Work');
    store.removeSource('acc-x');
    expect(store.state.sources['acc-x']).toBeUndefined();
  });

  test('removeSource leaves a referencing lens ref dangling (no crash)', () => {
    store.addLens('work', lensNode()); // references acc-gl-ex
    store.removeSource('acc-gl-ex');
    expect(store.state.sources['acc-gl-ex']).toBeUndefined();
    // The lens node keeps its (now dangling) reference.
    expect(store.state.pinnedBySpace.work?.[0]).toMatchObject({
      sources: [{ sourceId: 'acc-gl-ex' }],
    });
  });
});

describe('updateLens', () => {
  test('edits config fields in place', () => {
    store.addLens('work', lensNode());
    store.updateLens('work', 'sf-1', {
      lensKind: 'general',
      icon: 'folder-git-2',
      name: 'Assigned',
      sources: [{ sourceId: 'acc-gl-ex', queries: ['assigned'] }],
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
        sources: [{ sourceId: 'acc-gl-ex', queries: ['assigned'] }],
      }),
    );
    store.setLensSectionRuntime('sf-1', 'acc-gl-ex:assigned', {
      state: 'ok',
      items: items('A'),
      fetchedAt: 123,
    });
    store.updateLens('work', 'sf-1', {
      lensKind: 'general',
      icon: 'folder-git-2',
      name: 'Review requests',
      sources: [{ sourceId: 'acc-gl-ex', queries: ['review-requested'] }],
      maxItems: 20,
      refreshMinutes: 10,
    });
    // The removed filter's section is dropped; the new one is added by the
    // coordinator's refetch, not the store.
    expect(store.state.lenses['sf-1']?.sections['acc-gl-ex:assigned']).toBeUndefined();
  });

  test('a baseUrl change prunes the old section; a name-only change keeps it intact', () => {
    store.addLens('work', lensNode());
    store.setLensSectionRuntime('sf-1', 'acc-gl-ex:review-requested', {
      state: 'ok',
      items: [],
      fetchedAt: 123,
    });
    // Name-only change: the section (same resolved key) keeps its fetchedAt.
    store.updateLens('work', 'sf-1', {
      lensKind: 'general',
      icon: 'folder-git-2',
      name: 'Renamed only',
      sources: [{ sourceId: 'acc-gl-ex', queries: ['review-requested'] }],
      maxItems: 20,
      refreshMinutes: 10,
    });
    expect(store.state.lenses['sf-1']?.sections['acc-gl-ex:review-requested']?.fetchedAt).toBe(123);
    // baseUrl change → the old section key no longer resolves → pruned.
    store.updateLens('work', 'sf-1', {
      lensKind: 'general',
      icon: 'folder-git-2',
      name: 'Renamed only',
      sources: [{ sourceId: 'acc-gl-other', queries: ['review-requested'] }],
      maxItems: 20,
      refreshMinutes: 10,
    });
    expect(store.state.lenses['sf-1']?.sections['acc-gl-ex:review-requested']).toBeUndefined();
  });

  test('a maxItems change invalidates the remaining sections fetchedAt (rss-connector design D5)', () => {
    store.addLens('work', lensNode());
    store.setLensSectionRuntime('sf-1', 'acc-gl-ex:review-requested', {
      state: 'ok',
      items: items('A'),
      fetchedAt: 123,
    });
    store.updateLens('work', 'sf-1', {
      lensKind: 'general',
      icon: 'folder-git-2',
      name: 'Review requests',
      sources: [{ sourceId: 'acc-gl-ex', queries: ['review-requested'] }],
      maxItems: 50,
      refreshMinutes: 10,
    });
    expect(store.state.pinnedBySpace.work?.[0]).toMatchObject({ maxItems: 50 });
    expect(
      store.state.lenses['sf-1']?.sections['acc-gl-ex:review-requested']?.fetchedAt,
    ).toBeNull();
  });

  test('a source change prunes the old section and persists the new source', () => {
    store.addLens(
      'work',
      lensNode({
        sources: [{ sourceId: 'acc-gl-forge', queries: ['review-requested'] }],
      }),
    );
    store.setLensSectionRuntime('sf-1', 'acc-gl-forge:review-requested', {
      state: 'ok',
      items: items('A'),
      fetchedAt: 123,
    });
    store.updateLens('work', 'sf-1', {
      lensKind: 'general',
      icon: 'folder-git-2',
      name: 'Review requests',
      sources: [{ sourceId: 'acc-gh-forge', queries: ['review-requested'] }],
      maxItems: 20,
      refreshMinutes: 10,
    });
    expect(store.state.pinnedBySpace.work?.[0]).toMatchObject({
      sources: [{ sourceId: 'acc-gh-forge' }],
    });
    expect(store.state.lenses['sf-1']?.sections['acc-gl-forge:review-requested']).toBeUndefined();
  });

  test('preserves hideRead (owned by setLensHideRead, not the editor)', () => {
    store.addLens('work', lensNode());
    store.setLensHideRead('sf-1', true);
    store.updateLens('work', 'sf-1', {
      lensKind: 'general',
      icon: 'folder-git-2',
      name: 'Renamed',
      sources: [{ sourceId: 'acc-gl-ex', queries: ['review-requested'] }],
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
      sources: [{ sourceId: 'acc-gl-ex', queries: ['authored'] }],
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
      sources: [{ sourceId: 'acc-rss-news', queries: [] }],
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

  test('setLensFilter sets filter on the lens node', () => {
    store.addLens('work', feedNode());
    store.setLensFilter('feed-1', { entities: ['change', 'ticket'] });
    expect(store.state.pinnedBySpace.work?.[0]).toMatchObject({
      filter: { entities: ['change', 'ticket'] },
    });
  });

  test('setLensFilter with an empty object clears the filter (every axis absent)', () => {
    store.addLens('work', feedNode());
    store.setLensFilter('feed-1', { entities: ['change'] });
    store.setLensFilter('feed-1', {});
    const node = store.state.pinnedBySpace.work?.[0] as Record<string, unknown> | undefined;
    expect(node?.['filter']).toBeUndefined();
  });

  test('setLensFilter persists explicit empty arrays as a real constraint, not a clear', () => {
    // fix-lens-scope-filter-clear-semantics: an axis present as `[]` (e.g. from
    // a picker's Clear action) means "matches nothing on that axis" and must
    // survive persistence — it is NOT equivalent to the axis being absent.
    store.addLens('work', feedNode());
    store.setLensFilter('feed-1', { entities: [], repos: [], projects: [] });
    expect(store.state.pinnedBySpace.work?.[0]).toMatchObject({
      filter: { entities: [], repos: [], projects: [] },
    });
  });

  test('setLensFilter persists a feeds-only filter (feeds counts toward non-empty)', () => {
    store.addLens('work', feedNode());
    store.setLensFilter('feed-1', { feeds: ['The Verge'] });
    expect(store.state.pinnedBySpace.work?.[0]).toMatchObject({ filter: { feeds: ['The Verge'] } });
    // Clearing the only feed persists an explicit `feeds: []` — matches nothing
    // on that axis — rather than emptying the filter back out.
    store.setLensFilter('feed-1', { feeds: [] });
    expect(store.state.pinnedBySpace.work?.[0]).toMatchObject({ filter: { feeds: [] } });
  });

  test('setLensFilter with unknown folderId is a no-op', () => {
    store.addLens('work', feedNode());
    store.setLensFilter('nonexistent', { entities: ['change'] });
    expect(store.state.pinnedBySpace.work?.[0]).not.toMatchObject({ filter: expect.anything() });
  });

  test('setLensArticleLayout sets the layout on the lens node', () => {
    store.addLens('work', feedNode());
    store.setLensArticleLayout('feed-1', 'list');
    expect(store.state.pinnedBySpace.work?.[0]).toMatchObject({ articleLayout: 'list' });
    // …and switching back to grid overwrites (no clear case).
    store.setLensArticleLayout('feed-1', 'grid');
    expect(store.state.pinnedBySpace.work?.[0]).toMatchObject({ articleLayout: 'grid' });
  });

  test('setLensArticleLayout with unknown folderId is a no-op', () => {
    store.addLens('work', feedNode());
    store.setLensArticleLayout('nonexistent', 'list');
    expect(store.state.pinnedBySpace.work?.[0]).not.toMatchObject({
      articleLayout: expect.anything(),
    });
  });

  test('pruneLensReadState drops read ids absent from the live window (18 → 12 live → 6 dropped)', () => {
    const sk = 'acc-rss-news';
    const all = Array.from({ length: 18 }, (_, i) => `${sk}:item-${i}`);
    for (const id of all) store.markLensItemRead('feed-1', id);
    expect(store.state.lensReadState['feed-1']).toHaveLength(18);
    const live = all.slice(0, 12); // the latest fetch only returned 12 of them
    store.pruneLensReadState('feed-1', sk, live);
    expect(store.state.lensReadState['feed-1']).toEqual(live);
    expect(store.state.lensReadState['feed-1']).toHaveLength(12);
  });

  test('pruneLensReadState removes the folder entry once empty', () => {
    const sk = 'acc-rss-news';
    store.markLensItemRead('feed-1', `${sk}:a`);
    store.pruneLensReadState('feed-1', sk, [`${sk}:x`, `${sk}:y`]); // none survive
    expect(store.state.lensReadState['feed-1']).toBeUndefined();
  });

  test('pruneLensReadState leaves OTHER sections read ids intact (multi-section / OPML)', () => {
    const skA = 'acc-rss-news';
    const skB = 'acc-rss-feed';
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
    store.setLensSectionRuntime('sf-1', 'acc-gl-ex', {
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
  const KEY = 'acc-gl-ex';

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
    sources: [{ sourceId: 'acc-rss-feed', queries: [] }],
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
  // A feed `sourceKey` is now a single `sourceId` segment (no host) — this
  // suite also exercises that the next-unread parse recovers it match-first.
  const SK = 'acc-rss-feed';
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
      sources: [{ sourceId: 'acc-gl-ex', queries: ['authored'] }],
    });
    store.bindLensItem('sf-gl', 'acc-gl-ex:authored:mr-1', W, 20, '');
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

describe('two same-host accounts coexist (rekey-lens-sections-by-source-id)', () => {
  beforeEach(() => {
    store.addSource({ id: 'acc-work', provider: 'github', baseUrl: 'https://github.com' });
    store.addSource({ id: 'acc-personal', provider: 'github', baseUrl: 'https://github.com' });
    store.addLens(
      'work',
      lensNode({
        id: 'gh-lens',
        sources: [
          { sourceId: 'acc-work', queries: ['authored'] },
          { sourceId: 'acc-personal', queries: ['authored'] },
        ],
      }),
    );
  });

  test('distinct sourceId section runtimes do not overwrite each other', () => {
    store.setLensSectionRuntime('gh-lens', 'acc-work:authored', {
      state: 'ok',
      items: items('Work MR'),
      fetchedAt: 1,
    });
    store.setLensSectionRuntime('gh-lens', 'acc-personal:authored', {
      state: 'ok',
      items: items('Personal MR'),
      fetchedAt: 2,
    });
    const sections = store.state.lenses['gh-lens']?.sections ?? {};
    expect(Object.keys(sections).sort()).toEqual(['acc-personal:authored', 'acc-work:authored']);
    expect(sections['acc-work:authored']?.items[0]?.title).toBe('Work MR');
    expect(sections['acc-personal:authored']?.items[0]?.title).toBe('Personal MR');
  });

  test('updateLens keeps both same-host sections (neither pruned)', () => {
    store.setLensSectionRuntime('gh-lens', 'acc-work:authored', {
      state: 'ok',
      items: items('Work MR'),
      fetchedAt: 1,
    });
    store.setLensSectionRuntime('gh-lens', 'acc-personal:authored', {
      state: 'ok',
      items: items('Personal MR'),
      fetchedAt: 2,
    });
    store.updateLens('work', 'gh-lens', {
      lensKind: 'general',
      icon: 'folder-git-2',
      name: 'Renamed',
      sources: [
        { sourceId: 'acc-work', queries: ['authored'] },
        { sourceId: 'acc-personal', queries: ['authored'] },
      ],
      maxItems: 20,
      refreshMinutes: 10,
    });
    const sections = store.state.lenses['gh-lens']?.sections ?? {};
    expect(Object.keys(sections).sort()).toEqual(['acc-personal:authored', 'acc-work:authored']);
  });

  test('the two accounts keep distinct read sets', () => {
    store.markLensItemRead('gh-lens', 'acc-work:authored:1');
    store.markLensItemRead('gh-lens', 'acc-personal:authored:1');
    expect(store.state.lensReadState['gh-lens']).toEqual([
      'acc-work:authored:1',
      'acc-personal:authored:1',
    ]);
  });
});
