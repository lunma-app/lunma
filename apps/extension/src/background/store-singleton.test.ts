import { beforeEach, describe, expect, test, vi } from 'vitest';

// loadState's only collaborator we need to steer is the read layer; mock it so we
// can drive each `PersistedRead` kind and assert the `LoadOutcome` mapping +
// which state gets assigned into the singleton store. `persist` is mocked too so
// the module's Coordinator wiring imports cleanly without a chrome stub.
vi.mock('../shared/chrome/storage', () => ({
  readPersistedState: vi.fn(),
  persist: vi.fn(),
}));

import { readPersistedState } from '../shared/chrome/storage';
import type { AppStateV9 } from '../shared/schemas';
import { createInitialState } from '../shared/store.svelte';
import { loadState, store } from './store-singleton';

const mockRead = vi.mocked(readPersistedState);

/** A valid state carrying one Space, used for the `ok`/`salvaged` (state-bearing)
 * read kinds. */
function stateWithWork(): AppStateV9 {
  const state = createInitialState();
  state.spaces.push({ id: 'w', name: 'Work', color: 'blue', icon: 'star' });
  return state;
}

beforeEach(() => {
  mockRead.mockReset();
  Object.assign(store.state, createInitialState());
});

describe('loadState — outcome mapping for each read kind', () => {
  test('ok → clean (assigns the parsed state)', async () => {
    mockRead.mockResolvedValue({ kind: 'ok', state: stateWithWork() });
    const { outcome } = await loadState();
    expect(outcome).toBe('clean');
    expect(store.state.spaces.map((s) => s.name)).toEqual(['Work']);
  });

  test('empty → clean (empty initial state)', async () => {
    mockRead.mockResolvedValue({ kind: 'empty' });
    const { outcome } = await loadState();
    expect(outcome).toBe('clean');
    expect(store.state.spaces).toEqual([]);
  });

  test('salvaged → salvaged (assigns the salvaged state)', async () => {
    mockRead.mockResolvedValue({ kind: 'salvaged', state: stateWithWork() });
    const { outcome } = await loadState();
    expect(outcome).toBe('salvaged');
    expect(store.state.spaces.map((s) => s.name)).toEqual(['Work']);
  });

  test('corrupt → recovered (empty initial state)', async () => {
    mockRead.mockResolvedValue({ kind: 'corrupt' });
    const { outcome } = await loadState();
    expect(outcome).toBe('recovered');
    expect(store.state.spaces).toEqual([]);
  });

  test('unavailable → unavailable (empty initial state)', async () => {
    mockRead.mockResolvedValue({ kind: 'unavailable' });
    const { outcome } = await loadState();
    expect(outcome).toBe('unavailable');
    expect(store.state.spaces).toEqual([]);
  });
});
