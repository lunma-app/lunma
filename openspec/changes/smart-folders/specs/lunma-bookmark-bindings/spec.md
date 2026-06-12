## MODIFIED Requirements

### Requirement: Pinned ordering per Space

The store SHALL maintain `pinnedBySpace: { [spaceId: string]: PinNode[] }` — the ordered tree of pinned entries in each Space: tab nodes referencing `savedTabId`s, folders, and smart folders (the node shapes are owned by the `spaces-and-tabs` capability). Order SHALL be the array order. The favicon row uses a sibling placement array over the same `savedTabs` map; a saved tab's record SHALL NOT be duplicated across placements. The sidebar SHALL let the user reorder pinned entries by dragging; a completed reorder SHALL dispatch a `reorderPinned` command carrying the full post-drop `PinNode[]` tree (`{ spaceId, nodes }`), and the resulting authoritative state broadcast SHALL define the rendered order (no optimistic update is layered on top).

#### Scenario: Pinned order is the array order

- **WHEN** `state.pinnedBySpace['work']` is `[{ kind: 'tab', id: 't1' }, { kind: 'tab', id: 't2' }, { kind: 'tab', id: 't3' }]`
- **THEN** the sidebar SHALL render the pinned tabs for "Work" as t1, then t2, then t3
- **AND** reordering SHALL be expressed by reordering this array, leaving each `SavedTab` record untouched

#### Scenario: Drag-reorder dispatches reorderPinned and the broadcast is authoritative

- **WHEN** the user drags the pinned row `t3` above `t1` in Space "work"
- **THEN** the sidebar SHALL dispatch `reorderPinned` with the full post-drop tree (the tab nodes ordered t3, t1, t2)
- **AND** after the SW broadcast, `pinnedBySpace['work']` SHALL hold that order and the sidebar SHALL render it
