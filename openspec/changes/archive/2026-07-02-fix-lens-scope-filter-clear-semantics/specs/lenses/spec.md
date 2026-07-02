## MODIFIED Requirements

### Requirement: A lens carries an optional view filter

A lens `PinNode` SHALL carry an optional `filter?: LensFilter` field, where
`LensFilter` is `{ entities?: LensEntity[]; repos?: string[]; projects?: string[]; feeds?: string[] }`
and every axis is optional. The field is **additive and backward-compatible**: an
absent `filter` and an empty object (`{}`) are equivalent and mean "no narrowing on
any axis" (identical to a lens that has never been filtered). Per axis, an **absent**
key (the axis was never set) means "no constraint on this axis" — every row passes
that axis regardless of value, including values that appear later. An axis present
as an **explicit empty array** (`[]`) means "matches nothing on this axis" — every
row is excluded by that axis. These two states are no longer equivalent: `{}` (or a
`filter` with no `feeds` key) shows every Article; `{ feeds: [] }` shows none. The
`filter` SHALL persist with the rest of the node configuration and round-trip
losslessly through `reorderPinned` and a SW restart. It is a property of the lens
(global), not of any window.

`applyLensFilter` (in `shared/lens-filter.ts`) SHALL be the single, pure predicate
both surfaces use, so the overview and the sidebar always agree. It operates on
`{ item: LensItem; host: string; feedName?: string }` rows (each surface supplies the
host from its source config and the feed name for an article) so repo facets stay
host-scoped and feed facets match by feed name. A row passes iff **both** axes pass:
- **type:** `entities` absent **or** `entityForItem(item) ∈ entities` (the `Other`
  type maps to the `LensEntity` value `generic`); an explicit `entities: []` excludes
  every item; and
- **scope:** a Change passes iff `repos` is absent **or** its host-qualified repo key
  `${host}/${change.repo}` ∈ `repos` (an explicit `repos: []` excludes every Change);
  a Ticket passes iff `projects` is absent **or** `ticket.project ∈ projects` (a
  project-less ticket therefore fails any non-absent `projects` filter, including an
  explicit `[]`); an Article passes iff `feeds` is absent **or** its `feedName ∈
  feeds` (an explicit `feeds: []` excludes every Article); Other items carry no
  repo/project/feed and SHALL always pass the scope axis (governed by the type axis
  alone).

When every axis is **absent** (the filter is `{}` or a key is simply not set),
`applyLensFilter` SHALL return its input unchanged for that axis. An axis present as
an explicit empty array (`[]`) SHALL exclude every row on that axis rather than
passing them through — it is a real constraint (the empty set), not a synonym for
"no constraint." `deriveLensFacets` SHALL emit host-qualified repo keys, distinct
feed names, and SHALL drop `undefined` from the `projects` facet list (project-less
tickets contribute no project facet); `deriveLensFacets` is unaffected by this change
since it derives facets from items, not from the filter.

#### Scenario: A lens persists its view filter across restart

- **WHEN** the SW boots with a persisted lens whose node carries `filter: { entities: ['ticket'], projects: ['Payments'] }`
- **THEN** the node is restored with that `filter` intact and validates under the current-version schema

#### Scenario: An absent filter means show everything

- **GIVEN** a lens node with no `filter` field
- **WHEN** `applyLensFilter(items, node.filter ?? {})` runs
- **THEN** it returns `items` unchanged

#### Scenario: Scope narrows its own entity only

- **GIVEN** a lens holding Changes in `o/a` and `o/b` on `github.com`, Issues in project `Pay`, and Articles
- **WHEN** the filter is `{ repos: ['github.com/o/a'] }`
- **THEN** only `o/a` Changes survive, while all Issues and all Articles still pass (repo scope does not touch tickets or articles)

#### Scenario: Repo facets stay host-scoped

- **GIVEN** a lens with Changes in `o/a` on both `github.com` and an enterprise host `ghe.acme.com`
- **WHEN** the filter is `{ repos: ['github.com/o/a'] }`
- **THEN** only the `github.com` `o/a` Changes survive and the `ghe.acme.com` `o/a` Changes do not (the same slug on two hosts never merges)

#### Scenario: A project-less ticket under a project filter

- **GIVEN** a Ticket with no `project` and a Ticket in project `Pay`
- **WHEN** the filter is `{ projects: ['Pay'] }`
- **THEN** only the `Pay` ticket survives; the project-less ticket is excluded
- **AND WHEN** the filter is `{}` (`projects` absent), both tickets pass and `deriveLensFacets` lists only `Pay` (no `undefined`) in `projects`

#### Scenario: An explicit empty filter excludes every row on that axis

- **GIVEN** a lens holding Changes in `o/a`, Tickets in project `Pay`, and Articles from feed `Lobsters`
- **WHEN** the filter is `{ repos: [] }`
- **THEN** every Change is excluded while all Tickets and all Articles still pass (an explicit empty `repos` constrains only the repo/Change axis)
- **AND WHEN** the filter is instead `{ feeds: [] }`
- **THEN** every Article is excluded while all Changes and all Tickets still pass

#### Scenario: A feed filter narrows Articles only

- **GIVEN** a lens holding Articles from feeds `Lobsters` and `Hacker News`, plus Changes and Issues
- **WHEN** the filter is `{ feeds: ['Lobsters'] }`
- **THEN** only `Lobsters` Articles survive while all Changes and all Issues still pass, and `deriveLensFacets` lists `Lobsters` and `Hacker News` in `feeds`

### Requirement: The lens overview filters items by type and scope

The lens overview SHALL offer **scope filters** placed **inside their owning entity card** (not in a top filter bar): the distinct host-qualified `change.repo` values inside the **Changes** card, the `ticket.project` values inside the **Issues** card, and the feed-name values inside the **Articles** card. The overview SHALL NOT render an entity-**type** filter control — entities are always-visible board sections, and the per-section collapse hides a section. (The `LensFilter.entities` axis and the `applyLensFilter` type predicate remain in the data model for the sidebar and programmatic use; the overview simply authors no entity-type filter.) A scope filter SHALL render **only when its facet has two or more visible values**; with fewer than two, the scope filter SHALL NOT render at all, since a single value offers no filtering choice. Each scope filter with two or more values SHALL render as toggle chips when there are five or fewer of a kind, otherwise as a multi-select listbox (`MultiSelect`) that selects any number of scope values at once and, once the facet count exceeds the `MultiSelect` search threshold, surfaces an in-popover search box. The overflow control SHALL NOT reduce the axis to a single selectable value. Scope facet values SHALL be the union of values present in the held items and values currently selected, so a selection is never stranded by a transient empty fetch. Every overflow scope picker SHALL carry an accessible name — repos, projects, and feeds. In the toggle-chip range (two to five values), each chip's rendered width SHALL be bounded so a long value truncates with an ellipsis, and the chip SHALL carry the untruncated value as its accessible tooltip (e.g. a `title` attribute).

An entity card's **visibility** SHALL be governed by whether the lens holds any items of that entity type **before** scope filtering (i.e. the card renders whenever the type is present in the lens at all), NOT by the current scope filter's result count. A scope filter that narrows a populated card down to zero matching items SHALL still render that card (with a `0` count and an empty body) rather than unmounting it — a scope picker, once opened, MUST remain reachable through every filter state reachable from it (including Clear's zero-match state), so a user is never left without a UI path back to widen the filter.

Toggling a scope facet SHALL update the lens filter through the `setLensFilter` command (persisted, not page-local), and the overview SHALL re-render the narrowed set via `applyLensFilter`. The scope filters SHALL compose existing `ui/` primitives (`Chip` — using its shipped `selected`/`onToggle`/`aria-pressed` contract — and `MultiSelect`) and SHALL NOT re-roll a toggle chip nor a multi-select listbox inline nor override the `Chip` selected token from the feature. Selected facets SHALL use the `Chip` selected affordance (resolving to the lens's owning-Space hue) and SHALL hold under reduced-motion and WCAG-AA at every Colour-intensity level. `MultiSelect`'s dropdown-mode popover SHALL remain fully visible (not clipped) regardless of its owning card's rendered height, including the zero-item case above.

An overflow `MultiSelect`'s **Clear** action SHALL persist that axis as an explicit empty array (`[]`), which — per the updated `applyLensFilter` semantics — excludes every row on that axis: the owning entity card's section renders with zero items for that axis (an Articles card cleared to `feeds: []` shows no Articles, per the card-visibility rule above). This is a change from the axis's never-filtered (absent) state, and is now the axis's most restrictive state, not a synonym for it. The closed trigger's summary label SHALL read distinctly for this state (e.g. "None selected") — NOT the same "All …" label used for the genuinely-unfiltered (absent) state, which would misleadingly imply nothing is excluded. When an overflow `MultiSelect`'s `onchange` reports a selection covering every currently-known value of that axis's facet — whether reached via the `MultiSelect`'s own "Select all" action or by the user manually toggling every option on — the overview SHALL persist that axis as the **explicit list of every currently-known value**, not `[]` and not left absent, so it is visually and behaviorally distinct from Clear (every option renders checked, and the picker's header no longer offers "Select all" since nothing remains to select — only Clear does). This collapse-to-full-list (as opposed to the previous collapse-to-`[]`) applies only to the lens-overview scope filters (repos, projects, feeds); it SHALL NOT be implemented as a change to the shared `MultiSelect` primitive's own `selectAll` behavior, since other `MultiSelect` consumers (e.g. the lens editor's source-membership picker) already use "all selected" as a deliberate, persisted snapshot.

#### Scenario: Scope filters live in their entity card

- **GIVEN** a lens with Changes and Issues
- **WHEN** the overview renders
- **THEN** the repo scope filter renders inside the Changes card and the project scope filter inside the Issues card, and no entity-type filter bar renders

#### Scenario: A single-value facet renders no scope filter

- **GIVEN** a lens whose Changes all share one `change.repo` value
- **WHEN** the overview renders the Changes card
- **THEN** no repo scope filter renders (no chip, no `MultiSelect` trigger) since there is only one value to filter against

#### Scenario: A facet crossing from one to two values shows the filter

- **GIVEN** a lens whose Changes currently share one `change.repo` value and no repo scope filter renders
- **WHEN** a Change from a second repo arrives and the facet count becomes two
- **THEN** the repo scope filter renders as a two-chip toggle row

#### Scenario: Scope facets render a multi-select past the threshold

- **WHEN** the Changes in a lens span more than five distinct `change.repo` values
- **THEN** the repo scope facet renders as a `MultiSelect` (a multi-toggle listbox) rather than a chip row, and not as a single-select control

#### Scenario: A long chip label truncates with a tooltip

- **GIVEN** a lens whose Changes span two distinct `change.repo` values, one of them a long host-qualified path
- **WHEN** the repo scope filter renders as a toggle-chip row
- **THEN** the long value's chip is width-bounded and its rendered text truncates with an ellipsis, and the chip carries the full untruncated value as its tooltip

#### Scenario: The overflow scope picker selects multiple values

- **GIVEN** a lens whose Articles span more than five distinct feeds and an unfiltered (absent) feed axis
- **WHEN** the user opens the feed `MultiSelect` and toggles two feeds on
- **THEN** `setLensFilter` is dispatched with `feeds` holding both feed values, and the overview narrows to items from either feed

#### Scenario: The overflow scope picker offers search for long lists

- **GIVEN** a feed scope picker whose option count exceeds the `MultiSelect` search threshold
- **WHEN** the picker opens
- **THEN** an in-popover search box renders and typing into it narrows the listbox to matching feed names

#### Scenario: Each overflow picker has an accessible name

- **GIVEN** a lens whose Changes, Issues, and Articles each overflow their scope facet
- **WHEN** the pickers render
- **THEN** each exposes an accessible name (repos, projects, and feeds respectively)

#### Scenario: A selected value absent from the current fetch stays clearable

- **GIVEN** a persisted filter `repos: ['o/gone']` where `o/gone` is absent from the latest items, and at least one other repo's Changes currently pass the filter
- **WHEN** the Changes scope filter renders
- **THEN** an `o/gone` value still renders (selected) so the user can deselect it, and it is not auto-pruned from the persisted filter

#### Scenario: Clicking Clear filters the entity card to zero items

- **GIVEN** a lens whose Articles span more than five distinct feeds, currently unfiltered (feed axis absent), so the Articles card shows every Article
- **WHEN** the user opens the feed `MultiSelect` and clicks Clear
- **THEN** `setLensFilter` is dispatched with `feeds: []`, the Articles card renders zero Articles, and every option in the popover renders unchecked

#### Scenario: A cleared card stays mounted and its picker stays reachable

- **GIVEN** the same cleared state as above (`feeds: []`, zero Articles rendered)
- **WHEN** the overview re-renders with the persisted `feeds: []` filter
- **THEN** the Articles card is still present in the DOM (not unmounted), its scope-filter trigger reads a distinct "None selected" label (not "All feeds"), and clicking that trigger reopens a fully visible (un-clipped) popover offering Select all, so the user can widen the filter again without editing the lens directly

#### Scenario: Clicking Select all persists the explicit full value list

- **GIVEN** a lens whose Articles span more than five distinct feeds and an unfiltered (absent) feed axis
- **WHEN** the user opens the feed `MultiSelect` and clicks "Select all"
- **THEN** `setLensFilter` is dispatched with `feeds` holding the explicit list of every currently-known feed (not `[]`), every option renders checked, and the popover header offers Clear but no longer offers "Select all"

#### Scenario: Manually checking every option also persists the explicit full value list

- **GIVEN** a lens whose Changes span exactly six distinct `change.repo` values (rendering the `MultiSelect`) and an unfiltered (absent) repo axis
- **WHEN** the user manually toggles all six repo checkboxes on, one at a time, without using "Select all"
- **THEN** once the sixth is toggled, `setLensFilter` is dispatched with `repos` holding all six values (not `[]`), identical in effect to the "Select all" path

#### Scenario: A value added after selecting all is not retroactively included

- **GIVEN** a lens whose feed filter was set to the explicit list of the five then-known feeds after the user selected all
- **WHEN** a sixth feed's Articles arrive in a later fetch
- **THEN** the sixth feed's Articles do NOT pass the filter until the user opens the picker and checks the new feed (the persisted filter is the explicit five-value list, not an unfiltered `[]`/absent state)
