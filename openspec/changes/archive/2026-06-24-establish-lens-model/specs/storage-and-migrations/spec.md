## ADDED Requirements

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

## MODIFIED Requirements

### Requirement: Versioned local-storage envelope

The persisted `AppState` SHALL live in `chrome.storage.local` under the key `lunma.state` as an envelope of shape `{ schemaVersion: number; state: AppState }`. The envelope's `schemaVersion` SHALL equal the `CURRENT_SCHEMA_VERSION` constant exported from `apps/extension/src/shared/schemas.ts` at write time. The current version SHALL be `11` (raised from `10` by the `establish-lens-model` change, the smart→lens rename, which flips each pinned node's discriminant `kind: 'smart'` to `kind: 'lens'`, stamps `lensKind: 'general'`, and renames the persisted keys `smartItemBindings → lensItemBindings` and `smartReadState → lensReadState`; version `10` came from the `smart-source-rename` change, which adds an **optional `name`** to each `LensSource`; version `9` came from `multi-filter-smart-connectors`, which replaced the flat `query?` triple with `sources: LensSource[]` carrying `queries[]` and re-keyed the lens-item bindings).

The `state.schemaVersion` field on `AppState` itself SHALL match the envelope's `schemaVersion` whenever both are present. The envelope-level field is the value the migration runner reads; the in-state field is informational.

#### Scenario: A valid current-version envelope round-trips

- **WHEN** the storage layer loads an envelope whose `schemaVersion` equals `CURRENT_SCHEMA_VERSION`
- **THEN** the storage layer SHALL load it without running any migration

### Requirement: Append-only migrations list

The `migrations: Migration[]` array exported from `apps/extension/src/shared/migrations.ts` SHALL be append-only **from the v1 baseline onward**. A `Migration` SHALL be `{ toVersion: number; migrate: (raw: unknown) => unknown }`. Each `migrate` function SHALL be synchronous and pure.

The list holds ten entries: the nine entries through `toVersion: 10` (as previously specified — the `toVersion: 9` entry is the `multi-filter-smart-connectors` real transformation that rewrites each lens node's `sources[]` from the `query?` shape to `queries[]` and re-keys the lens-item bindings to the per-filter namespaced form, pruning orphaned bindings; the `toVersion: 10` entry is the additive `name` migration from `smart-source-rename`) plus a new `{ toVersion: 11 }` migration added by `establish-lens-model`. The **v11 migration** performs the smart→lens rename on persisted state: for every `PinNode` whose `kind === 'smart'`, it sets `kind = 'lens'` and adds `lensKind: 'general'`; and it renames the top-level persisted keys `smartItemBindings → lensItemBindings` and `smartReadState → lensReadState`. The four provider values (`'gitlab' | 'github' | 'jira' | 'rss'`) and each instance's `queries[]` are unchanged — a structural rename, not a data reshape.

#### Scenario: The chain holds exactly the v2 through v11 entries

- **GIVEN** the `migrations` list exported from `apps/extension/src/shared/migrations.ts`
- **THEN** `migrations` SHALL equal a ten-entry list — `{ toVersion: 2 }` through `{ toVersion: 10 }` (as previously specified), then `{ toVersion: 11 }` (the smart→lens rename migration)

#### Scenario: The v10 migration leaves existing sources structurally unchanged

- **GIVEN** a v9 envelope with a pinned node whose sources carry no `name`
- **WHEN** `runMigrations` applies the v10 migration
- **THEN** the output is structurally unchanged apart from the bumped schema version, and the sources still validate (with `name` absent/optional)

#### Scenario: The v11 migration renames smart nodes to lens nodes

- **GIVEN** a v10 envelope containing a `kind: 'smart'` pinned node and top-level `smartItemBindings` / `smartReadState` keys
- **WHEN** `runMigrations` applies the v11 migration
- **THEN** every such node becomes `kind: 'lens'` with `lensKind: 'general'`, the keys are renamed to `lensItemBindings` / `lensReadState`, and each node's provider values and `queries[]` are unchanged

### Requirement: Migration runner applies pending migrations in order

On every SW boot, the storage layer SHALL invoke `runMigrations(raw, persistedVersion)` which iterates `migrations` in array order, applies the `migrate` function of every entry whose `toVersion > persistedVersion`, threading each output as the input to the next, and stops when there are no more entries to apply.

After the runner returns, the resulting object SHALL be validated against the Zod schema for the current schema version, `AppStateV11Schema`. `AppStateV11Schema` is the v10 schema with `PinNodeSchema`'s smart branch renamed to a `lens` branch — `kind: z.literal('lens')`, a new `lensKind: z.enum(['general'])`, and entries validated by `LensSourceSchema` (renamed from `SmartSourceConfigSchema`) — the persisted-key renames `smartItemBindings → lensItemBindings` and `smartReadState → lensReadState`, and the ephemeral slice rename `smartFolders → lenses` (validated by `LensRuntimeSchema`, renamed from `SmartFolderRuntimeSchema`, with `.default({})`). If `persistedVersion < CURRENT_SCHEMA_VERSION` and validation succeeds, the storage layer SHALL write the new envelope `{ schemaVersion: 11, state }` back to `lunma.state` before returning. If `persistedVersion === CURRENT_SCHEMA_VERSION`, no write-back SHALL occur on boot.

#### Scenario: A migrated envelope validates against the current schema

- **GIVEN** a v10 envelope carrying a `kind: 'smart'` pinned node
- **WHEN** `readPersistedState` validates it after the v11 migration
- **THEN** validation SHALL succeed against `AppStateV11Schema` and the envelope SHALL be written back as `{ schemaVersion: 11, state }`

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

For the **Zod-validation-failure** branch only (a clean migration chain whose output fails the current-version schema, `AppStateV11Schema`), the layer SHALL FIRST attempt `salvagePersistedState(migrated)` (see Requirement: Partial-corruption salvage preserves valid Space identities). When salvage returns a non-null state, the layer SHALL still write the quarantine record above and SHALL return `{ kind: 'salvaged'; state }`. When salvage returns `null`, the layer SHALL return `{ kind: 'corrupt' }`. The **migration-threw** and **invalid-`schemaVersion`** branches SHALL NOT attempt salvage and SHALL return `{ kind: 'corrupt' }`.

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

- **WHEN** all migrations run without throwing but the resulting object fails validation against the current-version schema (`AppStateV11Schema`)
- **AND** `salvagePersistedState(migrated)` returns `null`
- **THEN** a `QuarantineRecord` SHALL be written to `__corrupt_backup_<ts>` with `reason: 'schema parse failed'`, `zodIssues` set to `parsed.error.issues`, and `rawBytes` set to the original payload
- **AND** `loadState` SHALL return `{ state: createInitialState(), outcome: 'recovered' }`

#### Scenario: Schema validation fails but valid slices are salvaged

- **WHEN** all migrations run without throwing but the resulting object fails validation against `AppStateV11Schema`
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

The storage layer SHALL export a pure function `salvagePersistedState(migrated: unknown): AppStateV11 | null` that attempts to recover a valid `AppStateV11` from a payload that failed whole-state validation, preserving as much real data as possible instead of discarding all of it.

`salvagePersistedState` SHALL:

1. Return `null` when `migrated` is not a non-null object.
2. Start from a valid empty base equal in shape to `createInitialState()` at `CURRENT_SCHEMA_VERSION`.
3. Salvage the `spaces` array **element-wise**: when the input's `spaces` value is an array, keep each element that individually validates against the Space element schema (`AppStateV11Schema.shape.spaces.element`), preserving array order and dropping only the invalid elements; otherwise keep `[]`. A single malformed Space SHALL NOT cost the other Spaces.
4. Salvage every other top-level slice (`schemaVersion`, `activeSpaceByWindow`, `spaceInstancesByWindow`, `tabBindings`, `savedTabs`, `lastActivatedSpaceId`, `tabLastActivity`, `archivedTabs`, `trash`, `pinnedBySpace`, `faviconRow`, `lensItemBindings`) **slice-wise**: validate the input's value against that slice's own schema (`AppStateV11Schema.shape.<field>`); on success the validated value SHALL be kept, on failure the empty-base default SHALL be kept.
5. Validate the assembled object against `AppStateV11Schema` and return it on success, or `null` on failure.

Because the `spaces` array is salvaged element-wise, a payload SHALL preserve every individually-valid Space's `id`, `name`, `color`, and `icon`, even when other Spaces in the same array are malformed and even when unrelated slices (e.g. `savedTabs`) are malformed. Because `faviconRow` is salvaged slice-wise, a valid `faviconRow` SHALL be preserved rather than reset whenever it individually validates. Because `pinnedBySpace` is validated against the current-version slice schema (which admits all three `PinNode` kinds, the four lens provider values `'gitlab' | 'github' | 'jira' | 'rss'`, and each instance's `queries: LensQuery[]`), a pinned tree containing v11-shape `lens` nodes SHALL survive salvage intact rather than being reset. Dangling references that result from a dropped Space or slice (e.g. a `pinnedBySpace` entry pointing at a reset `savedTabs`, or `activeSpaceByWindow` referencing a dropped Space) are tolerated by the existing load-path de-duplication and the sidebar projections (see the *Loaded state has unique ids per keyed collection* requirement).

A salvaged state SHALL flow through the existing `dedupePersistedState` step and SHALL be eligible for the existing write-back self-heal, exactly as a migrated/de-duplicated `ok` state is.

#### Scenario: A malformed unrelated slice preserves all Space names

- **GIVEN** a migrated payload whose `spaces` slice is `[{ id: 'a', name: 'Work', color: 'blue', icon: 'star' }, { id: 'b', name: 'Personal', color: 'red', icon: 'star' }]` but whose `savedTabs` slice contains a record missing its required `originalURL`
- **WHEN** whole-state validation fails and `salvagePersistedState` runs
- **THEN** it SHALL return a valid `AppStateV11` whose `spaces` equals the two input Spaces unchanged
- **AND** `savedTabs` SHALL be reset to `{}`
- **AND** `readPersistedState` SHALL return `{ kind: 'salvaged', state }`

#### Scenario: An invalid Space among valid Spaces is dropped, the rest preserved

- **GIVEN** a migrated payload whose `spaces` slice is `[{ id: 'a', name: 'Work', color: 'blue', icon: 'star' }, { id: 'b', color: 'red', icon: 'star' }]` (the second Space is missing its required `name`)
- **WHEN** `salvagePersistedState` runs
- **THEN** the element-wise `spaces` salvage SHALL keep `{ id: 'a', name: 'Work', color: 'blue', icon: 'star' }` and drop the nameless element
- **AND** the assembled object SHALL validate against `AppStateV11Schema` with `spaces` equal to `[{ id: 'a', name: 'Work', color: 'blue', icon: 'star' }]`
- **AND** `readPersistedState` SHALL return `{ kind: 'salvaged', state }`

#### Scenario: A valid faviconRow survives an unrelated slice failure

- **GIVEN** a migrated payload whose `faviconRow` slice is a valid `SavedTabId[]` but whose `savedTabs` slice is malformed
- **WHEN** whole-state validation fails and `salvagePersistedState` runs
- **THEN** the assembled object's `faviconRow` SHALL equal the input `faviconRow` (favourites are not reset)
- **AND** `readPersistedState` SHALL return `{ kind: 'salvaged', state }`

#### Scenario: A pinned tree containing a lens node survives salvage

- **GIVEN** a migrated payload whose `pinnedBySpace` slice is valid and contains a v11-shape `lens` node (`lensKind: 'general'`) — a queue instance carrying `queries: ['authored', 'review-requested']` and an `rss` instance carrying `queries: []` — but whose `savedTabs` slice is malformed
- **WHEN** whole-state validation fails and `salvagePersistedState` runs
- **THEN** the assembled object's `pinnedBySpace` SHALL equal the input slice intact, each lens node's `sources[]`/`queries[]` config fields included
- **AND** `readPersistedState` SHALL return `{ kind: 'salvaged', state }`

#### Scenario: A non-object payload is unsalvageable

- **WHEN** `salvagePersistedState` is called with a string, number, array, or `null`
- **THEN** it SHALL return `null`
- **AND** `readPersistedState` SHALL return `{ kind: 'corrupt' }`

### Requirement: ArchivedTab record shape on AppState

`AppState.archivedTabs` SHALL be typed as `ArchivedTab[]` in [apps/extension/src/shared/types.ts](../../../apps/extension/src/shared/types.ts) and validated by `ArchivedTabSchema` (a `z.strictObject`) inside the current-version `AppState` schema (`AppStateV11Schema`) in [apps/extension/src/shared/schemas.ts](../../../apps/extension/src/shared/schemas.ts).

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
- **THEN** `AppStateV11Schema.parse` SHALL fail validation (strict mode)
- **AND** the storage layer SHALL quarantine per the corruption-quarantine requirement

### Requirement: Schema-to-type coherence

`apps/extension/src/shared/schemas.ts` SHALL include a compile-time assertion that `z.infer<typeof AppStateV11Schema>` and `AppState` (from `apps/extension/src/shared/types.ts`) are structurally equivalent. A drift between the two SHALL cause `pnpm exec tsc --noEmit` to fail.

The `AppStateV11Schema` SHALL define `lensItemBindings` as:
```
z.record(z.record(z.record(z.object({ tabId: z.number(), allowGlob: z.string() }))))
  .default({})
```
replacing the v6 `z.record(z.record(z.record(z.number()))).default({})`.

The `AppStateV11Schema` SHALL define `liveTabsById` as:
```
z.record(z.coerce.number(), LiveTabSchema).default({})
```
replacing the previous `.optional()` form — so the inferred type is `Record<number, LiveTab>` (not `Record<number, LiveTab> | undefined`), matching `AppState.liveTabsById`.

The `AppStateV11Schema` SHALL define `lenses` as:
```
z.record(z.string(), LensRuntimeSchema).default({})
```
replacing the previous `.optional()` form — so the inferred type is `Record<string, LensRuntime>` (not `Record<string, LensRuntime> | undefined`), matching `AppState.lenses`.

With these changes the `Persisted<T>` helper in `schemas.ts` (which previously omitted `liveTabsById` and `lenses` from the structural comparison to hide the optional/non-optional gap) SHALL be removed. The compile-time assertion SHALL compare `z.infer<typeof AppStateV11Schema>` and `AppState` directly, without stripping any fields.

No `as unknown as AppState` cast SHALL remain in the codebase for values produced by `AppStateV11Schema.safeParse`.

#### Scenario: Type drift fails the build

- **WHEN** a developer changes the `lensItemBindings` slot type in `AppState` without updating `AppStateV11Schema`
- **THEN** `pnpm exec tsc --noEmit` SHALL fail with a type-equivalence error in `apps/extension/src/shared/schemas.ts`

#### Scenario: liveTabsById gap removed — parse output is directly assignable to AppState

- **WHEN** `AppStateV11Schema.safeParse(payload)` succeeds on a payload lacking a `liveTabsById` field
- **THEN** `stateResult.data.liveTabsById` SHALL equal `{}` (the `.default({})` value)
- **AND** `stateResult.data` SHALL be directly assignable to `AppState` without a cast

#### Scenario: lenses gap removed — parse output is directly assignable to AppState

- **WHEN** `AppStateV11Schema.safeParse(payload)` succeeds on a payload lacking a `lenses` field
- **THEN** `stateResult.data.lenses` SHALL equal `{}`
- **AND** `stateResult.data` SHALL be directly assignable to `AppState` without a cast

### Requirement: Spaces persist an optional auto-archive override

The persisted `Space` record SHALL carry an optional `autoArchive` field of type `SpaceAutoArchive = { mode: 'off' } | { mode: 'custom'; idleMinutes: number }`, validated by `SpaceAutoArchiveSchema` inside the current-version `AppState` schema (`AppStateV11Schema`). This field is part of the **clean v1 baseline shape** — it is present in the baseline `Space` schema directly and is NOT introduced by a migration (the placeholder-era `v10Tov11` migration that originally added it is deleted with the rest of the collapsed chain). The behavior of resolving and applying the override is owned by the `auto-archive` capability; this requirement is limited to the persisted-shape contract.

An **absent** `autoArchive` SHALL mean *inherit the global auto-archive setting* — the durable, on-disk representation of "this Space follows the `autoArchiveEnabled` / `autoArchiveIdleMinutes` settings". A `{ mode: 'off' }` value SHALL mean *never auto-archive this Space*; a `{ mode: 'custom'; idleMinutes }` value SHALL carry a positive-integer threshold (validated `z.number().int().positive()`, so `0`/negatives are rejected at the storage boundary; the resolver additionally clamps to a floor of 1).

The baseline schemas SHALL include `SpaceAutoArchiveSchema`; the baseline `Space` schema (carrying the optional `autoArchive`); the baseline trashed-Space schema (carrying the optional `autoArchive` — REQUIRED because `TrashedSpace extends Space`, so leaving `trash` validated by a Space schema without the field would break the `AssertEqual` schema-to-type guard once `Space` carries it); and the current-version `AppState` schema (whose `spaces` validate the Space shape and `trash` the trashed-Space shape). An absent `autoArchive` is valid, so no record requires rewriting on load.

#### Scenario: A fresh baseline Space has no override

- **WHEN** a Space is created with no `autoArchive` set
- **THEN** the persisted Space SHALL omit `autoArchive`
- **AND** validation against `AppStateV11Schema` SHALL succeed (absent = inherit the global setting)

#### Scenario: A custom override round-trips through storage

- **WHEN** a Space with `autoArchive: { mode: 'custom', idleMinutes: 15 }` is persisted and re-read
- **THEN** the override SHALL survive the round-trip intact

#### Scenario: An off override round-trips through storage

- **WHEN** a Space with `autoArchive: { mode: 'off' }` is persisted and re-read
- **THEN** the override SHALL survive the round-trip intact

#### Scenario: A trashed Space's override round-trips through storage

- **WHEN** a trashed Space (in `state.trash`) carrying `autoArchive: { mode: 'custom', idleMinutes: 20 }` is persisted and re-read
- **THEN** validation against `AppStateV11Schema` (whose `trash` carries the optional `autoArchive`) SHALL succeed
- **AND** the override SHALL survive the round-trip intact

#### Scenario: A malformed override is rejected, then salvaged

- **WHEN** a Space's stored `autoArchive` fails `SpaceAutoArchiveSchema` validation
- **THEN** whole-state validation SHALL fail and the existing salvage path SHALL apply (the original bytes are quarantined under a `__corrupt_backup_*` key)

## REMOVED Requirements

### Requirement: smartFolders is ephemeral and excluded from persistence

**Reason**: Renamed to lens vocabulary by establish-lens-model — replaced by "lenses is ephemeral and excluded from persistence" (the `smartFolders` slice becomes `lenses`).

### Requirement: Smart-folder read-state is persisted and pruned

**Reason**: Renamed to lens vocabulary by establish-lens-model — replaced by "Lens read-state is persisted and pruned" (the `smartReadState` slice becomes `lensReadState`).
