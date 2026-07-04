## 1. Canvas + theme core mechanism (gaps 1–2)

- [x] 1.1 Add `background?: 'neutral' | 'aurora'` (default `'neutral'`) and `theme?: 'light' | 'dark'` (default `'dark'`) to `StoryMeta` in `apps/extension/catalog/lib/story.ts`.
- [x] 1.2 In `Catalog.svelte`, compute `data-canvas`/`data-theme` for `.story-pane` from the selected story's `meta` (with defaults), and apply them.
- [x] 1.3 Add the `story-theme` `SegmentedControl`, seeded from `selected?.meta.theme` and reset via `$effect` on selection change; wire `onchange` to override `.story-pane`'s `data-theme`.
- [x] 1.4 In `Story.svelte`, replace the hardcoded `lunma-glass` on `.preview` with the `:global([data-canvas='neutral'])` plain-card and `:global([data-canvas='aurora'])` glass recipes.
- [x] 1.5 In `Variant.svelte`, apply the same two conditional recipes to `.variant`/`.variant::before`.
- [x] 1.6 Confirm the opaque `--surface` fill covers the `<main>`-level `<Aurora>` (stacking order / `z-index: var(--z-raised)`).

## 2. Verify the core mechanism

- [x] 2.1 Run `pnpm --filter @lunma/extension catalog` and manually check a default story renders neutral+theme-correct in Playground and Examples; the toolbar stays glass-on-aurora.
- [x] 2.2 Manually check `story-theme` flips `.story-pane` independent of `catalog-theme` and resets on selection change.
- [x] 2.3 Manually check Space-hue / colour-intensity still affect a primitive's `--accent` styling on a neutral canvas, in both stage themes.
- [x] 2.4 Run `pnpm --filter @lunma/extension verify:catalog` and fix errors from 1.1–1.5.

## 3. Sweep stories' `background`/`theme`

- [x] 3.1 `Aurora`, `Surface`, `SearchField`, `Toast` set `background: 'aurora'` (glass/glow/aurora identity); all other 33 stories confirmed correct on `neutral`/`dark` defaults (incl. `BottomSheet`, whose scrim is self-contained).

## 4. Author-declared controls (gap 3)

- [x] 4.1 Add `controls?: Controls` to `StoryMeta` (`story.ts`), importing `Controls` from `./controls`; document it like the existing meta fields.
- [x] 4.2 (RED) Add `apps/extension/catalog/lib/resolve-controls.test.ts` covering the three merge rules: author-`controls` floor is included; a derived control of the same name replaces the authored one wholesale; `controlOverrides` patches only named fields; `excludeControls` drops a prop; nothing-derived + `meta.controls` still yields controls.
- [x] 4.3 (GREEN) In `registry.ts`, replace `resolveControls`'s `if (!derived) return {}` with the `{ ...meta.controls, ...derived }` merge keyed by `meta.title`, then `excludeControls` drop + `controlOverrides` patch.
- [x] 4.4 Run `pnpm --filter @lunma/extension verify:catalog`.

## 5. Per-variant + live code (gap 4)

- [x] 5.1 (RED→GREEN) Add `apps/extension/catalog/lib/extract-code.ts` (`extractVariantCode`, `dedent`, `CodeToken`, `generatePlaygroundCode(name, controls, args)` — signature takes `meta.title`, no `componentId` slug-caser) + `extract-code.test.ts` covering variant extraction (literal labels, dedent) and playground-code token emission (default-omission, boolean-bare-attr, `…` children).
- [x] 5.2 Add `apps/extension/catalog/lib/variant-code.ts` (the `codeFor`/`toggle`/`openLabel` Svelte context).
- [x] 5.3 In `Story.svelte`: build `variantCodes` from `source`, set the context, host one full-width drawer below the Examples grid (`{@html}` Shiki output, `vitesse-*` themes), and render live Playground tokens from `generatePlaygroundCode(meta.title, controls, args)`.
- [x] 5.4 In `Variant.svelte`: read the context, render a `</>` trigger (a Lunma `IconButton`, icon `code` or nearest existing) only when `codeFor(label)` exists, calling `toggle(label)`.
- [x] 5.5 In `catalog.css`: add `.cat-tok-tag`/`.cat-tok-attr`/`.cat-tok-str` colours from `@lunma/tokens` semantic vars (following the existing `.shiki` block, gated on `[data-theme='light']`).
- [x] 5.6 Run `pnpm --filter @lunma/extension verify:catalog`.

## 6. Build-exclusion gate (gap 5)

- [x] 6.1 Add `apps/extension/scripts/assert-catalog-excluded.sh`: `pnpm run build`, then `grep -rl` `dist/` for engine markers (`catalog: #app mount target is missing`, `generateDerivedControls`, `defineStory`, `resolveControls`) and `find dist -iname '*catalog*'`; non-zero on any hit.
- [x] 6.2 Add `verify:catalog:build-exclusion` to `apps/extension/package.json` and append it to the `verify:catalog` chain.
- [x] 6.3 Run `pnpm --filter @lunma/extension verify:catalog:build-exclusion` and confirm it passes (catalog absent from `dist/`).

## 7. Theme persistence (gap 6)

- [x] 7.1 In `Catalog.svelte`, read `color`/`tint`/`theme`/`forceReduced` from a single `localStorage` key on init (validating `color ∈ SPACE_COLORS`), and persist them via `$effect`; leave `storyTheme` unpersisted.
- [x] 7.2 Manually check the four axes survive reload and `storyTheme` resets to the story default.

## 8. Information-architecture re-layout (gap 7)

- [x] 8.1 Move the chrome-theme control into a pinned nav footer as a quiet `IconButton` (`moon`/`sun`), keeping `applyThemeToDocument` wiring.
- [x] 8.2 Move the `story-theme` control into a slim topbar beside the selected story's title.
- [x] 8.3 Keep the immersive controls (Space hue, intensity, motion) in the aurora toolbar as the canvas-appearance cluster.
- [x] 8.4 Run `pnpm --filter @lunma/extension verify:catalog` and manually check the three regions + the documented portal caveat (an overlay primitive follows the chrome theme).

## 9. Story-consistency pass (gap 7)

- [x] 9.1 Give the four examples-only stories (`Aurora`, `EntityBadge`, `ResultList`, `ServiceConnectPicker`) a Playground via `meta.controls` where sensible (skip `Aurora` if its intensity truly can't be a naive control — record the reason).
- [x] 9.2 Audited `order:` usage — no story actually declares an `order:` meta field (the port guide's "3 usages" was a false match on `border` in CSS); nothing to remove.

## 10. Nav grouping (gap 7)

- [x] 10.1 Introduce an `Overlay` nav group: set `meta.group: 'Overlay'` on `Menu`, `BottomSheet`, `Toast`, `Tooltip`; confirm `Atoms`/`Composite` shrink coherently and the nav still sorts sensibly.

## 11. Final verification

- [x] 11.1 Run `pnpm --filter @lunma/extension verify:catalog` (now including `verify:catalog:build-exclusion`).
- [x] 11.2 Run `pnpm verify` at the workspace root.
- [x] 11.3 Spot-check in the running catalog: an `aurora` story, three `neutral` stories across groups, an opaque primitive's new Playground, a variant code drawer, the live Playground code, and the nav-footer/topbar IA.
