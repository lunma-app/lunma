## 1. Implementation

- [x] 1.1 In `SmartSectionHeader.svelte`, replace the separate `.section-chevron` + `.section-icon` with ONE 16px `.section-disclosure` slot stacking the source `Icon` and a `chevron-right` `Icon` (absolutely positioned, crossfade): source icon visible at rest, chevron revealed + rotated on header `:hover`/`:focus-visible`. Add a `first: boolean` prop.
- [x] 1.2 Restyle the header: compact ~24px height (`--space-1` padding + `--text-xs` line), host `--text-xs`/`--weight-medium`/`--text-dim` (hover `--text-2`), count `--text-xs`/`--weight-semibold`/`--text-dim`; hairline `border-top` (color-mix of `--text-faint`) when `!first`. Guard crossfade/rotation under `prefers-reduced-motion`.
- [x] 1.3 In `SmartFolder.svelte`, pass `first={i === 0}` to `SmartSectionHeader`, and recess `.result-favicon` to `opacity: 0.85` at rest, `1` on row hover/active.

## 2. Tests

- [x] 2.1 Update/extend `SmartSectionHeader.test.ts`: assert ONE disclosure slot containing both the source-icon and chevron glyphs (icon default-visible), `aria-expanded` + accessible label intact, and the separator class is absent on the first / present otherwise.

## 3. Spec & verify

- [x] 3.1 Confirm the `smart-folders` delta re-specs the header as a single disclosure slot (drafted in this change's `specs/`).
- [x] 3.2 Run `pnpm --filter @lunma/extension verify` and ensure green.
