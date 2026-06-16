## MODIFIED Requirements

### Requirement: Append-only migrations list

The `migrations: Migration[]` array exported from `apps/extension/src/shared/migrations.ts` SHALL be append-only **from the v1 baseline onward**. A `Migration` SHALL be `{ toVersion: number; migrate: (raw: unknown) => unknown }`. Each `migrate` function SHALL be synchronous and pure — it SHALL NOT call any `chrome.*` API and SHALL NOT perform I/O.

A new entry MAY only be added at the end of the array, and its `toVersion` SHALL equal `CURRENT_SCHEMA_VERSION` after it is added. **Once the product has shipped**, existing entries SHALL NOT be modified, reordered, or removed in any subsequent change.

The product is **pre-release** at the time of this change, so the accumulated placeholder-era chain was reset **once** to a clean empty baseline; it SHALL NOT recur after the first public release.

The list holds five real entries: the `smart-folders` migration `{ toVersion: 2 }`, the `github-connector` migration `{ toVersion: 3 }`, the `smart-folder-item-bindings` migration `{ toVersion: 4 }`, the `jira-connector` migration `{ toVersion: 5 }`, and the `rss-connector` migration `{ toVersion: 6 }` — all pure pass-throughs. The v6 entry is a pass-through because the v6 schema admits the new shape over v5 data without transformation: `source: 'rss'` is a widened enum value v5 data cannot contain; `query` becomes optional; and the new node fields `maxItems` / `hideRead` plus the new `smartReadState` slice parse via their schema defaults (`maxItems` defaults to `20`, `hideRead` to `false`, `smartReadState` to `{}`), so a v5 envelope migrates losslessly. Each bump is deliberate despite being a pass-through: it makes a downgrade detectable (an older build reading newer data quarantines on the version gate instead of Zod-rejecting unfamiliar fields with a confusing parse error).

#### Scenario: The chain holds exactly the v2, v3, v4, v5, and v6 pass-through entries

- **WHEN** this change ships
- **THEN** `migrations` SHALL equal a five-entry list — `{ toVersion: 2 }`, `{ toVersion: 3 }`, `{ toVersion: 4 }`, `{ toVersion: 5 }`, then `{ toVersion: 6 }`, all pass-throughs
- **AND** `CURRENT_SCHEMA_VERSION` SHALL equal `6`

#### Scenario: A v1 envelope migrates to the current version losslessly

- **WHEN** the storage layer loads an envelope with `schemaVersion: 1`
- **THEN** the runner applies the `toVersion: 2` through `toVersion: 6` pass-throughs in order, validation succeeds against the v6 schema, and the envelope is written back as `{ schemaVersion: 6, state }` with the state content unchanged

#### Scenario: A v5 envelope's smart nodes gain the new fields by default

- **WHEN** the storage layer loads a `schemaVersion: 5` envelope whose smart nodes carry no `maxItems` or `hideRead`
- **THEN** validation under the v6 schema yields `maxItems: 20` and `hideRead: false` on those nodes, an absent `smartReadState` defaults to `{}`, and the envelope is rewritten as `{ schemaVersion: 6, state }`

#### Scenario: A future change adds a migration

- **WHEN** a future change introduces migration `M` producing version `N`
- **THEN** `M` SHALL be appended as the last entry in `migrations` with `toVersion: N`
- **AND** `CURRENT_SCHEMA_VERSION` SHALL be raised to `N` in the same change
- **AND** existing entries SHALL NOT be modified, reordered, or removed (the append-only rule binds from the v1 baseline forward)

## ADDED Requirements

### Requirement: Smart-folder read-state is persisted and pruned

The `smartReadState` slice of `AppState` SHALL be **persisted** to
`chrome.storage.local` — kept by `persist(state)`, NOT stripped like the ephemeral
`smartFolders` and `liveTabsById` slices — so read marks survive SW sleeps and
Chrome restarts. The slice maps each feed folder id to an array of its read item
ids (shape: a record from folder id to a list of item-id strings). It SHALL store
**ids only** (never item titles or URLs — the work/reading-sensitive payload stays
off disk, mirroring `smartItemBindings`). It SHALL be **pruned to the fetched
window**: after a folder's successful fetch, any stored read id no longer present
in the fetched item set SHALL be dropped (`pruneSmartReadState`), and a folder's
entry SHALL be removed when the folder is deleted — so the slice can never exceed
the connector's bounded fetch (the feed connector's `FEED_BUFFER`, capped at 200;
the queue connectors' `maxItems`). The slice SHALL be part of the current-version schema
(`SmartReadStateSchema`, with `.default({})` so pre-v6 envelopes parse) and
included in the schema-to-type coherence check.

#### Scenario: persist keeps smartReadState

- **WHEN** `persist(state)` runs with a populated `state.smartReadState`
- **THEN** the object written under the storage key SHALL contain the `smartReadState` field (ids only), unlike the stripped `smartFolders` / `liveTabsById` slices

#### Scenario: Read-state is pruned to the live window

- **GIVEN** a folder whose `smartReadState` holds 18 read ids
- **WHEN** a successful fetch returns an item set that includes only 12 of those ids
- **THEN** `pruneSmartReadState` drops the 6 absent ids, leaving at most the fetched set

#### Scenario: Deleting a folder drops its read-state

- **WHEN** a smart folder is deleted
- **THEN** its `smartReadState[folderId]` entry is removed

#### Scenario: A pre-v6 envelope loads with empty read-state

- **WHEN** `loadState()` reads a persisted envelope written before this slice existed
- **THEN** `smartReadState` SHALL default to `{}` and validate under the current-version schema
