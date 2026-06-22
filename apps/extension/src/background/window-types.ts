// Single source of truth for "which Chrome window types Lunma manages."
// Tab groups (the mechanism backing Spaces) exist ONLY in normal browser
// windows — `chrome.tabs.group` rejects with "Grouping is not supported by
// tabs in this window." for any other type (popup, panel, app, devtools, …).
// So Spaces are seeded/orchestrated only in normal windows; both window-entry
// points (boot seed + `windows.onCreated`) gate on this. Pure chrome-type
// predicate — imports nothing else in the app (background layer, see the DAG).

/** Window types Lunma seeds into `activeSpaceByWindow`. Feeds `getAll`'s typed
 * `windowTypes` option; widening it later is a one-line change. */
export const MANAGED_WINDOW_TYPES = ['normal'] as const;

/** True when Lunma should manage Spaces in `window` — i.e. it is a normal
 * browser window (the only type where tab groups exist). */
export function isManagedWindow(window: chrome.windows.Window): boolean {
  return window.type === 'normal';
}
