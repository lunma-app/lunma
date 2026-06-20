import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import type { PinNode, SmartFolderRuntime } from '../shared/types';
import type { PendingEvent } from './coordinator';
import { makeCoordinator, sidebar } from './coordinator.test-helpers';
import { resetSmartFoldersInflight, SMART_FOLDERS_ALARM_NAME } from './smart-folders';

type SmartNode = Extract<PinNode, { kind: 'smart' }>;

interface SmartFoldersChromeStub {
  storage: { local: { get: ReturnType<typeof vi.fn>; set: ReturnType<typeof vi.fn> } };
  alarms: { create: ReturnType<typeof vi.fn>; clear: ReturnType<typeof vi.fn> };
  permissions: {
    contains: ReturnType<typeof vi.fn>;
    request: ReturnType<typeof vi.fn>;
    onAdded: { addListener: ReturnType<typeof vi.fn>; removeListener: ReturnType<typeof vi.fn> };
    onRemoved: { addListener: ReturnType<typeof vi.fn>; removeListener: ReturnType<typeof vi.fn> };
  };
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
    maxItems: 20,
    hideRead: false,
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
            maxItems: 20,
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
            maxItems: 20,
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
            maxItems: 20,
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
            maxItems: 20,
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
          kind: 'updateSmartFolder',
          payload: {
            spaceId: 'work',
            folderId: 'nope',
            source: 'gitlab',
            name: 'X',
            baseUrl: 'https://gitlab.com',
            query: 'authored',
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

// Activation tests (smart-folder-item-bindings) need the tab/window/scripting
// surface on top of the storage/alarms stub `installChrome()` provides.
interface ActivationChromeStub extends SmartFoldersChromeStub {
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

describe('openSmartItem handler', () => {
  test('first activation creates + binds + groups in one drain; the tab never lands in temp', async () => {
    const stub = installActivationChrome();
    const { coordinator, store, emitAck } = makeWithSpace();
    seedWindowInstance(store);
    store.state.pinnedBySpace.work = [smartNode()];
    store.state.smartFolders['sf-1'] = {
      state: 'ok',
      items: [{ id: '42', title: 'MR 42', url: 'https://gitlab.example.com/mr/42' }],
      fetchedAt: 1,
    };

    coordinator.enqueue(
      sidebar(
        {
          kind: 'openSmartItem',
          payload: { spaceId: 'work', folderId: 'sf-1', itemId: '42', windowId: 100 },
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
    expect(store.state.smartItemBindings).toEqual({
      'sf-1': { '42': { 100: { tabId: 999, allowGlob: 'https://gitlab.example.com/mr/42*' } } },
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
    store.state.pinnedBySpace.work = [smartNode()];
    // A held row's shape: the item is bound but no longer listed — the focus
    // path needs no URL at all.
    store.state.smartItemBindings['sf-1'] = { '42': { 100: { tabId: 7, allowGlob: '' } } };

    coordinator.enqueue(
      sidebar(
        {
          kind: 'openSmartItem',
          payload: { spaceId: 'work', folderId: 'sf-1', itemId: '42', windowId: 100 },
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
    store.state.pinnedBySpace.work = [smartNode()];
    store.state.smartFolders['sf-1'] = {
      state: 'ok',
      items: [{ id: '42', title: 'MR 42', url: 'https://gitlab.example.com/mr/42' }],
      fetchedAt: 1,
    };
    // Bound in window 200, dormant in window 100 → window 100 takes the create path.
    store.state.smartItemBindings['sf-1'] = { '42': { 200: { tabId: 7, allowGlob: '' } } };

    coordinator.enqueue(
      sidebar(
        {
          kind: 'openSmartItem',
          payload: { spaceId: 'work', folderId: 'sf-1', itemId: '42', windowId: 100 },
        },
        'c1',
      ),
    );
    await coordinator.idle();

    expect(stub.tabs.create).toHaveBeenCalled();
    expect(store.state.smartItemBindings['sf-1']?.['42']).toEqual({
      200: { tabId: 7, allowGlob: '' },
      100: { tabId: 999, allowGlob: 'https://gitlab.example.com/mr/42*' },
    });
  });

  test('an itemId neither bound nor listed rejects', async () => {
    installActivationChrome();
    const { coordinator, store, emitAck } = makeWithSpace();
    store.state.pinnedBySpace.work = [smartNode()];
    store.state.smartFolders['sf-1'] = { state: 'ok', items: [], fetchedAt: 1 };

    coordinator.enqueue(
      sidebar(
        {
          kind: 'openSmartItem',
          payload: { spaceId: 'work', folderId: 'sf-1', itemId: 'ghost', windowId: 100 },
        },
        'c1',
      ),
    );
    await coordinator.idle();

    expect(emitAck).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'c1', result: { error: expect.stringContaining('ghost') } }),
    );
  });

  test('an unknown folderId rejects', async () => {
    installActivationChrome();
    const { coordinator, emitAck } = makeWithSpace();
    coordinator.enqueue(
      sidebar(
        {
          kind: 'openSmartItem',
          payload: { spaceId: 'work', folderId: 'nope', itemId: '42', windowId: 100 },
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
    store.state.pinnedBySpace.work = [smartNode()];
    store.state.smartFolders['sf-1'] = {
      state: 'ok',
      items: [{ id: '99', title: 'Settings', url: 'chrome://settings/' }],
      fetchedAt: 1,
    };

    coordinator.enqueue(
      sidebar(
        {
          kind: 'openSmartItem',
          payload: { spaceId: 'work', folderId: 'sf-1', itemId: '99', windowId: 100 },
        },
        'c1',
      ),
    );
    await coordinator.idle();

    // Scheme guard drops the item before tabs.create — no binding, no tab.
    expect(stub.tabs.create).not.toHaveBeenCalled();
    expect(store.state.smartItemBindings).toEqual({});
    expect(emitAck).toHaveBeenCalledWith({ type: 'lunma/command-ack', id: 'c1', result: 'ok' });
  });
});

describe('deleteSmartFolder demotes bound tabs (smart-folder-item-bindings)', () => {
  test("both bound live tabs demote to the active instance's Temporary; none close", async () => {
    const stub = installActivationChrome();
    const { coordinator, store } = makeWithSpace();
    seedWindowInstance(store);
    store.state.pinnedBySpace.work = [smartNode()];
    store.state.smartItemBindings['sf-1'] = {
      '42': { 100: { tabId: 7, allowGlob: '' } },
      '43': { 100: { tabId: 9, allowGlob: '' } },
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
      sidebar({ kind: 'deleteSmartFolder', payload: { spaceId: 'work', folderId: 'sf-1' } }, 'c1'),
    );
    await coordinator.idle();

    expect(stub.tabs.remove).not.toHaveBeenCalled();
    expect(store.state.smartItemBindings).toEqual({});
    const temp = store.state.spaceInstancesByWindow[100]?.work?.tempTabIds ?? [];
    expect([...temp].sort()).toEqual([7, 9]);
    expect(store.state.pinnedBySpace.work).toEqual([]);
  });

  test('a stale binding (tab already gone) is dropped without a demotion', async () => {
    installActivationChrome();
    const { coordinator, store } = makeWithSpace();
    seedWindowInstance(store);
    store.state.pinnedBySpace.work = [smartNode()];
    store.state.smartItemBindings['sf-1'] = { '42': { 100: { tabId: 7, allowGlob: '' } } }; // no live record

    coordinator.enqueue(
      sidebar({ kind: 'deleteSmartFolder', payload: { spaceId: 'work', folderId: 'sf-1' } }, 'c1'),
    );
    await coordinator.idle();

    expect(store.state.smartItemBindings).toEqual({});
    expect(store.state.spaceInstancesByWindow[100]?.work?.tempTabIds).toEqual([]);
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

// ── feed read-state commands (rss-connector design D3/D6) ───────────────────────

describe('feed read-state handlers', () => {
  function feedNode() {
    return smartNode({
      id: 'feed-1',
      source: 'rss',
      query: undefined,
      icon: 'rss',
      baseUrl: 'https://news.example.com/rss',
    });
  }

  /** Open feed item `post-1`, returning the made coordinator/store (its tab is
   * id 999, active in window 100). */
  async function openFeedItem() {
    const stub = installActivationChrome();
    const made = makeWithSpace();
    seedWindowInstance(made.store);
    made.store.state.pinnedBySpace.work = [feedNode()];
    made.store.state.smartFolders['feed-1'] = {
      state: 'ok',
      items: [{ id: 'post-1', title: 'A post', url: 'https://news.example.com/p/1' }],
      fetchedAt: 1,
    };
    made.coordinator.enqueue(
      sidebar(
        {
          kind: 'openSmartItem',
          payload: { spaceId: 'work', folderId: 'feed-1', itemId: 'post-1', windowId: 100 },
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
    expect(store.state.smartItemBindings['feed-1']?.['post-1']?.[100]?.tabId).toBe(999);
    expect(store.state.smartReadState['feed-1']).toBeUndefined();
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
    expect(store.state.smartReadState['feed-1']).toEqual(['post-1']);
    // Consume = close: the entry's bound tab (999) is closed (no tab trail).
    expect(stub.tabs.remove).toHaveBeenCalledWith(999);
  });

  test('closing the entry’s tab drains it (marks it read)', async () => {
    const { coordinator, store } = await openFeedItem();
    coordinator.enqueue({
      source: 'chrome',
      kind: 'tabs.onRemoved',
      payload: { tabId: 999, info: { windowId: 100, isWindowClosing: false } },
    });
    await coordinator.idle();
    expect(store.state.smartReadState['feed-1']).toEqual(['post-1']);
  });

  test('markAllSmartItemsRead marks every currently-listed item read', async () => {
    installActivationChrome();
    const { coordinator, store, emitAck } = makeWithSpace();
    store.state.pinnedBySpace.work = [feedNode()];
    store.state.smartFolders['feed-1'] = {
      state: 'ok',
      items: [
        { id: 'a', title: 'A', url: 'https://x/a' },
        { id: 'b', title: 'B', url: 'https://x/b' },
      ],
      fetchedAt: 1,
    };

    coordinator.enqueue(
      sidebar(
        { kind: 'markAllSmartItemsRead', payload: { spaceId: 'work', folderId: 'feed-1' } },
        'c1',
      ),
    );
    await coordinator.idle();

    expect(store.state.smartReadState['feed-1']?.sort()).toEqual(['a', 'b']);
    expect(emitAck).toHaveBeenCalledWith({ type: 'lunma/command-ack', id: 'c1', result: 'ok' });
  });

  test('setSmartFolderHideRead persists the preference without a refetch', async () => {
    installActivationChrome();
    const { coordinator, store, emitAck } = makeWithSpace();
    store.state.pinnedBySpace.work = [feedNode()];
    store.state.smartFolders['feed-1'] = { state: 'ok', items: [], fetchedAt: 1 };

    coordinator.enqueue(
      sidebar(
        {
          kind: 'setSmartFolderHideRead',
          payload: { spaceId: 'work', folderId: 'feed-1', hideRead: true },
        },
        'c1',
      ),
    );
    await coordinator.idle();

    expect(store.state.pinnedBySpace.work?.[0]).toMatchObject({ hideRead: true });
    // No refetch — hideRead is a display pref; the fetch window is unchanged.
    expect(store.state.smartFolders['feed-1']?.fetchedAt).toBe(1);
    expect(emitAck).toHaveBeenCalledWith({ type: 'lunma/command-ack', id: 'c1', result: 'ok' });
  });

  test('openSmartFolderListing opens the feed listing URL in a tab', async () => {
    const stub = installActivationChrome();
    const { coordinator, store, emitAck } = makeWithSpace();
    store.state.pinnedBySpace.work = [feedNode()];

    coordinator.enqueue(
      sidebar(
        {
          kind: 'openSmartFolderListing',
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
