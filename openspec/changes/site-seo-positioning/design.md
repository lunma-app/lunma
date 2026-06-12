# Design — site-seo-positioning

## Context

The site is a SvelteKit + `adapter-static` prerender. Its current
discoverability surface is minimal: `app.html` carries charset/viewport/
color-scheme/theme-color + the SVG favicon, and `+page.svelte` injects
`<title>`, a description, and basic OG/Twitter tags (origin `https://lunma.app`).
There is no `robots.txt`, `sitemap.xml`, canonical link, web manifest, or
structured data, and the copy never names its category, so the page cannot rank
for the searches its ideal user actually types. Meanwhile the strongest
acquisition vector is positional: Arc-style Spaces, delivered as a Chrome/Edge
extension, for the audience evaluating Arc and stop-gaps like Arcify. The store
and repo URLs in `links.ts` are still `[VERIFY]` placeholders (pre-launch).

## Goals / Non-Goals

**Goals:**

- The site is fully crawlable and emits machine-readable metadata (robots,
  sitemap, canonical, JSON-LD) so search and social render it richly.
- The page ranks for and wins category searches ("Arc alternative for Chrome",
  "vertical tabs Chrome", "Arc-style Spaces") via tuned meta + honest,
  competitor-named positioning content.
- The nav reads coherently (one "Features" entry, not an arbitrary two).

**Non-Goals:**

- No new runtime/build dependency (no image-resize lib, no SEO framework); the
  static files are authored, the JSON-LD is a string template.
- No fabricated competitor claims, no aggregate ratings/review counts we don't
  have, no keyword-stuffing. Honest, verifiable, fair-use comparison only.
- No paid raster-icon pipeline in this change — the manifest references the
  existing SVG icon; the apple-touch/maskable PNG set is flagged as an asset.
- No change to the extension or `@lunma/tokens`.

## Decisions

**D1 — Static SEO files in `static/`, not prerendered endpoints.** The site has
two routes; a hand-authored `robots.txt`, `sitemap.xml`, and `site.webmanifest`
in `apps/site/static/` are copied verbatim by `adapter-static` with zero build
machinery. Alternative — a `/sitemap.xml/+server` endpoint — adds prerender-
endpoint config for a file that changes only when routes do. Rejected as
over-engineering for a ~1-page marketing site.

**D2 — One `Seo.svelte` owns `<head>` truth + JSON-LD; `seo.ts` owns the data.**
`+page.svelte` composes `<Seo …/>` which renders canonical + the completed OG/
Twitter set + `<script type="application/ld+json">`. The structured-data
builders (`softwareAppLd`, `webSiteLd`, `faqPageLd`) and the canonical
`SITE_URL` live in `seo.ts` so the JSON-LD is generated from the same data the
page renders (the `FAQPage` is built from the same FAQ entries the `Faq`
component shows — no drift between visible and structured content, which Google
requires). Alternative — inline JSON in markup — risks the structured data
describing content the page doesn't show.

**D3 — `SITE_URL = 'https://lunma.app'` is the single canonical origin.** Already
the OG origin; centralised in `seo.ts` and consumed by canonical, sitemap, and
JSON-LD so the origin is defined once. Kept `[VERIFY]` alongside the existing
`links.ts` placeholders until the domain is confirmed at launch.

**D4 — Nav "Features" targets a `#features` wrapper, chapters keep their ids.**
`+page.svelte` wraps `<Chapters/>` in `<section id="features">` (with
`scroll-margin-top` for the sticky nav); the single nav "Features" link points
there. The individual chapters keep `id="spaces"`/`id="launcher"` for deep
links. Alternative — point "Features" at `#spaces` — couples the label to one
chapter and reads oddly. The `marketing-site` keyboard/anchor requirement is
updated to match (the "Spaces anchor" scenario becomes a "Features anchor"
scenario).

**D5 — Positioning is a brand-voice "Coming from Arc?" beat + FAQ, not a
competitor matrix (decided after review).** A feature-comparison table was
considered and rejected: it is more combative and higher-upkeep than the calm,
editorial brand; it foregrounds competitors on Lunma's own page; pre-launch it
reads as insecure; and it would sit badly next to the gracious Arcify
inspiration credit the recorded 2026-06-07 decision keeps. Instead, positioning
ships as `FromArc.svelte` — a short section naming Arc and the lineage in the
brand voice (Arc-style Spaces in the browser you already use; open source; no
account; no lock-in; same Space in many windows) — plus FAQ entries ("How is
Lunma different from Arc?", "Is this like Arcify?") that carry the point-by-point
answers. This captures the same "Arc alternative" search intent (and feeds the
`FAQPage` rich-results) with no matrix to keep factually current, and it keeps
Arcify a credited inspiration (footer + a gracious FAQ mention), never a ranked
column. Competitive claims live only in the FAQ prose and are factual (what
Lunma is, not value-judgements of others).

**D6 — Meta is tuned, not stuffed.** `<title>` and description name the category
and the top query intent once each, in natural language ("Lunma — Arc-style
Spaces & vertical tabs for Chrome"; description naming "Arc alternative", "no
account", "open source"). No `<meta name="keywords">` spam (ignored by Google,
reads as low-quality). The honest comparison content carries the long-tail.

**D7 — Brand icons reuse the extension's exact PNG set; the site favicon follows
the extension's small-size rule.** Review surfaced that the site's SVG-only
favicon smudged the alcove arch at the 16px tab size, while the extension's
toolbar shows a clean ember dot there. The extension already generates
`icon-16/32/48/128.png` from the canonical `favicon.svg` mark
(`apps/extension/scripts/gen-app-icons.mjs`), so the site now ships those exact
PNGs (`apps/site/static/icons/`) as its sized favicons + `apple-touch-icon` +
manifest icons — the tab follows the same rule (ember dot @16, full alcove-arch
@32+), and both surfaces show the identical brand. `favicon.svg` stays the Safari
`mask-icon`. Alternative — keep the SVG-only favicon — leaves tab/toolbar
mismatched and apple-touch/raster deferred. Trade-off: the PNGs are derived
copies of the shared mark; if `favicon.svg` changes, both apps regenerate (the
status quo — the extension's PNGs are committed, not built). Remaining `[VERIFY]`:
the larger maskable 192/512 PWA icons.

## Visual language

A new user-visible surface (the "Coming from Arc?" positioning beat) ships here;
it lands at the page's bar by composing the same tokens as the other editorial
sections — no new vocabulary, no re-rolled primitives, no matrix:

- **Layout & hierarchy:** a centred `wrap-narrow` section — the global `.kicker`
  eyebrow (ember dot + tracked caps in the accent), a display-serif `<h2>`, and a
  `--text-muted` body line — the same rhythm as the closing CTA and the chapters,
  so it reads as one more calm editorial beat rather than an interruption.
- **Colour / type:** the global `.kicker` accent + ember dot, the display-serif
  heading, the body sans at `--text-lg`/`--text-muted`; no new colours.
- **Motion:** the existing `use:reveal` scroll-in; reduced-motion inherited.
- **Interaction feedback:** none — it is editorial copy (the page's existing CTAs
  carry the actions); no new interactive primitive.
- **Atmosphere:** inherits the page aurora/glass; adds no backdrop of its own.
- **Contrast:** `--text-muted` over `--bg` is the pairing the chapters' body copy
  already uses (AA per the contrast test); there is no emphasised-wash cell to
  police.

## Risks / Trade-offs

- **[Risk] A wrong claim about Arc/Arcify is unfair.** → D5: competitive claims
  live only in factual FAQ prose (what Lunma *is*, not value-judgements of
  others), Arcify is credited rather than ranked, and there is no matrix
  asserting a grid of competitor specifics to keep accurate over time.
- **[Risk] JSON-LD describing content the page doesn't show is a Google
  violation.** → D2: the `FAQPage` is generated from the same entries the `Faq`
  component renders; `SoftwareApplication` carries no fabricated rating.
- **[Risk] Canonical/sitemap pointing at the wrong origin hurts indexing.** →
  D3: one `SITE_URL`, `[VERIFY]` until the domain is confirmed; the prerender
  build emits the files so a wrong value is caught in review, not in the wild.
- **[Trade-off] Authored static SEO files can drift from routes.** Accepted for
  a ~1-page site; `the release notes` carries the review item.
