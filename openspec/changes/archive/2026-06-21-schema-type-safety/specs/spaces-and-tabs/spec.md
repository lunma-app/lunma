## MODIFIED Requirements

### Requirement: Space identity and storage

A Space SHALL be a Lunma-owned record persisted in `chrome.storage.local`, identified by a Lunma-generated id (`crypto.randomUUID()`). A Space SHALL NOT be backed by a Chrome bookmark folder. The Space record SHALL carry `id`, `name`, `color: SpaceColor`, and `icon` (a member of `IconName`, the lucide string-literal union from `apps/extension/src/shared/icon-names.ts`). The Space's order SHALL be its position in `state.spaces[]`; no separate `order` field SHALL exist in storage at any level (Spaces or saved tabs).

`Space.color` SHALL be typed as `SpaceColor` (the 9-member string-literal union exported from `apps/extension/src/shared/types.ts`), NOT as the bare `string` type. `SpaceSchema.color` in `apps/extension/src/shared/schemas.ts` SHALL be `z.enum(SPACE_COLORS)`, where `SPACE_COLORS` is an exported `const` string-literal array containing exactly the 9 members of `SpaceColor` (`'red'`, `'orange'`, `'yellow'`, `'green'`, `'cyan'`, `'blue'`, `'purple'`, `'pink'`, `'gray'`). No caller SHALL use `space.color as SpaceColor`; the compiler SHALL enforce the narrow type at every call site.

#### Scenario: A Space is a Lunma-owned record

- **WHEN** a Space "Work" is created
- **THEN** `state.spaces` SHALL contain a record `{ id: <uuid>, name: 'Work', color: <color>, icon: <icon> }`
- **AND** no Chrome bookmark folder SHALL be created for it

#### Scenario: Space order is array order

- **WHEN** the sidebar requests the ordered list of Spaces
- **THEN** the order returned SHALL match the order of records in `state.spaces[]`

#### Scenario: No explicit order field is persisted

- **WHEN** a developer inspects the persisted state shape
- **THEN** no `order: number` field SHALL appear on any Space or saved-tab record

#### Scenario: A new Space is persisted with the user-chosen icon

- **WHEN** the `createSpace` handler runs with payload `{ name: 'Work', color: 'blue', icon: 'briefcase', windowId: 1 }`
- **THEN** the persisted Space record SHALL have `icon: 'briefcase'`
- **AND** the field SHALL round-trip through `chrome.storage.local` unchanged

#### Scenario: Space.color is narrowed — the compiler rejects a bare string

- **WHEN** a developer attempts to assign a bare `string` variable to `space.color` without first validating through `SpaceSchema`
- **THEN** `pnpm exec tsc --noEmit` SHALL fail with a type error

#### Scenario: An invalid colour string is rejected by SpaceSchema at the storage boundary

- **WHEN** `SpaceSchema.parse({ ..., color: 'hotpink' })` is called
- **THEN** Zod SHALL throw a `ZodError` because `'hotpink'` is not a member of `SPACE_COLORS`
- **AND** the corrupt envelope SHALL enter the quarantine path as with any other schema validation failure
