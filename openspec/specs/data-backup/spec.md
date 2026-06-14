# data-backup Specification

## Purpose

Lunma's data is local-only — Spaces, favourites, pinned tabs, and settings live
in `chrome.storage` on one device and never sync. This capability is the missing
safety net: export the user's portable data to a single versioned JSON file, and
import it back. Export downloads a `BackupEnvelope` (no network request); import
goes through the service worker, where it is validated and migrated forward
(reusing the load-path pipeline) before destructively replacing the live state in
one atomic persist + broadcast. Machine-bound and secret data — live tab
bindings, per-window Space instances, tab activity, and connector tokens — are
deliberately excluded; window-bound maps re-seed empty on import. The whole flow
is surfaced as a Backup & restore group on the options page, gated behind a
two-step destructive-import confirm.

## Requirements

### Requirement: Portable backup envelope format

A backup SHALL be a single JSON object — the `BackupEnvelope` (exported from
`apps/extension/src/shared/types.ts`, validated by `BackupEnvelopeSchema` in
`apps/extension/src/shared/schemas.ts`) — of shape:

- `formatVersion: 1` — the backup file format version, independent of the storage
  `schemaVersion` (the file format MAY evolve separately from the persisted schema).
- `schemaVersion: number` — the storage schema the `state` payload was written at, so
  import can migrate it forward.
- `exportedAt: number` — a millisecond timestamp of when the backup was produced.
- `state: PortableAppState` — the portable durable data:
  `Pick<AppState, 'spaces' | 'savedTabs' | 'pinnedBySpace' | 'faviconRow' | 'archivedTabs' | 'trash' | 'lastActivatedSpaceId'>`
  plus `schemaVersion`.
- `settings?: Settings` — present when the user included settings in the export.

`BackupEnvelopeSchema` SHALL be a strict schema that rejects unknown top-level keys and
SHALL reuse the existing `AppStateV2Schema` field shapes for the `state` slices and
`SettingsSchema` for `settings`. A pure `buildBackup(state, settings?)` SHALL produce the
envelope from a store snapshot, and a pure `parseBackup(raw)` SHALL validate + migrate it
(see "Import validates and migrates before replacing").

#### Scenario: A backup carries its versions and timestamp

- **WHEN** a backup is produced
- **THEN** it SHALL be a JSON object with `formatVersion: 1`, the current storage `schemaVersion`, a numeric `exportedAt`, and a `state` holding only the portable durable fields
- **AND** `settings` SHALL be present only when the user chose to include settings

### Requirement: Export downloads a backup file

The options page SHALL offer an **Export backup** action that serialises the user's
current portable data (and, when chosen, settings) into a `BackupEnvelope` and downloads
it as a `.json` file, using an object-URL anchor download (no network request). The export
SHALL read the current state via the store snapshot path (so it never emits Svelte `$state`
proxies) and SHALL NOT include any machine-bound or secret data (see "Machine-bound and
secret data are excluded").

#### Scenario: Exporting produces a downloadable JSON backup

- **WHEN** the user activates Export backup
- **THEN** a `.json` file SHALL download containing a valid `BackupEnvelope` of the current Spaces, saved tabs, pinned tree, favourites order, archived tabs, and trashed Spaces
- **AND** no network request SHALL be made

### Requirement: Import validates and migrates before replacing

Importing a backup SHALL go through the service worker via the `importState` command
(owned by `typed-message-bus`). The import handler SHALL `parseBackup(raw)` — running
`runMigrations(state, file.schemaVersion)`, then `AppStateV2Schema`-parsing the migrated
state (with the window-bound maps re-seeded to empty defaults so the strict schema is
satisfied), then `dedupePersistedState` — and SHALL reject (no mutation) a file that fails
validation, surfacing an error to the options page. On success it SHALL call
`LunmaStore.replaceState(next)` and `markDirty()`, so the coordinator persists and
broadcasts the replacement to every open surface in one atomic step. `replaceState` SHALL
mutate `this.state` in place (never reassign `this.state`), so already-open surfaces keep
their reactive subscriptions.

#### Scenario: A valid older-schema backup is migrated then applied

- **GIVEN** a backup file written at an earlier `schemaVersion`
- **WHEN** the user imports it
- **THEN** the handler SHALL migrate it forward, validate it, replace the live state, and broadcast the result to open surfaces
- **AND** the persisted `lunma.state` envelope SHALL now hold the imported data at the current schema version

#### Scenario: A malformed backup is rejected without mutation

- **WHEN** the user imports a file that is not a valid `BackupEnvelope`
- **THEN** no state SHALL be mutated, persisted, or broadcast
- **AND** the options page SHALL surface an import-failed message

### Requirement: Import is destructive and confirmed

The options page SHALL gate import behind a two-step inline confirm, because import
replaces the user's current Spaces, tabs, and (when present) settings. It mirrors the
Recently-archived Clear-all pattern: the first activation SHALL arm a confirmation stating
that importing replaces the current data, and only the second activation SHALL dispatch
`importState`. Dismissing or selecting elsewhere SHALL disarm it.

#### Scenario: Import requires a second confirmation

- **WHEN** the user picks a backup file to import
- **THEN** an inline confirmation SHALL arm, stating that importing replaces the current data
- **AND** only a second, explicit confirmation SHALL dispatch `importState`

### Requirement: Machine-bound and secret data are excluded from backups

A backup SHALL NOT contain machine-bound or secret data: live tab bindings
(`tabBindings`), per-window Space instances (`spaceInstancesByWindow`), the per-window
active Space (`activeSpaceByWindow`), tab activity timestamps (`tabLastActivity`), the
live-tab slice (`liveTabsById`), ephemeral smart-folder results (`smartFolders`), or
**connector tokens** (which Lunma keeps strictly machine-local). On import these
window-bound maps SHALL be re-seeded to empty defaults, so the imported data adopts the new
machine's live tabs cleanly on next boot rather than referencing another machine's tab ids.

#### Scenario: A backup omits live and secret state

- **WHEN** a backup is produced
- **THEN** it SHALL NOT contain `tabBindings`, `spaceInstancesByWindow`, `activeSpaceByWindow`, `tabLastActivity`, `liveTabsById`, `smartFolders`, or connector tokens

#### Scenario: Imported window-bound maps start empty

- **WHEN** a backup is imported
- **THEN** the live tab bindings and per-window Space instances SHALL be empty defaults, and SHALL re-populate from the new machine's tabs on the next boot reconciliation

### Requirement: Backup & restore lives on the options page

The options page SHALL render a **Backup & restore** group composing existing `ui/`
primitives (no re-rolled buttons): an Export backup action, an Import backup action (a
native hidden `<input type="file" accept="application/json">` triggered by a `Button`), a
control to include settings in the export, and the import confirm. It SHALL hold WCAG-AA
contrast and respect reduced motion, at the page's visual bar.

#### Scenario: The options page exposes backup and restore

- **WHEN** the options page renders
- **THEN** it SHALL show a Backup & restore group with Export and Import actions composed from existing primitives
