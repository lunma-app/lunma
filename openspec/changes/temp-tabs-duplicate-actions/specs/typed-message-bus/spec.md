## MODIFIED Requirements

### Requirement: Command vocabulary covers all sidebar-driven mutations

The `SidebarCommand` discriminated union in `apps/extension/src/shared/bus.ts` SHALL be the single authoritative source for the sidebar command vocabulary: it SHALL enumerate every sidebar-initiated mutation as a `{ kind, payload }` variant carrying only plain data, and no sidebar mutation SHALL bypass it by mutating storage directly. This requirement SHALL NOT pin an exact count of kinds — the union is the source of truth and grows as new sidebar mutations are added; the closed-set guarantee is enforced at compile time (see "Command kinds are a closed set"), not by a fixed list duplicated in prose.

The vocabulary SHALL cover, at minimum, these command families:

- **Space lifecycle:** `createSpace`, `renameSpace`, `recolourSpace`, `changeSpaceIcon`, `deleteSpace`, `restoreSpaceFromTrash`, `activateSpace`, `reorderSpaces`.
- **Saved-tab:** `openSavedTab`, `focusSavedTab`, `goHome`, `makeThisHome`, `deleteSavedTab`, `renameTab`, `setTabBoundary`.
- **Pinned-tab and favourites:** `pinTab`, `unpinTab`, `reorderPinned`, `pinSavedTab`, `favoriteTab`, `favoriteSavedTab`, `reorderFavorites`.
- **Pinned-tab folder:** `createFolder`, `createFolderFromTabs`, `renameFolder`, `setFolderIcon`, `setFolderColor`, `deleteFolder`.
- **Lens:** `createLens`, `updateLens`, `deleteLens`, `refreshLens` (see Requirement: Lens lifecycle commands), `openLensItem` (see Requirement: Lens-item activation command).
- **Temporary-tab and navigation:** `reorderTemp`, `focusTab`, `closeTab`, `newTab`, `clearTempTabs`, `undoClearTempTabs`, `clearDuplicateTempTabs`, `renameTempTab`, `openUrl`.
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

- **WHEN** the sidebar dispatches `renameTab`, `renameTempTab`, `favoriteTab`, `favoriteSavedTab`, `pinSavedTab`, `reorderFavorites`, `undoClearTempTabs`, or `clearDuplicateTempTabs`
- **THEN** each SHALL be a recognised `SidebarCommand` kind in the authoritative union
- **AND** the SW adapter's `SIDEBAR_COMMAND_KINDS` SHALL accept it

#### Scenario: Folder commands carry typed payloads

- **WHEN** the sidebar constructs a folder command
- **THEN** it SHALL follow the shapes above

## ADDED Requirements

### Requirement: clearDuplicateTempTabs command

The `SidebarCommand` union SHALL include a `clearDuplicateTempTabs` kind with
payload `{ windowId: WindowId; spaceId?: SpaceId }`, mirroring `clearTempTabs`'s
payload shape. The sidebar SHALL dispatch it when the user activates a panel's
"Clear duplicates" kebab-menu item, carrying that panel's `spaceId`. The
coordinator's handler SHALL close only the targeted Space's temporary tabs
that duplicate another temporary tab's exact URL within `windowId` — see the
`spaces-and-tabs` capability's "Clear duplicates temporary-tab action"
requirement for the full grouping/survivor/archive behaviour. The handler
SHALL NOT directly mutate `tempTabIds` or `liveTabsById`; removal SHALL
propagate through the existing `tabs.onRemoved` path, identically to
`clearTempTabs`. On failure the handler SHALL throw and the coordinator SHALL
emit a `lunma/command-ack` carrying `{ error }`.

#### Scenario: clearDuplicateTempTabs closes only duplicate-URL tabs in the targeted Space

- **GIVEN** window 100's Space "work" has temporary tabs `[10 → https://a.example/, 11 → https://b.example/, 12 → https://a.example/]`
- **WHEN** a sidebar dispatches `bus.send({ kind: 'clearDuplicateTempTabs', payload: { windowId: 100, spaceId: 'work' } })`
- **THEN** tab `12` SHALL be closed and tabs `10` and `11` SHALL remain open

#### Scenario: clearDuplicateTempTabs is a no-op with no duplicate URLs

- **WHEN** the resolved Space has temporary tabs with no two sharing the same exact URL and `clearDuplicateTempTabs` is dispatched
- **THEN** no tab SHALL be closed and no `archivedTabs` entry SHALL be inserted

#### Scenario: clearDuplicateTempTabs failure surfaces as a rejected ack

- **WHEN** `chrome.tabs.remove` rejects for `clearDuplicateTempTabs`
- **THEN** the handler SHALL throw and the coordinator SHALL emit a `lunma/command-ack` carrying `{ error }`
