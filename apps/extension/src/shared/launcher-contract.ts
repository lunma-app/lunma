import type { SavedTabId, TabId, WindowId } from './types';

/**
 * Where a launcher result came from. Drives the source badge, the de-dup
 * precedence (`tab > saved > bookmark > history`), the source weight in scoring,
 * and which bus command acts on it (see `design.md` D2/D3/D4).
 *
 * The four data-provider sources (`tab`/`saved`/`bookmark`/`history`) are scored
 * and capped. `websearch` and `navigate` are **synthesized action sources**
 * (launcher-web-search): not produced by a provider, not scored/deduped/capped,
 * each carrying a pre-built `url` that acts through `openUrl`.
 */
export type ResultSource = 'tab' | 'saved' | 'bookmark' | 'history' | 'websearch' | 'navigate';

/**
 * A single merged, scored launcher result. Carries `{ id, source, title, url,
 * score }` for every source plus source-specific action fields:
 *
 * - `tab`     → `tabId` + `windowId` (focus the live tab);
 * - `saved`   → `savedTabId` (open/focus the Lunma saved tab);
 * - `bookmark`→ no extra field (acted on by `openUrl { url }`);
 * - `history` → optional `lastVisitTime` (epoch ms, recency term for scoring).
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
}

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
}

const BADGE_LABELS: Record<ResultSource, string> = {
  tab: 'tab',
  saved: 'saved',
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
