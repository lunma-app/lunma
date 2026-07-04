# component-catalog Specification

## Purpose
TBD - created by archiving change add-component-catalog. Update Purpose after archive.
## Requirements
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

### Requirement: Each component exposes live controls, an API table, and its source

The catalog SHALL render, per story, a component-owned `Story` layout
(`apps/extension/catalog/lib/Story.svelte`) whose control panel is built from
**three** sources merged per prop, in precedence order: a story-authored
`meta.controls: Controls` **floor** (controls the deriver cannot reach, e.g.
for a primitive whose props are opaque type references), a **derived base**
produced by `apps/extension/catalog/lib/derive-controls.ts` parsing the
corresponding `apps/extension/src/ui/<Name>.svelte`'s `Props` interface (a
derived control of the same name replaces the authored floor wholesale), and a
story-authored `meta.controlOverrides: Record<string, Partial<ControlDef>>`
(each entry replaces only the fields it names). `registry.ts`'s
`resolveControls` SHALL perform this merge keyed by `meta.title` and SHALL NOT
short-circuit to an empty result when nothing is derived — an opaque primitive
that declares `meta.controls` SHALL still receive a Playground and API table. A
prop named in `meta.excludeControls` SHALL be dropped from the merged result
before rendering. When the merged result is non-empty, the catalog SHALL
render: a **live preview** bound to plain neutral chrome inputs (a checkbox for
booleans, a `<select>` for enums, a text input for text/number — styled with
the `--cat-*` palette, not lunma `src/ui` primitives); an **API table** listing
each control's prop,
type, default, and description; a **live Playground code** view reconstructed
from the component's name (`meta.title`) and the args that differ from their
defaults (a `true` boolean as a bare attribute; children shown as a `…`
placeholder); and the curated **examples** matrix, in which each `<Variant>`
tile SHALL expose a code trigger (composed from an existing `IconButton`
primitive) that opens a single shared, full-width **code drawer** in the
`Story.svelte` host showing that variant's exact authored markup, extracted
verbatim from the story source and highlighted with the catalog's existing
`shiki` themes. Independently of controls, every story SHALL render a **source
view** of the whole story file's raw source (via the `?raw` glob).

#### Scenario: An opaque primitive gains a Playground via authored controls

- **WHEN** a story whose primitive derives no controls declares `meta.controls`
- **THEN** the catalog SHALL render a Playground and API table for those authored controls, rather than an examples-only story

#### Scenario: A derived control wins over an authored one of the same name

- **WHEN** a story's `meta.controls` declares a prop that is also mechanically derivable from the primitive's `Props`
- **THEN** the derived control SHALL replace the authored one wholesale, and `meta.controlOverrides` for that prop SHALL still patch only the fields it names

#### Scenario: A variant's exact code is viewable in a drawer

- **WHEN** a reviewer activates the code trigger on an Examples-matrix `<Variant>` tile
- **THEN** the catalog SHALL open a single full-width drawer in the story host showing that variant's exact authored markup (extracted from the story source, Shiki-highlighted), and activating another tile's trigger SHALL replace the drawer's contents

#### Scenario: The Playground shows live code for the current knobs

- **WHEN** a reviewer changes a Playground control
- **THEN** the live Playground code view SHALL update to reflect only the args that differ from their defaults, with children rendered as a `…` placeholder

### Requirement: A guard fails when a component's props and its story's controls disagree

A vitest test `apps/extension/catalog/lib/derive-controls.test.ts` SHALL fail
when, for any `apps/extension/src/ui/<Name>.svelte` primitive, a member of its
`Props` interface is neither derivable by `derive-controls.ts`, nor listed in
the corresponding story's `meta.excludeControls`, nor author-declared in the
story's `meta.controls` (author-declaring a control accounts for a prop the
deriver cannot reach, exactly as excluding it does). The same test SHALL fail
when a story's `meta.excludeControls` or `meta.controlOverrides` names a prop
that is not a member of the primitive's current `Props` interface (a stale
entry left behind by a prop rename or removal). This test SHALL run as part of
`vitest run` (and therefore `pnpm verify`), independently of any
generated/codegen output.

#### Scenario: An author-declared control accounts for an otherwise-unclassified prop

- **WHEN** a primitive's `Props` member is not mechanically derivable (e.g. an imported/module type alias) and its story surfaces it via `meta.controls`
- **THEN** `derive-controls.test.ts` SHALL treat that prop as accounted for and SHALL NOT fail for it

#### Scenario: An unaccounted-for prop still fails the gate

- **WHEN** a primitive's `Props` gains a member `derive-controls.ts` cannot classify, and the story lists it in neither `meta.excludeControls` nor `meta.controls`
- **THEN** `derive-controls.test.ts` SHALL fail and `pnpm verify` SHALL exit non-zero

### Requirement: The catalog ships nothing in the extension bundle

The catalog SHALL NOT be part of the MV3 build: `public/manifest.json` SHALL
NOT reference any catalog file, and `apps/extension/vite.config.ts`
`rollupOptions.input` SHALL NOT include a catalog entry. This invariant SHALL
be enforced by an automated gate — `apps/extension/scripts/assert-catalog-excluded.sh`,
wired into `verify:catalog` (and therefore `pnpm verify`) as the
`verify:catalog:build-exclusion` script — which SHALL run one extension
production build (`pnpm --filter @lunma/extension build`, output `dist/`) and
SHALL fail when the built `dist/` contains any catalog-engine marker string
(e.g. `defineStory`, `generateDerivedControls`, `resolveControls`, the catalog
mount-target message) or any file path matching `*catalog*`.

#### Scenario: Catalog code in the build fails the gate

- **WHEN** `pnpm --filter @lunma/extension verify:catalog:build-exclusion` runs and the produced `dist/` contains a catalog-engine marker or a `*catalog*` path
- **THEN** the script SHALL exit non-zero and `pnpm verify` SHALL fail

#### Scenario: A clean build passes the gate

- **WHEN** the extension builds with the catalog present and no catalog code reaches `dist/`
- **THEN** `verify:catalog:build-exclusion` SHALL report success and exit zero

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

### Requirement: The catalog chrome is a neutral tool decoupled from lunma's theme

The catalog shell (`apps/extension/catalog/Catalog.svelte`) SHALL render its
chrome — nav, toolbar, topbar, nav footer, and `Story.svelte`'s panel frames,
API table, code, and source views — in a bespoke neutral grayscale palette
(`--cat-*`, defined in `apps/extension/catalog/catalog.css`), using plain
controls, and SHALL NOT dress the chrome in lunma's aurora/glass/hue treatment,
lunma's semantic tokens, or `apps/extension/src/ui` primitives — so the tool
never visually competes with or is mistaken for the primitives it presents. The
chrome SHALL expose, as plain neutral controls: the active Space hue, the
colour-intensity tier (`subtle | standard | vivid`), a reduced-motion toggle, a
**stage-theme** (preview light/dark) control in the topbar beside the selected
story's title, and a **chrome-theme** (tool light/dark) toggle in the nav
footer. The catalog SHALL key two independent theme axes on `<html>`:
`data-cat-theme` (the chrome's `--cat-*` palette) and `data-theme` (the
preview's lunma tokens, and therefore any body-portalled overlays a previewed
primitive renders). The Space-hue / colour-intensity / reduced-motion controls
SHALL apply ONLY to the preview canvas (a `.lunma-space-scope` wrapper carrying
`--space-*` / `data-tint` / `data-force-motion`), never the chrome. The chrome
axes (Space hue, colour-intensity, reduced-motion, chrome theme) SHALL persist
across reloads via a single `localStorage` key, restored on load and validated
before use (an out-of-range stored Space hue SHALL fall back to the default);
the stage theme SHALL NOT persist (it reseeds per story). Because
`Aurora.svelte` derives reduced-motion from `matchMedia` (not a prop), the
reduced-motion toggle SHALL freeze the backdrop via a `data-force-motion`
attribute handled in `catalog.css`.

#### Scenario: The chrome carries no lunma theming

- **WHEN** any story is selected at any Space hue, intensity, or stage theme
- **THEN** the nav, toolbar, topbar, footer, and panel frames SHALL render in the neutral `--cat-*` palette only, with no aurora backdrop, glass blur, Space-hue accent, or lunma `src/ui` primitive in the chrome

#### Scenario: Hue and intensity affect only the preview canvas

- **WHEN** the toolbar changes the colour-intensity tier or the Space hue
- **THEN** only the preview canvas (and the primitive rendered in it) SHALL pick up the corresponding `@lunma/tokens` custom properties (accent/glow/aurora), so a primitive can be inspected from `subtle` to `vivid` in one view, while the chrome is unaffected

#### Scenario: Reduced-motion toggle freezes animation

- **WHEN** the reduced-motion toggle is enabled
- **THEN** the preview canvas's aurora backdrop and primitive transitions SHALL stop animating via the catalog's `data-force-motion` handling, without modifying the `Aurora` primitive

#### Scenario: Chrome theme and stage theme are independent, and portals follow the stage

- **WHEN** the chrome theme and the stage theme are set to different values, and a previewed primitive portals an overlay to `<body>` (e.g. `Menu`, `MultiSelect`, `BottomSheet`, `Toast`)
- **THEN** the chrome SHALL render in the chrome theme (`data-cat-theme`) and the preview AND its portalled overlay SHALL render in the stage theme (`<html data-theme>`) — because both axes live on `<html>`, the overlay is never stranded in the wrong theme

#### Scenario: Chrome axes persist across reloads

- **WHEN** a reviewer sets the Space hue, colour-intensity, reduced-motion, or chrome theme and reloads the catalog
- **THEN** those four axes SHALL be restored from `localStorage` to their last values, while the stage theme SHALL reset to the selected story's `meta.theme` default

### Requirement: Each story's content pane chooses its own canvas and theme

The catalog SHALL let each `*.stories.svelte` file's `meta` (typed by
`StoryMeta`, `apps/extension/catalog/lib/story.ts`) declare two optional
fields: `background: 'neutral' | 'aurora'` (default `'neutral'`) and `theme:
'light' | 'dark'` (default `'dark'`). `Catalog.svelte` SHALL set a
`data-canvas` attribute on the preview canvas wrapper (`.cat-canvas`, a
`.lunma-space-scope` element) from the selected story's `meta.background` (or
its default), re-evaluated whenever the selection changes, and SHALL set the
stage theme on `<html data-theme>` from `meta.theme`. When `data-canvas` is
`'neutral'`, the canvas SHALL render a neutral `--cat-canvas` fill and no
aurora; when `'aurora'`, the canvas SHALL render an `<Aurora>` backdrop scoped
to the canvas (NOT the whole tool), with the chrome unaffected either way.
`Story.svelte`'s `.preview` and `Variant.svelte`'s `.variant` tiles SHALL each
render a plain neutral card (`--cat-canvas` fill, `--cat-canvas-border` border,
no backdrop-filter) when an ancestor `.cat-canvas` has `data-canvas='neutral'`,
and SHALL render a `@lunma/tokens` glass-tile recipe (`--glass-*` fill +
backdrop blur, on `.variant::before` to avoid trapping child popover z-index)
when it has `data-canvas='aurora'`. `Catalog.svelte`'s topbar SHALL expose a
plain stage-theme control, independent of the chrome-theme toggle, seeded from
the selected story's `meta.theme` on each story-selection change, letting a
reviewer override the stage theme for the session without editing the story
file or changing the chrome's own theme.

#### Scenario: A story defaults to a neutral canvas

- **WHEN** a story's `meta` omits `background`
- **THEN** the preview canvas SHALL render with `data-canvas='neutral'` on a `--cat-canvas` fill, and the Playground preview and every Examples-matrix tile SHALL render as plain `--cat-canvas` cards with no aurora backdrop or glass blur

#### Scenario: A story opts into the aurora canvas

- **WHEN** a story's `meta` sets `background: 'aurora'`
- **THEN** the preview canvas SHALL render an `<Aurora>` backdrop scoped to itself, and the Playground preview and every Examples-matrix tile SHALL render against that aurora using the glass-tile recipe, while the surrounding chrome stays neutral

#### Scenario: A story's stage theme is independent of the chrome theme

- **WHEN** a story's `meta.theme` is `'light'` and the chrome-theme toggle is `'dark'`
- **THEN** `<html data-theme>` SHALL be `'light'` (resolving lunma light-theme tokens for the preview and its portalled overlays) while the chrome renders dark via `data-cat-theme='dark'`

#### Scenario: The live stage-theme control overrides the story default for the session

- **WHEN** a reviewer changes the topbar stage-theme control while a story is selected
- **THEN** `<html data-theme>` SHALL follow the control's value immediately, without editing the story file, and SHALL reset to that story's `meta.theme` the next time the story selection changes

#### Scenario: The chrome stays neutral regardless of the selected story's canvas

- **WHEN** a story with `background: 'aurora'` is selected
- **THEN** only the preview canvas SHALL show the aurora; the nav, toolbar, topbar, and footer SHALL remain in the neutral `--cat-*` palette

