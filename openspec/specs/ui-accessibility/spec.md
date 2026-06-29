# ui-accessibility Specification

## Purpose
TBD - created by archiving change harden-ui-accessibility. Update Purpose after archive.
## Requirements
### Requirement: Every interactive primitive exposes an accessible name

Every operable `src/ui/` primitive SHALL expose a non-empty accessible name, and
every primitive that can render without visible text SHALL provide a prop to set
that name. An icon-only control SHALL NOT be shippable with no name.

- `IconButton` SHALL resolve its accessible name from `ariaLabel`, falling back
  to `title` when `ariaLabel` is absent, and SHALL emit a dev-mode warning when
  both are missing.
- `Kbd` SHALL accept an optional `ariaLabel` applied to its `<kbd>` so a
  consumer can supply a spelled-out key name (e.g. "Option L") or hide a purely
  decorative glyph.
- `BottomSheet` SHALL accept an optional `ariaLabel`; a headerless sheet (no
  `title`) SHALL still expose an accessible name on its `role="dialog"` element.
- `ResultList` SHALL accept an optional `ariaLabel` applied to its
  `role="listbox"` container.
- `Chip` SHALL accept an optional `ariaLabel` for its toggle button.
- `ReviewerRail` overflow badge (`+N`) SHALL be announced with text that ties the
  count to reviewers (via a naming-capable role or visually-hidden text), not as
  a bare number.
- `SearchField` in `input` mode SHALL fall back to the `placeholder` for its
  `aria-label` when `ariaLabel` is omitted, matching `trigger` mode.
- The collapsed `MultiSelect` trigger SHALL expose its current selection summary
  (the visible value) to assistive tech — its `aria-label` SHALL NOT suppress the
  selected value.

#### Scenario: Icon-only button without a name warns and stays nameable

- **WHEN** an `IconButton` is rendered with neither `ariaLabel` nor `title`
- **THEN** a dev-mode warning SHALL be emitted
- **AND** when only `title` is supplied it SHALL become the button's accessible name

#### Scenario: Headerless dialog is named

- **WHEN** a `BottomSheet` is opened with no `title`
- **THEN** its `role="dialog"` element SHALL carry an accessible name from `ariaLabel`

#### Scenario: Listbox is named

- **WHEN** a `ResultList` is rendered with an `ariaLabel`
- **THEN** its `role="listbox"` container SHALL expose that name

#### Scenario: Collapsed multi-select exposes its value

- **WHEN** a `MultiSelect` trigger is collapsed with a selection
- **THEN** its accessible name SHALL include the visible selection summary, not only the field name

### Requirement: Visually-conveyed selection or active state has a programmatic equivalent

A primitive SHALL NOT convey selection, current, or active state by colour, wash,
or ring alone — it SHALL also expose that state programmatically.

- The active `TabRow` SHALL set `aria-current="true"` on its title button.
- The active `LensRow` SHALL set `aria-current` on the row (its toggle already
  owns `aria-expanded`; `aria-pressed` SHALL NOT be used for the active state).
- The active `FaviconTile` SHALL set `aria-current` (or `aria-pressed`) on its
  button.
- `Avatar` verdict rings (`approved`/`changes`/`pending`) SHALL carry a non-colour
  cue (glyph/overlay or a per-state ring style), not hue alone.

#### Scenario: Active tab is programmatically current

- **WHEN** a `TabRow` has `active` true
- **THEN** its title button SHALL expose `aria-current="true"`

#### Scenario: Verdict ring is not colour-only

- **WHEN** an `Avatar` renders a verdict ring
- **THEN** the verdict SHALL be distinguishable without relying on hue

### Requirement: Busy and loading state is programmatically exposed

A primitive that shows a spinner for an in-flight operation SHALL keep the spinner
decorative (`aria-hidden`) and, where the operation is user-meaningful, SHALL
expose the busy state via `aria-busy="true"` while it runs, without changing the
control's accessible name.

#### Scenario: Loading row announces busy

- **WHEN** `TabRow`, `FolderRow`, `LensRow`, or `FaviconTile` is in its busy/loading state
- **THEN** the row/tile SHALL set `aria-busy="true"`
- **AND** the spinner glyph SHALL remain `aria-hidden`
- **AND** the control's accessible name SHALL be unchanged

### Requirement: Keyboard operability across selects, toasts, and option rows

Custom listbox/option controls SHALL remain fully keyboard-operable, and primitives
SHALL NOT leave redundant or unreachable tab stops.

- `Select` and `MultiSelect` arrow-key roving SHALL skip disabled options so
  wrap-around, `Home`, and `End` reach every enabled option and never dead-end on
  a disabled row.
- `ResultRow` SHALL accept a `tabindex` prop so a consumer driving the
  `aria-activedescendant` model can keep DOM focus on the combobox input rather
  than every row.
- A message-only `Toast` (no action) SHALL be keyboard-engageable so its
  focus-within pause and Escape-to-dismiss work without a pointer.
- The redundant non-`returnable` `TabRow` favicon button SHALL NOT be a second
  tab stop duplicating the title button.
- The programmatically-clicked OPML `<input type="file">` in
  `ServiceConnectPicker` SHALL leave the tab order and accessibility tree
  (`tabindex="-1"` + `aria-hidden="true"`).

#### Scenario: Arrow keys skip disabled options

- **WHEN** a user arrows through an open `Select` or `MultiSelect` that contains a disabled option
- **THEN** focus SHALL advance to the next enabled option
- **AND** wrap-around / `Home` / `End` SHALL never strand focus on the disabled row

#### Scenario: Message-only toast is dismissible by keyboard

- **WHEN** a `Toast` without an action is shown
- **THEN** a keyboard-only user SHALL be able to focus it to pause the timer and dismiss it with Escape

### Requirement: Dynamic status changes are announced

Text that appears or changes to report the result of a user action SHALL be placed
in a polite live region so assistive tech announces it.

- The `ServiceConnectPicker` OPML import-confirm result ("Found N feeds…") SHALL
  be announced (`aria-live="polite"`/`role="status"`) or focus SHALL move into the
  revealed panel.
- The `IconPicker` empty-result and truncation messages SHALL render in a
  persistent polite live region.

#### Scenario: Import result is announced

- **WHEN** an OPML file is parsed and the confirm panel reveals
- **THEN** the "Found N feeds" result SHALL be announced to assistive tech

#### Scenario: Empty search is announced

- **WHEN** an `IconPicker` query yields no matches or is capped
- **THEN** the status message SHALL be announced via a live region

### Requirement: Correct roles, ownership, and error associations

Primitives SHALL use valid ARIA roles, valid listbox/group ownership, and SHALL
support programmatic error association.

- The `Tooltip` content element SHALL carry `role="tooltip"`.
- `Select` option `<button role="option">`s SHALL be owned directly by
  `role="listbox"` — any intervening `<li>` SHALL carry `role="presentation"`.
- A container of single-select `ColorSwatch` toggles (`aria-pressed`) SHALL use
  `role="group"`, not `role="radiogroup"` (whose members would have to be
  `role="radio"` with arrow-key roving).
- `Diffstat` SHALL give its additions/deletions numerals an explicit
  additions/deletions label (visually-hidden text or `role="img"` + `aria-label`),
  keeping the bar `aria-hidden`.
- `TextInput` SHALL accept `required` (→ `aria-required`) and `describedById`
  (→ `aria-describedby`); `InlineError` SHALL accept an `id`, so a field error can
  be programmatically associated with its input.
- `TextInput` SHALL accept an `autocomplete` passthrough (→ the native
  `autocomplete` attribute) so consumers can identify the input purpose of
  user-information fields (e.g. `username`, `current-password`) per WCAG 1.3.5.

#### Scenario: Tooltip exposes the tooltip role

- **WHEN** a `Tooltip` bubble is shown
- **THEN** its content element SHALL have `role="tooltip"` (the trigger keeps `aria-describedby`)

#### Scenario: Error text is associable with its field

- **WHEN** a field is invalid and renders an `InlineError`
- **THEN** the `InlineError` SHALL expose an `id` and the `TextInput` SHALL point `aria-describedby` at it via `describedById`

#### Scenario: Swatch group uses a valid role

- **WHEN** `ColorSwatch` toggles with `aria-pressed` are grouped
- **THEN** the container SHALL use `role="group"` with an accessible name

#### Scenario: Input purpose is identifiable

- **WHEN** a `TextInput` collects user information and is given an `autocomplete` value
- **THEN** the native `autocomplete` attribute SHALL carry it so the input purpose is programmatically determinable

### Requirement: The `label` vs `ariaLabel` prop convention is consistent

Across `src/ui/` primitives, `label` SHALL mean visible text that doubles as the
accessible name, and `ariaLabel` SHALL mean a name-only value with no visible
text. A primitive whose `label` is used solely as an accessible-name override
SHALL expose it as `ariaLabel` instead.

- `Menu`, `FolderRow`, and `LensRow` SHALL rename their accessible-name-only
  `label` prop to `ariaLabel`; all in-repo consumers SHALL be updated.
- The convention SHALL be documented in `docs/architecture.md`.

#### Scenario: Name-only prop is named ariaLabel

- **WHEN** a primitive uses a prop solely as its accessible name
- **THEN** that prop SHALL be `ariaLabel`, not `label`

### Requirement: The component catalog shell is accessible

The dev catalog (`apps/extension/catalog/`) SHALL itself meet the accessible-name
and current-state contract.

- The active navigation button SHALL expose `aria-current="page"` (via a
  `RowButton` `ariaCurrent` passthrough), set only on the selected item.
- Every playground control SHALL carry an accessible name — the boolean control's
  `Chip` SHALL receive an `ariaLabel`.
- A `Tooltip` story SHALL spread its trigger props onto a native focusable
  element, not a wrapper `<span>`.

#### Scenario: Active nav item is current

- **WHEN** a catalog story is selected
- **THEN** its nav button SHALL expose `aria-current="page"` and no other nav button SHALL

#### Scenario: Boolean playground control is named

- **WHEN** the playground renders a boolean control
- **THEN** its toggle SHALL carry an `ariaLabel` matching the prop name

