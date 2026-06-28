## 1. MultiSelect primitive

- [x] 1.1 Create `apps/extension/src/ui/MultiSelect.svelte` — dropdown listbox sharing `Select`'s trigger + elevated `Surface` popover, per-row checkbox-square toggle, accent-tinted "engaged" trigger border (no count pill — the count lives in the parent summary; dropped per user feedback), in-popover Clear header, roving keyboard model, `role="listbox"` + `aria-multiselectable`, reduced-motion handling.
- [x] 1.2 Add `mode: 'dropdown' | 'inline'` (default `dropdown`); inline renders an always-open bordered panel with no trigger / popover.
- [x] 1.3 Add the optional `leading` snippet. **Deviation (agreed):** when provided it *stands in for* the row's plain label (the label span is suppressed to avoid duplicating an `AccountChip`'s name); `option.label` still drives search + the option's `aria-label`. Spec/design updated to match.
- [x] 1.4 Add in-popover search composing `SearchField` (`mode="input"`), shown only when `options.length > searchThreshold` (default 8); `ArrowDown` from the field focuses the first visible row; `Escape` closes. **Deviation (agreed, user feedback):** the filter is a case-insensitive **subsequence (fuzzy) match** (not substring) over each option's `label` plus an optional `keywords` field added to `MultiSelectOption` (non-displayed search text). Spec/design/proposal updated.
- [x] 1.5 Add `searchPlaceholder` prop; thread it into the `SearchField`.
- [x] 1.6 Feature (user request): add a `selectAllLabel` prop + an in-popover header **Select all** action (`multi-select-all`) paired with Clear as a select-all ⟷ clear toggle. Select all picks every **enabled** option (union with current, search-independent) and hides once all are selected; Clear hides once none are. New keys `common_selectAll` / `common_deselectAll`; wired into the three overview pickers (with the existing Clear) and the new-lens source picker (Select all + Deselect all). Spec/design/proposal + `MultiSelect.test.ts` + story updated.

## 2. Lens overview overflow (dropdown)

- [x] 2.1 Replace the `>5` `Select` overflow for repos / projects / feeds in `OverviewPage.svelte` with `MultiSelect` (dropdown), wiring `values`/`onchange` to the existing `LensFilter` slices.
- [x] 2.2 Add the missing feed picker `ariaLabel` (`launcher_lensFilterByFeed`).
- [x] 2.3 Parent-computed trigger summary (`scopeLabel`): "All …" / the lone name / `launcher_lensScopeSelected`.
- [x] 2.4 Pass `searchPlaceholder={m.launcher_lensScopeSearch()}` to each overflow `MultiSelect`.
- [x] 2.5 Visual refinement (smoke feedback): the primitive is `width:100%` (consumer-constrained, like the catalog's 16rem wrapper), so wrap each overflow picker in a `.scope-picker` capped at `min(22rem, 100%)` — otherwise the trigger + popover stretch the full card width and a short "N selected" summary looks oversized.
- [x] 2.6 Bug fix (smoke feedback): `LensFilterBar` rendered on `hasTypeFacets || isActive`, so on a single-entity (e.g. feeds-only) lens selecting a scope value popped a standalone clear-`×` into view — a jarring reflow + a stray, misplaced control. Gate the bar on `hasTypeFacets` only (the `×` stays at the end of the type-facet row for multi-entity lenses); scope-only filters clear via the scope control's own Clear. Spec + `LensFilterBar.test.ts` regression updated.

## 3. New-lens editor recompose (lens = all your stuff)

- [x] 3.1 Recompose the `LensEditor.svelte` "Read from" picker onto inline `MultiSelect`: options from `pickerAccounts`, `values`=`selectedOrder`, `leading` renders the source's `AccountChip` (its provider glyph is the row's visible type icon — satisfies the "see the type icon in the list" ask); the inline list root keeps the `smart-source-list` testid; render only when at least one source is connected. Each option also sets `keywords` (provider/type + host) for type-aware fuzzy search.
- [x] 3.2 Drop per-source query selection: remove the filter pills, `queriesById` state, `toggleQuery`, and the `SUGGESTED_QUEUE_NAME`/single-query name path; selecting a source contributes all queries (`QUERY_ORDER` for non-`rss`, `[]` for `rss`) via a pure `queriesFor(provider)` helper used by `confirm`, `resolvedSectionCount`, and the preview. (Removing the suggested-name path left the name field needing a placeholder → new key `sidebar_lensNamePlaceholder`, see 4.6.)
- [x] 3.3 Simplify validation: `canConfirm`/`hint` no longer gate on per-source filters (drop the "pick at least one filter" branch); confirm stays blocked on no-source / incomplete-connect.
- [x] 3.4 Add `searchPlaceholder={m.sidebar_lensSourceSearch()}` to the inline picker.
- [x] 3.5 Update `LensEditor.test.ts` to the new structure (source rows via `MultiSelect` options keyed by account id; remove filter-pill assertions; assert a ticked git source yields all three queries; keep no-source-blocks-confirm; add a fuzzy type-search test).

## 4. i18n

- [x] 4.1 Add `launcher_lensScopeSelected` (`"{count} selected"`) to all 9 `messages/*.json`.
- [x] 4.2 Add `launcher_lensFilterByFeed` (`"Filter by feed"`) to all 9 locales.
- [x] 4.3 Add `launcher_lensScopeSearch` (overview overflow search placeholder) to all 9 locales.
- [x] 4.4 Add `sidebar_lensSourceSearch` (new-lens source-search placeholder) to all 9 locales.
- [x] 4.6 Add `sidebar_lensNamePlaceholder` (name-field placeholder / default name) to all 9 locales — **agreed deviation**: needed once D7 removed the suggested-name path, replacing the prior in-expression `'Lens'` literal that the i18n-no-literal gate now flags as a static attr.
- [x] 4.5 Recompile paraglide (`pnpm --filter @lunma/extension gen:i18n`).

## 5. Catalog story + unit tests

- [x] 5.1 Add `catalog/stories/ui/MultiSelect.stories.svelte` (dropdown variants).
- [x] 5.2 Extend the story with inline-mode, searchable (>8), and `leading`-snippet variants.
- [x] 5.3 Add `MultiSelect.test.ts` + harness covering the dropdown: open, multiselectable, toggle accumulates, Clear, disabled option.
- [x] 5.4 Extend tests: search appears past threshold + fuzzy-filters (incl. subsequence + `keywords` match); inline mode renders no trigger; `leading` snippet stands in for the label (label suppressed, `aria-label` retained); trigger summary carries the count (no count pill).

## 6. Spec coherence (from spec review)

- [x] 6a.1 MODIFY `lenses` "A lens carries an optional view filter" to add the `feeds?: string[]` axis, the Article feed-name scope clause in `applyLensFilter`, the `feedName?` row field, and feed-facet emission in `deriveLensFacets` — reconciling the stale baseline spec to the `feeds` axis already shipped in code by `lens-view-filters` (no code change; verify `lens-filter` tests already cover feeds).
- [x] 6a.2 MODIFY `lenses` "Creating or enabling a lens requests its host origin" to recast the now-unreachable "add a second filter" scenario (per D7) into "adding a source on an already-granted host requests no new origin".
- [x] 6a.3 Confirmed `shared/lens-filter.ts` already implements the feed scope axis (`LensRow.feedName`, `feedSet`) + `deriveLensFacets` feed emission, with feed coverage in `lens-filter.test.ts`. **Bug fix (found during smoke):** `store.setLensFilter`'s `isEmpty` guard omitted `feeds`, so a feeds-only filter was treated as empty and `node.filter` was deleted — feed scope toggles never persisted (round-tripped back empty → checkboxes never filled). Added `feeds` to the guard + a `store.lenses.test.ts` regression test (feeds-only persists; clearing the last feed empties it). Latent since `lens-view-filters` shipped feeds; only reachable now that this change routes >5 feeds through `MultiSelect`.

## 7. Verify

- [x] 6.1 `pnpm --filter @lunma/extension verify` green (tsc, biome incl. layer DAG, svelte-check, stylelint, catalog gate, vitest incl. story-parity).
- [x] 6.2 Manual smoke: a lens with >8 feeds filters by several at once with search; a new lens built from several sources fetches all relation lanes; reduced-motion + keyboard nav hold.
