## MODIFIED Requirements

### Requirement: A favorite tile exposes a right-click context menu

Right-clicking (the context-menu gesture) a `FaviconTile` SHALL open a `Menu` primitive
(`trigger: 'context'`) anchored at the cursor and SHALL suppress the native browser context menu.
At parity with the pinned-row menu (see the `tab-row-menu` capability), the menu SHALL
offer:

- **Go to tab** (or **Open** when the favorite is dormant in this window) — focus the
  bound tab, or open the favorite, the same outcome as a left-click;
- **Go home** and **Make this home** — shown ONLY when the favorite is drifted
  (`currentURL !== originalURL`), dispatching `goHome` / `makeThisHome`;
- **Copy link** — copy the favorite's current URL to the clipboard (best-effort);
- **Lock to its site…** — a drill-in that morphs the menu in place (a back-arrow header
  + the boundary editor) WITHOUT closing it, so the user can widen or relax the lock
  (see Requirement: A bound saved tab MAY be confined to a domain boundary);
- **Move left** and **Move right** — reorder the favorite one position within the
  favicon row, dispatching `reorderFavorites` carrying the full row order with this
  favorite moved one position toward that end. Each entry SHALL render disabled (the
  standard disabled treatment, not hidden) when the favorite is already at that end of
  the row, and activating a disabled entry SHALL dispatch nothing. Because the context
  menu opens from the keyboard (context-menu key / `Shift+F10`) and from touch
  long-press, this makes favorites reordering reachable without a pointer drag;
- **Remove from favorites** — dispatch `unpinTab` (non-destructive: a bound tab returns
  to Temporary and stays open);
- **Delete** — a destructive `deleteSavedTab` that removes the record entirely and
  closes its bound live tab — presented as a **two-step confirm** (the confirmation
  required by Requirement: Deleting a bound bookmark closes its tab after confirmation,
  in the same arm pattern the pinned row uses): the first activation SHALL arm the
  entry into a danger-treated confirm affordance and keep the menu open without
  dispatching; only a second activation SHALL dispatch `deleteSavedTab` and close the
  menu. Closing the menu, pressing Escape, or activating any other entry SHALL disarm
  without deleting. A favorite dormant in all windows SHALL still delete without
  prompting (per the existing deletion requirement).

The menu SHALL be the shared `apps/extension/src/ui/Menu.svelte` primitive (`trigger: 'context'`) composed by the
feature component `FaviconRow.svelte` (one instance, opened at the right-clicked tile's
cursor position); neither SHALL re-roll a menu inline. Right-click removal exists because
drag-out alone proved undiscoverable.

#### Scenario: Right-clicking a favorite opens the menu and suppresses the native one

- **WHEN** the user right-clicks a favorite tile
- **THEN** the sidebar SHALL open the favorite context menu anchored at the cursor
- **AND** SHALL suppress the browser's native context menu

#### Scenario: Remove from favorites dispatches unpinTab

- **WHEN** the user selects **Remove from favorites** from a favorite's context menu
- **THEN** the sidebar SHALL dispatch `unpinTab` for that favorite (non-destructive)

#### Scenario: Delete is a two-step confirm

- **WHEN** the user selects **Delete** from a bound favorite's context menu
- **THEN** the menu SHALL stay open and the entry SHALL become a danger-treated confirm
  affordance, with no `deleteSavedTab` dispatched
- **AND WHEN** the user activates the armed entry again
- **THEN** the sidebar SHALL dispatch `deleteSavedTab` for that favorite and close the menu

#### Scenario: Dismissal after arming Delete makes no changes

- **WHEN** the user arms **Delete** on a bound favorite and then closes the menu or
  presses Escape
- **THEN** no `deleteSavedTab` SHALL be dispatched and the entry SHALL be unarmed on the
  next open

#### Scenario: Move right reorders a favorite by one

- **GIVEN** the favorite is first of three in `state.faviconRow`
- **WHEN** the user selects **Move right** from its context menu
- **THEN** the sidebar SHALL dispatch `reorderFavorites` carrying the row order with
  that favorite in the second position
- **AND** the rendered order SHALL update from the next state broadcast (no optimistic
  update)

#### Scenario: Move left is disabled at the start of the row

- **GIVEN** the favorite is first in `state.faviconRow`
- **WHEN** its context menu opens
- **THEN** **Move left** SHALL render disabled and activating it SHALL dispatch nothing

#### Scenario: Go home and Make this home appear only when drifted

- **GIVEN** a favorite whose bound tab has not drifted (`currentURL === originalURL`)
- **THEN** its context menu SHALL NOT offer **Go home** or **Make this home**
- **WHEN** that favorite's bound tab drifts off home (`currentURL !== originalURL`)
- **THEN** its context menu SHALL offer **Go home** (dispatch `goHome`) and **Make this home** (dispatch `makeThisHome`)

#### Scenario: Lock to its site drills in without closing the menu

- **WHEN** the user selects **Lock to its site…** from a favorite's context menu
- **THEN** the menu SHALL drill into the boundary editor in place (a back-arrow header over the allow-list editor)
- **AND** SHALL NOT close the menu
- **AND** the back-arrow SHALL return to the favorite's action list
