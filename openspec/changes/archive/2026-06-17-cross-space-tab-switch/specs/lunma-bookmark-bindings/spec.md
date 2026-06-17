# lunma-bookmark-bindings Specification — delta for cross-space-tab-switch

## MODIFIED Requirements

### Requirement: Clicking a dormant bookmark opens a new tab and binds it

When the user activates a saved tab that is dormant **in the focused window** (no slot for that window in `tabBindings[savedTabId]`), Lunma SHALL open a new Chrome tab at `originalURL` in that window, SHALL set `tabBindings[savedTabId][windowId]` to the new tab's id, and SHALL set the record's `currentURL = originalURL`. If the record is coupled (`spaceId !== null`) the new tab SHALL be added to that window's Chrome group for the record's Space; if the record is a favorite (`spaceId === null`) the new tab SHALL be left **ungrouped** (global) via `ensureFavoriteUngrouped` and SHALL NOT be added to any Space's Chrome group. No other window's binding SHALL be created or modified.

When the record is coupled (`spaceId !== null`) **and** its Space is **not** the focused window's active Space (`activeSpaceByWindow[windowId]`), Lunma SHALL **activate that Space in the window** as part of the activation — the same activation sequence the `activateSpace` command runs (store activation **and** Chrome group orchestration: show the record's group, hide the outgoing one) — **before** adding the new tab to its group, so the just-opened tab is visible in its now-active group rather than hidden in a background group. A same-Space activation SHALL NOT switch (no orchestration), and a favorite (`spaceId === null`) SHALL NEVER switch the window's Space.

#### Scenario: Activating a dormant pinned saved tab

- **WHEN** the user clicks the pinned saved tab for GitHub in window 100's sidebar and it is dormant in window 100
- **THEN** a new tab SHALL open at `https://github.com/` in window 100
- **AND** `tabBindings[<gh-id>][100]` SHALL equal the new tab's id
- **AND** the record's `currentURL` SHALL equal `originalURL`
- **AND** the new tab SHALL be added to window 100's Chrome group for the record's Space

#### Scenario: Activating a dormant favorite opens it ungrouped

- **WHEN** the user clicks a dormant favorite `f1` (`spaceId === null`) in window 100's favicon row
- **THEN** a new tab SHALL open at `f1`'s `originalURL` in window 100 and be bound in window 100
- **AND** the new tab SHALL be left ungrouped (group id `-1`) and SHALL NOT be added to any Space's Chrome group
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

### Requirement: Clicking an active bookmark focuses its bound tab

When the user activates a saved tab already bound **in the focused window** (`tabBindings[savedTabId][windowId]` resolves to a live tab), Lunma SHALL focus that window's bound tab via `chrome.tabs.update(tabId, { active: true })` and its window via `chrome.windows.update(windowId, { focused: true })`. No new tab SHALL be opened, and no other window's binding SHALL be touched.

When the bound saved tab is coupled (`spaceId !== null`) **and** its Space is **not** the focused window's active Space, Lunma SHALL **activate that Space in the window** (the same store-activation + group-orchestration sequence) **before** focusing the tab, so the tab is focused into its now-shown group. A same-Space focus SHALL NOT switch, and a favorite (`spaceId === null`) SHALL NEVER switch the window's Space.

#### Scenario: Re-activating a saved tab bound in the focused window

- **WHEN** the user clicks a saved tab in window 100 whose `tabBindings[id][100]` is a valid live tab id
- **THEN** that tab SHALL be activated and window 100 focused
- **AND** no new tab SHALL be created

#### Scenario: Focusing a bound saved tab that lives in another Space switches to it

- **GIVEN** window 100's active Space is "Work" and a bound saved tab `p3` belongs to "Home"
- **WHEN** the user activates `p3` in window 100 (its bound tab is live)
- **THEN** window 100's active Space SHALL become "Home" before the tab is focused
- **AND** `p3`'s bound tab SHALL be activated and window 100 focused, with no new tab created
