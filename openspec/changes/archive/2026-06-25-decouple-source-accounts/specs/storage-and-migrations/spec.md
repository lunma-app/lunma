## MODIFIED Requirements

### Requirement: Versioned local-storage envelope

The persisted `AppState` SHALL live in `chrome.storage.local` under the key `lunma.state` as an envelope of shape `{ schemaVersion: number; state: AppState }`. The envelope's `schemaVersion` SHALL equal the `CURRENT_SCHEMA_VERSION` constant exported from `apps/extension/src/shared/schemas.ts` at write time. The current version SHALL be `13` (raised from `12` by the `decouple-source-accounts` change, which adds the top-level `sources` slice — the `SourceAccount` map — and rewrites each lens node's `sources` from embedded `LensSource[]` to `LensSourceRef[]` references; version `12` came from `review-lens`, which widened the persisted lens `lensKind` enum to `'general' | 'review'`; version `11` came from `establish-lens-model`, the smart→lens rename — flipping each node's `kind: 'smart'` to `kind: 'lens'`, stamping `lensKind: 'general'`, and renaming `smartItemBindings → lensItemBindings` / `smartReadState → lensReadState`; version `10` came from `smart-source-rename`, adding an optional `name` to each source; version `9` came from `multi-filter-smart-connectors`, replacing the flat `query?` with `sources: LensSource[]` carrying `queries[]`).

The `state.schemaVersion` field on `AppState` itself SHALL match the envelope's `schemaVersion` whenever both are present. The envelope-level field is the value the migration runner reads; the in-state field is informational.

#### Scenario: A valid current-version envelope round-trips

- **WHEN** the storage layer loads an envelope whose `schemaVersion` equals `CURRENT_SCHEMA_VERSION`
- **THEN** the storage layer SHALL load it without running any migration

### Requirement: Append-only migrations list

The `migrations: Migration[]` array exported from `apps/extension/src/shared/migrations.ts` SHALL be append-only **from the v1 baseline onward**. A `Migration` SHALL be `{ toVersion: number; migrate: (raw: unknown) => unknown }`. Each `migrate` function SHALL be synchronous and pure.

The list holds twelve entries: the eleven entries through `toVersion: 12` (as previously specified — through the `review-lens` additive `lensKind` enum-widening migration) plus a new `{ toVersion: 13 }` migration added by `decouple-source-accounts`. The **v13 migration** is a **real transformation**: for every `kind: 'lens'` node it mints one `SourceAccount` per distinct `(provider, baseUrl)` pair across all lenses (de-duplicated, source `name` carried onto the account), adds them to a new top-level `sources` map, and rewrites each lens's `sources` entries from `{ source, baseUrl, queries, name? }` to `{ sourceId, queries }`. The re-keying of the **separate, unversioned** `lunma.connectors` secrets store (host → `sourceId`) is NOT performed by this pure migrate function; it is a boot-chain step (see Requirement: A v12→v13 migration extracts accounts and re-keys tokens, in the `connector-accounts` capability).

#### Scenario: The chain holds exactly the v2 through v13 entries

- **GIVEN** the `migrations` list exported from `apps/extension/src/shared/migrations.ts`
- **THEN** `migrations` SHALL have twelve entries with `toVersion` values `2, 3, …, 12, 13` in order — the eleven entries through `{ toVersion: 12 }` (as previously specified) plus `{ toVersion: 13 }` (the source-extraction migration)

#### Scenario: The v13 migration extracts embedded sources into accounts

- **GIVEN** a v12 envelope with two lens nodes that each embed a `{ source: 'github', baseUrl: 'https://github.com', queries: […] }` source
- **WHEN** `runMigrations` applies the v13 migration
- **THEN** the output has a single `github`/`github.com` account in `sources` and both lenses reference it by the same `sourceId`, each keeping its own `queries`

### Requirement: Migration runner applies pending migrations in order

On every SW boot, the storage layer SHALL invoke `runMigrations(raw, persistedVersion)` which iterates `migrations` in array order, applies the `migrate` function of every entry whose `toVersion > persistedVersion`, threading each output as the input to the next, and stops when there are no more entries to apply.

After the runner returns, the resulting object SHALL be validated against the Zod schema for the current schema version, `AppStateV13Schema`. `AppStateV13Schema` is the v12 schema with an added `sources` slice (`z.record(z.string(), SourceAccountSchema).default({})`) and the lens node's `sources` field validated as `LensSourceRef[]` (`{ sourceId, queries }`) instead of `LensSource[]`; it is otherwise identical to `AppStateV12Schema`. If `persistedVersion < CURRENT_SCHEMA_VERSION` and validation succeeds, the storage layer SHALL write the new envelope `{ schemaVersion: 13, state }` back to `lunma.state` before returning. If `persistedVersion === CURRENT_SCHEMA_VERSION`, no write-back SHALL occur on boot. After this write-back, the boot chain SHALL run the one-time `reconcileAccountSecrets` step against the separate `lunma.connectors` store (see the `connector-accounts` capability) — it is a boot-sequence side effect, not part of the pure migration runner.

#### Scenario: A migrated envelope validates against the current schema

- **GIVEN** a v12 envelope carrying a `kind: 'lens'` node with embedded `sources`
- **WHEN** `readPersistedState` validates it after the v13 migration
- **THEN** validation SHALL succeed against `AppStateV13Schema` (the node's `sources` are now `LensSourceRef[]` and `state.sources` holds the minted accounts) and the envelope SHALL be written back as `{ schemaVersion: 13, state }`

### Requirement: Schema-to-type coherence

`apps/extension/src/shared/schemas.ts` SHALL include a compile-time assertion that `z.infer<typeof AppStateV13Schema>` and `AppState` (from `apps/extension/src/shared/types.ts`) are structurally equivalent. A drift between the two SHALL cause `pnpm exec tsc --noEmit` to fail.

The `AppStateV13Schema` SHALL define `sources` as:
```
z.record(z.string(), SourceAccountSchema).default({})
```
where `SourceAccountSchema` is a `z.strictObject` of `{ id, provider, baseUrl, name? }` carrying no token field, so the inferred type is `Record<SourceId, SourceAccount>` matching `AppState.sources`.

The lens branch of `PinNodeSchema` SHALL validate `sources` as `z.array(LensSourceRefSchema).min(1)` where `LensSourceRefSchema` is `{ sourceId: z.string(); queries: z.array(z.enum(['authored','assigned','review-requested'])) }`, replacing the prior embedded `LensSourceSchema` array.

No `as unknown as AppState` cast SHALL remain in the codebase for values produced by `AppStateV13Schema.safeParse`.

#### Scenario: Type drift fails the build

- **WHEN** a developer changes the `AppState.sources` value type without updating `SourceAccountSchema`
- **THEN** `pnpm exec tsc --noEmit` SHALL fail with a type-equivalence error in `apps/extension/src/shared/schemas.ts`

#### Scenario: A lens node with embedded sources is rejected under v13

- **WHEN** `AppStateV13Schema.safeParse` is given a lens node whose `sources` entry carries `{ source, baseUrl, queries }` (the v12 embedded shape) instead of `{ sourceId, queries }`
- **THEN** validation SHALL fail (the lens branch now requires `LensSourceRef[]`)
