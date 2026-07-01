## Why

The component catalog exists so a reviewer can trust that what they see for a primitive matches its real contract (`component-catalog`, archived 2026-06-28). That trust is currently broken: each story's `controls`/API table is 100% hand-authored (`apps/extension/catalog/lib/controls.ts`), decoupled from the primitive's actual `Props` interface — Svelte 5 exposes no runtime prop metadata, so nothing keeps the two in sync. Concretely, `Button.svelte`'s `type`, `title`, and `testid` props are entirely absent from `Button.stories.svelte`'s controls and API table today. The existing guards (`stories-coverage.test.ts`, the `check-catalog-coverage.mjs` hook) only check that a story *file* exists, never that its `controls` still cover the component's real props — so a primitive's contract can change and the catalog silently keeps showing the old shape.

Under the binding user-value policy this is **plumbing (shape b)**: same as the original catalog change, its consumer is the binding **visual-quality** and **component-library** policies — a reviewer can only verify "this primitive is correct and complete" if the catalog can't drift from source. It is the smallest fix that makes the catalog's controls/API table trustworthy again, and it directly serves every future change that edits a `src/ui/*.svelte` primitive's props (the exact case that caused today's drift).

## What Changes

- **Controls are derived, not hand-authored, for mechanical props.** A new pure function (`apps/extension/catalog/lib/derive-controls.ts`) parses each `apps/extension/src/ui/<Name>.svelte`'s `Props` interface (via the TypeScript compiler API over the `<script lang="ts">` block extracted with `svelte/compiler`'s `parse` — both already devDependencies, no new dependency) into a base `Controls` object: `boolean` → boolean control, `number` → number control, `string` / string-literal-union → text/select control. `description` is derived from the prop's JSDoc comment; `typeLabel` from the TS type text.
- **Non-mechanical props require an explicit, reasoned exclusion.** Props whose type isn't mechanically derivable (`Snippet` children, callback/function props like `onclick`/`onchange`, arrays, objects, imported types) cannot get an auto-derived control. A story must list them in a new `excludeControls: Record<string, string>` map on `meta` (prop name → one-line reason). **BREAKING (catalog-internal only):** a new vitest guard fails `pnpm verify` if any `Props` member is neither derived nor explicitly excluded — this is the mechanism that would have caught the `Button` drift.
- **Stories keep curation power via overrides, not full redefinition.** A new `controlOverrides: Record<string, Partial<ControlDef>>` map on `meta` merges over the derived base per-prop (e.g. narrow a `select`'s options, hand-write a better `description`). The old fully-hand-authored `controls` field is removed from `StoryMeta`.
- **Migrate all ~35 existing `*.stories.svelte`** under `apps/extension/catalog/stories/ui/` from `controls` to `controlOverrides`/`excludeControls`, since the new guard fails on any story still using the old shape.
- **Codegen wired into the catalog's existing build lifecycle.** `derive-controls.ts`'s output feeds a generated, gitignored module (mirrors the existing font-copy pattern already in `apps/extension/vite.catalog.config.ts`) that `catalog/lib/registry.ts` imports and merges with each story's `controlOverrides`/`excludeControls` to produce the final `Controls` passed to `Story.svelte`. Regenerated on every `catalog` dev-server boot and `catalog:build`, so it can't go stale between runs.

## Capabilities

### New Capabilities
(none)

### Modified Capabilities
- `component-catalog`: the "Each component exposes live controls, an API table, and its source" requirement changes from hand-authored `controls` to derived-base + explicit-override/exclude, with a new drift-guard requirement ensuring every `Props` member is accounted for.

## Impact

- **New files:** `apps/extension/catalog/lib/derive-controls.ts` (the parser/derivation function), `apps/extension/catalog/lib/derive-controls.test.ts` (unit tests + the drift guard), a gitignored generated module (path TBD in design, analogous to `catalog/public/fonts/`).
- **New public types:** `DerivedControls`/equivalent return type of `derive-controls.ts`; `excludeControls` and `controlOverrides` fields added to `StoryMeta` (`apps/extension/catalog/lib/story.ts`).
- **Removed:** `StoryMeta.controls` (replaced by the derived base + `controlOverrides`).
- **Modified files:** `apps/extension/catalog/lib/story.ts`, `apps/extension/catalog/lib/registry.ts` (merge derived + overrides), `apps/extension/catalog/lib/controls.ts` (keep `ControlType`/`ControlDef`/`Args`/`defaultArgs`, drop the now-obsolete hand-authoring assumption in its doc comment), `apps/extension/vite.catalog.config.ts` (codegen step), `apps/extension/vite.config.ts` (widen vitest `test.include` to `catalog/**/*.test.ts` — see design.md's agreed deviation — otherwise the guard never runs under `pnpm verify`), all ~35 `apps/extension/catalog/stories/ui/*.stories.svelte`.
- **Docs updated:** `openspec/specs/component-catalog/spec.md` (via this change's delta on archive). No `docs/tech-stack.md` or `docs/architecture.md` change — no new dependency, no DAG change, no new surface.
- **Dependencies:** none new. Uses `typescript` and `svelte` (both already `devDependencies` of `@lunma/extension`).
- **Bundle:** no MV3 impact — catalog remains dev-only, unchanged build boundary.
- **Composes:** no `src/ui` primitive changes; this only touches the catalog's own `lib/` and `stories/`.
