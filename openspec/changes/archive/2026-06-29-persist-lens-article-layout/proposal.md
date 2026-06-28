## Why

A reader who switches a lens's Articles section to **List** (because that feed is
text-heavy and the magazine grid wastes space) loses that choice the moment they
leave the lens overview: `articleView` is component-local state that resets to
`grid` on every unmount. The grid/list layout is a per-lens reading preference —
a photo-heavy feed wants grid, a headline feed wants list — and it should stick
the same way the per-lens `filter` (lens-view-filters) and `hideRead` already do.
This change makes the article layout toggle **remembered per lens, across
overview re-opens, windows, and SW restarts** — the user-visible value is that a
lens you've set to List stays List.

This follows directly on `lens-view-filters` (archived), which established the
per-lens-preference pattern (`filter` on the lens node + a `setLensFilter` bus
command). It applies the identical pattern to the one Articles-section control
that was deliberately left ephemeral.

## What Changes

- **The Articles-section layout toggle becomes per-lens persisted.**
  `OverviewPage.svelte` stops holding `articleView` in local `$state` and instead
  reads the lens node's new `articleLayout` field, dispatching a bus command on
  toggle. The **feed filter** and **unread filter** controls in the same section
  stay page-local ephemeral (unchanged) — only the layout axis is persisted.
- **A new optional `articleLayout?: 'grid' | 'list'` field on the lens `PinNode`.**
  Absent means the default (`grid`), identical to today's first-open behaviour.
  It persists with the node and round-trips through `reorderPinned` and SW
  restart. It is a property of the lens (global), not of any window.
- **A `setLensArticleLayout` bus command** + SW handler that sets the resolved
  lens node's `articleLayout`, persists, and broadcasts — mirroring
  `setLensFilter`/`setLensHideRead`. No refetch (a layout change touches no
  source).
- **Schema bump 14 → 15** with an append-only pass-through migration
  (`{ toVersion: 15, migrate: (raw) => raw }`) — the field is additive and
  optional, so no transform is needed.
- **No new UI primitive.** The existing grid/list segmented control in
  `OverviewPage` is reused as-is; only its source of truth changes (local state →
  persisted node field via the bus). No `src/ui/*` primitive is added or
  modified, so no catalog story is involved.

Pre-existing drift noted, not fixed here: the living `storage-and-migrations`
"Versioned local-storage envelope" requirement still reads "current version SHALL
be 13" — `lens-view-filters` added its v14 bump as a separate requirement rather
than editing that sentence. This change follows the same precedent (a new
requirement for v15) and does not touch the stale base sentence.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `lenses`: ADD `articleLayout` as a persisted per-lens field; ADD the
  `setLensArticleLayout` bus-command contract; MODIFY "The Articles entity
  section renders a magazine" so the layout toggle reads/writes the persisted
  per-lens field (the feed filter and unread filter remain ephemeral).
- `storage-and-migrations`: ADD the v15 schema bump + append-only pass-through
  migration that carries the optional `articleLayout` field.

## Impact

- **Schema/migrations**: `apps/extension/src/shared/schemas.ts`
  (`CURRENT_SCHEMA_VERSION` 14 → 15, lens-node schema gains `articleLayout`),
  `apps/extension/src/shared/migrations.ts` (append `{ toVersion: 15 }`).
- **Store**: `apps/extension/src/shared/store.svelte.ts` — add
  `setLensArticleLayout(folderId, layout)` beside `setLensFilter`.
- **Bus**: `apps/extension/src/shared/bus.ts` — add the `setLensArticleLayout`
  command kind, schema, and registration (mirroring `setLensFilter`).
- **Background**: mirroring `setLensFilter`, which lives in
  `apps/extension/src/background/handlers/lenses.ts` (the handler + its return-type
  union) and `apps/extension/src/background/handlers/context.ts` (the
  `SidebarVariant` member), with the coalesce-config entry in
  `apps/extension/src/background/coordinator.ts` — handle `setLensArticleLayout`
  (no refetch), beside `setLensFilter`.
- **UI**: `apps/extension/src/launcher/lenspage/OverviewPage.svelte` (and its
  `LensPage` wiring) — read `articleLayout` from the node, dispatch the command on
  toggle, drop the local `articleView` `$state`.
- **Docs**: update `docs/architecture.md` (or the relevant lens-state doc) where
  per-lens preferences (`filter`, `hideRead`) are described, to list
  `articleLayout` alongside them.
- No dependency changes. No effect on `apps/site` or `packages/tokens`.
