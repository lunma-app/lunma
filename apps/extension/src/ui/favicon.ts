/**
 * Build a URL for Chrome's extension `_favicon` endpoint, which serves the
 * cached favicon for a given page URL. Requires the `favicon` permission in
 * the manifest. Used by `TabRow` to render a tab's icon without fetching the
 * page directly.
 *
 * @param pageUrl   the page whose favicon is wanted
 * @param size      requested square size in px (Chrome serves the nearest cached)
 * @param cacheBust optional token that changes the endpoint URL when the live
 *   favicon identity changes (e.g. a hash of `favIconUrl`). The endpoint URL is
 *   otherwise CONSTANT for a page, so the browser serves it from its (long-lived)
 *   image cache and never refetches — freezing a page whose favicon updates at
 *   runtime (e.g. an unread-count badge). Chrome's own favicon DB for the page IS
 *   live (it fetches the page's favicon same-origin, which an extension page
 *   cannot when CORP-blocked), so changing the URL on each badge forces a refetch
 *   that picks up Chrome's current icon. Emitted as a `v` query param Chrome
 *   ignores when resolving the favicon.
 */
export function faviconUrl(pageUrl: string, size = 16, cacheBust?: string): string {
  const url = new URL(chrome.runtime.getURL('/_favicon/'));
  url.searchParams.set('pageUrl', pageUrl);
  url.searchParams.set('size', String(size));
  if (cacheBust !== undefined && cacheBust !== '') url.searchParams.set('v', cacheBust);
  return url.toString();
}

/**
 * A short, stable cache-bust token for a favicon identity (the live `favIconUrl`),
 * for {@link faviconUrl}'s `cacheBust`. FNV-1a → base36, so the token is compact
 * regardless of whether `favIconUrl` is a short URL or a multi-KB `data:` URI.
 * Returns `undefined` for an absent favicon (no bust → the plain endpoint). A
 * hash COLLISION only costs a missed refresh (the prior icon lingers until the
 * next change), never a wrong icon, so a 32-bit hash is ample.
 */
export function faviconCacheKey(favIconUrl?: string): string | undefined {
  if (favIconUrl === undefined || favIconUrl === '') return undefined;
  let h = 0x811c9dc5;
  for (let i = 0; i < favIconUrl.length; i++) {
    h ^= favIconUrl.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}

/**
 * Resolve the best favicon src for a tab: prefer Chrome's resolved
 * `favIconUrl` (set once the page declares its icon — this is what makes the
 * real favicon appear and refresh), falling back to the `_favicon` page-URL
 * endpoint when it's absent or not loadable from an extension page (e.g. a
 * `chrome://` icon, or a `blob:` object URL). `TabRow` still falls back to a
 * globe on load error.
 *
 * When the primary is absent/unloadable and we drop to the endpoint, it is
 * cache-busted on the live `favIconUrl` ({@link faviconCacheKey}) so a page that
 * re-badges its favicon still refreshes through the endpoint (see {@link faviconUrl}).
 * A loadable primary (`http`/`https`/`data:`) is returned verbatim; if it then
 * fails to load (e.g. a Cross-Origin-Resource-Policy block, as WhatsApp's
 * per-count favicon serves), the COMPOSER passes a separately-built, cache-busted
 * endpoint as `fallbackSrc` — that is where the live refresh lands.
 */
export function faviconFor(pageUrl: string, favIconUrl?: string, size = 16): string {
  if (favIconUrl && (favIconUrl.startsWith('http') || favIconUrl.startsWith('data:'))) {
    return favIconUrl;
  }
  return faviconUrl(pageUrl, size, faviconCacheKey(favIconUrl));
}
