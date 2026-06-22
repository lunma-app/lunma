import { log } from '../shared/logger';
import type { LunmaStore } from '../shared/store.svelte';
import { MANAGED_WINDOW_TYPES } from './window-types';

/**
 * Seed `activeSpaceByWindow` for every NORMAL Chrome window that was already
 * open when the service worker booted (non-normal windows — popups, app,
 * devtools — can't host tab groups, so Lunma never manages Spaces there; the
 * query filters them out at the source via `MANAGED_WINDOW_TYPES`).
 * `chrome.windows.onCreated` only fires for
 * NEW windows, so without this pass the first sidebar opened in a
 * pre-existing window would render with no active Space — including the
 * `ActiveSpaceHeader`, which renders nothing when its entry is missing.
 *
 * Idempotent: entries that already exist (including explicit `null`) are
 * left untouched. Only `undefined` entries are seeded with
 * `lastActivatedSpaceId` via the existing `onWindowOpened` mutator.
 */
export async function seedExistingWindows(store: LunmaStore): Promise<void> {
  try {
    // Spread the `readonly` tuple into a fresh array — `getAll`'s `windowTypes`
    // option is a mutable array, so the `as const` constant can't be passed by
    // reference. `MANAGED_WINDOW_TYPES` stays the single source of truth.
    const windows = await chrome.windows.getAll({ windowTypes: [...MANAGED_WINDOW_TYPES] });
    for (const w of windows) {
      if (w.id === undefined) continue;
      if (store.state.activeSpaceByWindow[w.id] !== undefined) continue;
      store.onWindowOpened(w.id);
    }
  } catch (err) {
    log.error('seedExistingWindows failed', { err });
  }
}
