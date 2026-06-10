import { log } from '../shared/logger';

/**
 * Inject the launcher overlay content script into one tab on demand, using the
 * same files the manifest declares for the declarative content script. Used by
 * both the `toggle-launcher` command path (when the active tab has no overlay
 * yet) and the install-time backfill below.
 *
 * The overlay entry is selected from the manifest **by filename**, NOT by array
 * index (mirroring {@link injectBoundary}), so it never binds to the wrong entry
 * if the content-scripts order changes.
 *
 * Re-injection is idempotent: the overlay IIFE early-returns on its
 * `window.__lunmaLauncherInstalled` guard, so a tab that already runs the
 * overlay is a no-op. Throws on failure (no files declared, or Chrome forbids
 * injecting the target page — `chrome://`, the Web Store, extension pages) so
 * callers decide how to handle it.
 */
const OVERLAY_SCRIPT_FILE = 'overlay';

export async function injectOverlay(tabId: number): Promise<void> {
  const files = chrome.runtime
    .getManifest()
    .content_scripts?.find((cs) => cs.js?.some((file) => file.includes(OVERLAY_SCRIPT_FILE)))?.js;
  if (!files || files.length === 0) {
    throw new Error('injectOverlay: no overlay content script declared in manifest');
  }
  await chrome.scripting.executeScript({ target: { tabId }, files });
}

/**
 * Backfill the overlay into every already-open `http(s)` tab. Declarative
 * content scripts inject only into tabs opened/reloaded AFTER the extension
 * loads, so a tab open before that has no overlay — hence no `Alt+L` keydown
 * listener. The SW runs this on `chrome.runtime.onInstalled` (install/update/
 * reload) so the keydown fallback goes live on existing tabs without a manual
 * reload.
 *
 * Non-intrusive: only `http(s)` tabs are targeted (Chrome forbids injecting
 * `chrome://`, the Web Store, extension pages, and Lunma's own new-tab page —
 * which has its own inline launcher); per-tab failures are isolated so one
 * forbidden tab never aborts the sweep; and re-injection is a no-op via the
 * overlay's install guard. Logs an injected/skipped summary (never silent).
 */
export async function backfillOverlayIntoOpenTabs(): Promise<void> {
  const tabs = await chrome.tabs.query({});
  const injectable = tabs.filter(
    (t): t is chrome.tabs.Tab & { id: number } =>
      t.id !== undefined && /^https?:\/\//.test(t.url ?? ''),
  );
  const results = await Promise.allSettled(injectable.map((t) => injectOverlay(t.id)));
  const injected = results.filter((r) => r.status === 'fulfilled').length;
  log.debug('overlay backfill complete', {
    injected,
    skipped: tabs.length - injected,
    total: tabs.length,
  });
}
