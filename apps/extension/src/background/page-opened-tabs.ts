import type { TabId } from '../shared/types';

/**
 * SW-session set of smart-item tabs that were opened **from the folder page**
 * (smart-folder-page), as opposed to the sidebar. Feed auto-advance (close an
 * unread item → open the next) is a sidebar reading-flow affordance; an item
 * opened from the page should return to the page on close, not chase the next
 * one. The `openSmartItem` handler records the tab here when its command carried
 * `fromPage`, and `tabs.onRemoved` consults it to decide whether to auto-advance.
 *
 * In-memory and SW-session-scoped (NOT persisted): an item opened from the page
 * before an SW restart loses its mark, so its close would auto-advance — a rare,
 * benign edge. Cleared per tab on close.
 */
const pageOpenedTabs = new Set<TabId>();

/** Record that `tabId` was opened from the folder page. */
export function markPageOpenedTab(tabId: TabId): void {
  pageOpenedTabs.add(tabId);
}

/** Was `tabId` opened from the folder page (so its close should not auto-advance)? */
export function isPageOpenedTab(tabId: TabId): boolean {
  return pageOpenedTabs.has(tabId);
}

/** Forget `tabId` (on close) — keeps the set bounded to live page-opened tabs. */
export function forgetPageOpenedTab(tabId: TabId): void {
  pageOpenedTabs.delete(tabId);
}

/** Test-only: clear the set between cases. */
export function resetPageOpenedTabs(): void {
  pageOpenedTabs.clear();
}
