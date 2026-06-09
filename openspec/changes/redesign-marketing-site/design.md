## Context

`apps/site` is a SvelteKit + `adapter-static` page that composes `@lunma/tokens` (tokens,
fonts, aurora/glass/glow recipes) and is gated by a Vitest WCAG-AA contrast test and the
`marketing-site` capability. It works, but its structure is generic. This redesign keeps the
machinery (token composition, the registered `@property --space-h` page-wide hue morph, the
product-accurate `mocks/` primitives, the a11y gates) and recomposes the surface into the
"Lamplight" direction from `docs/08-brand-identity.md`.

Constraints that shape every decision below: no token values may be mirrored or redefined
(spec + CLAUDE.md); all motion must collapse under `prefers-reduced-motion` with an identical
end state; text must meet WCAG-AA, verified by `contrast.test.ts`; the output must remain a
fully prerendered static site; no new runtime dependencies.

## Goals / Non-Goals

**Goals:**
- A hero that demonstrates the colour-coded Spaces *live* — switching a Space recolours a
  **faithful staged preview of the product** (the sidebar + new-tab identity) — within the
  first viewport, using the product's real palette.
- A staged product preview that genuinely matches the shipping sidebar/new-tab (so the site
  reflects the real product, not an idealised mock).
- Plain, direct, product-focused copy — describe what it is and what it does, no abstract or
  sentimental framing, no positioning against other browsers/extensions in the body copy.
- Ship the missing launch assets (on-brand favicon + a real OG image).
- Keep `pnpm --filter @lunma/site verify` green throughout.

**Non-Goals:**
- No real store/repo URLs (the `links.ts` `[VERIFY]` placeholders stay until the launch
  checklist resolves them).
- No changes to the extension, to `@lunma/tokens`, or to the product's behaviour.
- No new dependencies, no client-side router behaviour beyond what SvelteKit prerender gives.
- No comparative/positioning marketing (vertical-tabs / Arc / Arcify framing) in the body —
  a single quiet attribution remains in the footer.

## Decisions

1. **Fold `SpaceDemo` into a staged hero, and make the preview faithful to the product.** The
   hero owns a `StageWindow` that mirrors the real sidebar (top search pill, favicon grid,
   serif Space header, pinned + temporary tabs with the real 3px gradient leading bar, the
   bottom Space switcher) and the new-tab identity. Switching a Space recolours **only the
   staged window** — its own `--space-h/l/chroma` are re-bound on the window root, not the
   page — so the demo is honest (the product recolours its sidebar/new-tab, not "a web page")
   and the install CTA stays the stable ember brand colour. The example Spaces use the real
   nine-colour palette. *Alternatives considered:* (a) recolour the whole marketing page —
   rejected: it reads as a gimmick, isn't what the product does, and pushes the CTA label
   below AA for the darker palette colours; (b) keep a standalone demo — rejected, it dilutes
   the first impression and duplicates the window mock.

2. **Replace `Feature`/`FeatureGrid` with a single `Chapter` primitive.** Four identical
   alternating rows read as a template. `Chapter` takes an index (renders an editorial `01`–
   `04`), an eyebrow, a serif title, a copy snippet and a visual snippet, plus a `layout`
   prop (`offset` | `wide` | `inset`) so the rhythm varies down the page. *Alternative:* keep
   `Feature` and just restyle — rejected, the flat two-column grid is the core templated feel.

3. **Scroll-reveal via one small Svelte action (`reveal.ts`), not a library.** An
   `IntersectionObserver` adds a `data-revealed` attribute; CSS does the transition. It checks
   `matchMedia('(prefers-reduced-motion: reduce)')` and reveals immediately (no transform)
   when reduced. *Alternative:* a motion library — rejected, it is a new dependency and the
   effect is trivial in CSS. SSR-safe: the action only runs in `onMount` (client), and the
   un-revealed state is fully legible, so prerendered HTML (and no-JS) shows all content.

4. **OG image generated from a prerendered `/og` route, screenshotted to a committed PNG.**
   `og:image` needs a raster (SVG is unreliable on social platforms). A token-styled
   `routes/og/+page.svelte` renders the 1200×630 card with the real brand fonts/aurora; the
   Playwright MCP screenshots it once into `static/og.png`, which is committed. *Alternative:*
   hand-draw a PNG in an editor (off-brand, drifts from tokens) or ship `og.svg` (poor
   support) — both rejected. The `/og` route is excluded from the nav/sitemap and is harmless
   if crawled.

5. **Keep all body/heading text on the established contrast-tested tokens.** Headlines use
   `--text` on `--bg` (7:1), body `--text-muted`, fine print `--text-dim`, eyebrows/links
   `--accent`, CTA label `--space-on` on `--accent`. Glass-panel body text uses `--text-2`
   (already tested on `--surface`). Any new pairing (e.g. `--text-muted` on a glass panel) is
   added to `contrast.test.ts`. Text tokens are chroma-0, so the page-wide hue morph never
   changes text contrast.

6. **Sticky nav gains a scrolled glass backing** (toggled by a tiny scroll listener or
   `IntersectionObserver` sentinel), satisfying the "persistent CTA" requirement without a
   layout shift. Reduced-motion keeps the backing but drops the fade.

**Doc updates implied by these decisions:** `the distribution notes` (the landing-page
description in the marketing-surfaces section now reflects the staged faithful preview and
plain copy) and `docs/08-brand-identity.md` (§11 asset checklist: tick wordmark in use,
favicon, OG image, landing hero). Both are updated in this change.

## Visual language

The page is a calm, dark product page in the resting ember brand colour. The one live,
colour-forward moment is the staged product preview: switching a Space recolours that preview
(only) through the real palette — an honest demo a static screenshot can't give. The marketing
chrome (kickers, links, the install CTA) stays ember so the brand action is stable and always
AA.

- **Colour & atmosphere.** Substrate `--bg` (oklch 0.155). A single shared `.lunma-aurora`
  backdrop at a calmed `--aurora-opacity: ~0.55` in the resting ember hue. Elevated surfaces
  use `.lunma-glass` (22px backdrop blur, hue-tinted fill, hairline `--glass-border`, inset
  highlight). The staged window re-binds the Space axes on its own root and eases between
  Space colours via the registered `@property` morph. Identity elements (wordmark ember, Space
  name, active launcher row, hero glow) carry `--glow-space` / `--glow-space-soft`. Accent
  (`--accent`, parametric on the active hue) is reserved for the single highest-emphasis CTA,
  eyebrows, links, and active states — never body text.
- **Typography & hierarchy.** Instrument Serif (`--font-display`) for the wordmark, hero
  statement (`--text-display`, clamp 44–72px), chapter titles, and the Space name — identity
  and feeling only. Mona Sans (`--font-sans`) for all information: lede `--text-xl`, body at
  the 17px base, eyebrows `--text-sm` upper-tracked semibold, fine print `--text-dim`.
  Chapter numerals are large serif `01`–`04` set low-emphasis (`--text-dim`/`--text-faint`)
  as editorial ornament. Generous negative space; asymmetry over centred symmetry.
- **Motion (all 150–320ms, `--ease-emphasised` `cubic-bezier(0.16,1,0.3,1)`).**
  - *Kindle entrance* (signature): on first paint the hero ember glow blooms dim→full
    (~`--motion-slow` 320ms), then wordmark → headline → lede → CTAs stagger in (translateY
    14px → 0, 90ms steps) using `animation-delay`. One orchestrated moment, not scattered
    micro-animations.
  - *Space-colour morph:* the registered `--space-h/l/chroma` `@property` transition (~600ms)
    eases the staged window between Space colours. The switcher auto-cycle advances every
    ~3.8s and stops on any user pick. The morph is scoped to the window; the page stays ember.
  - *Scroll-reveal:* sections fade + rise 16px on first intersection, once.
  - *Interaction feedback:* CTA hover lifts `translateY(-1px)` and intensifies
    `--glow-space`; active presses `--press-scale` (0.97); the active switcher chip lifts to
    opacity 1 with a glass backing + glow; focus-visible uses the token focus ring everywhere;
    links go `--text-muted` → `--text`.
  - *Reduced motion:* `prefers-reduced-motion: reduce` removes the kindle stagger, the aurora
    drift, the switcher auto-cycle, the colour morph, and the scroll-reveal transform. Every
    end state is identical and fully legible.
- **Responsive.** Desktop is asymmetric (hero copy + offset stage; chapters alternate
  offset/wide/inset). At ≤860px the stage stacks under the copy, chapters become single
  column, nav anchor links collapse to just the wordmark + CTA, and the glow/blur soften for
  performance. Touch targets stay ≥40px.

## Risks / Trade-offs

- **More motion than today** → all of it is `prefers-reduced-motion`-gated with identical end
  states, and the gate is part of the `marketing-site` contract; manual reduced-motion pass
  in verification.
- **New text-on-glass pairings could fail AA** → keep glass body text at `--text-2`/`--text`,
  add any new pairing to `contrast.test.ts` so the gate catches regressions, not eyeballing.
- **Committed binary `og.png`** (the repo gitignores *generated* fonts but commits assets)
  → it's a small, intentional launch asset, regenerable from the `/og` route; documented in
  the change so it isn't mistaken for drift.
- **Heavier hero (blur + aurora + glow) on low-end devices** → blur radii come from tokens;
  soften atmosphere at the mobile breakpoint; `will-change` only on the aurora blobs (already
  the recipe's behaviour).
- **`StageWindow` complexity could drift from the real product** → it composes the existing
  `mocks/` that already mirror the extension; no new bespoke product chrome is invented.

## Migration Plan

Pure front-end, static-site change — no data, no runtime, no rollback concerns. Deploy is the
normal `vite build` prerender. Rollback = revert the change. Sequence: artifacts → components
(hero/stage first, then sections) → assets → contrast-test + verify → manual Playwright pass.

## Open Questions

None blocking. The four plan-level decisions (direction, OpenSpec routing, positioning lead,
producing assets now) were approved with the plan. Real store/repo URLs remain a launch-
checklist item outside this change.
