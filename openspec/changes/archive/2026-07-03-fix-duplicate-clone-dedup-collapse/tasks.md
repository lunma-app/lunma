## 1. Reproduce

- [x] 1.1 Write a failing regression test: dispatch `duplicateTab`, let the clone's `tabs.onCreated` land, then dispatch a later `tabs.onUpdated` for the clone carrying its (unchanged) URL before `status: 'complete'` — assert it does NOT get focused/closed against its source. Confirmed RED against pre-fix code (the clone WAS dedup-collapsed, matching the reported symptom).

## 2. Fix

- [x] 2.1 In `chrome-tabs.ts`'s `tabs.onCreated`, call `clearInitialLoad(tab.id)` immediately after `insertTempTabAfter` in the duplicate-placement branch, exempting the clone from the redirect-chain-tab-dedup eligibility window for good.

## 3. Verify

- [x] 3.1 The regression test from step 1.1 passes (GREEN).
- [x] 3.2 `tsc --noEmit` passes with no errors.
- [x] 3.3 `pnpm verify` (typecheck, biome, svelte-check, stylelint, catalog gate, full vitest suite) passes clean.
