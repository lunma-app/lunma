import { hostOf } from './label-for';
import type { TabId } from './types';

/** Sentinel cluster key for anything that is not an http(s) page. A NUL prefix
 * cannot collide with a real hostname. */
const BROWSER_PAGES = '\u0000browser-pages';

/** Cluster key for a tab: its hostname for an http(s) page, otherwise the shared
 * browser-pages key. `chrome://`, `chrome-extension://`, `about:` and the new-tab
 * page are not sites — keying them by hostname would scatter one-tab clusters
 * (`whats-new`, `extensions`, an extension id) between the real ones. */
function clusterKey(url: string | undefined): string {
  if (!url) return BROWSER_PAGES;
  let protocol: string;
  try {
    protocol = new URL(url).protocol;
  } catch {
    return BROWSER_PAGES;
  }
  if (protocol !== 'http:' && protocol !== 'https:') return BROWSER_PAGES;
  return hostOf(url) || BROWSER_PAGES;
}

/**
 * Reorder `orderedIds` so ids sharing a URL hostname are contiguous.
 *
 * Stable in both axes — site clusters follow the order their host is first seen,
 * and each cluster keeps its members' relative order — which is what makes the
 * operation idempotent, and lets a caller detect a no-op by comparing the result
 * against the input.
 *
 * Browser-internal pages (anything not http(s), including a missing or
 * unparseable URL) form ONE cluster pinned LAST, rather than one singleton
 * cluster each parked mid-list.
 */
export function clusterIdsByHost(
  orderedIds: readonly TabId[],
  urlOf: (id: TabId) => string | undefined,
): TabId[] {
  const clusters = new Map<string, TabId[]>();
  for (const id of orderedIds) {
    const key = clusterKey(urlOf(id));
    const cluster = clusters.get(key);
    if (cluster) cluster.push(id);
    else clusters.set(key, [id]);
  }
  const browserPages = clusters.get(BROWSER_PAGES) ?? [];
  clusters.delete(BROWSER_PAGES);
  // Map preserves insertion order, so iterating it yields first-appearance order.
  return [...[...clusters.values()].flat(), ...browserPages];
}
