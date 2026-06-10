import { getContext, setContext } from 'svelte';
import { LunmaStore } from '../shared/store.svelte';
import type { AppState, SidebarLocalState } from '../shared/types';

const STORE_CONTEXT_KEY = Symbol('lunma.store');

/**
 * Sidebar projection state: the broadcast `AppState` plus the sidebar-local,
 * per-window UI fields the store augments onto `state`. The augmented shape is
 * owned by `SidebarLocalState` in `shared/types.ts` — the single source the
 * store's sidebar-only mutators and the `PinnedTabs` readers also reference, so
 * the shape can never drift across the cast sites.
 */
export type SidebarState = AppState & SidebarLocalState;

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
