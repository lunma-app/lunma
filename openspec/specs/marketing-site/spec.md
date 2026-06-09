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

#### Scenario: Tokens are imported, not mirrored

- **WHEN** the site's styles are built
- **THEN** colour, type, radii, motion, and the aurora/glass/glow atmosphere resolve from `@lunma/tokens`
- **AND** the page contains no second, hand-maintained definition of those token values

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

