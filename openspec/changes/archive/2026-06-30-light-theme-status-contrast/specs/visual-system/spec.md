## MODIFIED Requirements

### Requirement: Immersive aesthetic preserves reduced-motion and contrast guarantees

The immersive treatment SHALL honour `prefers-reduced-motion`: aurora drift and
entrance/stagger animations SHALL be removed (end state identical) when reduced
motion is requested.

Text and non-text UI that Lunma ships SHALL meet WCAG AA in **both** themes
(dark and light) at every tint level, verified by automated contrast tests
rather than assumed. Specifically:

- Body text rendered on a glass `Surface` over the aurora SHALL meet WCAG AA at
  every tint level, in both dark and light themes. `--glass-bg` and
  `--glass-bg-strong` SHALL carry a light-theme expression (a light translucent
  fill under `[data-theme='light']`) so a glass panel is never a dark substrate
  under a light frame; foreground tokens placed on glass SHALL meet AA in light
  theme.
- The non-text boundary of an idle (unfocused) form control — the
  `TextInput`/`Select` border-or-fill against the surface behind it — SHALL meet
  the 3:1 non-text contrast minimum (WCAG 1.4.11) in both themes.
- Informative, normal-size text (≤ `--text-xs`/11px regular metadata such as the
  `TabRow` `.meta` line and the `Menu` section-kind label) SHALL meet the 4.5:1
  normal-text minimum on every surface it renders on, in both themes; tokens
  whose contract floor is only AA-Large (3:1, e.g. `--text-faint`) SHALL be
  restricted to genuinely incidental/decorative/disabled text.
- The status tokens `--success`, `--warning`, `--info`, and `--danger` — which
  drive the PR/CI marks (`Lens` status dots, `Diffstat` `+N −N` text and bars,
  `ReviewerRail` verdict glyphs) and render as both small text and graphical
  marks — SHALL each carry a `[data-theme='light']` expression so they meet the
  4.5:1 normal-text minimum on `--surface`/`--surface-2`/`--bg` and the 3:1
  non-text minimum on the `--surface-3` Diffstat track, in both themes.
- The derived per-Space colour-scope family (`--space-c`/`--space-c-soft`/
  `--space-c-dim`) SHALL carry a `[data-theme='light']` expression that caps the
  lightness at `min(--space-l, 0.55)`, so `--space-c` used as a non-text
  boundary — the selected-Space tile's identity ring/line — meets the 3:1
  non-text minimum on light surfaces for every Space hue, without shifting the
  hue identity.
- The automated contrast contract (`apps/extension/src/ui/contrast.test.ts`)
  SHALL parse and assert **both** the dark `:root` and the `[data-theme='light']`
  token blocks, and SHALL include the light-theme-on-glass, idle-boundary
  non-text, and status-token pairs, so none of the above can regress unnoticed.

#### Scenario: Reduced motion removes ambient animation

- **WHEN** the user prefers reduced motion
- **THEN** the aurora SHALL NOT drift and entrance animations SHALL NOT play
- **AND** the final rendered state SHALL be identical to the animated end state

#### Scenario: Text on glass stays AA at every tint level

- **WHEN** body text is rendered on a glass `Surface` over the aurora at `subtle`, `standard`, or `vivid`
- **THEN** its contrast ratio SHALL meet WCAG AA
- **AND** a contrast test SHALL assert this for each level

#### Scenario: Text on glass stays AA in light theme

- **WHEN** the active theme is light (`[data-theme='light']`) and text is rendered on a `.lunma-glass` panel
- **THEN** the glass SHALL use its light-theme `--glass-bg` expression and the foreground token SHALL meet WCAG AA (≥4.5:1 normal text)
- **AND** the contrast test SHALL assert the light-theme-on-glass pair

#### Scenario: Idle form-control boundary meets the 3:1 non-text minimum

- **WHEN** a `TextInput` or `Select` is at rest (unfocused) in either theme
- **THEN** its boundary against the surface behind it SHALL be distinguishable at ≥3:1
- **AND** the contrast test SHALL assert the border-vs-surface non-text pair

#### Scenario: Informative metadata meets the 4.5:1 normal-text floor

- **WHEN** normal-size metadata (e.g. `TabRow` `.meta`, `Menu` section-kind label) renders on any surface in either theme
- **THEN** its text colour SHALL meet ≥4.5:1 against that surface
- **AND** `--text-faint` SHALL NOT be used for such informative text

#### Scenario: PR/CI status colours stay AA in light theme

- **WHEN** a PR/CI status mark (a `Lens` status dot, a `Diffstat` `+N −N` count or bar, or a `ReviewerRail` verdict glyph) renders in light theme using `--success`/`--warning`/`--info`/`--danger`
- **THEN** the token SHALL meet ≥4.5:1 against `--surface`/`--surface-2`/`--bg` and ≥3:1 against the `--surface-3` Diffstat track
- **AND** the contrast test SHALL assert each status token against those surfaces in both themes

#### Scenario: Selected-Space identity ring meets the 3:1 non-text minimum in light theme

- **WHEN** the active Space chip's identity ring (`--space-c`) is rendered on the near-white light `--surface` for any Space hue
- **THEN** the `[data-theme='light'] .lunma-space-scope` lightness cap SHALL bring `--space-c` to ≥3:1 against the surface behind it
- **AND** the Space's hue identity SHALL be preserved (only lightness is capped)
