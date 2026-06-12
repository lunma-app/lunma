# Tasks — site-seo-positioning

## 1. SEO data module

- [x] 1.1 Create `apps/site/src/lib/seo.ts`: `SITE_URL = 'https://lunma.app'` (`[VERIFY]`), `SITE_NAME`, tuned `SITE_TITLE`/`SITE_DESCRIPTION`, `OG_*`, and structured-data builders `softwareAppLd()`/`webSiteLd()`/`faqPageLd()`. No fabricated rating.
- [x] 1.2 Export `FAQ_ENTRIES` from `seo.ts` so `Faq.svelte` and `faqPageLd()` render from one source (moved the hard-coded entries here + a sync/no-lock-in entry).

## 2. Static crawl + manifest files

- [x] 2.1 `apps/site/static/robots.txt` (allow all, declares sitemap).
- [x] 2.2 `apps/site/static/sitemap.xml` (canonical `https://lunma.app/`).
- [x] 2.3 `apps/site/static/site.webmanifest` (name/short_name/theme/background/display + the shared PNG + SVG icon set).

## 3. Head metadata + structured data

- [x] 3.1 `apps/site/src/lib/Seo.svelte`: canonical + complete OG/Twitter set + three JSON-LD blocks (SoftwareApplication, WebSite, FAQPage) from trusted in-repo data.
- [x] 3.2 `+page.svelte`: compose `<Seo />`; tuned title/description from `seo.ts`; removed the duplicate OG/Twitter `Seo` now owns.
- [x] 3.3 `app.html`: the shared brand icon set — sized PNG favicons (16/32/48), `apple-touch-icon` (128), `mask-icon` (SVG), `manifest`. (See §7 — icons now match the extension.)

## 4. Nav → single "Features"

- [x] 4.1 `+page.svelte`: wrap `<Chapters />` in `<section id="features">`; added `#features` to the `scroll-margin-top` rule in `app.css`.
- [x] 4.2 `Nav.svelte`: one `Features` link (`href="#features"`); chapters keep ids for deep-linking.

## 5. Positioning — "Coming from Arc?" beat + FAQ (decided over a matrix)

> Decided after review (with the user): ship a brand-voice positioning beat + FAQ, **not** a competitor comparison matrix — lower upkeep, on-brand, and it keeps the gracious Arcify inspiration credit (2026-06-07 decision) rather than ranking it. Artifacts updated to match.

- [x] 5.1 `apps/site/src/lib/FromArc.svelte`: a centred "Coming from Arc?" section (global `.kicker` + display-serif `<h2>` + `--text-muted` body) naming Arc and Lunma's footing (Chrome/Edge extension, open source, no account, no lock-in, same Space in many windows). `use:reveal`; composes tokens only.
- [x] 5.2 Place `<FromArc />` in `+page.svelte` (after the features band, before the trust band).
- [x] 5.3 `Faq.svelte` renders from `FAQ_ENTRIES`; added "How is Lunma different from Arc?" and "Is this like Arcify?" (gracious credit) — both flow into the `FAQPage` JSON-LD automatically.
- [x] 5.4 (No comparison matrix; the Arcify footer credit is unchanged.)

## 6. Launch checklist + verify

- [x] 6.1 Updated `the release notes`: added an SEO section (foundation ticked) + ticked the favicon asset item; carried the remaining `[VERIFY]` (domain, store/repo URLs, og.png dims, 192/512 maskable icons, Search Console submission).
- [x] 6.2 `pnpm --filter @lunma/site verify` → exit 0 (biome, svelte-check 0 errors/0 warnings, 20 tests incl. WCAG contrast, prerender build). Re-run after §6.1 + §7.
- [x] 6.3 Confirmed in `build/`: `robots.txt`/`sitemap.xml`/`site.webmanifest` present; `index.html` has canonical, full OG/Twitter, 3 JSON-LD blocks (FAQPage now 7 Qs incl. Arc/Arcify), the `FromArc` section, and a single `#features` nav link.

## 7. Brand icon parity with the extension

- [x] 7.1 Copy the extension's exact icon PNGs (`icon-16/32/48/128.png`, generated from the canonical `favicon.svg` mark) into `apps/site/static/icons/` so site + extension ship identical brand icons.
- [x] 7.2 Wire `app.html` to the sized PNGs as the favicon (ember-dot at 16px, full alcove-arch mark at 32px+ — the extension's own small-size rule), `apple-touch-icon` (128), and the manifest icons; keep `favicon.svg` for the Safari `mask-icon`. Resolves the deferred apple-touch/raster-icon `[VERIFY]`.
