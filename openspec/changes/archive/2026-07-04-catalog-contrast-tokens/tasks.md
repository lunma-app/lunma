## 1. RED — extend the contrast contract

- [x] 1.1 In `apps/extension/src/ui/contrast.test.ts`, extend the variable-substitution helper to sweep `--space-h` (and keep `--space-chroma`) so accent/hue pairs can be asserted at the worst-case (lightest, e.g. yellow, and deepest, e.g. blue) Space hues, not one fixed hue.
- [x] 1.2 Add asserted pairs (both `:root` dark and `[data-theme='light']`) that FAIL against the current tokens: `--accent-label` vs `--surface`/`--surface-2`/`--bg` ≥4.5:1 at the worst-case Space hues; `--danger-text` vs `--surface`/`--bg-elev` and vs the `--danger-soft` wash over `--bg-elev` ≥4.5:1; `--status-neutral` ≥3:1 vs `--surface`/`--surface-2` as a ring and ≥3:1 as an icon-glyph fill (Avatar uses it as a ring + `clock` glyph, not literal text — the pending-glyph floor is the 3:1 non-text minimum, not 4.5:1); the standalone-control `--border-strong`/`--border-field` vs `--surface`/`--surface-2`/`--bg` ≥3:1; the `FolderRow` count vs `--surface-2` ≥4.5:1 and the `TabRow` `.meta` (`--text-dim`) over the `--space-c-soft` wash ≥4.5:1; the re-rolled per-Space glyph (≥4.5:1) and ring (≥3:1) on light `--surface` at the worst-case hues.
- [x] 1.3 Run `pnpm --filter @lunma/extension test -- contrast` and confirm the new pairs are RED (missing tokens throw from the var lookup; that is acceptable RED — it proves the token is absent).

## 2. GREEN — add the three colour-role tokens

- [x] 2.1 In `packages/tokens/tokens.css` `:root`, add `--accent-label` (Space-hue-following via `--space-h`, lightness tuned to clear 4.5:1 on dark surfaces for every hue — fall back to a `min(L, …)` per-hue cap if no flat L works), `--danger-text` (tuned to 4.5:1 on `--surface`/`--bg-elev` and over `--danger-soft`), and `--status-neutral` (neutral/desaturated status colour on the warm hue, independent of `--text-dim`). One-line comment on each explaining its role vs the adjacent token it is NOT (`--accent-on`, `--danger`/`--danger-soft`, `--text-dim`).
- [x] 2.2 In the `[data-theme='light']` block, add the light-theme expression of all three (accent-label lightness capped low for the light field; danger-text darkened; status-neutral darkened), following the existing light-block rationale comments.
- [x] 2.3 Run the contrast test; iterate the OKLCH lightness of each token until every new token-vs-surface pair passes in both themes. The test pins the numbers.

## 3. GREEN — retarget interactive boundaries (DS-01)

- [x] 3.1 `Button.svelte`: default/idle outline → `--border-strong` (was `--border`/`--border-soft`).
- [x] 3.2 `Chip.svelte`: resting toggle ring → `--border-strong` (was the ad-hoc `color-mix(in oklch, var(--text-faint) 28%, transparent)`).
- [x] 3.3 `SegmentedControl.svelte`: track edge → `--border-strong`.

## 4. GREEN — accent-as-foreground (DS-02)

- [x] 4.1 `IconPicker.svelte`: selected glyph → `--accent-on` (on an accent-filled backing) or `--accent-label` (on a plain surface), whichever matches its backing, instead of `--accent`/`--accent-text`.
- [x] 4.2 `MultiSelect.svelte`: the selected box check (`color: var(--accent-text)`, ~line 640) → `--accent-on`; the Select-all/Clear header action text → `--accent-label`.
- [x] 4.3 `Select.svelte`: selected-option check → `--accent-on` (on the accent fill) / `--accent-label` as appropriate.

## 5. GREEN — destructive text (DS-03)

- [x] 5.1 `InlineError.svelte`: replace the `color-mix(--danger …)` background + `color: var(--danger)` with a `--danger-soft` wash + `color: var(--danger-text)`.
- [x] 5.2 `Menu.svelte`: danger item (`color: var(--danger)`, `color-mix(--danger …)` hover) → `--danger-text` over `--danger-soft`.

## 6. GREEN — informative text on its failing backing (DS-04)

- [x] 6.1 `FolderRow.svelte`: the `.badge` count (`color: var(--text-faint)`, ~line 475) → a token whose floor clears 4.5:1 on `--surface-2` (e.g. `--text-dim`; the contrast test decides).
- [x] 6.2 `TabRow.svelte`: confirm `.meta` (`--text-dim`) clears 4.5:1 when composited over the `--space-c-soft` hover/active wash; if the test shows it fails over the wash, harden the token (or the wash alpha) until it passes. No change if it already passes — the RED assertion in 1.2 is the arbiter.
- [x] 6.3 (No Diffstat task — its numerals are `--success`/`--danger`, already covered by the status-token contract; confirmed with the spec-reviewer.)

## 7. GREEN — per-Space hue re-rolled as foreground/ring (DS-05)

- [x] 7.1 `ColorSwatch.svelte`: the selection ring uses `oklch(calc(var(--swatch-l) + 0.04) …)` (uncapped). Keep the raw inline `--swatch-l` and add a **separately-named** derived property — base `--dot-l: var(--swatch-l)`, then `[data-theme='light'] { --dot-l: min(var(--swatch-l), <cap>) }` — and recompose the ring from `var(--dot-l)`. Do NOT write `--swatch-l: min(var(--swatch-l), …)` (a self-reference cycle → invalid, blanks the colour).
- [x] 7.2 `LensRow.svelte`: it composes `--lens-c` as a complete `oklch(${ok.l} ${ok.c} ${ok.h})` string (~line 78) that CSS cannot cap. Expose the raw lightness as an inline `--lens-l` custom property, add a separately-named derived `--glyph-l` (base `var(--lens-l)`; `[data-theme='light'] { --glyph-l: min(var(--lens-l), <cap>) }`), and recompose the glyph colour in CSS from `--glyph-l` + the chroma/hue parts. Same two-name rule — never cap a property by referencing itself. Cap is theme-scoped — the dark glyph is unchanged.
- [x] 7.3 The contrast unit test recomputes `min()` in JS and CANNOT see whether the CSS cap actually applies (a self-reference cycle would still pass the test) — so verify the light-theme cap renders (colour present and capped, not blank) in the manual catalog pass (§10.3), light theme, at a light Space hue, for both the ColorSwatch ring and the LensRow glyph.

## 8. GREEN — neutral status (DS-25)

- [x] 8.1 `Avatar.svelte`: pending verdict ring (`box-shadow … var(--text-dim)`, ~line 90) + pending `clock` glyph (~line 123) → `--status-neutral`. Update the `ring` JSDoc (`pending → --status-neutral`).

## 9. Stories (per-primitive compliance check)

- [x] 9.1 For each of the 13 touched primitives, open its `catalog/stories/ui/<Name>.stories.svelte` and confirm a variant already renders the retargeted state (Button/Chip/SegmentedControl resting boundary, IconPicker/MultiSelect/Select selection check, InlineError/Menu danger, FolderRow count badge, TabRow meta, ColorSwatch selection ring, LensRow glyph, Avatar `pending` ring). Add or update a variant ONLY where the state is not already exercised. The new colours render automatically on the existing variants; no new prop/axis is introduced (LensRow's `--lens-l` is internal).

## 10. Verify

- [x] 10.1 Run `pnpm --filter @lunma/extension test -- contrast` — all new pairs GREEN.
- [x] 10.2 Run `pnpm verify` at the workspace root (tsc, biome incl. the layer DAG, svelte-check, stylelint token/primitive contract, catalog gate, vitest incl. contrast + story-parity).
- [x] 10.3 Manual catalog pass: `pnpm --filter @lunma/extension catalog` — inspect Button/Chip/SegmentedControl boundaries, IconPicker/MultiSelect/Select selection, InlineError/Menu danger, FolderRow count / TabRow meta (including on hover, over the wash), ColorSwatch ring, LensRow glyph, Avatar pending — at `subtle`/`standard`/`vivid` in both stage themes (light + dark), and in reduced-motion.
- [x] 10.4 Re-diff the two verbatim MODIFIED blocks (Review-lens, MultiSelect) against `openspec/specs/visual-system/spec.md` to confirm only the intended token lines differ, then `openspec validate catalog-contrast-tokens --strict`.
