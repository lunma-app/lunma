## 1. Failing-first regression tests

- [x] 1.1 Add a regression test to `apps/extension/src/shared/migrations.test.ts` (or `migrations.robustness.test.ts`) that runs the chain on a v12 envelope whose lens has all-malformed embedded sources, asserting the migrated `pinnedBySpace` drops only the bad lens (keeps valid nodes in s1 and s2) and the result parses under `AppStateV14Schema`. Confirm it FAILS before the fix.
- [x] 1.2 Add a regression test for the pre-v8 flat smart node missing `baseUrl`, asserting the resulting (invalid) lens node is dropped and the state parses under `AppStateV14Schema`. Confirm it FAILS before the fix.
- [x] 1.3 Add a salvage regression test to `apps/extension/src/shared/chrome/storage.test.ts`: a `pinnedBySpace` of `{ s1: [ <valid tab>, <invalid node> ], s2: [ <valid lens> ] }` salvages to keep the valid tab in s1 and the valid lens in s2 (not an empty `pinnedBySpace`). Confirm it FAILS before the fix.

## 2. Migration chain — terminal normalization (D1)

- [x] 2.1 Add a private `normalizePinnedNodes(state: unknown): unknown` in `apps/extension/src/shared/migrations.ts` that, when `state.pinnedBySpace` is a record, rebuilds it dropping any node failing `PinNodeSchema.safeParse(node)` (order preserved; empty arrays kept; non-array Space values left untouched for downstream handling). Keep the ORIGINAL node objects — do not substitute parsed/defaulted nodes.
- [x] 2.2 Import `PinNodeSchema` from `./schemas` into `migrations.ts` and call `normalizePinnedNodes` at the end of `runMigrations`, unconditionally (also when `persistedVersion === CURRENT_SCHEMA_VERSION`).
- [x] 2.3 Verify the `architecture-integrity` gate: `migrations.ts` → `schemas.ts` import stays within `shared/` (no `biome check` `noRestrictedImports` / `noImportCycles` violation).

## 3. Salvage — element-wise container slices (D2)

- [x] 3.1 Add a typed helper in `chrome/storage.ts` exposing the per-element schemas: `AppStateV14Schema.shape.pinnedBySpace.valueType.element` (PinNode — Zod 4 record value accessor is `.valueType`), `.shape.savedTabs.valueType`/`.shape.trash.valueType`, and `.shape.archivedTabs.element`.
- [x] 3.2 In `salvagePersistedState`, salvage `pinnedBySpace` element-wise: rebuild the record, keep each node that validates, drop invalid nodes, drop non-array Space values.
- [x] 3.3 Salvage `savedTabs` and `trash` element-wise (drop invalid entries by key) and `archivedTabs` element-wise (filter invalid elements). Leave all remaining slices slice-wise as today.
- [x] 3.4 Confirm the assembled object still re-validates against `AppStateV14Schema` and returns `null` only when truly unsalvageable (non-object input).

## 4. Verify & document

- [x] 4.1 Un-skip / re-run the section 1 regression tests; confirm they now PASS.
- [x] 4.2 Run `pnpm --filter @lunma/extension verify` (tsc, biome incl. layer DAG, svelte-check, stylelint, catalog gate, vitest) — all green.
- [x] 4.3 Run `openspec validate harden-migration-salvage --strict` and fix any artifact issues.
- [x] 4.4 Confirm no `docs/` change is required (the contract lives in the `storage-and-migrations` spec); if implementation reveals otherwise, raise via AskUserQuestion and update docs + artifacts in this change before marking done.
