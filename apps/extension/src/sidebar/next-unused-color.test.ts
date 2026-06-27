import { describe, expect, test } from 'vitest';
import type { Space, SpaceColor } from '../shared/types';
import { nextUnusedColor } from './next-unused-color';

let idSeq = 0;
function space(color: SpaceColor): Space {
  idSeq += 1;
  return { id: `s-${color}-${idSeq}`, name: color, color, icon: 'star' };
}

describe('nextUnusedColor', () => {
  test('returns the first palette colour when no Spaces exist', () => {
    expect(nextUnusedColor([])).toBe('red');
  });

  test('returns the first unused palette colour when some are taken', () => {
    // red + orange used → first unused is yellow.
    expect(nextUnusedColor([space('red'), space('orange')])).toBe('yellow');
  });

  test('skips used colours regardless of input order', () => {
    // red, yellow used (out of order) → orange is the first unused.
    expect(nextUnusedColor([space('yellow'), space('red')])).toBe('orange');
  });

  // The full 10-colour palette, in canonical order.
  const ALL_COLORS: SpaceColor[] = [
    'red',
    'orange',
    'yellow',
    'green',
    'teal',
    'cyan',
    'blue',
    'purple',
    'pink',
    'gray',
  ];

  test('returns the least-used colour when every palette colour is taken', () => {
    const all: Space[] = ALL_COLORS.map(space);
    // One extra red and one extra blue → every colour used once except those
    // two; least-used (count 1) tie-broken by palette order is 'orange'.
    all.push(space('red'), space('blue'));
    expect(nextUnusedColor(all)).toBe('orange');
  });

  test('counts duplicates so a doubled colour is not chosen as least-used', () => {
    // Every colour once, plus a second red and a second orange.
    const all: Space[] = [...ALL_COLORS.map(space), space('red'), space('orange')];
    // red and orange are doubled; the rest appear once → least-used is the
    // first single-count colour in palette order: yellow.
    expect(nextUnusedColor(all)).toBe('yellow');
  });
});
