## ADDED Requirements

### Requirement: Migration output contains only current-schema-valid PinNodes

The migration chain SHALL NOT emit a `pinnedBySpace` that contains a `PinNode` which fails the current-version `PinNodeSchema`. After the last per-version migration runs, `runMigrations` SHALL apply a terminal normalization pass over `pinnedBySpace` that drops every node failing `PinNodeSchema.safeParse(node)`, preserving the relative order of the surviving nodes and the set of Space keys (a Space whose every node is dropped becomes an empty array, not a removed key).

This closes the silent-data-loss path where an earlier migration leaves a structurally-invalid node — most notably a `kind: 'lens'` node whose `sources` ends up empty (`[]`) or absent (the v13 source-account rewrite dropping every malformed embedded entry, or a pre-v8 flat smart node migrated without a `baseUrl`). Such a node would otherwise fail whole-state validation and trigger the salvage fallback for the *entire* `pinnedBySpace` slice. A `lens` with no valid `sources` is non-functional (no resolvable connector); dropping that one dead node is required behaviour, and is strictly safer than poisoning the surrounding tree.

The normalization SHALL operate on the original node objects (it decides drop-or-keep via `safeParse`; it does not substitute the parsed/defaulted node) so the subsequent whole-state parse remains the single place defaults are materialized. The normalization SHALL run for every migration invocation, including when the persisted version already equals `CURRENT_SCHEMA_VERSION` (so a node corrupted on disk by a prior buggy write is still normalized on read).

#### Scenario: A migration that yields an empty-sources lens drops only that node

- **GIVEN** a persisted payload whose `pinnedBySpace` is `{ s1: [ <valid tab t1>, <lens whose embedded sources are all malformed> ], s2: [ <valid tab t2> ] }`
- **WHEN** `runMigrations` runs the chain and its terminal normalization
- **THEN** the lens node (whose migrated `sources` is `[]`) SHALL be dropped
- **AND** the surviving `pinnedBySpace` SHALL be `{ s1: [ <valid tab t1> ], s2: [ <valid tab t2> ] }`
- **AND** the migrated state SHALL validate against `AppStateV14Schema` without entering the salvage fallback

#### Scenario: A former-smart node migrated without sources is dropped

- **GIVEN** a pre-v8 payload whose `pinnedBySpace.s1` contains a `kind: 'smart'` node with a `source` but no `baseUrl`
- **WHEN** the chain migrates it (leaving a `kind: 'lens'` node with no `sources` field) and the terminal normalization runs
- **THEN** that node SHALL be dropped from `pinnedBySpace.s1`
- **AND** the migrated state SHALL validate against `AppStateV14Schema`

#### Scenario: Valid nodes are never dropped or reordered

- **GIVEN** a payload whose every `pinnedBySpace` node validates against `PinNodeSchema`
- **WHEN** the terminal normalization runs
- **THEN** every node SHALL be kept in its original order with its original field values (no defaults pre-applied by the normalization)

## MODIFIED Requirements

### Requirement: Partial-corruption salvage preserves valid Space identities

The storage layer SHALL export a pure function `salvagePersistedState(migrated: unknown): AppStateV14 | null` that attempts to recover a valid `AppStateV14` from a payload that failed whole-state validation, preserving as much real data as possible instead of discarding all of it.

`salvagePersistedState` SHALL:

1. Return `null` when `migrated` is not a non-null object (a string, number, array, or `null` is unsalvageable).
2. Start from a valid empty base equal in shape to `createInitialState()` at `CURRENT_SCHEMA_VERSION`.
3. Salvage the `spaces` array **element-wise**: when the input's `spaces` value is an array, keep each element that individually validates against the Space element schema (`AppStateV14Schema.shape.spaces.element`), preserving array order and dropping only the invalid elements; otherwise keep `[]`. A single malformed Space SHALL NOT cost the other Spaces.
4. Salvage the **container slices element-wise** — one bad element SHALL NOT discard the slice:
   - `pinnedBySpace` (a record of node arrays): for each Space key, keep each node that individually validates against `AppStateV14Schema.shape.pinnedBySpace.valueType.element` (the current `PinNodeSchema`; Zod 4's record value accessor is `.valueType`), preserving order and dropping only invalid nodes; a Space whose nodes are all invalid yields `[]`. A non-array value for a Space key drops that key.
   - `savedTabs` and `trash` (records keyed by id): keep each entry whose value individually validates against the slice's element/value schema; drop only the invalid entries.
   - `archivedTabs` (an array): keep each element that individually validates against `AppStateV14Schema.shape.archivedTabs.element`; drop only the invalid elements.
5. Salvage every remaining top-level slice (`schemaVersion`, `sources`, `activeSpaceByWindow`, `spaceInstancesByWindow`, `tabBindings`, `lastActivatedSpaceId`, `tabLastActivity`, `faviconRow`, `lensItemBindings`, `lensReadState`) **slice-wise**: validate the input's value against that slice's own schema (`AppStateV14Schema.shape.<field>`); on success the validated value SHALL be kept, on failure the empty-base default SHALL be kept.
6. Validate the assembled object against `AppStateV14Schema` and return it on success, or `null` on failure.

Because `spaces` and the container slices are salvaged element-wise, a payload SHALL preserve every individually-valid Space, pinned node, saved tab, archived tab, and trashed Space, even when other elements in the same slice are malformed and even when unrelated slices are malformed. A single bad `pinnedBySpace` node SHALL cost only that node — never the pinned trees of other Spaces, and never the valid nodes of the same Space. Dangling references that result from a dropped element or slice (e.g. a surviving `pinnedBySpace` folder node referencing a dropped `savedTabs` entry, or `activeSpaceByWindow` referencing a dropped Space) are tolerated by the existing load-path de-duplication and the sidebar projections (see the *Loaded state has unique ids per keyed collection* requirement).

A salvaged state SHALL flow through the existing `dedupePersistedState` step and SHALL be eligible for the existing write-back self-heal, exactly as a migrated/de-duplicated `ok` state is.

#### Scenario: A malformed unrelated slice preserves all Space names

- **GIVEN** a migrated payload whose `spaces` slice is `[{ id: 'a', name: 'Work', color: 'blue', icon: 'star' }, { id: 'b', name: 'Personal', color: 'red', icon: 'star' }]` but whose `savedTabs` slice contains a record missing its required `originalURL`
- **WHEN** whole-state validation fails and `salvagePersistedState` runs
- **THEN** it SHALL return a valid `AppStateV14` whose `spaces` equals the two input Spaces unchanged
- **AND** the malformed `savedTabs` record SHALL be dropped while any valid `savedTabs` records are kept
- **AND** `readPersistedState` SHALL return `{ kind: 'salvaged', state }`

#### Scenario: An invalid Space among valid Spaces is dropped, the rest preserved

- **GIVEN** a migrated payload whose `spaces` slice is `[{ id: 'a', name: 'Work', color: 'blue', icon: 'star' }, { id: 'b', color: 'red', icon: 'star' }]` (the second Space is missing its required `name`)
- **WHEN** `salvagePersistedState` runs
- **THEN** the element-wise `spaces` salvage SHALL keep `{ id: 'a', name: 'Work', color: 'blue', icon: 'star' }` and drop the nameless element
- **AND** the assembled object SHALL validate against `AppStateV14Schema` with `spaces` equal to `[{ id: 'a', name: 'Work', color: 'blue', icon: 'star' }]`
- **AND** `readPersistedState` SHALL return `{ kind: 'salvaged', state }`

#### Scenario: One invalid pinned node costs only that node, across all Spaces

- **GIVEN** a migrated payload whose `pinnedBySpace` is `{ s1: [ <valid tab node>, <invalid node> ], s2: [ <valid lens node> ] }`
- **WHEN** whole-state validation fails and `salvagePersistedState` runs
- **THEN** the assembled object's `pinnedBySpace.s1` SHALL keep the valid tab node and drop only the invalid node
- **AND** `pinnedBySpace.s2` SHALL keep the valid lens node intact
- **AND** `readPersistedState` SHALL return `{ kind: 'salvaged', state }`

#### Scenario: A valid faviconRow survives an unrelated slice failure

- **GIVEN** a migrated payload whose `faviconRow` slice is a valid `SavedTabId[]` but whose `savedTabs` slice is malformed
- **WHEN** whole-state validation fails and `salvagePersistedState` runs
- **THEN** the assembled object's `faviconRow` SHALL equal the input `faviconRow` (favourites are not reset)
- **AND** `readPersistedState` SHALL return `{ kind: 'salvaged', state }`

#### Scenario: A pinned tree containing a lens node survives salvage

- **GIVEN** a migrated payload whose `pinnedBySpace` slice is valid and contains a current-shape `lens` node (`lensKind: 'general'`) whose `sources` is a non-empty `LensSourceRef[]` — but whose `savedTabs` slice is malformed
- **WHEN** whole-state validation fails and `salvagePersistedState` runs
- **THEN** the assembled object's `pinnedBySpace` SHALL equal the input slice intact, each lens node's `sources[]`/`queries[]` config fields included
- **AND** `readPersistedState` SHALL return `{ kind: 'salvaged', state }`

#### Scenario: A non-object payload is unsalvageable

- **WHEN** `salvagePersistedState` is called with a string, number, array, or `null`
- **THEN** it SHALL return `null`
- **AND** `readPersistedState` SHALL return `{ kind: 'corrupt' }`
