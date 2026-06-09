import { log } from '../shared/logger';
import type { LunmaStore } from '../shared/store.svelte';

/**
 * Seed `activeSpaceByWindow` for every Chrome window that was already open
 * when the service worker booted. `chrome.windows.onCreated` only fires for
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
    const windows = await chrome.windows.getAll();
    for (const w of windows) {
      if (w.id === undefined) continue;
      if (store.state.activeSpaceByWindow[w.id] !== undefined) continue;
      store.onWindowOpened(w.id);
    }
  } catch (err) {
    log.error('seedExistingWindows failed', { err });
  }
}
