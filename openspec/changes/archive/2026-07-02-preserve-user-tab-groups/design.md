# Design: preserve-user-tab-groups

## Context

Empirically confirmed (do not re-derive): against the built extension at commit `9345e66`, a Playwright-driven Chromium with an active Space "Default" holding tracked temp tabs, where the user manually groups two of those tabs into their own native group (`chrome.tabs.group` + retitle), loses that group across a `--restore-last-session` restart — in BOTH the same-title/same-colour variant and a differently-named ("Mine", orange) variant. The user's group is drained (all tabs absorbed into the Space's group) and Chrome auto-dissolves it. The mechanism is three composing pieces:

1. `seedExistingTabs` (`apps/extension/src/background/seed-existing-tabs.ts:73-85`) seeds each boot tab by group membership: a tab whose live `groupId` maps to a tracked Space instance goes to that Space, but a tab in a group that maps to NO instance falls back to `store.onTabCreated` → adopted into the active Space's `tempTabIds`. (The group-aware path came from the archived `prevent-space-group-collapse` change; it only respects tracked groups.)
2. `materializeActiveGroups` (`apps/extension/src/background/tab-group-adoption.ts:380-384`) computes the active Space's membership (`spaceWindowTabSet` = temp + bound tabs, plus every home tab via `homeTabIdsInWindow`) and sweeps every member NOT already in the Space's live group INTO it (`ensureGroupForSpace(windowId, stray, live.id)`). Tabs sitting in a live user-created group are "stray" by this definition.
3. Chrome dissolves a group when its last tab leaves.

The boot chain (`apps/extension/src/background/index.ts:136-148`) — `seedExistingTabs` → `rebuildLiveTabs` → `reconcileTabOwnership` → `reconcileTabGroupsOnBoot` — runs on EVERY SW cold start: browser launch and every mid-session MV3 idle-unload wake (~30s), which is why users see groups dissolve "when I click on them" (the click wakes the SW; the boot drain does the damage).

The module docstring already promises the pass "NEVER converts an untracked (user-created) group into a Space", and `trackedGroupIdsForWindow` (`tab-group-adoption.ts:326-334`) exists so "user-created groups are never collapsed" — the invariant was intended but only protects the group OBJECT, not its tab membership.

Mid-session today: `tabs.onUpdated` (`apps/extension/src/background/handlers/chrome-tabs.ts:154-163`) early-returns unless `url`/`status`/`title`/`favIconUrl` changed — `changeInfo.groupId` is ignored. A tracked temp tab the user moves into their own group therefore stays listed in the Space's Temporary list; nothing fights mid-session (`orchestrateActivation` reuses a resolving live group without sweeping), but the next SW boot's sweep confiscates it. Persisted `tempTabIds` still listing the tab is also what makes `matchGroupToSpace` overlap-match the USER'S restored group to the Space after a restart.

**Terminology.** In a given window, a live Chrome group id (≥ 0) is **tracked** when some Space instance in `spaceInstancesByWindow[windowId]` records it as its `groupId`; otherwise it is **untracked** (user-owned). `-1` means ungrouped.

## Goals / Non-Goals

**Goals:**

- A user-created native Chrome group survives every SW boot — browser restart and idle-unload wake — with its tabs intact, including tabs that were previously tracked as Space temp tabs.
- Lunma's model stays honest: a tab living in a user's group is not listed as a Space's temporary tab.
- Tabs in tracked groups and ungrouped tabs keep today's behaviour exactly.
- Both confirmed repro variants (same-title/same-colour; differently-named) pass as an e2e.

**Non-Goals:**

- No change to `cleanUpDuplicateSpaces` (spec'd by `merge-duplicate-named-spaces`; related-but-distinct secondary — see D8).
- No change to adoption's matching algorithm (`matchGroupToSpace` itself), fresh-install conversion, favorite-ungroup reconciliation, or Space switching's group resolution (`resolveGroup`/`ensureGroupForSpace`) — see D2b for the one narrow exception this change's own boot ordering creates (adoption still runs on possibly-stale `tempTabIds`, addressed as a documented residual risk, not a matcher rewrite).
- No UI: user groups remain invisible to the sidebar (they are Chrome's, not Lunma's).
- No un-pinning: bound (saved) tab records are never modified by this change (D4).
- **Mid-session physical group joins are OUT of scope** (D9): a brand-new tab Chrome places inside a user's group (e.g. "open link in new tab" from a tab that lives in that group) is still unconditionally pulled into the active Space's group by `groupNewTab`/`onTabCreated`, and a bound tab sitting in a user's group can still be dragged out by `orchestrateActivation`'s/`addTabToSpaceGroup`'s live-group rebuild when the Space's own group is stale. This change closes the BOOT destruction (the confirmed, empirically-reproduced defect) and the mid-session STATE dishonesty (D6, tracked tab moved by drag). It does not chase every mid-session Chrome-initiated group placement — see D9 for why and the named follow-up.

## Decisions

### D1 — "Untracked group" is decided per window from recorded instance `groupId`s

A tab is user-owned when its live `groupId` ≥ 0 and no instance in its window records that id. Seeding evaluates this against the persisted instances (the `spaceByGroupByWindow` map `seedExistingTabs` already builds); the boot sweep and release step evaluate it post-adoption via `trackedGroupIdsForWindow` + the boot `tabGroupById` map (both already exist).

*Post-restart subtlety:* group ids are session-scoped, so at seeding time even Lunma's OWN restored groups look unmapped (adoption re-binds ids later in the chain). Skipping their tabs at seeding loses nothing: any tab that was tracked is still in persisted `tempTabIds` (seeding only ever ADDS), and adoption's overlap match still re-binds the group. A tab in a restored tracked group that was somehow never tracked stays untracked — strictly better than today, where the fallback lumps it into the ACTIVE Space and the sweep then drags it out of its own Space's restored group.

*Alternative considered:* deciding tracked/untracked only after adoption (a second, post-adoption seeding pass inside `reconcileTabGroupsOnBoot`). Rejected: it adds a new boot step to repair a rare edge (a tab inside a tracked group yet absent from `tempTabIds` — its creation event was not missed, because `tabs.onCreated` wakes the SW), and the fallback it would replace is itself misassignment.

*Exception (found during implementation, see D3):* the "untracked" concept in this decision does not apply on a boot that runs fresh-install conversion — on that one-time pass every existing Chrome group is claimed by `convertGroupsToSpaces` (folded or minted its own Space), so nothing is "untracked" yet in the sense this decision means. D3/D5 are skipped entirely for that specific pass. D2 (seeding) needs no equivalent exception: on a fresh install, `spaceInstancesByWindow` has no persisted instances yet, so EVERY grouped tab looks unmapped at seeding time and is skipped (D2's normal behaviour) rather than fallback-seeded into the auto-created Default; conversion's `assignSpaceTabs` (which runs immediately after, before adoption) then places each tab directly into its real destination Space regardless of whether seeding touched it first — net effect unchanged from the pre-existing two-step (seed-into-Default-then-reassign) dance, confirmed by the full existing fresh-install-conversion test suite passing unmodified.

### D2b — Residual risk: adoption still scores overlap against possibly-stale `tempTabIds`

`adoptExistingGroups` runs BEFORE this change's release step (D5) and reads persisted `tempTabIds` as-is. If a tab that D6 should have released (moved into the user's own group mid-session) was NOT released before a full browser restart — because the `tabs.onUpdated` event never drained (the SW was killed in the same instant the user finished grouping, before the coordinator's queue processed it) — the persisted `tempTabIds` still lists that tab. At the next boot, `matchGroupToSpace`'s tab-membership-overlap scoring sees that overlap against BOTH the user's now-restored group (which physically holds the tab) and, potentially, the Space's own restored group (if it lost that tab from its live membership already) — the exact mechanism the Context section describes as the ORIGINAL bug's adoption-corruption path. If the user's group wins that overlap match, it becomes TRACKED for this session: D3/D5's untracked-group protections no longer apply to it (it is no longer "untracked" by definition), and materialization will retitle/recolour it with the Space's identity and sweep the Space's other real members into it.

This is a genuine residual gap, not fully closed by this change. It is accepted, not fixed, for these reasons:

- **The race window is narrow in practice.** `chrome.tabs.group` + `tabGroups.update` (the user's grouping action) synchronously enqueue the resulting `tabs.onUpdated` event; the coordinator drains its queue on the same turn/microtask cascade, well before the ~30s MV3 idle-unload threshold and far faster than a manual quit-and-relaunch. The failure mode requires the OS/browser to terminate the SW process in the split second between the Chrome-side group mutation and the queue drain — categorically different from (and far rarer than) the ORIGINAL bug, which fired on **every single boot**, deterministically.
- **Rewriting `matchGroupToSpace`'s tie-break to be immune to this would widen this change's blast radius** into the `matchGroupToSpace`/adoption algorithm explicitly kept out of scope (see Non-Goals) and risk regressing the "restored group is adopted, not rebuilt" guarantee other scenarios depend on.
- **The failure is self-limiting, not silent data loss.** Even in the misadoption case, no tab is closed and no group is destroyed — Lunma mislabels which group belongs to which Space for that session; the user's tabs remain exactly where they are, just under the "wrong" Space identity/colour until corrected (e.g. by the duplicate-Space or a subsequent restart where `tempTabIds` has caught up).

Accepted as a documented limitation; the "user's group survives a restart" scenarios below are scoped accordingly (their GIVEN assumes the mid-session release already processed, the realistic case). A future change could close this fully with a pre-adoption reconciliation pass, if the residual window proves to matter in practice.

### D2 — Seeding skips user-group tabs (like home tabs), rather than seeding them anywhere

In `seedExistingTabs`, a tab whose `groupId` ≥ 0 maps to no instance is skipped — `ensureSpaceInstance` still runs for its window (unchanged; a window whose only tabs are user-grouped still gets an instance), but the tab is neither `assignSpaceTabs`-ed nor `onTabCreated`-ed. It stays untracked, exactly like home tabs stay unlisted. Ungrouped tabs keep the active-Space fallback; tracked-group tabs keep the group-aware path.

*Alternative considered:* keep seeding but tag the tab "unswept". Rejected: leaves the sidebar listing a tab that lives in the user's group (the modeling contradiction), and keeps the false `tempTabIds` overlap that makes `matchGroupToSpace` adopt the USER'S restored group into the Space after a restart (observed in the repro).

### D3 — The stray-sweep excludes members whose current live group is untracked

In `materializeActiveGroups`, the sweep filter becomes: a member is stray only when its current group (per `tabGroupById`, default `-1`) is not the Space's live group AND is not an untracked group — i.e. sweep only members that are ungrouped, in the Space's own dead/stale group, or in another **tracked** group. Computed against `trackedGroupIdsForWindow(store, windowId)`, which at this point (post-adoption) reflects re-bound live ids. The no-live-group materialization branch groups the same filtered membership, for the same reason (grouping a fresh group from members would equally drag them out of a user group).

**Implementation-discovered refinement — D3/D5 are skipped entirely on a fresh-install conversion boot.** Building the unit tests surfaced a real regression against an EXISTING, spec'd scenario: fresh-install conversion (`convertGroupsToSpaces`, "Fresh-install conversion of Chrome groups into Spaces" requirement) can fold two physical same-titled Chrome groups into ONE Space, `assignSpaceTabs`-ing both groups' tabs into that Space's `tempTabIds` — but adoption's single-claim-per-Space rule (D6, this requirement's own claim-guard) only re-binds ONE of the two groups as the instance's recorded `groupId`; the second is a legitimate Lunma-assigned group (its tabs already deliberately placed in `tempTabIds` this same boot), not a foreign one, even though no instance names it as `groupId`. A definition of "untracked" based on state alone (recorded `groupId`, or "does the group hold an already-tracked tab") cannot distinguish this from the confirmed-bug case, because by the time D3/D5 run, `tempTabIds` looks structurally identical in both cases — the only real difference is *why* the tab is there, which is external, temporal context. The chosen fix: `reconcileTabGroupsOnBoot` computes `convertedThisBoot = freshInstall && groups.length > 0` and skips BOTH `store.releaseTabsInUntrackedGroups` and `materializeActiveGroups`'s untracked-group exclusion (a new `skipUntrackedExclusion` parameter, `false` by default) when true. This is correct, not just expedient: on a genuine fresh install, `convertGroupsToSpaces` claims EVERY existing Chrome group (folds it or mints its own numbered Space) — there is no concept of "the user's own, Lunma has never seen it" group on that specific pass, since Lunma has never run before and every group becomes Lunma's business by definition. The "untracked, must-protect" concept this change introduces is only meaningful on every OTHER boot (all subsequent restarts and idle-unload wakes — the overwhelming majority), where it fully applies. `skipUntrackedExclusion` is an internal parameter of a private, unexported function — not a name any artifact pins — so this is not a "names are normative" deviation, but the resulting BEHAVIOUR (fresh-install boots are exempt from D3/D5) is a real refinement to what D1/D3/D5 originally said, recorded here per the deviation policy.

### D4 — Bound (pinned/saved) tabs: tracked-but-unswept AT BOOT (scope note: not mid-session activation)

A bound tab whose live tab the user moved into their own group keeps its saved-tab record and binding — un-pinning would destroy user data (the pinned record) to fix a lesser inconsistency. At **boot**, it is excluded from the stray-sweep by D3 (membership exclusion applies to the merged member set), so it stays in the user's group across a restart. The pinned row still renders from the saved-tab record and clicking it still focuses the bound tab — no dishonesty of the temp-list kind. This mirrors the existing global-favorite model (a bound tab living outside the Space's group).

**Scope limit (see D9):** this protection is boot-only. Mid-session, `orchestrateActivation`'s and `addTabToSpaceGroup`'s live-group rebuild (`apps/extension/src/background/group-orchestrator.ts:88,181`) still gathers a Space's FULL window tab set — including a bound tab currently sitting in a user's group — whenever the Space's own group is stale/missing and needs rebuilding (e.g. the next Space switch after the group dissolved for an unrelated reason). That rebuild would still drag the bound tab out of the user's group. This change does not alter those rebuild paths; it is called out explicitly in Non-Goals/D9 rather than left as an implicit gap.

### D5 — Boot release step: strip untracked-group tabs from `tempTabIds`, AFTER adoption

New state-only store mutator `releaseTabsInUntrackedGroups(tabGroupById: ReadonlyMap<TabId, number>): void` (synchronous, chrome-free, like its siblings): for each window, remove from every instance's `tempTabIds` (and `tempTabTitles`) any tab whose live group is ≥ 0 and not recorded by any instance in that window. Called from `reconcileTabGroupsOnBoot` after `adoptExistingGroups` and before `materializeActiveGroups`, reusing the pass's existing `tabGroupById` map.

*Why after adoption:* before adoption, a restart leaves ALL restored groups unmapped — releasing there would strip every restored Space's temp tabs and break the overlap matching adoption depends on. After adoption, tracked groups have re-bound ids, so "still unmapped" reliably means user-owned. (This is also why the release cannot live in `reconcileTabOwnership`, which runs pre-adoption.)

*Why keep both D3 and D5:* the release makes STATE honest (covers events missed while the SW was being killed, and makes boot idempotent); the sweep exclusion protects members the release never touches (bound tabs per D4, home tabs per D7). After the release, temp members can no longer sit in untracked groups, but the sweep exclusion is still the direct guard for the rest of the member set.

### D6 — Mid-session: ownership follows a tab's `groupId` change (release / reassign)

The `tabs.onUpdated` handler stops ignoring `changeInfo.groupId`. New store mutator `onTabGroupIdChanged(tabId: TabId, groupId: number): void`:

**Window resolution:** the mutator resolves the tab's window from `store.state.liveTabsById[tabId]?.windowId` (the same mirror every other window-scoped mutator in this file reads, kept current by `syncLiveTab`/`rebuildLiveTabs`). If the tab is not yet mirrored (`liveTabsById[tabId]` absent — theoretically possible if `tabs.onUpdated` somehow raced ahead of the `tabs.onCreated` `syncLiveTab` call for the same tab, which the coordinator's sequential drain should preclude, but is a defensive check), the mutator is a no-op: there is no window-scoped instance to reconcile against.

- `groupId` ≥ 0 and **tracked** by Space X's instance in the tab's window → `assignSpaceTabs(windowId, X, [tabId])` (no-op when already owned; bound tabs are skipped by `assignSpaceTabs` itself). The mid-session mirror of boot's group-aware seeding: a tab dragged into a Space's group in the strip belongs to that Space.
- `groupId` ≥ 0 and **untracked** → release: remove the tab from every instance's `tempTabIds`/`tempTabTitles` in its window. The user took the tab; the sidebar stops listing it.
- `groupId === -1` → no-op. Lunma itself ungroups tabs in normal flows (favorite ungroup, Space deletion, group rebuilds); releasing on ungroup would fight them, and an ungrouped tab's ownership is already handled by existing paths.

This resolves the point-3 question as **un-track at move time**, not tracked-but-unswept: a temp tab listed in the sidebar but living in a user group is a modeling contradiction (clicking it would focus a tab inside a foreign group; Clear would close the user's tabs), and stale `tempTabIds` overlap corrupts restart adoption (D2). Un-tracking is also what makes the repro survive: by restart time the persisted state no longer claims those tabs, so the user's restored group matches no Space and the new boot exclusions leave it whole. Should the SW ever miss the event, D5 heals state at the next boot and D3 protects the group regardless.

*Race with Lunma-initiated regrouping:* Lunma's own `ensureGroupForSpace` rebuilds emit `groupId` changes for a group whose id is recorded via `recordSpaceGroup` synchronously after the await — before the queued `tabs.onUpdated` event drains (the coordinator drains events sequentially; boot-time events are queued until after `reconcileTabGroupsOnBoot`). So by the time `onTabGroupIdChanged` runs, a Lunma-built group is tracked → the "assign to that Space" branch, a no-op for members. Convergence argument for genuinely concurrent grouping (e.g. Chrome's "Add tab to new group" racing Lunma's new-tab grouping): ownership follows the LAST `groupId` event, so the store converges on wherever the tab actually ended up.

*Alternative considered:* `tabGroups.onUpdated`-based detection. Rejected: group-level events do not identify which tab moved; `tabs.onUpdated`'s `changeInfo.groupId` (Chrome 88+) is the per-tab signal and the listener is already registered.

### D7 — Home tabs inside an untracked group are exempt from the sweep

`homeTabIdsInWindow` membership stays as-is, but D3's exclusion applies to the merged member set, so a home tab the user placed in their own group (edge case) is not dragged out. Decision: exempt, for consistency — the user deliberately grouped it, and dragging it out dissolves their group just the same; a home tab in a user group is harmless (it is never listed, and empty-Space activation reconciles home tabs authoritatively). Flagged explicitly as directed: this narrows "the boot pass groups ALL home tabs into the active Space" to "…all home tabs not held by a user group".

### D8 — `cleanUpDuplicateSpaces` untouched; interplay acknowledged

The duplicate-Space cleanup (`tab-group-adoption.ts:459-469`, spec'd by `merge-duplicate-named-spaces`) can permanently delete an emptied duplicate-named Space record. It is NOT the primary destroyer here and its behaviour is spec'd; this change does not alter it. Interplay: the D5/D6 release can make a Space instance emptier, so a duplicate-NAMED Space whose only content was user-grouped tabs can now be dropped by that step — the same outcome as the user closing those tabs, and only ever for duplicate names, so accepted. Unique-named Spaces are never deleted by any boot step.

### D9 — Mid-session physical group-membership joins are explicitly out of scope

Two mid-session paths still physically move a tab into the active Space's Chrome group without checking whether its CURRENT group is a live untracked (user-created) group:

- **`groupNewTab`** (`apps/extension/src/background/group-orchestrator.ts:345`, invoked from `tabs.onCreated`, `chrome-tabs.ts:118`): a brand-new tab is tracked (`onTabCreated`) and grouped into the active Space unconditionally. Chrome's own default behaviour is to place a tab opened via "open link in new tab" (or middle-click) FROM a tab inside a group into that SAME group — so a new tab genuinely born inside the user's group is immediately regrouped into the Space's group by Lunma.
- **`orchestrateActivation`'s and `addTabToSpaceGroup`'s stale-group rebuild** (`group-orchestrator.ts:88,181`): when a Space's own live group is stale/missing, both rebuild the group from the Space's FULL window tab set (`tabIdsForSpaceInWindow`, which includes bound tabs — see D4's scope note) with no exclusion for a member currently sitting in a user's untracked group.

**Decision: leave both as explicit, named gaps, not fixed in this change.** Rationale:

1. **Different trigger, different severity, from the confirmed bug.** The empirically-reproduced, user-reported defect this change targets fires on EVERY SW boot/wake — deterministic, silent, and unconditional. Both D9 paths require an additional deliberate action (opening a new tab from inside the user's group; or a Space switch landing on a Space whose group happens to be stale AND that Space has a bound tab sitting in the user's group) — narrower and less severe.
2. **Fixing `groupNewTab` correctly requires knowing the new tab's OWN starting `groupId`** at creation time, which is available on the `tabs.onCreated` payload but changes `onTabCreated`'s tracking decision, not just its grouping call — a decision this change's task list (`seed-existing-tabs.ts`, `tab-group-adoption.ts`, the two new store mutators, `chrome-tabs.ts`'s `onUpdated` handler) does not budget for touching `onCreated`'s tracking path or `groupNewTab`'s grouping call.
3. **Fixing the rebuild paths requires the same untracked-group exclusion as D3, but applied at a different call site with a different membership source** (`tabIdsForSpaceInWindow` in `group-orchestrator.ts`, not `spaceWindowTabSet` in `tab-group-adoption.ts`) — a second, mid-session sibling fix, best proposed and reviewed as its own change so its scenarios and tests are scoped independently of this restart-focused one.

**Named follow-up:** a future change (tentatively `preserve-user-groups-mid-session`) should extend the same untracked-group exclusion to `groupNewTab` (skip tracking/grouping a tab whose live `groupId` at creation is untracked) and to the two rebuild paths in `group-orchestrator.ts`. Not proposed here to keep this change's diff focused on the confirmed, deterministic boot-destruction defect and its direct mid-session state-honesty counterpart (D6).

## Risks / Trade-offs

- **[Ownership changes silently when the user groups a tab]** A temp tab moved into a user group disappears from the Temporary list. → Intended and honest: the tab is visible in the user's own group in the tab strip; nothing is closed or moved. Dragging it back into the Space's group (or the group dissolving is not required — re-adoption happens on the next tracked-group assignment or tab creation paths) restores tracking via D6's tracked branch.
- **[A tab in an untracked group at boot is left untracked even if the user "meant" it for a Space]** → Lunma cannot distinguish intent; leaving the user's arrangement alone is the conservative default, and the module docstring already promises it. The user can drag the tab into a Space's group (D6 tracks it) at any time.
- **[A missed `tabs.onUpdated` event racing a FULL RESTART can misadopt the user's group]** (D2b) → Unlike a mid-session idle-unload wake (where D5/D3 fully re-derive and protect the group every time), a genuinely lost event immediately preceding a full browser restart leaves stale `tempTabIds` overlap that can bias `matchGroupToSpace` toward the user's group, making it TRACKED for that session (D3/D5 protections no longer apply, since it is no longer "untracked" by definition). Accepted as a documented, narrow-window residual risk (see D2b) rather than widening this change into a `matchGroupToSpace` rewrite — no tab is closed or lost, only mislabelled. A mid-session idle-unload wake (the far more common trigger for "boot" per the Context section) is NOT subject to this risk, since no restart means no session-id reset and no stale overlap is possible.
- **[`assignSpaceTabs` on the D6 tracked branch prepends, possibly reordering]** → It is a no-op for a tab the instance already holds only if implemented as such; the mutator already preserves "moving" semantics — implementation must early-return when the tab is already solely owned by the target (covered by unit tests) to avoid churn.
- **[Repro depends on real Chrome restore timing]** → The e2e mirrors the confirmed repro scripts (persistent context, `--restore-last-session`, settle waits) that already reproduced both variants deterministically.
- **[Mid-session physical group joins outside D6's drag-move case are not fixed]** (D9) → `groupNewTab` and the stale-group rebuild paths can still pull a tab out of / never respect a user's untracked group mid-session. Explicitly scoped out (D9) with a named follow-up change; not a silent gap.
- **[`store.reconcileTabOwnership`'s documented fallback chain is incomplete]** — the base "Boot tab ownership reconciliation" requirement describes only "the instance whose `groupId` matches… else the active instance", but the implementation (`store.svelte.ts:386-391`) also falls back to `holders[0]` (the first holder) when the tab is owned by neither the grouped Space nor the active Space, so a tab is never silently orphaned. This change's spec delta for that requirement folds in the missing fallback step so spec and code agree (pre-existing drift, closed here since the requirement is already being touched).

## Migration Plan

None — no schema change, no data migration. State only shrinks (`tempTabIds` entries released). Rollback is a plain revert; previously released tabs would simply be re-seeded by the old fallback at the next boot.

## Open Questions

None — points 3 (mid-session move: un-track, D6) and 4 (home tabs: exempt, D7) are resolved above.
