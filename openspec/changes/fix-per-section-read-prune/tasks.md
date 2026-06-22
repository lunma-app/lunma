## 1. Implementation

- [x] 1.1 Change `pruneSmartReadState` in `apps/extension/src/shared/store.svelte.ts` to `pruneSmartReadState(folderId: FolderId, sectionKey: string, liveIds: string[])`; filter with `read.filter((id) => !id.startsWith(`${sectionKey}:`) || live.has(id))`, keeping the existing early-return and empty-entry-delete behaviour. Update the JSDoc to state the prune is per-section.
- [x] 1.2 Update the `smartFolders.result` call site in `apps/extension/src/background/handlers/smart-folders.ts` (~line 429) to pass `sk`: `ctx.store.pruneSmartReadState(folderId, sk, runtime.items.map((i) => `${sk}:${i.id}`))`.

## 2. Tests

- [x] 2.1 Update the two existing `pruneSmartReadState` tests in `apps/extension/src/shared/store.smart-folders.test.ts` (~lines 249, 261) to the new signature (pass the section key; ensure ids carry that section's prefix).
- [x] 2.2 Add a test: a folder with read ids in section A and section B; a section-B `ok` prune drops only absent B ids and leaves A's read ids intact. (This is the regression guard — it fails on the old folder-wide prune.)
- [x] 2.3 Add/confirm a single-section parity test: prune still drops that section's stale ids (no behaviour change for one-section folders).

## 3. Spec & verify

- [x] 3.1 Confirm the `storage-and-migrations` delta spec reflects the per-section prune (already drafted in this change's `specs/`).
- [x] 3.2 Run `pnpm --filter @lunma/extension verify` (tsc, biome incl. layer DAG, svelte-check, lint:styles, vitest) and ensure green.
