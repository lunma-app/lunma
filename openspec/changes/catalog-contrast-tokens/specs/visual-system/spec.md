## MODIFIED Requirements

### Requirement: Design values are defined as tokens and consumed by primitives

All design values SHALL be defined once as CSS custom properties in
`@lunma/tokens` and consumed by the UI primitives in `apps/extension/src/ui/`. This SHALL
cover colours, radii, spacing, motion timings/easings, font families, a type
scale, font weights, z-index layers, focus-ring geometry, a press scale, and
control heights. Primitives SHALL NOT hard-code raw design values (e.g. a literal
`13px` font size, `2147483647` z-index, `scale(0.96)`, or `28px` control height).

The token set SHALL include at minimum: `--font-display`, `--font-sans`,
`--font-mono`; `--text-2xs … --text-display`; `--weight-regular … --weight-bold`;
`--z-base … --z-launcher`; `--focus-color`, `--focus-width`, `--focus-offset`;
`--press-scale`; `--control-h-xs … --control-h-xl`, `--favicon-size`,
`--icon-btn`; and the colour-role tokens `--accent-label` (accent-coloured text/
glyph on a plain surface, following the active Space hue, distinct from
`--accent-on` which is ink on a solid accent fill), `--danger-text` (legible
destructive label text, distinct from the `--danger` graphic hue and the
`--danger-soft` wash), and `--status-neutral` (a neutral/pending status colour in
the status family beside `--success`/`--danger`, owned by the status contract not
the type scale). A colour used as an interactive foreground or state affordance
SHALL resolve through the matching colour-role token, not through an ad-hoc
per-primitive `color-mix` or raw palette lightness.

#### Scenario: Primitives read tokens, not literals

- **WHEN** a UI primitive sets a font size, z-index, focus ring, press transform, or control height
- **THEN** it SHALL reference a token (`--text-*`, `--z-*`, `--focus-*`, `--press-scale`, `--control-h-*`)
- **AND** the value SHALL change consistently everywhere when the token changes

#### Scenario: Focus ring auto-rebinds to the active Space hue

- **GIVEN** `--focus-color` defaults to `--accent`
- **WHEN** a focusable element inside `.sidebar` (where `--base-hue` is rebound to the active Space) receives `:focus-visible`
- **THEN** its focus ring SHALL render in the active Space's hue without a per-component override

#### Scenario: Interactive foreground colours resolve through a colour-role token

- **WHEN** a primitive colours interactive text, a selection glyph/check, a destructive label, or a neutral status indicator
- **THEN** it SHALL reference the matching colour-role token (`--accent-label`/`--accent-on`, `--danger-text`/`--danger-soft`, or `--status-neutral`)
- **AND** it SHALL NOT re-roll that colour via a per-primitive `color-mix` of `--danger`/`--accent` or a raw palette lightness

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
- The non-text boundary of a free-floating interactive control that is not a
  form field — e.g. the `SpaceSwitcher` dashed "add Space" tile, and the idle
  boundary of a standalone control such as the default `Button` outline, the
  resting `Chip` toggle ring, and the `SegmentedControl` track edge — SHALL use
  `--border-strong` (form fields: `--border-field`), not the decorative
  `--border`/`--border-soft` nor an ad-hoc `color-mix(--text-faint …)`
  (intentionally below the floor), so it meets the 3:1 non-text minimum
  (WCAG 1.4.11) on `--surface`/`--surface-2`/`--bg` in both themes. The
  decorative `--border`/`--border-soft` SHALL NOT be used as the visible boundary
  of an interactive control.
- Informative, normal-size text (≤ `--text-xs`/11px regular metadata such as the
  `TabRow` `.meta` line and the `Menu` section-kind label) SHALL meet the 4.5:1
  normal-text minimum on every surface it renders on, in both themes; tokens
  whose contract floor is only AA-Large (3:1, e.g. `--text-faint`) SHALL be
  restricted to genuinely incidental/decorative/disabled text. In particular the
  `FolderRow` count badge (currently `--text-faint` on `--surface-2`) SHALL use a
  token whose floor clears 4.5:1 on that surface, and the `TabRow` `.meta` line
  (`--text-dim`) SHALL clear 4.5:1 when it is **composited over the
  `--space-c-soft` hover/active wash**, not only on the opaque surface — a
  distinct backing the opaque-surface floor does not cover.
- The Space accent used as a **foreground** — text, a selection glyph, or a check
  (the `IconPicker` selected glyph, the `MultiSelect` Select-all/Clear action
  text, the `MultiSelect` and `Select` selected check) — SHALL use `--accent-on`
  (ink drawn on a solid accent fill, e.g. the check on an accent-filled box) or
  `--accent-label` (accent-coloured text/glyph on a plain surface, e.g. the
  Select-all/Clear actions), never `--accent` (the fill/ring hue) or the frozen
  `--accent-text` as a foreground. `--accent-label` SHALL follow the active Space
  hue and meet the 4.5:1 normal-text minimum on `--surface`/`--surface-2`/`--bg`
  for every Space hue, in both themes.
- Destructive **text** — the `InlineError` body on its danger tint and the `Menu`
  danger item — SHALL use `--danger-text` over a `--danger-soft` wash, and SHALL
  NOT self-tint by mixing `--danger` into its own background per-primitive.
  `--danger-text` SHALL meet the 4.5:1 normal-text minimum both on
  `--surface`/`--bg-elev` and over the `--danger-soft` wash, in both themes.
- An accent-coloured section label (e.g. the lens `OverviewPage` "Review
  requests" group head) SHALL be coloured with the theme-aware `--accent-heading`
  token rather than an inline `oklch(var(--accent-text-l) …)` literal, so it
  meets the 4.5:1 normal-text minimum on `--surface`/`--surface-2`/`--bg`/
  `--surface-3` in both themes.
- The status tokens `--success`, `--warning`, `--info`, and `--danger` — which
  drive the PR/CI marks (`Lens` status dots, `Diffstat` `+N −N` text and bars,
  `ReviewerRail` verdict glyphs) and render as both small text and graphical
  marks — SHALL each carry a `[data-theme='light']` expression so they meet the
  4.5:1 normal-text minimum on `--surface`/`--surface-2`/`--bg` and the 3:1
  non-text minimum on the `--surface-3` Diffstat track, in both themes. A
  neutral/pending status indicator (the `Avatar` pending verdict ring and glyph)
  SHALL use `--status-neutral` — a status-family token — and SHALL NOT borrow a
  type-scale token (`--text-dim`), so a type-scale retune cannot silently shift a
  status signal.
- Icon glyph fills that carry status or Space identity — the `OverviewPage` `.ci`
  CI glyph and the `SpaceSwitcher` active-chip `.tile` glyph — SHALL compose a
  theme-aware token (the matching status token for the CI glyph; `--space-c` for
  the active-chip glyph) rather than a hard-coded `oklch(0.8x …)` lightness, so
  the glyph stays legible on its tinted backing in light theme (including a gray
  Space, where the prior hard-coded near-white glyph was effectively invisible).
- The derived per-Space colour-scope family (`--space-c`/`--space-c-soft`/
  `--space-c-dim`) SHALL carry a `[data-theme='light']` expression that caps the
  lightness at `min(--space-l, 0.55)`, so `--space-c` used as a non-text
  boundary — the selected-Space tile's identity ring/line — meets the 3:1
  non-text minimum on light surfaces for every Space hue, without shifting the
  hue identity. A **raw palette hue re-rolled directly** as a foreground glyph or
  selection ring — the `LensRow` leading glyph and the `ColorSwatch` selection
  ring — SHALL likewise be capped by a light-theme lightness floor: each SHALL
  expose the hue's raw lightness as an inline custom property (`LensRow`'s
  `--lens-l`, `ColorSwatch`'s existing `--swatch-l`) and consume a **separately
  named** derived property (e.g. `--dot-l`, `--glyph-l`) that under
  `[data-theme='light']` is `min()` of the raw lightness and a cap — the raw and
  the derived property being **distinct names** so the derivation is not a
  custom-property self-reference cycle (`--swatch-l: min(var(--swatch-l), …)`
  would be invalid at computed-value time and blank the colour). The capped result
  SHALL meet the 3:1 non-text minimum as a ring and the 4.5:1 normal-text minimum
  as a glyph on light surfaces for every Space hue. A hue composed inline as a
  complete `oklch(L C H)` string (which no CSS cap can reach) SHALL NOT be used for
  such a foreground or ring.
- The automated contrast contract (`apps/extension/src/ui/contrast.test.ts`)
  SHALL parse and assert **both** the dark `:root` and the `[data-theme='light']`
  token blocks, and SHALL include the light-theme-on-glass, idle-boundary
  non-text, status-token, `--accent-heading`, interactive-control
  `--border-strong`, `--accent-label`-on-surface (swept across the worst-case
  Space hues), `--danger-text`-on-surface-and-wash, `--status-neutral`, and
  `FolderRow`-count / `TabRow`-meta-over-wash informative pairs, so none of the
  above can regress unnoticed.

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

#### Scenario: Interactive-control boundary meets the 3:1 non-text minimum

- **WHEN** the `SpaceSwitcher` dashed "add Space" tile, a default `Button` outline, a resting `Chip` toggle ring, or a `SegmentedControl` track edge renders its boundary on `--surface`/`--surface-2`/`--bg` in either theme
- **THEN** the boundary SHALL use `--border-strong` (form fields `--border-field`) and meet ≥3:1 against the surface behind it
- **AND** the decorative `--border`/`--border-soft` or an ad-hoc `color-mix(--text-faint …)` SHALL NOT be its visible boundary
- **AND** the contrast test SHALL assert the `--border-strong`-vs-surface non-text pair in both themes

#### Scenario: Informative metadata meets the 4.5:1 normal-text floor

- **WHEN** normal-size metadata (e.g. `TabRow` `.meta`, `Menu` section-kind label) renders on any surface in either theme
- **THEN** its text colour SHALL meet ≥4.5:1 against that surface
- **AND** `--text-faint` SHALL NOT be used for such informative text

#### Scenario: Informative count and washed metadata meet AA on their backing

- **WHEN** the `FolderRow` count badge renders on `--surface-2`, or the `TabRow` `.meta` line renders composited over the `--space-c-soft` hover/active wash, in either theme
- **THEN** the text SHALL use a token whose floor clears ≥4.5:1 on that specific backing, and the `FolderRow` count SHALL NOT use `--text-faint`
- **AND** the contrast test SHALL assert the `FolderRow`-count-vs-`--surface-2` and `TabRow`-meta-over-`--space-c-soft` pairs in both themes

#### Scenario: Accent used as foreground stays AA in both themes

- **WHEN** the `IconPicker` selected glyph, the `MultiSelect` Select-all/Clear action text, or a `MultiSelect`/`Select` selected check renders in either theme for any Space hue
- **THEN** it SHALL be coloured with `--accent-on` (check on an accent-filled box) or `--accent-label` (accent text on a plain surface), never `--accent`/`--accent-text` as a foreground, and meet ≥4.5:1 against the surface behind it
- **AND** the contrast test SHALL assert the `--accent-label`-vs-surface pair for the worst-case Space hues in both themes

#### Scenario: Destructive text stays AA on its own tint

- **WHEN** the `InlineError` body or a `Menu` danger item renders its destructive label over a `--danger-soft` wash in either theme
- **THEN** the text SHALL use `--danger-text` and meet ≥4.5:1 both on `--surface`/`--bg-elev` and over the `--danger-soft` wash
- **AND** the primitive SHALL NOT self-tint via a `color-mix` of `--danger` into its own background
- **AND** the contrast test SHALL assert the `--danger-text`-on-surface and `--danger-text`-on-wash pairs in both themes

#### Scenario: Neutral status uses a status token, not the type scale

- **WHEN** the `Avatar` pending verdict ring and glyph render in either theme
- **THEN** they SHALL use `--status-neutral` (a status-family token), not `--text-dim`
- **AND** a retune of the type-scale dim tokens SHALL NOT shift the pending status colour

#### Scenario: Accent section label stays AA in both themes

- **WHEN** the lens `OverviewPage` "Review requests" group label renders in either theme
- **THEN** it SHALL be coloured with `--accent-heading` and meet ≥4.5:1 against `--surface`/`--surface-2`/`--bg`/`--surface-3`
- **AND** the contrast test SHALL assert the `--accent-heading`-vs-surface pairs in both themes

#### Scenario: PR/CI status colours stay AA in light theme

- **WHEN** a PR/CI status mark (a `Lens` status dot, a `Diffstat` `+N −N` count or bar, or a `ReviewerRail` verdict glyph) renders in light theme using `--success`/`--warning`/`--info`/`--danger`
- **THEN** the token SHALL meet ≥4.5:1 against `--surface`/`--surface-2`/`--bg` and ≥3:1 against the `--surface-3` Diffstat track
- **AND** the contrast test SHALL assert each status token against those surfaces in both themes

#### Scenario: Status and identity glyph fills stay legible in light theme

- **WHEN** the `OverviewPage` `.ci` CI glyph or the `SpaceSwitcher` active-chip `.tile` glyph renders in light theme
- **THEN** the glyph SHALL compose a theme-aware token (the matching status token for the CI glyph; `--space-c` for the active-chip glyph) rather than a hard-coded `oklch(0.8x …)` fill
- **AND** the glyph SHALL stay legible on its tinted backing, including for a gray Space

#### Scenario: Selected-Space identity ring meets the 3:1 non-text minimum in light theme

- **WHEN** the active Space chip's identity ring (`--space-c`) is rendered on the near-white light `--surface` for any Space hue
- **THEN** the `[data-theme='light'] .lunma-space-scope` lightness cap SHALL bring `--space-c` to ≥3:1 against the surface behind it
- **AND** the Space's hue identity SHALL be preserved (only lightness is capped)

#### Scenario: Re-rolled per-Space hue foreground and ring meet their floors

- **WHEN** the `LensRow` leading glyph or the `ColorSwatch` selection ring renders a per-Space palette hue in light theme for any Space hue
- **THEN** the hue's raw lightness SHALL be exposed as an inline custom property (`--lens-l` / `--swatch-l`) and consumed through a separately-named derived property capped under `[data-theme='light']` by `min()` (not a self-referential `min(var(--x-l), …)` on the same name), meeting ≥3:1 as a ring and ≥4.5:1 as a glyph against the surface behind it
- **AND** a hue composed inline as a complete `oklch(L C H)` string SHALL NOT be used for the foreground or ring

### Requirement: Review-lens primitives are token-driven ui/ components

Lunma SHALL provide three cross-surface primitives in `apps/extension/src/ui/` — `Avatar`, `Diffstat`, and `ReviewerRail` — so the Review Queue (and later typed lenses) compose them rather than re-rolling discs, diff bars, or reviewer clusters inline. Each SHALL consume `@lunma/tokens` design tokens and SHALL NOT hard-code raw design values (colours, sizes, radii), in line with the token-consumption requirement. Their contracts SHALL be:

- `Avatar.svelte` — `{ initials: string; size?: 'sm' | 'md'; ring?: 'approved' | 'changes' | 'pending' | 'none'; title?: string }`. An initials disc; the `ring` tint reads `--success` (approved), `--danger` (changes), or `--status-neutral` (pending — a status-family token, not the type-scale `--text-dim`), and the disc geometry reads radius/size tokens.
- `Diffstat.svelte` — `{ additions?: number; deletions?: number }`. Renders mono `+N −N` numerals (`--success` / `--danger`) over a proportional two-tone bar on a `--surface-3` track. Whenever a side is present its numeral SHALL render (so the magnitude is never colour-only); when **both** sides are absent the component SHALL render nothing (it collapses rather than showing `+0 −0`).
- `ReviewerRail.svelte` — `{ reviewers: { initials: string; state?: 'approved' | 'changes' | 'pending'; title?: string }[]; max?: number }`. A leading verdict `Icon` (blocking-wins) followed by overlapped `Avatar`s tinted by `state`, with a `+N` overflow past `max`.

Feature components SHALL compose these primitives rather than re-rolling an initials disc, a diff bar, or a reviewer cluster inline.

#### Scenario: The primitives read tokens, not literals

- **WHEN** `Avatar`, `Diffstat`, or `ReviewerRail` sets a colour, size, radius, or font
- **THEN** it SHALL reference a token (`--success`/`--danger`/`--status-neutral`/`--text-*`, `--surface-*`, `--r-*`, `--text-*`, `--space-*`) and not a raw literal

#### Scenario: Diffstat is never colour-only

- **WHEN** `Diffstat` renders a change's additions and deletions
- **THEN** it SHALL show the `+N −N` numerals beside the bar, so the magnitude reads without relying on the green/red colour alone (WCAG-AA)

#### Scenario: Diffstat collapses when no size is known

- **WHEN** `Diffstat` receives neither `additions` nor `deletions`
- **THEN** it SHALL render nothing (no `+0 −0`, no empty bar)
- **AND WHEN** exactly one side is present, that side's numeral SHALL render

#### Scenario: A feature component composes the primitives

- **WHEN** the Review Queue row renders an author disc, a diff stat, and the reviewer cluster
- **THEN** it SHALL compose `Avatar`, `Diffstat`, and `ReviewerRail` rather than declaring disc/bar/cluster markup inline

### Requirement: A shared MultiSelect primitive provides a searchable multi-toggle listbox

Lunma SHALL provide a cross-surface `MultiSelect` primitive in
`apps/extension/src/ui/MultiSelect.svelte` so surfaces compose a multi-select listbox
rather than re-rolling one or degrading multi-value filters to a single-select
`Select`. It SHALL share `Select`'s visual language (recessed trigger field, opaque
`elevated` `Surface` popover, accent-wash selected rows) and SHALL read design values
from `@lunma/tokens`, never hard-coding font sizes, z-index, focus rings, press
transforms, or control heights. Its contract SHALL be:

- **Props:** `options: MultiSelectOption[]` (each `{ value, label, disabled?, keywords? }`,
  where `keywords` is extra non-displayed text folded into the search corpus, and
  `MultiSelectOption` is exported from the module); `values: string[]` (the current
  selection); `onchange: (values: string[]) => void` (fired with the next full
  selection on any toggle or Clear); `label: string` (the parent-computed closed-trigger
  summary); `mode?: 'dropdown' | 'inline'` (default `dropdown`); `searchThreshold?:
  number` (default 8); `ariaLabel?`, `clearLabel?`, `selectAllLabel?`,
  `searchPlaceholder?`, `testid?`; and an optional `leading` snippet receiving the row's
  option.
- **Selection:** each row SHALL render a checkbox-square toggle that fills with the
  active Space accent (`var(--accent)`) plus an `--accent-on` check (the theme-flipping
  ink-on-accent token, so the check stays legible on light Space hues) when selected, in
  addition to the `--accent-soft` row wash, so selection reads by both box fill and row
  tint. Toggling a row SHALL keep the list open and emit the next `values` array.
- **Modes:** `dropdown` SHALL render a trigger button (`aria-haspopup="listbox"`,
  `aria-expanded`) whose visible summary is the parent-computed `label` and whose resting
  border tints toward the accent while any value is selected (the "engaged" cue); it opens
  a popover. `inline` SHALL render the listbox always-open with no trigger or popover. The
  trigger SHALL NOT render a separate count pill — the count, when wanted, lives in the
  parent-computed `label` (e.g. "{n} selected"), so a pill would duplicate it.
- **Custom leading content:** when a `leading` snippet is provided, it SHALL stand in
  for the row's plain label (e.g. an `AccountChip` carrying the source's identity),
  receiving the row's option; the plain label span SHALL be suppressed so the identity
  is not duplicated, while `option.label` SHALL still drive the search filter and the
  option's accessible name (the row's `aria-label`). The snippet SHALL NOT replace the
  row's toggle button or its checkbox-square.
- **Search:** when `options.length` exceeds `searchThreshold`, a `SearchField`
  (`mode="input"`) SHALL render above the list and filter it by case-insensitive
  **subsequence (fuzzy) match** over each option's `label` plus its optional `keywords`
  (so a query like `hcr` matches `Hacker News`, and typing a `keywords`-only term — e.g. a
  source's provider/type — matches a row whose visible label omits it). `MultiSelect`
  SHALL NOT re-roll an input. `ArrowDown` from the search field SHALL move focus to the
  first visible row; `Escape` SHALL close (`dropdown`) or clear focus.
- **Clear / Select all:** an in-popover header SHALL show a live count plus, when their
  labels are provided, two accent actions coloured with `--accent-label` (the
  theme-flipping accent-text token, so the action text stays ≥4.5:1 on light Space
  hues): **Clear** (`clearLabel`, shown while ≥1 value is selected) emits an empty
  `values`; **Select all** (`selectAllLabel`, shown while not every enabled option is
  selected) emits the union of the current selection and all enabled options, **ignoring
  the active search** (a master toggle over the whole list). Disabled options are never
  auto-selected and do not block the all-selected state. The two read as a select-all ⟷
  clear toggle: Select all hides once everything is selected, Clear hides once nothing is.
  The header SHALL render only when at least one action is offerable.
- **Accessibility + motion:** the open list SHALL be `role="listbox"` with
  `aria-multiselectable="true"` and per-row `aria-selected`; the keyboard model SHALL be
  the roving `↑/↓` + `Home/End` + `Escape` + `Tab`-to-leave listbox model. The popover
  animation, chevron rotation, and box-fill transition SHALL be removed under
  `prefers-reduced-motion`, and the accent / accent-soft / accent-on / accent-label
  pairings SHALL hold WCAG-AA at the `subtle | standard | vivid` Colour tiers.

`MultiSelect` SHALL carry a catalog story at
`apps/extension/catalog/stories/ui/MultiSelect.stories.svelte`, per the per-primitive
story gate.

#### Scenario: The dropdown trigger opens a multiselectable listbox

- **WHEN** a `dropdown`-mode `MultiSelect` trigger is activated
- **THEN** a popover opens whose list is `role="listbox"` with `aria-multiselectable="true"`, one toggle row per option

#### Scenario: Toggling rows accumulates a multi-value selection

- **GIVEN** an open `MultiSelect` with `values: ['a']`
- **WHEN** the user toggles option `b` on
- **THEN** `onchange` fires with `['a', 'b']` and the list stays open

#### Scenario: Search appears only past the threshold

- **GIVEN** a `MultiSelect` whose option count exceeds `searchThreshold`
- **WHEN** the list renders
- **THEN** a `SearchField` renders above the list and typing fuzzily filters the rows by a subsequence match over each option's label and its optional `keywords`; **AND** for an option count at or below the threshold no search field renders

#### Scenario: Clear empties the selection

- **GIVEN** an open `MultiSelect` with one or more values selected and a `clearLabel`
- **WHEN** the user activates Clear
- **THEN** `onchange` fires with an empty array and the Clear control hides once nothing is selected

#### Scenario: Select all picks every enabled option and then hides

- **GIVEN** an open `MultiSelect` with a `selectAllLabel` and not every enabled option selected
- **WHEN** the user activates Select all
- **THEN** `onchange` fires with all enabled option values (search-independent; disabled options excluded), and the Select all control hides once every enabled option is selected

#### Scenario: Inline mode renders an always-open list

- **WHEN** a `MultiSelect` is rendered with `mode="inline"`
- **THEN** the listbox is visible without a trigger, has no popover, and its rows toggle as in dropdown mode

#### Scenario: A leading snippet provides the row's visible identity

- **GIVEN** a `MultiSelect` whose rows supply a `leading` snippet
- **THEN** the snippet's content renders as the row's visible identity within the row toggle in place of the plain label span, the option keeps `option.label` as its accessible name, and the checkbox-square still marks selection
