## 1. Shared model + persistence (backward-compatible, no UI)

- [x] 1.1 Move the `LensEntity` type into `shared/types.ts` and re-export it from `shared/lens-entity.ts` (`export type { LensEntity } from './types'`); keep the mapping functions in `lens-entity.ts` importing `LensEntity` from `types.ts` (avoids the `types.ts ↔ lens-entity.ts` cycle — blocker #1). Confirm `biome check` (`noImportCycles`) passes.
- [x] 1.2 Add `LensFilter` type (`{ entities?: LensEntity[]; repos?: string[]; projects?: string[]; feeds?: string[] }`) and `filter?: LensFilter` on the lens `PinNode` variant in `shared/types.ts`
- [x] 1.3 Add `LensFilterSchema` and the optional `filter` on the lens `PinNodeSchema` in `shared/schemas.ts`; bump `CURRENT_SCHEMA_VERSION` 13 → 14
- [x] 1.4 Append the pass-through migration `{ toVersion: 14, migrate: (raw) => raw }` in `shared/migrations.ts`
- [x] 1.5 Tests: schema round-trip for a lens with a `filter` (host-qualified repo key); pre-14 → 14 pass-through load with no `filter`; empty-filter canonicalisation; schema-to-type coherence

## 2. Shared filter logic

- [x] 2.1 Create `shared/lens-filter.ts` with pure `applyLensFilter(rows: LensRow[], filter)` implementing the D3 semantics (type AND scope; host-qualified repo keys; per-entity scope; empty ⇒ identity). `LensRow = { item, host, feedName? }` — callers populate `feedName` from `feedLabel(t)`.
- [x] 2.2 Add `deriveLensFacets(rows)` returning `{ entities, repos, projects, feeds }` (host-qualified repos; drop `undefined` projects; drop feedName-less articles from feeds); depends only on `entityForItem` + `LensItem`
- [x] 2.3 Add `projectsOf(tickets)` to `launcher/lenspage/overview-vm.ts` (peer of `reposOf`/`feedsOf`); delegate the predicate to `shared/lens-filter.ts`
- [x] 2.4 Unit tests for `applyLensFilter` (each axis, AND/OR, per-entity scope, host-scoped repos, project-less ticket, empty short-circuit) and `deriveLensFacets`

## 3. Bus command + SW handler

- [x] 3.1 Add the `setLensFilter` command `{ spaceId, folderId, filter }` to `shared/bus.ts`
- [x] 3.2 Add `store.setLensFilter(folderId, filter)` to `shared/store.svelte.ts` (set/clear the node `filter`), mirroring `store.setLensHideRead`
- [x] 3.3 Implement the SW handler in `background/handlers/lenses.ts` delegating to `store.setLensFilter`, persist + broadcast; no-op/calm error for an unresolved `folderId`
- [x] 3.4 Tests: dispatch sets + broadcasts; empty filter clears; unresolved folderId is a no-op

## 4. Chip primitive

- [x] 4.1 Confirm `ui/Chip.svelte` exposes `selected` + `onToggle` + `aria-pressed` (it does) — no pressed-variant work. Verify its selected fill (`--space-c-soft`) reads correctly within the lens-page token scope; if a distinct lens-tinted selected state is wanted, that is a separate additive `Chip` change, NOT an inline override (flag as a deviation before doing it)

## 5. Overview filter bar

- [x] 5.1 Create `launcher/lenspage/LensFilterBar.svelte` composing `Chip` (type + scope facets), `Select` (scope overflow past 5), `IconButton` (clear), `Divider`; selected state uses the lens-hue affordance
- [x] 5.2 Render the union of present facets + currently-selected values; show only facets the lens can offer; show Clear only when a filter is active
- [x] 5.3 Wire `OverviewPage.svelte`: replace the page-local `repoFilter`/`feedFilter` state with reads of `node.filter`, render `LensFilterBar` (entity chips) + per-card scope filters (repo in Changes, project in Issues, feed in Articles), narrow sections via `applyLensFilter`, and dispatch `setLensFilter` on toggle/clear
- [x] 5.4 Component tests: type facet narrows to one section; scope facet → `Select` past threshold; clear resets; absent-but-selected value stays clearable; feed chips in Articles card; scope isolation between cards

## 6. Sidebar honours the filter

- [x] 6.1 Apply `applyLensFilter(node.filter ?? {})` in `Lens.svelte` `displayItemsForSection` before `ENTITY_RANK` sort and before feed windowing/`maxItems`
- [x] 6.2 Add the quiet "filtered" affordance on a filtered lens section (funnel glyph / muted indicator) that opens the lens overview; none for unfiltered lenses
- [x] 6.3 Component tests: only matching rows render; cap counts only survivors; affordance shows only when filtered

## 7. Docs + verification

- [x] 7.1 Update `docs/architecture.md`: the persisted `LensFilter` node field, `shared/lens-filter.ts` placement (and the DAG reason it lives in `shared/`), and the `setLensFilter` command
- [x] 7.2 Confirm the folded reconciliation deltas (REMOVED "Review Queue page"; MODIFIED "page renders all resolved sections" + "page item is a card") accurately describe the SHIPPED `LensPage`/`OverviewPage` — these are doc-only, no code change beyond the filter feature; cross-check against `OverviewPage.test.ts`
- [x] 7.3 `pnpm verify` green (tsc, biome incl. layer DAG + `noImportCycles`, svelte-check, stylelint, vitest); confirm no new primitive re-roll and no cross-layer import
- [x] 7.4 Manual QA via dev-load: filter on the overview, confirm the sidebar narrows in another window and the filter survives a reload
