import { describe, expect, test } from 'vitest';
import { createInitialState } from '../shared/store.svelte';
import type { Space } from '../shared/types';
import { resolveSpaceTint } from './space-tint';

const BLUE: Space = { id: 'b', name: 'Blue', color: 'blue', icon: 'briefcase' };
const GRAY: Space = { id: 'g', name: 'Gray', color: 'gray', icon: 'briefcase' };

function stateWithActive(windowId: number, space: Space) {
  const state = createInitialState();
  state.spaces.push(space);
  state.activeSpaceByWindow[windowId] = space.id;
  return state;
}

describe('resolveSpaceTint', () => {
  test("returns the Space's canonical OKLCH when the active Space is non-neutral", () => {
    // blue -> canonical { l: 0.55, c: 0.16, h: 252 } (colourToOklch), non-gray.
    expect(resolveSpaceTint(stateWithActive(100, BLUE), 100)).toEqual({
      hue: 252,
      chroma: 0.16,
      l: 0.55,
    });
  });

  test('returns null when the window has no active Space', () => {
    const state = createInitialState();
    state.activeSpaceByWindow[100] = null;
    expect(resolveSpaceTint(state, 100)).toBeNull();
    // An entirely unknown window id resolves to null too.
    expect(resolveSpaceTint(createInitialState(), 999)).toBeNull();
  });

  test('returns null when the active Space id has no matching record', () => {
    const state = createInitialState();
    state.activeSpaceByWindow[100] = 'missing';
    expect(resolveSpaceTint(state, 100)).toBeNull();
  });

  test('returns null for a neutral (gray) Space so the overlay keeps its default accent', () => {
    // gray must fall back rather than send chroma 0 (which would grey the accent).
    expect(resolveSpaceTint(stateWithActive(100, GRAY), 100)).toBeNull();
  });
});
