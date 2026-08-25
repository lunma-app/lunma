## MODIFIED Requirements

### Requirement: Versioned local-storage envelope

The persisted `AppState` SHALL live in `chrome.storage.local` under the key `lunma.state` as an envelope of shape `{ schemaVersion: number; state: AppState }`. The envelope's `schemaVersion` SHALL equal the `CURRENT_SCHEMA_VERSION` constant exported from `apps/extension/src/shared/schemas.ts` at write time. The current version SHALL be `18` (raised from `17` by `remap-renamed-lucide-icons`, which rewrites the five icon names lucide 1.31.0 renamed wherever they are persisted; version `17` came from `persist-lens-article-layout`, adding the optional lens `articleLayout?: 'grid' | 'list'`; version `16` came from `add-bitbucket-connector`, which widens the `LensProvider` enum to include `'bitbucket'` and adds the optional `workspace?` field to `SourceAccount`; version `15` came from `rekey-lens-sections-by-source-id`, which re-keys lens sections by account `sourceId` and rewrites the persisted `lensItemBindings` keys and `lensReadState` ids; version `14` came from `lens-view-filters`, adding the optional lens `filter?: LensFilter`; version `13` came from `decouple-source-accounts`, which adds the top-level `sources` slice — the `SourceAccount` map — and rewrites each lens node's `sources` from embedded `LensSource[]` to `LensSourceRef[]` references; version `12` came from `review-lens`, which widened the persisted lens `lensKind` enum to `'general' | 'review'`; version `11` came from `establish-lens-model`, the smart→lens rename — flipping each node's `kind: 'smart'` to `kind: 'lens'`, stamping `lensKind: 'general'`, and renaming `smartItemBindings → lensItemBindings` / `smartReadState → lensReadState`; version `10` came from `smart-source-rename`, adding an optional `name` to each source; version `9` came from `multi-filter-smart-connectors`, replacing the flat `query?` with `sources: LensSource[]` carrying `queries[]`).

The `state.schemaVersion` field on `AppState` itself SHALL match the envelope's `schemaVersion` whenever both are present. The envelope-level field is the value the migration runner reads; the in-state field is informational.

#### Scenario: A valid current-version envelope round-trips

- **WHEN** the storage layer loads an envelope whose `schemaVersion` equals `CURRENT_SCHEMA_VERSION`
- **THEN** the storage layer SHALL load it without running any migration

### Requirement: Append-only migrations list

The `migrations: Migration[]` array exported from `apps/extension/src/shared/migrations.ts` SHALL be append-only **from the v1 baseline onward**. A `Migration` SHALL be `{ toVersion: number; migrate: (raw: unknown) => unknown }`. Each `migrate` function SHALL be synchronous and pure.

The list holds **seventeen** entries:
- the twelve entries through `toVersion: 13` (as previously specified — the eleven identity/transform entries through `{ toVersion: 12 }` plus the `{ toVersion: 13 }` source-extraction migration from `decouple-source-accounts`);
- `{ toVersion: 14 }` (`lens-view-filters`): additive identity pass-through — the lens `PinNode` gains an OPTIONAL `filter?: LensFilter`;
- `{ toVersion: 15 }` (`rekey-lens-sections-by-source-id`): a transform that rewrites persisted `lensItemBindings` keys **and `lensReadState` ids** onto account `sourceId`s;
- `{ toVersion: 16 }` (`add-bitbucket-connector`): a pure **identity pass-through** (`(raw) => raw`). Adding `'bitbucket'` to the `LensProvider` union and the optional `workspace?: string` field to `SourceAccount` are additive enum/field widenings that require no data transformation; the entry exists only to advance the version (so a downgrade past v16 is detectable via the version gate, and an older extension quarantines newer data carrying a `bitbucket` source or a `workspace` field). This follows the v2/v4/v6 provider-addition precedent;
- `{ toVersion: 17 }` (`persist-lens-article-layout`): a pure **identity pass-through** (`(raw) => raw`). The lens `PinNode` gains an OPTIONAL `articleLayout?: 'grid' | 'list'`; pre-v17 nodes simply lack it and remain valid (resolving to the `grid` default), so no transform is required and the entry exists only to advance the version;
- `{ toVersion: 18 }` (`remap-renamed-lucide-icons`): a **real transformation** that rewrites renamed lucide icon names in place (see Requirement: Renamed lucide icon names are remapped on load).

The last entry's `toVersion` SHALL equal `CURRENT_SCHEMA_VERSION` (18); `assertMigrationsTerminal`/`runMigrations` SHALL throw on boot if they disagree.

#### Scenario: The chain holds exactly the v2 through v16 entries

- **GIVEN** the `migrations` list exported from `apps/extension/src/shared/migrations.ts`
- **THEN** its first fifteen entries SHALL carry `toVersion` values `2, 3, …, 14, 15, 16` in order — the entries through `{ toVersion: 14 }` (as previously specified), the `{ toVersion: 15 }` binding-rekey migration, and `{ toVersion: 16 }` (the identity provider/workspace-widening migration)

#### Scenario: The v16 migration is an identity pass-through

- **GIVEN** a v15 envelope with lens nodes referencing existing accounts
- **WHEN** `runMigrations` applies the v16 migration
- **THEN** the state is returned unchanged except for the version advancing to 16

#### Scenario: The chain holds exactly the v2 through v18 entries

- **GIVEN** the `migrations` list exported from `apps/extension/src/shared/migrations.ts`
- **THEN** `migrations` SHALL have seventeen entries with `toVersion` values `2, 3, …, 16, 17, 18` in order — the fifteen entries through `{ toVersion: 16 }` above, the `{ toVersion: 17 }` article-layout identity migration, and `{ toVersion: 18 }` (the icon-rename remap)

#### Scenario: The v17 migration is an identity pass-through

- **GIVEN** a v16 envelope with lens nodes carrying no `articleLayout`
- **WHEN** `runMigrations` applies the v17 migration
- **THEN** the state is returned unchanged except for the version advancing to 17

### Requirement: Migration runner applies pending migrations in order

On every SW boot, the storage layer SHALL invoke `runMigrations(raw, persistedVersion)` which iterates `migrations` in array order, applies the `migrate` function of every entry whose `toVersion > persistedVersion`, threading each output as the input to the next, and stops when there are no more entries to apply.

After the runner returns, the resulting object SHALL be validated against the Zod schema for the current schema version, `AppStateV18Schema`. `AppStateV18Schema` is a re-exported **alias** of `AppStateV17Schema`: a persisted icon is a plain `z.string()` on both the `Space` record and the `kind: 'folder'` `PinNode`, so renaming the values an icon may hold changes no shape and needs no new AppState object — V17 and V18 are byte-identical, and the `AppStateV14Schema` validators in `backup.ts`/`messages.ts` and the partial-corruption salvage path are unaffected. The **historical** `LensSourceSchema` and `SmartSourceConfigV8Schema` enums (the lens *source-ref* enums, distinct from `SourceAccountSchema`) are frozen four-member parse targets for the V6–V12 schemas and SHALL NOT be widened. If `persistedVersion < CURRENT_SCHEMA_VERSION` and validation succeeds, the storage layer SHALL write the new envelope `{ schemaVersion: 18, state }` back to `lunma.state` before returning. If `persistedVersion === CURRENT_SCHEMA_VERSION`, no write-back SHALL occur on boot. The boot chain SHALL still run the one-time `reconcileAccountSecrets` step against the separate `lunma.connectors` store (see the `connector-accounts` capability) — a boot-sequence side effect, not part of the pure migration runner.

#### Scenario: A migrated envelope validates against the current schema

- **GIVEN** a v17 envelope carrying Spaces and pinned folders
- **WHEN** `readPersistedState` validates it after the v18 migration
- **THEN** validation SHALL succeed against `AppStateV18Schema` and the envelope SHALL be written back as `{ schemaVersion: 18, state }`

#### Scenario: A Cloud bitbucket account's workspace round-trips through the schema

- **GIVEN** a state carrying `sources['acc-bb'] = { id: 'acc-bb', provider: 'bitbucket', baseUrl: 'https://bitbucket.org', workspace: 'acme' }`
- **WHEN** it is validated against `AppStateV18Schema`
- **THEN** validation SHALL succeed and the `workspace` field SHALL be preserved

#### Scenario: A current-version envelope is not rewritten

- **GIVEN** an envelope already at `{ schemaVersion: 18 }`
- **WHEN** the storage layer loads it on boot
- **THEN** no migration runs and no write-back occurs

## ADDED Requirements

### Requirement: Renamed lucide icon names are remapped on load

Lunma persists a Space's and a pinned folder's icon as a bare name string, and renders nothing for a name its icon allowlist does not carry. When the upstream icon set renames a name Lunma previously offered in its picker, the migration chain SHALL rewrite the stored name so the user's chosen icon keeps rendering.

The `{ toVersion: 18 }` migration SHALL rewrite these five legacy names to their lucide-declared successors wherever an icon is persisted:

| Legacy name | Current name |
| --- | --- |
| `frown` | `face-slightly-frowning` |
| `smile` | `face-slightly-smiling` |
| `smile-plus` | `face-slightly-smiling-plus` |
| `podcast` | `mic-signal` |
| `history` | `rotate-ccw-clock` |

The rewrite SHALL cover every `state.spaces[].icon` and the `icon` of every `kind: 'folder'` node in `state.pinnedBySpace`. It SHALL leave any other icon value untouched — including a name that is neither legacy nor current — rather than substituting a default. It SHALL be idempotent: re-running it over already-current data SHALL be a no-op. It SHALL tolerate malformed input (a missing slice, a non-array, a node that is not an object) by leaving that part of the state unchanged, consistent with every other entry in the chain.

The five legacy names SHALL NOT appear in `ICON_NAMES` (`apps/extension/src/shared/icon-names.ts`) after this change, and their successors SHALL appear in their place, so the picker offers the same number of icons and the generated loader allowlist resolves every one of them.

#### Scenario: A Space icon named by the legacy name is remapped

- **GIVEN** a v17 envelope with a Space whose `icon` is `'smile'`
- **WHEN** `runMigrations` applies the v18 migration
- **THEN** that Space's `icon` SHALL be `'face-slightly-smiling'`

#### Scenario: A pinned folder icon is remapped

- **GIVEN** a v17 envelope with a `kind: 'folder'` node in `pinnedBySpace` whose `icon` is `'history'`
- **WHEN** `runMigrations` applies the v18 migration
- **THEN** that node's `icon` SHALL be `'rotate-ccw-clock'`

#### Scenario: An unaffected icon is left alone

- **GIVEN** a v17 envelope with a Space whose `icon` is `'briefcase'` and another whose `icon` is `'not-an-icon'`
- **WHEN** `runMigrations` applies the v18 migration
- **THEN** both icons SHALL be returned unchanged

#### Scenario: The remap is idempotent

- **GIVEN** a state whose icons are already the current names
- **WHEN** the v18 migration runs over it
- **THEN** the state SHALL be returned unchanged

#### Scenario: The curated icon list carries no removed name

- **GIVEN** `ICON_NAMES` exported from `apps/extension/src/shared/icon-names.ts`
- **THEN** it SHALL contain none of `frown`, `smile`, `smile-plus`, `podcast`, `history`
- **AND** it SHALL contain each of `face-slightly-frowning`, `face-slightly-smiling`, `face-slightly-smiling-plus`, `mic-signal`, `rotate-ccw-clock`
