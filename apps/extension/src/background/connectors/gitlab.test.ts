import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import type { ResolvedLensSource } from '../../shared/types';
import type { ConnectorCaches } from './connector';
import { gitlabConnector, kanbanForIssueState, pipelineStatus, priorityFromLabels } from './gitlab';

// The GitLab connector's fetch/normalize/auth suites, relocated from
// `../lenses.test.ts` by the github-connector change (design D2) with
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

function node(overrides: Partial<ResolvedLensSource> = {}): ResolvedLensSource {
  return {
    source: 'gitlab',
    baseUrl: 'https://gitlab.example.com',
    query: 'review-requested',
    lensKind: 'general',
    // Per-source token key (connector-accounts) — the PAT is looked up by this
    // `sourceId`, not by host.
    sourceId: 'acc-gl',
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
    // The MR pass + the lens-overview issue pass both fire for authored; route
    // by endpoint so the issue pass returns an empty list (asserted separately).
    fetchMock.mockImplementation(async (url: string) => {
      if (url.includes('/api/v4/merge_requests?')) {
        return jsonResponse([mr(1, { head_pipeline: { status: 'success' } })]);
      }
      return jsonResponse([]); // /api/v4/issues
    });
    const runtime = await gitlabConnector.fetchRuntime(node({ query: 'authored' }), 20);
    const mrUrl = fetchMock.mock.calls.find((c) =>
      (c[0] as string).includes('/api/v4/merge_requests?'),
    )?.[0] as string;
    expect(mrUrl).toBe(
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
    fetchMock.mockImplementation(async () => jsonResponse([]));
    await gitlabConnector.fetchRuntime(node({ query: 'assigned' }), 20);
    const mrUrl = fetchMock.mock.calls.find((c) =>
      (c[0] as string).includes('/api/v4/merge_requests?'),
    )?.[0] as string;
    expect(mrUrl).toContain('scope=assigned_to_me');
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
    fetchMock.mockImplementation(async (url: string) =>
      url.includes('/api/v4/merge_requests?') ? jsonResponse(overfull) : jsonResponse([]),
    );
    const runtime = await gitlabConnector.fetchRuntime(node({ query: 'authored' }), 20);
    expect(runtime.items).toHaveLength(20);
  });

  test('a malformed list element is dropped, the rest survive', async () => {
    fetchMock.mockImplementation(async (url: string) =>
      url.includes('/api/v4/merge_requests?')
        ? jsonResponse([mr(1, { head_pipeline: { status: 'success' } }), { junk: true }])
        : jsonResponse([]),
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
    fetchMock.mockImplementation(async (url: string) =>
      url.includes('/api/v4/merge_requests?')
        ? jsonResponse([
            mr(1, { head_pipeline: { status: 'failed' } }),
            mr(2, { pipeline: { status: 'running' } }),
          ])
        : jsonResponse([]),
    );
    const runtime = await gitlabConnector.fetchRuntime(node({ query: 'authored' }), 20);
    // No per-MR detail fetch (every row carries a pipeline) — only the MR list
    // and the lens-overview issue pass fire.
    const detailCalls = fetchMock.mock.calls.filter((c) => (c[0] as string).includes('/projects/'));
    expect(detailCalls).toHaveLength(0);
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
    storageData['lunma.connectors'] = { 'acc-gl': 'glpat-abc' };
    fetchMock.mockResolvedValue(jsonResponse([]));
    await gitlabConnector.fetchRuntime(node({ query: 'authored' }), 20);
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(init.headers).toEqual({ Authorization: 'Bearer glpat-abc' });
    expect(init.credentials).toBe('omit');
  });

  test('the PAT is keyed by sourceId, not host (a ported host still resolves by id)', async () => {
    storageData['lunma.connectors'] = { 'acc-gl': 'glpat-port' };
    fetchMock.mockResolvedValue(jsonResponse([]));
    await gitlabConnector.fetchRuntime(
      node({ baseUrl: 'https://gitlab.example.com:8443', query: 'authored' }),
      20,
    );
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(init.headers).toEqual({ Authorization: 'Bearer glpat-port' });
  });

  test('two accounts on the SAME gitlab host hold distinct tokens (keyed by sourceId)', async () => {
    storageData['lunma.connectors'] = { 'acc-a': 'glpat-a', 'acc-b': 'glpat-b' };
    fetchMock.mockResolvedValue(jsonResponse([]));
    // Select the MR call per invocation — the issue pass adds a second request
    // per fetch, so positional `calls[0]`/`calls[1]` no longer map to the two MR
    // lists. Both calls of one invocation carry the same per-source token.
    const mrCall = (token: string) =>
      fetchMock.mock.calls.find(
        (c) =>
          (c[0] as string).includes('/api/v4/merge_requests?') &&
          (c[1] as RequestInit).headers !== undefined &&
          ((c[1] as RequestInit).headers as Record<string, string>).Authorization ===
            `Bearer ${token}`,
      );
    await gitlabConnector.fetchRuntime(node({ query: 'authored', sourceId: 'acc-a' }), 20);
    expect(mrCall('glpat-a')).toBeDefined();
    await gitlabConnector.fetchRuntime(node({ query: 'authored', sourceId: 'acc-b' }), 20);
    expect(mrCall('glpat-b')).toBeDefined();
  });

  test('declares session-then-pat authMethods', () => {
    expect(gitlabConnector.authMethods).toEqual(['session', 'pat']);
  });

  test('no PAT rides the browser session: credentials include, no Authorization', async () => {
    fetchMock.mockResolvedValue(jsonResponse([]));
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
    fetchMock.mockResolvedValue(jsonResponse([]));
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
    fetchMock.mockImplementation(async () => jsonResponse([]));
    await gitlabConnector.fetchRuntime(node({ query: 'authored' }), 50);
    const mrUrl = fetchMock.mock.calls.find((c) =>
      (c[0] as string).includes('/api/v4/merge_requests?'),
    )?.[0] as string;
    expect(mrUrl).toContain('per_page=50');
  });

  test('listingUrl is the dashboard merge-requests page', () => {
    expect(gitlabConnector.listingUrl(node())).toBe(
      'https://gitlab.example.com/dashboard/merge_requests',
    );
  });

  test('requiredOrigins is the same-origin baseUrl pattern, port preserved (D8)', () => {
    expect(
      gitlabConnector.requiredOrigins({
        source: 'gitlab',
        baseUrl: 'https://gitlab.example.com',
        lensKind: 'general',
        sourceId: 'acc-gl',
      }),
    ).toEqual(['https://gitlab.example.com/*']);
    expect(
      gitlabConnector.requiredOrigins({
        source: 'gitlab',
        baseUrl: 'https://gitlab.example.com:8443/g',
        lensKind: 'general',
        sourceId: 'acc-gl',
      }),
    ).toEqual(['https://gitlab.example.com:8443/*']);
  });
});

// ── review-lens enrichment (review-lens, D4/D5) ────────────────────────────────

describe('fetchRuntime — review-lens change enrichment', () => {
  /** Review-shaped MR list fields (author/reviewers/branch/diff/draft). */
  function reviewMr(id: number, overrides: Record<string, unknown> = {}): Record<string, unknown> {
    return mr(id, {
      head_pipeline: { status: 'success' },
      author: { username: 'octo' },
      target_branch: 'main',
      updated_at: '2026-06-24T10:00:00Z',
      draft: false,
      reviewers: [{ username: 'alice' }, { username: 'bob' }],
      additions: 112,
      deletions: 40,
      ...overrides,
    });
  }

  function approvals(usernames: string[]): unknown {
    return jsonResponse({ approved_by: usernames.map((u) => ({ user: { username: u } })) });
  }

  test('a review lens populates change with identity, diff, draft, and reviewer states', async () => {
    fetchMock.mockImplementation(async (url: string) => {
      if (url.includes('/api/v4/merge_requests?')) return jsonResponse([reviewMr(1)]);
      if (url.includes('/approvals')) return approvals(['alice']);
      throw new Error(`unrouted: ${url}`);
    });
    const runtime = await gitlabConnector.fetchRuntime(
      node({ lensKind: 'review', query: 'authored' }),
      20,
    );
    expect(runtime.state).toBe('ok');
    const item = runtime.items[0];
    expect(item?.change).toEqual({
      author: 'octo',
      repo: 'g/p',
      reviewers: [
        { login: 'alice', state: 'approved' },
        { login: 'bob', state: 'pending' },
      ],
      draft: false,
      additions: 112,
      deletions: 40,
      targetBranch: 'main',
      updatedAt: Date.parse('2026-06-24T10:00:00Z'),
    });
    // CI tone stays on `status`, never duplicated into `change`.
    expect(item?.status).toEqual({ tone: 'ok', label: 'Pipeline passed' });
  });

  test('an unknown reviewer review-state degrades to pending (never fabricated)', async () => {
    fetchMock.mockImplementation(async (url: string) => {
      if (url.includes('/api/v4/merge_requests?')) {
        return jsonResponse([reviewMr(1, { reviewers: [{ username: 'carol' }] })]);
      }
      if (url.includes('/approvals')) return approvals([]);
      throw new Error(`unrouted: ${url}`);
    });
    const runtime = await gitlabConnector.fetchRuntime(
      node({ lensKind: 'review', query: 'authored' }),
      20,
    );
    expect(runtime.items[0]?.change?.reviewers).toEqual([{ login: 'carol', state: 'pending' }]);
  });

  test('an exposed requested_changes review-state maps to changes (D5)', async () => {
    fetchMock.mockImplementation(async (url: string) => {
      if (url.includes('/api/v4/merge_requests?')) {
        return jsonResponse([
          reviewMr(1, { reviewers: [{ username: 'dave', state: 'requested_changes' }] }),
        ]);
      }
      if (url.includes('/approvals')) return approvals([]);
      throw new Error(`unrouted: ${url}`);
    });
    const runtime = await gitlabConnector.fetchRuntime(
      node({ lensKind: 'review', query: 'authored' }),
      20,
    );
    expect(runtime.items[0]?.change?.reviewers).toEqual([{ login: 'dave', state: 'changes' }]);
  });

  test('a general lens makes no approvals call and carries no change', async () => {
    let approvalsCalled = false;
    fetchMock.mockImplementation(async (url: string) => {
      if (url.includes('/api/v4/merge_requests?')) return jsonResponse([reviewMr(1)]);
      if (url.includes('/approvals')) {
        approvalsCalled = true;
        return approvals([]);
      }
      throw new Error(`unrouted: ${url}`);
    });
    const runtime = await gitlabConnector.fetchRuntime(
      node({ lensKind: 'general', query: 'authored' }),
      20,
    );
    expect(approvalsCalled).toBe(false);
    expect(runtime.items[0]?.change).toBeUndefined();
  });
});

// ── linked-ticket refs on MRs (lens-overview, L0) ──────────────────────────────

describe('fetchRuntime — MR linked-ticket refs', () => {
  /** Route the MR list to one MR (overrides), no issues. */
  function withMr(overrides: Record<string, unknown>): void {
    fetchMock.mockImplementation(async (url: string) =>
      url.includes('/api/v4/merge_requests?')
        ? jsonResponse([mr(1, { head_pipeline: { status: 'success' }, ...overrides })])
        : jsonResponse([]),
    );
  }

  test('a Jira key in the MR title yields one ticket ref (bare chip, url empty)', async () => {
    withMr({ title: 'PAY-91 fix the checkout flow' });
    const runtime = await gitlabConnector.fetchRuntime(node({ query: 'authored' }), 20);
    expect(runtime.items[0]?.refs).toEqual([
      { kind: 'ticket', key: 'PAY-91', url: '', label: 'PAY-91' },
    ]);
  });

  test('a Jira key only in the target branch is extracted (title-first, branch fallback)', async () => {
    withMr({ title: 'Fix the thing', target_branch: 'feature/AB12-3-rework' });
    const runtime = await gitlabConnector.fetchRuntime(node({ query: 'authored' }), 20);
    expect(runtime.items[0]?.refs).toEqual([
      { kind: 'ticket', key: 'AB12-3', url: '', label: 'AB12-3' },
    ]);
  });

  test('the title wins over the branch when both name a key (first wins)', async () => {
    withMr({ title: 'PAY-91 fix it', target_branch: 'feature/OPS-7-thing' });
    const runtime = await gitlabConnector.fetchRuntime(node({ query: 'authored' }), 20);
    expect(runtime.items[0]?.refs?.[0]?.key).toBe('PAY-91');
  });

  test('no Jira key anywhere omits refs entirely (no empty array)', async () => {
    withMr({ title: 'MR 1', target_branch: 'main' });
    const runtime = await gitlabConnector.fetchRuntime(node({ query: 'authored' }), 20);
    expect(runtime.items[0]).not.toHaveProperty('refs');
  });

  test('refs ride alongside change on a review lens (both bags coexist)', async () => {
    fetchMock.mockImplementation(async (url: string) => {
      if (url.includes('/api/v4/merge_requests?')) {
        return jsonResponse([
          mr(1, {
            head_pipeline: { status: 'success' },
            title: 'PAY-91 ship it',
            author: { username: 'octo' },
            target_branch: 'main',
            updated_at: '2026-06-24T10:00:00Z',
            reviewers: [],
          }),
        ]);
      }
      if (url.includes('/approvals')) {
        return jsonResponse({ approved_by: [] });
      }
      return jsonResponse([]); // /api/v4/issues
    });
    const runtime = await gitlabConnector.fetchRuntime(
      node({ lensKind: 'review', query: 'authored' }),
      20,
    );
    const item = runtime.items[0];
    expect(item?.refs?.[0]?.key).toBe('PAY-91');
    expect(item?.change?.author).toBe('octo');
  });
});

// ── issue pass → Ticket entity (lens-overview, design §4) ──────────────────────

describe('kanbanForIssueState', () => {
  test('opened → todo, closed → done; in-progress is unreachable (deferred)', () => {
    expect(kanbanForIssueState('opened')).toBe('todo');
    expect(kanbanForIssueState('closed')).toBe('done');
    expect(kanbanForIssueState('anything-else')).toBe('todo');
  });
});

describe('priorityFromLabels', () => {
  test('maps a priority:: scoped label onto a bucket (case-insensitive)', () => {
    expect(priorityFromLabels(['priority::urgent'])).toBe('urgent');
    expect(priorityFromLabels(['Priority::High'])).toBe('high');
    expect(priorityFromLabels(['priority::medium'])).toBe('med');
    expect(priorityFromLabels(['priority::low'])).toBe('low');
    expect(priorityFromLabels(['priority::critical'])).toBe('urgent');
  });

  test('a non-priority label or an unmapped level yields undefined (never faked)', () => {
    expect(priorityFromLabels(['bug', 'frontend'])).toBeUndefined();
    expect(priorityFromLabels(['priority::someday'])).toBeUndefined();
    expect(priorityFromLabels(undefined)).toBeUndefined();
    expect(priorityFromLabels([])).toBeUndefined();
  });
});

describe('fetchRuntime — issue pass', () => {
  /** A GitLab issue list row. */
  function issue(iid: number, overrides: Record<string, unknown> = {}): Record<string, unknown> {
    return {
      id: iid + 1000,
      iid,
      title: `Issue ${iid}`,
      web_url: `https://gitlab.example.com/g/p/-/issues/${iid}`,
      state: 'opened',
      updated_at: '2026-06-24T10:00:00Z',
      ...overrides,
    };
  }

  /** Route MRs to empty and issues to the given list. */
  function withIssues(list: Record<string, unknown>[]): void {
    fetchMock.mockImplementation(async (url: string) =>
      url.includes('/api/v4/issues') ? jsonResponse(list) : jsonResponse([]),
    );
  }

  test('the assigned slot fetches issues with scope=assigned_to_me & state=opened', async () => {
    withIssues([]);
    await gitlabConnector.fetchRuntime(node({ query: 'assigned' }), 20);
    const issuesUrl = fetchMock.mock.calls.find((c) =>
      (c[0] as string).includes('/api/v4/issues'),
    )?.[0] as string;
    expect(issuesUrl).toBe(
      'https://gitlab.example.com/api/v4/issues?state=opened&per_page=20&scope=assigned_to_me',
    );
  });

  test('the authored slot maps to scope=created_by_me', async () => {
    withIssues([]);
    await gitlabConnector.fetchRuntime(node({ query: 'authored' }), 20);
    const issuesUrl = fetchMock.mock.calls.find((c) =>
      (c[0] as string).includes('/api/v4/issues'),
    )?.[0] as string;
    expect(issuesUrl).toContain('scope=created_by_me');
  });

  test('review-requested runs NO issue pass (no issue analogue)', async () => {
    fetchMock.mockImplementation(async (url: string) => {
      if (url.endsWith('/api/v4/user')) return jsonResponse({ id: 7 });
      return jsonResponse([]);
    });
    await gitlabConnector.fetchRuntime(node({ query: 'review-requested' }), 20);
    const issuesCalls = fetchMock.mock.calls.filter((c) =>
      (c[0] as string).includes('/api/v4/issues'),
    );
    expect(issuesCalls).toHaveLength(0);
  });

  test('an opened issue maps to a todo ticket; assignee/project/labels mapped', async () => {
    withIssues([
      issue(212, {
        state: 'opened',
        assignees: [{ username: 'alice' }, { username: 'bob' }],
        labels: ['bug', 'frontend'],
      }),
    ]);
    const runtime = await gitlabConnector.fetchRuntime(node({ query: 'assigned' }), 20);
    const item = runtime.items.find((i) => i.ticket !== undefined);
    expect(item).toMatchObject({
      id: '1212',
      title: 'Issue 212',
      url: 'https://gitlab.example.com/g/p/-/issues/212',
    });
    expect(item?.ticket).toEqual({
      key: '#212',
      statusCategory: 'todo',
      statusLabel: 'opened',
      project: 'g/p',
      assignee: 'alice',
      labels: ['bug', 'frontend'],
      updatedAt: Date.parse('2026-06-24T10:00:00Z'),
    });
    expect(item?.change).toBeUndefined();
  });

  test('a closed issue maps to a done ticket', async () => {
    withIssues([issue(9, { state: 'closed' })]);
    const runtime = await gitlabConnector.fetchRuntime(node({ query: 'assigned' }), 20);
    const ticket = runtime.items.find((i) => i.ticket !== undefined)?.ticket;
    expect(ticket?.statusCategory).toBe('done');
    expect(ticket?.statusLabel).toBe('closed');
  });

  test('a priority:: scoped label populates priority; its absence omits it', async () => {
    withIssues([issue(1, { labels: ['priority::high', 'bug'] }), issue(2, { labels: ['bug'] })]);
    const runtime = await gitlabConnector.fetchRuntime(node({ query: 'assigned' }), 20);
    const tickets = runtime.items.flatMap((i) => (i.ticket ? [i.ticket] : []));
    expect(tickets.find((t) => t.key === '#1')?.priority).toBe('high');
    expect(tickets.find((t) => t.key === '#2')).not.toHaveProperty('priority');
  });

  test('an unassigned issue with no labels omits assignee and labels', async () => {
    withIssues([issue(5, { assignees: [], labels: [] })]);
    const runtime = await gitlabConnector.fetchRuntime(node({ query: 'assigned' }), 20);
    const ticket = runtime.items.find((i) => i.ticket !== undefined)?.ticket;
    expect(ticket).not.toHaveProperty('assignee');
    expect(ticket).not.toHaveProperty('labels');
  });

  test('issue items append to the MR items in one section (Change + Ticket coexist)', async () => {
    fetchMock.mockImplementation(async (url: string) => {
      if (url.includes('/api/v4/merge_requests?')) {
        return jsonResponse([mr(1, { head_pipeline: { status: 'success' } })]);
      }
      return jsonResponse([issue(212)]);
    });
    const runtime = await gitlabConnector.fetchRuntime(node({ query: 'assigned' }), 20);
    const mrItem = runtime.items.find((i) => i.id === '1');
    const issueItem = runtime.items.find((i) => i.ticket !== undefined);
    expect(mrItem?.ticket).toBeUndefined();
    expect(mrItem?.status?.tone).toBe('ok');
    expect(issueItem?.ticket?.key).toBe('#212');
    expect(issueItem?.change).toBeUndefined();
  });

  test('a malformed issue row is dropped, the rest survive', async () => {
    withIssues([issue(1), { junk: true }, issue(2)]);
    const runtime = await gitlabConnector.fetchRuntime(node({ query: 'assigned' }), 20);
    const keys = runtime.items.flatMap((i) => (i.ticket ? [i.ticket.key] : []));
    expect(keys).toEqual(['#1', '#2']);
  });

  test('an issue-pass fetch error never costs the section its ok state', async () => {
    fetchMock.mockImplementation(async (url: string) => {
      if (url.includes('/api/v4/merge_requests?')) {
        return jsonResponse([mr(1, { head_pipeline: { status: 'success' } })]);
      }
      throw new Error('issues endpoint down');
    });
    const runtime = await gitlabConnector.fetchRuntime(node({ query: 'assigned' }), 20);
    expect(runtime.state).toBe('ok');
    expect(runtime.items.some((i) => i.ticket !== undefined)).toBe(false);
    expect(runtime.items.find((i) => i.id === '1')?.status?.tone).toBe('ok');
  });

  test('issues cap at maxItems even if the server over-returns', async () => {
    withIssues(Array.from({ length: 25 }, (_, i) => issue(i + 1)));
    const runtime = await gitlabConnector.fetchRuntime(node({ query: 'assigned' }), 20);
    expect(runtime.items.filter((i) => i.ticket !== undefined)).toHaveLength(20);
  });
});
