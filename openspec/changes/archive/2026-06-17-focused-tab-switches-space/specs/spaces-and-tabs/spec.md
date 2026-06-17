# spaces-and-tabs Specification — delta for focused-tab-switches-space

## MODIFIED Requirements

### Requirement: Per-window active Space tracking

Each Chrome window SHALL have exactly one active Space or `null`. State key: `activeSpaceByWindow: { [windowId]: spaceId | null }`. Activating a Space in a window SHALL update `activeSpaceByWindow[windowId]` and ensure a matching instance exists under `spaceInstancesByWindow[windowId][spaceId]`. Switching the active Space SHALL expand the incoming Space's Chrome group and collapse the outgoing Space's Chrome group (when each exists), driven by the coordinator (see Requirement: Space tab-group orchestration (backend contract)).

When a tab is **activated** in a window (`tabs.onActivated`, from any source — the launcher's open-tab result, a sidebar temporary-tab click, a Chrome tab-strip click, keyboard, or a programmatic activation) and that tab has an **owning Space** in the window that is **not** the window's active Space, Lunma SHALL activate that owning Space in the window — the same store-activation + group-orchestration sequence a manual switch runs — so the focused tab's Space is the one shown. A tab's owning Space in a window is the Space whose instance lists the tab in `spaceInstancesByWindow[windowId][spaceId].tempTabIds`, or, for a **coupled pinned tab** bound to it in that window, the bound `savedTabs[savedTabId].spaceId` (when non-null). A tab with **no** owning Space — a global favorite (`savedTabs[id].spaceId === null`), or any ungrouped/untracked tab — SHALL NOT switch the window's Space, and an activation of a tab already in the window's active Space SHALL NOT re-switch. The switch is scoped to the activated tab's window; no other window's active Space SHALL change.

#### Scenario: Activating a Space in a window

- **WHEN** the user activates Space "Side" in window 100
- **THEN** `activeSpaceByWindow[100] === "side"`
- **AND** `spaceInstancesByWindow[100]["side"]` SHALL exist

#### Scenario: Switching the active Space in a window

- **WHEN** window 100 has Space "Work" active (with a live group) and the user switches to "Side"
- **THEN** the Chrome group for "Work" in window 100 SHALL be collapsed
- **AND** the Chrome group for "Side" in window 100 SHALL be expanded (created first if "Side" has tabs but no group yet)
- **AND** `activeSpaceByWindow[100] === "side"`
- **AND** `spaceInstancesByWindow[100]["work"]` SHALL be retained (not discarded)

#### Scenario: Activating a tab that lives in another Space switches the window to it

- **GIVEN** window 100's active Space is "Work" and tab 30 is a temporary tab in window 100's "Home" instance (`spaceInstancesByWindow[100]["home"].tempTabIds` includes 30)
- **WHEN** tab 30 is activated in window 100 (e.g. selected as an open-tab result in the launcher, or clicked in the Chrome tab strip)
- **THEN** `activeSpaceByWindow[100]` SHALL become "home" (store activation + group orchestration: "Home" expanded, "Work" collapsed)
- **AND** the switch SHALL be scoped to window 100

#### Scenario: Activating a tab already in the active Space does not re-switch

- **GIVEN** window 100's active Space is "Work" and tab 17 is a temporary tab in window 100's "Work" instance
- **WHEN** tab 17 is activated in window 100
- **THEN** `activeSpaceByWindow[100]` SHALL remain "Work" with no Space-switch orchestration

#### Scenario: Activating a global favorite or an ungrouped tab does not switch

- **GIVEN** window 100's active Space is "Work" and tab 42 is a bound global favorite (`savedTabs[fav].spaceId === null`, ungrouped) — or any ungrouped/untracked tab
- **WHEN** tab 42 is activated in window 100
- **THEN** `activeSpaceByWindow[100]` SHALL remain "Work" (a tab with no owning Space never switches the window's Space)

#### Scenario: A single activation produces a single switch (no loop)

- **GIVEN** window 100's active Space is "Work" and tab 30 belongs to "Home"
- **WHEN** tab 30 is activated and the resulting Space switch activates a focus tab inside "Home"'s now-shown group
- **THEN** the re-fired activation (a tab already in the now-active "Home") SHALL NOT switch again — exactly one switch results from the one user activation
