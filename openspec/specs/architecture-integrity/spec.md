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

The source tree SHALL respect a single-direction dependency DAG between its layers,
and the local quality gate SHALL fail when an import violates it. The layers and
their only permitted outgoing edges are:

- `src/shared` (foundation) — depends on **nothing** in `src/` outside itself.
- `src/ui` (primitives + tokens) — may import `src/shared` **only**.
- `src/background` (service worker) — may import `src/shared` and the launcher-engine
  service `src/launcher/shared` **only** (never `src/ui` or another feature surface).
- `src/sidebar`, `src/options` (feature surfaces) — may import `src/ui` and `src/shared`.
- `src/launcher` (surface: overlay + new-tab + its `shared` engine) — may import
  `src/ui` and `src/shared`; within-`launcher` imports are internal.
- `src/content` — may import `src/shared` **only**.

No layer SHALL import a feature surface's internals across a surface boundary.

#### Scenario: A forbidden cross-layer import fails the gate

- **WHEN** a file in `src/ui`, `src/shared`, or `src/background` imports from a
  feature surface (e.g. `src/ui` importing `src/launcher`, or `src/shared` importing
  `src/background`)
- **THEN** the boundary check (Biome `noRestrictedImports`, run by `biome check`)
  SHALL report an error and the combined gate (`pnpm verify`) SHALL exit non-zero

#### Scenario: A cross-surface import fails the gate

- **WHEN** a feature surface imports another surface's internals (e.g.
  `src/launcher/newtab` importing `src/sidebar`)
- **THEN** the boundary check SHALL report an error
- **AND** the documented fix is to relocate the shared helper into `src/shared`

### Requirement: No import cycles

The module graph SHALL be acyclic. Biome's `noImportCycles` (run by `biome check`)
SHALL fail on any direct or transitive runtime import cycle.

#### Scenario: An import cycle fails the gate

- **WHEN** two modules import each other directly or transitively (e.g. the former
  `src/shared/messages` ↔ `src/launcher/shared/types` cycle this change removed)
- **THEN** `biome check` SHALL report the cycle and fail

### Requirement: The launcher-result contract lives in the foundation

The launcher-result contract SHALL live in `src/shared/launcher-contract.ts`: the
vocabulary (`ResultSource`, `LauncherResult`, `SuggestionsQuery`, `SuggestionsResult`)
and the pure `sourceBadgeLabel` helper, importing only branded-id types from
`src/shared/types`. The launcher **engine** (scoring, search-engine, web-actions,
providers) SHALL remain in `src/launcher/shared`.

#### Scenario: The contract module stays dependency-light

- **WHEN** `src/shared/launcher-contract.ts` is built
- **THEN** it SHALL import only type declarations (no runtime modules) so the
  byte-budgeted `src/launcher/overlay.ts` consuming `sourceBadgeLabel` stays within
  its gzip budget
- **AND** `src/ui` SHALL import the contract from `src/shared`, never from `src/launcher`

### Requirement: Primitives reference design tokens, not raw literals

UI primitives in `src/ui` SHALL reference design tokens for `font-size` (a `--text-*`
token) and `z-index` (a `--z-*` token) rather than hard-coding raw values, and the
style check (`pnpm lint:styles`) SHALL fail when they do not. The remainder of the
token/primitive contract — the press transform owing `--press-scale`, control heights
owing `--control-h-*`, and feature components not reaching past primitives to consume
tokens nor re-rolling primitives — remains governed by the component-library policy at
proposal-review, because raw `scale()` and control-height values are not mechanically
separable from legitimate animation and layout use.

#### Scenario: A raw literal in a primitive fails the gate

- **WHEN** a primitive's `<style>` sets `font-size: 13px` or `z-index: 2147483647`
  instead of the corresponding token
- **THEN** `pnpm lint:styles` SHALL report an error and `pnpm verify` SHALL exit non-zero

### Requirement: Boundary and style checks are part of the local quality gate

The import-boundary check SHALL run as part of `biome check` (the layer rules live in
`biome.json`, so they need no separate script). The CSS style check SHALL be invokable
as the `lint:styles` `package.json` script. Both SHALL be composed into a single
`verify` script alongside `tsc`, `biome check`, and `vitest`, and listed in the
project's Quality-gates documentation.

#### Scenario: The combined gate runs every check

- **WHEN** `pnpm verify` runs
- **THEN** it SHALL run `tsc --noEmit`, `biome check` (which enforces the layer DAG +
  cycles), `lint:styles`, and `vitest run`
- **AND** SHALL exit non-zero if any of them fails
