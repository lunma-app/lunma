## 1. Store

- [x] 1.1 Change `LunmaStore.reorderTemp` to accept `(windowId, spaceId, tabIds)` and resolve the instance via `spaceInstancesByWindow[windowId]?.[spaceId]` instead of the private `activeInstance(windowId)` helper.
- [x] 1.2 Replace the "filter to present ids, then append any omitted current id" merge with an in-place slot-substitution: only slots whose id participates in the reorder are replaced, in the requested order; every other slot (closed tab, or a tab that arrived after the client's snapshot) keeps its position.
- [x] 1.3 Delete the now-dead private `activeInstance` helper (its only caller was `reorderTemp`).
- [x] 1.4 Add `LunmaStore.promoteTempTab(windowId, spaceId, tabId)` (used by the unrelated `dedup-moves-tab-to-top` change, ships adjacently).

## 2. Wire message + handler

- [x] 2.1 Add `spaceId: SpaceId` to the `reorderTemp` `SidebarCommand` payload type and its Zod schema in `apps/extension/src/shared/bus.ts`.
- [x] 2.2 Update the `reorderTemp` handler in `apps/extension/src/background/handlers/temp-tabs.ts` to destructure and forward `spaceId`.

## 3. Sidebar

- [x] 3.1 Update `TempTabs.svelte`'s drag-drop `reorderTemp` dispatch to include the panel's `spaceId` prop.
- [x] 3.2 Update `TempTabs.svelte`'s `moveTemp` (Move up/down) `reorderTemp` dispatch to include `spaceId`.

## 4. Tests

- [x] 4.1 `store.tabs.test.ts`: update existing `reorderTemp` tests to the new `(windowId, spaceId, tabIds)` signature; add a race-safety test (a tab unshifted to the top after the snapshot stays on top); add a cross-Space scoping test (a background panel's reorder doesn't touch the active Space's order); add `promoteTempTab` test coverage.
- [x] 4.2 `TempTabs.test.ts`: update both `reorderTemp` dispatch-payload assertions (Move down, drag-drop) to expect `spaceId`.
- [x] 4.3 `bus.test.ts`: update the `reorderTemp` fixture payload to include `spaceId`.
- [x] 4.4 `coordinator.handlers.test.ts`: update the `reorderTemp` handler test's dispatched payload to include `spaceId`.

## 5. Verification

- [x] 5.1 `tsc --noEmit` passes with no errors.
- [x] 5.2 `pnpm verify` (typecheck, biome, svelte-check, stylelint, catalog gate, full vitest suite) passes clean.
