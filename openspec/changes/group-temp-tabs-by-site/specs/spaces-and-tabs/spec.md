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

**Tidy actions (sibling menu).** Each panel rendering Clear SHALL also render a `Menu` (`trigger="kebab"`, `icon="chevron-down"`) immediately beside the Clear button, containing exactly two actions in this order: "Clear duplicates" then "Group by site" — see the "Clear duplicates temporary-tab action" and "Group temporary tabs by site" requirements below for their full behaviour. This kebab menu SHALL render whenever Clear renders (i.e. the Space has ≥1 temporary tab), independent of whether either action currently has anything to do — each item reflects its own applicability via its disabled state.

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

**One toast at a time.** Clear, Clear duplicates, and Group by site SHALL share a
single toast slot: mounting a new toast SHALL replace any toast still showing,
so no two of these actions' toasts are ever visible simultaneously.

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

#### Scenario: The kebab menu carries both tidy actions

- **GIVEN** a Space with ≥1 temporary tab open in the window
- **WHEN** the panel renders and the user opens the kebab menu beside Clear
- **THEN** the menu SHALL contain exactly two items, "Clear duplicates" followed by "Group by site"

## ADDED Requirements

### Requirement: Group temporary tabs by site

Each carousel panel that renders Clear SHALL also expose a **Group by site**
action in the same kebab `Menu` as Clear duplicates, carrying that panel's
`spaceId`. Unlike Clear and Clear duplicates, Group by site SHALL NOT close,
archive, or open any tab — it SHALL only reorder the Space's window instance's
`tempTabIds`.

Activating "Group by site" SHALL dispatch `bus.send({ kind:
'groupTempTabsBySite', payload: { windowId, spaceId } })`.

**Clustering rule.** The coordinator's `groupTempTabsBySite` handler SHALL
reorder the target Space instance's `tempTabIds` so that tabs sharing a hostname
are contiguous, by:

1. Resolving the target Space's temporary tabs still open in `windowId` (the same
   `tempTabIds` source Clear duplicates reads), and keying each by the hostname
   of its live tab's URL, as returned by `hostOf`
   (`apps/extension/src/shared/label-for.ts`). A URL that does not parse or
   carries no hostname SHALL key to the empty string and cluster with other such
   tabs, rather than being dropped or moved to a fixed edge of the list.
2. Ordering the clusters by **first appearance**: the cluster whose hostname is
   first seen scanning the current `tempTabIds` order comes first, and so on.
3. Preserving each cluster's **internal relative order** from the current
   `tempTabIds`.
4. Leaving every id in `tempTabIds` that is not a live temporary tab of this
   window in its CURRENT slot, reordering only among the slots the clustered tabs
   already occupy — the same subset-safe rule `reorderTemp` applies.

The rule is **stable** and therefore **idempotent**: applying it to an
already-clustered list SHALL leave the order unchanged. The hostname comparison
SHALL be exact — `mail.example.com` and `docs.example.com` are distinct clusters,
and no public-suffix or registrable-domain resolution SHALL be performed.

**No-op condition.** The action is a no-op exactly when applying the clustering
rule to the Space's live temporary tabs of `windowId` returns them in the order
they are already in. Because non-live ids never move (step 4), comparing that
live subsequence and comparing the whole `tempTabIds` array yield the same
answer — the disabled predicate and the handler MAY use either basis and SHALL
agree. In that case the handler SHALL NOT mutate state and SHALL NOT broadcast,
and the "Group by site" menu item SHALL render **disabled** (not hidden),
remaining visible and discoverable whenever the kebab menu is shown.

`groupTempTabsBySite` on the store SHALL return a `boolean` reporting whether it
changed the order, so the handler can decide whether to `markDirty` — the
coordinator gates its broadcast solely on that flag.

**Missing instance.** If the resolved Space has no instance in `windowId`, the
handler SHALL be a silent no-op and the coordinator SHALL still ack `'ok'` —
matching `clearDuplicateTempTabs` and `store.reorderTemp`, which both return
without throwing. No error ack SHALL be emitted for this case.

**Undo.** The sidebar SHALL capture the pre-group `tempTabIds` order LOCALLY
before dispatching, and on a resolved ack SHALL mount the same `Toast` primitive
Clear uses, showing "Grouped N tabs by site — Undo" (a distinct message from
Clear's and Clear duplicates'), with the same nominal 5-second lifetime and the
same interruptibility Clear's toast has, per the `visual-system` Toast
requirement. **N SHALL be the number of the Space's live temporary tabs in
`windowId`** — the size of the set the rule reordered, not the number of tabs
whose index happened to change and not the number of distinct hostnames — so the
sidebar can compute it from the same list it used for the disabled predicate.
Its Undo action SHALL dispatch `bus.send({ kind:
'reorderTemp', payload: { windowId, spaceId, tabIds } })` carrying that captured
order. No new undo command SHALL be introduced — `reorderTemp` already accepts a
full explicit order and already tolerates ids that have since closed.

#### Scenario: Group by site dispatches groupTempTabsBySite carrying the panel's Space

- **WHEN** the user activates "Group by site" for Space "work" in window 100
- **THEN** the sidebar SHALL call `bus.send({ kind: 'groupTempTabsBySite', payload: { windowId: 100, spaceId: 'work' } })`

#### Scenario: Same-host tabs become contiguous, clusters ordered by first appearance

- **GIVEN** a Space instance whose temporary tabs are, in order, `a.com/1`, `b.com/1`, `a.com/2`, `c.com/1`, `b.com/2`
- **WHEN** the `groupTempTabsBySite` handler runs
- **THEN** the resulting order SHALL be `a.com/1`, `a.com/2`, `b.com/1`, `b.com/2`, `c.com/1`

#### Scenario: Tabs with no parseable hostname cluster together

- **GIVEN** a Space instance whose temporary tabs are, in order, `a.com/1`, a tab whose URL is `blob:xyz`, `a.com/2`, a tab whose URL is unparseable
- **WHEN** the handler runs
- **THEN** the two hostless tabs SHALL be contiguous, in their original relative order, positioned where the first of them appeared relative to the other clusters

#### Scenario: Grouping is idempotent

- **GIVEN** a Space instance whose temporary tabs are already clustered by hostname
- **WHEN** the handler runs
- **THEN** `tempTabIds` SHALL be unchanged and the handler SHALL NOT broadcast

#### Scenario: The Group-by-site item is disabled when grouping would change nothing

- **GIVEN** a Space whose temporary tabs are already clustered by hostname
- **WHEN** the user opens the kebab menu
- **THEN** the "Group by site" item SHALL render, and SHALL be disabled

#### Scenario: No tab is closed or archived

- **GIVEN** a Space instance with five temporary tabs across three hostnames
- **WHEN** the handler runs
- **THEN** `archivedTabs` SHALL be unchanged, no `chrome.tabs.remove` SHALL be called, and the set of ids in `tempTabIds` SHALL be identical to before

#### Scenario: Ids that are not live temporary tabs of this window keep their slot

- **GIVEN** a Space instance whose `tempTabIds` interleaves live tabs of this window with an id whose live tab is absent
- **WHEN** the handler runs
- **THEN** the absent id SHALL remain at its current index and only the live tabs' slots SHALL be reordered

#### Scenario: A new toast replaces one still showing

- **GIVEN** a "Cleared N tabs — Undo" toast is still visible
- **WHEN** the user activates "Group by site" and its ack resolves
- **THEN** exactly one toast SHALL be visible, showing the Group-by-site message

#### Scenario: Group by site shows a Toast whose Undo restores the prior order

- **GIVEN** a Space instance whose temporary-tab order is `X`
- **WHEN** the user activates "Group by site" and the ack resolves, then activates the toast's Undo
- **THEN** the sidebar SHALL show "Grouped N tabs by site — Undo"
- **AND** Undo SHALL dispatch `bus.send({ kind: 'reorderTemp', payload: { windowId, spaceId, tabIds: X } })`
