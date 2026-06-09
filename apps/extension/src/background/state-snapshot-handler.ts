import { respondWithStateSnapshot } from '../shared/messages';
import type { LunmaStore } from '../shared/store.svelte';

/**
 * Pure-read state-snapshot handler. Registers a chrome.runtime.onMessage
 * listener that replies to 'lunma/state-request' with the current store
 * snapshot. Never enqueues onto the coordinator queue, never calls any
 * LunmaStore mutator, never persists or broadcasts.
 *
 * Returns an unregister function.
 */
export function registerStateSnapshotHandler(store: LunmaStore): () => void {
  return respondWithStateSnapshot(() => store.snapshot());
}
