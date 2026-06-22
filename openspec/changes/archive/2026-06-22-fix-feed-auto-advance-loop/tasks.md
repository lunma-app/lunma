## 1. Implementation

- [x] 1.1 In `apps/extension/src/shared/store.svelte.ts`, guard `nextUnreadFeedItemAfterClose`: after the feed-folder check, `return undefined` when the closing namespaced id is already in `smartReadState[folderId]` (consume=close, not a manual close). Update the JSDoc.
- [x] 1.2 Remove the temporary `[BUG2]` diagnostic (and its `onMount`/`onDestroy`/`log` imports) from `apps/extension/src/sidebar/SmartFolder.svelte`.

## 2. Tests

- [x] 2.1 Add a `nextUnreadFeedItemAfterClose` test in `apps/extension/src/shared/store.smart-folders.test.ts`: a bound closing item that is already read yields `undefined` (the regression guard — fails on the pre-fix code, which returned the next item).

## 3. Spec & verify

- [x] 3.1 Confirm the `smart-folders` delta documents auto-advance + the consume=close-no-advance rule (drafted in this change's `specs/`).
- [x] 3.2 Run `pnpm --filter @lunma/extension verify` and ensure green.
