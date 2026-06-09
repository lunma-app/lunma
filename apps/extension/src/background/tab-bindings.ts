import { log } from '../shared/logger';
import type { SavedTabId, TabId, WindowId } from '../shared/types';
import { store } from './store-singleton';

// Section 7: Restart recovery.
//
// The five former free functions (openSavedTab, focusSavedTab, goHome,
// makeThisHome, deleteSavedTab) and the ConfirmFn type are deleted — they now
// live as coordinator handlers behind `bus.send(...)`. Saved tabs are
// Lunma-owned records (ADR 0005); recovery matches them to live tabs by URL.
//
// Per-window-tab-bindings (ADR 0009): bindings are per `(saved tab, window)`, so
// recovery runs PER WINDOW. One `chrome.tabs.query({})` is bucketed by window;
// each stale window slot is rebound by URL among that window's live tabs only
// (first-claim-wins per window), and cleared when nothing matches.

export async function runRestartRecovery(): Promise<void> {
  const bindings = store.state.tabBindings;
  const savedTabs = store.state.savedTabs;
  const tabLastActivity = store.state.tabLastActivity;

  let liveTabs: chrome.tabs.Tab[] = [];
  try {
    liveTabs = await chrome.tabs.query({});
  } catch (err) {
    log.error('runRestartRecovery: chrome.tabs.query failed', { err });
    return;
  }

  // `tabId → windowId` for every live tab (to test a slot's staleness) and live
  // tabs bucketed by their current window (to rebind within that window).
  const windowByTabId = new Map<TabId, WindowId>();
  const tabsByWindow = new Map<WindowId, chrome.tabs.Tab[]>();
  for (const t of liveTabs) {
    if (t.id === undefined || t.windowId === undefined) continue;
    windowByTabId.set(t.id, t.windowId);
    const bucket = tabsByWindow.get(t.windowId);
    if (bucket) bucket.push(t);
    else tabsByWindow.set(t.windowId, [t]);
  }

  // Per-window claim sets: two stale slots in the same window can't both grab the
  // same restored tab (first-claim-wins, evaluated independently per window).
  const claimedByWindow = new Map<WindowId, Set<TabId>>();
  const resolved: {
    [savedTabId: SavedTabId]: { [windowId: WindowId]: { tabId: TabId } | null };
  } = {};

  const pickByUrl = (windowId: WindowId, url: string): TabId | null => {
    const claimed = claimedByWindow.get(windowId);
    const matches = (tabsByWindow.get(windowId) ?? []).filter(
      (t) => t.url === url && t.id !== undefined && !(claimed?.has(t.id) ?? false),
    );
    if (matches.length === 0) return null;
    matches.sort((a, b) => {
      const ta = a.id !== undefined ? (tabLastActivity[a.id] ?? 0) : 0;
      const tb = b.id !== undefined ? (tabLastActivity[b.id] ?? 0) : 0;
      return tb - ta;
    });
    return matches[0]?.id ?? null;
  };

  for (const [savedTabId, slots] of Object.entries(bindings)) {
    const saved = savedTabs[savedTabId];
    for (const [windowIdStr, boundTabId] of Object.entries(slots)) {
      const windowId = Number(windowIdStr);
      // Still bound to a live tab IN ITS OWN WINDOW → leave the slot untouched.
      if (windowByTabId.get(boundTabId) === windowId) continue;
      // Stale slot — rebind by URL within this window, else clear it.
      let byWindow = resolved[savedTabId];
      if (!byWindow) {
        byWindow = {};
        resolved[savedTabId] = byWindow;
      }
      if (!saved) {
        byWindow[windowId] = null;
        continue;
      }
      let tabId: TabId | null = null;
      if (saved.currentURL !== null) tabId = pickByUrl(windowId, saved.currentURL);
      if (tabId === null) tabId = pickByUrl(windowId, saved.originalURL);
      if (tabId === null) {
        byWindow[windowId] = null;
      } else {
        const claimed = claimedByWindow.get(windowId) ?? new Set<TabId>();
        claimed.add(tabId);
        claimedByWindow.set(windowId, claimed);
        byWindow[windowId] = { tabId };
      }
    }
  }

  if (Object.keys(resolved).length === 0) return;
  store.applyRestartRecovery(resolved);
}
