import { describe, expect, test } from 'vitest';
import { isSpaceEmpty } from './space-empty';
import type { AppState } from './types';

type EmptyCheckState = Pick<AppState, 'pinnedBySpace' | 'spaceInstancesByWindow'>;

function makeState(overrides: Partial<EmptyCheckState> = {}): EmptyCheckState {
  return {
    pinnedBySpace: {},
    spaceInstancesByWindow: {},
    ...overrides,
  };
}

describe('isSpaceEmpty', () => {
  test('true when the Space has no pins and no temp tabs anywhere', () => {
    const state = makeState();
    expect(isSpaceEmpty(state, 'default')).toBe(true);
  });

  test('false when the Space has a pinned tab', () => {
    const state = makeState({
      pinnedBySpace: { default: [{ kind: 'tab', id: 'saved-1' }] },
    });
    expect(isSpaceEmpty(state, 'default')).toBe(false);
  });

  test('false when the Space has a temp tab in some window', () => {
    const state = makeState({
      spaceInstancesByWindow: {
        100: {
          default: { spaceId: 'default', groupId: -1, tempTabIds: [7], tempTabTitles: {} },
        },
      },
    });
    expect(isSpaceEmpty(state, 'default')).toBe(false);
  });

  test('false when the Space has both a pin and a temp tab', () => {
    const state = makeState({
      pinnedBySpace: { default: [{ kind: 'tab', id: 'saved-1' }] },
      spaceInstancesByWindow: {
        100: {
          default: { spaceId: 'default', groupId: -1, tempTabIds: [7], tempTabTitles: {} },
        },
      },
    });
    expect(isSpaceEmpty(state, 'default')).toBe(false);
  });

  test('true when another Space in the same window instance map holds tabs', () => {
    const state = makeState({
      spaceInstancesByWindow: {
        100: {
          default: { spaceId: 'default', groupId: -1, tempTabIds: [], tempTabTitles: {} },
          work: { spaceId: 'work', groupId: 5, tempTabIds: [9], tempTabTitles: {} },
        },
      },
    });
    expect(isSpaceEmpty(state, 'default')).toBe(true);
  });

  test('true for a Space with no instance entry in any window at all', () => {
    const state = makeState({
      spaceInstancesByWindow: {
        100: {
          work: { spaceId: 'work', groupId: 5, tempTabIds: [9], tempTabTitles: {} },
        },
      },
    });
    expect(isSpaceEmpty(state, 'default')).toBe(true);
  });
});
