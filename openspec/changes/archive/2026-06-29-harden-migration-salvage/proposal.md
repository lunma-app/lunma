## Why

Users have reported losing their entire pinned tree (all tabs, folders, and lenses across every Space) after updating the extension — while their Space list survives. This is a data-loss bug the user feels directly: a single legacy or malformed `PinNode` poisons whole-state validation, and the salvage fallback — which is element-wise only for `spaces` — resets the entire `pinnedBySpace` (and `savedTabs` / `archivedTabs` / `trash`) slice to empty. The loss is silent: no throw, schema validation "succeeds" on the reset state, and the boot self-heals the wipe back to disk.

Both halves are reproduced against current `main` with concrete fixtures:

1. The **v13 migration** drops malformed source entries and can leave a `kind: 'lens'` node with `sources: []`; the v8/chain path can leave a former-`smart` node as a `lens` with **no `sources` field at all** (e.g. a pre-v8 flat smart node that was saved without a `baseUrl`). `PinNodeSchema`'s lens branch requires `sources: z.array(LensSourceRefSchema).min(1)`, so such a node fails the current-version parse.
2. `salvagePersistedState` salvages `pinnedBySpace`, `savedTabs`, `archivedTabs`, and `trash` **slice-wise** (all-or-nothing). One invalid element discards the whole slice — losing valid data in unrelated Spaces.

## What Changes

- **Migrations never emit a structurally-invalid node.** A `lens` node that, after migration, has no valid `sources` (empty array or missing field) is **dropped** during migration rather than left to fail the current-version schema. A non-functional lens (no resolvable source) is already dead; dropping that one node is strictly better than poisoning the whole pinned tree. Applied as a terminal normalization pass over `pinnedBySpace` in the migration chain so it also covers nodes mangled by earlier (v8) steps, not just v13.
- **Salvage becomes element-wise for the record/array slices.** `salvagePersistedState` salvages `pinnedBySpace` per-node (drop only the invalid nodes in a Space, keep the valid ones; keep all valid Spaces' trees), and salvages `savedTabs`, `archivedTabs`, and `trash` element-wise too. Blast radius becomes one element, never a whole slice. The existing slice-wise behavior for the remaining scalar/map slices is unchanged.
- **Regression + robustness tests.** Add failing-first regression tests for both reproduced defects, plus the broader robustness suite already added at `apps/extension/src/shared/migrations.robustness.test.ts` (forward-compat matrix v1→v14 + crash-proofing on hostile input).
- No **BREAKING** changes: the persisted envelope shape and `CURRENT_SCHEMA_VERSION` are unchanged; this only changes how malformed input is recovered.

`docs/` updates: none required — `docs/architecture.md` describes the layer DAG, not the salvage/migration contract, which lives in the `storage-and-migrations` spec. (Confirmed: no `docs/` file states the slice-wise salvage rule.)

New public surface: no new exported types or files. `salvagePersistedState` and `runMigrations` keep their signatures; a private terminal-normalization helper is added inside `migrations.ts` (named in design.md). No `src/ui` primitives involved (no user-visible surface ships here).

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `storage-and-migrations`: The "Partial-corruption salvage preserves valid Space identities" requirement changes — `pinnedBySpace`, `savedTabs`, `archivedTabs`, and `trash` move from slice-wise to **element-wise** salvage. A new requirement is added: **a migration SHALL NOT emit a `PinNode` that fails the current-version schema** — a lens left without valid `sources` is dropped by the migration chain's terminal normalization.

## Impact

- **Code:** `apps/extension/src/shared/migrations.ts` (terminal `pinnedBySpace` normalization in `runMigrations`), `apps/extension/src/shared/chrome/storage.ts` (`salvagePersistedState` element-wise salvage).
- **Tests:** `apps/extension/src/shared/migrations.test.ts`, `apps/extension/src/shared/chrome/storage.test.ts`, `apps/extension/src/shared/migrations.robustness.test.ts`.
- **No** change to the on-disk envelope, `CURRENT_SCHEMA_VERSION`, the message bus, or any UI surface. Recovery is strictly more conservative (keeps more data), so no migration of already-persisted state is needed.
