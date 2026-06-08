import type { LunmaStore } from '../shared/store.svelte';
import type { SavedTabId, SpaceId, TabId, WindowId } from '../shared/types';

/** The payload of a `pinTab` event the command source enqueues. */
export interface PinTabPayload {
  tabId: TabId;
  windowId: WindowId;
  spaceId: SpaceId;
  targetIndex: number;
}

/**
 * What `Alt+D` resolves to — it is a TOGGLE (user request): pin the active temp tab,
 * or unpin it if it is already pinned (back to Temporary).
 */
export type PinActiveTabAction =
  | { action: 'pin'; payload: PinTabPayload }
  | { action: 'unpin'; payload: { savedTabId: SavedTabId; windowId: WindowId } };

/**
 * Pure resolver for the `pin-active-tab` command (design D1/D8) — a TOGGLE. Given the
 * focused window's active tab and the store, return:
 *   - `{ action: 'unpin' }` when the active tab is already PINNED in this window (bound
 *     to a saved tab whose `spaceId !== null`) → `Alt+D` sends it back to Temporary;
 *   - `{ action: 'pin' }` when it is an unbound temp tab in a window with an active
 *     Space → `Alt+D` pins it at the end of that Space's pinned list;
 *   - `null` otherwise: no active tab, no active Space (for the pin case), or the tab is
 *     bound to a global FAVORITE (`spaceId === null`) — favorites are managed separately,
 *     so `Alt+D` leaves them.
 */
export function resolvePinActiveTab(
  store: LunmaStore,
  tab: { id?: number | undefined; windowId?: number | undefined } | undefined,
): PinActiveTabAction | null {
  if (!tab || tab.id === undefined || tab.windowId === undefined) return null;
  const tabId = tab.id;
  const windowId = tab.windowId;

  // Already bound in THIS window? Toggle OFF — but only a PINNED saved tab
  // (`spaceId !== null`). A favorite (`spaceId === null`) is left to its own controls.
  for (const [savedTabId, slots] of Object.entries(store.state.tabBindings)) {
    if (slots[windowId] === tabId) {
      const saved = store.state.savedTabs[savedTabId];
      if (saved && saved.spaceId !== null) {
        return { action: 'unpin', payload: { savedTabId, windowId } };
      }
      return null; // bound to a favorite (or an orphan binding) — no pin toggle
    }
  }

  // Unbound temp tab → pin it (temp → pinned), at the end of the active Space's list.
  const spaceId = store.state.activeSpaceByWindow[windowId];
  if (spaceId === null || spaceId === undefined) return null;
  const targetIndex = store.state.pinnedBySpace[spaceId]?.length ?? 0;
  return { action: 'pin', payload: { tabId, windowId, spaceId, targetIndex } };
}
