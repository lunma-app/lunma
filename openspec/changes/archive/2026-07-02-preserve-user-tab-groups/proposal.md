# Proposal: preserve-user-tab-groups

## Why

Lunma currently **destroys user-created native Chrome tab groups on every service-worker boot** — browser launch AND every mid-session MV3 idle-unload wake (~30s of inactivity). The user's group is drained tab-by-tab into the active Space's group, and Chrome auto-dissolves the emptied group: the group the user hand-built simply vanishes, its tabs confiscated into a Lunma Space. This is data-loss-adjacent and trust-destroying, and because a wake is often triggered by the user's own click, it looks like "my groups dissolve when I touch them." Empirically reproduced against the built extension (commit `9345e66`) in a Playwright-driven Chromium across a `--restore-last-session` restart, in two variants (a user group with the same title/colour as the Space's group, and a differently-named orange "Mine" group): in BOTH variants only one group survives — title/colour collision is irrelevant; ANY user native group is destroyed.

The confirmed root cause is three composing pieces:

1. `apps/extension/src/background/seed-existing-tabs.ts` (`seedExistingTabs`, lines 73–85): at every SW boot, a tab whose live `groupId` maps to NO tracked Space instance (i.e. a user-created native group) falls back to `store.onTabCreated` and is adopted into the window's active Space's `tempTabIds`.
2. `apps/extension/src/background/tab-group-adoption.ts` (`materializeActiveGroups`, lines 380–384): the boot stray-sweep computes the active Space's membership (temp + bound tabs + every home tab in the window) and sweeps every member NOT already in the Space's live group INTO it (`ensureGroupForSpace(windowId, stray, live.id)`) — physically dragging tabs out of the user's live group.
3. Chrome dissolves a tab group when its last tab leaves, so the user's group visibly disappears.

The module's own docstring promises the pass "NEVER converts an untracked (user-created) group into a Space", and `trackedGroupIdsForWindow` exists so "user-created groups are never collapsed" — but the invariant only protects the group OBJECT (never adopted/retitled/collapsed), not its TAB MEMBERSHIP. This change closes that gap: tabs sitting in a user-created group are off-limits to Lunma's boot passes too.

## What Changes

- **Boot seeding leaves user-group tabs alone.** `seedExistingTabs` skips (does not seed, like home tabs) any tab whose live Chrome `groupId` is ≥ 0 but maps to no Space instance in its window — it stays untracked. Ungrouped tabs and tabs in tracked groups keep today's behaviour exactly.
- **The boot stray-sweep excludes user-group members.** `materializeActiveGroups` sweeps into the active Space's live group only members that are ungrouped, in the Space's own dead/stale group, or in another **tracked** group. A member whose current live group is untracked (per the boot `tabGroupById` map and `trackedGroupIdsForWindow`, evaluated post-adoption) is never dragged out. Home tabs sitting inside an untracked group are exempt too (the exclusion applies uniformly to the merged member set).
- **Boot releases temp tabs held in untracked groups.** A new state-only step in `reconcileTabGroupsOnBoot` — after adoption (so restored tracked groups have re-bound ids), before materialization — removes from every instance's `tempTabIds` any tab whose live group is untracked, keeping the sidebar honest: a tab living in the user's group is the user's, not a Space's temporary tab.
- **Mid-session moves into a user group un-track the tab.** The `tabs.onUpdated` handler gains `changeInfo.groupId` handling: a temp tab moved into an untracked group is released from its Space's `tempTabIds`; a tab moved into a tracked group is assigned to that group's Space (the mid-session mirror of boot's group-aware seeding); a move to ungrouped (`-1`) changes nothing (Lunma itself ungroups tabs in normal flows).
- **NOT changed:** `cleanUpDuplicateSpaces` (the related-but-distinct secondary from `merge-duplicate-named-spaces` — it can permanently delete an emptied duplicate-named Space record, but it is not the primary destroyer and its behaviour is spec'd); adoption/`matchGroupToSpace`; fresh-install conversion; bound (pinned/saved) tab **records** — a bound tab whose live tab the user moved into their own group stays bound but is excluded from the sweep (see design.md D4, boot-only). **Also not fixed here (explicit residual gaps, see design.md D9):** mid-session physical group joins via `groupNewTab` (a brand-new tab Chrome places inside a user's group is still forcibly regrouped into the active Space) and via `orchestrateActivation`'s/`addTabToSpaceGroup`'s stale-group rebuild (can still drag a bound tab out of a user's group) — named as a follow-up change, tentatively `preserve-user-groups-mid-session`.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `spaces-and-tabs`:
  - **Boot adoption of already-open tabs into the temporary list** — adds the untracked-group exclusion to seeding.
  - **Boot tab ownership reconciliation** — the "Group-aware seeding" fall-back is narrowed: only *ungrouped* tabs fall back to the active Space; a tab in an unmapped live group is left untracked.
  - **Boot reconciliation of tab groups** — the materialization stray-sweep excludes untracked-group members; a new release step strips untracked-group tabs from `tempTabIds` after adoption; the source-of-truth invariant is strengthened to cover tab membership, not just the group object.
  - **Lunma new-tab page is the empty-Space home** — the "Boot groups ALL home tabs" scenario gains the untracked-group exemption (a home tab in a user's group is not swept out of it).
  - **Chrome tab-group lifecycle reconciliation (backend contract)** — extended (as a new sibling requirement) with mid-session `tabs.onUpdated` `groupId`-change ownership reconciliation.

## Impact

- **Code:**
  - `apps/extension/src/background/seed-existing-tabs.ts` — seeding exclusion.
  - `apps/extension/src/background/tab-group-adoption.ts` — sweep exclusion in `materializeActiveGroups`; call the new release step in `reconcileTabGroupsOnBoot`.
  - `apps/extension/src/shared/store.svelte.ts` — two new synchronous chrome-free mutators (the only new public members this change introduces):
    - `releaseTabsInUntrackedGroups(tabGroupById: ReadonlyMap<TabId, number>): void` (boot release step)
    - `onTabGroupIdChanged(tabId: TabId, groupId: number): void` (mid-session ownership reconciliation)
  - `apps/extension/src/background/handlers/chrome-tabs.ts` — `tabs.onUpdated` handler forwards `changeInfo.groupId` to `store.onTabGroupIdChanged`.
  - Tests: `seed-existing-tabs.test.ts`, `tab-group-adoption.test.ts`, store tests, `handlers`/coordinator tests.
  - **New file:** `apps/extension/e2e/user-group-survives-restart.spec.ts` — a Playwright e2e mirroring the confirmed repro (native group built from tracked tabs survives a context relaunch with its tabs intact), covering both confirmed variants (same-title/same-colour; differently-named/coloured).
- **No new dependencies, UI surfaces, or `src/ui` primitives** — background/store behaviour only (plus the one e2e test file above), so no `Visual language` section and no primitive/story obligations.
- **Docs:** `docs/architecture.md` — the "Boot order", `seedExistingTabs`, and "Boot group reconciliation" sections and the `tabs.onUpdated` listener description are updated to describe the exclusions, the release step, and the `groupId`-change handling. No other `docs/` files are touched (`docs/tech-stack.md`, `docs/adr/`, `docs/lenses-vision.md`, `docs/releasing.md` unaffected).
- **Data/migrations:** none — no schema change; `tempTabIds` shrinks are ordinary state mutations.
