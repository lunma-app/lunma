## MODIFIED Requirements

### Requirement: reorderTemp command

The `SidebarCommand` union SHALL include a `reorderTemp` kind with payload `{ windowId: WindowId; spaceId: SpaceId; tabIds: TabId[] }` carrying the Space the reorder applies to (the Space the issuing `TempTabs` panel is displaying — NOT necessarily the window's active Space) and the full post-drop tab-id order of that (window, Space) instance's Temporary list. The SW handler SHALL call `store.reorderTemp(windowId, spaceId, tabIds)`, which reorders `spaceInstancesByWindow[windowId][spaceId].tempTabIds` to match: only ids present in both the payload and the live `tempTabIds` are reordered among themselves; any id present in the live `tempTabIds` but absent from the payload (closed since the client's snapshot, or unshifted to the top by `onTabCreated` after the snapshot) SHALL keep its current position rather than being appended to the end. The sidebar SHALL NOT mutate its local order optimistically; the resulting broadcast is authoritative. The command carries only plain data.

#### Scenario: Sidebar dispatches reorderTemp with the post-drop order

- **WHEN** the user drags temporary tab 17 below tab 22 in window 100's active Space (`spaceId: 'work'`) so the post-drop order is `[22, 17]`
- **THEN** the sidebar SHALL call `bus.send({ kind: 'reorderTemp', payload: { windowId: 100, spaceId: 'work', tabIds: [22, 17] } })`

#### Scenario: A tab omitted from the payload keeps its current position

- **GIVEN** `spaceInstancesByWindow[100].work.tempTabIds` is `[3, 1, 2]`, where tab `3` was unshifted to the top after the sidebar's drag snapshot of `[1, 2]` was taken
- **WHEN** `store.reorderTemp(100, 'work', [2, 1])` is called
- **THEN** `tempTabIds` SHALL become `[3, 2, 1]` — tab `3` SHALL NOT move to the end
