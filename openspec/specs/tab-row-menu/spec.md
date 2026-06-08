# tab-row-menu Specification

## Purpose
TBD - created by archiving change pinned-tab-row-menu. Update Purpose after archive.
## Requirements
### Requirement: Pinned-tab actions open as a drawer that grows from behind the tab

The pinned-tab actions menu SHALL open as an action drawer that emerges from
**behind** the tab row — not as a detached floating popover and not as a separate
card laid over the tab. The tab row itself SHALL remain unchanged and on top; the
drawer SHALL be rendered beneath it (lower stacking order) and grow downward out
from under it, so the actions appear to slide out of the tab. The tab's leading
content (favicon + title) SHALL stay exactly as it is throughout.

#### Scenario: Kebab opens a drawer from behind the tab

- **WHEN** the user clicks the kebab on a pinned tab row
- **THEN** an action drawer grows out from behind that tab, revealing its actions
  below the title, rather than a separate popover floating beside the trigger or a
  card appearing on top of the tab

#### Scenario: The tab stays itself

- **WHEN** the drawer is open for a given pinned tab
- **THEN** the tab row still shows the same favicon and title in place, unchanged,
  sitting on top of the drawer

### Requirement: Opening the menu does not reflow the list

Opening the menu SHALL NOT change the layout of any other row. The drawer SHALL be
rendered out of normal flow within the tab's fixed-height slot, so it overlays the
rows below it rather than pushing them down. No row beneath SHALL move when the
menu opens or closes.

#### Scenario: Rows below do not move when the menu opens

- **WHEN** the user opens the actions menu on a pinned tab that has rows below it
- **THEN** those rows stay at their exact positions while the drawer grows over
  them, with no downward shift

#### Scenario: Closing restores nothing because nothing moved

- **WHEN** the menu closes
- **THEN** the list is unchanged from before it opened — there is no reflow on
  close either

### Requirement: The trigger reflects open state and toggles its glyph

The kebab trigger SHALL carry `aria-haspopup="menu"` and reflect open state via
`aria-expanded`. Its glyph SHALL be a vertical kebab (`⋮`) when closed and a close
(`✕`) glyph when open, and activating it while open SHALL close the menu. The
trigger SHALL remain visible while the menu is open even if the row is not hovered.

#### Scenario: Trigger exposes menu state and swaps glyph

- **WHEN** the menu is closed and then opened
- **THEN** the trigger's `aria-expanded` flips from `false` to `true`, it advertises
  `aria-haspopup="menu"`, and its glyph changes from the kebab to the close icon

#### Scenario: Re-activating the trigger closes the menu

- **WHEN** the menu is open and the user activates the (now `✕`) trigger again
- **THEN** the menu closes

### Requirement: The menu is modal-ish and keyboard-dismissible

While the menu is open: row drag-to-reorder and the Space-switch swipe SHALL NOT
start from interactions with the menu (the trigger and the action drawer suppress
pointer propagation). `Escape` SHALL close the menu, a pointer-down anywhere
outside the open menu SHALL close it, and closing SHALL return focus to the kebab
trigger that opened it.

#### Scenario: Escape closes and returns focus

- **WHEN** the menu is open and the user presses `Escape`
- **THEN** the menu closes and keyboard focus returns to the kebab trigger

#### Scenario: Outside pointer-down closes

- **WHEN** the menu is open and the user presses the pointer anywhere outside the
  open menu
- **THEN** the menu closes

### Requirement: Keyboard and ARIA contract

The action list SHALL be `role="menu"` with each action as `role="menuitem"`. On
open, focus SHALL move into the menu; `ArrowUp`/`ArrowDown` SHALL move between
actions; the open menu SHALL trap focus (`Tab`/`Shift+Tab` cycle within it) for the
duration it is open.

#### Scenario: Arrow keys move between actions

- **WHEN** the menu is open and focus is on an action
- **THEN** `ArrowDown`/`ArrowUp` move focus to the next/previous action within the
  menu

### Requirement: The existing action set and two-step delete-confirm are preserved

The menu SHALL present the same actions the pinned-tab menu presents today — Go home
and Make this home (only when the tab has drifted), Unpin, and Delete — dispatched
through the existing bus commands unchanged. Deleting a bound tab SHALL remain a
two-step confirmation: the first activation re-renders the row as a confirm
affordance and keeps the menu open; the second activation dispatches the delete and
closes the menu.

#### Scenario: Drifted tab shows the home actions

- **WHEN** the menu opens for a pinned tab whose current URL has drifted from its
  home URL
- **THEN** the menu includes Go home and Make this home in addition to Unpin and
  Delete

#### Scenario: Delete is a two-step confirm

- **WHEN** the user selects Delete on a bound pinned tab
- **THEN** the menu stays open and the row becomes a confirm affordance; only a
  second activation dispatches the delete and closes the menu

### Requirement: Animated reveal honours reduced motion

Opening SHALL animate the drawer height from the row height to its expanded height
over the `--motion-base`/`--ease-standard` token pair, so the actions visibly grow
out from behind the tab rather than appearing instantly. Closing SHALL reverse the
growth. Under `prefers-reduced-motion: reduce`, the animation SHALL use the reduced
duration produced by the existing global token collapse (`--motion-base` →
`--motion-fast`); no bespoke per-component suppression SHALL be required.

#### Scenario: Drawer grows rather than snapping

- **WHEN** the user opens the menu
- **THEN** the drawer eases open over roughly 200ms, the actions emerging from
  behind the tab, rather than appearing instantly

#### Scenario: Reduced motion uses the fast tick

- **WHEN** `prefers-reduced-motion: reduce` is active and the menu opens
- **THEN** the reveal uses the collapsed `--motion-fast` duration, consistent with
  every other transition in the app

### Requirement: The menu closes if its tab is removed underneath it

The menu SHALL be associated with a specific pinned-tab id. If a state update
removes that tab (for example it is unpinned or closed from another window) while
the menu is open, the menu SHALL close (the keyed row unmounts, taking the open
menu with it).

#### Scenario: Underlying tab disappears

- **WHEN** the menu is open for a pinned tab and a state broadcast arrives in which
  that tab no longer exists
- **THEN** the menu closes and the sidebar returns to its normal state

### Requirement: The morph menu is a token-only src/ui primitive and replaces Menu

The menu SHALL ship as `src/ui/TabRowMenu.svelte`, with the `TabRowMenu` component
exported from `src/ui/index.ts`, composing the existing `TabRow` and `Icon`
primitives and using only design tokens from `tokens.css` (no hard-coded colours or
pixel design values). `TabRowMenu` SHALL render the row via `TabRow`, keeping it
unchanged while the drawer grows behind it; `TabRow` SHALL expose a `trailingVisible`
prop so the trigger stays visible while the menu is open. The previous
floating-dropdown primitive `src/ui/Menu.svelte` (and its `MenuItem` type, tests,
and export) SHALL be removed, since `PinnedTabs` — its only consumer — migrates to
`TabRowMenu` in this change.

#### Scenario: Pinned tabs use the new primitive

- **WHEN** the sidebar renders pinned tabs
- **THEN** their actions menu is provided by `TabRowMenu`, and `Menu.svelte` no
  longer exists in the codebase or `src/ui/index.ts`

### Requirement: Pinned rows expose a "Lock to its site" boundary editor

A pinned tab's overflow menu SHALL offer a **"Lock to its site…"** entry that opens
a boundary editor for that tab. Choosing the entry SHALL **drill into a dedicated
view inside the menu drawer** — the action list is replaced by a back affordance
(`‹ Lock to its site`) above the editor, and the back affordance (or `Esc`) SHALL
return to the actions. The editor SHALL present a tri-state mode control
(**Default** · **Off** · **On** — the user-facing labels for the
inherit/off/locked modes) and, when **On**, an editable list of host-glob patterns
(each removable) with a field to add a new pattern. Selecting a mode or editing the
list SHALL dispatch `setTabBoundary` over the bus (`null` for **Default**). The
**Default** option SHALL surface the live global default (e.g. "Default: off — this
tab navigates freely.") so inheritance is legible, not hidden.

The "Lock to its site…" entry SHALL carry a **submenu affordance** — a trailing
chevron plus `aria-haspopup` — signalling that it drills into a sub-view rather
than firing an immediate action. (There is no separate per-row locked-state badge;
the lock state is surfaced through the menu/editor.) The editor SHALL compose
existing primitives (`SegmentedControl`, `TextInput`, `Button`) plus the new `Chip`
primitive for the pattern tokens; it SHALL NOT re-roll any primitive inline. The
"Lock to its site…" entry SHALL be added to `TabRowMenu` as a data-driven action so
the menu primitive stays generic.

#### Scenario: Opening the editor from the row menu

- **WHEN** the user opens a pinned row's overflow menu and chooses "Lock to its site…"
- **THEN** the menu SHALL drill into the boundary editor (replacing the actions, with a back affordance) showing the tab's current mode (Default / Off / On) and, when On, its host-glob list

#### Scenario: Adding a host glob dispatches setTabBoundary

- **WHEN** the user is in On (locked) mode and adds the pattern `*.example.com`
- **THEN** a `setTabBoundary` command SHALL be dispatched with the updated `allow` list

#### Scenario: The lock entry advertises its submenu

- **WHEN** a pinned row's overflow menu is open
- **THEN** the "Lock to its site…" entry SHALL show a trailing chevron and expose `aria-haspopup`, marking it as a drill-in rather than an immediate action

#### Scenario: Default shows the live default

- **WHEN** the editor is open in Default mode
- **THEN** the Default control SHALL reflect whether the global default is currently off or lock-to-domain

