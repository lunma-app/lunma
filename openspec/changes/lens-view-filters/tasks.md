## 1. Shared model + persistence (backward-compatible, no UI)

- [ ] 1.1 Add `LensFilter` type (`{ entities?: LensEntity[]; repos?: string[]; projects?: string[] }`) and `filter?: LensFilter` on the lens `PinNode` variant in `shared/types.ts`
- [ ] 1.2 Add `LensFilterSchema` and the optional `filter` on the lens `PinNodeSchema` in `shared/schemas.ts`; bump `CURRENT_SCHEMA_VERSION` 13 → 14
- [ ] 1.3 Append the pass-through migration `{ toVersion: 14, migrate: (raw) => raw }` in `shared/migrations.ts`
- [ ] 1.4 Tests: schema round-trip for a lens with a `filter`; pre-14 → 14 pass-through load with no `filter`; empty-filter canonicalisation; schema-to-type coherence

## 2. Shared filter logic

- [ ] 2.1 Create `shared/lens-filter.ts` with pure `applyLensFilter(items, filter)` implementing the D3 semantics (type AND scope; scope per-entity; articles/other pass scope; empty ⇒ identity)
- [ ] 2.2 Add `deriveLensFacets(items)` returning `{ entities, repos, projects }` from the held items (depends only on `entityForItem` + `LensItem`)
- [ ] 2.3 Add `projectsOf(tickets)` to `launcher/lenspage/overview-vm.ts` (peer of `reposOf`/`feedsOf`); delegate the predicate to `shared/lens-filter.ts`
- [ ] 2.4 Unit tests for `applyLensFilter` (each axis, AND/OR, per-entity scope, empty short-circuit) and `deriveLensFacets`

## 3. Bus command + SW handler

- [ ] 3.1 Add the `setLensFilter` command `{ spaceId, folderId, filter }` to `shared/bus.ts`
- [ ] 3.2 Implement the SW handler in `background/` (set/clear `filter`, persist, broadcast) mirroring `setLensHideRead`; no-op/calm error for an unresolved `folderId`
- [ ] 3.3 Tests: dispatch sets + broadcasts; empty filter clears; unresolved folderId is a no-op

## 4. Chip primitive audit

- [ ] 4.1 Audit `ui/Chip.svelte` for a selected/pressed variant (with `aria-pressed`); if absent, add a token-driven `pressed` boolean (additive) + harness/test. Record the finding in the change (deviation note if the contract changes)

## 5. Overview filter bar

- [ ] 5.1 Create `launcher/lenspage/LensFilterBar.svelte` composing `Chip` (type + scope facets), `Select` (scope overflow past 5), `IconButton` (clear), `Divider`; selected state uses the lens-hue affordance
- [ ] 5.2 Render the union of present facets + currently-selected values; show only facets the lens can offer; show Clear only when a filter is active
- [ ] 5.3 Wire `OverviewPage.svelte`: replace the page-local `repoFilter`/`feedFilter` state with reads of `node.filter`, render `LensFilterBar`, narrow sections via `applyLensFilter`, and dispatch `setLensFilter` on toggle/clear
- [ ] 5.4 Component tests: type facet narrows to one section; scope facet → `Select` past threshold; clear resets; absent-but-selected value stays clearable

## 6. Sidebar honours the filter

- [ ] 6.1 Apply `applyLensFilter(node.filter ?? {})` in `Lens.svelte` `displayItemsForSection` before `ENTITY_RANK` sort and before feed windowing/`maxItems`
- [ ] 6.2 Add the quiet "filtered" affordance on a filtered lens section (funnel glyph / muted indicator) that opens the lens overview; none for unfiltered lenses
- [ ] 6.3 Component tests: only matching rows render; cap counts only survivors; affordance shows only when filtered

## 7. Docs + verification

- [ ] 7.1 Update `docs/architecture.md`: the persisted `LensFilter` node field, `shared/lens-filter.ts` placement (and the DAG reason it lives in `shared/`), and the `setLensFilter` command
- [ ] 7.2 `pnpm verify` green (tsc, biome incl. layer DAG, svelte-check, stylelint, vitest); confirm no new primitive re-roll and no cross-layer import
- [ ] 7.3 Manual QA via dev-load: filter on the overview, confirm the sidebar narrows in another window and the filter survives a reload
