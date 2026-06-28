## Context

`readPersistedState` (`apps/extension/src/shared/chrome/storage.ts`) reads the `lunma.state` envelope, runs `runMigrations(state, persistedVersion)`, then validates the result against `AppStateV14Schema`. On validation failure it calls `salvagePersistedState(migrated)` before falling back to `{ kind: 'corrupt' }`.

Two interacting defects produce silent, catastrophic loss of the pinned tree (reproduced against `main` with fixtures):

- **Migrations can emit a structurally-invalid `PinNode`.** `PinNodeSchema`'s lens branch requires `sources: z.array(LensSourceRefSchema).min(1)`. The v13 migration drops malformed embedded source entries and can leave `sources: []`; the v8/chain path can leave a former-`smart` node as a `lens` with no `sources` field (e.g. a pre-v8 flat smart node saved without `baseUrl`). Either way whole-state validation fails.
- **Salvage is element-wise only for `spaces`.** `pinnedBySpace`, `savedTabs`, `archivedTabs`, and `trash` are salvaged slice-wise (all-or-nothing), so one bad element resets the whole slice. A single invalid node in one Space wipes every Space's pinned tree, then the write-back self-heal persists the wipe.

The persisted envelope shape and `CURRENT_SCHEMA_VERSION` (14) are NOT changing. This change only makes recovery strictly more conservative.

## Goals / Non-Goals

**Goals:**
- Guarantee the migration chain never hands the schema a `pinnedBySpace` node that fails `PinNodeSchema`.
- Reduce the salvage blast radius from "whole slice" to "one element" for `pinnedBySpace`, `savedTabs`, `archivedTabs`, and `trash`.
- Land failing-first regression tests for both reproduced defects.

**Non-Goals:**
- No new schema version, no envelope-shape change, no on-disk migration of already-persisted data (recovery only gets more conservative).
- No change to the `migration-threw` / `invalid-schemaVersion` branches (still `{ kind: 'corrupt' }`, no salvage).
- No attempt to *repair* a malformed lens (e.g. invent a source). A lens with no resolvable source is dropped, not reconstructed.
- No UI surface, so no `Visual language` section applies.

## Decisions

### D1 — Terminal normalization in `runMigrations`, not per-migration patches

After the per-version loop, `runMigrations` runs a private `normalizePinnedNodes(state)` pass that, for each Space's node array, drops any node where `PinNodeSchema.safeParse(node)` fails (order preserved; empty Spaces kept as `[]`; a non-array Space value is left for salvage/parse to handle).

- **Why a terminal pass over fixing v8/v13 individually:** the invalid-node shape can be produced by more than one migration and by future ones; a single schema-anchored gate at the end is exhaustive and self-maintaining (it tracks `PinNodeSchema` automatically). Patching v13 alone would miss the v8 missing-`baseUrl` path; patching both still leaves the next migration unguarded.
- **Why `safeParse` to decide, but keep the ORIGINAL node:** validity is judged by the schema, but we must not substitute the parsed node — that would prematurely materialize `.default()`s (maxItems/hideRead) into the persisted object. The final whole-state `AppStateV14Schema.parse` remains the single place defaults are applied.
- **Coupling note:** this introduces a `migrations.ts` → `schemas.ts` value import of `PinNodeSchema`. `migrations.ts` already imports `CURRENT_SCHEMA_VERSION` from `schemas.ts`, so the edge exists and stays within the `shared/` layer (no DAG violation).
- **Alternative considered — validate in the runner against the whole schema and reject:** rejected; that just reproduces today's all-or-nothing failure. Node-granular dropping is the point.
- **Alternative considered — drop invalid nodes only when `persistedVersion < CURRENT`:** rejected; a node corrupted by a prior buggy *write* (already at current version) must also be normalized on read, so the pass runs unconditionally.

### D2 — Element-wise salvage for the container slices

`salvagePersistedState` keeps its slice list but routes the four container slices through element-wise helpers:
- `pinnedBySpace`: rebuild the record, validating each node against `AppStateV14Schema.shape.pinnedBySpace.valueSchema.element` (the `PinNodeSchema`); drop invalid nodes, drop non-array Space values.
- `savedTabs`, `trash`: rebuild the record, validating each entry value against the record's value schema; drop invalid entries.
- `archivedTabs`: filter the array, validating each element.
- All remaining slices stay slice-wise exactly as today.

- **Why element-wise here specifically:** these four are the high-value, high-cardinality user data (pins, saved tabs, archive, trash). Losing one element is acceptable; losing the slice is the reported corruption. The scalar/map slices (`tabBindings`, `activeSpaceByWindow`, …) are cheap to rebuild and lower value, so slice-wise is fine and simpler.
- **Why this is defense-in-depth on top of D1:** D1 means migration output is already node-valid, so the empty-sources case never reaches salvage. D2 protects against *other* and *future* per-element corruption (a malformed savedTab, an archive entry from a partial write) that D1 doesn't cover.
- **Reaching the Zod element schema:** `AppStateV14Schema.shape.pinnedBySpace` is a `ZodRecord`; in Zod 4 its value accessor is `.valueType` (the `z.array(PinNodeSchema)`) and `.element` is `PinNodeSchema`. Record value slices (`savedTabs`, `trash`) likewise expose `.valueType`. A small typed helper (`salvageRecord`) isolates the per-entry validation so the Zod-internals coupling lives in one place.

### D3 — Dangling references remain tolerated

Dropping a node/tab can orphan a reference (a folder child id pointing at a dropped node, `activeSpaceByWindow` at a dropped Space). This is already handled by `dedupePersistedState` and the sidebar projections (unbound ids drop at render) — unchanged. No referential-integrity sweep is added.

## Risks / Trade-offs

- **[A surviving folder node references a dropped child/savedTab]** → Tolerated by the existing render-time drop of unbound ids; no new behavior. Same class of dangling reference the spec already documents for dropped Spaces.
- **[Dropping a lens silently loses the user's lens config]** → A lens with no valid sources is already non-functional; dropping one dead node is strictly better than the current whole-tree wipe, and the raw payload is still quarantined for diagnosis. Documented in the spec requirement.
- **[`PinNodeSchema` `.element`/`.valueSchema` are Zod-internal accessors that could shift on a Zod major]** → Isolated behind one helper; covered by tests that would fail loudly on a break. Zod is pinned in `docs/tech-stack.md`.
- **[Normalization runs on every read, adding per-node `safeParse` cost]** → `pinnedBySpace` is small (tens of nodes); the cost is negligible versus a `chrome.storage` round-trip, and only runs at boot/read.

## Migration Plan

No data migration. Ship code + tests; behavior change is read-path only and strictly more conservative. Rollback is a straight revert (no persisted-shape change to undo). `docs/` needs no update (the salvage/migration contract is specified in the `storage-and-migrations` capability, not in `docs/`); confirmed no `docs/` file states the slice-wise rule.

## Open Questions

None.
