## MODIFIED Requirements

### Requirement: SegmentedControl is a reusable token-only primitive

`SegmentedControl.svelte` SHALL live in `apps/extension/src/ui/`, be exported from `apps/extension/src/ui/index.ts`, accept a typed `options` array plus the current `value` and an `onchange` callback, and use only design tokens from `@lunma/tokens` (no hard-coded colours or pixel design values). It SHALL be implemented with `<input type="radio">` elements for native keyboard and accessibility semantics.

It SHALL accept an optional `ariaLabel` that names the radio group, applied to the control's `<fieldset>` (as `aria-label`), so a segmented control whose visible label sits *outside* the control (e.g. a settings row's separate `.setting-label`, where the per-radio labels are only `Off`/`On`/`Compact`) still exposes an accessible group name to assistive tech. Every call site that renders the control beneath or beside a separate label SHALL pass `ariaLabel` — the options page passes each setting's `label`, and the sidebar editors pass their control's label — mirroring how the sibling `Select` and `TextInput` primitives already take an `ariaLabel`.

#### Scenario: Native radio keyboard navigation

- **WHEN** the control is focused and the user presses arrow keys
- **THEN** the selection moves between options via native radio-group behaviour and fires `onchange` with the newly selected value

#### Scenario: Selection indicator animates between options

- **WHEN** the user selects a different option
- **THEN** the selection pill slides to the newly active option over `200ms var(--ease-emphasised)` rather than snapping

#### Scenario: The radio group exposes an accessible name

- **WHEN** a `SegmentedControl` is rendered with `ariaLabel="Colour intensity"` and its visible label is a separate element outside the control
- **THEN** its `<fieldset>` SHALL carry `aria-label="Colour intensity"`, so a screen-reader user entering the group hears the setting name rather than only the per-option labels

#### Scenario: Options-page and sidebar call sites pass a group name

- **WHEN** the options page renders a setting's `SegmentedControl`, or a sidebar editor (`SpaceEditor`, `TabBoundaryEditor`, `SmartFolderEditor`) renders one
- **THEN** each SHALL pass an `ariaLabel` naming the control (the options page passes the setting's `label`), so no segmented group on those surfaces is anonymous to assistive tech
