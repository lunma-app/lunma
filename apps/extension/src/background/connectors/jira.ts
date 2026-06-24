import { z } from 'zod';
import { requiredOriginsForConfig } from '../../shared/connector-origins';
import type {
  LensItem,
  LensQuery,
  LensSectionRuntime,
  ResolvedLensSource,
} from '../../shared/types';
import { boundedFetch, type ConnectorCaches, type SourceConnector } from './connector';

/**
 * The Jira connector (jira-connector, design D2–D4, D7–D8): Jira Cloud issues
 * over the GA search/JQL endpoint — the third source, the first non-forge one.
 *
 *   - queries: the three canned slots → JQL `currentUser()` filters (server-side
 *     resolution — NO me-resolution call), the `review-requested` slot re-skinned
 *     to `watcher` ("Watching"); one `GET {baseUrl}/rest/api/3/search/jql`;
 *   - auth: session-riding ONLY (`credentials: 'include'`, no `Authorization`,
 *     no `lunma.connectors` read, no token rung) — Atlassian honours the
 *     in-product session cookie on this endpoint from the SW origin (the
 *     feasibility spike, design D7);
 *   - status: `fields.status.statusCategory.key` taken INLINE from the search
 *     response (zero enrichment fan-out — Jira's distinguishing trait, unlike
 *     GitLab's pipeline / GitHub's check-run follow-ups);
 *   - signed-out: GitLab's response-shape heuristic, ported and kept here.
 *
 * The source-agnostic engine (scheduling, in-flight guard, result-event
 * plumbing) stays in `../lenses.ts` and reaches this module only through
 * the `CONNECTORS` registry.
 */

// ── JQL translation (D2) ───────────────────────────────────────────────────────

/** The JQL per canned slot. `currentUser()` resolves server-side under the
 * session (GitHub's `@me` precedent — no me-resolution request); every slot
 * excludes Done and orders by recency for a stable order between polls. The
 * `review-requested` slot is re-skinned to `watcher` (editor label "Watching")
 * — the `LensQuery` value is unchanged; only label + JQL differ (design D9). */
function jqlFor(query: LensQuery): string {
  const tail = 'AND statusCategory != Done ORDER BY updated DESC';
  switch (query) {
    case 'authored':
      return `reporter = currentUser() ${tail}`;
    case 'assigned':
      return `assignee = currentUser() ${tail}`;
    case 'review-requested':
      return `watcher = currentUser() ${tail}`;
  }
}

// ── statusCategory → tone (D3, inline, no enrichment) ───────────────────────────

/**
 * Map a Jira `statusCategory.key` onto the semantic status tones. `indeterminate`
 * (In Progress) → `pending`; `done` → `ok`; `new` (To Do) and any
 * unmapped/absent key → `undefined` (no glyph — absence over guessing). Because
 * every canned JQL excludes Done, the live signal is In Progress vs backlog; the
 * `done` → `ok` branch is defensive (robust to a transition between fetch and
 * render).
 */
export function statusForCategory(categoryKey: string | undefined): LensItem['status'] {
  switch (categoryKey) {
    case 'indeterminate':
      return { tone: 'pending', label: 'In progress' };
    case 'done':
      return { tone: 'ok', label: 'Done' };
    default:
      return undefined;
  }
}

// ── fetch + signed-out detection (D7, D8; ported from GitLab, kept here) ─────────

type GetOutcome = { kind: 'ok'; json: unknown } | { kind: 'signed-out' } | { kind: 'error' };

/**
 * One session-riding GET. Signed-out detection is response-shape-based and
 * deliberately paranoid: a 401, a redirect landing on a non-JSON (atlassian
 * login) document, or any non-JSON body resolves `signed-out`; network errors,
 * timeouts, and 5xx/429 resolve `error`; any other non-2xx (e.g. a 400 from a
 * malformed JQL — not expected from canned queries) resolves `error`. Never
 * throws. The cookie rides via `credentials: 'include'` with NO `Authorization`
 * header; the non-JSON heuristic is cookie-session-specific and stays here.
 */
async function jiraGet(url: string): Promise<GetOutcome> {
  let response: Response;
  try {
    // Bounded: a timeout rejects (AbortError) into the catch below → 'error'.
    response = await boundedFetch(url, {
      headers: { Accept: 'application/json' },
      credentials: 'include',
    });
  } catch {
    return { kind: 'error' };
  }
  if (response.status === 401) return { kind: 'signed-out' };
  if (response.status === 429 || response.status >= 500) return { kind: 'error' };
  let json: unknown;
  try {
    json = await response.json();
  } catch {
    // A login redirect lands as a followed 200 HTML page; any non-JSON body
    // means the API did not answer — the session is not riding along.
    return { kind: 'signed-out' };
  }
  if (!response.ok) return { kind: 'error' };
  return { kind: 'ok', json };
}

// ── response shapes (lenient: unknown keys stripped, never rejected) ────────────

const IssueSchema = z.object({
  id: z.union([z.string(), z.number()]),
  key: z.string(),
  fields: z.object({
    summary: z.string(),
    status: z.object({ statusCategory: z.object({ key: z.string() }).nullish() }).nullish(),
  }),
});

// The GA `/search/jql` body is `{ issues, isLast }` (token pagination — no
// `total`); v1 reads only the first page.
const SearchResponseSchema = z.object({ issues: z.array(z.unknown()) });

/**
 * Fetch one Jira smart folder section's results. Never throws — every failure
 * shape resolves to a runtime state. No me-resolution call, no enrichment
 * fan-out, no `ConnectorCaches` (the `caches` parameter is ignored): one GET,
 * status read inline from the search response.
 */
async function fetchRuntime(
  cfg: ResolvedLensSource,
  maxItems: number,
  _caches?: ConnectorCaches,
): Promise<LensSectionRuntime> {
  const fetchedAt = Date.now();
  const fail = (state: 'signed-out' | 'error'): LensSectionRuntime => ({
    state,
    items: [],
    fetchedAt,
  });

  try {
    // A malformed persisted baseUrl (defensive — the SW validates on
    // create/update; the unedited placeholder is also caught here) degrades to
    // the quiet error state, never a throw.
    new URL(cfg.baseUrl);
  } catch {
    return fail('error');
  }

  // A queue node always carries a query (source-optional only for feeds);
  // default defensively so the now-optional field stays a total switch.
  const query: LensQuery = cfg.query ?? 'assigned';

  // Per-section cap (rss-connector design D5) — the badge renders `N+` at it, so
  // the cap is never silent (the forge precedent).
  const url =
    `${cfg.baseUrl}/rest/api/3/search/jql?jql=${encodeURIComponent(jqlFor(query))}` +
    `&fields=summary,status&maxResults=${maxItems}`;
  const outcome = await jiraGet(url);
  if (outcome.kind !== 'ok') return fail(outcome.kind);
  const parsed = SearchResponseSchema.safeParse(outcome.json);
  if (!parsed.success) return fail('error');

  // Element-wise parse: one malformed issue never costs the rest of the list.
  const items: LensItem[] = parsed.data.issues
    .flatMap((element) => {
      const issue = IssueSchema.safeParse(element);
      return issue.success ? [issue.data] : [];
    })
    .slice(0, maxItems)
    .map((issue) => {
      const status = statusForCategory(issue.fields.status?.statusCategory?.key ?? undefined);
      return {
        id: String(issue.id),
        // Jira issues are identified by their key (`PROJ-123`) — the key
        // prefixes the summary, restoring the scan anchor (GitHub's `Draft: `
        // normalization precedent).
        title: `${issue.key} ${issue.fields.summary}`,
        url: `${cfg.baseUrl}/browse/${issue.key}`,
        ...(status !== undefined ? { status } : {}),
      };
    });

  return { state: 'ok', items, fetchedAt };
}

/** The full listing on the instance (rss-connector design D6, "open all in a
 * tab"): the Jira issue navigator opened on the folder's own JQL — the "JQL
 * view" of exactly what the folder queues. The query is source-optional only
 * for feeds, so a queue node always supplies one (defaulted defensively). */
function listingUrl(cfg: ResolvedLensSource): string {
  return `${cfg.baseUrl}/issues/?jql=${encodeURIComponent(jqlFor(cfg.query ?? 'assigned'))}`;
}

/** The origin this connector fetches (least-privilege-permissions design D8):
 * Jira fetches same-origin under `{baseUrl}/rest/api/3`. Delegates to the shared
 * {@link requiredOriginsForConfig} so the SW gate and the surfaces share one
 * derivation. */
function requiredOrigins(cfg: ResolvedLensSource): string[] {
  return requiredOriginsForConfig(cfg);
}

/** The Jira `SourceConnector` — the registry's `jira` entry. */
export const jiraConnector: SourceConnector = {
  source: 'jira',
  defaultBaseUrl: 'https://your-site.atlassian.net',
  mintedIcon: 'folder-kanban',
  requiredOrigins,
  fetchRuntime,
  listingUrl,
};
