## Context

Lunma lenses aggregate items from several connectors and repos into one overview
(`launcher/lenspage/OverviewPage.svelte`, the single entity-sectioned page) and one
sidebar listing (`sidebar/Lens.svelte`). Today the overview carries **page-local,
ephemeral** filters only: a repo chip row for Changes and a feed `Select` for
Articles (`OverviewPage.svelte` ~L62–88), dispatching no command and not shared
with the sidebar. The shipped overview already replaced the spec's older "Review
Queue lanes / generic grid" archetypes with the unified entity-sectioned page; the
`lenses` spec lags that redesign (see proposal "Out of scope").

The architecture DAG (Biome-enforced) is the dominant constraint: `sidebar/` may
import `shared/` + `ui/` but **not** `launcher/`, where `overview-vm.ts` lives. Any
logic both surfaces share must sit in `shared/`. Persisted state flows
SW → broadcast → both surfaces; surfaces mutate via bus commands (e.g. the existing
`setLensHideRead`).

## Goals / Non-Goals

**Goals:**
- Let a user narrow a lens by **type** (Changes / Issues / Articles / Other) and by
  **scope** (repo for Changes, project for Issues) from the overview.
- Make that narrowing **persist per lens** and apply on **both surfaces in every
  window**.
- Keep "no filter" as the canonical, zero-cost default — unfiltered lenses behave
  exactly as today.
- Keep the apply/derive logic pure and shared (one source of truth, no drift).

**Non-Goals:**
- Reconciling the stale Review-Queue/grid requirements in the `lenses` spec (a named
  separate change).
- Per-window divergent filters (decided: global per-lens).
- Filtering by author, status, label, age, or full-text search (future facets; the
  `LensFilter` shape is extensible but this change ships type + repo + project).
- Source facets beyond what the superseded requirement already implied (retained for
  multi-source lenses, but not expanded here).

## Decisions

### D1 — The filter lives on the lens `PinNode`, not a parallel map
`filter?: LensFilter` joins `maxItems`/`hideRead`/`refreshMinutes` on the lens node.
It is config-like, global-per-lens, and persisted — the same lifecycle as those
fields, and deletion of the lens removes it for free.
*Alternative considered:* a top-level `AppState.lensFiltersById` map (the explorer's
first sketch). Rejected — it adds a slice that must be pruned when lenses are
deleted and migrated independently, with no benefit over a node field for a
global-per-lens setting.

### D2 — Pure filter logic in `shared/lens-filter.ts`
Both surfaces import `applyLensFilter(items, filter)` and
`deriveLensFacets(items)` from `shared/`. `overview-vm.ts` keeps its launcher-only
display helpers (`reposOf`, `feedsOf`, new `projectsOf`) but delegates the actual
predicate to the shared module so the sidebar can use the identical logic.
*Alternative:* duplicate the predicate in `Lens.svelte`. Rejected — guaranteed drift
between two surfaces that must agree by definition.

### D3 — Filter semantics: AND across axes, OR within, scope is per-entity
An item passes iff **both**:
- **type:** `entities` is empty **or** `entityForItem(item) ∈ entities`; and
- **scope:** a Change passes iff `repos` is empty **or** `change.repo ∈ repos`; a
  Ticket passes iff `projects` is empty **or** `ticket.project ∈ projects`; Articles
  and Other carry no repo/project and **always** pass the scope test (they are
  governed only by the type axis).

So selecting a repo narrows Changes without hiding Issues/Articles, matching the
mental model "repo for changes, project for issues". Within an axis, multiple
selected values are OR'd.

### D4 — Persistence: additive field, schema 13 → 14, pass-through migration
`LensFilterSchema` is `{ entities?, repos?, projects? }` (all optional arrays);
`filter` is `.optional()` on the lens `PinNodeSchema`. `CURRENT_SCHEMA_VERSION`
advances to 14 with an **append-only pass-through migration** (`{ toVersion: 14,
migrate: (raw) => raw }`) — older lens nodes simply lack `filter` and validate
unchanged. The version bump (rather than a silent additive field) keeps
schema-to-type coherence explicit, per the `storage-and-migrations` spec.

### D5 — Empty filter ≡ no filter; "clear" removes it
`{}`, `{ entities: [] }`, and an absent `filter` are all "show everything".
`applyLensFilter` short-circuits to the input array when every axis is empty. The UI
"Clear" control dispatches `setLensFilter` with an empty filter; the SW stores it as
absent (or empty) so persisted state stays canonical.

### D6 — Facets are derived from currently-held items; selections survive absence
`deriveLensFacets` reads the lens's held/live items (the set the surface already
renders). The filter bar renders the **union** of present facet values and currently
selected values, so a transient empty fetch (or a repo that momentarily drops out)
never strands a selection the user can't see to clear. Selected-but-absent values
are kept in the persisted filter (they re-apply when the value returns) and rendered
as deselectable chips.

### D7 — Mutation via a `setLensFilter` command (mirrors `setLensHideRead`)
`dispatch({ kind: 'setLensFilter', payload: { spaceId, folderId, filter } })`; the SW
handler locates the node, sets/clears `filter`, persists, and broadcasts. No new
mutation pattern — it follows the established per-lens-preference command.

### D8 — Chip gains a `pressed` variant if it lacks one
The filter facets are multi-select toggles, so they need a `Chip` with a
selected/pressed state and `aria-pressed`. If `ui/Chip.svelte` already exposes that
(the existing repo chip row suggests a toggle role), `LensFilterBar` composes it as
is; if not, this change adds a `pressed` boolean to the `Chip` primitive (additive,
token-driven, proven by use here) rather than re-rolling a toggle chip inline. The
primitive audit + final decision is recorded at implementation; either way no inline
re-roll is permitted.

### D9 — Sidebar application point
`displayItemsForSection(cfg)` (`Lens.svelte` ~L252–277) applies `applyLensFilter`
to the merged live+held items **before** `ENTITY_RANK` sort and **before** feed
windowing/`maxItems`, so the cap counts only items that survive the filter.

## Visual language

The filter bar sits between the lens identity row and the first section on the
overview — a single calm row, not a panel. Type facets render first as a `Chip`
group; a `Divider` then the scope facets (repo/project `Chip`s, or a `Select` past
the threshold). Selected chips use the lens-hue fill/ring (`--lens-fill` /
`--lens-ring`) so "selected" reads identically to the rest of the overview; toggles
animate at 150–250ms and hold flat under reduced-motion. Chip labels clear WCAG-AA
against both the rest and selected fills at every Colour-intensity level. A "Clear"
`IconButton` appears only when a filter is active.

On the **sidebar**, there is no filter bar (the filter is authored from the
overview), but a narrowed lens must not look like missing data: the lens section
shows a small, quiet **"filtered" affordance** (a funnel glyph / muted count) so the
shorter list reads as intentional. Tapping it opens the lens overview where the
filter can be changed. Motion/contrast rules as above.

## Risks / Trade-offs

- **[Stale-spec confusion]** The `lenses` spec still describes Review-Queue lanes
  the code no longer renders; writing filter deltas against the unified overview
  could read as contradicting those requirements. → The proposal names the
  reconciliation as a separate change and scopes this one to the current overview;
  the spec-reviewer is asked to confirm before apply.
- **[Facet churn]** Connector refetches change the available repos/projects; a naïve
  bar would flicker selections. → D6 renders the union of present + selected and
  never auto-prunes selections.
- **[Sidebar "empty" misread]** A heavily filtered lens could look broken. → D-visual
  adds the explicit sidebar filtered affordance.
- **[Schema risk]** A bad migration could quarantine state. → The migration is a
  pure pass-through (no transform); the new field is optional with a default, so even
  a skipped migration would validate. Covered by a round-trip + migration test.
- **[Scope ambiguity]** Users might expect a repo filter to also hide unrelated
  issues. → D3 documents the per-entity scope rule; the type facets give the user the
  blunt instrument when they want it.

## Migration Plan

1. Land `shared/` additions (type, schema, migration, `lens-filter.ts`, bus command)
   with unit + migration tests — no UI yet, fully backward-compatible.
2. Wire the SW `setLensFilter` handler + broadcast.
3. Add `LensFilterBar` + overview wiring (replacing the local `repoFilter`/`feedFilter`
   state with `node.filter` reads).
4. Apply the filter in the sidebar `displayItemsForSection` + the filtered affordance.
5. Update `docs/architecture.md`.

Rollback: the field is additive and optional; reverting the UI leaves persisted
filters inert (ignored by older readers). No destructive migration to undo.

## Open Questions

- Does `ui/Chip.svelte` already expose a pressed/selected variant, or must D8 add it?
  (Resolved by a quick primitive audit at apply time; recorded in tasks.)
- Should source facets (multi-source lenses) be folded into `LensFilter.sources` now,
  or left as the retained behaviour from the superseded requirement? (Default: retain
  as-is; add `sources` only if it falls out naturally — flag as a deviation if added.)
