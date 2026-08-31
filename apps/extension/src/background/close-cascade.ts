import type { TabId } from '../shared/types';

/**
 * SW-session set (NOT persisted) of tabs a close cascade is already removing
 * (tab-close-cascade).
 *
 * `chrome.tabs.remove` on a cascade's batch makes Chrome report `tabs.onRemoved`
 * for every tab in it. Without this set each of those reports would start its own
 * cascade, with its own archive batch stamp — so one close would produce a chain
 * of batches and undo would restore only the last level. Membership means "this
 * removal is the cascade's own work, not a user close".
 *
 * Marks are cleared as each removal arrives, and the whole batch is cleared when
 * the remove call settles, so a tab whose removal never reports (already gone,
 * the call rejected) cannot leak a mark that would suppress a real later cascade
 * for a recycled tab id.
 */
const cascading = new Set<TabId>();

/** Record that `tabIds` are being removed by a cascade, not by the user. */
export function markCascading(tabIds: readonly TabId[]): void {
  for (const id of tabIds) cascading.add(id);
}

/** Is `tabId`'s removal the work of a cascade already in flight? */
export function isCascading(tabId: TabId): boolean {
  return cascading.has(tabId);
}

/** Forget `tabId` — its removal arrived, or its batch settled. */
export function clearCascading(tabIds: TabId | readonly TabId[]): void {
  if (typeof tabIds === 'number') {
    cascading.delete(tabIds);
    return;
  }
  for (const id of tabIds) cascading.delete(id);
}

/** Test-only: clear the set between cases. */
export function resetCloseCascade(): void {
  cascading.clear();
}
