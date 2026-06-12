## MODIFIED Requirements

### Requirement: Pinned tabs persist per Space

Each Space SHALL have an ordered list of pinned entries, persisted as
`pinnedBySpace[spaceId]` — an array of `PinNode`. A `PinNode` is a tab
(`{ kind: 'tab'; id: SavedTabId }`), a folder
(`{ kind: 'folder'; id: FolderId; name; icon; color; children: SavedTabId[] }`),
or a **smart folder**
(`{ kind: 'smart'; id: FolderId; name; icon; source; baseUrl; query; refreshMinutes }`
— configuration only; its displayed children are ephemeral connector results
owned by the `smart-folders` capability and are NOT persisted in the node).
Folders are single-level: a folder's `children` holds `SavedTabId` values only
and never nested folders; a smart node has no `children` field. A pinned tab's
record lives in `savedTabs`; its live binding (if any) lives in `tabBindings`.
Pinned entries survive browser restart and are restored on boot.

#### Scenario: Pinned entries restored on boot

- **WHEN** the service worker boots with persisted pinned entries
- **THEN** `pinnedBySpace` is restored from storage as `PinNode[]`
- **AND** each tab node's `SavedTab` record is available in `savedTabs`
- **AND** each folder node's `children` are restored in order
- **AND** each smart node's configuration fields are restored intact, with no result items read from storage

#### Scenario: Pinned order preserved

- **WHEN** pinned entries (tabs, folders, or smart folders) are reordered
- **THEN** the new order persists in `pinnedBySpace[spaceId]`
- **AND** is restored in that order on next boot

### Requirement: Pinned tabs render in the sidebar

The sidebar SHALL render the active Space's pinned entries as a
vertical list above the temporary-tabs section. A tab node renders as a
row with its favicon and title; a folder node renders as a folder row
showing its coloured icon, name, and child count, with its children
listed beneath it when expanded; a **smart node** renders as a smart folder —
the same folder-row chrome with its item-count badge and, when expanded, its
connector result rows (content, states, and interaction specified by the
`smart-folders` capability) — all in `pinnedBySpace` order.

Folder rows and tab rows SHALL share one visual column structure: a folder row's
glyph SHALL align to the same horizontal column as a tab row's favicon, and its
name to the same column as a tab row's title — and a smart folder's row SHALL
share that same structure. The folder's disclosure chevron
SHALL occupy a leading gutter to the left of that shared icon column and SHALL NOT
displace the glyph or name columns. When a folder is expanded, its children SHALL
be indented by a content inset that preserves row width — each child row's right
edge SHALL stay aligned with the top-level rows' right edge, and indentation SHALL
NOT cause horizontal overflow. A smart folder's result rows SHALL use the same
child content inset.

#### Scenario: Pinned entries shown for the active Space

- **WHEN** the sidebar renders with an active Space that has pinned entries
- **THEN** tab nodes appear as favicon+title rows
- **AND** folder nodes appear as folder rows with icon, name, and child count
- **AND** smart nodes appear as smart-folder rows with icon, name, and item-count badge
- **AND** the rows appear in `pinnedBySpace[spaceId]` order

#### Scenario: Folder rows align with tab rows

- **GIVEN** a folder row rendered above one or more pinned tab rows
- **THEN** the folder's glyph SHALL sit in the same icon column as the tabs' favicons
- **AND** the folder's name SHALL sit in the same column as the tabs' titles
- **AND** the disclosure chevron SHALL sit in a leading gutter without shifting the glyph or name

#### Scenario: Expanded folder shows its children

- **WHEN** a folder is expanded
- **THEN** its child tabs render as rows beneath the folder row
- **AND** when collapsed, its children are hidden

#### Scenario: Expanded children indent without breaking width

- **WHEN** a folder's (or smart folder's) children are shown
- **THEN** they SHALL be indented by a content inset
- **AND** each child row's right edge SHALL remain aligned with the top-level rows
- **AND** no row SHALL overflow the pinned list horizontally

### Requirement: Pinned tabs reorder and unpin by drag

The sidebar SHALL let the user reorder pinned entries by drag, move
tabs into and out of folders by drag, and unpin a tab by dragging it
into the temporary section, persisting changes to `pinnedBySpace`.
Every structural drag (reorder, move into a folder, move out of a
folder, move between folders) SHALL be expressed as a single
tree-replace `reorderPinned` command carrying the full post-drop
`PinNode[]`; the service worker validates and replaces the Space's
list. Unpin to the temporary section SHALL use `unpinTab` as today.
A **smart** node drags and reorders among pins as one unit, exactly
like a folder node.

Dragging a **temporary** tab into the pinned section SHALL honor the
same drop-onto semantics as a within-pinned drag, not only between-rows
insertion. Dropping a temporary tab **onto a folder** SHALL pin it into
that folder's `children`; dropping it **onto a pinned tab** SHALL create
a folder containing the newly-pinned tab and the drop-target tab;
dropping it **between rows** SHALL pin it at that top-level index (the
prior behavior). The drop-target identity SHALL come from the drag
controller's `targetOntoId` for the pinned zone; the temporary drop
handler SHALL act on it rather than discarding it.

A smart node is an **inert "onto" target**: the drag controller SHALL
NOT report a smart row via `targetOntoId`, so a pinned or temporary tab
dropped on a smart row lands as a nearest-edge top-level insertion
(exactly as if dropped between rows) — it SHALL NOT file into the smart
node (which has no `children`) and SHALL NOT create a folder (folder
creation by drop applies to pinned *tab* targets only). Dragging a
smart folder into the temporary section SHALL be rejected exactly like
a folder: no state change, and the node animates back to its origin.

#### Scenario: Drag to reorder top-level entries

- **WHEN** the user drags a tab or folder to a new top-level position
- **THEN** `pinnedBySpace[spaceId]` reflects the new order after drop

#### Scenario: Drag a tab into a folder

- **WHEN** the user drags a pinned tab onto a folder row, or into an
  expanded folder's list
- **THEN** the tab id is removed from its previous location
- **AND** inserted into that folder's `children` at the drop position

#### Scenario: Drag a tab out of a folder

- **WHEN** the user drags a tab out of a folder to a top-level position
- **THEN** the tab id is removed from the folder's `children`
- **AND** inserted into the top-level list as a tab node at the drop position

#### Scenario: Drag a temporary tab onto a folder

- **WHEN** the user drags a temporary tab onto a pinned folder
- **THEN** the tab is minted as a `SavedTab` and bound to the live tab
- **AND** its id is appended to that folder's `children`
- **AND** it is removed from `tempTabIds`
- **AND** it renders inside the folder (not beside it, not lost)

#### Scenario: Drag a temporary tab onto a pinned tab

- **WHEN** the user drags a temporary tab onto a pinned tab
- **THEN** the temporary tab is minted as a `SavedTab`
- **AND** a folder is created at the target tab's position containing the
  drop-target tab and the newly-pinned tab
- **AND** the new folder opens its inline rename field so the user can name
  it immediately (see "Create a pinned-tab folder")

#### Scenario: Drag a temporary tab between rows

- **WHEN** the user drags a temporary tab to a position between pinned rows
- **THEN** it is pinned as a top-level tab node at that index

#### Scenario: Unpin by dragging to temporary

- **WHEN** the user drags a pinned tab (top-level or from a folder) into
  the temporary section
- **THEN** its id is removed from `pinnedBySpace[spaceId]` (or the
  folder's `children`)
- **AND** the live tab (if any) becomes a temporary tab

#### Scenario: Dragging a folder to temporary is rejected

- **WHEN** the user drops a folder node on the temporary section
- **THEN** no change is made to state
- **AND** the folder animates back to its origin position

#### Scenario: A drop onto a smart row inserts adjacent, never files or mints

- **WHEN** the user drops a pinned or temporary tab directly onto a smart-folder row
- **THEN** the tab lands as a top-level node at the nearest edge of the smart row's position
- **AND** no folder is created and nothing files "into" the smart node
- **AND** the smart node's config fields are unchanged

#### Scenario: Dragging a smart folder to temporary is rejected

- **WHEN** the user drops a smart node on the temporary section
- **THEN** no change is made to state
- **AND** the smart folder animates back to its origin position
