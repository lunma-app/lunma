import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { LunmaStore } from '../shared/store.svelte';
import {
  CONNECTORS,
  collectSmartFolders,
  fetchSmartFolderRuntime,
  isDue,
  normalizeBaseUrl,
  reconcileSmartFolderGrants,
  refreshDueSmartFolders,
  registerSmartFoldersPermissionSync,
  registerSmartFoldersRefreshKick,
  resetSmartFoldersInflight,
  SMART_FOLDERS_ALARM_NAME,
  type SmartFolderNode,
  type SmartFoldersResultEvent,
  startSmartFolderRefresh,
  syncSmartFoldersAlarm,
} from './smart-folders';

// The source-agnostic ENGINE suites: scheduling, the in-flight guard, the
// state-request kick, registry dispatch. The per-connector fetch/normalize/
// auth suites live beside their connectors (`connectors/gitlab.test.ts`,
// `connectors/github.test.ts`).

// ── test plumbing ──────────────────────────────────────────────────────────────

interface PermissionsStub {
  contains: ReturnType<typeof vi.fn>;
  request: ReturnType<typeof vi.fn>;
  onAdded: { addListener: ReturnType<typeof vi.fn>; removeListener: ReturnType<typeof vi.fn> };
  onRemoved: { addListener: ReturnType<typeof vi.fn>; removeListener: ReturnType<typeof vi.fn> };
}

interface ChromeStub {
  storage: { local: { get: ReturnType<typeof vi.fn>; set: ReturnType<typeof vi.fn> } };
  alarms: { create: ReturnType<typeof vi.fn>; clear: ReturnType<typeof vi.fn> };
  runtime: {
    onMessage: {
      addListener: ReturnType<typeof vi.fn>;
      removeListener: ReturnType<typeof vi.fn>;
    };
  };
  permissions: PermissionsStub;
}

let chromeStub: ChromeStub;
let storageData: Record<string, unknown>;

function installChromeStub(): void {
  storageData = {};
  chromeStub = {
    storage: {
      local: {
        get: vi.fn(async (key: string) => {
          const value = storageData[key];
          return value === undefined ? {} : { [key]: value };
        }),
        set: vi.fn(async (items: Record<string, unknown>) => {
          Object.assign(storageData, items);
        }),
      },
    },
    alarms: { create: vi.fn(), clear: vi.fn(async () => true) },
    runtime: { onMessage: { addListener: vi.fn(), removeListener: vi.fn() } },
    // The host-permission gate (design D8/D9) calls `chrome.permissions.contains`
    // before every dispatch; default to GRANTED so the existing fetch/scheduling
    // suites exercise the connectors. The gate suites flip it to ungranted.
    permissions: {
      contains: vi.fn(async () => true),
      request: vi.fn(async () => true),
      onAdded: { addListener: vi.fn(), removeListener: vi.fn() },
      onRemoved: { addListener: vi.fn(), removeListener: vi.fn() },
    },
  };
  (globalThis as unknown as { chrome: unknown }).chrome = chromeStub;
}

/** Minimal Response stand-in — the connector reads only status/ok/json(). */
function jsonResponse(body: unknown, status = 200): unknown {
  return { status, ok: status >= 200 && status < 300, json: async () => body };
}

let fetchMock: ReturnType<typeof vi.fn>;

function node(overrides: Partial<SmartFolderNode> = {}): SmartFolderNode {
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

function mr(id: number, overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id,
    iid: id,
    project_id: 1,
    title: `MR ${id}`,
    web_url: `https://gitlab.example.com/g/p/-/merge_requests/${id}`,
    ...overrides,
  };
}

beforeEach(() => {
  installChromeStub();
  resetSmartFoldersInflight();
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

// ── normalizeBaseUrl ───────────────────────────────────────────────────────────

describe('normalizeBaseUrl', () => {
  test('strips a trailing slash', () => {
    expect(normalizeBaseUrl('https://gitlab.example.com/')).toBe('https://gitlab.example.com');
  });

  test('keeps a subpath instance, stripping only the trailing slash', () => {
    expect(normalizeBaseUrl('https://host.example.com/gitlab/')).toBe(
      'https://host.example.com/gitlab',
    );
  });

  test('rejects a non-absolute URL', () => {
    expect(() => normalizeBaseUrl('gitlab.example.com')).toThrow(/invalid base URL/);
  });

  test('rejects a non-http(s) scheme', () => {
    expect(() => normalizeBaseUrl('ftp://gitlab.example.com')).toThrow(/http/);
  });
});

// ── registry dispatch ──────────────────────────────────────────────────────────

describe('the CONNECTORS registry', () => {
  test('holds exactly the four shipped sources, conforming to the contract', () => {
    expect(Object.keys(CONNECTORS).sort()).toEqual(['github', 'gitlab', 'jira', 'rss']);
    expect(CONNECTORS.gitlab.source).toBe('gitlab');
    expect(CONNECTORS.gitlab.defaultBaseUrl).toBe('https://gitlab.com');
    expect(CONNECTORS.github.source).toBe('github');
    expect(CONNECTORS.github.defaultBaseUrl).toBe('https://github.com');
    expect(CONNECTORS.jira.source).toBe('jira');
    expect(CONNECTORS.jira.defaultBaseUrl).toBe('https://your-site.atlassian.net');
    expect(CONNECTORS.rss.source).toBe('rss');
    expect(CONNECTORS.rss.defaultBaseUrl).toBe('');
    expect(CONNECTORS.gitlab.mintedIcon).toBe('folder-git-2');
    expect(CONNECTORS.github.mintedIcon).toBe('folder-git-2');
    expect(CONNECTORS.jira.mintedIcon).toBe('folder-kanban');
    expect(CONNECTORS.rss.mintedIcon).toBe('rss');
  });

  test('requiredOrigins: github.com fetches the api origin; everything else is same-origin (design D8)', () => {
    // GitHub on github.com fetches api.github.com (a DIFFERENT origin) — the
    // headline correctness case: gating on github.com would never authorize the
    // fetch. GitHub Enterprise is same-origin under the baseUrl.
    expect(CONNECTORS.github.requiredOrigins({ baseUrl: 'https://github.com' })).toEqual([
      'https://api.github.com/*',
    ]);
    expect(CONNECTORS.github.requiredOrigins({ baseUrl: 'https://ghe.acme.com' })).toEqual([
      'https://ghe.acme.com/*',
    ]);
    // GitLab, Jira, and RSS each fetch their own baseUrl origin (port preserved).
    expect(
      CONNECTORS.gitlab.requiredOrigins({ baseUrl: 'https://gitlab.example.com:8443/g' }),
    ).toEqual(['https://gitlab.example.com:8443/*']);
    expect(CONNECTORS.jira.requiredOrigins({ baseUrl: 'https://acme.atlassian.net' })).toEqual([
      'https://acme.atlassian.net/*',
    ]);
    expect(
      CONNECTORS.rss.requiredOrigins({ baseUrl: 'https://blog.example.com/feed.xml' }),
    ).toEqual(['https://blog.example.com/*']);
  });

  test('a github folder dispatches through CONNECTORS.github and its result reaches the drain', async () => {
    const runtime = { state: 'ok' as const, items: [], fetchedAt: 123 };
    const githubFetch = vi.spyOn(CONNECTORS.github, 'fetchRuntime').mockResolvedValue(runtime);
    const store = makeStoreWithSmartFolders([]);
    const events: SmartFoldersResultEvent[] = [];
    const ghNode = node({ id: 'sf-gh', source: 'github', baseUrl: 'https://github.com' });

    const { completion } = startSmartFolderRefresh(
      { store, enqueue: (e) => events.push(e) },
      ghNode,
    );
    await completion;

    expect(githubFetch).toHaveBeenCalledWith(ghNode, undefined);
    // The pending mark, then the github connector's result — exactly as a
    // GitLab result rides the drain.
    expect(events).toHaveLength(2);
    expect(events[1]?.payload).toEqual({ folderId: 'sf-gh', runtime });
  });

  test('a jira folder dispatches through CONNECTORS.jira and its result reaches the drain', async () => {
    const runtime = { state: 'ok' as const, items: [], fetchedAt: 123 };
    const jiraFetch = vi.spyOn(CONNECTORS.jira, 'fetchRuntime').mockResolvedValue(runtime);
    const store = makeStoreWithSmartFolders([]);
    const events: SmartFoldersResultEvent[] = [];
    const jiraNode = node({
      id: 'sf-jira',
      source: 'jira',
      baseUrl: 'https://acme.atlassian.net',
    });

    const { completion } = startSmartFolderRefresh(
      { store, enqueue: (e) => events.push(e) },
      jiraNode,
    );
    await completion;

    expect(jiraFetch).toHaveBeenCalledWith(jiraNode, undefined);
    // The pending mark, then the jira connector's result — exactly as a GitLab
    // or GitHub result rides the drain.
    expect(events).toHaveLength(2);
    expect(events[1]?.payload).toEqual({ folderId: 'sf-jira', runtime });
  });
});

// ── scheduling ─────────────────────────────────────────────────────────────────

function makeStoreWithSmartFolders(nodes: SmartFolderNode[]): LunmaStore {
  const store = new LunmaStore({ idFactory: () => 'id' });
  store.state.spaces.push({ id: 'work', name: 'Work', color: 'blue', icon: 'star' });
  store.state.pinnedBySpace.work = nodes;
  return store;
}

// ── host-permission gate (least-privilege-permissions design D8/D9) ─────────────

describe('the host-permission gate', () => {
  test('an ungranted origin short-circuits to needs-access without a fetch', async () => {
    const glFetch = vi.spyOn(CONNECTORS.gitlab, 'fetchRuntime');
    chromeStub.permissions.contains.mockResolvedValue(false);

    const runtime = await fetchSmartFolderRuntime(
      node({ source: 'gitlab', baseUrl: 'https://gitlab.example.com' }),
    );

    expect(runtime).toEqual({ state: 'needs-access', items: [], fetchedAt: expect.any(Number) });
    expect(glFetch).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('a github.com folder gates on the api origin it fetches, not github.com', async () => {
    const ghFetch = vi.spyOn(CONNECTORS.github, 'fetchRuntime');
    chromeStub.permissions.contains.mockResolvedValue(false);

    const runtime = await fetchSmartFolderRuntime(
      node({ source: 'github', baseUrl: 'https://github.com' }),
    );

    expect(runtime.state).toBe('needs-access');
    expect(ghFetch).not.toHaveBeenCalled();
    // The gate asks about api.github.com (the fetched origin), never github.com.
    expect(chromeStub.permissions.contains).toHaveBeenCalledWith({
      origins: ['https://api.github.com/*'],
    });
  });

  test('an RSS feed on an ungranted origin shows needs-access, not error', async () => {
    const rssFetch = vi.spyOn(CONNECTORS.rss, 'fetchRuntime');
    chromeStub.permissions.contains.mockResolvedValue(false);

    const runtime = await fetchSmartFolderRuntime(
      node({ source: 'rss', baseUrl: 'https://blog.example.com/feed.xml' }),
    );

    expect(runtime.state).toBe('needs-access');
    expect(rssFetch).not.toHaveBeenCalled();
  });

  test('needs-access precedes signed-out: the gate wins before the connector auth check', async () => {
    // No connectors stored, so the github connector would return `signed-out` if
    // reached — but the origin is ungranted, so the gate short-circuits first and
    // the connector is never consulted.
    const ghFetch = vi.spyOn(CONNECTORS.github, 'fetchRuntime');
    chromeStub.permissions.contains.mockResolvedValue(false);

    const runtime = await fetchSmartFolderRuntime(
      node({ source: 'github', baseUrl: 'https://github.com' }),
    );

    expect(runtime.state).toBe('needs-access');
    expect(ghFetch).not.toHaveBeenCalled();
  });

  test('a granted origin dispatches to the connector', async () => {
    const result = { state: 'ok' as const, items: [], fetchedAt: 1 };
    const glFetch = vi.spyOn(CONNECTORS.gitlab, 'fetchRuntime').mockResolvedValue(result);
    chromeStub.permissions.contains.mockResolvedValue(true);
    const glNode = node({ source: 'gitlab', baseUrl: 'https://gitlab.example.com' });

    const runtime = await fetchSmartFolderRuntime(glNode);

    expect(runtime).toBe(result);
    expect(glFetch).toHaveBeenCalledWith(glNode, undefined);
  });
});

// ── host-permission sync: grant heals, revoke gates (design D5/D9) ──────────────

describe('reconcileSmartFolderGrants', () => {
  test('on grant: a needs-access folder refetches (needs-access → pending → ok)', async () => {
    const okRuntime = {
      state: 'ok' as const,
      items: [{ id: 'x', title: 't', url: 'https://u' }],
      fetchedAt: 1,
    };
    vi.spyOn(CONNECTORS.gitlab, 'fetchRuntime').mockResolvedValue(okRuntime);
    chromeStub.permissions.contains.mockResolvedValue(true);
    const store = makeStoreWithSmartFolders([node({ id: 'sf-1', source: 'gitlab' })]);
    store.state.smartFolders['sf-1'] = { state: 'needs-access', items: [], fetchedAt: Date.now() };
    const events: SmartFoldersResultEvent[] = [];

    await reconcileSmartFolderGrants({ store, enqueue: (e) => events.push(e) });

    expect(events.map((e) => e.payload.runtime.state)).toEqual(['pending', 'ok']);
    expect(events.at(-1)?.payload.folderId).toBe('sf-1');
  });

  test('on revoke: an ok folder whose origins are no longer granted drops to needs-access', async () => {
    chromeStub.permissions.contains.mockResolvedValue(false);
    const store = makeStoreWithSmartFolders([node({ id: 'sf-1', source: 'gitlab' })]);
    store.state.smartFolders['sf-1'] = {
      state: 'ok',
      items: [{ id: 'x', title: 't', url: 'https://u' }],
      fetchedAt: Date.now(),
    };
    const events: SmartFoldersResultEvent[] = [];

    await reconcileSmartFolderGrants({ store, enqueue: (e) => events.push(e) });

    expect(events).toHaveLength(1);
    expect(events[0]?.payload).toEqual({
      folderId: 'sf-1',
      runtime: { state: 'needs-access', items: [], fetchedAt: expect.any(Number) },
    });
  });

  test('on grant: an already-ok, not-due folder is left alone (no needless poll)', async () => {
    chromeStub.permissions.contains.mockResolvedValue(true);
    const store = makeStoreWithSmartFolders([
      node({ id: 'sf-1', source: 'gitlab', refreshMinutes: 30 }),
    ]);
    store.state.smartFolders['sf-1'] = { state: 'ok', items: [], fetchedAt: Date.now() };
    const events: SmartFoldersResultEvent[] = [];

    await reconcileSmartFolderGrants({ store, enqueue: (e) => events.push(e) });

    expect(events).toHaveLength(0);
  });

  test('a folder already in needs-access is not re-enqueued on a still-ungranted change', async () => {
    chromeStub.permissions.contains.mockResolvedValue(false);
    const store = makeStoreWithSmartFolders([node({ id: 'sf-1', source: 'gitlab' })]);
    store.state.smartFolders['sf-1'] = { state: 'needs-access', items: [], fetchedAt: Date.now() };
    const events: SmartFoldersResultEvent[] = [];

    await reconcileSmartFolderGrants({ store, enqueue: (e) => events.push(e) });

    expect(events).toHaveLength(0);
  });

  test('registerSmartFoldersPermissionSync reconciles on a change and unsubscribes', async () => {
    chromeStub.permissions.contains.mockResolvedValue(false);
    const store = makeStoreWithSmartFolders([node({ id: 'sf-1', source: 'gitlab' })]);
    store.state.smartFolders['sf-1'] = { state: 'ok', items: [], fetchedAt: Date.now() };
    const events: SmartFoldersResultEvent[] = [];

    const unsubscribe = registerSmartFoldersPermissionSync({
      store,
      enqueue: (e) => events.push(e),
    });
    const onAdded = chromeStub.permissions.onAdded.addListener.mock.calls[0]?.[0] as (
      p: unknown,
    ) => void;
    expect(onAdded).toBeTypeOf('function');

    onAdded({ origins: ['https://gitlab.example.com/*'] });
    await vi.waitFor(() => expect(events.length).toBeGreaterThan(0));
    expect(events[0]?.payload.runtime.state).toBe('needs-access');

    unsubscribe();
    expect(chromeStub.permissions.onAdded.removeListener).toHaveBeenCalled();
    expect(chromeStub.permissions.onRemoved.removeListener).toHaveBeenCalled();
  });
});

describe('scheduling', () => {
  test('isDue: a null/absent fetchedAt is always due; fresh is not; stale is', () => {
    const folder = { id: 'sf-1', refreshMinutes: 5 };
    const now = 1_000_000_000;
    expect(isDue(folder, {}, now)).toBe(true);
    expect(
      isDue(folder, { 'sf-1': { state: 'ok', items: [], fetchedAt: now - 4 * 60_000 } }, now),
    ).toBe(false);
    expect(
      isDue(folder, { 'sf-1': { state: 'ok', items: [], fetchedAt: now - 6 * 60_000 } }, now),
    ).toBe(true);
  });

  test('refreshDueSmartFolders refreshes only due folders', async () => {
    const now = Date.now();
    const a = node({ id: 'sf-a', refreshMinutes: 5, query: 'authored' });
    const b = node({ id: 'sf-b', refreshMinutes: 30, query: 'authored' });
    const store = makeStoreWithSmartFolders([a, b]);
    store.state.smartFolders['sf-a'] = { state: 'ok', items: [], fetchedAt: now - 6 * 60_000 };
    store.state.smartFolders['sf-b'] = { state: 'ok', items: [], fetchedAt: now - 10 * 60_000 };
    fetchMock.mockResolvedValue(jsonResponse([]));
    const events: SmartFoldersResultEvent[] = [];

    await refreshDueSmartFolders({ store, enqueue: (e) => events.push(e) });

    const folderIds = new Set(events.map((e) => e.payload.folderId));
    expect(folderIds).toEqual(new Set(['sf-a']));
  });

  test('refreshDueSmartFolders threads ONE ConnectorCaches per cycle (one /user fetch for two folders)', async () => {
    // The once-per-poll-cycle contract: two due review-requested folders on
    // the same instance share one me-resolution because the engine constructs
    // a single caches map per cycle and threads it into every started fetch.
    fetchMock.mockImplementation(async (url: string) => {
      if (url.endsWith('/api/v4/user')) return jsonResponse({ id: 7 });
      return jsonResponse([]);
    });
    const store = makeStoreWithSmartFolders([
      node({ id: 'sf-a', query: 'review-requested' }),
      node({ id: 'sf-b', query: 'review-requested' }),
    ]);
    const events: SmartFoldersResultEvent[] = [];

    await refreshDueSmartFolders({ store, enqueue: (e) => events.push(e) });

    const userCalls = fetchMock.mock.calls.filter((c) => (c[0] as string).endsWith('/api/v4/user'));
    expect(userCalls).toHaveLength(1);
  });

  test('startSmartFolderRefresh enqueues a pending mark, then the result', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse([mr(1, { head_pipeline: { status: 'success' } })]),
    );
    const store = makeStoreWithSmartFolders([node({ query: 'authored' })]);
    const events: SmartFoldersResultEvent[] = [];

    const { started, completion } = startSmartFolderRefresh(
      { store, enqueue: (e) => events.push(e) },
      node({ query: 'authored' }),
    );
    expect(started).toBe(true);
    expect(events).toHaveLength(1);
    expect(events[0]?.payload.runtime.state).toBe('pending');
    await completion;
    expect(events).toHaveLength(2);
    expect(events[1]?.payload.runtime.state).toBe('ok');
    expect(events[1]?.payload.runtime.items).toHaveLength(1);
  });

  test('a folder already in flight is not re-fired', async () => {
    let resolveFetch: (value: unknown) => void = () => undefined;
    fetchMock.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveFetch = resolve;
      }),
    );
    const store = makeStoreWithSmartFolders([node({ query: 'authored' })]);
    const events: SmartFoldersResultEvent[] = [];
    const deps = { store, enqueue: (e: SmartFoldersResultEvent) => events.push(e) };

    const first = startSmartFolderRefresh(deps, node({ query: 'authored' }));
    const second = startSmartFolderRefresh(deps, node({ query: 'authored' }));
    expect(first.started).toBe(true);
    expect(second.started).toBe(false);
    resolveFetch(jsonResponse([]));
    await first.completion;
    // One pending mark + one result — never doubled.
    expect(events).toHaveLength(2);
  });

  test('syncSmartFoldersAlarm clears the alarm when no smart folders exist', async () => {
    const store = makeStoreWithSmartFolders([]);
    await syncSmartFoldersAlarm(store);
    expect(chromeStub.alarms.clear).toHaveBeenCalledWith(SMART_FOLDERS_ALARM_NAME);
    expect(chromeStub.alarms.create).not.toHaveBeenCalled();
  });

  test('syncSmartFoldersAlarm registers at the minimum cadence across folders', async () => {
    const store = makeStoreWithSmartFolders([
      node({ id: 'a', refreshMinutes: 30 }),
      node({ id: 'b', refreshMinutes: 10 }),
    ]);
    await syncSmartFoldersAlarm(store);
    expect(chromeStub.alarms.create).toHaveBeenCalledWith(SMART_FOLDERS_ALARM_NAME, {
      periodInMinutes: 10,
    });
  });

  test('collectSmartFolders gathers smart nodes across Spaces, ignoring other kinds', () => {
    const store = makeStoreWithSmartFolders([node({ id: 'a' })]);
    store.state.pinnedBySpace.work?.push({ kind: 'tab', id: 't1' });
    store.state.pinnedBySpace.other = [node({ id: 'b' })];
    expect(collectSmartFolders(store.state).map((n) => n.id)).toEqual(['a', 'b']);
  });
});

// ── the parallel state-request refresh kick ────────────────────────────────────

describe('registerSmartFoldersRefreshKick', () => {
  test('kicks the due-check on state-request without claiming the response channel', async () => {
    const store = makeStoreWithSmartFolders([node({ query: 'authored' })]); // null fetchedAt → due
    fetchMock.mockResolvedValue(jsonResponse([]));
    const events: SmartFoldersResultEvent[] = [];
    registerSmartFoldersRefreshKick({ store, enqueue: (e) => events.push(e) });
    const listener = chromeStub.runtime.onMessage.addListener.mock.calls[0]?.[0] as (
      raw: unknown,
    ) => unknown;

    // The listener NEVER returns true (it never claims the response channel) —
    // the snapshot handler is free to respond synchronously and unblocked.
    const returned = listener({ type: 'lunma/state-request' });
    expect(returned).toBeUndefined();

    await vi.waitFor(() => {
      expect(events.length).toBeGreaterThan(0);
    });
    expect(events[0]?.payload.folderId).toBe('sf-1');
  });

  test('ignores unrelated message types', async () => {
    const store = makeStoreWithSmartFolders([node({ query: 'authored' })]);
    const events: SmartFoldersResultEvent[] = [];
    registerSmartFoldersRefreshKick({ store, enqueue: (e) => events.push(e) });
    const listener = chromeStub.runtime.onMessage.addListener.mock.calls[0]?.[0] as (
      raw: unknown,
    ) => unknown;

    expect(listener({ type: 'lunma/command' })).toBeUndefined();
    expect(listener(null)).toBeUndefined();
    expect(listener('nope')).toBeUndefined();
    await Promise.resolve();
    expect(events).toHaveLength(0);
  });

  test('defers the due-check until whenReady resolves (never reads a half-loaded store)', async () => {
    const store = makeStoreWithSmartFolders([node({ query: 'authored' })]);
    fetchMock.mockResolvedValue(jsonResponse([]));
    const events: SmartFoldersResultEvent[] = [];
    let releaseBoot: () => void = () => undefined;
    const bootReady = new Promise<void>((resolve) => {
      releaseBoot = resolve;
    });
    registerSmartFoldersRefreshKick({ store, enqueue: (e) => events.push(e) }, bootReady);
    const listener = chromeStub.runtime.onMessage.addListener.mock.calls[0]?.[0] as (
      raw: unknown,
    ) => unknown;

    listener({ type: 'lunma/state-request' });
    await Promise.resolve();
    expect(events).toHaveLength(0); // boot not finished — nothing fired
    releaseBoot();
    await vi.waitFor(() => {
      expect(events.length).toBeGreaterThan(0);
    });
  });
});
