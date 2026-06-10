// Auto-archive handlers (split-coordinator-handlers, auto-archive): the alarm
// sweep plus the sidebar restore / per-space override / delete / clear-all
// commands. Verbatim moves of the former coordinator closures.

import { handleAutoArchiveSweep, handleRestoreArchivedTab } from '../auto-archive';
import type { HandlersMap } from './context';
import { spaceExists } from './queries';

export function autoArchiveHandlers(): Pick<
  HandlersMap,
  | 'autoArchiveSweep'
  | 'restoreArchivedTab'
  | 'setSpaceAutoArchive'
  | 'deleteArchivedTab'
  | 'clearArchivedTabs'
> {
  return {
    // The whole sweep runs inside this one tick: the background handler reads
    // settings, snapshots the store, queries Chrome for active/pinned, removes +
    // records each candidate, and prunes. The resulting `tabs.onRemoved` events
    // drain as separate commands that never write `archivedTabs`. Only persist/
    // broadcast when something actually changed, so an empty sweep every minute
    // does not churn.
    autoArchiveSweep: async (ctx) => {
      if (await handleAutoArchiveSweep(ctx.store)) {
        ctx.markDirty();
      }
    },
    // Re-open an archived tab in the requesting window and drop its record. The
    // background handler throws when no entry matches `archivedAt` (the drain
    // tail acks the error); the created tab is adopted via the existing
    // `tabs.onCreated` path, so no direct temp/live mutation here.
    restoreArchivedTab: async (ctx, event) => {
      await handleRestoreArchivedTab(ctx.store, event.payload);
      ctx.markDirty();
    },
    // Set or clear a Space's auto-archive override. Throws on an unknown id (the
    // ack carries the error); the next sweep reads the updated override (no live
    // re-resolution push needed, unlike a boundary).
    setSpaceAutoArchive: (ctx, event) => {
      const { spaceId, autoArchive } = event.payload;
      if (!spaceExists(ctx.store.state, spaceId)) {
        throw new Error(`setSpaceAutoArchive: unknown spaceId '${spaceId}'`);
      }
      ctx.store.setSpaceAutoArchive(spaceId, autoArchive);
      ctx.markDirty();
    },
    // Discard ONE archived-tab record without restoring it (per-row delete).
    // Idempotent — a no-op (still acks ok) if the entry is already gone; only
    // persists/broadcasts when it actually removed something.
    deleteArchivedTab: (ctx, event) => {
      const { archivedAt, tabId } = event.payload;
      const before = ctx.store.state.archivedTabs.length;
      ctx.store.removeArchivedTab(archivedAt, tabId);
      if (ctx.store.state.archivedTabs.length !== before) ctx.markDirty();
    },
    // Discard every archived-tab record ("Clear all"). Only persists/broadcasts
    // when something was actually cleared.
    clearArchivedTabs: (ctx) => {
      if (ctx.store.state.archivedTabs.length === 0) return;
      ctx.store.clearArchivedTabs();
      ctx.markDirty();
    },
  };
}
