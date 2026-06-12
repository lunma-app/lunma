import type { PinNode, SmartFolderRuntime, SmartSource } from '../../shared/types';

/**
 * The connector contract (github-connector, design D1) — a fetch-contract, not
 * a framework. Extracted from two real implementations (GitLab, GitHub), so
 * every member is derived, not guessed: per-source query→request translation,
 * response normalization onto the agnostic `SmartFolderItem`/
 * `SmartFolderRuntime` shapes, a per-source auth strategy (GitLab:
 * PAT-then-cookies; GitHub: token-only), and a per-source status→tone mapping.
 * The source-agnostic engine in `../smart-folders.ts` dispatches through the
 * closed `CONNECTORS` registry keyed by `source`.
 */

export type SmartFolderNode = Extract<PinNode, { kind: 'smart' }>;

/**
 * Per-request timeout. A hung connection (dropped VPN, sleeping proxy) must
 * RESOLVE — to the quiet `error` state — never wedge the folder in `pending`:
 * the in-flight guard skips a folder while its fetch is outstanding, so an
 * unbounded hang would silently block every later poll ("eternal loading").
 */
export const FETCH_TIMEOUT_MS = 20_000;

/**
 * A per-poll-cycle scratch map a connector MAY use for once-per-cycle
 * resolutions (the v1 GitLab `MeCache`, renamed and generalized — GitLab's
 * `/api/v4/user` lookups key by baseUrl; GitHub needs none).
 * `refreshDueSmartFolders` constructs ONE per cycle and threads it through
 * `startSmartFolderRefresh(deps, node, caches?)`; a manual/single refresh
 * passes none and the fetch defaults its own. Values are the IN-FLIGHT
 * resolution promise (set synchronously before the first await): the engine
 * fans due fetches out concurrently, and only promise caching makes
 * once-per-cycle literally true — a settled-value map would let two same-host
 * folders race past an empty cache into duplicate lookups.
 */
export type ConnectorCaches = Map<string, Promise<unknown>>;

/** One smart-folder connector source. */
export interface SourceConnector {
  readonly source: SmartSource;
  /** The editor's per-source base-URL seed. */
  readonly defaultBaseUrl: string;
  /** The icon the SW mints onto a created node — `'folder-git-2'` for both
   * shipped sources (lucide ships no GitHub brand glyph; design D7). */
  readonly mintedIcon: string;
  /** Bounded, never throws; resolves every failure to a runtime state. */
  fetchRuntime(
    node: Pick<SmartFolderNode, 'baseUrl' | 'query'>,
    caches?: ConnectorCaches,
  ): Promise<SmartFolderRuntime>;
}

/**
 * The bounded fetch every connector request goes through: the 20 s
 * `AbortSignal.timeout` wrapper ONLY — a timeout rejects (AbortError) into the
 * caller's catch. Response INTERPRETATION stays per connector: GitLab's
 * non-JSON-body → `signed-out` heuristic is cookie-session-specific and must
 * not leak to GitHub, whose authenticated API answers are always JSON.
 */
export function boundedFetch(url: string, init: RequestInit): Promise<Response> {
  return fetch(url, { ...init, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
}
