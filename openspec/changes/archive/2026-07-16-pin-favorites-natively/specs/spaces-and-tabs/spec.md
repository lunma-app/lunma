## MODIFIED Requirements

### Requirement: Space tab-group orchestration (backend contract)

The coordinator (not any `LunmaStore` mutator) SHALL own all `chrome.tabGroups` / `chrome.tabs.group` / `chrome.tabs.ungroup` / `chrome.tabs.move` / activation `chrome.tabs.update` calls that materialize Spaces as tab groups. Store mutators SHALL remain synchronous and chrome-free, exposing only state writes (`recordSpaceGroup(windowId, spaceId, groupId)` and the nested-map temp-tab helpers). Each affected command SHALL still emit exactly one persist and one `state-broadcast` per drain cycle. Lunma SHALL only collapse, expand, retitle, recolour, or close Chrome groups whose `groupId` it tracks in `spaceInstancesByWindow`; user-created groups SHALL NEVER be touched.

A Space's **tab set in a window** (used to build / rebuild its group) SHALL be its temporary tabs (`tempTabIds` ∩ tabs open in the window) **plus** its bound (saved) tabs open in the window — a pinned tab is as much a member of its Space's group as a temporary tab. On activation the coordinator SHALL additionally title + recolour the (re)built group with the Space's `name` + `color` (best-effort; a titling failure SHALL NOT abort the activation).

**Global favorites are intentionally ungrouped (not members of any Space's group) and natively pinned.** A saved tab whose `spaceId === null` (a global favorite, referenced by the flat `faviconRow` placement) is **not** a member of any Space's tab set and SHALL NOT be grouped into any Space's Chrome group. The coupling state maps directly onto Chrome tab-strip state: `spaceId = X` ⟺ the live tab is a member of Space X's group; `spaceId = null` ⟺ the live tab is **ungrouped** (global) and **natively pinned** (Chrome tab-strip pin, `pinned === true`), so it renders as a small icon-only tab at the strip start, saving native tab-strip space, and is never collapsed — it stays visible across every Space switch. Binding a `spaceId === null` favorite to a live tab SHALL establish "its live tab is ungrouped and natively pinned" as a post-condition, via a single coordinator helper (`ensureFavoriteNativePinned(tabId)`, calling the `chrome.tabs.ungroup` wrapper then the `setTabNativePinned` wrapper over `chrome.tabs.update(tabId, { pinned: true })`); the helper is idempotent. Native pinning structurally guarantees the tab sits OUTSIDE every Space group's contiguous span at the strip start — Chrome never allows a pinned tab inside a tab group — so no explicit strip-start park is needed (there is no `moveTabToStripStart` wrapper). See the `lunma-bookmark-bindings` capability for the favorite binding model and the couple/decouple group/ungroup + pin/unpin transitions.

**1. Activation sequence.** On `activateSpace(windowId, spaceId)` the coordinator SHALL, in order: (a) ensure/reconcile the target group from the Space's window tab set (see SpaceInstance lifecycle); (b) ensure the target Space shows a focusable tab in the window — when it has none, land it on the **Lunma home**: REUSE the window's focused tab when that tab is already a home tab (group it into the target Space), else open one (which renders the home page); (c) activate a tab in the target group so focus leaves the outgoing group; (d) expand the target group and collapse every other tracked group in the window. Chrome refuses to collapse a group containing the active tab, so step (c) MUST precede step (d). When activation leaves a Space whose ONLY tab in the window is its home tab, the coordinator SHALL close that home tab (the Space returns to `groupId === -1`) rather than leave a collapsed home-only group — so visiting empty Spaces does not accumulate blank tabs. A home tab carries no user content, so closing it is non-destructive.

**1b. A selected global favorite keeps focus across a switch (sidebar-favicon-row).** When the window's **currently-selected** tab is a bound **global favorite** (`savedTabs[id].spaceId === null`), the `activateSpace` switch SHALL **preserve its focus**: the coordinator SHALL skip steps (b) and (c) — it SHALL NOT move focus into the incoming Space, and SHALL NOT open a home tab for an empty incoming Space (which therefore materializes its focusable tab lazily, the next time it actually receives focus). Steps (a) and (d) SHALL still run, so the sidebar and the favicon strip reflect the new active Space while the global favorite remains the selected, visible tab (it belongs to no Space, so a Space switch does not displace it). This focus-preservation applies ONLY to a selected global favorite and ONLY on the `activateSpace` *switch* path; `createSpace` and the `newTab`-into-another-Space path deliberately land focus in the target Space, and a regular (non-favorite) selected tab switches normally (focus moves into the incoming Space).

**2. New tab joins the active group.** On `tabs.onCreated` for a tab in window `W` whose active Space is `S` and which is not bound to a saved tab, the coordinator SHALL add the tab to `S`'s group via `chrome.tabs.group`. When `S` has no live group yet in `W` (e.g. at boot it has open tabs but was never activated this session), the coordinator SHALL build the group from `S`'s **whole window tab set** (its existing temp + bound tabs together with this tab), not from this tab alone — so the new tab is grouped WITH its siblings rather than in a lone one-tab group — then `recordSpaceGroup`. A home tab is grouped into `S` the same way but is NOT recorded in `tempTabIds` (see "Home tabs are not listed as temporary tabs").

**2b. Opened saved tab joins its Space's group, EXCEPT a global favorite.** On `openSavedTab` for a saved tab in Space `S` opened into window `W`, after binding the created tab the coordinator SHALL add it to `S`'s group in `W` (reusing the live group, or creating + recording + titling one when `S` has none yet). When the opened saved tab is a **global favorite** (`saved.spaceId === null`), the coordinator SHALL instead call `ensureFavoriteNativePinned(<created>)` rather than `addTabToSpaceGroup`, so the favorite's live tab is left ungrouped (global), natively pinned, and is never adopted into any Space's group. `addTabToSpaceGroup` keeps its `spaceId: SpaceId` signature; a favorite SHALL be routed to `ensureFavoriteNativePinned` before it could ever reach it. **The same rules apply when `openSavedTab` opens in place via `replaceTabId`** (the `newtab-hearth` path): the *navigated* tab takes the created tab's role — after binding, a Space-pinned saved tab's navigated tab is added to `S`'s group, and a global favorite's navigated tab is routed to `ensureFavoriteNativePinned(<navigated>)`. This matters because the navigated tab (the home tab) may already sit inside the active Space's group from new-tab grouping (rule 2); the helper's ungroup + native pin establishes the favorite invariant regardless of the tab's prior membership.

**3. Rename / recolour propagate to groups.** On `renameSpace` / `recolourSpace`, the coordinator SHALL `chrome.tabGroups.update` the title / colour of the Space's live group in every window where it is instantiated. If a `chrome.tabGroups.update` fails during a rename, the name change SHALL be reverted (the existing rename-atomicity requirement).

**4. Delete closes groups.** On `deleteSpace`, the coordinator SHALL ungroup and close the Space's live groups in every window before the record moves to trash (the existing soft-delete requirement).

#### Scenario: Activation collapses the outgoing group and expands the incoming one

- **GIVEN** window 100 has "Work" active with live group `G_work` and "Side" instantiated with live group `G_side`
- **WHEN** the coordinator processes `activateSpace(100, "side")`
- **THEN** it SHALL activate a tab inside `G_side`, then expand `G_side` and collapse `G_work`
- **AND** exactly one persist and one `state-broadcast` SHALL be emitted for the drain

#### Scenario: Entering an empty Space lands on the home, reusing a focused home tab

- **GIVEN** window 100's active tab is a home tab and the user activates empty Space "Reading" (no open tabs)
- **WHEN** the coordinator processes `activateSpace(100, "reading")`
- **THEN** it SHALL group the existing home tab into "Reading" rather than opening a second tab
- **AND** "Reading"'s group SHALL contain exactly that one home tab

#### Scenario: Leaving an empty Space closes its home-only tab

- **GIVEN** window 100's active Space "Reading" is empty and showing only its home tab
- **WHEN** the user activates "Work"
- **THEN** the coordinator SHALL close "Reading"'s home tab
- **AND** `spaceInstancesByWindow[100]["reading"].groupId` SHALL become `-1`

#### Scenario: Switching Space while a global favorite is selected keeps it focused

- **GIVEN** window 100's selected tab is the live tab of a global favorite (`savedTabs['fav'].spaceId === null`), ungrouped and natively pinned, and the user activates another Space "Reading"
- **WHEN** the coordinator processes `activateSpace(100, "reading")`
- **THEN** it SHALL NOT activate any tab in "Reading" and SHALL NOT open a home tab for "Reading" when it is empty
- **AND** the favorite's tab SHALL remain the window's selected tab, still open, ungrouped, and natively pinned
- **AND** "Reading"'s group (if any) SHALL still be expanded and the other tracked groups collapsed (the sidebar reflects the new active Space)

#### Scenario: Opening a tab groups it into the active Space

- **WHEN** a tab is created in window 100 whose active Space "work" has group `G_work`, unbound
- **THEN** the coordinator SHALL call `chrome.tabs.group({ groupId: G_work, tabIds: [<new>] })`
- **AND** the new tab id SHALL appear in `spaceInstancesByWindow[100]["work"].tempTabIds`

#### Scenario: Opening a saved (pinned) tab groups it into its Space

- **WHEN** the coordinator processes `openSavedTab` for a saved tab in Space "work" opened into window 100 whose "work" group is `G_work`
- **THEN** after binding the created tab the coordinator SHALL call `chrome.tabs.group({ groupId: G_work, tabIds: [<created>] })`
- **AND** the created tab SHALL be a member of `G_work`

#### Scenario: Opening a global favorite leaves its tab ungrouped and natively pinned (not grouped into any Space)

- **GIVEN** a saved tab `fav` is a global favorite (`savedTabs['fav'].spaceId === null`, referenced in `faviconRow`) and window 100's active Space "work" has group `G_work`
- **WHEN** the coordinator processes `openSavedTab` for `fav` into window 100
- **THEN** after binding the created tab the coordinator SHALL call `ensureFavoriteNativePinned(<created>)` and SHALL NOT call `addTabToSpaceGroup` / `chrome.tabs.group` for it
- **AND** the created tab SHALL be ungrouped (`groupId === -1`), natively pinned (`pinned === true`), and SHALL NOT be a member of `G_work` or any other Space group

#### Scenario: Opening a favorite in place ungroups and natively pins the navigated home tab

- **GIVEN** a global favorite `fav` and window 100's home tab 42, which sits inside the active Space's group `G_work` (grouped on creation per rule 2)
- **WHEN** the coordinator processes `openSavedTab` for `fav` with `replaceTabId: 42`
- **THEN** after binding tab 42 the coordinator SHALL call `ensureFavoriteNativePinned(42)`
- **AND** tab 42 SHALL end ungrouped (`groupId === -1`) and natively pinned at the strip start, a member of no Space group

#### Scenario: Rebuilding a stale group includes the Space's bound tabs

- **WHEN** the coordinator rebuilds Space "side"'s group in window 100 (its persisted `groupId` is stale) and "side" has a temp tab 30 and a bound tab 31 open in the window
- **THEN** both 30 and 31 SHALL be grouped into the newly-created group

### Requirement: Boot reconciliation of tab groups

On service-worker boot, after `seedExistingTabs` / `rebuildLiveTabs`, the coordinator boot path SHALL run a one-shot tab-group reconciliation (`reconcileTabGroupsOnBoot`) that **adopts** existing Chrome tab groups into Spaces, **releases** any temp tab held by a live untracked group, **materializes** any missing active-Space group, **reconciles** each global favorite's restored bound tab (ungrouping it when Chrome restored it inside a group, natively pinning it when restored unpinned), and finally **cleans up** any empty Space left duplicate-named after the above steps. The pass SHALL run before the boot persist + broadcast so the broadcast carries the reconciled `groupId`s and the deduplicated `state.spaces`. Lunma SHALL keep being the source of truth — the pass NEVER deletes a non-empty Space, NEVER converts an untracked (user-created) group into a Space, NEVER moves a tab out of a live untracked group (the user's group keeps its tab membership, not just its identity), and (during materialization) NEVER opens a tab or changes tab focus. Step order SHALL be: convert (fresh install only) → adopt → release → materialize → favorite reconciliation → duplicate cleanup.

**Fresh-install exemption for the release and untracked-group sweep exclusion.** On a boot that runs fresh-install conversion (see Requirement: Fresh-install conversion of Chrome groups into Spaces — `freshInstall` true AND at least one Chrome group exists), the release step and the untracked-group sweep exclusion (below) SHALL both be skipped entirely for that pass. Conversion claims EVERY existing Chrome group that boot (folding it into a Space or minting its own), so no group is "untracked" in the sense those steps mean; skipping preserves conversion's pre-existing group-folding behaviour, under which two same-title groups folded into one Space (see Requirement: Fresh-install conversion of Chrome groups into Spaces) are merged into a single live Chrome group by materialization exactly as before this capability's untracked-group protections existed. Outside a fresh-install-conversion boot (i.e. on every other boot — every restart or idle-unload wake after the first), both steps run as specified below.

#### Scenario: The release step and sweep exclusion are skipped on a fresh-install conversion boot

- **GIVEN** a fresh install where window 100 has two Chrome groups titled "Work" with different colours (see Requirement: Fresh-install conversion of Chrome groups into Spaces, "Same-name groups of different colours fold into one Space") — conversion folds both into one "Work" Space, assigning both groups' member tabs into that Space's `tempTabIds`, but adoption's claim-guard binds only the FIRST group's id as the instance's recorded `groupId`
- **WHEN** the boot reconciliation runs
- **THEN** the release step SHALL NOT run for this pass (neither group's tabs are stripped from `tempTabIds`)
- **AND** materialization SHALL treat the second (unbound) group's tabs as ordinary stray members and merge them into the first group, exactly as it would with the untracked-group exclusion absent
- **AND** the window SHALL end the pass with exactly ONE live Chrome group for "Work", holding every tab from both original groups

**Adoption.** For each existing Chrome tab group in a window, the pass SHALL try to match it to one of that window's persisted Space instances via the pure `matchGroupToSpace(group, candidates)` function and, on a match, re-bind that instance's `groupId` to the live group id (`recordSpaceGroup`). Matching SHALL score **tab-membership overlap** between the group's current member tab ids and the instance's persisted `tempTabIds` first, and SHALL fall back to **persisted title + colour** (`group.title === space.name` and `group.color === toGroupColor(space.color)`) only to break a zero/tied overlap. Because Space names are unique (see Requirement: Space names are unique), the title fallback resolves to at most one Space. Ties after both signals SHALL break deterministically by `spaces[]` order. A group matching no Space (the user's own group) SHALL be left untouched — never adopted, never retitled. Adoption SHALL perform no `chrome.tabGroups` mutation (state writes only). A **global favorite** (`spaceId === null`) is never a Space instance, so it can never match a group here — its membership is reconciled by the favorite-reconciliation step below, not by adoption.

**Claim-guard (single binding per pass).** Within one adoption pass each Space SHALL be claimed by at most **one** group per window: once a Space has been adopted, it SHALL be removed from the candidate set for the window's remaining groups, so no two groups bind to one Space. Complementarily, `store.recordSpaceGroup(windowId, spaceId, groupId)` SHALL clear the `groupId` of any *other* instance in the same window that currently holds the incoming `groupId` (evicting a prior holder), so a single live `groupId` is never shared by two instances.

**Untracked-group tab release.** After adoption (so every Lunma group's restored id is re-bound and "untracked" is decided against live ids) and before materialization, the pass SHALL call the synchronous chrome-free store mutator `store.releaseTabsInUntrackedGroups(tabGroupById)`: for each window, every tab listed in any instance's `tempTabIds` whose live Chrome group (per `tabGroupById`, the boot tab→group map) is ≥ 0 and recorded by **no** instance in that window SHALL be removed from that instance's `tempTabIds` (and `tempTabTitles`). A tab living in the user's own group is the user's, not a Space's temporary tab — this keeps the sidebar honest and keeps stale `tempTabIds` overlap from mis-adopting the user's group on a later restart. Bound (saved) tab records SHALL NOT be modified. The step SHALL be state-only and idempotent.

**Materialization.** After the release step, for each window whose active Space has tabs open in the window but still has `groupId === -1`, the pass SHALL group that Space's window tab set into a new Chrome group, title + recolour it with the Space identity, and `recordSpaceGroup` the new id. When the active Space already has a live group, any member tab not already in it SHALL be swept into it — but **only** members that are ungrouped, in the Space's own dead/stale group, or in another **tracked** group: a member whose current live group (per `tabGroupById`) is an untracked group (not in `trackedGroupIdsForWindow` for the window) SHALL be excluded from the sweep and from a fresh group's initial membership, and left where the user put it. This exclusion applies uniformly to the whole member set — the Space's temp + bound tabs AND every home tab in the window (a home tab held by a user's untracked group SHALL NOT be swept out of it). The pass SHALL then collapse the window's other tracked groups (active group expanded) on a **best-effort** basis — a collapse that Chrome refuses (e.g. the restored active tab is inside another group) SHALL be skipped, not retried, and SHALL NOT abort the pass. A Space with no open tabs in the window SHALL be left groupless (a group cannot be empty).

**Favorite reconciliation (ungroup + native pin).** After adoption and materialization, the pass SHALL iterate the global favorites — each saved-tab id in `faviconRow` (`savedTabs[id].spaceId === null`) — and, for each window where Chrome restored the favorite's per-window bound tab, look up that tab's group in the boot tab→group map (`tabGroupById`, the same map adoption read from the boot tabs query) and its native pinned state from the same boot tabs query. When the favorite's bound tab is still grouped (`tabGroupById.get(tabId) >= 0`), the pass SHALL `chrome.tabs.ungroup(tabId)` it, so a favorite that Chrome restored inside its old group is made global again before the next Space switch could collapse it invisible. When the favorite's bound tab is not natively pinned, the pass SHALL natively pin it (`setTabNativePinned(tabId, true)`), which also converges favorites created before native pinning existed — no data migration is needed. Both operations are best-effort — a refusal SHALL be swallowed like the other boot group ops and SHALL NOT abort the pass — and the step is bounded by favorite × window count. A favorite whose bound tab Chrome restored already ungrouped (`tabGroupById.get(tabId)` is `-1` or absent) and already pinned is a no-op.

**Duplicate-Space cleanup.** After favorite reconciliation, the pass SHALL group `store.state.spaces` into normalized-name collision groups via `groupDuplicateSpaceNames` and, for each group, partition members via `isSpaceEmpty` exactly as the load-path self-heal does (see Requirement: Space names are unique, item 4). For every member the resulting resolution marks as a drop (the "exactly one non-empty" and "all empty" cases), the pass SHALL call `store.removeEmptySpace(spaceId)`. A group resolved as "two or more non-empty members" SHALL be left untouched by this step — the boot pass never renames a Space (only the load-path self-heal does; renaming mid-boot could retitle a Space out from under an already-rendered sidebar with no user action). This step SHALL run unconditionally, not only on `freshInstall`, so a duplicate exposed only after the boot's single `chrome.tabGroups.query({})` call (e.g. a window still restoring at query time, whose stale group the fresh-install fold could not see) is still cleaned up before the broadcast, rather than persisting until a future full reload happens to re-run fresh-install conversion (which it normally never will again, since `state.spaces` is no longer empty).

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
- **THEN** after adoption and materialization the favorite-reconciliation step SHALL call `chrome.tabs.ungroup(42)`
- **AND** tab `42` SHALL become ungrouped (`groupId === -1`) so the next Space switch does not collapse it invisible

#### Scenario: A favorite restored unpinned is natively pinned at boot

- **GIVEN** a global favorite `fav` whose window-100 bound tab `42` Chrome restored natively unpinned (`pinned === false`) — e.g. the favorite predates native pinning
- **WHEN** the boot reconciliation runs
- **THEN** the favorite-reconciliation step SHALL call `setTabNativePinned(42, true)`
- **AND** tab `42` SHALL end natively pinned, rendered icon-only at the strip start

#### Scenario: A favorite restored already ungrouped and pinned is left alone

- **GIVEN** a global favorite `fav` whose window-100 bound tab `43` Chrome restored already ungrouped (`tabGroupById.get(43)` is `-1` or absent) and already natively pinned
- **WHEN** the boot reconciliation runs
- **THEN** the favorite-reconciliation step SHALL NOT call `chrome.tabs.ungroup(43)` and SHALL NOT call `setTabNativePinned(43, true)` (it is already global and pinned — a no-op)

#### Scenario: A duplicate exposed only after the boot's group query is cleaned up before the broadcast

- **GIVEN** `state.spaces` holds two Spaces named "Default" — the current one (holding open tabs) and a leftover empty one from a prior boot's fresh-install conversion that missed folding a stale Chrome group because that group's window had not finished restoring at query time
- **WHEN** the boot reconciliation runs (adoption, materialization, and favorite reconciliation complete without touching either "Default" — neither's stale group resolves)
- **THEN** the duplicate-Space cleanup step SHALL identify the collision group, find exactly one non-empty member, and call `store.removeEmptySpace` on the empty one
- **AND** the boot persist + broadcast SHALL carry only the surviving "Default"

#### Scenario: A non-empty duplicate pair is left for the read-path self-heal, not renamed mid-boot

- **GIVEN** `state.spaces` holds two Spaces named "Default", both holding open tabs in different windows (a collision the read-path self-heal already resolved by rename before this boot)
- **WHEN** the boot reconciliation's duplicate-Space cleanup step runs
- **THEN** it SHALL leave both Spaces untouched (their names were already disambiguated on load; the boot step never renames)

