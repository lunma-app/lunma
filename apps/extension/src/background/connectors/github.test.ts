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

/** Wire the fetch mock with a by-URL router; unmatched URLs get empty shapes. */
function routeFetch(
  routes: Array<[match: (url: string) => boolean, respond: (url: string) => unknown]>,
): void {
  fetchMock.mockImplementation(async (url: string) => {
    for (const [match, respond] of routes) {
      if (match(url)) return respond(url);
    }
    throw new Error(`unrouted fetch: ${url}`);
  });
}

const TOKEN = { 'lunma.connectors': { 'github.com': 'ghp-abc' } };

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
    fetchMock.mockResolvedValueOnce(searchResponse([]));
    const runtime = await githubConnector.fetchRuntime(node({ query: 'authored' }), 20);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      'https://api.github.com/search/issues?q=is:pr+is:open+author:@me&per_page=20&sort=updated&order=desc&advanced_search=true',
    );
    expect(runtime.state).toBe('ok');
  });

  test('assigned requests assignee:@me', async () => {
    storageData = { ...TOKEN };
    fetchMock.mockResolvedValueOnce(searchResponse([]));
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
    storageData = { 'lunma.connectors': { 'ghe.example.com': 'ghp-ghe' } };
    fetchMock.mockResolvedValueOnce(searchResponse([]));
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
    fetchMock.mockResolvedValueOnce(searchResponse([]));
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

  test('the token lookup is host-keyed: another host token does not authorize', async () => {
    storageData = { 'lunma.connectors': { 'ghe.example.com': 'ghp-other' } };
    const runtime = await githubConnector.fetchRuntime(node({ query: 'authored' }), 20);
    expect(runtime.state).toBe('signed-out');
    expect(fetchMock).not.toHaveBeenCalled();
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
    expect(fetchMock).toHaveBeenCalledTimes(3); // search + detail + check-runs
    expect(fetchMock.mock.calls[1]?.[0]).toBe('https://api.github.com/repos/o/r/pulls/1');
    expect(fetchMock.mock.calls[2]?.[0]).toBe(
      'https://api.github.com/repos/o/r/commits/sha-1/check-runs?per_page=100',
    );
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
    fetchMock.mockResolvedValueOnce(searchResponse([]));
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
      githubConnector.requiredOrigins({ source: 'github', baseUrl: 'https://github.com' }),
    ).toEqual(['https://api.github.com/*']);
    expect(
      githubConnector.requiredOrigins({ source: 'github', baseUrl: 'https://ghe.example.com' }),
    ).toEqual(['https://ghe.example.com/*']);
  });
});
