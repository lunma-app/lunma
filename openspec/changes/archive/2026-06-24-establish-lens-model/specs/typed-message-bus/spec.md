# typed-message-bus Specification

## ADDED Requirements

### Requirement: Lens-item activation command

The `SidebarCommand` union SHALL include `openLensItem` —
`{ spaceId: SpaceId; folderId: FolderId; itemId: string; windowId: WindowId }`
— validated by a Zod schema in the `bus.ts` discriminated union. The payload
carries **identity only**: the SW resolves the item's URL from its own
`lenses` runtime slice and SHALL NOT accept a URL on the wire (the
`openUrl` scheme-hardening questions never arise; the attack surface is a
lookup key).

Handler semantics: when `lensItemBindings[folderId][itemId][windowId]`
exists, focus that tab (the `focusSavedTab` shape); otherwise resolve the
item from `state.lenses[folderId].items`, create the tab, bind it in
the same drain, seed the live-tab record, and join the Space's Chrome group
(the `openSavedTab` ordering). An unknown `spaceId`, `folderId`, or an
`itemId` that is neither bound nor listed SHALL throw (error ack) — the
unknown-id convention. Closing a bound tab rides the existing
`closeTab { tabId }` command; no new close plumbing ships.

#### Scenario: Activation carries identity, never a URL

- **WHEN** the sidebar dispatches `bus.send({ kind: 'openLensItem', payload: { spaceId: 'work', folderId: 'sf-1', itemId: '42', windowId: 100 } })`
- **THEN** `SidebarCommandSchema` validation succeeds and the handler resolves the URL from the SW's runtime slice
- **AND** a payload carrying an extra `url` field SHALL fail validation (strict payload)

#### Scenario: Bound items focus, unbound items open

- **GIVEN** item `42` bound to tab 7 in window 100
- **WHEN** `openLensItem` is dispatched for it
- **THEN** tab 7 is focused and no tab is created
- **AND** for an unbound listed item a tab is created, bound, and grouped in one drain

#### Scenario: An unknown item rejects

- **WHEN** `openLensItem` is dispatched with an `itemId` that is neither bound nor present in the folder's runtime items
- **THEN** the handler SHALL throw and the ack SHALL carry `{ error }`

### Requirement: Lens lifecycle commands

The `SidebarCommand` union SHALL include four lens lifecycle kinds with flat payloads (no nested config object); update/delete/refresh address `{ spaceId, folderId }`, matching the existing folder-command convention (`renameFolder`, `deleteFolder`, …):

- `createLens` — `{ spaceId: SpaceId; source: LensProvider; name: string; baseUrl: string; query: 'authored' | 'assigned' | 'review-requested'; refreshMinutes: number }`. The SW mints the node id (`crypto.randomUUID`) and the `icon` (the source connector's `mintedIcon` — `'folder-git-2'` for the git forges, `'folder-kanban'` for Jira), normalizes `baseUrl` (absolute http(s) URL required, trailing slash stripped; invalid SHALL throw), clamps `refreshMinutes` to the floor of 5, inserts the node at the top of the Space's pinned list via `store.addLens(spaceId, node)` (matching `createFolder`'s top insertion), retunes the poll alarm, and triggers an immediate first fetch. Unknown `spaceId` SHALL throw (error ack).
- `updateLens` — `{ spaceId: SpaceId; folderId: FolderId; source: LensProvider; name: string; baseUrl: string; query: 'authored' | 'assigned' | 'review-requested'; refreshMinutes: number }`. Edits the node in place via `store.updateLens(spaceId, folderId, config)`; a `baseUrl`, `query`, or `source` change invalidates `fetchedAt` and triggers an immediate refetch. Unknown `spaceId` or `folderId` SHALL throw.
- `deleteLens` — `{ spaceId: SpaceId; folderId: FolderId }`. Removes the node from its pinned list and drops its `lenses` runtime entry via `store.deleteLens(spaceId, folderId)`, then retunes (or clears) the poll alarm. Unknown `spaceId` or `folderId` SHALL throw. No tabs are closed.
- `refreshLens` — `{ spaceId: SpaceId; folderId: FolderId }`. Refreshes that folder unconditionally. The handler SHALL ack `ok` once the refresh is underway; the fetch **outcome** (ok / signed-out / error) lands via the runtime slice and the state broadcast, never via the ack. Unknown `spaceId` or `folderId` SHALL throw.

All four payloads SHALL be validated by Zod schemas in the `bus.ts` discriminated union, with `query` and `source` as `z.enum`s (`source` over `['gitlab', 'github', 'jira']`) and `refreshMinutes` as a number. The `bus.ts` `PinNode` mirror's lens member SHALL admit all three `source` values, so a tree containing a lens node of any source round-trips `reorderPinned` losslessly. Connector fetch failures SHALL never reject any command ack.

#### Scenario: createLens inserts a SW-minted node at the top and fetches

- **WHEN** the sidebar dispatches `bus.send({ kind: 'createLens', payload: { spaceId: 'work', source: 'github', name: 'My pull requests', baseUrl: 'https://github.com', query: 'review-requested', refreshMinutes: 10 } })`
- **THEN** the handler SHALL insert a `lens` node with a SW-minted id, `source: 'github'`, and the source's minted icon at the top of `pinnedBySpace.work`
- **AND** SHALL trigger an immediate first fetch and ack `ok`

#### Scenario: A jira createLens is accepted and mints the kanban icon

- **WHEN** the sidebar dispatches `bus.send({ kind: 'createLens', payload: { spaceId: 'work', source: 'jira', name: 'My reported issues', baseUrl: 'https://acme.atlassian.net', query: 'authored', refreshMinutes: 10 } })`
- **THEN** `SidebarCommandSchema` validation SHALL pass and the handler SHALL insert a `lens` node with `source: 'jira'` and `icon: 'folder-kanban'` at the top of `pinnedBySpace.work`
- **AND** a tree containing that node SHALL round-trip `reorderPinned` losslessly

#### Scenario: refreshLens acks before the fetch resolves

- **WHEN** the sidebar dispatches `refreshLens` for an existing folder
- **THEN** the ack SHALL be `ok` without awaiting the network fetch
- **AND** a subsequent `state-broadcast` SHALL carry the fetch outcome in the runtime slice

#### Scenario: Lifecycle commands on an unknown folder reject

- **WHEN** `updateLens`, `deleteLens`, or `refreshLens` is dispatched with a `spaceId` absent from `state.spaces`, or a `folderId` that matches no lens node in `pinnedBySpace[spaceId]`
- **THEN** the handler SHALL throw and the ack SHALL carry `{ error }`

#### Scenario: An out-of-vocabulary source is rejected at the bus boundary

- **WHEN** a `createLens` payload carries `source: 'bitbucket'` (a source the registry does not hold)
- **THEN** `SidebarCommandSchema` validation SHALL fail and the command is never enqueued

## MODIFIED Requirements

### Requirement: reorderPinned command

The `SidebarCommand` union SHALL include a `reorderPinned` kind with payload `{ spaceId: SpaceId; nodes: PinNode[] }` carrying the full post-drop pinned tree (all three node kinds — `tab`, `folder`, `lens` — round-trip losslessly). The SW handler SHALL call `store.setPinned(spaceId, nodes)`. The sidebar SHALL NOT mutate its local order optimistically; the custom pointer-drag controller leaves the rendered list untouched during a drag, and the resulting broadcast is authoritative (supersedes the earlier dnd-library drag model). The handler SHALL throw a descriptive Error if `spaceId` is absent from `state.spaces`.

#### Scenario: Sidebar dispatches reorderPinned with the post-drop tree

- **WHEN** the user reorders Space "work" pins so the post-drop tree is `[{ kind: 'tab', id: 't3' }, { kind: 'lens', id: 'sf1', … }, { kind: 'tab', id: 't1' }]`
- **THEN** the sidebar SHALL call `bus.send({ kind: 'reorderPinned', payload: { spaceId: 'work', nodes: <that tree> } })`
- **AND** the SW handler SHALL call `store.setPinned('work', nodes)`

### Requirement: Command vocabulary covers all sidebar-driven mutations

The `SidebarCommand` discriminated union in `apps/extension/src/shared/bus.ts` SHALL be the single authoritative source for the sidebar command vocabulary: it SHALL enumerate every sidebar-initiated mutation as a `{ kind, payload }` variant carrying only plain data, and no sidebar mutation SHALL bypass it by mutating storage directly. This requirement SHALL NOT pin an exact count of kinds — the union is the source of truth and grows as new sidebar mutations are added; the closed-set guarantee is enforced at compile time (see "Command kinds are a closed set"), not by a fixed list duplicated in prose.

The vocabulary SHALL cover, at minimum, these command families:

- **Space lifecycle:** `createSpace`, `renameSpace`, `recolourSpace`, `changeSpaceIcon`, `deleteSpace`, `restoreSpaceFromTrash`, `activateSpace`, `reorderSpaces`.
- **Saved-tab:** `openSavedTab`, `focusSavedTab`, `goHome`, `makeThisHome`, `deleteSavedTab`, `renameTab`, `setTabBoundary`.
- **Pinned-tab and favourites:** `pinTab`, `unpinTab`, `reorderPinned`, `pinSavedTab`, `favoriteTab`, `favoriteSavedTab`, `reorderFavorites`.
- **Pinned-tab folder:** `createFolder`, `createFolderFromTabs`, `renameFolder`, `setFolderIcon`, `setFolderColor`, `deleteFolder`.
- **Lens:** `createLens`, `updateLens`, `deleteLens`, `refreshLens` (see Requirement: Lens lifecycle commands), `openLensItem` (see Requirement: Lens-item activation command).
- **Temporary-tab and navigation:** `reorderTemp`, `focusTab`, `closeTab`, `newTab`, `clearTempTabs`, `undoClearTempTabs`, `renameTempTab`, `openUrl`.
- **Archive and auto-archive:** `restoreArchivedTab`, `deleteArchivedTab`, `clearArchivedTabs`, `setSpaceAutoArchive`.

Each variant SHALL carry typed payloads referencing `SpaceId`, `SavedTabId`, `FolderId`, `TabId`, `WindowId`, `IconName`, and `SpaceColor` as appropriate.

The `reorderPinned` payload SHALL be `{ spaceId: SpaceId; nodes: PinNode[] }` — the full post-drop pinned tree — so that one command expresses reorder, move-into-folder, move-out-of-folder, and move-between-folders. The `bus.ts` `PinNode` payload schema SHALL admit all three node kinds (`tab`, `folder`, `lens`) so a tree containing a lens round-trips `reorderPinned` losslessly, with the lens node's config fields intact. The folder commands carrying new folder identity (`createFolder`, `createFolderFromTabs`, `createLens`) SHALL NOT carry a sidebar-minted `FolderId`; the service worker mints it.

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
- **AND** a `lens` node present in the tree SHALL round-trip with its config fields intact

## REMOVED Requirements

### Requirement: Smart-item activation command

**Reason**: Renamed to lens vocabulary by establish-lens-model.

### Requirement: Smart-folder lifecycle commands

**Reason**: Renamed to lens vocabulary by establish-lens-model.
