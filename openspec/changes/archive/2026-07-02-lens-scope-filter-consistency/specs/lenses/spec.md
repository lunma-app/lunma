## MODIFIED Requirements

### Requirement: The lens overview filters items by type and scope

The lens overview SHALL offer **scope filters** placed **inside their owning entity card** (not in a top filter bar): the distinct host-qualified `change.repo` values inside the **Changes** card, the `ticket.project` values inside the **Issues** card, and the feed-name values inside the **Articles** card. The overview SHALL NOT render an entity-**type** filter control — entities are always-visible board sections, and the per-section collapse hides a section. (The `LensFilter.entities` axis and the `applyLensFilter` type predicate remain in the data model for the sidebar and programmatic use; the overview simply authors no entity-type filter.) A scope filter SHALL render **only when its facet has two or more visible values**; with fewer than two, the scope filter SHALL NOT render at all, since a single value offers no filtering choice. Each scope filter with two or more values SHALL render as toggle chips when there are five or fewer of a kind, otherwise as a multi-select listbox (`MultiSelect`) that selects any number of scope values at once and, once the facet count exceeds the `MultiSelect` search threshold, surfaces an in-popover search box. The overflow control SHALL NOT reduce the axis to a single selectable value. Scope facet values SHALL be the union of values present in the held items and values currently selected, so a selection is never stranded by a transient empty fetch. Every overflow scope picker SHALL carry an accessible name — repos, projects, and feeds. In the toggle-chip range (two to five values), each chip's rendered width SHALL be bounded so a long value truncates with an ellipsis, and the chip SHALL carry the untruncated value as its accessible tooltip (e.g. a `title` attribute).

Toggling a scope facet SHALL update the lens filter through the `setLensFilter` command (persisted, not page-local), and the overview SHALL re-render the narrowed set via `applyLensFilter`. The scope filters SHALL compose existing `ui/` primitives (`Chip` — using its shipped `selected`/`onToggle`/`aria-pressed` contract — and `MultiSelect`) and SHALL NOT re-roll a toggle chip nor a multi-select listbox inline nor override the `Chip` selected token from the feature. Selected facets SHALL use the `Chip` selected affordance (resolving to the lens's owning-Space hue) and SHALL hold under reduced-motion and WCAG-AA at every Colour-intensity level. Clearing a scope axis is done via the scope control's own clear (the `Chip` row toggles, or the `MultiSelect`'s in-popover Clear).

When an overflow `MultiSelect`'s `onchange` reports a selection covering every currently-known value of that axis's facet — whether reached via the `MultiSelect`'s own "Select all" action or by the user manually toggling every option on — the overview SHALL persist that axis as empty (`[]`) rather than the explicit list of values, so this state is identical to, and stays in step with, the "never filtered" state (both include values that appear later). This collapse applies only to the lens-overview scope filters (repos, projects, feeds); it SHALL NOT be implemented as a change to the shared `MultiSelect` primitive's own `selectAll` behavior, since other `MultiSelect` consumers (e.g. the lens editor's source-membership picker) use "all selected" as a deliberate, persisted snapshot rather than as a synonym for "unfiltered."

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

- **GIVEN** a lens whose Articles span more than five distinct feeds and an empty filter
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

#### Scenario: Clicking Select all collapses to the unfiltered state

- **GIVEN** a lens whose Articles span more than five distinct feeds and an empty filter
- **WHEN** the user opens the feed `MultiSelect` and clicks "Select all"
- **THEN** `setLensFilter` is dispatched with `feeds: []` (not an explicit list of every feed), and the trigger reads the same "All feeds" label as before the click

#### Scenario: Manually checking every option also collapses to the unfiltered state

- **GIVEN** a lens whose Changes span exactly six distinct `change.repo` values (rendering the `MultiSelect`) and an empty filter
- **WHEN** the user manually toggles all six repo checkboxes on, one at a time, without using "Select all"
- **THEN** once the sixth is toggled, `setLensFilter` is dispatched with `repos: []`, identical to the "Select all" path

#### Scenario: A value added after selecting all is included automatically

- **GIVEN** a lens whose feed filter was collapsed to `[]` after the user selected all five then-known feeds
- **WHEN** a sixth feed's Articles arrive in a later fetch
- **THEN** the sixth feed's Articles pass the filter with no further user action, since the stored filter is `[]`, not a snapshot of the original five
