import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import type { SmartSourceConfig } from '../../shared/types';
import type { ConnectorCaches } from './connector';
import { gitlabConnector, pipelineStatus } from './gitlab';

// The GitLab connector's fetch/normalize/auth suites, relocated from
// `../smart-folders.test.ts` by the github-connector change (design D2) with
// assertions UNMODIFIED — only import paths and the entry-point call sites
// (`fetchSmartFolderRuntime(...)` → `gitlabConnector.fetchRuntime(...)`)
// changed. The refactor is proven by the absence of assertion changes.

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

/** Minimal Response stand-in — gitlabGet reads only status/ok/json(). */
function jsonResponse(body: unknown, status = 200): unknown {
  return { status, ok: status >= 200 && status < 300, json: async () => body };
}

function htmlResponse(status = 200): unknown {
  return {
    status,
    ok: status >= 200 && status < 300,
    json: async () => {
      throw new SyntaxError('Unexpected token <');
    },
  };
}

let fetchMock: ReturnType<typeof vi.fn>;

function node(overrides: Partial<SmartSourceConfig> = {}): SmartSourceConfig {
  return {
    source: 'gitlab',
    baseUrl: 'https://gitlab.example.com',
    query: 'review-requested',
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
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

// ── pipeline → tone mapping ────────────────────────────────────────────────────

describe('pipelineStatus', () => {
  test('maps the documented statuses to the four tones', () => {
    expect(pipelineStatus('success')?.tone).toBe('ok');
    expect(pipelineStatus('failed')?.tone).toBe('fail');
    expect(pipelineStatus('running')?.tone).toBe('pending');
    expect(pipelineStatus('pending')?.tone).toBe('pending');
    expect(pipelineStatus('created')?.tone).toBe('pending');
    expect(pipelineStatus('canceled')?.tone).toBe('warn');
    expect(pipelineStatus('skipped')?.tone).toBe('warn');
  });

  test('no pipeline and unmapped statuses map to no status (absence over guessing)', () => {
    expect(pipelineStatus(undefined)).toBeUndefined();
    expect(pipelineStatus(null)).toBeUndefined();
    expect(pipelineStatus('manual')).toBeUndefined();
    expect(pipelineStatus('waiting_for_resource')).toBeUndefined();
  });
});

// ── fetch + normalize ──────────────────────────────────────────────────────────

describe('fetchRuntime — canned queries', () => {
  test('authored requests scope=created_by_me with the per_page cap', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse([mr(1, { head_pipeline: { status: 'success' } })]),
    );
    const runtime = await gitlabConnector.fetchRuntime(node({ query: 'authored' }), 20);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const url = fetchMock.mock.calls[0]?.[0] as string;
    expect(url).toBe(
      'https://gitlab.example.com/api/v4/merge_requests?state=opened&per_page=20&scope=created_by_me',
    );
    expect(runtime.state).toBe('ok');
    expect(runtime.items).toEqual([
      {
        id: '1',
        title: 'MR 1',
        url: 'https://gitlab.example.com/g/p/-/merge_requests/1',
        status: { tone: 'ok', label: 'Pipeline passed' },
      },
    ]);
  });

  test('assigned requests scope=assigned_to_me', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse([]));
    await gitlabConnector.fetchRuntime(node({ query: 'assigned' }), 20);
    const url = fetchMock.mock.calls[0]?.[0] as string;
    expect(url).toContain('scope=assigned_to_me');
  });

  test('review-requested resolves me, then requests scope=all&reviewer_id=<me>', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ id: 7 })) // /api/v4/user
      .mockResolvedValueOnce(jsonResponse([mr(2, { head_pipeline: { status: 'success' } })]));
    const runtime = await gitlabConnector.fetchRuntime(node({ query: 'review-requested' }), 20);
    expect(fetchMock.mock.calls[0]?.[0]).toBe('https://gitlab.example.com/api/v4/user');
    const listUrl = fetchMock.mock.calls[1]?.[0] as string;
    // scope=all is REQUIRED: the endpoint defaults to created_by_me, under
    // which reviewer_id intersects with your own authored MRs.
    expect(listUrl).toContain('scope=all');
    expect(listUrl).toContain('reviewer_id=7');
    expect(runtime.state).toBe('ok');
  });

  test('me-resolution is cached per poll cycle (one /user fetch for two folders)', async () => {
    fetchMock.mockImplementation(async (url: string) => {
      if (url.endsWith('/api/v4/user')) return jsonResponse({ id: 7 });
      return jsonResponse([]);
    });
    const meCache: ConnectorCaches = new Map();
    await gitlabConnector.fetchRuntime(node({ query: 'review-requested' }), 20, meCache);
    await gitlabConnector.fetchRuntime(node({ query: 'review-requested' }), 20, meCache);
    const userCalls = fetchMock.mock.calls.filter((c) => (c[0] as string).endsWith('/api/v4/user'));
    expect(userCalls).toHaveLength(1);
  });

  test('results cap at 20 even if the server over-returns', async () => {
    const overfull = Array.from({ length: 25 }, (_, i) =>
      mr(i + 1, { head_pipeline: { status: 'success' } }),
    );
    fetchMock.mockResolvedValueOnce(jsonResponse(overfull));
    const runtime = await gitlabConnector.fetchRuntime(node({ query: 'authored' }), 20);
    expect(runtime.items).toHaveLength(20);
  });

  test('a malformed list element is dropped, the rest survive', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse([mr(1, { head_pipeline: { status: 'success' } }), { junk: true }]),
    );
    const runtime = await gitlabConnector.fetchRuntime(node({ query: 'authored' }), 20);
    expect(runtime.state).toBe('ok');
    expect(runtime.items.map((i) => i.id)).toEqual(['1']);
  });

  test('a subpath baseUrl string-appends every endpoint', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ id: 7 }))
      .mockResolvedValueOnce(jsonResponse([]));
    await gitlabConnector.fetchRuntime(
      node({ baseUrl: 'https://host.example.com/gitlab', query: 'review-requested' }),
      20,
    );
    expect(fetchMock.mock.calls[0]?.[0]).toBe('https://host.example.com/gitlab/api/v4/user');
    expect(fetchMock.mock.calls[1]?.[0]).toContain(
      'https://host.example.com/gitlab/api/v4/merge_requests?',
    );
  });
});

describe('fetchRuntime — pipeline enrichment', () => {
  test('enrichment is skipped when the list already carries a usable pipeline', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse([
        mr(1, { head_pipeline: { status: 'failed' } }),
        mr(2, { pipeline: { status: 'running' } }),
      ]),
    );
    const runtime = await gitlabConnector.fetchRuntime(node({ query: 'authored' }), 20);
    expect(fetchMock).toHaveBeenCalledTimes(1); // list only — no detail fetches
    expect(runtime.items[0]?.status?.tone).toBe('fail');
    expect(runtime.items[1]?.status?.tone).toBe('pending');
  });

  test('items without a listed pipeline enrich via bounded per-MR detail fetches', async () => {
    let inFlight = 0;
    let maxInFlight = 0;
    fetchMock.mockImplementation(async (url: string) => {
      if (url.includes('/api/v4/merge_requests?')) {
        return jsonResponse(Array.from({ length: 8 }, (_, i) => mr(i + 1)));
      }
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await new Promise((resolve) => setTimeout(resolve, 1));
      inFlight -= 1;
      const iid = Number(url.split('/').pop());
      return jsonResponse(mr(iid, { head_pipeline: { status: 'success' } }));
    });
    const runtime = await gitlabConnector.fetchRuntime(node({ query: 'authored' }), 20);
    const detailCalls = fetchMock.mock.calls.filter((c) => (c[0] as string).includes('/projects/'));
    expect(detailCalls).toHaveLength(8);
    expect(detailCalls[0]?.[0]).toBe(
      'https://gitlab.example.com/api/v4/projects/1/merge_requests/1',
    );
    expect(maxInFlight).toBeLessThanOrEqual(5); // concurrency bound
    expect(runtime.items.every((i) => i.status?.tone === 'ok')).toBe(true);
  });

  test('an MR whose detail carries no pipeline gets no status', async () => {
    fetchMock.mockImplementation(async (url: string) => {
      if (url.includes('/api/v4/merge_requests?')) return jsonResponse([mr(1)]);
      return jsonResponse(mr(1, { head_pipeline: null }));
    });
    const runtime = await gitlabConnector.fetchRuntime(node({ query: 'authored' }), 20);
    expect(runtime.items[0]?.status).toBeUndefined();
  });

  test('an enrichment failure leaves the item glyph-less, never failing the folder', async () => {
    fetchMock.mockImplementation(async (url: string) => {
      if (url.includes('/api/v4/merge_requests?')) return jsonResponse([mr(1)]);
      throw new Error('network down');
    });
    const runtime = await gitlabConnector.fetchRuntime(node({ query: 'authored' }), 20);
    expect(runtime.state).toBe('ok');
    expect(runtime.items[0]?.status).toBeUndefined();
  });
});

// ── auth ladder ────────────────────────────────────────────────────────────────

describe('fetchRuntime — auth ladder', () => {
  test('a configured PAT wins: Bearer header + credentials omit', async () => {
    storageData['lunma.connectors'] = { 'gitlab.example.com': 'glpat-abc' };
    fetchMock.mockResolvedValueOnce(jsonResponse([]));
    await gitlabConnector.fetchRuntime(node({ query: 'authored' }), 20);
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(init.headers).toEqual({ Authorization: 'Bearer glpat-abc' });
    expect(init.credentials).toBe('omit');
  });

  test('the PAT host key includes an explicit port', async () => {
    storageData['lunma.connectors'] = { 'gitlab.example.com:8443': 'glpat-port' };
    fetchMock.mockResolvedValueOnce(jsonResponse([]));
    await gitlabConnector.fetchRuntime(
      node({ baseUrl: 'https://gitlab.example.com:8443', query: 'authored' }),
      20,
    );
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(init.headers).toEqual({ Authorization: 'Bearer glpat-port' });
  });

  test('no PAT rides the browser session: credentials include, no Authorization', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse([]));
    await gitlabConnector.fetchRuntime(node({ query: 'authored' }), 20);
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(init.headers).toEqual({});
    expect(init.credentials).toBe('include');
  });

  test('a 401 resolves signed-out, never throwing', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ message: '401 Unauthorized' }, 401));
    const runtime = await gitlabConnector.fetchRuntime(node({ query: 'authored' }), 20);
    expect(runtime).toMatchObject({ state: 'signed-out', items: [] });
  });

  test('a redirect landing on an HTML sign-in page resolves signed-out', async () => {
    fetchMock.mockResolvedValueOnce(htmlResponse());
    const runtime = await gitlabConnector.fetchRuntime(node({ query: 'authored' }), 20);
    expect(runtime.state).toBe('signed-out');
  });

  test('a 5xx resolves error', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ message: 'boom' }, 503));
    const runtime = await gitlabConnector.fetchRuntime(node({ query: 'authored' }), 20);
    expect(runtime.state).toBe('error');
  });

  test('a 429 resolves error', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ message: 'slow down' }, 429));
    const runtime = await gitlabConnector.fetchRuntime(node({ query: 'authored' }), 20);
    expect(runtime.state).toBe('error');
  });

  test('a network failure resolves error', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    const runtime = await gitlabConnector.fetchRuntime(node({ query: 'authored' }), 20);
    expect(runtime.state).toBe('error');
  });

  test('every request carries a bounded timeout signal (a hang resolves, never wedges)', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse([]));
    await gitlabConnector.fetchRuntime(node({ query: 'authored' }), 20);
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  test('a timed-out request (AbortError) resolves error like any network failure', async () => {
    fetchMock.mockRejectedValueOnce(new DOMException('signal timed out', 'TimeoutError'));
    const runtime = await gitlabConnector.fetchRuntime(node({ query: 'authored' }), 20);
    expect(runtime.state).toBe('error');
  });

  test('a signed-out me-resolution degrades the review-requested folder to signed-out', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ message: '401' }, 401));
    const runtime = await gitlabConnector.fetchRuntime(node({ query: 'review-requested' }), 20);
    expect(runtime.state).toBe('signed-out');
    expect(fetchMock).toHaveBeenCalledTimes(1); // never reaches the list call
  });
});

// ── maxItems + listingUrl (rss-connector D5/D6) ─────────────────────────────────

describe('maxItems + listingUrl', () => {
  test('the node maxItems drives the per_page cap', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse([]));
    await gitlabConnector.fetchRuntime(node({ query: 'authored' }), 50);
    expect(fetchMock.mock.calls[0]?.[0]).toContain('per_page=50');
  });

  test('listingUrl is the dashboard merge-requests page', () => {
    expect(gitlabConnector.listingUrl(node())).toBe(
      'https://gitlab.example.com/dashboard/merge_requests',
    );
  });

  test('requiredOrigins is the same-origin baseUrl pattern, port preserved (D8)', () => {
    expect(
      gitlabConnector.requiredOrigins({ source: 'gitlab', baseUrl: 'https://gitlab.example.com' }),
    ).toEqual(['https://gitlab.example.com/*']);
    expect(
      gitlabConnector.requiredOrigins({
        source: 'gitlab',
        baseUrl: 'https://gitlab.example.com:8443/g',
      }),
    ).toEqual(['https://gitlab.example.com:8443/*']);
  });
});
