## MODIFIED Requirements

### Requirement: One-way dependency DAG between layers

The source tree SHALL respect a single-direction dependency DAG between its layers, and the local quality gate SHALL fail when an import violates it. After the workspace restructure the extension lives under `apps/extension/`, so the layers and their only permitted outgoing edges are:

- `apps/extension/src/shared` (foundation) — depends on **nothing** else in `apps/extension/src/`.
- `apps/extension/src/ui` (primitives) — may import `apps/extension/src/shared` **only**. It consumes design tokens from the CSS-only `@lunma/tokens` package (a stylesheet import, not a TS module edge — see "Workspace package boundaries").
- `apps/extension/src/background` (service worker) — may import `apps/extension/src/shared` and the launcher-engine service `apps/extension/src/launcher/shared` **only** (never `apps/extension/src/ui` or another feature surface).
- `apps/extension/src/launcher/shared` (the launcher search **engine**, imported by the service worker) — is **shared-grade**: it may import `apps/extension/src/shared` and other `apps/extension/src/launcher/shared` internals **only**, and SHALL NOT import `apps/extension/src/ui` (a primitive) or another feature surface. This keeps the service worker's transitive graph free of DOM-coupled component code even though it imports this engine. (The gate enforces this for module **imports**; direct DOM access — `document`/`window` — is not an import and is not caught by `noRestrictedImports`, so it remains a review-time concern.)
- `apps/extension/src/launcher` (surface: overlay + new-tab) — may import `apps/extension/src/ui` and `apps/extension/src/shared`; within-`launcher` imports are internal. This `ui` allowance does **not** extend to the `launcher/shared` engine above.
- `apps/extension/src/sidebar`, `apps/extension/src/options` (feature surfaces) — may import `apps/extension/src/ui` and `apps/extension/src/shared`.
- `apps/extension/src/content` — may import `apps/extension/src/shared` **only**.
- `apps/extension/catalog` (the dev-only component catalog surface; outside `src/` but governed by the gate) — is a **`ui`-composing dev surface**: it may import `apps/extension/src/ui` and `apps/extension/src/shared` (via the `@`→`src` alias) **only**, and SHALL NOT import `apps/extension/src/background`, `apps/extension/src/content`, another feature surface (`sidebar`/`launcher`/`options`), or `apps/site`. It ships nothing in the MV3 bundle (see the `component-catalog` capability) but is held to the same boundary discipline as the in-`src` surfaces.

No layer SHALL import a feature surface's internals across a surface boundary. The DAG is **unchanged in shape** from the pre-restructure `src/…` layout — only the path prefix changes, plus the added dev-only `apps/extension/catalog` node — and remains enforced by Biome `noRestrictedImports` per-layer overrides (re-pathed in `biome.json`), including a dedicated override for `apps/extension/src/launcher/shared/**` and one for `apps/extension/catalog/**`.

#### Scenario: A forbidden cross-layer import fails the gate

- **WHEN** a file in `apps/extension/src/ui`, `apps/extension/src/shared`, or `apps/extension/src/background` imports from a feature surface (e.g. `apps/extension/src/ui` importing `apps/extension/src/launcher`, or `apps/extension/src/shared` importing `apps/extension/src/background`)
- **THEN** the boundary check (Biome `noRestrictedImports`, run by `biome check`) SHALL report an error and the combined gate (`pnpm verify`) SHALL exit non-zero

#### Scenario: A cross-surface import fails the gate

- **WHEN** a feature surface imports another surface's internals (e.g. `apps/extension/src/launcher/newtab` importing `apps/extension/src/sidebar`)
- **THEN** the boundary check SHALL report an error
- **AND** the documented fix is to relocate the shared helper into `apps/extension/src/shared`

#### Scenario: The launcher engine cannot import UI/another surface into the service worker

- **WHEN** a file under `apps/extension/src/launcher/shared/**` imports `apps/extension/src/ui` (a primitive) or another feature surface (`sidebar`/`options`/`background`/`content`)
- **THEN** the boundary check SHALL report an error and `pnpm verify` SHALL exit non-zero
- **AND** the documented fix is to relocate the needed helper into `apps/extension/src/shared` (shared-grade), keeping the service worker's transitive graph free of DOM-coupled component code

#### Scenario: The engine's cross-surface bans survive the added override

- **WHEN** the dedicated `apps/extension/src/launcher/shared/**` override is added to `biome.json`
- **THEN** a `launcher/shared` import of another surface (e.g. `apps/extension/src/sidebar`) SHALL still fail the gate
- **AND** the new override SHALL re-state those cross-surface bans (Biome per-rule override options replace rather than union for an overlapping glob), so adding the `ui` ban does not drop the inherited surface bans

#### Scenario: The catalog surface stays within its allowed edges

- **WHEN** a file under `apps/extension/catalog/**` imports `apps/extension/src/background`, `apps/extension/src/content`, another feature surface (`sidebar`/`launcher`/`options`), or `apps/site`
- **THEN** the boundary check (the dedicated `apps/extension/catalog/**` Biome override) SHALL report an error and `pnpm verify` SHALL exit non-zero
- **AND** a catalog import of `apps/extension/src/ui` or `apps/extension/src/shared` SHALL be permitted (the catalog is a `ui`-composing dev surface)

### Requirement: Boundary and style checks are part of the local quality gate

The import-boundary check SHALL run as part of `biome check` (the layer rules live in `biome.json`, with globs pointing at `apps/extension/src/**` and `apps/extension/catalog/**`, so they need no separate script). The CSS style check SHALL be invokable as the `lint:styles` `package.json` script (running over `apps/extension/src/**/*.{svelte,css}`, with the strict token rules scoped to `apps/extension/src/ui` primitives via Stylelint config overrides). The `.svelte` type check SHALL run as `svelte-check --tsconfig ./tsconfig.json` (invokable as the `check` `package.json` script), covering the type errors `tsc --noEmit` cannot see inside `.svelte` files (template bindings, component prop contracts). All of these SHALL be composed into a single `verify` script alongside `tsc`, `biome check`, and `vitest` — runnable for the extension package (directly or via `pnpm --filter`) — and listed in the project's Quality-gates documentation. The dev-only catalog surface SHALL additionally be checked by a `verify:catalog` script (typecheck against `tsconfig.catalog.json`, `biome check` of `catalog`, `svelte-check` of the catalog, and `stylelint` of `catalog/**/*.svelte`), and `verify` SHALL invoke `verify:catalog` so the catalog cannot regress untyped or unlinted. The site (`apps/site`) carries its own checks; the workspace gate SHALL cover every package.

#### Scenario: The combined gate runs every check

- **WHEN** `pnpm verify` runs for the extension package
- **THEN** it SHALL run `tsc --noEmit`, `biome check` (which enforces the layer DAG + cycles), `svelte-check`, `lint:styles`, `verify:catalog`, and `vitest run`
- **AND** SHALL exit non-zero if any of them fails

#### Scenario: A catalog type or style error fails the gate

- **WHEN** a file under `apps/extension/catalog/**` has a type error (against `tsconfig.catalog.json`), a boundary violation, or a stylelint error in its `<style>`
- **THEN** `verify:catalog` (run by `pnpm verify`) SHALL report it and `pnpm verify` SHALL exit non-zero

#### Scenario: A `.svelte`-only type error fails the gate

- **WHEN** a `.svelte` file contains a type error that `tsc --noEmit` cannot observe — for example a component prop bound to a value of the wrong type (an `string | number | boolean` value passed where a `string` is required), or a cast to a name that is not in scope
- **THEN** `svelte-check` (run by `pnpm verify`) SHALL report the error and `pnpm verify` SHALL exit non-zero
