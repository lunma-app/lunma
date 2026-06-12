# marketing-site — delta for site-seo-positioning

## ADDED Requirements

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

## MODIFIED Requirements

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
