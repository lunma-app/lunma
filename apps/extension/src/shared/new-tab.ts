/**
 * The manifest's `chrome_url_overrides.newtab` target. Lunma owns the browser's
 * new-tab page; `chrome.runtime.getURL(NEWTAB_PAGE_PATH)` resolves to the
 * extension URL Chrome navigates to when a URL-less tab opens.
 */
export const NEWTAB_PAGE_PATH = 'src/launcher/newtab/index.html';

/**
 * Is `url` Lunma's new-tab page (the empty-Space "home")? A tab whose live URL
 * matches is a **home tab** — grouped into the active Space so the window shows
 * it, but never listed as a temporary tab (see the `spaces-and-tabs` spec). The
 * property is derived from the live URL, never persisted: the moment the user
 * navigates a home tab elsewhere it stops matching and becomes an ordinary tab.
 *
 * Matches both the bare `chrome://newtab/` Chrome reports for an overridden NTP
 * and the extension's resolved newtab URL (`chrome.runtime.getURL`), since
 * Chrome may surface either depending on navigation timing. `startsWith` on the
 * resolved URL tolerates a trailing query/hash. Chrome being unavailable (unit
 * tests without a stub) degrades to the `chrome://newtab/` check only.
 */
export function isNewTabUrl(url: string | undefined): boolean {
  if (!url) return false;
  if (url === 'chrome://newtab/' || url === 'chrome://newtab') return true;
  try {
    const resolved = chrome?.runtime?.getURL?.(NEWTAB_PAGE_PATH);
    if (resolved && (url === resolved || url.startsWith(resolved))) return true;
  } catch {
    // chrome.runtime unavailable — fall through to the negative result.
  }
  return false;
}
