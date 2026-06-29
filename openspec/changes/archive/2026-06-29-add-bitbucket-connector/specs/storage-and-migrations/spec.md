## MODIFIED Requirements

### Requirement: Versioned local-storage envelope

The persisted `AppState` SHALL live in `chrome.storage.local` under the key `lunma.state` as an envelope of shape `{ schemaVersion: number; state: AppState }`. The envelope's `schemaVersion` SHALL equal the `CURRENT_SCHEMA_VERSION` constant exported from `apps/extension/src/shared/schemas.ts` at write time. The current version SHALL be `16` (raised from `15` by `add-bitbucket-connector`, which widens the `LensProvider` enum to include `'bitbucket'` and adds the optional `workspace?` field to `SourceAccount`; version `15` came from `rekey-lens-sections-by-source-id`, which re-keys lens sections by account `sourceId` and rewrites the persisted `lensItemBindings` keys and `lensReadState` ids; version `14` came from `lens-view-filters`, adding the optional lens `filter?: LensFilter`; version `13` came from `decouple-source-accounts`, which adds the top-level `sources` slice — the `SourceAccount` map — and rewrites each lens node's `sources` from embedded `LensSource[]` to `LensSourceRef[]` references; version `12` came from `review-lens`, which widened the persisted lens `lensKind` enum to `'general' | 'review'`; version `11` came from `establish-lens-model`, the smart→lens rename — flipping each node's `kind: 'smart'` to `kind: 'lens'`, stamping `lensKind: 'general'`, and renaming `smartItemBindings → lensItemBindings` / `smartReadState → lensReadState`; version `10` came from `smart-source-rename`, adding an optional `name` to each source; version `9` came from `multi-filter-smart-connectors`, replacing the flat `query?` with `sources: LensSource[]` carrying `queries[]`).

The `state.schemaVersion` field on `AppState` itself SHALL match the envelope's `schemaVersion` whenever both are present. The envelope-level field is the value the migration runner reads; the in-state field is informational.

#### Scenario: A valid current-version envelope round-trips

- **WHEN** the storage layer loads an envelope whose `schemaVersion` equals `CURRENT_SCHEMA_VERSION`
- **THEN** the storage layer SHALL load it without running any migration

### Requirement: Append-only migrations list

The `migrations: Migration[]` array exported from `apps/extension/src/shared/migrations.ts` SHALL be append-only **from the v1 baseline onward**. A `Migration` SHALL be `{ toVersion: number; migrate: (raw: unknown) => unknown }`. Each `migrate` function SHALL be synchronous and pure.

The list holds **fifteen** entries:
- the twelve entries through `toVersion: 13` (as previously specified — the eleven identity/transform entries through `{ toVersion: 12 }` plus the `{ toVersion: 13 }` source-extraction migration from `decouple-source-accounts`);
- `{ toVersion: 14 }` (`lens-view-filters`): additive identity pass-through — the lens `PinNode` gains an OPTIONAL `filter?: LensFilter`;
- `{ toVersion: 15 }` (`rekey-lens-sections-by-source-id`, this change's **prerequisite**): a transform that rewrites persisted `lensItemBindings` keys **and `lensReadState` ids** onto account `sourceId`s;
- `{ toVersion: 16 }` (`add-bitbucket-connector`): a pure **identity pass-through** (`(raw) => raw`). Adding `'bitbucket'` to the `LensProvider` union and the optional `workspace?: string` field to `SourceAccount` are additive enum/field widenings that require no data transformation; the entry exists only to advance the version (so a downgrade past v16 is detectable via the version gate, and an older extension quarantines newer data carrying a `bitbucket` source or a `workspace` field). This follows the v2/v4/v6 provider-addition precedent.

The last entry's `toVersion` SHALL equal `CURRENT_SCHEMA_VERSION` (16); `assertMigrationsTerminal`/`runMigrations` SHALL throw on boot if they disagree.

#### Scenario: The chain holds exactly the v2 through v16 entries

- **GIVEN** the `migrations` list exported from `apps/extension/src/shared/migrations.ts`
- **THEN** `migrations` SHALL have fifteen entries with `toVersion` values `2, 3, …, 14, 15, 16` in order — the entries through `{ toVersion: 14 }` (as previously specified), the `{ toVersion: 15 }` binding-rekey migration, and `{ toVersion: 16 }` (the identity provider/workspace-widening migration)

#### Scenario: The v16 migration is an identity pass-through

- **GIVEN** a v15 envelope with lens nodes referencing existing accounts
- **WHEN** `runMigrations` applies the v16 migration
- **THEN** the state is returned unchanged except for the version advancing to 16

### Requirement: Migration runner applies pending migrations in order

On every SW boot, the storage layer SHALL invoke `runMigrations(raw, persistedVersion)` which iterates `migrations` in array order, applies the `migrate` function of every entry whose `toVersion > persistedVersion`, threading each output as the input to the next, and stops when there are no more entries to apply.

After the runner returns, the resulting object SHALL be validated against the Zod schema for the current schema version, `AppStateV16Schema`. `AppStateV16Schema` is a re-exported **alias** of `AppStateV15Schema` (itself an alias of `AppStateV14Schema`): the provider/`workspace` widening lands in the single shared `SourceAccountSchema` (`schemas.ts:137`) referenced by `AppStateV13Schema` onward, so it propagates to every version schema's inferred type without a new AppState object — V15 and V16 are byte-identical, and the `AppStateV14Schema` validators in `backup.ts`/`messages.ts` and the partial-corruption salvage path pick up the widened account with no rename. (`AppStateV13`/`V14` thereby become nominally permissive of `'bitbucket'` — additive and harmless, since old data never carries it.) The **historical** `LensSourceSchema` and `SmartSourceConfigV8Schema` enums (the lens *source-ref* enums, distinct from `SourceAccountSchema`) are frozen four-member parse targets for the V6–V12 schemas and SHALL NOT be widened. If `persistedVersion < CURRENT_SCHEMA_VERSION` and validation succeeds, the storage layer SHALL write the new envelope `{ schemaVersion: 16, state }` back to `lunma.state` before returning. If `persistedVersion === CURRENT_SCHEMA_VERSION`, no write-back SHALL occur on boot. The boot chain SHALL still run the one-time `reconcileAccountSecrets` step against the separate `lunma.connectors` store (see the `connector-accounts` capability) — a boot-sequence side effect, not part of the pure migration runner.

#### Scenario: A migrated envelope validates against the current schema

- **GIVEN** a v15 envelope carrying lens nodes that reference accounts
- **WHEN** `readPersistedState` validates it after the v16 migration
- **THEN** validation SHALL succeed against `AppStateV16Schema` and the envelope SHALL be written back as `{ schemaVersion: 16, state }`

#### Scenario: A Cloud bitbucket account's workspace round-trips through the schema

- **GIVEN** a state carrying `sources['acc-bb'] = { id: 'acc-bb', provider: 'bitbucket', baseUrl: 'https://bitbucket.org', workspace: 'acme' }`
- **WHEN** it is validated against `AppStateV16Schema`
- **THEN** validation SHALL succeed and the `workspace` field SHALL be preserved

#### Scenario: A current-version envelope is not rewritten

- **GIVEN** an envelope already at `{ schemaVersion: 16 }`
- **WHEN** the storage layer loads it on boot
- **THEN** no migration runs and no write-back occurs

### Requirement: Schema-to-type coherence

`apps/extension/src/shared/schemas.ts` SHALL include a compile-time assertion that `z.infer<typeof AppStateV16Schema>` and `AppState` (from `apps/extension/src/shared/types.ts`) are structurally equivalent. A drift between the two SHALL cause `pnpm exec tsc --noEmit` to fail.

The `AppStateV16Schema` SHALL define `sources` as:
```
z.record(z.string(), SourceAccountSchema).default({})
```
where `SourceAccountSchema` is a `z.strictObject` of `{ id, provider, baseUrl, name?, workspace? }` carrying no token field, so the inferred type is `Record<SourceId, SourceAccount>` matching `AppState.sources`. The `workspace?: string` field is optional (carrying the Cloud bitbucket workspace slug — see the `connector-accounts` capability) and the `provider` enum includes `'bitbucket'`.

The lens branch of `PinNodeSchema` SHALL validate `sources` as `z.array(LensSourceRefSchema).min(1)` where `LensSourceRefSchema` is `{ sourceId: z.string(); queries: z.array(z.enum(['authored','assigned','review-requested'])) }`.

`lensItemBindings` and `lensReadState` SHALL be typed with `${sourceId}:${query}:${nativeId}`-form (rss: `${sourceId}:${nativeId}`) namespaced string keys/ids (per `rekey-lens-sections-by-source-id`); the key/id form is a string convention, not a Zod-typed field.

No `as unknown as AppState` cast SHALL remain in the codebase for values produced by `AppStateV16Schema.safeParse`.

#### Scenario: Type drift fails the build

- **WHEN** a developer changes the `AppState.sources` value type without updating `SourceAccountSchema`
- **THEN** `pnpm exec tsc --noEmit` SHALL fail with a type-equivalence error in `apps/extension/src/shared/schemas.ts`

#### Scenario: The workspace field is part of the coherence assertion

- **WHEN** `SourceAccount` in `types.ts` carries `workspace?: string` and `SourceAccountSchema` adds the same optional field
- **THEN** `_schemaMatchesAppState: AssertEqual<AppStateV16, AppState>` SHALL hold and `tsc --noEmit` SHALL pass

#### Scenario: A lens node with embedded sources is rejected under v16

- **WHEN** `AppStateV16Schema.safeParse` is given a lens node whose `sources` entry carries `{ source, baseUrl, queries }` (the v12 embedded shape) instead of `{ sourceId, queries }`
- **THEN** validation SHALL fail (the lens branch requires `LensSourceRef[]`)