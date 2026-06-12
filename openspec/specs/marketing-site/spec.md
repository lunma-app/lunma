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

The site's staged product previews (the mock components rendering sidebar tab rows, favourite tiles, and the launcher) SHALL render the same token-derived treatments as the extension components they mirror — the `--space-c-soft` selection wash, the borderless `--surface` tile plate, the drift dot ringed in the surrounding substrate, and the launcher's `--row-h` row geometry, `--accent-soft` wash-only selection (no accent bar, matching the launcher overlay and the sidebar tab row), and `--surface-2` source badge — and SHALL NOT hand-code a design literal where a shared token or a scoped substrate variable exists. Decorative browser chrome framing a preview (titlebar, omnibox, window proportions) is illustration, not product UI, and is exempt.

#### Scenario: Tokens are imported, not mirrored

- **WHEN** the site's styles are built
- **THEN** colour, type, radii, motion, and the aurora/glass/glow atmosphere resolve from `@lunma/tokens`
- **AND** the page contains no second, hand-maintained definition of those token values

#### Scenario: Product previews match the real components' treatments

- **WHEN** a staged preview renders a product element that exists in the extension (a tab row, a favourite tile, a launcher row or badge)
- **THEN** its rendered-at-rest treatment (selection wash, borders, glow, ring, fill, type role, and token-derived spacing) matches the extension component it mirrors
- **AND** no design value in that preview is a hand-coded literal where a `@lunma/tokens` token or a scoped substrate variable exists

#### Scenario: The page's atmosphere inherits the shared default

- **WHEN** the page renders the shared aurora recipe as its backdrop
- **THEN** the aurora's opacity resolves from the `@lunma/tokens` default rather than a site-local override

### Requirement: The product's colour-coded Spaces are demonstrated live

The landing page SHALL demonstrate Lunma's colour-coded Spaces interactively within the
first viewport: a control to switch between example Spaces SHALL recolour a staged preview of
the product (the sidebar and new-tab identity) through the shared Space hue/lightness/chroma,
so the colour identity is shown rather than only described. The example Spaces and their
colours SHALL be drawn from the product's real Space palette. This live demonstration is
decorative motion and SHALL obey the page's reduced-motion contract (no auto-advancing loop
when reduced; switching remains available and the end state is identical), and it SHALL NOT
reduce any text below WCAG-AA contrast.

#### Scenario: Switching an example Space recolours the staged preview

- **WHEN** a visitor selects a different example Space
- **THEN** the staged product preview (the sidebar and the new-tab identity) recolours to that
  Space's colour from the real palette

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
`<meta name="theme-color">` matching the dark substrate; and (g) the "Spaces"
nav anchor targeting the Spaces chapter (the chapter owns `id="spaces"`),
with the hero demo keeping a distinct id. The decorative mock content inside
the staged preview SHALL be hidden from assistive technology (the caption and
the functional Space switcher stay exposed), and ARIA labels SHALL NOT be
placed on generic elements without a role.

#### Scenario: Skip link bypasses the nav

- **WHEN** a keyboard user presses Tab on a fresh page load
- **THEN** the first focused element is a visible "Skip to content" link
- **AND** activating it moves focus/scroll to the main content

#### Scenario: Anchored sections clear the sticky nav

- **WHEN** the visitor clicks a nav anchor (e.g. "Launcher")
- **THEN** the target section's heading lands fully below the sticky nav bar

#### Scenario: Nav links survive mobile widths

- **WHEN** the page renders at a 390px-wide viewport
- **THEN** every nav destination remains reachable from the nav (no link is
  hidden without a replacement)

#### Scenario: The Spaces anchor reaches the Spaces chapter

- **WHEN** the visitor clicks "Spaces" in the nav from the bottom of the page
- **THEN** the page scrolls to the Spaces chapter, not the hero demo

#### Scenario: Mock content is not read as page content

- **WHEN** a screen reader traverses the staged preview
- **THEN** the mock sidebar's tab titles and labels are not announced; the
  caption and the functional Space switcher are

