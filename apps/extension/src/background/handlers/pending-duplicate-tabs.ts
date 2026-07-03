import type { TabId, WindowId } from '../../shared/types';

/**
 * SW-session-scoped correlation set (NOT persisted) that lets the unscoped
 * onCreated-time dedup check (tab-dedup) recognise — and skip — a tab that
 * `duplicateTab` is about to create via `chrome.tabs.duplicate`. Without
 * this, every "Duplicate" action would be immediately collapsed by the new
 * dedup check: a duplicated tab's URL is by definition identical to its
 * still-open source tab's URL, an exact `findTabInActiveSpace` match.
 *
 * Also carries the source tab's id (duplicate-tab-adjacent-placement) so
 * `tabs.onCreated` can insert the clone immediately after its source in
 * `tempTabIds`, instead of the ordinary newest-first `unshift` every other
 * new tab gets — "duplicate" reads as "a copy of this tab, right here," not
 * "a new tab that happens to share this one's URL."
 *
 * `duplicateTab` (`temp-tabs.ts`) records the source tab's `(windowId, url,
 * tabId)` here BEFORE calling `chrome.tabs.duplicate`, synchronously — so the
 * record exists in memory before that async call is even issued, regardless
 * of whether `tabs.onCreated` ends up firing before or after the
 * `duplicate()` promise settles (their relative order is not guaranteed by
 * Chrome). `tabs.onCreated` (`chrome-tabs.ts`) then consumes (removes) the
 * record on a match, before running the dedup lookup.
 *
 * Records expire after a short TTL and are swept opportunistically, so a
 * `duplicate()` call that fails before creating a tab can't leak a stale
 * record that suppresses dedup for a later, unrelated tab at the same URL.
 */
interface PendingDuplicate {
  windowId: WindowId;
  url: string;
  sourceTabId: TabId;
  expiresAt: number;
}

const TTL_MS = 5000;
const pending: PendingDuplicate[] = [];

function sweep(now: number): void {
  for (let i = pending.length - 1; i >= 0; i--) {
    const entry = pending[i];
    if (entry !== undefined && entry.expiresAt <= now) pending.splice(i, 1);
  }
}

/** Record that a `duplicateTab` of `sourceTabId` at `(windowId, url)` is about to be issued. */
export function markPendingDuplicateTab(windowId: WindowId, url: string, sourceTabId: TabId): void {
  const now = Date.now();
  sweep(now);
  pending.push({ windowId, url, sourceTabId, expiresAt: now + TTL_MS });
}

/**
 * Consume (remove) a pending duplicate record matching `(windowId, url)`, if
 * any and not expired. Returns the source tab's id if one was consumed, else
 * `null` — the caller uses a non-null return both to skip the onCreated-time
 * dedup check for that tab AND to know which tab to insert the clone after.
 */
export function consumePendingDuplicateTab(windowId: WindowId, url: string): TabId | null {
  const now = Date.now();
  sweep(now);
  const idx = pending.findIndex((p) => p.windowId === windowId && p.url === url);
  if (idx === -1) return null;
  const [entry] = pending.splice(idx, 1);
  return entry?.sourceTabId ?? null;
}

/** Test-only: clear all pending records between cases. */
export function resetPendingDuplicateTabs(): void {
  pending.length = 0;
}
