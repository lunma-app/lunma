import { describe, expect, test } from 'vitest';
import { createInitialState } from '../../shared/store.svelte';
import type { AppState } from '../../shared/types';
import { findTabInActiveSpace } from './queries';

function makeState(): AppState {
  return createInitialState();
}

describe('findTabInActiveSpace', () => {
  test('returns null when there is no active Space for the window', () => {
    const state = makeState();
    expect(findTabInActiveSpace(state, 100, 'https://example.com/')).toBeNull();
  });

  test('returns null when active Space has no temp tabs', () => {
    const state = makeState();
    state.spaces.push({ id: 'sp', name: 'S', color: 'blue', icon: 'star' });
    state.activeSpaceByWindow[100] = 'sp';
    state.spaceInstancesByWindow[100] = {
      sp: { spaceId: 'sp', groupId: 1, tempTabIds: [], tempTabTitles: {} },
    };
    expect(findTabInActiveSpace(state, 100, 'https://example.com/')).toBeNull();
  });

  test('finds a URL in a temp tab of the active Space', () => {
    const state = makeState();
    state.spaces.push({ id: 'sp', name: 'S', color: 'blue', icon: 'star' });
    state.activeSpaceByWindow[100] = 'sp';
    state.spaceInstancesByWindow[100] = {
      sp: { spaceId: 'sp', groupId: 1, tempTabIds: [42], tempTabTitles: {} },
    };
    state.liveTabsById[42] = {
      tabId: 42,
      windowId: 100,
      title: 'Example',
      url: 'https://example.com/',
      active: true,
      status: 'complete',
    };
    expect(findTabInActiveSpace(state, 100, 'https://example.com/')).toBe(42);
  });

  test('finds a URL in a pinned (saved) tab bound in the active Space', () => {
    const state = makeState();
    state.spaces.push({ id: 'sp', name: 'S', color: 'blue', icon: 'star' });
    state.activeSpaceByWindow[100] = 'sp';
    state.spaceInstancesByWindow[100] = {
      sp: { spaceId: 'sp', groupId: 1, tempTabIds: [], tempTabTitles: {} },
    };
    state.savedTabs['st-1'] = {
      id: 'st-1',
      spaceId: 'sp',
      title: 'Example',
      originalURL: 'https://example.com/',
      currentURL: 'https://example.com/',
    };
    state.tabBindings['st-1'] = { 100: 77 };
    state.liveTabsById[77] = {
      tabId: 77,
      windowId: 100,
      title: 'Example',
      url: 'https://example.com/',
      active: false,
      status: 'complete',
    };
    expect(findTabInActiveSpace(state, 100, 'https://example.com/')).toBe(77);
  });

  test('returns null when URL is in a tab belonging to a different Space', () => {
    const state = makeState();
    state.spaces.push({ id: 'sp-a', name: 'A', color: 'blue', icon: 'star' });
    state.spaces.push({ id: 'sp-b', name: 'B', color: 'red', icon: 'star' });
    state.activeSpaceByWindow[100] = 'sp-a';
    state.spaceInstancesByWindow[100] = {
      'sp-a': { spaceId: 'sp-a', groupId: 1, tempTabIds: [], tempTabTitles: {} },
      'sp-b': { spaceId: 'sp-b', groupId: 2, tempTabIds: [42], tempTabTitles: {} },
    };
    state.liveTabsById[42] = {
      tabId: 42,
      windowId: 100,
      title: 'Example',
      url: 'https://example.com/',
      active: true,
      status: 'complete',
    };
    expect(findTabInActiveSpace(state, 100, 'https://example.com/')).toBeNull();
  });

  test('returns null when URL is in a different window', () => {
    const state = makeState();
    state.spaces.push({ id: 'sp', name: 'S', color: 'blue', icon: 'star' });
    state.activeSpaceByWindow[100] = 'sp';
    state.activeSpaceByWindow[200] = 'sp';
    state.spaceInstancesByWindow[100] = {
      sp: { spaceId: 'sp', groupId: 1, tempTabIds: [], tempTabTitles: {} },
    };
    state.spaceInstancesByWindow[200] = {
      sp: { spaceId: 'sp', groupId: 2, tempTabIds: [42], tempTabTitles: {} },
    };
    state.liveTabsById[42] = {
      tabId: 42,
      windowId: 200,
      title: 'Example',
      url: 'https://example.com/',
      active: true,
      status: 'complete',
    };
    // Querying window 100 — the tab is in window 200
    expect(findTabInActiveSpace(state, 100, 'https://example.com/')).toBeNull();
  });

  test('URL matching is exact — trailing slash matters', () => {
    const state = makeState();
    state.spaces.push({ id: 'sp', name: 'S', color: 'blue', icon: 'star' });
    state.activeSpaceByWindow[100] = 'sp';
    state.spaceInstancesByWindow[100] = {
      sp: { spaceId: 'sp', groupId: 1, tempTabIds: [42], tempTabTitles: {} },
    };
    state.liveTabsById[42] = {
      tabId: 42,
      windowId: 100,
      title: 'Example',
      url: 'https://example.com/',
      active: true,
      status: 'complete',
    };
    expect(findTabInActiveSpace(state, 100, 'https://example.com')).toBeNull();
  });
});
