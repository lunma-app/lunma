## MODIFIED Requirements

### Requirement: Space names are unique

No two Spaces in `state.spaces` SHALL share a name under the normalized comparison
`normalizeSpaceName(name) = name.trim().toLocaleLowerCase()`, exported from
`apps/extension/src/shared/space-names.ts`. The Space record SHALL store the user's chosen casing
and surrounding form unchanged — only the *comparison* is normalized. Uniqueness is
**global** across all Spaces (not per-window and not scoped by colour), because a
single Space record may be instantiated in multiple windows and its name is the only
restart-durable key the boot adoption fallback (`group.title === space.name`) has.

Enforcement SHALL split by origin:

**1. Interactive create / rename SHALL be rejected.** `store.createSpace` SHALL throw
when the normalized name equals that of any existing Space. `store.renameSpace` SHALL
throw when the normalized new name equals that of any **other** Space (the Space being
renamed is excluded, so re-applying its own name or only changing its casing is
allowed). The coordinator's `createSpace` / `renameSpace` handlers SHALL let the throw
propagate to the `'lunma/command-ack'`, which the dispatcher's `bus.send` rejects with.

**2. Non-interactive mints SHALL auto-disambiguate.** Where Lunma mints or restores a
Space without a user-typed name — fresh-install group→Space conversion, restore from
trash, and the boot data migration — it SHALL pass the desired name through
`disambiguateSpaceName(desired, takenNormalized): string`, a pure function that returns
`desired` when its normalized form is absent from `takenNormalized`, else the first of
`"{desired} 2"`, `"{desired} 3"`, … whose normalized form is absent. These paths SHALL
NOT throw on collision.

**3. The Chrome-side rename mirror SHALL NOT throw.** When `tabGroups.onUpdated`
mirrors a user's Chrome-group title change back onto the Space, a title colliding with
another Space's name SHALL be resolved through `disambiguateSpaceName` (and the Chrome
group re-titled to the disambiguated name so group and record stay in lockstep), never
left to throw inside the drain.

**4. The load-path self-heal SHALL reassert uniqueness, removing an empty duplicate
rather than only renaming it.** When persisted state is read, `dedupePersistedState`
(`apps/extension/src/shared/chrome/storage.ts`) SHALL enforce normalized-name
uniqueness over `state.spaces` alongside its existing id-dedup, so a state that already
holds two or more same-normalized-name Spaces on disk cannot survive the load
unchanged. The pass SHALL group `state.spaces` into normalized-name collision groups
via `groupDuplicateSpaceNames` (`apps/extension/src/shared/space-names.ts`, order-
preserving, groups of size ≥ 2 only) and, for each group, partition its members into
empty and non-empty using `isSpaceEmpty` (`apps/extension/src/shared/space-empty.ts`:
no `pinnedBySpace` entries and no `tempTabIds` in any window instance), then resolve:

- **Exactly one non-empty member:** it SHALL be kept under its original name; every
  empty member of the group SHALL be dropped — removed from `state.spaces` and from
  `spaceInstancesByWindow` / `activeSpaceByWindow` / `lastActivatedSpaceId` references
  (redirected to the kept Space's id, or to the next fallback Space, mirroring
  `removeEmptySpace`'s existing redirect behaviour) rather than renamed.
- **Zero non-empty members (every member of the group is empty):** the FIRST member
  (array order) SHALL be kept unchanged; every other member SHALL be dropped the same
  way.
- **Two or more non-empty members:** unchanged from prior behaviour — the FIRST member
  SHALL be kept unchanged, and each later member (empty or not) SHALL have its display
  name re-derived via `disambiguateSpaceName(space.name, takenNormalized)` against the
  names already kept this pass. No Space SHALL be dropped in this case, and no
  `pinnedBySpace` / `spaceInstancesByWindow` entry SHALL be rewritten — only the
  colliding record's `name` changes.

A dropped empty Space's own `pinnedBySpace` / `spaceInstancesByWindow` entries are by
definition already empty (that is what `isSpaceEmpty` asserts), so dropping it discards
no tab or pin data. Any rename OR drop SHALL mark the result `changed`, so the existing
read-path write-back persists the healed envelope on first load. The pass SHALL be
idempotent (a second load of the healed state changes nothing further).

#### Scenario: Creating a Space with an in-use name is rejected

- **GIVEN** `state.spaces` already contains a Space named "Work"
- **WHEN** the `createSpace` handler runs with payload name "work" (any casing/whitespace normalizing to "work")
- **THEN** `store.createSpace` SHALL throw
- **AND** the coordinator SHALL emit a `'lunma/command-ack'` carrying `{ error }`, which `bus.send` rejects with
- **AND** no second "Work" Space SHALL be added to `state.spaces`

#### Scenario: Renaming a Space to another Space's name is rejected

- **GIVEN** Spaces "Work" and "Personal" exist
- **WHEN** the user renames "Personal" to "Work"
- **THEN** `store.renameSpace` SHALL throw and the record's name SHALL remain "Personal"

#### Scenario: A Space may keep its own name (case-only edit allowed)

- **GIVEN** a Space named "Work"
- **WHEN** the user renames it to "work" (same Space, casing-only change)
- **THEN** `store.renameSpace` SHALL NOT throw and the record's name SHALL become "work"

#### Scenario: Restoring a trashed Space disambiguates a now-taken name

- **GIVEN** Space "Work" was trashed, then a new Space "Work" was created
- **WHEN** the user undoes the deletion to restore the trashed Space
- **THEN** the restored Space's name SHALL be disambiguated to "Work 2"
- **AND** both Spaces SHALL coexist with distinct names

#### Scenario: A Chrome-side group rename to an in-use name does not crash the drain

- **GIVEN** Spaces "Work" and "Side" exist, and "Side"'s live Chrome group is renamed by the user to "Work"
- **WHEN** `tabGroups.onUpdated` mirrors the title change
- **THEN** "Side" SHALL be renamed to a disambiguated "Work 2" (its Chrome group re-titled to match), NOT to a duplicate "Work"
- **AND** the drain SHALL complete without throwing

#### Scenario: Loading a state with duplicate-named, content-holding Spaces disambiguates on read

- **GIVEN** persisted `state.spaces` holds two distinct-id Spaces both named "Default", each with at least one `tempTabIds` entry in some window instance (followed by a third, also non-empty, named "Default 2")
- **WHEN** `readPersistedState` runs `dedupePersistedState` on the loaded state
- **THEN** since the collision group has two-or-more non-empty members, the first "Default" SHALL keep its name, the second SHALL be renamed to "Default 3" (the first free normalized form, skipping the already-present "Default 2"), and the third SHALL remain "Default 2"
- **AND** all three Spaces and their `pinnedBySpace` / `spaceInstancesByWindow` entries SHALL be preserved
- **AND** the result SHALL be marked `changed` so the healed envelope is written back
- **AND** loading the healed state again SHALL change nothing further

#### Scenario: An empty duplicate is removed, not renamed

- **GIVEN** persisted `state.spaces` holds two distinct-id Spaces both named "Default": the first holds a `tempTabIds` entry in window 100's instance, the second has no `tempTabIds` in any window instance and no `pinnedBySpace` entry
- **WHEN** `readPersistedState` runs `dedupePersistedState` on the loaded state
- **THEN** since the collision group has exactly one non-empty member, the first "Default" SHALL be kept under its original name and its content untouched
- **AND** the second (empty) "Default" SHALL be removed from `state.spaces` — NOT renamed to "Default 2"
- **AND** the result SHALL be marked `changed` so the healed envelope is written back

#### Scenario: All members of a collision group are empty

- **GIVEN** persisted `state.spaces` holds three distinct-id Spaces all named "Default", none with any `tempTabIds` in any window instance or any `pinnedBySpace` entry
- **WHEN** `readPersistedState` runs `dedupePersistedState` on the loaded state
- **THEN** the first "Default" (array order) SHALL be kept unchanged
- **AND** the other two SHALL be removed from `state.spaces`
- **AND** the result SHALL be marked `changed`

### Requirement: Boot reconciliation of tab groups

On service-worker boot, after `seedExistingTabs` / `rebuildLiveTabs`, the coordinator boot path SHALL run a one-shot tab-group reconciliation (`reconcileTabGroupsOnBoot`) that **adopts** existing Chrome tab groups into Spaces, **materializes** any missing active-Space group, **ungroups** any global favorite Chrome restored still inside a group, and finally **cleans up** any empty Space left duplicate-named after the above steps. The pass SHALL run before the boot persist + broadcast so the broadcast carries the reconciled `groupId`s and the deduplicated `state.spaces`. Lunma SHALL keep being the source of truth — the pass NEVER deletes a non-empty Space, NEVER converts an untracked (user-created) group into a Space, and (during materialization) NEVER opens a tab or changes tab focus.

**Adoption.** For each existing Chrome tab group in a window, the pass SHALL try to match it to one of that window's persisted Space instances via the pure `matchGroupToSpace(group, candidates)` function and, on a match, re-bind that instance's `groupId` to the live group id (`recordSpaceGroup`). Matching SHALL score **tab-membership overlap** between the group's current member tab ids and the instance's persisted `tempTabIds` first, and SHALL fall back to **persisted title + colour** (`group.title === space.name` and `group.color === toGroupColor(space.color)`) only to break a zero/tied overlap. Because Space names are unique (see Requirement: Space names are unique), the title fallback resolves to at most one Space. Ties after both signals SHALL break deterministically by `spaces[]` order. A group matching no Space (the user's own group) SHALL be left untouched — never adopted, never retitled. Adoption SHALL perform no `chrome.tabGroups` mutation (state writes only). A **global favorite** (`spaceId === null`) is never a Space instance, so it can never match a group here — its membership is reconciled by the favorite-ungroup step below, not by adoption.

**Claim-guard (single binding per pass).** Within one adoption pass each Space SHALL be claimed by at most **one** group per window: once a Space has been adopted, it SHALL be removed from the candidate set for the window's remaining groups, so no two groups bind to one Space. Complementarily, `store.recordSpaceGroup(windowId, spaceId, groupId)` SHALL clear the `groupId` of any *other* instance in the same window that currently holds the incoming `groupId` (evicting a prior holder), so a single live `groupId` is never shared by two instances.

**Materialization.** After adoption, for each window whose active Space has tabs open in the window but still has `groupId === -1`, the pass SHALL group that Space's window tab set into a new Chrome group, title + recolour it with the Space identity, and `recordSpaceGroup` the new id. It SHALL then collapse the window's other tracked groups (active group expanded) on a **best-effort** basis — a collapse that Chrome refuses (e.g. the restored active tab is inside another group) SHALL be skipped, not retried, and SHALL NOT abort the pass. A Space with no open tabs in the window SHALL be left groupless (a group cannot be empty).

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

#### Scenario: An untracked user group is never adopted

- **GIVEN** window 100 contains a Chrome group whose members overlap no Space instance's `tempTabIds` and whose title/colour match no Space
- **WHEN** the boot reconciliation runs
- **THEN** that group SHALL NOT be adopted, retitled, or recolored
- **AND** no Space SHALL be created from it

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
