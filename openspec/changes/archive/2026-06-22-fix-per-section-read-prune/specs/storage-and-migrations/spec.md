## MODIFIED Requirements

### Requirement: Smart-folder read-state is persisted and pruned

The `smartReadState` slice of `AppState` SHALL be **persisted** to
`chrome.storage.local` — kept by `persist(state)`, NOT stripped like the ephemeral
`smartFolders` and `liveTabsById` slices — so read marks survive SW sleeps and
Chrome restarts. The slice maps each feed folder id to an array of its read item
ids (shape: a record from folder id to a list of item-id strings). It SHALL store
**ids only** (never item titles or URLs — the work/reading-sensitive payload stays
off disk, mirroring `smartItemBindings`). Each stored read id is the **namespaced**
id `${sourceKey}:${nativeId}` written by `markSmartItemRead`, so a folder's read
set spans all of its resolved sections.

Pruning SHALL be **per resolved section**: a section's successful fetch
(`smartFolders.result` with `state: 'ok'`) prunes only the read ids belonging to
**that** section — read ids whose namespaced key carries that section's
`sourceKey` prefix — dropping those no longer present in that section's fetched
item set, and leaving every **other** section's read ids untouched
(`pruneSmartReadState(folderId, sectionKey, liveIds)`). Each section prunes its
own ids on its own fetch, so a multi-section folder (e.g. an OPML import) never
loses one section's read marks when a different section refreshes. A folder's
entire entry SHALL be removed when the folder is deleted. Because each section is
bounded by the connector's fetch window (the feed connector's `FEED_BUFFER`,
capped at 200; the queue connectors' `maxItems`), the per-section prune keeps the
slice bounded by the sum of the folder's section windows. The slice SHALL be part
of the current-version schema (`SmartReadStateSchema`, with `.default({})` so
pre-v6 envelopes parse) and included in the schema-to-type coherence check.

#### Scenario: persist keeps smartReadState

- **WHEN** `persist(state)` runs with a populated `state.smartReadState`
- **THEN** the object written under the storage key SHALL contain the `smartReadState` field (ids only), unlike the stripped `smartFolders` / `liveTabsById` slices

#### Scenario: A section's fetch prunes only its own read ids to its window

- **GIVEN** a folder whose `smartReadState` holds read ids for section A and section B
- **WHEN** section B completes a successful fetch whose item set omits some of B's read ids
- **THEN** `pruneSmartReadState(folderId, 'B', …)` drops only the absent **section-B** ids
- **AND** every **section-A** read id is left intact (A prunes only on its own fetch)

#### Scenario: Deleting a folder drops its read-state

- **WHEN** a smart folder is deleted
- **THEN** its `smartReadState[folderId]` entry is removed

#### Scenario: A pre-v6 envelope loads with empty read-state

- **WHEN** `loadState()` reads a persisted envelope written before this slice existed
- **THEN** `smartReadState` SHALL default to `{}` and validate under the current-version schema
