// Pure read predicates over `AppState`, factored out of the coordinator so the
// handler slices can share them without a context member (split-coordinator-
// handlers). Each is a free function over plain state — no `this`, no `chrome.*`,
// no mutation. Bodies are verbatim moves of the former `Coordinator` private
// helpers (`this.store.state` → the `state` argument).

import type { AppState, SavedTabId, SpaceId, TabId, WindowId } from '../../shared/types';

/** Does `spaceId` name a live (non-trashed) Space? */
export function spaceExists(state: AppState, spaceId: SpaceId): boolean {
  return state.spaces.some((s) => s.id === spaceId);
}

/**
 * Is `tabId` already tracked by Lunma — a temporary tab in any (window, Space)
 * instance, or bound to a saved tab? Used to distinguish a home tab navigating to
 * a real URL (untracked → adopt) from an ordinary navigation of a tab already
 * listed/pinned (tracked → no regroup).
 */
export function isTrackedTab(state: AppState, tabId: TabId): boolean {
  for (const map of Object.values(state.spaceInstancesByWindow)) {
    if (!map) continue;
    for (const inst of Object.values(map)) {
      if (inst.tempTabIds.includes(tabId)) return true;
    }
  }
  for (const slots of Object.values(state.tabBindings)) {
    if (Object.values(slots).includes(tabId)) return true;
  }
  return false;
}

/**
 * The Space id of the (window, Space) instance Lunma tracks for `groupId`, or
 * `null` when no instance holds it (an untracked group, or one already
 * forgotten). Used by the tab-group lifecycle hints to ignore untracked groups.
 */
export function findSpaceIdByGroupId(state: AppState, groupId: number): SpaceId | null {
  if (groupId < 0) return null;
  for (const map of Object.values(state.spaceInstancesByWindow)) {
    if (!map) continue;
    for (const instance of Object.values(map)) {
      if (instance.groupId === groupId) return instance.spaceId;
    }
  }
  return null;
}

/** The saved-tab id currently bound to `tabId`, or `undefined`. Used to re-push
 * boundary config when a bound tab finishes (re)loading. */
export function savedTabIdForBoundTab(state: AppState, tabId: TabId): SavedTabId | undefined {
  for (const [savedTabId, slots] of Object.entries(state.tabBindings)) {
    if (Object.values(slots).includes(tabId)) return savedTabId;
  }
  return undefined;
}

/**
 * Return the first `TabId` in the current window's active Space whose live URL
 * exactly matches `url`, or `null` when no match is found. Checks temporary tabs
 * first, then pinned (saved) tabs bound in this window whose `savedTabs` record
 * has `spaceId` equal to the active Space. URL matching is exact — no
 * normalisation, no fragment stripping. Dedup scope: current window, active Space
 * only (not cross-window, not cross-Space).
 */
export function findTabInActiveSpace(
  state: AppState,
  windowId: WindowId,
  url: string,
): TabId | null {
  const activeSpaceId = state.activeSpaceByWindow[windowId];
  if (!activeSpaceId) return null;

  const tempTabIds = state.spaceInstancesByWindow[windowId]?.[activeSpaceId]?.tempTabIds ?? [];
  for (const tabId of tempTabIds) {
    if (state.liveTabsById[tabId]?.url === url) return tabId;
  }

  for (const [savedId, slots] of Object.entries(state.tabBindings)) {
    if (state.savedTabs[savedId]?.spaceId !== activeSpaceId) continue;
    const tabId = slots[windowId];
    if (tabId !== undefined && state.liveTabsById[tabId]?.url === url) return tabId;
  }

  return null;
}
