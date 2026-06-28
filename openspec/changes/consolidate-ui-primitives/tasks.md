## 1. Remove `Stack` (0 consumers)

- [x] 1.1 Delete `apps/extension/src/ui/Stack.svelte`, `apps/extension/src/ui/Stack.test.harness.svelte`, and any `Stack.test.ts`.
- [x] 1.2 Delete `apps/extension/catalog/stories/ui/Stack.stories.svelte`.
- [x] 1.3 Remove `Stack` from `apps/extension/src/ui/index.ts` (if exported there).
- [x] 1.4 `pnpm --filter @lunma/extension verify` green (esp. the catalog `stories-coverage.test.ts` guard, now 39 primitives).

## 2. Merge `Pill` → `Chip`

- [x] 2.1 Extend `apps/extension/src/ui/Chip.svelte`: add `hue?: number` (OKLCH hue; when set, renders the hue-tinted status/verdict token using the theme-aware `--accent-text-l`/`--accent-fill-a` recipe `Pill` used) and `size?: 'sm' | 'md'`. `hue` and `tone` are mutually exclusive (hue wins); document the prop. The `hue`/`size` path MUST override `Chip`'s base height/padding/font (`--control-h-xs`/`--text-xs`) to match `Pill`'s geometry (no fixed height, `--text-2xs`/`--text-xs 600`) — not just add the colour recipe.
- [x] 2.2 Add a WCAG-AA contrast test for the `Chip` hue recipe (the moved `Pill` recipe is currently ungated — `contrast.test.ts` doesn't cover it and `Pill` has no test). Assert the priority/verdict hues × dark+light themes meet AA, mirroring the existing contrast-test approach.
- [x] 2.3 Migrate the sole `Pill` consumer `apps/extension/src/launcher/lenspage/OverviewPage.svelte`: `<Pill hue={h}>{x}</Pill>` → `<Chip label={x} hue={h} … />` (carry `testid`). Verify every `Pill` usage in that file is migrated.
- [x] 2.4 Delete `apps/extension/src/ui/Pill.svelte` + `Pill.test.harness.svelte` + any `Pill.test.ts`; remove from `index.ts` if exported.
- [x] 2.5 Update `apps/extension/catalog/stories/ui/Chip.stories.svelte`: add hue + size to its controls schema and add example cells (status/verdict hues); delete `apps/extension/catalog/stories/ui/Pill.stories.svelte`.
- [x] 2.6 `pnpm --filter @lunma/extension verify` green; the lens overview renders the status/priority/verdict tokens identically (verify visually given the box-model override).

## 3. Merge `BitsContextMenu` + `BitsMenu` → `Menu`

- [x] 3.1 Add `apps/extension/src/ui/Menu.svelte`: the FULL shared surface both menus carry today (`items: MenuItem[]`, `label?`, `headerKind?`, `headerTitle?`, `testid?`, bindable `open?`, `onOpenChange?`) + the new `trigger: 'kebab' | 'context'`. `kebab` renders the kebab `IconButton` trigger (`icon?`, `label?`) as a **floating dropdown** (bits-ui `DropdownMenu`, portaled, `align="end"` — matching today's `BitsMenu`, NOT a morph); `context` takes the right-clickable region as `children` (spread trigger props), cursor-anchored. Branch internally to the matching bits-ui base (`DropdownMenu` vs `ContextMenu`). Do NOT add `panel`/`panelTitle` props (drill-in is data-driven via `MenuItem.submenu`). Preserve the `tab-row-menu` contract verbatim (anchoring, keyboard/ARIA, two-step delete-confirm, reduced-motion entrance, collision-clamping, close-on-tab-removal).
- [x] 3.2 Add `apps/extension/src/ui/Menu.test.harness.svelte` (covering both triggers) and port the `BitsContextMenu`/`BitsMenu` tests to `Menu`.
- [x] 3.3 Migrate the 4 `context` consumers: `sidebar/Lens.svelte`, `sidebar/TempTabs.svelte`, `sidebar/PinnedTabs.svelte`, `sidebar/FaviconRow.svelte` → `<Menu trigger="context" …>`. Update their co-located tests that name the old menu (`Lens.test.ts`, `PinnedTabs.test.ts`).
- [x] 3.4 Migrate the 3 `kebab` consumers: `sidebar/SectionHeader.svelte`, `options/ConnectionsCard.svelte`, and the primitive `src/ui/FolderRow.svelte` → `<Menu trigger="kebab" …>`. Update their co-located tests (`SectionHeader.test.ts`, `options/ConnectionsCard.test.ts`, and `sidebar/App.test.ts` if it references the menu).
- [x] 3.5 Delete `BitsContextMenu.svelte` + `BitsMenu.svelte` (+ their `*.test.harness.svelte` + any tests); remove from `index.ts` if exported.
- [x] 3.6 Catalog: add `apps/extension/catalog/stories/ui/Menu.stories.svelte` (controls: `trigger`, `icon`, `label`, `headerKind`, `headerTitle`; examples for both triggers); delete `BitsContextMenu.stories.svelte` + `BitsMenu.stories.svelte`.
- [x] 3.7 `pnpm --filter @lunma/extension verify` + `pnpm test:e2e` green; the pinned/temp/favicon menus and the kebab overflows behave identically.

## 4. Inline `Divider` (keep `RowButton`)

- [x] 4.1 Migrate `sidebar/App.svelte`: inline the one `Divider` usage as a plain token-styled rule (`<hr>` with token border/spacing) with its trailing action composed from a primitive. (`RowButton` stays — do NOT fold it into `Button`; see design D4/R4.)
- [x] 4.2 Delete `apps/extension/src/ui/Divider.svelte` + `Divider.test.harness.svelte` + any `Divider.test.ts`; remove from `index.ts` if exported. Leave `RowButton.svelte` untouched.
- [x] 4.3 Catalog: delete `catalog/stories/ui/Divider.stories.svelte`. (Keep `RowButton.stories.svelte`.)
- [x] 4.4 `pnpm --filter @lunma/extension verify` green; the sidebar divider renders identically.

## 5. Docs + spec deltas + final verification

- [x] 5.1 `docs/architecture.md`: update the `src/ui` component-library list — drop `Stack`/`Pill`/`Divider`/`RowMenu`/`ContextMenu`, add `Menu`; note `Chip` gains `hue`/`size`. (`RowButton` is KEPT; `Button` unchanged.)
- [x] 5.2 Confirm the three menu-rename spec deltas (`tab-row-menu`, `spaces-and-tabs`, `lunma-bookmark-bindings`) match the implemented `Menu` API + `trigger` values. The `spaces-and-tabs` delta additionally (a) corrects the kebab overflow requirements' "in-place row-morph drawer / NOT a floating dropdown" language to the shipped **floating dropdown** reality, and (b) rewrites the "Folder name, icon, and colour are editable" requirement to the actual UI — a kebab floating dropdown (Edit · Move up · Move down · Delete folder, two-step delete) whose **Edit** opens a **BottomSheet** (name + colour swatches + icon picker) + inline rename — since the code never implemented the described morph. Confirm the rewritten requirement matches `FolderRow.svelte`. `openspec validate consolidate-ui-primitives` passes.
- [x] 5.3 Confirm the catalog `stories-coverage.test.ts` guard is green against the final ~35-primitive set (one story per surviving primitive; `Menu` present; removed ones gone).
- [x] 5.4 Full `pnpm verify` (workspace) green + `pnpm test:e2e` smoke; `pnpm --filter @lunma/extension build` (MV3) succeeds and is smaller (fewer components, no behaviour change).
- [x] 5.5 Run `openspec-verify-change`; ensure docs/artifacts/code agree.
