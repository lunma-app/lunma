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
 * Matches any Chromium fork's own internal new-tab URL — `chrome://newtab`,
 * `edge://newtab`, or `brave://newtab` (each with an optional trailing slash,
 * query, or hash) — which the browser reports transiently for an overridden NTP,
 * plus the extension's resolved newtab URL (`chrome.runtime.getURL`), which it
 * surfaces after the override resolves. Either may appear depending on
 * navigation timing. The anchored regex rejects sibling internal pages
 * (`edge://settings`, `edge://newtab-foo`) and real web URLs (`https://newtab`).
 * `startsWith` on the resolved URL tolerates a trailing query/hash. Chrome being
 * unavailable (unit tests without a stub) degrades to the internal-scheme check
 * only.
 */
export function isNewTabUrl(url: string | undefined): boolean {
  if (!url) return false;
  if (/^(chrome|edge|brave):\/\/newtab\/?(?:[?#].*)?$/.test(url)) return true;
  try {
    const resolved = chrome?.runtime?.getURL?.(NEWTAB_PAGE_PATH);
    if (resolved && (url === resolved || url.startsWith(resolved))) return true;
  } catch {
    // chrome.runtime unavailable — fall through to the negative result.
  }
  return false;
}

/** The lens full-page view (lens-page). */
export const LENSPAGE_PATH = 'src/launcher/lenspage/index.html';

/**
 * Is `url` a lens page? Like a home tab, a lens-page tab is a
 * Lunma-managed extension page — grouped with its Space but **never listed as a
 * temporary tab** (the user summons it from the lens; it is not a
 * browsing tab to accumulate). Matches the resolved extension URL plus its
 * `?folderId=…` query (`startsWith` tolerates the query/hash); chrome.runtime
 * unavailable (unit tests without a stub) degrades to a path-suffix check.
 */
export function isLensPageUrl(url: string | undefined): boolean {
  if (!url) return false;
  try {
    const resolved = chrome?.runtime?.getURL?.(LENSPAGE_PATH);
    if (resolved && url.startsWith(resolved)) return true;
  } catch {
    // chrome.runtime unavailable — fall through to the path check.
  }
  return url.split('?')[0]?.endsWith(LENSPAGE_PATH) ?? false;
}
