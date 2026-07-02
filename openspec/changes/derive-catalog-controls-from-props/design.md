## Context

`apps/extension/catalog/lib/controls.ts` documents its own limitation: "Svelte 5 exposes no runtime prop metadata, so this schema is hand-authored per story." In practice this means a story's `meta.controls` is written once and never re-checked against the component it documents. Concrete drift exists today: `Button.svelte`'s `type`, `title`, `testid` props are absent from `Button.stories.svelte`. The two existing coverage mechanisms (`src/ui/stories-coverage.test.ts`, `.claude/hooks/check-catalog-coverage.mjs`) only assert a `*.stories.svelte` file exists per primitive — neither inspects `controls` content.

Every `src/ui/*.svelte` primitive (confirmed by grep across all non-test `.svelte` files in `src/ui`) declares its props as `interface Props { ... }` immediately followed by `const { ...destructured, x = default }: Props = $props();` in its instance (`<script lang="ts">`) block. This consistent shape is what makes syntactic (non-type-checked) derivation tractable without a new dependency: `svelte/compiler` (already a `svelte` sub-export) extracts the instance-script source range, and the TypeScript compiler API (already a devDependency, used by `tsc`/`svelte-check`) parses that range's `InterfaceDeclaration` and the `$props()` destructuring statement.

## Goals / Non-Goals

**Goals:**
- Every prop in a primitive's `Props` interface is mechanically accounted for by the catalog: either rendered as a derived control, or explicitly excluded with a reason — never silently missing.
- Keep the story-authoring surface small: a story states overrides/exclusions, not full redefinitions.
- No new runtime or dev dependency; no change to the catalog's dev-only bundle boundary.
- Guard runs as part of `pnpm verify` (vitest), matching the existing coverage-guard pattern.

**Non-Goals:**
- Full type-checking / cross-file type resolution (no `ts.createProgram`). Props typed via an imported type alias that *would* resolve to a derivable shape are treated as unclassified (safe fallback: author must exclude), not silently wrong.
- Automatic UI for non-scalar props (no JSON-editor control for array/object props). Out of scope — `excludeControls` is the answer for these.
- Changing `src/ui` primitives themselves. This change only touches `apps/extension/catalog/`.

## Decisions

**1. Parser stack: `svelte/compiler` + TypeScript compiler API, syntactic only.**
`svelte/compiler`'s `parse()` locates the instance-script source range (excluding the `<script module>` block, so module-level helper types like `Select.svelte`'s `SelectOption` aren't mistaken for the component's own props). That range is fed to `ts.createSourceFile`, walked for the top-level `InterfaceDeclaration` named `Props` and the `VariableStatement` whose initializer is a `$props()` call (for destructured default values).
*Alternatives considered:* regex extraction of the `interface Props {}` block — rejected, fragile against nested braces/generics/multi-line JSDoc. Full `ts.createProgram` type-checking — rejected as unnecessary complexity/slowdown; every primitive's `Props` members are syntactically inline today, so a syntactic walk covers the real cases, and anything it can't resolve safely falls back to requiring an explicit `excludeControls` entry rather than mis-deriving.

**2. Classification boundary.**
Mechanically derivable: `boolean` → boolean control; `number` → number control; `string` → text control; a union of only string-literal types (optionally including `undefined` for an optional prop) → select control, options = the literal values. Everything else — `Snippet`, function/callback types (`() => void`, `(value: string) => void`), array types, object type literals, `TypeReferenceNode`s to imported types (e.g. `SelectOption[]`) — is unclassified.
*Alternative considered:* best-effort controls for arrays/objects (e.g. a JSON textarea) — rejected; a freeform JSON control for `options: SelectOption[]` doesn't produce a meaningful live preview and would hide the real intent (curated examples matrix already covers these).

**3. `excludeControls: Record<string, string>` opts out *any* prop, not just unclassified ones.**
A mechanically-derivable prop can still be wrong as a naive control (e.g. `Select.svelte`'s `value: string` is only valid when it matches one of `options` — a free-text control would let a reviewer put the preview into an invalid state; `testid` props are real but not meaningful to fiddle with). `excludeControls` lets a story opt any prop out, with a one-line reason, whether or not it was classifiable.

**4. Fallback defaults for required derivable props with no destructure default.**
`ControlDef.default` (`apps/extension/catalog/lib/controls.ts`) is a required field. A required prop (no `= literal` in the `$props()` destructure) has no natural default to seed the live preview with. Fallback: `boolean` → `false`, `number` → `0`, `string`/select → the first union member, or `''` for a plain `string`. `controlOverrides` can replace this per prop when the fallback is a poor preview seed.
*Alternative considered:* make `ControlDef.default` optional — rejected, it would ripple into `Story.svelte` and `defaultArgs()`'s `Args`-seeding logic, which assume every controlled prop has a concrete initial value; a synthetic fallback keeps that contract unchanged.

**5. `description`/`typeLabel` derivation.**
`description` ← the prop's leading JSDoc comment text (TS compiler API's JSDoc support on the `PropertySignature`), verbatim. `typeLabel` ← the prop's type node's source text, printed as written (e.g. `'primary' | 'secondary' | 'ghost'`). `controlOverrides` may replace either per prop — needed when a JSDoc comment is long/multi-caveat prose not suited to a compact API-table cell (e.g. `Chip.svelte`'s `tone` and `hue` JSDoc blocks run 3+ sentences).

**6. Codegen wiring mirrors the existing font-copy pattern; the vitest guard calls the pure function directly, not the generated file.**
`derive-controls.ts` exports a pure `deriveControls(source: string): DerivedControls` (no filesystem access). The write side lives in `apps/extension/catalog/lib/generate-derived-controls.ts` (`generateDerivedControls()`): glob-reads every `src/ui/*.svelte` and writes a gitignored `apps/extension/catalog/lib/derived-controls.generated.ts`, which `catalog/lib/registry.ts` imports and merges with each story's `controlOverrides`/`excludeControls` to build the final per-story `Controls`.

**Deviation (agreed during implementation):** this write step is called from both `apps/extension/vite.catalog.config.ts` and `apps/extension/vite.config.ts`, before `defineConfig` in each (same synchronous-Node-side-effect pattern already used in both for font copying) — not from `vite.catalog.config.ts` alone as originally designed. Reason: `derive-controls.test.ts`'s `import.meta.glob(..., { import: 'meta' })` over `*.stories.svelte` (task 4.1) must fully load each story module to read its `meta` export, and nearly every story renders `Story.svelte`, which imports `registry.ts`, which imports the generated module at module scope. So a plain `vitest run` under `vite.config.ts` — CI's `pnpm --filter @lunma/extension test:run`/`verify`, which never loads `vite.catalog.config.ts` — fails to resolve that import unless the file already happens to exist on disk from an earlier `pnpm catalog`/`catalog:build` run. The guard's own logic is still independent of the generated file's *content* (it calls `deriveControls()` directly, per this decision's original intent), but not of the file's *existence*, since it's an unconditional static import three hops away (test → story module → `Story.svelte` → `registry.ts`). Calling `generateDerivedControls()` from both configs closes that gap without duplicating the codegen logic.
*Alternative considered:* a Vite plugin exposing a virtual module (`transform`/`resolveId` hooks) — rejected, adds plugin-authoring surface (virtual id scheme, HMR invalidation on primitive edits) for no material benefit over a synchronous pre-`defineConfig` write the codebase already does.

**7. The guard is bidirectional and lives in a new test file.**
`derive-controls.test.ts` asserts, per primitive: every `Props` member name is in `Object.keys(derived) ∪ Object.keys(excludeControls)` (nothing silently missing — the Button case), **and** every key in a story's `excludeControls`/`controlOverrides` still names a real `Props` member (nothing stale — a prop renamed/removed but still referenced). This is a new file rather than an extension of `stories-coverage.test.ts` because it must execute story modules to read `meta.excludeControls`/`meta.controlOverrides` (an eager `import.meta.glob` on `meta`, same technique `registry.ts` uses), whereas `stories-coverage.test.ts` deliberately stays glob-key-only per its own comment.

## Risks / Trade-offs

- **[Risk]** Syntactic-only parsing can't resolve a prop typed via an imported alias that *would* be a derivable union. → **Mitigation:** falls back to "unclassified, must be excluded" (safe), not a wrong guess; no primitive today uses this pattern (confirmed by grep — every `Props` member is typed inline).
- **[Risk]** Raw JSDoc dumped as `description` can be long/multi-sentence (e.g. `Chip.svelte`). → **Mitigation:** `controlOverrides.<prop>.description` lets a story hand-curate; `Story.svelte`'s API-table cell may need to wrap multi-line text regardless — an implementation detail, not a blocker.
- **[Risk]** Migrating ~35 stories by hand can transcribe a curated `select`'s options incorrectly. → **Mitigation:** migrate one story at a time, comparing the catalog dev server's rendered live preview/API table before and after against the current hand-authored `controls`.
- **[Risk]** Nearly every primitive has at least one callback prop (`onclick`, `onchange`, …), so most stories need a non-trivial `excludeControls` list from day one — could read as guard noise. → **Mitigation:** this is intentional, not incidental — the guard forces an explicit, reviewable decision per prop; the cost is a one-line reason string per excluded prop, not a blocker to `pnpm verify`.

## Migration Plan

1. Land `deriveControls()` + its own unit tests (fixtures, not real `src/ui` files) — verifiable in isolation, no story changes yet.
2. Add `excludeControls`/`controlOverrides` to `StoryMeta`; wire `registry.ts`'s derived+override merge; wire the codegen step into `vite.catalog.config.ts`. `StoryMeta.controls` still exists but is now unused by any story (dead field).
3. Migrate all ~35 `*.stories.svelte` from `controls` to `controlOverrides`/`excludeControls`, one at a time, verifying each in the catalog dev server.
4. Remove `StoryMeta.controls` from `story.ts` once no story references it.
5. Add `derive-controls.test.ts` (the drift guard) last, once every story is migrated, so `pnpm verify` doesn't go red mid-migration on this change's own branch.

No production rollback concern — the catalog is dev-only and ships nothing in the MV3 bundle; rollback is a normal `git revert` if derivation proves unreliable.

**Deviation (agreed during implementation):** `apps/extension/vite.config.ts`'s vitest `test.include` was `['src/**/*.test.ts']` only, so `catalog/lib/derive-controls.test.ts` (this change's own guard, named by the spec) would never be discovered by `vitest run`/`pnpm verify` — silently defeating the "SHALL run as part of `vitest run`" requirement. Fixed by widening `include` to `['src/**/*.test.ts', 'catalog/**/*.test.ts']`. Not in the proposal's original Impact list; added here for lockstep.

**Deviation (agreed during implementation):** the proposal/design/spec's stated `controlOverrides: Partial<Controls>` type doesn't type-check for its own described behavior ("replaces individual fields of the derived base per prop") — `Partial<Controls>` only makes the outer `Record`'s keys optional, it does not make each `ControlDef`'s fields optional, so `{ variant: { description: '…' } }` fails `svelte-check` (missing `type`/`default`). Implemented as `controlOverrides?: Record<string, Partial<ControlDef>>` instead, which is what every worked example in this doc (narrow a `select`'s options, hand-write a `description`) actually requires. Proposal/spec updated to match.

## Open Questions

- Should `excludeControls` reasons be validated against an enum of standard categories (`'callback' | 'snippet' | 'non-scalar' | string`) instead of free text? Starting with free text (consistent with the JSDoc-comment style already used throughout `src/ui`); revisit if reason text becomes inconsistent in practice.
