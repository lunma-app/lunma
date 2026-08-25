## 1. Fix the capture (RED first)

- [x] 1.1 Add failing handler tests: an empty mirror `url` mints Chrome's URL; a populated mirror `url` mints it WITHOUT calling `chrome.tabs.get`; a failed/URL-less resolution still creates and places the record
- [x] 1.2 Make `pinTab` async in `background/handlers/pinned-tabs.ts` and resolve `url`/`title` from `chrome.tabs.get(tabId)` only when the mirror's `url` is empty
- [x] 1.3 Confirm no other handler or test depended on `pinTab` being synchronous

## 2. Remove the scaffolding the defect forced

- [x] 2.1 Delete `selectOnUntilChipSeeds`'s `toPass` retry loop in `apps/extension/e2e/boundary.spec.ts` — a single "On" click must seed the chip
- [x] 2.2 Delete the pre-drag `expect.poll` URL gate in `pinSite`, and the comments explaining both workarounds
- [x] 2.3 Confirm the spec's own scenarios still describe the test's behaviour

## 3. Verify

- [x] 3.1 `pnpm verify` at the workspace root is green
- [x] 3.2 `pnpm test:e2e` is green locally
- [ ] 3.3 A repeat-heavy CI run of the boundary test (≥25×, retries=0) is green — the same harness that reproduced 4/25 before the fix
- [x] 3.4 `openspec validate resolve-pin-url-at-mint --strict` passes
