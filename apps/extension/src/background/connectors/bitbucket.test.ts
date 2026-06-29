import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import type { ResolvedLensSource } from '../../shared/types';
import { bitbucketConnector } from './bitbucket';

// ── test plumbing ──────────────────────────────────────────────────────────────

interface ChromeStub {
  storage: { local: { get: ReturnType<typeof vi.fn>; set: ReturnType<typeof vi.fn> } };
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
  };
  (globalThis as unknown as { chrome: unknown }).chrome = chromeStub;
}

/** Minimal Response stand-in — bitbucketGet reads only status/ok/json(). */
function jsonResponse(body: unknown, status = 200): unknown {
  return { status, ok: status >= 200 && status < 300, json: async () => body };
}

let fetchMock: ReturnType<typeof vi.fn>;

type FetchRoute = [match: (url: string) => boolean, respond: (url: string) => unknown];

/** Wire the fetch mock with a by-URL router; unmatched URLs throw. */
function routeFetch(routes: FetchRoute[]): void {
  fetchMock.mockImplementation(async (url: string) => {
    for (const [match, respond] of routes) {
      if (match(url)) return respond(url);
    }
    throw new Error(`unrouted fetch: ${url}`);
  });
}

// Tokens are keyed by the account's `sourceId` (connector-accounts).
const CLOUD_TOKEN = { 'lunma.connectors': { 'acc-bb-cloud': 'bb-cloud-token' } };
const SERVER_TOKEN = { 'lunma.connectors': { 'acc-bb-server': 'bb-server-token' } };

function cloudNode(overrides: Partial<ResolvedLensSource> = {}): ResolvedLensSource {
  return {
    source: 'bitbucket',
    baseUrl: 'https://bitbucket.org',
    query: 'authored',
    lensKind: 'review',
    sourceId: 'acc-bb-cloud',
    workspace: 'acme',
    ...overrides,
  };
}

function serverNode(overrides: Partial<ResolvedLensSource> = {}): ResolvedLensSource {
  return {
    source: 'bitbucket',
    baseUrl: 'https://bitbucket.example.com',
    query: 'authored',
    lensKind: 'review',
    sourceId: 'acc-bb-server',
    ...overrides,
  };
}

// ── fixtures ─────────────────────────────────────────────────────────────────

function serverPr(id: number, over: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id,
    title: `PR ${id}`,
    author: { user: { name: 'alice', displayName: 'Alice' } },
    reviewers: [
      { user: { name: 'bob' }, approved: false, status: 'NEEDS_WORK' },
      { user: { name: 'carol' }, approved: true, status: 'APPROVED' },
    ],
    fromRef: { displayId: 'feature' },
    toRef: { displayId: 'main', repository: { slug: 'repo', project: { key: 'PROJ' } } },
    updatedDate: 1_700_000_000_000,
    links: {
      self: [{ href: `https://bitbucket.example.com/.../pull-requests/${id}` }],
    },
    ...over,
  };
}

function serverPage(values: unknown[], over: Record<string, unknown> = {}): unknown {
  return jsonResponse({ values, isLastPage: true, ...over });
}

function cloudPr(id: number, over: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id,
    title: `PR ${id}`,
    draft: false,
    author: { display_name: 'Alice', nickname: 'alice' },
    source: { branch: { name: 'feature' } },
    destination: { branch: { name: 'main' }, repository: { full_name: 'acme/repo' } },
    updated_on: '2023-11-14T00:00:00.000Z',
    links: {
      html: { href: `https://bitbucket.org/acme/repo/pull-requests/${id}` },
      self: { href: `https://api.bitbucket.org/2.0/repositories/acme/repo/pullrequests/${id}` },
    },
    ...over,
  };
}

function cloudListPage(values: unknown[], over: Record<string, unknown> = {}): unknown {
  return jsonResponse({ values, ...over });
}

beforeEach(() => {
  installChromeStub();
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

// ── Server / Data Center ───────────────────────────────────────────────────────

describe('Server / Data Center', () => {
  test('authored lists the dashboard with role=AUTHOR and inline reviewers', async () => {
    storageData = { ...SERVER_TOKEN };
    routeFetch([[(u) => u.includes('/dashboard/pull-requests'), () => serverPage([serverPr(1)])]]);
    const runtime = await bitbucketConnector.fetchRuntime(serverNode({ query: 'authored' }), 20);
    expect(runtime.state).toBe('ok');
    const url = fetchMock.mock.calls[0]?.[0] as string;
    expect(url).toContain('https://bitbucket.example.com/rest/api/1.0/dashboard/pull-requests');
    expect(url).toContain('state=OPEN');
    expect(url).toContain('role=AUTHOR');
    // No identity lookup on the Server path.
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const item = runtime.items[0];
    expect(item?.change).toBeDefined();
    expect(item?.change?.author).toBe('alice');
    expect(item?.change?.repo).toBe('PROJ/repo');
    expect(item?.change?.targetBranch).toBe('main');
    expect(item?.change?.draft).toBe(false);
    // Reviewer verdicts map NEEDS_WORK → changes, APPROVED → approved.
    expect(item?.change?.reviewers).toEqual([
      { login: 'bob', state: 'changes' },
      { login: 'carol', state: 'approved' },
    ]);
  });

  test('review-requested lists the dashboard with role=REVIEWER', async () => {
    storageData = { ...SERVER_TOKEN };
    routeFetch([[(u) => u.includes('/dashboard/pull-requests'), () => serverPage([serverPr(2)])]]);
    const runtime = await bitbucketConnector.fetchRuntime(
      serverNode({ query: 'review-requested' }),
      20,
    );
    expect(runtime.state).toBe('ok');
    expect(fetchMock.mock.calls[0]?.[0]).toContain('role=REVIEWER');
  });

  test('slices to maxItems', async () => {
    storageData = { ...SERVER_TOKEN };
    routeFetch([
      [
        (u) => u.includes('/dashboard/pull-requests'),
        () => serverPage([serverPr(1), serverPr(2), serverPr(3)]),
      ],
    ]);
    const runtime = await bitbucketConnector.fetchRuntime(serverNode(), 2);
    expect(runtime.items).toHaveLength(2);
  });
});

// ── Cloud ──────────────────────────────────────────────────────────────────────

describe('Cloud', () => {
  test('authored resolves the uuid, lists the workspace PRs, and fetches reviewers per PR', async () => {
    storageData = { ...CLOUD_TOKEN };
    routeFetch([
      [(u) => u.endsWith('/2.0/user'), () => jsonResponse({ uuid: '{abc-uuid}' })],
      [(u) => u.includes('/2.0/workspaces/acme/pullrequests/'), () => cloudListPage([cloudPr(1)])],
      [
        (u) => u.includes('/2.0/repositories/acme/repo/pullrequests/1'),
        () =>
          jsonResponse({
            participants: [
              { user: { nickname: 'bob' }, role: 'REVIEWER', state: 'changes_requested' },
              { user: { nickname: 'carol' }, role: 'REVIEWER', approved: true, state: 'approved' },
              // A non-reviewer participant is ignored.
              { user: { nickname: 'dave' }, role: 'PARTICIPANT', state: 'approved' },
            ],
          }),
      ],
    ]);
    const runtime = await bitbucketConnector.fetchRuntime(cloudNode({ query: 'authored' }), 20);
    expect(runtime.state).toBe('ok');
    // /2.0/user first, then the workspace list, then the per-PR detail.
    expect(fetchMock.mock.calls[0]?.[0]).toBe('https://api.bitbucket.org/2.0/user');
    const listUrl = fetchMock.mock.calls[1]?.[0] as string;
    expect(listUrl).toContain('/2.0/workspaces/acme/pullrequests/');
    expect(listUrl).toContain(encodeURIComponent('{abc-uuid}'));
    expect(listUrl).toContain(encodeURIComponent('state="OPEN"'));
    const item = runtime.items[0];
    expect(item?.url).toBe('https://bitbucket.org/acme/repo/pull-requests/1');
    expect(item?.change?.author).toBe('Alice');
    expect(item?.change?.repo).toBe('acme/repo');
    expect(item?.change?.targetBranch).toBe('main');
    expect(item?.change?.reviewers).toEqual([
      { login: 'bob', state: 'changes' },
      { login: 'carol', state: 'approved' },
    ]);
  });

  test('the per-PR reviewer fetch is capped at maxItems', async () => {
    storageData = { ...CLOUD_TOKEN };
    let detailFetches = 0;
    routeFetch([
      [(u) => u.endsWith('/2.0/user'), () => jsonResponse({ uuid: '{u}' })],
      [
        (u) => u.includes('/2.0/workspaces/acme/pullrequests/'),
        () => cloudListPage([cloudPr(1), cloudPr(2), cloudPr(3)]),
      ],
      [
        (u) => u.includes('/2.0/repositories/'),
        () => {
          detailFetches += 1;
          return jsonResponse({ participants: [] });
        },
      ],
    ]);
    const runtime = await bitbucketConnector.fetchRuntime(cloudNode(), 2);
    expect(runtime.items).toHaveLength(2);
    expect(detailFetches).toBe(2);
  });

  test('draft PRs carry the draft flag and a "Draft:" title prefix', async () => {
    storageData = { ...CLOUD_TOKEN };
    routeFetch([
      [(u) => u.endsWith('/2.0/user'), () => jsonResponse({ uuid: '{u}' })],
      [
        (u) => u.includes('/2.0/workspaces/acme/pullrequests/'),
        () => cloudListPage([cloudPr(7, { draft: true })]),
      ],
      [(u) => u.includes('/2.0/repositories/'), () => jsonResponse({ participants: [] })],
    ]);
    const runtime = await bitbucketConnector.fetchRuntime(cloudNode(), 20);
    expect(runtime.items[0]?.title).toBe('Draft: PR 7');
    expect(runtime.items[0]?.change?.draft).toBe(true);
  });

  test('review-requested resolves to error WITHOUT any request (authored-only)', async () => {
    storageData = { ...CLOUD_TOKEN };
    const runtime = await bitbucketConnector.fetchRuntime(
      cloudNode({ query: 'review-requested' }),
      20,
    );
    expect(runtime.state).toBe('error');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

// ── auth ─────────────────────────────────────────────────────────────────────

describe('auth', () => {
  test('no token short-circuits to signed-out WITHOUT a request', async () => {
    storageData = {}; // no token for the account
    const runtime = await bitbucketConnector.fetchRuntime(cloudNode(), 20);
    expect(runtime.state).toBe('signed-out');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('the token rides as a Bearer header with omitted credentials', async () => {
    storageData = { ...SERVER_TOKEN };
    routeFetch([[(u) => u.includes('/dashboard/pull-requests'), () => serverPage([])]]);
    await bitbucketConnector.fetchRuntime(serverNode(), 20);
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit & {
      headers: Record<string, string>;
    };
    expect(init.headers.Authorization).toBe('Bearer bb-server-token');
    expect(init.credentials).toBe('omit');
  });

  test('a 401 resolves signed-out', async () => {
    storageData = { ...SERVER_TOKEN };
    routeFetch([[(u) => u.includes('/dashboard/pull-requests'), () => jsonResponse({}, 401)]]);
    const runtime = await bitbucketConnector.fetchRuntime(serverNode(), 20);
    expect(runtime.state).toBe('signed-out');
  });

  test('a network failure / timeout resolves error', async () => {
    storageData = { ...SERVER_TOKEN };
    fetchMock.mockRejectedValue(new Error('AbortError'));
    const runtime = await bitbucketConnector.fetchRuntime(serverNode(), 20);
    expect(runtime.state).toBe('error');
  });
});

// ── requiredOrigins / listingUrl ───────────────────────────────────────────────

describe('requiredOrigins and listingUrl', () => {
  test('Cloud fetches api.bitbucket.org; Server is same-origin', () => {
    expect(bitbucketConnector.requiredOrigins(cloudNode())).toEqual([
      'https://api.bitbucket.org/*',
    ]);
    expect(bitbucketConnector.requiredOrigins(serverNode())).toEqual([
      'https://bitbucket.example.com/*',
    ]);
  });

  test('listingUrl is the Cloud dashboard or the Server instance dashboard', () => {
    expect(bitbucketConnector.listingUrl(cloudNode())).toBe(
      'https://bitbucket.org/dashboard/pullrequests',
    );
    expect(bitbucketConnector.listingUrl(serverNode())).toBe(
      'https://bitbucket.example.com/dashboard',
    );
  });
});
