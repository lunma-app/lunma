## Why

Duplicating a temporary tab currently lands the clone at the top of the
Temporary list, like any other newly-created tab — not next to the tab it
was duplicated from. This is directly user-felt and counter to what
"Duplicate" means: a copy of *this* tab, right here, not a new unrelated
tab that happens to share its URL. If the source tab isn't already at the
top (the common case in a list with more than one tab), duplicating it
separates the clone from its source and reorders the list in a way the
user didn't ask for.

## What Changes

- A `duplicateTab` clone is now inserted immediately after its source tab
  in `tempTabIds`, instead of the ordinary newest-first top-of-list every
  other new tab gets. Falls back to top-of-list if the source is no longer
  present by the time the clone lands (e.g. closed in the brief window
  between the duplicate being issued and the clone's `tabs.onCreated`
  firing).
- The pending-duplicate correlation record (`pending-duplicate-tabs.ts`,
  already used to exclude a clone from onCreated-time dedup) now also
  carries the source tab's id, and is consumed unconditionally (not gated
  on the `dedupNewTabNavigations` setting, unlike the dedup lookup it also
  informs) — the clone's placement should not depend on whether dedup
  itself is enabled.
- New `LunmaStore.insertTempTabAfter(windowId, afterTabId, tabId)`.
- No new UI, no new setting.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `tab-dedup`: the "duplicateTab-created tabs are excluded from
  onCreated-time dedup" and "duplicateTab command handler duplicates the
  tab via Chrome API" requirements gain the adjacent-placement behavior;
  the pending-duplicate record's shape and consumption gating are updated
  accordingly.

## Impact

- Code: `apps/extension/src/background/handlers/pending-duplicate-tabs.ts`
  (record gains `sourceTabId`; `consumePendingDuplicateTab` returns `TabId |
  null` instead of `boolean`), `apps/extension/src/background/handlers/temp-tabs.ts`
  (`duplicateTab` passes its `tabId` to `markPendingDuplicateTab`),
  `apps/extension/src/background/handlers/chrome-tabs.ts` (`tabs.onCreated`
  consumes the record unconditionally when a URL is present, and calls the
  new `insertTempTabAfter` instead of `onTabCreated` when a duplicate
  source is found), `apps/extension/src/shared/store.svelte.ts` (new
  `insertTempTabAfter`).
- Tests: `apps/extension/src/background/handlers/pending-duplicate-tabs.test.ts`
  (new — direct coverage of the module's mark/consume/TTL/reset behavior),
  `apps/extension/src/shared/store.tabs.test.ts` (new `insertTempTabAfter`
  suite), `apps/extension/src/background/coordinator.handlers.test.ts`
  (new adjacent-placement + fallback tests; updated one existing test whose
  expectation assumed the old top-of-list placement).
- `docs/`: no narrative doc changes.
- No new dependencies, no data migration.
