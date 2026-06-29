import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import type { LensSectionRuntime, PinNode } from '../shared/types';
import type { PendingEvent } from './coordinator';
import { makeCoordinator, sidebar } from './coordinator.test-helpers';
import { LENSES_ALARM_NAME, resetLensesInflight } from './lenses';
import { markPageOpenedTab, resetPageOpenedTabs } from './page-opened-tabs';

type LensNode = Extract<PinNode, { kind: 'lens' }>;

interface LensesChromeStub {
  storage: { local: { get: ReturnType<typeof vi.fn>; set: ReturnType<typeof vi.fn> } };
  alarms: { create: ReturnType<typeof vi.fn>; clear: ReturnType<typeof vi.fn> };
  permissions: {
    contains: ReturnType<typeof vi.fn>;
    request: ReturnType<typeof vi.fn>;
    onAdded: { addListener: ReturnType<typeof vi.fn>; removeListener: ReturnType<typeof vi.fn> };
    onRemoved: { addListener: ReturnType<typeof vi.fn>; removeListener: ReturnType<typeof vi.fn> };
  };
}

let chromeStub: LensesChromeStub;
let fetchMock: ReturnType<typeof vi.fn>;

function installChrome(): void {
  chromeStub = {
    storage: {
      local: {
        get: vi.fn(async () => ({})), // no PATs stored → cookie rung
        set: vi.fn(async () => undefined),
      },
    },
    alarms: { create: vi.fn(), clear: vi.fn(async () => true) },
    // The host-permission gate (least-privilege-permissions D8/D9) runs before
    // every connector dispatch; default to GRANTED so these drain/handler suites
    // exercise the fetch path. (A gate-specific suite lives in smart-folders.test.ts.)
    permissions: {
      contains: vi.fn(async () => true),
      request: vi.fn(async () => true),
      onAdded: { addListener: vi.fn(), removeListener: vi.fn() },
      onRemoved: { addListener: vi.fn(), removeListener: vi.fn() },
    },
  };
  (globalThis as unknown as { chrome: LensesChromeStub }).chrome = chromeStub;
}

function jsonResponse(body: unknown, status = 200): unknown {
  return { status, ok: status >= 200 && status < 300, json: async () => body };
}

/**
 * The connected accounts these suites reference (connector-accounts). Seeded into
 * `store.state.sources` by `makeWithSpace` so lens references resolve and the
 * per-section keys derive from each account's `baseUrl`.
 */
const ACCOUNTS = {
  'gl-ex': { id: 'gl-ex', provider: 'gitlab', baseUrl: 'https://gitlab.example.com' },
  gh: { id: 'gh', provider: 'github', baseUrl: 'https://github.com' },
  gl: { id: 'gl', provider: 'gitlab', baseUrl: 'https://gitlab.com' },
  'rss-news': { id: 'rss-news', provider: 'rss', baseUrl: 'https://news.example.com/rss' },
  // A github account on the gitlab.example.com host — the "source-only edit"
  // repoints a lens from the gitlab account to this github account on the same
  // host.
  'gh-ghe': { id: 'gh-ghe', provider: 'github', baseUrl: 'https://gitlab.example.com' },
  // A Cloud bitbucket account (host bitbucket.org) carrying its workspace
  // (add-bitbucket-connector) — Cloud supports `authored` only.
  'bb-cloud': {
    id: 'bb-cloud',
    provider: 'bitbucket',
    baseUrl: 'https://bitbucket.org',
    workspace: 'acme',
  },
} as const;

/** Default gitlab node (references the seeded `gl-ex` account); overrides merge
 * at the top level of LensNode. */
function lensNode(overrides: Partial<LensNode> = {}): LensNode {
  return {
    kind: 'lens',
    lensKind: 'general',
    id: 'sf-1',
    name: 'Review requests',
    icon: 'folder-git-2',
    sources: [{ sourceId: 'gl-ex', queries: ['review-requested'] }],
    maxItems: 20,
    hideRead: false,
    refreshMinutes: 10,
    ...overrides,
  };
}

/** sourceKey for the default gitlab node. */
const GITLAB_SK = 'gl-ex:review-requested';
/** sourceKey for the default rss feed node. */
const FEED_SK = 'rss-news';

function resultEvent(
  folderId: string,
  sourceKey: string,
  runtime: LensSectionRuntime,
): PendingEvent {
  return {
    source: 'connector',
    kind: 'lenses.result',
    payload: { folderId, sourceKey, runtime },
  };
}

beforeEach(() => {
  installChrome();
  resetLensesInflight();
  resetPageOpenedTabs();
  fetchMock = vi.fn(async () => jsonResponse([]));
  vi.stubGlobal('fetch', fetchMock);
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function makeWithSpace() {
  const made = makeCoordinator();
  made.store.state.spaces.push({ id: 'work', name: 'Work', color: 'blue', icon: 'star' });
  // Seed the connected accounts the suites reference (connector-accounts).
  for (const account of Object.values(ACCOUNTS)) {
    made.store.state.sources[account.id] = { ...account };
  }
  return made;
}

describe('createLens handler', () => {
  test('mints id + icon, normalizes baseUrl, clamps cadence, inserts at the top, acks ok', async () => {
    const { coordinator, store, emitAck } = makeWithSpace();
    store.state.savedTabs['st-1'] = {
      id: 'st-1',
      spaceId: 'work',
      title: 'T',
      originalURL: 'https://x/',
      currentURL: null,
    };
    store.state.pinnedBySpace.work = [{ kind: 'tab', id: 'st-1' }];

    coordinator.enqueue(
      sidebar(
        {
          kind: 'createLens',
          payload: {
            spaceId: 'work',
            sources: [{ sourceId: 'gl-ex', queries: ['review-requested'] }],
            name: 'Review requests',
            maxItems: 20,
            refreshMinutes: 1,
          },
        },
        'c1',
      ),
    );
    await coordinator.idle();

    const created = store.state.pinnedBySpace.work?.[0] as LensNode;
    expect(created).toMatchObject({
      kind: 'lens',
      name: 'Review requests',
      icon: 'folder-git-2', // minted from the referenced gitlab account's provider
      sources: [{ sourceId: 'gl-ex', queries: ['review-requested'] }],
      refreshMinutes: 5, // clamped to the floor
    });
    expect(created.id).toBeTruthy(); // SW-minted (crypto.randomUUID)
    expect(store.state.pinnedBySpace.work?.[1]).toEqual({ kind: 'tab', id: 'st-1' });
    expect(emitAck).toHaveBeenCalledWith(expect.objectContaining({ id: 'c1', result: 'ok' }));
    // The poll alarm is retuned at the (clamped) cadence.
    expect(chromeStub.alarms.create).toHaveBeenCalledWith(LENSES_ALARM_NAME, {
      periodInMinutes: 5,
    });
    // The immediate first fetch ran (me-resolution + list for review-requested).
    expect(fetchMock).toHaveBeenCalled();
  });

  test('create referencing a github account mints the connector icon', async () => {
    const { coordinator, store, emitAck } = makeWithSpace();

    coordinator.enqueue(
      sidebar(
        {
          kind: 'createLens',
          payload: {
            spaceId: 'work',
            sources: [{ sourceId: 'gh', queries: ['authored'] }],
            name: 'My pull requests',
            maxItems: 20,
            refreshMinutes: 10,
          },
        },
        'c1',
      ),
    );
    await coordinator.idle();

    const created = store.state.pinnedBySpace.work?.[0] as LensNode;
    expect(created).toMatchObject({
      kind: 'lens',
      sources: [{ sourceId: 'gh', queries: ['authored'] }],
      icon: 'folder-git-2', // CONNECTORS.github.mintedIcon
    });
    expect(emitAck).toHaveBeenCalledWith(expect.objectContaining({ id: 'c1', result: 'ok' }));
    // The immediate first fetch short-circuited to signed-out (no token in the
    // stub) WITHOUT a network request — token-only auth.
    expect(fetchMock).not.toHaveBeenCalled();
    const folderId = created.id;
    expect(Object.values(store.state.lenses[folderId]?.sections ?? {})[0]).toMatchObject({
      state: 'signed-out',
    });
  });

  test('sources-redesign: createLens derives review from a github source (no kind on the wire)', async () => {
    const { coordinator, store } = makeWithSpace();
    coordinator.enqueue(
      sidebar(
        {
          kind: 'createLens',
          payload: {
            spaceId: 'work',
            sources: [{ sourceId: 'gh', queries: ['review-requested'] }],
            name: 'Reviews',
            maxItems: 20,
            refreshMinutes: 10,
          },
        },
        'c1',
      ),
    );
    await coordinator.idle();
    const created = store.state.pinnedBySpace.work?.[0] as LensNode;
    expect(created.kind).toBe('lens');
    expect(created.lensKind).toBe('review');
  });

  test('sources-redesign: createLens derives general from a feed-only source set', async () => {
    const { coordinator, store } = makeWithSpace();
    coordinator.enqueue(
      sidebar(
        {
          kind: 'createLens',
          payload: {
            spaceId: 'work',
            sources: [{ sourceId: 'rss-news', queries: [] }],
            name: 'News',
            maxItems: 20,
            refreshMinutes: 10,
          },
        },
        'c1',
      ),
    );
    await coordinator.idle();
    const created = store.state.pinnedBySpace.work?.[0] as LensNode;
    expect(created.lensKind).toBe('general');
  });

  test('sources-redesign: createLens derives review from a mixed git+feed source set', async () => {
    const { coordinator, store } = makeWithSpace();
    coordinator.enqueue(
      sidebar(
        {
          kind: 'createLens',
          payload: {
            spaceId: 'work',
            sources: [
              { sourceId: 'gh', queries: ['authored'] },
              { sourceId: 'rss-news', queries: [] },
            ],
            name: 'Backend',
            maxItems: 20,
            refreshMinutes: 10,
          },
        },
        'c1',
      ),
    );
    await coordinator.idle();
    const created = store.state.pinnedBySpace.work?.[0] as LensNode;
    expect(created.lensKind).toBe('review');
  });

  test('an unresolved sourceId rejects with an error ack and adds no node', async () => {
    // baseUrl validation moved to createAccount (connector-accounts); createLens
    // now rejects a reference whose account does not exist.
    const { coordinator, store, emitAck } = makeWithSpace();
    coordinator.enqueue(
      sidebar(
        {
          kind: 'createLens',
          payload: {
            spaceId: 'work',
            sources: [{ sourceId: 'ghost', queries: ['authored'] }],
            name: 'X',
            maxItems: 20,
            refreshMinutes: 10,
          },
        },
        'c1',
      ),
    );
    await coordinator.idle();
    expect(emitAck).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'c1',
        result: { error: expect.stringContaining('unknown sourceId') },
      }),
    );
    expect(store.state.pinnedBySpace.work ?? []).toHaveLength(0);
  });

  test('an unknown spaceId rejects', async () => {
    const { coordinator, emitAck } = makeWithSpace();
    coordinator.enqueue(
      sidebar(
        {
          kind: 'createLens',
          payload: {
            spaceId: 'nope',
            sources: [{ sourceId: 'gl', queries: ['authored'] }],
            name: 'X',
            maxItems: 20,
            refreshMinutes: 10,
          },
        },
        'c1',
      ),
    );
    await coordinator.idle();
    expect(emitAck).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'c1',
        result: { error: expect.stringContaining('unknown spaceId') },
      }),
    );
  });

  test('a Cloud bitbucket reference carrying review-requested is rejected (add-bitbucket-connector D4)', async () => {
    const { coordinator, store, emitAck } = makeWithSpace();
    coordinator.enqueue(
      sidebar(
        {
          kind: 'createLens',
          payload: {
            spaceId: 'work',
            sources: [{ sourceId: 'bb-cloud', queries: ['review-requested'] }],
            name: 'X',
            maxItems: 20,
            refreshMinutes: 10,
          },
        },
        'c1',
      ),
    );
    await coordinator.idle();
    expect(emitAck).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'c1',
        result: { error: expect.stringContaining('review-requested') },
      }),
    );
    expect(store.state.pinnedBySpace.work ?? []).toHaveLength(0);
  });

  test('a Cloud bitbucket reference carrying authored is accepted', async () => {
    const { coordinator, store, emitAck } = makeWithSpace();
    coordinator.enqueue(
      sidebar(
        {
          kind: 'createLens',
          payload: {
            spaceId: 'work',
            sources: [{ sourceId: 'bb-cloud', queries: ['authored'] }],
            name: 'My PRs',
            maxItems: 20,
            refreshMinutes: 10,
          },
        },
        'c1',
      ),
    );
    await coordinator.idle();
    expect(emitAck).toHaveBeenCalledWith(expect.objectContaining({ id: 'c1', result: 'ok' }));
    const created = store.state.pinnedBySpace.work?.[0] as LensNode;
    expect(created).toMatchObject({ lensKind: 'review' });
  });
});

describe('createAccount handler (add-bitbucket-connector)', () => {
  test('a Cloud bitbucket account created without a workspace is rejected, no source added', async () => {
    const { coordinator, store, emitAck } = makeWithSpace();
    coordinator.enqueue(
      sidebar(
        {
          kind: 'createAccount',
          payload: { id: 'bb-new', provider: 'bitbucket', baseUrl: 'https://bitbucket.org' },
        },
        'c1',
      ),
    );
    await coordinator.idle();
    expect(emitAck).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'c1',
        result: { error: expect.stringContaining('workspace') },
      }),
    );
    expect(store.state.sources['bb-new']).toBeUndefined();
  });

  test('a Cloud bitbucket account with a workspace persists it', async () => {
    const { coordinator, store, emitAck } = makeWithSpace();
    coordinator.enqueue(
      sidebar(
        {
          kind: 'createAccount',
          payload: {
            id: 'bb-new',
            provider: 'bitbucket',
            baseUrl: 'https://bitbucket.org',
            workspace: 'acme',
          },
        },
        'c1',
      ),
    );
    await coordinator.idle();
    expect(emitAck).toHaveBeenCalledWith(expect.objectContaining({ id: 'c1', result: 'ok' }));
    expect(store.state.sources['bb-new']).toMatchObject({
      provider: 'bitbucket',
      baseUrl: 'https://bitbucket.org',
      workspace: 'acme',
    });
  });

  test('a self-hosted bitbucket account needs no workspace', async () => {
    const { coordinator, store, emitAck } = makeWithSpace();
    coordinator.enqueue(
      sidebar(
        {
          kind: 'createAccount',
          payload: {
            id: 'bb-dc',
            provider: 'bitbucket',
            baseUrl: 'https://bitbucket.example.com',
          },
        },
        'c1',
      ),
    );
    await coordinator.idle();
    expect(emitAck).toHaveBeenCalledWith(expect.objectContaining({ id: 'c1', result: 'ok' }));
    expect(store.state.sources['bb-dc']).toMatchObject({ provider: 'bitbucket' });
    expect(store.state.sources['bb-dc']?.workspace).toBeUndefined();
  });
});

describe('sources-redesign: mixed-lens Change enrichment gates per section (D8)', () => {
  /** A minimal arrayBuffer-backed feed Response (the rss connector reads
   * arrayBuffer + headers, not json). */
  function feedResponse(xml: string): unknown {
    const buf = new TextEncoder().encode(xml).buffer;
    return { ok: true, status: 200, headers: { get: () => null }, arrayBuffer: async () => buf };
  }

  const FEED_XML = `<?xml version="1.0"?><rss version="2.0"><channel><title>News</title>
    <item><title>A post</title><link>https://news.example.com/p/1</link><guid>p1</guid></item>
    </channel></rss>`;

  /** A review-shaped MR (author/reviewers/branch/diff/draft) so the git section
   * has a `change` bag to populate when the lens derives 'review'. */
  const reviewMr = {
    id: 1,
    iid: 1,
    project_id: 1,
    title: 'MR 1',
    web_url: 'https://gitlab.example.com/g/p/-/merge_requests/1',
    head_pipeline: { status: 'success' },
    author: { username: 'octo' },
    target_branch: 'main',
    updated_at: '2026-06-24T10:00:00Z',
    draft: false,
    reviewers: [{ username: 'alice' }],
    additions: 112,
    deletions: 40,
  };

  test('a mixed git+feed lens derives review; only the git section carries a change bag', async () => {
    const { coordinator, store } = makeWithSpace();
    fetchMock.mockImplementation(async (url: string) => {
      if (url.includes('/api/v4/merge_requests?')) return jsonResponse([reviewMr]);
      if (url.includes('/approvals')) {
        return jsonResponse({ approved_by: [{ user: { username: 'alice' } }] });
      }
      if (new URL(url).hostname === 'news.example.com') return feedResponse(FEED_XML);
      throw new Error(`unrouted: ${url}`);
    });

    coordinator.enqueue(
      sidebar(
        {
          kind: 'createLens',
          payload: {
            spaceId: 'work',
            sources: [
              { sourceId: 'gl-ex', queries: ['authored'] },
              { sourceId: 'rss-news', queries: [] },
            ],
            name: 'Backend',
            maxItems: 20,
            refreshMinutes: 10,
          },
        },
        'c1',
      ),
    );
    await coordinator.idle();

    const created = store.state.pinnedBySpace.work?.[0] as LensNode;
    expect(created.lensKind).toBe('review'); // derived from the git source
    const sections = store.state.lenses[created.id]?.sections ?? {};
    const gitSection = sections['gl-ex:authored'];
    const feedSection = sections[FEED_SK];
    // The git section's item is enriched (enrichment gates on the derived 'review').
    expect(gitSection?.state).toBe('ok');
    expect(gitSection?.items[0]?.change).toMatchObject({ author: 'octo', repo: 'g/p' });
    // The feed section's item carries no change bag — only git sections enrich.
    expect(feedSection?.state).toBe('ok');
    expect(feedSection?.items[0]?.change).toBeUndefined();
  });
});

describe('updateLens handler', () => {
  test('edits in place; a query change triggers an immediate refetch', async () => {
    const { coordinator, store } = makeWithSpace();
    store.state.pinnedBySpace.work = [
      lensNode({ sources: [{ sourceId: 'gl-ex', queries: ['assigned'] }] }),
    ];

    coordinator.enqueue(
      sidebar(
        {
          kind: 'updateLens',
          payload: {
            spaceId: 'work',
            folderId: 'sf-1',
            sources: [{ sourceId: 'gl-ex', queries: ['review-requested'] }],
            name: 'Review requests',
            maxItems: 20,
            refreshMinutes: 30,
          },
        },
        'c1',
      ),
    );
    await coordinator.idle();

    expect(store.state.pinnedBySpace.work?.[0]).toMatchObject({
      sources: [{ queries: ['review-requested'] }],
      refreshMinutes: 30,
    });
    expect(fetchMock).toHaveBeenCalled(); // the immediate refetch
  });

  test('sources-redesign: updateLens re-derives review when a git source is added to a feed lens', async () => {
    const { coordinator, store } = makeWithSpace();
    // Starts as a feed-only general lens.
    store.state.pinnedBySpace.work = [
      lensNode({
        lensKind: 'general',
        icon: 'rss',
        sources: [{ sourceId: 'rss-news', queries: [] }],
      }),
    ];

    coordinator.enqueue(
      sidebar(
        {
          kind: 'updateLens',
          payload: {
            spaceId: 'work',
            folderId: 'sf-1',
            // Add a github account → the kind must flip to 'review'.
            sources: [
              { sourceId: 'rss-news', queries: [] },
              { sourceId: 'gh', queries: ['authored'] },
            ],
            name: 'Backend',
            maxItems: 20,
            refreshMinutes: 10,
          },
        },
        'c1',
      ),
    );
    await coordinator.idle();
    expect((store.state.pinnedBySpace.work?.[0] as LensNode).lensKind).toBe('review');
  });

  test('sources-redesign: updateLens re-derives general when the last git source is removed', async () => {
    const { coordinator, store } = makeWithSpace();
    store.state.pinnedBySpace.work = [
      lensNode({ lensKind: 'review', sources: [{ sourceId: 'gh', queries: ['authored'] }] }),
    ];

    coordinator.enqueue(
      sidebar(
        {
          kind: 'updateLens',
          payload: {
            spaceId: 'work',
            folderId: 'sf-1',
            sources: [{ sourceId: 'rss-news', queries: [] }],
            name: 'News',
            maxItems: 20,
            refreshMinutes: 10,
          },
        },
        'c1',
      ),
    );
    await coordinator.idle();
    expect((store.state.pinnedBySpace.work?.[0] as LensNode).lensKind).toBe('general');
  });

  test('a source-only edit triggers the immediate refetch through the new connector', async () => {
    const { coordinator, store } = makeWithSpace();
    // A self-hosted URL (never the canonical default) so ONLY `source` changes;
    // a token for its host lets the github connector reach the network.
    store.state.pinnedBySpace.work = [
      lensNode({ sources: [{ sourceId: 'gl-ex', queries: ['authored'] }] }),
    ];
    // The token is keyed by the github account's sourceId now (connector-accounts).
    chromeStub.storage.local.get.mockResolvedValue({
      'lunma.connectors': { 'gh-ghe': 'ghp-x' },
    });

    coordinator.enqueue(
      sidebar(
        {
          kind: 'updateLens',
          payload: {
            spaceId: 'work',
            folderId: 'sf-1',
            // Repoint to a github account on the SAME host (gitlab.example.com).
            sources: [{ sourceId: 'gh-ghe', queries: ['authored'] }],
            name: 'Review requests',
            maxItems: 20,
            refreshMinutes: 10,
          },
        },
        'c1',
      ),
    );
    await coordinator.idle();

    expect(store.state.pinnedBySpace.work?.[0]).toMatchObject({
      sources: [{ sourceId: 'gh-ghe' }],
    });
    // The refetch dispatched through the GitHub connector (the GHE API root).
    expect(fetchMock).toHaveBeenCalled();
    expect(fetchMock.mock.calls[0]?.[0]).toContain(
      'https://gitlab.example.com/api/v3/search/issues?',
    );
  });

  test('a name-only change does not refetch', async () => {
    const { coordinator, store } = makeWithSpace();
    store.state.pinnedBySpace.work = [lensNode()];

    coordinator.enqueue(
      sidebar(
        {
          kind: 'updateLens',
          payload: {
            spaceId: 'work',
            folderId: 'sf-1',
            sources: [{ sourceId: 'gl-ex', queries: ['review-requested'] }],
            name: 'Renamed',
            maxItems: 20,
            refreshMinutes: 10,
          },
        },
        'c1',
      ),
    );
    await coordinator.idle();

    expect(store.state.pinnedBySpace.work?.[0]).toMatchObject({ name: 'Renamed' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('an unknown folderId rejects', async () => {
    const { coordinator, emitAck } = makeWithSpace();
    coordinator.enqueue(
      sidebar(
        {
          kind: 'updateLens',
          payload: {
            spaceId: 'work',
            folderId: 'nope',
            sources: [{ sourceId: 'gl', queries: ['authored'] }],
            name: 'X',
            maxItems: 20,
            refreshMinutes: 10,
          },
        },
        'c1',
      ),
    );
    await coordinator.idle();
    expect(emitAck).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'c1',
        result: { error: expect.stringContaining('unknown lens') },
      }),
    );
  });
});

describe('deleteLens handler', () => {
  test('removes the node, drops its runtime, and clears the alarm when it was the last', async () => {
    const { coordinator, store } = makeWithSpace();
    store.state.pinnedBySpace.work = [lensNode()];
    store.state.lenses['sf-1'] = {
      sections: { [GITLAB_SK]: { state: 'ok', items: [], fetchedAt: 1 } },
    };

    coordinator.enqueue(
      sidebar({ kind: 'deleteLens', payload: { spaceId: 'work', folderId: 'sf-1' } }, 'c1'),
    );
    await coordinator.idle();

    expect(store.state.pinnedBySpace.work).toEqual([]);
    expect(store.state.lenses['sf-1']).toBeUndefined();
    expect(chromeStub.alarms.clear).toHaveBeenCalledWith(LENSES_ALARM_NAME);
  });

  test('an unknown folderId rejects', async () => {
    const { coordinator, emitAck } = makeWithSpace();
    coordinator.enqueue(
      sidebar({ kind: 'deleteLens', payload: { spaceId: 'work', folderId: 'nope' } }, 'c1'),
    );
    await coordinator.idle();
    expect(emitAck).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'c1', result: { error: expect.any(String) } }),
    );
  });
});

describe('refreshLens handler', () => {
  // The `authored` filter is a single list fetch (no me-resolution), so one
  // mocked fetch drives the section; its key carries the filter axis.
  const GL_AUTHORED = 'gl-ex:authored';
  const authoredNode = () => lensNode({ sources: [{ sourceId: 'gl-ex', queries: ['authored'] }] });

  test('acks ok BEFORE the fetch resolves; the outcome lands via the runtime slice', async () => {
    const { coordinator, store, emitAck } = makeWithSpace();
    store.state.pinnedBySpace.work = [authoredNode()];
    let resolveFetch: (value: unknown) => void = () => undefined;
    fetchMock.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveFetch = resolve;
      }),
    );

    coordinator.enqueue(
      sidebar({ kind: 'refreshLens', payload: { spaceId: 'work', folderId: 'sf-1' } }, 'c1'),
    );
    // Drain the queue WITHOUT settling side effects: the ack must not wait on
    // the in-flight fetch.
    await vi.waitFor(() => {
      expect(emitAck).toHaveBeenCalledWith(expect.objectContaining({ id: 'c1', result: 'ok' }));
    });
    expect(store.state.lenses['sf-1']?.sections[GL_AUTHORED]?.state).toBe('pending');

    resolveFetch(jsonResponse([{ id: 9, title: 'MR 9', web_url: 'https://x/mr/9' }]));
    await coordinator.idle();
    expect(store.state.lenses['sf-1']?.sections[GL_AUTHORED]?.state).toBe('ok');
    expect(store.state.lenses['sf-1']?.sections[GL_AUTHORED]?.items).toHaveLength(1);
  });

  test('fetch failures never reject the ack — the runtime carries the outcome', async () => {
    const { coordinator, store, emitAck } = makeWithSpace();
    store.state.pinnedBySpace.work = [authoredNode()];
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));

    coordinator.enqueue(
      sidebar({ kind: 'refreshLens', payload: { spaceId: 'work', folderId: 'sf-1' } }, 'c1'),
    );
    await coordinator.idle();

    expect(emitAck).toHaveBeenCalledWith(expect.objectContaining({ id: 'c1', result: 'ok' }));
    expect(store.state.lenses['sf-1']?.sections[GL_AUTHORED]?.state).toBe('error');
  });

  test('an unknown folderId rejects', async () => {
    const { coordinator, emitAck } = makeWithSpace();
    coordinator.enqueue(
      sidebar({ kind: 'refreshLens', payload: { spaceId: 'work', folderId: 'nope' } }, 'c1'),
    );
    await coordinator.idle();
    expect(emitAck).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'c1', result: { error: expect.any(String) } }),
    );
  });
});

// Activation tests (smart-folder-item-bindings) need the tab/window/scripting
// surface on top of the storage/alarms stub `installChrome()` provides.
interface ActivationChromeStub extends LensesChromeStub {
  tabs: {
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
    group: ReturnType<typeof vi.fn>;
  };
  windows: { update: ReturnType<typeof vi.fn> };
  scripting: { executeScript: ReturnType<typeof vi.fn> };
  runtime: {
    getManifest: ReturnType<typeof vi.fn>;
    sendMessage: ReturnType<typeof vi.fn>;
    onMessage: { addListener: () => void; removeListener: () => void };
  };
}

function installActivationChrome(): ActivationChromeStub {
  const stub: ActivationChromeStub = {
    ...chromeStub,
    tabs: {
      create: vi.fn(() =>
        Promise.resolve({
          id: 999,
          windowId: 100,
          active: true,
          title: 'MR 42',
          url: 'https://gitlab.example.com/mr/42',
          status: 'complete',
        } as chrome.tabs.Tab),
      ),
      update: vi.fn(() => Promise.resolve({ id: 7, windowId: 100 } as chrome.tabs.Tab)),
      remove: vi.fn(() => Promise.resolve()),
      group: vi.fn(() => Promise.resolve(55)),
    },
    windows: { update: vi.fn(() => Promise.resolve({ id: 100 } as chrome.windows.Window)) },
    scripting: { executeScript: vi.fn(() => Promise.resolve([])) },
    runtime: {
      getManifest: vi.fn(() => ({
        content_scripts: [
          { js: ['src/launcher/overlay.ts'] },
          { js: ['src/content/tab-boundary.ts'] },
        ],
      })),
      sendMessage: vi.fn(() => Promise.resolve()),
      onMessage: { addListener: () => undefined, removeListener: () => undefined },
    },
  };
  (globalThis as unknown as { chrome: ActivationChromeStub }).chrome = stub;
  return stub;
}

/** A (window 100, Space work) instance + active Space, so the temp classifier
 * has a Temporary list to (not) claim into. */
function seedWindowInstance(store: ReturnType<typeof makeWithSpace>['store']): void {
  store.state.activeSpaceByWindow[100] = 'work';
  store.state.spaceInstancesByWindow[100] = {
    work: { spaceId: 'work', groupId: -1, tempTabIds: [], tempTabTitles: {} },
  };
}

describe('openLensItem handler', () => {
  test('first activation creates + binds + groups in one drain; the tab never lands in temp', async () => {
    const stub = installActivationChrome();
    const { coordinator, store, emitAck } = makeWithSpace();
    seedWindowInstance(store);
    store.state.pinnedBySpace.work = [lensNode()];
    store.state.lenses['sf-1'] = {
      sections: {
        [GITLAB_SK]: {
          state: 'ok',
          items: [{ id: '42', title: 'MR 42', url: 'https://gitlab.example.com/mr/42' }],
          fetchedAt: 1,
        },
      },
    };

    coordinator.enqueue(
      sidebar(
        {
          kind: 'openLensItem',
          payload: { spaceId: 'work', folderId: 'sf-1', itemId: `${GITLAB_SK}:42`, windowId: 100 },
        },
        'c1',
      ),
    );
    await coordinator.idle();

    expect(stub.tabs.create).toHaveBeenCalledWith({
      url: 'https://gitlab.example.com/mr/42',
      windowId: 100,
    });
    // Slot stores { tabId, allowGlob } with the item's page-glob (smart-tab-boundary).
    expect(store.state.lensItemBindings).toEqual({
      'sf-1': {
        [`${GITLAB_SK}:42`]: {
          100: { tabId: 999, allowGlob: 'https://gitlab.example.com/mr/42*' },
        },
      },
    });
    expect(store.state.liveTabsById[999]).toMatchObject({ tabId: 999, active: true });
    expect(stub.tabs.group).toHaveBeenCalled();
    // configureSmartItemBoundary side effect injected the boundary script.
    expect(stub.scripting.executeScript).toHaveBeenCalledWith({
      target: { tabId: 999 },
      files: ['src/content/tab-boundary.ts'],
    });
    expect(emitAck).toHaveBeenCalledWith({ type: 'lunma/command-ack', id: 'c1', result: 'ok' });
    // The bound tab stays out of Temporary even when Chrome's own onCreated
    // round-trips on a later drain — the binding landed first.
    coordinator.enqueue({
      source: 'chrome',
      kind: 'tabs.onCreated',
      payload: { tab: { id: 999, windowId: 100 } as chrome.tabs.Tab },
    });
    await coordinator.idle();
    expect(store.state.spaceInstancesByWindow[100]?.work?.tempTabIds).toEqual([]);
  });

  test('re-activation focuses the bound tab — no create', async () => {
    const stub = installActivationChrome();
    const { coordinator, store, emitAck } = makeWithSpace();
    seedWindowInstance(store);
    store.state.pinnedBySpace.work = [lensNode()];
    // A held row's shape: the item is bound but no longer listed — the focus
    // path needs no URL at all.
    store.state.lensItemBindings['sf-1'] = {
      [`${GITLAB_SK}:42`]: { 100: { tabId: 7, allowGlob: '' } },
    };

    coordinator.enqueue(
      sidebar(
        {
          kind: 'openLensItem',
          payload: { spaceId: 'work', folderId: 'sf-1', itemId: `${GITLAB_SK}:42`, windowId: 100 },
        },
        'c1',
      ),
    );
    await coordinator.idle();

    expect(stub.tabs.update).toHaveBeenCalledWith(7, { active: true });
    expect(stub.windows.update).toHaveBeenCalledWith(100, { focused: true });
    expect(stub.tabs.create).not.toHaveBeenCalled();
    expect(emitAck).toHaveBeenCalledWith({ type: 'lunma/command-ack', id: 'c1', result: 'ok' });
  });

  test("focus acts on THIS window's slot only — another window's binding still opens", async () => {
    const stub = installActivationChrome();
    const { coordinator, store } = makeWithSpace();
    seedWindowInstance(store);
    store.state.pinnedBySpace.work = [lensNode()];
    store.state.lenses['sf-1'] = {
      sections: {
        [GITLAB_SK]: {
          state: 'ok',
          items: [{ id: '42', title: 'MR 42', url: 'https://gitlab.example.com/mr/42' }],
          fetchedAt: 1,
        },
      },
    };
    // Bound in window 200, dormant in window 100 → window 100 takes the create path.
    store.state.lensItemBindings['sf-1'] = {
      [`${GITLAB_SK}:42`]: { 200: { tabId: 7, allowGlob: '' } },
    };

    coordinator.enqueue(
      sidebar(
        {
          kind: 'openLensItem',
          payload: { spaceId: 'work', folderId: 'sf-1', itemId: `${GITLAB_SK}:42`, windowId: 100 },
        },
        'c1',
      ),
    );
    await coordinator.idle();

    expect(stub.tabs.create).toHaveBeenCalled();
    expect(store.state.lensItemBindings['sf-1']?.[`${GITLAB_SK}:42`]).toEqual({
      200: { tabId: 7, allowGlob: '' },
      100: { tabId: 999, allowGlob: 'https://gitlab.example.com/mr/42*' },
    });
  });

  test('an itemId neither bound nor listed rejects', async () => {
    installActivationChrome();
    const { coordinator, store, emitAck } = makeWithSpace();
    store.state.pinnedBySpace.work = [lensNode()];
    store.state.lenses['sf-1'] = {
      sections: { [GITLAB_SK]: { state: 'ok', items: [], fetchedAt: 1 } },
    };

    coordinator.enqueue(
      sidebar(
        {
          kind: 'openLensItem',
          payload: {
            spaceId: 'work',
            folderId: 'sf-1',
            itemId: `${GITLAB_SK}:ghost`,
            windowId: 100,
          },
        },
        'c1',
      ),
    );
    await coordinator.idle();

    expect(emitAck).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'c1', result: { error: expect.stringContaining('ghost') } }),
    );
  });

  test('a cold runtime (SW respawn) fetches the owning section on-demand, then opens', async () => {
    const stub = installActivationChrome();
    const { coordinator, store, emitAck } = makeWithSpace();
    seedWindowInstance(store);
    // An rss lens with a COLD runtime: `lenses` is ephemeral (stripped from
    // persistence), so after the SW idles out + respawns the slice is empty.
    store.state.pinnedBySpace.work = [
      lensNode({ sources: [{ sourceId: 'rss-news', queries: [] }] }),
    ];
    // No `store.state.lenses['sf-1']` is seeded → the runtime is cold.
    const xml = `<?xml version="1.0"?><rss version="2.0"><channel><title>News</title>
      <item><title>A post</title><link>https://news.example.com/p/1</link><guid>p1</guid></item>
      </channel></rss>`;
    const buf = new TextEncoder().encode(xml).buffer;
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => null },
      arrayBuffer: async () => buf,
    });

    coordinator.enqueue(
      sidebar(
        {
          kind: 'openLensItem',
          payload: { spaceId: 'work', folderId: 'sf-1', itemId: `${FEED_SK}:p1`, windowId: 100 },
        },
        'c1',
      ),
    );
    await coordinator.idle();

    // The cold miss fetched the feed on-demand and opened the item (no reject).
    expect(fetchMock).toHaveBeenCalled();
    expect(stub.tabs.create).toHaveBeenCalledWith({
      url: 'https://news.example.com/p/1',
      windowId: 100,
    });
    expect(emitAck).toHaveBeenCalledWith({ type: 'lunma/command-ack', id: 'c1', result: 'ok' });
    // The on-demand result is written back too, so the overview catches up.
    expect(store.state.lenses['sf-1']?.sections[FEED_SK]?.state).toBe('ok');
  });

  test('an unknown folderId rejects', async () => {
    installActivationChrome();
    const { coordinator, emitAck } = makeWithSpace();
    coordinator.enqueue(
      sidebar(
        {
          kind: 'openLensItem',
          payload: { spaceId: 'work', folderId: 'nope', itemId: `${GITLAB_SK}:42`, windowId: 100 },
        },
        'c1',
      ),
    );
    await coordinator.idle();
    expect(emitAck).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'c1', result: { error: expect.any(String) } }),
    );
  });

  test('non-http(s) item URL is dropped — no tab opened, no binding created', async () => {
    const stub = installActivationChrome();
    const { coordinator, store, emitAck } = makeWithSpace();
    seedWindowInstance(store);
    store.state.pinnedBySpace.work = [lensNode()];
    store.state.lenses['sf-1'] = {
      sections: {
        [GITLAB_SK]: {
          state: 'ok',
          items: [{ id: '99', title: 'Settings', url: 'chrome://settings/' }],
          fetchedAt: 1,
        },
      },
    };

    coordinator.enqueue(
      sidebar(
        {
          kind: 'openLensItem',
          payload: { spaceId: 'work', folderId: 'sf-1', itemId: `${GITLAB_SK}:99`, windowId: 100 },
        },
        'c1',
      ),
    );
    await coordinator.idle();

    // Scheme guard drops the item before tabs.create — no binding, no tab.
    expect(stub.tabs.create).not.toHaveBeenCalled();
    expect(store.state.lensItemBindings).toEqual({});
    expect(emitAck).toHaveBeenCalledWith({ type: 'lunma/command-ack', id: 'c1', result: 'ok' });
  });
});

describe('deleteLens demotes bound tabs (smart-folder-item-bindings)', () => {
  test("both bound live tabs demote to the active instance's Temporary; none close", async () => {
    const stub = installActivationChrome();
    const { coordinator, store } = makeWithSpace();
    seedWindowInstance(store);
    store.state.pinnedBySpace.work = [lensNode()];
    store.state.lensItemBindings['sf-1'] = {
      [`${GITLAB_SK}:42`]: { 100: { tabId: 7, allowGlob: '' } },
      [`${GITLAB_SK}:43`]: { 100: { tabId: 9, allowGlob: '' } },
    };
    for (const tabId of [7, 9]) {
      store.state.liveTabsById[tabId] = {
        tabId,
        windowId: 100,
        title: `MR ${tabId}`,
        url: `https://gitlab.example.com/mr/${tabId}`,
        active: false,
        status: 'complete',
      };
    }

    coordinator.enqueue(
      sidebar({ kind: 'deleteLens', payload: { spaceId: 'work', folderId: 'sf-1' } }, 'c1'),
    );
    await coordinator.idle();

    expect(stub.tabs.remove).not.toHaveBeenCalled();
    expect(store.state.lensItemBindings).toEqual({});
    const temp = store.state.spaceInstancesByWindow[100]?.work?.tempTabIds ?? [];
    expect([...temp].sort()).toEqual([7, 9]);
    expect(store.state.pinnedBySpace.work).toEqual([]);
  });

  test('a stale binding (tab already gone) is dropped without a demotion', async () => {
    installActivationChrome();
    const { coordinator, store } = makeWithSpace();
    seedWindowInstance(store);
    store.state.pinnedBySpace.work = [lensNode()];
    // no live record for tabId 7
    store.state.lensItemBindings['sf-1'] = {
      [`${GITLAB_SK}:42`]: { 100: { tabId: 7, allowGlob: '' } },
    };

    coordinator.enqueue(
      sidebar({ kind: 'deleteLens', payload: { spaceId: 'work', folderId: 'sf-1' } }, 'c1'),
    );
    await coordinator.idle();

    expect(store.state.lensItemBindings).toEqual({});
    expect(store.state.spaceInstancesByWindow[100]?.work?.tempTabIds).toEqual([]);
  });
});

describe('lenses.result handler (single-writer)', () => {
  test('a result event writes the runtime via the drain and emits exactly one broadcast', async () => {
    const { coordinator, store, broadcast } = makeWithSpace();
    store.state.pinnedBySpace.work = [lensNode()];

    coordinator.enqueue(
      resultEvent('sf-1', GITLAB_SK, {
        state: 'ok',
        items: [{ id: 'mr-1', title: 'MR', url: 'https://x/mr/1' }],
        fetchedAt: 123,
      }),
    );
    await coordinator.idle();

    expect(store.state.lenses['sf-1']?.sections[GITLAB_SK]).toMatchObject({
      state: 'ok',
      fetchedAt: 123,
    });
    expect(broadcast).toHaveBeenCalledTimes(1);
  });

  test('a result landing after its folder was deleted is dropped', async () => {
    const { coordinator, store, broadcast } = makeWithSpace();
    // No smart node anywhere — the folder was deleted while the fetch flew.
    coordinator.enqueue(
      resultEvent('sf-ghost', GITLAB_SK, { state: 'ok', items: [], fetchedAt: 1 }),
    );
    await coordinator.idle();

    expect(store.state.lenses['sf-ghost']).toBeUndefined();
    expect(broadcast).not.toHaveBeenCalled();
  });

  test('the persisted projection is unchanged by a runtime write (ephemeral-only drain)', async () => {
    const { coordinator, store, persist } = makeWithSpace();
    store.state.pinnedBySpace.work = [lensNode()];

    coordinator.enqueue(resultEvent('sf-1', GITLAB_SK, { state: 'ok', items: [], fetchedAt: 123 }));
    await coordinator.idle();

    // First post-boot drain persists once (signature starts null); the WRITTEN
    // projection must not contain the smartFolders slice.
    expect(persist).toHaveBeenCalledTimes(1);
    const persisted = persist.mock.calls[0]?.[0];
    expect(persisted?.lenses).toBeDefined(); // snapshot carries it…
    const { toPersistable } = await import('../shared/chrome/storage');
    expect(toPersistable(persisted as never)).not.toHaveProperty('lenses'); // …persist strips it
  });
});

// ── feed read-state commands (rss-connector design D3/D6) ───────────────────────

describe('feed read-state handlers', () => {
  function feedNode() {
    return lensNode({
      id: 'feed-1',
      sources: [{ sourceId: 'rss-news', queries: [] }],
      icon: 'rss',
    });
  }

  /** Open feed item `post-1`, returning the made coordinator/store (its tab is
   * id 999, active in window 100). */
  async function openFeedItem() {
    const stub = installActivationChrome();
    const made = makeWithSpace();
    seedWindowInstance(made.store);
    made.store.state.pinnedBySpace.work = [feedNode()];
    made.store.state.lenses['feed-1'] = {
      sections: {
        [FEED_SK]: {
          state: 'ok',
          items: [{ id: 'post-1', title: 'A post', url: 'https://news.example.com/p/1' }],
          fetchedAt: 1,
        },
      },
    };
    made.coordinator.enqueue(
      sidebar(
        {
          kind: 'openLensItem',
          payload: {
            spaceId: 'work',
            folderId: 'feed-1',
            itemId: `${FEED_SK}:post-1`,
            windowId: 100,
          },
        },
        'c1',
      ),
    );
    await made.coordinator.idle();
    expect(stub.tabs.create).toHaveBeenCalled();
    return { ...made, stub };
  }

  test('opening a feed item does NOT mark it read (it stays in the queue while you are on it)', async () => {
    const { store } = await openFeedItem();
    // Bound + active + still unread — the draining queue keeps the entry you
    // just opened until you move on.
    expect(store.state.lensItemBindings['feed-1']?.[`${FEED_SK}:post-1`]?.[100]?.tabId).toBe(999);
    expect(store.state.lensReadState['feed-1']).toBeUndefined();
  });

  test('navigating to another tab drains the entry (marks it read) AND closes its tab', async () => {
    const { coordinator, store, stub } = await openFeedItem();
    // Another tab becomes active in the same window → the entry's tab deactivates.
    coordinator.enqueue({
      source: 'chrome',
      kind: 'tabs.onActivated',
      payload: { activeInfo: { tabId: 555, windowId: 100 } },
    });
    await coordinator.idle();
    expect(store.state.lensReadState['feed-1']).toEqual([`${FEED_SK}:post-1`]);
    // Consume = close: the entry's bound tab (999) is closed (no tab trail).
    expect(stub.tabs.remove).toHaveBeenCalledWith(999);
  });

  test("closing the entry's tab drains it (marks it read)", async () => {
    const { coordinator, store } = await openFeedItem();
    coordinator.enqueue({
      source: 'chrome',
      kind: 'tabs.onRemoved',
      payload: { tabId: 999, info: { windowId: 100, isWindowClosing: false } },
    });
    await coordinator.idle();
    expect(store.state.lensReadState['feed-1']).toEqual([`${FEED_SK}:post-1`]);
  });

  // Auto-advance suppression when the folder page is open (smart-folder-page):
  // reading from the page → closing returns to the page, not the next item.
  function seedTwoItemFeed(): {
    coordinator: ReturnType<typeof makeWithSpace>['coordinator'];
    store: ReturnType<typeof makeWithSpace>['store'];
    stub: ActivationChromeStub;
  } {
    const stub = installActivationChrome();
    (stub.runtime as unknown as { getURL: (p: string) => string }).getURL = (p) =>
      `chrome-extension://abc/${p}`;
    const { coordinator, store } = makeWithSpace();
    seedWindowInstance(store);
    store.state.pinnedBySpace.work = [feedNode()];
    store.state.lenses['feed-1'] = {
      sections: {
        [FEED_SK]: {
          state: 'ok',
          items: [
            { id: 'post-1', title: 'A post', url: 'https://news.example.com/p/1' },
            { id: 'post-2', title: 'Next post', url: 'https://news.example.com/p/2' },
          ],
          fetchedAt: 1,
        },
      },
    };
    store.bindLensItem('feed-1', `${FEED_SK}:post-1`, 100, 999, '');
    stub.tabs.create.mockClear();
    return { coordinator, store, stub };
  }

  test('closing a SIDEBAR-opened unread feed item auto-advances', async () => {
    const { coordinator, stub } = seedTwoItemFeed(); // post-1 bound, not page-marked
    coordinator.enqueue({
      source: 'chrome',
      kind: 'tabs.onRemoved',
      payload: { tabId: 999, info: { windowId: 100, isWindowClosing: false } },
    });
    await coordinator.idle();
    // The next unread item (post-2) opens in a new tab.
    expect(stub.tabs.create).toHaveBeenCalledWith({
      url: 'https://news.example.com/p/2',
      windowId: 100,
    });
  });

  test('closing a PAGE-opened unread feed item does NOT auto-advance', async () => {
    const { coordinator, stub } = seedTwoItemFeed();
    // The item's tab was opened from the folder page — closing returns there,
    // even with the sidebar open (the regression this guards against).
    markPageOpenedTab(999);
    coordinator.enqueue({
      source: 'chrome',
      kind: 'tabs.onRemoved',
      payload: { tabId: 999, info: { windowId: 100, isWindowClosing: false } },
    });
    await coordinator.idle();
    expect(stub.tabs.create).not.toHaveBeenCalled();
  });

  test('markAllLensItemsRead marks every currently-listed item read', async () => {
    installActivationChrome();
    const { coordinator, store, emitAck } = makeWithSpace();
    store.state.pinnedBySpace.work = [feedNode()];
    store.state.lenses['feed-1'] = {
      sections: {
        [FEED_SK]: {
          state: 'ok',
          items: [
            { id: 'a', title: 'A', url: 'https://x/a' },
            { id: 'b', title: 'B', url: 'https://x/b' },
          ],
          fetchedAt: 1,
        },
      },
    };

    coordinator.enqueue(
      sidebar(
        { kind: 'markAllLensItemsRead', payload: { spaceId: 'work', folderId: 'feed-1' } },
        'c1',
      ),
    );
    await coordinator.idle();

    expect(store.state.lensReadState['feed-1']?.sort()).toEqual([`${FEED_SK}:a`, `${FEED_SK}:b`]);
    expect(emitAck).toHaveBeenCalledWith({ type: 'lunma/command-ack', id: 'c1', result: 'ok' });
  });

  test('markLensItemUnread removes the id from the read set (the page toggle)', async () => {
    installActivationChrome();
    const { coordinator, store, emitAck } = makeWithSpace();
    store.state.pinnedBySpace.work = [feedNode()];
    store.state.lensReadState['feed-1'] = [`${FEED_SK}:a`, `${FEED_SK}:b`];

    coordinator.enqueue(
      sidebar(
        { kind: 'markLensItemUnread', payload: { folderId: 'feed-1', itemId: `${FEED_SK}:a` } },
        'c1',
      ),
    );
    await coordinator.idle();

    expect(store.state.lensReadState['feed-1']).toEqual([`${FEED_SK}:b`]);
    expect(emitAck).toHaveBeenCalledWith({ type: 'lunma/command-ack', id: 'c1', result: 'ok' });
  });

  test('setLensHideRead persists the preference without a refetch', async () => {
    installActivationChrome();
    const { coordinator, store, emitAck } = makeWithSpace();
    store.state.pinnedBySpace.work = [feedNode()];
    store.state.lenses['feed-1'] = {
      sections: { [FEED_SK]: { state: 'ok', items: [], fetchedAt: 1 } },
    };

    coordinator.enqueue(
      sidebar(
        {
          kind: 'setLensHideRead',
          payload: { spaceId: 'work', folderId: 'feed-1', hideRead: true },
        },
        'c1',
      ),
    );
    await coordinator.idle();

    expect(store.state.pinnedBySpace.work?.[0]).toMatchObject({ hideRead: true });
    // No refetch — hideRead is a display pref; the fetch window is unchanged.
    expect(store.state.lenses['feed-1']?.sections[FEED_SK]?.fetchedAt).toBe(1);
    expect(emitAck).toHaveBeenCalledWith({ type: 'lunma/command-ack', id: 'c1', result: 'ok' });
  });

  test('setLensFilter persists the filter and acks without a refetch', async () => {
    installActivationChrome();
    const { coordinator, store, emitAck } = makeWithSpace();
    store.state.pinnedBySpace.work = [feedNode()];
    store.state.lenses['feed-1'] = {
      sections: { [FEED_SK]: { state: 'ok', items: [], fetchedAt: 5 } },
    };

    coordinator.enqueue(
      sidebar(
        {
          kind: 'setLensFilter',
          payload: { spaceId: 'work', folderId: 'feed-1', filter: { entities: ['change'] } },
        },
        'c1',
      ),
    );
    await coordinator.idle();

    expect(store.state.pinnedBySpace.work?.[0]).toMatchObject({ filter: { entities: ['change'] } });
    expect(store.state.lenses['feed-1']?.sections[FEED_SK]?.fetchedAt).toBe(5);
    expect(emitAck).toHaveBeenCalledWith({ type: 'lunma/command-ack', id: 'c1', result: 'ok' });
  });

  test('setLensFilter with empty filter clears the stored filter', async () => {
    installActivationChrome();
    const { coordinator, store, emitAck } = makeWithSpace();
    const node = feedNode();
    (node as Record<string, unknown>).filter = { entities: ['change'] };
    store.state.pinnedBySpace.work = [node];

    coordinator.enqueue(
      sidebar(
        {
          kind: 'setLensFilter',
          payload: { spaceId: 'work', folderId: 'feed-1', filter: {} },
        },
        'c2',
      ),
    );
    await coordinator.idle();

    const stored = store.state.pinnedBySpace.work?.[0] as Record<string, unknown> | undefined;
    expect(stored?.['filter']).toBeUndefined();
    expect(emitAck).toHaveBeenCalledWith({ type: 'lunma/command-ack', id: 'c2', result: 'ok' });
  });

  test('setLensFilter with unknown folderId is a no-op', async () => {
    installActivationChrome();
    const { coordinator, store, emitAck } = makeWithSpace();
    store.state.pinnedBySpace.work = [feedNode()];
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    coordinator.enqueue(
      sidebar(
        {
          kind: 'setLensFilter',
          payload: {
            spaceId: 'work',
            folderId: 'does-not-exist',
            filter: { entities: ['change'] },
          },
        },
        'c3',
      ),
    );
    await coordinator.idle();

    expect(store.state.pinnedBySpace.work?.[0]).not.toMatchObject({ filter: expect.anything() });
    expect(emitAck).toHaveBeenCalledWith({ type: 'lunma/command-ack', id: 'c3', result: 'ok' });
  });

  test('openLensListing opens the feed listing URL in a tab', async () => {
    const stub = installActivationChrome();
    const { coordinator, store, emitAck } = makeWithSpace();
    store.state.pinnedBySpace.work = [feedNode()];

    coordinator.enqueue(
      sidebar(
        {
          kind: 'openLensListing',
          payload: { spaceId: 'work', folderId: 'feed-1', windowId: 100 },
        },
        'c1',
      ),
    );
    await coordinator.idle();

    // No channel link cached (no fetch), so the listing falls back to the feed URL.
    expect(stub.tabs.create).toHaveBeenCalledWith({
      url: 'https://news.example.com/rss',
      windowId: 100,
    });
    expect(emitAck).toHaveBeenCalledWith({ type: 'lunma/command-ack', id: 'c1', result: 'ok' });
  });
});

describe('openLensPage handler (smart-folder-page)', () => {
  const PAGE_BASE = 'chrome-extension://abc/src/launcher/lenspage/index.html';

  /** Extend the activation stub with the page handler's extra Chrome surface:
   * `runtime.getURL` (the page URL) and `tabs.query` (the dedupe lookup). */
  function installPageChrome(openTabs: chrome.tabs.Tab[]): ActivationChromeStub {
    const stub = installActivationChrome();
    (stub.tabs as unknown as { query: ReturnType<typeof vi.fn> }).query = vi.fn(
      async () => openTabs,
    );
    (stub.runtime as unknown as { getURL: (p: string) => string }).getURL = (p) =>
      `chrome-extension://abc/${p}`;
    return stub;
  }

  function dispatchOpenPage(coordinator: ReturnType<typeof makeWithSpace>['coordinator']): void {
    coordinator.enqueue(
      sidebar(
        {
          kind: 'openLensPage',
          payload: { spaceId: 'work', folderId: 'sf-1', windowId: 100 },
        },
        'c1',
      ),
    );
  }

  test('first open creates the page tab carrying ?folderId and groups it', async () => {
    const stub = installPageChrome([]); // no existing page tab
    const { coordinator, store, emitAck } = makeWithSpace();
    seedWindowInstance(store);
    store.state.pinnedBySpace.work = [lensNode()];

    dispatchOpenPage(coordinator);
    await coordinator.idle();

    expect(stub.tabs.create).toHaveBeenCalledWith({
      url: `${PAGE_BASE}?folderId=sf-1`,
      windowId: 100,
    });
    expect(stub.tabs.group).toHaveBeenCalled(); // joined the Space's Chrome group
    // Pinned non-discardable so Chrome's Memory Saver won't reload it on return.
    expect(stub.tabs.update).toHaveBeenCalledWith(expect.any(Number), { autoDiscardable: false });
    expect(emitAck).toHaveBeenCalledWith({ type: 'lunma/command-ack', id: 'c1', result: 'ok' });
  });

  test('reopen focuses the existing page tab — no duplicate, no persisted binding', async () => {
    // The open tab IS the registry (no smartItemBindings, restart-safe): a query
    // match focuses it.
    const existing = { id: 7, windowId: 100, url: `${PAGE_BASE}?folderId=sf-1` } as chrome.tabs.Tab;
    const stub = installPageChrome([existing]);
    const { coordinator, store, emitAck } = makeWithSpace();
    seedWindowInstance(store);
    store.state.pinnedBySpace.work = [lensNode()];

    dispatchOpenPage(coordinator);
    await coordinator.idle();

    expect(stub.tabs.update).toHaveBeenCalledWith(7, { active: true, autoDiscardable: false });
    expect(stub.windows.update).toHaveBeenCalledWith(100, { focused: true });
    expect(stub.tabs.create).not.toHaveBeenCalled();
    expect(store.state.lensItemBindings).toEqual({}); // nothing persisted for the page tab
    expect(emitAck).toHaveBeenCalledWith({ type: 'lunma/command-ack', id: 'c1', result: 'ok' });
  });

  test('the match ignores extra query params (path + folderId only)', async () => {
    const existing = {
      id: 8,
      windowId: 100,
      url: `${PAGE_BASE}?folderId=sf-1&theme=dark`,
    } as chrome.tabs.Tab;
    const stub = installPageChrome([existing]);
    const { coordinator, store } = makeWithSpace();
    seedWindowInstance(store);
    store.state.pinnedBySpace.work = [lensNode()];

    dispatchOpenPage(coordinator);
    await coordinator.idle();

    expect(stub.tabs.update).toHaveBeenCalledWith(8, { active: true, autoDiscardable: false });
    expect(stub.tabs.create).not.toHaveBeenCalled();
  });

  test("another folder's open page is not reused (folderId must match)", async () => {
    const otherFolderPage = {
      id: 9,
      windowId: 100,
      url: `${PAGE_BASE}?folderId=other`,
    } as chrome.tabs.Tab;
    const stub = installPageChrome([otherFolderPage]);
    const { coordinator, store } = makeWithSpace();
    seedWindowInstance(store);
    store.state.pinnedBySpace.work = [lensNode()];

    dispatchOpenPage(coordinator);
    await coordinator.idle();

    expect(stub.tabs.create).toHaveBeenCalledWith({
      url: `${PAGE_BASE}?folderId=sf-1`,
      windowId: 100,
    });
    // Created fresh + pinned non-discardable; the other folder's page is not focused.
    expect(stub.tabs.update).toHaveBeenCalledWith(expect.any(Number), { autoDiscardable: false });
  });

  test('a folder-page tab is NOT adopted into the Temporary list (managed view)', async () => {
    installPageChrome([]);
    const { coordinator, store } = makeWithSpace();
    seedWindowInstance(store);

    coordinator.enqueue({
      source: 'chrome',
      kind: 'tabs.onCreated',
      payload: {
        tab: {
          id: 888,
          windowId: 100,
          url: `${PAGE_BASE}?folderId=sf-1`,
          active: false,
          status: 'complete',
        } as chrome.tabs.Tab,
      },
    });
    await coordinator.idle();

    // Like the home tab, the page is a Lunma-managed view — never a Temporary tab.
    expect(store.state.spaceInstancesByWindow[100]?.work?.tempTabIds ?? []).not.toContain(888);
  });
});
