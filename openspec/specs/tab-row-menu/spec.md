# tab-row-menu Specification

## Purpose
TBD - created by archiving change pinned-tab-row-menu. Update Purpose after archive.
## Requirements
### Requirement: Pinned-tab actions open on right-click as a floating menu at the cursor

A pinned tab's action menu SHALL open on a **`contextmenu`** event (right-click,
or the platform context-menu key / `Shift+F10`) as the shared floating
`ContextMenu` popover anchored at the pointer position
(`event.clientX`/`event.clientY`), clamped into the viewport — the SAME primitive
and interaction the global favicon tiles use. There SHALL be no on-row kebab
trigger and no morph drawer. Opening the menu SHALL `preventDefault()` the
browser's native context menu, and SHALL NOT focus or switch to the tab (no
`focusTab`/`focusSavedTab` is dispatched on right-click). The row's primary click
behaviour is unchanged.

A single `ContextMenu` instance SHALL be shared across the pinned list, opened
for whichever row was right-clicked; the active row SHALL be re-derived from the
right-clicked row's id against live state, so the menu reflects state after each
round-trip and disappears if that row leaves the list.

#### Scenario: Right-click opens the menu at the pointer

- **WHEN** the user right-clicks a pinned tab row
- **THEN** the floating action menu opens at the cursor, the browser's native
  context menu is suppressed, and the tab is neither focused nor switched to

#### Scenario: Keyboard context-menu key opens the menu

- **WHEN** focus is on a pinned tab row and the user presses the context-menu key
  (or `Shift+F10`)
- **THEN** the same floating action menu opens (the `contextmenu` event is served
  identically to a right-click)

### Requirement: A hover-revealed close button closes the pinned tab

Each pinned tab row SHALL render, in its `TabRow` trailing slot, a one-click
**close (`✕`)** `IconButton` revealed on row hover/focus (the same reveal the
former kebab used). Activating it SHALL close the row's **bound live tab** by
dispatching `bus.send({ kind: 'closeTab', payload: { tabId } })` with the row's
live `tabId`, leaving the saved record as a **dormant** pinned tab; it SHALL NOT
also focus or switch to the tab, and SHALL NOT start a drag or trigger the row's
click (it stops pointer/click propagation). A pinned row that is **dormant** (no
bound live tab in this window) SHALL render **no close button** — there is no
live tab to close. Removing the saved record outright remains the menu's
**Delete**; returning it to Temporary remains the menu's **Unpin**.

#### Scenario: Hovering a bound pinned row reveals close

- **WHEN** the user hovers a pinned row whose tab is bound (open) in this window
- **THEN** a `✕` close button appears in the trailing slot, and activating it
  dispatches `closeTab` for that tab without focusing the row

#### Scenario: A dormant pinned row shows no close button

- **WHEN** the user hovers a pinned row that is dormant in this window
- **THEN** no `✕` close button is shown (nothing live to close); Delete and Unpin
  remain available from the row's right-click menu

### Requirement: The menu is modal-ish and keyboard-dismissible

While the menu is open: row drag-to-reorder and the Space-switch swipe SHALL NOT
start from interactions with the menu (the floating menu suppresses pointer
propagation). `Escape` SHALL close the menu, a pointer-down anywhere outside the
open menu SHALL close it, and closing SHALL return focus to the element that
opened it (the focused row or the close button), not to any kebab trigger (there
is none).

#### Scenario: Escape closes and returns focus

- **WHEN** the menu is open and the user presses `Escape`
- **THEN** the menu closes and keyboard focus returns to the element that opened
  it

#### Scenario: Outside pointer-down closes

- **WHEN** the menu is open and the user presses the pointer anywhere outside the
  open menu
- **THEN** the menu closes

### Requirement: Keyboard and ARIA contract

The action list SHALL be `role="menu"` with each action as `role="menuitem"`. On
open, focus SHALL move into the menu (to the first action, or the back affordance
when opened straight into a drill-in); `ArrowUp`/`ArrowDown` SHALL move between
actions; `Home`/`End` SHALL jump to the first/last; `Escape` SHALL dismiss (or
step back out of a drill-in view first).

Unlike the former morph drawer, the floating menu SHALL NOT trap focus with
`Tab`/`Shift+Tab` — this is the deliberate popover model shared with the favicon
tiles' context menu: the menu instead dismisses on `Escape` or an outside
pointer-down and returns focus to the element that opened it (see "The menu is
modal-ish and keyboard-dismissible"). The previous focus-trap guarantee (`Tab`
cycling within the open drawer) is intentionally dropped with the drawer.

#### Scenario: Arrow keys move between actions

- **WHEN** the menu is open and focus is on an action
- **THEN** `ArrowDown`/`ArrowUp` move focus to the next/previous action within the
  menu

#### Scenario: Tab is not trapped within the open menu

- **WHEN** the menu is open and the user presses `Tab`
- **THEN** focus is NOT cycled/held within the menu (no focus trap); the menu
  relies on `Escape`/outside pointer-down for dismissal, matching the favicon
  context menu

### Requirement: The existing action set and two-step delete-confirm are preserved

The menu SHALL present the same actions the pinned-tab menu presents today — Go
home and Make this home (only when the tab has drifted), Rename (and Reset name
when a custom name is set), the "Lock to its site…" drill-in, Unpin, and Delete —
dispatched through the existing bus commands unchanged. Deleting a non-dormant
bound tab SHALL remain a two-step confirmation: the first activation re-renders
the entry as a confirm affordance and keeps the menu open; the second activation
dispatches the delete and closes the menu.

#### Scenario: Drifted tab shows the home actions

- **WHEN** the menu opens for a pinned tab whose current URL has drifted from its
  home URL
- **THEN** the menu includes Go home and Make this home in addition to Rename,
  Lock to its site…, Unpin, and Delete

#### Scenario: Delete is a two-step confirm

- **WHEN** the user selects Delete on a non-dormant bound pinned tab
- **THEN** the menu stays open and the entry becomes a confirm affordance; only a
  second activation dispatches the delete and closes the menu

### Requirement: Animated reveal honours reduced motion

Opening the menu SHALL use the floating `ContextMenu`'s entrance animation (a
short rise + fade over the `--motion-fast`/`--ease-emphasised` token pair), the
same entrance the favicon menu uses, rather than a drawer growing from behind the
row. Under `prefers-reduced-motion: reduce`, the entrance SHALL be suppressed via
the primitive's existing reduced-motion rule; no bespoke per-row suppression
SHALL be required.

#### Scenario: Menu animates in on the fast tick

- **WHEN** the user opens the menu
- **THEN** the floating menu rises and fades in over roughly the `--motion-fast`
  duration rather than appearing with a drawer that grows from the row

#### Scenario: Reduced motion suppresses the entrance

- **WHEN** `prefers-reduced-motion: reduce` is active and the menu opens
- **THEN** the entrance animation is suppressed, consistent with every other
  popover in the app

### Requirement: The menu closes if its tab is removed underneath it

The menu SHALL be associated with a specific pinned-row id. The active row SHALL
be re-derived from that id against live state; if a state update removes that row
(for example it is unpinned, deleted, or closed from another window) while the
menu is open, the derived row SHALL become absent and the menu SHALL close.

#### Scenario: Underlying row disappears

- **WHEN** the menu is open for a pinned row and a state broadcast arrives in
  which that row no longer exists
- **THEN** the derived active row becomes absent and the menu closes, returning
  the sidebar to its normal state

### Requirement: Pinned rows expose a "Lock to its site" boundary editor

A pinned tab's right-click menu SHALL offer a **"Lock to its site…"** entry that
opens a boundary editor for that tab. Choosing the entry SHALL **drill into a
dedicated view inside the floating menu** — the action list is replaced by a back
affordance (`‹ Lock to its site`) above the editor, and the back affordance (or
`Esc`) SHALL return to the actions — using the `ContextMenu` primitive's
`panel`/`panelTitle` drill-in (the same drill-in the favicon menu uses). The
editor SHALL present a tri-state mode control (**Default** · **Off** · **On** —
the user-facing labels for the inherit/off/locked modes) and, when **On**, an
editable list of **URL-glob patterns** (each removable) with a field to add a new
pattern. A pattern MAY be a **bare host** (`gitlab.com`, `*.example.com` — the
whole host) or a **URL pattern** with a path (`https://example.com/inbox*` — a
path-prefix when it ends in `*`, an exact URL otherwise). Selecting a mode or
editing the list SHALL dispatch `setTabBoundary` over the bus (`null` for
**Default**). When the user switches the mode to **On** (locked) from Default or
Off, the editor SHALL **seed** the allow-set with `pageGlob(originalURL)` (the
tab's current view, `origin + pathname + '*'`) so the lock works with no typing; a
non-`http(s)` home SHALL seed an empty list. The **Default** option SHALL surface
the live global default (e.g. "Default: off — this tab navigates freely.") so
inheritance is legible, not hidden.

The "Lock to its site…" entry SHALL carry a **submenu affordance** — a trailing
chevron plus `aria-haspopup` — signalling that it drills into a sub-view rather
than firing an immediate action. (There is no separate per-row locked-state
badge; the lock state is surfaced through the menu/editor.) The editor SHALL
compose existing primitives (`SegmentedControl`, `TextInput`, `Button`, `Chip`);
it SHALL NOT re-roll any primitive inline. The add field SHALL validate input
against a **URL-glob validator** (accepting a host glob OR a URL pattern), tinting
the field invalid for whitespace or obviously-malformed input, and SHALL reject
duplicates of an already-listed pattern. The "Lock to its site…" entry SHALL be a
data-driven `ContextMenu` action (a `MenuItem`), so the menu primitive stays
generic.

#### Scenario: Opening the editor from the row menu

- **WHEN** the user opens a pinned row's right-click menu and chooses "Lock to its site…"
- **THEN** the menu SHALL drill into the boundary editor (replacing the actions, with a back affordance) showing the tab's current mode (Default / Off / On) and, when On, its URL-glob list

#### Scenario: Switching to On seeds the current view

- **GIVEN** a pinned tab whose `originalURL` is `https://gitlab.com/dashboard/merge_requests`
- **WHEN** the user switches the boundary mode to **On** from Default
- **THEN** a `setTabBoundary` command SHALL be dispatched with `{ mode: 'locked', allow: ['https://gitlab.com/dashboard/merge_requests*'] }`

#### Scenario: Adding a URL pattern dispatches setTabBoundary

- **WHEN** the user is in On (locked) mode and adds the pattern `https://example.com/inbox*`
- **THEN** a `setTabBoundary` command SHALL be dispatched with the updated `allow` list

#### Scenario: Adding a bare host is still accepted

- **WHEN** the user is in On (locked) mode and adds the pattern `*.example.com`
- **THEN** the validator SHALL accept it and a `setTabBoundary` command SHALL be dispatched with it appended (it means the whole host)

#### Scenario: The lock entry advertises its submenu

- **WHEN** a pinned row's right-click menu is open
- **THEN** the "Lock to its site…" entry SHALL show a trailing chevron and expose `aria-haspopup`, marking it as a drill-in rather than an immediate action

#### Scenario: Default shows the live default

- **WHEN** the editor is open in Default mode
- **THEN** the Default control SHALL reflect whether the global default is currently off, lock-to-domain, or lock-to-this-page

