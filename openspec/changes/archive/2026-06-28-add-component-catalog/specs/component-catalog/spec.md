## ADDED Requirements

### Requirement: A dev-only catalog surface renders every primitive's variants

The repository SHALL provide a dev-only component catalog at `apps/extension/catalog/`, built and served by a sibling Vite config `apps/extension/vite.catalog.config.ts` (plain `@sveltejs/vite-plugin-svelte`, `root` set to `catalog/`, a `@`→`apps/extension/src` resolve alias, and no `@crxjs/vite-plugin`). The catalog SHALL render each cataloged component's variant matrix using shared mock data. It SHALL be invokable as the `catalog` (dev server) and `catalog:build` (static build) `package.json` scripts on the pinned stack (Svelte 5 + Vite 8) with no new runtime dependency.

#### Scenario: The catalog dev server boots and renders a primitive

- **WHEN** `pnpm --filter @lunma/extension catalog` runs
- **THEN** a Vite dev server SHALL serve the catalog, and selecting a primitive (e.g. `Button`) SHALL render its variant matrix (e.g. `variant × size × disabled`) with the brand fonts loaded from `@lunma/tokens`

#### Scenario: The catalog builds as a standalone static bundle

- **WHEN** `pnpm --filter @lunma/extension catalog:build` runs
- **THEN** Vite SHALL produce a static catalog build with no error, using only already-present dev dependencies

### Requirement: Stories are auto-discovered, not centrally registered

The catalog SHALL discover stories via `import.meta.glob` over `apps/extension/catalog/stories/**/*.stories.svelte`. Each story file SHALL export, from a `<script module>` block, a `meta` object produced by the `defineStory` helper (`apps/extension/catalog/lib/story.ts`, typed by `StoryMeta`) carrying at least a `title` and a nav `group`; the catalog's `registry.ts` SHALL build the navigation from the eagerly-globbed `meta` and load each story component lazily. Adding a story SHALL require no edit to a central registry.

#### Scenario: A new story appears without registry edits

- **WHEN** a new `apps/extension/catalog/stories/ui/<Name>.stories.svelte` exporting a `meta` is added
- **THEN** it SHALL appear in the catalog navigation under its `group` with no change to `registry.ts` or any central list

### Requirement: Primitives render inside the immersive shell

The catalog shell (`apps/extension/catalog/Catalog.svelte`) SHALL render the selected story inside the Lunma immersive context — the aurora backdrop and frosted-glass recipes from `@lunma/tokens`, scoped to a Space — and SHALL expose toolbar controls for the active Space hue, the colour-intensity tier (`subtle | standard | vivid`), a reduced-motion toggle, and a light/dark theme toggle (reflected onto `<html>` via the shared `applyThemeToDocument` helper so `@lunma/tokens`' `[data-theme="light"]` set applies). The catalog chrome SHALL compose existing `apps/extension/src/ui` primitives rather than re-rolling controls. Because `Aurora.svelte` derives reduced-motion from `matchMedia` (not a prop), the reduced-motion toggle SHALL freeze the backdrop via a `data-force-motion` attribute handled in the catalog stylesheet.

#### Scenario: Intensity and hue toggles drive the immersive model

- **WHEN** the catalog toolbar changes the colour-intensity tier or the Space hue
- **THEN** the rendered primitives SHALL pick up the corresponding `@lunma/tokens` custom properties (accent/glow/aurora), so a primitive can be inspected from `subtle` to `vivid` in one view

#### Scenario: Reduced-motion toggle freezes animation

- **WHEN** the reduced-motion toggle is enabled
- **THEN** the aurora backdrop and primitive transitions SHALL stop animating via the catalog's `data-force-motion` handling, without modifying the `Aurora` primitive

### Requirement: Each component exposes live controls, an API table, and its source

The catalog SHALL render, per story, a component-owned `Story` layout (`apps/extension/catalog/lib/Story.svelte`) driven by an optional `controls` schema on the story's `meta` (`apps/extension/catalog/lib/controls.ts`: `prop → { type: 'boolean' | 'select' | 'text' | 'number'; default; options?; typeLabel?; description? }`). When a story declares `controls`, the catalog SHALL render: a **live preview** of the component bound to editable inputs for those props (the inputs composing existing `apps/extension/src/ui` primitives — `Chip` for booleans, `Select` for enums, `TextInput` for text/number — not re-rolled controls); an **API table** listing each control's prop, type, default, and description; and the curated **examples** matrix. Independently of `controls`, every story SHALL render a **source view** showing the story file's own raw source (loaded via an `import.meta.glob(..., { query: '?raw' })` in `registry.ts` and passed to the story as a `source` prop). Because Svelte 5 exposes no runtime prop metadata, the `controls` schema is hand-authored and covers the controllable scalar/enum/boolean/text props, not necessarily every prop.

#### Scenario: Editing a control updates the live preview

- **WHEN** a reviewer changes a control input (e.g. toggles `disabled` or selects a `variant`) for a story that declares `controls`
- **THEN** the live preview SHALL re-render the component with the new prop value, and the API table SHALL list that prop with its type and default

#### Scenario: The rendered block's source is viewable

- **WHEN** a reviewer opens the source panel of any story
- **THEN** the catalog SHALL display that story file's raw `.stories.svelte` source (via the `?raw` glob), without the story duplicating its own code

### Requirement: The catalog ships nothing in the extension bundle

The catalog SHALL NOT be part of the MV3 build. `public/manifest.json` SHALL NOT reference any catalog file, and `apps/extension/vite.config.ts` `rollupOptions.input` SHALL NOT include a catalog entry. The MV3 build output SHALL be unaffected by the catalog's presence.

#### Scenario: The extension build is unchanged by the catalog

- **WHEN** `pnpm --filter @lunma/extension build` runs with the catalog present
- **THEN** the produced `dist/` SHALL contain no catalog code and SHALL match what the build produced before the catalog was added (no new chunk attributable to `catalog/`)

### Requirement: Every primitive is guaranteed a story

A vitest test `apps/extension/src/ui/stories-coverage.test.ts` SHALL fail when any `apps/extension/src/ui/*.svelte` primitive lacks a corresponding `apps/extension/catalog/stories/ui/<Name>.stories.svelte`. Primitive enumeration SHALL exclude any `.svelte` file whose name contains `.test.` (the `*.test.harness.svelte` fixtures today, and any future `*.test.svelte`); non-`.svelte` files are not matched by the glob. The test SHALL enumerate stories by glob key only (without executing the story modules). This guard SHALL run as part of `vitest run` (and therefore `pnpm verify`).

#### Scenario: A primitive without a story fails the gate

- **WHEN** an `apps/extension/src/ui/<Name>.svelte` primitive exists with no `apps/extension/catalog/stories/ui/<Name>.stories.svelte`
- **THEN** `apps/extension/src/ui/stories-coverage.test.ts` SHALL fail and `pnpm verify` SHALL exit non-zero

### Requirement: A repo hook nudges story updates in-session

The repository SHALL configure a project `.claude` `PostToolUse` hook (matcher `Edit|Write|MultiEdit`, command `.claude/hooks/check-catalog-coverage.mjs`) that, on an edit or add to an `apps/extension/src/ui/*.svelte` primitive (excluding `*.test.*`) for which no sibling `*.stories.svelte` exists, emits a message prompting the author to add or update the catalog story. This hook is an advisory in-session aid; the vitest coverage guard remains the authoritative gate.

#### Scenario: Editing a story-less primitive surfaces a reminder

- **WHEN** an agent edits or creates `apps/extension/src/ui/<Name>.svelte` while no `apps/extension/catalog/stories/ui/<Name>.stories.svelte` exists
- **THEN** the `PostToolUse` hook SHALL surface a message naming `<Name>` and instructing the author to add or update its catalog story
