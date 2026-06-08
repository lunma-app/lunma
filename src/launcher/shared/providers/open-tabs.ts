import type { LauncherResult } from '../../../shared/launcher-contract';
import type { WindowId } from '../../../shared/types';

/** The slice of a `chrome.tabs.Tab` the open-tabs provider reads. Kept minimal
 * so tests can fake it without a full `chrome.tabs.Tab`. */
export interface OpenTabInput {
  id?: number | undefined;
  windowId?: number | undefined;
  title?: string | undefined;
  url?: string | undefined;
  active?: boolean | undefined;
}

/**
 * Map live Chrome tabs to candidate `tab` results, EXCLUDING the active window's
 * active tab (you're already there). Pure over its inputs: pass the result of
 * `chrome.tabs.query({})` plus the requesting window id. Tabs without an id or a
 * URL are dropped. Carries `tabId` + `windowId` for the `focusTab` action.
 */
export function openTabsProvider(tabs: OpenTabInput[], activeWindowId: WindowId): LauncherResult[] {
  const results: LauncherResult[] = [];
  for (const tab of tabs) {
    if (tab.id === undefined || tab.windowId === undefined) continue;
    const url = tab.url;
    if (!url) continue;
    if (tab.active && tab.windowId === activeWindowId) continue;
    results.push({
      id: `tab:${tab.id}`,
      source: 'tab',
      title: tab.title ?? url,
      url,
      score: 0,
      tabId: tab.id,
      windowId: tab.windowId,
    });
  }
  return results;
}
