## Why

A lens that aggregates several repos and connectors gets noisy fast: the overview
lists every Change, Issue, and Article at once, and the sidebar lists the same
unfiltered set. When a user wants "just the issues on `payments-api` right now",
they have to scan past everything else on both surfaces. This change lets a user
**narrow a lens to what matters** — by item type (Changes / Issues / Articles /
Other) and by repo or project — directly on the overview page, and have that same
narrowing **quietly scope the lens's items in the sidebar** so the two surfaces
never disagree. The filter is **sticky per lens** (a deliberate choice — a lens
you've focused stays focused across restarts) and **applies in every window**
(the filter is a property of the lens, not of one viewport).

This supersedes today's page-local, Review-only repo filter with a general,
persisted one that both the overview and the sidebar respect.

## What Changes

- **A filter bar on the unified lens overview** (`OverviewPage.svelte`): toggleable
  **type facets** (Changes / Issues / Articles / Other, mapping to the `LensEntity`
  values `change` / `ticket` / `article` / `generic` — only those present render)
  and **scope facets** (the distinct `change.repo` values for Changes, the distinct
  `ticket.project` values for Issues). Repo facets are **scoped per source host** so
  the same `owner/repo` on two hosts never merges into one facet (preserved from the
  prior review-page behaviour, which `change.repo` alone would lose). Scope facets
  render as toggle `Chip`s when there are **five or fewer** of a kind, otherwise a
  `Select`. This replaces the current inline `chip-btn` repo buttons in
  `OverviewPage` with the `Chip` primitive (removing a re-roll); the Chip↔Select
  threshold is new to this surface. A clear affordance resets the lens to "show
  everything".
- **The filter is persisted per-lens and global across windows.** A new optional
  `filter: LensFilter` field on the lens `PinNode` holds the selected facets; an
  absent/empty filter means "no narrowing" (identical to today's behaviour).
- **The sidebar honours the same filter.** `Lens.svelte`'s per-section item
  listing applies the lens's filter before rendering, so a filtered lens shows only
  matching rows in the side panel.
- **A shared filter module** `shared/lens-filter.ts` holds the pure
  apply/derive logic so BOTH the launcher overview and the sidebar can use it
  without crossing the import DAG (the sidebar may not import `launcher/`).
- **A `setLensFilter` bus command** + SW handler persists the filter, mirroring the
  existing `setLensHideRead` per-lens mutation; the broadcast carries it to both
  surfaces.
- **Schema bump 13 → 14** with an append-only pass-through migration (the new field
  is additive and defaults to empty).
- **BREAKING (spec-level):** the requirement *"The review page filters changes by
  source and repo"* (page-local ephemeral, Review-only, source+repo) is replaced by
  a general *"The lens overview filters items by type and scope"* requirement that
  is **persisted** and **shared with the sidebar**. Source facets are retained for
  multi-source lenses.

- **Spec reconciliation (folded in).** The `lenses` spec still described the
  pre-redesign **Review Queue lanes / generic grid** page; the shipped code already
  replaced those with the single entity-sectioned overview. This change reconciles
  that lag **in the same change** (so the filter deltas don't archive into a
  self-contradictory spec): it REMOVES "The review lens renders a Review Queue page"
  (the separate archetype no longer exists — only `LensPage` + `OverviewPage`) and
  MODIFIES "The page renders all resolved sections" and "The page item is a card with
  optional content slots" to describe the unified overview. These are
  **documentation-only** deltas describing already-shipped behaviour — no code change
  beyond the filter feature itself.

### Docs

- **Updates:** `docs/architecture.md` — record the new persisted `LensFilter` field
  on the lens node, the `shared/lens-filter.ts` module placement (and why it lives
  in `shared/`, not `launcher/`), and the `setLensFilter` command.
- **Leaves untouched:** `docs/tech-stack.md` (no new dependency or stack change).

### New public types / files / fields

- **`LensEntity` relocates** from `shared/lens-entity.ts` to `shared/types.ts`, re-exported from `lens-entity.ts` so existing import sites are unchanged. Required to avoid a `types.ts → lens-entity.ts → types.ts` import cycle (Biome `noImportCycles`) once `LensFilter` — which references `LensEntity` — lives next to the lens `PinNode`. `lens-entity.ts` keeps the mapping functions and imports `LensEntity` from `types.ts`.
- `LensFilter` (type, `shared/types.ts`): `{ entities?: LensEntity[]; repos?: string[]; projects?: string[]; feeds?: string[] }` — every axis optional; absent/empty ⇒ no narrowing on that axis.
- `PinNode` lens variant gains `filter?: LensFilter` (`shared/types.ts`).
- `LensFilterSchema` + `filter` on the lens `PinNodeSchema` (`shared/schemas.ts`); `CURRENT_SCHEMA_VERSION` 13 → 14; pass-through migration `{ toVersion: 14 }` (`shared/migrations.ts`).
- `shared/lens-filter.ts`: `LensRow = { item, host, feedName? }`. `applyLensFilter(rows: LensRow[], filter: LensFilter)` and `deriveLensFacets(rows: LensRow[]): { entities, repos, projects, feeds }` (pure; depend only on `entityForItem` + `LensItem`). The `{ item, host }` pair lets repo facets stay host-scoped; `feedName` carries the display-name for article rows (populated by callers from `feedLabel(t)`). `deriveLensFacets` drops project-less tickets from `projects` and feedName-less articles from `feeds`. Clean DAG: `lens-filter.ts → lens-entity.ts → types.ts`.
- `overview-vm.ts` gains `projectsOf(tickets): string[]` (peer of the existing `reposOf`/`feedsOf`).
- Bus command `setLensFilter` `{ spaceId: SpaceId; folderId: FolderId; filter: LensFilter }` (`shared/bus.ts`) + SW handler (`background/handlers/lenses.ts`) delegating to a new `store.setLensFilter(folderId, filter)` method (`shared/store.svelte.ts`), mirroring `store.setLensHideRead`.
- `launcher/lenspage/LensFilterBar.svelte` — the overview filter-bar feature component.

### Component library

- **Composes existing `ui/` primitives:** `Chip` (toggle facets for types + repos +
  projects — it already exposes `selected` + `onToggle` + `aria-pressed`, so no
  pressed-variant work is needed), `Select` (scope-facet overflow past five),
  `IconButton` (clear), `Divider` (facet-group separation).
- **New primitives:** none. The only nuance is the *selected-chip hue*: the shipped
  `Chip` paints its selected state from the scope accent (`--space-c-soft`), not from
  the per-row `--lens-fill`/`--lens-ring` locals. `LensFilterBar` therefore uses the
  `Chip`'s native selected affordance (which on the lens page already resolves to the
  lens's owning-Space hue via the page token scope) — it does NOT override
  `--space-c-soft` from the feature, and does NOT re-roll a toggle chip. See
  `design.md` D8 / Visual language.

## Capabilities

### New Capabilities
<!-- none — this extends the existing lenses capability -->

### Modified Capabilities
- `lenses`: replace the Review-only, page-local repo filter requirement with a
  general, persisted overview filter (type + scope facets); add a requirement that
  the sidebar lens listing honours the active filter; extend the lens-node
  persistence requirement to carry the optional `filter` field. Also reconcile the
  shipped unified overview: REMOVE the separate "Review Queue page" archetype and
  MODIFY the page-structure + result-unit requirements to match (doc-only deltas for
  already-shipped behaviour).
- `storage-and-migrations`: the schema version advances to 14 with an append-only
  migration; the new persisted `filter` field validates under the current-version
  schema and round-trips.

## Impact

- **Code:** `shared/types.ts`, `shared/schemas.ts`, `shared/migrations.ts`,
  `shared/bus.ts`, new `shared/lens-filter.ts`; `background/` lens command handler;
  `launcher/lenspage/OverviewPage.svelte` (replaces local `repoFilter`/`feedFilter`
  state with `node.filter` reads + `setLensFilter` dispatch), `overview-vm.ts`, new
  `launcher/lenspage/LensFilterBar.svelte`; `sidebar/Lens.svelte`
  (`displayItemsForSection` applies the filter); `ui/Chip.svelte` (only if a
  pressed/selected variant is needed).
- **Persistence:** one additive optional field on the lens node; schema 13 → 14.
  Forward-compatible — older states load with no filter (current behaviour).
- **Behaviour:** no change for lenses a user never filters. A filtered lens shows
  the narrowed set on both the overview and the sidebar, in every window, across
  restarts.
- **Tests:** unit tests for `applyLensFilter`/`deriveLensFacets` and the migration;
  component tests for `LensFilterBar`, the overview wiring, and the sidebar
  `displayItemsForSection` filter application; a schema round-trip test.
