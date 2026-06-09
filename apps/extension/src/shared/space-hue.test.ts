import { describe, expect, test } from 'vitest';
import {
  colourToChroma,
  colourToHue,
  colourToOklch,
  colourToOn,
  DEFAULT_HUE,
  type SpaceOklch,
} from './space-hue';
import type { SpaceColor } from './types';

// The nine canonical Space colours (one per Chrome tab-group colour) and their
// canonical OKLCH. This table IS the contract asserted below; the per-colour
// contrast guarantees live in contrast.test.ts.
const CANONICAL: Array<[SpaceColor, SpaceOklch]> = [
  ['red', { l: 0.56, c: 0.18, h: 25 }],
  ['orange', { l: 0.73, c: 0.16, h: 55 }],
  ['yellow', { l: 0.87, c: 0.16, h: 98 }],
  ['green', { l: 0.74, c: 0.17, h: 150 }],
  ['cyan', { l: 0.77, c: 0.12, h: 210 }],
  ['blue', { l: 0.55, c: 0.16, h: 252 }],
  ['purple', { l: 0.56, c: 0.17, h: 295 }],
  ['pink', { l: 0.7, c: 0.18, h: 350 }],
  ['gray', { l: 0.66, c: 0, h: DEFAULT_HUE }],
];

const ALL_COLORS = CANONICAL.map(([c]) => c);

describe('colourToOklch', () => {
  for (const [colour, ok] of CANONICAL) {
    test(`${colour} → { l: ${ok.l}, c: ${ok.c}, h: ${ok.h} }`, () => {
      expect(colourToOklch(colour)).toEqual(ok);
    });
  }

  test('is pure — repeated calls return equal values', () => {
    expect(colourToOklch('blue')).toEqual(colourToOklch('blue'));
    expect(colourToOklch('pink')).toEqual(colourToOklch('pink'));
  });

  test('covers every SpaceColor variant exhaustively', () => {
    expect(ALL_COLORS).toHaveLength(9);
    for (const c of ALL_COLORS) {
      const ok = colourToOklch(c);
      expect(typeof ok.l).toBe('number');
      expect(typeof ok.c).toBe('number');
      expect(typeof ok.h).toBe('number');
    }
  });
});

describe('colourToHue / colourToChroma accessors', () => {
  for (const [colour, ok] of CANONICAL) {
    test(`${colour} → hue ${ok.h}, chroma ${ok.c}`, () => {
      expect(colourToHue(colour)).toBe(ok.h);
      expect(colourToChroma(colour)).toBe(ok.c);
    });
  }

  test('gray is the lone neutral (chroma 0 at the default hue)', () => {
    expect(colourToChroma('gray')).toBe(0);
    expect(colourToHue('gray')).toBe(DEFAULT_HUE);
    expect(DEFAULT_HUE).toBe(62);
  });
});

describe('colourToOn', () => {
  test('returns a parseable oklch ink for every colour', () => {
    for (const c of ALL_COLORS) {
      expect(colourToOn(c)).toMatch(/^oklch\(/);
    }
  });

  test('flips dark↔light across the light→dark range of the palette', () => {
    // Light colours take dark ink; dark colours take light ink. (The exact
    // per-colour WCAG-AA guarantee is asserted in contrast.test.ts.)
    expect(colourToOn('yellow')).toMatch(/^oklch\(0\.21\b/); // light chip → dark ink
    expect(colourToOn('purple')).toMatch(/^oklch\(0\.99\b/); // dark chip → light ink
  });
});
