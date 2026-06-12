# Own the search space: SEO foundation + Arc/Arcify positioning

## Why

The landing page can be beautiful and still be invisible: today it ships no
`robots.txt`, no `sitemap.xml`, no canonical link, no structured data, only a
favicon SVG, and copy that never names the category it belongs to — so a search
engine has little to index and a person searching "Arc alternative for Chrome"
or "vertical tabs Chrome extension" never finds it. The user-visible value is
**discovery → acquisition**: a person who wants exactly what Lunma is should be
able to find it. Lunma is uniquely placed to capture the wave of people leaving
or priced-out of Arc and evaluating stop-gaps like Arcify — "Arc-style Spaces in
the Chrome you already use, no account, open source." This change gives the site
the technical SEO foundation to be indexed and the honest, competitor-aware
positioning content to rank for and win those high-intent searches.

## What Changes

- **Technical SEO files** (new, in `apps/site/static/` + prerendered head):
  `robots.txt` (allow crawl, declare the sitemap), `sitemap.xml` (the canonical
  URLs), a `site.webmanifest` (name/short_name/theme/icons), and a `<link
  rel="canonical">` on every page. Canonical origin is `https://lunma.app`
  (already the OG origin).
- **Structured data + meta completeness.** A reusable JSON-LD block emits
  `SoftwareApplication` (Lunma: BrowserApplication, Chrome/Edge, free),
  `WebSite`, and `FAQPage` (derived from the on-page FAQ) for rich results; the
  `<head>` gains canonical, `og:site_name`/`og:locale`/`og:image:width/height/
  alt`, `twitter:site`, and keyword-tuned `<title>`/`description` targeting the
  category ("Arc-style Spaces", "vertical tabs for Chrome", "Arc alternative").
- **Nav → a single "Features" link.** The arbitrary "Spaces" + "Launcher" nav
  links (which omit Auto-archive + Favourites) collapse into one **Features**
  anchor reaching the features band; the chapters keep their own ids for
  deep-linking.
- **Positioning content (names the category, in the brand voice — not a matrix).**
  A new **"Coming from Arc?"** section (`FromArc.svelte`) names the lineage and
  Lunma's own footing in the brand voice (Arc-style Spaces, in the Chrome you
  already use; open source; no account; no lock-in; same Space in many windows),
  and the FAQ gains entries that answer the alternative-seeker's questions
  ("How is Lunma different from Arc?", "Is this like Arcify?"). These rank for
  the "Arc alternative" intent and feed the `FAQPage` rich-results, and they
  surface the under-marketed strengths (no lock-in, multi-window same Space).
  Decided against a competitor **comparison matrix**: it is more combative and
  higher-upkeep than the calm/editorial brand wants, and it would sit awkwardly
  next to the existing gracious Arcify inspiration credit — which the recorded
  2026-06-07 decision (Arc-first messaging; Arcify as credit only) keeps. Arcify
  stays the footer credit; it is named graciously in the FAQ, not ranked.

## Capabilities

### New Capabilities

*(none)*

### Modified Capabilities

- `marketing-site`: gains requirements for **crawlability + machine-readable
  metadata** (robots/sitemap/canonical/structured-data) and for **honest
  positioning** (a "Coming from Arc?" beat + FAQ that names the category in the
  brand voice, factually, crediting rather than ranking the tool it was inspired
  by); the existing nav/anchor requirement is modified for the single "Features"
  link.

## Impact

- **Affected code (site only):**
  - New: `apps/site/static/robots.txt`, `apps/site/static/sitemap.xml`,
    `apps/site/static/site.webmanifest`, `apps/site/static/icons/icon-{16,32,48,128}.png`
    (the extension's exact brand icons); `apps/site/src/lib/Seo.svelte` (head
    meta + canonical + JSON-LD), `apps/site/src/lib/FromArc.svelte` (the
    "Coming from Arc?" positioning beat), and `apps/site/src/lib/seo.ts` (the
    canonical `SITE_URL`, the tuned title/description, the FAQ data, and the
    structured-data builders).
  - Modified: `apps/site/src/routes/+page.svelte` (compose `Seo` + `FromArc`,
    keyword-tuned title/description, `#features` wrapper), `apps/site/src/app.html`
    (manifest + mask icon links), `apps/site/src/app.css` (`#features`
    scroll-margin), `apps/site/src/lib/Nav.svelte` (Features link), and
    `apps/site/src/lib/Faq.svelte` (renders from `FAQ_ENTRIES`; gains the
    sync/no-lock-in + Arc/Arcify entries).
- **New public surface:** `Seo.svelte`, `FromArc.svelte`, `seo.ts`
  (`SITE_URL`, `SITE_NAME`, `SITE_TITLE`, `SITE_DESCRIPTION`, `OG_*`,
  `FAQ_ENTRIES`, `softwareAppLd()`, `webSiteLd()`, `faqPageLd()`), three static
  files. No new dependencies; no extension changes. (No comparison matrix /
  `COMPARISON` data — see the positioning bullet.)
- **`src/ui/` primitives:** none — `apps/site` cannot import the extension's
  `ui/`; `Compare`/`Seo` are the site's own components composing `@lunma/tokens`
  tokens/recipes directly, consistent with the other site components.
- **Brand icons:** the site now ships the extension's exact icon PNGs
  (`icon-16/32/48/128.png`, generated from the canonical `favicon.svg` mark) in
  `apps/site/static/icons/`, wired as sized PNG favicons + `apple-touch-icon` +
  manifest icons — so the site and extension show the **same** mark, including the
  extension's small-size rule (ember dot at 16px, full alcove-arch at 32px+). The
  `favicon.svg` stays as the Safari `mask-icon`. (Surfaced by review: the site's
  SVG-only favicon smudged the arch at tab size.)
- **Assets / `[VERIFY]`:** canonical origin `https://lunma.app` and the
  `[VERIFY]` store/repo URLs in `links.ts` feed the sitemap + `SoftwareApplication`
  `downloadUrl`; they stay `[VERIFY]` until launch. Remaining icon `[VERIFY]`:
  larger maskable PWA icons (192/512) and the `og.png` intrinsic dimensions — no
  new build dependency is added.
- **Docs:** no `docs/01`–`06` change (the marketing site is not specified
  there); `the release notes` is updated to tick the SEO items and
  carry the remaining `[VERIFY]` asset/url placeholders. The `marketing-site`
  spec delta is the artifact-of-record update.
- **Verification:** `pnpm --filter @lunma/site verify` (biome, svelte-check, the
  WCAG-AA contrast test — the comparison section must hold AA — and the
  prerender build, which must emit the static SEO files and valid JSON-LD).
