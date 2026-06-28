## Context

Lunma's design system is 40 `src/ui` primitives (Svelte 5 runes) styled exclusively from `@lunma/tokens` CSS custom properties, plus an immersive model (aurora backdrop, frosted glass, per-Space hue, colour-intensity tiers). The closest existing enumeration of a primitive's variants is the `*.test.harness.svelte` set (37 files — NOT one-per-primitive: `Aurora`/`Pill`/`Toast` have none, `SearchField` has two), mounted in vitest/jsdom and never rendered for a human. There is no visual catalog. Note the composite primitives `ResultList`, `LensRow`, `ReviewerRail`, `ResultRow` are themselves part of the 40 — they are not "extra" components.

Constraints that shape this design:
- **Pinned stack** (Svelte 5 + Vite 8 + Vitest 4) — Histoire's Svelte plugin peers on Svelte 3/4 and Vite ≤7; it cannot be used. The mechanism must run on the exact stack.
- **One-way import DAG** enforced by Biome (`noRestrictedImports` per-layer + `noImportCycles`) and the primitive→token stylelint contract — both gated by `pnpm verify`. The catalog must slot into this without loosening the `src/` gates.
- **Cross-app guard:** `apps/site` and `apps/extension` must not import each other. The catalog must import `src/ui` primitives, so it cannot be a third app reaching into the extension's private `src/`.
- **Binding policies:** user-value (this is plumbing → must name its consumer), visual-quality (a surface must ship a `Visual language` section), component-library (compose primitives, never re-roll), and no-silent-drift.

## Goals / Non-Goals

**Goals:**
- A dev-only, browsable catalog of all 40 `src/ui` primitives (which already include the composites `ResultList`, `LensRow`, `ReviewerRail`, `ResultRow`), each in a full variant matrix with meaningful mock data, shown inside the real immersive shell with Space-hue / colour-intensity / reduced-motion toggles. Composition is exercised via richer multi-row scenes inside those composites' own stories — one story file per primitive name, no extra files.
- Auto-discovery so adding a story needs no central registration edit.
- Ships nothing in the MV3 bundle; runs on the pinned stack with zero new runtime deps.
- Held to a quality bar (typecheck + lint + stylelint + svelte-check) without weakening the `src/` gates.
- Three-layer enforcement so a primitive can never ship without its story.

**Goals (added in the controls-v2 expansion):**
- A per-component **live controls + preview**: each story declares a small `controls` schema (prop → type/default/options) that the catalog renders as editable inputs bound to a single live preview, so a reviewer can change props and see the result.
- A per-component **API table** derived from that schema (prop · type · default · description) so the component's interface is legible at a glance.
- A per-component **source view**: the rendered story's own source is shown in a collapsible panel (`?raw` import), so a reviewer can read the markup behind the matrix.

**Non-Goals:**
- Storybook's full args/addon ecosystem, MDX docs — the controls are a lightweight hand-authored schema, not an addon framework.
- Auto-generated/complete prop introspection — Svelte 5 exposes no runtime prop metadata, so the `controls` schema (and thus the API table) is hand-authored and covers the controllable scalar/enum/boolean/text props, not every prop of every composite.
- Visual-regression / screenshot diffing; a11y automation beyond the existing WCAG-AA tests.
- Feature-surface stories (sidebar/launcher/options) — kept a **follow-up** (its DAG reversal — the catalog would have to import those surfaces, which the `architecture-integrity` delta deliberately bans — and the heavy state/bus/chrome mocking are out of scope here).
- A hosted/published catalog.

## Decisions

**D1 — Homegrown catalog over Storybook/Histoire.** Histoire is incompatible with Svelte 5 + Vite 8 (beta; Svelte 3/4, Vite ≤7 peers). Storybook works but is heavy. A homegrown catalog is ~8 small files, zero heavy deps, exact-stack-native, and reuses `@lunma/tokens` + the immersive recipes directly. *Alternatives:* (a) force Histoire with peer overrides — rejected, debugging an unsupported runes runtime; (b) Storybook 10 + addon-svelte-csf — rejected as disproportionately heavy for a private dev surface. **Doc update:** `docs/tech-stack.md` "Non-obvious choices" records this.

**D2 — In-package (`apps/extension/catalog/`), not a separate `apps/catalog`.** The catalog must import `src/ui` primitives. A separate app would reach into the extension's private `src/` (no `exports` for `ui/`) and pressure the cross-app guard. In-package makes every `@/ui/*` import a legal intra-package edge — the catalog is a surface that composes `ui`, exactly like sidebar/launcher. *Alternative:* separate `@lunma/catalog` package mirroring `apps/site` — rejected; `apps/site` only depends on `@lunma/tokens`, the catalog inherently can't.

**D3 — Sibling Vite config + parallel gate, `src/` gates untouched.** `vite.catalog.config.ts` (`root: catalog`, `@`→`src` alias, replicated font-copy) builds the catalog; `tsconfig.catalog.json` adds the `@/*` paths only catalog needs. A parallel `verify:catalog` (typecheck/biome/svelte-check/stylelint scoped to `catalog/**`) folds into `verify`. *Alternative:* fold catalog into the existing `src`-scoped gates — rejected; it forces `@/*` paths into the base tsconfig (src uses relative imports today) and widens deliberately tight globs. **Doc updates:** `docs/architecture.md` layout tree + a "dev surfaces" note; `CLAUDE.md` "Quality gates" list; the `architecture-integrity` spec's single-`verify` requirement gains the `verify:catalog` step (normative — recorded in the spec delta).

**D4 — Catalog as a new DAG node.** A Biome override scoped to `apps/extension/catalog/**` mirrors the `options` override: allows `@/ui` + `@/shared`, bans `background`/`content`/`sidebar`/`launcher`/`options` + `apps/site`. So `@/ui/Button.svelte` passes, `@/background/*` fails. *Alternative:* leave catalog ungoverned (it's outside `src/`, so Biome ignores it today) — rejected; an ungoverned surface could grow illegal edges and silently violate the DAG. **Doc update:** `docs/architecture.md` boundaries table + the `architecture-integrity` delta add the `catalog` row.

**D5 — Self-rendering `.stories.svelte`, not pure-data descriptors.** Primitives take `children`/snippet props a plain data object can't supply, and the immersive shell needs real markup. Each story is a Svelte component: a `<script module>` exports `meta = defineStory({ title, group })` for the nav; the body renders the variant matrix via a `<Variant label>` cell. *Alternative:* a JSON/TS variant descriptor consumed by a generic renderer — rejected; can't express snippet children or composite wiring. `registry.ts` does two `import.meta.glob` over `stories/**/*.stories.svelte`: `meta` eagerly (cheap, for the nav) and the component lazily (`{#await load() then mod}`).

**D6 — Coverage guard lives in `src/`.** The extension's vitest `include` is `src/**/*.test.ts`; the catalog has no vitest config. `src/ui/stories-coverage.test.ts` globs `./*.svelte` (filtering out any name containing `.test.` — the `*.test.harness.svelte` fixtures and any future `*.test.svelte`) for primitives and lazy-globs `../../catalog/stories/ui/*.stories.svelte` (keys only — story modules never execute, so no `@/ui` transform enters the test bundle) for coverage, asserting parity. A hard guard is acceptable because this change ships all 40 stories. Parity is one-directional in practice: every primitive needs a story, and because the only legal story location is `stories/ui/<Name>.stories.svelte` per primitive (no composite-only files — see D5/S1 resolution), the story set cannot contain an orphan with no matching primitive.

**D7 — Three-layer never-miss enforcement.** (1) The D6 vitest guard is the deterministic `verify`/CI gate. (2) A project `.claude` `PostToolUse` hook (`Edit|Write|MultiEdit`) running `.claude/hooks/check-catalog-coverage.mjs` reads `tool_input.file_path`; on a `src/ui/*.svelte` primitive edit/add with no sibling story it exits 2 with a message — an in-session nudge (advisory, session-local). (3) A binding `CLAUDE.md` component-library line makes it normative for humans + agents. Layered because no single mechanism is both deterministic and proactive. **Doc update:** `CLAUDE.md` component-library policy.

**D8 — Hand-authored `controls` schema + a catalog-owned `Story` layout (controls-v2).** Svelte 5 exposes no runtime prop metadata, so auto-generated controls are impossible. Instead each story's `meta` carries an optional `controls` map (`prop → { type: 'boolean'|'select'|'text'|'number', default, options?, typeLabel?, description? }`, in `catalog/lib/controls.ts`). The catalog-owned `catalog/lib/Story.svelte` renders, from that schema: a **live preview** (a `{#snippet preview(args)}` the story provides, rendered with live `args` seeded from the defaults), an editable **controls panel** (composing `Chip` toggles for booleans, `Select` for enums, `TextInput` for text/number — never re-rolled), an **API table** (prop · type · default · description), the curated **examples** matrix (the story's `{#snippet examples()}` — the former variant cells), and the source panel (D9). Each story's default export becomes `<Story {meta} {source}>…snippets…</Story>`; the catalog passes `source` in. *Alternative:* a generic args panel that introspects props — rejected (no Svelte runtime prop metadata). **Doc update:** the `component-catalog` spec gains the controls/API requirement.

**D9 — Source view via a `?raw` glob, threaded as a prop; highlighted with Shiki.** A third `import.meta.glob('../stories/**/*.stories.svelte', { query: '?raw', import: 'default' })` in `registry.ts` lazily loads each story file's raw text; `StoryEntry.loadSource()` exposes it, the catalog `await`s it alongside the component and passes it to the story as `source`, and `Story.svelte` shows it in a collapsible `<details>` source panel. So "see the code of the rendered block" needs no per-story duplication — the file IS the source. The panel is syntax-highlighted with **Shiki** (`codeToHtml(source, { lang: 'svelte', themes: { light, dark }, defaultColor: false })`), the one dev-only dependency this change adds; `defaultColor: false` emits per-token `--shiki-light`/`--shiki-dark` custom properties so a single highlight pass follows the catalog's light/dark toggle via CSS (rules in `catalog.css`, since `{@html}` output isn't reached by Svelte's scoped styles). Svelte source mixes HTML+JS+CSS, so a hand-rolled highlighter would read poorly; Shiki has a real Svelte grammar and is ESM/Vite-native. *Alternatives:* per-variant hand-written code strings — rejected as duplicative/drift-prone; a zero-dep highlighter — rejected as low-quality for Svelte. **Doc update:** `docs/tech-stack.md` records the dev-only `shiki` dep; the `component-catalog` spec keeps the source-view requirement.

**D10 — Light/dark theme toggle + fixed dev port.** The toolbar adds a theme toggle (a composed `SegmentedControl`) that drives the shared `applyThemeToDocument` helper (`@/shared/surface-boot`) — reflecting `data-theme` + `color-scheme` onto `<html>` so `@lunma/tokens`' `[data-theme="light"]` set takes over — so primitives can be inspected in both themes (not just dark). The catalog dev server pins `server.port = 6006` in `vite.catalog.config.ts` so it never collides with the extension dev server (Vite's default `5173`). **Doc update:** the `component-catalog` immersive-shell requirement adds the theme toggle.

## Visual language

The catalog is a dev surface but renders primitives *in their true habitat*, so it carries the immersive look rather than a neutral grid.

- **Backdrop & glass:** the stage sits in `.lunma-space-scope` with `<Aurora>` (the 3-blob animated backdrop) behind frosted-glass panels (`.lunma-glass`) — the same recipes the new-tab page uses (`NewTab.svelte`). Each `<Variant>` cell is a glass tile so primitives are read against the real substrate, not white.
- **Colour usage:** the toolbar binds the active Space hue to `--space-h` and exposes the colour-intensity tier (`subtle | standard | vivid` = the `Tint` type from `shared/settings`); primitives pick up `--accent`/`--accent-soft`/glow exactly as in-app. Default is `vivid` (the immersive default).
- **Motion:** toggles and nav selection use the system's 150–250ms token tweens (`--motion-fast` + `--ease-standard`). The aurora animation honours the toggle (see risk R1). No bespoke timings — catalog chrome composes the same primitives/tokens.
- **Interaction feedback:** nav rows reuse `RowButton` (hover/selected/focus states from the primitive); toolbar controls reuse `SegmentedControl`/`IconButton`. Catalog chrome composes primitives — it does not re-roll buttons/toggles (component-library policy).
- **Hierarchy:** Instrument Serif for the catalog wordmark/section identity, Mona Sans for labels — the same dual-typeface system. Variant labels use `--text-xs`/muted; component titles use a `CardHeading`.
- **Improvement over Arc/Storybook:** primitives are shown against the live, hue-shiftable aurora substrate at every intensity tier — you can verify a primitive holds WCAG-AA from `subtle` to `vivid` in one view, which a neutral-canvas catalog can't show.

## Risks / Trade-offs

- **R1 — Aurora reduced-motion can't be prop-overridden, and the catalog can only force it ON.** `Aurora.svelte` derives `reduced` from `matchMedia('(prefers-reduced-motion: reduce)')`, so a toolbar prop can't force it. → The toggle sets a `data-force-motion="reduced"` attribute on the scope and the catalog stylesheet replicates Aurora's freeze, which must target Aurora's Svelte-scoped selector via `:global(.aurora .blob){ animation: none }` plus neutralize primitive transitions. **One-directional limitation:** `Aurora.svelte` also hard-codes `@media (prefers-reduced-motion: reduce){ .blob{ animation: none } }`, which no catalog attribute or stylesheet can override — so a reviewer whose OS *prefers* reduced motion cannot force the full aurora animation back ON in the catalog. The toggle therefore only forces reduced-motion on; it cannot defeat an OS reduced-motion preference. Documented here (and in the `component-catalog` spec) so the one-way behaviour isn't mistaken for a bug or an `Aurora` primitive change later.
- **R2 — Catalog drifts from the primitive set.** → D6 vitest guard fails `verify`; D7 hook nudges in-session; CLAUDE.md policy binds. Three layers.
- **R3 — Catalog accidentally ships in the MV3 bundle.** → Separate config + `root: catalog`, never referenced by `manifest.json` nor `vite.config.ts` `rollupOptions.input`. Verification asserts `pnpm build` output is unchanged.
- **R4 — `verify` runtime grows.** The four catalog checks add to `verify`. → They run only catalog files (scoped tsconfig/globs), a small surface; acceptable for the quality guarantee.
- **R5 — Mock data rots / is meaningless.** → A single shared `lib/mock.ts` with realistic fixtures (PR titles, repo/people names, reviewer verdicts, tabs, favicons) reused across stories; not per-story lorem.

## Migration Plan

Additive, no rollback complexity. Land config + scaffolding (catalog boots with one story), then the immersive shell, then `mock.ts` + the 40 + composite stories, then the enforcement layers, then docs/spec lockstep. Rollback = delete `catalog/`, the two configs, the new scripts, the test, and the `.claude` hook entry; no `src/` or runtime change to revert.

## Open Questions

None blocking. The composite set is fixed at `ResultList`, `LensRow`, `ReviewerRail` for this pass; broader feature-surface coverage is an explicit follow-up (Non-Goal).
