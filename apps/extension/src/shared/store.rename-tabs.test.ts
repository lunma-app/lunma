import { beforeEach, describe, expect, test } from 'vitest';
import { LunmaStore } from './store.svelte';
import type { SavedTab, Space } from './types';

let store: LunmaStore;

beforeEach(() => {
  store = new LunmaStore();
});

function makeSpace(id: string): Space {
  return { id, name: id, color: 'blue', icon: 'folder' };
}

function seedSaved(id: string, spaceId = 'work'): SavedTab {
  const saved: SavedTab = {
    id,
    spaceId,
    title: id,
    originalURL: `https://${id}.test/`,
    currentURL: `https://${id}.test/`,
  };
  store.state.savedTabs[saved.id] = saved;
  return saved;
}

/** Activate `spaceId` in `windowId` (creating the instance) and add `tabId` as a
 * temporary tab via the same path Chrome events use. */
function seedTempTab(windowId: number, spaceId: string, tabId: number): void {
  if (!store.state.spaces.some((s) => s.id === spaceId)) {
    store.state.spaces.push(makeSpace(spaceId));
  }
  store.activateSpace(windowId, spaceId);
  store.onTabCreated({ id: tabId, windowId });
}

function instance(windowId: number, spaceId: string) {
  return store.state.spaceInstancesByWindow[windowId]?.[spaceId];
}

describe('LunmaStore.renameTab (pinned)', () => {
  test('sets a trimmed customTitle', () => {
    seedSaved('a');
    store.renameTab('a', '  Docs  ');
    expect(store.state.savedTabs.a?.customTitle).toBe('Docs');
  });

  test('an empty or whitespace name clears customTitle', () => {
    const saved = seedSaved('a');
    saved.customTitle = 'Docs';
    store.renameTab('a', '   ');
    expect(store.state.savedTabs.a?.customTitle).toBeUndefined();
  });

  test('does not touch the stored title (fallback survives a reset)', () => {
    seedSaved('a');
    store.renameTab('a', 'Docs');
    expect(store.state.savedTabs.a?.title).toBe('a');
    store.renameTab('a', '');
    expect(store.state.savedTabs.a?.customTitle).toBeUndefined();
    expect(store.state.savedTabs.a?.title).toBe('a');
  });

  test('is a no-op for an unknown savedTabId', () => {
    expect(() => store.renameTab('ghost', 'X')).not.toThrow();
  });

  test('a custom name survives a live-tab update (onTabUpdated never writes customTitle)', () => {
    const saved = seedSaved('a');
    store.state.tabBindings.a = { 100: 42 };
    store.renameTab('a', 'Docs');
    // A bound tab navigates: the store mirrors currentURL, never the custom name.
    store.onTabUpdated(42, { url: 'https://elsewhere.test/', status: 'complete' });
    expect(store.state.savedTabs.a?.customTitle).toBe('Docs');
    expect(store.state.savedTabs.a?.currentURL).toBe('https://elsewhere.test/');
    void saved;
  });
});

describe('LunmaStore.renameTempTab', () => {
  test('sets a trimmed per-instance override', () => {
    seedTempTab(100, 'work', 17);
    store.renameTempTab(100, 'work', 17, '  Scratch  ');
    expect(instance(100, 'work')?.tempTabTitles[17]).toBe('Scratch');
  });

  test('an empty name deletes the override entry', () => {
    seedTempTab(100, 'work', 17);
    store.renameTempTab(100, 'work', 17, 'Scratch');
    store.renameTempTab(100, 'work', 17, '  ');
    expect(instance(100, 'work')?.tempTabTitles[17]).toBeUndefined();
  });

  test('is a no-op when the (window, Space) has no instance', () => {
    expect(() => store.renameTempTab(999, 'nope', 1, 'X')).not.toThrow();
  });

  test('the override is scoped to its own window instance', () => {
    seedTempTab(100, 'work', 17);
    seedTempTab(200, 'work', 18);
    store.renameTempTab(100, 'work', 17, 'OnlyHere');
    expect(instance(100, 'work')?.tempTabTitles[17]).toBe('OnlyHere');
    expect(instance(200, 'work')?.tempTabTitles[18]).toBeUndefined();
  });
});

describe('temp custom-name pruning', () => {
  test('closing a tab drops its tempTabTitles entry', () => {
    seedTempTab(100, 'work', 17);
    store.renameTempTab(100, 'work', 17, 'Scratch');
    store.onTabRemoved(17, { windowId: 100 });
    expect(instance(100, 'work')?.tempTabIds).not.toContain(17);
    expect(instance(100, 'work')?.tempTabTitles[17]).toBeUndefined();
  });

  test('pinning a temp tab (bindSavedTab) drops its tempTabTitles entry', () => {
    seedTempTab(100, 'work', 17);
    store.renameTempTab(100, 'work', 17, 'Scratch');
    seedSaved('a');
    store.bindSavedTab('a', 100, 17, 'https://a.test/');
    expect(instance(100, 'work')?.tempTabIds).not.toContain(17);
    expect(instance(100, 'work')?.tempTabTitles[17]).toBeUndefined();
  });
});
