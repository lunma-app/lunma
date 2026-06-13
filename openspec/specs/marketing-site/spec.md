# marketing-site Specification

## Purpose
The marketing site (`apps/site`, deployed at `lunma.app`) is a statically-prerendered SvelteKit page that communicates Lunma's value proposition to prospective users. It renders above-the-fold product identity using the shared `@lunma/tokens` design language and presents a primary call-to-action to install the extension from the Chrome Web Store. It is build-time only and ships no code into the extension bundle.
## Requirements
### Requirement: Immediately legible value proposition

The landing page (`apps/site`) SHALL communicate what Lunma is and its primary user value within the first viewport ("above the fold"), led by an Instrument-Serif display headline. A first-time visitor SHALL be able to tell what the product does without scrolling.

#### Scenario: The hero states the product and its value

- **WHEN** the landing page first paints on a desktop or mobile viewport
- **THEN** a headline and a one-sentence subhead naming Lunma and its core value (Arc-style Spaces, a keyboard launcher, tabs that put themselves away) are visible without scrolling
- **AND** the headline is rendered in the Instrument-Serif display token from `@lunma/tokens`

### Requirement: Primary install call-to-action to the Chrome Web Store

The page SHALL present a prominent install call-to-action linking to the Lunma Chrome Web Store listing, reachable both in the hero and from a persistent location (sticky nav or a repeated CTA) as the page scrolls. A link to the public source repository SHALL also be present.

#### Scenario: The install CTA is always reachable

- **WHEN** a visitor is anywhere on the page
- **THEN** an install CTA pointing at the Chrome Web Store listing is visible or one scroll away (hero + persistent nav/repeat)
- **AND** a link to the open-source repository is present (e.g. in the nav or footer)

#### Scenario: The CTA is the highest-emphasis action

- **WHEN** the hero is in view
- **THEN** the install CTA is the single highest-emphasis interactive element (accent fill + glow from `@lunma/tokens`), distinct from secondary links

### Requirement: Local-only, no-account, open-source trust signals

The page SHALL explicitly communicate the product's trust posture — local-only (data stays in the browser), no account or sign-up required, works offline, and open-source — so a privacy-conscious visitor gains confidence to install.

#### Scenario: Trust posture is stated, not implied

- **WHEN** a visitor reads the page
- **THEN** copy explicitly states local-only / no-account / open-source
- **AND** the open-source claim links to the public repository

### Requirement: Composes the shared design language, not a copy

The site SHALL render Lunma's visual identity by composing the shared `@lunma/tokens` package (the same design tokens, fonts, and atmospheric recipes the extension ships), NOT a hand-mirrored copy of token values. Brand stays in lockstep with the product by construction.

The site's staged product previews (the mock components rendering sidebar tab rows, favourite tiles, the Space header, and the launcher) SHALL render the same token-derived treatments as the extension components they mirror — the `--space-c-soft` selection wash, the borderless `--surface` tile plate, the drift dot ringed in the surrounding substrate, the **Space header rendered as the real `SectionHeader` row** (a hue-tinted glyph at the favicon column and the name at `--weight-medium`/`--text-base`/`--font-sans` sentence-case, tinted `oklch(from var(--space-c) max(l, 0.72) c h / 0.95)` — NOT a display-serif headline, glow, or filled colour tile), and the launcher's `--row-h` row geometry, `--accent-soft` wash-only selection (no accent bar, matching the launcher overlay and the sidebar tab row), and `--surface-2` source badge — and SHALL NOT hand-code a design literal where a shared token or a scoped substrate variable exists. Decorative browser chrome framing a preview (titlebar, omnibox, window proportions) is illustration, not product UI, and is exempt.

#### Scenario: Tokens are imported, not mirrored

- **WHEN** the site's styles are built
- **THEN** colour, type, radii, motion, and the aurora/glass/glow atmosphere resolve from `@lunma/tokens`
- **AND** the page contains no second, hand-maintained definition of those token values

#### Scenario: Product previews match the real components' treatments

- **WHEN** a staged preview renders a product element that exists in the extension (a tab row, a favourite tile, the Space header, a launcher row or badge)
- **THEN** its rendered-at-rest treatment (selection wash, borders, glow, ring, fill, type role, and token-derived spacing) matches the extension component it mirrors
- **AND** the Space header reads as a hue-tinted sans row (the real `SectionHeader` treatment), not a display-serif headline with a glow or a filled colour tile
- **AND** no design value in that preview is a hand-coded literal where a `@lunma/tokens` token or a scoped substrate variable exists

#### Scenario: The page's atmosphere inherits the shared default

- **WHEN** the page renders the shared aurora recipe as its backdrop
- **THEN** the aurora's opacity resolves from the `@lunma/tokens` default rather than a site-local override

### Requirement: The product's colour-coded Spaces are demonstrated live

The landing page SHALL demonstrate Lunma's colour-coded Spaces interactively within the
first viewport: a control to switch between example Spaces SHALL recolour a staged preview of
the product (the sidebar and new-tab identity) through the shared Space hue/lightness/chroma,
so the colour identity is shown rather than only described. The example Spaces and their
colours SHALL be drawn from the product's real Space palette. Switching an example Space SHALL
also swap that Space's own tab list (its pinned and temporary rows) in the staged sidebar, so
the demonstration shows that each Space keeps its own tabs and not only its own colour. The
staged sidebar's global favourites row SHALL stay constant across Spaces, reflecting that
favourites are Space-independent in the product. This live demonstration is
decorative motion and SHALL obey the page's reduced-motion contract (no auto-advancing loop
when reduced; switching remains available and the end state is identical), and it SHALL NOT
reduce any text below WCAG-AA contrast.

#### Scenario: Switching an example Space recolours the staged preview

- **WHEN** a visitor selects a different example Space
- **THEN** the staged product preview (the sidebar and the new-tab identity) recolours to that
  Space's colour from the real palette

#### Scenario: Switching an example Space swaps that Space's tabs but not the favourites

- **WHEN** a visitor selects a different example Space
- **THEN** the staged sidebar's tab rows change to that Space's own pinned and temporary tabs
- **AND** the global favourites row above the Space header stays the same across Spaces

#### Scenario: The live demo honors reduced motion

- **WHEN** a visitor with `prefers-reduced-motion: reduce` loads the page
- **THEN** the example-Space control does not auto-advance and the recolour is applied without
  a decorative transition, while remaining usable and legible

### Requirement: Accessible and statically delivered

All motion on the page SHALL be gated behind `prefers-reduced-motion: reduce` (no parallax, no auto-playing loops when reduced), and text and interactive-element contrast SHALL meet WCAG-AA. The site SHALL be delivered as prerendered static output with no account, server, or runtime backend — consistent with the product's offline-first ethos.

#### Scenario: Reduced motion is honored

- **WHEN** a visitor with `prefers-reduced-motion: reduce` loads the page
- **THEN** decorative motion (parallax, the auto-playing Space-hue demo loop) is disabled or reduced to a non-animated state
- **AND** the page remains fully usable and legible

#### Scenario: Contrast meets WCAG-AA

- **WHEN** any text or interactive element is rendered on its background
- **THEN** the contrast ratio meets WCAG-AA for that text size

#### Scenario: The site is static

- **WHEN** the site is built for deployment
- **THEN** it produces prerendered static output deployable to a static host (no server-side runtime), bound to `lunma.app`

### Requirement: The auto-rotating Space demo is pausable and viewport-gated

The staged preview's automatic Space rotation SHALL run only while the stage
window is in the viewport (an `IntersectionObserver` gate — no rotation work
off-screen), SHALL pause while the pointer is over the stage or focus is
within it, SHALL stop permanently once the user manually picks a Space (the
existing behaviour), and SHALL never auto-rotate when
`prefers-reduced-motion: reduce` is active. Manual Space switching remains
available in all of these states.

#### Scenario: Hover pauses the rotation

- **WHEN** the visitor rests the pointer on the staged preview
- **THEN** automatic Space rotation pauses until the pointer leaves

#### Scenario: Off-screen stage does no rotation work

- **WHEN** the visitor scrolls past the hero so the stage leaves the viewport
- **THEN** the rotation timer is stopped (no recolour repaints occur) until the
  stage re-enters the viewport

#### Scenario: Reduced motion never auto-rotates

- **WHEN** `prefers-reduced-motion: reduce` is active
- **THEN** the demo does not auto-rotate, and switching Spaces manually still
  recolours the preview

### Requirement: Keyboard and platform accessibility affordances

The landing page SHALL provide: (a) a skip-to-content link as the first
focusable element, visually hidden until focused, targeting the main content;
(b) the hero — including the `<h1>` and primary CTAs — inside the `<main>`
landmark; (c) `scroll-margin-top` on every nav anchor target so sections do
not land beneath the sticky nav; (d) `<link rel="preload">` hints for the
brand font files used at first paint (the display serif the `<h1>` renders
and the body sans), eliminating the first-paint serif reflow; (e) nav links
that remain reachable at viewport widths ≤720px (a compact link row — links
are never `display: none` without a replacement); (f) a
`<meta name="theme-color">` matching the dark substrate; and (g) a single
"Features" nav anchor targeting the features section (the chapters band, which
owns `id="features"`), with the individual feature chapters keeping their own
ids (`id="spaces"`, `id="launcher"`) for deep-linking and the hero demo keeping
a distinct id. The decorative mock content inside the staged preview SHALL be
hidden from assistive technology (the caption and the functional Space switcher
stay exposed), and ARIA labels SHALL NOT be placed on generic elements without
a role.

#### Scenario: Skip link bypasses the nav

- **WHEN** a keyboard user presses Tab on a fresh page load
- **THEN** the first focused element is a visible "Skip to content" link
- **AND** activating it moves focus/scroll to the main content

#### Scenario: Anchored sections clear the sticky nav

- **WHEN** the visitor clicks a nav anchor (e.g. "Features")
- **THEN** the target section's heading lands fully below the sticky nav bar

#### Scenario: Nav links survive mobile widths

- **WHEN** the page renders at a 390px-wide viewport
- **THEN** every nav destination remains reachable from the nav (no link is
  hidden without a replacement)

#### Scenario: The Features anchor reaches the features section

- **WHEN** the visitor clicks "Features" in the nav from the bottom of the page
- **THEN** the page scrolls to the features section (the first feature chapter), not the hero demo

#### Scenario: Mock content is not read as page content

- **WHEN** a screen reader traverses the staged preview
- **THEN** the mock sidebar's tab titles and labels are not announced; the
  caption and the functional Space switcher are

### Requirement: Crawlable with machine-readable metadata

The site SHALL be fully crawlable and SHALL emit machine-readable metadata so search engines and social platforms can index and richly render it. It SHALL serve a `robots.txt` that permits crawling and declares the sitemap, an XML `sitemap.xml` listing the site's canonical URLs, a `<link rel="canonical">` on every page resolving from a single canonical origin, and a web manifest. Each page SHALL carry a complete Open Graph + Twitter card set (title, description, type, url, image with dimensions and alt, site name, locale) and SHALL embed JSON-LD structured data describing the product as a `SoftwareApplication`, the site as a `WebSite`, and the on-page FAQ as a `FAQPage`. The structured data SHALL describe only content the page actually renders, and SHALL NOT assert fabricated ratings or review counts.

#### Scenario: Crawl directives and sitemap are served

- **WHEN** a crawler requests `/robots.txt`
- **THEN** crawling is permitted and the response declares the `sitemap.xml` location
- **AND** `/sitemap.xml` is valid XML listing the site's canonical URLs under the single canonical origin

#### Scenario: Pages declare a canonical and complete social metadata

- **WHEN** a page is built
- **THEN** its `<head>` contains a `<link rel="canonical">` to its canonical URL
- **AND** a complete Open Graph + Twitter card set (title, description, type, url, image with dimensions + alt, site name, locale)

#### Scenario: Structured data matches visible content

- **WHEN** the page emits JSON-LD
- **THEN** it includes `SoftwareApplication`, `WebSite`, and a `FAQPage` whose questions and answers are the same ones the on-page FAQ renders
- **AND** it asserts no rating or review count the product does not have

### Requirement: Honest positioning for alternative-seekers

The site SHALL position Lunma within its category for people arriving from Arc (and Arc-style tools) by naming the lineage in the brand voice and answering the alternative-seeker's questions factually, rather than by a competitor comparison matrix. It SHALL include a positioning section that names Arc and states Lunma's own footing (an extension for the Chrome/Edge you already use, open source, no account, nothing locked in), and FAQ entries answering how Lunma differs from Arc and how it relates to the Arc-style extension it credits. Every claim SHALL be factual (what Lunma is, not a value-judgement or disparagement of another tool), and the tool Lunma credits as its inspiration SHALL be credited, not ranked against. The positioning content SHALL render at the page's visual bar and hold WCAG-AA contrast.

#### Scenario: The page positions Lunma for people coming from Arc

- **WHEN** a visitor reaches the positioning section
- **THEN** it names Arc and states Lunma's own footing (a Chrome/Edge extension, open source, no account, no lock-in) in the brand voice
- **AND** the FAQ answers "how is Lunma different from Arc?" and the relation to the Arc-style extension, factually

#### Scenario: The credited tool is credited, not ranked

- **WHEN** the site references the Arc-style extension it was inspired by
- **THEN** it appears as a credit and a gracious factual FAQ mention, not as a competitor ranked against Lunma

### Requirement: Pinned tabs are positioned as app-like and demonstrated

The features section SHALL include a beat that presents Lunma's pinned tabs as
**app-like** — a pinned site stays on its own page, and a link that leads off that
site opens in a **new tab** beside it rather than carrying the pinned view away. The
beat SHALL render in the shared editorial-chapter form (a numbered chapter with a
kicker, a display heading, copy, and a staged product visual) and compose the shared
design language (`@lunma/tokens` + the site's own mock components), not re-roll
primitives.

The claim SHALL be **factual** and stated in the brand voice: it describes the
product's actual click-time behaviour and SHALL NOT overclaim a hard sandbox (it is
a click-time affordance, not a guarantee against every navigation). To avoid
colliding with the site's "nothing is locked in" trust message, the beat SHALL NOT
use the word **"lock"** (or "locking"/"locked") to name the behaviour; it SHALL
frame it as pinned-tabs-as-apps / staying-in-place instead. The beat SHALL hold
WCAG-AA contrast and SHALL introduce no motion that violates the page's
reduced-motion contract.

The staged visual SHALL show the behaviour rather than only assert it: a pinned tab
that stays put alongside a separate, freshly-opened tab representing the off-site
link that was diverted.

#### Scenario: The features section presents pinned tabs as app-like

- **WHEN** a visitor reaches the features section
- **THEN** a chapter SHALL present pinned tabs as app-like — a pinned site stays on its page, and an off-site link opens in a new tab beside it
- **AND** the chapter SHALL render in the shared editorial-chapter form composing the shared design language

#### Scenario: The beat is factual and avoids the "lock" framing

- **WHEN** the pinned-tabs beat renders its copy
- **THEN** the copy SHALL describe the product's actual click-time behaviour without overclaiming a hard sandbox
- **AND** it SHALL NOT use the word "lock" / "locking" / "locked" to name the behaviour (so it does not collide with the "nothing is locked in" trust message)

#### Scenario: The staged visual shows the stay-put behaviour

- **WHEN** the pinned-tabs beat renders its visual
- **THEN** it SHALL show a pinned tab that stays put alongside a separate freshly-opened tab standing in for the diverted off-site link
- **AND** all text in the visual SHALL hold WCAG-AA contrast

### Requirement: Smart folders are positioned as a live-queue platform and demonstrated

The features section SHALL include a beat that presents Lunma's **smart folders** as a
**live-queue capability** — a pinned folder whose contents are live items pulled from a
service the visitor keeps checking, refreshed on their own — framed as the general
capability with a **GitLab review queue** shown as the concrete example. The beat SHALL
render in the shared editorial-chapter form (a numbered chapter with a kicker, a display
heading, copy, and a staged product visual) and compose the shared design language
(`@lunma/tokens` + the site's own mock components), not re-roll primitives.

The claim SHALL be **factual** and stated in the brand voice. The page SHALL name the
connectors that ship — **GitLab and GitHub** — and SHALL NOT name or imply that any other
connector (for example Jira, Notion, or a calendar) is available. A calm, name-free and
date-free indication that further connectors are planned is permitted; naming an unshipped
connector or promising a date is not. The copy SHALL state that smart folders work with a
self-hosted instance and that data stays on the visitor's device (no Lunma server),
consistent with the shipped connectors. The beat SHALL hold WCAG-AA contrast and SHALL
introduce no motion that violates the page's reduced-motion contract.

The staged visual SHALL show the capability rather than only assert it: a smart-folder
header with an item count over merge-request rows, each row carrying exactly one
pipeline-status indicator (no more than one status mark per row), in keeping with the
product's one-glyph restraint.

#### Scenario: The features section presents smart folders as a live queue

- **WHEN** a visitor reaches the features section
- **THEN** a chapter SHALL present smart folders as a live queue pinned in the Space, with a GitLab review queue shown as the example
- **AND** the chapter SHALL render in the shared editorial-chapter form composing the shared design language

#### Scenario: The beat names the connectors that ship

- **WHEN** the smart-folders beat renders its copy
- **THEN** it SHALL name GitLab and GitHub as the available connectors
- **AND** it SHALL NOT name or imply any unshipped connector (Jira, Notion, calendar, etc.) is available
- **AND** any indication of future connectors SHALL be name-free and date-free

#### Scenario: The beat frames smart folders as local and self-hostable

- **WHEN** the smart-folders beat renders its copy
- **THEN** it SHALL state that smart folders work with a self-hosted instance
- **AND** it SHALL state that the data stays on the visitor's device with no Lunma server

#### Scenario: The staged visual shows the queue with one status mark per row

- **WHEN** the smart-folders beat renders its visual
- **THEN** it SHALL show a smart-folder header with an item count over merge-request rows
- **AND** each row SHALL carry exactly one pipeline-status indicator, never more than one
- **AND** all text in the visual SHALL hold WCAG-AA contrast

