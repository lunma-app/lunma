## ADDED Requirements

### Requirement: Result selection is indicated by the wash alone

The new-tab `ResultRow` primitive SHALL indicate the roving selection with the `--accent-soft` wash alone, with no leading accent bar or other marker, matching the overlay and the sidebar tab row's wash-only selection. The `ResultRow` SHALL NOT render a leading accent marker for its selected state.

#### Scenario: A selected new-tab result row shows no accent bar

- **WHEN** a new-tab `ResultRow` is the roving selection
- **THEN** it SHALL show the `--accent-soft` wash
- **AND** it SHALL NOT render a leading accent bar
