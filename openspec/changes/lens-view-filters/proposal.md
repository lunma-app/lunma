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
  **type facets** (Changes / Issues / Articles / Other — only those present render)
  and **scope facets** (the distinct `change.repo` values for Changes, the distinct
  `ticket.project` values for Issues). Scope facets render as toggle `Chip`s at or
  below a small threshold, otherwise a `Select` (preserving the existing repo-facet
  fallback). A clear affordance resets the lens to "show everything".
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

Out of scope (named, not silently absorbed): the `lenses` spec still describes the
pre-redesign **Review Queue lanes / generic grid** page archetypes (requirements
"The review lens renders a Review Queue page", "The page renders all resolved
sections"). The shipped code already replaced those with the single
entity-sectioned overview. This change writes its filter deltas against that
current unified overview and does **not** reconcile the stale lane/grid
requirements — that belongs to a separate `lens-overview-redesign-reconcile`
change. The reviewer should confirm this scoping.

### Docs

- **Updates:** `docs/architecture.md` — record the new persisted `LensFilter` field
  on the lens node, the `shared/lens-filter.ts` module placement (and why it lives
  in `shared/`, not `launcher/`), and the `setLensFilter` command.
- **Leaves untouched:** `docs/tech-stack.md` (no new dependency or stack change).

### New public types / files / fields

- `LensFilter` (type, `shared/types.ts`): `{ entities?: LensEntity[]; repos?: string[]; projects?: string[] }` — every axis optional; absent/empty ⇒ no narrowing on that axis.
- `PinNode` lens variant gains `filter?: LensFilter` (`shared/types.ts`).
- `LensFilterSchema` + `filter` on the lens `PinNodeSchema` (`shared/schemas.ts`); `CURRENT_SCHEMA_VERSION` 13 → 14; pass-through migration `{ toVersion: 14 }` (`shared/migrations.ts`).
- `shared/lens-filter.ts`: `applyLensFilter(items: LensItem[], filter: LensFilter): LensItem[]` and `deriveLensFacets(items: LensItem[]): { entities: LensEntity[]; repos: string[]; projects: string[] }` (pure, depend only on `entityForItem` + `LensItem`).
- `overview-vm.ts` gains `projectsOf(tickets): string[]` (peer of the existing `reposOf`/`feedsOf`).
- Bus command `setLensFilter` `{ spaceId: SpaceId; folderId: FolderId; filter: LensFilter }` (`shared/bus.ts`) + SW handler (`background/`).
- `launcher/lenspage/LensFilterBar.svelte` — the overview filter-bar feature component.

### Component library

- **Composes existing `ui/` primitives:** `Chip` (toggle facets for types + repos +
  projects), `Select` (scope-facet overflow past the threshold), `IconButton`
  (clear), `Divider` (facet-group separation).
- **New primitives:** none expected. The one risk: if `Chip` has no
  selected/pressed variant, this change adds that variant to the `Chip` primitive
  (a small additive enhancement, proven by use in `LensFilterBar`) rather than
  re-rolling a toggle chip inline. Confirmed/decided in `design.md`.

## Capabilities

### New Capabilities
<!-- none — this extends the existing lenses capability -->

### Modified Capabilities
- `lenses`: replace the Review-only, page-local repo filter requirement with a
  general, persisted overview filter (type + scope facets); add a requirement that
  the sidebar lens listing honours the active filter; extend the lens-node
  persistence requirement to carry the optional `filter` field.
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
