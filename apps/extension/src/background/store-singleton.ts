import { persist, readPersistedState } from '../shared/chrome/storage';
import { broadcastState } from '../shared/messages';
import { createInitialState, LunmaStore } from '../shared/store.svelte';
import type { AppState } from '../shared/types';
import { Coordinator } from './coordinator';

export const store = new LunmaStore();

export const coordinator = new Coordinator({
  store,
  persist: (state) => persist(state),
  broadcast: ({ method, state }) => broadcastState(method, state),
});

/**
 * The precise read outcome the boot chain gates mint/persist on (design D5):
 *
 *   - `clean`       — a clean read (`ok`) or a genuinely-absent key (`empty`,
 *                     the real first boot); seed + persist as today.
 *   - `recovered`   — the layer quarantined a corrupt payload and fell back to
 *                     `createInitialState()`; mint + persist over the junk.
 *   - `salvaged`    — partial corruption recovered into a valid state; persist
 *                     (self-heal), mint only if no Spaces were salvaged.
 *   - `unavailable` — the read itself failed; the on-disk state may be real, so
 *                     the boot SHALL NOT mint a Default and SHALL NOT persist.
 */
export type LoadOutcome = 'clean' | 'recovered' | 'salvaged' | 'unavailable';

export async function loadState(): Promise<{ state: AppState; outcome: LoadOutcome }> {
  const result = await readPersistedState();
  if (result.kind === 'ok') {
    Object.assign(store.state, result.state);
    return { state: store.state, outcome: 'clean' };
  }
  if (result.kind === 'salvaged') {
    Object.assign(store.state, result.state);
    return { state: store.state, outcome: 'salvaged' };
  }
  // `empty` | `corrupt` | `unavailable` → seed an empty, internally-consistent
  // store. The boot chain reads `outcome` to decide what to do with it: `clean`
  // (an absent key) seeds a Default; `recovered` persists over quarantined junk;
  // `unavailable` does NEITHER, leaving the unreadable on-disk state byte-intact.
  Object.assign(store.state, createInitialState());
  const outcome: LoadOutcome =
    result.kind === 'corrupt'
      ? 'recovered'
      : result.kind === 'unavailable'
        ? 'unavailable'
        : 'clean';
  return { state: store.state, outcome };
}
