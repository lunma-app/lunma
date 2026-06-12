## MODIFIED Requirements

### Requirement: Versioned local-storage envelope

The persisted `AppState` SHALL live in `chrome.storage.local` under the key `lunma.state` as an envelope of shape `{ schemaVersion: number; state: AppState }`. The envelope's `schemaVersion` SHALL equal the `CURRENT_SCHEMA_VERSION` constant exported from `apps/extension/src/shared/schemas.ts` at write time. The current version SHALL be `2` (raised from `1` by the `smart-folders` change, which widened the persisted `PinNode` union with the `smart` kind).

The `state.schemaVersion` field on `AppState` itself SHALL match the envelope's `schemaVersion` whenever both are present. The envelope-level field is the value the migration runner reads; the in-state field is informational.

#### Scenario: A valid current-version envelope round-trips

- **WHEN** the storage layer loads an envelope whose `schemaVersion` equals `CURRENT_SCHEMA_VERSION`
- **THEN** the storage layer SHALL load it without running any migration

### Requirement: Append-only migrations list

The `migrations: Migration[]` array exported from `apps/extension/src/shared/migrations.ts` SHALL be append-only **from the v1 baseline onward**. A `Migration` SHALL be `{ toVersion: number; migrate: (raw: unknown) => unknown }`. Each `migrate` function SHALL be synchronous and pure — it SHALL NOT call any `chrome.*` API and SHALL NOT perform I/O.

A new entry MAY only be added at the end of the array, and its `toVersion` SHALL equal `CURRENT_SCHEMA_VERSION` after it is added. **Once the product has shipped**, existing entries SHALL NOT be modified, reordered, or removed in any subsequent change.

The product is **pre-release** at the time of this change, so the accumulated placeholder-era chain (`v1Tov2 … v10Tov11`) was reset **once** to a clean empty baseline (`migrations = []`, `CURRENT_SCHEMA_VERSION = 1`). This one-time reset was permitted precisely because there are no released installs and no persisted data to upgrade; it SHALL NOT recur after the first public release.

The list's first real entry is the `smart-folders` migration `{ toVersion: 2 }`: a pure pass-through (`(raw) => raw`), because v1 data cannot contain `smart` nodes and no existing field changes shape — the v2 schema simply admits the new `PinNode` kind. The bump is deliberate despite the pass-through: it makes a downgrade detectable (an older build reading v2 data quarantines on the version gate instead of Zod-rejecting `smart` nodes with a confusing parse error).

#### Scenario: The v2 migration is the first and only entry

- **WHEN** this change ships
- **THEN** `migrations` SHALL equal a single-entry list whose entry has `toVersion: 2` and a pass-through `migrate`
- **AND** `CURRENT_SCHEMA_VERSION` SHALL equal `2`

#### Scenario: A v1 envelope migrates to v2 losslessly

- **WHEN** the storage layer loads an envelope with `schemaVersion: 1`
- **THEN** the runner applies the `toVersion: 2` pass-through, validation succeeds against the v2 schema, and the envelope is written back as `{ schemaVersion: 2, state }` with the state content unchanged

#### Scenario: A future change adds a migration

- **WHEN** a future change introduces migration `M` producing version `N`
- **THEN** `M` SHALL be appended as the last entry in `migrations` with `toVersion: N`
- **AND** `CURRENT_SCHEMA_VERSION` SHALL be raised to `N` in the same change
- **AND** existing entries SHALL NOT be modified, reordered, or removed (the append-only rule binds from the v1 baseline forward)

### Requirement: Migration runner applies pending migrations in order

On every SW boot, the storage layer SHALL invoke `runMigrations(raw, persistedVersion)` which iterates `migrations` in array order, applies the `migrate` function of every entry whose `toVersion > persistedVersion`, threading each output as the input to the next, and stops when there are no more entries to apply.

After the runner returns, the resulting object SHALL be validated against the Zod schema for the **current** schema version, `AppStateV<CURRENT_SCHEMA_VERSION>Schema`. At `CURRENT_SCHEMA_VERSION = 2` the validator is `AppStateV2Schema` (the v1 baseline schema widened with the `smart` `PinNode` kind). Because the runner migrates the payload UP to `CURRENT_SCHEMA_VERSION` before validation, the validator MUST be the current-version schema; validating against any older-version schema SHALL be treated as a defect — it would reject the current nested-instance / `PinNode` shape and corrupt every restart. If `persistedVersion < CURRENT_SCHEMA_VERSION` and validation succeeds, the storage layer SHALL write the new envelope `{ schemaVersion: CURRENT_SCHEMA_VERSION, state }` back to `lunma.state` before returning.

If `persistedVersion === CURRENT_SCHEMA_VERSION`, no write-back SHALL occur on boot.

#### Scenario: Persisted version equals current — no migrations run

- **WHEN** `persistedVersion === CURRENT_SCHEMA_VERSION` and the payload validates
- **THEN** `runMigrations` SHALL return the input unchanged
- **AND** no write to `lunma.state` SHALL occur

#### Scenario: Pending migrations apply in order (runner contract)

- **WHEN** `persistedVersion = 1`, a future `CURRENT_SCHEMA_VERSION = 3`, and `migrations` contains entries with `toVersion: 2` and `toVersion: 3`
- **THEN** the runner SHALL invoke the `toVersion: 2` migration first, then feed its output to the `toVersion: 3` migration
- **AND** the final result SHALL be validated against the current schema
- **AND** the migrated envelope SHALL be written back to `lunma.state` before `loadState` returns

#### Scenario: Migrations skip entries already at or below persisted version (runner contract)

- **WHEN** `persistedVersion = 2` and `migrations` contains entries with `toVersion: 2` and `toVersion: 3`
- **THEN** the runner SHALL skip the `toVersion: 2` entry
- **AND** apply only the `toVersion: 3` entry

#### Scenario: Current-shape state round-trips without spurious corruption

- **GIVEN** a persisted state at `CURRENT_SCHEMA_VERSION` containing a Space with a materialized nested `spaceInstancesByWindow[windowId][spaceId]` instance and a pinned tab (`pinnedBySpace[spaceId]` holding a `PinNode`, including a `smart` node)
- **WHEN** `readPersistedState` validates it after migration
- **THEN** validation SHALL succeed and `readPersistedState` SHALL return `{ kind: 'ok', state }` with the Space, the nested instance, and the pins intact
- **AND** no `__corrupt_backup_*` record SHALL be written

### Requirement: Schema-to-type coherence

`apps/extension/src/shared/schemas.ts` SHALL include a compile-time assertion that `z.infer<typeof AppStateV2Schema>` and `AppState` (from `apps/extension/src/shared/types.ts`) are structurally equivalent. A drift between the two SHALL cause `pnpm exec tsc --noEmit` to fail.

#### Scenario: Type drift fails the build

- **WHEN** a developer adds a field to `AppState` without updating `AppStateV2Schema`
- **THEN** `pnpm exec tsc --noEmit` SHALL fail with a type-equivalence error in `apps/extension/src/shared/schemas.ts`

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

For the **Zod-validation-failure** branch only (a clean migration chain whose output fails the current-version schema, `AppStateV2Schema`), the layer SHALL FIRST attempt `salvagePersistedState(migrated)` (see Requirement: Partial-corruption salvage preserves valid Space identities). When salvage returns a non-null state, the layer SHALL still write the quarantine record above and SHALL return `{ kind: 'salvaged'; state }`. When salvage returns `null`, the layer SHALL return `{ kind: 'corrupt' }`. The **migration-threw** and **invalid-`schemaVersion`** branches SHALL NOT attempt salvage and SHALL return `{ kind: 'corrupt' }`.

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

- **WHEN** all migrations run without throwing but the resulting object fails validation against the current-version schema (`AppStateV2Schema`)
- **AND** `salvagePersistedState(migrated)` returns `null`
- **THEN** a `QuarantineRecord` SHALL be written to `__corrupt_backup_<ts>` with `reason: 'schema parse failed'`, `zodIssues` set to `parsed.error.issues`, and `rawBytes` set to the original payload
- **AND** `loadState` SHALL return `{ state: createInitialState(), outcome: 'recovered' }`

#### Scenario: Schema validation fails but valid slices are salvaged

- **WHEN** all migrations run without throwing but the resulting object fails validation against `AppStateV2Schema`
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

The storage layer SHALL export a pure function `salvagePersistedState(migrated: unknown): AppStateV2 | null` that attempts to recover a valid `AppStateV2` from a payload that failed whole-state validation, preserving as much real data as possible instead of discarding all of it.

`salvagePersistedState` SHALL:

1. Return `null` when `migrated` is not a non-null object.
2. Start from a valid empty base equal in shape to `createInitialState()` at `CURRENT_SCHEMA_VERSION`.
3. Salvage the `spaces` array **element-wise**: when the input's `spaces` value is an array, keep each element that individually validates against the Space element schema (`AppStateV2Schema.shape.spaces.element`), preserving array order and dropping only the invalid elements; otherwise keep `[]`. A single malformed Space SHALL NOT cost the other Spaces.
4. Salvage every other top-level slice (`schemaVersion`, `activeSpaceByWindow`, `spaceInstancesByWindow`, `tabBindings`, `savedTabs`, `lastActivatedSpaceId`, `tabLastActivity`, `archivedTabs`, `trash`, `pinnedBySpace`, `faviconRow`) **slice-wise**: validate the input's value against that slice's own schema (`AppStateV2Schema.shape.<field>`); on success the validated value SHALL be kept, on failure the empty-base default SHALL be kept.
5. Validate the assembled object against `AppStateV2Schema` and return it on success, or `null` on failure.

Because the `spaces` array is salvaged element-wise, a payload SHALL preserve every individually-valid Space's `id`, `name`, `color`, and `icon`, even when other Spaces in the same array are malformed and even when unrelated slices (e.g. `savedTabs`) are malformed. Because `faviconRow` is salvaged slice-wise, a valid `faviconRow` SHALL be preserved rather than reset whenever it individually validates. Because `pinnedBySpace` is validated against the current-version slice schema (which admits all three `PinNode` kinds), a pinned tree containing `smart` nodes SHALL survive salvage intact rather than being reset. Dangling references that result from a dropped Space or slice (e.g. a `pinnedBySpace` entry pointing at a reset `savedTabs`, or `activeSpaceByWindow` referencing a dropped Space) are tolerated by the existing load-path de-duplication and the sidebar projections (see the *Loaded state has unique ids per keyed collection* requirement).

A salvaged state SHALL flow through the existing `dedupePersistedState` step and SHALL be eligible for the existing write-back self-heal, exactly as a migrated/de-duplicated `ok` state is.

#### Scenario: A malformed unrelated slice preserves all Space names

- **GIVEN** a migrated payload whose `spaces` slice is `[{ id: 'a', name: 'Work', color: 'blue', icon: 'star' }, { id: 'b', name: 'Personal', color: 'red', icon: 'star' }]` but whose `savedTabs` slice contains a record missing its required `originalURL`
- **WHEN** whole-state validation fails and `salvagePersistedState` runs
- **THEN** it SHALL return a valid `AppStateV2` whose `spaces` equals the two input Spaces unchanged
- **AND** `savedTabs` SHALL be reset to `{}`
- **AND** `readPersistedState` SHALL return `{ kind: 'salvaged', state }`

#### Scenario: An invalid Space among valid Spaces is dropped, the rest preserved

- **GIVEN** a migrated payload whose `spaces` slice is `[{ id: 'a', name: 'Work', color: 'blue', icon: 'star' }, { id: 'b', color: 'red', icon: 'star' }]` (the second Space is missing its required `name`)
- **WHEN** `salvagePersistedState` runs
- **THEN** the element-wise `spaces` salvage SHALL keep `{ id: 'a', name: 'Work', color: 'blue', icon: 'star' }` and drop the nameless element
- **AND** the assembled object SHALL validate against `AppStateV2Schema` with `spaces` equal to `[{ id: 'a', name: 'Work', color: 'blue', icon: 'star' }]`
- **AND** `readPersistedState` SHALL return `{ kind: 'salvaged', state }`

#### Scenario: A valid faviconRow survives an unrelated slice failure

- **GIVEN** a migrated payload whose `faviconRow` slice is a valid `SavedTabId[]` but whose `savedTabs` slice is malformed
- **WHEN** whole-state validation fails and `salvagePersistedState` runs
- **THEN** the assembled object's `faviconRow` SHALL equal the input `faviconRow` (favourites are not reset)
- **AND** `readPersistedState` SHALL return `{ kind: 'salvaged', state }`

#### Scenario: A pinned tree containing a smart node survives salvage

- **GIVEN** a migrated payload whose `pinnedBySpace` slice is valid and contains a `smart` node, but whose `savedTabs` slice is malformed
- **WHEN** whole-state validation fails and `salvagePersistedState` runs
- **THEN** the assembled object's `pinnedBySpace` SHALL equal the input slice intact, the smart node's config fields included
- **AND** `readPersistedState` SHALL return `{ kind: 'salvaged', state }`

#### Scenario: A non-object payload is unsalvageable

- **WHEN** `salvagePersistedState` is called with a string, number, array, or `null`
- **THEN** it SHALL return `null`
- **AND** `readPersistedState` SHALL return `{ kind: 'corrupt' }`

### Requirement: ArchivedTab record shape on AppState

`AppState.archivedTabs` SHALL be typed as `ArchivedTab[]` in [apps/extension/src/shared/types.ts](../../../apps/extension/src/shared/types.ts) and validated by `ArchivedTabSchema` (a `z.strictObject`) inside the current-version `AppState` schema (`AppStateV2Schema`) in [apps/extension/src/shared/schemas.ts](../../../apps/extension/src/shared/schemas.ts).

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

No additional fields SHALL be added in v1. Page snapshots, favicon URLs, scroll positions, and form state are explicitly out of scope (per [docs/01-vision.md](../../../docs/01-vision.md)).

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
- **THEN** `AppStateV2Schema.parse` SHALL fail validation (strict mode)
- **AND** the storage layer SHALL quarantine per the corruption-quarantine requirement

### Requirement: Spaces persist an optional auto-archive override

The persisted `Space` record SHALL carry an optional `autoArchive` field of type `SpaceAutoArchive = { mode: 'off' } | { mode: 'custom'; idleMinutes: number }`, validated by `SpaceAutoArchiveSchema` inside the current-version `AppState` schema (`AppStateV2Schema`). This field is part of the **clean v1 baseline shape** — it is present in the baseline `Space` schema directly and is NOT introduced by a migration (the placeholder-era `v10Tov11` migration that originally added it is deleted with the rest of the collapsed chain). The behavior of resolving and applying the override is owned by the `auto-archive` capability; this requirement is limited to the persisted-shape contract.

An **absent** `autoArchive` SHALL mean *inherit the global auto-archive setting* — the durable, on-disk representation of "this Space follows the `autoArchiveEnabled` / `autoArchiveIdleMinutes` settings". A `{ mode: 'off' }` value SHALL mean *never auto-archive this Space*; a `{ mode: 'custom'; idleMinutes }` value SHALL carry a positive-integer threshold (validated `z.number().int().positive()`, so `0`/negatives are rejected at the storage boundary; the resolver additionally clamps to a floor of 1).

The baseline schemas SHALL include `SpaceAutoArchiveSchema`; the baseline `Space` schema (carrying the optional `autoArchive`); the baseline trashed-Space schema (carrying the optional `autoArchive` — REQUIRED because `TrashedSpace extends Space`, so leaving `trash` validated by a Space schema without the field would break the `AssertEqual` schema-to-type guard once `Space` carries it); and the current-version `AppState` schema (whose `spaces` validate the Space shape and `trash` the trashed-Space shape). An absent `autoArchive` is valid, so no record requires rewriting on load.

#### Scenario: A fresh baseline Space has no override

- **WHEN** a Space is created with no `autoArchive` set
- **THEN** the persisted Space SHALL omit `autoArchive`
- **AND** validation against `AppStateV2Schema` SHALL succeed (absent = inherit the global setting)

#### Scenario: A custom override round-trips through storage

- **WHEN** a Space with `autoArchive: { mode: 'custom', idleMinutes: 15 }` is persisted and re-read
- **THEN** the override SHALL survive the round-trip intact

#### Scenario: An off override round-trips through storage

- **WHEN** a Space with `autoArchive: { mode: 'off' }` is persisted and re-read
- **THEN** the override SHALL survive the round-trip intact

#### Scenario: A trashed Space's override round-trips through storage

- **WHEN** a trashed Space (in `state.trash`) carrying `autoArchive: { mode: 'custom', idleMinutes: 20 }` is persisted and re-read
- **THEN** validation against `AppStateV2Schema` (whose `trash` carries the optional `autoArchive`) SHALL succeed
- **AND** the override SHALL survive the round-trip intact

#### Scenario: A malformed override is rejected, then salvaged

- **WHEN** a Space's stored `autoArchive` fails `SpaceAutoArchiveSchema` validation
- **THEN** whole-state validation SHALL fail and the existing salvage path SHALL apply (the original bytes are quarantined under a `__corrupt_backup_*` key)

## ADDED Requirements

### Requirement: smartFolders is ephemeral and excluded from persistence

The `smartFolders` slice of `AppState` (smart-folder runtime results — see the `smart-folders` capability) SHALL be treated as ephemeral runtime state and SHALL NOT be written to `chrome.storage.local`. The `persist(state)` function SHALL exclude `smartFolders` before serializing, exactly as it excludes `liveTabsById`. The slice itself SHALL NOT trigger a `schemaVersion` increment and SHALL NOT require a migration (the v1→v2 bump in this change is caused by the widened persisted `PinNode` union, not by this slice). On service-worker boot the slice SHALL start empty and be populated only by connector fetches, never read back from storage — smart-folder result data (work-sensitive MR titles) never touches disk.

#### Scenario: persist omits smartFolders

- **WHEN** `persist(state)` runs with a populated `state.smartFolders`
- **THEN** the object written under the storage key SHALL NOT contain a `smartFolders` field
- **AND** the rest of the persisted state SHALL be byte-for-byte what it would be without the slice present

#### Scenario: Loaded state has no smartFolders until fetched

- **WHEN** `loadState()` reads persisted state at boot
- **THEN** the loaded state SHALL NOT contain a `smartFolders` field from disk
- **AND** `smartFolders` SHALL only be populated by connector result events
