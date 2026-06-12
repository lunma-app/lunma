import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import type { PinNode, SmartFolderRuntime } from '../shared/types';
import type { PendingEvent } from './coordinator';
import { makeCoordinator, sidebar } from './coordinator.test-helpers';
import { resetSmartFoldersInflight, SMART_FOLDERS_ALARM_NAME } from './smart-folders';

type SmartNode = Extract<PinNode, { kind: 'smart' }>;

interface SmartFoldersChromeStub {
  storage: { local: { get: ReturnType<typeof vi.fn>; set: ReturnType<typeof vi.fn> } };
  alarms: { create: ReturnType<typeof vi.fn>; clear: ReturnType<typeof vi.fn> };
}

let chromeStub: SmartFoldersChromeStub;
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
  };
  (globalThis as unknown as { chrome: SmartFoldersChromeStub }).chrome = chromeStub;
}

function jsonResponse(body: unknown, status = 200): unknown {
  return { status, ok: status >= 200 && status < 300, json: async () => body };
}

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

function resultEvent(folderId: string, runtime: SmartFolderRuntime): PendingEvent {
  return { source: 'connector', kind: 'smartFolders.result', payload: { folderId, runtime } };
}

beforeEach(() => {
  installChrome();
  resetSmartFoldersInflight();
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
  return made;
}

describe('createSmartFolder handler', () => {
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
          kind: 'createSmartFolder',
          payload: {
            spaceId: 'work',
            source: 'gitlab',
            name: 'Review requests',
            baseUrl: 'https://gitlab.example.com/',
            query: 'review-requested',
            refreshMinutes: 1,
          },
        },
        'c1',
      ),
    );
    await coordinator.idle();

    const created = store.state.pinnedBySpace.work?.[0] as SmartNode;
    expect(created).toMatchObject({
      kind: 'smart',
      name: 'Review requests',
      icon: 'folder-git-2',
      source: 'gitlab',
      baseUrl: 'https://gitlab.example.com', // trailing slash stripped
      query: 'review-requested',
      refreshMinutes: 5, // clamped to the floor
    });
    expect(created.id).toBeTruthy(); // SW-minted (crypto.randomUUID)
    expect(store.state.pinnedBySpace.work?.[1]).toEqual({ kind: 'tab', id: 'st-1' });
    expect(emitAck).toHaveBeenCalledWith(expect.objectContaining({ id: 'c1', result: 'ok' }));
    // The poll alarm is retuned at the (clamped) cadence.
    expect(chromeStub.alarms.create).toHaveBeenCalledWith(SMART_FOLDERS_ALARM_NAME, {
      periodInMinutes: 5,
    });
    // The immediate first fetch ran (me-resolution + list for review-requested).
    expect(fetchMock).toHaveBeenCalled();
  });

  test('create with source github mints the connector icon and the node carries the source', async () => {
    const { coordinator, store, emitAck } = makeWithSpace();

    coordinator.enqueue(
      sidebar(
        {
          kind: 'createSmartFolder',
          payload: {
            spaceId: 'work',
            source: 'github',
            name: 'My pull requests',
            baseUrl: 'https://github.com/',
            query: 'authored',
            refreshMinutes: 10,
          },
        },
        'c1',
      ),
    );
    await coordinator.idle();

    expect(store.state.pinnedBySpace.work?.[0]).toMatchObject({
      kind: 'smart',
      source: 'github',
      icon: 'folder-git-2', // CONNECTORS.github.mintedIcon
      baseUrl: 'https://github.com',
      query: 'authored',
    });
    expect(emitAck).toHaveBeenCalledWith(expect.objectContaining({ id: 'c1', result: 'ok' }));
    // The immediate first fetch short-circuited to signed-out (no token in the
    // stub) WITHOUT a network request — token-only auth.
    expect(fetchMock).not.toHaveBeenCalled();
    expect(
      store.state.smartFolders[(store.state.pinnedBySpace.work?.[0] as SmartNode).id],
    ).toMatchObject({ state: 'signed-out' });
  });

  test('an invalid baseUrl rejects with an error ack and adds no node', async () => {
    const { coordinator, store, emitAck } = makeWithSpace();
    coordinator.enqueue(
      sidebar(
        {
          kind: 'createSmartFolder',
          payload: {
            spaceId: 'work',
            source: 'gitlab',
            name: 'X',
            baseUrl: 'not-a-url',
            query: 'authored',
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
        result: { error: expect.stringContaining('invalid base URL') },
      }),
    );
    expect(store.state.pinnedBySpace.work ?? []).toHaveLength(0);
  });

  test('an unknown spaceId rejects', async () => {
    const { coordinator, emitAck } = makeWithSpace();
    coordinator.enqueue(
      sidebar(
        {
          kind: 'createSmartFolder',
          payload: {
            spaceId: 'nope',
            source: 'gitlab',
            name: 'X',
            baseUrl: 'https://gitlab.com',
            query: 'authored',
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
});

describe('updateSmartFolder handler', () => {
  test('edits in place; a query change triggers an immediate refetch', async () => {
    const { coordinator, store } = makeWithSpace();
    store.state.pinnedBySpace.work = [smartNode({ query: 'assigned' })];

    coordinator.enqueue(
      sidebar(
        {
          kind: 'updateSmartFolder',
          payload: {
            spaceId: 'work',
            folderId: 'sf-1',
            source: 'gitlab',
            name: 'Review requests',
            baseUrl: 'https://gitlab.example.com',
            query: 'review-requested',
            refreshMinutes: 30,
          },
        },
        'c1',
      ),
    );
    await coordinator.idle();

    expect(store.state.pinnedBySpace.work?.[0]).toMatchObject({
      query: 'review-requested',
      refreshMinutes: 30,
    });
    expect(fetchMock).toHaveBeenCalled(); // the immediate refetch
  });

  test('a source-only edit triggers the immediate refetch through the new connector', async () => {
    const { coordinator, store } = makeWithSpace();
    // A self-hosted URL (never the canonical default) so ONLY `source` changes;
    // a token for its host lets the github connector reach the network.
    store.state.pinnedBySpace.work = [smartNode({ query: 'authored' })];
    chromeStub.storage.local.get.mockResolvedValue({
      'lunma.connectors': { 'gitlab.example.com': 'ghp-x' },
    });

    coordinator.enqueue(
      sidebar(
        {
          kind: 'updateSmartFolder',
          payload: {
            spaceId: 'work',
            folderId: 'sf-1',
            source: 'github',
            name: 'Review requests',
            baseUrl: 'https://gitlab.example.com',
            query: 'authored',
            refreshMinutes: 10,
          },
        },
        'c1',
      ),
    );
    await coordinator.idle();

    expect(store.state.pinnedBySpace.work?.[0]).toMatchObject({ source: 'github' });
    // The refetch dispatched through the GitHub connector (the GHE API root).
    expect(fetchMock).toHaveBeenCalled();
    expect(fetchMock.mock.calls[0]?.[0]).toContain(
      'https://gitlab.example.com/api/v3/search/issues?',
    );
  });

  test('a name-only change does not refetch', async () => {
    const { coordinator, store } = makeWithSpace();
    store.state.pinnedBySpace.work = [smartNode()];

    coordinator.enqueue(
      sidebar(
        {
          kind: 'updateSmartFolder',
          payload: {
            spaceId: 'work',
            folderId: 'sf-1',
            source: 'gitlab',
            name: 'Renamed',
            baseUrl: 'https://gitlab.example.com',
            query: 'review-requested',
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
          kind: 'updateSmartFolder',
          payload: {
            spaceId: 'work',
            folderId: 'nope',
            source: 'gitlab',
            name: 'X',
            baseUrl: 'https://gitlab.com',
            query: 'authored',
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
        result: { error: expect.stringContaining('unknown smart folder') },
      }),
    );
  });
});

describe('deleteSmartFolder handler', () => {
  test('removes the node, drops its runtime, and clears the alarm when it was the last', async () => {
    const { coordinator, store } = makeWithSpace();
    store.state.pinnedBySpace.work = [smartNode()];
    store.state.smartFolders['sf-1'] = { state: 'ok', items: [], fetchedAt: 1 };

    coordinator.enqueue(
      sidebar({ kind: 'deleteSmartFolder', payload: { spaceId: 'work', folderId: 'sf-1' } }, 'c1'),
    );
    await coordinator.idle();

    expect(store.state.pinnedBySpace.work).toEqual([]);
    expect(store.state.smartFolders['sf-1']).toBeUndefined();
    expect(chromeStub.alarms.clear).toHaveBeenCalledWith(SMART_FOLDERS_ALARM_NAME);
  });

  test('an unknown folderId rejects', async () => {
    const { coordinator, emitAck } = makeWithSpace();
    coordinator.enqueue(
      sidebar({ kind: 'deleteSmartFolder', payload: { spaceId: 'work', folderId: 'nope' } }, 'c1'),
    );
    await coordinator.idle();
    expect(emitAck).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'c1', result: { error: expect.any(String) } }),
    );
  });
});

describe('refreshSmartFolder handler', () => {
  test('acks ok BEFORE the fetch resolves; the outcome lands via the runtime slice', async () => {
    const { coordinator, store, emitAck } = makeWithSpace();
    store.state.pinnedBySpace.work = [smartNode({ query: 'authored' })];
    let resolveFetch: (value: unknown) => void = () => undefined;
    fetchMock.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveFetch = resolve;
      }),
    );

    coordinator.enqueue(
      sidebar({ kind: 'refreshSmartFolder', payload: { spaceId: 'work', folderId: 'sf-1' } }, 'c1'),
    );
    // Drain the queue WITHOUT settling side effects: the ack must not wait on
    // the in-flight fetch.
    await vi.waitFor(() => {
      expect(emitAck).toHaveBeenCalledWith(expect.objectContaining({ id: 'c1', result: 'ok' }));
    });
    expect(store.state.smartFolders['sf-1']?.state).toBe('pending');

    resolveFetch(jsonResponse([{ id: 9, title: 'MR 9', web_url: 'https://x/mr/9' }]));
    await coordinator.idle();
    expect(store.state.smartFolders['sf-1']?.state).toBe('ok');
    expect(store.state.smartFolders['sf-1']?.items).toHaveLength(1);
  });

  test('fetch failures never reject the ack — the runtime carries the outcome', async () => {
    const { coordinator, store, emitAck } = makeWithSpace();
    store.state.pinnedBySpace.work = [smartNode({ query: 'authored' })];
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));

    coordinator.enqueue(
      sidebar({ kind: 'refreshSmartFolder', payload: { spaceId: 'work', folderId: 'sf-1' } }, 'c1'),
    );
    await coordinator.idle();

    expect(emitAck).toHaveBeenCalledWith(expect.objectContaining({ id: 'c1', result: 'ok' }));
    expect(store.state.smartFolders['sf-1']?.state).toBe('error');
  });

  test('an unknown folderId rejects', async () => {
    const { coordinator, emitAck } = makeWithSpace();
    coordinator.enqueue(
      sidebar({ kind: 'refreshSmartFolder', payload: { spaceId: 'work', folderId: 'nope' } }, 'c1'),
    );
    await coordinator.idle();
    expect(emitAck).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'c1', result: { error: expect.any(String) } }),
    );
  });
});

describe('smartFolders.result handler (single-writer)', () => {
  test('a result event writes the runtime via the drain and emits exactly one broadcast', async () => {
    const { coordinator, store, broadcast } = makeWithSpace();
    store.state.pinnedBySpace.work = [smartNode()];

    coordinator.enqueue(
      resultEvent('sf-1', {
        state: 'ok',
        items: [{ id: 'mr-1', title: 'MR', url: 'https://x/mr/1' }],
        fetchedAt: 123,
      }),
    );
    await coordinator.idle();

    expect(store.state.smartFolders['sf-1']).toMatchObject({ state: 'ok', fetchedAt: 123 });
    expect(broadcast).toHaveBeenCalledTimes(1);
  });

  test('a result landing after its folder was deleted is dropped', async () => {
    const { coordinator, store, broadcast } = makeWithSpace();
    // No smart node anywhere — the folder was deleted while the fetch flew.
    coordinator.enqueue(resultEvent('sf-ghost', { state: 'ok', items: [], fetchedAt: 1 }));
    await coordinator.idle();

    expect(store.state.smartFolders['sf-ghost']).toBeUndefined();
    expect(broadcast).not.toHaveBeenCalled();
  });

  test('the persisted projection is unchanged by a runtime write (ephemeral-only drain)', async () => {
    const { coordinator, store, persist } = makeWithSpace();
    store.state.pinnedBySpace.work = [smartNode()];

    coordinator.enqueue(resultEvent('sf-1', { state: 'ok', items: [], fetchedAt: 123 }));
    await coordinator.idle();

    // First post-boot drain persists once (signature starts null); the WRITTEN
    // projection must not contain the smartFolders slice.
    expect(persist).toHaveBeenCalledTimes(1);
    const persisted = persist.mock.calls[0]?.[0];
    expect(persisted?.smartFolders).toBeDefined(); // snapshot carries it…
    const { toPersistable } = await import('../shared/chrome/storage');
    expect(toPersistable(persisted as never)).not.toHaveProperty('smartFolders'); // …persist strips it
  });
});
