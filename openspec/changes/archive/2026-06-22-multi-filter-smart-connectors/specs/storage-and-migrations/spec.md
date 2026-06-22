## MODIFIED Requirements

### Requirement: Append-only migrations list

The `migrations: Migration[]` array exported from `apps/extension/src/shared/migrations.ts` SHALL be append-only **from the v1 baseline onward**. A `Migration` SHALL be `{ toVersion: number; migrate: (raw: unknown) => unknown }`. Each `migrate` function SHALL be synchronous and pure.

The list holds eight entries: the seven entries from the prior version (`toVersion: 2` through `toVersion: 8`) plus a new `{ toVersion: 9 }` migration added by this change. The v9 migration is a **real transformation**: for each `smart` `PinNode` in every space in `pinnedBySpace`, it rewrites each `sources[]` entry from the `query?` shape to the `queries[]` shape — a queue entry `{ source, baseUrl, query }` becomes `{ source, baseUrl, queries: [query] }`, and an rss entry `{ source, baseUrl }` becomes `{ source, baseUrl, queries: [] }`. Additionally, for each `smartItemBindings[folderId]`, it re-keys every `namespacedItemId` from the v8 `${source}:${host}:${nativeId}` form to the v9 per-filter `${source}:${host}:${query}:${nativeId}` form, deriving the inserted `query` from the migrated node's matching instance (the instance that produced that section key). A `folderId` in `smartItemBindings` with no matching node in `pinnedBySpace` (orphaned binding) SHALL have its entire entry dropped (orphaned bindings are pruned). A binding whose v8 key references a queue instance is re-keyed using that instance's single migrated filter; an rss binding's key is unchanged (rss keys carry no query). The v8 *editor* enforced one filter per `source:host`, but the v8 *schema* did not forbid two `sources[]` entries sharing a `source:host` with different `query`; if such a tie occurs, the re-key SHALL derive `query` from the **first** matching `sources[]` entry in array order (deterministic), never duplicating or dropping the binding.

#### Scenario: The chain holds exactly the v2 through v9 entries

- **GIVEN** the `migrations` list exported from `apps/extension/src/shared/migrations.ts`
- **THEN** `migrations` SHALL equal an eight-entry list — `{ toVersion: 2 }` through `{ toVersion: 8 }`, then `{ toVersion: 9 }` (the last being a real transformation; the earlier entries are as previously specified)

#### Scenario: A v8 queue smart node is rewritten into the queries shape

- **GIVEN** a v8 smart node with `sources: [{ source: 'gitlab', baseUrl: 'https://gitlab.com', query: 'authored' }]`
- **WHEN** `runMigrations` applies the v9 migration
- **THEN** the node's sources entry becomes `{ source: 'gitlab', baseUrl: 'https://gitlab.com', queries: ['authored'] }`

#### Scenario: A v8 rss smart node gains an empty queries array

- **GIVEN** a v8 smart node with `sources: [{ source: 'rss', baseUrl: 'https://feeds.example.com/rss' }]`
- **WHEN** `runMigrations` applies the v9 migration
- **THEN** the node's sources entry becomes `{ source: 'rss', baseUrl: 'https://feeds.example.com/rss', queries: [] }`

#### Scenario: A v8 smartItemBindings key is re-keyed with the filter axis

- **GIVEN** a v8 binding `smartItemBindings['f1']['gitlab:gitlab.com:42']` and a migrated node whose gitlab instance carries the single filter `authored`
- **WHEN** `runMigrations` applies the v9 migration
- **THEN** the binding is re-keyed to `smartItemBindings['f1']['gitlab:gitlab.com:authored:42']`

#### Scenario: An ambiguous binding key re-keys from the first matching instance

- **GIVEN** a hand-edited v8 state with two `sources[]` entries sharing `gitlab:gitlab.com` (queries `authored` then `assigned`) and a binding `smartItemBindings['f1']['gitlab:gitlab.com:42']`
- **WHEN** `runMigrations` applies the v9 migration
- **THEN** the binding is re-keyed to `smartItemBindings['f1']['gitlab:gitlab.com:authored:42']` (the first matching entry's query) and is neither duplicated nor dropped

#### Scenario: An orphaned v8 binding is dropped

- **GIVEN** a `smartItemBindings['ghost']` entry with no matching node in `pinnedBySpace`
- **WHEN** `runMigrations` applies the v9 migration
- **THEN** the `ghost` entry SHALL be dropped entirely

#### Scenario: A v8 envelope with no smart nodes or bindings passes through cleanly

- **GIVEN** a v8 envelope whose `pinnedBySpace` holds no smart nodes and whose `smartItemBindings` is empty
- **WHEN** `runMigrations` applies the v9 migration
- **THEN** the output is structurally unchanged apart from the bumped schema version

#### Scenario: A v1 envelope migrates the full chain to v9

- **WHEN** `persistedVersion = 1`, `CURRENT_SCHEMA_VERSION = 9`, and `migrations` contains entries with `toVersion: 2` through `toVersion: 9`
- **THEN** the runner applies all eight in order, validation succeeds against the v9 schema, and the envelope is written back as `{ schemaVersion: 9, state }`

### Requirement: Migration runner applies pending migrations in order

On every SW boot, the storage layer SHALL invoke `runMigrations(raw, persistedVersion)` which iterates `migrations` in array order, applies the `migrate` function of every entry whose `toVersion > persistedVersion`, threading each output as the input to the next, and stops when there are no more entries to apply.

After the runner returns, the resulting object SHALL be validated against the Zod schema for the current schema version, `AppStateV9Schema`. `AppStateV9Schema` is the v8 schema with `PinNodeSchema`'s smart branch updated so each `SmartSourceConfigSchema` entry uses `queries: SmartQuery[]` (replacing `query?`), and with `SmartItemBindingsSchema` using per-filter namespaced string item keys. If `persistedVersion < CURRENT_SCHEMA_VERSION` and validation succeeds, the storage layer SHALL write the new envelope `{ schemaVersion: 9, state }` back to `lunma.state` before returning. If `persistedVersion === CURRENT_SCHEMA_VERSION`, no write-back SHALL occur on boot.

#### Scenario: A migrated envelope validates against the current schema

- **GIVEN** a v8 envelope carrying a multi-source smart node
- **WHEN** `readPersistedState` validates it after the v9 migration
- **THEN** validation SHALL succeed against `AppStateV9Schema` and the envelope SHALL be written back as `{ schemaVersion: 9, state }`

<!-- multi-filter-smart-connectors task 6.4: sweep the pre-existing
     AppStateV7Schema/AppStateV7 naming drift (v8 raised the constant to 8 but
     never renamed these requirements) to the current AppStateV9Schema/AppStateV9,
     and refresh the smart-node salvage scenario for the queries[]/rss shape. -->

### Requirement: Corruption quarantine and fallback

If the migration runner throws, the resulting payload fails Zod validation, or the envelope's `schemaVersion` is not a finite number, the storage layer SHALL:

1. Write a `QuarantineRecord` to a new key `__corrupt_backup_<ISO-8601-timestamp>` under `chrome.storage.local`. The `QuarantineRecord` SHALL be of shape:
   ```ts
   {
     capturedAt: number;       // Date.now() at quarantine time
     reason: string;           // 'invalid envelope.schemaVersion' | 'migration threw' | 'schema parse failed'
     error?: string;           // Error.message when reason === 'migration threw'
     zodIssues?: unknown;      // parsed.error.issues when reason === 'schema parse failed'
     rawBytes: unknown;        // the original raw payload read from lunma.state
   }
   ```
2. Log at `error` level with the stable error code `STORAGE_CORRUPT`, including the `reason` and `backupKey` but not the raw payload.

For the **Zod-validation-failure** branch only (a clean migration chain whose output fails the current-version schema, `AppStateV9Schema`), the layer SHALL FIRST attempt `salvagePersistedState(migrated)` (see Requirement: Partial-corruption salvage preserves valid Space identities). When salvage returns a non-null state, the layer SHALL still write the quarantine record above and SHALL return `{ kind: 'salvaged'; state }`. When salvage returns `null`, the layer SHALL return `{ kind: 'corrupt' }`. The **migration-threw** and **invalid-`schemaVersion`** branches SHALL NOT attempt salvage and SHALL return `{ kind: 'corrupt' }`.

On `{ kind: 'corrupt' }`, `loadState` SHALL call `createInitialState()` and return `{ state: <initial>, outcome: 'recovered' }` (see Requirement: loadState surface). No write to `lunma.state` SHALL occur inside `readPersistedState` during the fallback; the recovered or salvaged state is persisted by the boot chain / the first subsequent store mutation as today.

The storage layer SHALL retain at most the **10 most recent** `__corrupt_backup_*` entries. Before writing a new quarantine record, the layer SHALL list all existing `__corrupt_backup_*` keys, sort them ascending (the ISO-8601 suffix sorts chronologically as a string), and `chrome.storage.local.remove(...)` the oldest entries so that the total count after the pending write does not exceed 10. A prune failure SHALL be logged at `error` level with code `STORAGE_CORRUPT` but SHALL NOT block the subsequent quarantine write.

The `QuarantineRecord` shape is shape-distinguishable from a live envelope (it has no `state` field), so future scanners can separate the two without re-parsing.

#### Scenario: Quarantine retention cap

- **WHEN** a new quarantine event occurs and 10 or more `__corrupt_backup_*` keys already exist
- **THEN** the oldest entries SHALL be removed via `chrome.storage.local.remove` before the new record is written
- **AND** the total count of `__corrupt_backup_*` keys after the write SHALL be exactly 10

#### Scenario: Migration throws

- **WHEN** a `Migration.migrate` function throws
- **THEN** a `QuarantineRecord` SHALL be written to `__corrupt_backup_<ts>` with `reason: 'migration threw'`, `error` set to the thrown error's message, and `rawBytes` set to the original payload
- **AND** salvage SHALL NOT be attempted
- **AND** `loadState` SHALL return `{ state: createInitialState(), outcome: 'recovered' }`

#### Scenario: Schema validation fails and nothing is salvageable

- **WHEN** all migrations run without throwing but the resulting object fails validation against the current-version schema (`AppStateV9Schema`)
- **AND** `salvagePersistedState(migrated)` returns `null`
- **THEN** a `QuarantineRecord` SHALL be written to `__corrupt_backup_<ts>` with `reason: 'schema parse failed'`, `zodIssues` set to `parsed.error.issues`, and `rawBytes` set to the original payload
- **AND** `loadState` SHALL return `{ state: createInitialState(), outcome: 'recovered' }`

#### Scenario: Schema validation fails but valid slices are salvaged

- **WHEN** all migrations run without throwing but the resulting object fails validation against `AppStateV9Schema`
- **AND** `salvagePersistedState(migrated)` returns a non-null state
- **THEN** a `QuarantineRecord` SHALL be written to `__corrupt_backup_<ts>` with `reason: 'schema parse failed'` and `rawBytes` set to the original payload
- **AND** `readPersistedState` SHALL return `{ kind: 'salvaged', state }`
- **AND** `loadState` SHALL return `{ state: <salvaged>, outcome: 'salvaged' }`

#### Scenario: Envelope schemaVersion is not a number

- **WHEN** the persisted envelope's `schemaVersion` field is missing or not a finite number
- **THEN** a `QuarantineRecord` SHALL be written to `__corrupt_backup_<ts>` with `reason: 'invalid envelope.schemaVersion'` and `rawBytes` set to the original payload
- **AND** salvage SHALL NOT be attempted
- **AND** `loadState` SHALL return `{ state: createInitialState(), outcome: 'recovered' }`

#### Scenario: Legacy key is not auto-recovered

- **WHEN** `lunma.state` is empty but the legacy key `lunma.state.v1` contains data
- **THEN** the storage layer SHALL NOT read `lunma.state.v1`
- **AND** `loadState` SHALL return `{ state: createInitialState(), outcome: 'clean' }`

### Requirement: Partial-corruption salvage preserves valid Space identities

The storage layer SHALL export a pure function `salvagePersistedState(migrated: unknown): AppStateV9 | null` that attempts to recover a valid `AppStateV9` from a payload that failed whole-state validation, preserving as much real data as possible instead of discarding all of it.

`salvagePersistedState` SHALL:

1. Return `null` when `migrated` is not a non-null object.
2. Start from a valid empty base equal in shape to `createInitialState()` at `CURRENT_SCHEMA_VERSION`.
3. Salvage the `spaces` array **element-wise**: when the input's `spaces` value is an array, keep each element that individually validates against the Space element schema (`AppStateV9Schema.shape.spaces.element`), preserving array order and dropping only the invalid elements; otherwise keep `[]`. A single malformed Space SHALL NOT cost the other Spaces.
4. Salvage every other top-level slice (`schemaVersion`, `activeSpaceByWindow`, `spaceInstancesByWindow`, `tabBindings`, `savedTabs`, `lastActivatedSpaceId`, `tabLastActivity`, `archivedTabs`, `trash`, `pinnedBySpace`, `faviconRow`, `smartItemBindings`) **slice-wise**: validate the input's value against that slice's own schema (`AppStateV9Schema.shape.<field>`); on success the validated value SHALL be kept, on failure the empty-base default SHALL be kept.
5. Validate the assembled object against `AppStateV9Schema` and return it on success, or `null` on failure.

Because the `spaces` array is salvaged element-wise, a payload SHALL preserve every individually-valid Space's `id`, `name`, `color`, and `icon`, even when other Spaces in the same array are malformed and even when unrelated slices (e.g. `savedTabs`) are malformed. Because `faviconRow` is salvaged slice-wise, a valid `faviconRow` SHALL be preserved rather than reset whenever it individually validates. Because `pinnedBySpace` is validated against the current-version slice schema (which admits all three `PinNode` kinds, the four smart `source` values `'gitlab' | 'github' | 'jira' | 'rss'`, and each instance's `queries: SmartQuery[]`), a pinned tree containing v9-shape `smart` nodes SHALL survive salvage intact rather than being reset. Dangling references that result from a dropped Space or slice (e.g. a `pinnedBySpace` entry pointing at a reset `savedTabs`, or `activeSpaceByWindow` referencing a dropped Space) are tolerated by the existing load-path de-duplication and the sidebar projections (see the *Loaded state has unique ids per keyed collection* requirement).

A salvaged state SHALL flow through the existing `dedupePersistedState` step and SHALL be eligible for the existing write-back self-heal, exactly as a migrated/de-duplicated `ok` state is.

#### Scenario: A malformed unrelated slice preserves all Space names

- **GIVEN** a migrated payload whose `spaces` slice is `[{ id: 'a', name: 'Work', color: 'blue', icon: 'star' }, { id: 'b', name: 'Personal', color: 'red', icon: 'star' }]` but whose `savedTabs` slice contains a record missing its required `originalURL`
- **WHEN** whole-state validation fails and `salvagePersistedState` runs
- **THEN** it SHALL return a valid `AppStateV9` whose `spaces` equals the two input Spaces unchanged
- **AND** `savedTabs` SHALL be reset to `{}`
- **AND** `readPersistedState` SHALL return `{ kind: 'salvaged', state }`

#### Scenario: An invalid Space among valid Spaces is dropped, the rest preserved

- **GIVEN** a migrated payload whose `spaces` slice is `[{ id: 'a', name: 'Work', color: 'blue', icon: 'star' }, { id: 'b', color: 'red', icon: 'star' }]` (the second Space is missing its required `name`)
- **WHEN** `salvagePersistedState` runs
- **THEN** the element-wise `spaces` salvage SHALL keep `{ id: 'a', name: 'Work', color: 'blue', icon: 'star' }` and drop the nameless element
- **AND** the assembled object SHALL validate against `AppStateV9Schema` with `spaces` equal to `[{ id: 'a', name: 'Work', color: 'blue', icon: 'star' }]`
- **AND** `readPersistedState` SHALL return `{ kind: 'salvaged', state }`

#### Scenario: A valid faviconRow survives an unrelated slice failure

- **GIVEN** a migrated payload whose `faviconRow` slice is a valid `SavedTabId[]` but whose `savedTabs` slice is malformed
- **WHEN** whole-state validation fails and `salvagePersistedState` runs
- **THEN** the assembled object's `faviconRow` SHALL equal the input `faviconRow` (favourites are not reset)
- **AND** `readPersistedState` SHALL return `{ kind: 'salvaged', state }`

#### Scenario: A pinned tree containing a smart node survives salvage

- **GIVEN** a migrated payload whose `pinnedBySpace` slice is valid and contains a v9-shape `smart` node — a queue instance carrying `queries: ['authored', 'review-requested']` and an `rss` instance carrying `queries: []` — but whose `savedTabs` slice is malformed
- **WHEN** whole-state validation fails and `salvagePersistedState` runs
- **THEN** the assembled object's `pinnedBySpace` SHALL equal the input slice intact, each smart node's `sources[]`/`queries[]` config fields included
- **AND** `readPersistedState` SHALL return `{ kind: 'salvaged', state }`

#### Scenario: A non-object payload is unsalvageable

- **WHEN** `salvagePersistedState` is called with a string, number, array, or `null`
- **THEN** it SHALL return `null`
- **AND** `readPersistedState` SHALL return `{ kind: 'corrupt' }`

### Requirement: ArchivedTab record shape on AppState

`AppState.archivedTabs` SHALL be typed as `ArchivedTab[]` in [apps/extension/src/shared/types.ts](../../../apps/extension/src/shared/types.ts) and validated by `ArchivedTabSchema` (a `z.strictObject`) inside the current-version `AppState` schema (`AppStateV9Schema`) in [apps/extension/src/shared/schemas.ts](../../../apps/extension/src/shared/schemas.ts).

The `ArchivedTab` type SHALL be:

```typescript
interface ArchivedTab {
  tabId: number;        // historical chrome tab id at archive time
  url: string;          // URL the tab pointed to at archive time
  title: string;        // page title at archive time
  spaceId: SpaceId;     // Space the tab belonged to
  archivedAt: number;   // epoch milliseconds when the sweep wrote this entry
}
```

No additional fields SHALL be added in v1. Page snapshots, favicon URLs, scroll positions, and form state are explicitly out of scope.

A fresh `LunmaStore` constructed with no persisted state SHALL initialize `state.archivedTabs` to `[]`.

The **behavior** of populating, pruning, and consuming `archivedTabs` is owned by the auto-archive capability (Phase 5; see [docs/adr/0002-auto-archive-v1-shape.md](../../../docs/adr/0002-auto-archive-v1-shape.md)). This requirement is limited to the persisted-shape contract.

#### Scenario: ArchivedTab type is exported from types.ts

- **WHEN** a consumer imports `ArchivedTab` from [apps/extension/src/shared/types.ts](../../../apps/extension/src/shared/types.ts)
- **THEN** the type SHALL be defined with exactly the five fields above
- **AND** no additional optional or required fields SHALL be present

#### Scenario: archivedTabs initializes to empty array

- **WHEN** a fresh `LunmaStore` is constructed with no persisted state
- **THEN** `state.archivedTabs` SHALL equal `[]`

#### Scenario: ArchivedTabSchema is part of the current-version schema

- **WHEN** an envelope with `state.archivedTabs` containing an entry with an unknown extra field is loaded
- **THEN** `AppStateV9Schema.parse` SHALL fail validation (strict mode)
- **AND** the storage layer SHALL quarantine per the corruption-quarantine requirement

### Requirement: Schema-to-type coherence

`apps/extension/src/shared/schemas.ts` SHALL include a compile-time assertion that `z.infer<typeof AppStateV9Schema>` and `AppState` (from `apps/extension/src/shared/types.ts`) are structurally equivalent. A drift between the two SHALL cause `pnpm exec tsc --noEmit` to fail.

The `AppStateV9Schema` SHALL define `smartItemBindings` as:
```
z.record(z.record(z.record(z.object({ tabId: z.number(), allowGlob: z.string() }))))
  .default({})
```
replacing the v6 `z.record(z.record(z.record(z.number()))).default({})`.

The `AppStateV9Schema` SHALL define `liveTabsById` as:
```
z.record(z.coerce.number(), LiveTabSchema).default({})
```
replacing the previous `.optional()` form — so the inferred type is `Record<number, LiveTab>` (not `Record<number, LiveTab> | undefined`), matching `AppState.liveTabsById`.

The `AppStateV9Schema` SHALL define `smartFolders` as:
```
z.record(z.string(), SmartFolderRuntimeSchema).default({})
```
replacing the previous `.optional()` form — so the inferred type is `Record<string, SmartFolderRuntime>` (not `Record<string, SmartFolderRuntime> | undefined`), matching `AppState.smartFolders`.

With these changes the `Persisted<T>` helper in `schemas.ts` (which previously omitted `liveTabsById` and `smartFolders` from the structural comparison to hide the optional/non-optional gap) SHALL be removed. The compile-time assertion SHALL compare `z.infer<typeof AppStateV9Schema>` and `AppState` directly, without stripping any fields.

No `as unknown as AppState` cast SHALL remain in the codebase for values produced by `AppStateV9Schema.safeParse`.

#### Scenario: Type drift fails the build

- **WHEN** a developer changes the `smartItemBindings` slot type in `AppState` without updating `AppStateV9Schema`
- **THEN** `pnpm exec tsc --noEmit` SHALL fail with a type-equivalence error in `apps/extension/src/shared/schemas.ts`

#### Scenario: liveTabsById gap removed — parse output is directly assignable to AppState

- **WHEN** `AppStateV9Schema.safeParse(payload)` succeeds on a payload lacking a `liveTabsById` field
- **THEN** `stateResult.data.liveTabsById` SHALL equal `{}` (the `.default({})` value)
- **AND** `stateResult.data` SHALL be directly assignable to `AppState` without a cast

#### Scenario: smartFolders gap removed — parse output is directly assignable to AppState

- **WHEN** `AppStateV9Schema.safeParse(payload)` succeeds on a payload lacking a `smartFolders` field
- **THEN** `stateResult.data.smartFolders` SHALL equal `{}`
- **AND** `stateResult.data` SHALL be directly assignable to `AppState` without a cast

### Requirement: Spaces persist an optional auto-archive override

The persisted `Space` record SHALL carry an optional `autoArchive` field of type `SpaceAutoArchive = { mode: 'off' } | { mode: 'custom'; idleMinutes: number }`, validated by `SpaceAutoArchiveSchema` inside the current-version `AppState` schema (`AppStateV9Schema`). This field is part of the **clean v1 baseline shape** — it is present in the baseline `Space` schema directly and is NOT introduced by a migration (the placeholder-era `v10Tov11` migration that originally added it is deleted with the rest of the collapsed chain). The behavior of resolving and applying the override is owned by the `auto-archive` capability; this requirement is limited to the persisted-shape contract.

An **absent** `autoArchive` SHALL mean *inherit the global auto-archive setting* — the durable, on-disk representation of "this Space follows the `autoArchiveEnabled` / `autoArchiveIdleMinutes` settings". A `{ mode: 'off' }` value SHALL mean *never auto-archive this Space*; a `{ mode: 'custom'; idleMinutes }` value SHALL carry a positive-integer threshold (validated `z.number().int().positive()`, so `0`/negatives are rejected at the storage boundary; the resolver additionally clamps to a floor of 1).

The baseline schemas SHALL include `SpaceAutoArchiveSchema`; the baseline `Space` schema (carrying the optional `autoArchive`); the baseline trashed-Space schema (carrying the optional `autoArchive` — REQUIRED because `TrashedSpace extends Space`, so leaving `trash` validated by a Space schema without the field would break the `AssertEqual` schema-to-type guard once `Space` carries it); and the current-version `AppState` schema (whose `spaces` validate the Space shape and `trash` the trashed-Space shape). An absent `autoArchive` is valid, so no record requires rewriting on load.

#### Scenario: A fresh baseline Space has no override

- **WHEN** a Space is created with no `autoArchive` set
- **THEN** the persisted Space SHALL omit `autoArchive`
- **AND** validation against `AppStateV9Schema` SHALL succeed (absent = inherit the global setting)

#### Scenario: A custom override round-trips through storage

- **WHEN** a Space with `autoArchive: { mode: 'custom', idleMinutes: 15 }` is persisted and re-read
- **THEN** the override SHALL survive the round-trip intact

#### Scenario: An off override round-trips through storage

- **WHEN** a Space with `autoArchive: { mode: 'off' }` is persisted and re-read
- **THEN** the override SHALL survive the round-trip intact

#### Scenario: A trashed Space's override round-trips through storage

- **WHEN** a trashed Space (in `state.trash`) carrying `autoArchive: { mode: 'custom', idleMinutes: 20 }` is persisted and re-read
- **THEN** validation against `AppStateV9Schema` (whose `trash` carries the optional `autoArchive`) SHALL succeed
- **AND** the override SHALL survive the round-trip intact

#### Scenario: A malformed override is rejected, then salvaged

- **WHEN** a Space's stored `autoArchive` fails `SpaceAutoArchiveSchema` validation
- **THEN** whole-state validation SHALL fail and the existing salvage path SHALL apply (the original bytes are quarantined under a `__corrupt_backup_*` key)
