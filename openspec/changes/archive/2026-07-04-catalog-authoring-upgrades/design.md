> **Superseded-approach notice (read first).** During implementation the catalog
> chrome was reversed from Lunma's immersive aurora/glass shell to a **bespoke
> neutral grayscale `--cat-*` chrome** (nav/toolbar/panels), decoupled from the
> product tokens, with the aurora/hue scoped to the preview *canvas* only — a
> user-directed correction (the immersive treatment made the tool compete with
> the primitives it presents). The authoritative account is **Decision E**
> (below) plus the updated `proposal.md` and `specs/`. The earlier
> `Context`/`Decisions` prose referring to `.story-pane`, an opaque `--surface`
> fill, and a `.lunma-glass` toolbar is retained as the **evolution log**; where
> it conflicts with Decision E, Decision E wins. (Also since evolved: the live
> **Canvas** toggle — neutral vs theme habitat + ambient bloom — and hue axes on
> `<html>`; captured in the code + the "Controls not visibly working" fixes.)

## Context

`add-component-catalog` (archived 2026-06-28) deliberately put every story on
the full immersive shell — `<main class="stage lunma-space-scope">` in
`Catalog.svelte` always renders the animated `<Aurora>` backdrop, and every
box rendered inside it is individually glassed: `Story.svelte`'s `.preview`
(the Playground) and `Variant.svelte`'s `.variant` tiles (the Examples
matrix) both use the `.lunma-glass`/`glass-bg`+`backdrop-filter` recipe. The
original reasoning was that primitives should be reviewed "in their true
habitat" and that a neutral canvas can't show whether a primitive holds
WCAG-AA from `subtle` to `vivid`. That reasoning still holds for primitives
whose visual identity *is* the aurora/glass/glow system. But in practice it
makes the catalog worse at its core job for the other ~35 primitives: a
`TextInput` or `Chip` story puts an animated, hue-shifting backdrop behind
every rendered instance of the component — Playground preview AND every
Examples-matrix cell alike — and the reviewer's eye has to fight the backdrop
instead of reading the primitive. The user-facing complaint that triggered
this change: the catalog's own theme makes it harder, not easier, to focus on
a given component's UI.

This isn't an either/or. The fix is to stop treating "content canvas" as a
single catalog-wide constant and make it a per-story choice, defaulting to
calm, applied consistently across everywhere a primitive instance renders
(not just the Playground box).

A second, related gap surfaced during this design: the catalog has exactly
one theme toggle (`Catalog.svelte`'s `catalog-theme` `SegmentedControl`),
which sets `data-theme` on `<html>` — so the catalog chrome (nav, toolbar)
and every previewed primitive are forced into the same light/dark state.
There's no way to review a primitive's light-theme colours while keeping the
catalog's own chrome dark, or vice versa. This change also decouples those
two: chrome theme stays global; the selected story's content gets its own
independent theme.

**Broadened scope (this change was rescoped from `catalog-story-backgrounds`).**
Beyond the canvas/theme mechanism above, the catalog in `slotterpro-next` — a
port of this one that evolved further — surfaced five more improvements worth
adopting into the build-and-review loop: author-declared controls for opaque
primitives, per-variant and live **code** views, an automated build-exclusion
gate, control persistence, and an information-architecture split of the shell.
This change folds those in, adapted to Lunma's flat `src/ui/` layout, its own
`ui/` primitives, and its biome/stylelint/vitest gates. What it deliberately
does **not** adopt: slotterpro's Tailwind/`bits-ui`/`lucide` chrome, its neutral
`--cat-*` palette (both conflict with Lunma's immersive-shell visual policy),
and its `componentId` indirection (Lunma keys off `meta.title`, and a second
identifier would duplicate the title and undercut the filename↔title coverage
guard). The per-feature Decisions for the adopted upgrades are in
"Decisions — adopted catalog upgrades," below.

## Goals / Non-Goals

**Goals:**
- The selected story's entire content pane (Playground, Examples, API table,
  Source) defaults to a flat, neutral, token-backed surface so a reviewer's
  attention lands on the primitive, not the chrome around it — consistently,
  not just in the Playground box.
- Primitives that need the aurora/glass substrate to be evaluated honestly
  (their contrast, their glow, their blur) can still opt into it per story —
  nothing the original design's WCAG-AA-across-intensity argument relied on
  is lost, it's just no longer forced onto components that don't need it.
- The toolbar's Space-hue / colour-intensity / reduced-motion controls keep
  working unchanged on every story, neutral or aurora — they set
  `@lunma/tokens` custom properties that primitives consume directly
  (`--accent`, `--accent-soft`, focus rings, etc.), not just the aurora blob.
- The story content's light/dark theme becomes independent of the catalog
  chrome's own theme toggle, each story declaring its default and a live
  toolbar control letting a reviewer flip it per session without editing the
  story.
- The toolbar chrome itself (nav, toolbar bar) keeps its existing
  glass-on-aurora immersive look regardless of the selected story's canvas —
  only the story content area changes.

**Non-Goals:**
- Not replacing the toolbar's global hue/intensity system with a per-story
  equivalent — that stays global, only the story content's canvas/theme
  become per-story.
- Not changing any `src/ui` primitive's own styling or behaviour.
- Not adding a live in-catalog *background* switcher (neutral vs aurora)
  this round — `background` is declared in the story's `meta`, not toggled
  at runtime. (Only *theme*, light vs dark, gets a live override — see
  Decisions.) A live background switcher is left as a follow-up if the
  per-story default proves insufficient. (See Open Questions.)
- Not touching the persistent toolbar's own visual treatment — it keeps
  `.lunma-glass` on the `<main>`-level aurora unconditionally; this change
  only makes the *story content* pane's canvas conditional.

## Decisions

- **The chrome-theming requirement is a rename, encoded via `## RENAMED
  Requirements`.** This change replaces the living requirement `Primitives
  render inside the immersive shell` with `The catalog chrome is a neutral
  tool decoupled from lunma's theme` — same subject (the shell's theming
  model), semantically inverted. Found at archive/apply time: the delta had
  written it as a same-name `MODIFIED`, which OpenSpec's `specs-apply` cannot
  resolve (it matches MODIFIED by exact header and aborts on the missing new
  name). Fixed the delta by adding a `## RENAMED Requirements` FROM→TO pair;
  the existing MODIFIED block already references the NEW header, which
  `specs-apply` requires when a rename is present (apply order RENAMED →
  REMOVED → MODIFIED → ADDED). No implementation or spec-outcome change — the
  living spec content is identical to the change's intent; this only corrects
  the delta's encoding.
- **`background`/`theme` live on `StoryMeta`, not as a separate config file
  or a purely-runtime toggle.** Same shape as `title`/`group`/`order` — a
  story-authored fact about how to present that primitive — discoverable
  next to the story itself and reviewable in code review. Alternative
  considered: a catalog-wide toolbar toggle (neutral/aurora) applied
  uniformly. Rejected — that's the status quo's mistake in a different key;
  a global switch still can't be "neutral by default, aurora for the two or
  three primitives that need it" at the same time.
- **`background: 'neutral' | 'aurora'`, default `'neutral'`.** An earlier
  draft of this decision split "flat" into `flat-dark`/`flat-light` to track
  the catalog's theme toggle — that was solving the wrong problem: it used
  canvas *lightness* as a proxy for *theme*. Once theme becomes its own
  independent axis (below), the canvas only needs to say whether it's
  hue/aurora-forward or not; `neutral` resolves through the same
  `--surface`/`--surface-2` tokens the rest of the app already treats as its
  near-zero-chroma neutral tier, which are theme-reactive by construction —
  so the canvas correctly follows whichever theme the *story content* (not
  the chrome) is currently in, with no separate light/dark variant needed.
- **Scope is the whole story content pane (`Catalog.svelte`'s
  `.story-pane`), not just `Story.svelte`'s `.preview`.** `Variant.svelte`'s
  `.variant` tiles (the Examples matrix) are just as glass-on-aurora today as
  the Playground box, and are often the primary way a reviewer checks a
  primitive across its variant states — leaving them untouched would leave
  the core complaint half-fixed. `data-canvas`/`data-theme` attributes are
  set once, on `.story-pane` in `Catalog.svelte` (which already knows the
  selected story's `meta` synchronously via `registry.ts`'s eager glob, and
  already remounts per story via `{#key}`), rather than threaded as props
  into `Story.svelte`/`Variant.svelte` individually. `data-canvas='neutral'`
  paints an opaque `--surface` fill on `.story-pane`, which sits above
  `<main>`'s `<Aurora>` in stacking order (`.story-pane` already has
  `z-index: var(--z-raised)`), so it simply covers the animation for that
  story; `data-canvas='aurora'` leaves `.story-pane` transparent, identical
  to today, letting `<main>`'s existing aurora show through.
- **`.preview` and `.variant` pick their card recipe from the ancestor
  `data-canvas` attribute via `:global()`, not a prop.** E.g.
  `:global([data-canvas='neutral']) .preview { background: var(--surface-2);
  border: 1px solid var(--border-soft); }` inside `Story.svelte`'s own
  `<style>` (the standard Svelte pattern for ancestor-conditioned scoped
  styles — `catalog.css` already does the equivalent for the non-scoped
  Shiki output via `[data-theme='light'] .shiki`). This avoids threading
  `background`/`theme` through `Story`/`Variant`'s props, which don't
  otherwise need to know about story metadata. `[data-canvas='aurora']`
  keeps the existing `.lunma-glass` / `.variant::before` glass recipe,
  unchanged, just now conditional instead of unconditional.
- **`StoryMeta` also gains `theme?: 'light' | 'dark'` (default `'dark'`),
  scoped to `.story-pane`, independent of the catalog chrome's theme.**
  `Catalog.svelte` sets `data-theme` on `.story-pane` (seeded from the
  selected story's `meta.theme`), so `@lunma/tokens`' `[data-theme='light']`
  block re-resolves `--bg`/`--surface`/`--atm-*`/etc. for that subtree
  regardless of what `<html data-theme>` (chrome) is set to — a nested
  `data-theme` attribute overrides the inherited custom properties for its
  own descendants, the same mechanism the chrome toggle already relies on,
  applied one level deeper. Default `'dark'` matches the catalog's existing
  dark-first convention; a story can override it (e.g. a primitive whose
  light-theme contrast needs closer inspection).
- **The live theme override is a second toolbar control (`story-theme`),
  not a per-story or per-preview widget.** `Catalog.svelte` adds a
  `SegmentedControl` next to the existing `catalog-theme` control, labelled
  "Stage theme," backed by its own `$state` seeded from
  `selected.meta.theme` and reset whenever `selected` changes. Living in the
  toolbar (rather than inside `Story.svelte`, an earlier draft's placement)
  keeps it alongside the chrome theme control it's deliberately distinct
  from, and avoids re-deriving the control once per story render.
- **Neutral canvases resolve through existing `@lunma/tokens` surface
  tokens** (`--surface`/`--surface-2`), not new hex values — this is a
  catalog dev-tool, not a `src/ui` primitive, so it isn't bound by the
  Stylelint token gate, but it stays consistent with the component-library
  policy's spirit (no hardcoded design values) on principle.
- **Space-hue / colour-intensity / reduced-motion toolbar controls stay
  wired globally**, independent of both `.story-pane`'s canvas and theme.
  They set custom properties that cascade into `.story-pane` regardless of
  its local `data-theme` override (hue/intensity/motion aren't redeclared by
  the `[data-theme]` blocks), so a primitive using `--accent` still visibly
  shifts with the Space-hue control on a neutral canvas, in either stage
  theme. This preserves the original design's "verify WCAG-AA from subtle to
  vivid in one view" capability for every story, not just `aurora` ones.

## Decisions — adopted catalog upgrades

- **(A) Author-declared `controls` merge under derived controls.** `StoryMeta`
  gains `controls?: Controls`. `registry.ts`'s `resolveControls` replaces its
  `if (!derived) return {}` early-return with a three-step merge, identical in
  ordering to slotterpro's but keyed by `meta.title` (Lunma's title == the
  primitive filename == the `derivedControls` key), not `componentId`: (1) union
  `{ ...meta.controls, ...derived }` — a derived control of the same name wins
  wholesale (object-spread order); (2) drop keys named in `excludeControls`;
  (3) shallow-patch each survivor with `controlOverrides[prop]`. This gives the
  four examples-only opaque primitives (`Aurora`, `EntityBadge`, `ResultList`,
  `ServiceConnectPicker`) a Playground + API table without touching the
  primitives. A new `resolve-controls.test.ts` locks the three merge rules
  (author floor, derived-wins-collision, override-patches) since this is a
  behaviour change to `resolveControls` with no existing direct test. The
  existing `derive-controls.test.ts` parity guard is **extended**: its
  `accountedFor` set now also counts `meta.controls` keys, so author-declaring a
  control for a non-derivable `Props` member (an imported/module type alias)
  satisfies the guard exactly as excluding it does — without this, a story
  couldn't move a prop from `excludeControls` to `controls` without the guard
  failing. Consumers that justify the feature (no stranded infrastructure):
  `EntityBadge` (`entity`) and `Aurora` (`intensity`) — both had their sole
  non-derivable enum prop stuck in `excludeControls` with only examples; they
  now declare `meta.controls` + a `preview` snippet, gaining a live Playground +
  API table. `ResultList` and `ServiceConnectPicker` stay examples-only by
  design (their meaningful props are arrays/callbacks, not scalars a naive
  control could drive — recorded in each story's `excludeControls`).

- **(B) Code views: exact per-variant markup + live Playground code.** New
  `extract-code.ts` ports slotterpro's `extractVariantCode` (a syntactic
  `<Variant label>…</Variant>` scan of the raw story source → `Map<label,
  dedented markup>`) and `generatePlaygroundCode` (component reconstructed from
  its name + only the args that differ from default; children shown as a `…`
  placeholder). slotterpro's `componentName(componentId)` slug-caser is dropped
  — Lunma passes `meta.title` straight in (it is already the PascalCase
  component name; `MultiSelect` etc. survive verbatim). New `variant-code.ts`
  ports the Svelte context (`codeFor`/`toggle`/`openLabel`): each `<Variant>`
  tile carries a `</>` trigger; the `Story.svelte` host owns one shared,
  full-width drawer below the Examples grid so the code is never clipped in a
  narrow matrix column. Highlighting reuses Lunma's existing `shiki`
  `vitesse-light`/`vitesse-dark` themes (not slotterpro's `github-*`), matching
  the current Source panel. The `…`-children fidelity tradeoff is deliberate
  (the catalog only knows the derived prop contract, not authored children) and
  is recorded here rather than in a code comment (comment policy).

- **(B-primitives) The `</>` trigger and code-token colours use Lunma
  primitives/tokens, not Tailwind/hex.** slotterpro hand-rolls the trigger as a
  Tailwind `<button>` and hard-codes token colours (`#147a67` …). Lunma's
  compose-own-primitives + stylelint token gate forbid both: the trigger is an
  `IconButton` (icon `code`, or the nearest existing icon if `code` is absent
  from the generated set), and `.cat-tok-*` colours resolve through
  `@lunma/tokens` semantic vars (following the existing `.shiki` block in
  `catalog.css`, gated on `[data-theme='light']` — Lunma's single canvas-theme
  axis, not slotterpro's `[data-cat-theme]`).

- **(C) Build-exclusion gate wired into `verify` (agreed fork).** The living
  "The catalog ships nothing in the extension bundle" requirement is enforced
  today only structurally (separate Vite config, no manifest/rollup entry). This
  change adds `apps/extension/scripts/assert-catalog-excluded.sh`: one
  `pnpm run build` (crxjs → `dist/`, not SvelteKit's `build/`), then `grep -rl`
  over `dist/` for engine markers (`"catalog: #app mount target is missing"`,
  `generateDerivedControls`, `defineStory`, `resolveControls`) and any
  `*catalog*` path. slotterpro's `resolveVariantPropsAlias` marker is dropped
  (no Lunma equivalent). The marker-grep approach sidesteps the two-build byte
  diff (content-hashing makes that flaky) exactly as slotterpro documents.
  **Agreed cost:** the user chose to wire it into `verify:catalog` (and thus
  `pnpm verify`), so every `pnpm verify` now pays a full extension `vite build`
  (+ `gen:icons`, chained by the `build` script). This changes the verify
  contract — accepted for the always-enforced guarantee over a fast local gate.

- **(D) Persistence: one JSON key, global immersive axes only.** `Catalog.svelte`
  reads/writes `color`/`tint`/`theme`/`forceReduced` to a single
  `localStorage` key (`lunma_catalog_prefs`) as JSON, `try/catch`-guarded, with
  the stored hue validated against `SPACE_COLORS` before use (a stale/garbage
  hue would break `colourToOklch` — same trust-boundary discipline the store's
  Zod parsing applies, applied to a dev-tool read). `storyTheme` is **not**
  persisted: it is reseeded from `selected.meta.theme` on every selection change,
  so a persisted global would be clobbered instantly; persisting it would require
  the reseed to fire only when a story *explicitly* declares `meta.theme` — out
  of scope here, noted as a possible follow-up.

- **(E) Neutral bespoke chrome (`--cat-*`), decoupled from lunma's theme
  (user-directed reversal).** An earlier iteration of this change kept the
  catalog chrome in lunma's immersive aurora/glass shell and composed lunma
  `src/ui` primitives, citing the visual-quality + component-library policies.
  That was a **mis-application**: those policies govern the *product* surfaces
  (sidebar, launcher, new-tab, options, onboarding — CLAUDE.md's own list); the
  catalog is a **dev tool** and is not on that list. Dressing the tool in the
  product's skin made the chrome compete with — and be mistaken for — the
  primitives under review (the user's "nothing related to the lunma theme, to
  avoid confusion; clean, simple, industrial, raw"). Resolution (user-chosen):
  adopt slotterpro's approach after all — a bespoke neutral grayscale palette
  (`--cat-*`, in `catalog.css`) for the entire chrome (nav, toolbar, topbar,
  footer, `Story.svelte` panel frames, API table, code, source), built from
  **plain controls, not `src/ui` primitives** (a primitive would carry lunma's
  look and re-theme with the preview). Two independent theme axes on `<html>`:
  `data-cat-theme` (chrome `--cat-*`) and `data-theme` (the preview's lunma
  tokens). The chrome-theme toggle sits in the nav footer; the stage-theme
  control in the topbar beside the story title; the preview-only knobs (Space
  hue, intensity, motion) in the toolbar, scoped via `.lunma-space-scope` +
  `--space-*`/`data-tint`/`data-force-motion` to the **preview canvas only**.
  **Portal issue RESOLVED (not a caveat):** because the stage theme now lives on
  `<html data-theme>` (not a subtree), body-portalled overlays (`Menu`,
  `MultiSelect`, `BottomSheet`, `Toast`) correctly render in the stage theme —
  the bespoke `--cat-*` chrome is exactly what lets both axes sit on `<html>`
  without the chrome re-theming with the preview. **Aurora is scoped to the
  preview canvas:** `background:'aurora'` stories render an `<Aurora>` inside the
  `.cat-canvas` wrapper (not a tool-wide `<main>` backdrop); neutral stories get
  a flat `--cat-canvas` fill. `.preview`/`.variant` tiles pick `--cat-canvas`
  (neutral) vs the `--glass-*` recipe (aurora) from the ancestor
  `.cat-canvas[data-canvas]`.

- **(F) Story consistency: playgrounds for the opaque four; audit `order`; keep
  section order.** The four examples-only stories gain a Playground via (A)'s
  `meta.controls`. The three `order:` usages (`BottomSheet`, `Menu`, `Tooltip`)
  are audited and kept only where an intentional non-alphabetical position is
  justified (else removed for consistency). Lunma's existing section order
  (Playground → API → Examples → Source) is **kept**, not flipped to
  slotterpro's Examples-first — the per-variant drawer works regardless of
  section position, and reordering every story is churn without payoff.

- **(G) Nav taxonomy: add `Overlay`, de-load `Atoms`.** The `buildGroups`/
  `compare` algorithm is already byte-identical to slotterpro's — no engine
  change. The improvement is a `meta.group` data pass: a new `Overlay` group
  collects `Menu`, `BottomSheet`, `Toast`, `Tooltip` (today split across
  `Composite` and `Atoms`), shrinking the 16-item `Atoms` catch-all. Group
  assignment stays a per-story `meta.group` fact (taste, not a mechanical gate).

## Risks / Trade-offs

- [Risk] A story author picks `aurora` out of habit (matching the old
  default) instead of evaluating whether the primitive needs it, and the
  catalog drifts back to mostly-aurora over time. → Mitigation: the
  `component-catalog` spec's modified requirement states the default is
  `neutral` and names `aurora` as an opt-in for backdrop-dependent
  primitives specifically; `pnpm --filter @lunma/extension verify:catalog`
  doesn't enforce the choice itself (it's a legitimate per-primitive
  judgment call, not a mechanically checkable rule), so this is a code-review
  norm, not a gate.
- [Risk] A primitive that visually depends on sitting against a busy/varied
  backdrop (e.g. `FaviconTile`'s glow ring, `Toast`'s shadow) loses a
  meaningful check if its story is left on the `neutral` default by mistake.
  → Mitigation: during implementation, each of the 40 existing stories is
  reviewed individually for whether `neutral` is actually sufficient to
  evaluate it, and `aurora` is set explicitly where it isn't (see
  tasks.md) — this is a one-time sweep, not a blanket default choice.
- [Risk] `background` and `theme` are two more axes of catalog-authoring
  surface for future primitives to get wrong (forgetting to set either
  silently falls back to `neutral`/`dark`, which is safe, so the failure
  mode is "primitive under-tested against aurora or light theme," not
  "catalog broken"). → Mitigation: accepted; the defaults are the safe
  direction.
- [Risk] A nested `data-theme`/`data-canvas` on `.story-pane` could visually
  desync from the toolbar chrome in a way that reads as a bug rather than a
  feature (e.g. a light, flat story-pane directly below a dark, glassy
  toolbar). → Mitigation: the toolbar already sits in its own bordered
  `.lunma-glass` panel with its own bottom margin (`margin-bottom:
  var(--space-5)`), so it already reads as a distinct chrome element from
  the content below it; this change doesn't need new visual separation, it
  makes an existing seam do double duty as a theme/canvas boundary too.
- [Risk] Painting an opaque fill over `.story-pane` still leaves `<Aurora>`
  animating (unseen) underneath for `neutral` stories, spending animation
  cycles with no visible effect. → Mitigation: accepted as a non-issue —
  `<Aurora>` already always renders today (behind the toolbar, which is
  always glass-on-aurora regardless of the selected story), so this isn't a
  new cost, just a longer covered span; a follow-up could conditionally
  pause it, but that's not warranted by this change's motivation.

## Migration Plan

- No data migration. Purely a catalog dev-tool change.
- Land `StoryMeta.background`/`theme` + `Catalog.svelte`'s `.story-pane`
  attributes + `story-theme` control + `Story.svelte`/`Variant.svelte`'s
  neutral-canvas card variants first (all existing stories keep working via
  the `neutral`/`dark` defaults with no story edits required), then sweep
  every `*.stories.svelte` to set `background`/`theme` explicitly where a
  non-default value is the right call.
- Rollback: revert the commit(s); no external state to unwind.

## Open Questions

- Should the catalog also offer a runtime background override (a toolbar
  control cycling neutral/aurora per session, mirroring the new
  `story-theme` control) on top of the per-story default, for ad hoc
  comparison? Left out of this change's scope (Non-Goals) — raise as a
  follow-up if reviewers find the per-story default insufficient in
  practice.

## Visual language

- **Colour usage:** `neutral` story content uses the existing
  `@lunma/tokens` neutral surface tier (`--surface`/`--surface-2`), scoped to
  `.story-pane`'s own `data-theme` so it correctly resolves to either
  theme's near-zero-chroma tone — no new colour values. `aurora` story
  content is visually unchanged from today. The toolbar keeps its existing
  aurora/glass colour treatment unconditionally.
- **Hierarchy:** the neutral canvas's job is to recede — no border glow, no
  gradient, just enough contrast (`--surface-2` fill, `--border-soft`
  border, `--r-lg` radius, matching the removed `.lunma-glass` geometry)
  that each primitive instance reads as "on a card," not floating on an
  animated page. `CardHeading`/API table/Source panel text stay on
  `.story-pane`'s own `--surface`/`--text` fill, unaffected beyond following
  the story's theme.
- **Motion:** none added. `aurora` story content keeps the existing
  150–250ms token tweens; neutral content has no backdrop animation to begin
  with. The new `story-theme` control reuses `SegmentedControl`'s existing
  transition, no bespoke timing.
- **Interaction feedback:** unaffected for the primitive itself — this
  change only touches the static backdrop and theme scope behind rendered
  instances, not any primitive's own hover/focus/active states. The new
  `story-theme` toggle gets the same hover/selected/focus treatment as the
  existing `catalog-theme` control (same primitive, same toolbar).
- **Independent theme boundary:** `.story-pane` now visually reads as a
  self-contained panel that can differ in theme from the toolbar chrome
  above it — intentional, not a bug: it lets a reviewer keep the chrome in
  whichever theme is comfortable while checking a primitive's light AND dark
  appearance back-to-back via `story-theme`, without a full-page theme flip
  each time.
- **Improvement over the prior design:** the original "true habitat"
  argument assumed *the* habitat is aurora/glass for every primitive, and
  applied it everywhere a primitive renders — Playground and Examples alike.
  Lunma's actual habitat is more specific than that per primitive — a
  `TextInput` lives on many different in-app surfaces, most of which are
  calmer than an active Space's full-vivid aurora. Letting each story
  declare its own habitat (and its own theme), consistently across every box
  that renders it, is the more honest version of the original goal, not a
  retreat from it.
