import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import type { ResolvedLensSource } from '../../shared/types';
import { jiraConnector, kanbanForCategory, priorityForName, statusForCategory } from './jira';

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

/** A richer search-result row carrying the Ticket-entity fields. Every field is
 * optional — omit any to model a provider that did not return it. */
function richIssue(args: {
  id: string;
  key: string;
  summary: string;
  categoryKey?: string;
  statusName?: string;
  priorityName?: string;
  assigneeName?: string;
  projectName?: string;
  updated?: string;
  labels?: string[];
}): Record<string, unknown> {
  return {
    id: args.id,
    key: args.key,
    fields: {
      summary: args.summary,
      ...(args.categoryKey === undefined && args.statusName === undefined
        ? {}
        : {
            status: {
              ...(args.statusName === undefined ? {} : { name: args.statusName }),
              ...(args.categoryKey === undefined
                ? {}
                : { statusCategory: { key: args.categoryKey } }),
            },
          }),
      ...(args.priorityName === undefined ? {} : { priority: { name: args.priorityName } }),
      ...(args.assigneeName === undefined ? {} : { assignee: { displayName: args.assigneeName } }),
      ...(args.projectName === undefined ? {} : { project: { name: args.projectName } }),
      ...(args.updated === undefined ? {} : { updated: args.updated }),
      ...(args.labels === undefined ? {} : { labels: args.labels }),
    },
  };
}

let fetchMock: ReturnType<typeof vi.fn>;

function node(overrides: Partial<ResolvedLensSource> = {}): ResolvedLensSource {
  return {
    source: 'jira',
    baseUrl: 'https://acme.atlassian.net',
    query: 'assigned',
    lensKind: 'general',
    sourceId: 'acc-jira',
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

// ── Ticket-entity mappers (Lens Overview, design §4) ────────────────────────────

describe('kanbanForCategory', () => {
  test('maps the three Jira categories to kanban columns; unmapped/absent → todo', () => {
    expect(kanbanForCategory('new')).toBe('todo');
    expect(kanbanForCategory('indeterminate')).toBe('in-progress');
    expect(kanbanForCategory('done')).toBe('done');
    // Defensive default — the Ticket entity always carries a column.
    expect(kanbanForCategory('frozen')).toBe('todo');
    expect(kanbanForCategory(undefined)).toBe('todo');
  });
});

describe('priorityForName', () => {
  test('maps each default-scheme priority to its bucket', () => {
    expect(priorityForName('Highest')).toBe('urgent');
    expect(priorityForName('Blocker')).toBe('urgent');
    expect(priorityForName('Critical')).toBe('urgent');
    expect(priorityForName('High')).toBe('high');
    expect(priorityForName('Medium')).toBe('med');
    expect(priorityForName('Low')).toBe('low');
    expect(priorityForName('Lowest')).toBe('low');
  });

  test('an unmapped/custom or absent priority name is omitted (never faked)', () => {
    expect(priorityForName('P0 — drop everything')).toBeUndefined();
    expect(priorityForName('Trivial')).toBeUndefined();
    expect(priorityForName(undefined)).toBeUndefined();
  });
});

// ── canned queries (D2) ─────────────────────────────────────────────────────────

describe('fetchRuntime — canned queries', () => {
  test('assigned requests assignee = currentUser() over the GA /search/jql endpoint', async () => {
    fetchMock.mockResolvedValueOnce(searchResponse([]));
    const runtime = await jiraConnector.fetchRuntime(node({ query: 'assigned' }), 20);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      'https://acme.atlassian.net/rest/api/3/search/jql?jql=assignee%20%3D%20currentUser()%20AND%20statusCategory%20!%3D%20Done%20ORDER%20BY%20updated%20DESC&fields=summary,status,priority,assignee,project,updated,labels&maxResults=20',
    );
    expect(runtime.state).toBe('ok');
  });

  test('authored requests reporter = currentUser()', async () => {
    fetchMock.mockResolvedValueOnce(searchResponse([]));
    await jiraConnector.fetchRuntime(node({ query: 'authored' }), 20);
    expect(fetchMock.mock.calls[0]?.[0]).toContain(
      'jql=reporter%20%3D%20currentUser()%20AND%20statusCategory%20!%3D%20Done%20ORDER%20BY%20updated%20DESC',
    );
  });

  test('review-requested re-skins to watcher = currentUser(), with NO me-resolution call', async () => {
    fetchMock.mockResolvedValueOnce(searchResponse([]));
    await jiraConnector.fetchRuntime(node({ query: 'review-requested' }), 20);
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
    await jiraConnector.fetchRuntime(node({ query: 'assigned' }), 20);
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
    const runtime = await jiraConnector.fetchRuntime(node({ query: 'assigned' }), 20);
    expect(runtime.state).toBe('ok');
    const [item] = runtime.items;
    expect(item).toMatchObject({
      id: '10001',
      // The key still prefixes the summary (sidebar parity) AND is carried on
      // the Ticket entity for the board to read separately.
      title: 'PROJ-123 Fix the export',
      url: 'https://acme.atlassian.net/browse/PROJ-123',
      ticket: { key: 'PROJ-123', statusCategory: 'todo', statusLabel: '' },
    });
    // No status category supplied → no glyph, but the ticket entity is present.
    expect(item).not.toHaveProperty('status');
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
    const runtime = await jiraConnector.fetchRuntime(node({ query: 'assigned' }), 20);
    // Inline: one request only — Jira issues zero enrichment fan-out.
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(runtime.items).toMatchObject([
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
    // The glyph (`status`) is omitted for `new`/unmapped/absent, but the kanban
    // column on the Ticket entity always resolves (defaulting to `todo`).
    expect(runtime.items.map((i) => i.ticket?.statusCategory)).toEqual([
      'in-progress',
      'done',
      'todo',
      'todo',
      'todo',
    ]);
    expect(runtime.items[2]).not.toHaveProperty('status');
    expect(runtime.items[3]).not.toHaveProperty('status');
    expect(runtime.items[4]).not.toHaveProperty('status');
  });

  test('a malformed issue is dropped, the rest survive (element-wise parse)', async () => {
    fetchMock.mockResolvedValueOnce(searchResponse([issue('1', 'P-1', 'Good'), { junk: true }]));
    const runtime = await jiraConnector.fetchRuntime(node({ query: 'assigned' }), 20);
    expect(runtime.state).toBe('ok');
    expect(runtime.items.map((i) => i.id)).toEqual(['1']);
  });

  test('results cap at 20 even if the page over-returns', async () => {
    const overfull = Array.from({ length: 25 }, (_, i) =>
      issue(String(i + 1), `P-${i + 1}`, `Issue ${i + 1}`),
    );
    fetchMock.mockResolvedValueOnce(searchResponse(overfull));
    const runtime = await jiraConnector.fetchRuntime(node({ query: 'assigned' }), 20);
    expect(runtime.items).toHaveLength(20);
  });
});

// ── Ticket entity (Lens Overview, design §4) ─────────────────────────────────────

describe('fetchRuntime — Ticket entity', () => {
  test('a fully-populated issue carries the complete ticket bag, with the key prefix kept', async () => {
    fetchMock.mockResolvedValueOnce(
      searchResponse([
        richIssue({
          id: '10001',
          key: 'PAY-91',
          summary: 'Wire the gateway',
          categoryKey: 'indeterminate',
          statusName: 'In Review',
          priorityName: 'High',
          assigneeName: 'Ada Lovelace',
          projectName: 'Payments',
          updated: '2026-06-20T12:00:00.000Z',
          labels: ['backend', 'urgent-ish'],
        }),
      ]),
    );
    const runtime = await jiraConnector.fetchRuntime(node({ query: 'assigned' }), 20);
    const [item] = runtime.items;
    // The summary keeps its key prefix (sidebar parity); the board reads
    // `ticket.key` separately.
    expect(item?.title).toBe('PAY-91 Wire the gateway');
    expect(item?.ticket).toEqual({
      key: 'PAY-91',
      statusCategory: 'in-progress',
      statusLabel: 'In Review',
      priority: 'high',
      assignee: 'Ada Lovelace',
      project: 'Payments',
      labels: ['backend', 'urgent-ish'],
      updatedAt: Date.parse('2026-06-20T12:00:00.000Z'),
    });
  });

  test('absent assignee/project/labels/priority are OMITTED, not set to undefined', async () => {
    fetchMock.mockResolvedValueOnce(
      searchResponse([
        richIssue({
          id: '2',
          key: 'PAY-92',
          summary: 'Bare ticket',
          categoryKey: 'new',
          statusName: 'To Do',
          updated: '2026-06-21T08:00:00.000Z',
        }),
      ]),
    );
    const runtime = await jiraConnector.fetchRuntime(node({ query: 'assigned' }), 20);
    const ticket = runtime.items[0]?.ticket;
    expect(ticket).toEqual({
      key: 'PAY-92',
      statusCategory: 'todo',
      statusLabel: 'To Do',
      updatedAt: Date.parse('2026-06-21T08:00:00.000Z'),
    });
    // Conditional-spread omission: the keys are absent (not present-as-undefined).
    expect(ticket).not.toHaveProperty('priority');
    expect(ticket).not.toHaveProperty('assignee');
    expect(ticket).not.toHaveProperty('project');
    expect(ticket).not.toHaveProperty('labels');
  });

  test('an empty labels array is omitted (treated as absent)', async () => {
    fetchMock.mockResolvedValueOnce(
      searchResponse([richIssue({ id: '3', key: 'PAY-93', summary: 'No labels', labels: [] })]),
    );
    const runtime = await jiraConnector.fetchRuntime(node({ query: 'assigned' }), 20);
    expect(runtime.items[0]?.ticket).not.toHaveProperty('labels');
  });

  test('an unmapped/custom priority is omitted (never coerced to a bucket)', async () => {
    fetchMock.mockResolvedValueOnce(
      searchResponse([
        richIssue({
          id: '4',
          key: 'PAY-94',
          summary: 'Custom priority',
          priorityName: 'P0 — drop everything',
        }),
      ]),
    );
    const runtime = await jiraConnector.fetchRuntime(node({ query: 'assigned' }), 20);
    expect(runtime.items[0]?.ticket).not.toHaveProperty('priority');
  });

  test('an absent or unparseable `updated` falls back to the section fetch time', async () => {
    const before = Date.now();
    fetchMock.mockResolvedValueOnce(
      searchResponse([
        richIssue({ id: '5', key: 'PAY-95', summary: 'No updated stamp' }),
        richIssue({ id: '6', key: 'PAY-96', summary: 'Garbage stamp', updated: 'not a date' }),
      ]),
    );
    const runtime = await jiraConnector.fetchRuntime(node({ query: 'assigned' }), 20);
    const after = Date.now();
    for (const item of runtime.items) {
      const at = item.ticket?.updatedAt ?? Number.NaN;
      expect(at).toBeGreaterThanOrEqual(before);
      expect(at).toBeLessThanOrEqual(after);
    }
  });

  test('statusLabel is the raw provider status name; absent status → empty label, todo column', async () => {
    fetchMock.mockResolvedValueOnce(
      searchResponse([
        richIssue({ id: '7', key: 'PAY-97', summary: 'Raw status', statusName: 'Awaiting QA' }),
        richIssue({ id: '8', key: 'PAY-98', summary: 'No status object' }),
      ]),
    );
    const runtime = await jiraConnector.fetchRuntime(node({ query: 'assigned' }), 20);
    expect(runtime.items[0]?.ticket).toMatchObject({
      statusLabel: 'Awaiting QA',
      statusCategory: 'todo',
    });
    expect(runtime.items[1]?.ticket).toMatchObject({ statusLabel: '', statusCategory: 'todo' });
  });

  test('Jira emits no change bag and no refs (ticket entity only)', async () => {
    fetchMock.mockResolvedValueOnce(
      searchResponse([richIssue({ id: '9', key: 'PAY-99', summary: 'Just a ticket' })]),
    );
    const runtime = await jiraConnector.fetchRuntime(node({ query: 'assigned' }), 20);
    const [item] = runtime.items;
    expect(item).not.toHaveProperty('change');
    expect(item).not.toHaveProperty('refs');
    expect(item?.ticket).toBeDefined();
  });
});

// ── signed-out + error shapes (D8; ported from GitLab) ───────────────────────────

describe('fetchRuntime — signed-out vs error', () => {
  test('a 401 resolves signed-out, never throwing', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ message: 'Unauthorized' }, 401));
    const runtime = await jiraConnector.fetchRuntime(node({ query: 'assigned' }), 20);
    expect(runtime).toMatchObject({ state: 'signed-out', items: [] });
  });

  test('a redirect landing on an HTML login page resolves signed-out', async () => {
    fetchMock.mockResolvedValueOnce(htmlResponse(200, true));
    const runtime = await jiraConnector.fetchRuntime(node({ query: 'assigned' }), 20);
    expect(runtime.state).toBe('signed-out');
  });

  test('any non-JSON body resolves signed-out', async () => {
    fetchMock.mockResolvedValueOnce(htmlResponse(200, false));
    const runtime = await jiraConnector.fetchRuntime(node({ query: 'assigned' }), 20);
    expect(runtime.state).toBe('signed-out');
  });

  test('a 5xx resolves error', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ message: 'boom' }, 503));
    const runtime = await jiraConnector.fetchRuntime(node({ query: 'assigned' }), 20);
    expect(runtime.state).toBe('error');
  });

  test('a 429 resolves error', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ message: 'slow down' }, 429));
    const runtime = await jiraConnector.fetchRuntime(node({ query: 'assigned' }), 20);
    expect(runtime.state).toBe('error');
  });

  test('any other non-2xx (e.g. a 400 from malformed JQL) with a JSON body resolves error', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ errorMessages: ['bad jql'] }, 400));
    const runtime = await jiraConnector.fetchRuntime(node({ query: 'assigned' }), 20);
    expect(runtime.state).toBe('error');
  });

  test('a network failure resolves error', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    const runtime = await jiraConnector.fetchRuntime(node({ query: 'assigned' }), 20);
    expect(runtime.state).toBe('error');
  });

  test('a timed-out request (AbortError) resolves error', async () => {
    fetchMock.mockRejectedValueOnce(new DOMException('signal timed out', 'TimeoutError'));
    const runtime = await jiraConnector.fetchRuntime(node({ query: 'assigned' }), 20);
    expect(runtime.state).toBe('error');
  });

  test('every request carries a bounded timeout signal (a hang resolves, never wedges)', async () => {
    fetchMock.mockResolvedValueOnce(searchResponse([]));
    await jiraConnector.fetchRuntime(node({ query: 'assigned' }), 20);
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  test('a malformed persisted baseUrl degrades to the quiet error state, never a throw', async () => {
    const runtime = await jiraConnector.fetchRuntime(node({ baseUrl: 'not a url' }), 20);
    expect(runtime.state).toBe('error');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

// ── maxItems + listingUrl (rss-connector D5/D6) ─────────────────────────────────

describe('maxItems + listingUrl', () => {
  test('the node maxItems drives the maxResults cap', async () => {
    fetchMock.mockResolvedValueOnce(searchResponse([]));
    await jiraConnector.fetchRuntime(node(), 50);
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
    expect(
      jiraConnector.requiredOrigins({
        source: 'jira',
        baseUrl: 'https://acme.atlassian.net',
        lensKind: 'general',
        sourceId: 'acc-jira',
      }),
    ).toEqual(['https://acme.atlassian.net/*']);
  });

  test('declares session-only authMethods', () => {
    expect(jiraConnector.authMethods).toEqual(['session']);
  });
});
