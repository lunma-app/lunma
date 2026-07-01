import type { WindowId } from '../../shared/types';

/**
 * SW-session-scoped correlation set (NOT persisted) that lets the unscoped
 * onCreated-time dedup check (tab-dedup) recognise — and skip — a tab that
 * `duplicateTab` is about to create via `chrome.tabs.duplicate`. Without
 * this, every "Duplicate" action would be immediately collapsed by the new
 * dedup check: a duplicated tab's URL is by definition identical to its
 * still-open source tab's URL, an exact `findTabInActiveSpace` match.
 *
 * `duplicateTab` (`temp-tabs.ts`) records the source tab's `(windowId, url)`
 * here BEFORE calling `chrome.tabs.duplicate`, synchronously — so the record
 * exists in memory before that async call is even issued, regardless of
 * whether `tabs.onCreated` ends up firing before or after the `duplicate()`
 * promise settles (their relative order is not guaranteed by Chrome).
 * `tabs.onCreated` (`chrome-tabs.ts`) then consumes (removes) the record on
 * a match, before running the dedup lookup.
 *
 * Records expire after a short TTL and are swept opportunistically, so a
 * `duplicate()` call that fails before creating a tab can't leak a stale
 * record that suppresses dedup for a later, unrelated tab at the same URL.
 */
interface PendingDuplicate {
  windowId: WindowId;
  url: string;
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

/** Record that a `duplicateTab` for `(windowId, url)` is about to be issued. */
export function markPendingDuplicateTab(windowId: WindowId, url: string): void {
  const now = Date.now();
  sweep(now);
  pending.push({ windowId, url, expiresAt: now + TTL_MS });
}

/**
 * Consume (remove) a pending duplicate record matching `(windowId, url)`, if
 * any and not expired. Returns whether one was consumed — the caller uses
 * this to skip the onCreated-time dedup check for that tab.
 */
export function consumePendingDuplicateTab(windowId: WindowId, url: string): boolean {
  const now = Date.now();
  sweep(now);
  const idx = pending.findIndex((p) => p.windowId === windowId && p.url === url);
  if (idx === -1) return false;
  pending.splice(idx, 1);
  return true;
}

/** Test-only: clear all pending records between cases. */
export function resetPendingDuplicateTabs(): void {
  pending.length = 0;
}
