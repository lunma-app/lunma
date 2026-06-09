import { beforeEach, describe, expect, test } from 'vitest';
import { LunmaStore } from '../shared/store.svelte';
import { ensureAtLeastOneSpace } from './default-space';

// Lunma-owned model (ADR 0005): ensureAtLeastOneSpace mints a single Default
// Space record with a real uuid and creates no Chrome bookmark folder.

describe('ensureAtLeastOneSpace', () => {
  let store: LunmaStore;

  beforeEach(() => {
    let counter = 0;
    store = new LunmaStore({ idFactory: () => `space-${++counter}` });
  });

  test('first-ever boot creates a Default Space with gray colour and star icon', async () => {
    expect(store.state.spaces).toHaveLength(0);

    await ensureAtLeastOneSpace(store);

    expect(store.state.spaces).toHaveLength(1);
    expect(store.state.spaces[0]?.name).toBe('Default');
    expect(store.state.spaces[0]?.color).toBe('gray');
    expect(store.state.spaces[0]?.icon).toBe('star');
    expect(store.state.spaces[0]?.id).toBe('space-1');
  });

  test('creates no Chrome bookmark folder', async () => {
    // No chrome stub installed: a chrome.bookmarks.* call would throw.
    await expect(ensureAtLeastOneSpace(store)).resolves.toBeUndefined();
    expect(store.state.spaces).toHaveLength(1);
  });

  test('no-op when a Space already exists', async () => {
    store.createSpace({ name: 'Work', color: 'blue', icon: 'star' });
    await ensureAtLeastOneSpace(store);
    expect(store.state.spaces).toHaveLength(1);
    expect(store.state.spaces[0]?.name).toBe('Work');
  });

  test('idempotent — two back-to-back calls create exactly one Default', async () => {
    await ensureAtLeastOneSpace(store);
    await ensureAtLeastOneSpace(store);
    expect(store.state.spaces).toHaveLength(1);
    expect(store.state.spaces[0]?.name).toBe('Default');
  });
});
