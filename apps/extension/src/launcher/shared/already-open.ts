// "Already open" detection for the launcher surfaces (tab-dedup, design D4). A
// pure predicate over `AppState`: does `url` already have a tab open in the
// current window's active Space? Mirrors the SW dedup query
// `findTabInActiveSpace` (background/handlers/queries.ts) exactly — same scope
// (current window, active Space, temp + pinned), same exact (un-normalised) URL
// match — but returns a boolean and lives in `launcher/shared` so both the
// new-tab surface (which holds a read-only `AppState` mirror) and the SW
// suggestions handler can call it. The one-way import DAG forbids `launcher/`
// from importing `background/`, so the scan is re-stated here rather than shared
// with `queries.ts`; the two MUST stay in lockstep (both are covered by tests).

import type { ResultSource } from '../../shared/launcher-contract';
import type { AppState, WindowId } from '../../shared/types';

/**
 * The result sources whose URL is a plain `openUrl` target and therefore subject
 * to dedup / the "already open" affordance: `bookmark`, `history`, `websearch`,
 * `navigate`. A `tab` result already focuses its live tab and a `saved` result
 * carries its own open/focus semantics, so neither is ever marked "already open".
 */
const DEDUP_ELIGIBLE_SOURCES: ReadonlySet<ResultSource> = new Set<ResultSource>([
  'bookmark',
  'history',
  'websearch',
  'navigate',
]);

export function isDedupEligibleSource(source: ResultSource): boolean {
  return DEDUP_ELIGIBLE_SOURCES.has(source);
}

/**
 * Is `url` already open in `windowId`'s active Space? Checks temporary tabs
 * first, then pinned (saved) tabs bound in this window whose `savedTabs` record
 * has `spaceId` equal to the active Space. Exact URL match. Returns `false` when
 * the window has no active Space.
 */
export function isUrlOpenInActiveSpace(state: AppState, windowId: WindowId, url: string): boolean {
  const activeSpaceId = state.activeSpaceByWindow[windowId];
  if (!activeSpaceId) return false;

  const tempTabIds = state.spaceInstancesByWindow[windowId]?.[activeSpaceId]?.tempTabIds ?? [];
  for (const tabId of tempTabIds) {
    if (state.liveTabsById[tabId]?.url === url) return true;
  }

  for (const [savedId, slots] of Object.entries(state.tabBindings)) {
    if (state.savedTabs[savedId]?.spaceId !== activeSpaceId) continue;
    const tabId = slots[windowId];
    if (tabId !== undefined && state.liveTabsById[tabId]?.url === url) return true;
  }

  return false;
}
