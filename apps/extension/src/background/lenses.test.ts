import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { deriveAuthStatus } from '../shared/auth-method';
import { LunmaStore } from '../shared/store.svelte';
import type { LensProvider, LensQuery, LensSourceRef, SourceAccount } from '../shared/types';
import {
  CONNECTORS,
  collectLenses,
  fetchLensSectionRuntime,
  isDue,
  LENSES_ALARM_NAME,
  type LensesResultEvent,
  type LensNode,
  normalizeBaseUrl,
  reconcileLensGrants,
  refreshDueLenses,
  registerLensesPermissionSync,
  registerLensesRefreshKick,
  resetLensesInflight,
  resolvedConfigs,
  sourceKey,
  startLensRefresh,
  syncLensesAlarm,
} from './lenses';

// ── connector-accounts test plumbing ────────────────────────────────────────────
// The engine now resolves lens `sources` (LensSourceRef[]) against AppState.sources.
// To keep the engine fixtures readable, `node()` still accepts the EMBEDDED source
// shape `{ source, baseUrl, queries }` and converts each to a `LensSourceRef`,
// minting (and registering) a deterministic account per `(provider, baseUrl)` so
// two lenses on the same host share ONE account. `makeStoreWithLenses` seeds the
// registered accounts into `store.state.sources`.

type EmbeddedSource = {
  source: LensProvider;
  baseUrl: string;
  queries: LensQuery[];
  name?: string;
};

const accountRegistry = new Map<string, SourceAccount>();

function ref(e: EmbeddedSource): LensSourceRef {
  const id = `acc:${e.source}:${e.baseUrl}`;
  if (!accountRegistry.has(id)) {
    accountRegistry.set(id, {
      id,
      provider: e.source,
      baseUrl: e.baseUrl,
      ...(e.name !== undefined ? { name: e.name } : {}),
    });
  }
  return { sourceId: id, queries: e.queries };
}

function registeredAccounts(): Record<string, SourceAccount> {
  return Object.fromEntries(accountRegistry);
}

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
    id: string;
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
    runtime: { id: 'test-ext', onMessage: { addListener: vi.fn(), removeListener: vi.fn() } },
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

function node(
  overrides: Partial<Omit<LensNode, 'sources'>> & { sources?: EmbeddedSource[] } = {},
): LensNode {
  const { sources: embedded, ...rest } = overrides;
  const sourceList: EmbeddedSource[] = embedded ?? [
    { source: 'gitlab', baseUrl: 'https://gitlab.example.com', queries: ['review-requested'] },
  ];
  return {
    kind: 'lens',
    id: 'sf-1',
    name: 'Review requests',
    icon: 'folder-git-2',
    lensKind: 'general',
    sources: sourceList.map(ref),
    maxItems: 20,
    hideRead: false,
    refreshMinutes: 10,
    ...rest,
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
  resetLensesInflight();
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

// ── resolvedConfigs + account resolution (connector-accounts) ───────────────────

describe('resolvedConfigs resolves references against AppState.sources', () => {
  test('a reference resolves against its account and expands per filter', () => {
    const sources: Record<string, SourceAccount> = {
      'acc-1': { id: 'acc-1', provider: 'gitlab', baseUrl: 'https://gitlab.com', name: 'Work' },
    };
    const lensNode: LensNode = {
      kind: 'lens',
      id: 'sf-1',
      name: 'L',
      icon: 'folder-git-2',
      lensKind: 'general',
      sources: [{ sourceId: 'acc-1', queries: ['authored', 'assigned'] }],
      maxItems: 20,
      hideRead: false,
      refreshMinutes: 10,
    };
    const out = resolvedConfigs(lensNode, sources);
    expect(out).toEqual([
      {
        source: 'gitlab',
        baseUrl: 'https://gitlab.com',
        lensKind: 'general',
        sourceId: 'acc-1',
        name: 'Work',
        query: 'authored',
      },
      {
        source: 'gitlab',
        baseUrl: 'https://gitlab.com',
        lensKind: 'general',
        sourceId: 'acc-1',
        name: 'Work',
        query: 'assigned',
      },
    ]);
  });

  test('a dangling reference (account absent from sources) yields no section', () => {
    const lensNode: LensNode = {
      kind: 'lens',
      id: 'sf-1',
      name: 'L',
      icon: 'folder-git-2',
      lensKind: 'general',
      sources: [{ sourceId: 'gone', queries: ['authored'] }],
      maxItems: 20,
      hideRead: false,
      refreshMinutes: 10,
    };
    expect(resolvedConfigs(lensNode, {})).toEqual([]);
  });
});

// ── deriveAuthStatus precedence (connector-accounts, design D3) ──────────────────

describe('deriveAuthStatus', () => {
  test('rss is public regardless of token', () => {
    expect(deriveAuthStatus('rss', false)).toBe('public');
  });
  test('a pat-only provider with no token needs a token', () => {
    expect(deriveAuthStatus('github', false)).toBe('needs-token');
  });
  test('a token always wins → connected', () => {
    expect(deriveAuthStatus('github', true)).toBe('connected');
    expect(deriveAuthStatus('gitlab', true)).toBe('connected');
  });
  test('a session-capable provider with no token rides the browser session', () => {
    expect(deriveAuthStatus('gitlab', false)).toBe('browser-session');
    expect(deriveAuthStatus('jira', false)).toBe('browser-session');
  });
  test('a runtime signed-out overrides the config-time status', () => {
    expect(deriveAuthStatus('gitlab', true, true)).toBe('signed-out');
  });
});

// ── sourceKey (task 8.1) ───────────────────────────────────────────────────────

describe('sourceKey', () => {
  test('gitlab.com', () => {
    expect(
      sourceKey({
        source: 'gitlab',
        baseUrl: 'https://gitlab.com',
        lensKind: 'general',
        sourceId: 'acc-test',
      }),
    ).toBe('acc-test');
  });

  test('github.com uses the sourceId (not the baseUrl host)', () => {
    expect(
      sourceKey({
        source: 'github',
        baseUrl: 'https://github.com',
        lensKind: 'general',
        sourceId: 'acc-test',
      }),
    ).toBe('acc-test');
  });

  test('GitHub Enterprise uses the sourceId (not the custom host)', () => {
    expect(
      sourceKey({
        source: 'github',
        baseUrl: 'https://ghe.corp.example.com',
        lensKind: 'general',
        sourceId: 'acc-test',
      }),
    ).toBe('acc-test');
  });

  test('rss with a path URL keys by sourceId only', () => {
    expect(
      sourceKey({
        source: 'rss',
        baseUrl: 'https://feeds.example.com/blog.xml',
        lensKind: 'general',
        sourceId: 'acc-test',
      }),
    ).toBe('acc-test');
  });

  test('a queue resolved config includes the filter axis (multi-filter)', () => {
    expect(
      sourceKey({
        source: 'gitlab',
        baseUrl: 'https://gitlab.example.com',
        query: 'authored',
        lensKind: 'general',
        sourceId: 'acc-test',
      }),
    ).toBe('acc-test:authored');
    expect(
      sourceKey({
        source: 'gitlab',
        baseUrl: 'https://gitlab.example.com',
        query: 'review-requested',
        lensKind: 'general',
        sourceId: 'acc-test',
      }),
    ).toBe('acc-test:review-requested');
  });
});

// ── cross-surface sourceKey consistency (dedup-lens-ui spec requirement) ────────
// background/lenses re-exports sourceKey from shared/lens-labels; this test
// documents the spec's consistency scenario: a self-hosted source on a
// non-default port MUST key identically in the SW and the overview page.

describe('sourceKey — cross-surface consistency', () => {
  test('self-hosted source on a non-default port keys by sourceId:query', () => {
    // baseUrl/host/port no longer affect the key — the account id carries the
    // host identity. Two accounts on the same host get distinct keys via sourceId.
    expect(
      sourceKey({
        source: 'gitlab',
        baseUrl: 'https://git.example.com:8443',
        query: 'review-requested',
        lensKind: 'general',
        sourceId: 'acc-test',
      }),
    ).toBe('acc-test:review-requested');
  });

  test('malformed baseUrl produces a stable key (no throw)', () => {
    expect(
      sourceKey({
        source: 'github',
        baseUrl: 'not-a-valid-url',
        lensKind: 'general',
        sourceId: 'acc-test',
      }),
    ).toBe('acc-test');
  });
});

// ── registry dispatch ──────────────────────────────────────────────────────────

describe('the CONNECTORS registry', () => {
  test('holds exactly the five shipped sources, conforming to the contract', () => {
    expect(Object.keys(CONNECTORS).sort()).toEqual([
      'bitbucket',
      'github',
      'gitlab',
      'jira',
      'rss',
    ]);
    expect(CONNECTORS.gitlab.source).toBe('gitlab');
    expect(CONNECTORS.gitlab.defaultBaseUrl).toBe('https://gitlab.com');
    expect(CONNECTORS.github.source).toBe('github');
    expect(CONNECTORS.github.defaultBaseUrl).toBe('https://github.com');
    expect(CONNECTORS.bitbucket.source).toBe('bitbucket');
    expect(CONNECTORS.bitbucket.defaultBaseUrl).toBe('https://bitbucket.org');
    expect(CONNECTORS.bitbucket.authMethods).toEqual(['pat']);
    expect(CONNECTORS.jira.source).toBe('jira');
    expect(CONNECTORS.jira.defaultBaseUrl).toBe('https://your-site.atlassian.net');
    expect(CONNECTORS.rss.source).toBe('rss');
    expect(CONNECTORS.rss.defaultBaseUrl).toBe('');
    expect(CONNECTORS.gitlab.mintedIcon).toBe('folder-git-2');
    expect(CONNECTORS.github.mintedIcon).toBe('folder-git-2');
    expect(CONNECTORS.bitbucket.mintedIcon).toBe('folder-git-2');
    expect(CONNECTORS.jira.mintedIcon).toBe('folder-kanban');
    expect(CONNECTORS.rss.mintedIcon).toBe('rss');
  });

  test('requiredOrigins: github.com fetches the api origin; everything else is same-origin (design D8)', () => {
    // GitHub on github.com fetches api.github.com (a DIFFERENT origin) — the
    // headline correctness case: gating on github.com would never authorize the
    // fetch. GitHub Enterprise is same-origin under the baseUrl.
    expect(
      CONNECTORS.github.requiredOrigins({
        source: 'github',
        baseUrl: 'https://github.com',
        lensKind: 'general',
        sourceId: 'acc-test',
      }),
    ).toEqual(['https://api.github.com/*']);
    expect(
      CONNECTORS.github.requiredOrigins({
        source: 'github',
        baseUrl: 'https://ghe.acme.com',
        lensKind: 'general',
        sourceId: 'acc-test',
      }),
    ).toEqual(['https://ghe.acme.com/*']);
    // GitLab, Jira, and RSS each fetch their own baseUrl origin (port preserved).
    expect(
      CONNECTORS.gitlab.requiredOrigins({
        source: 'gitlab',
        baseUrl: 'https://gitlab.example.com:8443/g',
        lensKind: 'general',
        sourceId: 'acc-test',
      }),
    ).toEqual(['https://gitlab.example.com:8443/*']);
    expect(
      CONNECTORS.jira.requiredOrigins({
        source: 'jira',
        baseUrl: 'https://acme.atlassian.net',
        lensKind: 'general',
        sourceId: 'acc-test',
      }),
    ).toEqual(['https://acme.atlassian.net/*']);
    expect(
      CONNECTORS.rss.requiredOrigins({
        source: 'rss',
        baseUrl: 'https://blog.example.com/feed.xml',
        lensKind: 'general',
        sourceId: 'acc-test',
      }),
    ).toEqual(['https://blog.example.com/*']);
    // Bitbucket Cloud fetches api.bitbucket.org (a DIFFERENT origin, like GitHub);
    // a self-hosted Server/DC host is same-origin under its baseUrl.
    expect(
      CONNECTORS.bitbucket.requiredOrigins({
        source: 'bitbucket',
        baseUrl: 'https://bitbucket.org',
        lensKind: 'review',
        sourceId: 'acc-test',
      }),
    ).toEqual(['https://api.bitbucket.org/*']);
    expect(
      CONNECTORS.bitbucket.requiredOrigins({
        source: 'bitbucket',
        baseUrl: 'https://bitbucket.example.com',
        lensKind: 'review',
        sourceId: 'acc-test',
      }),
    ).toEqual(['https://bitbucket.example.com/*']);
  });

  test('a github folder dispatches through CONNECTORS.github and its result reaches the drain', async () => {
    const runtime = { state: 'ok' as const, items: [], fetchedAt: 123 };
    const githubFetch = vi.spyOn(CONNECTORS.github, 'fetchRuntime').mockResolvedValue(runtime);
    const events: LensesResultEvent[] = [];
    // Build the node BEFORE seeding the store so its account registers first.
    const ghNode = node({
      id: 'sf-gh',
      sources: [{ source: 'github', baseUrl: 'https://github.com', queries: ['authored'] }],
    });
    const store = makeStoreWithLenses([]);
    const ghResolved = {
      source: 'github' as const,
      baseUrl: 'https://github.com',
      query: 'authored' as const,
      lensKind: 'general' as const,
      sourceId: 'acc:github:https://github.com',
    };

    const { completion } = startLensRefresh({ store, enqueue: (e) => events.push(e) }, ghNode);
    await completion;

    expect(githubFetch).toHaveBeenCalledWith(ghResolved, ghNode.maxItems, expect.anything());
    // The pending mark, then the github connector's result — exactly as a
    // GitLab result rides the drain.
    expect(events).toHaveLength(2);
    expect(events[1]?.payload).toEqual({
      folderId: 'sf-gh',
      sourceKey: sourceKey(ghResolved),
      runtime,
    });
  });

  test('a jira folder dispatches through CONNECTORS.jira and its result reaches the drain', async () => {
    const runtime = { state: 'ok' as const, items: [], fetchedAt: 123 };
    const jiraFetch = vi.spyOn(CONNECTORS.jira, 'fetchRuntime').mockResolvedValue(runtime);
    const events: LensesResultEvent[] = [];
    // Build the node BEFORE seeding the store so its account registers first.
    const jiraNode = node({
      id: 'sf-jira',
      sources: [{ source: 'jira', baseUrl: 'https://acme.atlassian.net', queries: ['assigned'] }],
    });
    const store = makeStoreWithLenses([]);
    const jiraResolved = {
      source: 'jira' as const,
      baseUrl: 'https://acme.atlassian.net',
      query: 'assigned' as const,
      lensKind: 'general' as const,
      sourceId: 'acc:jira:https://acme.atlassian.net',
    };

    const { completion } = startLensRefresh({ store, enqueue: (e) => events.push(e) }, jiraNode);
    await completion;

    expect(jiraFetch).toHaveBeenCalledWith(jiraResolved, jiraNode.maxItems, expect.anything());
    // The pending mark, then the jira connector's result — exactly as a GitLab
    // or GitHub result rides the drain.
    expect(events).toHaveLength(2);
    expect(events[1]?.payload).toEqual({
      folderId: 'sf-jira',
      sourceKey: sourceKey(jiraResolved),
      runtime,
    });
  });
});

// ── scheduling ─────────────────────────────────────────────────────────────────

function makeStoreWithLenses(nodes: LensNode[]): LunmaStore {
  const store = new LunmaStore({ idFactory: () => 'id' });
  store.state.spaces.push({ id: 'work', name: 'Work', color: 'blue', icon: 'star' });
  store.state.pinnedBySpace.work = nodes;
  // Seed the accounts the lens references resolve against (connector-accounts).
  store.state.sources = registeredAccounts();
  return store;
}

// ── host-permission gate (least-privilege-permissions design D8/D9) ─────────────

describe('the host-permission gate', () => {
  test('an ungranted origin short-circuits to needs-access without a fetch', async () => {
    const glFetch = vi.spyOn(CONNECTORS.gitlab, 'fetchRuntime');
    chromeStub.permissions.contains.mockResolvedValue(false);

    const runtime = await fetchLensSectionRuntime(
      {
        source: 'gitlab',
        baseUrl: 'https://gitlab.example.com',
        lensKind: 'general',
        sourceId: 'acc-test',
      },
      20,
    );

    expect(runtime).toEqual({ state: 'needs-access', items: [], fetchedAt: expect.any(Number) });
    expect(glFetch).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('a github.com folder gates on the api origin it fetches, not github.com', async () => {
    const ghFetch = vi.spyOn(CONNECTORS.github, 'fetchRuntime');
    chromeStub.permissions.contains.mockResolvedValue(false);

    const runtime = await fetchLensSectionRuntime(
      {
        source: 'github',
        baseUrl: 'https://github.com',
        lensKind: 'general',
        sourceId: 'acc-test',
      },
      20,
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

    const runtime = await fetchLensSectionRuntime(
      {
        source: 'rss',
        baseUrl: 'https://blog.example.com/feed.xml',
        lensKind: 'general',
        sourceId: 'acc-test',
      },
      20,
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

    const runtime = await fetchLensSectionRuntime(
      {
        source: 'github',
        baseUrl: 'https://github.com',
        lensKind: 'general',
        sourceId: 'acc-test',
      },
      20,
    );

    expect(runtime.state).toBe('needs-access');
    expect(ghFetch).not.toHaveBeenCalled();
  });

  test('a granted origin dispatches to the connector', async () => {
    const result = { state: 'ok' as const, items: [], fetchedAt: 1 };
    const glFetch = vi.spyOn(CONNECTORS.gitlab, 'fetchRuntime').mockResolvedValue(result);
    chromeStub.permissions.contains.mockResolvedValue(true);
    const glCfg = {
      source: 'gitlab' as const,
      baseUrl: 'https://gitlab.example.com',
      lensKind: 'general' as const,
      sourceId: 'acc-test' as const,
    };

    const runtime = await fetchLensSectionRuntime(glCfg, 20);

    expect(runtime).toBe(result);
    expect(glFetch).toHaveBeenCalledWith(glCfg, 20, undefined);
  });
});

// ── host-permission sync: grant heals, revoke gates (design D5/D9) ──────────────

describe('reconcileLensGrants', () => {
  test('on grant: a needs-access folder refetches (needs-access → pending → ok)', async () => {
    const okRuntime = {
      state: 'ok' as const,
      items: [{ id: 'x', title: 't', url: 'https://u' }],
      fetchedAt: 1,
    };
    vi.spyOn(CONNECTORS.gitlab, 'fetchRuntime').mockResolvedValue(okRuntime);
    chromeStub.permissions.contains.mockResolvedValue(true);
    const store = makeStoreWithLenses([node({ id: 'sf-1' })]);
    store.state.lenses['sf-1'] = {
      sections: {
        'acc:gitlab:https://gitlab.example.com:review-requested': {
          state: 'needs-access',
          items: [],
          fetchedAt: Date.now(),
        },
      },
    };
    const events: LensesResultEvent[] = [];

    await reconcileLensGrants({ store, enqueue: (e) => events.push(e) });

    expect(events.map((e) => e.payload.runtime.state)).toEqual(['pending', 'ok']);
    expect(events.at(-1)?.payload.folderId).toBe('sf-1');
  });

  test('on revoke: an ok folder whose origins are no longer granted drops to needs-access', async () => {
    chromeStub.permissions.contains.mockResolvedValue(false);
    const store = makeStoreWithLenses([node({ id: 'sf-1' })]);
    store.state.lenses['sf-1'] = {
      sections: {
        'acc:gitlab:https://gitlab.example.com:review-requested': {
          state: 'ok',
          items: [{ id: 'x', title: 't', url: 'https://u' }],
          fetchedAt: Date.now(),
        },
      },
    };
    const events: LensesResultEvent[] = [];

    await reconcileLensGrants({ store, enqueue: (e) => events.push(e) });

    expect(events).toHaveLength(1);
    expect(events[0]?.payload).toEqual({
      folderId: 'sf-1',
      sourceKey: 'acc:gitlab:https://gitlab.example.com:review-requested',
      runtime: { state: 'needs-access', items: [], fetchedAt: expect.any(Number) },
    });
  });

  test('on grant: an already-ok, not-due folder is left alone (no needless poll)', async () => {
    chromeStub.permissions.contains.mockResolvedValue(true);
    const store = makeStoreWithLenses([node({ id: 'sf-1', refreshMinutes: 30 })]);
    store.state.lenses['sf-1'] = {
      sections: {
        'acc:gitlab:https://gitlab.example.com:review-requested': {
          state: 'ok',
          items: [],
          fetchedAt: Date.now(),
        },
      },
    };
    const events: LensesResultEvent[] = [];

    await reconcileLensGrants({ store, enqueue: (e) => events.push(e) });

    expect(events).toHaveLength(0);
  });

  test('a folder already in needs-access is not re-enqueued on a still-ungranted change', async () => {
    chromeStub.permissions.contains.mockResolvedValue(false);
    const store = makeStoreWithLenses([node({ id: 'sf-1' })]);
    store.state.lenses['sf-1'] = {
      sections: {
        'acc:gitlab:https://gitlab.example.com:review-requested': {
          state: 'needs-access',
          items: [],
          fetchedAt: Date.now(),
        },
      },
    };
    const events: LensesResultEvent[] = [];

    await reconcileLensGrants({ store, enqueue: (e) => events.push(e) });

    expect(events).toHaveLength(0);
  });

  test('registerLensesPermissionSync reconciles on a change and unsubscribes', async () => {
    chromeStub.permissions.contains.mockResolvedValue(false);
    const store = makeStoreWithLenses([node({ id: 'sf-1' })]);
    store.state.lenses['sf-1'] = {
      sections: {
        'acc:gitlab:https://gitlab.example.com:review-requested': {
          state: 'ok',
          items: [],
          fetchedAt: Date.now(),
        },
      },
    };
    const events: LensesResultEvent[] = [];

    const unsubscribe = registerLensesPermissionSync({
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
      isDue(
        folder,
        {
          'sf-1': {
            sections: {
              'gitlab:gitlab.example.com': { state: 'ok', items: [], fetchedAt: now - 4 * 60_000 },
            },
          },
        },
        now,
      ),
    ).toBe(false);
    expect(
      isDue(
        folder,
        {
          'sf-1': {
            sections: {
              'gitlab:gitlab.example.com': { state: 'ok', items: [], fetchedAt: now - 6 * 60_000 },
            },
          },
        },
        now,
      ),
    ).toBe(true);
  });

  test('refreshDueLenses refreshes only due folders', async () => {
    const now = Date.now();
    const a = node({
      id: 'sf-a',
      refreshMinutes: 5,
      sources: [{ source: 'gitlab', baseUrl: 'https://gitlab.example.com', queries: ['authored'] }],
    });
    const b = node({
      id: 'sf-b',
      refreshMinutes: 30,
      sources: [{ source: 'gitlab', baseUrl: 'https://gitlab.example.com', queries: ['authored'] }],
    });
    const store = makeStoreWithLenses([a, b]);
    store.state.lenses['sf-a'] = {
      sections: {
        'gitlab:gitlab.example.com': { state: 'ok', items: [], fetchedAt: now - 6 * 60_000 },
      },
    };
    store.state.lenses['sf-b'] = {
      sections: {
        'gitlab:gitlab.example.com': { state: 'ok', items: [], fetchedAt: now - 10 * 60_000 },
      },
    };
    fetchMock.mockResolvedValue(jsonResponse([]));
    const events: LensesResultEvent[] = [];

    await refreshDueLenses({ store, enqueue: (e) => events.push(e) });

    const folderIds = new Set(events.map((e) => e.payload.folderId));
    expect(folderIds).toEqual(new Set(['sf-a']));
  });

  test('refreshDueLenses threads ONE ConnectorCaches per cycle (one /user fetch for two folders)', async () => {
    // The once-per-poll-cycle contract: two due review-requested folders on
    // the same instance share one me-resolution because the engine constructs
    // a single caches map per cycle and threads it into every started fetch.
    fetchMock.mockImplementation(async (url: string) => {
      if (url.endsWith('/api/v4/user')) return jsonResponse({ id: 7 });
      return jsonResponse([]);
    });
    const store = makeStoreWithLenses([
      node({
        id: 'sf-a',
        sources: [
          {
            source: 'gitlab',
            baseUrl: 'https://gitlab.example.com',
            queries: ['review-requested'],
          },
        ],
      }),
      node({
        id: 'sf-b',
        sources: [
          {
            source: 'gitlab',
            baseUrl: 'https://gitlab.example.com',
            queries: ['review-requested'],
          },
        ],
      }),
    ]);
    const events: LensesResultEvent[] = [];

    await refreshDueLenses({ store, enqueue: (e) => events.push(e) });

    const userCalls = fetchMock.mock.calls.filter((c) => (c[0] as string).endsWith('/api/v4/user'));
    expect(userCalls).toHaveLength(1);
  });

  test('startLensRefresh enqueues a pending mark, then the result', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse([mr(1, { head_pipeline: { status: 'success' } })]),
    );
    const glAuthoredNode = node({
      sources: [{ source: 'gitlab', baseUrl: 'https://gitlab.example.com', queries: ['authored'] }],
    });
    const store = makeStoreWithLenses([glAuthoredNode]);
    const events: LensesResultEvent[] = [];

    const { started, completion } = startLensRefresh(
      { store, enqueue: (e) => events.push(e) },
      glAuthoredNode,
    );
    expect(started).toBe(true);
    expect(events).toHaveLength(1);
    expect(events[0]?.payload.runtime.state).toBe('pending');
    await completion;
    expect(events).toHaveLength(2);
    expect(events[1]?.payload.runtime.state).toBe('ok');
    expect(events[1]?.payload.runtime.items).toHaveLength(1);
  });

  test('two-source folder produces two result events, each with the correct sourceKey (task 8.3)', async () => {
    fetchMock.mockResolvedValue(jsonResponse([]));
    const glCfg = {
      source: 'gitlab' as const,
      baseUrl: 'https://gitlab.example.com',
      queries: ['authored' as const],
    };
    const ghCfg = {
      source: 'github' as const,
      baseUrl: 'https://github.com',
      queries: ['authored' as const],
    };
    const multiNode = node({ id: 'sf-multi', sources: [glCfg, ghCfg] });
    const store = makeStoreWithLenses([multiNode]);
    const events: LensesResultEvent[] = [];

    const { completion } = startLensRefresh({ store, enqueue: (e) => events.push(e) }, multiNode);
    await completion;

    const resultEvents = events.filter((e) => e.payload.runtime.state !== 'pending');
    const sourceKeys = resultEvents.map((e) => e.payload.sourceKey);
    expect(sourceKeys).toContain('acc:gitlab:https://gitlab.example.com:authored');
    expect(sourceKeys).toContain('acc:github:https://github.com:authored');
    expect(resultEvents.every((e) => e.payload.folderId === 'sf-multi')).toBe(true);
  });

  test('partial needs-access: one ungranted section needs-access; granted section fetches (task 8.4)', async () => {
    const glCfg = {
      source: 'gitlab' as const,
      baseUrl: 'https://gitlab.example.com',
      queries: ['authored' as const],
    };
    const ghCfg = {
      source: 'github' as const,
      baseUrl: 'https://github.com',
      queries: ['authored' as const],
    };
    const multiNode = node({ id: 'sf-mixed', sources: [glCfg, ghCfg] });
    const store = makeStoreWithLenses([multiNode]);
    fetchMock.mockResolvedValue(jsonResponse([]));
    // gitlab origin granted; github (fetches api.github.com) is NOT granted
    chromeStub.permissions.contains.mockImplementation(
      async ({ origins }: { origins: string[] }) =>
        origins[0]?.includes('gitlab.example.com') ?? false,
    );
    const events: LensesResultEvent[] = [];

    const { completion } = startLensRefresh({ store, enqueue: (e) => events.push(e) }, multiNode);
    await completion;

    const results = events.filter((e) => e.payload.runtime.state !== 'pending');
    const byKey = Object.fromEntries(
      results.map((e) => [e.payload.sourceKey, e.payload.runtime.state]),
    );
    expect(byKey['acc:gitlab:https://gitlab.example.com:authored']).toBe('ok');
    expect(byKey['acc:github:https://github.com:authored']).toBe('needs-access');
  });

  test('a folder already in flight is not re-fired', async () => {
    let resolveFetch: (value: unknown) => void = () => undefined;
    fetchMock.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveFetch = resolve;
      }),
    );
    const glAuthoredNode = node({
      sources: [{ source: 'gitlab', baseUrl: 'https://gitlab.example.com', queries: ['authored'] }],
    });
    const store = makeStoreWithLenses([glAuthoredNode]);
    const events: LensesResultEvent[] = [];
    const deps = { store, enqueue: (e: LensesResultEvent) => events.push(e) };

    const first = startLensRefresh(deps, glAuthoredNode);
    const second = startLensRefresh(deps, glAuthoredNode);
    expect(first.started).toBe(true);
    expect(second.started).toBe(false);
    resolveFetch(jsonResponse([]));
    await first.completion;
    // One pending mark + one result — never doubled.
    expect(events).toHaveLength(2);
  });

  test('syncLensesAlarm clears the alarm when no lenses exist', async () => {
    const store = makeStoreWithLenses([]);
    await syncLensesAlarm(store);
    expect(chromeStub.alarms.clear).toHaveBeenCalledWith(LENSES_ALARM_NAME);
    expect(chromeStub.alarms.create).not.toHaveBeenCalled();
  });

  test('syncLensesAlarm registers at the minimum cadence across folders', async () => {
    const store = makeStoreWithLenses([
      node({ id: 'a', refreshMinutes: 30 }),
      node({ id: 'b', refreshMinutes: 10 }),
    ]);
    await syncLensesAlarm(store);
    expect(chromeStub.alarms.create).toHaveBeenCalledWith(LENSES_ALARM_NAME, {
      periodInMinutes: 10,
    });
  });

  test('collectLenses gathers lens nodes across Spaces, ignoring other kinds', () => {
    const store = makeStoreWithLenses([node({ id: 'a' })]);
    store.state.pinnedBySpace.work?.push({ kind: 'tab', id: 't1' });
    store.state.pinnedBySpace.other = [node({ id: 'b' })];
    expect(collectLenses(store.state).map((n) => n.id)).toEqual(['a', 'b']);
  });
});

// ── the parallel state-request refresh kick ────────────────────────────────────

describe('registerLensesRefreshKick', () => {
  test('kicks the due-check on state-request without claiming the response channel', async () => {
    const store = makeStoreWithLenses([
      node({
        sources: [
          { source: 'gitlab', baseUrl: 'https://gitlab.example.com', queries: ['authored'] },
        ],
      }),
    ]); // null fetchedAt → due
    fetchMock.mockResolvedValue(jsonResponse([]));
    const events: LensesResultEvent[] = [];
    registerLensesRefreshKick({ store, enqueue: (e) => events.push(e) });
    const listener = chromeStub.runtime.onMessage.addListener.mock.calls[0]?.[0] as (
      raw: unknown,
      sender: { id: string },
    ) => unknown;
    const self = { id: chromeStub.runtime.id };

    // The listener NEVER returns true (it never claims the response channel) —
    // the snapshot handler is free to respond synchronously and unblocked.
    const returned = listener({ type: 'lunma/state-request' }, self);
    expect(returned).toBeUndefined();

    await vi.waitFor(() => {
      expect(events.length).toBeGreaterThan(0);
    });
    expect(events[0]?.payload.folderId).toBe('sf-1');
  });

  test('ignores unrelated message types', async () => {
    const store = makeStoreWithLenses([
      node({
        sources: [
          { source: 'gitlab', baseUrl: 'https://gitlab.example.com', queries: ['authored'] },
        ],
      }),
    ]);
    const events: LensesResultEvent[] = [];
    registerLensesRefreshKick({ store, enqueue: (e) => events.push(e) });
    const listener = chromeStub.runtime.onMessage.addListener.mock.calls[0]?.[0] as (
      raw: unknown,
      sender: { id: string },
    ) => unknown;
    const self = { id: chromeStub.runtime.id };

    expect(listener({ type: 'lunma/command' }, self)).toBeUndefined();
    expect(listener(null, self)).toBeUndefined();
    expect(listener('nope', self)).toBeUndefined();
    await Promise.resolve();
    expect(events).toHaveLength(0);
  });

  test('defers the due-check until whenReady resolves (never reads a half-loaded store)', async () => {
    const store = makeStoreWithLenses([
      node({
        sources: [
          { source: 'gitlab', baseUrl: 'https://gitlab.example.com', queries: ['authored'] },
        ],
      }),
    ]);
    fetchMock.mockResolvedValue(jsonResponse([]));
    const events: LensesResultEvent[] = [];
    let releaseBoot: () => void = () => undefined;
    const bootReady = new Promise<void>((resolve) => {
      releaseBoot = resolve;
    });
    registerLensesRefreshKick({ store, enqueue: (e) => events.push(e) }, bootReady);
    const listener = chromeStub.runtime.onMessage.addListener.mock.calls[0]?.[0] as (
      raw: unknown,
      sender: { id: string },
    ) => unknown;
    const self = { id: chromeStub.runtime.id };

    listener({ type: 'lunma/state-request' }, self);
    await Promise.resolve();
    expect(events).toHaveLength(0); // boot not finished — nothing fired
    releaseBoot();
    await vi.waitFor(() => {
      expect(events.length).toBeGreaterThan(0);
    });
  });
});
