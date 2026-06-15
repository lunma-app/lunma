// Pinned-tab domain-boundary handler (split-coordinator-handlers,
// pinned-tab-domain-boundary): set or clear a saved tab's boundary, then re-push
// config to its bound tab in every window so enforcement updates live without
// re-opening. Verbatim move of the former coordinator closure.

import type { HandlersMap } from './context';

export function boundaryHandlers(): Pick<HandlersMap, 'setTabBoundary'> {
  return {
    setTabBoundary: async (ctx, event) => {
      const { savedTabId, boundary } = event.payload;
      const saved = ctx.store.state.savedTabs[savedTabId];
      if (!saved) {
        throw new Error(`setTabBoundary: unknown savedTabId '${savedTabId}'`);
      }
      ctx.store.setTabBoundary(savedTabId, boundary);
      ctx.markDirty();
      // `saved` is the live store record, so it already reflects the new
      // boundary after the mutator ran. Push to EVERY window's bound tab
      // (per-window-tab-bindings, ADR 0003).
      const slots = ctx.store.state.tabBindings[savedTabId] ?? {};
      await Promise.all(
        Object.values(slots).map((tabId) => ctx.boundary.configureBoundary(tabId, saved)),
      );
    },
  };
}
