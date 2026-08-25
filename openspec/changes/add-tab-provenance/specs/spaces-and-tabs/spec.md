## ADDED Requirements

### Requirement: The temp-tab list nests children under their parent when provenance is active

`TempTabs.svelte`'s `$derived.by` projection SHALL, when provenance is
effectively enabled, arrange the Space instance's `tempTabIds` so that a tab whose
recorded parent is another tab in the same list renders nested under it.

`tempTabIds` SHALL remain the authoritative order: nesting arranges the existing
projection, it does not reorder or re-sort the list by lineage. A tab whose parent
is not present in the same list SHALL render at depth 0.

When provenance is not effectively enabled, the projection SHALL render exactly
as it does today — a flat, single-level keyed `{#each}` — with no depth and no
lineage rail.

#### Scenario: The list is flat when the feature is off

- **WHEN** `trackTabProvenance` is off, or the permission is absent on this device
- **THEN** `TempTabs` SHALL render a flat list identical to pre-change behaviour

#### Scenario: A parent outside the list does not indent its child

- **WHEN** a tab's recorded parent is a tab in a different Space or window
- **THEN** the tab SHALL render at depth 0

#### Scenario: Manual order survives nesting

- **WHEN** a user has drag-reordered `tempTabIds`
- **THEN** nesting SHALL respect that order rather than re-sorting by lineage

### Requirement: Drag-reordering a tab does not rewrite its lineage

Provenance records where a tab came from — a historical fact. Dragging a tab in
the sidebar expresses arrangement, not origin.

Reordering a tab SHALL NOT change its recorded parent. Where a drag would place a
tab such that its rendered nesting no longer matches its recorded parent, the tab
SHALL render at depth 0 rather than being re-parented to whatever it was dropped
beneath.

#### Scenario: Dropping a tab under an unrelated tab does not adopt it

- **WHEN** a user drags a tab and drops it directly beneath an unrelated tab
- **THEN** the dragged tab's recorded parent SHALL be unchanged
- **AND** it SHALL NOT render as a child of the tab it was dropped beneath
