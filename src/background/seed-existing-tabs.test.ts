import { describe, expect, test } from 'vitest';
import { LunmaStore } from '../shared/store.svelte';
import { seedExistingTabs } from './seed-existing-tabs';

function makeStore(): LunmaStore {
  const store = new LunmaStore();
  store.state.spaces.push({ id: 'work', name: 'Work', color: 'blue', icon: 'star' });
  store.state.activeSpaceByWindow[100] = 'work';
  return store;
}

describe('seedExistingTabs', () => {
  test('adopts open tabs into the active Space, creating the instance', () => {
    const store = makeStore();
    seedExistingTabs(store, [
      { id: 17, windowId: 100 },
      { id: 22, windowId: 100 },
    ]);
    expect(store.state.spaceInstancesByWindow[100]?.work?.tempTabIds).toEqual([17, 22]);
  });

  test('skips tabs bound to a saved tab (rebound earlier in boot)', () => {
    const store = makeStore();
    store.state.savedTabs['st-1'] = {
      id: 'st-1',
      spaceId: 'work',
      title: 'X',
      originalURL: 'https://x/',
      currentURL: 'https://x/',
    };
    store.state.tabBindings['st-1'] = { 100: 17 }; // tab 17 is bound → not temp
    seedExistingTabs(store, [
      { id: 17, windowId: 100 },
      { id: 22, windowId: 100 },
    ]);
    expect(store.state.spaceInstancesByWindow[100]?.work?.tempTabIds).toEqual([22]);
  });

  test('ignores tabs in windows with no active Space', () => {
    const store = makeStore();
    store.state.activeSpaceByWindow[200] = null;
    seedExistingTabs(store, [
      { id: 17, windowId: 100 },
      { id: 99, windowId: 200 },
    ]);
    expect(store.state.spaceInstancesByWindow[100]?.work?.tempTabIds).toEqual([17]);
    expect(store.state.spaceInstancesByWindow[200]).toBeUndefined();
  });

  test('skips tabs without id or windowId', () => {
    const store = makeStore();
    seedExistingTabs(store, [{ windowId: 100 }, { id: 5 }, { id: 17, windowId: 100 }]);
    expect(store.state.spaceInstancesByWindow[100]?.work?.tempTabIds).toEqual([17]);
  });

  test('does not seed a home tab (the Lunma new-tab page) as a temp tab', () => {
    const store = makeStore();
    seedExistingTabs(store, [
      { id: 17, windowId: 100, url: 'https://a/' },
      { id: 50, windowId: 100, url: 'chrome://newtab/' },
      { id: 22, windowId: 100, url: 'https://b/' },
    ]);
    // The home tab (50) is excluded; the real tabs are seeded in order.
    expect(store.state.spaceInstancesByWindow[100]?.work?.tempTabIds).toEqual([17, 22]);
  });

  test('still creates the active Space instance when the only tab is a home tab', () => {
    // Regression: after Clear + reopen a window can have ONLY a home tab. The
    // instance must still be created so newly-opened tabs can be grouped — else
    // onTabCreated/groupNewTab have no instance and Lunma groups nothing.
    const store = makeStore();
    seedExistingTabs(store, [{ id: 50, windowId: 100, url: 'chrome://newtab/' }]);
    const instance = store.state.spaceInstancesByWindow[100]?.work;
    expect(instance).toBeDefined();
    expect(instance?.tempTabIds).toEqual([]); // home tab is grouped, never listed
  });

  test('is idempotent across repeated boots', () => {
    const store = makeStore();
    const tabs = [{ id: 17, windowId: 100 }];
    seedExistingTabs(store, tabs);
    seedExistingTabs(store, tabs);
    expect(store.state.spaceInstancesByWindow[100]?.work?.tempTabIds).toEqual([17]);
  });

  test("seeds a grouped tab into its group's Space, not the active one", () => {
    const store = makeStore(); // "work" is active
    store.state.spaces.push({ id: 'side', name: 'Side', color: 'red', icon: 'star' });
    store.state.spaceInstancesByWindow[100] = {
      work: { spaceId: 'work', groupId: 11, tempTabIds: [], tempTabTitles: {} },
      side: { spaceId: 'side', groupId: 22, tempTabIds: [], tempTabTitles: {} },
    };
    seedExistingTabs(store, [
      { id: 42, windowId: 100, groupId: 22 }, // belongs to "side"'s live group
      { id: 7, windowId: 100 }, // ungrouped → active "work"
    ]);
    expect(store.state.spaceInstancesByWindow[100]?.side?.tempTabIds).toEqual([42]);
    expect(store.state.spaceInstancesByWindow[100]?.work?.tempTabIds).toEqual([7]);
  });

  test('a tab whose group maps to no instance falls back to the active Space', () => {
    const store = makeStore();
    store.state.spaceInstancesByWindow[100] = {
      work: { spaceId: 'work', groupId: 11, tempTabIds: [], tempTabTitles: {} },
    };
    seedExistingTabs(store, [{ id: 42, windowId: 100, groupId: 999 }]);
    expect(store.state.spaceInstancesByWindow[100]?.work?.tempTabIds).toEqual([42]);
  });
});
