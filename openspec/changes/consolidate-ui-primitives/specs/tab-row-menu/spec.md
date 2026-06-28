## MODIFIED Requirements

### Requirement: Pinned-tab actions open on right-click as a floating menu at the cursor

A pinned tab's action menu SHALL open on a **`contextmenu`** event (right-click,
or the platform context-menu key / `Shift+F10`) as the shared floating
`Menu` primitive (`trigger: 'context'`) popover anchored at the pointer position
(`event.clientX`/`event.clientY`), clamped into the viewport — the SAME primitive
and interaction the global favicon tiles use. There SHALL be no on-row kebab
trigger and no morph drawer. Opening the menu SHALL `preventDefault()` the
browser's native context menu, and SHALL NOT focus or switch to the tab (no
`focusTab`/`focusSavedTab` is dispatched on right-click). The row's primary click
behaviour is unchanged.

When the `contextmenu` event carries no usable pointer position (a
keyboard-invoked event — context-menu key / `Shift+F10` — reports
`clientX === 0 && clientY === 0`), the menu SHALL anchor to the invoking row's
bounding rect (at the row's title column, vertically centred on the row),
clamped into the viewport, instead of the event coordinates — so a keyboard
user's menu opens at the focused row, not at the viewport corner. This
anchoring rule applies to every surface sharing the `Menu` primitive
(`trigger: 'context'`) (pinned rows, temporary rows, favorite tiles).

A single `Menu` (`trigger: 'context'`) instance SHALL be shared across the pinned list, opened
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

#### Scenario: Keyboard-invoked menu opens at the focused row

- **WHEN** focus is on a pinned tab row and the user presses the context-menu key
  (or `Shift+F10`), producing a `contextmenu` event with `clientX === 0` and
  `clientY === 0`
- **THEN** the menu opens anchored to that row's bounding rect, not at the
  viewport's top-left corner

### Requirement: Animated reveal honours reduced motion

Opening the menu SHALL use the floating `Menu` primitive's (`trigger: 'context'`) entrance animation (a
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

### Requirement: Pinned rows expose a "Lock to its site" boundary editor

A pinned tab's right-click menu SHALL offer a **"Lock to its site…"** entry that
opens a boundary editor for that tab. Choosing the entry SHALL **drill into a
dedicated view inside the floating menu** — the action list is replaced by a back
affordance (`‹ Lock to its site`) above the editor, and the back affordance (or
`Esc`) SHALL return to the actions — using the `Menu` primitive's (`trigger: 'context'`)
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
data-driven `Menu` action (a `MenuItem`), so the menu primitive stays
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
