## Purpose

Closing a tab optionally closes the tabs that were opened from it, so a browsing
detour can be dismissed in one gesture instead of one per tab. Defines what counts
as a descendant, which closes trigger a cascade, how the closed batch is recovered,
and the guards that keep an ordinary browser shutdown from destroying a session.

## ADDED Requirements

### Requirement: A cascade closes the closing tab's provenance descendants

When the `closeChildTabsWithParent` setting is on and a tracked temporary tab
closes, Lunma SHALL also close that tab's provenance descendants — the transitive
set of tabs reachable by following resolved parent links back to the closing tab.

The closing tab SHALL itself be a temporary tab of the Space it resolves to.
Resolving a Space is not sufficient: a pinned tab also resolves to one, and closing
a pinned tab SHALL NOT cascade — pinned tabs are outside this capability in both
directions.

Descendant resolution SHALL use the same lineage the Temporary list renders, so
the set that closes is exactly the indented subtree the user can see under the tab
being closed. Lunma SHALL NOT close a tab that is not in that subtree, and SHALL
NOT infer a relationship the lineage does not record.

A tab excluded from the cascade SHALL also exclude everything below it: exclusion
prunes the subtree rather than filtering the result. Because a parent resolves to
the nearest LIVE ancestor, a tab whose lineage to the closing tab runs through an
excluded tab is not confidently part of that subtree, and Lunma SHALL leave it open.

The batch SHALL be resolved before any state for the closing tab is mutated. Once
the closing tab has been detached from its Space, its subtree is no longer
computable, so a cascade resolved after that point would silently never fire.

Resolution SHALL terminate on a cycle: a tab already collected SHALL NOT be
collected again.

#### Scenario: A parent takes its children with it

- **GIVEN** the setting is on, and temporary tabs B and C were both opened from A
- **WHEN** A is closed
- **THEN** B and C SHALL also be closed

#### Scenario: A whole chain closes, not just one level

- **GIVEN** the setting is on, and the lineage is A ← B ← C
- **WHEN** A is closed
- **THEN** both B and C SHALL also be closed

#### Scenario: An unrelated tab is untouched

- **GIVEN** the setting is on, and tab D has no lineage to A
- **WHEN** A is closed
- **THEN** D SHALL remain open

#### Scenario: Closing a pinned tab does not cascade

- **GIVEN** the setting is on, and a pinned tab has temporary tabs opened from it
- **WHEN** the pinned tab is closed
- **THEN** no cascade SHALL run and those temporary tabs SHALL remain open

#### Scenario: A cascade whose toast cannot be shown is still recoverable

- **GIVEN** the setting is on and no sidebar is listening
- **WHEN** a cascade closes B and C
- **THEN** the cascade SHALL complete, B and C SHALL be in the archived tabs, and no error SHALL be reported

#### Scenario: Closing a child does not close its parent

- **GIVEN** the setting is on, and B was opened from A
- **WHEN** B is closed
- **THEN** A SHALL remain open

#### Scenario: A cycle in the lineage terminates

- **GIVEN** the setting is on, and the resolved parents form a cycle
- **WHEN** a tab in that cycle is closed
- **THEN** collection SHALL terminate and each affected tab SHALL be closed at most once

### Requirement: The cascade is scoped to temporary tabs in the same Space

A cascade SHALL close only descendants that are temporary tabs of the **same Space**
as the closing tab. A descendant that is pinned, or that belongs to another Space,
SHALL survive and SHALL re-resolve its parent exactly as it does when the setting is
off.

Closing tabs in a Space the user is not looking at is expressly forbidden: the
subtree's legibility is what justifies the destructive action, and a subtree the
user cannot see is not legible.

#### Scenario: A pinned descendant survives

- **GIVEN** the setting is on, and a descendant of A is pinned
- **WHEN** A is closed
- **THEN** the pinned descendant SHALL remain open

#### Scenario: A subtree below an excluded tab also survives

- **GIVEN** the setting is on, and the lineage is A ← P ← D where P is pinned and D is a temporary tab
- **WHEN** A is closed
- **THEN** both P and D SHALL remain open

#### Scenario: A descendant in another Space survives

- **GIVEN** the setting is on, and a descendant of A is a temporary tab of a different Space
- **WHEN** A is closed
- **THEN** that descendant SHALL remain open and SHALL resolve its parent to the nearest surviving ancestor

### Requirement: A cascaded batch is announced and recoverable by one undo

Every tab a cascade closes SHALL be archived before it is removed, under a single
shared batch stamp, so the whole cascade is restored by one undo. Lunma SHALL reuse
the existing cleared-batch restore path rather than introducing a second undo
mechanism.

The service worker SHALL announce the closed batch to the sidebar, carrying the
window and the closed tab ids, and the sidebar SHALL offer undo for it through the
same toast slot its own bulk-clear actions use. The announcement is required, not
incidental: the existing undo affordance is raised only by sidebar actions that
already know which tabs they closed, and a cascade originates in the service worker,
so without it a cascade would be silently unrecoverable.

The announcement is best-effort and MUST NOT gate the cascade: it is a
`chrome.runtime` broadcast that rejects when no surface is listening, and whether a
sidebar is open is not knowable in advance. Recoverability therefore rests on the
ARCHIVE, which is written before removal and is not best-effort: a cascade whose
toast never appears — the tab strip with the sidebar closed, the case this
capability exists to cover — SHALL still be recoverable from the archived-tabs
view. A failed announcement SHALL NOT fail the cascade, and SHALL NOT be reported
as an error.

The tab the user closed directly SHALL NOT be archived by the cascade — the user
closed it deliberately, and Chrome's own reopen-closed-tab already covers it.

A cascade SHALL NOT leave its window with no tabs: if closing the batch would empty
the window, Lunma SHALL open a replacement tab, matching the existing clear-batch
behaviour.

#### Scenario: The cascade offers undo without being asked

- **GIVEN** the setting is on and closing A cascaded to B and C
- **WHEN** the cascade completes
- **THEN** the sidebar SHALL show an undo affordance naming the number of tabs closed

#### Scenario: Undo restores the whole cascaded batch

- **GIVEN** the setting is on and closing A cascaded to B and C
- **WHEN** the user takes that undo
- **THEN** B and C SHALL both be reopened

#### Scenario: A cascade toast replaces rather than stacks

- **GIVEN** a bulk-clear toast is already showing
- **WHEN** a cascade completes
- **THEN** the cascade's undo SHALL occupy the same single toast slot, and two toasts SHALL NOT be shown at once

#### Scenario: The window is never left empty

- **GIVEN** the setting is on and the cascade would close every remaining tab in the window
- **WHEN** the cascade runs
- **THEN** a replacement tab SHALL be opened so the window survives

### Requirement: A cascade never runs during shutdown or re-entrantly

Lunma SHALL NOT cascade when the tab's removal is part of a window or browser
closing. A shutdown removes every tab, and cascading through it would archive the
user's whole session as though they had discarded it.

A cascade SHALL NOT re-enter itself: the removals reported for the tabs a cascade is
already closing SHALL NOT start further cascades. The batch is computed once, from
the tab the user closed.

#### Scenario: Closing a window does not cascade

- **GIVEN** the setting is on
- **WHEN** a window closes and its tabs are removed
- **THEN** no cascade SHALL run and nothing SHALL be archived by a cascade

#### Scenario: The batch is archived once, not once per level

- **GIVEN** the setting is on and the lineage is A ← B ← C
- **WHEN** A is closed
- **THEN** B and C SHALL be archived under ONE batch stamp, and no descendant SHALL be archived more than once

### Requirement: The cascade is off unless the user turned it on

The cascade SHALL run only when `closeChildTabsWithParent` is on. It SHALL
additionally require tab provenance to be effectively on, because with no lineage
recorded there is no subtree to close.

With either off, closing a tab SHALL behave exactly as it does without this
capability: the closing tab's children survive and re-resolve to the nearest live
ancestor.

The default SHALL be off. The lineage signal is deliberately incomplete — it
records a parent only for a continuing transition from a tab whose identity is
known, and treats everything else as a root — so the number of tabs a single close
destroys is not predictable from the tab strip. A destructive action driven by a
signal designed to under-report SHALL be opt-in.

#### Scenario: With the setting off, children survive

- **GIVEN** `closeChildTabsWithParent` is off and B was opened from A
- **WHEN** A is closed
- **THEN** B SHALL remain open, re-parented to the nearest live ancestor

#### Scenario: With provenance off, the setting is inert

- **GIVEN** `closeChildTabsWithParent` is on but tab provenance is effectively off
- **WHEN** any tab is closed
- **THEN** no cascade SHALL run

#### Scenario: A fresh profile does not cascade

- **GIVEN** a profile that has never changed this setting
- **WHEN** a tab with children is closed
- **THEN** no cascade SHALL run
