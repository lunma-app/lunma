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
3). Its trailing edge carries a **kebab overflow menu** — the SAME `RowMenu` morph the
folder rows compose: a hover-revealed `⋮` kebab whose
row morphs in place into an action card sharing one elevated surface (the header is
transparent while open so it reads as a single card, not a darker bar stacked on the
actions). The menu SHALL carry a **"New folder"** item whose selection dispatches
`createFolder { spaceId }`. The header SHALL NOT display a count of pinned bookmarks.
When no menu items are provided (e.g. the Temporary section header), the trailing edge
SHALL render nothing and the header SHALL NOT morph.

**3. Pinned empty state.** When the active Space has zero pinned bookmarks, the sidebar
SHALL render a two-line empty-state row: "No pinned tabs yet." + dim sub-line "Save tabs
you want to keep open across sessions." Its text SHALL share the list's leading inset so
it aligns with the header glyph and the favicon column. **Exception:** while the
consolidated welcome is showing (see Requirement: A fresh start renders one
consolidated welcome — `state.faviconRow` empty AND the active Space has zero pinned
bookmarks), this empty-state row SHALL NOT render — the pinned section header remains,
with nothing beneath it until the divider, so the welcome is the single instructional
block on screen.

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
Tab/Clear affordances, and the temp list. (With no active Space the consolidated
welcome's pinned-state condition cannot hold; an empty `faviconRow` here renders the
grid's standard empty-state placeholder, not the welcome.)

#### Scenario: Sidebar mounts with active Space and zero temp tabs → divider + New Tab, no empty copy

- **GIVEN** the sidebar is mounted for window 1 with active Space `work` (0 pinned, 0 temp) and a non-empty `state.faviconRow`
- **THEN** the rendered DOM SHALL contain, in order: a top search bar, a global favicon grid, a pinned section header showing the Space's icon + name as a row with a trailing kebab overflow menu (the `RowMenu` morph), a pinned empty-state row, a temporary divider, a New Tab row, and a space switcher
- **AND** the pinned section header SHALL NOT render a count
- **AND** SHALL NOT render any "No temporary tabs" empty-state copy
- **AND** SHALL NOT render the Clear action (no temporary tabs)

#### Scenario: Sidebar mounts with both favorites and pinned empty → the welcome, no per-area empty states

- **GIVEN** the sidebar is mounted for window 1 with active Space `work` (0 pinned, 0 temp) and an empty `state.faviconRow`
- **THEN** the rendered DOM SHALL contain, in order: a top search bar, the consolidated welcome (in the fixed grid region), a pinned section header, a temporary divider, a New Tab row, and a space switcher
- **AND** SHALL NOT contain the pinned empty-state row or the grid's standard empty-state placeholder

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
ghost-tile outlines — plus a short hint, with **no dashed borders** (the soft
ghost-outline treatment). The placeholder SHALL double as the drop target: while a
pinned **or** temporary tab is dragged over it, it SHALL light up (the ghosts + hint
brighten to read as "drop here"), so the FIRST favorite can be created by drag. The
placeholder SHALL render no favorite tiles and SHALL carry the same ambient Space tint
as the populated grid. **When additionally the active Space has zero pinned
bookmarks**, this region SHALL render the **consolidated welcome** in place of the
standard placeholder (see Requirement: A fresh start renders one consolidated
welcome) — a richer block in the same fixed slot carrying the same drop-target
contract; with no active Space, the standard placeholder renders (never the welcome).

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

- **GIVEN** the sidebar is mounted with an empty `state.faviconRow` and an active Space that HAS pinned bookmarks
- **THEN** the grid SHALL render the standard empty-state placeholder (a ghost-tile preview + a hint, no dashed borders) and zero favorite tiles
- **WHEN** a pinned **or** temporary tab is dragged over the placeholder
- **THEN** the placeholder SHALL light up as the drop target (the first favorite can be created by drag)

## ADDED Requirements

### Requirement: A fresh start renders one consolidated welcome

The sidebar SHALL render a single consolidated **welcome block** when
`state.faviconRow` is empty AND the window has a resolved active Space with zero
pinned bookmarks. The welcome renders **in the fixed favicon-grid region** (the same
slot as the grid's empty-state placeholder, which it replaces — it does not swipe
with the Space carousel), while the pinned empty-state row inside the Space panel is
suppressed (see the Sidebar shell composition requirement, point 3) — so a fresh
user sees ONE instructional block, not two stacked boxes. The pinned section header,
divider, New Tab row, and switcher render as usual.

The welcome SHALL be one block in the brand voice — a ghost-tile preview (the soft
ghost-outline treatment, no dashed borders), a display-serif headline, and a short
hint covering both drag-to-favorite and pinning (`Option+D`) — implemented as the
sidebar feature component `apps/extension/src/sidebar/Welcome.svelte`, composed by
`FaviconRow.svelte` in the placeholder's slot. Its total height SHALL NOT exceed the
two empty states it replaces.

The welcome SHALL preserve the placeholder's drag contract: while a pinned or
temporary tab is dragged over it, it SHALL brighten as the favorites drop target, and
a drop SHALL create the first favorite. Dragging into the pinned area inside the
Space panel continues to pin exactly as today (the welcome adds no pin drop zone of
its own — pinning is taught by its copy). Once either area gains content (a first
favorite, or a first pin via drag or `Option+D`), the sidebar SHALL return to the
populated layout plus the remaining single-area empty state, if any. When only one of
the two areas is empty, the existing per-area states render unchanged; with no active
Space, the standard placeholder renders instead of the welcome.

#### Scenario: A fresh user sees one block, not two

- **GIVEN** `state.faviconRow` is empty and the active Space has zero pinned
  bookmarks
- **WHEN** the sidebar mounts
- **THEN** the welcome block renders in the fixed favicon-grid region
- **AND** neither the grid's standard placeholder nor the pinned empty-state row
  renders

#### Scenario: One empty area keeps its own state

- **GIVEN** the user has favorites but the active Space has zero pinned
  bookmarks
- **WHEN** the sidebar mounts
- **THEN** the favicon grid renders its tiles and the pinned area renders the
  existing pinned empty-state row (no welcome block)

#### Scenario: The welcome accepts the first favorite by drag

- **GIVEN** the welcome block is showing
- **WHEN** a temporary tab is dragged over it and dropped
- **THEN** the block brightens during the drag and the drop creates the first
  favorite, exactly as the grid placeholder's drop contract specifies

#### Scenario: The welcome does not swipe with the carousel

- **GIVEN** the welcome block is showing and the user swipes to switch Space
- **THEN** the welcome SHALL NOT translate with the content region (it sits in the
  fixed grid region)

#### Scenario: First content dissolves the welcome

- **WHEN** the user pins a tab (drag or `Option+D`) while the welcome shows
- **THEN** the sidebar returns to the populated pinned layout, with the favorites
  region showing the grid's standard empty-state placeholder
