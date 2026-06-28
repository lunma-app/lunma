## Why

This change delivers a **living, browsable catalog of every `src/ui` primitive** — each rendered in its full variant matrix with meaningful mock data, against the real aurora/glass immersive backdrop, with Space-hue / colour-intensity / reduced-motion toggles. Today the only enumeration of a primitive's variants is its `*.test.harness.svelte` file, which is vitest-only and never rendered for a human to look at. There is no way to *see* the design system.

Under the binding user-value policy this is **plumbing (shape b)**: a developer-facing dev surface, not an end-user feature. Its named downstream consumers are the binding **visual-quality** and **component-library** policies that every surface change must satisfy — the catalog is the smallest tool that makes "primitives land at a high bar from first sight" actually verifiable. Concretely it serves the in-flight surface changes that touch `ui/` primitives (`consolidate-appearance-settings`, `lens-view-filters`, `wire-review-primitives-overview`) and every future one: a reviewer can open the catalog and confirm a primitive renders correctly across variants and intensity levels before a feature composes it.

It ships **nothing in the MV3 bundle** (separate Vite config, own root, never referenced by `manifest.json`) and runs on the exact pinned stack.

Histoire was the requested tool but is rejected: `histoire@1.0.0-beta.1` (beta, last touched Jan 2026) peers on `vite ^7.3.0` (no Vite 8) and `@histoire/plugin-svelte` peers on `svelte ^3 || ^4` (no Svelte 5 — runes unsupported). Storybook supports the stack but is heavy (large dep tree, manager/preview build). A **homegrown** catalog (zero heavy deps) is the chosen light alternative; the rationale is recorded in `docs/tech-stack.md`.

## What Changes

- **New dev-only catalog surface** at `apps/extension/catalog/`: a Svelte 5 + Vite 8 app that auto-discovers `*.stories.svelte` via `import.meta.glob`, renders each primitive's variant matrix with shared mock data inside the immersive shell (aurora/glass + Space-hue / colour-intensity / reduced-motion toggles).
- **Stories for all 40 `src/ui` primitives** under `catalog/stories/` (one `<Name>.stories.svelte` per primitive). The composition story — realistic multi-row scenes — is exercised inside the stories of the composite primitives that already live in `src/ui` (`ResultList`, `LensRow`, `ReviewerRail`, `ResultRow`), as extra variant cells, not as separate files.
- **Live controls + API table + source view per component (controls-v2).** Each story declares a small hand-authored `controls` schema (`catalog/lib/controls.ts`) that the catalog-owned `catalog/lib/Story.svelte` renders as: a **live preview** with editable inputs (composing `Chip`/`Select`/`TextInput`), an **API table** (prop · type · default · description), the curated **examples** matrix, and a collapsible **source view** (the story's own `?raw` source). Svelte 5 has no runtime prop metadata, so the schema is hand-authored and covers the controllable scalar/enum/boolean/text props.
- **Sibling build config** `apps/extension/vite.catalog.config.ts` (plain `svelte()`, `root: catalog`, `@`→`src` alias, replicates the existing font-copy) + `apps/extension/tsconfig.catalog.json` (adds `@/*` paths, scopes type-checking to the catalog). New scripts: `catalog`, `catalog:build`, and a parallel `verify:catalog` (typecheck/biome/svelte-check/stylelint over the catalog), folded into `verify`.
- **Quality-gate wiring** so the catalog is held to a bar without loosening the `src/` gates: a Biome `files.includes` entry + a `noRestrictedImports` override placing the catalog as a `ui`+`shared`-composing surface (banned from `background`/`content`/other surfaces/`apps/site`); a stylelint parse-only override for `catalog/**/*.svelte`.
- **Never-miss-a-story enforcement (3 layers):** (1) a vitest coverage guard `src/ui/stories-coverage.test.ts` that fails `verify` if any primitive lacks a story; (2) a project `.claude` `PostToolUse` hook (`.claude/settings.json` + `.claude/hooks/check-catalog-coverage.mjs`) that nudges when a `src/ui/*.svelte` primitive is edited/added without its story; (3) a binding `CLAUDE.md` component-library policy line.
- **Docs/spec lockstep:** `docs/tech-stack.md`, `docs/architecture.md`, `CLAUDE.md` updated; the `architecture-integrity` spec gains the catalog DAG node + the `verify:catalog` gate step.

No change to any `src/ui` primitive's behaviour, no MV3 manifest change. One **dev-only** dependency is added — `shiki` (`devDependencies`), used solely to syntax-highlight the catalog's source-view panel; it ships nothing in the MV3 bundle (the catalog has its own root and is never a build input). The catalog toolbar also exposes a **light/dark theme toggle** (reusing the shared `applyThemeToDocument` helper) alongside Space-hue / colour-intensity / reduced-motion, and the dev server runs on a fixed port (`6006`) distinct from the extension dev server.

## Capabilities

### New Capabilities
- `component-catalog`: the dev-only catalog surface — story auto-discovery via `import.meta.glob`, the variant-matrix + mock-data rendering contract, the immersive shell (Space-hue / colour-intensity / reduced-motion), the ships-nothing-in-bundle invariant, the parallel `verify:catalog` gate composition, and the three-layer coverage enforcement (vitest guard + `.claude` hook + policy).

### Modified Capabilities
- `architecture-integrity`: add the catalog as a new node in the enforced import DAG (a dev surface allowed to import `ui` + `shared`, banned from `background`/`content`/other surfaces/`apps/site`, via a Biome override); and extend the single-`verify`-script requirement to include the `verify:catalog` step.

## Impact

- **New files:** `apps/extension/vite.catalog.config.ts`, `apps/extension/tsconfig.catalog.json`, `apps/extension/catalog/{index.html,main.ts,Catalog.svelte,catalog.css}`, `apps/extension/catalog/lib/{story.ts,registry.ts,Variant.svelte,mock.ts,controls.ts,Story.svelte}`, `apps/extension/catalog/stories/ui/*.stories.svelte` (40 + composites), `apps/extension/src/ui/stories-coverage.test.ts`, `.claude/hooks/check-catalog-coverage.mjs`.
- **New public types:** `StoryMeta`, `StoryEntry` (catalog `lib/registry`+`lib/story`), `ControlType`, `ControlDef`, `Controls`, `Args` (catalog `lib/controls`); new exported helper `defineStory()` + `defaultArgs()`.
- **Modified files:** `apps/extension/package.json` (scripts: `catalog`, `catalog:build`, `typecheck:catalog`, `lint:catalog`, `check:catalog`, `lint:styles:catalog`, `verify:catalog`; `verify` gains `verify:catalog`), `biome.json` (includes + catalog override), `apps/extension/stylelint.config.js` (catalog override), `.gitignore` (`apps/extension/catalog/public/fonts/`), `.claude/settings.json` (PostToolUse hook).
- **Composes (does not re-roll):** all 40 `src/ui` primitives (which include the composites `ResultList`, `LensRow`, `ReviewerRail`, `ResultRow`); the catalog chrome composes `RowButton`, `SegmentedControl`, `IconButton`, `CardHeading`. **New `src/ui` primitives added:** none — the catalog's own `Variant.svelte` is a catalog-internal helper, not a cross-surface primitive.
- **Docs updated:** `docs/tech-stack.md`, `docs/architecture.md`, `CLAUDE.md`. **Untouched:** all other `docs/` and specs except the `architecture-integrity` delta.
- **Dependencies:** one dev-only addition — `shiki` (`devDependencies`, for the source-view highlighting). `vite`, `svelte`, `@sveltejs/vite-plugin-svelte`, `stylelint`, `@biomejs/biome` were already present.
- **Bundle:** MV3 build unchanged (no manifest edit, no new rollup input).
