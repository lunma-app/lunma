## MODIFIED Requirements

### Requirement: Versioned local-storage envelope

The persisted `AppState` SHALL live in `chrome.storage.local` under the key `lunma.state` as an envelope of shape `{ schemaVersion: number; state: AppState }`. The envelope's `schemaVersion` SHALL equal the `CURRENT_SCHEMA_VERSION` constant exported from `apps/extension/src/shared/schemas.ts` at write time. The current version SHALL be `10` (raised from `9` by the `smart-source-rename` change, which adds an **optional `name`** to each `SmartSourceConfig`; version `9` came from `multi-filter-smart-connectors`, which replaced the flat `query?` triple with `sources: SmartSourceConfig[]` carrying `queries[]` and re-keyed `smartItemBindings`).

The `state.schemaVersion` field on `AppState` itself SHALL match the envelope's `schemaVersion` whenever both are present. The envelope-level field is the value the migration runner reads; the in-state field is informational.

#### Scenario: A valid current-version envelope round-trips

- **WHEN** the storage layer loads an envelope whose `schemaVersion` equals `CURRENT_SCHEMA_VERSION`
- **THEN** the storage layer SHALL load it without running any migration

### Requirement: Append-only migrations list

The `migrations: Migration[]` array exported from `apps/extension/src/shared/migrations.ts` SHALL be append-only **from the v1 baseline onward**. A `Migration` SHALL be `{ toVersion: number; migrate: (raw: unknown) => unknown }`. Each `migrate` function SHALL be synchronous and pure.

The list holds nine entries: the eight entries through `toVersion: 9` (as previously specified — the `toVersion: 9` entry is the `multi-filter-smart-connectors` real transformation that rewrites each smart node's `sources[]` from the `query?` shape to `queries[]` and re-keys `smartItemBindings` to the per-filter namespaced form, pruning orphaned bindings) plus a new `{ toVersion: 10 }` migration added by `smart-source-rename`. The **v10 migration is additive (identity)**: `SmartSourceConfig` gains an OPTIONAL `name` field, so pre-v10 nodes (which simply lack it) pass through unchanged — there is no structural rewrite.

#### Scenario: The chain holds exactly the v2 through v10 entries

- **GIVEN** the `migrations` list exported from `apps/extension/src/shared/migrations.ts`
- **THEN** `migrations` SHALL equal a nine-entry list — `{ toVersion: 2 }` through `{ toVersion: 9 }` (as previously specified), then `{ toVersion: 10 }` (the additive `name` migration)

#### Scenario: The v10 migration leaves existing sources structurally unchanged

- **GIVEN** a v9 envelope with a smart node whose sources carry no `name`
- **WHEN** `runMigrations` applies the v10 migration
- **THEN** the output is structurally unchanged apart from the bumped schema version, and the sources still validate (with `name` absent/optional)

### Requirement: Migration runner applies pending migrations in order

On every SW boot, the storage layer SHALL invoke `runMigrations(raw, persistedVersion)` which iterates `migrations` in array order, applies the `migrate` function of every entry whose `toVersion > persistedVersion`, threading each output as the input to the next, and stops when there are no more entries to apply.

After the runner returns, the resulting object SHALL be validated against the Zod schema for the current schema version, `AppStateV10Schema`. `AppStateV10Schema` is the v9 schema with `PinNodeSchema`'s smart branch updated so each `SmartSourceConfigSchema` entry MAY carry an optional `name: string`. If `persistedVersion < CURRENT_SCHEMA_VERSION` and validation succeeds, the storage layer SHALL write the new envelope `{ schemaVersion: 10, state }` back to `lunma.state` before returning. If `persistedVersion === CURRENT_SCHEMA_VERSION`, no write-back SHALL occur on boot.

#### Scenario: A migrated envelope validates against the current schema

- **GIVEN** a v9 envelope carrying a smart node
- **WHEN** `readPersistedState` validates it after the v10 migration
- **THEN** validation SHALL succeed against `AppStateV10Schema` and the envelope SHALL be written back as `{ schemaVersion: 10, state }`
