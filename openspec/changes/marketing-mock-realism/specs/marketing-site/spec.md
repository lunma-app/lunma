# marketing-site — delta for marketing-mock-realism

## MODIFIED Requirements

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
