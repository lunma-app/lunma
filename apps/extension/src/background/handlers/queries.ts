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

/**
 * The Space that owns `tabId` in `windowId`, or `null` when none does
 * (focused-tab-switches-space, design D2). Resolution order, all from store state:
 *
 * 1. The Space whose **per-window instance** lists the tab as temporary
 *    (`spaceInstancesByWindow[windowId][spaceId].tempTabIds` includes `tabId`).
 * 2. Else, a **coupled pinned tab** bound to it in this window
 *    (`tabBindings[savedId][windowId] === tabId` with `savedTabs[savedId].spaceId
 *    !== null`) → that `spaceId`.
 * 3. Else `null` — an ungrouped/untracked tab, or a global favorite (its binding
 *    resolves to `spaceId === null`, which step 2 excludes). A `null` owner never
 *    drives a Space switch on activation.
 */
export function spaceOwningTab(state: AppState, windowId: WindowId, tabId: TabId): SpaceId | null {
  const instances = state.spaceInstancesByWindow[windowId];
  if (instances) {
    for (const instance of Object.values(instances)) {
      if (instance.tempTabIds.includes(tabId)) return instance.spaceId;
    }
  }
  for (const [savedId, slots] of Object.entries(state.tabBindings)) {
    if (slots[windowId] !== tabId) continue;
    const spaceId = state.savedTabs[savedId]?.spaceId;
    if (spaceId != null) return spaceId;
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
