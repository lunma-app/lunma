# architecture-integrity Specification

## Purpose

Make Lunma's one-way dependency DAG, the no-cycles invariant, the launcher-engine
service edge, and the token/primitive contract normative and mechanically enforced.
The architecture promises bugs land in one layer, not three at once; that guarantee
only holds while the dependency layers stay honest. This capability moves the layer
boundaries from docs-and-reviewer-memory into the local quality gate so they can
never silently regress.
## Requirements
### Requirement: One-way dependency DAG between layers

The source tree SHALL respect a single-direction dependency DAG between its layers, and the local quality gate SHALL fail when an import violates it. After the workspace restructure the extension lives under `apps/extension/`, so the layers and their only permitted outgoing edges are:

- `apps/extension/src/shared` (foundation) — depends on **nothing** else in `apps/extension/src/`.
- `apps/extension/src/ui` (primitives) — may import `apps/extension/src/shared` **only**. It consumes design tokens from the CSS-only `@lunma/tokens` package (a stylesheet import, not a TS module edge — see "Workspace package boundaries").
- `apps/extension/src/background` (service worker) — may import `apps/extension/src/shared` and the launcher-engine service `apps/extension/src/launcher/shared` **only** (never `apps/extension/src/ui` or another feature surface).
- `apps/extension/src/launcher/shared` (the launcher search **engine**, imported by the service worker) — is **shared-grade**: it may import `apps/extension/src/shared` and other `apps/extension/src/launcher/shared` internals **only**, and SHALL NOT import `apps/extension/src/ui` (a primitive) or another feature surface. This keeps the service worker's transitive graph free of DOM-coupled component code even though it imports this engine. (The gate enforces this for module **imports**; direct DOM access — `document`/`window` — is not an import and is not caught by `noRestrictedImports`, so it remains a review-time concern.)
- `apps/extension/src/launcher` (surface: overlay + new-tab) — may import `apps/extension/src/ui` and `apps/extension/src/shared`; within-`launcher` imports are internal. This `ui` allowance does **not** extend to the `launcher/shared` engine above.
- `apps/extension/src/sidebar`, `apps/extension/src/options` (feature surfaces) — may import `apps/extension/src/ui` and `apps/extension/src/shared`.
- `apps/extension/src/content` — may import `apps/extension/src/shared` **only**.

No layer SHALL import a feature surface's internals across a surface boundary. The DAG is **unchanged in shape** from the pre-restructure `src/…` layout — only the path prefix changes — and remains enforced by Biome `noRestrictedImports` per-layer overrides (re-pathed in `biome.json`), including a dedicated override for `apps/extension/src/launcher/shared/**`.

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

### Requirement: No import cycles

The module graph SHALL be acyclic. Biome's `noImportCycles` (run by `biome check`) SHALL fail on any direct or transitive runtime import cycle. The rule operates over the re-pathed `apps/extension/src/**` tree (unchanged in behavior from the pre-restructure layout).

#### Scenario: An import cycle fails the gate

- **WHEN** two modules import each other directly or transitively (e.g. a cycle between `apps/extension/src/shared/messages` and `apps/extension/src/launcher/shared/types`)
- **THEN** `biome check` SHALL report the cycle and fail

### Requirement: The launcher-result contract lives in the foundation

The launcher-result contract SHALL live in `apps/extension/src/shared/launcher-contract.ts`: the vocabulary (`ResultSource`, `LauncherResult`, `SuggestionsQuery`, `SuggestionsResult`) and the pure `sourceBadgeLabel` helper, importing only branded-id types from `apps/extension/src/shared/types`. The launcher **engine** (scoring, search-engine, web-actions, providers) SHALL remain in `apps/extension/src/launcher/shared`.

#### Scenario: The contract module stays dependency-light

- **WHEN** `apps/extension/src/shared/launcher-contract.ts` is built
- **THEN** it SHALL import only type declarations (no runtime modules) so the byte-budgeted `apps/extension/src/launcher/overlay.ts` consuming `sourceBadgeLabel` stays within its gzip budget
- **AND** `apps/extension/src/ui` SHALL import the contract from `apps/extension/src/shared`, never from `apps/extension/src/launcher`

### Requirement: Primitives reference design tokens, not raw literals

UI primitives in `apps/extension/src/ui` SHALL reference design tokens for `font-size` (a `--text-*` token) and `z-index` (a `--z-*` token) rather than hard-coding raw values, and the style check (`pnpm lint:styles`) SHALL fail when they do not. The token **definitions** live in the `@lunma/tokens` package (`packages/tokens`, CSS-only) and are imported at the extension's CSS entry; primitives reference them by custom-property name (resolved through the CSS cascade at runtime, not at import time), so moving the token file out of `apps/extension/src/ui` does not change the primitive→token contract. The remainder of the token/primitive contract — the press transform owing `--press-scale`, control heights owing `--control-h-*`, and feature components not reaching past primitives to consume tokens nor re-rolling primitives — remains governed by the component-library policy at proposal-review, because raw `scale()` and control-height values are not mechanically separable from legitimate animation and layout use.

#### Scenario: A raw literal in a primitive fails the gate

- **WHEN** a primitive's `<style>` sets `font-size: 13px` or `z-index: 2147483647` instead of the corresponding token
- **THEN** `pnpm lint:styles` SHALL report an error and `pnpm verify` SHALL exit non-zero

### Requirement: Boundary and style checks are part of the local quality gate

The import-boundary check SHALL run as part of `biome check` (the layer rules live in `biome.json`, with globs pointing at `apps/extension/src/**`, so they need no separate script). The CSS style check SHALL be invokable as the `lint:styles` `package.json` script (scoped to `apps/extension/src/ui`). The `.svelte` type check SHALL run as `svelte-check --tsconfig ./tsconfig.json` (invokable as the `check` `package.json` script), covering the type errors `tsc --noEmit` cannot see inside `.svelte` files (template bindings, component prop contracts). All of these SHALL be composed into a single `verify` script alongside `tsc`, `biome check`, and `vitest` — runnable for the extension package (directly or via `pnpm --filter`) — and listed in the project's Quality-gates documentation. The site (`apps/site`) carries its own checks; the workspace gate SHALL cover every package.

#### Scenario: The combined gate runs every check

- **WHEN** `pnpm verify` runs for the extension package
- **THEN** it SHALL run `tsc --noEmit`, `biome check` (which enforces the layer DAG + cycles), `svelte-check`, `lint:styles`, and `vitest run`
- **AND** SHALL exit non-zero if any of them fails

#### Scenario: A `.svelte`-only type error fails the gate

- **WHEN** a `.svelte` file contains a type error that `tsc --noEmit` cannot observe — for example a component prop bound to a value of the wrong type (an `string | number | boolean` value passed where a `string` is required), or a cast to a name that is not in scope
- **THEN** `svelte-check` (run by `pnpm verify`) SHALL report the error and `pnpm verify` SHALL exit non-zero

### Requirement: Workspace package boundaries

The repository SHALL be a pnpm workspace whose app packages do not import across app boundaries. `apps/site` (the marketing site) SHALL NOT import from `apps/extension`, and `apps/extension` SHALL NOT import from `apps/site`. The single shared package, `@lunma/tokens` (`packages/tokens`), SHALL contain CSS and font assets only — design-token custom properties, `@font-face` declarations + woff2 files, and pure-CSS recipe classes (aurora / glass / glow) — and **no** TypeScript or JavaScript modules, so it sits outside the import-layer DAG: a layer referencing `@lunma/tokens` via a stylesheet import is not a layer-boundary violation. Both apps SHALL depend on `@lunma/tokens` via `workspace:*`.

#### Scenario: The site cannot reach extension internals

- **WHEN** a file in `apps/site` attempts to import from `apps/extension` (e.g. an extension `ui` primitive or a `shared` module)
- **THEN** the import SHALL NOT resolve (there is no dependency edge between the two app packages), and the boundary is additionally guarded by Biome `noRestrictedImports`

#### Scenario: The shared tokens package ships no runtime code

- **WHEN** `packages/tokens` is consumed by either app
- **THEN** it SHALL expose only CSS (custom properties, `@font-face`, recipe classes) and font assets — no JS/TS entry — so neither app pulls runtime code or the extension's `shared` layer through it

