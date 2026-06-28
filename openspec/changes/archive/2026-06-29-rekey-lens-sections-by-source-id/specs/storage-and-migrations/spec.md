## MODIFIED Requirements

### Requirement: Versioned local-storage envelope

The persisted `AppState` SHALL live in `chrome.storage.local` under the key `lunma.state` as an envelope of shape `{ schemaVersion: number; state: AppState }`. The envelope's `schemaVersion` SHALL equal the `CURRENT_SCHEMA_VERSION` constant exported from `apps/extension/src/shared/schemas.ts` at write time. The current version SHALL be `15` (raised from `14` by the `rekey-lens-sections-by-source-id` change, which re-keys lens sections by account `sourceId` and rewrites the persisted `lensItemBindings` keys and `lensReadState` ids; version `14` came from `lens-view-filters`, adding the optional lens `filter?: LensFilter`; version `13` came from `decouple-source-accounts`, which adds the top-level `sources` slice — the `SourceAccount` map — and rewrites each lens node's `sources` from embedded `LensSource[]` to `LensSourceRef[]` references; version `12` came from `review-lens`, which widened the persisted lens `lensKind` enum to `'general' | 'review'`; version `11` came from `establish-lens-model`, the smart→lens rename — flipping each node's `kind: 'smart'` to `kind: 'lens'`, stamping `lensKind: 'general'`, and renaming `smartItemBindings → lensItemBindings` / `smartReadState → lensReadState`; version `10` came from `smart-source-rename`, adding an optional `name` to each source; version `9` came from `multi-filter-smart-connectors`, replacing the flat `query?` with `sources: LensSource[]` carrying `queries[]`).

The `state.schemaVersion` field on `AppState` itself SHALL match the envelope's `schemaVersion` whenever both are present. The envelope-level field is the value the migration runner reads; the in-state field is informational.

#### Scenario: A valid current-version envelope round-trips

- **WHEN** the storage layer loads an envelope whose `schemaVersion` equals `CURRENT_SCHEMA_VERSION`
- **THEN** the storage layer SHALL load it without running any migration

### Requirement: Append-only migrations list

The `migrations: Migration[]` array exported from `apps/extension/src/shared/migrations.ts` SHALL be append-only **from the v1 baseline onward**. A `Migration` SHALL be `{ toVersion: number; migrate: (raw: unknown) => unknown }`. Each `migrate` function SHALL be synchronous and pure.

The list holds **fourteen** entries:
- the eleven entries through `toVersion: 12` (as previously specified — the additive `review-lens` `lensKind` enum-widening at v12 and all prior);
- `{ toVersion: 13 }` (`decouple-source-accounts`): a **real transformation** — for every `kind: 'lens'` node it mints one `SourceAccount` per distinct `(provider, baseUrl)` pair across all lenses (de-duplicated, source `name` carried onto the account), adds them to a new top-level `sources` map, and rewrites each lens's `sources` from `{ source, baseUrl, queries, name? }` to `{ sourceId, queries }`. (The re-keying of the separate, unversioned `lunma.connectors` secrets store is a boot-chain step, not this pure migrate fn — see the `connector-accounts` capability.)
- `{ toVersion: 14 }` (`lens-view-filters`): additive identity pass-through — the lens `PinNode` gains an OPTIONAL `filter?: LensFilter`;
- `{ toVersion: 15 }` (`rekey-lens-sections-by-source-id`): a **real transformation** that rewrites the persisted `lensItemBindings` keys AND `lensReadState` ids from the legacy `${source}:${host}:${query}:${nativeId}` form (rss: `${source}:${host}:${nativeId}`) to the `${sourceId}:${query}:${nativeId}` form (rss: `${sourceId}:${nativeId}`). It resolves each legacy id **match-first by longest prefix**: for each account in `state.sources` it tests the prefix `${provider}:${new URL(baseUrl).host}:` (port-bearing host; a blind `split(':')` is NOT used since host carries ports and rss `nativeId`s are URLs). Among accounts whose prefix the id `startsWith`, the account with the **longest** prefix wins and its `sourceId` replaces the prefix — so a port-bearing host (`git.example.com:8443`) routes to its own account even when a port-less sibling (`git.example.com`) exists. The entry is **dropped** only when **no** account matches (deleted account) or when **two accounts share an identical `${provider}:${host}:` prefix** (the genuinely same-origin collision this change fixes). The transform is synchronous, pure, and idempotent (an id whose first segment is already a key of `state.sources` is left unchanged).

The last entry's `toVersion` SHALL equal `CURRENT_SCHEMA_VERSION` (15); `assertMigrationsTerminal`/`runMigrations` SHALL throw on boot if they disagree.

#### Scenario: The chain holds exactly the v2 through v15 entries

- **GIVEN** the `migrations` list exported from `apps/extension/src/shared/migrations.ts`
- **THEN** `migrations` SHALL have fourteen entries with `toVersion` values `2, 3, …, 13, 14, 15` in order

#### Scenario: The v13 migration extracts embedded sources into accounts

- **GIVEN** a v12 envelope with two lens nodes that each embed a `{ source: 'github', baseUrl: 'https://github.com', queries: […] }` source
- **WHEN** `runMigrations` applies the v13 migration
- **THEN** the output has a single `github`/`github.com` account in `sources` and both lenses reference it by the same `sourceId`, each keeping its own `queries`

#### Scenario: The v15 migration rewrites binding and read-state ids onto account ids

- **GIVEN** a v14 envelope with `lensItemBindings['f1']` holding key `'github:github.com:authored:42'`, `lensReadState['f1'] = ['github:github.com:authored:7']`, and a single `github`/`github.com` account `acc-1` in `state.sources`
- **WHEN** `runMigrations` applies the v15 migration
- **THEN** the binding key becomes `'acc-1:authored:42'` and the read id becomes `'acc-1:authored:7'`, values unchanged
- **AND** running it again is a no-op (first segment `acc-1` is already an account id)

#### Scenario: A port-bearing host and an rss URL nativeId rewrite correctly

- **GIVEN** a self-hosted gitlab account `acc-g` on `https://git.example.com:8443` with read id `'gitlab:git.example.com:8443:authored:99'`, and an rss account `acc-r` on `https://feeds.x.com` with read id `'rss:feeds.x.com:https://x.com/post/1'`
- **WHEN** the v15 migration runs
- **THEN** the ids become `'acc-g:authored:99'` and `'acc-r:https://x.com/post/1'` (match-first prefix resolution, not a colon split)

#### Scenario: A port-bearing account coexisting with a port-less sibling keeps its data

- **GIVEN** two gitlab accounts `acc-A` on `https://git.example.com` and `acc-B` on `https://git.example.com:8443`, with binding key `'gitlab:git.example.com:8443:authored:42'` (acc-B) and `'gitlab:git.example.com:authored:7'` (acc-A)
- **WHEN** the v15 migration runs
- **THEN** longest-prefix resolution rewrites them to `'acc-B:authored:42'` and `'acc-A:authored:7'` respectively — neither is dropped (distinct origins, not an ambiguous collision)

#### Scenario: An unmappable or same-origin-ambiguous id is dropped

- **GIVEN** a v14 id `'github:github.com:authored:42'` for which `state.sources` holds **no** matching account, OR holds **two** accounts with the identical `github:github.com:` prefix (same host and port)
- **WHEN** the v15 migration runs
- **THEN** the entry is dropped (a binding re-arms later; a read mark reappears unread once), never assigned to an arbitrary account

### Requirement: Migration runner applies pending migrations in order

On every SW boot, the storage layer SHALL invoke `runMigrations(raw, persistedVersion)` which iterates `migrations` in array order, applies the `migrate` function of every entry whose `toVersion > persistedVersion`, threading each output as the input to the next, and stops when there are no more entries to apply.

After the runner returns, the resulting object SHALL be validated against the Zod schema for the current schema version, `AppStateV15Schema`. `AppStateV15Schema` is a re-exported **alias** of `AppStateV14Schema` (`export const AppStateV15Schema = AppStateV14Schema`): the v15 migration rewrites `lensItemBindings` map **keys** and `lensReadState` id **strings** (both untyped `Record`/`string[]` shapes) without changing any value shape, so no Zod field changes. (`AppStateV14Schema` is `AppStateV13Schema` plus the lens `PinNode`'s optional `filter?: LensFilter`.) `EnvelopeSchema.state` SHALL also be `AppStateV15Schema`. If `persistedVersion < CURRENT_SCHEMA_VERSION` and validation succeeds, the storage layer SHALL write the new envelope `{ schemaVersion: 15, state }` back to `lunma.state` before returning. If `persistedVersion === CURRENT_SCHEMA_VERSION`, no write-back SHALL occur on boot. The boot chain SHALL still run the one-time `reconcileAccountSecrets` step against the separate `lunma.connectors` store (see the `connector-accounts` capability).

#### Scenario: A migrated envelope validates against the current schema

- **GIVEN** a v14 envelope whose `lensItemBindings` and `lensReadState` carry legacy host-form ids
- **WHEN** `readPersistedState` validates it after the v15 migration
- **THEN** validation SHALL succeed against `AppStateV15Schema` (only keys/ids changed) and the envelope SHALL be written back as `{ schemaVersion: 15, state }`

#### Scenario: A current-version envelope is not rewritten

- **GIVEN** an envelope already at `{ schemaVersion: 15 }`
- **WHEN** the storage layer loads it on boot
- **THEN** no migration runs and no write-back occurs

### Requirement: Lens read-state is persisted and pruned

The `lensReadState` slice of `AppState` SHALL be **persisted** to
`chrome.storage.local` — kept by `persist(state)`, NOT stripped like the ephemeral
`lenses` and `liveTabsById` slices — so read marks survive SW sleeps and
Chrome restarts. The slice maps each feed lens id to an array of its read item
ids (shape: a record from lens id to a list of item-id strings). It SHALL store
**ids only** (never item titles or URLs — the work/reading-sensitive payload stays
off disk, mirroring `lensItemBindings`). Each stored read id is the **namespaced**
id `${sourceKey}:${nativeId}` written by `markLensItemRead`, where `sourceKey` is
the account-id-based section key (`${sourceId}:${query}` for queue, `${sourceId}`
for rss — see the `lenses` capability), so a lens's read set spans all of its
resolved sections and two same-host accounts keep distinct read sets.

Pruning SHALL be **per resolved section**: a section's successful fetch
(`lenses.result` with `state: 'ok'`) prunes only the read ids belonging to
**that** section — read ids whose namespaced id carries that section's
`sourceKey` prefix — dropping those no longer present in that section's fetched
item set, and leaving every **other** section's read ids untouched
(`pruneLensReadState(lensId, sectionKey, liveIds)`). Each section prunes its
own ids on its own fetch, so a multi-section lens (e.g. an OPML import) never
loses one section's read marks when a different section refreshes. A lens's
entire entry SHALL be removed when the lens is deleted. Because each section is
bounded by the connector's fetch window (the feed connector's `FEED_BUFFER`,
capped at 200; the queue connectors' `maxItems`), the per-section prune keeps the
slice bounded by the sum of the lens's section windows. The slice SHALL be part
of the current-version schema (`LensReadStateSchema`, with `.default({})` so
pre-v6 envelopes parse) and included in the schema-to-type coherence check. The
v15 migration (`rekey-lens-sections-by-source-id`) rewrites legacy host-form read
ids onto the account-id form; unmappable/ambiguous ids are dropped (those items
reappear unread once).

#### Scenario: persist keeps lensReadState

- **WHEN** `persist(state)` runs with a populated `state.lensReadState`
- **THEN** the object written under the storage key SHALL contain the `lensReadState` field (ids only), unlike the stripped `lenses` / `liveTabsById` slices

#### Scenario: A section's fetch prunes only its own read ids to its window

- **GIVEN** a lens whose `lensReadState` holds read ids for section `acc-A` and section `acc-B`
- **WHEN** section `acc-B` completes a successful fetch whose item set omits some of `acc-B`'s read ids
- **THEN** `pruneLensReadState(lensId, 'acc-B', …)` drops only the absent **acc-B** ids
- **AND** every **acc-A** read id is left intact (A prunes only on its own fetch)

#### Scenario: Deleting a lens drops its read-state

- **WHEN** a lens is deleted
- **THEN** its `lensReadState[lensId]` entry is removed

#### Scenario: A pre-v6 envelope loads with empty read-state

- **WHEN** `loadState()` reads a persisted envelope written before this slice existed
- **THEN** `lensReadState` SHALL default to `{}` and validate under the current-version schema

### Requirement: Schema-to-type coherence

`apps/extension/src/shared/schemas.ts` SHALL include a compile-time assertion that `z.infer<typeof AppStateV15Schema>` and `AppState` (from `apps/extension/src/shared/types.ts`) are structurally equivalent. A drift between the two SHALL cause `pnpm exec tsc --noEmit` to fail. Because `AppStateV15Schema` is a re-exported alias of `AppStateV14Schema` (the v15 migration changes only untyped map keys / id strings), the existing `AppStateV14`-typed code (e.g. the partial-corruption salvage path) remains valid.

The `AppStateV15Schema` SHALL define `sources` as:
```
z.record(z.string(), SourceAccountSchema).default({})
```
where `SourceAccountSchema` is a `z.strictObject` of `{ id, provider, baseUrl, name? }` carrying no token field, so the inferred type is `Record<SourceId, SourceAccount>` matching `AppState.sources`.

The lens branch of `PinNodeSchema` SHALL validate `sources` as `z.array(LensSourceRefSchema).min(1)` where `LensSourceRefSchema` is `{ sourceId: z.string(); queries: z.array(z.enum(['authored','assigned','review-requested'])) }`, replacing the prior embedded `LensSourceSchema` array.

`lensItemBindings` and `lensReadState` SHALL carry `${sourceId}:${query}:${nativeId}`-form (rss: `${sourceId}:${nativeId}`) namespaced string keys/ids; the key/id form is a string convention, not a Zod-typed field. No `as unknown as AppState` cast SHALL remain in the codebase for values produced by `AppStateV15Schema.safeParse`.

#### Scenario: Type drift fails the build

- **WHEN** a developer changes the `AppState.sources` value type without updating `SourceAccountSchema`
- **THEN** `pnpm exec tsc --noEmit` SHALL fail with a type-equivalence error in `apps/extension/src/shared/schemas.ts`

#### Scenario: A lens node with embedded sources is rejected under v15

- **WHEN** `AppStateV15Schema.safeParse` is given a lens node whose `sources` entry carries `{ source, baseUrl, queries }` (the v12 embedded shape) instead of `{ sourceId, queries }`
- **THEN** validation SHALL fail (the lens branch requires `LensSourceRef[]`)

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

For the **Zod-validation-failure** branch only (a clean migration chain whose output fails the current-version schema, `AppStateV15Schema`), the layer SHALL FIRST attempt `salvagePersistedState(migrated)` (see Requirement: Partial-corruption salvage preserves valid Space identities). When salvage returns a non-null state, the layer SHALL still write the quarantine record above and SHALL return `{ kind: 'salvaged'; state }`. When salvage returns `null`, the layer SHALL return `{ kind: 'corrupt' }`. The **migration-threw** and **invalid-`schemaVersion`** branches SHALL NOT attempt salvage and SHALL return `{ kind: 'corrupt' }`.

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

- **WHEN** all migrations run without throwing but the resulting object fails validation against the current-version schema (`AppStateV15Schema`)
- **AND** `salvagePersistedState(migrated)` returns `null`
- **THEN** a `QuarantineRecord` SHALL be written to `__corrupt_backup_<ts>` with `reason: 'schema parse failed'`, `zodIssues` set to `parsed.error.issues`, and `rawBytes` set to the original payload
- **AND** `loadState` SHALL return `{ state: createInitialState(), outcome: 'recovered' }`

#### Scenario: Schema validation fails but valid slices are salvaged

- **WHEN** all migrations run without throwing but the resulting object fails validation against `AppStateV15Schema`
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
