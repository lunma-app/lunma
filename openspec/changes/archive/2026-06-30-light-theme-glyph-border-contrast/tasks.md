## 1. Borders & accent label

- [x] 1.1 `SpaceSwitcher.svelte` `.chip-add`: dashed outline `--border` → `--border-strong` (+ comment noting the 3:1 interactive-boundary rationale).
- [x] 1.2 `OverviewPage.svelte` `.group-label.waiting`: inline `oklch(var(--accent-text-l) 0.09 252)` → `var(--accent-heading)` (+ comment).

## 2. Icon glyph fills (compose theme-aware tokens)

- [x] 2.1 `overview-vm.ts` `ciLight()`: add a `tone: 'passed' | 'failing' | 'running'` field to the return (draft keeps `draft: true`); retain `hue` for the draft/existing consumers.
- [x] 2.2 `OverviewPage.svelte` `.ci`: apply `class:ci--passed`/`ci--failing`/`ci--running` from `ci.tone`; set `color` to `var(--success|--danger|--warning)` and `background` to `color-mix(in oklch, var(--<token>) 18%, transparent)`; drop the hard-coded `--ci-h` glyph/bg `oklch()` literals (keep the `.hollow` draft ring on `--text-dim`).
- [x] 2.3 `SpaceSwitcher.svelte` `.chip[data-active] .tile`: glyph `oklch(0.84 var(--space-chroma) var(--space-h))` → `var(--space-c)` (+ comment noting the shared-with-ring, light-legible rationale).

## 3. Contrast gates

- [x] 3.1 `contrast.test.ts`: gate `--accent-heading` ≥ 4.5:1 on `--surface`/`--surface-2`/`--bg`/`--surface-3`, both themes.
- [x] 3.2 `contrast.test.ts`: gate `--border-strong` ≥ 3:1 on `--surface`/`--surface-2`/`--bg`, both themes.
- [x] 3.3 Confirm the CI-glyph status tokens (`--success`/`--danger`/`--warning`) and `--space-c` remain covered by their existing gates after the glyph-composition change (no new opaque hard-coded glyph lightness reintroduced).

## 4. Verify

- [x] 4.1 `pnpm verify` green at the workspace root (tsc, biome, svelte-check, lint:styles, catalog, vitest incl. contrast gates, site build) — ran by the pre-commit hook on commit `e58fa9d`.
- [x] 4.2 Visually confirm in light theme: add-Space tile outline, "Review requests" label, CI glyph, and active-chip star glyph are all legible (and the active-chip glyph reads for a gray Space). Reviewed by the user via screenshots, both themes.
