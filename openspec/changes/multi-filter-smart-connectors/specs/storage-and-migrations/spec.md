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
