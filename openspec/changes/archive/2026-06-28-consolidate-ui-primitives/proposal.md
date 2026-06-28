## Why

Browsing every `src/ui` primitive side by side in the new component catalog (`add-component-catalog`) surfaced redundancy the scattered call sites hid: a primitive with **zero** consumers, two pairs that are one component wearing two hats, and thin one-use wrappers. A leaner, well-propped set is easier to learn, compose, and keep visually consistent — and the catalog is the verification tool that makes shrinking it safe (its coverage guard tracks the set automatically, and each survivor's stories prove it still holds the bar). This delivers user-visible value indirectly through every surface that composes these primitives (sidebar, launcher/new-tab, options, lens overview): fewer, clearer building blocks at the same quality bar.

This is **not** a "merge everything" pass. The constraint is *no complexity creep* — a survivor must stay simple. That is why the row family (`ResultRow`/`LensRow`/`FolderRow`/`TabRow`) and the review primitives (`Avatar`/`ReviewerRail`/`Diffstat`/`CardHeading`) are explicitly **kept**: folding them together would need a 20-prop mega-row, the opposite of the goal.

Depends on `add-component-catalog` (the catalog + its stories-coverage guard are the safety net this change leans on).

## What Changes

- **BREAKING (internal API): Remove `Stack`** — 0 consumers in `src/` (only its own catalog story references it). Delete the primitive, its `*.test.harness.svelte`, its catalog story, and any test.
- **BREAKING (internal API): Merge `Pill` → `Chip`** — both are small inline tokens. `Chip` gains `hue?: number` (OKLCH hue for status/verdict tinting) and `size?: 'sm' | 'md'`; its single `Pill` consumer (`launcher/lenspage/OverviewPage.svelte`) migrates to `Chip`; `Pill` + harness + story are deleted. WCAG-AA contrast across the hue range is preserved (the existing `--accent-text-l`/`--accent-fill-a` theme-aware pattern `Pill` used moves into `Chip`).
- **BREAKING (internal API): Merge `BitsContextMenu` + `BitsMenu` → one `Menu`** — identical `MenuItem[]` model over the same bits-ui base; only the trigger differs. New `Menu` takes a `trigger: 'kebab' | 'context'` (kebab button vs right-click anchor). All 7 consumer sites migrate (`sidebar/Lens`, `sidebar/TempTabs`, `sidebar/PinnedTabs`, `sidebar/FaviconRow`, `sidebar/SectionHeader`, `options/ConnectionsCard`, and the `ui/FolderRow` primitive); both old components + harnesses + stories are deleted; one `Menu` story remains. (`menu-types.ts` already documents the type as belonging to `Menu`.)
- **BREAKING (internal API): Inline `Divider`** (1 consumer, `sidebar/App.svelte`). `Divider` (an `<hr>` + optional trailing-action snippet) is a layout rule, not a re-rolled control, so its one usage is inlined as a plain token-styled rule with its trailing action composed from a primitive; `Divider` + harness + story are deleted. **`RowButton` is KEPT** — folding it into `Button` would need a row-height + favicon-sized leading-icon slot + row-hover wash that `Button`'s children-composition can't replicate, bloating a 21-consumer backbone for one call site (a spec-review finding). It stays a small, purpose-built primitive.
- **Catalog lockstep:** the catalog's `stories-coverage.test.ts` parity guard must stay green as the set shrinks — the removed primitives' stories are deleted and the merged ones' stories updated (`Chip` gains hue/size cells; one `Menu` story replaces the two). No catalog mechanism changes.
- **Docs/spec lockstep:** `docs/architecture.md` component-library list updated (drop `Stack`/`Pill`/`Divider`/`RowMenu`/`ContextMenu`, add `Menu`; `RowButton` kept); the `tab-row-menu`, `spaces-and-tabs`, and `lunma-bookmark-bindings` specs get menu-rename deltas (below), resolving the pre-existing `ContextMenu`/`RowMenu` → `BitsContextMenu`/`BitsMenu` name drift onto one `Menu`.

Net effect: **~40 → ~36** `src/ui` primitives (`Stack`, `Pill`, `Divider` removed; two menus → one `Menu`; `RowButton` kept), no new prop complexity, no behaviour regression at any consumer.

## Capabilities

### New Capabilities
<!-- none — this is a refactor of the existing component library, not a new capability. -->

### Modified Capabilities
The only requirement-level changes are the **menu rename** — `Stack`/`Pill`/`Divider`/`RowButton` and the two menu *files* are not named in any living spec, so their removal/merge is implementation-level, EXCEPT that the menu primitive is referenced normatively (as `ContextMenu` / `RowMenu`) by three specs, which also carry pre-existing name drift (specs say `ContextMenu.svelte`/`RowMenu`; code is `BitsContextMenu.svelte`/`BitsMenu.svelte`). This change resolves that drift to one `Menu` primitive:
- `tab-row-menu`: the floating cursor-anchored pinned-tab menu the requirements call `ContextMenu` becomes the `Menu` primitive with `trigger: 'context'`. Behaviour (cursor anchoring, keyboard/ARIA, two-step delete-confirm, reduced-motion entrance, close-on-tab-removal) is preserved verbatim — only the primitive name consolidates.
- `spaces-and-tabs`: the pinned-header kebab overflow (`RowMenu`) becomes `Menu` with `trigger: 'kebab'`, and the Temporary-list right-click menu (`ContextMenu`) becomes `Menu` with `trigger: 'context'`. **Behaviour-text reconciliation (beyond the rename):** the spec describes the kebab as an "in-place row-morph drawer … NOT a separate floating dropdown," but the shipped code (`BitsMenu` = bits-ui `DropdownMenu`, portaled) is a floating dropdown — pre-existing drift. This change corrects the spec to the shipped reality in the kebab requirements it touches, **and rewrites the "Folder name, icon, and colour are editable" requirement** (a `FolderRow` consumer this change migrates) to match what the code actually does: a kebab **floating dropdown** (`Edit` · `Move up` · `Move down` · `Delete folder`, two-step delete) whose **Edit** item opens a **`BottomSheet`** (name + colour swatches + icon picker), plus inline rename — NOT the "in-place row-morph drawer" the spec described (which was never built). No code behaviour changes; the spec is brought up to the implementation.
- `lunma-bookmark-bindings`: the `FaviconTile` right-click menu — which the spec names as the `apps/extension/src/ui/ContextMenu.svelte` primitive — becomes the `apps/extension/src/ui/Menu.svelte` primitive with `trigger: 'context'`; behaviour unchanged.

(`visual-system` is **not** modified — it names only kept primitives (`Surface`/`Aurora`/`SearchField`, `Avatar`/`Diffstat`/`ReviewerRail`); `Chip` gaining optional `hue`/`size` is backward-compatible and changes no requirement.)

## Impact

- **Removed files:** `apps/extension/src/ui/{Stack,Pill,Divider,BitsContextMenu,BitsMenu}.svelte` (+ their `*.test.harness.svelte`) and the catalog stories `catalog/stories/ui/{Stack,Pill,Divider,BitsContextMenu,BitsMenu}.stories.svelte`. (`RowButton` is kept.)
- **New file:** `apps/extension/src/ui/Menu.svelte` (+ `Menu.test.harness.svelte`, `catalog/stories/ui/Menu.stories.svelte`).
- **Modified primitives:** `Chip.svelte` (gains `hue`/`size`); `FolderRow.svelte` (consumes `Menu` instead of `BitsMenu`). (`Button` is unchanged — `RowButton` stays.)
- **Migrated consumers:** `sidebar/{App,Lens,TempTabs,PinnedTabs,FaviconRow,SectionHeader}.svelte`, `options/ConnectionsCard.svelte`, `launcher/lenspage/OverviewPage.svelte` — and their co-located `*.test.ts` (`Lens`/`PinnedTabs`/`SectionHeader`/`ConnectionsCard`/`App`) which reference the old menu names.
- **Catalog:** 3 stories deleted (`Stack`/`Pill`/`Divider`), 2 menu stories → 1 `Menu` story, `Chip` story extended; coverage guard stays green.
- **New test:** a Chip-hue WCAG-AA contrast test (the moved `Pill` recipe is currently ungated).
- **Dependencies:** none added/removed.
- **Bundle:** smaller (fewer components); MV3 manifest unchanged.
- **Behaviour:** no user-visible regression — each migration preserves the prior rendering and interaction; verified by `pnpm verify` (incl. the existing primitive tests + the catalog guard) and the e2e smoke.
