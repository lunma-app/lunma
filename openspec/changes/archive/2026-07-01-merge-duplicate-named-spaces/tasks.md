## 1. Shared helpers

- [x] 1.1 `apps/extension/src/shared/space-empty.ts` (new file): add
  `isSpaceEmpty(state, spaceId)`, extracted from `LunmaStore.removeEmptySpace`'s
  existing inline check (no `pinnedBySpace` entries, no `tempTabIds` in any
  window instance).
- [x] 1.2 `apps/extension/src/shared/space-names.ts`: add
  `groupDuplicateSpaceNames(spaces)`, returning normalized-name collision
  groups (size ≥ 2) in first-seen order.
- [x] 1.3 Unit tests for both: `isSpaceEmpty` (empty / pinned-only /
  temp-tab-only / both), `groupDuplicateSpaceNames` (no collisions, one
  group, multiple groups, case/whitespace-insensitive grouping, order
  preservation).

## 2. Store refactor (no behaviour change)

- [x] 2.1 `apps/extension/src/shared/store.svelte.ts`: `removeEmptySpace`
  delegates its emptiness check to `isSpaceEmpty`.
- [x] 2.2 Existing `removeEmptySpace` tests still pass unmodified (behaviour
  parity check).

## 3. Load-path self-heal: empty-aware resolution

- [x] 3.1 `apps/extension/src/shared/chrome/storage.ts`
  (`dedupePersistedState`): replace unconditional rename with the
  group → partition → resolve flow (exactly-one-non-empty drops empties;
  all-empty keeps first, drops rest; two-or-more-non-empty keeps today's
  rename-and-keep-all). Dropped Spaces' `spaceInstancesByWindow` /
  `activeSpaceByWindow` / `lastActivatedSpaceId` references redirected the
  same way `removeEmptySpace` redirects them.
- [x] 3.2 Tests: empty duplicate dropped (not renamed); all-empty group keeps
  first, drops rest; two-content-holding-Spaces group still renames exactly
  as before (regression for the existing scenario); idempotency (second run
  over the healed state changes nothing further); `changed` flag set
  correctly for both drop and rename outcomes.

## 4. Boot-time cleanup

- [x] 4.1 `apps/extension/src/background/tab-group-adoption.ts`
  (`reconcileTabGroupsOnBoot`): after `ungroupRestoredFavorites`, run
  `groupDuplicateSpaceNames(store.state.spaces)` → partition via
  `isSpaceEmpty` → `store.removeEmptySpace(id)` for every id the
  exactly-one-non-empty / all-empty resolutions mark as a drop. Groups
  resolved as two-or-more-non-empty are left untouched (no rename at boot).
- [x] 4.2 Tests: a duplicate exposed only after the boot's group query is
  removed before the broadcast (mirrors the design's window-restore-race
  scenario); a two-content-holding-Spaces pair is left untouched by this
  step; the step is a no-op when `state.spaces` has no collisions; the last-
  remaining-Space guard on `removeEmptySpace` is exercised (impossible in
  practice per design's Risks section, but assert the no-op).

## 5. Spec + gates

- [x] 5.1 `specs/spaces-and-tabs/spec.md`: already drafted in this change as
  the `MODIFIED Requirements` delta for "Space names are unique" and "Boot
  reconciliation of tab groups" — no further edits expected during
  implementation; update only if implementation forces a deviation (raise via
  AskUserQuestion first, per the deviations policy).
- [x] 5.2 `pnpm verify` green at the workspace root.

## 6. Manual verification

- [x] 6.1 Reproduced via automated boot-sequence tests against current `main`
  (post-`gate-fresh-install-on-clean-read` archive), not a live pre-fix
  build. Result: the reported unnumbered-duplicate shape does not reproduce —
  see design.md "Open Questions (resolved)". Proceeding on the revised,
  narrower framing (empty numbered-duplicate cleanup) rather than the
  original screenshot-driven one.
