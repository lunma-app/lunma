import { z } from 'zod';
import { PROVIDER_AUTH_METHODS } from '../../shared/auth-method';
import { requiredOriginsForConfig } from '../../shared/connector-origins';
import { readAccountTokens } from '../../shared/connectors';
import type {
  ChangeData,
  LensItem,
  LensSectionRuntime,
  ResolvedLensSource,
} from '../../shared/types';
import { boundedFetch, type ConnectorCaches, type SourceConnector } from './connector';

/**
 * The Bitbucket connector (add-bitbucket-connector, design D1–D7): open pull
 * requests over TWO non-API-compatible deployments under one provider, branched
 * on `new URL(cfg.baseUrl).host === 'bitbucket.org'`:
 *
 *   - **Server / Data Center** (the clean case) — `{baseUrl}/rest/api/1.0`. The
 *     self-scoped `GET /dashboard/pull-requests?state=OPEN&role=AUTHOR|REVIEWER`
 *     supports both `authored` and `review-requested` with NO identity lookup;
 *     reviewers are read inline from each PR's `reviewers[]`. `start`/`limit`/
 *     `isLastPage` pagination.
 *   - **Cloud** (the constrained case) — `https://api.bitbucket.org/2.0`. The
 *     all-workspaces "PRs for a user" endpoint was removed (2025-02-20); the
 *     replacement `GET /2.0/workspaces/{workspace}/pullrequests/{uuid}` is
 *     workspace-scoped and **authored-only**. The caller `uuid` is resolved once
 *     per cycle via `GET /2.0/user` (cached by `sourceId`); the collection omits
 *     reviewers, so a bounded per-PR detail fetch (capped at `maxItems`)
 *     populates the reviewer bag from `participants[]`. `next`-cursor pagination.
 *
 * Auth is token-only (`Authorization: Bearer`, `credentials: 'omit'`): a missing
 * token short-circuits to `signed-out` without a request (the github model). The
 * connector is bounded — it never throws; every failure resolves to a runtime
 * state.
 */

/** Per-PR reviewer-detail fan-out bound on the Cloud path (≤1 extra request per
 * listed PR, already capped at `maxItems`). */
const ENRICH_CONCURRENCY = 5;

/** A hard page cap so a runaway `next`/`isLastPage` never loops unbounded — the
 * section is sliced to `maxItems` anyway, so a handful of pages always suffices. */
const MAX_PAGES = 10;

const CLOUD_HOST = 'bitbucket.org';
const CLOUD_API_ROOT = 'https://api.bitbucket.org/2.0';

// ── bounded GET (token-only; 401 → signed-out, else error) ─────────────────────

type GetOutcome = { kind: 'ok'; json: unknown } | { kind: 'signed-out' } | { kind: 'error' };

/**
 * One authenticated GET. A 401 (revoked/malformed token) resolves `signed-out`;
 * any other non-2xx, a network failure, or a timeout resolves `error`. Bitbucket
 * authenticated answers are JSON, so there is no non-JSON heuristic (that is
 * GitLab's cookie-session rule).
 */
async function bitbucketGet(url: string, token: string): Promise<GetOutcome> {
  let response: Response;
  try {
    // Bounded: a timeout rejects (AbortError) into the catch below → 'error'.
    response = await boundedFetch(url, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
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

type ReviewVerdict = NonNullable<ChangeData['reviewers'][number]['state']>;

// ── Server / Data Center response shapes (lenient) ─────────────────────────────

const ServerReviewerSchema = z.object({
  user: z.object({ name: z.string().optional(), displayName: z.string().optional() }).optional(),
  approved: z.boolean().optional(),
  status: z.string().optional(),
});

const ServerRepoSchema = z.object({
  slug: z.string().optional(),
  project: z.object({ key: z.string().optional() }).optional(),
});

const ServerPrSchema = z.object({
  id: z.union([z.number(), z.string()]),
  title: z.string(),
  draft: z.boolean().optional(),
  author: z
    .object({
      user: z
        .object({ name: z.string().optional(), displayName: z.string().optional() })
        .optional(),
    })
    .optional(),
  reviewers: z.array(ServerReviewerSchema).optional(),
  fromRef: z.object({ displayId: z.string().optional() }).optional(),
  toRef: z
    .object({ displayId: z.string().optional(), repository: ServerRepoSchema.optional() })
    .optional(),
  updatedDate: z.number().optional(),
  links: z.object({ self: z.array(z.object({ href: z.string() })).optional() }).optional(),
});

const ServerPageSchema = z.object({
  values: z.array(z.unknown()).optional(),
  isLastPage: z.boolean().optional(),
  nextPageStart: z.number().nullable().optional(),
});

type ServerPr = z.infer<typeof ServerPrSchema>;

/** Map a Server reviewer's `status`/`approved` onto the verdict vocabulary:
 * `APPROVED`/`approved:true` → approved; `NEEDS_WORK` → changes; else pending. */
function serverVerdict(r: z.infer<typeof ServerReviewerSchema>): ReviewVerdict {
  if (r.approved === true || r.status === 'APPROVED') return 'approved';
  if (r.status === 'NEEDS_WORK') return 'changes';
  return 'pending';
}

function serverReviewers(pr: ServerPr): ChangeData['reviewers'] {
  const out: ChangeData['reviewers'] = [];
  for (const r of pr.reviewers ?? []) {
    const login = r.user?.name ?? r.user?.displayName;
    if (login === undefined || login === '') continue;
    out.push({ login, state: serverVerdict(r) });
  }
  return out;
}

/** Build a {@link ChangeData} bag from a Server PR. The dashboard list carries
 * no diffstat → `additions`/`deletions` omitted. `repo` is `project/repo`
 * from `toRef.repository`. */
function serverChange(pr: ServerPr): ChangeData {
  const author = pr.author?.user?.name ?? pr.author?.user?.displayName ?? '';
  const projectKey = pr.toRef?.repository?.project?.key;
  const slug = pr.toRef?.repository?.slug;
  const repo =
    projectKey !== undefined && slug !== undefined ? `${projectKey}/${slug}` : (slug ?? '');
  return {
    author,
    repo,
    reviewers: serverReviewers(pr),
    draft: pr.draft === true,
    updatedAt: pr.updatedDate ?? Number.NaN,
    ...(pr.toRef?.displayId !== undefined ? { targetBranch: pr.toRef.displayId } : {}),
  };
}

function serverItem(pr: ServerPr): LensItem {
  const href = pr.links?.self?.[0]?.href ?? '';
  return {
    id: String(pr.id),
    title: pr.draft === true ? `Draft: ${pr.title}` : pr.title,
    url: href,
    change: serverChange(pr),
  };
}

/**
 * Page the Server/DC dashboard endpoint until `isLastPage`, the page cap, or
 * `maxItems` collected. `role` is `AUTHOR` (authored) or `REVIEWER`
 * (review-requested). Self-scoped — no identity lookup.
 */
async function fetchServer(
  baseUrl: string,
  role: 'AUTHOR' | 'REVIEWER',
  token: string,
  maxItems: number,
): Promise<{ kind: 'signed-out' | 'error' } | { kind: 'ok'; items: LensItem[] }> {
  const root = `${baseUrl}/rest/api/1.0/dashboard/pull-requests`;
  const collected: ServerPr[] = [];
  let start = 0;
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const url = `${root}?state=OPEN&role=${role}&limit=${maxItems}&start=${start}`;
    const outcome = await bitbucketGet(url, token);
    if (outcome.kind !== 'ok') return { kind: outcome.kind };
    const parsed = ServerPageSchema.safeParse(outcome.json);
    if (!parsed.success) return { kind: 'error' };
    for (const element of parsed.data.values ?? []) {
      const pr = ServerPrSchema.safeParse(element);
      if (pr.success) collected.push(pr.data);
    }
    if (collected.length >= maxItems) break;
    if (parsed.data.isLastPage !== false || parsed.data.nextPageStart == null) break;
    start = parsed.data.nextPageStart;
  }
  return { kind: 'ok', items: collected.slice(0, maxItems).map(serverItem) };
}

// ── Cloud response shapes (lenient) ────────────────────────────────────────────

const CloudMeSchema = z.object({ uuid: z.string() });

const CloudPrSchema = z.object({
  id: z.union([z.number(), z.string()]),
  title: z.string(),
  draft: z.boolean().optional(),
  author: z
    .object({ display_name: z.string().optional(), nickname: z.string().optional() })
    .optional(),
  source: z.object({ branch: z.object({ name: z.string().optional() }).optional() }).optional(),
  destination: z
    .object({
      branch: z.object({ name: z.string().optional() }).optional(),
      repository: z.object({ full_name: z.string().optional() }).optional(),
    })
    .optional(),
  updated_on: z.string().optional(),
  links: z
    .object({
      html: z.object({ href: z.string() }).optional(),
      self: z.object({ href: z.string() }).optional(),
    })
    .optional(),
});

const CloudPageSchema = z.object({
  values: z.array(z.unknown()).optional(),
  next: z.string().optional(),
});

const CloudParticipantSchema = z.object({
  user: z
    .object({ display_name: z.string().optional(), nickname: z.string().optional() })
    .optional(),
  role: z.string().optional(),
  approved: z.boolean().optional(),
  state: z.string().nullable().optional(),
});

const CloudPrDetailSchema = z.object({
  participants: z.array(CloudParticipantSchema).optional(),
});

type CloudPr = z.infer<typeof CloudPrSchema>;

/** Map a Cloud participant's `state`/`approved` onto the verdict vocabulary:
 * `approved`/`approved:true` → approved; `changes_requested` → changes; else
 * pending. */
function cloudVerdict(p: z.infer<typeof CloudParticipantSchema>): ReviewVerdict {
  if (p.approved === true || p.state === 'approved') return 'approved';
  if (p.state === 'changes_requested') return 'changes';
  return 'pending';
}

/** The reviewer bag from a Cloud PR detail's `participants[]` — only the
 * `REVIEWER`-role participants populate the reviewer rail. */
function cloudReviewers(detail: z.infer<typeof CloudPrDetailSchema>): ChangeData['reviewers'] {
  const out: ChangeData['reviewers'] = [];
  for (const p of detail.participants ?? []) {
    if (p.role !== 'REVIEWER') continue;
    const login = p.user?.nickname ?? p.user?.display_name;
    if (login === undefined || login === '') continue;
    out.push({ login, state: cloudVerdict(p) });
  }
  return out;
}

function cloudChange(pr: CloudPr, reviewers: ChangeData['reviewers']): ChangeData {
  const author = pr.author?.display_name ?? pr.author?.nickname ?? '';
  const repo = pr.destination?.repository?.full_name ?? '';
  const updatedAt = pr.updated_on !== undefined ? Date.parse(pr.updated_on) : Number.NaN;
  return {
    author,
    repo,
    reviewers,
    draft: pr.draft === true,
    updatedAt,
    ...(pr.destination?.branch?.name !== undefined
      ? { targetBranch: pr.destination.branch.name }
      : {}),
  };
}

type CloudMeResolution = { kind: 'ok'; uuid: string } | { kind: 'signed-out' | 'error' };

/**
 * Resolve the caller `uuid` once per poll cycle via `GET /2.0/user`, cached in
 * the `ConnectorCaches` map keyed by **`sourceId`** (NOT `baseUrl`): every Cloud
 * account shares `https://bitbucket.org` but carries a distinct token resolving
 * to a distinct user, so a `baseUrl` key would hand one account's `uuid` to
 * every other. The in-flight promise is cached synchronously so two sections of
 * the same account share one lookup.
 */
function resolveCloudUuid(
  sourceId: string,
  token: string,
  caches: ConnectorCaches,
): Promise<CloudMeResolution> {
  const cached = caches.get(sourceId) as Promise<CloudMeResolution> | undefined;
  if (cached) return cached;
  const resolution = (async (): Promise<CloudMeResolution> => {
    const outcome = await bitbucketGet(`${CLOUD_API_ROOT}/user`, token);
    if (outcome.kind !== 'ok') return { kind: outcome.kind };
    const parsed = CloudMeSchema.safeParse(outcome.json);
    return parsed.success ? { kind: 'ok', uuid: parsed.data.uuid } : { kind: 'error' };
  })();
  caches.set(sourceId, resolution);
  return resolution;
}

/**
 * List a Cloud workspace's open PRs authored by `uuid`, following the `next`
 * cursor until exhausted, the page cap, or `maxItems` collected.
 */
async function fetchCloudList(
  workspace: string,
  uuid: string,
  token: string,
  maxItems: number,
): Promise<{ kind: 'signed-out' | 'error' } | { kind: 'ok'; prs: CloudPr[] }> {
  const q = encodeURIComponent('state="OPEN"');
  let url =
    `${CLOUD_API_ROOT}/workspaces/${encodeURIComponent(workspace)}/pullrequests/` +
    `${encodeURIComponent(uuid)}?q=${q}`;
  const collected: CloudPr[] = [];
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const outcome = await bitbucketGet(url, token);
    if (outcome.kind !== 'ok') return { kind: outcome.kind };
    const parsed = CloudPageSchema.safeParse(outcome.json);
    if (!parsed.success) return { kind: 'error' };
    for (const element of parsed.data.values ?? []) {
      const pr = CloudPrSchema.safeParse(element);
      if (pr.success) collected.push(pr.data);
    }
    if (collected.length >= maxItems || parsed.data.next === undefined) break;
    url = parsed.data.next;
  }
  return { kind: 'ok', prs: collected.slice(0, maxItems) };
}

/** One per-PR detail fetch for the reviewer bag (Cloud omits reviewers from the
 * collection). A failed/unparsed detail degrades to an empty reviewer list, never
 * failing the section. */
async function fetchCloudReviewers(
  selfHref: string | undefined,
  token: string,
): Promise<ChangeData['reviewers']> {
  if (selfHref === undefined) return [];
  const outcome = await bitbucketGet(selfHref, token);
  if (outcome.kind !== 'ok') return [];
  const parsed = CloudPrDetailSchema.safeParse(outcome.json);
  return parsed.success ? cloudReviewers(parsed.data) : [];
}

async function fetchCloud(
  cfg: ResolvedLensSource,
  token: string,
  maxItems: number,
  caches: ConnectorCaches,
): Promise<{ kind: 'signed-out' | 'error' } | { kind: 'ok'; items: LensItem[] }> {
  const workspace = cfg.workspace;
  if (workspace === undefined || workspace === '') return { kind: 'error' };
  const me = await resolveCloudUuid(cfg.sourceId, token, caches);
  if (me.kind !== 'ok') return { kind: me.kind };
  const listed = await fetchCloudList(workspace, me.uuid, token, maxItems);
  if (listed.kind !== 'ok') return { kind: listed.kind };

  // Per-PR reviewer fetch, capped at maxItems (the list is already sliced).
  const reviewerBags = await mapWithConcurrency(listed.prs, ENRICH_CONCURRENCY, (pr) =>
    fetchCloudReviewers(pr.links?.self?.href, token),
  );
  const items: LensItem[] = listed.prs.map((pr, index) => {
    const reviewers = reviewerBags[index] ?? [];
    const change = cloudChange(pr, reviewers);
    const htmlHref = pr.links?.html?.href ?? '';
    return {
      id: String(pr.id),
      title: pr.draft === true ? `Draft: ${pr.title}` : pr.title,
      url: htmlHref,
      change,
    };
  });
  return { kind: 'ok', items };
}

// ── fetch entry ────────────────────────────────────────────────────────────────

/**
 * Fetch one Bitbucket section's results. Never throws — every failure resolves
 * to a runtime state. No token short-circuits to `signed-out` WITHOUT a request.
 * A Cloud `review-requested` config (should never reach here — the SW rejects it
 * at create/update) resolves to `error` without a request.
 */
async function fetchRuntime(
  cfg: ResolvedLensSource,
  maxItems: number,
  caches: ConnectorCaches = new Map(),
): Promise<LensSectionRuntime> {
  const fetchedAt = Date.now();
  const done = (
    result: { kind: 'signed-out' | 'error' } | { kind: 'ok'; items: LensItem[] },
  ): LensSectionRuntime =>
    result.kind === 'ok'
      ? { state: 'ok', items: result.items, fetchedAt }
      : { state: result.kind, items: [], fetchedAt };

  let isCloud: boolean;
  try {
    isCloud = new URL(cfg.baseUrl).host === CLOUD_HOST;
  } catch {
    // A malformed persisted baseUrl (defensive — the SW validates on
    // create/update) degrades to the quiet error state, never a throw.
    return done({ kind: 'error' });
  }

  // Per-source token (connector-accounts): looked up by the resolved account's
  // `sourceId`, NOT by host — two accounts on one host hold distinct tokens.
  const tokens = await readAccountTokens();
  const token = tokens[cfg.sourceId];
  if (token === undefined) return done({ kind: 'signed-out' });

  // A queue node always carries a query (source-optional only for feeds).
  const query = cfg.query ?? 'authored';

  if (isCloud) {
    // Cloud supports `authored` only (D4). `review-requested` is rejected by the
    // SW at create/update; if one slips through, resolve `error` WITHOUT a
    // request. `assigned` is never offered (Bitbucket has no assignee).
    if (query !== 'authored') return done({ kind: 'error' });
    return done(await fetchCloud(cfg, token, maxItems, caches));
  }

  // Server / Data Center: authored → AUTHOR, review-requested → REVIEWER.
  // `assigned` is unsupported (no assignee) → quiet error without a request.
  if (query === 'authored') return done(await fetchServer(cfg.baseUrl, 'AUTHOR', token, maxItems));
  if (query === 'review-requested')
    return done(await fetchServer(cfg.baseUrl, 'REVIEWER', token, maxItems));
  return done({ kind: 'error' });
}

/**
 * The full listing on the forge (rss-connector design D6, "open all in a tab"):
 * Cloud → the global PR dashboard; Server → the instance dashboard.
 */
function listingUrl(cfg: ResolvedLensSource): string {
  let isCloud = false;
  try {
    isCloud = new URL(cfg.baseUrl).host === CLOUD_HOST;
  } catch {
    // Malformed baseUrl → fall through to the Server form below.
  }
  return isCloud ? 'https://bitbucket.org/dashboard/pullrequests' : `${cfg.baseUrl}/dashboard`;
}

/**
 * The origin this connector fetches (least-privilege-permissions design D8):
 * Cloud fetches `api.bitbucket.org` (a DIFFERENT origin), Server/DC is
 * same-origin. Delegates to the shared {@link requiredOriginsForConfig} so the
 * SW gate and the surfaces' grant request share one derivation.
 */
function requiredOrigins(cfg: ResolvedLensSource): string[] {
  return requiredOriginsForConfig(cfg);
}

/** The Bitbucket `SourceConnector` — the registry's `bitbucket` entry. */
export const bitbucketConnector: SourceConnector = {
  source: 'bitbucket',
  // Token-only (connector-accounts): Cloud's API on api.bitbucket.org ignores the
  // bitbucket.org browser session, so there is no `session` rung. Sourced from
  // the shared declared-methods map so the surfaces and the connector never drift.
  authMethods: PROVIDER_AUTH_METHODS.bitbucket,
  defaultBaseUrl: 'https://bitbucket.org',
  mintedIcon: 'folder-git-2',
  requiredOrigins,
  fetchRuntime,
  listingUrl,
};
