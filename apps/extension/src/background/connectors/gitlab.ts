import { z } from 'zod';
import { readConnectors } from '../../shared/connectors';
import type { SmartFolderItem, SmartFolderRuntime, SmartQuery } from '../../shared/types';
import {
  boundedFetch,
  type ConnectorCaches,
  type SmartFolderNode,
  type SourceConnector,
} from './connector';

/**
 * The GitLab connector (smart-folders v1, relocated by github-connector design
 * D2 WITHOUT behaviour change — its pre-existing unit tests pass with
 * assertions unmodified):
 *
 *   - fetch + normalize: the three canned queries → documented `/api/v4`
 *     REST GETs, pipeline→tone mapping, bounded per-MR enrichment;
 *   - the PAT-then-cookies auth ladder with response-shape signed-out
 *     detection — never throwing.
 *
 * The source-agnostic engine (scheduling, in-flight guard, result-event
 * plumbing) stays in `../smart-folders.ts` and reaches this module only
 * through the `CONNECTORS` registry.
 */

/** Results cap — a review queue, not an archive. The folder badge renders
 * `20+` when the page is full, so the cap is never silent. */
const RESULTS_CAP = 20;

/** Pipeline-enrichment fan-out bound (≤21 requests/folder/poll worst case). */
const ENRICH_CONCURRENCY = 5;

/** The per-host PAT lookup key: hostname plus any explicit port. */
function hostOf(baseUrl: string): string {
  return new URL(baseUrl).host;
}

// ── pipeline → tone mapping ────────────────────────────────────────────────────

const TONE_BY_PIPELINE_STATUS: Record<string, NonNullable<SmartFolderItem['status']>> = {
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
export function pipelineStatus(raw: string | undefined | null): SmartFolderItem['status'] {
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

const MrSchema = z.object({
  id: z.union([z.number(), z.string()]),
  iid: z.number().optional(),
  project_id: z.number().optional(),
  title: z.string(),
  web_url: z.string(),
  head_pipeline: PipelineRefSchema,
  pipeline: PipelineRefSchema,
});

const MeSchema = z.object({ id: z.number() });

type Mr = z.infer<typeof MrSchema>;

type MeResolution = { kind: 'ok'; id: number } | { kind: 'signed-out' | 'error' };

/** Resolve `/api/v4/user` once per poll cycle: the `ConnectorCaches` map
 * (threaded by the engine) keys resolutions by baseUrl. The IN-FLIGHT promise
 * is cached synchronously, so concurrent same-host fetches in one cycle share
 * a single lookup instead of racing past an empty cache. */
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
function queryParams(query: SmartQuery, meId: number | null): string {
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

/**
 * Fetch one smart folder's results and normalize them into a
 * `SmartFolderRuntime`. Never throws — every failure shape resolves to a
 * runtime state. The engine reaches this via `CONNECTORS.gitlab.fetchRuntime`.
 */
async function fetchRuntime(
  node: Pick<SmartFolderNode, 'baseUrl' | 'query'>,
  caches: ConnectorCaches = new Map(),
): Promise<SmartFolderRuntime> {
  const fetchedAt = Date.now();
  const fail = (state: 'signed-out' | 'error'): SmartFolderRuntime => ({
    state,
    items: [],
    fetchedAt,
  });

  let host: string;
  try {
    host = hostOf(node.baseUrl);
  } catch {
    // A malformed persisted baseUrl (defensive — the SW validates on
    // create/update) degrades to the quiet error state, never a throw.
    return fail('error');
  }
  const auth = await authFor(host);

  let meId: number | null = null;
  if (node.query === 'review-requested') {
    const me = await resolveMe(node.baseUrl, auth, caches);
    if (me.kind !== 'ok') return fail(me.kind);
    meId = me.id;
  }

  const path = `/api/v4/merge_requests?state=opened&per_page=${RESULTS_CAP}&${queryParams(node.query, meId)}`;
  const outcome = await gitlabGet(node.baseUrl, path, auth);
  if (outcome.kind !== 'ok') return fail(outcome.kind);
  if (!Array.isArray(outcome.json)) return fail('error');

  // Element-wise parse: one malformed MR never costs the rest of the list.
  const mrs = outcome.json
    .flatMap((element) => {
      const parsed = MrSchema.safeParse(element);
      return parsed.success ? [parsed.data] : [];
    })
    .slice(0, RESULTS_CAP);

  // Bounded pipeline enrichment: only for listed items whose list row carries
  // no usable pipeline field; skipped entirely when it does. An enrichment
  // failure simply leaves that item glyph-less.
  const statuses = await mapWithConcurrency(mrs, ENRICH_CONCURRENCY, async (mr) => {
    const listed = usablePipelineStatus(mr);
    if (listed !== undefined) return listed;
    if (mr.project_id === undefined || mr.iid === undefined) return undefined;
    const detail = await gitlabGet(
      node.baseUrl,
      `/api/v4/projects/${mr.project_id}/merge_requests/${mr.iid}`,
      auth,
    );
    if (detail.kind !== 'ok') return undefined;
    const parsed = MrSchema.safeParse(detail.json);
    return parsed.success ? usablePipelineStatus(parsed.data) : undefined;
  });

  const items: SmartFolderItem[] = mrs.map((mr, index) => {
    const status = pipelineStatus(statuses[index]);
    return {
      id: String(mr.id),
      title: mr.title,
      url: mr.web_url,
      ...(status !== undefined ? { status } : {}),
    };
  });

  return { state: 'ok', items, fetchedAt };
}

/** The GitLab `SourceConnector` — the registry's `gitlab` entry. */
export const gitlabConnector: SourceConnector = {
  source: 'gitlab',
  defaultBaseUrl: 'https://gitlab.com',
  mintedIcon: 'folder-git-2',
  fetchRuntime,
};
