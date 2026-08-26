## MODIFIED Requirements

### Requirement: Versioned local-storage envelope

The persisted `AppState` SHALL live in `chrome.storage.local` under the key `lunma.state` as an envelope of shape `{ schemaVersion: number; state: AppState }`. The envelope's `schemaVersion` SHALL equal the `CURRENT_SCHEMA_VERSION` constant exported from `apps/extension/src/shared/schemas.ts` at write time. The current version SHALL be `19` (raised from `18` by `add-tab-provenance`, which adds the `provenanceByToken` and `provenanceCleanupPending` slices; version `18` came from `remap-renamed-lucide-icons`, which rewrites the five icon names lucide 1.31.0 renamed wherever they are persisted; version `17` came from `persist-lens-article-layout`, adding the optional lens `articleLayout?: 'grid' | 'list'`; version `16` came from `add-bitbucket-connector`, which widens the `LensProvider` enum to include `'bitbucket'` and adds the optional `workspace?` field to `SourceAccount`; version `15` came from `rekey-lens-sections-by-source-id`, which re-keys lens sections by account `sourceId` and rewrites the persisted `lensItemBindings` keys and `lensReadState` ids; version `14` came from `lens-view-filters`, adding the optional lens `filter?: LensFilter`; version `13` came from `decouple-source-accounts`, which adds the top-level `sources` slice — the `SourceAccount` map — and rewrites each lens node's `sources` from embedded `LensSource[]` to `LensSourceRef[]` references; version `12` came from `review-lens`, which widened the persisted lens `lensKind` enum to `'general' | 'review'`; version `11` came from `establish-lens-model`, the smart→lens rename — flipping each node's `kind: 'smart'` to `kind: 'lens'`, stamping `lensKind: 'general'`, and renaming `smartItemBindings → lensItemBindings` / `smartReadState → lensReadState`; version `10` came from `smart-source-rename`, adding an optional `name` to each source; version `9` came from `multi-filter-smart-connectors`, replacing the flat `query?` with `sources: LensSource[]` carrying `queries[]`).

The `state.schemaVersion` field on `AppState` itself SHALL match the envelope's `schemaVersion` whenever both are present. The envelope-level field is the value the migration runner reads; the in-state field is informational.

#### Scenario: A valid current-version envelope round-trips

- **WHEN** the storage layer loads an envelope whose `schemaVersion` equals `CURRENT_SCHEMA_VERSION`
- **THEN** the storage layer SHALL load it without running any migration

### Requirement: Append-only migrations list

The `migrations: Migration[]` array exported from `apps/extension/src/shared/migrations.ts` SHALL be append-only **from the v1 baseline onward**. A `Migration` SHALL be `{ toVersion: number; migrate: (raw: unknown) => unknown }`. Each `migrate` function SHALL be synchronous and pure.

The list holds **eighteen** entries:
- the twelve entries through `toVersion: 13` (as previously specified — the eleven identity/transform entries through `{ toVersion: 12 }` plus the `{ toVersion: 13 }` source-extraction migration from `decouple-source-accounts`);
- `{ toVersion: 14 }` (`lens-view-filters`): additive identity pass-through — the lens `PinNode` gains an OPTIONAL `filter?: LensFilter`;
- `{ toVersion: 15 }` (`rekey-lens-sections-by-source-id`): a transform that rewrites persisted `lensItemBindings` keys **and `lensReadState` ids** onto account `sourceId`s;
- `{ toVersion: 16 }` (`add-bitbucket-connector`): a pure **identity pass-through** (`(raw) => raw`). Adding `'bitbucket'` to the `LensProvider` union and the optional `workspace?: string` field to `SourceAccount` are additive enum/field widenings that require no data transformation; the entry exists only to advance the version (so a downgrade past v16 is detectable via the version gate, and an older extension quarantines newer data carrying a `bitbucket` source or a `workspace` field). This follows the v2/v4/v6 provider-addition precedent;
- `{ toVersion: 17 }` (`persist-lens-article-layout`): a pure **identity pass-through** (`(raw) => raw`). The lens `PinNode` gains an OPTIONAL `articleLayout?: 'grid' | 'list'`; pre-v17 nodes simply lack it and remain valid (resolving to the `grid` default), so no transform is required and the entry exists only to advance the version;
- `{ toVersion: 18 }` (`remap-renamed-lucide-icons`): a **real transformation** that rewrites renamed lucide icon names in place (see Requirement: Renamed lucide icon names are remapped on load).

- `{ toVersion: 19 }` (`add-tab-provenance`): an **additive** migration defaulting `provenanceByToken` to `{}` and `provenanceCleanupPending` to `false`. No existing data is reshaped; the entry exists so a downgrade past v19 is detectable via the version gate.

The last entry's `toVersion` SHALL equal `CURRENT_SCHEMA_VERSION` (19); `assertMigrationsTerminal`/`runMigrations` SHALL throw on boot if they disagree.

#### Scenario: The chain holds exactly the v2 through v16 entries

- **GIVEN** the `migrations` list exported from `apps/extension/src/shared/migrations.ts`
- **THEN** its first fifteen entries SHALL carry `toVersion` values `2, 3, …, 14, 15, 16` in order — the entries through `{ toVersion: 14 }` (as previously specified), the `{ toVersion: 15 }` binding-rekey migration, and `{ toVersion: 16 }` (the identity provider/workspace-widening migration)

#### Scenario: The v16 migration is an identity pass-through

- **GIVEN** a v15 envelope with lens nodes referencing existing accounts
- **WHEN** `runMigrations` applies the v16 migration
- **THEN** the state is returned unchanged except for the version advancing to 16

#### Scenario: The chain holds exactly the v2 through v18 entries

- **GIVEN** the `migrations` list exported from `apps/extension/src/shared/migrations.ts`
- **THEN** `migrations` SHALL have, as its first seventeen entries, `toVersion` values `2, 3, …, 16, 17, 18` in order — the fifteen entries through `{ toVersion: 16 }` above, the `{ toVersion: 17 }` article-layout identity migration, and `{ toVersion: 18 }` (the icon-rename remap)

#### Scenario: The v17 migration is an identity pass-through

- **GIVEN** a v16 envelope with lens nodes carrying no `articleLayout`
- **WHEN** `runMigrations` applies the v17 migration
- **THEN** the state is returned unchanged except for the version advancing to 17

#### Scenario: The chain holds exactly the v2 through v19 entries

- **GIVEN** the `migrations` list exported from `apps/extension/src/shared/migrations.ts`
- **THEN** `migrations` SHALL have eighteen entries with `toVersion` values `2, 3, …, 17, 18, 19` in order, ending with the provenance-slice migration

#### Scenario: The v19 migration defaults the provenance slices

- **GIVEN** a v18 envelope carrying no provenance slices
- **WHEN** `runMigrations` applies the v19 migration
- **THEN** the state SHALL carry `provenanceByToken: {}` and `provenanceCleanupPending: false`, and nothing else SHALL be reshaped

### Requirement: Migration runner applies pending migrations in order

On every SW boot, the storage layer SHALL invoke `runMigrations(raw, persistedVersion)` which iterates `migrations` in array order, applies the `migrate` function of every entry whose `toVersion > persistedVersion`, threading each output as the input to the next, and stops when there are no more entries to apply.

After the runner returns, the resulting object SHALL be validated against the Zod schema for the current schema version, `AppStateV19Schema`. `AppStateV19Schema` EXTENDS `AppStateV18Schema` with `provenanceByToken` and `provenanceCleanupPending`, both carrying Zod `.default(...)` values (`{}` and `false`) — `backup.ts` validates an imported portable subset against the current AppState schema, and without defaults a same-version backup import would fail. Unlike the alias bumps before it this is a real shape change, so `AppStateV18Schema` SHALL be retained frozen rather than aliased forward. The **historical** `LensSourceSchema` and `SmartSourceConfigV8Schema` enums (the lens *source-ref* enums, distinct from `SourceAccountSchema`) are frozen four-member parse targets for the V6–V12 schemas and SHALL NOT be widened. If `persistedVersion < CURRENT_SCHEMA_VERSION` and validation succeeds, the storage layer SHALL write the new envelope `{ schemaVersion: 19, state }` back to `lunma.state` before returning. If `persistedVersion === CURRENT_SCHEMA_VERSION`, no write-back SHALL occur on boot. The boot chain SHALL still run the one-time `reconcileAccountSecrets` step against the separate `lunma.connectors` store (see the `connector-accounts` capability) — a boot-sequence side effect, not part of the pure migration runner.

#### Scenario: A migrated envelope validates against the current schema

- **GIVEN** a v17 envelope carrying Spaces and pinned folders
- **WHEN** `readPersistedState` validates it after the v18 and v19 migrations
- **THEN** validation SHALL succeed against `AppStateV19Schema` and the envelope SHALL be written back as `{ schemaVersion: 19, state }`

#### Scenario: A Cloud bitbucket account's workspace round-trips through the schema

- **GIVEN** a state carrying `sources['acc-bb'] = { id: 'acc-bb', provider: 'bitbucket', baseUrl: 'https://bitbucket.org', workspace: 'acme' }`
- **WHEN** it is validated against `AppStateV19Schema`
- **THEN** validation SHALL succeed and the `workspace` field SHALL be preserved

#### Scenario: A current-version envelope is not rewritten

- **GIVEN** an envelope already at `{ schemaVersion: 19 }`
- **WHEN** the storage layer loads it on boot
- **THEN** no migration runs and no write-back occurs

#### Scenario: A v19 state carrying provenance slices validates

- **GIVEN** a migrated state carrying `provenanceByToken` and `provenanceCleanupPending`
- **WHEN** it is validated against `AppStateV19Schema`
- **THEN** validation SHALL succeed and both slices SHALL be preserved

#### Scenario: A portable backup without the provenance slices still imports

- **GIVEN** an exported backup carrying only the portable subset, with no provenance slices
- **WHEN** it is validated against the current AppState schema on import
- **THEN** validation SHALL succeed, the slices resolving to their declared defaults

### Requirement: Schema-to-type coherence

`apps/extension/src/shared/schemas.ts` SHALL include a compile-time assertion that `z.infer<typeof AppStateV19Schema>` and `AppState` (from `apps/extension/src/shared/types.ts`) are structurally equivalent. A drift between the two SHALL cause `pnpm exec tsc --noEmit` to fail.

The `AppStateV19Schema` SHALL define `sources` as:
```
z.record(z.string(), SourceAccountSchema).default({})
```
where `SourceAccountSchema` is a `z.strictObject` of `{ id, provider, baseUrl, name?, workspace? }` carrying no token field, so the inferred type is `Record<SourceId, SourceAccount>` matching `AppState.sources`. The `workspace?: string` field is optional (carrying the Cloud bitbucket workspace slug — see the `connector-accounts` capability) and the `provider` enum includes `'bitbucket'`.

The lens branch of `PinNodeSchema` SHALL validate `sources` as `z.array(LensSourceRefSchema).min(1)` where `LensSourceRefSchema` is `{ sourceId: z.string(); queries: z.array(z.enum(['authored','assigned','review-requested'])) }`.

`lensItemBindings` and `lensReadState` SHALL be typed with `${sourceId}:${query}:${nativeId}`-form (rss: `${sourceId}:${nativeId}`) namespaced string keys/ids (per `rekey-lens-sections-by-source-id`); the key/id form is a string convention, not a Zod-typed field.

No `as unknown as AppState` cast SHALL remain in the codebase for values produced by `AppStateV19Schema.safeParse`.

#### Scenario: Type drift fails the build

- **WHEN** a developer changes the `AppState.sources` value type without updating `SourceAccountSchema`
- **THEN** `pnpm exec tsc --noEmit` SHALL fail with a type-equivalence error in `apps/extension/src/shared/schemas.ts`

#### Scenario: The workspace field is part of the coherence assertion

- **WHEN** `SourceAccount` in `types.ts` carries `workspace?: string` and `SourceAccountSchema` adds the same optional field
- **THEN** `_schemaMatchesAppState: AssertEqual<AppStateV19, AppState>` SHALL hold and `tsc --noEmit` SHALL pass

#### Scenario: A lens node with embedded sources is rejected under v16

- **WHEN** `AppStateV19Schema.safeParse` is given a lens node whose `sources` entry carries `{ source, baseUrl, queries }` (the v12 embedded shape) instead of `{ sourceId, queries }`
- **THEN** validation SHALL fail (the lens branch requires `LensSourceRef[]`)
