## Why

The component catalog (`apps/extension/catalog/`) is the tool a reviewer uses to
hold every `src/ui` primitive to Lunma's visual-quality and component-library
bar before it ships. A sibling catalog in `slotterpro-next` — a port of *this*
catalog that has since evolved — proved out several concrete improvements to
that build-and-review loop. This change adopts the ones that fit Lunma
(adapted to the flat `src/ui/` layout, Lunma's own `ui/` primitives, and the
biome/stylelint/vitest gates), and skips the ones that don't (its
Tailwind/`bits-ui` chrome, its neutral `--cat-*` palette, its `componentId`
indirection). This is dev-only plumbing (shape b of the user-value policy): its
consumer is the binding **visual-quality** and **component-library** policies
and every in-flight change that must review a primitive in the catalog before
shipping.

Seven gaps, all in one capability (`component-catalog`):

1. **One-size-fits-all backdrop.** Every primitive renders on the animated
   aurora/glass shell, even the ~35 whose identity has nothing to do with it —
   the reviewer's eye fights the backdrop instead of reading the primitive.
2. **Theme is coupled to the chrome.** A single toggle themes both the tool
   chrome and the previewed primitive, so checking a primitive's light-theme
   contrast means flipping the whole catalog.
3. **Opaque primitives get no controls.** A primitive whose props don't
   mechanically derive (`Aurora`, `EntityBadge`, `ResultList`,
   `ServiceConnectPicker`) is stuck with an examples-only story — no Playground,
   no API table.
4. **Code is whole-file only.** The source panel shows the entire story file;
   there's no per-variant markup and no live code reflecting the Playground
   knobs, so a reviewer can't copy the exact usage for a given instance.
5. **No gate on bundle leakage.** The "catalog ships nothing in the extension
   bundle" invariant is asserted structurally but not *enforced* — nothing
   fails if catalog code ever reaches `dist/`.
6. **Controls reset every reload.** Space hue, intensity, theme, and
   reduced-motion are fresh state each load; a reviewer re-sets them constantly.
7. **Toolbar and nav are undifferentiated.** Every control lives in one crammed
   toolbar; the nav's `Atoms` group is an overloaded catch-all.

Gaps 1–2 land first (the core mechanism); 3–7 are the adopted upgrades.

## What Changes

- **Per-story canvas + theme (gaps 1–2).** `StoryMeta` gains
  `background: 'neutral' | 'aurora'` (default `'neutral'`) and
  `theme: 'light' | 'dark'` (default `'dark'`). `Catalog.svelte`'s `.story-pane`
  carries `data-canvas`/`data-theme` from the selected story's `meta`; `neutral`
  paints an opaque `--surface` fill over the `<main>`-level `<Aurora>`, `aurora`
  stays transparent. `Story.svelte`'s `.preview` and `Variant.svelte`'s
  `.variant` pick a plain-card or glass recipe from the ancestor `data-canvas`.
  A `story-theme` toolbar control overrides `.story-pane`'s theme per session.
- **Author-declared controls (gap 3).** `StoryMeta` gains
  `controls?: Controls` — controls the deriver can't reach, merged *under*
  derived controls (a real derived control of the same name wins), then patched
  by `controlOverrides`. `registry.ts`'s `resolveControls` drops its
  "nothing-derived → `{}`" early-return in favour of the merge, so an opaque
  primitive that declares `meta.controls` gets a Playground + API table.
- **Per-variant + live code (gap 4).** New `catalog/lib/extract-code.ts`
  (`extractVariantCode`, `generatePlaygroundCode`) and
  `catalog/lib/variant-code.ts` (a Svelte context). Each `<Variant>` tile gains
  a `</>` trigger (a Lunma `IconButton`) that opens a single shared,
  full-width code drawer in its `Story.svelte` host showing that variant's exact
  authored markup (extracted verbatim from the story source, Shiki-highlighted).
  The Playground gains live code rebuilt from the current control values.
  Component name comes from `meta.title` (Lunma's title *is* the component name),
  not slotterpro's `componentId`.
- **Build-exclusion gate (gap 5).** New
  `apps/extension/scripts/assert-catalog-excluded.sh` runs one extension
  `vite build`, then greps `dist/` for catalog-engine markers (`defineStory`,
  `generateDerivedControls`, `resolveControls`, the catalog mount string) and any
  `*catalog*` path. Wired into `verify:catalog` (and thus `pnpm verify`) as
  `verify:catalog:build-exclusion` — enforcing the existing "ships nothing"
  invariant.
- **Theme persistence (gap 6).** `Catalog.svelte` persists the global immersive
  axes (`color`, `tint`, `theme`, `forceReduced`) to one `localStorage` JSON key,
  validated on read. `storyTheme` is *not* persisted (it reseeds per story).
- **Neutral tool chrome + information architecture (gap 7).** The catalog is a
  dev tool, so its chrome is rebuilt in a bespoke neutral grayscale palette
  (`--cat-*`) — clean, simple, industrial — decoupled from lunma's
  aurora/glass/hue treatment and from `src/ui` primitives, so the tool never
  reads as (or competes with) a lunma product surface. Two theme axes live on
  `<html>`: `data-cat-theme` (chrome) and `data-theme` (the preview + its
  portalled overlays). The chrome-theme toggle sits in the nav footer, the
  stage-theme control in the topbar beside the story title, and the preview-only
  knobs (Space hue, intensity, motion) in the toolbar — they drive the preview
  canvas only. The aurora backdrop is scoped to `background:'aurora'` stories'
  preview canvas, never the tool.
- **Story-consistency + nav-grouping pass.** The four examples-only stories gain
  a Playground via author-declared `controls`; `order:` usage is audited; an
  `Overlay` nav group (`Menu`, `BottomSheet`, `Toast`, `Tooltip`) de-loads the
  overloaded `Atoms` bucket.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `component-catalog`: (1) the immersive-shell requirement no longer pins the
  story content to aurora/glass — it becomes a per-story `meta.background` with a
  neutral default and an `aurora` opt-in, and the story content gains its own
  `meta.theme` with a live `story-theme` override; the shell's controls split
  across nav footer (chrome theme) and topbar (stage theme), and persist across
  reloads. (2) the live-controls requirement gains a third control source
  (`meta.controls`) and per-variant/live **code** views alongside the API table
  and source. (3) the "ships nothing in the extension bundle" requirement gains
  an automated gate (`verify:catalog:build-exclusion`).

## Impact

- **Modified files:** `apps/extension/catalog/lib/story.ts`
  (`background`/`theme`/`controls` on `StoryMeta`), `Catalog.svelte`
  (`data-canvas`/`data-theme`, `story-theme` control, IA re-layout, persistence),
  `lib/Story.svelte` (neutral-canvas card, live + variant code, drawer host),
  `lib/Variant.svelte` (neutral-canvas card, `</>` trigger), `lib/registry.ts`
  (`resolveControls` merge), `catalog.css` (code-token colours from tokens),
  `apps/extension/package.json` (`verify:catalog:build-exclusion`), the four
  examples-only stories + `Aurora`/`Surface`/`SearchField`/`Toast` (`background`),
  and `meta.group` edits for the `Overlay` regrouping.
- **New files:** `apps/extension/catalog/lib/extract-code.ts`,
  `apps/extension/catalog/lib/variant-code.ts`,
  `apps/extension/catalog/lib/resolve-controls.test.ts`,
  `apps/extension/catalog/lib/extract-code.test.ts`,
  `apps/extension/scripts/assert-catalog-excluded.sh`.
- **New public fields:** `StoryMeta.background`, `StoryMeta.theme`,
  `StoryMeta.controls`.
- **Chrome is intentionally NOT lunma primitives (dev-tool exception):** the
  catalog chrome is plain neutral controls in the `--cat-*` palette, not
  `src/ui` primitives — the "chrome composes primitives" rule governs product
  surfaces, not this dev tool, whose whole point is to look unlike the product.
  No new `src/ui` primitives are added; every `src/ui` primitive keeps its story
  (the coverage guard still holds — chrome merely stopped *using* them).
- **Verify-contract change:** `verify:catalog` now runs a full extension
  `vite build` (agreed — see design.md Decisions). No MV3 runtime/bundle change;
  catalog-only.
