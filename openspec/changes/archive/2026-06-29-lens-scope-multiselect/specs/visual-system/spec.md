## ADDED Requirements

### Requirement: A shared MultiSelect primitive provides a searchable multi-toggle listbox

Lunma SHALL provide a cross-surface `MultiSelect` primitive in
`apps/extension/src/ui/MultiSelect.svelte` so surfaces compose a multi-select listbox
rather than re-rolling one or degrading multi-value filters to a single-select
`Select`. It SHALL share `Select`'s visual language (recessed trigger field, opaque
`elevated` `Surface` popover, accent-wash selected rows) and SHALL read design values
from `@lunma/tokens`, never hard-coding font sizes, z-index, focus rings, press
transforms, or control heights. Its contract SHALL be:

- **Props:** `options: MultiSelectOption[]` (each `{ value, label, disabled?, keywords? }`,
  where `keywords` is extra non-displayed text folded into the search corpus, and
  `MultiSelectOption` is exported from the module); `values: string[]` (the current
  selection); `onchange: (values: string[]) => void` (fired with the next full
  selection on any toggle or Clear); `label: string` (the parent-computed closed-trigger
  summary); `mode?: 'dropdown' | 'inline'` (default `dropdown`); `searchThreshold?:
  number` (default 8); `ariaLabel?`, `clearLabel?`, `selectAllLabel?`,
  `searchPlaceholder?`, `testid?`; and an optional `leading` snippet receiving the row's
  option.
- **Selection:** each row SHALL render a checkbox-square toggle that fills with the
  active Space accent (`var(--accent)`) plus an `--accent-text` check when selected, in
  addition to the `--accent-soft` row wash, so selection reads by both box fill and row
  tint. Toggling a row SHALL keep the list open and emit the next `values` array.
- **Modes:** `dropdown` SHALL render a trigger button (`aria-haspopup="listbox"`,
  `aria-expanded`) whose visible summary is the parent-computed `label` and whose resting
  border tints toward the accent while any value is selected (the "engaged" cue); it opens
  a popover. `inline` SHALL render the listbox always-open with no trigger or popover. The
  trigger SHALL NOT render a separate count pill — the count, when wanted, lives in the
  parent-computed `label` (e.g. "{n} selected"), so a pill would duplicate it.
- **Custom leading content:** when a `leading` snippet is provided, it SHALL stand in
  for the row's plain label (e.g. an `AccountChip` carrying the source's identity),
  receiving the row's option; the plain label span SHALL be suppressed so the identity
  is not duplicated, while `option.label` SHALL still drive the search filter and the
  option's accessible name (the row's `aria-label`). The snippet SHALL NOT replace the
  row's toggle button or its checkbox-square.
- **Search:** when `options.length` exceeds `searchThreshold`, a `SearchField`
  (`mode="input"`) SHALL render above the list and filter it by case-insensitive
  **subsequence (fuzzy) match** over each option's `label` plus its optional `keywords`
  (so a query like `hcr` matches `Hacker News`, and typing a `keywords`-only term — e.g. a
  source's provider/type — matches a row whose visible label omits it). `MultiSelect`
  SHALL NOT re-roll an input. `ArrowDown` from the search field SHALL move focus to the
  first visible row; `Escape` SHALL close (`dropdown`) or clear focus.
- **Clear / Select all:** an in-popover header SHALL show a live count plus, when their
  labels are provided, two accent actions: **Clear** (`clearLabel`, shown while ≥1 value
  is selected) emits an empty `values`; **Select all** (`selectAllLabel`, shown while not
  every enabled option is selected) emits the union of the current selection and all
  enabled options, **ignoring the active search** (a master toggle over the whole list).
  Disabled options are never auto-selected and do not block the all-selected state. The
  two read as a select-all ⟷ clear toggle: Select all hides once everything is selected,
  Clear hides once nothing is. The header SHALL render only when at least one action is
  offerable.
- **Accessibility + motion:** the open list SHALL be `role="listbox"` with
  `aria-multiselectable="true"` and per-row `aria-selected`; the keyboard model SHALL be
  the roving `↑/↓` + `Home/End` + `Escape` + `Tab`-to-leave listbox model. The popover
  animation, chevron rotation, and box-fill transition SHALL be removed under
  `prefers-reduced-motion`, and the accent / accent-soft / accent-text pairings SHALL
  hold WCAG-AA at the `subtle | standard | vivid` Colour tiers.

`MultiSelect` SHALL carry a catalog story at
`apps/extension/catalog/stories/ui/MultiSelect.stories.svelte`, per the per-primitive
story gate.

#### Scenario: The dropdown trigger opens a multiselectable listbox

- **WHEN** a `dropdown`-mode `MultiSelect` trigger is activated
- **THEN** a popover opens whose list is `role="listbox"` with `aria-multiselectable="true"`, one toggle row per option

#### Scenario: Toggling rows accumulates a multi-value selection

- **GIVEN** an open `MultiSelect` with `values: ['a']`
- **WHEN** the user toggles option `b` on
- **THEN** `onchange` fires with `['a', 'b']` and the list stays open

#### Scenario: Search appears only past the threshold

- **GIVEN** a `MultiSelect` whose option count exceeds `searchThreshold`
- **WHEN** the list renders
- **THEN** a `SearchField` renders above the list and typing fuzzily filters the rows by a subsequence match over each option's label and its optional `keywords`; **AND** for an option count at or below the threshold no search field renders

#### Scenario: Clear empties the selection

- **GIVEN** an open `MultiSelect` with one or more values selected and a `clearLabel`
- **WHEN** the user activates Clear
- **THEN** `onchange` fires with an empty array and the Clear control hides once nothing is selected

#### Scenario: Select all picks every enabled option and then hides

- **GIVEN** an open `MultiSelect` with a `selectAllLabel` and not every enabled option selected
- **WHEN** the user activates Select all
- **THEN** `onchange` fires with all enabled option values (search-independent; disabled options excluded), and the Select all control hides once every enabled option is selected

#### Scenario: Inline mode renders an always-open list

- **WHEN** a `MultiSelect` is rendered with `mode="inline"`
- **THEN** the listbox is visible without a trigger, has no popover, and its rows toggle as in dropdown mode

#### Scenario: A leading snippet provides the row's visible identity

- **GIVEN** a `MultiSelect` whose rows supply a `leading` snippet
- **THEN** the snippet's content renders as the row's visible identity within the row toggle in place of the plain label span, the option keeps `option.label` as its accessible name, and the checkbox-square still marks selection
