# Tasks — harden-ui-accessibility

Each task names its audit ID(s). Source: `lunma-ui-accessibility-audit.md` (in
this change dir). Per the component-library policy, every touched
`src/ui/*.svelte` primitive updates its `catalog/stories/ui/<Name>.stories.svelte`
and carries Vitest coverage in the same task group. Sequencing follows design D8.

## 1. Tokens & contrast contract (visual-system delta)

- [x] 1.1 Add light-theme `--glass-bg` / `--glass-bg-strong` under `[data-theme='light']` in `packages/tokens/tokens.css` (light low-alpha frosted fill per *Visual language*); confirm a `.lunma-glass` panel reads light in light theme. (THEME-01)
- [x] 1.2 Darken `--border` / `--border-strong` in the dark `:root` and the `[data-theme='light']` block to clear ≥3:1 against `--surface`/`--bg`. (THEME-02)
- [x] 1.3 Re-point `TabRow` `.meta` and the `Menu` section-kind label from `--text-faint` to `--text-dim`; leave `--text-faint` for incidental/decorative/disabled text only; darken light `--text-dim` (L 0.520→0.495) so it clears AA 4.5:1 on every light surface incl. `--surface-3` (agreed deviation, see design D5). (THEME-NEW1)
- [x] 1.4 Extend `apps/extension/src/ui/contrast.test.ts` to parse the `[data-theme='light']` block and gate the light text ramp at its WCAG levels. (THEME-NEW1)
- [x] 1.5 Add contrast assertions: light-theme foreground tokens on the composited `.lunma-glass` surface ≥4.5:1. (THEME-01)
- [x] 1.6 Add non-text contrast assertions: idle `--border`/`--border-strong` vs `--surface`/`--bg` ≥3:1. (THEME-02)
- [x] 1.7 `pnpm --filter @lunma/extension vitest run src/ui/contrast.test.ts` green; visually confirm light glass + borders in the catalog at subtle/standard/vivid.

## 2. New primitive props (additive API) + stories

- [x] 2.1 `Chip`: add `ariaLabel?: string` → toggle button `aria-label`; update `Chip.stories.svelte`. (CATALOG-NEW1)
- [x] 2.2 `Kbd`: add `ariaLabel?: string` → `<kbd aria-label>`; update `Kbd.stories.svelte`. (KBD-01)
- [x] 2.3 `BottomSheet`: add `ariaLabel?: string`; name the headerless dialog (visually-hidden `Dialog.Title` or `aria-label` after the `{...props}` spread); update story. (BOTTOMSHEET-01)
- [x] 2.4 `RowButton`: add `ariaCurrent?: 'page' | 'true' | 'false' | undefined` → `aria-current`; update story. (CAT-01)
- [x] 2.5 `ResultList`: add `ariaLabel?: string` → `role="listbox"` `aria-label`; update story. (RESULTLIST-01)
- [x] 2.6 `ResultRow`: add `tabindex?: number` forwarded to the option button; update story. (RESULTROW-NEW1)
- [x] 2.7 `ReviewerRail`: add `ariaLabel?: string` (names a `role="group"` rail) and give the `+N` overflow badge an explicit accessible name (naming-capable role or visually-hidden text); update story. (REVIEWERRAIL-01, REVIEWERRAIL-02)
- [x] 2.8 `TextInput`: add `required?: boolean` (→ `aria-required`), `describedById?: string` (→ `aria-describedby`), `autocomplete?: string` (→ `autocomplete`); update story. (ACF-02, TI-01, TI-03, API-04)
- [x] 2.9 `InlineError`: add `id?: string` forwarded onto the `<p role="alert">`; update story. (IE-02, ACF-03)

## 3. Accessible names & roles (atoms)

- [x] 3.1 `IconButton`: resolve the accessible name from `ariaLabel`, falling back to `title`; dev-warn when both are absent; update story. (ICONBUTTON-NEW1)
- [x] 3.2 `Tooltip`: add `role="tooltip"` to the content `<div>`; update story. (TOOLTIP-01) Also fixes a pre-existing bits-ui 2.18.1 positioning bug surfaced here — spread the `child` snippet's `wrapperProps` onto an outer wrapper so the bubble anchors to the trigger instead of falling to the bottom of `<body>` (agreed out-of-audit fix, see design D9).
- [x] 3.3 `Diffstat`: label the additions/deletions numerals (visually-hidden text or `role="img"` + `aria-label`), keep the bar `aria-hidden`; update story. (DIFFSTAT-01)
- [x] 3.4 `Avatar`: add a non-colour verdict cue per ring state — reuse the registered `check` (approved) / `circle-alert` (changes) / `clock` (pending) glyphs (the set `ReviewerRail` uses) so no new lucide icon / `gen:icons` regen is needed; update story. (AVATAR-01)
- [x] 3.5 `SearchField`: in `input` mode set `aria-label={ariaLabel ?? placeholder}`; have the default story pass `ariaLabel`. (SF-01)

## 4. Programmatic state — active / busy / drift

- [x] 4.1 `TabRow`: `aria-current="true"` on the title button when `active`; `aria-busy="true"` while `loading` (spinner stays `aria-hidden`); favicon button `tabindex="-1"` when not `returnable`; update story. (TABROW-01, TABROW-02, TABROW-NEW1, API-06)
- [x] 4.2 `LensRow`: `aria-current` on the row when `active`; optional `sr-only` polite live text while `busy`; fold the trailing count into the toggle `aria-label` or pair it with an `sr-only` unit; update story. (LENSROW-01, LENSROW-02, LENSROW-NEW1, API-06)
- [x] 4.3 `FaviconTile`: `aria-busy="true"` while `loading`; `aria-current` when active; drop the prohibited `aria-label` on `.drift-dot` (mark `aria-hidden`) and convey off-home in the button name for the non-returnable drift case; update story. (FAVICONTENT-01, FAVICONTILE-NEW1, FAVICONTILE-NEW2, API-06)
- [x] 4.4 `FolderRow`: `aria-busy="true"` while `busy` (spinner glyph stays `aria-hidden`); update story. (API-06)

## 5. Keyboard operability

- [x] 5.1 `Select`: skip disabled options in `moveTo`/`focusSelectedSoon` roving; add `role="presentation"` to the `<li>` wrappers; update story + test. (SEL-03, SEL-04)
- [x] 5.2 `MultiSelect`: skip disabled options in `moveTo`/`focusOnOpen`; expose the collapsed selection value to AT (`aria-labelledby` over an external label + `.value`, or fold the summary into the trigger name); update story + test. (MS-03, MS-04)
- [x] 5.3 `Toast`: give the container `tabindex="0"` + a visible focus style so a message-only toast can be focused (pause) and Escape-dismissed by keyboard; update `Toast.stories.svelte`; add test. (TOAST-02)

## 6. Status messages (live regions)

- [x] 6.1 `ServiceConnectPicker`: add `tabindex="-1"` + `aria-hidden="true"` to the `sr-only` OPML file input; announce the import-confirm result via `aria-live="polite"`/`role="status"` (or move focus into the revealed panel); update story + test. (SCP-01, SCP-03)
- [x] 6.2 `IconPicker`: render the empty-result and truncation messages in a persistent polite live region; update story + test. (ICONPICKER-NEW1)

## 7. Error associations & option-name wiring (consumers)

- [x] 7.1 `AccountConnectField`: wire `TextInput.describedById` ↔ `InlineError.id` when `error` is set; pass `required` when `requirement === 'required'`; update `AccountConnectField.stories.svelte`. (ACF-02, ACF-03, API-04)
- [x] 7.2 `ResultRow`: wrap the visible `.url` span in `aria-hidden="true"` (keep `title={url}` as the hover tooltip) so the option name announces title + source once. (RESULTLIST-02)
- [x] 7.3 Launcher/new-tab result composition: pass `tabindex="-1"` to `ResultRow` so options aren't individual tab stops under the `aria-activedescendant` model. (RESULTROW-NEW1)

## 8. `label` → `ariaLabel` renames (BREAKING, internal)

- [x] 8.1 `Menu`: rename the name-only `label` prop to `ariaLabel`; update all consumers that set it — `sidebar/TempTabs.svelte`, `sidebar/Lens.svelte`, `sidebar/FaviconRow.svelte`, `sidebar/PinnedTabs.svelte`, `sidebar/SectionHeader.svelte`, `ui/FolderRow.svelte`, `options/ConnectionsCard.svelte` — and `Menu.stories.svelte`. (API-03)
- [x] 8.2 `FolderRow`: rename the name-only `label` prop (FolderRow.svelte:32) to `ariaLabel`; update `FolderRow.stories.svelte` (no surface sets it). (API-03)
- [x] 8.3 `LensRow`: rename the name-only `label` prop (LensRow.svelte:35) to `ariaLabel`; update `LensRow.stories.svelte` (no surface sets it). (API-03)
- [x] 8.4 Add the `label` (visible text, doubles as name) vs `ariaLabel` (name-only) convention to `docs/architecture.md`. (API-03)

## 9. ColorSwatch group role (consumers)

- [x] 9.1 `SpaceEditor.svelte` and `FolderRow.svelte`: change the swatch container `role="radiogroup"` to `role="group"` with an accessible name (valid for `aria-pressed` toggle members); leave the `ColorSwatch` atom unchanged. (COLORSWATCH-01)

## 10. Catalog shell

- [x] 10.1 `Catalog.svelte`: set `aria-current="page"` on the active nav `RowButton` via the new `ariaCurrent` prop (only the selected item). (CAT-01)
- [x] 10.2 `lib/Story.svelte`: pass `ariaLabel={prop}` to the boolean-control `Chip`. (CATALOG-NEW1)
- [x] 10.3 `stories/ui/Tooltip.stories.svelte`: spread the trigger props onto a native focusable `<button>` (not a wrapper `<span>`). (TOOLTIP-NEW1)

## 11. Verification gates

- [x] 11.1 Vitest per touched primitive asserts the new contract (accessible name, `aria-current`/`aria-busy`, roving skips disabled, `role="tooltip"`, `aria-describedby`, live-region presence).
- [x] 11.2 `src/ui/stories-coverage.test.ts` (story-parity) green for every modified `src/ui/*.svelte`.
- [x] 11.3 `pnpm verify` green (tsc, biome incl. layer DAG + import cycles, svelte-check, stylelint, vitest incl. contrast contract + story parity, catalog gate).
- [x] 11.4 `pnpm test:e2e` smoke green.

## 12. Manual live-AT verification (tracked checklist; non-code)

- [ ] 12.1 NVDA+Chrome / VoiceOver+Safari pass on overlays (Tooltip, BottomSheet, Menu): focus return on close, Escape, hover-persistence.
- [ ] 12.2 Confirm `Select`/`MultiSelect` Tab-out lands focus on a sensible element (not `<body>`), and that the `<li>` listitem layer doesn't break option set-size/position. (SEL-04, MS focus)
- [ ] 12.3 Confirm the `Toast` `role="status"` "added-with-content" pattern announces reliably across SR/browser.
- [ ] 12.4 Confirm `Kbd` glyph pronunciation and `Diffstat` `+`/`−` at default punctuation verbosity across NVDA/JAWS/VoiceOver.
- [ ] 12.5 Calibrated-tool contrast spot-checks for the audit's "needs live-AT" pairs (Avatar initials, Chip hue fills, InlineError danger text, TextInput placeholder/invalid border, AccountChip status words).
