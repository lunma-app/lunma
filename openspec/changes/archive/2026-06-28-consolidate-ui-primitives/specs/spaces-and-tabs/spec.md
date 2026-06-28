## MODIFIED Requirements

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
3). Its trailing edge carries a **kebab overflow menu** — the SAME `Menu` (`trigger: 'kebab'`) the
folder rows compose: a hover-revealed `⋮` kebab that opens a floating dropdown
(`DropdownMenu`, portaled, aligned to the trigger's end edge). The menu SHALL carry a
**"New folder"** item whose selection dispatches `createFolder { spaceId }`. The header
SHALL NOT display a count of pinned bookmarks. When no menu items are provided (e.g. the
Temporary section header), the trailing edge SHALL render nothing (no kebab).

**3. Pinned empty state.** When the active Space has zero pinned bookmarks, the sidebar
SHALL render a two-line empty-state row: "No pinned tabs yet." + dim sub-line "Drag a tab
up here, or press Option+D, to pin it." Its text SHALL share the list's leading inset so
it aligns with the header glyph and the favicon column. This row SHALL render whenever
the active Space has zero pinned bookmarks (there is no first-run state in which it is
suppressed).

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
Tab/Clear affordances, and the temp list. (With no active Space, an empty `faviconRow`
renders the grid's standard empty-state placeholder.)

#### Scenario: Sidebar mounts with active Space and zero temp tabs → divider + New Tab, no empty copy

- **GIVEN** the sidebar is mounted for window 1 with active Space `work` (0 pinned, 0 temp) and a non-empty `state.faviconRow`
- **THEN** the rendered DOM SHALL contain, in order: a top search bar, a global favicon grid, a pinned section header showing the Space's icon + name as a row with a trailing kebab overflow menu (the `Menu` `trigger: 'kebab'` floating dropdown), a pinned empty-state row, a temporary divider, a New Tab row, and a space switcher
- **AND** the pinned section header SHALL NOT render a count
- **AND** SHALL NOT render any "No temporary tabs" empty-state copy
- **AND** SHALL NOT render the Clear action (no temporary tabs)

#### Scenario: Sidebar mounts with both favorites and pinned empty → both per-area empty states

- **GIVEN** the sidebar is mounted for window 1 with active Space `work` (0 pinned, 0 temp) and an empty `state.faviconRow`
- **THEN** the rendered DOM SHALL contain, in order: a top search bar, the global favicon grid showing its standard empty-state placeholder, a pinned section header, a pinned empty-state row, a temporary divider, a New Tab row, and a space switcher
- **AND** SHALL NOT contain any consolidated first-run welcome block (the removed earlier design this revert undoes)

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

### Requirement: Temporary tabs list rendering and interaction

When the active Space has one or more temporary tabs, the sidebar SHALL render the Temporary section as a list of rows — one `TabRow` per temporary tab in `tempTabIds` array order. Each row SHALL show the tab's favicon (resolved by `faviconFor(url, favIconUrl)` as the **primary** source, with the `_favicon` page-URL endpoint — `faviconUrl(url)` — retried as the **fallback** when the primary fails to load, and a neutral globe icon only when both fail; this staged fallback is provided by the shared `Favicon` primitive that `TabRow` composes), the tab's `title`, a hover-revealed **close (`✕`)** button in the row's trailing slot, and a **right-click action menu** — the SAME interaction the global favicon tiles use: a floating `Menu` (`trigger: 'context'`) popover anchored at the pointer, opened on a `contextmenu` event. There SHALL be no on-row kebab menu. The row for the window's active tab SHALL render with the active treatment defined in the sidebar shell's colour identity.

A **home tab** SHALL NEVER appear in this list — home tabs are not added to `tempTabIds` (see "Home tabs are not listed as temporary tabs"), so an empty Space showing only its home renders no temporary rows (the divider + New Tab affordance from the sidebar shell remain).

Clicking a row SHALL dispatch `bus.send({ kind: 'focusTab', payload: { tabId } })`. The hover-revealed `✕` SHALL close the tab directly — dispatching `bus.send({ kind: 'closeTab', payload: { tabId } })` — and SHALL NOT also trigger the row's focus or start a drag (it stops pointer/click propagation); this restores the one-click inline close (reversing the favicon-row change that had folded close into the overflow menu). Right-clicking a row SHALL open the action menu at the cursor, suppressing the browser's native context menu, and SHALL NOT focus or switch to the tab. The right-click menu SHALL carry, top to bottom: a non-destructive **Favorite** action that dispatches `bus.send({ kind: 'favoriteTab', payload: { tabId, windowId } })` and leaves the tab open (see the `lunma-bookmark-bindings` capability, Requirement: Couple and decouple favorites by direct manipulation); a **Rename** action that opens the row's inline rename; **Move up** and **Move down** actions that reorder the row one position within the Temporary list — dispatching `reorderTemp` carrying the full post-move `tabIds` order — each rendered disabled (the standard disabled treatment, not hidden) when the row is already at that end of the list, so reordering is reachable from the keyboard (the context-menu key / `Shift+F10` opens this menu) and from touch long-press; and a **Close tab** action that dispatches `bus.send({ kind: 'closeTab', payload: { tabId } })` and SHALL NOT also trigger the row's focus. A single `Menu` (`trigger: 'context'`) instance SHALL be shared across the Temporary list, opened for whichever row was right-clicked. A drag that begins on a temporary row and ends without crossing into the Pinned section SHALL be treated as a reorder within Temporary (dispatching `reorderTemp`); a drag that ends inside the Pinned section SHALL pin the tab (dispatching `pinTab`). A pointer interaction that does not pass the drag threshold SHALL remain a click, not a drag; a secondary (right) button press SHALL NOT start a drag. The sidebar SHALL NOT optimistically update — it SHALL wait for the next `state-broadcast`. Rows SHALL be keyed by `tabId`. The Temporary list SHALL only render tabs present in `liveTabsById`; a `tempTabId` with no `liveTabsById` entry SHALL be skipped rather than rendered blank.

#### Scenario: Active Space with temp tabs renders a row list

- **GIVEN** window 100's active Space has `tempTabIds: [17, 22]` with matching `liveTabsById` entries
- **WHEN** the sidebar renders
- **THEN** the Temporary section SHALL contain two `TabRow` elements in that order

#### Scenario: Clicking a temp row focuses; the hover close closes

- **WHEN** the user clicks a temporary row, then on another row activates the hover-revealed `✕`
- **THEN** the row click SHALL dispatch `focusTab` and the `✕` SHALL dispatch `closeTab` without also dispatching `focusTab`

#### Scenario: Right-click opens the action menu without focusing

- **WHEN** the user right-clicks a temporary row
- **THEN** the floating action menu SHALL open at the cursor, the browser's native context menu SHALL be suppressed, and `focusTab` SHALL NOT be dispatched

#### Scenario: The right-click menu's Favorite action keeps the tab open

- **WHEN** the user right-clicks a temporary row and selects **Favorite**
- **THEN** the sidebar SHALL dispatch `favoriteTab` for that tab
- **AND** the tab SHALL remain open (no `closeTab` is dispatched)

#### Scenario: Move down reorders a temporary row by one

- **GIVEN** window 100's active Space has `tempTabIds: [17, 22, 31]`
- **WHEN** the user selects **Move down** from tab 17's context menu
- **THEN** the sidebar SHALL dispatch `reorderTemp` carrying `tabIds: [22, 17, 31]`
- **AND** the rendered order SHALL update from the next `state-broadcast` (no optimistic update)

#### Scenario: Move up is disabled on the first temporary row

- **GIVEN** tab 17 is first in `tempTabIds`
- **WHEN** its context menu opens
- **THEN** **Move up** SHALL render disabled and activating it SHALL dispatch nothing

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

### Requirement: Create a pinned-tab folder

The sidebar SHALL let the user create a folder in the active Space's
pinned section, by a **"New folder" item in the pinned-header kebab overflow menu** (the `Menu` `trigger: 'kebab'` floating dropdown), by dragging one pinned
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

### Requirement: Folder name, icon, and colour are editable

A folder node SHALL carry a `name`, an `icon` (an `IconName`), and a
`color` (a Space colour identifier). The sidebar SHALL let the user
edit all three, persisting them to the folder node.

Folder edit actions SHALL be presented through the folder row's **kebab
overflow menu — a floating dropdown** (the shared `Menu` primitive,
`trigger: 'kebab'`; `DropdownMenu`, portaled, aligned to the trigger's end
edge), hover/focus-revealed in the row's trailing slot. The built-in menu SHALL
offer, top to bottom: **Edit**, **Move up**, **Move down**, and **Delete
folder**. (A caller MAY replace this list wholesale via a `menuItems` override —
e.g. a smart folder whose actions are not folder-shaped.)

**Edit** SHALL open a **`BottomSheet`** titled "Edit folder" (portaled to the
host's `portalTo` target — `".sidebar"` in the sidebar, so it slides from the
panel's bottom) containing, in order: a **Name** text field (seeded with the
current name, autofocused), an inline **colour-swatch radiogroup** over the
provided palette, and an **icon picker**; with **Cancel** and **Save** actions
where Save is disabled while the name is blank. Picking a swatch SHALL set the
folder `color` and picking an icon SHALL set the folder `icon` (each persisted);
committing the name (Save or Enter) SHALL persist the name and close the sheet;
Cancel / scrim / `Escape` SHALL close without committing the name. For a smart
folder the host MAY forward its own editor (a `panel` snippet + `panelTitle`),
which FolderRow renders in the SAME `BottomSheet` in place of the built-in body,
dismissing via `onPanelBack`.

The folder name SHALL ALSO be editable **in place**: when the row is put into
rename mode the name becomes an inline chromeless field (the `EditableLabel`
primitive) within the row, committing on Enter/blur (non-empty) and abandoning on
`Escape`/empty.

**Move up** and **Move down** SHALL reorder the folder one position within the
top-level pinned list, dispatching `reorderPinned` carrying the full post-move
node order; each SHALL render disabled (the standard disabled treatment, not
hidden) when the folder is already at that end of the list, so folder reordering
is reachable without a pointer drag. **Delete folder** SHALL remove the folder
(spilling its children per the Folder lifecycle requirement) as a **two-step
confirm**: the first activation SHALL arm the entry into a danger-treated
"Delete folder — confirm" affordance and keep the **dropdown** open without
dispatching; only a second activation SHALL dispatch `deleteFolder` and close the
dropdown. Closing the dropdown (outside-click / `Escape`) SHALL disarm without
deleting. The dropdown's motion, dismissal, and roving keyboard focus SHALL match
the tab action menu.

#### Scenario: Folder editing opens a dropdown, and Edit opens a sheet

- **WHEN** the user activates a folder row's kebab trigger
- **THEN** a floating dropdown SHALL open offering Edit, Move up, Move down, and Delete folder
- **AND WHEN** the user selects **Edit**
- **THEN** a "Edit folder" `BottomSheet` SHALL open with a Name field, a colour-swatch radiogroup, and an icon picker

#### Scenario: Rename a folder

- **WHEN** the user edits a folder's name (in the Edit sheet's Name field, or via the inline rename field) and commits
- **THEN** the folder node's `name` updates and persists

#### Scenario: Change folder icon or colour

- **WHEN** the user opens **Edit** and picks a new colour swatch or icon in the sheet
- **THEN** the folder node's `color` / `icon` SHALL update and persist
- **AND** the folder row SHALL reflect the new icon/colour

#### Scenario: Delete folder is a two-step confirm

- **WHEN** the user activates **Delete folder** in a folder row's dropdown
- **THEN** the dropdown SHALL stay open and the entry SHALL become a danger-treated "Delete folder — confirm" affordance, with no `deleteFolder` dispatched
- **AND WHEN** the user activates the armed entry again
- **THEN** `deleteFolder` SHALL be dispatched for that folder (its children spilling per the Folder lifecycle requirement)

#### Scenario: Dismissal disarms Delete folder without deleting

- **WHEN** the user has armed **Delete folder** and then closes the dropdown or presses `Escape`
- **THEN** no `deleteFolder` SHALL be dispatched and the entry SHALL be unarmed on the next open

#### Scenario: Move down reorders the folder by one

- **GIVEN** a folder that is the first of three top-level pinned nodes
- **WHEN** the user activates its dropdown's **Move down**
- **THEN** the sidebar SHALL dispatch `reorderPinned` carrying the node order with that folder in the second slot
