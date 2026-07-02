## MODIFIED Requirements

### Requirement: Temp tab right-click menu includes a Duplicate action

The temp tab context menu (`tabMenuItems()` in `TempTabs.svelte`) SHALL include a
"Duplicate" menu item, rendering the `copy` icon (matching every other item in
this menu — Favorite, Rename, Move up, Move down, Close — each of which sets an
`icon`). Activating it SHALL dispatch `bus.send({ kind:
'duplicateTab', payload: { tabId } })` for the right-clicked row's tab. The item
SHALL be placed after "Move down" and before "Close tab" in the menu order.

#### Scenario: Duplicate appears in the temp tab context menu

- **WHEN** the user right-clicks a temp tab row
- **THEN** the context menu SHALL include a "Duplicate" item rendering the `copy` icon

#### Scenario: Activating Duplicate dispatches duplicateTab

- **WHEN** the user selects "Duplicate" for tab 42
- **THEN** `bus.send({ kind: 'duplicateTab', payload: { tabId: 42 } })` SHALL be dispatched
