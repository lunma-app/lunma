import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import type { ResolvedLensSource } from '../../shared/types';
import { aggregateCheckRuns, apiRootOf, githubConnector } from './github';

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

/** Minimal Response stand-in — githubGet reads only status/ok/json(). */
function jsonResponse(body: unknown, status = 200): unknown {
  return { status, ok: status >= 200 && status < 300, json: async () => body };
}

let fetchMock: ReturnType<typeof vi.fn>;

function node(overrides: Partial<ResolvedLensSource> = {}): ResolvedLensSource {
  return {
    source: 'github',
    baseUrl: 'https://github.com',
    query: 'authored',
    lensKind: 'general',
    // Per-source token key (connector-accounts) — the token is looked up by this
    // `sourceId`, not by host.
    sourceId: 'acc-gh',
    ...overrides,
  };
}

/** A search-API item. `pull_request.url` points at the API PR detail. */
function pr(id: number, overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id,
    title: `PR ${id}`,
    html_url: `https://github.com/o/r/pull/${id}`,
    pull_request: { url: `https://api.github.com/repos/o/r/pulls/${id}` },
    ...overrides,
  };
}

function prDetail(id: number, overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    draft: false,
    head: { sha: `sha-${id}` },
    base: { repo: { full_name: 'o/r' } },
    ...overrides,
  };
}

function searchResponse(items: unknown[]): unknown {
  return jsonResponse({ total_count: items.length, items });
}

function checkRunsResponse(runs: Array<{ status: string; conclusion: string | null }>): unknown {
  return jsonResponse({ total_count: runs.length, check_runs: runs });
}

type FetchRoute = [match: (url: string) => boolean, respond: (url: string) => unknown];

/**
 * Wire the fetch mock with a by-URL router; unmatched URLs throw. The
 * lens-overview issue pass fires a SECOND `is:issue` search for the
 * `authored`/`assigned` queries — PR-focused tests don't model it, so we PREPEND
 * a default empty `is:issue` route (it matches before any generic `/search/issues`
 * matcher would). A test exercising the issue pass supplies its own `is:issue`
 * route, which then wins over this default since it is checked first.
 */
function routeFetch(routes: FetchRoute[]): void {
  const hasIssueRoute = routes.some(([match]) => match('?q=is:issue+is:open'));
  const all: FetchRoute[] = hasIssueRoute
    ? routes
    : [[(u) => u.includes('is:issue'), () => searchResponse([])], ...routes];
  fetchMock.mockImplementation(async (url: string) => {
    for (const [match, respond] of all) {
      if (match(url)) return respond(url);
    }
    throw new Error(`unrouted fetch: ${url}`);
  });
}

// The token is keyed by the account's `sourceId` (connector-accounts), matching
// the `node()` fixture's `sourceId: 'acc-gh'`.
const TOKEN = { 'lunma.connectors': { 'acc-gh': 'ghp-abc' } };

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

// ── apiRoot derivation (D3) ────────────────────────────────────────────────────

describe('apiRootOf', () => {
  test('github.com maps to https://api.github.com', () => {
    expect(apiRootOf('https://github.com')).toBe('https://api.github.com');
  });

  test('any other host maps to {baseUrl}/api/v3 (GHE REST root)', () => {
    expect(apiRootOf('https://ghe.example.com')).toBe('https://ghe.example.com/api/v3');
  });

  test('a GHE host with an explicit port keeps the full baseUrl', () => {
    expect(apiRootOf('https://ghe.example.com:8443')).toBe('https://ghe.example.com:8443/api/v3');
  });
});

// ── canned queries (D3) ────────────────────────────────────────────────────────

describe('fetchRuntime — canned queries', () => {
  test('authored requests author:@me with cap, recency sort, and advanced_search', async () => {
    storageData = { ...TOKEN };
    // Both the PR pass and the lens-overview issue pass fire for `authored`.
    fetchMock.mockResolvedValue(searchResponse([]));
    const runtime = await githubConnector.fetchRuntime(node({ query: 'authored' }), 20);
    // PR search first, then the issue pass — two Search-API calls, no me-resolution.
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      'https://api.github.com/search/issues?q=is:pr+is:open+author:@me&per_page=20&sort=updated&order=desc&advanced_search=true',
    );
    expect(fetchMock.mock.calls[1]?.[0]).toBe(
      'https://api.github.com/search/issues?q=is:issue+is:open+author:@me&per_page=20&sort=updated&order=desc&advanced_search=true',
    );
    expect(runtime.state).toBe('ok');
  });

  test('assigned requests assignee:@me', async () => {
    storageData = { ...TOKEN };
    fetchMock.mockResolvedValue(searchResponse([]));
    await githubConnector.fetchRuntime(node({ query: 'assigned' }), 20);
    expect(fetchMock.mock.calls[0]?.[0]).toContain('q=is:pr+is:open+assignee:@me');
  });

  test('review-requested requests review-requested:@me with NO me-resolution call', async () => {
    storageData = { ...TOKEN };
    fetchMock.mockResolvedValueOnce(searchResponse([]));
    await githubConnector.fetchRuntime(node({ query: 'review-requested' }), 20);
    // Exactly one request — `@me` resolves server-side; there is no /user step.
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      'https://api.github.com/search/issues?q=is:pr+is:open+review-requested:@me&per_page=20&sort=updated&order=desc&advanced_search=true',
    );
  });

  test('a GHE folder derives its API root from baseUrl', async () => {
    storageData = { 'lunma.connectors': { 'acc-gh': 'ghp-ghe' } };
    fetchMock.mockResolvedValue(searchResponse([]));
    await githubConnector.fetchRuntime(
      node({ baseUrl: 'https://ghe.example.com', query: 'authored' }),
      20,
    );
    const url = fetchMock.mock.calls[0]?.[0] as string;
    expect(url.startsWith('https://ghe.example.com/api/v3/search/issues?')).toBe(true);
    expect(url).toContain('advanced_search=true');
  });

  test('requests carry the GitHub Accept header, Bearer token, and omitted credentials', async () => {
    storageData = { ...TOKEN };
    fetchMock.mockResolvedValue(searchResponse([]));
    await githubConnector.fetchRuntime(node({ query: 'authored' }), 20);
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(init.headers).toEqual({
      Authorization: 'Bearer ghp-abc',
      Accept: 'application/vnd.github+json',
    });
    expect(init.credentials).toBe('omit');
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  test('items map id/url/title from the search item', async () => {
    storageData = { ...TOKEN };
    routeFetch([
      [(u) => u.includes('/search/issues'), () => searchResponse([pr(7)])],
      [(u) => u.includes('/pulls/'), () => jsonResponse(prDetail(7))],
      [(u) => u.includes('/check-runs'), () => checkRunsResponse([])],
    ]);
    const runtime = await githubConnector.fetchRuntime(node({ query: 'authored' }), 20);
    expect(runtime.state).toBe('ok');
    expect(runtime.items).toEqual([
      { id: '7', title: 'PR 7', url: 'https://github.com/o/r/pull/7' },
    ]);
  });

  test('results cap at 20 even if the server over-returns', async () => {
    storageData = { ...TOKEN };
    routeFetch([
      [
        (u) => u.includes('/search/issues'),
        () => searchResponse(Array.from({ length: 25 }, (_, i) => pr(i + 1))),
      ],
      [(u) => u.includes('/pulls/'), (u) => jsonResponse(prDetail(Number(u.split('/').pop())))],
      [(u) => u.includes('/check-runs'), () => checkRunsResponse([])],
    ]);
    const runtime = await githubConnector.fetchRuntime(node({ query: 'authored' }), 20);
    expect(runtime.items).toHaveLength(20);
  });

  test('a malformed search item is dropped, the rest survive', async () => {
    storageData = { ...TOKEN };
    routeFetch([
      [(u) => u.includes('/search/issues'), () => searchResponse([pr(1), { junk: true }])],
      [(u) => u.includes('/pulls/'), () => jsonResponse(prDetail(1))],
      [(u) => u.includes('/check-runs'), () => checkRunsResponse([])],
    ]);
    const runtime = await githubConnector.fetchRuntime(node({ query: 'authored' }), 20);
    expect(runtime.state).toBe('ok');
    expect(runtime.items.map((i) => i.id)).toEqual(['1']);
  });
});

// ── token-only auth (D4) ───────────────────────────────────────────────────────

describe('fetchRuntime — token-only auth', () => {
  test('no token short-circuits to signed-out with ZERO fetches', async () => {
    const runtime = await githubConnector.fetchRuntime(node({ query: 'authored' }), 20);
    expect(runtime).toMatchObject({ state: 'signed-out', items: [] });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('the token lookup is keyed by sourceId: another account token does not authorize', async () => {
    storageData = { 'lunma.connectors': { 'acc-other': 'ghp-other' } };
    const runtime = await githubConnector.fetchRuntime(node({ query: 'authored' }), 20);
    expect(runtime.state).toBe('signed-out');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('two accounts on the SAME host hold distinct tokens (keyed by sourceId)', async () => {
    storageData = { 'lunma.connectors': { 'acc-a': 'ghp-a', 'acc-b': 'ghp-b' } };
    fetchMock.mockResolvedValue(searchResponse([]));
    await githubConnector.fetchRuntime(
      node({ query: 'authored', sourceId: 'acc-a', baseUrl: 'https://github.com' }),
      20,
    );
    expect((fetchMock.mock.calls[0]?.[1] as RequestInit | undefined)?.headers).toMatchObject({
      Authorization: 'Bearer ghp-a',
    });
    // acc-a's PR pass + issue pass are calls 0 and 1; acc-b's PR pass is call 2.
    await githubConnector.fetchRuntime(
      node({ query: 'authored', sourceId: 'acc-b', baseUrl: 'https://github.com' }),
      20,
    );
    expect((fetchMock.mock.calls[2]?.[1] as RequestInit | undefined)?.headers).toMatchObject({
      Authorization: 'Bearer ghp-b',
    });
  });

  test('declares pat-only authMethods', () => {
    expect(githubConnector.authMethods).toEqual(['pat']);
  });

  test('a 401 (revoked token) resolves signed-out, never throwing', async () => {
    storageData = { ...TOKEN };
    fetchMock.mockResolvedValueOnce(jsonResponse({ message: 'Bad credentials' }, 401));
    const runtime = await githubConnector.fetchRuntime(node({ query: 'authored' }), 20);
    expect(runtime).toMatchObject({ state: 'signed-out', items: [] });
  });

  test('a 403 (rate limit / SAML / scope gap) resolves error', async () => {
    storageData = { ...TOKEN };
    fetchMock.mockResolvedValueOnce(jsonResponse({ message: 'API rate limit exceeded' }, 403));
    const runtime = await githubConnector.fetchRuntime(node({ query: 'authored' }), 20);
    expect(runtime.state).toBe('error');
  });

  test('a 5xx resolves error', async () => {
    storageData = { ...TOKEN };
    fetchMock.mockResolvedValueOnce(jsonResponse({ message: 'boom' }, 502));
    const runtime = await githubConnector.fetchRuntime(node({ query: 'authored' }), 20);
    expect(runtime.state).toBe('error');
  });

  test('a network failure resolves error', async () => {
    storageData = { ...TOKEN };
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    const runtime = await githubConnector.fetchRuntime(node({ query: 'authored' }), 20);
    expect(runtime.state).toBe('error');
  });

  test('a timed-out request (AbortError) resolves error like any network failure', async () => {
    storageData = { ...TOKEN };
    fetchMock.mockRejectedValueOnce(new DOMException('signal timed out', 'TimeoutError'));
    const runtime = await githubConnector.fetchRuntime(node({ query: 'authored' }), 20);
    expect(runtime.state).toBe('error');
  });
});

// ── check-run aggregation (D5) ─────────────────────────────────────────────────

describe('aggregateCheckRuns', () => {
  const completed = (conclusion: string | null): { status: string; conclusion: string | null } => ({
    status: 'completed',
    conclusion,
  });

  test('any failing conclusion wins: fail > everything', () => {
    expect(
      aggregateCheckRuns([
        completed('success'),
        { status: 'in_progress', conclusion: null },
        completed('failure'),
      ]),
    ).toEqual({ tone: 'fail', label: 'Checks failed' });
    expect(aggregateCheckRuns([completed('timed_out')])?.tone).toBe('fail');
    expect(aggregateCheckRuns([completed('action_required')])?.tone).toBe('fail');
  });

  test('else any incomplete run: pending > ok', () => {
    expect(
      aggregateCheckRuns([completed('success'), { status: 'in_progress', conclusion: null }]),
    ).toEqual({ tone: 'pending', label: 'Checks running' });
    expect(
      aggregateCheckRuns([completed('success'), { status: 'queued', conclusion: null }])?.tone,
    ).toBe('pending');
  });

  test('else any success: ok > warn', () => {
    expect(aggregateCheckRuns([completed('skipped'), completed('success')])).toEqual({
      tone: 'ok',
      label: 'Checks passed',
    });
  });

  test('else any skipped/cancelled: warn', () => {
    expect(aggregateCheckRuns([completed('skipped')])).toEqual({
      tone: 'warn',
      label: 'Checks skipped',
    });
    expect(aggregateCheckRuns([completed('cancelled')])?.tone).toBe('warn');
  });

  test('zero runs aggregate to no status (absence over guessing)', () => {
    expect(aggregateCheckRuns([])).toBeUndefined();
  });

  test('only-unmapped conclusions (stale, neutral) aggregate to no status', () => {
    expect(aggregateCheckRuns([completed('stale')])).toBeUndefined();
    expect(aggregateCheckRuns([completed('neutral'), completed('stale')])).toBeUndefined();
  });

  test('unmapped conclusions are ignored by the aggregate, not treated as failures', () => {
    expect(aggregateCheckRuns([completed('neutral'), completed('success')])?.tone).toBe('ok');
  });
});

// ── enrichment (D5) ────────────────────────────────────────────────────────────

describe('fetchRuntime — check-run enrichment', () => {
  test('each PR enriches via detail then check-runs at per_page=100 (≤2 requests/PR)', async () => {
    storageData = { ...TOKEN };
    routeFetch([
      [(u) => u.includes('/search/issues'), () => searchResponse([pr(1)])],
      [(u) => u.includes('/pulls/'), () => jsonResponse(prDetail(1))],
      [
        (u) => u.includes('/check-runs'),
        () => checkRunsResponse([{ status: 'completed', conclusion: 'success' }]),
      ],
    ]);
    const runtime = await githubConnector.fetchRuntime(node({ query: 'authored' }), 20);
    // PR search + detail + check-runs, then the lens-overview issue pass.
    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(fetchMock.mock.calls[1]?.[0]).toBe('https://api.github.com/repos/o/r/pulls/1');
    expect(fetchMock.mock.calls[2]?.[0]).toBe(
      'https://api.github.com/repos/o/r/commits/sha-1/check-runs?per_page=100',
    );
    expect(fetchMock.mock.calls[3]?.[0]).toContain('q=is:issue+is:open+author:@me');
    expect(runtime.items[0]?.status).toEqual({ tone: 'ok', label: 'Checks passed' });
  });

  test('a failing run among successes carries the fail dot', async () => {
    storageData = { ...TOKEN };
    routeFetch([
      [(u) => u.includes('/search/issues'), () => searchResponse([pr(1)])],
      [(u) => u.includes('/pulls/'), () => jsonResponse(prDetail(1))],
      [
        (u) => u.includes('/check-runs'),
        () =>
          checkRunsResponse([
            { status: 'completed', conclusion: 'success' },
            { status: 'completed', conclusion: 'failure' },
          ]),
      ],
    ]);
    const runtime = await githubConnector.fetchRuntime(node({ query: 'authored' }), 20);
    expect(runtime.items[0]?.status).toEqual({ tone: 'fail', label: 'Checks failed' });
  });

  test('zero check runs leave the item glyph-less', async () => {
    storageData = { ...TOKEN };
    routeFetch([
      [(u) => u.includes('/search/issues'), () => searchResponse([pr(1)])],
      [(u) => u.includes('/pulls/'), () => jsonResponse(prDetail(1))],
      [(u) => u.includes('/check-runs'), () => checkRunsResponse([])],
    ]);
    const runtime = await githubConnector.fetchRuntime(node({ query: 'authored' }), 20);
    expect(runtime.items[0]?.status).toBeUndefined();
  });

  test('an enrichment failure leaves the item glyph-less, never failing the folder', async () => {
    storageData = { ...TOKEN };
    routeFetch([
      [(u) => u.includes('/search/issues'), () => searchResponse([pr(1)])],
      [
        (u) => u.includes('/pulls/'),
        () => {
          throw new Error('network down');
        },
      ],
    ]);
    const runtime = await githubConnector.fetchRuntime(node({ query: 'authored' }), 20);
    expect(runtime.state).toBe('ok');
    expect(runtime.items[0]?.status).toBeUndefined();
  });

  test('enrichment fan-out is bounded at concurrency 5', async () => {
    storageData = { ...TOKEN };
    let inFlight = 0;
    let maxInFlight = 0;
    fetchMock.mockImplementation(async (url: string) => {
      if (url.includes('/search/issues')) {
        return searchResponse(Array.from({ length: 12 }, (_, i) => pr(i + 1)));
      }
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await new Promise((resolve) => setTimeout(resolve, 1));
      inFlight -= 1;
      if (url.includes('/pulls/')) return jsonResponse(prDetail(Number(url.split('/').pop())));
      return checkRunsResponse([]);
    });
    await githubConnector.fetchRuntime(node({ query: 'authored' }), 20);
    expect(maxInFlight).toBeLessThanOrEqual(5);
  });

  test('a draft PR detail prefixes the title with Draft: ', async () => {
    storageData = { ...TOKEN };
    routeFetch([
      [(u) => u.includes('/search/issues'), () => searchResponse([pr(1), pr(2)])],
      [
        (u) => u.includes('/pulls/'),
        (u) => jsonResponse(prDetail(Number(u.split('/').pop()), { draft: u.endsWith('/1') })),
      ],
      [(u) => u.includes('/check-runs'), () => checkRunsResponse([])],
    ]);
    const runtime = await githubConnector.fetchRuntime(node({ query: 'authored' }), 20);
    expect(runtime.items.map((i) => i.title)).toEqual(['Draft: PR 1', 'PR 2']);
  });
});

// ── maxItems + listingUrl (rss-connector D5/D6) ─────────────────────────────────

describe('maxItems + listingUrl', () => {
  test('the node maxItems drives the per_page cap', async () => {
    storageData = { ...TOKEN };
    fetchMock.mockResolvedValue(searchResponse([]));
    await githubConnector.fetchRuntime(node({ query: 'authored' }), 30);
    expect(fetchMock.mock.calls[0]?.[0]).toContain('per_page=30');
  });

  test('listingUrl is the pull-requests dashboard', () => {
    expect(githubConnector.listingUrl(node())).toBe('https://github.com/pulls');
  });

  test('requiredOrigins: github.com fetches api.github.com, GHE is same-origin (D8)', () => {
    // The headline correctness case (least-privilege-permissions D8): a
    // github.com folder fetches api.github.com, so the gate must request that —
    // never github.com, which would never authorize the fetch.
    expect(
      githubConnector.requiredOrigins({
        source: 'github',
        baseUrl: 'https://github.com',
        lensKind: 'general',
        sourceId: 'acc-gh',
      }),
    ).toEqual(['https://api.github.com/*']);
    expect(
      githubConnector.requiredOrigins({
        source: 'github',
        baseUrl: 'https://ghe.example.com',
        lensKind: 'general',
        sourceId: 'acc-gh',
      }),
    ).toEqual(['https://ghe.example.com/*']);
  });
});

// ── review-lens enrichment (review-lens, D4/D5) ────────────────────────────────

describe('fetchRuntime — review-lens change enrichment', () => {
  /** A PR detail carrying the review-lens fields. */
  function reviewPrDetail(id: number, overrides: Record<string, unknown> = {}): unknown {
    return jsonResponse({
      draft: false,
      head: { sha: `sha-${id}` },
      base: { ref: 'main', repo: { full_name: 'o/r' } },
      user: { login: 'octo' },
      additions: 112,
      deletions: 40,
      updated_at: '2026-06-24T10:00:00Z',
      requested_reviewers: [{ login: 'pending-rev' }],
      ...overrides,
    });
  }

  function reviewsResponse(reviews: Array<{ login: string; state: string }>): unknown {
    return jsonResponse(reviews.map((r) => ({ user: { login: r.login }, state: r.state })));
  }

  test('a review lens populates change with identity, diff, draft, and reviewer states', async () => {
    storageData = { ...TOKEN };
    routeFetch([
      [(u) => u.includes('/search/issues'), () => searchResponse([pr(7)])],
      [
        (u) => u.includes('/reviews'),
        () => reviewsResponse([{ login: 'alice', state: 'APPROVED' }]),
      ],
      [(u) => u.includes('/pulls/'), () => reviewPrDetail(7)],
      [
        (u) => u.includes('/check-runs'),
        () => checkRunsResponse([{ status: 'completed', conclusion: 'success' }]),
      ],
    ]);
    const runtime = await githubConnector.fetchRuntime(node({ lensKind: 'review' }), 20);
    expect(runtime.state).toBe('ok');
    const item = runtime.items[0];
    expect(item?.change).toEqual({
      author: 'octo',
      repo: 'o/r',
      reviewers: [
        { login: 'alice', state: 'approved' },
        { login: 'pending-rev', state: 'pending' },
      ],
      draft: false,
      additions: 112,
      deletions: 40,
      targetBranch: 'main',
      updatedAt: Date.parse('2026-06-24T10:00:00Z'),
    });
    // CI tone stays on `status`, never duplicated into `change`.
    expect(item?.status).toEqual({ tone: 'ok', label: 'Checks passed' });
  });

  test('CHANGES_REQUESTED maps to changes; COMMENTED carries no verdict', async () => {
    storageData = { ...TOKEN };
    routeFetch([
      [(u) => u.includes('/search/issues'), () => searchResponse([pr(7)])],
      [
        (u) => u.includes('/reviews'),
        () =>
          reviewsResponse([
            { login: 'bob', state: 'CHANGES_REQUESTED' },
            { login: 'carol', state: 'COMMENTED' },
          ]),
      ],
      [(u) => u.includes('/pulls/'), () => reviewPrDetail(7, { requested_reviewers: [] })],
      [(u) => u.includes('/check-runs'), () => checkRunsResponse([])],
    ]);
    const runtime = await githubConnector.fetchRuntime(node({ lensKind: 'review' }), 20);
    // carol only COMMENTED and is not a requested reviewer → absent from the rail.
    expect(runtime.items[0]?.change?.reviewers).toEqual([{ login: 'bob', state: 'changes' }]);
  });

  test('a general lens makes no reviews call and carries no change', async () => {
    storageData = { ...TOKEN };
    let reviewsCalled = false;
    routeFetch([
      [(u) => u.includes('/search/issues'), () => searchResponse([pr(7)])],
      [
        (u) => u.includes('/reviews'),
        () => {
          reviewsCalled = true;
          return reviewsResponse([]);
        },
      ],
      [(u) => u.includes('/pulls/'), () => reviewPrDetail(7)],
      [(u) => u.includes('/check-runs'), () => checkRunsResponse([])],
    ]);
    const runtime = await githubConnector.fetchRuntime(node({ lensKind: 'general' }), 20);
    expect(reviewsCalled).toBe(false);
    expect(runtime.items[0]?.change).toBeUndefined();
  });
});

// ── linked-ticket refs (lens-overview, L0) ──────────────────────────────────────

describe('fetchRuntime — PR linked-ticket refs', () => {
  /** Route a single PR with `title`/`body`, returning the parsed item's refs. */
  async function refsFor(
    title: string,
    body: string | null | undefined,
  ): Promise<import('../../shared/types').EntityRef[] | undefined> {
    storageData = { ...TOKEN };
    routeFetch([
      [(u) => u.includes('/search/issues'), () => searchResponse([pr(1, { title })])],
      [
        (u) => u.includes('/pulls/'),
        () => jsonResponse({ ...prDetail(1), base: { repo: { full_name: 'o/r' } }, body }),
      ],
      [(u) => u.includes('/check-runs'), () => checkRunsResponse([])],
    ]);
    const runtime = await githubConnector.fetchRuntime(node({ query: 'authored' }), 20);
    return runtime.items[0]?.refs;
  }

  test('a Jira key in the title yields a ticket ref with an EMPTY url (L0-honest)', async () => {
    expect(await refsFor('PAY-91 fix the thing', 'no closer here')).toEqual([
      { kind: 'ticket', key: 'PAY-91', url: '', label: 'PAY-91' },
    ]);
  });

  test('a "Closes #88" in the body yields a #88 ref linking to the repo issue', async () => {
    expect(await refsFor('Plain title', 'Some change.\n\nCloses #88')).toEqual([
      { kind: 'ticket', key: '#88', url: 'https://github.com/o/r/issues/88', label: '#88' },
    ]);
  });

  test('Fixes/Resolves are accepted too (verb-gated, case-insensitive)', async () => {
    expect(await refsFor('Plain', 'resolves #5')).toEqual([
      { kind: 'ticket', key: '#5', url: 'https://github.com/o/r/issues/5', label: '#5' },
    ]);
  });

  test('one of EACH kind: a Jira key AND a Closes #N both appear, Jira first', async () => {
    expect(await refsFor('PAY-7 ship', 'Fixes #12')).toEqual([
      { kind: 'ticket', key: 'PAY-7', url: '', label: 'PAY-7' },
      { kind: 'ticket', key: '#12', url: 'https://github.com/o/r/issues/12', label: '#12' },
    ]);
  });

  test('a bare "#42" without a closing verb yields NO ref (verb-gated)', async () => {
    expect(await refsFor('See #42 for context', 'unrelated #99')).toBeUndefined();
  });

  test('neither a Jira key nor a closer yields no refs (omitted entirely)', async () => {
    expect(await refsFor('Plain title', 'plain body, no keys')).toBeUndefined();
  });

  test('a GHE folder builds the issue url from its own baseUrl', async () => {
    storageData = { 'lunma.connectors': { 'acc-gh': 'ghp-ghe' } };
    routeFetch([
      [(u) => u.includes('/search/issues'), () => searchResponse([pr(1, { title: 'x' })])],
      [
        (u) => u.includes('/pulls/'),
        () =>
          jsonResponse({ ...prDetail(1), base: { repo: { full_name: 'o/r' } }, body: 'Closes #3' }),
      ],
      [(u) => u.includes('/check-runs'), () => checkRunsResponse([])],
    ]);
    const runtime = await githubConnector.fetchRuntime(
      node({ baseUrl: 'https://ghe.example.com', query: 'authored' }),
      20,
    );
    expect(runtime.items[0]?.refs?.[0]?.url).toBe('https://ghe.example.com/o/r/issues/3');
  });
});

// ── issue pass → ticket bag (lens-overview) ──────────────────────────────────────

describe('fetchRuntime — issue pass', () => {
  /** A GitHub issue search item (no `pull_request` key → not a PR). */
  function issue(id: number, overrides: Record<string, unknown> = {}): Record<string, unknown> {
    return {
      id,
      number: id,
      title: `Issue ${id}`,
      html_url: `https://github.com/o/r/issues/${id}`,
      state: 'open',
      repository_url: 'https://api.github.com/repos/o/r',
      updated_at: '2026-06-24T10:00:00Z',
      assignees: [],
      labels: [],
      ...overrides,
    };
  }

  /** Route the PR pass empty and the issue pass to `items`. */
  function routeIssues(items: unknown[]): void {
    routeFetch([
      [(u) => u.includes('q=is:issue'), () => searchResponse(items)],
      [(u) => u.includes('q=is:pr'), () => searchResponse([])],
    ]);
  }

  test('the assigned query runs the issue pass and builds a ticket bag', async () => {
    storageData = { ...TOKEN };
    routeIssues([
      issue(212, { assignees: [{ login: 'octo' }], labels: [{ name: 'bug' }, { name: 'p1' }] }),
    ]);
    const runtime = await githubConnector.fetchRuntime(node({ query: 'assigned' }), 20);
    const item = runtime.items.find((i) => i.ticket !== undefined);
    expect(item).toMatchObject({
      id: '212',
      title: 'Issue 212',
      url: 'https://github.com/o/r/issues/212',
    });
    expect(item?.ticket).toEqual({
      key: '#212',
      statusCategory: 'todo',
      statusLabel: 'Open',
      project: 'o/r',
      assignee: 'octo',
      labels: ['bug', 'p1'],
      updatedAt: Date.parse('2026-06-24T10:00:00Z'),
    });
    // No native priority on github issues → the field is OMITTED (never faked).
    expect(item?.ticket && 'priority' in item.ticket).toBe(false);
  });

  test('the authored query also runs the issue pass', async () => {
    storageData = { ...TOKEN };
    routeIssues([issue(7)]);
    const runtime = await githubConnector.fetchRuntime(node({ query: 'authored' }), 20);
    expect(runtime.items.some((i) => i.ticket?.key === '#7')).toBe(true);
  });

  test('review-requested does NOT run the issue pass (only one search)', async () => {
    storageData = { ...TOKEN };
    let issueSearched = false;
    routeFetch([
      [
        (u) => u.includes('q=is:issue'),
        () => {
          issueSearched = true;
          return searchResponse([issue(1)]);
        },
      ],
      [(u) => u.includes('q=is:pr'), () => searchResponse([])],
    ]);
    const runtime = await githubConnector.fetchRuntime(node({ query: 'review-requested' }), 20);
    expect(issueSearched).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(runtime.items.some((i) => i.ticket !== undefined)).toBe(false);
  });

  test('an open issue maps to the todo lane, a closed one to done', async () => {
    storageData = { ...TOKEN };
    routeIssues([issue(1, { state: 'open' }), issue(2, { state: 'closed' })]);
    const runtime = await githubConnector.fetchRuntime(node({ query: 'assigned' }), 20);
    const byKey = new Map(
      runtime.items.filter((i) => i.ticket).map((i) => [i.ticket?.key, i.ticket]),
    );
    expect(byKey.get('#1')).toMatchObject({ statusCategory: 'todo', statusLabel: 'Open' });
    expect(byKey.get('#2')).toMatchObject({ statusCategory: 'done', statusLabel: 'Closed' });
    // `in-progress` is unreachable for github classic issues — never synthesised.
    expect([...byKey.values()].some((t) => t?.statusCategory === 'in-progress')).toBe(false);
  });

  test('an unassigned issue and one with no labels omit those fields', async () => {
    storageData = { ...TOKEN };
    routeIssues([issue(1, { assignees: [], labels: [] })]);
    const runtime = await githubConnector.fetchRuntime(node({ query: 'assigned' }), 20);
    const ticket = runtime.items.find((i) => i.ticket)?.ticket;
    expect(ticket && 'assignee' in ticket).toBe(false);
    expect(ticket && 'labels' in ticket).toBe(false);
    expect(ticket?.project).toBe('o/r'); // project still resolves from repository_url
  });

  test('issue items carry a ticket bag and NO change bag', async () => {
    storageData = { ...TOKEN };
    routeIssues([issue(1)]);
    const runtime = await githubConnector.fetchRuntime(node({ query: 'assigned' }), 20);
    const item = runtime.items.find((i) => i.ticket !== undefined);
    expect(item?.change).toBeUndefined();
  });

  test('a failed issue search is silent — the PR rows still ship', async () => {
    storageData = { ...TOKEN };
    routeFetch([
      [(u) => u.includes('q=is:issue'), () => jsonResponse({ message: 'rate limit' }, 403)],
      [(u) => u.includes('q=is:pr'), () => searchResponse([pr(9, { title: 'PR 9' })])],
      [(u) => u.includes('/pulls/'), () => jsonResponse(prDetail(9))],
      [(u) => u.includes('/check-runs'), () => checkRunsResponse([])],
    ]);
    const runtime = await githubConnector.fetchRuntime(node({ query: 'assigned' }), 20);
    expect(runtime.state).toBe('ok');
    expect(runtime.items.map((i) => i.id)).toEqual(['9']);
  });
});
