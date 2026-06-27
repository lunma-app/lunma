## ADDED Requirements

### Requirement: A lens carries an optional view filter

A lens `PinNode` SHALL carry an optional `filter?: LensFilter` field, where
`LensFilter` is `{ entities?: LensEntity[]; repos?: string[]; projects?: string[] }`
and every axis is optional. The field is **additive and backward-compatible**: an
absent `filter`, an empty object, and a filter whose every array is empty are all
equivalent and mean "no narrowing" (identical to a lens that has never been
filtered). The `filter` SHALL persist with the rest of the node configuration and
round-trip losslessly through `reorderPinned` and a SW restart. It is a property of
the lens (global), not of any window.

`applyLensFilter(items: LensItem[], filter: LensFilter): LensItem[]` (in
`shared/lens-filter.ts`) SHALL be the single, pure predicate both surfaces use, so
the overview and the sidebar always agree. An item passes iff **both** axes pass:
- **type:** `entities` empty **or** `entityForItem(item) ∈ entities`; and
- **scope:** a Change passes iff `repos` empty **or** `change.repo ∈ repos`; a
  Ticket passes iff `projects` empty **or** `ticket.project ∈ projects`; Article and
  Other items carry no repo/project and SHALL always pass the scope axis (governed by
  the type axis alone).

When every axis is empty, `applyLensFilter` SHALL return the input unchanged.

#### Scenario: A lens persists its view filter across restart

- **WHEN** the SW boots with a persisted lens whose node carries `filter: { entities: ['ticket'], projects: ['Payments'] }`
- **THEN** the node is restored with that `filter` intact and validates under the current-version schema

#### Scenario: An absent filter means show everything

- **GIVEN** a lens node with no `filter` field
- **WHEN** `applyLensFilter(items, node.filter ?? {})` runs
- **THEN** it returns `items` unchanged

#### Scenario: Scope narrows its own entity only

- **GIVEN** a lens holding Changes in `o/a` and `o/b`, Issues in project `Pay`, and Articles
- **WHEN** the filter is `{ repos: ['o/a'] }`
- **THEN** only `o/a` Changes survive, while all Issues and all Articles still pass (repo scope does not touch tickets or articles)

### Requirement: The lens overview filters items by type and scope

The lens overview page SHALL render a **filter bar** between the lens identity and
the first section. The bar SHALL offer **type facets** — one toggle per entity
present in the lens (Changes / Issues / Articles / Other) — and **scope facets** —
the distinct `change.repo` values (for Changes) and `ticket.project` values (for
Issues). Scope facets SHALL render as toggle chips when there are five or fewer of a
kind, otherwise as a `Select`. The bar SHALL render only facets that the lens can
offer (no Articles toggle for a lens with no articles); facet values SHALL be the
union of values present in the held items and values currently selected, so a
selection is never stranded by a transient empty fetch. The bar SHALL show a
**clear** control only while a filter is active.

Toggling a facet SHALL update the lens filter through the `setLensFilter` command
(persisted, not page-local), and the overview SHALL re-render the narrowed set via
`applyLensFilter`. The filter bar SHALL compose existing `ui/` primitives (`Chip`,
`Select`, `IconButton`, `Divider`) and SHALL NOT re-roll a toggle chip inline.
Selected facets SHALL read with the lens-hue selected affordance and hold under
reduced-motion and WCAG-AA at every Colour-intensity level.

#### Scenario: Type facets render only for present entities

- **GIVEN** a lens with Changes and Issues but no Articles
- **WHEN** the overview renders
- **THEN** the bar shows Changes and Issues type facets and no Articles facet

#### Scenario: A type facet narrows the overview

- **GIVEN** a lens showing Changes, Issues, and Articles
- **WHEN** the user selects the Issues type facet only
- **THEN** only the Issues section renders and `setLensFilter` is dispatched with `entities: ['ticket']`

#### Scenario: Scope facets fall back to a Select past the threshold

- **WHEN** the Changes in a lens span more than five distinct `change.repo` values
- **THEN** the repo scope facet renders as a `Select` rather than a chip row

#### Scenario: Clearing resets the lens to everything

- **GIVEN** a lens with an active filter
- **WHEN** the user activates Clear
- **THEN** `setLensFilter` is dispatched with an empty filter and the overview shows every item again

#### Scenario: A selected value absent from the current fetch stays clearable

- **GIVEN** a persisted filter `repos: ['o/gone']` where `o/gone` is absent from the latest items
- **WHEN** the bar renders
- **THEN** an `o/gone` chip still renders (selected) so the user can deselect it, and it is not auto-pruned from the persisted filter

### Requirement: The sidebar lens listing honours the active filter

The sidebar lens listing SHALL apply the lens's `filter` (via `applyLensFilter`)
to each section's merged live + held items **before** the `ENTITY_RANK` sort and
**before** feed windowing / `maxItems`, so the per-section cap counts only items that
survive the filter. A lens with an active filter SHALL render a quiet **filtered
affordance** in its sidebar section (a funnel glyph / muted indicator) so the
narrowed list reads as intentional rather than as missing data; activating it SHALL
open the lens overview where the filter is authored. An unfiltered lens SHALL render
exactly as before this change (no affordance, no narrowing).

#### Scenario: The sidebar shows only matching rows

- **GIVEN** a lens filtered to `entities: ['change'], repos: ['o/a']`
- **WHEN** the sidebar renders the lens
- **THEN** only `o/a` Change rows appear; Issues, Articles, and other repos' Changes are absent

#### Scenario: The cap counts only surviving items

- **GIVEN** a feed lens with `maxItems: 5` and a filter that excludes most items
- **WHEN** the sidebar windows the section
- **THEN** the cap is applied to the filtered items, not the pre-filter set

#### Scenario: A filtered lens shows the filtered affordance

- **GIVEN** a lens with an active filter
- **WHEN** the sidebar renders it
- **THEN** a quiet filtered affordance appears on the section; an unfiltered lens shows none

### Requirement: Setting a lens filter persists through a bus command

The SW SHALL handle a `setLensFilter` command — payload `{ spaceId: SpaceId; folderId: FolderId; filter: LensFilter }` — by setting the resolved lens node's `filter`, persisting, and broadcasting the updated state, mirroring the existing per-lens preference mutation (`setLensHideRead`). An empty filter SHALL clear the field so persisted state stays canonical. The command SHALL be a no-op (or calm error) when the `folderId` does not resolve to a lens.

#### Scenario: Dispatching setLensFilter persists and broadcasts

- **WHEN** `setLensFilter` is dispatched with `filter: { entities: ['ticket'] }` for an existing lens
- **THEN** the node's `filter` is set, the state is persisted, and the new state is broadcast to all surfaces

#### Scenario: An empty filter clears the field

- **WHEN** `setLensFilter` is dispatched with an empty filter
- **THEN** the node's `filter` is cleared (absent/empty) and the lens shows everything again

## REMOVED Requirements

### Requirement: The review page filters changes by source and repo

**Reason**: Superseded by the general, persisted overview filter. Filtering is no
longer Review-only, no longer limited to source + repo facets, and no longer
page-local ephemeral state — it now covers type + repo + project facets across the
unified overview, persists on the lens node, and is shared with the sidebar.

**Migration**: The source/repo narrowing behaviour is subsumed by the new
requirements "A lens carries an optional view filter", "The lens overview filters
items by type and scope", and "The sidebar lens listing honours the active filter".
Source facets for multi-source lenses are retained as existing behaviour pending a
future `LensFilter.sources` axis; no persisted data migration is required because the
old filter was never persisted.
