// Temp-tab + generic tab-action handlers (split-coordinator-handlers): rename
// tab/temp, reorder temp, focus/close, New Tab, Clear + Undo, and launcher
// open-url. Several have NO direct state mutation — the resulting tab events
// drive the store, so a single source maintains liveTabsById. Verbatim moves of
// the former coordinator closures.

import { log } from '../../shared/logger';
import type { ArchivedTab } from '../../shared/types';
import { handleRestoreArchivedTab } from '../auto-archive';
import { activateTab } from '../tab-groups';
import type { HandlersMap } from './context';
import { spaceExists } from './queries';

export function tempTabHandlers(): Pick<
  HandlersMap,
  | 'renameTab'
  | 'renameTempTab'
  | 'reorderTemp'
  | 'focusTab'
  | 'closeTab'
  | 'newTab'
  | 'clearTempTabs'
  | 'undoClearTempTabs'
  | 'openUrl'
> {
  return {
    renameTab: (ctx, event) => {
      const { savedTabId, newName } = event.payload;
      ctx.store.renameTab(savedTabId, newName);
      ctx.markDirty();
    },
    renameTempTab: (ctx, event) => {
      const { tabId, spaceId, windowId, newName } = event.payload;
      ctx.store.renameTempTab(windowId, spaceId, tabId, newName);
      ctx.markDirty();
    },
    reorderTemp: (ctx, event) => {
      const { windowId, tabIds } = event.payload;
      ctx.store.reorderTemp(windowId, tabIds);
      ctx.markDirty();
    },
    // Temp-tab interactions (sidebar-temp-tabs). No direct state mutation —
    // the resulting tab events (onActivated / onRemoved) drive the store, so
    // a single source maintains liveTabsById.
    focusTab: async (_ctx, event) => {
      const { tabId } = event.payload;
      const tab = await chrome.tabs.update(tabId, { active: true });
      if (tab?.windowId !== undefined) {
        await chrome.windows.update(tab.windowId, { focused: true });
      }
    },
    closeTab: async (_ctx, event) => {
      const { tabId } = event.payload;
      await chrome.tabs.remove(tabId);
    },
    // New Tab affordance: when the window already has an unused home tab (the
    // Lunma new-tab page), FOCUS it rather than spawning a second blank tab —
    // so repeated New Tab clicks never pile up home tabs (at most one per
    // window). Otherwise open one; the resulting tabs.onCreated groups it into
    // the active Space (no direct state mutation here, like focusTab/closeTab).
    newTab: async (ctx, event) => {
      const { windowId, spaceId } = event.payload;
      // A New Tab row now lives on EVERY carousel panel (each pre-rendered for its
      // own Space), so it carries that panel's `spaceId`. A new tab is focused by
      // definition, so targeting a Space that is NOT the active one means activating
      // it first — the tab then lands in it and is visible. In the common case (the
      // centred panel) `spaceId` already IS the active Space, so this is skipped and
      // the behaviour is byte-for-byte unchanged; tabs.onCreated groups the tab in.
      if (
        spaceId !== undefined &&
        spaceId !== (ctx.store.state.activeSpaceByWindow[windowId] ?? undefined)
      ) {
        if (!spaceExists(ctx.store.state, spaceId)) {
          throw new Error(`newTab: unknown spaceId '${spaceId}'`);
        }
        const outgoing = ctx.store.state.activeSpaceByWindow[windowId] ?? undefined;
        ctx.store.activateSpace(windowId, spaceId);
        await ctx.groups.orchestrateActivation(windowId, spaceId, outgoing ?? undefined);
      }
      const existingHome = ctx.groups.homeTabIdInWindow(windowId);
      if (existingHome !== undefined) {
        await activateTab(existingHome);
        try {
          await chrome.windows.update(windowId, { focused: true });
        } catch (err) {
          log.debug('newTab: window focus failed', { windowId, err });
        }
        return;
      }
      await chrome.tabs.create({ windowId, active: true });
    },
    // Clear affordance: close the active Space's TEMPORARY tabs in the window.
    // tempTabIds are unbound by definition, so pinned/saved tabs are never
    // touched; tabs.onRemoved reconciles state. Before closing, each tab is
    // ARCHIVED into `archivedTabs` (same record shape as an auto-archive sweep,
    // one shared `archivedAt` for the batch) so the sidebar's transient
    // "Cleared N — Undo" + the options Recently-archived view can recover them —
    // Clear is no longer an unrecoverable one-click delete (safety-destructive-
    // actions). When the temp tabs are the window's ONLY tabs, removing them all
    // would close the window (and quit the browser if it is the last) — so first
    // open the Space home, keeping the window alive on its home (Clear empties
    // the list, it does NOT close the window). The new home tab is grouped +
    // unlisted via tabs.onCreated.
    clearTempTabs: async (ctx, event) => {
      const { windowId, spaceId: target } = event.payload;
      const s = ctx.store.state;
      // Clear THIS panel's Space (every carousel panel renders its own Clear now);
      // falls back to the window's active Space when no spaceId is carried. Clearing
      // a background Space's temps in place is safe — its tabs live in a collapsed
      // group, and the survivor check below still spans the whole window.
      const spaceId = target ?? s.activeSpaceByWindow[windowId];
      if (spaceId === null || spaceId === undefined) return;
      const tempTabIds = s.spaceInstancesByWindow[windowId]?.[spaceId]?.tempTabIds ?? [];
      const ids = tempTabIds.filter((id) => s.liveTabsById[id]?.windowId === windowId);
      if (ids.length === 0) return;
      // Archive each cleared tab BEFORE removing it, so a record exists even if a
      // later step fails. One shared `archivedAt` stamps the whole batch (the undo
      // path resolves a tabId to its most-recent entry within that batch). The
      // fixed 100-entry cap is enforced here via pruneArchivedTabs; the exact
      // user TTL is re-applied by the next sweep (the coordinator stays decoupled
      // from settings reads).
      const now = Date.now();
      for (const id of ids) {
        const live = s.liveTabsById[id];
        ctx.store.appendArchivedTab({
          tabId: id,
          url: live?.url ?? '',
          title: live?.title ?? '',
          spaceId,
          archivedAt: now,
        });
      }
      ctx.store.pruneArchivedTabs(now);
      ctx.markDirty();
      try {
        const all = await chrome.tabs.query({ windowId });
        const removing = new Set(ids);
        const survivors = all.filter((t) => t.id !== undefined && !removing.has(t.id));
        if (survivors.length === 0) {
          await chrome.tabs.create({ windowId, active: true });
        }
      } catch (err) {
        log.error('clearTempTabs: survivor check failed', { windowId, err });
      }
      await chrome.tabs.remove(ids);
    },
    // Undo a just-cleared batch (safety-destructive-actions): re-open the cleared
    // tabs in their originating window. The payload carries `tabId`s (the sidebar
    // knows them locally) rather than the SW-generated `archivedAt`; for each, the
    // MOST-RECENT surviving archived entry bearing that `tabId` is the batch entry
    // (the batch shares one `archivedAt`, so latest-wins targets it within the
    // 5 s undo window). A `tabId` whose entry no longer survives (evicted by the
    // 100-cap / TTL, or already restored) is skipped silently. `restoreArchivedTab`
    // re-opens the URL and drops the record; the created tab is adopted via the
    // existing tabs.onCreated path.
    undoClearTempTabs: async (ctx, event) => {
      const { windowId, tabIds } = event.payload;
      for (const tabId of tabIds) {
        // The most-recent surviving entry for this tabId is its batch entry.
        let entry: ArchivedTab | undefined;
        for (const e of ctx.store.state.archivedTabs) {
          if (e.tabId !== tabId) continue;
          if (entry === undefined || e.archivedAt > entry.archivedAt) entry = e;
        }
        if (entry === undefined) continue; // evicted / already restored → skip
        await handleRestoreArchivedTab(ctx.store, {
          archivedAt: entry.archivedAt,
          tabId,
          windowId,
        });
      }
      ctx.markDirty();
    },
    // Launcher: open a bookmark/history result's URL in the target window. No
    // direct state mutation — the resulting tabs.onCreated adopts + groups it
    // into the window's active Space (like focusTab/closeTab/newTab). A
    // create failure throws so the drain tail acks `{ error }` to the client.
    openUrl: async (_ctx, event) => {
      const { url, windowId } = event.payload;
      // Re-validate scheme here: launcher bookmark/history providers can surface
      // javascript: bookmarklets or chrome:// history entries that bypass the
      // boundary content script's sanitization. Only http(s) are safe to pass to
      // tabs.create — everything else is dropped with a warning so the user can
      // see what was blocked.
      let scheme: string;
      try {
        scheme = new URL(url).protocol;
      } catch {
        log.warn('openUrl: unparseable URL, dropping', { url });
        return;
      }
      if (scheme !== 'http:' && scheme !== 'https:') {
        log.warn('openUrl: blocked non-http(s) scheme', { url, scheme });
        return;
      }
      await chrome.tabs.create({ url, windowId });
    },
  };
}
