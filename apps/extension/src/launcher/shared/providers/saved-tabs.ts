import type { LauncherResult } from '../../../shared/launcher-contract';
import type { SavedTab, SavedTabId, TabBinding, WindowId } from '../../../shared/types';

/**
 * Map Lunma saved tabs (pinned + favicon-row records) to candidate `saved`
 * results. Pure over `LunmaStore.state.savedTabs` + `state.tabBindings`. The
 * result URL is the live `currentURL` when bound, else the record's
 * `originalURL` home. Carries `savedTabId` always; and when the saved tab is
 * **bound to a live tab in `windowId`** (per-window-tab-bindings, ADR 0003),
 * also carries that window's `tabId` — the presence of `tabId` is the signal a
 * (stateless) surface uses to dispatch `focusSavedTab` rather than `openSavedTab`
 * (no surface needs to read bindings itself). The request's `windowId` selects
 * which window's slot decides focus-vs-open.
 *
 * `savedTabFolder` (optional) maps a `SavedTabId` to the name of the regular
 * `folder` node it lives in (from `buildFolderNameIndex().savedTabFolder`,
 * launcher-fuzzy-smart-folders): when the saved tab has an entry, the result
 * carries it as the matchable `folderName` field. A favicon-row or unfoldered
 * saved tab has no entry and so no `folderName`.
 *
 * A **pinned** saved tab (non-null `SavedTab.spaceId`) also carries that
 * `spaceId` for the launcher's current-Space scope (design D9). A favicon-row
 * favorite (`spaceId === null`) is global — it carries no `spaceId`, so it is
 * never down-ranked or filtered by the current-Space scope.
 */
export function savedTabsProvider(
  savedTabs: Record<SavedTabId, SavedTab>,
  tabBindings: Record<SavedTabId, TabBinding> = {},
  windowId?: WindowId,
  savedTabFolder: Record<SavedTabId, string> = {},
): LauncherResult[] {
  const results: LauncherResult[] = [];
  for (const saved of Object.values(savedTabs)) {
    const url = saved.currentURL ?? saved.originalURL;
    if (!url) continue;
    const result: LauncherResult = {
      id: `saved:${saved.id}`,
      source: 'saved',
      title: saved.title || url,
      url,
      score: 0,
      savedTabId: saved.id,
    };
    const bound = windowId !== undefined ? tabBindings[saved.id]?.[windowId] : undefined;
    if (bound !== undefined) result.tabId = bound;
    const folderName = savedTabFolder[saved.id];
    if (folderName !== undefined) result.folderName = folderName;
    if (saved.spaceId !== null) result.spaceId = saved.spaceId;
    results.push(result);
  }
  return results;
}
