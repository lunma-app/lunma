import type { LunmaStore } from '../shared/store.svelte';

/**
 * Guarantee `state.spaces` is non-empty. No-op when at least one Space exists.
 * Otherwise mints a single Lunma-owned Default Space (ADR 0005) — no Chrome
 * bookmark folder is created. Idempotent.
 */
export async function ensureAtLeastOneSpace(store: LunmaStore): Promise<void> {
  if (store.state.spaces.length >= 1) return;
  store.createSpace({ name: 'Default', color: 'gray', icon: 'star' });
}
