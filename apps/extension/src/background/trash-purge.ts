import type { LunmaStore } from '../shared/store.svelte';

const PURGE_AGE_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Auto-purge soft-deleted Spaces older than 30 days (spaces-and-tabs:
 * "Soft-delete via __trash__ folder with auto-purge"). Operates purely on
 * `state.trash` records (ADR 0001 — no Chrome bookmark folder to walk):
 * removes each expired trash entry along with the saved-tab records that
 * belonged to it. `nowMs` is injectable for testing.
 */
export function purgeExpiredTrash(store: LunmaStore, nowMs: number = Date.now()): void {
  for (const [spaceId, trashed] of Object.entries(store.state.trash)) {
    const deletedAtMs = Date.parse(trashed.deletedAt);
    if (Number.isNaN(deletedAtMs)) continue;
    if (nowMs - deletedAtMs < PURGE_AGE_MS) continue;
    for (const tab of Object.values(store.state.savedTabs)) {
      if (tab.spaceId === spaceId) store.removeSavedTab(tab.id);
    }
    delete store.state.pinnedBySpace[spaceId];
    store.removeTrashedSpace(spaceId);
  }
}
