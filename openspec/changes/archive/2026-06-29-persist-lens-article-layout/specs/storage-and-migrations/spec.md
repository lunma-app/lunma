## ADDED Requirements

### Requirement: Lens article layout persists on the lens node

The persisted schema SHALL carry an optional `articleLayout` on the lens
`PinNode`, a `'grid' | 'list'` union. The field is **additive**: a state written
before this field existed SHALL load unchanged with no `articleLayout` (resolving
to the `grid` default), and a lens with an `articleLayout` SHALL round-trip
losslessly. `CURRENT_SCHEMA_VERSION` SHALL advance to 15 with an **append-only
pass-through migration** (`{ toVersion: 15, migrate: (raw) => raw }`) — no
transform is required because the field is optional with a `grid`-equivalent empty
default. Per schema-to-type coherence, the lens-node schema's `articleLayout`
SHALL match the `'grid' | 'list'` type exactly (optional, i.e.
`'grid' | 'list' | undefined`).

#### Scenario: A lens with an article layout round-trips under schema 15

- **GIVEN** a state at schema version 15 with a lens whose node carries `articleLayout: 'list'`
- **WHEN** the state is persisted and reloaded
- **THEN** it validates and the lens's `articleLayout` is restored as `'list'`

#### Scenario: A pre-15 state loads with no article layout

- **GIVEN** a persisted state at schema version 14 with lens nodes that have no `articleLayout`
- **WHEN** the migration runner brings it to version 15
- **THEN** the pass-through migration applies, the state validates, and every lens loads with no `articleLayout` (resolving to the `grid` default)

#### Scenario: The migrations chain appends the v15 entry

- **GIVEN** the `migrations` list exported from `apps/extension/src/shared/migrations.ts`
- **THEN** it SHALL include a final `{ toVersion: 15 }` entry whose `migrate` is the identity pass-through, appended after the `{ toVersion: 14 }` lens-view-filters entry
