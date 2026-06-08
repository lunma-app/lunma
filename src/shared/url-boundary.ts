import type { TabBoundary } from './types';

/**
 * Pure domain-boundary matching helpers for pinned-tab boundaries
 * (pinned-tab-domain-boundary). No Chrome APIs, no heavy imports beyond the
 * global `URL` — so this module is safe to bundle into the boundary content
 * script as well as the service worker.
 *
 * The allow-set entries are **host globs**: an exact host
 * (`accounts.google.com`) or a leading-wildcard host (`*.google.com`, which
 * matches the apex `google.com` and any subdomain). The inherit-domain default
 * derives `[registrableDomain(originalURL)]`, computed by a HEURISTIC (last two
 * labels + a small built-in set of two-part public suffixes) — deliberately
 * NOT a bundled Public Suffix List (too heavy for the pinned stack). When the
 * heuristic is wrong for an app, the glob list is the user's escape hatch.
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
 * Whether navigating to `targetURL` is permitted by the `allow` set. A
 * non-`http(s)` scheme or an unparseable URL is treated as NOT allowed (the
 * content script separately leaves non-`http(s)` anchors to Chrome, so this
 * only fires for real navigations).
 */
export function isNavigationAllowed(targetURL: string, allow: readonly string[]): boolean {
  let host: string;
  try {
    const parsed = new URL(targetURL);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;
    host = parsed.hostname.toLowerCase();
  } catch {
    return false;
  }
  if (host === '') return false;
  return allow.some((pattern) => hostGlobMatches(host, pattern));
}

/**
 * Resolve a saved tab's effective allow-set, or `null` for "no enforcement":
 *
 * - `{ mode: 'locked', allow }` → the explicit `allow` list.
 * - `{ mode: 'off' }`           → `null` (explicitly free, overrides a global default).
 * - absent (`undefined`)        → inherit the global default:
 *     - `'domain'` → `[registrableDomain(originalURL)]` (or `null` if the
 *        heuristic cannot derive a domain).
 *     - `'off'`    → `null`.
 */
export function resolveBoundaryAllow(
  boundary: TabBoundary | undefined,
  originalURL: string,
  globalDefault: 'off' | 'domain',
): string[] | null {
  if (boundary?.mode === 'locked') return boundary.allow;
  if (boundary?.mode === 'off') return null;
  // Absent boundary → inherit the global default.
  if (globalDefault === 'domain') {
    const domain = registrableDomain(originalURL);
    return domain === null ? null : [domain];
  }
  return null;
}
