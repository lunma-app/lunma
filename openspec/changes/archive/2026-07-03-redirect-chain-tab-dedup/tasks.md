## 1. Initial-load tracking

- [x] 1.1 Add `apps/extension/src/background/initial-load-tabs.ts`: a session-scoped `Set<TabId>` with `markInitialLoad`, `isInitialLoad`, `clearInitialLoad`, and a test-only `resetInitialLoadTabs`.
- [x] 1.2 Mark a tab in `tabs.onCreated` (any non-home, non-lens tab) in `handlers/chrome-tabs.ts`.
- [x] 1.3 Clear a tab's mark on its first `status: 'complete'` in `tabs.onUpdated`, captured BEFORE that same event's dedup eligibility check reads it.
- [x] 1.4 Clear a tab's mark in `tabs.onRemoved` (bounded cleanup for a tab that closes — via dedup or otherwise — before ever completing).

## 2. Widen navigation-dedup eligibility

- [x] 2.1 Add an `excludeTabId` parameter to `findTabInActiveSpace` (`handlers/queries.ts`) that skips one tab id from both the temp-tab and bound-tab search.
- [x] 2.2 Broaden `tabs.onUpdated`'s adoption/dedup guard from `!isTrackedTab(...)` to `!isBound && (!isTrackedTab(...) || wasInitialLoad)`, resolving `isBound` via `savedTabIdForBoundTab`.
- [x] 2.3 Pass `excludeTabId: tabId` (the navigating tab's own id) at the navigation-dedup `findTabInActiveSpace` call site.

## 3. Diagnostics

- [x] 3.1 Add `log.debug` on the onCreated-time dedup "no match found" path, logging `tabId`, `windowId`, `resolvedUrl`.
- [x] 3.2 Add `log.debug` on the navigation-dedup "no match found" path, logging `tabId`, `windowId`, `navigatedUrl`.

## 4. Tests

- [x] 4.1 `initial-load-tabs.test.ts`: mark/clear/reset/independent-per-tab coverage.
- [x] 4.2 `queries.test.ts`: `excludeTabId` skips a matching temp tab and a matching bound tab.
- [x] 4.3 `coordinator.handlers.test.ts`: new "redirect-chain tab dedup" describe block — dedup fires before first `complete`, does NOT fire after first `complete` (later re-navigation), a bound tab is never eligible, `dedupNewTabNavigations` off disables this path too. Added a file-level `resetInitialLoadTabs()` `beforeEach` (module-level, outside any single `describe`) since the module's session-scoped state would otherwise leak across tests that reuse small tab ids through real `tabs.onCreated`/`tabs.onUpdated` dispatches.

## 5. Verification

- [x] 5.1 `tsc --noEmit` passes with no errors.
- [x] 5.2 `pnpm verify` (typecheck, biome, svelte-check, stylelint, catalog gate, full vitest suite) passes clean.
