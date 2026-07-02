# spaces-and-tabs — delta for preserve-user-tab-groups

## ADDED Requirements

### Requirement: Mid-session tab-to-group moves reconcile ownership

When a tab's Chrome group membership changes mid-session (`tabs.onUpdated` with a `changeInfo.groupId`), Lunma SHALL reconcile the tab's ownership to follow its live group, via the synchronous chrome-free store mutator `store.onTabGroupIdChanged(tabId, groupId)` called from the `tabs.onUpdated` handler:

- **Moved into a tracked group** (the new `groupId` ≥ 0 is recorded by Space X's instance in the tab's window): the tab SHALL be assigned to Space X (`assignSpaceTabs`-semantics — moved out of any other instance's `tempTabIds` in the window; bound tabs are skipped). An assignment to a Space that already solely owns the tab SHALL be a no-op (no reorder, no churn).
- **Moved into an untracked group** (the new `groupId` ≥ 0 is recorded by no instance in the tab's window): the tab SHALL be **released** — removed from every instance's `tempTabIds` (and `tempTabTitles`) in its window. The tab is the user's; the Temporary list stops listing it. Its bound (saved-tab) record, if any, SHALL NOT be modified.
- **Ungrouped** (the new `groupId` is `-1`): no ownership change. Lunma itself ungroups tabs in normal flows (favorite ungroup, Space deletion, group rebuilds); an ungrouped tab's ownership is handled by the existing paths.

The mutator SHALL resolve the tab's window from `state.liveTabsById[tabId]?.windowId`; when the tab is not (yet) mirrored there, the mutator SHALL be a no-op (there is no window-scoped instance set to reconcile). The mutator SHALL be state-only (no Chrome calls) and idempotent for a repeated event with the same `groupId`.

#### Scenario: A temp tab moved into a user's own group is un-tracked

- **GIVEN** tab 30 is a temporary tab of window 100's Space "work", and the user moves it into their own native group `55` (recorded by no instance in window 100)
- **WHEN** `tabs.onUpdated` fires with `changeInfo.groupId: 55` and the handler calls `store.onTabGroupIdChanged(30, 55)`
- **THEN** tab 30 SHALL be removed from `spaceInstancesByWindow[100]["work"].tempTabIds` (and its `tempTabTitles` entry dropped)
- **AND** no Space SHALL be created, renamed, or deleted

#### Scenario: A tab moved into a tracked group is reassigned to that Space

- **GIVEN** window 100's Space "side" has live group `22`, and tab 30 is a temporary tab of Space "work" in window 100
- **WHEN** `tabs.onUpdated` fires with `changeInfo.groupId: 22`
- **THEN** tab 30 SHALL move to `spaceInstancesByWindow[100]["side"].tempTabIds` and SHALL be removed from "work"'s

#### Scenario: A groupId change to -1 does not release the tab

- **GIVEN** tab 30 is a temporary tab of window 100's Space "work" and Lunma ungroups it during one of its own flows
- **WHEN** `tabs.onUpdated` fires with `changeInfo.groupId: -1`
- **THEN** tab 30 SHALL remain in `spaceInstancesByWindow[100]["work"].tempTabIds`

#### Scenario: A Lunma-initiated regroup is a no-op for an existing member

- **GIVEN** Lunma rebuilt Space "work"'s group as `77` in window 100 and recorded it (`recordSpaceGroup`) before the queued tab events drain, and tab 30 is already solely owned by "work"
- **WHEN** the echoed `tabs.onUpdated` fires with `changeInfo.groupId: 77`
- **THEN** `store.onTabGroupIdChanged(30, 77)` SHALL leave "work"'s `tempTabIds` unchanged (same membership, same order)

## MODIFIED Requirements

### Requirement: Boot adoption of already-open tabs into the temporary list

At service-worker boot, after windows are seeded and before listener registration, Lunma SHALL adopt the tabs already open in each window into that window's active Space as temporary tabs, so the Temporary list reflects what the user already has open rather than staying empty until the next Space switch. For each window with an active Space, Lunma SHALL ensure a `spaceInstance` exists (via `store.ensureSpaceInstance(windowId)`, which creates an empty instance without altering `lastActivatedSpaceId` or `activeSpaceByWindow`) and SHALL run each open tab through `store.onTabCreated`, which skips tabs already bound to a saved tab (rebound earlier in boot) and tabs already tracked. A tab whose live Chrome `groupId` is ≥ 0 but maps to no Space instance in its window (a live **untracked** — user-created — group) SHALL NOT be adopted: it is skipped like a home tab and stays untracked, so seeding never confiscates a tab out of the user's own group (`ensureSpaceInstance` still runs for its window). The pass SHALL be idempotent across boots and SHALL reuse the same `chrome.tabs.query({})` result used to rebuild `liveTabsById`.

#### Scenario: Existing tabs are adopted as temp tabs at boot

- **GIVEN** window 100's active Space is `work` with no `spaceInstance` yet, and `chrome.tabs.query({})` returns tabs 17 and 22 in window 100
- **WHEN** boot seeding runs
- **THEN** `state.spaceInstancesByWindow[100]` SHALL exist with `tempTabIds` containing 17 and 22

#### Scenario: A bound tab is not adopted as temporary

- **GIVEN** tab 17 in window 100 is bound to a saved tab and tab 22 is not
- **WHEN** boot seeding runs
- **THEN** `state.spaceInstancesByWindow[100].tempTabIds` SHALL contain 22 and SHALL NOT contain 17

#### Scenario: A tab in a live untracked group is not adopted

- **GIVEN** window 100's active Space is `work`, and open tab 42's live `groupId` is `55`, which no instance in window 100 records
- **WHEN** boot seeding runs
- **THEN** tab 42 SHALL NOT be added to any instance's `tempTabIds` (it stays untracked)
- **AND** window 100 SHALL still get a `spaceInstance` for `work`

#### Scenario: ensureSpaceInstance is a no-op without an active Space

- **WHEN** `store.ensureSpaceInstance(windowId)` runs for a window whose `activeSpaceByWindow` entry is null or undefined
- **THEN** no `spaceInstance` SHALL be created for that window

### Requirement: Boot tab ownership reconciliation

On service-worker boot, Lunma SHALL assign each open tab to the correct Space instance by its **live Chrome group membership** and SHALL heal any pre-existing cross-instance overlap, so the per-window ownership-uniqueness invariant (see "Temporary tabs are per-window") holds after boot even when the persisted state violated it.

**Group-aware seeding.** When adopting the tabs already open at boot (`seedExistingTabs` over `chrome.tabs.query`), each open, unbound, non-home tab SHALL be seeded into the Space instance whose recorded `groupId` equals the tab's live Chrome `groupId`. A tab that is **ungrouped** SHALL fall back to the window's active Space instance (the prior behavior). A tab whose live Chrome group maps to **no** Space instance in its window SHALL NOT be seeded at all — it is user-owned and stays untracked (see Requirement: Boot adoption of already-open tabs into the temporary list). Seeding SHALL go through the per-window ownership guard, so a tab is seeded into at most one instance.

**Overlap heal.** After seeding and before the boot broadcast, Lunma SHALL reconcile `tempTabIds` across the instances of each window: any tab id present in more than one instance SHALL be kept in its single correct owner — the instance whose `groupId` matches the tab's live Chrome group, else the active instance, else (when neither of those holds it) the first instance found to hold it, so the tab is never orphaned — and removed from the rest. The reconciliation SHALL be idempotent (a second run finds no duplicates) and SHALL mutate state only (the existing boot broadcast carries the healed state).

#### Scenario: A grouped tab is seeded into its own Space, not the active one

- **GIVEN** at boot window 100's active Space is "work" (`groupId: 11`) and Space "side" has `groupId: 22`, and open tab 42 is in Chrome group 22
- **WHEN** `seedExistingTabs` runs
- **THEN** tab 42 SHALL be seeded into `spaceInstancesByWindow[100]["side"].tempTabIds`
- **AND** tab 42 SHALL NOT be added to the active "work" instance

#### Scenario: A tab in an unmapped live group is left untracked at seeding

- **GIVEN** at boot window 100's active Space is "work" and open tab 43's live Chrome group is `55`, which no instance in window 100 records
- **WHEN** `seedExistingTabs` runs
- **THEN** tab 43 SHALL NOT be seeded into any instance (it SHALL NOT fall back to the active "work" instance)

#### Scenario: Boot heals a tab listed in multiple instances

- **GIVEN** persisted state has tab 42 in `tempTabIds` of both "work" and "side" in window 100, and tab 42's live Chrome group resolves to "side"'s `groupId`
- **WHEN** boot tab-ownership reconciliation runs
- **THEN** tab 42 SHALL remain in `spaceInstancesByWindow[100]["side"].tempTabIds`
- **AND** tab 42 SHALL be removed from `spaceInstancesByWindow[100]["work"].tempTabIds`
- **AND** a second reconciliation pass SHALL make no further change

#### Scenario: Boot heals a tab owned by neither its grouped nor the active Space by keeping the first holder

- **GIVEN** persisted state has tab 50 in `tempTabIds` of both "side" and "reading" in window 100, window 100's active Space is "work" (neither "side" nor "reading"), and tab 50's live Chrome group resolves to no instance in window 100
- **WHEN** boot tab-ownership reconciliation runs
- **THEN** tab 50 SHALL be kept in whichever of "side"/"reading" holds it first (iteration order) and removed from the other, rather than being dropped from both

### Requirement: Boot reconciliation of tab groups

On service-worker boot, after `seedExistingTabs` / `rebuildLiveTabs`, the coordinator boot path SHALL run a one-shot tab-group reconciliation (`reconcileTabGroupsOnBoot`) that **adopts** existing Chrome tab groups into Spaces, **releases** any temp tab held by a live untracked group, **materializes** any missing active-Space group, **ungroups** any global favorite Chrome restored still inside a group, and finally **cleans up** any empty Space left duplicate-named after the above steps. The pass SHALL run before the boot persist + broadcast so the broadcast carries the reconciled `groupId`s and the deduplicated `state.spaces`. Lunma SHALL keep being the source of truth — the pass NEVER deletes a non-empty Space, NEVER converts an untracked (user-created) group into a Space, NEVER moves a tab out of a live untracked group (the user's group keeps its tab membership, not just its identity), and (during materialization) NEVER opens a tab or changes tab focus. Step order SHALL be: convert (fresh install only) → adopt → release → materialize → ungroup-favorites → duplicate cleanup.

**Fresh-install exemption for the release and untracked-group sweep exclusion.** On a boot that runs fresh-install conversion (see Requirement: Fresh-install conversion of Chrome groups into Spaces — `freshInstall` true AND at least one Chrome group exists), the release step and the untracked-group sweep exclusion (below) SHALL both be skipped entirely for that pass. Conversion claims EVERY existing Chrome group that boot (folding it into a Space or minting its own), so no group is "untracked" in the sense those steps mean; skipping preserves conversion's pre-existing group-folding behaviour, under which two same-title groups folded into one Space (see Requirement: Fresh-install conversion of Chrome groups into Spaces) are merged into a single live Chrome group by materialization exactly as before this capability's untracked-group protections existed. Outside a fresh-install-conversion boot (i.e. on every other boot — every restart or idle-unload wake after the first), both steps run as specified below.

#### Scenario: The release step and sweep exclusion are skipped on a fresh-install conversion boot

- **GIVEN** a fresh install where window 100 has two Chrome groups titled "Work" with different colours (see Requirement: Fresh-install conversion of Chrome groups into Spaces, "Same-name groups of different colours fold into one Space") — conversion folds both into one "Work" Space, assigning both groups' member tabs into that Space's `tempTabIds`, but adoption's claim-guard binds only the FIRST group's id as the instance's recorded `groupId`
- **WHEN** the boot reconciliation runs
- **THEN** the release step SHALL NOT run for this pass (neither group's tabs are stripped from `tempTabIds`)
- **AND** materialization SHALL treat the second (unbound) group's tabs as ordinary stray members and merge them into the first group, exactly as it would with the untracked-group exclusion absent
- **AND** the window SHALL end the pass with exactly ONE live Chrome group for "Work", holding every tab from both original groups

**Adoption.** For each existing Chrome tab group in a window, the pass SHALL try to match it to one of that window's persisted Space instances via the pure `matchGroupToSpace(group, candidates)` function and, on a match, re-bind that instance's `groupId` to the live group id (`recordSpaceGroup`). Matching SHALL score **tab-membership overlap** between the group's current member tab ids and the instance's persisted `tempTabIds` first, and SHALL fall back to **persisted title + colour** (`group.title === space.name` and `group.color === toGroupColor(space.color)`) only to break a zero/tied overlap. Because Space names are unique (see Requirement: Space names are unique), the title fallback resolves to at most one Space. Ties after both signals SHALL break deterministically by `spaces[]` order. A group matching no Space (the user's own group) SHALL be left untouched — never adopted, never retitled. Adoption SHALL perform no `chrome.tabGroups` mutation (state writes only). A **global favorite** (`spaceId === null`) is never a Space instance, so it can never match a group here — its membership is reconciled by the favorite-ungroup step below, not by adoption.

**Claim-guard (single binding per pass).** Within one adoption pass each Space SHALL be claimed by at most **one** group per window: once a Space has been adopted, it SHALL be removed from the candidate set for the window's remaining groups, so no two groups bind to one Space. Complementarily, `store.recordSpaceGroup(windowId, spaceId, groupId)` SHALL clear the `groupId` of any *other* instance in the same window that currently holds the incoming `groupId` (evicting a prior holder), so a single live `groupId` is never shared by two instances.

**Untracked-group tab release.** After adoption (so every Lunma group's restored id is re-bound and "untracked" is decided against live ids) and before materialization, the pass SHALL call the synchronous chrome-free store mutator `store.releaseTabsInUntrackedGroups(tabGroupById)`: for each window, every tab listed in any instance's `tempTabIds` whose live Chrome group (per `tabGroupById`, the boot tab→group map) is ≥ 0 and recorded by **no** instance in that window SHALL be removed from that instance's `tempTabIds` (and `tempTabTitles`). A tab living in the user's own group is the user's, not a Space's temporary tab — this keeps the sidebar honest and keeps stale `tempTabIds` overlap from mis-adopting the user's group on a later restart. Bound (saved) tab records SHALL NOT be modified. The step SHALL be state-only and idempotent.

**Materialization.** After the release step, for each window whose active Space has tabs open in the window but still has `groupId === -1`, the pass SHALL group that Space's window tab set into a new Chrome group, title + recolour it with the Space identity, and `recordSpaceGroup` the new id. When the active Space already has a live group, any member tab not already in it SHALL be swept into it — but **only** members that are ungrouped, in the Space's own dead/stale group, or in another **tracked** group: a member whose current live group (per `tabGroupById`) is an untracked group (not in `trackedGroupIdsForWindow` for the window) SHALL be excluded from the sweep and from a fresh group's initial membership, and left where the user put it. This exclusion applies uniformly to the whole member set — the Space's temp + bound tabs AND every home tab in the window (a home tab held by a user's untracked group SHALL NOT be swept out of it). The pass SHALL then collapse the window's other tracked groups (active group expanded) on a **best-effort** basis — a collapse that Chrome refuses (e.g. the restored active tab is inside another group) SHALL be skipped, not retried, and SHALL NOT abort the pass. A Space with no open tabs in the window SHALL be left groupless (a group cannot be empty).

**Favorite ungroup reconciliation.** After adoption and materialization, the pass SHALL iterate the global favorites — each saved-tab id in `faviconRow` (`savedTabs[id].spaceId === null`) — and, for each window where Chrome restored the favorite's per-window bound tab, look up that tab's group in the boot tab→group map (`tabGroupById`, the same map adoption read from the boot tabs query). When the favorite's bound tab is still grouped (`tabGroupById.get(tabId) >= 0`), the pass SHALL `chrome.tabs.ungroup(tabId)` it, so a favorite that Chrome restored inside its old group is made global again before the next Space switch could collapse it invisible. This is best-effort — a refusal SHALL be swallowed like the other boot group ops and SHALL NOT abort the pass — and bounded by favorite × window count. A favorite whose bound tab Chrome restored already ungrouped (`tabGroupById.get(tabId)` is `-1` or absent) is a no-op.

**Duplicate-Space cleanup.** After favorite-ungroup reconciliation, the pass SHALL group `store.state.spaces` into normalized-name collision groups via `groupDuplicateSpaceNames` and, for each group, partition members via `isSpaceEmpty` exactly as the load-path self-heal does (see Requirement: Space names are unique, item 4). For every member the resulting resolution marks as a drop (the "exactly one non-empty" and "all empty" cases), the pass SHALL call `store.removeEmptySpace(spaceId)`. A group resolved as "two or more non-empty members" SHALL be left untouched by this step — the boot pass never renames a Space (only the load-path self-heal does; renaming mid-boot could retitle a Space out from under an already-rendered sidebar with no user action). This step SHALL run unconditionally, not only on `freshInstall`, so a duplicate exposed only after the boot's single `chrome.tabGroups.query({})` call (e.g. a window still restoring at query time, whose stale group the fresh-install fold could not see) is still cleaned up before the broadcast, rather than persisting until a future full reload happens to re-run fresh-install conversion (which it normally never will again, since `state.spaces` is no longer empty).

#### Scenario: A restored group is adopted, not rebuilt

- **GIVEN** after a browser restart window 100's Space "work" persisted `groupId: 12` (now stale) and its instance `tempTabIds` include tabs 17 and 22
- **AND** Chrome has restored a group `77` in window 100 containing tabs 17 and 22
- **WHEN** the boot reconciliation runs
- **THEN** `matchGroupToSpace` SHALL match group `77` to "work" on tab overlap
- **AND** `spaceInstancesByWindow[100]["work"].groupId` SHALL be re-bound to `77` (no new group created)

#### Scenario: The active Space's group is materialized at boot

- **WHEN** window 100's active Space "work" has tabs 17 and 18 open in the window but no live group (`groupId === -1`) and no existing Chrome group matched it
- **THEN** the boot pass SHALL group 17 and 18 into a new Chrome group titled with "work"'s name + colour
- **AND** `spaceInstancesByWindow[100]["work"].groupId` SHALL be the new group's id

#### Scenario: An untracked user group is never adopted and never drained

- **GIVEN** window 100 contains a Chrome group whose members overlap no Space instance's `tempTabIds` and whose title/colour match no Space
- **WHEN** the boot reconciliation runs
- **THEN** that group SHALL NOT be adopted, retitled, or recolored
- **AND** no Space SHALL be created from it
- **AND** none of its member tabs SHALL be moved into any Space's group (the group survives the pass with its tab membership intact)

#### Scenario: A user's native group built from formerly-tracked tabs survives a restart

- **GIVEN** window 100's active Space "Default" tracked temp tabs 30 and 31, the user grouped them into their own native group (any title/colour — including "Default" in the Space group's own colour), the mid-session `tabs.onUpdated` reconciliation (see Requirement: Mid-session tab-to-group moves reconcile ownership) already released both tabs from "Default"'s `tempTabIds` before the browser is restarted with session restore
- **WHEN** the boot reconciliation runs
- **THEN** the user's restored group SHALL still exist after the pass, holding tabs 30 and 31
- **AND** tabs 30 and 31 SHALL NOT be listed in any instance's `tempTabIds`
- **AND** the window SHALL end the pass with BOTH groups — the Space's and the user's

<!-- Residual risk (see design.md D2b): if the mid-session release event is lost immediately before a full restart (a narrow race — the SW is killed before its queue drains, not a mid-session idle-unload wake), tabs 30/31 may still be listed in "Default"'s persisted `tempTabIds` at boot, and `matchGroupToSpace`'s overlap scoring could adopt the user's restored group into "Default" instead of leaving it untracked. This is a documented, accepted limitation, not a guarantee this scenario covers. -->

#### Scenario: A temp tab held by an untracked group is released at boot

- **GIVEN** after adoption, window 100's Space "work" `tempTabIds` still lists tab 30, whose live Chrome group is `55` and no instance in window 100 records `55`
- **WHEN** the release step (`store.releaseTabsInUntrackedGroups(tabGroupById)`) runs
- **THEN** tab 30 SHALL be removed from `spaceInstancesByWindow[100]["work"].tempTabIds` (and its `tempTabTitles` entry dropped)
- **AND** a second run of the step SHALL make no further change

#### Scenario: The stray-sweep skips members held by an untracked group

- **GIVEN** window 100's active Space "work" has live group `77`, and its member set includes bound tab 40 whose current live group is untracked group `55`
- **WHEN** materialization reconciles group `77`
- **THEN** tab 40 SHALL NOT be moved into group `77` (it stays in group `55`)
- **AND** ungrouped members and members in dead or other tracked groups SHALL still be swept into `77`

#### Scenario: A home tab inside an untracked group is not swept

- **GIVEN** window 100's active Space "work" has live group `77`, and a home tab (Lunma new-tab page) sits inside untracked group `55`
- **WHEN** materialization reconciles group `77`
- **THEN** that home tab SHALL NOT be moved into group `77`
- **AND** home tabs that are ungrouped SHALL still be swept into `77`

#### Scenario: Boot never opens a tab or steals focus

- **WHEN** the active Space in a window has no open tabs at boot
- **THEN** the boot pass SHALL NOT open a tab for it and SHALL NOT change the active tab
- **AND** that Space SHALL remain `groupId === -1` until its first tab is created

#### Scenario: Two restored groups never bind to one Space

- **GIVEN** window 100 has one Space "work" and Chrome restored two groups `77` and `88`, both with zero tab overlap and both titled "work" (e.g. one is a user group hand-titled to match)
- **WHEN** the boot reconciliation runs
- **THEN** at most one of `77`/`88` SHALL be adopted into "work"; the second SHALL be left untracked
- **AND** `spaceInstancesByWindow[100]["work"].groupId` SHALL hold exactly one of the two ids, never both in turn

#### Scenario: A favorite restored still grouped is ungrouped at boot

- **GIVEN** a global favorite `fav` (`savedTabs['fav'].spaceId === null`, in `faviconRow`) whose window-100 bound tab `42` Chrome restored still inside Space "work"'s restored group `77`, so `tabGroupById.get(42)` is `77`
- **WHEN** the boot reconciliation runs
- **THEN** after adoption and materialization the favorite-ungroup step SHALL call `chrome.tabs.ungroup(42)`
- **AND** tab `42` SHALL become ungrouped (`groupId === -1`) so the next Space switch does not collapse it invisible

#### Scenario: A favorite restored already ungrouped is left alone

- **GIVEN** a global favorite `fav` whose window-100 bound tab `43` Chrome restored already ungrouped, so `tabGroupById.get(43)` is `-1` or absent
- **WHEN** the boot reconciliation runs
- **THEN** the favorite-ungroup step SHALL NOT call `chrome.tabs.ungroup(43)` (it is already global — a no-op)

#### Scenario: A duplicate exposed only after the boot's group query is cleaned up before the broadcast

- **GIVEN** `state.spaces` holds two Spaces named "Default" — the current one (holding open tabs) and a leftover empty one from a prior boot's fresh-install conversion that missed folding a stale Chrome group because that group's window had not finished restoring at query time
- **WHEN** the boot reconciliation runs (adoption, materialization, and favorite-ungroup complete without touching either "Default" — neither's stale group resolves)
- **THEN** the duplicate-Space cleanup step SHALL identify the collision group, find exactly one non-empty member, and call `store.removeEmptySpace` on the empty one
- **AND** the boot persist + broadcast SHALL carry only the surviving "Default"

#### Scenario: A non-empty duplicate pair is left for the read-path self-heal, not renamed mid-boot

- **GIVEN** `state.spaces` holds two Spaces named "Default", both holding open tabs in different windows (a collision the read-path self-heal already resolved by rename before this boot)
- **WHEN** the boot reconciliation's duplicate-Space cleanup step runs
- **THEN** it SHALL leave both Spaces untouched (their names were already disambiguated on load; the boot step never renames)

### Requirement: Lunma new-tab page is the empty-Space home

Lunma SHALL own the browser's new-tab page via `chrome_url_overrides.newtab` →
`apps/extension/src/launcher/newtab/index.html`, so every tab opened without an explicit URL
(entering an empty Space, the window-can't-be-empty tab Chrome spawns after Clear
or closing the last tab, or a user `Cmd+T`) renders Lunma's page. The page SHALL
render the **active Space's home** for its own window: it resolves its window
(`chrome.windows.getCurrent`), reads SW state through the existing
`state-request` / `state-broadcast` path (read-only — it dispatches no command and
mutates no state, like the sidebar), and displays the window's active Space
identity (name, icon, colour). It SHALL render a calm, identity-first surface (no
loading flash — an unresolved active Space shows a neutral home until the next
broadcast). The full launcher search is out of scope (deferred to `launcher-v1`);
any search affordance on this page is a non-functional placeholder.

A tab whose live URL is the new-tab page (recognised by `isNewTabUrl(url)`) is a
**home tab** — a transient property of the live tab, never persisted. Because each
Chromium fork namespaces its internal pages under its own scheme, `isNewTabUrl`
SHALL match the host browser's own internal new-tab URL across forks —
`chrome://newtab`, `edge://newtab`, or `brave://newtab` (each with an optional
trailing slash, query, or hash) — AND the extension's resolved newtab URL
(`chrome.runtime.getURL(NEWTAB_PAGE_PATH)`). This recognises a fresh tab BOTH
during the transient window when the browser reports its own internal scheme (e.g.
`edge://newtab/` on Edge before the override resolves) AND after it resolves to the
`chrome-extension://` override page. `isNewTabUrl` SHALL NOT match sibling internal
pages (e.g. `chrome://settings`, `edge://settings`) or real web URLs. When the user
navigates a home tab to a real URL it ceases to be a home tab.

#### Scenario: The new-tab page renders the active Space's home

- **GIVEN** window 100's active Space is "Work" (blue, icon `briefcase`)
- **WHEN** a new tab opens in window 100 and renders the Lunma new-tab page
- **THEN** the page SHALL display "Work"'s name, icon, and colour
- **AND** it SHALL dispatch no command and mutate no Lunma state

#### Scenario: A navigated-away home tab stops being a home tab

- **GIVEN** a home tab (URL `chrome://newtab/`) in Space "Work"
- **WHEN** the user navigates it to `https://example.com/`
- **THEN** `isNewTabUrl` SHALL no longer match it and it SHALL be treated as an ordinary tab

#### Scenario: An Edge new tab is recognised as a home tab in its internal-scheme window

- **GIVEN** on a non-Chrome Chromium fork a fresh tab opens against the `chrome_url_overrides.newtab` override and `tabs.onCreated` reports its URL as `edge://newtab/` (Edge) or `brave://newtab/` (Brave) before it resolves to the `chrome-extension://` page
- **THEN** `isNewTabUrl('edge://newtab/')` and `isNewTabUrl('brave://newtab/')` SHALL each be true
- **AND** the tab SHALL be treated as a home tab — grouped into the active Space and NOT added to `tempTabIds`
- **AND** `isNewTabUrl('edge://settings/')` SHALL be false (a sibling internal page is not a home tab)

#### Scenario: A window whose only tab is a home tab still tracks its active Space

- **GIVEN** at boot a window whose only open tab is a home tab
- **THEN** the boot pass SHALL still create the window's active-Space instance (so later-created tabs are adopted + grouped — the home tab being the only tab SHALL NOT leave the Space untracked)
- **AND** the boot reconciliation SHALL group that lone home tab into the active Space (the active Space's group materializes from its home tab), rather than leaving an ungrouped home tab

#### Scenario: Boot groups ALL home tabs in the window except those in a user's group

- **GIVEN** at boot a window with more than one home tab
- **THEN** the boot reconciliation SHALL group every home tab in the window that is ungrouped, in a dead group, or in another **tracked** group into the active Space — none SHALL be left ungrouped outside the group
- **AND** a stray ungrouped home tab present alongside an already-live active-Space group SHALL be swept into that group
- **AND** a home tab whose current live group is a live **untracked** (user-created) group SHALL be left in that group, not swept (see Requirement: Boot reconciliation of tab groups)

#### Scenario: A stale persisted group id still materializes at boot

- **GIVEN** the active Space's persisted `groupId` no longer resolves to a live Chrome group (e.g. dissolved across the restart)
- **WHEN** the boot reconciliation runs
- **THEN** it SHALL treat the stale id as "no live group" and materialize a fresh group from the Space's tabs (real + home), rather than skip materialization and leave the tabs ungrouped
