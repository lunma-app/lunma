## MODIFIED Requirements

### Requirement: The options page renders on-brand with a live appearance preview

The options page SHALL render Lunma's on-brand appearance. The wordmark SHALL be
set in the display serif (`--font-display`) with an identity-hue glow dot, and the
setting groups and the preview SHALL render on `Surface` panels over a subtle
`Aurora` backdrop, without reducing form legibility below WCAG AA.

The page SHALL carry an editorial hierarchy: setting-group headings SHALL be set
in the display serif (`--font-display`) at the `--text-xl` stop in sentence case
with the identity-hue treatment (serif carries identity; the body and controls
stay in the sans — the established pairing rule), group descriptions SHALL render
in the muted body style, and groups SHALL be separated by the `--space-6` rhythm
so the page reads in three clear levels (wordmark → group headings → controls).
Headings and descriptions SHALL read type and spacing from the token scale (no
raw font sizes).

The appearance preview SHALL reflect both the `density` and `tint` selections
live: changing either control SHALL update the preview in place — the Density change
reflowing the preview rows, and the Colour-intensity change re-treating the on-brand
`Surface`s as a **graduated glass ramp** (the cards are glass at every level and the
tint calms the glass fill across `subtle` → `standard` → `vivid` rather than switching
between glass and an opaque card) — so each control's effect is visible where it is
set, without navigating away or reloading.

#### Scenario: Options page renders on-brand

- **WHEN** the options page renders
- **THEN** the wordmark SHALL be set in the display serif with an identity-hue glow dot
- **AND** the setting groups and preview SHALL render on `Surface` panels over a subtle aurora

#### Scenario: Group headings carry the editorial serif

- **WHEN** the options page renders its setting groups
- **THEN** each group heading SHALL render in `--font-display` at `--text-xl`
  in sentence case with the identity-hue treatment
- **AND** descriptions and controls SHALL remain in the sans with token-scale
  sizes only

#### Scenario: Preview reflects tint and density live

- **WHEN** the user changes the Colour intensity or Density control
- **THEN** the appearance preview SHALL update immediately to reflect the new selection
- **AND** the page SHALL NOT require a reload or navigation to show the effect

#### Scenario: Colour-intensity ramps smoothly across levels

- **WHEN** the user moves the Colour intensity control across `subtle`, `standard`, and `vivid`
- **THEN** the cards SHALL be glass at every level, with the glass fill calming as colour is dialled down
- **AND** each level SHALL be visually distinct from the others, with no two levels identical and no opaque↔glass jump
- **AND** form text SHALL remain at least WCAG AA at every level
