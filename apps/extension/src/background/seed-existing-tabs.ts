import { isNewTabUrl } from '../shared/new-tab';
import type { LunmaStore } from '../shared/store.svelte';
import type { SpaceId } from '../shared/types';

/**
 * Adopt the tabs already open when the service worker boots into their
 * window's active Space as temporary tabs. `chrome.tabs.onCreated` only fires
 * for NEW tabs, and `onTabCreated` early-returns unless the window already has
 * a `spaceInstance` — so without this pass the sidebar's Temporary list would
 * stay empty until the user switched Spaces and opened a fresh tab.
 *
 * For each tab we first ensure the window has a `spaceInstance` (via
 * `ensureSpaceInstance`), then run it through `onTabCreated`, which skips tabs
 * that are bound to a saved tab (rebound earlier in boot by
 * `runRestartRecovery`) and tabs already tracked. Idempotent across boots.
 *
 * Takes the `chrome.tabs.query({})` result the caller already fetched (shared
 * with `rebuildLiveTabs`) rather than querying again.
 *
 * A **home tab** (the Lunma new-tab page, recognised by `isNewTabUrl`) is NOT
 * seeded into `tempTabIds` — it is the active Space's home, not a temporary
 * tab. (It is still grouped into the active Space on activation; it just never
 * appears in the Temporary list.)
 *
 * **Group-aware** (prevent-space-group-collapse): a tab whose live Chrome
 * `groupId` maps to a Space instance in its window is seeded into THAT Space —
 * not the active one — so a long-lived tab no longer accumulates into whichever
 * Space happened to be active across restarts (the "two Spaces, one group"
 * root cause). Ungrouped tabs, and tabs whose group maps to no instance, fall
 * back to the window's active Space (the prior behaviour). Either path evicts
 * the tab from sibling instances, so it is seeded into exactly one instance.
 */
export function seedExistingTabs(
  store: LunmaStore,
  tabs: ReadonlyArray<{
    id?: number | undefined;
    windowId?: number | undefined;
    url?: string | undefined;
    groupId?: number | undefined;
  }>,
): void {
  // Per-window `groupId → spaceId` index from the persisted instances, so a
  // grouped tab seeds into the Space that actually owns its live Chrome group.
  // The `-1` "no live group" sentinel is skipped (many instances may share it).
  // Built once up front: instances created during the loop are the active
  // Space's (groupId `-1`), which contribute no mapping anyway.
  const spaceByGroupByWindow = new Map<number, Map<number, SpaceId>>();
  for (const [windowIdStr, windowMap] of Object.entries(store.state.spaceInstancesByWindow)) {
    if (!windowMap) continue;
    const byGroup = new Map<number, SpaceId>();
    for (const [spaceId, instance] of Object.entries(windowMap)) {
      if (instance && instance.groupId >= 0) byGroup.set(instance.groupId, spaceId);
    }
    spaceByGroupByWindow.set(Number(windowIdStr), byGroup);
  }

  // `onTabCreated` / `assignSpaceTabs` prepend (Temporary is newest-first), so
  // iterate in reverse to preserve Chrome's existing tab order top-to-bottom at
  // boot.
  for (let i = tabs.length - 1; i >= 0; i--) {
    const tab = tabs[i];
    if (!tab || tab.id === undefined || tab.windowId === undefined) continue;
    // Ensure the window's active Space has an instance for EVERY tab's window —
    // BEFORE the home-tab skip — so a window whose only tab is a home tab still
    // gets an instance. Without it, `onTabCreated` / `groupNewTab` would have no
    // instance to attach to and newly-created tabs would never be grouped (the
    // "Lunma does nothing after a Clear-then-reopen" regression).
    store.ensureSpaceInstance(tab.windowId);
    if (isNewTabUrl(tab.url)) continue; // home tab — grouped on activation, never a temp tab
    // Seed by real group membership: a tab whose live Chrome group maps to a
    // Space instance in this window goes to THAT Space (evicting from siblings
    // via `assignSpaceTabs`); an ungrouped/unmapped tab falls back to the active
    // Space (`onTabCreated`, which now applies the same per-window guard).
    const matched =
      tab.groupId !== undefined && tab.groupId >= 0
        ? spaceByGroupByWindow.get(tab.windowId)?.get(tab.groupId)
        : undefined;
    if (matched !== undefined) {
      store.assignSpaceTabs(tab.windowId, matched, [tab.id]);
    } else {
      store.onTabCreated({ id: tab.id, windowId: tab.windowId });
    }
  }
}
