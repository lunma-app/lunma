## MODIFIED Requirements

### Requirement: Versioned local-storage envelope

The persisted `AppState` SHALL live in `chrome.storage.local` under the key `lunma.state` as an envelope of shape `{ schemaVersion: number; state: AppState }`. The envelope's `schemaVersion` SHALL equal the `CURRENT_SCHEMA_VERSION` constant exported from `apps/extension/src/shared/schemas.ts` at write time. The current version SHALL be `8` (raised from `7` by the `multi-source-smart-folders` change, which replaces the flat `source`/`baseUrl`/`query?` triple on smart `PinNode`s with `sources: SmartSourceConfig[]`, and widens `smartItemBindings` item keys to the namespaced form `${sourceKey}:${nativeId}`).

The `state.schemaVersion` field on `AppState` itself SHALL match the envelope's `schemaVersion` whenever both are present. The envelope-level field is the value the migration runner reads; the in-state field is informational.

#### Scenario: A valid current-version envelope round-trips

- **WHEN** the storage layer loads an envelope whose `schemaVersion` equals `CURRENT_SCHEMA_VERSION`
- **THEN** the storage layer SHALL load it without running any migration

### Requirement: Append-only migrations list

The `migrations: Migration[]` array exported from `apps/extension/src/shared/migrations.ts` SHALL be append-only **from the v1 baseline onward**. A `Migration` SHALL be `{ toVersion: number; migrate: (raw: unknown) => unknown }`. Each `migrate` function SHALL be synchronous and pure.

The list holds seven entries: the six entries from the prior version (`toVersion: 2` through `toVersion: 7`) plus a new `{ toVersion: 8 }` migration added by this change. The v8 migration is a **real transformation**: for each `smart` `PinNode` in every space in `pinnedBySpace`, it wraps the flat `source`/`baseUrl`/`query?` fields into `sources: [{ source, baseUrl, query }]` and removes the root-level fields. Additionally, for each `smartItemBindings[folderId]`, it derives the `sourceKey` from the corresponding migrated node's `sources[0]` (as `${source}:${new URL(baseUrl).host}`) and prefixes every `itemId` as `${sourceKey}:${itemId}`. A `folderId` in `smartItemBindings` with no matching node in `pinnedBySpace` (orphaned binding) SHALL have its entire entry dropped (correct: orphaned bindings are pruned).

#### Scenario: The chain holds exactly the v2 through v8 entries

- **GIVEN** the `migrations` list exported from `apps/extension/src/shared/migrations.ts`
- **THEN** `migrations` SHALL equal a seven-entry list — `{ toVersion: 2 }`, `{ toVersion: 3 }`, `{ toVersion: 4 }`, `{ toVersion: 5 }`, `{ toVersion: 6 }`, `{ toVersion: 7 }`, then `{ toVersion: 8 }` (the last being a real transformation; the earlier entries are as previously specified)
- **AND** `CURRENT_SCHEMA_VERSION` SHALL equal `8`

#### Scenario: A v7 smart node is wrapped into sources array

- **GIVEN** a persisted envelope at `schemaVersion: 7` with a smart PinNode `{ kind: 'smart', source: 'gitlab', baseUrl: 'https://gitlab.com', query: 'authored', ... }`
- **WHEN** `runMigrations` applies the v8 migration
- **THEN** the node SHALL become `{ kind: 'smart', sources: [{ source: 'gitlab', baseUrl: 'https://gitlab.com', query: 'authored' }], ... }` with no root-level `source`/`baseUrl`/`query` fields
- **AND** `schemaVersion` in the written envelope SHALL be `8`

#### Scenario: A v7 smartItemBindings entry is re-keyed with the source namespace

- **GIVEN** a persisted envelope at `schemaVersion: 7` with a smart node `{ source: 'gitlab', baseUrl: 'https://gitlab.com', ... }` having folderId `f1` and `smartItemBindings: { 'f1': { '42': { 100: { tabId: 99, allowGlob: 'https://gitlab.com/-/merge_requests/42*' } } } }`
- **WHEN** `runMigrations` applies the v8 migration
- **THEN** the result SHALL have `smartItemBindings: { 'f1': { 'gitlab:gitlab.com:42': { 100: { tabId: 99, allowGlob: 'https://gitlab.com/-/merge_requests/42*' } } } }`
- **AND** the old non-namespaced key `'42'` SHALL be absent

#### Scenario: An orphaned smartItemBindings folderId is dropped

- **GIVEN** a persisted envelope at `schemaVersion: 7` with `smartItemBindings: { 'orphan-f2': { '5': { 100: { tabId: 88, allowGlob: '' } } } }` but no matching smart node in `pinnedBySpace`
- **WHEN** `runMigrations` applies the v8 migration
- **THEN** `smartItemBindings` SHALL NOT contain key `'orphan-f2'`

#### Scenario: A v7 envelope with no smart nodes or bindings passes through cleanly

- **GIVEN** a persisted envelope at `schemaVersion: 7` with no smart PinNodes and `smartItemBindings: {}`
- **WHEN** `runMigrations` applies the v8 migration
- **THEN** `pinnedBySpace` is unchanged, `smartItemBindings` is `{}`, and `schemaVersion` is `8`

#### Scenario: A v1 envelope migrates to the current version losslessly

- **WHEN** `persistedVersion = 1`, `CURRENT_SCHEMA_VERSION = 8`, and `migrations` contains entries with `toVersion: 2` through `toVersion: 8`
- **THEN** the runner applies all seven in order, validation succeeds against the v8 schema, and the envelope is written back as `{ schemaVersion: 8, state }`

### Requirement: Migration runner applies pending migrations in order

On every SW boot, the storage layer SHALL invoke `runMigrations(raw, persistedVersion)` which iterates `migrations` in array order, applies the `migrate` function of every entry whose `toVersion > persistedVersion`, threading each output as the input to the next, and stops when there are no more entries to apply.

After the runner returns, the resulting object SHALL be validated against the Zod schema for the current schema version, `AppStateV8Schema`. `AppStateV8Schema` is the v7 schema with `PinNodeSchema`'s smart branch updated to use `SmartSourceConfigSchema[]` and with `SmartItemBindingsSchema` using namespaced string item keys. If `persistedVersion < CURRENT_SCHEMA_VERSION` and validation succeeds, the storage layer SHALL write the new envelope `{ schemaVersion: 8, state }` back to `lunma.state` before returning. If `persistedVersion === CURRENT_SCHEMA_VERSION`, no write-back SHALL occur on boot.

#### Scenario: Current-shape state round-trips without spurious corruption

- **GIVEN** a persisted state at `CURRENT_SCHEMA_VERSION = 8` containing a smart PinNode with `sources: [...]` and a populated `smartItemBindings` entry with namespaced keys
- **WHEN** `readPersistedState` validates it after migration
- **THEN** validation SHALL succeed and `readPersistedState` SHALL return `{ kind: 'ok', state }` with all data intact
- **AND** no `__corrupt_backup_*` record SHALL be written
