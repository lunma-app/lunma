## ADDED Requirements

### Requirement: Smart-folder lifecycle commands

The `SidebarCommand` union SHALL include four smart-folder lifecycle kinds with flat payloads (no nested config object); update/delete/refresh address `{ spaceId, folderId }`, matching the existing folder-command convention (`renameFolder`, `deleteFolder`, …):

- `createSmartFolder` — `{ spaceId: SpaceId; name: string; baseUrl: string; query: 'authored' | 'assigned' | 'review-requested'; refreshMinutes: number }`. The SW mints the node id (`crypto.randomUUID`) and the `icon` (`'folder-git-2'` for the v1 source), normalizes `baseUrl` (absolute http(s) URL required, trailing slash stripped; invalid SHALL throw), clamps `refreshMinutes` to the floor of 5, inserts the node at the top of the Space's pinned list via `store.addSmartFolder(spaceId, node)` (matching `createFolder`'s top insertion), retunes the poll alarm, and triggers an immediate first fetch. Unknown `spaceId` SHALL throw (error ack).
- `updateSmartFolder` — `{ spaceId: SpaceId; folderId: FolderId; name: string; baseUrl: string; query: 'authored' | 'assigned' | 'review-requested'; refreshMinutes: number }`. Edits the node in place via `store.updateSmartFolder(spaceId, folderId, config)`; a `baseUrl` or `query` change invalidates `fetchedAt` and triggers an immediate refetch. Unknown `spaceId` or `folderId` SHALL throw.
- `deleteSmartFolder` — `{ spaceId: SpaceId; folderId: FolderId }`. Removes the node from its pinned list and drops its `smartFolders` runtime entry via `store.deleteSmartFolder(spaceId, folderId)`, then retunes (or clears) the poll alarm. Unknown `spaceId` or `folderId` SHALL throw. No tabs are closed.
- `refreshSmartFolder` — `{ spaceId: SpaceId; folderId: FolderId }`. Refreshes that folder unconditionally. The handler SHALL ack `ok` once the refresh is underway; the fetch **outcome** (ok / signed-out / error) lands via the runtime slice and the state broadcast, never via the ack. Unknown `spaceId` or `folderId` SHALL throw.

All four payloads SHALL be validated by Zod schemas in the `bus.ts` discriminated union, with `query` as a `z.enum` and `refreshMinutes` as a number. Connector fetch failures SHALL never reject any command ack.

#### Scenario: createSmartFolder inserts a SW-minted node at the top and fetches

- **WHEN** the sidebar dispatches `bus.send({ kind: 'createSmartFolder', payload: { spaceId: 'work', name: 'Review requests', baseUrl: 'https://gitlab.example.com', query: 'review-requested', refreshMinutes: 10 } })`
- **THEN** the handler SHALL insert a `smart` node with a SW-minted id and `icon: 'folder-git-2'` at the top of `pinnedBySpace.work`
- **AND** SHALL trigger an immediate first fetch and ack `ok`

#### Scenario: refreshSmartFolder acks before the fetch resolves

- **WHEN** the sidebar dispatches `refreshSmartFolder` for an existing folder
- **THEN** the ack SHALL be `ok` without awaiting the network fetch
- **AND** a subsequent `state-broadcast` SHALL carry the fetch outcome in the runtime slice

#### Scenario: Lifecycle commands on an unknown folder reject

- **WHEN** `updateSmartFolder`, `deleteSmartFolder`, or `refreshSmartFolder` is dispatched with a `spaceId` absent from `state.spaces`, or a `folderId` that matches no smart node in `pinnedBySpace[spaceId]`
- **THEN** the handler SHALL throw and the ack SHALL carry `{ error }`

## MODIFIED Requirements

### Requirement: Command vocabulary covers all sidebar-driven mutations

The `SidebarCommand` discriminated union in `apps/extension/src/shared/bus.ts` SHALL be the single authoritative source for the sidebar command vocabulary: it SHALL enumerate every sidebar-initiated mutation as a `{ kind, payload }` variant carrying only plain data, and no sidebar mutation SHALL bypass it by mutating storage directly. This requirement SHALL NOT pin an exact count of kinds — the union is the source of truth and grows as new sidebar mutations are added; the closed-set guarantee is enforced at compile time (see "Command kinds are a closed set"), not by a fixed list duplicated in prose.

The vocabulary SHALL cover, at minimum, these command families:

- **Space lifecycle:** `createSpace`, `renameSpace`, `recolourSpace`, `changeSpaceIcon`, `deleteSpace`, `restoreSpaceFromTrash`, `activateSpace`, `reorderSpaces`.
- **Saved-tab:** `openSavedTab`, `focusSavedTab`, `goHome`, `makeThisHome`, `deleteSavedTab`, `renameTab`, `setTabBoundary`.
- **Pinned-tab and favourites:** `pinTab`, `unpinTab`, `reorderPinned`, `pinSavedTab`, `favoriteTab`, `favoriteSavedTab`, `reorderFavorites`.
- **Pinned-tab folder:** `createFolder`, `createFolderFromTabs`, `renameFolder`, `setFolderIcon`, `setFolderColor`, `deleteFolder`.
- **Smart-folder:** `createSmartFolder`, `updateSmartFolder`, `deleteSmartFolder`, `refreshSmartFolder` (see Requirement: Smart-folder lifecycle commands).
- **Temporary-tab and navigation:** `reorderTemp`, `focusTab`, `closeTab`, `newTab`, `clearTempTabs`, `undoClearTempTabs`, `renameTempTab`, `openUrl`.
- **Archive and auto-archive:** `restoreArchivedTab`, `deleteArchivedTab`, `clearArchivedTabs`, `setSpaceAutoArchive`.

Each variant SHALL carry typed payloads referencing `SpaceId`, `SavedTabId`, `FolderId`, `TabId`, `WindowId`, `IconName`, and `SpaceColor` as appropriate.

The `reorderPinned` payload SHALL be `{ spaceId: SpaceId; nodes: PinNode[] }` — the full post-drop pinned tree — so that one command expresses reorder, move-into-folder, move-out-of-folder, and move-between-folders. The `bus.ts` `PinNode` payload schema SHALL admit all three node kinds (`tab`, `folder`, `smart`) so a tree containing a smart folder round-trips `reorderPinned` losslessly, with the smart node's config fields intact. The folder commands carrying new folder identity (`createFolder`, `createFolderFromTabs`, `createSmartFolder`) SHALL NOT carry a sidebar-minted `FolderId`; the service worker mints it.

#### Scenario: Every sidebar mutation has a command variant

- **WHEN** the sidebar needs to mutate persisted or window state
- **THEN** there SHALL be a matching `SidebarCommand` variant with a typed payload
- **AND** no sidebar mutation SHALL bypass the bus by mutating storage directly

#### Scenario: Command kinds are a closed set

- **WHEN** the coordinator processes a command
- **THEN** its `kind` SHALL be one of the enumerated `SidebarCommandKind` values
- **AND** unknown kinds SHALL be rejected by the type system at compile time
- **AND** the `SIDEBAR_COMMAND_KINDS` runtime guard SHALL stay exhaustive against `SidebarCommandKind` (e.g. `satisfies Record<SidebarCommandKind, true>`), so a kind added to the union without updating the guard fails `tsc`

#### Scenario: Previously-unspecified kinds are part of the vocabulary

- **WHEN** the sidebar dispatches `renameTab`, `renameTempTab`, `favoriteTab`, `favoriteSavedTab`, `pinSavedTab`, `reorderFavorites`, or `undoClearTempTabs`
- **THEN** each SHALL be a recognised `SidebarCommand` kind in the authoritative union
- **AND** the SW adapter's `SIDEBAR_COMMAND_KINDS` SHALL accept it

#### Scenario: Folder commands carry typed payloads

- **WHEN** the sidebar constructs a folder command
- **THEN** `createFolder` SHALL carry `{ spaceId }`
- **AND** `createFolderFromTabs` SHALL carry `{ spaceId; tabIdA: SavedTabId; tabIdB: SavedTabId; index: number }`
- **AND** `renameFolder` SHALL carry `{ spaceId; folderId: FolderId; name: string }`
- **AND** `setFolderIcon` SHALL carry `{ spaceId; folderId: FolderId; icon: IconName }`
- **AND** `setFolderColor` SHALL carry `{ spaceId; folderId: FolderId; color: SpaceColor }`
- **AND** `deleteFolder` SHALL carry `{ spaceId; folderId: FolderId }`

#### Scenario: reorderPinned carries the full tree

- **WHEN** the user completes a structural pinned-tab drag
- **THEN** the sidebar SHALL dispatch `reorderPinned` with `{ spaceId, nodes }` where `nodes` is the complete post-drop `PinNode[]`
- **AND** a `smart` node present in the tree SHALL round-trip with its config fields intact

### Requirement: reorderPinned command

The `SidebarCommand` union SHALL include a `reorderPinned` kind with payload `{ spaceId: SpaceId; nodes: PinNode[] }` carrying the full post-drop pinned tree (all three node kinds — `tab`, `folder`, `smart` — round-trip losslessly). The SW handler SHALL call `store.setPinned(spaceId, nodes)`. The sidebar SHALL NOT mutate its local order optimistically; the custom pointer-drag controller leaves the rendered list untouched during a drag, and the resulting broadcast is authoritative (ADR 0006, supersedes ADR 0003). The handler SHALL throw a descriptive Error if `spaceId` is absent from `state.spaces`.

#### Scenario: Sidebar dispatches reorderPinned with the post-drop tree

- **WHEN** the user reorders Space "work" pins so the post-drop tree is `[{ kind: 'tab', id: 't3' }, { kind: 'smart', id: 'sf1', … }, { kind: 'tab', id: 't1' }]`
- **THEN** the sidebar SHALL call `bus.send({ kind: 'reorderPinned', payload: { spaceId: 'work', nodes: <that tree> } })`
- **AND** the SW handler SHALL call `store.setPinned('work', nodes)`

### Requirement: openUrl command

The typed message bus SHALL define an `openUrl` command with payload
`{ url: string; windowId: WindowId }`. It is dispatched by the launcher to open a
**bookmark** or **history** result — results with no live tab or saved-tab record
to focus — and by the sidebar's smart-folder result rows (link-shaped connector
items with no `SavedTab` record; see the `smart-folders` capability). The
coordinator's handler SHALL open the URL in the given window via
`chrome.tabs.create({ url, windowId })`. The handler SHALL NOT directly mutate
`tempTabIds` or `liveTabsById`; the created tab SHALL reach Lunma state through the
existing `tabs.onCreated` path (which adopts + groups it into the window's active
Space). On failure the handler SHALL throw and the coordinator SHALL emit a
`lunma/command-ack` carrying `{ error }`.

The `openUrl` kind SHALL be added to the `SidebarCommand` discriminated union in
`apps/extension/src/shared/bus.ts`, with matching `PendingEvent` union, handlers-map, and
`EventPolicy` entries in the coordinator (per the `chrome-event-coordination`
capability's extension rule).

#### Scenario: openUrl opens the URL in the target window

- **WHEN** a client dispatches `bus.send({ kind: 'openUrl', payload: { url: 'https://example.com/', windowId: 100 } })`
- **THEN** the coordinator handler SHALL call `chrome.tabs.create({ url: 'https://example.com/', windowId: 100 })`
- **AND** it SHALL NOT directly mutate `tempTabIds` or `liveTabsById` (the `tabs.onCreated` path adopts the new tab)
- **AND** the coordinator SHALL emit a `lunma/command-ack` with result `'ok'`

#### Scenario: openUrl failure acks with an error

- **WHEN** `chrome.tabs.create` rejects for an `openUrl` command
- **THEN** the handler SHALL throw
- **AND** the coordinator SHALL emit a `lunma/command-ack` whose result includes an `error`
