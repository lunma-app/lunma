import { beforeEach, describe, expect, test, vi } from 'vitest';
import { LunmaStore } from '../shared/store.svelte';
import { seedExistingWindows } from './seed-existing-windows';

// The boot seed filters to normal windows at the query (`windowTypes: ['normal']`),
// so the stub honours that filter — a `type` other than 'normal' is excluded.
function installChromeStub(windows: Partial<chrome.windows.Window>[]): ReturnType<typeof vi.fn> {
  const getAll = vi.fn(async (opts?: chrome.windows.QueryOptions) => {
    const types = opts?.windowTypes;
    if (!types) return windows;
    // Untyped stub windows model normal windows (the common case in these tests).
    return windows.filter((w) => types.includes(w.type ?? 'normal'));
  });
  (globalThis as unknown as { chrome: unknown }).chrome = {
    windows: { getAll },
  };
  return getAll;
}

describe('seedExistingWindows', () => {
  let store: LunmaStore;

  beforeEach(() => {
    store = new LunmaStore();
    store.state.spaces.push({
      id: 'space-1',
      name: 'Default',
      color: 'gray',
      icon: 'star',
    });
    store.state.lastActivatedSpaceId = 'space-1';
  });

  test('seeds every existing window with lastActivatedSpaceId', async () => {
    installChromeStub([{ id: 100 }, { id: 200 }]);

    await seedExistingWindows(store);

    expect(store.state.activeSpaceByWindow).toEqual({
      100: 'space-1',
      200: 'space-1',
    });
  });

  test("queries only normal windows (getAll({ windowTypes: ['normal'] }))", async () => {
    const getAll = installChromeStub([{ id: 100, type: 'normal' }]);

    await seedExistingWindows(store);

    expect(getAll).toHaveBeenCalledWith({ windowTypes: ['normal'] });
  });

  test('a popup already open at boot is not seeded (normal window still is)', async () => {
    installChromeStub([
      { id: 100, type: 'normal' },
      { id: 200, type: 'popup' },
    ]);

    await seedExistingWindows(store);

    expect(store.state.activeSpaceByWindow).toEqual({ 100: 'space-1' });
    expect(store.state.activeSpaceByWindow[200]).toBeUndefined();
  });

  test('leaves persisted entries untouched (including explicit null)', async () => {
    store.state.activeSpaceByWindow[100] = 'other-space';
    store.state.activeSpaceByWindow[200] = null;
    installChromeStub([{ id: 100 }, { id: 200 }, { id: 300 }]);

    await seedExistingWindows(store);

    expect(store.state.activeSpaceByWindow[100]).toBe('other-space');
    expect(store.state.activeSpaceByWindow[200]).toBeNull();
    expect(store.state.activeSpaceByWindow[300]).toBe('space-1');
  });

  test('skips windows with undefined id', async () => {
    installChromeStub([{ id: undefined }, { id: 100 }]);

    await seedExistingWindows(store);

    expect(store.state.activeSpaceByWindow).toEqual({ 100: 'space-1' });
  });

  test('seeds null when no Space has ever been activated', async () => {
    store.state.lastActivatedSpaceId = null;
    installChromeStub([{ id: 100 }]);

    await seedExistingWindows(store);

    expect(store.state.activeSpaceByWindow[100]).toBeNull();
  });

  test('swallows chrome.windows.getAll rejections', async () => {
    const getAll = vi.fn(async () => {
      throw new Error('boom');
    });
    (globalThis as unknown as { chrome: unknown }).chrome = {
      windows: { getAll },
    };

    await expect(seedExistingWindows(store)).resolves.toBeUndefined();
    expect(store.state.activeSpaceByWindow).toEqual({});
  });
});
