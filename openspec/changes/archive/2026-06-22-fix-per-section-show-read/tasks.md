## 1. Implementation

- [x] 1.1 Add `revealedReadSmartSectionsByWindow` to `SidebarLocalState` in `apps/extension/src/shared/types.ts` (mirror `collapsedSmartSectionsByWindow`).
- [x] 1.2 Add `setSmartSectionRevealRead(windowId, folderId, sourceKey, revealed)` to the store (sidebar-local, mirror `setSmartSectionCollapsed`).
- [x] 1.3 In `apps/extension/src/sidebar/SmartFolder.svelte`, add `isSectionReadRevealed` + `sectionHidesRead(sk)`; route the footer toggle to `toggleSectionRead(sk)` (calls the store), and use `sectionHidesRead` in the read-row `collapsed` flag, the footer label/title, and the empty-note.

## 2. Tests

- [x] 2.1 Update the peek tests in `apps/extension/src/sidebar/SmartFolder.test.ts` to assert in-place reveal (no folder-wide dispatch).
- [x] 2.2 Add a test: a two-feed folder where revealing one section leaves the other drained (per-window, per-section).

## 3. Spec & verify

- [x] 3.1 Confirm the `smart-folders` delta re-specs the peek as per-section + per-window + sidebar-local (drafted in this change's `specs/`).
- [x] 3.2 Run `pnpm --filter @lunma/extension verify` and ensure green.
