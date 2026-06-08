import type { IconName } from '../shared/icon-names';

/**
 * Curated shortlist of workspace-flavoured icons offered when creating or
 * editing a Space. A named subset of `ICON_NAMES` — NOT the full catalogue,
 * which is far too large for the compact editor grid (a searchable full picker
 * is a deliberate later concern; see the change's design D3). Every entry is a
 * valid `IconName`, so the union stays compile-checked.
 *
 * Lives in plain TS (not the `IconPicker.svelte` module block) so it can be
 * re-exported through `src/ui/index.ts` and imported from `.ts` test files —
 * `tsc` resolves `*.svelte` to its default export only.
 *
 * Six columns × four rows = 24 tiles.
 */
export const SPACE_ICONS: readonly IconName[] = [
  'star',
  'briefcase',
  'book',
  'code',
  'house',
  'palette',
  'music',
  'camera',
  'heart',
  'rocket',
  'coffee',
  'leaf',
  'globe',
  'gamepad-2',
  'graduation-cap',
  'flask-conical',
  'dumbbell',
  'shopping-cart',
  'plane',
  'terminal',
  'brain',
  'sparkles',
  'compass',
  'folder',
];
