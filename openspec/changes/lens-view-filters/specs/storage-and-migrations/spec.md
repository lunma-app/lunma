## ADDED Requirements

### Requirement: Lens view-filters persist on the lens node

The persisted schema SHALL carry an optional `filter` on the lens `PinNode`,
validated by `LensFilterSchema` (`{ entities?: LensEntity[]; repos?: string[];
projects?: string[] }`, every axis optional). The field is **additive**: a state
written before this field existed SHALL load unchanged with no `filter`, and a lens
with a `filter` SHALL round-trip losslessly. `CURRENT_SCHEMA_VERSION` SHALL advance
to 14 with an **append-only pass-through migration** (`{ toVersion: 14, migrate:
(raw) => raw }`) — no transform is required because the field is optional with an
empty default. Per schema-to-type coherence, `LensFilterSchema` SHALL match the
`LensFilter` type exactly (each optional array maps to `T[] | undefined`).

#### Scenario: A lens with a filter round-trips under schema 14

- **GIVEN** a state at schema version 14 with a lens whose node carries `filter: { entities: ['change'], repos: ['o/a'] }`
- **WHEN** the state is persisted and reloaded
- **THEN** it validates and the lens's `filter` is restored unchanged

#### Scenario: A pre-14 state loads with no filter

- **GIVEN** a persisted state at schema version 13 with lens nodes that have no `filter`
- **WHEN** the migration runner brings it to version 14
- **THEN** the pass-through migration applies, the state validates, and every lens loads with no `filter` (show-everything behaviour)

#### Scenario: An empty filter is canonicalised

- **GIVEN** a lens node persisted with `filter: { entities: [], repos: [], projects: [] }`
- **WHEN** the state loads
- **THEN** it validates and is treated identically to a lens with no `filter`
