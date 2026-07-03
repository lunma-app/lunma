## MODIFIED Requirements

### Requirement: New Tab and Clear temporary-tab actions

The sidebar SHALL expose two temporary-tab actions, each acting on **its own carousel panel's Space**: a **New Tab** row that opens a tab, and a **Clear** action that dismisses that Space's temporary tabs. Because every Space panel is pre-rendered and fully live (the single-track carousel), the actions SHALL NOT toggle their interactivity at commit; in the common case the centred (active) panel's Space is the target. Both SHALL dispatch typed bus commands (no optimistic local mutation); the resulting Chrome tab events reconcile state and the broadcast refreshes the UI.

**New Tab.** Activating a panel's New Tab row SHALL dispatch `bus.send({ kind: 'newTab', payload: { windowId, spaceId } })` carrying that panel's `spaceId`. The coordinator's `newTab` handler SHALL, when `spaceId` is present and is NOT the window's active Space, **activate that Space first** (the same sequence as `activateSpace`) so the newly created — and focused — tab is visible in it; when `spaceId` is absent or already the active Space, no activation occurs and behaviour is unchanged. The handler SHALL then, when the window already has a **home tab** (a tab whose live URL is the new-tab page, recognised by `isNewTabUrl`), **focus that existing home tab** (activate it + bring its window forward) rather than create a second one — so repeated New Tab activations never accumulate home tabs (at most one home tab per window). Only when the window has no home tab SHALL the handler create one (active in the window), which joins the (now-)active Space's group via the existing tab-creation path.

**Clear.** Activating a panel's Clear action SHALL dispatch `bus.send({ kind: 'clearTempTabs', payload: { windowId, spaceId } })` carrying that panel's `spaceId`. The coordinator's `clearTempTabs` handler SHALL:

1. Insert each tab being closed into `archivedTabs` (same schema as a sweep-archived entry, with `archivedAt` set to the time of the Clear) BEFORE calling `chrome.tabs.remove`, so records are never lost if the remove partially fails.
2. Close the temporary tabs (pinned/bound tabs are untouched). When the temporary tabs being cleared are the window's **only** tabs, the coordinator SHALL open the Space home (a new home tab) BEFORE closing them, so the window survives on its home — Clear empties the Temporary list but SHALL NOT close the window (and therefore SHALL NOT quit the browser when it is the last window).
3. After insertion, broadcast a state update so the sidebar reflects both the empty temporary list and the updated `archivedTabs`.

The sidebar SHALL mount a `Toast` primitive (`apps/extension/src/ui/Toast.svelte`) that displays a transient "Cleared N tabs — Undo" message for a **nominal 5 seconds** after `clearTempTabs` completes — interruptible per the `visual-system` Toast requirement: the countdown pauses while the pointer is over the toast or focus is within it, and `Escape` from within dismisses it — where N is the count of tabs cleared (known locally by the sidebar from its own temporary-tab list — no value flows back through the bus, whose ack carries no data). Activating the Undo action SHALL dispatch `bus.send({ kind: 'undoClearTempTabs', payload: { windowId, tabIds } })` carrying the originating window and the `tabId`s of the batch just cleared. The coordinator's `undoClearTempTabs` handler SHALL, for each `tabId` in order, restore the most-recent surviving archived entry bearing that `tabId` into `windowId`, skipping any `tabId` whose archived entry no longer survives; the sidebar dismisses the toast on Undo.

Clear SHALL be rendered on any panel whose Space has ≥1 temporary tab open in the window, and hidden otherwise; clearing a background Space's temps SHALL NOT switch the active Space.

**Every panel fully live.** On the single-track carousel every Space panel is pre-rendered with its own Space's content, and its actions are live — a switch is a pure transform with no per-panel mount or interactivity toggle at commit (the spike model). New Tab SHALL be enabled on every slide and target its own Space; Clear SHALL render on any slide whose Space has temporary tabs and target its own Space. This supersedes the former "active-slide only" rule, under which a non-centre slide's New Tab was disabled and its Clear was not rendered.

**Clear duplicates (sibling action).** Each panel rendering Clear SHALL also render a `Menu` (`trigger="kebab"`, `icon="chevron-down"`) immediately beside the Clear button, containing a single "Clear duplicates" action — see the "Clear duplicates temporary-tab action" requirement below for its full behaviour. This kebab menu SHALL render whenever Clear renders (i.e. the Space has ≥1 temporary tab), independent of whether any duplicates currently exist — the "Clear duplicates" item itself is what reflects duplicate-presence via its disabled state.

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

#### Scenario: Clear archives tabs before closing them

- **GIVEN** Space "work" has 3 temporary tabs in window 100
- **WHEN** the coordinator processes `clearTempTabs` for window 100 / Space "work"
- **THEN** all 3 tabs SHALL be inserted into `archivedTabs` with `archivedAt` set to the current time BEFORE `chrome.tabs.remove` is called

#### Scenario: Clear dispatches clearTempTabs carrying the panel's Space

- **GIVEN** the panel's Space has at least one temporary tab
- **WHEN** the user clicks that panel's Clear action in window 100 for Space "work"
- **THEN** the sidebar SHALL call `bus.send({ kind: 'clearTempTabs', payload: { windowId: 100, spaceId: 'work' } })`

#### Scenario: Clear shows a Toast with Undo

- **GIVEN** the user has just cleared N temporary tabs in Space "work"
- **WHEN** the `clearTempTabs` command completes
- **THEN** the sidebar SHALL mount the `Toast` showing "Cleared N tabs — Undo" for a nominal 5 seconds (pausing while hovered or focused, per the `visual-system` Toast requirement)

#### Scenario: Undo restores the cleared batch

- **GIVEN** the Toast is visible after a Clear of 3 tabs with ids `[10, 11, 12]` in window 100
- **WHEN** the user activates the Undo action while the toast is visible
- **THEN** the sidebar SHALL call `bus.send({ kind: 'undoClearTempTabs', payload: { windowId: 100, tabIds: [10, 11, 12] } })`
- **AND** the coordinator SHALL restore each tab in order into window 100

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

#### Scenario: The Clear-duplicates kebab menu renders alongside Clear

- **GIVEN** a panel's Space has ≥1 temporary tab open (Clear is rendered)
- **THEN** the panel SHALL also render the "Clear duplicates" kebab menu beside Clear

## ADDED Requirements

### Requirement: Clear duplicates temporary-tab action

Each carousel panel that renders Clear SHALL also expose a **Clear duplicates**
action, reachable via a `Menu` (`trigger="kebab"`) rendered beside the Clear
button, carrying that panel's `spaceId`. Unlike Clear (which closes every
temporary tab in the Space), Clear duplicates SHALL close only the temporary
tabs that duplicate another temporary tab's exact URL within that Space's
window instance, leaving all other temporary tabs open.

Activating "Clear duplicates" SHALL dispatch `bus.send({ kind:
'clearDuplicateTempTabs', payload: { windowId, spaceId } })`.

The coordinator's `clearDuplicateTempTabs` handler SHALL:

1. Resolve the target Space's temporary tabs still open in `windowId` (the
   same `tempTabIds` source `clearTempTabs` reads), and group them by their
   live tab's URL using **exact string equality** — no normalisation, no
   fragment stripping (matching `findTabInActiveSpace`'s existing convention).
2. For every group containing more than one tab, keep the tab that appears
   **first** in the Space instance's `tempTabIds` order (the earliest-listed
   tab) and collect every other tab in that group into the closing batch. A
   URL with only one tab open contributes nothing to the batch.
3. If the resulting batch is empty (no duplicate URLs currently exist in the
   Space), the handler SHALL be a no-op — it SHALL NOT archive, remove any
   tab, or broadcast a state update.
4. Otherwise, follow the same archive-then-remove sequence `clearTempTabs`
   uses: insert each batched tab into `archivedTabs` (one shared
   `archivedAt`) BEFORE calling `chrome.tabs.remove`; if the batch would
   leave the window with no tabs, open the Space home first (identical
   "keep the window alive" guard as Clear); broadcast the updated state
   after archiving.

The "Clear duplicates" menu item SHALL render **disabled** (not hidden) when
the target Space currently has no duplicate temporary-tab URLs open — it
remains visible and discoverable at all times the kebab menu is shown, but is
inert when there is nothing to collapse.

Undo for a "Clear duplicates" batch SHALL reuse the existing
`undoClearTempTabs` command and handler unchanged: the sidebar SHALL mount the
same `Toast` primitive used for Clear, showing "Cleared N duplicate tabs —
Undo" (a distinct message from Clear's "Cleared N tabs — Undo"), and its Undo
action SHALL dispatch `bus.send({ kind: 'undoClearTempTabs', payload: {
windowId, tabIds } })` carrying the batch's `tabId`s, identically to Clear's
Undo.

#### Scenario: Clear duplicates dispatches clearDuplicateTempTabs carrying the panel's Space

- **WHEN** the user activates "Clear duplicates" for Space "work" in window 100
- **THEN** the sidebar SHALL call `bus.send({ kind: 'clearDuplicateTempTabs', payload: { windowId: 100, spaceId: 'work' } })`

#### Scenario: Duplicate groups collapse to their earliest-listed tab

- **GIVEN** Space "work" in window 100 has temporary tabs, in list order, `[10 → https://a.example/, 11 → https://b.example/, 12 → https://a.example/]`
- **WHEN** the coordinator processes `clearDuplicateTempTabs` for window 100 / Space "work"
- **THEN** tab `12` SHALL be archived and closed (it duplicates `10`'s URL and appears later)
- **AND** tabs `10` and `11` SHALL remain open and untouched

#### Scenario: A three-way duplicate keeps only the earliest tab

- **GIVEN** Space "work" has temporary tabs, in list order, `[10 → https://a.example/, 11 → https://a.example/, 12 → https://a.example/]`
- **WHEN** the coordinator processes `clearDuplicateTempTabs`
- **THEN** tab `10` SHALL survive and tabs `11` and `12` SHALL be archived and closed

#### Scenario: No duplicates present — the handler is a no-op

- **GIVEN** Space "work" has temporary tabs with no two sharing the same exact URL
- **WHEN** the coordinator processes `clearDuplicateTempTabs` for that Space
- **THEN** no tab SHALL be archived or removed, and no state broadcast SHALL be emitted

#### Scenario: Clear duplicates archives before removing

- **GIVEN** a duplicate group resolves to a closing batch of tabs `[12, 15]`
- **WHEN** the coordinator processes `clearDuplicateTempTabs`
- **THEN** tabs `12` and `15` SHALL be inserted into `archivedTabs` (one shared `archivedAt`) BEFORE `chrome.tabs.remove` is called

#### Scenario: Clear duplicates keeps the window alive when the batch would empty it

- **GIVEN** the duplicate-closing batch would leave window 100 with no tabs
- **WHEN** the coordinator processes `clearDuplicateTempTabs`
- **THEN** it SHALL open a home tab BEFORE removing the batched tabs, so the window survives

#### Scenario: The menu item is disabled when no duplicates exist

- **GIVEN** a Space's temporary tabs contain no duplicate URLs
- **THEN** the "Clear duplicates" menu item SHALL render disabled
- **AND** the kebab menu itself SHALL still render (only the item is disabled, not hidden)

#### Scenario: The menu item is enabled when duplicates exist

- **GIVEN** a Space's temporary tabs contain at least one URL open more than once
- **THEN** the "Clear duplicates" menu item SHALL render enabled

#### Scenario: Undo restores a Clear-duplicates batch via the existing command

- **GIVEN** "Clear duplicates" closed tabs `[12, 15]` in window 100
- **WHEN** the user activates Undo on the resulting Toast
- **THEN** the sidebar SHALL call `bus.send({ kind: 'undoClearTempTabs', payload: { windowId: 100, tabIds: [12, 15] } })`
- **AND** the coordinator SHALL restore both tabs via the existing `undoClearTempTabs` handler, unmodified

#### Scenario: Duplicate detection does not cross Spaces or windows

- **GIVEN** `https://a.example/` is open as a temporary tab in Space "work" and also, separately, in Space "side" (or in a different window)
- **WHEN** the coordinator processes `clearDuplicateTempTabs` for Space "work" in window 100
- **THEN** only tabs within Space "work"'s window-100 instance are considered — the tab in Space "side" (or the other window) SHALL NOT be archived or closed

#### Scenario: Pinned tabs are never considered or touched

- **GIVEN** a pinned (saved) tab is bound in window 100 at the same URL as an open temporary tab in the same Space
- **WHEN** the coordinator processes `clearDuplicateTempTabs` for that Space
- **THEN** the pinned tab SHALL NOT be archived, closed, or counted toward any duplicate group — only entries in `tempTabIds` participate
