# storage-and-migrations Specification

## Purpose

Defines the versioned local-storage envelope, the append-only migration pipeline, and the corruption-quarantine fallback that wrap Lunma's persisted `AppState` at the `chrome.storage.local` boundary.
## Requirements
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

For the **Zod-validation-failure** branch only (a clean migration chain whose output fails the current-version schema, `AppStateV12Schema`), the layer SHALL FIRST attempt `salvagePersistedState(migrated)` (see Requirement: Partial-corruption salvage preserves valid Space identities). When salvage returns a non-null state, the layer SHALL still write the quarantine record above and SHALL return `{ kind: 'salvaged'; state }`. When salvage returns `null`, the layer SHALL return `{ kind: 'corrupt' }`. The **migration-threw** and **invalid-`schemaVersion`** branches SHALL NOT attempt salvage and SHALL return `{ kind: 'corrupt' }`.

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

- **WHEN** all migrations run without throwing but the resulting object fails validation against the current-version schema (`AppStateV12Schema`)
- **AND** `salvagePersistedState(migrated)` returns `null`
- **THEN** a `QuarantineRecord` SHALL be written to `__corrupt_backup_<ts>` with `reason: 'schema parse failed'`, `zodIssues` set to `parsed.error.issues`, and `rawBytes` set to the original payload
- **AND** `loadState` SHALL return `{ state: createInitialState(), outcome: 'recovered' }`

#### Scenario: Schema validation fails but valid slices are salvaged

- **WHEN** all migrations run without throwing but the resulting object fails validation against `AppStateV12Schema`
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

### Requirement: loadState surface

The function `loadState()` exported from `apps/extension/src/shared/store-singleton.ts` SHALL return `Promise<{ state: AppState; outcome: LoadOutcome }>`, where `LoadOutcome` is the exported union `'clean' | 'recovered' | 'salvaged' | 'unavailable'`. The returned `state` SHALL be assigned into the singleton store via `Object.assign(store.state, state)` exactly as today.

The `outcome` SHALL be derived from `readPersistedState`'s result:

- `{ kind: 'ok' }` and `{ kind: 'empty' }` → `'clean'` (a clean read, including the empty-storage first-boot case);
- `{ kind: 'salvaged' }` → `'salvaged'` (partial corruption recovered; see the salvage requirement);
- `{ kind: 'corrupt' }` → `'recovered'` (the layer fell back to `createInitialState()` after a corruption-quarantine event);
- `{ kind: 'unavailable' }` → `'unavailable'` (the read itself failed; see Requirement: Transient read failure does not overwrite persisted state).

On `'clean'`, `'recovered'`, and `'salvaged'`, `loadState` SHALL assign the corresponding state (the parsed/empty/salvaged state). On `'unavailable'`, `loadState` SHALL assign `createInitialState()` so the store is internally consistent, but the boot chain SHALL treat that empty store as "read failed", not "first install" (no Default mint, no persist).

#### Scenario: Clean read

- **WHEN** the persisted envelope validates without quarantine
- **THEN** `loadState` SHALL return `{ state, outcome: 'clean' }`

#### Scenario: First boot

- **WHEN** `chrome.storage.local` has no `lunma.state` key
- **THEN** `loadState` SHALL return `{ state: createInitialState(), outcome: 'clean' }`

#### Scenario: Recovery boot

- **WHEN** the storage layer quarantines a corrupt payload and nothing is salvageable
- **THEN** `loadState` SHALL return `{ state: createInitialState(), outcome: 'recovered' }`

#### Scenario: Salvage boot

- **WHEN** the storage layer salvages valid slices from a partially-corrupt payload
- **THEN** `loadState` SHALL return `{ state: <salvaged>, outcome: 'salvaged' }`

#### Scenario: Unavailable boot

- **WHEN** `readPersistedState` returns `{ kind: 'unavailable' }`
- **THEN** `loadState` SHALL return `{ state: createInitialState(), outcome: 'unavailable' }`

### Requirement: Transient read failure does not overwrite persisted state

`readPersistedState` SHALL distinguish a thrown `chrome.storage.local.get` (a transient read failure) from a genuinely-absent key. When `chrome.storage.local.get` throws, the layer SHALL retry the read up to `READ_RETRY_ATTEMPTS` (= 2, i.e. at most 3 total attempts) immediately. If a retry succeeds, the read proceeds normally from its resolved value. If every attempt throws, the layer SHALL return `{ kind: 'unavailable' }` — it SHALL NOT return `{ kind: 'empty' }` and SHALL NOT quarantine (there is no payload to quarantine).

A genuinely-absent key (a `get` that RESOLVES to `undefined`/`null`) SHALL continue to return `{ kind: 'empty' }` (the real first-boot signal), unchanged.

When the boot read outcome is `'unavailable'`, the SW boot chain SHALL preserve the on-disk `lunma.state` byte-for-byte for the next boot. Specifically it SHALL NOT mint a Default (see `spaces-and-tabs` Requirement: At-least-one-Space invariant), SHALL treat `freshInstall` as `false` (see `spaces-and-tabs` Requirement: Fresh-install conversion of Chrome groups into Spaces), and SHALL NOT call `persist(store.snapshot())` on that boot.

#### Scenario: A one-off read throw recovers on retry

- **WHEN** the first `chrome.storage.local.get` call rejects but a retry resolves with a valid envelope
- **THEN** `readPersistedState` SHALL return `{ kind: 'ok', state }` from the retry
- **AND** `loadState` SHALL return `outcome: 'clean'`

#### Scenario: A sustained read failure is reported as unavailable and never overwrites

- **GIVEN** `chrome.storage.local` holds a valid envelope with Spaces "Work" and "Personal"
- **WHEN** every `chrome.storage.local.get` attempt (initial + retries) throws on this boot
- **THEN** `readPersistedState` SHALL return `{ kind: 'unavailable' }`
- **AND** no `__corrupt_backup_*` record SHALL be written
- **AND** the SW boot SHALL NOT mint a Default, SHALL NOT run fresh-install group conversion, and SHALL NOT call `persist`
- **AND** the `lunma.state` envelope on disk SHALL be unchanged, so the next successful boot loads "Work" and "Personal"

#### Scenario: A genuinely-absent key is still a clean first boot

- **WHEN** `chrome.storage.local.get` resolves with no `lunma.state` key
- **THEN** `readPersistedState` SHALL return `{ kind: 'empty' }`
- **AND** `loadState` SHALL return `outcome: 'clean'`
- **AND** the boot SHALL mint the single Default as today

### Requirement: Partial-corruption salvage preserves valid Space identities

The storage layer SHALL export a pure function `salvagePersistedState(migrated: unknown): AppStateV12 | null` that attempts to recover a valid `AppStateV12` from a payload that failed whole-state validation, preserving as much real data as possible instead of discarding all of it.

`salvagePersistedState` SHALL:

1. Return `null` when `migrated` is not a non-null object.
2. Start from a valid empty base equal in shape to `createInitialState()` at `CURRENT_SCHEMA_VERSION`.
3. Salvage the `spaces` array **element-wise**: when the input's `spaces` value is an array, keep each element that individually validates against the Space element schema (`AppStateV12Schema.shape.spaces.element`), preserving array order and dropping only the invalid elements; otherwise keep `[]`. A single malformed Space SHALL NOT cost the other Spaces.
4. Salvage every other top-level slice (`schemaVersion`, `activeSpaceByWindow`, `spaceInstancesByWindow`, `tabBindings`, `savedTabs`, `lastActivatedSpaceId`, `tabLastActivity`, `archivedTabs`, `trash`, `pinnedBySpace`, `faviconRow`, `lensItemBindings`) **slice-wise**: validate the input's value against that slice's own schema (`AppStateV12Schema.shape.<field>`); on success the validated value SHALL be kept, on failure the empty-base default SHALL be kept.
5. Validate the assembled object against `AppStateV12Schema` and return it on success, or `null` on failure.

Because the `spaces` array is salvaged element-wise, a payload SHALL preserve every individually-valid Space's `id`, `name`, `color`, and `icon`, even when other Spaces in the same array are malformed and even when unrelated slices (e.g. `savedTabs`) are malformed. Because `faviconRow` is salvaged slice-wise, a valid `faviconRow` SHALL be preserved rather than reset whenever it individually validates. Because `pinnedBySpace` is validated against the current-version slice schema (which admits all three `PinNode` kinds, the four lens provider values `'gitlab' | 'github' | 'jira' | 'rss'`, and each instance's `queries: LensQuery[]`), a pinned tree containing v12-shape `lens` nodes SHALL survive salvage intact rather than being reset. Dangling references that result from a dropped Space or slice (e.g. a `pinnedBySpace` entry pointing at a reset `savedTabs`, or `activeSpaceByWindow` referencing a dropped Space) are tolerated by the existing load-path de-duplication and the sidebar projections (see the *Loaded state has unique ids per keyed collection* requirement).

A salvaged state SHALL flow through the existing `dedupePersistedState` step and SHALL be eligible for the existing write-back self-heal, exactly as a migrated/de-duplicated `ok` state is.

#### Scenario: A malformed unrelated slice preserves all Space names

- **GIVEN** a migrated payload whose `spaces` slice is `[{ id: 'a', name: 'Work', color: 'blue', icon: 'star' }, { id: 'b', name: 'Personal', color: 'red', icon: 'star' }]` but whose `savedTabs` slice contains a record missing its required `originalURL`
- **WHEN** whole-state validation fails and `salvagePersistedState` runs
- **THEN** it SHALL return a valid `AppStateV12` whose `spaces` equals the two input Spaces unchanged
- **AND** `savedTabs` SHALL be reset to `{}`
- **AND** `readPersistedState` SHALL return `{ kind: 'salvaged', state }`

#### Scenario: An invalid Space among valid Spaces is dropped, the rest preserved

- **GIVEN** a migrated payload whose `spaces` slice is `[{ id: 'a', name: 'Work', color: 'blue', icon: 'star' }, { id: 'b', color: 'red', icon: 'star' }]` (the second Space is missing its required `name`)
- **WHEN** `salvagePersistedState` runs
- **THEN** the element-wise `spaces` salvage SHALL keep `{ id: 'a', name: 'Work', color: 'blue', icon: 'star' }` and drop the nameless element
- **AND** the assembled object SHALL validate against `AppStateV12Schema` with `spaces` equal to `[{ id: 'a', name: 'Work', color: 'blue', icon: 'star' }]`
- **AND** `readPersistedState` SHALL return `{ kind: 'salvaged', state }`

#### Scenario: A valid faviconRow survives an unrelated slice failure

- **GIVEN** a migrated payload whose `faviconRow` slice is a valid `SavedTabId[]` but whose `savedTabs` slice is malformed
- **WHEN** whole-state validation fails and `salvagePersistedState` runs
- **THEN** the assembled object's `faviconRow` SHALL equal the input `faviconRow` (favourites are not reset)
- **AND** `readPersistedState` SHALL return `{ kind: 'salvaged', state }`

#### Scenario: A pinned tree containing a lens node survives salvage

- **GIVEN** a migrated payload whose `pinnedBySpace` slice is valid and contains a v12-shape `lens` node (`lensKind: 'general'`) — a queue instance carrying `queries: ['authored', 'review-requested']` and an `rss` instance carrying `queries: []` — but whose `savedTabs` slice is malformed
- **WHEN** whole-state validation fails and `salvagePersistedState` runs
- **THEN** the assembled object's `pinnedBySpace` SHALL equal the input slice intact, each lens node's `sources[]`/`queries[]` config fields included
- **AND** `readPersistedState` SHALL return `{ kind: 'salvaged', state }`

#### Scenario: A non-object payload is unsalvageable

- **WHEN** `salvagePersistedState` is called with a string, number, array, or `null`
- **THEN** it SHALL return `null`
- **AND** `readPersistedState` SHALL return `{ kind: 'corrupt' }`

### Requirement: ArchivedTab record shape on AppState

`AppState.archivedTabs` SHALL be typed as `ArchivedTab[]` in [apps/extension/src/shared/types.ts](../../../apps/extension/src/shared/types.ts) and validated by `ArchivedTabSchema` (a `z.strictObject`) inside the current-version `AppState` schema (`AppStateV12Schema`) in [apps/extension/src/shared/schemas.ts](../../../apps/extension/src/shared/schemas.ts).

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
- **THEN** `AppStateV12Schema.parse` SHALL fail validation (strict mode)
- **AND** the storage layer SHALL quarantine per the corruption-quarantine requirement

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

### Requirement: liveTabsById is ephemeral and excluded from persistence

The `liveTabsById` slice of `AppState` SHALL be treated as ephemeral runtime state and SHALL NOT be written to `chrome.storage.local`. The `persist(state)` function SHALL exclude `liveTabsById` before serializing — the on-disk persisted shape SHALL be identical to the shape produced before this slice existed. Because the persisted shape is unchanged, this slice SHALL NOT trigger a `schemaVersion` increment and SHALL NOT require a migration. On service-worker boot the slice SHALL be rebuilt from live Chrome state (`chrome.tabs.query`), never read back from storage.

#### Scenario: persist omits liveTabsById

- **WHEN** `persist(state)` runs with a populated `state.liveTabsById`
- **THEN** the object written under the storage key SHALL NOT contain a `liveTabsById` field
- **AND** the rest of the persisted state SHALL be byte-for-byte what it would be without the slice present

#### Scenario: No schema-version bump for the ephemeral slice

- **WHEN** the persisted envelope is inspected after this change
- **THEN** `CURRENT_SCHEMA_VERSION` SHALL be unchanged from before this change
- **AND** no migration step SHALL exist that adds or reads `liveTabsById`

#### Scenario: Loaded state has no liveTabsById until rebuilt

- **WHEN** `loadState()` reads persisted state at boot
- **THEN** the loaded state SHALL NOT contain a `liveTabsById` field from disk
- **AND** `liveTabsById` SHALL only be populated by `rebuildLiveTabs` and subsequent tab events

### Requirement: Loaded state has unique ids per keyed collection

State returned by the load path SHALL contain no duplicate ids within any keyed
collection that the UI renders by id. Specifically, after `readPersistedState()` parses
the persisted envelope, the state SHALL be passed through a pure
`dedupePersistedState(state)` step that enforces, keeping the first occurrence:

- per Space, the pinned node tree (`pinnedBySpace[spaceId]`) SHALL contain each
  `SavedTabId` at most once across top-level tab nodes AND folder `children`
  combined, and each folder id at most once;
- each Space instance's `tempTabIds` SHALL contain each `TabId` at most once;
- `spaces` SHALL contain each Space id at most once.

De-duplication SHALL preserve ordering (first occurrence wins) and SHALL NOT drop
ids that are merely unbound or unknown — it only removes exact-id duplicates. The
`deleteFolder` mutator SHALL NOT create a top-level duplicate when spilling a
folder's children. Consuming sidebar projections (the pinned list, folder
children, the temporary-tab list, and the Space list) SHALL additionally
de-duplicate by id before rendering, so a transient duplicate can never crash a
keyed render.

#### Scenario: A persisted duplicate pinned id de-dupes on load

- **WHEN** the stored `pinnedBySpace[spaceId]` contains the same `SavedTabId`
  twice (top-level twice, or once top-level and once as a folder child)
- **THEN** `readPersistedState()` SHALL return state in which that id appears exactly once
- **AND** the first occurrence's placement SHALL be the one kept

#### Scenario: Healed state is written back

- **WHEN** `readPersistedState()` de-duplicates ids that were present in the stored state
- **THEN** the cleaned state SHALL be the value returned to the caller
- **AND** the next persist SHALL write the de-duplicated state, so a subsequent
  load finds no duplicates

#### Scenario: Deleting a folder never creates a top-level duplicate

- **WHEN** `deleteFolder` spills a folder's children to top level and one of those
  child ids is already present elsewhere in the Space's pinned list
- **THEN** the resulting list SHALL contain that id exactly once

#### Scenario: Duplicate ids in temp tabs and spaces are removed on load

- **WHEN** a Space instance's `tempTabIds` contains a repeated `TabId`, or the
  `spaces` array contains a repeated Space id
- **THEN** `readPersistedState()` SHALL return state in which each `TabId` (within that
  instance) and each Space id appears exactly once

### Requirement: Spaces persist an optional auto-archive override

The persisted `Space` record SHALL carry an optional `autoArchive` field of type `SpaceAutoArchive = { mode: 'off' } | { mode: 'custom'; idleMinutes: number }`, validated by `SpaceAutoArchiveSchema` inside the current-version `AppState` schema (`AppStateV12Schema`). This field is part of the **clean v1 baseline shape** — it is present in the baseline `Space` schema directly and is NOT introduced by a migration (the placeholder-era `v10Tov11` migration that originally added it is deleted with the rest of the collapsed chain). The behavior of resolving and applying the override is owned by the `auto-archive` capability; this requirement is limited to the persisted-shape contract.

An **absent** `autoArchive` SHALL mean *inherit the global auto-archive setting* — the durable, on-disk representation of "this Space follows the `autoArchiveEnabled` / `autoArchiveIdleMinutes` settings". A `{ mode: 'off' }` value SHALL mean *never auto-archive this Space*; a `{ mode: 'custom'; idleMinutes }` value SHALL carry a positive-integer threshold (validated `z.number().int().positive()`, so `0`/negatives are rejected at the storage boundary; the resolver additionally clamps to a floor of 1).

The baseline schemas SHALL include `SpaceAutoArchiveSchema`; the baseline `Space` schema (carrying the optional `autoArchive`); the baseline trashed-Space schema (carrying the optional `autoArchive` — REQUIRED because `TrashedSpace extends Space`, so leaving `trash` validated by a Space schema without the field would break the `AssertEqual` schema-to-type guard once `Space` carries it); and the current-version `AppState` schema (whose `spaces` validate the Space shape and `trash` the trashed-Space shape). An absent `autoArchive` is valid, so no record requires rewriting on load.

#### Scenario: A fresh baseline Space has no override

- **WHEN** a Space is created with no `autoArchive` set
- **THEN** the persisted Space SHALL omit `autoArchive`
- **AND** validation against `AppStateV12Schema` SHALL succeed (absent = inherit the global setting)

#### Scenario: A custom override round-trips through storage

- **WHEN** a Space with `autoArchive: { mode: 'custom', idleMinutes: 15 }` is persisted and re-read
- **THEN** the override SHALL survive the round-trip intact

#### Scenario: An off override round-trips through storage

- **WHEN** a Space with `autoArchive: { mode: 'off' }` is persisted and re-read
- **THEN** the override SHALL survive the round-trip intact

#### Scenario: A trashed Space's override round-trips through storage

- **WHEN** a trashed Space (in `state.trash`) carrying `autoArchive: { mode: 'custom', idleMinutes: 20 }` is persisted and re-read
- **THEN** validation against `AppStateV12Schema` (whose `trash` carries the optional `autoArchive`) SHALL succeed
- **AND** the override SHALL survive the round-trip intact

#### Scenario: A malformed override is rejected, then salvaged

- **WHEN** a Space's stored `autoArchive` fails `SpaceAutoArchiveSchema` validation
- **THEN** whole-state validation SHALL fail and the existing salvage path SHALL apply (the original bytes are quarantined under a `__corrupt_backup_*` key)

### Requirement: lenses is ephemeral and excluded from persistence

The `lenses` slice of `AppState` (lens runtime results — see the `lenses` capability) SHALL be treated as ephemeral runtime state and SHALL NOT be written to `chrome.storage.local`. The `persist(state)` function SHALL exclude `lenses` before serializing, exactly as it excludes `liveTabsById`. The slice itself SHALL NOT trigger a `schemaVersion` increment and SHALL NOT require a migration (the v1→v2 bump in this change is caused by the widened persisted `PinNode` union, not by this slice). On service-worker boot the slice SHALL start empty and be populated only by connector fetches, never read back from storage — lens result data (work-sensitive MR titles) never touches disk.

#### Scenario: persist omits lenses

- **WHEN** `persist(state)` runs with a populated `state.lenses`
- **THEN** the object written under the storage key SHALL NOT contain a `lenses` field
- **AND** the rest of the persisted state SHALL be byte-for-byte what it would be without the slice present

#### Scenario: Loaded state has no lenses until fetched

- **WHEN** `loadState()` reads persisted state at boot
- **THEN** the loaded state SHALL NOT contain a `lenses` field from disk
- **AND** `lenses` SHALL only be populated by connector result events

### Requirement: Lens read-state is persisted and pruned

The `lensReadState` slice of `AppState` SHALL be **persisted** to
`chrome.storage.local` — kept by `persist(state)`, NOT stripped like the ephemeral
`lenses` and `liveTabsById` slices — so read marks survive SW sleeps and
Chrome restarts. The slice maps each feed lens id to an array of its read item
ids (shape: a record from lens id to a list of item-id strings). It SHALL store
**ids only** (never item titles or URLs — the work/reading-sensitive payload stays
off disk, mirroring `lensItemBindings`). Each stored read id is the **namespaced**
id `${sourceKey}:${nativeId}` written by `markLensItemRead`, so a lens's read
set spans all of its resolved sections.

Pruning SHALL be **per resolved section**: a section's successful fetch
(`lenses.result` with `state: 'ok'`) prunes only the read ids belonging to
**that** section — read ids whose namespaced key carries that section's
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
pre-v6 envelopes parse) and included in the schema-to-type coherence check.

#### Scenario: persist keeps lensReadState

- **WHEN** `persist(state)` runs with a populated `state.lensReadState`
- **THEN** the object written under the storage key SHALL contain the `lensReadState` field (ids only), unlike the stripped `lenses` / `liveTabsById` slices

#### Scenario: A section's fetch prunes only its own read ids to its window

- **GIVEN** a lens whose `lensReadState` holds read ids for section A and section B
- **WHEN** section B completes a successful fetch whose item set omits some of B's read ids
- **THEN** `pruneLensReadState(lensId, 'B', …)` drops only the absent **section-B** ids
- **AND** every **section-A** read id is left intact (A prunes only on its own fetch)

#### Scenario: Deleting a lens drops its read-state

- **WHEN** a lens is deleted
- **THEN** its `lensReadState[lensId]` entry is removed

#### Scenario: A pre-v6 envelope loads with empty read-state

- **WHEN** `loadState()` reads a persisted envelope written before this slice existed
- **THEN** `lensReadState` SHALL default to `{}` and validate under the current-version schema

