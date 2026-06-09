import type { LauncherResult } from '../../../shared/launcher-contract';
import type { SavedTab, SavedTabId, TabBinding, WindowId } from '../../../shared/types';

/**
 * Map Lunma saved tabs (pinned + favicon-row records) to candidate `saved`
 * results. Pure over `LunmaStore.state.savedTabs` + `state.tabBindings`. The
 * result URL is the live `currentURL` when bound, else the record's
 * `originalURL` home. Carries `savedTabId` always; and when the saved tab is
 * **bound to a live tab in `windowId`** (per-window-tab-bindings, ADR 0009),
 * also carries that window's `tabId` — the presence of `tabId` is the signal a
 * (stateless) surface uses to dispatch `focusSavedTab` rather than `openSavedTab`
 * (no surface needs to read bindings itself). The request's `windowId` selects
 * which window's slot decides focus-vs-open.
 */
export function savedTabsProvider(
  savedTabs: Record<SavedTabId, SavedTab>,
  tabBindings: Record<SavedTabId, TabBinding> = {},
  windowId?: WindowId,
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
    results.push(result);
  }
  return results;
}
