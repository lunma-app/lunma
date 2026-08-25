## MODIFIED Requirements

### Requirement: Command vocabulary covers all sidebar-driven mutations

The `SidebarCommand` discriminated union in `apps/extension/src/shared/bus.ts` SHALL be the single authoritative source for the sidebar command vocabulary: it SHALL enumerate every sidebar-initiated mutation as a `{ kind, payload }` variant carrying only plain data, and no sidebar mutation SHALL bypass it by mutating storage directly. This requirement SHALL NOT pin an exact count of kinds — the union is the source of truth and grows as new sidebar mutations are added; the closed-set guarantee is enforced at compile time (see "Command kinds are a closed set"), not by a fixed list duplicated in prose.

The vocabulary SHALL cover, at minimum, these command families:

- **Space lifecycle:** `createSpace`, `renameSpace`, `recolourSpace`, `changeSpaceIcon`, `deleteSpace`, `restoreSpaceFromTrash`, `activateSpace`, `reorderSpaces`.
- **Saved-tab:** `openSavedTab`, `focusSavedTab`, `goHome`, `makeThisHome`, `deleteSavedTab`, `renameTab`, `setTabBoundary`.
- **Pinned-tab and favourites:** `pinTab`, `unpinTab`, `reorderPinned`, `pinSavedTab`, `favoriteTab`, `favoriteSavedTab`, `reorderFavorites`.
- **Pinned-tab folder:** `createFolder`, `createFolderFromTabs`, `renameFolder`, `setFolderIcon`, `setFolderColor`, `deleteFolder`.
- **Lens:** `createLens`, `updateLens`, `deleteLens`, `refreshLens` (see Requirement: Lens lifecycle commands), `openLensItem` (see Requirement: Lens-item activation command).
- **Temporary-tab and navigation:** `reorderTemp`, `focusTab`, `closeTab`, `newTab`, `clearTempTabs`, `undoClearTempTabs`, `clearDuplicateTempTabs`, `groupTempTabsBySite`, `renameTempTab`, `openUrl`.
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

### Requirement: groupTempTabsBySite command

The `SidebarCommand` union SHALL include a `groupTempTabsBySite` kind with
payload `{ windowId: WindowId; spaceId?: SpaceId }`, mirroring
`clearDuplicateTempTabs`'s payload shape, registered in `SIDEBAR_COMMAND_KINDS`,
in the sidebar-origin allowlist, and in `COMMAND_SCHEMAS` as a `z.strictObject`
whose payload is `z.strictObject({ windowId: z.number(), spaceId: z.string().optional() })`.

The sidebar SHALL dispatch it when the user activates a panel's "Group by site"
kebab-menu item, carrying that panel's `spaceId`. The coordinator's handler SHALL
reorder only the targeted Space instance's `tempTabIds` within `windowId` so that
tabs sharing a hostname are contiguous — see the `spaces-and-tabs` capability's
"Group temporary tabs by site" requirement for the full clustering rule.

Unlike `clearTempTabs` / `clearDuplicateTempTabs`, this handler SHALL mutate
`tempTabIds` directly (there is no Chrome event to propagate a pure reorder) and
SHALL therefore call `markDirty` itself — but ONLY when the store reports the
order actually changed. `store.groupTempTabsBySite` SHALL return a `boolean` for
that purpose; the coordinator broadcasts solely on the `markDirty` flag, so a
`void` return would leave an already-clustered list broadcasting needlessly.

The handler SHALL NOT call `chrome.tabs.remove`, `chrome.tabs.create`, or
`chrome.tabs.move`, and SHALL NOT touch `archivedTabs` or `liveTabsById`.

A Space that resolves to no instance in `windowId` SHALL be a **silent no-op**
acked `'ok'`, matching `clearDuplicateTempTabs` (`handlers/temp-tabs.ts`) and
`store.reorderTemp`, which both return without throwing — an absent instance is
a transient state, not a caller error. The handler SHALL therefore not throw for
it. Should the handler throw for any other reason, the coordinator SHALL emit a
`lunma/command-ack` carrying `{ error }`, per the general ack contract.

#### Scenario: groupTempTabsBySite clusters the targeted Space's temporary tabs

- **GIVEN** window 100's Space `work` has temporary tabs at `a.com/1`, `b.com/1`, `a.com/2`
- **WHEN** a sidebar dispatches `bus.send({ kind: 'groupTempTabsBySite', payload: { windowId: 100, spaceId: 'work' } })`
- **THEN** that instance's `tempTabIds` SHALL order the two `a.com` tabs before the `b.com` tab, preserving their relative order

#### Scenario: groupTempTabsBySite is a no-op on an already-clustered list

- **WHEN** the resolved Space's temporary tabs are already contiguous by hostname and `groupTempTabsBySite` is dispatched
- **THEN** no state SHALL change and no `state-broadcast` SHALL be emitted

#### Scenario: groupTempTabsBySite closes nothing

- **WHEN** `groupTempTabsBySite` runs over a Space with temporary tabs
- **THEN** no `chrome.tabs.remove` SHALL be called and `archivedTabs` SHALL be unchanged

#### Scenario: A Space with no instance in the window is a silent no-op

- **WHEN** `groupTempTabsBySite` resolves to a Space with no instance in `windowId`
- **THEN** the handler SHALL leave state untouched, SHALL NOT throw, and the coordinator SHALL ack `'ok'`

#### Scenario: An already-clustered list does not mark the drain dirty

- **WHEN** `groupTempTabsBySite` runs and `store.groupTempTabsBySite` returns `false`
- **THEN** the handler SHALL NOT call `markDirty` and the drain SHALL emit no `state-broadcast`
