# data-backup Specification

## MODIFIED Requirements

### Requirement: Machine-bound and secret data are excluded from backups

A backup SHALL NOT contain machine-bound or secret data: live tab bindings
(`tabBindings`), per-window Space instances (`spaceInstancesByWindow`), the per-window
active Space (`activeSpaceByWindow`), tab activity timestamps (`tabLastActivity`), the
live-tab slice (`liveTabsById`), ephemeral lens results (`lenses`), or
**connector tokens** (which Lunma keeps strictly machine-local). On import these
window-bound maps SHALL be re-seeded to empty defaults, so the imported data adopts the new
machine's live tabs cleanly on next boot rather than referencing another machine's tab ids.

#### Scenario: A backup omits live and secret state

- **WHEN** a backup is produced
- **THEN** it SHALL NOT contain `tabBindings`, `spaceInstancesByWindow`, `activeSpaceByWindow`, `tabLastActivity`, `liveTabsById`, `lenses`, or connector tokens

#### Scenario: Imported window-bound maps start empty

- **WHEN** a backup is imported
- **THEN** the live tab bindings and per-window Space instances SHALL be empty defaults, and SHALL re-populate from the new machine's tabs on the next boot reconciliation
