import type {
  AuthMethod,
  LensProvider,
  LensSectionRuntime,
  ResolvedLensSource,
} from '../../shared/types';

/**
 * The connector contract (github-connector, design D1) — a fetch-contract, not
 * a framework. Extracted from two real implementations (GitLab, GitHub), so
 * every member is derived, not guessed: per-source query→request translation,
 * response normalization onto the agnostic `LensItem`/
 * `LensSectionRuntime` shapes, a per-source auth strategy (GitLab:
 * PAT-then-cookies; GitHub: token-only), and a per-source status→tone mapping.
 * The source-agnostic engine in `../smart-folders.ts` dispatches through the
 * closed `CONNECTORS` registry keyed by `source`.
 */

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
  readonly source: LensProvider;
  /**
   * The auth methods this provider supports (connector-accounts, design D3), in
   * no particular order — the EFFECTIVE method for an account is derived by
   * `deriveAuthMethod` (token wins over session). `github: ['pat']`,
   * `gitlab: ['session', 'pat']`, `jira: ['session']`, `rss: []` (public). Drives
   * the session-default-vs-token-required behaviour in the connectors and the
   * surfaces (the inline connect affordance is method-aware).
   */
  readonly authMethods: AuthMethod[];
  /** The editor's per-source base-URL seed (empty for `rss` — a feed has no
   * canonical host; the user pastes the feed URL). */
  readonly defaultBaseUrl: string;
  /** The icon the SW mints onto a created node — `'folder-git-2'` for both git
   * forges (lucide ships no GitHub brand glyph; github-connector D7),
   * `'folder-kanban'` for Jira, `'rss'` for the feed source. */
  readonly mintedIcon: string;
  /**
   * The host match patterns this connector ACTUALLY fetches for `cfg` — NOT
   * necessarily the folder's `baseUrl` origin (least-privilege-permissions,
   * design D8). The engine gates on `hasHostPermissions(requiredOrigins(cfg))`
   * before dispatch and the editor requests this same set; keying on `baseUrl`
   * directly would be wrong for GitHub, which fetches `api.github.com`, never
   * `github.com`. A synchronous, pure derivation (mirrors `listingUrl`); a
   * malformed `baseUrl` yields an empty pattern (treated as ungranted) rather
   * than throwing.
   */
  requiredOrigins(cfg: ResolvedLensSource): string[];
  /** Bounded, never throws; resolves every failure to a runtime state. Slices
   * its normalized results to `maxItems` (rss-connector design D5). Receives a
   * RESOLVED single-query config — the engine expands `queries[]` before
   * dispatch, so a connector never sees a `queries[]` array. */
  fetchRuntime(
    cfg: ResolvedLensSource,
    maxItems: number,
    caches?: ConnectorCaches,
  ): Promise<LensSectionRuntime>;
  /**
   * The URL that shows the source's full listing in a browser, consumed by
   * "open all in a tab" (rss-connector design D6) — the dashboard/search/JQL
   * view for the queue sources, the feed channel's own website link for `rss`
   * (falling back to the feed URL when the channel link is not yet known). NO
   * network I/O — a synchronous, pure resolution.
   */
  listingUrl(cfg: ResolvedLensSource): string;
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
