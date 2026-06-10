import type { TabBoundary } from './types';

/**
 * Pure URL-boundary matching helpers for pinned-tab boundaries
 * (pinned-tab-url-boundary, supersedes the host-only matcher of
 * pinned-tab-domain-boundary). No Chrome APIs, no heavy imports beyond the
 * global `URL` — so this module is safe to bundle into the boundary content
 * script as well as the service worker.
 *
 * Allow-set entries are **URL globs**, matched against the target's full
 * `http(s)` href (scheme + host + `pathname` + `search`; fragment ignored). An
 * entry is one of:
 *
 * - a **bare host** (no path — `gitlab.com`, `*.google.com`), treated as the
 *   whole-host glob `*://<host>/*`. The host segment matches by `hostGlobMatches`
 *   (an exact host, or a leading-wildcard `*.example.com` covering the apex and
 *   any subdomain). This preserves the prior host-level behaviour for every
 *   existing entry.
 * - a **URL pattern** with a path (`https://gitlab.com/dashboard/merge_requests*`),
 *   split into an optional scheme (`*` ⇒ `http`|`https`), a host glob, and a
 *   `*`-glob path. The host glob MAY carry a `:port` (page globs derive from
 *   `origin`, which includes a non-default port like `localhost:5173`); a port is
 *   matched exactly against the target, while a port-less host stays port-agnostic.
 *   A trailing `*` makes it a path-prefix; no `*` makes it exact.
 *   `*` matches any run of characters (including `/`); there is no regex and no
 *   single-character wildcard. A malformed entry simply never matches (it never
 *   throws), so a bad pattern cannot brick a tab.
 *
 * The inherit-domain default derives `[registrableDomain(originalURL)]`,
 * computed by a HEURISTIC (last two labels + a small built-in set of two-part
 * public suffixes) — deliberately NOT a bundled Public Suffix List (too heavy
 * for the pinned stack). The inherit-page default derives `[pageGlob(originalURL)]`
 * (`origin + pathname + '*'`). When a default is wrong, the glob list is the
 * user's escape hatch.
 */

/**
 * A small, deliberately-incomplete set of two-part public suffixes. When a
 * host's last two labels are one of these, the registrable domain is the last
 * THREE labels (`bbc.co.uk`) rather than the last two (`co.uk`). This is a
 * heuristic, not the Public Suffix List; the glob allowlist backstops anything
 * it gets wrong.
 */
const TWO_PART_SUFFIXES = new Set<string>([
  'co.uk',
  'org.uk',
  'gov.uk',
  'ac.uk',
  'co.jp',
  'co.kr',
  'co.nz',
  'co.za',
  'co.in',
  'com.au',
  'com.br',
  'com.cn',
  'com.mx',
  'com.tr',
]);

const IPV4_RE = /^\d{1,3}(\.\d{1,3}){3}$/;

/**
 * The registrable domain of an `http(s)` URL, by heuristic. Returns `null` for
 * a non-`http(s)` scheme or a URL that does not parse. IP-literal and
 * single-label hosts (`localhost`) are returned as-is — they cannot be reduced.
 */
export function registrableDomain(url: string): string | null {
  let host: string;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    host = parsed.hostname.toLowerCase();
  } catch {
    return null;
  }
  if (host === '') return null;
  if (IPV4_RE.test(host)) return host;

  const labels = host.split('.');
  if (labels.length <= 2) return host;

  const lastTwo = labels.slice(-2).join('.');
  if (TWO_PART_SUFFIXES.has(lastTwo)) return labels.slice(-3).join('.');
  return lastTwo;
}

/**
 * Whether `host` matches a single allow-set `pattern`. An exact host matches
 * itself; a leading-wildcard pattern (`*.example.com`) matches both the apex
 * (`example.com`) and any subdomain (`a.b.example.com`). Comparison is
 * case-insensitive.
 */
export function hostGlobMatches(host: string, pattern: string): boolean {
  const h = host.toLowerCase();
  const p = pattern.toLowerCase();
  if (p.startsWith('*.')) {
    const suffix = p.slice(2);
    if (suffix === '') return false;
    return h === suffix || h.endsWith(`.${suffix}`);
  }
  return h === p;
}

/**
 * Match a URL-pattern host part — which MAY carry a `:port` — against the target
 * URL's host. Page globs derive from `origin`, which includes a NON-default port
 * (`http://localhost:5173`), so the pattern's host part can be `localhost:5173`
 * while `url.hostname` is just `localhost`; without honouring the port here, such
 * a glob would match nothing and a page-locked dev tab would divert its own links.
 * An explicit pattern port must equal the target's `url.port`; a port-less host
 * stays port-agnostic and still supports the `*.` wildcard via {@link hostGlobMatches}.
 */
function hostPortGlobMatches(url: URL, hostPart: string): boolean {
  const colon = hostPart.lastIndexOf(':');
  // A `:port` suffix is a trailing colon — outside any IPv6 `[...]` literal —
  // followed by digits. Internal IPv6 colons or a non-numeric tail are host-only.
  const hasPort = colon > hostPart.lastIndexOf(']') && /^\d+$/.test(hostPart.slice(colon + 1));
  if (hasPort) {
    if (hostPart.slice(colon + 1) !== url.port) return false;
    return hostGlobMatches(url.hostname, hostPart.slice(0, colon));
  }
  return hostGlobMatches(url.hostname, hostPart);
}

/**
 * The page glob of an `http(s)` URL: `origin + pathname + '*'` (e.g.
 * `https://gitlab.com/dashboard/merge_requests*`). A trailing `*` makes it a
 * path-prefix so the view's own sub-paths/filters stay in-tab. Returns `null`
 * for a non-`http(s)` scheme or an unparseable URL (collapsing to "no
 * enforcement", mirroring {@link registrableDomain}'s null-on-failure).
 */
export function pageGlob(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    return `${parsed.origin}${parsed.pathname}*`;
  } catch {
    return null;
  }
}

/**
 * Compile a `*`-glob (where `*` matches any run of characters, including `/` and
 * the empty string) to an anchored, full-match `RegExp`. Every regex
 * metacharacter is escaped first, so this never throws for any input.
 */
function globToRegExp(glob: string): RegExp {
  const escaped = glob.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\\*/g, '.*');
  return new RegExp(`^${escaped}$`);
}

/**
 * Whether the target `href` matches a single URL-glob `pattern`. A **bare host**
 * pattern (no `/`) is treated as the whole-host glob `*://<host>/*` (host matched
 * by {@link hostGlobMatches}). A **URL pattern** with a path is split into an
 * optional scheme (`*` ⇒ `http`|`https`), a host glob, and a `*`-glob path; the
 * path is matched against the target's `pathname + search` (fragment ignored).
 * A non-`http(s)`/unparseable target or a malformed pattern returns `false` and
 * never throws.
 */
export function urlGlobMatches(href: string, pattern: string): boolean {
  const pat = pattern.trim();
  if (pat === '') return false;

  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return false;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
  const host = url.hostname.toLowerCase();
  if (host === '') return false;

  // Bare host (no path) ≡ the whole-host glob `*://<host>/*`.
  if (!pat.includes('/')) return hostGlobMatches(host, pat);

  // URL pattern: peel an optional `*://`|`http(s)://` scheme, then split the
  // remainder into host (up to the first `/`) and path (the rest).
  let rest = pat;
  let scheme: string | null = null;
  const schemeMatch = rest.match(/^(\*|https?):\/\//);
  if (schemeMatch) {
    scheme = schemeMatch[1] ?? null;
    rest = rest.slice(schemeMatch[0].length);
  }
  const slash = rest.indexOf('/');
  if (slash === -1) return false; // a scheme but no path → malformed, never matches
  const hostPart = rest.slice(0, slash).toLowerCase();
  const pathPart = rest.slice(slash);
  if (hostPart === '') return false;

  // Scheme: an explicit `http`/`https` must equal the target's; `*` (or absent)
  // matches either.
  if (scheme !== null && scheme !== '*' && scheme !== url.protocol.slice(0, -1)) return false;
  if (!hostPortGlobMatches(url, hostPart)) return false;
  return globToRegExp(pathPart).test(`${url.pathname}${url.search}`);
}

/**
 * Whether navigating to `targetURL` is permitted by the `allow` set, matching
 * each entry against the target's **full `http(s)` href** via
 * {@link urlGlobMatches}. A non-`http(s)` scheme or an unparseable URL is treated
 * as NOT allowed (the content script separately leaves non-`http(s)` anchors to
 * Chrome, so this only fires for real navigations).
 */
export function isNavigationAllowed(targetURL: string, allow: readonly string[]): boolean {
  try {
    const parsed = new URL(targetURL);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;
    if (parsed.hostname === '') return false;
  } catch {
    return false;
  }
  return allow.some((pattern) => urlGlobMatches(targetURL, pattern));
}

/**
 * Resolve a saved tab's effective allow-set, or `null` for "no enforcement":
 *
 * - `{ mode: 'locked', allow }` → the explicit `allow` list.
 * - `{ mode: 'off' }`           → `null` (explicitly free, overrides a global default).
 * - absent (`undefined`)        → inherit the global default:
 *     - `'domain'` → `[registrableDomain(originalURL)]` (or `null` if the
 *        heuristic cannot derive a domain).
 *     - `'page'`   → `[pageGlob(originalURL)]` (or `null` if it cannot derive one).
 *     - `'off'`    → `null`.
 */
export function resolveBoundaryAllow(
  boundary: TabBoundary | undefined,
  originalURL: string,
  globalDefault: 'off' | 'domain' | 'page',
): string[] | null {
  if (boundary?.mode === 'locked') return boundary.allow;
  if (boundary?.mode === 'off') return null;
  // Absent boundary → inherit the global default.
  if (globalDefault === 'domain') {
    const domain = registrableDomain(originalURL);
    return domain === null ? null : [domain];
  }
  if (globalDefault === 'page') {
    const glob = pageGlob(originalURL);
    return glob === null ? null : [glob];
  }
  return null;
}
