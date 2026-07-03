## 1. Pending-duplicate record

- [x] 1.1 Add `sourceTabId: TabId` to `PendingDuplicate` in `pending-duplicate-tabs.ts`.
- [x] 1.2 Change `markPendingDuplicateTab` to accept and store `sourceTabId`.
- [x] 1.3 Change `consumePendingDuplicateTab`'s return type from `boolean` to `TabId | null`, returning the consumed record's `sourceTabId`.

## 2. Call sites

- [x] 2.1 `temp-tabs.ts`'s `duplicateTab` handler passes its own `tabId` as `sourceTabId` to `markPendingDuplicateTab`.
- [x] 2.2 `chrome-tabs.ts`'s `tabs.onCreated`: consume the pending record unconditionally whenever a resolved URL is present (no longer gated behind `dedupNewTabNavigations()`); skip the dedup gate when a source id is returned; call the new `insertTempTabAfter` instead of `onTabCreated` when a duplicate source is found.

## 3. Store

- [x] 3.1 Add `LunmaStore.insertTempTabAfter(windowId, afterTabId, tabId)`: same guards as `onTabCreated` (bound-tab no-op, already-present no-op, per-window ownership claim), splices after `afterTabId`'s index, falls back to `unshift` (top-of-list) when `afterTabId` isn't found.

## 4. Tests

- [x] 4.1 `pending-duplicate-tabs.test.ts` (new): mark/consume/no-match/wrong-window/wrong-url/reset/TTL-expiry coverage.
- [x] 4.2 `store.tabs.test.ts`: new `insertTempTabAfter` suite (middle insertion, end insertion, fallback-to-top, idempotent, bound-tab no-op, no-instance no-op, sibling-instance eviction).
- [x] 4.3 `coordinator.handlers.test.ts`: new "clone lands immediately after its source" and "falls back to top-of-list when source is closed" tests; updated the existing "pending-duplicate record is consumed once" test's expectation to match the new adjacent placement (findTabInActiveSpace now hits the source tab first, not the clone).

## 5. Verification

- [x] 5.1 `tsc --noEmit` passes with no errors.
- [x] 5.2 `pnpm verify` (typecheck, biome, svelte-check, stylelint, catalog gate, full vitest suite) passes clean.
