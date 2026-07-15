## MODIFIED Requirements

### Requirement: Clicking a dormant bookmark opens a new tab and binds it

When the user activates a saved tab that is dormant **in the focused window** (no slot for that window in `tabBindings[savedTabId]`), Lunma SHALL open a new Chrome tab at `originalURL` in that window, SHALL set `tabBindings[savedTabId][windowId]` to the new tab's id, and SHALL set the record's `currentURL = originalURL`. If the record is coupled (`spaceId !== null`) the new tab SHALL be added to that window's Chrome group for the record's Space; if the record is a favorite (`spaceId === null`) the new tab SHALL be left **ungrouped** (global) and **natively pinned** (Chrome tab-strip pin, `chrome.tabs.update(tabId, { pinned: true })` — rendering it icon-only at the strip start) via `ensureFavoriteNativePinned` and SHALL NOT be added to any Space's Chrome group. No other window's binding SHALL be created or modified.

When the record is coupled (`spaceId !== null`) **and** its Space is **not** the focused window's active Space (`activeSpaceByWindow[windowId]`), Lunma SHALL **activate that Space in the window** as part of the activation — the same activation sequence the `activateSpace` command runs (store activation **and** Chrome group orchestration: show the record's group, hide the outgoing one) — **before** adding the new tab to its group, so the just-opened tab is visible in its now-active group rather than hidden in a background group. A same-Space activation SHALL NOT switch (no orchestration), and a favorite (`spaceId === null`) SHALL NEVER switch the window's Space.

#### Scenario: Activating a dormant pinned saved tab

- **WHEN** the user clicks the pinned saved tab for GitHub in window 100's sidebar and it is dormant in window 100
- **THEN** a new tab SHALL open at `https://github.com/` in window 100
- **AND** `tabBindings[<gh-id>][100]` SHALL equal the new tab's id
- **AND** the record's `currentURL` SHALL equal `originalURL`
- **AND** the new tab SHALL be added to window 100's Chrome group for the record's Space

#### Scenario: Activating a dormant favorite opens it ungrouped and natively pinned

- **WHEN** the user clicks a dormant favorite `f1` (`spaceId === null`) in window 100's favicon row
- **THEN** a new tab SHALL open at `f1`'s `originalURL` in window 100 and be bound in window 100
- **AND** the new tab SHALL be left ungrouped (group id `-1`), natively pinned (`pinned === true`), and SHALL NOT be added to any Space's Chrome group
- **AND** the window's active Space SHALL NOT change

#### Scenario: Activating a dormant pinned saved tab from another Space switches to it

- **GIVEN** window 100's active Space is "Work" and a dormant pinned saved tab `p1` belongs to Space "Home"
- **WHEN** the user activates `p1` in window 100 (e.g. from the launcher)
- **THEN** window 100's active Space SHALL become "Home" (store activation + group orchestration)
- **AND** the new tab SHALL open, bind in window 100, and join Home's now-shown Chrome group (visible, not hidden)

#### Scenario: Activating a dormant pin already in the active Space does not re-activate

- **GIVEN** window 100's active Space is "Work" and a dormant pinned saved tab `p2` belongs to "Work"
- **WHEN** the user activates `p2` in window 100
- **THEN** the window's active Space SHALL remain "Work" with no Space-switch orchestration
- **AND** the new tab SHALL open, bind, and join Work's group exactly as before this change

### Requirement: Pinned tabs and favicon row use the same binding model

All saved-tab behaviours SHALL apply identically to pinned tabs and favicon-row entries. They SHALL differ only by **coupling state and placement**: a pinned tab carries `spaceId = X` and is referenced by `pinnedBySpace[X]`; a favicon-row favorite carries `spaceId = null`, is referenced by the flat `faviconRow` placement, and has an **ungrouped, natively pinned** live tab. There SHALL NOT be separate binding logic per type — per-window binding, drift, restart recovery, and dormant/active activation SHALL be identical, and a record SHALL NOT be duplicated across placements.

Drift **affordances** SHALL be identical in behaviour across the two placements but rendered in the host primitive's shape: a pinned `TabRow` shows the home-host subtitle plus the favicon return affordance; a favorite `FaviconTile` — having no subtitle row — shows the corner drift dot plus the same favicon return affordance and "Return to &lt;host&gt;" tooltip. The underlying **Go home** / **Make this home** actions SHALL be the same for both.

#### Scenario: Favicon-row drift behaves like pinned drift

- **WHEN** a favicon-row saved tab's bound tab navigates such that `currentURL !== originalURL`
- **THEN** the favorite tile SHALL render a corner drift dot and the same favicon return affordance (favicon→`↩` on hover, "Return to &lt;host&gt;" tooltip, left-click → `goHome`) as a pinned row's favicon
- **AND** the Go home / Make this home actions SHALL behave identically to a pinned saved tab
- **AND** the favorite tile SHALL NOT render a home-host subtitle (no room on a square tile)

#### Scenario: A favorite binds per window like a pinned tab

- **WHEN** favorite `f1` is bound to tab 42 in window 100 and to tab 77 in window 200
- **THEN** `tabBindings['f1']` SHALL equal `{ 100: 42, 200: 77 }`
- **AND** focusing `f1` from window 200 SHALL activate tab 77, never tab 42


### Requirement: Unpinning keeps the tab as a temporary tab

Lunma SHALL provide an unpin action distinct from delete. Unpinning a saved tab SHALL remove its record from `savedTabs`, its entry from `tabBindings` (all window slots), and its id from `pinnedBySpace`, AND — for each window in which the saved tab was bound — SHALL return that window's bound tab id to that window instance's `tempTabIds`. No live tab SHALL be closed. When the removed record is a **global favorite** (`spaceId === null`, referenced by `faviconRow` — see D8: it is never routed through `removePinned`), each formerly-bound tab SHALL additionally be **natively unpinned** (`chrome.tabs.update(tabId, { pinned: false })`, best-effort) before it returns to Temporary, so an ex-favorite regains a normal full-size tab.

#### Scenario: Unpinning a bound saved tab returns its tab to Temporary

- **WHEN** the user unpins a saved tab bound to live tab id 42 in window 100
- **THEN** the `SavedTab` record SHALL be removed and absent from `pinnedBySpace`
- **AND** 42 SHALL appear in `spaceInstancesByWindow[100].tempTabIds`
- **AND** tab 42 SHALL remain open (no `chrome.tabs.remove`)

#### Scenario: Removing a favorite natively unpins its bound tabs

- **WHEN** the user removes favorite `f1` (`spaceId === null`) bound to tab 42 in window 100 and tab 77 in window 200
- **THEN** the `SavedTab` record SHALL be removed and absent from `faviconRow`
- **AND** tabs 42 and 77 SHALL each be natively unpinned (`pinned === false`) and appear in their own window instance's `tempTabIds`
- **AND** both tabs SHALL remain open


### Requirement: A favorite's bound tab is ungrouped (global)

Binding a `spaceId === null` favorite to a live tab SHALL leave that live tab **ungrouped** (Chrome group id `-1`), never adopted into any Space's Chrome tab group, and **natively pinned** (Chrome tab-strip pin, `pinned === true`) — rendering it as a small icon-only tab at the strip start, so favorites reclaim native tab-strip space. This SHALL be an enforced post-condition of binding, applied via a single coordinator path (`ensureFavoriteNativePinned(tabId)`, fronting the `chrome.tabs.ungroup` wrapper and the `setTabNativePinned` wrapper over `chrome.tabs.update(tabId, { pinned })`, in that order) invoked from **every** path that establishes a favorite's binding — opening a dormant favorite, favoriting a live tab, decoupling, and restart rebind. Ungrouping an already-ungrouped tab and pinning an already-pinned tab SHALL each be an idempotent no-op. Because a natively pinned tab can never be a member of a Chrome tab group and always sits at the strip start, a favorite's live tab SHALL stay visible across every Space switch. On service-worker boot, for each window-bound favorite live tab Chrome restored, Lunma SHALL — during the boot group-lifecycle reconciliation pass, before any Space switch can collapse it — ungroup that tab when it is still inside a Chrome group (`groupId >= 0`) and natively pin it when it is unpinned (which also converges favorites created before this behaviour existed, with no data migration). A user manually unpinning a favorite's tab mid-session SHALL NOT be fought live; the invariant is re-established at binding time and at boot.

#### Scenario: Opening a favorite leaves its tab ungrouped and natively pinned

- **WHEN** the user activates a dormant favorite `f1` (`spaceId === null`) in window 100
- **THEN** a new tab SHALL open at `originalURL`, be bound (`tabBindings['f1'][100]` set), left ungrouped (group id `-1`), and natively pinned (`pinned === true`)
- **AND** Lunma SHALL NOT call `addTabToSpaceGroup` for that tab

#### Scenario: Favorite stays visible across a Space switch

- **WHEN** favorite `f1`'s bound tab is ungrouped and natively pinned in window 100 and the user switches the active Space
- **THEN** collapsing the other Spaces' tracked groups SHALL NOT hide `f1`'s tab
- **AND** `f1`'s tab SHALL remain visible

#### Scenario: Restart reconciliation ungroups a favorite restored still-grouped

- **WHEN** SW boots and a favorite's restored bound tab is still inside its old Chrome group (`groupId >= 0`)
- **THEN** the boot reconciliation pass SHALL ungroup that tab
- **AND** a subsequent Space switch SHALL NOT collapse the favorite invisible

#### Scenario: Restart reconciliation natively pins a favorite restored unpinned

- **WHEN** SW boots and a favorite's restored bound tab is unpinned (`pinned === false`) — e.g. the favorite predates native pinning, or the user unpinned it last session
- **THEN** the boot reconciliation pass SHALL natively pin that tab
- **AND** a favorite whose restored bound tab is already pinned SHALL be left alone (no-op)

### Requirement: Favoriting an open tab is non-destructive

Lunma SHALL provide a `favoriteTab` action that mints a global favorite from a live Chrome tab. When invoked, Lunma SHALL mint a new `SavedTab` from the live tab (`title`, `originalURL`, and `currentURL` taken from the live tab) with `spaceId === null`, insert the new record id into `faviconRow`, bind the new record to that tab id in the tab's window (`tabBindings[<new-id>][windowId] = tabId`), remove the tab id from that window instance's `tempTabIds`, and ungroup + natively pin the live tab via `ensureFavoriteNativePinned`. The live tab SHALL stay open — favoriting reads as bookmarking, not moving. Favoriting a tab already bound to any saved tab SHALL be a no-op (idempotent).

#### Scenario: Favoriting an open temp tab mints an ungrouped, natively pinned favorite

- **WHEN** the user favorites live tab 42 (title "GitHub", url `https://github.com/`) in window 100, where 42 is a temporary tab in the active Space's group
- **THEN** a new `SavedTab` SHALL exist with `{ spaceId: null, title: 'GitHub', originalURL: 'https://github.com/', currentURL: 'https://github.com/' }`
- **AND** its id SHALL appear in `state.faviconRow` and in no `pinnedBySpace[spaceId]`
- **AND** `tabBindings[<new-id>][100]` SHALL equal 42, and 42 SHALL be removed from `spaceInstancesByWindow[100].tempTabIds`, ungrouped, and natively pinned
- **AND** tab 42 SHALL remain open

#### Scenario: Favoriting an already-bound tab is a no-op

- **WHEN** `favoriteTab` targets a tab id already present in any window slot of `tabBindings`
- **THEN** no new `SavedTab` SHALL be created and `faviconRow` SHALL be unchanged

### Requirement: Coupling and decoupling move a saved tab between pinned and favorite

Lunma SHALL provide `favoriteSavedTab` (decouple a pinned tab into a favorite) and `pinSavedTab` (couple a favorite to the active Space). Each SHALL **move** the record between placements — never copy it — so the no-duplicate-placement rule holds. The store SHALL perform the record move (Chrome-free); the coordinator SHALL perform the group/ungroup I/O for every bound window.

- **Decouple** (`favoriteSavedTab`, pinned → favorite): Lunma SHALL set the record's `spaceId = null`, move the record id from `pinnedBySpace[X]` to `faviconRow`, and call `ensureFavoriteNativePinned(tabId)` for each window in which the record is bound.
- **Couple** (`pinSavedTab`, favorite → active Space): Lunma SHALL set the record's `spaceId = activeSpace`, move the record id from `faviconRow` to `pinnedBySpace[activeSpace]`, and — for each window in which the record is bound — **natively unpin** the bound tab (`setTabNativePinned(tabId, false)`) **before** calling `addTabToSpaceGroup(windowId, activeSpace, tabId)`, since Chrome refuses to group a natively pinned tab.

#### Scenario: Decoupling a pinned tab makes it a global favorite

- **WHEN** the user decouples pinned saved tab `t1` (`spaceId === 'work'`) bound to tab 42 in window 100
- **THEN** `state.savedTabs['t1'].spaceId` SHALL be `null`
- **AND** `'t1'` SHALL be removed from `pinnedBySpace['work']` and present in `faviconRow`
- **AND** tab 42 SHALL be ungrouped and natively pinned, and the record SHALL exist in exactly one placement

#### Scenario: Coupling a favorite pins it to the active Space

- **WHEN** the user couples favorite `f1` (`spaceId === null`) bound to tab 42 in window 100 while "work" is the active Space
- **THEN** `state.savedTabs['f1'].spaceId` SHALL be `'work'`
- **AND** `'f1'` SHALL be removed from `faviconRow` and appended to `pinnedBySpace['work']`
- **AND** tab 42 SHALL be natively unpinned before it is added to window 100's "work" Chrome group, and the record SHALL exist in exactly one placement

