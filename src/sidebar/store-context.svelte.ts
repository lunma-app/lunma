import { getContext, setContext } from 'svelte';
import { LunmaStore } from '../shared/store.svelte';
import type { AppState, WindowId } from '../shared/types';

const STORE_CONTEXT_KEY = Symbol('lunma.store');

/**
 * Sidebar projection state. Currently identical to AppState — no sidebar-only
 * fields land in this slice. Downstream slices (e.g. sidebar-pinned-tabs) may
 * augment the type with surface-local UI state.
 */
export type SidebarState = AppState & {
  pinnedExpandedByWindow?: { [windowId: WindowId]: boolean };
  /**
   * Per-window folder expand/collapse state (pinned-tab-folders, design D2).
   * Ephemeral and sidebar-local — written by `LunmaStore.setFolderExpanded`,
   * never persisted to `AppState`, so the same Space's folder can be open in
   * one window and collapsed in another.
   */
  expandedFoldersByWindow?: {
    [windowId: WindowId]: { [folderId: string]: boolean };
  };
  /**
   * Per-window one-shot "open inline rename on the next new folder" flag
   * (pin-temp-tab-into-folder). Written by `LunmaStore.setAutoRenameNextFolder`
   * when two tabs fold into a new folder (a temp tab dropped onto a pinned tab,
   * armed from `TempTabs`); consumed by the active `PinnedTabs`. Sidebar-local
   * and ephemeral — never part of `AppState`, never persisted or broadcast.
   */
  autoRenameNextFolderByWindow?: { [windowId: WindowId]: boolean };
};

/**
 * Construct a sidebar-side LunmaStore seeded with the SW's snapshot. The
 * sidebar never mutates the store directly — mutations go through the bus.
 */
export function createSidebarStore(initial: AppState): LunmaStore {
  const store = new LunmaStore();
  Object.assign(store.state, initial);
  return store;
}

/**
 * Set the store on context. Accepts a getter (`() => store`) rather than the
 * store itself so the reactive link from parent props is preserved — see
 * Svelte's `state_referenced_locally` warning.
 */
export function setStore(getStore: () => LunmaStore): void {
  setContext(STORE_CONTEXT_KEY, getStore);
}

export function useStore(): LunmaStore {
  const getStore = getContext<(() => LunmaStore) | undefined>(STORE_CONTEXT_KEY);
  if (!getStore) {
    throw new Error(
      'useStore(): no store on context — wrap your component tree with setStore(...) first.',
    );
  }
  return getStore();
}
