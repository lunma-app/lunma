import { describe, expect, test } from 'vitest';
import { createInitialState } from '../../shared/store.svelte';
import type { AppState } from '../../shared/types';
import { isDedupEligibleSource, isUrlOpenInActiveSpace } from './already-open';

function makeState(): AppState {
  return createInitialState();
}

describe('isDedupEligibleSource', () => {
  test('only bookmark/history/websearch/navigate are eligible', () => {
    expect(isDedupEligibleSource('bookmark')).toBe(true);
    expect(isDedupEligibleSource('history')).toBe(true);
    expect(isDedupEligibleSource('websearch')).toBe(true);
    expect(isDedupEligibleSource('navigate')).toBe(true);
    // A live tab / saved record carries its own focus semantics — never flagged.
    expect(isDedupEligibleSource('tab')).toBe(false);
    expect(isDedupEligibleSource('saved')).toBe(false);
    expect(isDedupEligibleSource('smart')).toBe(false);
  });
});

describe('isUrlOpenInActiveSpace', () => {
  test('false when the window has no active Space', () => {
    expect(isUrlOpenInActiveSpace(makeState(), 100, 'https://example.com/')).toBe(false);
  });

  test('true for a URL open as a temp tab in the active Space', () => {
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
    expect(isUrlOpenInActiveSpace(state, 100, 'https://example.com/')).toBe(true);
  });

  test('true for a URL open as a pinned tab bound in the active Space', () => {
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
    expect(isUrlOpenInActiveSpace(state, 100, 'https://example.com/')).toBe(true);
  });

  test('false when the URL is open only in a different Space', () => {
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
    expect(isUrlOpenInActiveSpace(state, 100, 'https://example.com/')).toBe(false);
  });

  test('false when the URL is open only in a different window', () => {
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
    expect(isUrlOpenInActiveSpace(state, 100, 'https://example.com/')).toBe(false);
  });

  test('URL matching is exact — a trailing slash difference is not open', () => {
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
    expect(isUrlOpenInActiveSpace(state, 100, 'https://example.com')).toBe(false);
  });
});
