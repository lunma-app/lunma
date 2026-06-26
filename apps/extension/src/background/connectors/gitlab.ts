import { z } from 'zod';
import { requiredOriginsForConfig } from '../../shared/connector-origins';
import { readConnectors } from '../../shared/connectors';
import type {
  ChangeData,
  LensItem,
  LensQuery,
  LensSectionRuntime,
  ResolvedLensSource,
} from '../../shared/types';
import { boundedFetch, type ConnectorCaches, type SourceConnector } from './connector';

/**
 * The GitLab connector (lenses v1, relocated by github-connector design
 * D2 WITHOUT behaviour change — its pre-existing unit tests pass with
 * assertions unmodified):
 *
 *   - fetch + normalize: the three canned queries → documented `/api/v4`
 *     REST GETs, pipeline→tone mapping, bounded per-MR enrichment;
 *   - the PAT-then-cookies auth ladder with response-shape signed-out
 *     detection — never throwing.
 *
 * The source-agnostic engine (scheduling, in-flight guard, result-event
 * plumbing) stays in `../lenses.ts` and reaches this module only
 * through the `CONNECTORS` registry.
 */

/** Pipeline-enrichment fan-out bound (≤21 requests/folder/poll worst case). */
const ENRICH_CONCURRENCY = 5;

/** The per-host PAT lookup key: hostname plus any explicit port. */
function hostOf(baseUrl: string): string {
  return new URL(baseUrl).host;
}

// ── pipeline → tone mapping ────────────────────────────────────────────────────

const TONE_BY_PIPELINE_STATUS: Record<string, NonNullable<LensItem['status']>> = {
  success: { tone: 'ok', label: 'Pipeline passed' },
  failed: { tone: 'fail', label: 'Pipeline failed' },
  running: { tone: 'pending', label: 'Pipeline running' },
  pending: { tone: 'pending', label: 'Pipeline pending' },
  created: { tone: 'pending', label: 'Pipeline queued' },
  canceled: { tone: 'warn', label: 'Pipeline canceled' },
  skipped: { tone: 'warn', label: 'Pipeline skipped' },
};

/**
 * Map a raw GitLab pipeline status onto the semantic status tones. No pipeline
 * — or any status outside the mapped set (`manual`, `preparing`,
 * `waiting_for_resource`, `scheduled`, or anything GitLab adds later) — maps to
 * `undefined` (no glyph): absence over guessing.
 */
export function pipelineStatus(raw: string | undefined | null): LensItem['status'] {
  if (!raw) return undefined;
  const mapped = TONE_BY_PIPELINE_STATUS[raw];
  return mapped ? { ...mapped } : undefined;
}

// ── auth ladder ────────────────────────────────────────────────────────────────

interface AuthMode {
  headers: Record<string, string>;
  credentials: RequestCredentials;
}

/** Resolve the auth rung for a host: a stored PAT wins (`Bearer` +
 * `credentials: 'omit'`); otherwise the browser session rides along
 * (`credentials: 'include'`). The token value never leaves the request. */
async function authFor(host: string): Promise<AuthMode> {
  const connectors = await readConnectors();
  const token = connectors[host];
  if (token !== undefined) {
    return { headers: { Authorization: `Bearer ${token}` }, credentials: 'omit' };
  }
  return { headers: {}, credentials: 'include' };
}

// ── fetch + signed-out detection ───────────────────────────────────────────────

type GetOutcome = { kind: 'ok'; json: unknown } | { kind: 'signed-out' } | { kind: 'error' };

/**
 * One authenticated GET against the instance. Signed-out detection is
 * response-shape-based and deliberately paranoid: a 401, a redirect landing on
 * a non-JSON document, or any non-JSON body resolves `signed-out`; network
 * errors and 5xx/429 resolve `error`. Never throws. The non-JSON heuristic is
 * cookie-session-specific — it deliberately stays inside this connector.
 */
async function gitlabGet(baseUrl: string, path: string, auth: AuthMode): Promise<GetOutcome> {
  let response: Response;
  try {
    // Bounded: a timeout rejects (AbortError) into the catch below → 'error'.
    response = await boundedFetch(`${baseUrl}${path}`, {
      headers: auth.headers,
      credentials: auth.credentials,
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

// ── response shapes (lenient: unknown keys stripped, never rejected) ───────────

const PipelineRefSchema = z.object({ status: z.string().optional() }).nullable().optional();

/** A GitLab user reference (review-lens) — the list/detail MR object's
 * `author`/`reviewers` carry at least a `username`. `state`, when an instance
 * exposes per-reviewer review-state, lets us surface a `changes` verdict (D5). */
const UserRefSchema = z.object({ username: z.string(), state: z.string().optional() });

const MrSchema = z.object({
  id: z.union([z.number(), z.string()]),
  iid: z.number().optional(),
  project_id: z.number().optional(),
  title: z.string(),
  web_url: z.string(),
  head_pipeline: PipelineRefSchema,
  pipeline: PipelineRefSchema,
  // review-lens enrichment fields (D4) — all present on the list response on
  // recent GitLab; lenient so an older/partial payload never fails the section.
  author: UserRefSchema.nullable().optional(),
  target_branch: z.string().optional(),
  updated_at: z.string().optional(),
  draft: z.boolean().optional(),
  work_in_progress: z.boolean().optional(),
  reviewers: z.array(UserRefSchema).optional(),
  // Line diff stats are not on the standard MR object; parsed leniently for
  // instances/fixtures that expose them, else the diffstat collapses.
  additions: z.number().optional(),
  deletions: z.number().optional(),
});

// The MR approvals endpoint (review-lens, D4): `approved_by` lists the users who
// have approved. Lenient — unknown keys stripped.
const ApprovalsSchema = z.object({
  approved_by: z.array(z.object({ user: UserRefSchema })).optional(),
});

const MeSchema = z.object({ id: z.number() });

type Mr = z.infer<typeof MrSchema>;

type MeResolution = { kind: 'ok'; id: number } | { kind: 'signed-out' | 'error' };

/** Resolve `/api/v4/user` once per poll cycle: the `ConnectorCaches` map
 * (threaded by the engine) keys resolutions by baseUrl. The IN-FLIGHT promise
 * is cached synchronously, so concurrent same-host fetches in one cycle share
 * a single lookup instead of racing past an empty cache into duplicate lookups. */
function resolveMe(
  baseUrl: string,
  auth: AuthMode,
  meCache: ConnectorCaches,
): Promise<MeResolution> {
  const cached = meCache.get(baseUrl) as Promise<MeResolution> | undefined;
  if (cached) return cached;
  const resolution = (async (): Promise<MeResolution> => {
    const outcome = await gitlabGet(baseUrl, '/api/v4/user', auth);
    if (outcome.kind !== 'ok') return { kind: outcome.kind };
    const parsed = MeSchema.safeParse(outcome.json);
    return parsed.success ? { kind: 'ok', id: parsed.data.id } : { kind: 'signed-out' };
  })();
  meCache.set(baseUrl, resolution);
  return resolution;
}

/** The documented query params for each canned query. `review-requested`
 * REQUIRES `scope=all`: the endpoint defaults to `scope=created_by_me`, under
 * which `reviewer_id` filters only within your own authored MRs. */
function queryParams(query: LensQuery, meId: number | null): string {
  switch (query) {
    case 'authored':
      return 'scope=created_by_me';
    case 'assigned':
      return 'scope=assigned_to_me';
    case 'review-requested':
      return `scope=all&reviewer_id=${meId ?? ''}`;
  }
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

function usablePipelineStatus(mr: Mr): string | undefined {
  return mr.head_pipeline?.status ?? mr.pipeline?.status;
}

type ReviewVerdict = NonNullable<ChangeData['reviewers'][number]['state']>;

/** Derive `owner/repo` (group/project path) from an MR `web_url`
 * (`https://host/group/project/-/merge_requests/5` → `group/project`). The MR
 * list carries only a numeric `project_id`, so the path comes from the URL. */
function repoFromWebUrl(webUrl: string): string | undefined {
  let pathname: string;
  try {
    pathname = new URL(webUrl).pathname;
  } catch {
    return undefined;
  }
  const sep = pathname.indexOf('/-/');
  const slug = (sep >= 0 ? pathname.slice(0, sep) : pathname).replace(/^\/+|\/+$/g, '');
  return slug || undefined;
}

/**
 * Build the canonical Change bag for one MR (review-lens, D4/D5) plus one
 * approvals request. Required identity fields (author/repo/updatedAt) must be
 * present, else `change` is omitted rather than fabricated. Reviewers come from
 * the MR `reviewers`, mapped `approved` when in `approved_by`, `changes` only
 * where the instance exposes a requested-changes review-state, else `pending`;
 * approvers not in `reviewers` are appended as `approved`.
 */
async function buildMrChange(
  cfg: ResolvedLensSource,
  mr: Mr,
  auth: AuthMode,
): Promise<ChangeData | undefined> {
  const author = mr.author?.username;
  const repo = repoFromWebUrl(mr.web_url);
  const updatedAt = mr.updated_at !== undefined ? Date.parse(mr.updated_at) : Number.NaN;
  if (author === undefined || repo === undefined || Number.isNaN(updatedAt)) return undefined;

  let approved = new Set<string>();
  if (mr.project_id !== undefined && mr.iid !== undefined) {
    const outcome = await gitlabGet(
      cfg.baseUrl,
      `/api/v4/projects/${mr.project_id}/merge_requests/${mr.iid}/approvals`,
      auth,
    );
    if (outcome.kind === 'ok') {
      const parsed = ApprovalsSchema.safeParse(outcome.json);
      if (parsed.success) {
        approved = new Set(parsed.data.approved_by?.map((a) => a.user.username) ?? []);
      }
    }
  }

  const byLogin = new Map<string, ReviewVerdict>();
  for (const r of mr.reviewers ?? []) {
    const verdict: ReviewVerdict = approved.has(r.username)
      ? 'approved'
      : r.state === 'requested_changes'
        ? 'changes'
        : 'pending';
    byLogin.set(r.username, verdict);
  }
  for (const username of approved) {
    if (!byLogin.has(username)) byLogin.set(username, 'approved');
  }
  const reviewers = [...byLogin].map(([login, state]) => ({ login, state }));

  const draft = mr.draft ?? mr.work_in_progress ?? false;
  return {
    author,
    repo,
    reviewers,
    draft,
    updatedAt,
    ...(mr.additions !== undefined ? { additions: mr.additions } : {}),
    ...(mr.deletions !== undefined ? { deletions: mr.deletions } : {}),
    ...(mr.target_branch !== undefined ? { targetBranch: mr.target_branch } : {}),
  };
}

/**
 * Fetch one smart folder section's results and normalize them into a
 * `LensSectionRuntime`. Never throws — every failure shape resolves to a
 * runtime state. The engine reaches this via `CONNECTORS.gitlab.fetchRuntime`.
 */
async function fetchRuntime(
  cfg: ResolvedLensSource,
  maxItems: number,
  caches: ConnectorCaches = new Map(),
): Promise<LensSectionRuntime> {
  const fetchedAt = Date.now();
  const fail = (state: 'signed-out' | 'error'): LensSectionRuntime => ({
    state,
    items: [],
    fetchedAt,
  });

  let host: string;
  try {
    host = hostOf(cfg.baseUrl);
  } catch {
    // A malformed persisted baseUrl (defensive — the SW validates on
    // create/update) degrades to the quiet error state, never a throw.
    return fail('error');
  }
  const auth = await authFor(host);

  // A queue node always carries a query (it's source-optional only for feeds);
  // default defensively so the now-optional field stays a total switch.
  const query: LensQuery = cfg.query ?? 'assigned';

  let meId: number | null = null;
  if (query === 'review-requested') {
    const me = await resolveMe(cfg.baseUrl, auth, caches);
    if (me.kind !== 'ok') return fail(me.kind);
    meId = me.id;
  }

  // Per-section cap (rss-connector design D5) — the badge renders `N+` at it, so
  // the cap is never silent.
  const path = `/api/v4/merge_requests?state=opened&per_page=${maxItems}&${queryParams(query, meId)}`;
  const outcome = await gitlabGet(cfg.baseUrl, path, auth);
  if (outcome.kind !== 'ok') return fail(outcome.kind);
  if (!Array.isArray(outcome.json)) return fail('error');

  // Element-wise parse: one malformed MR never costs the rest of the list.
  const mrs = outcome.json
    .flatMap((element) => {
      const parsed = MrSchema.safeParse(element);
      return parsed.success ? [parsed.data] : [];
    })
    .slice(0, maxItems);

  // review-lens (D4a): only a `review` lens builds the `change` bag (one extra
  // approvals call per MR); a `general` gitlab lens stays unenriched.
  const buildChange = cfg.lensKind === 'review';

  // Bounded enrichment: the pipeline status (a detail fetch only for items whose
  // list row carries no usable pipeline field) and, for review lenses, the
  // `change` bag. Any enrichment failure simply leaves that item glyph-less.
  const enriched = await mapWithConcurrency(mrs, ENRICH_CONCURRENCY, async (mr) => {
    let statusRaw = usablePipelineStatus(mr);
    if (statusRaw === undefined && mr.project_id !== undefined && mr.iid !== undefined) {
      const detail = await gitlabGet(
        cfg.baseUrl,
        `/api/v4/projects/${mr.project_id}/merge_requests/${mr.iid}`,
        auth,
      );
      if (detail.kind === 'ok') {
        const parsed = MrSchema.safeParse(detail.json);
        if (parsed.success) statusRaw = usablePipelineStatus(parsed.data);
      }
    }
    const change = buildChange ? await buildMrChange(cfg, mr, auth) : undefined;
    return { statusRaw, change };
  });

  const items: LensItem[] = mrs.map((mr, index) => {
    const status = pipelineStatus(enriched[index]?.statusRaw);
    const change = enriched[index]?.change;
    return {
      id: String(mr.id),
      title: mr.title,
      url: mr.web_url,
      ...(status !== undefined ? { status } : {}),
      ...(change !== undefined ? { change } : {}),
    };
  });

  return { state: 'ok', items, fetchedAt };
}

/** The full listing on the instance (rss-connector design D6, "open all in a
 * tab"): GitLab's cross-project merge-requests dashboard — the canonical
 * "MRs that involve me" page, independent of the folder's canned query. */
function listingUrl(cfg: ResolvedLensSource): string {
  return `${cfg.baseUrl}/dashboard/merge_requests`;
}

/** The origin this connector fetches (least-privilege-permissions design D8):
 * GitLab fetches same-origin under `{baseUrl}/api/v4`. Delegates to the shared
 * {@link requiredOriginsForConfig} so the SW gate and the surfaces share one
 * derivation. */
function requiredOrigins(cfg: ResolvedLensSource): string[] {
  return requiredOriginsForConfig(cfg);
}

/** The GitLab `SourceConnector` — the registry's `gitlab` entry. */
export const gitlabConnector: SourceConnector = {
  source: 'gitlab',
  defaultBaseUrl: 'https://gitlab.com',
  mintedIcon: 'folder-git-2',
  requiredOrigins,
  fetchRuntime,
  listingUrl,
};
