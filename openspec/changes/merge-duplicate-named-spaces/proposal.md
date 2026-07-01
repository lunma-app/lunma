## Why

A user reported a Space switcher cluttered with several unnumbered "Default"
pills. That specific symptom was root-caused to a since-archived bug
(`gate-fresh-install-on-clean-read`): a storage-corruption/salvage boot read
was misclassified as a genuine fresh install, so the boot-time tab-group
conversion pass re-minted "Default"/"Group N" Spaces from the user's live
Chrome groups on every such boot. That fix is merged; targeted repro testing
against current `main` (task 6.1) confirmed the unnumbered-duplicate shape no
longer reproduces through any boot-timing or reinstall-from-new-path path
tried — every path either folds correctly via title/colour or produces a
*numbered* rename via the existing self-heal.

That numbered rename is where a real, smaller gap remains. Lunma's load-path
self-heal (`dedupePersistedState`) only **renames** a same-named collision
("Default" → "Default 2" → "Default 3" …) — it never removes one, even when
the later member is empty (holds no tabs). An accidental empty duplicate —
however it arises (a race, a future regression, manual state editing) —
therefore survives forever as a meaningless numbered pill with nothing for the
user to lose by its removal. This change makes the switcher reflect the
user's real, distinct workspaces: an empty duplicate is removed outright
instead of accumulating as permanent clutter, closing that gap pre-emptively
rather than waiting for it to surface as its own user-visible bug.

## What Changes

- `apps/extension/src/shared/space-names.ts`: add a pure
  `groupDuplicateSpaceNames(spaces)` helper that partitions `state.spaces`
  into normalized-name collision groups (order-preserving, mirrors
  `normalizeSpaceName`already used by `disambiguateSpaceName`).
- `apps/extension/src/shared/space-empty.ts` (new file): add a pure
  `isSpaceEmpty(state, spaceId)` predicate — "no pinned tabs for this Space
  and no temp tabs for it in any window instance" — factored out of
  `LunmaStore.removeEmptySpace`'s existing inline check so both the store and
  the plain-state read path share one definition of "empty".
- `apps/extension/src/shared/store.svelte.ts`: `removeEmptySpace` delegates
  its emptiness check to the new `isSpaceEmpty` (behaviour unchanged).
- `apps/extension/src/shared/chrome/storage.ts` (`dedupePersistedState`):
  for each normalized-name collision group, if exactly one member is
  non-empty, keep it under its original name and drop every empty member of
  the group outright (no rename). If a group has zero or two-or-more
  non-empty members, keep today's behaviour unchanged — the first member
  keeps its name, every later member is disambiguated-and-kept via
  `disambiguateSpaceName` (never silently merges Spaces that both hold real
  content).
- `apps/extension/src/background/tab-group-adoption.ts`
  (`reconcileTabGroupsOnBoot`): run the same collision-group cleanup as a
  final step, after adoption/materialization/favorite-ungroup, over the live
  `store.state.spaces` (via `store.removeEmptySpace`), so an empty duplicate
  exposed only after the boot's one-shot `chrome.tabGroups.query({})` (e.g. a
  window that finishes restoring later) is still caught before the boot
  broadcast, not left until the next full reload.
- `docs/architecture.md`: no changes (no new layer/module boundary — new file
  sits in `shared/`, importable by both `shared` and `background`).
  `docs/tech-stack.md`: untouched.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `spaces-and-tabs`: "Space names are unique" — the load-path self-heal
  (item 4) changes from unconditional rename to empty-aware removal-or-rename
  per collision group. "Boot reconciliation of tab groups" — gains a final
  duplicate-cleanup step, run every boot (not just fresh-install), that
  removes empty Spaces left duplicate-named after adoption/materialization.

## Impact

- Affected specs: `spaces-and-tabs` (`Space names are unique`,
  `Boot reconciliation of tab groups`).
- Affected code: `apps/extension/src/shared/space-names.ts` (new export),
  `apps/extension/src/shared/space-empty.ts` (new file),
  `apps/extension/src/shared/store.svelte.ts` (`removeEmptySpace` refactor,
  no behaviour change), `apps/extension/src/shared/chrome/storage.ts`
  (`dedupePersistedState`), `apps/extension/src/background/tab-group-adoption.ts`
  (`reconcileTabGroupsOnBoot`).
- No schema/migration change. Behaviour change is narrowing/additive for the
  read-path self-heal (fewer surviving empty duplicates; a collision group
  with two-or-more content-holding members is untouched) and purely additive
  for the boot pass (a new no-op-when-nothing-duplicate final step).
- Out of scope: opportunistically adopting an untracked, same-titled native
  Chrome group that was never converted into a Space at all — doing so would
  narrow the existing "an untracked user group is never adopted" invariant
  and needs its own design/user sign-off. Also out of scope: pinning down
  which specific lifecycle trigger(s) mint the extra empty Default in the
  first place (tracked separately) — this change makes any such duplicate
  self-heal regardless of trigger, rather than chasing each trigger.
