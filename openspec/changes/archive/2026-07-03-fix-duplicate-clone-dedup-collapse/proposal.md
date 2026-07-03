## Why

Duplicating a temp tab silently did nothing: the clone was created, then
immediately closed again by dedup, and the ORIGINAL tab got promoted to
the top of the Temporary list (via `dedupMovesTabToTop`) — so from the
user's perspective, clicking "Duplicate" just moved the existing tab to
the top and produced no second tab at all. This is a regression from the
interaction of two earlier changes, each correct in isolation:
`redirect-chain-tab-dedup` widened the `tabs.onUpdated` dedup check to
also catch a tab that is TRACKED but hasn't reached `status: 'complete'`
yet (not just fully untracked tabs, closing a gap for redirected links);
`duplicate-tab-adjacent-placement` tracks a `duplicateTab` clone
immediately at creation (to place it next to its source) — which means
the clone is now, itself, "tracked but not yet complete," exactly the
condition the widened check targets. A later `tabs.onUpdated` event for
the clone (e.g. Chrome re-confirming its URL while it finishes restoring,
before ever reaching `complete`) matched the clone's still-open SOURCE
tab (the `excludeTabId` guard only prevents the clone matching *itself*,
not its source) and dedup-collapsed it.

## What Changes

- A `duplicateTab` clone is now permanently exempted from the redirect-chain
  eligibility window the moment it's placed: `tabs.onCreated` clears its
  `initial-load` mark right after `insertTempTabAfter`, so no later
  `tabs.onUpdated` event can ever treat it as dedup-eligible — the same
  guarantee a bound/pinned tab already has, extended to a deliberate clone.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `tab-dedup`: the "duplicateTab-created tabs are excluded from
  onCreated-time dedup" requirement is extended — the exclusion now covers
  the clone's entire initial-load window, not only the one-time
  `tabs.onCreated` check.

## Impact

- Code: `apps/extension/src/background/handlers/chrome-tabs.ts` (`tabs.onCreated`
  clears the clone's `initial-load` mark immediately after placement).
- Tests: `apps/extension/src/background/coordinator.handlers.test.ts` (new
  regression test: a later `onUpdated` event for the clone must not
  dedup-collapse it into its source).
- `docs/`: no narrative doc changes.
- No new dependencies, no data migration.
