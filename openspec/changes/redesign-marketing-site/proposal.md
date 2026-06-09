## Why

Lunma is about to launch, and `lunma.app` is the first thing a prospective user sees. The
previous site read like a polished template — a centred hero, a detached demo, four
near-identical feature rows. This change rebuilds it into a clear, direct product page that
shows what Lunma actually is: a vertical sidebar for Chrome and Edge with colour-coded
Spaces, a keyboard launcher, and tabs that archive themselves. The user-visible value is a
landing page that communicates the product at a glance, demonstrates the real Spaces colour
system live in a faithful staged preview of the product, and states the privacy posture
clearly enough to install with confidence. It also lands the missing launch assets (an
on-brand favicon and OG image).

This is a direct user-visible improvement (shape **a** of the user-value policy): a better,
more accurate landing page, not plumbing.

## What Changes

- **Reimagined hero** — an asymmetric hero with the brand "kindle" first paint and a
  **staged, faithful product window**: the real sidebar (top search pill, favicon grid, a
  serif Space header, pinned + temporary tabs with the real active-tab leading bar, the
  bottom Space switcher) next to the new-tab identity. The Space-switch control recolours the
  **staged preview** (not the whole page) through the shared Space hue/lightness/chroma,
  using the product's real nine-colour palette. The standalone demo is folded in.
- **Features as numbered editorial chapters (01–04)** — the flat alternating rows are
  replaced by a `Chapter` primitive with varied layouts, composing the same product-accurate
  mocks (launcher, a Space panel, the auto-archive list, the favicon row) with plain,
  factual copy.
- **Plain, direct copy throughout** — no abstract/sentimental framing; the page describes the
  product and its features straightforwardly. References to other browsers/extensions are
  removed from the marketing copy (a single quiet attribution remains in the footer).
- **Trust, FAQ, and a closing CTA** — local-only / no-account / open-source stated plainly; a
  short FAQ; a warm closing install action.
- **Launch assets** — `static/favicon.svg` is redrawn on-brand (ember + alcove arch), and the
  referenced-but-missing **OG image** (`static/og.png`, 1200×630) is produced from a new
  token-styled `/og` prerender route, showing the real Space palette.
- **Accessibility preserved** — the WCAG-AA contrast gate and full `prefers-reduced-motion`
  gating (no auto-loops, identical end state) are kept; the contrast test gains any new
  text/background pairing the redesign introduces.

No tokens are mirrored or redefined; the site keeps composing `@lunma/tokens`. The example
Space colours mirror the extension's real palette (`apps/extension/src/shared/space-hue.ts`).
No new runtime dependencies. The extension itself is untouched.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `marketing-site`: ADD a requirement that the page **demonstrates Lunma's colour-coded
  Spaces live** — a control recolours a faithful staged preview of the product through the
  real Space palette, honouring the reduced-motion + WCAG-AA contract. All existing
  requirements (above-fold value prop, persistent highest-emphasis install CTA, trust
  signals, token composition, reduced-motion + WCAG-AA, static delivery) are retained
  unchanged — the redesign keeps satisfying them.

## Impact

- **Code:** `apps/site/src/routes/+page.svelte` (recomposed) and a new
  `apps/site/src/routes/og/+page.svelte` (+ `+page.ts`) for the OG render route.
- **New components** (`apps/site/src/lib/`): `StageWindow.svelte` (faithful sidebar +
  new-tab preview, real palette, recolour scoped to the window), `Chapter.svelte`,
  `Chapters.svelte`, `CloseCta.svelte`, and a `reveal.ts` Svelte action (IntersectionObserver
  scroll-reveal, reduced-motion aware).
- **Refined components:** `Hero.svelte`, `Nav.svelte`, `TrustBand.svelte`, `Faq.svelte`,
  `Footer.svelte`, `InstallCta.svelte`, `Wordmark.svelte`.
- **Removed:** `SpaceDemo.svelte` (folded into the staged hero), `Feature.svelte` +
  `FeatureGrid.svelte` (replaced by `Chapter.svelte`), `Positioning.svelte` and
  `Wedge.svelte` (the positioning/beachhead beats are dropped in favour of plain,
  product-focused copy).
- **Updated mocks (to match the shipping product):** `mocks/TabRowMock.svelte` (real 3px
  gradient leading bar + `--space-c` wash, `meta` slot), `mocks/FaviconTileMock.svelte`
  (`--space-c`); `mocks/Favicon.svelte`, `mocks/LauncherMock.svelte`, `mocks/apps.ts`,
  `links.ts` kept.
- **New mock primitives** (`apps/site/src/lib/mocks/`): `SpaceHeader.svelte` (Space icon +
  serif name) and `FaviconGrid.svelte` (grid of favourite tiles), composed by BOTH
  `StageWindow` and the chapters so the sidebar depiction lives in one place and can't drift;
  plus a `.space-scope` utility in `app.css` for the shared Space-colour family (`--space-c…`).
- **Composes (no re-rolling):** the `@lunma/tokens` recipes (`.lunma-aurora`, `.lunma-glass`,
  `--glow-space`, `--motion-*` / `--ease-*`, the type scale + brand faces) and the site's own
  `InstallCta` / `Wordmark` / mock components. New site-local CSS is layout/composition only.
- **Assets:** `static/favicon.svg` (redrawn), `static/og.png` (new, generated via Playwright
  from the `/og` route).
- **Tests:** `apps/site/src/lib/contrast.test.ts` extended for the new pairings.
- **Docs:** updates `the distribution notes` (landing-page description) and
  `docs/08-brand-identity.md` (§11 asset checklist). Leaves untouched:
  `docs/01-vision.md`–`docs/06-migration.md`.
- **No impact:** `apps/extension`, `packages/tokens` (consumed as-is).
