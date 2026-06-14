import type { SavedTabId, SpaceId, TabId, WindowId } from './types';

/**
 * Where a launcher result came from. Drives the source badge, the de-dup
 * precedence (`tab > saved > smart > bookmark > history`), the source weight in
 * scoring, and which bus command acts on it (see `design.md` D2/D3/D4).
 *
 * The five data-provider sources (`tab`/`saved`/`smart`/`bookmark`/`history`) are
 * scored and capped. `smart` is a smart-folder item (link-shaped: a pre-built
 * `url`, no binding), badged generically `smart` and acting through `openUrl`
 * exactly like a bookmark/history row (launcher-fuzzy-smart-folders).
 * `websearch` and `navigate` are **synthesized action sources**
 * (launcher-web-search): not produced by a provider, not scored/deduped/capped,
 * each carrying a pre-built `url` that acts through `openUrl`.
 */
export type ResultSource =
  | 'tab'
  | 'saved'
  | 'smart'
  | 'bookmark'
  | 'history'
  | 'websearch'
  | 'navigate';

/**
 * A single merged, scored launcher result. Carries `{ id, source, title, url,
 * score }` for every source plus source-specific action fields:
 *
 * - `tab`     → `tabId` + `windowId` (focus the live tab);
 * - `saved`   → `savedTabId` (open/focus the Lunma saved tab); `folderName` when
 *              the saved tab lives in a regular folder (a matchable field);
 * - `smart`   → no binding/`tabId` (acted on by `openUrl { url }`); always carries
 *              its smart folder's `folderName` (a matchable field);
 * - `bookmark`→ no extra field (acted on by `openUrl { url }`);
 * - `history` → optional `lastVisitTime` (epoch ms, recency term for scoring).
 *
 * `folderName` is an OPTIONAL matched field (alongside `title`/`url`): a `saved`
 * result placed in a folder and every `smart` result carry their folder's name so
 * the query can match it, without folders ever becoming result rows themselves
 * (launcher-fuzzy-smart-folders).
 *
 * Pure data — no chrome imports, no behavior. Both surfaces and the SW handler
 * exchange arrays of these over the suggestions channel.
 */
export interface LauncherResult {
  id: string;
  source: ResultSource;
  title: string;
  url: string;
  score: number;
  tabId?: TabId;
  savedTabId?: SavedTabId;
  windowId?: WindowId;
  /** History-only: `chrome.history.HistoryItem.lastVisitTime` (epoch ms). */
  lastVisitTime?: number;
  /** The enclosing folder's name, a matchable field — set for a `saved` result in
   * a regular folder and for every `smart` result. Absent otherwise. */
  folderName?: string;
  /** The owning Space of a space-placed Lunma result — set for a pinned `saved`
   * result (its `SavedTab.spaceId`) and every `smart` result (its folder's Space).
   * Absent for global rows (favicon-row favorites, `bookmark`/`history`/`tab`,
   * and the synthesized actions). Drives the launcher's current-Space scope: the
   * `prefer-current-space` ranking boost and the `current-space-only` filter
   * (launcher-fuzzy-smart-folders, design D9). */
  spaceId?: SpaceId;
  /** Cross-Space marker (launcher-fuzzy-smart-folders, design D10). Set by the SW
   * handler ONLY when this result's owning Space differs from the requesting
   * window's active Space — its presence is the signal a surface renders the
   * "lives in another Space" chip (a colour dot + name), so the stateless overlay
   * decides from the result alone. `spaceName` is the foreign Space's display name;
   * `spaceColor` is its canonical Space colour as a ready-to-paint `oklch(…)` CSS
   * string (resolved via `colourToOklch`). Both absent for in-active-Space and
   * global rows. */
  spaceName?: string;
  spaceColor?: string;
}

/**
 * An optional result-source permission the launcher can offer to enable
 * (least-privilege-permissions). Mirrors `shared/permissions`'s
 * `OptionalApiPermission` WITHOUT importing it, so the byte-budgeted overlay
 * (which imports this contract) never pulls the `chrome.permissions` wrapper into
 * its bundle.
 */
export type OptionalResultSource = 'history' | 'bookmarks';

/** A suggestions request: a debounced keystroke from a surface. `requestId`
 * round-trips so a surface can drop stale (out-of-order) responses. */
export interface SuggestionsQuery {
  requestId: string;
  query: string;
  windowId: WindowId;
}

/** A suggestions response: the merged, scored results for a `requestId`. */
export interface SuggestionsResult {
  requestId: string;
  results: LauncherResult[];
  /**
   * The subset of `results[].url` that is already open in the requesting
   * window's active Space (tab-dedup). Computed SW-side via
   * `isUrlOpenInActiveSpace` so the **stateless** in-page overlay — which has no
   * `AppState` to query — can render the "already open" indicator by membership.
   * Only dedup-eligible sources (`bookmark`/`history`/`websearch`/`navigate`)
   * contribute. Absent/empty when nothing matches. The new-tab surface holds its
   * own state mirror and derives the flag directly, ignoring this field.
   */
  openUrls?: string[];
  /**
   * The optional result sources (`history` / `bookmarks`) NOT currently granted,
   * computed SW-side (least-privilege-permissions D5). A surface renders an
   * "Enable ⟨source⟩ results" affordance for each. The **stateless overlay**
   * relies on this (it cannot query `chrome.permissions` itself); the new-tab
   * surface uses it too for one consistent signal. Absent/empty when every
   * optional source is granted (or the query is empty, in which case the SW
   * returns no results at all).
   */
  ungrantedSources?: OptionalResultSource[];
}

const BADGE_LABELS: Record<ResultSource, string> = {
  tab: 'tab',
  saved: 'saved',
  smart: 'smart',
  bookmark: 'bookmark',
  history: 'history',
  websearch: 'search',
  navigate: 'open',
};

/**
 * Human label for a result's source badge (launcher-web-search).
 *
 * `ResultRow` renders this rather than the raw source string so the synthesized
 * action sources read naturally — `websearch → "search"`, `navigate → "open"` —
 * while the four data sources map to themselves. Shared by `ResultRow` and the
 * vanilla overlay so the two surfaces' badges stay in lockstep. Pure + tiny (a
 * lookup map) so the overlay can import it without breaching its byte budget.
 */
export function sourceBadgeLabel(source: ResultSource): string {
  return BADGE_LABELS[source] ?? source;
}
