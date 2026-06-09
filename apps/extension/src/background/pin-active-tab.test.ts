import { describe, expect, test } from 'vitest';
import { makeStore, seedSpace } from '../shared/store.test-helpers';
import { resolvePinActiveTab } from './pin-active-tab';

/** Seed a saved-tab record so binding-state branches can be exercised. */
function seedSavedTab(
  store: ReturnType<typeof makeStore>,
  id: string,
  spaceId: string | null,
): void {
  store.state.savedTabs[id] = {
    id,
    spaceId,
    title: id,
    originalURL: `https://example.com/${id}`,
    currentURL: `https://example.com/${id}`,
  };
}

describe('resolvePinActiveTab (Alt+D toggle)', () => {
  test('resolves a PIN action for an unbound active tab', () => {
    const store = makeStore();
    seedSpace(store, { id: 'work' });
    store.state.activeSpaceByWindow[100] = 'work';
    store.state.pinnedBySpace.work = [
      { kind: 'tab', id: 'st-1' },
      { kind: 'tab', id: 'st-2' },
    ];

    const result = resolvePinActiveTab(store, { id: 42, windowId: 100 });

    expect(result).toEqual({
      action: 'pin',
      payload: { tabId: 42, windowId: 100, spaceId: 'work', targetIndex: 2 },
    });
  });

  test('pin targetIndex is 0 when the Space has no pinned tabs yet', () => {
    const store = makeStore();
    seedSpace(store, { id: 'work' });
    store.state.activeSpaceByWindow[100] = 'work';

    const result = resolvePinActiveTab(store, { id: 42, windowId: 100 });

    expect(result?.action).toBe('pin');
    expect(result?.action === 'pin' && result.payload.targetIndex).toBe(0);
  });

  test('resolves an UNPIN action when the active tab is already pinned (toggle off)', () => {
    const store = makeStore();
    seedSpace(store, { id: 'work' });
    store.state.activeSpaceByWindow[100] = 'work';
    seedSavedTab(store, 'st-1', 'work'); // pinned (spaceId !== null)
    store.state.tabBindings['st-1'] = { 100: 42 };

    const result = resolvePinActiveTab(store, { id: 42, windowId: 100 });

    expect(result).toEqual({ action: 'unpin', payload: { savedTabId: 'st-1', windowId: 100 } });
  });

  test('returns null when the active tab is bound to a global FAVORITE (left alone)', () => {
    const store = makeStore();
    seedSpace(store, { id: 'work' });
    store.state.activeSpaceByWindow[100] = 'work';
    seedSavedTab(store, 'fav-1', null); // favorite (spaceId === null)
    store.state.tabBindings['fav-1'] = { 100: 42 };

    expect(resolvePinActiveTab(store, { id: 42, windowId: 100 })).toBeNull();
  });

  test('returns null when there is no active tab', () => {
    const store = makeStore();
    expect(resolvePinActiveTab(store, undefined)).toBeNull();
    expect(resolvePinActiveTab(store, { windowId: 100 })).toBeNull();
    expect(resolvePinActiveTab(store, { id: 42 })).toBeNull();
  });

  test('returns null when an UNBOUND tab is in a window with no active Space', () => {
    const store = makeStore();
    store.state.activeSpaceByWindow[100] = null;
    expect(resolvePinActiveTab(store, { id: 42, windowId: 100 })).toBeNull();
    // Also null when the window is entirely absent from activeSpaceByWindow.
    expect(resolvePinActiveTab(store, { id: 42, windowId: 200 })).toBeNull();
  });
});
