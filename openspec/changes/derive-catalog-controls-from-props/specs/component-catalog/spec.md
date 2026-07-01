## MODIFIED Requirements

### Requirement: Each component exposes live controls, an API table, and its source

The catalog SHALL render, per story, a component-owned `Story` layout (`apps/extension/catalog/lib/Story.svelte`) whose control panel is built from two sources merged per prop: a **derived base**, produced by `apps/extension/catalog/lib/derive-controls.ts` parsing the corresponding `apps/extension/src/ui/<Name>.svelte`'s `Props` interface (`prop → { type: 'boolean' | 'select' | 'text' | 'number'; default; options?; typeLabel?; description? }`, `typeLabel` from the prop's type text and `description` from its JSDoc comment), and a story-authored `meta.controlOverrides: Record<string, Partial<ControlDef>>` (each entry replaces only the fields it names, not the whole `ControlDef` — `Partial<Controls>` would require every override to supply a complete `ControlDef`) that replaces individual fields of the derived base per prop. When the merged result is non-empty, the catalog SHALL render: a **live preview** of the component bound to editable inputs for those props (the inputs composing existing `apps/extension/src/ui` primitives — `Chip` for booleans, `Select` for enums, `TextInput` for text/number — not re-rolled controls); an **API table** listing each control's prop, type, default, and description; and the curated **examples** matrix. Independently of controls, every story SHALL render a **source view** showing the story file's own raw source (loaded via an `import.meta.glob(..., { query: '?raw' })` in `registry.ts` and passed to the story as a `source` prop). A prop is mechanically derivable only when its type is `boolean`, `number`, `string`, or a union of string-literal types (optionally including `undefined` for an optional prop); a story SHALL opt any prop — derivable or not — out of the live-control panel via `meta.excludeControls: Record<string, string>` (prop name → one-line reason), which the merge step SHALL remove from the derived base before controls are rendered.

#### Scenario: Editing a control updates the live preview

- **WHEN** a reviewer changes a control input (e.g. toggles `disabled` or selects a `variant`) for a story whose derived-and-overridden controls are non-empty
- **THEN** the live preview SHALL re-render the component with the new prop value, and the API table SHALL list that prop with its type and default

#### Scenario: A component's prop is picked up without story edits

- **WHEN** a `boolean`, `number`, `string`, or string-literal-union prop is added to a `src/ui/<Name>.svelte`'s `Props` interface, and its story does not list it in `excludeControls`
- **THEN** the catalog SHALL render a control for it in the live preview and list it in the API table, with no edit to the story's `meta.controlOverrides`

#### Scenario: A non-mechanical prop is excluded with a reason

- **WHEN** a story lists a prop (e.g. a `Snippet` or callback prop) in `meta.excludeControls` with a reason string
- **THEN** the catalog SHALL NOT render a control for that prop, and SHALL NOT list it in the API table

#### Scenario: The rendered block's source is viewable

- **WHEN** a reviewer opens the source panel of any story
- **THEN** the catalog SHALL display that story file's raw `.stories.svelte` source (via the `?raw` glob), without the story duplicating its own code

## ADDED Requirements

### Requirement: A guard fails when a component's props and its story's controls disagree

A vitest test `apps/extension/catalog/lib/derive-controls.test.ts` SHALL fail when, for any `apps/extension/src/ui/<Name>.svelte` primitive, a member of its `Props` interface is neither derivable by `derive-controls.ts` nor listed in the corresponding story's `meta.excludeControls`. The same test SHALL fail when a story's `meta.excludeControls` or `meta.controlOverrides` names a prop that is not a member of the primitive's current `Props` interface (a stale entry left behind by a prop rename or removal). This test SHALL run as part of `vitest run` (and therefore `pnpm verify`), independently of any generated/codegen output — it SHALL call `derive-controls.ts`'s derivation function directly against each primitive's current source.

#### Scenario: An unaccounted-for prop fails the gate

- **WHEN** a `src/ui/<Name>.svelte` primitive's `Props` interface gains a member that `derive-controls.ts` cannot classify, and the corresponding story does not list it in `meta.excludeControls`
- **THEN** `apps/extension/catalog/lib/derive-controls.test.ts` SHALL fail and `pnpm verify` SHALL exit non-zero

#### Scenario: A stale exclusion or override fails the gate

- **WHEN** a story's `meta.excludeControls` or `meta.controlOverrides` references a prop name that no longer exists on the primitive's `Props` interface
- **THEN** `apps/extension/catalog/lib/derive-controls.test.ts` SHALL fail and `pnpm verify` SHALL exit non-zero
