import { z } from 'zod';
import { PROVIDER_AUTH_METHODS } from '../../shared/auth-method';
import { requiredOriginsForConfig } from '../../shared/connector-origins';
import { readAccountTokens } from '../../shared/connectors';
import type {
  ChangeData,
  EntityRef,
  LensItem,
  LensQuery,
  LensSectionRuntime,
  ResolvedLensSource,
  TicketData,
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

/** Per-PR enrichment fan-out bound (≤2 extra requests per listed PR for a
 * general lens — detail + check-runs; ≤3 for a review lens — plus reviews). */
const ENRICH_CONCURRENCY = 5;

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
function qualifierFor(query: LensQuery): string {
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
  // Issue-pass fields (lens-overview): the search item itself carries everything
  // a `ticket` bag needs, so the issue pass never enriches per-row. All optional
  // so a partial item never fails the section (the PR pass ignores these).
  number: z.number().optional(),
  state: z.string().optional(),
  updated_at: z.string().optional(),
  repository_url: z.string().optional(),
  assignees: z.array(z.object({ login: z.string() })).optional(),
  labels: z.array(z.object({ name: z.string() })).optional(),
});

const SearchResponseSchema = z.object({ items: z.array(z.unknown()) });

const PrDetailSchema = z.object({
  draft: z.boolean().optional(),
  head: z.object({ sha: z.string() }).optional(),
  base: z
    .object({ ref: z.string().optional(), repo: z.object({ full_name: z.string() }) })
    .optional(),
  // review-lens enrichment fields (D4) — all optional/lenient so a partial PR
  // detail never fails the section.
  user: z.object({ login: z.string() }).optional(),
  additions: z.number().optional(),
  deletions: z.number().optional(),
  updated_at: z.string().optional(),
  requested_reviewers: z.array(z.object({ login: z.string() })).optional(),
  // Linked-ticket extraction source (lens-overview, L0) — the PR description.
  // ALREADY fetched in the enrich step, so reading it costs no extra request.
  body: z.string().nullable().optional(),
});

// The PR reviews list (review-lens, D4): one entry per submitted review. `state`
// is GitHub's review verdict; `COMMENTED`/`PENDING` carry no verdict and are
// skipped. Lenient — unknown keys stripped, a malformed entry costs only itself.
const ReviewsSchema = z.array(
  z.object({
    user: z.object({ login: z.string() }).nullable().optional(),
    state: z.string(),
  }),
);

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
export function aggregateCheckRuns(runs: CheckRun[]): LensItem['status'] {
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

// ── linked-ticket extraction (lens-overview, L0) ────────────────────────────────

/** A bare Jira issue key anywhere in the PR title/body (`PAY-91`). */
const JIRA_KEY_RE = /\b[A-Z][A-Z0-9]+-\d+\b/;
/** A verb-gated GitHub issue closer (`Closes #88`, `Fixes #12`, `Resolves #3`). */
const CLOSES_ISSUE_RE = /(?:Closes|Fixes|Resolves)\s+#(\d+)/i;

/**
 * Extract the PR's linked-ticket refs (lens-overview, L0 — URL-only, no
 * cross-lens resolution) from its `title` + `body`. At most one ref per kind,
 * first match wins:
 *
 *   - a bare Jira key → a chip with an EMPTY url (L0-honest: github has no link
 *     to a foreign Jira instance — never fabricate one);
 *   - a verb-gated `Closes/Fixes/Resolves #N` → a `#N` chip linking to that
 *     repo's issue (`{baseUrl}/{owner/repo}/issues/N`).
 *
 * Returns `undefined` when neither matches — the caller OMITS `refs` entirely.
 */
function extractRefs(
  title: string,
  body: string | null | undefined,
  baseUrl: string,
  repo: string | undefined,
): EntityRef[] | undefined {
  const text = `${title}\n${body ?? ''}`;
  const refs: EntityRef[] = [];

  const jira = JIRA_KEY_RE.exec(text);
  if (jira) refs.push({ kind: 'ticket', key: jira[0], url: '', label: jira[0] });

  const closes = CLOSES_ISSUE_RE.exec(text);
  if (closes && repo !== undefined) {
    const key = `#${closes[1]}`;
    refs.push({ kind: 'ticket', key, url: `${baseUrl}/${repo}/issues/${closes[1]}`, label: key });
  }

  return refs.length > 0 ? refs : undefined;
}

interface Enrichment {
  draft: boolean;
  status: LensItem['status'];
  /** The canonical Change bag (review-lens) — present only for review-kind
   * lenses, omitted when the PR detail lacks the required identity fields. */
  change?: ChangeData;
  /** Linked-ticket refs (lens-overview, L0) extracted from the PR title/body —
   * present for every PR-pass row that names a ticket, omitted otherwise. */
  refs?: EntityRef[];
}

type ReviewVerdict = NonNullable<ChangeData['reviewers'][number]['state']>;

type PrDetail = z.infer<typeof PrDetailSchema>;

/**
 * Reduce the PR's reviews to one verdict per reviewer (review-lens, D4/D5):
 * iterate in GitHub's ascending chronological order keeping the latest
 * non-`COMMENTED`/`PENDING` review per login (`APPROVED` → `approved`,
 * `CHANGES_REQUESTED` → `changes`, anything else — e.g. `DISMISSED` — degrades
 * to `pending`, never a fabricated verdict). Requested reviewers with no review
 * are then marked `pending`. Insertion order is preserved (reviewed first).
 */
function reduceReviewers(
  reviews: z.infer<typeof ReviewsSchema>,
  requested: PrDetail['requested_reviewers'],
): ChangeData['reviewers'] {
  const byLogin = new Map<string, ReviewVerdict>();
  for (const r of reviews) {
    const login = r.user?.login;
    if (login == null) continue;
    if (r.state === 'COMMENTED' || r.state === 'PENDING') continue;
    byLogin.set(
      login,
      r.state === 'APPROVED' ? 'approved' : r.state === 'CHANGES_REQUESTED' ? 'changes' : 'pending',
    );
  }
  for (const rr of requested ?? []) {
    if (!byLogin.has(rr.login)) byLogin.set(rr.login, 'pending');
  }
  return [...byLogin].map(([login, state]) => ({ login, state }));
}

/**
 * Bounded per-PR enrichment: the search item's `pull_request.url` → PR detail
 * (carries `head.sha` and `draft`), then that commit's check-runs at
 * `per_page=100` (one page — the default 30 could hide a failing run on
 * check-heavy repos; 100 covers realistic suites without pagination). For a
 * `review` lens it ALSO fetches `…/reviews` and builds the `change` bag (one
 * extra request — the only kind-specific cost). Any failure leaves the item
 * glyph-less, never failing the folder.
 */
async function enrich(
  prUrl: string | undefined,
  title: string,
  baseUrl: string,
  apiRoot: string,
  token: string,
  buildChange: boolean,
): Promise<Enrichment> {
  // Refs from the title alone always survive — even the failure paths below
  // (a bare Jira key needs no repo/body; the `Closes #N` form needs `repo`,
  // unavailable until the detail parses, so it only emits on the happy path).
  const titleRefs = extractRefs(title, undefined, baseUrl, undefined);
  const none: Enrichment = {
    draft: false,
    status: undefined,
    ...(titleRefs !== undefined ? { refs: titleRefs } : {}),
  };
  if (prUrl === undefined) return none;
  const detailOutcome = await githubGet(prUrl, token);
  if (detailOutcome.kind !== 'ok') return none;
  const detail = PrDetailSchema.safeParse(detailOutcome.json);
  if (!detail.success) return none;
  const d = detail.data;
  const draft = d.draft === true;
  const sha = d.head?.sha;
  const repo = d.base?.repo.full_name;
  const refs = extractRefs(title, d.body, baseUrl, repo);

  let status: LensItem['status'];
  if (sha !== undefined && repo !== undefined) {
    const runsOutcome = await githubGet(
      `${apiRoot}/repos/${repo}/commits/${sha}/check-runs?per_page=100`,
      token,
    );
    if (runsOutcome.kind === 'ok') {
      const runs = CheckRunsSchema.safeParse(runsOutcome.json);
      if (runs.success) status = aggregateCheckRuns(runs.data.check_runs);
    }
  }

  const refsBag = refs !== undefined ? { refs } : {};
  if (!buildChange) return { draft, status, ...refsBag };

  // review-kind only: the `change` bag + one reviews fetch (D4). The required
  // identity fields (author/repo/updatedAt) must be present, else we omit
  // `change` rather than fabricate it.
  const author = d.user?.login;
  const updatedAt = d.updated_at !== undefined ? Date.parse(d.updated_at) : Number.NaN;
  if (author === undefined || repo === undefined || Number.isNaN(updatedAt)) {
    return { draft, status, ...refsBag };
  }
  const reviewsOutcome = await githubGet(`${prUrl}/reviews?per_page=100`, token);
  const reviews =
    reviewsOutcome.kind === 'ok' ? ReviewsSchema.safeParse(reviewsOutcome.json) : undefined;
  const reviewers = reduceReviewers(reviews?.success ? reviews.data : [], d.requested_reviewers);
  const change: ChangeData = {
    author,
    repo,
    reviewers,
    draft,
    updatedAt,
    ...(d.additions !== undefined ? { additions: d.additions } : {}),
    ...(d.deletions !== undefined ? { deletions: d.deletions } : {}),
    ...(d.base?.ref !== undefined ? { targetBranch: d.base.ref } : {}),
  };
  return { draft, status, change, ...refsBag };
}

/**
 * Fetch one GitHub smart folder section's results. Never throws — every failure
 * shape resolves to a runtime state. No token for the folder's host
 * short-circuits to `signed-out` WITHOUT a request (the `@me` queries require
 * auth, so the request could only fail; not sending it is honest and
 * rate-limit kind).
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

  let apiRoot: string;
  try {
    apiRoot = apiRootOf(cfg.baseUrl);
  } catch {
    // A malformed persisted baseUrl (defensive — the SW validates on
    // create/update) degrades to the quiet error state, never a throw.
    return fail('error');
  }
  // Per-source token (connector-accounts): looked up by the resolved account's
  // `sourceId`, NOT by host — two accounts on one host hold distinct tokens.
  const tokens = await readAccountTokens();
  const token = tokens[cfg.sourceId];
  if (token === undefined) return fail('signed-out');

  // A queue node always carries a query (source-optional only for feeds);
  // default defensively so the now-optional field stays a total switch.
  const query: LensQuery = cfg.query ?? 'assigned';

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

  // review-lens (D4a): only a `review` lens pays the extra reviews call + builds
  // the `change` bag; a `general` github lens stays unenriched (no `change`).
  const buildChange = cfg.lensKind === 'review';
  const enrichments = await mapWithConcurrency(prs, ENRICH_CONCURRENCY, (pr) =>
    enrich(pr.pull_request?.url, pr.title, cfg.baseUrl, apiRoot, token, buildChange),
  );

  const items: LensItem[] = prs.map((pr, index) => {
    const enrichment = enrichments[index] ?? { draft: false, status: undefined };
    return {
      id: String(pr.id),
      // GitHub does not bake draft-ness into the title the way GitLab does —
      // the prefix restores at-a-glance parity.
      title: enrichment.draft ? `Draft: ${pr.title}` : pr.title,
      url: pr.html_url,
      ...(enrichment.status !== undefined ? { status: enrichment.status } : {}),
      ...(enrichment.change !== undefined ? { change: enrichment.change } : {}),
      ...(enrichment.refs !== undefined ? { refs: enrichment.refs } : {}),
    };
  });

  // Issue pass (lens-overview): a SECOND search for open issues, for the
  // `assigned`/`authored` queries only (issues are never review-requested).
  // Each result becomes a `ticket`-bag row — no per-issue enrichment (issues
  // carry no reviews/checks). A failed/unparsed issue search is silent: the PR
  // rows above still ship.
  const issueItems =
    query === 'review-requested' ? [] : await fetchIssues(maxItems, apiRoot, query, token);

  return { state: 'ok', items: [...items, ...issueItems], fetchedAt };
}

/**
 * The issue pass (lens-overview): one Search-API call mirroring the PR pass's
 * qualifier builder but with `is:issue is:open`, mapping each result to a
 * `ticket` bag straight from the search item (number/state/assignees/labels/
 * repository_url/updated_at) — NO per-issue enrichment. Returns `[]` on any
 * failure so the PR rows always survive.
 */
async function fetchIssues(
  maxItems: number,
  apiRoot: string,
  query: LensQuery,
  token: string,
): Promise<LensItem[]> {
  // The issue pass must NEVER throw — any failure resolves to an empty list so
  // the PR section keeps its state (the enrichment-failure precedent).
  try {
    const url =
      `${apiRoot}/search/issues?q=is:issue+is:open+${qualifierFor(query)}` +
      `&per_page=${maxItems}&sort=updated&order=desc&advanced_search=true`;
    const outcome = await githubGet(url, token);
    if (outcome.kind !== 'ok') return [];
    const parsed = SearchResponseSchema.safeParse(outcome.json);
    if (!parsed.success) return [];

    return parsed.data.items
      .flatMap((element) => {
        const item = SearchItemSchema.safeParse(element);
        return item.success ? [item.data] : [];
      })
      .slice(0, maxItems)
      .map((issue) => ({
        id: String(issue.id),
        title: issue.title,
        url: issue.html_url,
        ticket: buildTicket(issue),
      }));
  } catch {
    return [];
  }
}

/** Owner/repo from the search item's `repository_url`
 * (`{apiRoot}/repos/{owner}/{repo}`) — its last two path segments. Absent when
 * the field is missing or malformed (omitted rather than guessed). */
function repoFromUrl(repositoryUrl: string | undefined): string | undefined {
  if (repositoryUrl === undefined) return undefined;
  const parts = repositoryUrl.split('/');
  const repo = parts.at(-1);
  const owner = parts.at(-2);
  return owner !== undefined && owner !== '' && repo !== undefined && repo !== ''
    ? `${owner}/${repo}`
    : undefined;
}

/**
 * Build a {@link TicketData} bag from a GitHub issue search item (lens-overview).
 * GitHub classic issues are open/closed only, so `statusCategory` is todo/done —
 * `in-progress` is UNREACHABLE and the middle kanban lane stays empty (never
 * faked). Issues have no native priority, so `priority` is always OMITTED (the
 * pill won't render). `project`/`assignee`/`labels` are omitted when absent.
 */
function buildTicket(issue: z.infer<typeof SearchItemSchema>): TicketData {
  const closed = issue.state === 'closed';
  const project = repoFromUrl(issue.repository_url);
  const assignee = issue.assignees?.[0]?.login;
  const labels = issue.labels?.map((l) => l.name) ?? [];
  return {
    key: `#${issue.number ?? ''}`,
    statusCategory: closed ? 'done' : 'todo',
    statusLabel: closed ? 'Closed' : 'Open',
    updatedAt: issue.updated_at !== undefined ? Date.parse(issue.updated_at) : Number.NaN,
    ...(project !== undefined ? { project } : {}),
    ...(assignee !== undefined ? { assignee } : {}),
    ...(labels.length > 0 ? { labels } : {}),
  };
}

/** The full listing on the forge (rss-connector design D6, "open all in a
 * tab"): GitHub's pull-requests dashboard — the canonical "PRs that involve me"
 * page (github.com AND GHE both serve `/pulls`), independent of the canned
 * query. */
function listingUrl(cfg: ResolvedLensSource): string {
  return `${cfg.baseUrl}/pulls`;
}

/**
 * The origin this connector fetches (least-privilege-permissions design D8):
 * github.com folders fetch `api.github.com` (a DIFFERENT origin), GHE is
 * same-origin. Delegates to the shared {@link requiredOriginsForConfig} so the
 * SW gate and the surfaces' grant request share one derivation.
 */
function requiredOrigins(cfg: ResolvedLensSource): string[] {
  return requiredOriginsForConfig(cfg);
}

/** The GitHub `SourceConnector` — the registry's `github` entry. */
export const githubConnector: SourceConnector = {
  source: 'github',
  // api.github.com ignores browser sessions, so a PAT is the only auth rung
  // (connector-accounts) — there is no `session` fallback. Sourced from the
  // shared declared-methods map so the surfaces and the connector never drift.
  authMethods: PROVIDER_AUTH_METHODS.github,
  defaultBaseUrl: 'https://github.com',
  mintedIcon: 'folder-git-2',
  requiredOrigins,
  fetchRuntime,
  listingUrl,
};
