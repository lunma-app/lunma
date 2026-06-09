## ADDED Requirements

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
