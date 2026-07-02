import type { TabId } from '../shared/types';

/**
 * SW-session set (NOT persisted) of tabs that have not yet reached
 * `status: 'complete'` even once since they were created (redirect-chain
 * tab dedup). A tab born with — or navigating through — an intermediate
 * URL (a corporate mail/security link-rewriter, an SSO/consent hop, any
 * redirector) is tracked into `tempTabIds` immediately at creation, which
 * makes the ordinary "untracked tab's first navigation" dedup gate
 * (`tabs.onUpdated` in `handlers/chrome-tabs.ts`) blind to its LATER
 * navigation to the real destination — that gate only re-checks a tab that
 * is still untracked, and this one already isn't. Membership here widens
 * that gate: a navigation is still dedup-eligible while its tab is in this
 * set, i.e. anywhere within its initial load chain, not just before first
 * adoption.
 *
 * Cleared on the tab's first `status: 'complete'` (so an ordinary later
 * re-navigation of a settled tab is never caught — only hops within the
 * SAME initial load are eligible) and on tab removal (bounded cleanup for
 * a tab that closes — via dedup or otherwise — before ever completing).
 */
const midInitialLoad = new Set<TabId>();

/** Record that `tabId` has not yet completed its first load. */
export function markInitialLoad(tabId: TabId): void {
  midInitialLoad.add(tabId);
}

/** Is `tabId` still within its initial load chain (never yet `complete`)? */
export function isInitialLoad(tabId: TabId): boolean {
  return midInitialLoad.has(tabId);
}

/** Forget `tabId` — its first load completed, or the tab closed. */
export function clearInitialLoad(tabId: TabId): void {
  midInitialLoad.delete(tabId);
}

/** Test-only: clear the set between cases. */
export function resetInitialLoadTabs(): void {
  midInitialLoad.clear();
}
