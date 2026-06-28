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

### D2 — Pure filter logic in `shared/lens-filter.ts`, and `LensEntity` moves to `types.ts`
Both surfaces import `applyLensFilter(...)` and `deriveLensFacets(...)` from
`shared/`. `overview-vm.ts` keeps its launcher-only display helpers (`reposOf`,
`feedsOf`, new `projectsOf`) but delegates the actual predicate to the shared module
so the sidebar can use identical logic.
*Alternative:* duplicate the predicate in `Lens.svelte`. Rejected — guaranteed drift
between two surfaces that must agree by definition.

**Intra-`shared/` cycle (must fix before apply).** `LensFilter` references
`LensEntity`, and the lens `PinNode` (which gains `filter?: LensFilter`) lives in
`shared/types.ts`. But `LensEntity` currently lives in `shared/lens-entity.ts`, which
imports `LensItem`/`LensKind` *from* `types.ts`. Putting `LensFilter` in `types.ts`
while it imports `LensEntity` from `lens-entity.ts` would form
`types.ts → lens-entity.ts → types.ts` — a cycle Biome's `noImportCycles` rejects
(a binding gate). **Resolution:** move the `LensEntity` *type definition* into
`types.ts` and re-export it from `lens-entity.ts` (`export type { LensEntity } from
'./types'`) so existing `import … from '../shared/lens-entity'` sites are unchanged.
`lens-entity.ts` keeps the mapping *functions* (`entityForItem`, …) and imports
`LensEntity` from `types.ts`. Then `LensFilter`/`PinNode.filter` reference
`LensEntity` locally in `types.ts` (no import), and `lens-filter.ts → lens-entity.ts
→ types.ts` is a clean one-way chain.

### D3 — Filter semantics: AND across axes, OR within, scope is per-entity
The predicate operates on `LensRow = { item: LensItem; host: string; feedName?: string }` tuples.
`feedName` carries the article source display-name (populated by callers from
`feedLabel(t) = t.cfg.name ?? hostOf(t.cfg.baseUrl)`), so the feed facet stays in the
view layer and the shared filter stays pure. An item passes iff **both**:
- **type:** `entities` is empty **or** `entityForItem(item) ∈ entities`; and
- **scope (per-entity):**
  - Change: passes iff `repos` is empty **or** `` `${host}/${change.repo}` ∈ repos ``
  - Ticket: passes iff `projects` is empty **or** `ticket.project ∈ projects`
  - Article: passes iff `feeds` is empty **or** `feedName ∈ feeds`; an article with no
    `feedName` is excluded by a non-empty `feeds` filter
  - Other: always passes the scope axis

So selecting a repo narrows Changes without hiding Issues/Articles, and selecting a
feed narrows Articles without hiding Changes/Issues, matching the per-entity mental
model. Within an axis, multiple selected values are OR'd.

**Project-less tickets.** `ticket.project` is optional. A project-less ticket passes
scope only when `projects` is empty; under a non-empty `projects` filter it is
excluded (it matches no selected project — the same rule, applied honestly).
`deriveLensFacets` SHALL drop `undefined` so `projects: string[]` never contains a
hole. Likewise, `feedName`-less articles are dropped from `feeds`.

### D10 — Repo facets are host-scoped (preserve the prior guarantee)
`change.repo` is a bare `owner/repo` slug (`types.ts`), so the same slug on two hosts
would merge into one facet and one selection would filter both — a guarantee the
superseded review-page requirement explicitly held ("the same `owner/repo` on two
hosts never merges"). `LensFilter.repos` therefore stores **host-qualified keys**
(`\`${host}/${owner}/${repo}\``); `deriveLensFacets` emits host-qualified repo
values and the bar may group them by host. Projects are left as bare names (Jira
project keys are account-scoped; cross-host collision is negligible) — host-qualify
later only if a real collision appears (flag as a deviation if added).
*Alternative:* bare slugs + accept the cross-host merge. Rejected — it silently drops
a documented correctness guarantee.

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

### D8 — `Chip` already toggles; the real question is the selected hue
`ui/Chip.svelte` already exposes `selected` + `onToggle` + `aria-pressed`, so the
multi-select facets compose it directly — **no pressed-variant work is needed** (the
original draft mis-framed this). The actual nuance: Chip's selected fill is wired to
the scope accent `--space-c-soft`, **not** to `--lens-fill`/`--lens-ring` (which are
per-row locals set on `LensRow`, not ambient tokens). So `LensFilterBar` SHALL use
Chip's native selected affordance — which on the lens page already resolves to the
lens's owning-Space hue because `LensPage` scopes the Space colour there — rather
than mandating `--lens-fill` (that would force either a re-roll or a feature-level
override of `--space-c-soft`, both forbidden by the component-library policy). If a
distinct lens-tinted selected state is later wanted, it is an additive change to the
`Chip` primitive (a hue/intent prop), not an inline override — out of scope here.

### D9 — Sidebar application point
`displayItemsForSection(cfg)` (`Lens.svelte` ~L252–277) applies `applyLensFilter`
to the merged live+held items **before** `ENTITY_RANK` sort and **before** feed
windowing/`maxItems`, so the cap counts only items that survive the filter.

## Visual language

The filter bar sits between the lens identity row and the first section on the
overview — a single calm row, not a panel. Type facets render first as a `Chip`
group; a `Divider` then the scope facets (repo/project `Chip`s, or a `Select` past
five). Selected chips use `Chip`'s shipped selected affordance (the scope accent
`--space-c-soft`, which on the lens page resolves to the lens's owning-Space hue via
the page token scope) — so "selected" reads consistently with the rest of the
overview without any inline override. Toggles animate at 150–250ms and hold flat
under reduced-motion. Chip labels clear WCAG-AA against both rest and selected fills
at every Colour-intensity level. A "Clear" `IconButton` appears only when a filter is
active.

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

- **Spec reconciliation — RESOLVED (folded in).** The living `lenses` spec described
  the pre-redesign Review-Queue-lanes / generic-grid page while this change describes
  the shipped unified entity-sectioned overview. Per the user's decision this change
  reconciles that in-place: it REMOVES "The review lens renders a Review Queue page"
  and MODIFIES "The page renders all resolved sections" + "The page item is a card
  with optional content slots" to match the shipped overview (doc-only deltas). The
  change-entity normalisation + adapter requirements are unchanged. *(Chip's
  selected/pressed affordance is also no longer an open question — see D8.)*
- Should source facets (multi-source lenses) be folded into `LensFilter.sources` now,
  or left as the retained behaviour from the superseded requirement? (Default: retain
  as-is; add `sources` only if it falls out naturally — flag as a deviation if added.)
