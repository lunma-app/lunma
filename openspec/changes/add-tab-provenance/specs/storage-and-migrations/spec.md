## ADDED Requirements

### Requirement: AppState v19 adds the provenance slice

`CURRENT_SCHEMA_VERSION` SHALL advance from 18 to 19. `AppStateV19Schema` SHALL
add `provenanceByTabId: { [tabId: number]: ProvenanceEdge }`, and
`AppStateV18Schema` SHALL be retained frozen alongside every other historical
version. `EnvelopeSchema` SHALL carry `AppStateV19Schema`.

The v18 → v19 migration SHALL default `provenanceByTabId` to `{}`. No existing
data is reshaped.

`ProvenanceEdge` SHALL be defined in `apps/extension/src/shared/provenance.ts`
and its Zod schema in `apps/extension/src/shared/schemas.ts`, consistent with how
every other persisted shape is declared.

#### Scenario: An existing profile migrates to an empty slice

- **WHEN** a v17 persisted state is read after upgrade
- **THEN** it SHALL migrate to v19 with `provenanceByTabId` set to `{}`
- **AND** no other slice SHALL change

#### Scenario: A downgrade is still detectable

- **WHEN** a v19 state is read by a build whose `CURRENT_SCHEMA_VERSION` is 18
- **THEN** it SHALL quarantine via the existing version gate rather than
  Zod-rejecting

### Requirement: The provenance slice is bounded by live tabs, not by a retention policy

`provenanceByTabId` SHALL hold an entry only for tabs that currently exist.
Entries SHALL be evicted on `tabs.onRemoved` as part of the reparenting pass, and
the slice SHALL be reconciled against `chrome.tabs.query({})` during
`runRestartRecovery` so entries for tabs that vanished while the worker was dead
do not accumulate.

There SHALL be no time-based retention setting. The slice cannot grow unbounded
because it is keyed by live tab id.

#### Scenario: Boot drops entries for tabs that no longer exist

- **WHEN** the service worker boots and reconciles against live Chrome
- **THEN** `provenanceByTabId` entries whose `tabId` is absent from
  `chrome.tabs.query({})` SHALL be dropped

#### Scenario: Disabling the feature clears the slice

- **WHEN** `trackTabProvenance` is disabled
- **THEN** `provenanceByTabId` SHALL be set to `{}` and persisted
