# spaces-and-tabs Specification

## Purpose

Defines the domain model for Lunma Spaces and the per-window tab/group
instances that materialize them, including identity, storage, lifecycle,
sync adoption, and soft-delete.
## Requirements
### Requirement: Space identity and storage

A Space SHALL be a Lunma-owned record persisted in `chrome.storage.local`, identified by a Lunma-generated id (`crypto.randomUUID()`). A Space SHALL NOT be backed by a Chrome bookmark folder. The Space record SHALL carry `id`, `name`, `color`, and `icon` (a member of `IconName`, the lucide string-literal union from `apps/extension/src/shared/icon-names.ts`). The Space's order SHALL be its position in `state.spaces[]`; no separate `order` field SHALL exist in storage at any level (Spaces or saved tabs).

#### Scenario: A Space is a Lunma-owned record

- **WHEN** a Space "Work" is created
- **THEN** `state.spaces` SHALL contain a record `{ id: <uuid>, name: 'Work', color: <color>, icon: <icon> }`
- **AND** no Chrome bookmark folder SHALL be created for it

#### Scenario: Space order is array order

- **WHEN** the sidebar requests the ordered list of Spaces
- **THEN** the order returned SHALL match the order of records in `state.spaces[]`

#### Scenario: No explicit order field is persisted

- **WHEN** a developer inspects the persisted state shape
- **THEN** no `order: number` field SHALL appear on any Space or saved-tab record

#### Scenario: A new Space is persisted with the user-chosen icon

- **WHEN** the `createSpace` handler runs with payload `{ name: 'Work', color: 'blue', icon: 'briefcase', windowId: 1 }`
- **THEN** the persisted Space record SHALL have `icon: 'briefcase'`
- **AND** the field SHALL round-trip through `chrome.storage.local` unchanged

### Requirement: Space names are unique

No two Spaces in `state.spaces` SHALL share a name under the normalized comparison
`normalizeSpaceName(name) = name.trim().toLocaleLowerCase()`, exported from
`apps/extension/src/shared/space-names.ts`. The Space record SHALL store the user's chosen casing
and surrounding form unchanged — only the *comparison* is normalized. Uniqueness is
**global** across all Spaces (not per-window and not scoped by colour), because a
single Space record may be instantiated in multiple windows and its name is the only
restart-durable key the boot adoption fallback (`group.title === space.name`) has.

Enforcement SHALL split by origin:

**1. Interactive create / rename SHALL be rejected.** `store.createSpace` SHALL throw
when the normalized name equals that of any existing Space. `store.renameSpace` SHALL
throw when the normalized new name equals that of any **other** Space (the Space being
renamed is excluded, so re-applying its own name or only changing its casing is
allowed). The coordinator's `createSpace` / `renameSpace` handlers SHALL let the throw
propagate to the `'lunma/command-ack'`, which the dispatcher's `bus.send` rejects with.

**2. Non-interactive mints SHALL auto-disambiguate.** Where Lunma mints or restores a
Space without a user-typed name — fresh-install group→Space conversion, restore from
trash, and the boot data migration — it SHALL pass the desired name through
`disambiguateSpaceName(desired, takenNormalized): string`, a pure function that returns
`desired` when its normalized form is absent from `takenNormalized`, else the first of
`"{desired} 2"`, `"{desired} 3"`, … whose normalized form is absent. These paths SHALL
NOT throw on collision.

**3. The Chrome-side rename mirror SHALL NOT throw.** When `tabGroups.onUpdated`
mirrors a user's Chrome-group title change back onto the Space, a title colliding with
another Space's name SHALL be resolved through `disambiguateSpaceName` (and the Chrome
group re-titled to the disambiguated name so group and record stay in lockstep), never
left to throw inside the drain.

#### Scenario: Creating a Space with an in-use name is rejected

- **GIVEN** `state.spaces` already contains a Space named "Work"
- **WHEN** the `createSpace` handler runs with payload name "work" (any casing/whitespace normalizing to "work")
- **THEN** `store.createSpace` SHALL throw
- **AND** the coordinator SHALL emit a `'lunma/command-ack'` carrying `{ error }`, which `bus.send` rejects with
- **AND** no second "Work" Space SHALL be added to `state.spaces`

#### Scenario: Renaming a Space to another Space's name is rejected

- **GIVEN** Spaces "Work" and "Personal" exist
- **WHEN** the user renames "Personal" to "Work"
- **THEN** `store.renameSpace` SHALL throw and the record's name SHALL remain "Personal"

#### Scenario: A Space may keep its own name (case-only edit allowed)

- **GIVEN** a Space named "Work"
- **WHEN** the user renames it to "work" (same Space, casing-only change)
- **THEN** `store.renameSpace` SHALL NOT throw and the record's name SHALL become "work"

#### Scenario: Restoring a trashed Space disambiguates a now-taken name

- **GIVEN** Space "Work" was trashed, then a new Space "Work" was created
- **WHEN** the user undoes the deletion to restore the trashed Space
- **THEN** the restored Space's name SHALL be disambiguated to "Work 2"
- **AND** both Spaces SHALL coexist with distinct names

#### Scenario: A Chrome-side group rename to an in-use name does not crash the drain

- **GIVEN** Spaces "Work" and "Side" exist, and "Side"'s live Chrome group is renamed by the user to "Work"
- **WHEN** `tabGroups.onUpdated` mirrors the title change
- **THEN** "Side" SHALL be renamed to a disambiguated "Work 2" (its Chrome group re-titled to match), NOT to a duplicate "Work"
- **AND** the drain SHALL complete without throwing

### Requirement: Space materialization as tab groups

A Space SHALL materialize as zero or more Chrome tab groups — at most one per window where the Space has at least one tab. The mapping between (Space, window) and tab group SHALL be tracked in a **per-(window, Space)** map `spaceInstancesByWindow: { [windowId]: { [spaceId]: { spaceId: string, groupId: number, tempTabIds: number[] } } | undefined }`. A window's entry holds an instance for **every** Space that has been instantiated in that window — not only the active one — so a Space's `groupId` and `tempTabIds` survive switching away from it and back. The active instance for a window is `spaceInstancesByWindow[windowId]?.[activeSpaceByWindow[windowId]]`.

A `groupId` of the reserved sentinel value (`-1`) means "no live Chrome group yet" — the Space has no tab in that window, or its group has not been (re)created. A Space MAY be active in multiple windows simultaneously; each window's instance SHALL maintain its own `groupId` and `tempTabIds`. A Space's identity SHALL NOT depend on any Chrome tab group existing. A Space with no instantiated windows SHALL continue to exist as a Lunma-owned record in `state.spaces`.

#### Scenario: Same Space active in two windows

- **WHEN** the user activates Space "Work" in window A and then in window B
- **THEN** `spaceInstancesByWindow[A]["work"]` and `spaceInstancesByWindow[B]["work"]` SHALL each exist
- **AND** each instance SHALL hold its own `groupId` and its own `tempTabIds` array

#### Scenario: A switched-away Space keeps its instance

- **GIVEN** window 100 has Space "Work" instantiated with `tempTabIds: [17, 22]` and a live `groupId`
- **WHEN** the user switches window 100 to Space "Side"
- **THEN** `spaceInstancesByWindow[100]["work"]` SHALL still exist with `tempTabIds` containing the still-open ids
- **AND** `spaceInstancesByWindow[100]["side"]` SHALL be the active instance

#### Scenario: Space with no instantiated windows persists

- **WHEN** every window that instantiated Space "Work" is closed
- **THEN** the Space "Work" SHALL still exist as a record in `state.spaces`
- **AND** no entry for it SHALL exist under any window in `spaceInstancesByWindow`

### Requirement: Per-window active Space tracking

Each Chrome window SHALL have exactly one active Space or `null`. State key: `activeSpaceByWindow: { [windowId]: spaceId | null }`. Activating a Space in a window SHALL update `activeSpaceByWindow[windowId]` and ensure a matching instance exists under `spaceInstancesByWindow[windowId][spaceId]`. Switching the active Space SHALL expand the incoming Space's Chrome group and collapse the outgoing Space's Chrome group (when each exists), driven by the coordinator (see Requirement: Space tab-group orchestration (backend contract)).

#### Scenario: Activating a Space in a window

- **WHEN** the user activates Space "Side" in window 100
- **THEN** `activeSpaceByWindow[100] === "side"`
- **AND** `spaceInstancesByWindow[100]["side"]` SHALL exist

#### Scenario: Switching the active Space in a window

- **WHEN** window 100 has Space "Work" active (with a live group) and the user switches to "Side"
- **THEN** the Chrome group for "Work" in window 100 SHALL be collapsed
- **AND** the Chrome group for "Side" in window 100 SHALL be expanded (created first if "Side" has tabs but no group yet)
- **AND** `activeSpaceByWindow[100] === "side"`
- **AND** `spaceInstancesByWindow[100]["work"]` SHALL be retained (not discarded)

### Requirement: Temporary tabs are per-window

A temporary tab SHALL be a Chrome tab inside a window's Space instance that is not bound to any Lunma bookmark. Temporary tabs SHALL be tracked in `spaceInstancesByWindow[windowId][spaceId].tempTabIds`, and the tab SHALL be a member of that instance's Chrome tab group (when the group exists). Temporary tabs SHALL NOT be synced across devices.

Every Chrome tab inside a Lunma tab group SHALL be either a temporary tab in that window's instance, or bound to a Lunma bookmark via the binding model. Never both, never neither.

**Per-window ownership uniqueness.** Within a single window, a given Chrome tab id SHALL appear in **at most one** Space instance's `tempTabIds`. Every operation that adds a tab id to an instance's `tempTabIds` (including `onTabCreated` and `restoreTempTab`) SHALL first remove that tab id from any *other* instance in the same window, so the addition is exclusive by construction. (Eviction is scoped to the window: the same Space active in two windows keeps independent `tempTabIds`, and a tab in one window's instance does not affect another window.)

#### Scenario: A tab not bound to a bookmark is a temporary tab

- **WHEN** a tab is created in window 100 whose active Space is "work" and no Lunma bookmark is bound to it
- **THEN** the tab id SHALL appear in `spaceInstancesByWindow[100]["work"].tempTabIds`
- **AND** the tab SHALL be a member of that instance's Chrome tab group

#### Scenario: A bound tab is not a temporary tab

- **WHEN** a tab is bound to a Lunma bookmark via the binding model
- **THEN** the tab id SHALL NOT appear in any `tempTabIds` list

#### Scenario: A tab is owned by exactly one instance per window

- **GIVEN** window 100 has instances for Spaces "work" and "side", and tab 42 is in `spaceInstancesByWindow[100]["work"].tempTabIds`
- **WHEN** tab 42 is added to "side"'s instance (e.g. via `onTabCreated` while "side" is active, or `restoreTempTab`)
- **THEN** tab 42 SHALL be removed from `spaceInstancesByWindow[100]["work"].tempTabIds`
- **AND** tab 42 SHALL appear in `spaceInstancesByWindow[100]["side"].tempTabIds` and in no other instance of window 100

### Requirement: New windows default to the last-activated Space

The store SHALL maintain a `lastActivatedSpaceId: string | null` that updates whenever any window activates a Space. When a new Chrome window is created and no Space has yet been chosen for it, the window SHALL be initialized with `activeSpaceByWindow[newWindowId] = lastActivatedSpaceId` (or `null` if no Space has ever been activated).

#### Scenario: Opening a new window inherits the most recent Space

- **WHEN** the user has just activated Space "Work" in window 100 and then opens window 200
- **THEN** `activeSpaceByWindow[200] === "work"`

#### Scenario: First-ever window with no Spaces

- **WHEN** Lunma starts with an empty Spaces list and a window opens
- **THEN** `activeSpaceByWindow[newWindowId] === null`

### Requirement: Closing a window discards its instance

When `chrome.windows.onRemoved` fires for `windowId`, Lunma SHALL delete `spaceInstancesByWindow[windowId]` (the whole per-Space map for that window) and `activeSpaceByWindow[windowId]` from the store. Temporary tabs in that window SHALL be discarded (they close with the window). Saved tabs (pinned + favicon row) SHALL be unaffected — they persist as Lunma-owned records.

#### Scenario: Closing a window with two instantiated Spaces

- **WHEN** window 100 has instances for Spaces "Work" and "Side" and the user closes window 100
- **THEN** `spaceInstancesByWindow[100]` SHALL be removed from the store in its entirety
- **AND** the Space records for "Work" and "Side" SHALL remain unchanged
- **AND** the saved tabs pinned in those Spaces SHALL remain unchanged

### Requirement: Renaming a Space is atomic across the Space record and live tab groups

Renaming a Space SHALL apply the new name to the Space record in `state.spaces`
AND to every **live** tab group in every window where that Space is instantiated,
via `chrome.tabGroups.update`. Each window's persisted group id SHALL first be
reconciled against Chrome via `resolveGroup`: a **stale** group — one that no
longer resolves (dissolved by a restart, ungrouped by the user, or migrated to
another window) — SHALL be SKIPPED, NOT treated as an update failure; its title is
re-applied when the group is next materialized on activation. If
`chrome.tabGroups.update` fails for a **live** group, Lunma SHALL revert the
record change; the rename SHALL NOT be partially applied. A stale group SHALL
NEVER trigger a revert.

#### Scenario: Rename succeeds across two active windows

- **WHEN** Space "Work" is active in windows 100 and 200 and the user renames it to "Day Job"
- **THEN** the Space record's `name` SHALL change to "Day Job"
- **AND** the tab group title in windows 100 and 200 SHALL change to "Day Job"

#### Scenario: Rename rolls back on a live-group failure

- **WHEN** the record rename succeeds but `chrome.tabGroups.update` fails for a live group in one window
- **THEN** Lunma SHALL revert to the pre-rename name
- **AND** the failure SHALL be logged via `log.error`

#### Scenario: Rename applies when the persisted group is stale

- **GIVEN** Space "Work" carries a `groupId` that no longer resolves in Chrome (dissolved by a restart)
- **WHEN** the user renames it to "Day Job"
- **THEN** the Space record's `name` SHALL change to "Day Job" and SHALL NOT be reverted
- **AND** no `chrome.tabGroups.update` SHALL be attempted against the stale group

### Requirement: Soft-delete via the trash store with auto-purge

Deleting a Space SHALL move the Space record into `state.trash[spaceId]` with a `deletedAt: ISO-8601 timestamp` and remove it from `state.spaces`. All live tab groups for that Space in all windows SHALL be closed. A purge routine SHALL run at SW boot and SHALL remove any `state.trash` entry whose `deletedAt` is older than 30 days, including the saved-tab records that belonged to it. The sidebar SHALL show an undo affordance that restores the record to `state.spaces` and clears `deletedAt`. No separate "Trash" UI SHALL ship in v1 beyond the undo affordance.

#### Scenario: Deleting a Space moves it to trash

- **WHEN** the user deletes Space "Personal"
- **THEN** `state.trash['personal']` SHALL contain the record with a `deletedAt` timestamp
- **AND** "Personal" SHALL no longer appear in `state.spaces`
- **AND** all live tab groups for "Personal" SHALL be closed

#### Scenario: Undo restores a deleted Space

- **WHEN** the user deletes Space "Personal" and then invokes undo within the affordance window
- **THEN** the record SHALL return to `state.spaces`
- **AND** the `deletedAt` metadata SHALL be cleared

#### Scenario: Trash purge at SW boot

- **WHEN** SW boots and finds a `state.trash` entry whose `deletedAt` is more than 30 days old
- **THEN** the entry SHALL be removed from `state.trash` along with its saved-tab records

### Requirement: SpaceInstance lifecycle on Space activation

Activating a Space in a window SHALL ensure an instance exists at `spaceInstancesByWindow[windowId][spaceId]` (creating one with `groupId: -1, tempTabIds: []` if absent) and SHALL reconcile its Chrome tab group:

- If the instance's `groupId` is `-1` or no longer resolves via `chrome.tabGroups.get`, and the Space has tabs open in the window, the coordinator SHALL group those tabs into a new Chrome group and record the resulting `groupId`.
- If the instance already has a live `groupId`, it SHALL be reused — `groupId` and `tempTabIds` (filtered for tabs closed in the meantime) SHALL be preserved.
- Because a Chrome group cannot be empty, a Space with no open tabs in the window SHALL have `groupId: -1` until its first tab is created (see Requirement: Space tab-group orchestration). When activation would otherwise leave the window showing only collapsed groups, the coordinator SHALL open a fresh tab in the activated Space.

#### Scenario: First activation with open tabs creates a group

- **WHEN** window 100 activates Space "Work" for the first time and tabs 17 and 22 belong to "Work" in window 100
- **THEN** a new Chrome tab group SHALL be created containing 17 and 22
- **AND** `spaceInstancesByWindow[100]["work"].groupId` SHALL be the new group's id (not `-1`)

#### Scenario: Re-activating an already-instantiated Space reuses its group

- **WHEN** window 100 has Space "Work" with `groupId: 12345` and `tempTabIds: [17, 22]`, then switches to "Side", then switches back to "Work"
- **AND** group `12345` still resolves via `chrome.tabGroups.get`
- **THEN** `spaceInstancesByWindow[100]["work"].groupId` SHALL still be `12345`
- **AND** `tempTabIds` SHALL still contain the original ids (filtered for any closed in the meantime)

#### Scenario: Stale groupId after restart is rebuilt

- **WHEN** window 100 activates Space "Work" whose persisted `groupId` no longer resolves via `chrome.tabGroups.get` and tabs 30, 31 belong to "Work"
- **THEN** the coordinator SHALL group 30 and 31 into a new Chrome group
- **AND** SHALL record the new `groupId` on the instance

### Requirement: At-least-one-Space invariant

Lunma SHALL guarantee that `LunmaStore.state.spaces` is never empty during normal operation. Two enforcement points:

**1. First-boot creation.** On SW boot, after `loadState()` and `runRestartRecovery()` complete but before `chrome.*` event listeners are registered, the SW SHALL invoke `ensureAtLeastOneSpace(store)` from `apps/extension/src/background/default-space.ts` — UNLESS the boot read `outcome` returned by `loadState()` is `'unavailable'`, in which case the SW SHALL NOT invoke `ensureAtLeastOneSpace` (a transient storage-read failure produces an empty in-memory store that MUST NOT be mistaken for an empty store, so no Default may be fabricated over the real on-disk data). When invoked: if `store.state.spaces` is empty, the function SHALL call `store.createSpace({ name: 'Default', color: 'gray', icon: 'star' })` — minting a Lunma record id internally — and return after `state.spaces` contains the new Default Space. No Chrome bookmark SHALL be created. If `state.spaces` is non-empty, the call SHALL be a no-op and SHALL be idempotent (calling it twice creates exactly one Default Space).

**2. Last-Space deletion refused.** `LunmaStore.deleteSpace(spaceId)` SHALL refuse to soft-delete a Space when doing so would leave `state.spaces` empty: it SHALL log an error with code `LAST_SPACE_DELETION_REFUSED` and return without modifying state. The soft-delete behaviour (move to trash, close tab groups, clear bindings) SHALL apply when ≥2 Spaces exist.

#### Scenario: First-ever boot creates a Default Space

- **WHEN** the SW boots and `chrome.storage.local` is empty
- **AND** `loadState()` returns `outcome: 'clean'` with `createInitialState()` (empty spaces) and `runRestartRecovery()` completes
- **THEN** `ensureAtLeastOneSpace(store)` SHALL be invoked
- **AND** `store.createSpace` SHALL be called with `{ name: 'Default', color: 'gray', icon: 'star' }`
- **AND** `store.state.spaces` SHALL contain exactly one Space named "Default" with colour `'gray'`
- **AND** no `chrome.bookmarks.create` SHALL be called

#### Scenario: Default is not minted after an unavailable read

- **WHEN** the SW boots and `loadState()` returns `outcome: 'unavailable'` (an empty in-memory store caused by a transient `chrome.storage.local.get` failure)
- **THEN** the SW SHALL NOT invoke `ensureAtLeastOneSpace(store)`
- **AND** `store.state.spaces` SHALL remain empty for that boot
- **AND** no `persist(store.snapshot())` SHALL occur, leaving the on-disk `lunma.state` intact for the next boot

#### Scenario: Boot with existing Spaces is a no-op

- **WHEN** the SW boots and `store.state.spaces.length >= 1` after load and recovery
- **THEN** `ensureAtLeastOneSpace(store)` SHALL NOT call any `store` mutator
- **AND** `store.state.spaces` SHALL be unchanged

#### Scenario: ensureAtLeastOneSpace is idempotent

- **WHEN** `ensureAtLeastOneSpace(store)` is called twice against an initially-empty store
- **THEN** after both calls, `store.state.spaces.length` SHALL equal 1

#### Scenario: deleteSpace refuses to remove the last Space

- **WHEN** `store.state.spaces` contains exactly one Space and `store.deleteSpace(thatSpace.id)` is called
- **THEN** the mutator SHALL log `LAST_SPACE_DELETION_REFUSED`
- **AND** `store.state.spaces.length` SHALL remain 1 and `store.state.trash` SHALL NOT contain the Space

#### Scenario: deleteSpace works normally when other Spaces remain

- **WHEN** `store.state.spaces` contains two Spaces (A and B) and `store.deleteSpace(A.id)` is called
- **THEN** Space A SHALL be moved to `store.state.trash[A.id]` with a `deletedAt` timestamp
- **AND** `store.state.spaces` SHALL contain only Space B
- **AND** any `spaceInstancesByWindow` / `activeSpaceByWindow` entries for A SHALL be removed or set to `null`

### Requirement: User-driven Space creation (backend contract)

Lunma SHALL accept a `SidebarCommand['createSpace']` from any sidebar-side dispatcher and SHALL create a Lunma-owned Space record with the user-supplied colour and icon, then auto-activate it in the supplied window — all within a single coordinator drain cycle. Exactly one persist and one `state-broadcast` fire for the operation; no intermediate broadcast emits the new Space in a partial state.

**1. Payload shape.** `{ name: string; color: SpaceColor; icon: IconName; windowId: WindowId }`. The sidebar SHALL NOT include any folder or bookmark id.

**2. Backend action.** The coordinator's `createSpace` handler SHALL call `store.createSpace({ name, color, icon })` (which mints a `crypto.randomUUID()` id) and then `store.activateSpace(windowId, newSpaceId)`. No `chrome.bookmarks.create` and no `markSelfCreatedFolder` SHALL be involved.

**3. Atomicity within a single drain.** All side-effects SHALL execute within one drain iteration, emitting one persist and one `state-broadcast` reflecting the post-creation state.

**4. Failure handling.** If creation fails, the handler SHALL throw; the coordinator emits a `'lunma/command-ack'` with `{ error }`, which the dispatcher's `bus.send` surfaces as a rejected promise.

#### Scenario: createSpace command produces an active Space with all three fields

- **WHEN** a sidebar dispatches `bus.send({ kind: 'createSpace', payload: { name: 'Work', color: 'blue', icon: 'briefcase', windowId: 42 } })`
- **THEN** `store.createSpace({ name: 'Work', color: 'blue', icon: 'briefcase' })` SHALL register the new Space with a Lunma-generated id
- **AND** `store.activateSpace(42, newSpaceId)` SHALL set `state.activeSpaceByWindow[42] = newSpaceId`
- **AND** exactly one `state-broadcast` SHALL be emitted, whose `state.spaces` contains a Space with `color: 'blue'`, `icon: 'briefcase'`, `name: 'Work'`
- **AND** no `chrome.bookmarks.create` SHALL be called

#### Scenario: Auto-activation respects the supplied windowId, not the focused window

- **WHEN** a sidebar in window 10 dispatches `createSpace` with `windowId: 10` while window 20 is focused
- **THEN** `store.activateSpace` SHALL be called with `(10, newSpaceId)`, NOT `(20, newSpaceId)`

### Requirement: Sidebar shell composition

The sidebar SHALL render at the Chrome side-panel's default path with the following
vertical composition, top to bottom: a top search bar, a global favicon grid, a pinned
section header, the pinned tab list (or its empty-state copy), a temporary-section
divider carrying a Clear action, a New Tab row, the temporary tab list, and a Space
switcher pinned to the bottom. The sidebar SHALL be a flex column with the tab-list
region taking the remaining height.

**0. Top search bar.** The sidebar SHALL render a trigger-mode `SearchField` as its
FIRST element (above the favicon grid). Activating it SHALL open the new-tab launcher
for the window (`requestNewTabLauncher`). This is the restored search pill: an earlier
revision removed it and relocated launcher reach into the Space switcher bar, but on
user feedback the search bar is back at the top and OWNS the launcher entry — so the
launcher icon button is removed from the switcher bar (Settings remains there).

**1. Global favicon grid.** A fixed, icon-only **grid of plated favorites** directly
below the search bar, shared across every Space and window (see Requirement: Global
favicon grid in the sidebar, and the `lunma-bookmark-bindings` capability for tile
rendering, removal, the right-click menu, and drag).

**2. Pinned section header.** Renders the active (slide's) Space's **icon and name as a
row**, laid out like the tab and folder rows — the Space glyph at the favicon column,
the name at the title column, at row height and title weight, **sentence-case (NOT
uppercased)**, hue-tinted under the immersive tints (Per-Space colour identity, signal
3). Its trailing edge carries a **kebab overflow menu** — the SAME `RowMenu` morph the
tab rows (via `TabRowMenu`) and folder rows compose: a hover-revealed `⋮` kebab whose
row morphs in place into an action card sharing one elevated surface (the header is
transparent while open so it reads as a single card, not a darker bar stacked on the
actions). The menu SHALL carry a **"New folder"** item whose selection dispatches
`createFolder { spaceId }`. The header SHALL NOT display a count of pinned bookmarks.
When no menu items are provided (e.g. the Temporary section header), the trailing edge
SHALL render nothing and the header SHALL NOT morph.

**3. Pinned empty state.** When the active Space has zero pinned bookmarks, the sidebar
SHALL render a two-line empty-state row: "No pinned tabs yet." + dim sub-line "Save tabs
you want to keep open across sessions." Its text SHALL share the list's leading inset so
it aligns with the header glyph and the favicon column.

**4. Temporary divider + Clear.** In place of a "Temporary" section header, the sidebar
SHALL render a thin horizontal **divider**. The divider SHALL carry a trailing **Clear**
action (a down-arrow icon + "Clear") that dispatches `clearTempTabs`; the Clear action
SHALL be shown only when the active Space has ≥1 temporary tab open in the window.

**5. New Tab row.** Below the divider the sidebar SHALL render a full-width **+ New Tab**
row (leading plus icon + "New Tab" label) that dispatches `newTab`. The row SHALL be
present whether or not the Space has temporary tabs (it is the affordance for an empty
list — there is NO "No temporary tabs" empty-state copy).

**6. Temporary list.** When the active Space has one or more temporary tabs, the sidebar
SHALL render the Temporary tab list (see Requirement: Temporary tabs list rendering and
interaction) directly below the New Tab row. When it has zero, no list is rendered (only
the divider + New Tab row remain).

**7. Empty render when no active Space.** If `state.activeSpaceByWindow[windowId]` is
null or the sidebar's window id cannot be resolved, the sidebar SHALL render the top
search bar and the global favicon grid (both Space-independent) and the bottom switcher
(so the user can pick a Space) but SHALL hide the pinned header, the divider/New
Tab/Clear affordances, and the temp list.

#### Scenario: Sidebar mounts with active Space and zero temp tabs → divider + New Tab, no empty copy

- **GIVEN** the sidebar is mounted for window 1 with active Space `work` (0 pinned, 0 temp)
- **THEN** the rendered DOM SHALL contain, in order: a top search bar, a global favicon grid, a pinned section header showing the Space's icon + name as a row with a trailing kebab overflow menu (the `RowMenu` morph), a pinned empty-state row, a temporary divider, a New Tab row, and a space switcher
- **AND** the pinned section header SHALL NOT render a count
- **AND** SHALL NOT render any "No temporary tabs" empty-state copy
- **AND** SHALL NOT render the Clear action (no temporary tabs)

#### Scenario: Sidebar mounts with temp tabs → list plus Clear

- **GIVEN** the sidebar is mounted for window 1 with active Space `work` whose `tempTabIds` has two entries with matching `liveTabsById` records
- **THEN** the Temporary section SHALL render a New Tab row followed by a list of two `TabRow`s
- **AND** the divider SHALL render a Clear action

#### Scenario: Sidebar mounts with no active Space → hides section content

- **GIVEN** the sidebar is mounted for window 1 with `activeSpaceByWindow[1] === null`
- **THEN** the rendered DOM SHALL contain a top search bar, a global favicon grid, and a space switcher
- **AND** SHALL NOT contain the pinned header, the divider, the New Tab row, the temp list, or empty-state copy

#### Scenario: The top search bar opens the launcher

- **GIVEN** the sidebar is mounted for window 1
- **WHEN** the user clicks the top search bar
- **THEN** the sidebar SHALL request the new-tab launcher for window 1 (`requestNewTabLauncher`)

### Requirement: Per-Space colour identity on the sidebar

The sidebar SHALL render with a colour identity bound to the active Space's `color`. The identity is composed of **three** layered visual signals: hue-rebound surfaces, the tinted pinned-section header, and a top-down Space-colour wash. (The former inner-edge colour stripe is REMOVED — see signal 2.) All derive from the active Space's **canonical OKLCH** — a per-colour lightness, chroma, and hue produced by the pure utility `colourToOklch(c: SpaceColor): { l: number; c: number; h: number }` exported from `apps/extension/src/shared/space-hue.ts`, surfaced as the scoped custom properties `--space-l`, `--space-chroma`, and `--space-h`. The thin accessors `colourToHue(c)` (`.h`) and `colourToChroma(c)` (`.c`) remain for hue/chroma-only callers and SHALL agree with `colourToOklch`. Text drawn ON a Space colour SHALL read a per-colour ink `--space-on` produced by the pure utility `colourToOn(c: SpaceColor): string` from the same module.

**1. Hue rebinding.** When the sidebar is rendered with `data-tint` set to `'subtle' | 'standard' | 'vivid'` (default `'standard'` in this release), it SHALL re-bind `--base-hue` to `var(--space-h)` at the `.sidebar` scope, so every neutral token derived from `--base-hue` recomputes against the Space's hue.

**2. Edge stripe — REMOVED.** The former 3px inner-edge Space-colour stripe (`.sidebar::before`) is **no longer rendered** (sidebar-favicon-row, user feedback): the hard colour line on the panel edge read as unwanted chrome. The sidebar SHALL NOT render an inner-edge stripe at any tint. Space identity now reads through the remaining signals (hue rebinding, the tinted section header, the top wash). (The signal number is retained so the cross-references "signal 6", "signal 9", etc. elsewhere stay stable.)

**3. Section-header tint.** The pinned-section header is the active Space's name rendered as a row (see Sidebar shell composition, signal 2). When `data-tint` is `'standard'` or `'vivid'`, that header (icon + name) SHALL render in the Space colour at a lightness floor that keeps it readable over the top wash (signal 9): `oklch(from var(--space-c) max(l, 0.72) c h / 0.95)`. Under `'subtle'` and `'off'` it SHALL use the neutral row-title text colour. The lightness floor SHALL be chosen so the header meets WCAG 2.1 AA (≥ 4.5:1) against the washed background for every `SpaceColor` hue (see signal 9).

**4. Space-c tokens scoped to sidebar.** The tokens `--space-c`, `--space-c-soft`, `--space-c-dim` SHALL be declared inside the `.sidebar` selector (NOT at `:root`) so they read the scoped `--space-h`. Their chroma SHALL read the `--space-chroma` custom property (default `0.15`, declared at `.sidebar`) and their lightness SHALL read the `--space-l` custom property (the colour's canonical lightness; `:root` default = the resting-ember `0.62`) rather than a hardcoded literal, so a neutral Space can suppress chroma AND each colour renders true to its name. Declaring them at `:root` would freeze them at the global `--base-hue`.

**5. Canonical OKLCH map (bus colour → { l, c, h }).** The `colourToOklch` utility SHALL map the **nine** named `SpaceColor` values — `red`, `orange`, `yellow`, `green`, `cyan`, `blue`, `purple`, `pink`, `gray` — each to a per-colour OKLCH lightness/chroma/hue chosen so the colour reads **true to its name** (e.g. `yellow` light, `blue` deep) rather than the single flat lightness used before. The nine are exactly Chrome's nine `chrome.tabGroups.Color` values, so every `SpaceColor` maps 1:1 to a Chrome tab-group colour and the former `lime`→`green` / `teal`→`cyan` folds are gone; `lime` and `teal` SHALL NOT be members of `SpaceColor`. `gray` SHALL be the lone neutral (chroma `0`, the global `--base-hue`). The canonical per-colour values live in `apps/extension/src/shared/space-hue.ts` and are gated by the per-colour contrast tests in `apps/extension/src/ui/contrast.test.ts`. The utility SHALL be pure (no side effects, no Date, no random) and exhaustive over the `SpaceColor` union.

**6. Transition on Space switch.** When `state.activeSpaceByWindow[windowId]` changes, the sidebar SHALL transition every hue-dependent neutral via CSS `transition: <property> var(--motion-slow) var(--ease-emphasised)` so the surfaces cross-fade between the colours (hue AND lightness) over 320ms. The transition SHALL include `background-image` so the wash (signal 9) cross-fades too. Under `prefers-reduced-motion: reduce`, the transition SHALL collapse to `--motion-fast` (120ms) via the global token override.

**7. Fallback when no active Space.** If `activeSpaceByWindow[windowId]` is null, the sidebar SHALL use the global `--base-hue` and the resting-ember `--space-l` / `--space-on` defaults (no Space override).

**8. Neutral gray and per-colour identity.** `colourToChroma(c)` SHALL return `0` for `gray` and the colour's **canonical per-colour chroma** otherwise, and SHALL be pure and exhaustive over `SpaceColor`. Surfaces that paint a per-Space colour (`--space-c` family, the switcher chip's icon tile, the wash, the aurora, the hue glow, the accent) SHALL derive from `oklch(var(--space-l) var(--space-chroma) var(--space-h) / <alpha>)` (a small clamped `calc()` lightness offset is permitted where surface layering requires it) so that a `gray` Space renders as a **true neutral** and every other colour renders true to its name. Every consumer that sets `--space-h` inline (the sidebar root, the content slides, each switcher chip, the editor preview, the new-tab home, the drag clone, and the launcher overlay) SHALL also set `--space-chroma`, `--space-l`, and `--space-on` from the canonical OKLCH.

**9. Top-down Space-colour wash.** When `data-tint` is `'subtle' | 'standard' | 'vivid'`, the `.sidebar` shell SHALL paint a top-anchored vertical `linear-gradient` of the active Space colour (`oklch(var(--space-l) var(--space-chroma) var(--space-h) / <alpha>)`) as a `background-image`, strongest at the top edge and fading to `transparent` by roughly two-thirds of the height, so the tab lists below read against the neutral `--bg`. The wash SHALL track `--space-l`, `--space-chroma`, and `--space-h` (a `gray` Space washes neutral) and SHALL cross-fade on Space switch via the `background-image` transition (signal 6). Its alpha SHALL scale by tint intensity — `standard` fullest, `subtle` and `vivid` lighter (`vivid` already tints the substrate). The wash alphas SHALL be bounded so that, composited over `--bg`, **all sidebar text meets WCAG 2.1 AA (≥ 4.5:1)** for every `SpaceColor` colour: row titles, the search-pill placeholder, and the pinned-section header (the last via the signal-3 lightness floor). No wash SHALL be painted when `data-tint` is `'off'` or unset.

**10. On-colour text.** Text rendered on a Space colour — the switcher chip's icon glyph / count and any on-accent label — SHALL use the per-colour `--space-on` ink (dark on light colours, light on dark colours) so it meets WCAG 2.1 AA across the palette's full light→dark range, asserted **per colour** by `apps/extension/src/ui/contrast.test.ts`.

#### Scenario: Active Space colour cascades into sidebar tokens

- **GIVEN** the sidebar is mounted with active Space `work` whose `color` is `'blue'`
- **THEN** the sidebar element SHALL carry the inline styles `--space-h`, `--space-chroma`, `--space-l`, and `--space-on` from `colourToOklch('blue')` / `colourToOn('blue')` (e.g. `--space-h: 252`)
- **AND** the sidebar element SHALL carry the attribute `data-tint="standard"`

#### Scenario: No inner-edge stripe is rendered

- **GIVEN** the sidebar is mounted with any active Space and any tint
- **THEN** the sidebar SHALL NOT render an inner-edge colour stripe element (the `.sidebar::before` stripe is gone)

#### Scenario: A gray Space renders neutral, not tinted

- **GIVEN** the sidebar is mounted with active Space whose `color` is `'gray'`
- **THEN** the sidebar element SHALL carry `--space-chroma: 0`
- **AND** the per-Space colour surfaces (`--space-c`, the chip icon tile, the wash) SHALL resolve to a neutral grey (chroma 0), not a tint at the default hue

#### Scenario: The top wash renders and stays WCAG-safe

- **GIVEN** the sidebar is mounted with `data-tint="standard"` and an active Space of any `SpaceColor`
- **THEN** the `.sidebar` SHALL paint a top-down Space-colour wash that fades to transparent before the tab lists
- **AND** the pinned-section header, search placeholder, and row titles SHALL each meet WCAG 2.1 AA (≥ 4.5:1) over the washed background

### Requirement: Bottom space switcher

The sidebar SHALL render a Space switcher pinned to its bottom edge. The switcher SHALL
render one chip per Space in `state.spaces`, in the order they appear. The chip for the
active Space SHALL be expanded (icon + name + tab count); chips for inactive Spaces SHALL
be collapsed (icon only). A trailing `+` "new Space" button SHALL be rendered and
**enabled**; activating it SHALL open the Space editor in create mode (see Requirement:
Space editor). At the switcher bar's trailing edge, after the chips and the `+` button,
the sidebar SHALL render a **Settings** icon button (the `IconButton` primitive, signal
6). (Launcher reach lives in the top search bar, not here.)

**1. Chip layout.** Active chip: 32px tall, padding `0 10px`, background `--space-c-soft`,
border `1px solid oklch(from var(--space-c) l c h / 0.4)`, contents are `[icon tile
18×18, --space-c background] [name text] [count text]`. Collapsed chip: 32×32 square, no
border, contents are `[icon tile 18×18, --space-c background]`. The chip's `--space-h`
SHALL be set inline to the chip's own Space hue so each chip's icon tile colour matches
its Space.

**2. Click dispatch.** Clicking an **inactive** Space chip SHALL call `bus.send({ kind:
'activateSpace', payload: { windowId, spaceId } })`. The sidebar SHALL NOT optimistically
update — it waits for the next `state-broadcast` to repaint. Clicking the **active** chip
SHALL instead open the Space editor in edit mode (see point 4); it SHALL NOT dispatch
`activateSpace`.

**3. The `+` button.** A 32×32 dashed-border chip with a `+` glyph, rendered after the
Space chips. It SHALL render **without** the `disabled` attribute and SHALL carry an
accessible label of "New Space". Activating it (click or keyboard) SHALL open the Space
editor in create mode for the switcher's `windowId`. The editor is an in-flow morph that
grows out of the switcher (see Requirement: Space editor), not a floating popover.

**4. Edit affordance.** Editing a Space SHALL be reachable two ways:
- **Primary (discoverable): click the active chip.** A left-click on the chip of the
  already-active Space SHALL open the Space editor in edit mode for that Space. The active
  chip's tooltip SHALL hint this (e.g. `"{name} · click to edit"`) and its `aria-label`
  SHALL be `"Edit {name}"`. This is conflict-free because clicking the active chip
  otherwise does nothing.
- **Secondary: right-click any chip.** A `contextmenu` on any Space chip (active or not)
  SHALL open the editor in edit mode for that chip's Space WITHOUT switching to it, and
  SHALL suppress the browser's default context menu.

Neither affordance SHALL alter an inactive chip's left-click behaviour (still dispatches
`activateSpace`).

**5. No spaces empty state.** If `state.spaces` is empty, the switcher SHALL render only
the `+` button (enabled) and the trailing Settings button. The user is not stuck because
`ensureAtLeastOneSpace` runs at SW boot, so this is theoretical — but the switcher SHALL
handle it without errors.

**6. Trailing Settings button.** At the switcher bar's trailing edge, the sidebar SHALL
render a **Settings** `IconButton` (gear icon) that SHALL call
`chrome.runtime.openOptionsPage()`. It SHALL compose the `IconButton` primitive; no icon
button SHALL be re-rolled inline. The launcher affordance is NOT here — it lives in the
top search bar (see Requirement: Sidebar shell composition, point 0); the launcher icon
button that briefly lived in this bar was removed when the search bar was restored.

#### Scenario: Switcher renders one chip per Space, active is expanded

- **GIVEN** `state.spaces` is `[{ id: 'work', name: 'Work', color: 'blue' }, { id: 'reading', name: 'Reading', color: 'orange' }]`
- **AND** `state.activeSpaceByWindow[windowId]` is `'work'`
- **WHEN** the sidebar mounts
- **THEN** the switcher SHALL render two chips
- **AND** the chip for `work` SHALL be expanded — its DOM SHALL contain the text "Work" and a count number
- **AND** the chip for `reading` SHALL be collapsed — its DOM SHALL NOT contain the text "Reading"
- **AND** a trailing `+` button SHALL render **without** the `disabled` attribute
- **AND** a trailing Settings icon button SHALL render at the bar's trailing edge, and NO launcher icon button (it moved to the top search bar)

#### Scenario: Click an inactive chip dispatches activateSpace

- **GIVEN** the switcher is rendered for window 1 with active Space `work` and inactive `reading`
- **WHEN** the user clicks the `reading` chip
- **THEN** `bus.send` SHALL be called exactly once with `{ kind: 'activateSpace', payload: { windowId: 1, spaceId: 'reading' } }`
- **AND** the sidebar SHALL NOT immediately update the active-chip rendering — it SHALL wait for the next `state-broadcast`

#### Scenario: `+` button opens the Space editor in create mode

- **GIVEN** the switcher is rendered for window 1
- **WHEN** the user activates the trailing `+` button
- **THEN** the `+` button SHALL NOT carry the `disabled` attribute
- **AND** the Space editor SHALL open in create mode, growing out of the switcher
- **AND** the editor SHALL carry `windowId: 1` for the eventual `createSpace` dispatch

#### Scenario: Clicking the active chip opens the editor in edit mode

- **GIVEN** the switcher is rendered for window 1 with active Space `work`
- **WHEN** the user clicks the `work` chip (the active one)
- **THEN** the Space editor SHALL open in edit mode seeded from the `work` Space
- **AND** `bus.send` SHALL NOT be called with `activateSpace`

#### Scenario: Right-click a chip opens the Space editor in edit mode

- **GIVEN** the switcher is rendered with a chip for Space `work`
- **WHEN** the user fires a `contextmenu` event on the `work` chip
- **THEN** the browser's default context menu SHALL be prevented
- **AND** the Space editor SHALL open in edit mode seeded from the `work` Space, growing out of the switcher

#### Scenario: The trailing Settings button opens options

- **GIVEN** the switcher is rendered for window 1
- **WHEN** the user clicks the trailing Settings icon button
- **THEN** the sidebar SHALL call `chrome.runtime.openOptionsPage()`
- **AND** the switcher SHALL render no launcher icon button (launcher reach is the top search bar)

### Requirement: Interactive swipe-to-switch Space (touch and trackpad)

The sidebar SHALL support a horizontal gesture that previews the next / previous Space
in real time while the user is dragging and commits when the drag crosses a threshold.
Two input modalities are supported: single-finger touch (`TouchEvent`) and trackpad
horizontal scroll (`WheelEvent` with `deltaX` dominating `deltaY`). Mouse-button drag is
intentionally NOT a supported modality.

**1. Live drag follow.** While the user is mid-gesture, the sidebar SHALL apply a
horizontal `translateX` to the content region so the visual position tracks the input
**1:1** (no damping factor). The displacement SHALL be clamped to the content-stage
width. At a list edge with no neighbour in the drag direction the rail SHALL LOCK at its
rest position with **no over-scroll and no feedback** (no glow, no rubber-band give) — for
both modalities (see §5; design D14). A reverse swipe still escapes the wall immediately.

**2. Direction mapping.** A gesture whose horizontal displacement is negative (finger /
fingers moved left, or trackpad `deltaX > 0`) SHALL activate the NEXT Space in
`state.spaces`; a positive displacement SHALL activate the PREVIOUS Space.

**3. Commit threshold (crossed mid-gesture).** The commit SHALL fire **the instant**
`|accumulated displacement| ≥ threshold` is crossed during the gesture — NOT on release.
The default threshold SHALL be approximately **15 % of the content-stage width**
(the sidebar computes `Math.round(0.15 * stageWidth)` and passes it to the swipe action;
the action's `threshold` option remains in CSS px). The commit dispatch SHALL be
`bus.send({ kind: 'activateSpace', payload: { windowId, spaceId } })` exactly as a chip
click; the sidebar SHALL NOT optimistically update the active-Space state (the carousel
animates optimistically, but the authoritative active Space arrives via broadcast).

**4. Frame-rate-independent settle (compositor transition).** When the gesture commits, is
cancelled below threshold, or the active Space changes by any other means (chip click,
broadcast from another window), the carousel SHALL animate the offset to its resting
position with a **compositor CSS transition** on the track `transform` — `transition:
transform <dur> cubic-bezier(0.16, 1, 0.3, 1)` (`--ease-emphasised`) over a duration sourced
from the `--motion-space-switch` token (**250 ms**). Running the glide on the **compositor
thread** (not a JS per-frame rAF loop) keeps it smooth and constant-speed even under
main-thread load — the JS-rAF settle stuttered/froze under a competing re-render; the
compositor transition does not (design D10). It completes in the **same wall-clock duration
regardless of display refresh rate**. The 1:1 live drag SHALL set `transition: none` for an
instant follow; a fresh `easeTo` mid-transition re-bases from the current computed position
for free, so a broadcast arriving mid-animation or a back-to-back commit continues seamlessly
rather than cutting. The post-commit momentum tail is dropped while the wheel stream is settled
(§8), so it never disturbs an in-flight settle; a genuine re-swipe re-arms (§8b) and
follows the rail **1:1 from its current position** — re-basing the settle rather than
being blocked — so a rapid re-swipe feels immediately responsive instead of stuck. Under
`prefers-reduced-motion: reduce`, the settle SHALL collapse to `--motion-fast` (or snap),
while the 1:1 live-drag follow is preserved.

**5. No wrap at edges (silent lock).** Swiping forward from the LAST Space SHALL NOT
activate any Space (no wrap to the first). Swiping backward from the FIRST Space SHALL NOT
activate any Space (no wrap to the last). At a no-neighbour edge the rail SHALL stay
**locked at its rest position with no over-scroll and no feedback** — no edge glow, no
rubber-band give, for both modalities (design D14). The accumulated push SHALL be capped at
a small distance (≈20 px) so a reverse swipe is **never blocked by buildup** — only that
tiny amount must be unwound to scroll back out. In no case SHALL a Space be activated.

**6. Vertical-dominant motion ignored.** Gestures whose vertical displacement exceeds the
horizontal SHALL NOT trigger a Space switch — page-scroll gestures pass through cleanly.

**7. Multi-touch starts ignored.** A touch gesture that begins with more than one finger
SHALL NOT trigger a Space switch.

**8. Trackpad stream settling and re-arm.** For wheel input, a stream that has committed
or cancelled SHALL be considered **settled**, and every subsequent wheel event (including
the entire macOS momentum tail) SHALL be dropped until the stream re-arms. A settled
stream SHALL re-arm on **either** of two signals: (a) a silence gap of at least 120 ms
with no further wheel events (the guaranteed fallback), or (b) a **genuine velocity
re-acceleration** distinguished from the decaying / still-rising momentum tail by ALL of
**three** conditions, because no fewer suffice on real momentum (design D13): (i) a
**sustained rise** — `|deltaX|` above the tracked decay floor by a ratio AND rising vs the
previous frame for ≥2 consecutive frames (rejects a single coalesced spike); (ii) a **decay
valley** — `|deltaX|` must have fallen below a fraction (≈0.35) of the gesture's PEAK since
the stream settled (a single swipe rising to its own peak never dips; a real re-flick comes
after the momentum dies, so it clears one — this prevents a hard swipe whose 15 %-threshold
commit lands BEFORE peak velocity from re-arming on its own rising momentum); and (iii) a
**post-commit cooldown** — at least ≈90 ms since the last commit (a real re-flick cannot
physically re-arm sooner). Requiring all three is what prevents a **momentum tail (decaying
OR still-rising) from re-arming and committing a second Space** ("skips two Spaces").
Re-arming SHALL only reset the accumulator — a commit still requires re-crossing the
threshold (§3), so a re-arm SHALL NOT by itself activate a Space.

**9. `[data-no-swipe]` opt-out.** Wheel events whose `target` is inside an element marked
`[data-no-swipe]` (e.g. the bottom Space switcher with its own horizontal overflow) SHALL
pass through untouched.

**10. No active Space.** When `state.activeSpaceByWindow[windowId]` is null the carousel
renders no slides (there is no current Space to centre), so a gesture SHALL be a no-op:
no Space is activated and no `activateSpace` is dispatched. (Trued up to shipped reality —
the carousel commit resolves the destination from the active Space's neighbours, which do
not exist when there is no active Space.)

**11. At most one commit per physical gesture.** A single physical trackpad gesture (the
drag plus the momentum tail it spawns) SHALL produce at most one commit. Momentum alone
SHALL NOT cause a second commit.

**12. Re-swipe during momentum.** A deliberate second swipe SHALL be recognised without
waiting for the previous gesture's momentum to fully decay — a re-acceleration (§8b)
re-arms the stream immediately so the new gesture can commit.

#### Scenario: Leftward touch swipe past threshold activates the next Space

- **GIVEN** `state.spaces` is `[{id: 'a'}, {id: 'b'}, {id: 'c'}]` and the active Space for window 1 is `'a'`
- **WHEN** the user performs a single-finger swipe whose horizontal displacement crosses the commit threshold leftward with little vertical movement
- **THEN** `bus.send` SHALL be called exactly once with `{ kind: 'activateSpace', payload: { windowId: 1, spaceId: 'b' } }`

#### Scenario: Wheel swipe commits the instant the 15% threshold is crossed, not on release

- **GIVEN** the content-stage width is 320 CSS px and the active Space `'a'` has a next Space `'b'`
- **WHEN** a wheel stream accumulates leftward displacement and crosses −48 px (15 % of 320) while events are still arriving
- **THEN** `bus.send({ kind: 'activateSpace', payload: { spaceId: 'b' } })` SHALL fire at the crossing frame, not on a later idle/release
- **AND** the stream SHALL become settled and drop the remaining momentum events

#### Scenario: One hard flick commits exactly once

- **GIVEN** a single hard trackpad flick that commits `'next'` and spawns a long decaying momentum tail
- **WHEN** the momentum events continue with monotonically decaying `|deltaX|` and no re-acceleration
- **THEN** `bus.send` SHALL be called exactly once for that physical gesture
- **AND** the stream SHALL NOT re-arm from the decaying momentum

#### Scenario: Velocity re-arm allows re-swiping during momentum

- **GIVEN** a wheel stream has just committed `'next'` and is settled while its momentum tail is still arriving
- **WHEN** the momentum decays into a valley and then the user performs a fresh flick — a sustained rise clear of the decay floor, past the post-commit cooldown
- **THEN** the stream SHALL re-arm immediately (without waiting for a 120 ms silence)
- **AND** a subsequent threshold crossing SHALL commit the next Space

#### Scenario: A single swipe whose momentum keeps rising past the commit does not re-commit

- **GIVEN** a hard swipe in the narrow sidebar crosses the 15 % threshold and commits BEFORE its velocity peaks, then keeps accelerating with no decay valley
- **WHEN** that same gesture's still-rising momentum continues
- **THEN** the stream SHALL NOT re-arm (no valley, within the cooldown) and SHALL commit exactly once

#### Scenario: Settle duration is independent of refresh rate

- **GIVEN** the carousel settle animation is driven by elapsed time, not a per-frame factor
- **WHEN** the same settle runs under a 60 Hz and a 120 Hz frame cadence
- **THEN** it SHALL reach its resting position in the same wall-clock duration in both cases

#### Scenario: Swipe past the last Space is a no-op

- **GIVEN** `state.spaces` is `[{id: 'a'}, {id: 'b'}, {id: 'c'}]` and the active Space is `'c'`
- **WHEN** the user performs a leftward swipe past the commit threshold
- **THEN** `bus.send` SHALL NOT be called
- **AND** the rail SHALL stay locked at its rest position with no over-scroll and no feedback

#### Scenario: Wheel push past the last Space locks at rest and never blocks reversing

- **GIVEN** the active Space is the last in `state.spaces`
- **WHEN** a wheel stream pushes forward (toward a non-existent next Space) past the commit threshold
- **THEN** `bus.send` SHALL NOT be called and the rail SHALL stay at its rest position (no over-scroll, no feedback)
- **AND** a subsequent reverse push SHALL only need to unwind the small capped amount before a backward commit becomes possible (the buildup never traps the user)

#### Scenario: Vertical-dominant gesture passes through

- **GIVEN** the sidebar is mounted
- **WHEN** the user performs a touch with horizontal displacement +40 px and vertical displacement +140 px
- **THEN** `bus.send` SHALL NOT be called

### Requirement: Live tab metadata slice

Lunma SHALL maintain an ephemeral `liveTabsById: { [tabId: TabId]: LiveTab }` map on `AppState`, mirroring live Chrome-tab metadata for rendering. A `LiveTab` SHALL be `{ tabId: TabId, windowId: WindowId, title: string, url: string, active: boolean, status: 'loading' | 'complete' }`. The slice SHALL be maintained entirely by the service worker from Chrome tab events and SHALL be broadcast to the sidebar as part of `AppState`. It SHALL NOT be persisted (see the storage-and-migrations capability). On service-worker boot, after `loadState()` and recovery and before listener registration, the SW SHALL rebuild it from `chrome.tabs.query({})` via `store.rebuildLiveTabs(tabs)`.

The store SHALL expose `syncLiveTab(tab)` (insert/update from `onCreated` / `onUpdated`), `removeLiveTab(tabId)` (from `onRemoved`), `setActiveTab(windowId, tabId)` (from `onActivated`), and `rebuildLiveTabs(tabs)` (boot seed). `syncLiveTab` SHALL be a no-op broadcast-wise when none of the visible fields (`title`, `url`, `active`, `status`) change.

#### Scenario: Boot rebuilds liveTabsById from chrome.tabs.query

- **WHEN** the SW boots and `chrome.tabs.query({})` returns two tabs (ids 17 and 22)
- **THEN** `store.rebuildLiveTabs` SHALL populate `state.liveTabsById` with a `LiveTab` for 17 and 22
- **AND** each `LiveTab` SHALL carry that tab's `windowId`, `title`, `url`, `active`, and a `status` of `'loading'` or `'complete'`

#### Scenario: onActivated updates the active flag

- **WHEN** tab 22 becomes active in window 100 and `setActiveTab(100, 22)` runs
- **THEN** `state.liveTabsById[22].active` SHALL be `true`
- **AND** any other `LiveTab` in window 100 that was previously `active` SHALL become `false`

#### Scenario: onRemoved prunes the entry

- **WHEN** tab 17 is closed and `removeLiveTab(17)` runs
- **THEN** `state.liveTabsById` SHALL NOT contain key `17`

#### Scenario: Unchanged visible fields do not force a broadcast

- **WHEN** `syncLiveTab` is called for tab 17 with the same `title`, `url`, `active`, and `status` it already holds
- **THEN** the slice SHALL be unchanged and no redundant broadcast SHALL be required for this event

### Requirement: Boot adoption of already-open tabs into the temporary list

At service-worker boot, after windows are seeded and before listener registration, Lunma SHALL adopt the tabs already open in each window into that window's active Space as temporary tabs, so the Temporary list reflects what the user already has open rather than staying empty until the next Space switch. For each window with an active Space, Lunma SHALL ensure a `spaceInstance` exists (via `store.ensureSpaceInstance(windowId)`, which creates an empty instance without altering `lastActivatedSpaceId` or `activeSpaceByWindow`) and SHALL run each open tab through `store.onTabCreated`, which skips tabs already bound to a saved tab (rebound earlier in boot) and tabs already tracked. The pass SHALL be idempotent across boots and SHALL reuse the same `chrome.tabs.query({})` result used to rebuild `liveTabsById`.

#### Scenario: Existing tabs are adopted as temp tabs at boot

- **GIVEN** window 100's active Space is `work` with no `spaceInstance` yet, and `chrome.tabs.query({})` returns tabs 17 and 22 in window 100
- **WHEN** boot seeding runs
- **THEN** `state.spaceInstancesByWindow[100]` SHALL exist with `tempTabIds` containing 17 and 22

#### Scenario: A bound tab is not adopted as temporary

- **GIVEN** tab 17 in window 100 is bound to a saved tab and tab 22 is not
- **WHEN** boot seeding runs
- **THEN** `state.spaceInstancesByWindow[100].tempTabIds` SHALL contain 22 and SHALL NOT contain 17

#### Scenario: ensureSpaceInstance is a no-op without an active Space

- **WHEN** `store.ensureSpaceInstance(windowId)` runs for a window whose `activeSpaceByWindow` entry is null or undefined
- **THEN** no `spaceInstance` SHALL be created for that window

### Requirement: Temporary tabs list rendering and interaction

When the active Space has one or more temporary tabs, the sidebar SHALL render the Temporary section as a list of rows — one `TabRow` per temporary tab in `tempTabIds` array order. Each row SHALL show the tab's favicon (resolved by `faviconFor(url, favIconUrl)` as the **primary** source, with the `_favicon` page-URL endpoint — `faviconUrl(url)` — retried as the **fallback** when the primary fails to load, and a neutral globe icon only when both fail; this staged fallback is provided by the shared `Favicon` primitive that `TabRow` composes), the tab's `title`, and a **row overflow menu** — the SAME `TabRowMenu` morph the pinned rows compose: a hover-revealed `⋮` kebab whose row morphs in place into an action card. The row for the window's active tab SHALL render with the active treatment defined in the sidebar shell's colour identity.

A **home tab** SHALL NEVER appear in this list — home tabs are not added to `tempTabIds` (see "Home tabs are not listed as temporary tabs"), so an empty Space showing only its home renders no temporary rows (the divider + New Tab affordance from the sidebar shell remain).

Clicking a row SHALL dispatch `bus.send({ kind: 'focusTab', payload: { tabId } })`. The row overflow menu SHALL carry, top to bottom: a non-destructive **Favorite** action that dispatches `bus.send({ kind: 'favoriteTab', payload: { tabId, windowId } })` and leaves the tab open (see the `lunma-bookmark-bindings` capability, Requirement: Couple and decouple favorites by direct manipulation); a **Rename** action that opens the row's inline rename; and a **Close tab** action that dispatches `bus.send({ kind: 'closeTab', payload: { tabId } })` and SHALL NOT also trigger the row's focus. (The former inline close button moved into this menu — the favicon-row change — so temporary and pinned rows share one overflow-menu interaction.) A drag that begins on a temporary row and ends without crossing into the Pinned section SHALL be treated as a reorder within Temporary (dispatching `reorderTemp`); a drag that ends inside the Pinned section SHALL pin the tab (dispatching `pinTab`). A pointer interaction that does not pass the drag threshold SHALL remain a click, not a drag. The sidebar SHALL NOT optimistically update — it SHALL wait for the next `state-broadcast`. Rows SHALL be keyed by `tabId`. The Temporary list SHALL only render tabs present in `liveTabsById`; a `tempTabId` with no `liveTabsById` entry SHALL be skipped rather than rendered blank.

#### Scenario: Active Space with temp tabs renders a row list

- **GIVEN** window 100's active Space has `tempTabIds: [17, 22]` with matching `liveTabsById` entries
- **WHEN** the sidebar renders
- **THEN** the Temporary section SHALL contain two `TabRow` elements in that order

#### Scenario: Clicking a temp row focuses; the menu's Close closes

- **WHEN** the user clicks a temporary row, then opens its overflow menu and selects **Close tab**
- **THEN** the row click SHALL dispatch `focusTab` and the Close action SHALL dispatch `closeTab` without also dispatching `focusTab`

#### Scenario: The row menu's Favorite action keeps the tab open

- **WHEN** the user opens a temporary row's overflow menu and selects **Favorite**
- **THEN** the sidebar SHALL dispatch `favoriteTab` for that tab
- **AND** the tab SHALL remain open (no `closeTab` is dispatched)

#### Scenario: A home tab is excluded from the Temporary list

- **GIVEN** the active Space's only tab in the window is its home tab
- **THEN** the Temporary list SHALL render no rows (the home tab is not a temporary tab)

#### Scenario: A temp id without a live entry is skipped

- **GIVEN** `tempTabIds` contains `7` but `liveTabsById[7]` is absent
- **THEN** the Temporary section SHALL NOT render a row for `7`

#### Scenario: A CORP-blocked temp-tab favicon falls back to the endpoint

- **GIVEN** a temporary tab whose `favIconUrl` is a loadable-scheme URL that fails to load from the extension page (e.g. a Cross-Origin-Resource-Policy block)
- **WHEN** its `TabRow` renders
- **THEN** the row SHALL retry the `_favicon` page-URL endpoint before any globe
- **AND** the neutral globe icon SHALL render only if the `_favicon` endpoint also fails

### Requirement: Manual temporary tab ordering

The sidebar's Temporary list SHALL render an active Space's temporary tabs in the order of `spaceInstancesByWindow[windowId].tempTabIds` (the array order). The user SHALL be able to reorder temporary tabs by dragging; a completed reorder SHALL dispatch a `reorderTemp` command carrying the full post-drop tab-id order, and the resulting authoritative state broadcast SHALL define the rendered order (no optimistic update is layered on top). Reordering SHALL be expressed by reordering the `tempTabIds` array; no separate order field SHALL be persisted, and no `chrome.tabs.onMoved` listener SHALL be required for this ordering.

> Supersedes the prior most-recent-first ordering (archived `sidebar-temp-tabs`, which ordered by `tabLastActivity` via a pure `orderTempTabs` helper). The sidebar redesign moved the Temporary list to a directly drag-reorderable model alongside the Pinned list (ADR 0006); `orderTempTabs` is removed. A future `tab-sort-options` change MAY reintroduce alternate sort modes layered over the array order.

#### Scenario: Temp tabs render in tempTabIds array order

- **WHEN** window 100's active Space has `tempTabIds: [17, 22]` with matching `liveTabsById` entries
- **THEN** the Temporary list SHALL render tab 17 first, then tab 22

#### Scenario: Drag-reorder dispatches reorderTemp and the broadcast is authoritative

- **WHEN** the user drags temporary tab 17 below tab 22 in window 100
- **THEN** the sidebar SHALL dispatch `reorderTemp` with the post-drop order `{ windowId: 100, tabIds: [22, 17] }`
- **AND** after the SW broadcast, `spaceInstancesByWindow[100].tempTabIds` SHALL be `[22, 17]` and the sidebar SHALL render that order

### Requirement: Space editor

The sidebar SHALL provide a single Space editor surface (`SpaceEditor`) used in two modes — `create` and `edit` — that edits a Space's name, colour, and icon and dispatches the corresponding existing bus commands. The editor SHALL render as an **in-flow morph that grows out of the switcher** — an out-of-flow panel anchored to the switcher's top edge that unrolls upward over the tab list, so the switcher's and sidebar's heights never change. It SHALL NOT be a floating popover. It SHALL compose the `TextInput`, `ColorSwatch`, and `IconPicker` primitives plus `Button`, and SHALL hand-roll its dismissal (`Esc`, click-outside) and focus management. The colour row SHALL offer one `ColorSwatch` per palette colour, distributed across the full panel width. The `IconPicker` SHALL provide a **search box** over the full icon catalogue (`ICON_NAMES`): when empty it shows the curated `SPACE_ICONS` shortlist; when non-empty it shows a capped substring match over the full catalogue.

**1. Modes.** The editor SHALL accept a discriminated mode: `{ kind: 'create'; windowId }` or `{ kind: 'edit'; space }`.
- In `create` mode it SHALL seed `name = ''`, `color = nextUnusedColor(state.spaces)`, and `icon = DEFAULT_ICON`. The primary button SHALL read "Create".
- In `edit` mode it SHALL seed `name`, `color`, and `icon` from the supplied Space. The primary button SHALL read "Save".

**2. Validation.** The primary button SHALL be disabled whenever `name.trim() === ''`. The primary button SHALL ALSO be disabled, and a short inline message SHALL render beneath the name input, whenever the trimmed name is a **duplicate** — its `normalizeSpaceName` form equals that of another Space in `state.spaces` (in `edit` mode the edited Space is excluded from that comparison, so an unchanged or casing-only name is never flagged). The message slot SHALL reserve its space so the panel height does not change when it appears. Cancel SHALL never be disabled.

**3. Create dispatch.** On primary activation in `create` mode the editor SHALL call `bus.send({ kind: 'createSpace', payload: { name: name.trim(), color, icon, windowId } })` exactly once, then close and reset. Auto-activation of the new Space in `windowId` is the coordinator's responsibility (see Requirement: User-driven Space creation (backend contract)).

**4. Edit dispatch sends only changed fields.** On primary activation in `edit` mode the editor SHALL compare each field against the original Space and dispatch only the commands whose field changed:
- `renameSpace { spaceId, newName: name.trim() }` only when the trimmed name differs;
- `recolourSpace { spaceId, color }` only when the colour differs;
- `changeSpaceIcon { spaceId, icon }` only when the icon differs.
When no field changed, the editor SHALL dispatch nothing and simply close.

**5. Dismissal.** `Esc`, click-outside, and the secondary "Cancel" button SHALL each close the editor WITHOUT dispatching any command.

**6. Default colour selection.** `nextUnusedColor(spaces)` SHALL walk the palette colours in canonical order and return the first not present in `spaces.map(s => s.color)`; when all are present it SHALL return the least-used colour, tie-broken by palette order. The function SHALL be pure.

#### Scenario: Create mode seeds a default colour and dispatches createSpace

- **GIVEN** the editor is opened in create mode for window 7 while `state.spaces` already uses `red` and `orange`
- **THEN** the editor's selected colour SHALL be the first unused palette colour (e.g. `yellow`)
- **WHEN** the user types "Research" and activates "Create"
- **THEN** `bus.send` SHALL be called once with `{ kind: 'createSpace', payload: { name: 'Research', color: 'yellow', icon: <DEFAULT_ICON>, windowId: 7 } }`
- **AND** the editor SHALL close

#### Scenario: Create button is disabled until a name is entered

- **GIVEN** the editor is opened in create mode with an empty name
- **THEN** the "Create" button SHALL be disabled
- **WHEN** the user types a non-whitespace name
- **THEN** the "Create" button SHALL be enabled

#### Scenario: Duplicate name disables the primary button and shows a message

- **GIVEN** a Space named "Work" exists and the editor is opened in create mode
- **WHEN** the user types "work"
- **THEN** the "Create" button SHALL be disabled
- **AND** an inline message indicating the name is already used SHALL render beneath the name input
- **WHEN** the user changes the name to "Work 2"
- **THEN** the message SHALL clear and the "Create" button SHALL be enabled

#### Scenario: Edit mode does not flag the Space's own name

- **GIVEN** the editor is opened in edit mode for Space `{ id: 'work', name: 'Work', color: 'blue', icon: 'briefcase' }`
- **WHEN** the user changes only the colour and leaves the name "Work"
- **THEN** no duplicate-name message SHALL show and the "Save" button SHALL be enabled

#### Scenario: Edit mode dispatches only the changed fields

- **GIVEN** the editor is opened in edit mode for Space `{ id: 'work', name: 'Work', color: 'blue', icon: 'briefcase' }`
- **WHEN** the user changes only the colour to `teal` and activates "Save"
- **THEN** `bus.send` SHALL be called once with `{ kind: 'recolourSpace', payload: { spaceId: 'work', color: 'teal' } }`
- **AND** `bus.send` SHALL NOT be called with `renameSpace` or `changeSpaceIcon`
- **AND** the editor SHALL close

#### Scenario: Edit mode with no changes dispatches nothing

- **GIVEN** the editor is opened in edit mode for Space `work`
- **WHEN** the user activates "Save" without changing any field
- **THEN** `bus.send` SHALL NOT be called
- **AND** the editor SHALL close

#### Scenario: Cancel and Esc dismiss without dispatch

- **GIVEN** the editor is open in either mode with edited fields
- **WHEN** the user presses `Esc`, clicks outside the editor, or activates "Cancel"
- **THEN** the editor SHALL close
- **AND** `bus.send` SHALL NOT be called

#### Scenario: Icon search filters the full catalogue

- **GIVEN** the editor's icon picker shows the curated shortlist (an icon such as `anchor`, present in `ICON_NAMES` but not in `SPACE_ICONS`, is not shown)
- **WHEN** the user types "anchor" into the icon search box
- **THEN** the picker SHALL show the `anchor` tile
- **AND** selecting it SHALL set the editor's icon to `anchor`
- **WHEN** the user clears the search box
- **THEN** the picker SHALL show the curated `SPACE_ICONS` shortlist again

### Requirement: User-driven Space editing (backend contract)

Lunma SHALL accept the `renameSpace`, `recolourSpace`, and `changeSpaceIcon` `SidebarCommand`s from any sidebar-side dispatcher and SHALL apply each to the named Space within a single coordinator drain cycle, emitting one persist and one `state-broadcast` per command. The backend behaviour is unchanged by this change; this requirement records the contract the Space editor now exercises.

**1. Payload shapes.** `renameSpace { spaceId: SpaceId; newName: string }`, `recolourSpace { spaceId: SpaceId; color: SpaceColor }`, `changeSpaceIcon { spaceId: SpaceId; icon: IconName }`.

**2. Unknown spaceId.** A handler SHALL throw when its `spaceId` is not present in `state.spaces`; the coordinator surfaces the error via the command ack, which `bus.send` rejects with.

**3. Atomicity.** Each command's mutation SHALL execute within one drain iteration; no intermediate broadcast SHALL emit a partially-updated Space.

#### Scenario: recolourSpace updates the Space colour and broadcasts once

- **WHEN** a sidebar dispatches `bus.send({ kind: 'recolourSpace', payload: { spaceId: 'work', color: 'teal' } })` for an existing Space `work`
- **THEN** `store.recolourSpace('work', 'teal')` SHALL set `work.color = 'teal'`
- **AND** exactly one `state-broadcast` SHALL be emitted reflecting the new colour

#### Scenario: changeSpaceIcon on an unknown Space rejects

- **WHEN** a sidebar dispatches `changeSpaceIcon` with a `spaceId` not present in `state.spaces`
- **THEN** the handler SHALL throw
- **AND** the dispatcher's `bus.send` promise SHALL reject

### Requirement: Space tab-group orchestration (backend contract)

The coordinator (not any `LunmaStore` mutator) SHALL own all `chrome.tabGroups` / `chrome.tabs.group` / `chrome.tabs.ungroup` / `chrome.tabs.move` / activation `chrome.tabs.update` calls that materialize Spaces as tab groups. Store mutators SHALL remain synchronous and chrome-free, exposing only state writes (`recordSpaceGroup(windowId, spaceId, groupId)` and the nested-map temp-tab helpers). Each affected command SHALL still emit exactly one persist and one `state-broadcast` per drain cycle. Lunma SHALL only collapse, expand, retitle, recolour, or close Chrome groups whose `groupId` it tracks in `spaceInstancesByWindow`; user-created groups SHALL NEVER be touched.

A Space's **tab set in a window** (used to build / rebuild its group) SHALL be its temporary tabs (`tempTabIds` ∩ tabs open in the window) **plus** its bound (saved) tabs open in the window — a pinned tab is as much a member of its Space's group as a temporary tab. On activation the coordinator SHALL additionally title + recolour the (re)built group with the Space's `name` + `color` (best-effort; a titling failure SHALL NOT abort the activation).

**Global favorites are intentionally ungrouped (not members of any Space's group).** A saved tab whose `spaceId === null` (a global favorite, referenced by the flat `faviconRow` placement) is **not** a member of any Space's tab set and SHALL NOT be grouped into any Space's Chrome group. The coupling state maps directly onto Chrome tab-group membership: `spaceId = X` ⟺ the live tab is a member of Space X's group; `spaceId = null` ⟺ the live tab is **ungrouped** (global), so it is never collapsed and stays visible across every Space switch. Binding a `spaceId === null` favorite to a live tab SHALL establish "its live tab is ungrouped" as a post-condition, via a single coordinator helper (`ensureFavoriteUngrouped(tabId)`); the helper is idempotent. `ensureFavoriteUngrouped` SHALL additionally **park** the tab at the window's tab-strip start (`chrome.tabs.move(tabId, { index: 0 })`, the `moveTabToStripStart` wrapper) so the now-global tab sits OUTSIDE every Space group's contiguous span — ungrouping alone leaves it adjacent to its former group, where the next Space switch's collapse would sweep it invisible. See the `lunma-bookmark-bindings` capability for the favorite binding model and the couple/decouple group/ungroup transitions.

**1. Activation sequence.** On `activateSpace(windowId, spaceId)` the coordinator SHALL, in order: (a) ensure/reconcile the target group from the Space's window tab set (see SpaceInstance lifecycle); (b) ensure the target Space shows a focusable tab in the window — when it has none, land it on the **Lunma home**: REUSE the window's focused tab when that tab is already a home tab (group it into the target Space), else open one (which renders the home page); (c) activate a tab in the target group so focus leaves the outgoing group; (d) expand the target group and collapse every other tracked group in the window. Chrome refuses to collapse a group containing the active tab, so step (c) MUST precede step (d). When activation leaves a Space whose ONLY tab in the window is its home tab, the coordinator SHALL close that home tab (the Space returns to `groupId === -1`) rather than leave a collapsed home-only group — so visiting empty Spaces does not accumulate blank tabs. A home tab carries no user content, so closing it is non-destructive.

**1b. A selected global favorite keeps focus across a switch (sidebar-favicon-row).** When the window's **currently-selected** tab is a bound **global favorite** (`savedTabs[id].spaceId === null`), the `activateSpace` switch SHALL **preserve its focus**: the coordinator SHALL skip steps (b) and (c) — it SHALL NOT move focus into the incoming Space, and SHALL NOT open a home tab for an empty incoming Space (which therefore materializes its focusable tab lazily, the next time it actually receives focus). Steps (a) and (d) SHALL still run, so the sidebar and the favicon strip reflect the new active Space while the global favorite remains the selected, visible tab (it belongs to no Space, so a Space switch does not displace it). This focus-preservation applies ONLY to a selected global favorite and ONLY on the `activateSpace` *switch* path; `createSpace` and the `newTab`-into-another-Space path deliberately land focus in the target Space, and a regular (non-favorite) selected tab switches normally (focus moves into the incoming Space).

**2. New tab joins the active group.** On `tabs.onCreated` for a tab in window `W` whose active Space is `S` and which is not bound to a saved tab, the coordinator SHALL add the tab to `S`'s group via `chrome.tabs.group`. When `S` has no live group yet in `W` (e.g. at boot it has open tabs but was never activated this session), the coordinator SHALL build the group from `S`'s **whole window tab set** (its existing temp + bound tabs together with this tab), not from this tab alone — so the new tab is grouped WITH its siblings rather than in a lone one-tab group — then `recordSpaceGroup`. A home tab is grouped into `S` the same way but is NOT recorded in `tempTabIds` (see "Home tabs are not listed as temporary tabs").

**2b. Opened saved tab joins its Space's group, EXCEPT a global favorite.** On `openSavedTab` for a saved tab in Space `S` opened into window `W`, after binding the created tab the coordinator SHALL add it to `S`'s group in `W` (reusing the live group, or creating + recording + titling one when `S` has none yet). When the opened saved tab is a **global favorite** (`saved.spaceId === null`), the coordinator SHALL instead call `ensureFavoriteUngrouped(<created>)` rather than `addTabToSpaceGroup`, so the favorite's live tab is left ungrouped (global) and is never adopted into any Space's group. `addTabToSpaceGroup` keeps its `spaceId: SpaceId` signature; a favorite SHALL be routed to `ensureFavoriteUngrouped` before it could ever reach it.

**3. Rename / recolour propagate to groups.** On `renameSpace` / `recolourSpace`, the coordinator SHALL `chrome.tabGroups.update` the title / colour of the Space's live group in every window where it is instantiated. If a `chrome.tabGroups.update` fails during a rename, the name change SHALL be reverted (the existing rename-atomicity requirement).

**4. Delete closes groups.** On `deleteSpace`, the coordinator SHALL ungroup and close the Space's live groups in every window before the record moves to trash (the existing soft-delete requirement).

#### Scenario: Activation collapses the outgoing group and expands the incoming one

- **GIVEN** window 100 has "Work" active with live group `G_work` and "Side" instantiated with live group `G_side`
- **WHEN** the coordinator processes `activateSpace(100, "side")`
- **THEN** it SHALL activate a tab inside `G_side`, then expand `G_side` and collapse `G_work`
- **AND** exactly one persist and one `state-broadcast` SHALL be emitted for the drain

#### Scenario: Entering an empty Space lands on the home, reusing a focused home tab

- **GIVEN** window 100's active tab is a home tab and the user activates empty Space "Reading" (no open tabs)
- **WHEN** the coordinator processes `activateSpace(100, "reading")`
- **THEN** it SHALL group the existing home tab into "Reading" rather than opening a second tab
- **AND** "Reading"'s group SHALL contain exactly that one home tab

#### Scenario: Leaving an empty Space closes its home-only tab

- **GIVEN** window 100's active Space "Reading" is empty and showing only its home tab
- **WHEN** the user activates "Work"
- **THEN** the coordinator SHALL close "Reading"'s home tab
- **AND** `spaceInstancesByWindow[100]["reading"].groupId` SHALL become `-1`

#### Scenario: Switching Space while a global favorite is selected keeps it focused

- **GIVEN** window 100's selected tab is the live tab of a global favorite (`savedTabs['fav'].spaceId === null`), ungrouped, and the user activates another Space "Reading"
- **WHEN** the coordinator processes `activateSpace(100, "reading")`
- **THEN** it SHALL NOT activate any tab in "Reading" and SHALL NOT open a home tab for "Reading" when it is empty
- **AND** the favorite's tab SHALL remain the window's selected tab, still open and ungrouped
- **AND** "Reading"'s group (if any) SHALL still be expanded and the other tracked groups collapsed (the sidebar reflects the new active Space)

#### Scenario: Opening a tab groups it into the active Space

- **WHEN** a tab is created in window 100 whose active Space "work" has group `G_work`, unbound
- **THEN** the coordinator SHALL call `chrome.tabs.group({ groupId: G_work, tabIds: [<new>] })`
- **AND** the new tab id SHALL appear in `spaceInstancesByWindow[100]["work"].tempTabIds`

#### Scenario: Opening a saved (pinned) tab groups it into its Space

- **WHEN** the coordinator processes `openSavedTab` for a saved tab in Space "work" opened into window 100 whose "work" group is `G_work`
- **THEN** after binding the created tab the coordinator SHALL call `chrome.tabs.group({ groupId: G_work, tabIds: [<created>] })`
- **AND** the created tab SHALL be a member of `G_work`

#### Scenario: Opening a global favorite leaves its tab ungrouped (not grouped into any Space)

- **GIVEN** a saved tab `fav` is a global favorite (`savedTabs['fav'].spaceId === null`, referenced in `faviconRow`) and window 100's active Space "work" has group `G_work`
- **WHEN** the coordinator processes `openSavedTab` for `fav` into window 100
- **THEN** after binding the created tab the coordinator SHALL call `ensureFavoriteUngrouped(<created>)` and SHALL NOT call `addTabToSpaceGroup` / `chrome.tabs.group` for it
- **AND** the created tab SHALL be ungrouped (`groupId === -1`) and SHALL NOT be a member of `G_work` or any other Space group

#### Scenario: Rebuilding a stale group includes the Space's bound tabs

- **WHEN** the coordinator rebuilds Space "side"'s group in window 100 (its persisted `groupId` is stale) and "side" has a temp tab 30 and a bound tab 31 open in the window
- **THEN** both 30 and 31 SHALL be grouped into the newly-created group

### Requirement: Boot reconciliation of tab groups

On service-worker boot, after `seedExistingTabs` / `rebuildLiveTabs`, the coordinator boot path SHALL run a one-shot tab-group reconciliation (`reconcileTabGroupsOnBoot`) that **adopts** existing Chrome tab groups into Spaces, **materializes** any missing active-Space group, and **ungroups** any global favorite Chrome restored still inside a group. The pass SHALL run before the boot persist + broadcast so the broadcast carries the reconciled `groupId`s. Lunma SHALL keep being the source of truth — the pass NEVER deletes a Space, NEVER converts an untracked (user-created) group into a Space, and (during materialization) NEVER opens a tab or changes tab focus.

**Adoption.** For each existing Chrome tab group in a window, the pass SHALL try to match it to one of that window's persisted Space instances via the pure `matchGroupToSpace(group, candidates)` function and, on a match, re-bind that instance's `groupId` to the live group id (`recordSpaceGroup`). Matching SHALL score **tab-membership overlap** between the group's current member tab ids and the instance's persisted `tempTabIds` first, and SHALL fall back to **persisted title + colour** (`group.title === space.name` and `group.color === toGroupColor(space.color)`) only to break a zero/tied overlap. Because Space names are unique (see Requirement: Space names are unique), the title fallback resolves to at most one Space. Ties after both signals SHALL break deterministically by `spaces[]` order. A group matching no Space (the user's own group) SHALL be left untouched — never adopted, never retitled. Adoption SHALL perform no `chrome.tabGroups` mutation (state writes only). A **global favorite** (`spaceId === null`) is never a Space instance, so it can never match a group here — its membership is reconciled by the favorite-ungroup step below, not by adoption.

**Claim-guard (single binding per pass).** Within one adoption pass each Space SHALL be claimed by at most **one** group per window: once a Space has been adopted, it SHALL be removed from the candidate set for the window's remaining groups, so no two groups bind to one Space. Complementarily, `store.recordSpaceGroup(windowId, spaceId, groupId)` SHALL clear the `groupId` of any *other* instance in the same window that currently holds the incoming `groupId` (evicting a prior holder), so a single live `groupId` is never shared by two instances.

**Materialization.** After adoption, for each window whose active Space has tabs open in the window but still has `groupId === -1`, the pass SHALL group that Space's window tab set into a new Chrome group, title + recolour it with the Space identity, and `recordSpaceGroup` the new id. It SHALL then collapse the window's other tracked groups (active group expanded) on a **best-effort** basis — a collapse that Chrome refuses (e.g. the restored active tab is inside another group) SHALL be skipped, not retried, and SHALL NOT abort the pass. A Space with no open tabs in the window SHALL be left groupless (a group cannot be empty).

**Favorite ungroup reconciliation.** After adoption and materialization, the pass SHALL iterate the global favorites — each saved-tab id in `faviconRow` (`savedTabs[id].spaceId === null`) — and, for each window where Chrome restored the favorite's per-window bound tab, look up that tab's group in the boot tab→group map (`tabGroupById`, the same map adoption read from the boot tabs query). When the favorite's bound tab is still grouped (`tabGroupById.get(tabId) >= 0`), the pass SHALL `chrome.tabs.ungroup(tabId)` it, so a favorite that Chrome restored inside its old group is made global again before the next Space switch could collapse it invisible. This is best-effort — a refusal SHALL be swallowed like the other boot group ops and SHALL NOT abort the pass — and bounded by favorite × window count. A favorite whose bound tab Chrome restored already ungrouped (`tabGroupById.get(tabId)` is `-1` or absent) is a no-op.

#### Scenario: A restored group is adopted, not rebuilt

- **GIVEN** after a browser restart window 100's Space "work" persisted `groupId: 12` (now stale) and its instance `tempTabIds` include tabs 17 and 22
- **AND** Chrome has restored a group `77` in window 100 containing tabs 17 and 22
- **WHEN** the boot reconciliation runs
- **THEN** `matchGroupToSpace` SHALL match group `77` to "work" on tab overlap
- **AND** `spaceInstancesByWindow[100]["work"].groupId` SHALL be re-bound to `77` (no new group created)

#### Scenario: The active Space's group is materialized at boot

- **WHEN** window 100's active Space "work" has tabs 17 and 18 open in the window but no live group (`groupId === -1`) and no existing Chrome group matched it
- **THEN** the boot pass SHALL group 17 and 18 into a new Chrome group titled with "work"'s name + colour
- **AND** `spaceInstancesByWindow[100]["work"].groupId` SHALL be the new group's id

#### Scenario: An untracked user group is never adopted

- **GIVEN** window 100 contains a Chrome group whose members overlap no Space instance's `tempTabIds` and whose title/colour match no Space
- **WHEN** the boot reconciliation runs
- **THEN** that group SHALL NOT be adopted, retitled, or recolored
- **AND** no Space SHALL be created from it

#### Scenario: Boot never opens a tab or steals focus

- **WHEN** the active Space in a window has no open tabs at boot
- **THEN** the boot pass SHALL NOT open a tab for it and SHALL NOT change the active tab
- **AND** that Space SHALL remain `groupId === -1` until its first tab is created

#### Scenario: Two restored groups never bind to one Space

- **GIVEN** window 100 has one Space "work" and Chrome restored two groups `77` and `88`, both with zero tab overlap and both titled "work" (e.g. one is a user group hand-titled to match)
- **WHEN** the boot reconciliation runs
- **THEN** at most one of `77`/`88` SHALL be adopted into "work"; the second SHALL be left untracked
- **AND** `spaceInstancesByWindow[100]["work"].groupId` SHALL hold exactly one of the two ids, never both in turn

#### Scenario: A favorite restored still grouped is ungrouped at boot

- **GIVEN** a global favorite `fav` (`savedTabs['fav'].spaceId === null`, in `faviconRow`) whose window-100 bound tab `42` Chrome restored still inside Space "work"'s restored group `77`, so `tabGroupById.get(42)` is `77`
- **WHEN** the boot reconciliation runs
- **THEN** after adoption and materialization the favorite-ungroup step SHALL call `chrome.tabs.ungroup(42)`
- **AND** tab `42` SHALL become ungrouped (`groupId === -1`) so the next Space switch does not collapse it invisible

#### Scenario: A favorite restored already ungrouped is left alone

- **GIVEN** a global favorite `fav` whose window-100 bound tab `43` Chrome restored already ungrouped, so `tabGroupById.get(43)` is `-1` or absent
- **WHEN** the boot reconciliation runs
- **THEN** the favorite-ungroup step SHALL NOT call `chrome.tabs.ungroup(43)` (it is already global — a no-op)

### Requirement: Fresh-install conversion of Chrome groups into Spaces

On a **fresh install** — when no Spaces were loaded from storage at boot — the boot tab-group pass (`reconcileTabGroupsOnBoot(store, freshInstall)`, before adoption/materialization) SHALL convert each existing Chrome tab group into a Space so the user's existing groups appear as Spaces instead of collapsing into the single auto-created Default. `freshInstall` SHALL be determined as "`state.spaces` was empty after load, before `ensureAtLeastOneSpace`, AND the boot read `outcome` returned by `loadState()` was NOT `'unavailable'`". An `'unavailable'` outcome (a transient storage-read failure) is NOT a fresh install — its empty in-memory store SHALL NOT trigger conversion. Outside a fresh install the pass SHALL NOT convert any group into a Space.

For each existing group the conversion SHALL mint a Space whose colour is `fromGroupColor(group.color)` (the inverse of `toGroupColor`: Chrome `grey` → Lunma `gray`, other Chrome colours pass through, unknown → `gray`), MOVE that group's member tabs out of the Default into the new Space's `(window, Space)` instance (`store.assignSpaceTabs`, which removes them from any other instance in the same window), and re-bind the live group id (`store.recordSpaceGroup`). Bound (saved) tabs SHALL NOT be moved.

A group's Space name and fold behaviour depend on whether the group is titled. A **titled** group's Space name is its trimmed title; titled groups whose names are equal under `normalizeSpaceName` SHALL fold into ONE Space (instantiated once per window where a folded group lives), and that Space SHALL take the **first** folded group's colour — so two same-name groups of different colours produce a single Space rather than two same-named Spaces. An **untitled** group (empty/whitespace title) SHALL NOT fold with any other group — each untitled group SHALL become its own distinct Space named `'Group N'`, numbered sequentially (`'Group 1'`, `'Group 2'`, …) in iteration order.

A **titled** group whose trimmed title normalizes (`normalizeSpaceName`) to the name of a Space that already existed **before** this conversion pass — on a fresh install, the auto-created Default — SHALL fold into that pre-existing Space (assigning its member tabs and recording its live group id on it) rather than minting a new Space. This prevents a group literally titled `'Default'` from producing a duplicate `'Default 2'` Space alongside the auto-created Default. Every **minted** name — a titled group matching no this-pass and no pre-existing Space, or an untitled `'Group N'` — SHALL be passed through `disambiguateSpaceName` against the names already present in `state.spaces` so the uniqueness invariant (see Requirement: Space names are unique) holds. An untitled group's synthetic `'Group N'` name SHALL NOT fold into a same-named pre-existing Space (it is a Lunma-synthesized label, not a shared identity) and SHALL disambiguate as before.

Each window SHALL activate the Space whose group holds the window's active tab; a window whose active tab is ungrouped SHALL keep the Default active. After conversion the pass SHALL discard (`store.removeEmptySpace`) any pre-existing Space left with no temp tabs in any window and no pinned tabs — clearing the Default when every tab was grouped, keeping it when ungrouped tabs remain. `removeEmptySpace` SHALL hard-remove (NOT route through trash) and SHALL refuse to remove the last remaining Space. Conversion SHALL write state only (no `chrome.tabGroups` mutation).

#### Scenario: First install mints one Space per existing group

- **GIVEN** Lunma is installed with no persisted Spaces, and window 100 has two Chrome groups — `77` ("Work", blue, tabs 17+22) and `88` ("Side", red, tabs 30+31), with tab 17 active
- **WHEN** the boot pass runs with `freshInstall = true`
- **THEN** two Spaces "Work" (blue) and "Side" (red) SHALL exist, the auto-created Default SHALL be discarded
- **AND** "Work"'s window-100 instance SHALL hold tabs 17+22 bound to group `77`, "Side"'s SHALL hold 30+31 bound to group `88`
- **AND** window 100's active Space SHALL be "Work" (its group held the active tab)

#### Scenario: The Default is kept for ungrouped tabs

- **GIVEN** a fresh install where window 100 has group `77` ("Work", tabs 17+22) and an ungrouped, active tab 99
- **WHEN** the boot pass converts
- **THEN** a "Work" Space SHALL hold 17+22 and the Default SHALL be retained holding tab 99
- **AND** the Default SHALL remain active (the active tab is ungrouped) and its group SHALL be materialized

#### Scenario: Untitled groups stay separate and are numbered

- **GIVEN** a fresh install where window 100 has two untitled Chrome groups (`77` with tabs 17+22, `88` with tabs 30+31), both the same colour
- **WHEN** the boot pass converts
- **THEN** two distinct Spaces "Group 1" and "Group 2" SHALL exist (they SHALL NOT fold despite the shared colour)
- **AND** "Group 1" SHALL be bound to `77` and "Group 2" to `88`

#### Scenario: Same-identity groups across windows fold into one Space

- **GIVEN** a fresh install where windows 100 and 200 each have a "Work"/blue group (`77`, `78`)
- **WHEN** the boot pass converts
- **THEN** exactly ONE "Work" Space SHALL exist, with a window-100 instance bound to `77` and a window-200 instance bound to `78`

#### Scenario: Same-name groups of different colours fold into one Space

- **GIVEN** a fresh install where window 100 has groups `77` ("Work", blue) and `88` ("Work", red)
- **WHEN** the boot pass converts
- **THEN** exactly ONE "Work" Space SHALL exist (taking the first folded group's colour, blue)
- **AND** both `77` and `88`'s member tabs SHALL belong to that single "Work" instance

#### Scenario: Conversion does not run outside a fresh install

- **GIVEN** Lunma boots with at least one persisted Space (`freshInstall = false`)
- **WHEN** the boot pass runs and the window contains a Chrome group matching no Space
- **THEN** no Space SHALL be created from that group (it is handled only by adoption / left untracked)

#### Scenario: Conversion does not run after an unavailable read

- **GIVEN** the boot read `outcome` is `'unavailable'` (a transient `chrome.storage.local.get` failure), so `state.spaces` is empty after load
- **WHEN** the boot tab-group pass runs
- **THEN** `freshInstall` SHALL be `false`
- **AND** no Space SHALL be created from any existing Chrome group
- **AND** the on-disk `lunma.state` SHALL be left intact (no Default minted, no persist)

#### Scenario: A group titled "Default" folds into the auto-created Default

- **GIVEN** a fresh install where the auto-created Default exists and window 100 has a group `77` titled "Default" (tabs 17+22) plus an ungrouped, active tab 99
- **WHEN** the boot pass converts
- **THEN** exactly ONE Space named "Default" SHALL exist, with NO Space named "Default 2"
- **AND** that Default SHALL hold tabs 17+22 (folded from group `77`, bound to `77`) and SHALL retain ungrouped tab 99

#### Scenario: An untitled group colliding with an oddly-named Default still disambiguates

- **GIVEN** a fresh install where the auto-created Default is (unusually) named "Group 1" and window 100 has an untitled group `88` (tab 17) plus an ungrouped, active tab 99 keeping the Default
- **WHEN** the boot pass converts
- **THEN** the untitled group SHALL mint a distinct Space named "Group 1 2" (it SHALL NOT fold into the same-named Default)
- **AND** both "Group 1" and "Group 1 2" SHALL exist

#### Scenario: A recovery boot recovers Space names from restored group titles (no poisoning)

- **GIVEN** a corrupt-and-unsalvageable read (boot `outcome` `'recovered'`), so `state.spaces` is empty, and window 100 has a restored Chrome group `77` titled "Work" (tabs 17+22) with tab 17 active
- **WHEN** the boot pass runs with `freshInstall = true`
- **THEN** a Space named "Work" SHALL exist holding tabs 17+22 bound to group `77`
- **AND** group `77` SHALL NOT be retitled to "Default"
- **AND** no Space named "Default" SHALL persist (the empty auto-created Default is discarded)

### Requirement: Chrome tab-group lifecycle reconciliation (backend contract)

The coordinator SHALL observe `chrome.tabGroups.onRemoved` and `chrome.tabGroups.onUpdated` and reconcile Lunma state as **non-destructive hints**. These handlers SHALL only ever read state and call synchronous, chrome-free store mutators; they SHALL act only on groups whose id Lunma tracks in `spaceInstancesByWindow` (a group Lunma does not track is ignored).

**Group removed.** On `tabGroups.onRemoved(groupId)` for a tracked group, the coordinator SHALL call `store.forgetSpaceGroup(groupId)`, which finds the `(window, Space)` instance holding `groupId` and resets it to the `-1` "no live group" sentinel. The Space record, its `tempTabIds`, and its pinned saved-tab records SHALL be retained. Removing/ungrouping a Chrome group SHALL NEVER delete a Space. (When Lunma itself closed the group during `deleteSpace`, the instance is already gone, so `forgetSpaceGroup` is a no-op.)

**Group updated.** On `tabGroups.onUpdated` for a tracked group whose `title` changed, the coordinator SHALL mirror the new title back onto the Space via `store.renameSpace`, but ONLY when the new title differs from the Space's current `name` (so a Lunma-initiated retitle does not echo into a redundant rename / feedback loop). `color` and `collapsed` changes SHALL be ignored — Lunma owns Space colour, and collapse/expand is Lunma-driven.

#### Scenario: Manually ungrouping a Space's group keeps the Space

- **GIVEN** window 100's Space "work" has live group `42` and pinned saved tabs
- **WHEN** the user ungroups group `42` in Chrome and `tabGroups.onRemoved(42)` fires
- **THEN** `spaceInstancesByWindow[100]["work"].groupId` SHALL become `-1`
- **AND** the Space "work" and its pinned saved-tab records SHALL still exist

#### Scenario: Renaming a group in Chrome renames the Space

- **GIVEN** window 100's Space "work" (name "Work") has live group `42`
- **WHEN** the user renames group `42` to "Research" in Chrome and `tabGroups.onUpdated` fires with the new title
- **THEN** the coordinator SHALL call `store.renameSpace("work", "Research")`

#### Scenario: A Lunma-initiated retitle does not loop

- **WHEN** Lunma retitles group `42` to the Space's own current name and the resulting `tabGroups.onUpdated` echo fires
- **THEN** the coordinator SHALL NOT call `store.renameSpace` (the title already equals the Space's name)

#### Scenario: An untracked group's lifecycle events are ignored

- **GIVEN** a Chrome group whose id Lunma does not track in `spaceInstancesByWindow`
- **WHEN** `tabGroups.onRemoved` or `tabGroups.onUpdated` fires for it
- **THEN** no Space SHALL be created, renamed, or deleted

### Requirement: New Tab and Clear temporary-tab actions

The sidebar SHALL expose two temporary-tab actions, each acting on **its own carousel panel's Space**: a **New Tab** row that opens a tab, and a **Clear** action that dismisses that Space's temporary tabs. Because every Space panel is pre-rendered and fully live (the single-track carousel), the actions SHALL NOT toggle their interactivity at commit; in the common case the centred (active) panel's Space is the target. Both SHALL dispatch typed bus commands (no optimistic local mutation); the resulting Chrome tab events reconcile state and the broadcast refreshes the UI.

**New Tab.** Activating a panel's New Tab row SHALL dispatch `bus.send({ kind: 'newTab', payload: { windowId, spaceId } })` carrying that panel's `spaceId`. The coordinator's `newTab` handler SHALL, when `spaceId` is present and is NOT the window's active Space, **activate that Space first** (the same sequence as `activateSpace`) so the newly created — and focused — tab is visible in it; when `spaceId` is absent or already the active Space, no activation occurs and behaviour is unchanged. The handler SHALL then, when the window already has a **home tab** (a tab whose live URL is the new-tab page, recognised by `isNewTabUrl`), **focus that existing home tab** (activate it + bring its window forward) rather than create a second one — so repeated New Tab activations never accumulate home tabs (at most one home tab per window). Only when the window has no home tab SHALL the handler create one (active in the window), which joins the (now-)active Space's group via the existing tab-creation path.

**Clear.** Activating a panel's Clear action SHALL dispatch `bus.send({ kind: 'clearTempTabs', payload: { windowId, spaceId } })` carrying that panel's `spaceId`, which closes that Space's temporary tabs (pinned/bound tabs are untouched). Clear SHALL be rendered on any panel whose Space has ≥1 temporary tab open in the window, and hidden otherwise; clearing a background Space's temps SHALL NOT switch the active Space. When the temporary tabs being cleared are the window's **only** tabs, the coordinator SHALL open the Space home (a new home tab) BEFORE closing them, so the window survives on its home — Clear empties the Temporary list but SHALL NOT close the window (and therefore SHALL NOT quit the browser when it is the last window).

**Every panel fully live.** On the single-track carousel every Space panel is pre-rendered with its own Space's content, and its actions are live — a switch is a pure transform with no per-panel mount or interactivity toggle at commit (the spike model). New Tab SHALL be enabled on every slide and target its own Space; Clear SHALL render on any slide whose Space has temporary tabs and target its own Space. This supersedes the former "active-slide only" rule, under which a non-centre slide's New Tab was disabled and its Clear was not rendered.

#### Scenario: New Tab dispatches newTab carrying the panel's Space

- **WHEN** the user clicks the New Tab row on the panel for Space "work" in window 100
- **THEN** the sidebar SHALL call `bus.send({ kind: 'newTab', payload: { windowId: 100, spaceId: 'work' } })`

#### Scenario: New Tab reuses an existing home tab instead of creating a second

- **GIVEN** window 100 already has an unused home tab (a `chrome://newtab/` tab)
- **WHEN** the coordinator processes `newTab` for window 100's active Space
- **THEN** it SHALL focus the existing home tab and SHALL NOT call `chrome.tabs.create`

#### Scenario: New Tab creates a tab when the window has no home tab

- **GIVEN** window 100 has no home tab open
- **WHEN** the coordinator processes `newTab` for window 100's active Space
- **THEN** it SHALL call `chrome.tabs.create({ windowId: 100, active: true })`

#### Scenario: New Tab on a non-active panel activates that Space first

- **GIVEN** window 100's active Space is "work" and a pre-rendered panel for the non-active Space "side"
- **WHEN** the user clicks that panel's New Tab row, dispatching `newTab` with `spaceId: 'side'`
- **THEN** the coordinator SHALL activate "side" (expand its group, collapse the outgoing) BEFORE opening the tab
- **AND** the freshly created tab SHALL be visible in "side"

#### Scenario: Clear dispatches clearTempTabs carrying the panel's Space

- **GIVEN** the panel's Space has at least one temporary tab
- **WHEN** the user clicks that panel's Clear action in window 100 for Space "work"
- **THEN** the sidebar SHALL call `bus.send({ kind: 'clearTempTabs', payload: { windowId: 100, spaceId: 'work' } })`

#### Scenario: Clear keeps the window alive on the home when temps are the only tabs

- **GIVEN** the targeted Space's temporary tabs are the window's only tabs
- **WHEN** the coordinator processes `clearTempTabs` for that window
- **THEN** it SHALL open a home tab BEFORE removing the temporary tabs
- **AND** the window SHALL survive on its home (it SHALL NOT be left empty / closed)

#### Scenario: New Tab is live on every slide and targets its own Space

- **GIVEN** a non-centre carousel slide (a pre-rendered panel for an adjacent Space)
- **THEN** its New Tab row SHALL be enabled (NOT disabled)
- **AND** activating it SHALL dispatch `newTab` carrying that slide's `spaceId`
- **AND** its Clear action SHALL be rendered when that Space has temporary tabs (targeting that Space)

### Requirement: Home tabs are not listed as temporary tabs

The coordinator SHALL NOT adopt a home tab into any Space's `tempTabIds` — neither
on `tabs.onCreated` nor during `seedExistingTabs` at boot. A home tab is grouped
into the active Space (so the window shows it) but does NOT appear in the sidebar's
Temporary list. When the user navigates a home tab to a real URL, the resulting
`tabs.onUpdated` (non-newtab URL) SHALL cause it to be adopted as an ordinary
temporary tab.

#### Scenario: A home tab does not appear in the Temporary list

- **WHEN** a home tab is created in window 100 whose active Space is "Work"
- **THEN** the home tab SHALL NOT be added to `spaceInstancesByWindow[100]["work"].tempTabIds`
- **AND** the sidebar Temporary list for "Work" SHALL NOT render a row for it

#### Scenario: Navigating a home tab to a real URL lists it

- **GIVEN** a home tab in window 100's active Space "Work"
- **WHEN** it navigates to `https://example.com/`
- **THEN** it SHALL be added to "Work"'s `tempTabIds` and rendered in the Temporary list

### Requirement: Recolouring a Space propagates to live groups with the same atomicity

Recolouring a Space SHALL apply the new colour to the Space record in
`state.spaces` AND to every **live** tab group in every window where that Space is
instantiated, via `chrome.tabGroups.update` (mapping the Lunma colour through
`toGroupColor`). As with renaming, each window's persisted group id SHALL first be
reconciled via `resolveGroup`: a **stale** group SHALL be SKIPPED (its colour
re-applied when the group is next materialized on activation), and only a
`chrome.tabGroups.update` failure on a **live** group SHALL revert the record
change. A stale group SHALL NEVER trigger a revert.

#### Scenario: Recolour applies and updates the live group

- **GIVEN** Space "Work" has a live group `G_work` in window 100
- **WHEN** the user recolours "Work" to red
- **THEN** the Space record's `color` SHALL become `red`
- **AND** `G_work`'s colour SHALL be updated via `chrome.tabGroups.update`
- **AND** the coordinator SHALL ack the command `ok`

#### Scenario: Recolour applies when the persisted group is stale

- **GIVEN** Space "Work" carries a `groupId` that no longer resolves in Chrome
- **WHEN** the user recolours it to red
- **THEN** the Space record's `color` SHALL become `red` and SHALL NOT be reverted
- **AND** no `chrome.tabGroups.update` SHALL be attempted against the stale group
- **AND** the coordinator SHALL ack the command `ok`

#### Scenario: Recolour rolls back on a live-group failure

- **WHEN** the record recolour succeeds but `chrome.tabGroups.update` fails for a live group
- **THEN** Lunma SHALL revert to the pre-recolour colour
- **AND** the coordinator SHALL ack the command with an `{ error }`

### Requirement: Pinned tabs persist per Space

Each Space SHALL have an ordered list of pinned entries, persisted as
`pinnedBySpace[spaceId]` — an array of `PinNode`. A `PinNode` is either
a tab (`{ kind: 'tab'; id: SavedTabId }`) or a folder
(`{ kind: 'folder'; id: FolderId; name; icon; color; children: SavedTabId[] }`).
Folders are single-level: `children` holds `SavedTabId` values only and
never nested folders. A pinned tab's record lives in `savedTabs`; its
live binding (if any) lives in `tabBindings`. Pinned entries survive
browser restart and are restored on boot.

#### Scenario: Pinned entries restored on boot

- **WHEN** the service worker boots with persisted pinned entries
- **THEN** `pinnedBySpace` is restored from storage as `PinNode[]`
- **AND** each tab node's `SavedTab` record is available in `savedTabs`
- **AND** each folder node's `children` are restored in order

#### Scenario: Pinned order preserved

- **WHEN** pinned entries (tabs or folders) are reordered
- **THEN** the new order persists in `pinnedBySpace[spaceId]`
- **AND** is restored in that order on next boot

### Requirement: Pinned tabs render in the sidebar

The sidebar SHALL render the active Space's pinned entries as a
vertical list above the temporary-tabs section. A tab node renders as a
row with its favicon and title; a folder node renders as a folder row
showing its coloured icon, name, and child count, with its children
listed beneath it when expanded — all in `pinnedBySpace` order.

Folder rows and tab rows SHALL share one visual column structure: a folder row's
glyph SHALL align to the same horizontal column as a tab row's favicon, and its
name to the same column as a tab row's title. The folder's disclosure chevron
SHALL occupy a leading gutter to the left of that shared icon column and SHALL NOT
displace the glyph or name columns. When a folder is expanded, its children SHALL
be indented by a content inset that preserves row width — each child row's right
edge SHALL stay aligned with the top-level rows' right edge, and indentation SHALL
NOT cause horizontal overflow.

#### Scenario: Pinned entries shown for the active Space

- **WHEN** the sidebar renders with an active Space that has pinned entries
- **THEN** tab nodes appear as favicon+title rows
- **AND** folder nodes appear as folder rows with icon, name, and child count
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

- **WHEN** a folder's children are shown
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

Dragging a **temporary** tab into the pinned section SHALL honor the
same drop-onto semantics as a within-pinned drag, not only between-rows
insertion. Dropping a temporary tab **onto a folder** SHALL pin it into
that folder's `children`; dropping it **onto a pinned tab** SHALL create
a folder containing the newly-pinned tab and the drop-target tab;
dropping it **between rows** SHALL pin it at that top-level index (the
prior behavior). The drop-target identity SHALL come from the drag
controller's `targetOntoId` for the pinned zone; the temporary drop
handler SHALL act on it rather than discarding it.

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

### Requirement: Create a pinned-tab folder

The sidebar SHALL let the user create a folder in the active Space's
pinned section, by a **"New folder" item in the pinned-header kebab overflow menu** (the `RowMenu` morph), by dragging one pinned
tab onto another, or by dragging a temporary tab onto a pinned tab. A
newly created folder is named "New Folder" and, for EVERY creation path,
the user is placed into an inline rename field on the new folder so it can
be named immediately. Filing a tab INTO an existing folder is not a
creation and SHALL NOT open rename.

#### Scenario: Create from the header menu

- **WHEN** the user opens the pinned-header kebab overflow menu and selects "New folder"
- **THEN** an empty folder node named "New Folder" is inserted into
  `pinnedBySpace[spaceId]`
- **AND** an inline rename field for that folder is focused

#### Scenario: Create by dragging one tab onto another

- **WHEN** the user drops pinned tab A onto pinned tab B
- **THEN** a folder node is created at B's former position with
  `children` `[B, A]` in that order
- **AND** A and B are removed from their previous top-level positions
- **AND** an inline rename field for the new folder is focused

#### Scenario: Create by dragging a temporary tab onto a pinned tab

- **WHEN** the user drags a temporary tab onto a pinned tab
- **THEN** a folder is created containing the drop-target tab and the
  newly-pinned tab (see "Pinned tabs reorder and unpin by drag")
- **AND** an inline rename field for the new folder is focused

#### Scenario: Filing into an existing folder does not rename it

- **WHEN** the user drops a tab INTO an existing folder (onto the folder
  row, or into its expanded child list)
- **THEN** the tab is placed in that folder's `children`
- **AND** no inline rename field is opened

### Requirement: Pinning a temporary tab always places the record

Pinning a temporary tab SHALL mint its `SavedTab` and place that record in
the pinned tree within a single coordinator tick, so the record is never
left unplaced (orphaned). The tab SHALL NOT be removed from `tempTabIds`
unless its record is placed somewhere reachable in `pinnedBySpace`
(top-level, or a folder's `children`). When a drop names a placement
target (a folder to file into, or a pinned tab to fold with) that no
longer exists at handle time, the handler SHALL fall back to inserting the
record at the top-level drop index rather than discarding it.

#### Scenario: No orphan when pinning a temporary tab onto a folder

- **WHEN** a temporary tab is pinned onto a folder
- **THEN** after the drop the minted `SavedTab` SHALL appear in exactly one
  place in `pinnedBySpace[spaceId]` (the folder's `children`)
- **AND** no `savedTabs` record SHALL exist without a placement in the tree

#### Scenario: Fallback when the target folder vanished mid-drag

- **WHEN** a temporary tab is dropped onto a folder
- **AND** that folder no longer exists when the command is handled
- **THEN** the tab SHALL be pinned at the top level instead
- **AND** SHALL NOT be removed from Temporary without being placed

### Requirement: Folder name, icon, and colour are editable

A folder node SHALL carry a `name`, an `icon` (an `IconName`), and a
`color` (a Space colour identifier). The sidebar SHALL let the user
edit all three, persisting them to the folder node.

Folder edit actions SHALL be presented through the **same in-place row-morph menu
used for tab actions** (a shared row-morph primitive), NOT a separate floating
dropdown. A kebab trigger on the folder row SHALL morph the row open in place into
an action drawer offering **Rename**, **Icon & colour**, and **Delete folder**.
Rename SHALL edit the name in place; **Icon & colour** SHALL reveal an inline
colour-swatch row and icon picker WITHIN the morph (a keep-open action that grows
the drawer), not a panel rendered elsewhere; **Delete folder** SHALL remove the
folder (spilling its children per the Folder lifecycle requirement). The morph's
motion, dismissal (outside-click / `Escape`), and roving keyboard focus SHALL
match the tab action menu.

#### Scenario: Folder editing morphs in place like a tab

- **WHEN** the user activates a folder row's kebab trigger
- **THEN** the folder row SHALL morph open in place into an action drawer (the same row-morph as tab actions)
- **AND** the drawer SHALL offer Rename, Icon & colour, and Delete folder

#### Scenario: Rename a folder

- **WHEN** the user edits a folder's name and commits
- **THEN** the folder node's `name` updates and persists

#### Scenario: Change folder icon or colour inline

- **WHEN** the user picks "Icon & colour" in the folder morph
- **THEN** an inline colour-swatch row and icon picker SHALL appear within the morph
- **AND** picking a new icon or colour SHALL update and persist the folder node's `icon` / `color`
- **AND** the folder row SHALL reflect the new icon/colour

### Requirement: Folder expand/collapse is per-window and ephemeral

A folder's expanded/collapsed state SHALL be tracked per window in
sidebar-local state (`expandedFoldersByWindow`) and SHALL NOT be
persisted to `AppState`. Collapsing or expanding a folder in one window
does not affect the same Space's folder in another window.

#### Scenario: Independent collapse across windows

- **WHEN** the same Space is active in two windows and the user
  collapses a folder in window A
- **THEN** the folder remains in its prior state in window B

#### Scenario: Collapse state is not persisted

- **WHEN** the sidebar reloads
- **THEN** folder expand/collapse state is re-established from defaults,
  not from persisted storage

### Requirement: Spring-loaded folders during drag

The sidebar SHALL spring-load folders during a drag: while a drag is
active, hovering a collapsed folder's drop-onto band past a short dwell
SHALL auto-expand that folder so the user can place a child precisely.

#### Scenario: Hover a collapsed folder mid-drag

- **WHEN** a drag hovers a collapsed folder's drop-onto band beyond the
  dwell threshold
- **THEN** the folder auto-expands
- **AND** if the cursor leaves before the threshold, the folder stays
  collapsed

### Requirement: Folder lifecycle

Empty folders SHALL be kept, not auto-deleted, when their last child is
removed. Deleting a non-empty folder SHALL move its children back into
the top-level pinned list at the folder's former position rather than
unpinning or trashing them.

#### Scenario: Last child leaves a folder

- **WHEN** the final tab is dragged out of a folder
- **THEN** the (now empty) folder remains in `pinnedBySpace[spaceId]`

#### Scenario: Delete a non-empty folder

- **WHEN** the user deletes a folder that contains tabs
- **THEN** the folder node is removed
- **AND** its `children` are spliced into the top-level list as tab
  nodes at the folder's former position

### Requirement: Renaming a pinned tab

A pinned tab SHALL be renameable to a user-chosen display name. The
custom name SHALL be stored as an optional `SavedTab.customTitle` and
SHALL persist across browser restarts like the rest of the saved tab
record.

The display name SHALL resolve in the order `customTitle ?? title ??
currentURL`. The live-tab title mirror (which keeps `SavedTab.title`
in sync with the bound Chrome tab) SHALL continue unchanged and SHALL
NEVER write to `customTitle`, so a user-chosen name is never overwritten
by site navigation.

Renaming SHALL be reachable from the pinned tab row both as a "Rename"
context-menu entry and via an inline edit affordance on the row label.
A "Reset name" affordance SHALL clear `customTitle`, after which the
display name falls back to the stored `SavedTab.title`.

A rename committed as empty or whitespace-only SHALL be treated as a
cancel and SHALL leave the existing name unchanged.

#### Scenario: Custom name survives navigation

- **WHEN** a user renames a pinned tab to "Docs"
- **AND** the bound live tab later navigates and reports a new title
- **THEN** the pinned tab still displays "Docs"
- **AND** the saved tab's mirrored `title` reflects the new live title
  underneath

#### Scenario: Custom name survives restart

- **WHEN** a user renames a pinned tab and the browser restarts
- **THEN** the pinned tab is restored showing the custom name

#### Scenario: Resetting falls back to the stored title

- **WHEN** a user chooses "Reset name" on a renamed pinned tab
- **THEN** `customTitle` is cleared
- **AND** the row displays the stored `SavedTab.title` again

#### Scenario: Empty rename cancels

- **WHEN** a user commits an empty or whitespace-only rename
- **THEN** the previous name is kept unchanged

### Requirement: Renaming a temporary tab

A temporary tab SHALL be renameable to a user-chosen display name. The
custom name SHALL be stored per window and per Space instance, keyed by
`TabId`, in `SpaceInstance.tempTabTitles`. Because temporary tabs are
not persisted, the custom name SHALL be ephemeral: it SHALL be discarded
when the tab is closed and SHALL NOT survive a browser restart.

The display name SHALL resolve in the order `tempTabTitles[tabId] ??
liveTab.title ?? liveTab.url`.

Renaming SHALL be reachable via an inline edit affordance on the
temporary tab row. A rename committed as empty or whitespace-only SHALL
be treated as a cancel and SHALL leave the existing name unchanged.

#### Scenario: Temp custom name shows in this window only

- **WHEN** a user renames a temporary tab in one window
- **THEN** that window's sidebar shows the custom name
- **AND** the override is scoped to that window's Space instance

#### Scenario: Temp custom name is lost on close

- **WHEN** a temporary tab with a custom name is closed
- **THEN** the override entry for that `TabId` is discarded

#### Scenario: Temp custom name does not survive restart

- **WHEN** the browser restarts
- **THEN** no temporary tab custom names are restored

### Requirement: User reorders Spaces by dragging a switcher chip

A user SHALL be able to reorder Spaces by dragging a chip in the bottom Space
switcher. The switcher chip row SHALL be a drag zone; dragging a chip and dropping it
between two chips SHALL dispatch a `reorderSpaces` command carrying the full post-drop
`SpaceId` order. The new order SHALL be applied by reordering `state.spaces` **in
place** (no separate `order` field is introduced) and SHALL be **global** — it takes
effect in every window — because a Space's order is its position in `state.spaces[]`
with no per-window override. Reordering SHALL NOT change which Space is active in any
window: `activeSpaceByWindow` and `spaceInstancesByWindow` SHALL be untouched.
Dragging a chip and releasing it at its own position SHALL be a no-op. The reordered
chips SHALL re-render from the authoritative state broadcast, not from an optimistic
local reorder. The trailing `+` add-chip and the Space editor SHALL NOT be draggable
and SHALL NOT be valid drop positions.

#### Scenario: Dragging a chip reorders Spaces globally

- **WHEN** a user drags a Space chip and drops it between two other chips
- **THEN** the sidebar SHALL dispatch `reorderSpaces` with the full post-drop SpaceId order
- **AND** `state.spaces` SHALL be reordered in place to match, with no `order` field introduced
- **AND** the new order SHALL appear in every window's switcher after the broadcast

#### Scenario: Reorder leaves the active Space unchanged

- **WHEN** a Space is reordered in the switcher
- **THEN** `activeSpaceByWindow` and `spaceInstancesByWindow` SHALL be unchanged
- **AND** the Space active in each window SHALL remain active

#### Scenario: Dropping a chip at its own position is a no-op

- **WHEN** a user drags a chip and releases it at its current position
- **THEN** the dispatched order SHALL equal the current order
- **AND** `state.spaces` SHALL be unchanged

### Requirement: Boot tab ownership reconciliation

On service-worker boot, Lunma SHALL assign each open tab to the correct Space instance by its **live Chrome group membership** and SHALL heal any pre-existing cross-instance overlap, so the per-window ownership-uniqueness invariant (see "Temporary tabs are per-window") holds after boot even when the persisted state violated it.

**Group-aware seeding.** When adopting the tabs already open at boot (`seedExistingTabs` over `chrome.tabs.query`), each open, unbound, non-home tab SHALL be seeded into the Space instance whose recorded `groupId` equals the tab's live Chrome `groupId`. A tab that is ungrouped, or whose Chrome group maps to no Space instance, SHALL fall back to the window's active Space instance (the prior behavior). Seeding SHALL go through the per-window ownership guard, so a tab is seeded into exactly one instance.

**Overlap heal.** After seeding and before the boot broadcast, Lunma SHALL reconcile `tempTabIds` across the instances of each window: any tab id present in more than one instance SHALL be kept in its single correct owner — the instance whose `groupId` matches the tab's live Chrome group, else the active instance — and removed from the rest. The reconciliation SHALL be idempotent (a second run finds no duplicates) and SHALL mutate state only (the existing boot broadcast carries the healed state).

#### Scenario: A grouped tab is seeded into its own Space, not the active one

- **GIVEN** at boot window 100's active Space is "work" (`groupId: 11`) and Space "side" has `groupId: 22`, and open tab 42 is in Chrome group 22
- **WHEN** `seedExistingTabs` runs
- **THEN** tab 42 SHALL be seeded into `spaceInstancesByWindow[100]["side"].tempTabIds`
- **AND** tab 42 SHALL NOT be added to the active "work" instance

#### Scenario: Boot heals a tab listed in multiple instances

- **GIVEN** persisted state has tab 42 in `tempTabIds` of both "work" and "side" in window 100, and tab 42's live Chrome group resolves to "side"'s `groupId`
- **WHEN** boot tab-ownership reconciliation runs
- **THEN** tab 42 SHALL remain in `spaceInstancesByWindow[100]["side"].tempTabIds`
- **AND** tab 42 SHALL be removed from `spaceInstancesByWindow[100]["work"].tempTabIds`
- **AND** a second reconciliation pass SHALL make no further change

### Requirement: Global favicon grid in the sidebar

The sidebar SHALL render a **global favicon grid** at its top, between the top search
bar and the per-Space carousel. It is **global** — it renders the same favorites
(`state.faviconRow`) across every Space and every window — and it SHALL be rendered
**fixed**: it is a sibling of the swiping content region (not a child of a Space
panel), so it SHALL NOT translate with the swipe-to-switch gesture (see Requirement:
Interactive swipe-to-switch Space) nor move with the Space carousel. It SHALL render
whether or not there is an active Space (it is Space-independent). The favorites SHALL
lay out as a **responsive grid of plated tiles** that wraps to multiple rows (fitting
as many fixed-width tiles per row as the panel allows) and grows vertically rather than
scrolling horizontally. (An earlier single-row strip of bare floating icons was
superseded on user feedback; see the `sidebar-favicon-row` design + tasks.)

The grid SHALL **re-hue with the active (centred) Space** rather than staying a
neutral island (ADR 0010 D6): it inherits the sidebar's scoped per-Space colour tokens
(`--space-h` and the `--space-c` family; see Requirement: Per-Space colour identity on
the sidebar) and SHALL carry visible Space-derived colour at every immersive tint
level (`subtle | standard | vivid`). The re-hue SHALL ride the active-Space colour
transition (the 320ms `--motion-slow` / `--ease-emphasised` cross-fade of signal 6,
Per-Space colour identity) so it changes colour in lockstep with the wash and aurora.
The tiles are soft **plated** squares (a neutral `--surface` plate); the **selected**
favorite (its bound tab is focused in this window) fills with the `--space-c-soft`
Space-wash — the SAME selection treatment a selected tab row uses — so a selected
favorite reads like a selected tab. WCAG 2.1 AA SHALL hold for all content at every
tint (no text is drawn on the hue — favicons are images and titles render in tooltips).
The tile rendering, per-window state, removal, the right-click menu, and couple /
decouple / lock affordances are specified in the `lunma-bookmark-bindings` capability.

When `state.faviconRow` is empty the grid SHALL render an **empty-state placeholder**
(not a bare bar and not nothing): a quiet preview of the favorite shape — Space-tinted
ghost-tile outlines — plus a short hint. The placeholder SHALL double as the drop
target: while a pinned **or** temporary tab is dragged over it, it SHALL light up (the
ghosts + hint brighten to read as "drop here"), so the FIRST favorite can be created by
drag. The placeholder SHALL render no favorite tiles and SHALL carry the same ambient
Space tint as the populated grid.

#### Scenario: The favicon strip renders fixed above the carousel

- **GIVEN** the sidebar is mounted for window 1 with a non-empty `state.faviconRow`
- **THEN** the favicon strip SHALL render above the Space carousel
- **AND** it SHALL NOT be a child of the swiping content region

#### Scenario: The strip does not move with a Space swipe

- **GIVEN** the sidebar is mid swipe-to-switch gesture
- **WHEN** the content region translates to preview the next Space
- **THEN** the favicon strip SHALL NOT translate with it (it stays fixed)

#### Scenario: The strip re-hues with the active Space and is never a gray island

- **GIVEN** the sidebar is mounted with `data-tint="vivid"` and active Space `work` (`blue`)
- **THEN** the strip SHALL carry Space-derived colour (it reads the scoped `--space-h` / `--space-c`)
- **WHEN** the active Space changes to one whose colour is `orange`
- **THEN** the strip SHALL cross-fade to the new hue in lockstep with the sidebar wash
- **AND** at every tint level the strip SHALL retain visible Space colour (never a neutral-gray bar)

#### Scenario: The strip renders even with no active Space

- **GIVEN** the sidebar is mounted for window 1 with `activeSpaceByWindow[1] === null`
- **THEN** the global favicon strip SHALL still render (it is Space-independent)

#### Scenario: An empty favicon row shows an empty-state placeholder

- **GIVEN** the sidebar is mounted with an empty `state.faviconRow`
- **THEN** the grid SHALL render an empty-state placeholder (a ghost-tile preview + a hint) and zero favorite tiles
- **WHEN** a pinned **or** temporary tab is dragged over the placeholder
- **THEN** the placeholder SHALL light up as the drop target (the first favorite can be created by drag)

### Requirement: Per-Space auto-archive override (editor + backend contract)

A `Space` MAY carry an optional `autoArchive` override of type `SpaceAutoArchive = { mode: 'off' } | { mode: 'custom'; idleMinutes: number }` (exported from `apps/extension/src/shared/types.ts`). An **absent** `autoArchive` SHALL mean *inherit the global auto-archive setting* (the durable, on-disk representation of "this Space follows the `autoArchiveEnabled` / `autoArchiveIdleMinutes` settings"); `{ mode: 'off' }` SHALL mean *never auto-archive this Space's temporary tabs*; `{ mode: 'custom'; idleMinutes }` SHALL mean *auto-archive this Space's temporary tabs at its own idle threshold*. The resolution semantics (master switch + inherit/off/custom) are owned by the `auto-archive` capability ("Per-Space override resolution"); the persisted shape and migration are owned by `storage-and-migrations`.

**Editor.** The Space editor (`SpaceEditor`, edit mode) SHALL present an auto-archive control composing existing primitives — a `SegmentedControl` over `Inherit | Off | Custom`, plus a numeric `TextInput` for the minutes shown only when `Custom` is selected. It SHALL seed from the edited Space's `autoArchive` (absent → `Inherit`). On change it SHALL dispatch `bus.send({ kind: 'setSpaceAutoArchive', payload: { spaceId, autoArchive } })` where `autoArchive` is `null` for `Inherit`, `{ mode: 'off' }` for `Off`, or `{ mode: 'custom'; idleMinutes }` for `Custom` (minutes parsed to a positive integer, floor 1). The control SHALL NOT re-roll primitives and SHALL respect reduced-motion + WCAG-AA at every tint. The create-mode editor SHALL NOT show the control (a Space has no tabs to archive until it exists; the override is an edit-mode affordance).

**Backend.** Lunma SHALL accept the `setSpaceAutoArchive` command (owned by `typed-message-bus`) from any sidebar dispatcher and apply it to the named Space within a single coordinator drain cycle via the synchronous store mutator `store.setSpaceAutoArchive(spaceId, autoArchive | null)`, emitting one persist and one `state-broadcast`. A `null` payload SHALL remove the `autoArchive` field (return to inherit). The handler SHALL throw when `spaceId` is absent from `state.spaces`.

#### Scenario: Editor seeds from the Space's override

- **WHEN** the editor opens in edit mode for a Space with `autoArchive: { mode: 'custom'; idleMinutes: 30 }`
- **THEN** the control SHALL show `Custom` selected with `30` in the minutes field
- **AND** for a Space with no `autoArchive` it SHALL show `Inherit`

#### Scenario: Selecting Off dispatches an off override

- **WHEN** the user selects `Off` in the editor for Space `work`
- **THEN** the editor SHALL dispatch `bus.send({ kind: 'setSpaceAutoArchive', payload: { spaceId: 'work', autoArchive: { mode: 'off' } } })`

#### Scenario: Selecting Inherit clears the override

- **WHEN** the user selects `Inherit` for a Space that previously had an override
- **THEN** the editor SHALL dispatch `setSpaceAutoArchive` with `autoArchive: null`
- **AND** the store mutator SHALL remove the Space's `autoArchive` field

#### Scenario: Custom minutes persist as a positive integer

- **WHEN** the user selects `Custom` and enters `15`
- **THEN** the editor SHALL dispatch `setSpaceAutoArchive` with `autoArchive: { mode: 'custom', idleMinutes: 15 }`

#### Scenario: setSpaceAutoArchive on an unknown Space rejects

- **WHEN** a sidebar dispatches `setSpaceAutoArchive` with a `spaceId` not in `state.spaces`
- **THEN** the handler SHALL throw and the dispatcher's `bus.send` promise SHALL reject

### Requirement: Lunma new-tab page is the empty-Space home

Lunma SHALL own the browser's new-tab page via `chrome_url_overrides.newtab` →
`apps/extension/src/launcher/newtab/index.html`, so every tab opened without an explicit URL
(entering an empty Space, the window-can't-be-empty tab Chrome spawns after Clear
or closing the last tab, or a user `Cmd+T`) renders Lunma's page. The page SHALL
render the **active Space's home** for its own window: it resolves its window
(`chrome.windows.getCurrent`), reads SW state through the existing
`state-request` / `state-broadcast` path (read-only — it dispatches no command and
mutates no state, like the sidebar), and displays the window's active Space
identity (name, icon, colour). It SHALL render a calm, identity-first surface (no
loading flash — an unresolved active Space shows a neutral home until the next
broadcast). The full launcher search is out of scope (deferred to `launcher-v1`);
any search affordance on this page is a non-functional placeholder.

A tab whose live URL is the new-tab page (recognised by `isNewTabUrl(url)`, which
matches `chrome://newtab/` and the extension's resolved newtab URL) is a **home
tab** — a transient property of the live tab, never persisted. When the user
navigates a home tab to a real URL it ceases to be a home tab.

#### Scenario: The new-tab page renders the active Space's home

- **GIVEN** window 100's active Space is "Work" (blue, icon `briefcase`)
- **WHEN** a new tab opens in window 100 and renders the Lunma new-tab page
- **THEN** the page SHALL display "Work"'s name, icon, and colour
- **AND** it SHALL dispatch no command and mutate no Lunma state

#### Scenario: A navigated-away home tab stops being a home tab

- **GIVEN** a home tab (URL `chrome://newtab/`) in Space "Work"
- **WHEN** the user navigates it to `https://example.com/`
- **THEN** `isNewTabUrl` SHALL no longer match it and it SHALL be treated as an ordinary tab

#### Scenario: A window whose only tab is a home tab still tracks its active Space

- **GIVEN** at boot a window whose only open tab is a home tab
- **THEN** the boot pass SHALL still create the window's active-Space instance (so later-created tabs are adopted + grouped — the home tab being the only tab SHALL NOT leave the Space untracked)
- **AND** the boot reconciliation SHALL group that lone home tab into the active Space (the active Space's group materializes from its home tab), rather than leaving an ungrouped home tab

#### Scenario: Boot groups ALL home tabs in the window (none orphaned)

- **GIVEN** at boot a window with more than one home tab
- **THEN** the boot reconciliation SHALL group EVERY home tab in the window into the active Space — none SHALL be left ungrouped outside the group
- **AND** a stray home tab present alongside an already-live active-Space group SHALL be swept into that group

#### Scenario: A stale persisted group id still materializes at boot

- **GIVEN** the active Space's persisted `groupId` no longer resolves to a live Chrome group (e.g. dissolved across the restart)
- **WHEN** the boot reconciliation runs
- **THEN** it SHALL treat the stale id as "no live group" and materialize a fresh group from the Space's tabs (real + home), rather than skip materialization and leave the tabs ungrouped

