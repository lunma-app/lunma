## MODIFIED Requirements

### Requirement: Immediately legible value proposition

The landing page (`apps/site`) SHALL communicate what Lunma is and its primary user value within the first viewport ("above the fold"), led by an Instrument-Serif display headline. A first-time visitor SHALL be able to tell what the product does without scrolling.

#### Scenario: The hero states the product and its value

- **WHEN** the landing page first paints on a desktop or mobile viewport
- **THEN** a headline and a one-sentence subhead naming Lunma and its core value (colour-coded Spaces, a keyboard launcher, tabs that put themselves away) are visible without scrolling
- **AND** the headline is rendered in the Instrument-Serif display token from `@lunma/tokens`

### Requirement: Honest positioning for alternative-seekers

The site SHALL position Lunma as an Arc alternative for people arriving from Arc by naming the lineage in the brand voice and answering the alternative-seeker's questions factually, rather than by a competitor comparison matrix. It SHALL include a positioning section that names Arc and states Lunma's own footing (an extension for the Chrome/Edge you already use, open source, no account, nothing locked in), and FAQ entries answering how Lunma differs from Arc and how it relates to the Arc-style extension it credits. Lunma SHALL describe itself in its own terms (its own category and footing) rather than as a "style of" another product. Every claim SHALL be factual (what Lunma is, not a value-judgement or disparagement of another tool), and the tool Lunma credits as its inspiration SHALL be credited, not ranked against. The positioning content SHALL render at the page's visual bar and hold WCAG-AA contrast.

#### Scenario: The page positions Lunma for people coming from Arc

- **WHEN** a visitor reaches the positioning section
- **THEN** it names Arc and states Lunma's own footing (a Chrome/Edge extension, open source, no account, no lock-in) in the brand voice
- **AND** the FAQ answers "how is Lunma different from Arc?" and the relation to the Arc-style extension, factually

#### Scenario: Lunma is framed as an alternative, not a style-of

- **WHEN** the page or its `<head>` metadata names Lunma's relationship to Arc
- **THEN** it frames Lunma as an Arc alternative (its own product that Arc users can move to), not as "Arc-style" being Lunma's own identity
- **AND** any "Arc-style" wording that remains describes the *credited inspiration tool* (the Arc-style extension), not Lunma itself

#### Scenario: The credited tool is credited, not ranked

- **WHEN** the site references the Arc-style extension it was inspired by
- **THEN** it appears as a credit and a gracious factual FAQ mention, not as a competitor ranked against Lunma
