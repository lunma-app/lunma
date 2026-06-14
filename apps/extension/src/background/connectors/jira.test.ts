import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import type { SmartFolderNode } from './connector';
import { jiraConnector, statusForCategory } from './jira';

// ── test plumbing ──────────────────────────────────────────────────────────────

let storageGet: ReturnType<typeof vi.fn>;

/** A chrome stub whose storage.local.get is a spy — the session-riding connector
 * MUST never read `lunma.connectors`, so the spy asserts zero reads. */
function installChromeStub(): void {
  storageGet = vi.fn(async () => ({}));
  (globalThis as unknown as { chrome: unknown }).chrome = {
    storage: { local: { get: storageGet, set: vi.fn() } },
  };
}

/** Minimal Response stand-in — jiraGet reads only status/ok/json(). */
function jsonResponse(body: unknown, status = 200): unknown {
  return { status, ok: status >= 200 && status < 300, json: async () => body };
}

/** A non-JSON (login/HTML) response: json() throws, like a followed redirect to
 * the atlassian login document. `redirected` is set only to document intent —
 * the heuristic keys on the json() parse failing, not on the flag. */
function htmlResponse(status = 200, redirected = false): unknown {
  return {
    status,
    ok: status >= 200 && status < 300,
    redirected,
    json: async () => {
      throw new SyntaxError('Unexpected token <');
    },
  };
}

/** The GA `/search/jql` body shape: `{ issues, isLast }` (token pagination). */
function searchResponse(issues: unknown[]): unknown {
  return jsonResponse({ issues, isLast: true });
}

/** One search-result issue. Omit `categoryKey` for an issue with no status
 * category (the backlog / no-glyph case). */
function issue(
  id: string,
  key: string,
  summary: string,
  categoryKey?: string,
): Record<string, unknown> {
  return {
    id,
    key,
    fields: {
      summary,
      ...(categoryKey === undefined ? {} : { status: { statusCategory: { key: categoryKey } } }),
    },
  };
}

let fetchMock: ReturnType<typeof vi.fn>;

function node(overrides: Partial<SmartFolderNode> = {}): SmartFolderNode {
  return {
    kind: 'smart',
    id: 'sf-jira',
    name: 'My reported issues',
    icon: 'folder-kanban',
    source: 'jira',
    baseUrl: 'https://acme.atlassian.net',
    query: 'assigned',
    maxItems: 20,
    hideRead: false,
    refreshMinutes: 10,
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

// ── statusCategory → tone (D3) ──────────────────────────────────────────────────

describe('statusForCategory', () => {
  test('maps categories to tones; `new`, unmapped, and absent → no glyph', () => {
    expect(statusForCategory('indeterminate')).toEqual({ tone: 'pending', label: 'In progress' });
    expect(statusForCategory('done')).toEqual({ tone: 'ok', label: 'Done' });
    expect(statusForCategory('new')).toBeUndefined();
    expect(statusForCategory('frozen')).toBeUndefined();
    expect(statusForCategory(undefined)).toBeUndefined();
  });
});

// ── canned queries (D2) ─────────────────────────────────────────────────────────

describe('fetchRuntime — canned queries', () => {
  test('assigned requests assignee = currentUser() over the GA /search/jql endpoint', async () => {
    fetchMock.mockResolvedValueOnce(searchResponse([]));
    const runtime = await jiraConnector.fetchRuntime(node({ query: 'assigned' }));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      'https://acme.atlassian.net/rest/api/3/search/jql?jql=assignee%20%3D%20currentUser()%20AND%20statusCategory%20!%3D%20Done%20ORDER%20BY%20updated%20DESC&fields=summary,status&maxResults=20',
    );
    expect(runtime.state).toBe('ok');
  });

  test('authored requests reporter = currentUser()', async () => {
    fetchMock.mockResolvedValueOnce(searchResponse([]));
    await jiraConnector.fetchRuntime(node({ query: 'authored' }));
    expect(fetchMock.mock.calls[0]?.[0]).toContain(
      'jql=reporter%20%3D%20currentUser()%20AND%20statusCategory%20!%3D%20Done%20ORDER%20BY%20updated%20DESC',
    );
  });

  test('review-requested re-skins to watcher = currentUser(), with NO me-resolution call', async () => {
    fetchMock.mockResolvedValueOnce(searchResponse([]));
    await jiraConnector.fetchRuntime(node({ query: 'review-requested' }));
    // Exactly one request — currentUser() resolves server-side; no /myself step.
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toContain(
      'jql=watcher%20%3D%20currentUser()%20AND%20statusCategory%20!%3D%20Done%20ORDER%20BY%20updated%20DESC',
    );
  });
});

// ── session-riding request shape (D7) ───────────────────────────────────────────

describe('fetchRuntime — session-riding auth', () => {
  test('rides the session: Accept JSON, credentials include, NO Authorization, lunma.connectors never read', async () => {
    fetchMock.mockResolvedValueOnce(searchResponse([]));
    await jiraConnector.fetchRuntime(node({ query: 'assigned' }));
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(init.headers).toEqual({ Accept: 'application/json' });
    expect((init.headers as Record<string, string>).Authorization).toBeUndefined();
    expect(init.credentials).toBe('include');
    expect(init.signal).toBeInstanceOf(AbortSignal);
    // The token record is never consulted — there is no token rung.
    expect(storageGet).not.toHaveBeenCalled();
  });
});

// ── normalization (D4) + inline status (D3) ─────────────────────────────────────

describe('fetchRuntime — normalization', () => {
  test('an issue row leads with its key and links to /browse/{key}', async () => {
    fetchMock.mockResolvedValueOnce(searchResponse([issue('10001', 'PROJ-123', 'Fix the export')]));
    const runtime = await jiraConnector.fetchRuntime(node({ query: 'assigned' }));
    expect(runtime.state).toBe('ok');
    expect(runtime.items).toEqual([
      {
        id: '10001',
        title: 'PROJ-123 Fix the export',
        url: 'https://acme.atlassian.net/browse/PROJ-123',
      },
    ]);
  });

  test('statusCategory maps to one tone inline, with no per-item follow-up request', async () => {
    fetchMock.mockResolvedValueOnce(
      searchResponse([
        issue('1', 'P-1', 'In progress one', 'indeterminate'),
        issue('2', 'P-2', 'Done one', 'done'),
        issue('3', 'P-3', 'Backlog one', 'new'),
        issue('4', 'P-4', 'Frozen one', 'frozen'),
        issue('5', 'P-5', 'No category'),
      ]),
    );
    const runtime = await jiraConnector.fetchRuntime(node({ query: 'assigned' }));
    // Inline: one request only — Jira issues zero enrichment fan-out.
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(runtime.items).toEqual([
      {
        id: '1',
        title: 'P-1 In progress one',
        url: 'https://acme.atlassian.net/browse/P-1',
        status: { tone: 'pending', label: 'In progress' },
      },
      {
        id: '2',
        title: 'P-2 Done one',
        url: 'https://acme.atlassian.net/browse/P-2',
        status: { tone: 'ok', label: 'Done' },
      },
      { id: '3', title: 'P-3 Backlog one', url: 'https://acme.atlassian.net/browse/P-3' },
      { id: '4', title: 'P-4 Frozen one', url: 'https://acme.atlassian.net/browse/P-4' },
      { id: '5', title: 'P-5 No category', url: 'https://acme.atlassian.net/browse/P-5' },
    ]);
  });

  test('a malformed issue is dropped, the rest survive (element-wise parse)', async () => {
    fetchMock.mockResolvedValueOnce(searchResponse([issue('1', 'P-1', 'Good'), { junk: true }]));
    const runtime = await jiraConnector.fetchRuntime(node({ query: 'assigned' }));
    expect(runtime.state).toBe('ok');
    expect(runtime.items.map((i) => i.id)).toEqual(['1']);
  });

  test('results cap at 20 even if the page over-returns', async () => {
    const overfull = Array.from({ length: 25 }, (_, i) =>
      issue(String(i + 1), `P-${i + 1}`, `Issue ${i + 1}`),
    );
    fetchMock.mockResolvedValueOnce(searchResponse(overfull));
    const runtime = await jiraConnector.fetchRuntime(node({ query: 'assigned' }));
    expect(runtime.items).toHaveLength(20);
  });
});

// ── signed-out + error shapes (D8; ported from GitLab) ───────────────────────────

describe('fetchRuntime — signed-out vs error', () => {
  test('a 401 resolves signed-out, never throwing', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ message: 'Unauthorized' }, 401));
    const runtime = await jiraConnector.fetchRuntime(node({ query: 'assigned' }));
    expect(runtime).toMatchObject({ state: 'signed-out', items: [] });
  });

  test('a redirect landing on an HTML login page resolves signed-out', async () => {
    fetchMock.mockResolvedValueOnce(htmlResponse(200, true));
    const runtime = await jiraConnector.fetchRuntime(node({ query: 'assigned' }));
    expect(runtime.state).toBe('signed-out');
  });

  test('any non-JSON body resolves signed-out', async () => {
    fetchMock.mockResolvedValueOnce(htmlResponse(200, false));
    const runtime = await jiraConnector.fetchRuntime(node({ query: 'assigned' }));
    expect(runtime.state).toBe('signed-out');
  });

  test('a 5xx resolves error', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ message: 'boom' }, 503));
    const runtime = await jiraConnector.fetchRuntime(node({ query: 'assigned' }));
    expect(runtime.state).toBe('error');
  });

  test('a 429 resolves error', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ message: 'slow down' }, 429));
    const runtime = await jiraConnector.fetchRuntime(node({ query: 'assigned' }));
    expect(runtime.state).toBe('error');
  });

  test('any other non-2xx (e.g. a 400 from malformed JQL) with a JSON body resolves error', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ errorMessages: ['bad jql'] }, 400));
    const runtime = await jiraConnector.fetchRuntime(node({ query: 'assigned' }));
    expect(runtime.state).toBe('error');
  });

  test('a network failure resolves error', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    const runtime = await jiraConnector.fetchRuntime(node({ query: 'assigned' }));
    expect(runtime.state).toBe('error');
  });

  test('a timed-out request (AbortError) resolves error', async () => {
    fetchMock.mockRejectedValueOnce(new DOMException('signal timed out', 'TimeoutError'));
    const runtime = await jiraConnector.fetchRuntime(node({ query: 'assigned' }));
    expect(runtime.state).toBe('error');
  });

  test('every request carries a bounded timeout signal (a hang resolves, never wedges)', async () => {
    fetchMock.mockResolvedValueOnce(searchResponse([]));
    await jiraConnector.fetchRuntime(node({ query: 'assigned' }));
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  test('a malformed persisted baseUrl degrades to the quiet error state, never a throw', async () => {
    const runtime = await jiraConnector.fetchRuntime(node({ baseUrl: 'not a url' }));
    expect(runtime.state).toBe('error');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

// ── maxItems + listingUrl (rss-connector D5/D6) ─────────────────────────────────

describe('maxItems + listingUrl', () => {
  test('the node maxItems drives the maxResults cap', async () => {
    fetchMock.mockResolvedValueOnce(searchResponse([]));
    await jiraConnector.fetchRuntime(node({ maxItems: 50 }));
    expect(fetchMock.mock.calls[0]?.[0]).toContain('maxResults=50');
  });

  test('listingUrl is the issue navigator opened on the folder JQL', () => {
    const jql = encodeURIComponent(
      'assignee = currentUser() AND statusCategory != Done ORDER BY updated DESC',
    );
    expect(jiraConnector.listingUrl(node({ query: 'assigned' }))).toBe(
      `https://acme.atlassian.net/issues/?jql=${jql}`,
    );
  });

  test('requiredOrigins is the same-origin baseUrl pattern (D8)', () => {
    expect(jiraConnector.requiredOrigins({ baseUrl: 'https://acme.atlassian.net' })).toEqual([
      'https://acme.atlassian.net/*',
    ]);
  });
});
