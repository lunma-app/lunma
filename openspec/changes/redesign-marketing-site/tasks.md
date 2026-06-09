## 1. Scaffolding & shared pieces

- [x] 1.1 Add `src/lib/reveal.ts` — an IntersectionObserver Svelte action that sets
  `data-revealed` once on intersect; reveals immediately (no transform) under
  `prefers-reduced-motion: reduce`; SSR-safe (client-only, legible un-revealed state).
- [x] 1.2 Refine `src/app.css` — base reveal transition utility, editorial rhythm helpers
  (section spacing, eyebrow, chapter numeral), all values from tokens; keep the
  `@property --space-h` morph and reduced-motion collapse.

## 2. Hero & staged product window

- [x] 2.1 Add `src/lib/StageWindow.svelte` — the glowing product preview (sidebar +
  launcher mocks), composing the existing `mocks/`; owns the example-Space chips and re-binds
  `--space-h` on `<html>` (folding in `SpaceDemo`'s logic); auto-cycle gated on reduced motion.
- [x] 2.2 Reimagine `src/lib/Hero.svelte` — asymmetric, cinematic; kindle entrance (ember
  bloom → staggered content); Instrument-Serif statement + one-sentence value subhead;
  hero install CTAs (highest emphasis) + trust hint; composes `StageWindow`.
- [x] 2.3 Delete `src/lib/SpaceDemo.svelte` (folded into the staged hero).

## 3. Positioning & feature chapters

- [x] 3.1 Add `src/lib/Positioning.svelte` — "Not vertical tabs. Not an Arc clone. The
  workflow." editorial beat (satisfies the positioning requirement).
- [x] 3.2 Add `src/lib/Chapter.svelte` — numbered (01–04) editorial chapter primitive with a
  `layout` variant (`offset` | `wide` | `inset`); eyebrow + serif title + copy/visual snippets.
- [x] 3.3 Build the four chapters in `+page.svelte` (or a `Chapters.svelte`) composing the
  mocks: Launcher (Alt+L), Spaces-as-places, Auto-archive, Pins & favicon row — accurate copy.
- [x] 3.4 Delete `src/lib/Feature.svelte` and `src/lib/FeatureGrid.svelte`.

## 4. Trust, wedge, FAQ, close, footer

- [x] 4.1 Refine `src/lib/TrustBand.svelte` — "Private by architecture" (local-only, open
  source, no remote code); keep the open-source link and glass cells, elevate type/rhythm.
- [x] 4.2 Add `src/lib/Wedge.svelte` (replacing `WorkBand.svelte`) — work-browser beachhead +
  Arcify migration front door (satisfies the beachhead requirement); delete `WorkBand.svelte`.
- [x] 4.3 Refine `src/lib/Faq.svelte` — same four answers, editorial accordion.
- [x] 4.4 Add `src/lib/CloseCta.svelte` — warm closing line + repeated install CTA.
- [x] 4.5 Refine `Nav.svelte` (sticky + scrolled glass backing, persistent CTA),
  `Footer.svelte`, `InstallCta.svelte`, `Wordmark.svelte`; wire all sections in `+page.svelte`
  with `reveal` and updated `<svelte:head>` meta.

## 5. Launch assets

- [x] 5.1 Redraw `static/favicon.svg` — ember + simplified alcove arch on the dark substrate.
- [x] 5.2 Add `src/routes/og/+page.svelte` (+ `+page.ts`) — token-styled 1200×630 OG card
  (wordmark + tagline over the ember aurora), excluded from nav.
- [x] 5.3 Screenshot `/og` at 1200×630 via the Playwright MCP into `static/og.png`; confirm
  the `og:image` meta resolves.

## 6. Accessibility & verification

- [x] 6.1 Extend `src/lib/contrast.test.ts` with any new text/background pairing the redesign
  introduces (e.g. text on a glass panel); keep all existing pairings.
- [x] 6.2 `pnpm --filter @lunma/site verify` green (biome, svelte-check, vitest, prerender).
- [x] 6.3 Manual Playwright MCP pass on `pnpm --filter @lunma/site dev`: kindle entrance, the
  page-wide hue morph on Space switch, reduced-motion (no auto-loop, legible), responsive at
  mobile/tablet/desktop; capture screenshots.
- [x] 6.4 Root `pnpm verify` (no workspace regression).

## 7. Docs (same-change lockstep)

- [x] 7.1 Update `the distribution notes` — landing-page description reflects the staged hero
  + positioning + wedge structure.
- [x] 7.2 Update `docs/08-brand-identity.md` — tick §11 asset-checklist items (wordmark in use,
  favicon, OG image, landing hero).

## 8. Revision — direct copy, no comparative framing, faithful to the real product

Agreed with the user after first review (three points: too much Arc/Arcify; the site didn't
match the real extension; copy too abstract/corny). Captured here per the deviation policy.

- [x] 8.1 Drop the Arc/Arcify positioning + beachhead beats: delete `Positioning.svelte` and
  `Wedge.svelte`; remove them from `+page.svelte`; trim the footer credit to one quiet line.
- [x] 8.2 Rewrite all copy plain and product-focused (hero, chapters, trust, FAQ, close, meta);
  remove the italic accent-word flourishes.
- [x] 8.3 Inspect the shipping product (built + launched the extension via Playwright;
  screenshotted the real sidebar + new-tab) and rebuild `StageWindow.svelte` to match it:
  top search pill, favicon grid, serif Space header, pinned + temp tabs, the real 3px gradient
  leading bar, the bottom Space switcher, and the new-tab identity.
- [x] 8.4 Use the extension's real nine-colour palette for the example Spaces, the mocks
  (`TabRowMock` leading bar + `--space-c`, `FaviconTileMock`), the chapter visuals, and the OG
  dots. Scope the colour morph to the staged window (page chrome stays ember; CTA stays AA).
- [x] 8.5 Update the `marketing-site` spec delta (remove the positioning/beachhead requirement;
  reword the live-demo requirement to the staged preview + real palette), the proposal, the
  design (incl. Visual language), and the docs; re-run `verify` + root `pnpm verify`.

## 9. Follow-ups (post-review)

- [x] 9.1 Rename the user-facing "favicon row" to "Favourites" (chapter 4 + FAQ); present
  favourites (global shortcuts) and pinned tabs (per-Space) as distinct features that share the
  bookmark plumbing.
- [x] 9.2 Favourites show no "selected" state (removed the `live`/`active` rings from the
  favicon rows); make the favourites row visually distinct from the bottom Space switcher
  (bigger neutral plates vs small dimmed colour chips) and give the active switcher chip a
  Space-colour ring so it reads as selected regardless of the colour's lightness.
- [x] 9.3 Consolidate the duplicated product-mock pieces into small primitives so the sidebar
  depiction lives in one place: `mocks/SpaceHeader.svelte`, `mocks/FaviconGrid.svelte`, and a
  `.space-scope` utility; refactor `StageWindow` + `Chapters` to compose them (output
  unchanged, verify green).
