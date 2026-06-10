// Favicon-row / global-favorite handlers (split-coordinator-handlers, ADR 0010):
// mint / decouple / couple / reorder global favorites. The store performs the
// chrome-free record move; the coordinator owns the group/ungroup I/O for every
// bound window (D5). Verbatim moves of the former coordinator closures.

import { log } from '../../shared/logger';
import type { HandlersMap } from './context';
import { spaceExists } from './queries';

export function favoriteHandlers(): Pick<
  HandlersMap,
  'favoriteTab' | 'favoriteSavedTab' | 'pinSavedTab' | 'reorderFavorites'
> {
  return {
    // Mint a global favorite from a live tab — non-destructive, the tab stays
    // open (D5). Idempotent: a tab already bound to any saved tab is a no-op
    // (mirrors pinTab's already-bound guard).
    favoriteTab: async (ctx, event) => {
      const { tabId, windowId, targetIndex } = event.payload;
      const liveTab = ctx.store.state.liveTabsById[tabId];
      if (!liveTab) {
        // Can't favorite a tab Lunma has no live record of — log + no-op.
        log.debug('favoriteTab: no live tab record', { tabId, windowId });
        return;
      }
      for (const slots of Object.values(ctx.store.state.tabBindings)) {
        if (Object.values(slots).includes(tabId)) {
          log.debug('favoriteTab: tab already bound', { tabId });
          return;
        }
      }
      // Mint the spaceId:null record, place it in faviconRow, then bind the
      // live tab (binding removes it from this window's Temporary list).
      const id = crypto.randomUUID();
      ctx.store.registerSavedTab({
        id,
        spaceId: null,
        title: liveTab.title,
        originalURL: liveTab.url,
        currentURL: liveTab.url,
      });
      ctx.store.addFavorite(id, targetIndex ?? ctx.store.state.faviconRow.length);
      ctx.store.bindSavedTab(id, windowId, tabId, liveTab.url);
      ctx.markDirty();
      // The favorite stays OPEN but must be ungrouped (global) — D3/D5.
      await ctx.groups.ensureFavoriteUngrouped(tabId);
    },
    // Decouple a pinned tab into a favorite: store moves the record from its
    // Space's pinned tree to faviconRow; coordinator ungroups its live tab in
    // EVERY bound window (D5).
    favoriteSavedTab: async (ctx, event) => {
      const { savedTabId } = event.payload;
      const saved = ctx.store.state.savedTabs[savedTabId];
      if (!saved) {
        throw new Error(`favoriteSavedTab: unknown savedTabId '${savedTabId}'`);
      }
      // Capture bound tabs BEFORE the move (the move leaves bindings intact).
      const boundTabIds = Object.values(ctx.store.state.tabBindings[savedTabId] ?? {});
      ctx.store.moveSavedTabToFavorites(savedTabId);
      ctx.markDirty();
      for (const tabId of boundTabIds) {
        await ctx.groups.ensureFavoriteUngrouped(tabId);
      }
    },
    // Couple a favorite to a Space (the active Space, supplied by the sidebar):
    // store moves the record from faviconRow into pinnedBySpace[spaceId];
    // coordinator groups its live tab into that Space in EVERY bound window (D5).
    pinSavedTab: async (ctx, event) => {
      const { savedTabId, spaceId, index } = event.payload;
      const saved = ctx.store.state.savedTabs[savedTabId];
      if (!saved) {
        throw new Error(`pinSavedTab: unknown savedTabId '${savedTabId}'`);
      }
      if (!spaceExists(ctx.store.state, spaceId)) {
        throw new Error(`pinSavedTab: unknown spaceId '${spaceId}'`);
      }
      // Capture bound (window, tab) pairs BEFORE the move.
      const boundByWindow = Object.entries(ctx.store.state.tabBindings[savedTabId] ?? {});
      // Default to appending at the end of the Space's pinned list when no
      // explicit drop index is supplied.
      const target = index ?? ctx.store.state.pinnedBySpace[spaceId]?.length ?? 0;
      ctx.store.moveSavedTabToSpace(savedTabId, spaceId, target);
      ctx.markDirty();
      for (const [windowIdStr, tabId] of boundByWindow) {
        await ctx.groups.addTabToSpaceGroup(Number(windowIdStr), spaceId, tabId);
      }
    },
    // Reorder the favicon row to the post-drop order; one persist + broadcast.
    reorderFavorites: (ctx, event) => {
      ctx.store.reorderFavorites(event.payload.ids);
      ctx.markDirty();
    },
  };
}
