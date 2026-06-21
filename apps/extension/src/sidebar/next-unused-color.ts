import type { Space, SpaceColor } from '../shared/types';

/**
 * The Space palette colours, in canonical (hue-ordered) order. Picking a default
 * colour for a new Space walks this list; the order also breaks ties when every
 * colour is already in use.
 */
const PALETTE: readonly SpaceColor[] = [
  'red',
  'orange',
  'yellow',
  'green',
  'cyan',
  'blue',
  'purple',
  'pink',
  'gray',
];

/**
 * Choose a sensible default colour for a new Space. Walks the palette colours in
 * order and returns the first not already used by an existing Space. When all
 * are in use it returns the least-used colour, tie-broken by palette order.
 * Pure: no side effects, no Date / random / chrome access.
 */
export function nextUnusedColor(spaces: Space[]): SpaceColor {
  const counts = new Map<SpaceColor, number>();
  for (const color of PALETTE) counts.set(color, 0);
  for (const space of spaces) {
    const color = space.color;
    if (counts.has(color)) counts.set(color, (counts.get(color) ?? 0) + 1);
  }

  // First unused colour in palette order.
  for (const color of PALETTE) {
    if ((counts.get(color) ?? 0) === 0) return color;
  }

  // All used — least-used, tie-broken by palette order (PALETTE is the
  // iteration order, so the first minimum wins).
  let best: SpaceColor = PALETTE[0] ?? 'red';
  let bestCount = Number.POSITIVE_INFINITY;
  for (const color of PALETTE) {
    const count = counts.get(color) ?? 0;
    if (count < bestCount) {
      bestCount = count;
      best = color;
    }
  }
  return best;
}
