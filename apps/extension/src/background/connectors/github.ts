import { z } from 'zod';
import { requiredOriginsForConfig } from '../../shared/connector-origins';
import { readConnectors } from '../../shared/connectors';
import type {
  SmartFolderItem,
  SmartQuery,
  SmartSectionRuntime,
  SmartSourceConfig,
} from '../../shared/types';
import { boundedFetch, type ConnectorCaches, type SourceConnector } from './connector';

/**
 * The GitHub connector (github-connector, design D3–D5): pull requests over
 * the search API — github.com AND GitHub Enterprise Server via the same
 * per-folder `baseUrl`.
 *
 *   - queries: the three canned queries → `GET {apiRoot}/search/issues` with
 *     `@me` qualifiers (server-side resolution — NO me-resolution call);
 *   - auth: token-only (`Authorization: Bearer`, `credentials: 'omit'`) —
 *     api.github.com ignores browser sessions, so there is no cookie rung and
 *     a missing token short-circuits to `signed-out` without a request;
 *   - status: bounded check-run enrichment aggregated onto the four tones
 *     (fail > pending > ok > warn; unmapped conclusions ignored).
 */

/** Check-run-enrichment fan-out bound (≤2 extra requests per listed PR). */
const ENRICH_CONCURRENCY = 5;

/** The per-host token lookup key: hostname plus any explicit port. */
function hostOf(baseUrl: string): string {
  return new URL(baseUrl).host;
}

/**
 * The folder's REST root: `https://api.github.com` for github.com itself,
 * else `{baseUrl}/api/v3` (GitHub Enterprise Server's documented REST root —
 * a nonstandard proxy degrades to the calm `error` note, never a crash).
 */
export function apiRootOf(baseUrl: string): string {
  return new URL(baseUrl).host === 'github.com' ? 'https://api.github.com' : `${baseUrl}/api/v3`;
}

/** The search qualifier per canned query — `@me` resolves server-side under
 * token auth. */
function qualifierFor(query: SmartQuery): string {
  switch (query) {
    case 'authored':
      return 'author:@me';
    case 'assigned':
      return 'assignee:@me';
    case 'review-requested':
      return 'review-requested:@me';
  }
}

// ── fetch (token-only; interpretation deliberately NOT GitLab's) ───────────────

type GetOutcome = { kind: 'ok'; json: unknown } | { kind: 'signed-out' } | { kind: 'error' };

/**
 * One authenticated GET. A 401 (revoked/malformed token) resolves
 * `signed-out`; ANY other non-2xx — 403 in all its shapes (rate limit,
 * SAML-unauthorized org, fine-grained-PAT scope gaps), 5xx — plus network
 * failures and timeouts resolve `error`. Authenticated GitHub API answers are
 * always JSON, so there is no non-JSON→signed-out heuristic here (that is
 * GitLab's cookie-session-specific rule).
 */
async function githubGet(url: string, token: string): Promise<GetOutcome> {
  let response: Response;
  try {
    // Bounded: a timeout rejects (AbortError) into the catch below → 'error'.
    response = await boundedFetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
      },
      credentials: 'omit',
    });
  } catch {
    return { kind: 'error' };
  }
  if (response.status === 401) return { kind: 'signed-out' };
  if (!response.ok) return { kind: 'error' };
  let json: unknown;
  try {
    json = await response.json();
  } catch {
    return { kind: 'error' };
  }
  return { kind: 'ok', json };
}

// ── response shapes (lenient: unknown keys stripped, never rejected) ───────────

const SearchItemSchema = z.object({
  id: z.union([z.number(), z.string()]),
  title: z.string(),
  html_url: z.string(),
  pull_request: z.object({ url: z.string() }).optional(),
});

const SearchResponseSchema = z.object({ items: z.array(z.unknown()) });

const PrDetailSchema = z.object({
  draft: z.boolean().optional(),
  head: z.object({ sha: z.string() }).optional(),
  base: z.object({ repo: z.object({ full_name: z.string() }) }).optional(),
});

const CheckRunsSchema = z.object({
  check_runs: z.array(
    z.object({
      status: z.string(),
      conclusion: z.string().nullable().optional(),
    }),
  ),
});

type CheckRun = z.infer<typeof CheckRunsSchema>['check_runs'][number];

// ── check-run aggregation (D5) ─────────────────────────────────────────────────

const FAIL_CONCLUSIONS = new Set(['failure', 'timed_out', 'action_required']);
const WARN_CONCLUSIONS = new Set(['skipped', 'cancelled']);

/**
 * Aggregate a commit's check runs onto one tone, by precedence: any failing
 * conclusion → `fail`; else any incomplete run → `pending`; else any success →
 * `ok`; else any skipped/cancelled → `warn`. Unmapped conclusions (`neutral`,
 * `stale`, anything GitHub adds later) are ignored — when only unmapped
 * conclusions remain, or there are zero runs, the item carries no status
 * (absence over guessing, the GitLab unmapped-pipeline precedent).
 */
export function aggregateCheckRuns(runs: CheckRun[]): SmartFolderItem['status'] {
  if (runs.some((r) => FAIL_CONCLUSIONS.has(r.conclusion ?? ''))) {
    return { tone: 'fail', label: 'Checks failed' };
  }
  if (runs.some((r) => r.status !== 'completed')) {
    return { tone: 'pending', label: 'Checks running' };
  }
  if (runs.some((r) => r.conclusion === 'success')) {
    return { tone: 'ok', label: 'Checks passed' };
  }
  if (runs.some((r) => WARN_CONCLUSIONS.has(r.conclusion ?? ''))) {
    return { tone: 'warn', label: 'Checks skipped' };
  }
  return undefined;
}

/** Map items through `fn` with at most `limit` in flight at once. */
async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    for (;;) {
      const index = next;
      next += 1;
      if (index >= items.length) return;
      const item = items[index] as T;
      results[index] = await fn(item);
    }
  });
  await Promise.all(workers);
  return results;
}

interface Enrichment {
  draft: boolean;
  status: SmartFolderItem['status'];
}

/**
 * Bounded per-PR enrichment (≤2 extra requests each): the search item's
 * `pull_request.url` → PR detail (carries `head.sha` and `draft`), then that
 * commit's check-runs at `per_page=100` (one page — the default 30 could hide
 * a failing run on check-heavy repos; 100 covers realistic suites without
 * pagination). Any failure leaves the item glyph-less, never failing the
 * folder.
 */
async function enrich(
  prUrl: string | undefined,
  apiRoot: string,
  token: string,
): Promise<Enrichment> {
  const none: Enrichment = { draft: false, status: undefined };
  if (prUrl === undefined) return none;
  const detailOutcome = await githubGet(prUrl, token);
  if (detailOutcome.kind !== 'ok') return none;
  const detail = PrDetailSchema.safeParse(detailOutcome.json);
  if (!detail.success) return none;
  const draft = detail.data.draft === true;
  const sha = detail.data.head?.sha;
  const repo = detail.data.base?.repo.full_name;
  if (sha === undefined || repo === undefined) return { draft, status: undefined };
  const runsOutcome = await githubGet(
    `${apiRoot}/repos/${repo}/commits/${sha}/check-runs?per_page=100`,
    token,
  );
  if (runsOutcome.kind !== 'ok') return { draft, status: undefined };
  const runs = CheckRunsSchema.safeParse(runsOutcome.json);
  if (!runs.success) return { draft, status: undefined };
  return { draft, status: aggregateCheckRuns(runs.data.check_runs) };
}

/**
 * Fetch one GitHub smart folder section's results. Never throws — every failure
 * shape resolves to a runtime state. No token for the folder's host
 * short-circuits to `signed-out` WITHOUT a request (the `@me` queries require
 * auth, so the request could only fail; not sending it is honest and
 * rate-limit kind).
 */
async function fetchRuntime(
  cfg: SmartSourceConfig,
  maxItems: number,
  _caches?: ConnectorCaches,
): Promise<SmartSectionRuntime> {
  const fetchedAt = Date.now();
  const fail = (state: 'signed-out' | 'error'): SmartSectionRuntime => ({
    state,
    items: [],
    fetchedAt,
  });

  let host: string;
  let apiRoot: string;
  try {
    host = hostOf(cfg.baseUrl);
    apiRoot = apiRootOf(cfg.baseUrl);
  } catch {
    // A malformed persisted baseUrl (defensive — the SW validates on
    // create/update) degrades to the quiet error state, never a throw.
    return fail('error');
  }
  const connectors = await readConnectors();
  const token = connectors[host];
  if (token === undefined) return fail('signed-out');

  // A queue node always carries a query (source-optional only for feeds);
  // default defensively so the now-optional field stays a total switch.
  const query: SmartQuery = cfg.query ?? 'assigned';

  // `advanced_search=true` rides GitHub's issue-search migration — becoming
  // required on github.com, ignored by GHE versions that predate it. The
  // per-section cap (rss-connector design D5) bounds the page; the badge shows
  // `N+` at it, so the cap is never silent.
  const url =
    `${apiRoot}/search/issues?q=is:pr+is:open+${qualifierFor(query)}` +
    `&per_page=${maxItems}&sort=updated&order=desc&advanced_search=true`;
  const outcome = await githubGet(url, token);
  if (outcome.kind !== 'ok') return fail(outcome.kind);
  const parsed = SearchResponseSchema.safeParse(outcome.json);
  if (!parsed.success) return fail('error');

  // Element-wise parse: one malformed item never costs the rest of the list.
  const prs = parsed.data.items
    .flatMap((element) => {
      const item = SearchItemSchema.safeParse(element);
      return item.success ? [item.data] : [];
    })
    .slice(0, maxItems);

  const enrichments = await mapWithConcurrency(prs, ENRICH_CONCURRENCY, (pr) =>
    enrich(pr.pull_request?.url, apiRoot, token),
  );

  const items: SmartFolderItem[] = prs.map((pr, index) => {
    const enrichment = enrichments[index] ?? { draft: false, status: undefined };
    return {
      id: String(pr.id),
      // GitHub does not bake draft-ness into the title the way GitLab does —
      // the prefix restores at-a-glance parity.
      title: enrichment.draft ? `Draft: ${pr.title}` : pr.title,
      url: pr.html_url,
      ...(enrichment.status !== undefined ? { status: enrichment.status } : {}),
    };
  });

  return { state: 'ok', items, fetchedAt };
}

/** The full listing on the forge (rss-connector design D6, "open all in a
 * tab"): GitHub's pull-requests dashboard — the canonical "PRs that involve me"
 * page (github.com AND GHE both serve `/pulls`), independent of the canned
 * query. */
function listingUrl(cfg: SmartSourceConfig): string {
  return `${cfg.baseUrl}/pulls`;
}

/**
 * The origin this connector fetches (least-privilege-permissions design D8):
 * github.com folders fetch `api.github.com` (a DIFFERENT origin), GHE is
 * same-origin. Delegates to the shared {@link requiredOriginsForConfig} so the
 * SW gate and the surfaces' grant request share one derivation.
 */
function requiredOrigins(cfg: SmartSourceConfig): string[] {
  return requiredOriginsForConfig(cfg);
}

/** The GitHub `SourceConnector` — the registry's `github` entry. */
export const githubConnector: SourceConnector = {
  source: 'github',
  defaultBaseUrl: 'https://github.com',
  mintedIcon: 'folder-git-2',
  requiredOrigins,
  fetchRuntime,
  listingUrl,
};
