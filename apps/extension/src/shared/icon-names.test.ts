import { describe, expect, test } from 'vitest';
import { ICON_NAMES } from './icon-names';

/**
 * lucide 1.31.0 renamed five icons Lunma had shipped in the picker. The names
 * below are lucide's own successors (`@lucide/svelte/dist/aliases/aliases.js`);
 * a stored legacy name is rewritten by the v18 migration.
 */
const RENAMED = {
  frown: 'face-slightly-frowning',
  smile: 'face-slightly-smiling',
  'smile-plus': 'face-slightly-smiling-plus',
  podcast: 'mic-signal',
  history: 'rotate-ccw-clock',
} as const;

describe('ICON_NAMES', () => {
  test('carries none of the names lucide removed', () => {
    const names = ICON_NAMES as readonly string[];
    expect(Object.keys(RENAMED).filter((n) => names.includes(n))).toEqual([]);
  });

  test('carries every replacement name', () => {
    const names = ICON_NAMES as readonly string[];
    expect(Object.values(RENAMED).filter((n) => !names.includes(n))).toEqual([]);
  });

  test('is free of duplicates', () => {
    const names = [...ICON_NAMES];
    expect(names.length).toBe(new Set(names).size);
  });
});
