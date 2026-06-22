## 1. Implementation

- [x] 1.1 In `apps/extension/src/sidebar/SmartFolder.svelte`, change `feedWindowForSection`'s cutoff to `max(throughUnreadBudget, peekCutoff)`: span through the newest `maxItems` unread (all when fewer) while still covering the first `maxItems` rows for the read peek. No-unread case keeps `peekCutoff`.

## 2. Tests

- [x] 2.1 Add a regression test in `apps/extension/src/sidebar/SmartFolder.test.ts`: a feed whose newest items are read and whose fewer-than-budget older items are unread renders all the unread (badge and list agree).

## 3. Spec & verify

- [x] 3.1 Confirm the `smart-folders` delta adds the unread-behind-read scenario (drafted in this change's `specs/`).
- [x] 3.2 Run `pnpm --filter @lunma/extension verify` and ensure green.
