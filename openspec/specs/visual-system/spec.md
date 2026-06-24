# visual-system Specification

## Purpose

Defines Lunma's immersive, colour-forward visual system: design values defined once as tokens in `@lunma/tokens` and consumed by primitives; locally bundled brand fonts applied by role; the default vivid aurora/glass/glow aesthetic; a tint dial controlling colour intensity down to a calm neutral substrate; the shared immersive primitives (`Surface`, `Aurora`, `SearchField`); and the reduced-motion and contrast guarantees the aesthetic preserves.
## Requirements
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
`--press-scale`; and `--control-h-xs … --control-h-xl`, `--favicon-size`,
`--icon-btn`.

#### Scenario: Primitives read tokens, not literals

- **WHEN** a UI primitive sets a font size, z-index, focus ring, press transform, or control height
- **THEN** it SHALL reference a token (`--text-*`, `--z-*`, `--focus-*`, `--press-scale`, `--control-h-*`)
- **AND** the value SHALL change consistently everywhere when the token changes

#### Scenario: Focus ring auto-rebinds to the active Space hue

- **GIVEN** `--focus-color` defaults to `--accent`
- **WHEN** a focusable element inside `.sidebar` (where `--base-hue` is rebound to the active Space) receives `:focus-visible`
- **THEN** its focus ring SHALL render in the active Space's hue without a per-component override

### Requirement: A shared Favicon primitive renders an icon with staged fallback

Lunma SHALL provide a cross-surface `Favicon` primitive in `apps/extension/src/ui/Favicon.svelte`
that renders a favicon image with a staged fallback, so feature primitives compose
it rather than re-rolling the favicon `<img>` + load-error + globe machine. Its
contract SHALL be:

- **Props:** `src?: string` (the primary favicon URL), `fallbackSrc?: string` (a
  retry URL — the Chrome `_favicon` page-URL endpoint), `size: number` (the square
  pixel size of both the image and the globe glyph), and `alt?: string`
  (default empty).
- It SHALL render in stages — **primary** (`src`) → **fallback** (`fallbackSrc`) →
  **globe** (the `globe` `Icon` glyph):
  - It SHALL begin at the first non-empty of `src`, then `fallbackSrc`, else the
    globe.
  - On an image load error at the primary stage it SHALL advance to the fallback
    stage **only when** `fallbackSrc` is non-empty AND differs from `src`;
    otherwise it SHALL render the globe.
  - On an image load error at the fallback stage it SHALL render the globe.
  - A change to `src` or `fallbackSrc` SHALL reset the stage, so a recycled
    instance re-tries from the primary.
- It SHALL render the globe glyph ONLY at the terminal globe stage — never
  transiently before the active stage's image has had its chance (no
  globe-then-icon flash).
- It SHALL reference design tokens for any styling and SHALL NOT hard-code raw
  design values (per Requirement: Design values are defined as tokens and consumed
  by primitives).

`FaviconTile`, `TabRow`, and `ResultRow` SHALL compose `Favicon` for their favicon
slot rather than re-rolling the image/globe markup. A consumer with no distinct
fallback (e.g. the launcher new-tab `ResultRow`, whose source is already the
endpoint) SHALL pass `src` only.

#### Scenario: The primary favicon renders when it loads

- **WHEN** a `Favicon` is given a `src` that loads successfully
- **THEN** it SHALL render that image
- **AND** it SHALL NOT render the globe glyph

#### Scenario: A failed primary retries the fallback before the globe

- **GIVEN** a `Favicon` with a `src` and a distinct, non-empty `fallbackSrc`
- **WHEN** the primary `src` fails to load
- **THEN** it SHALL switch to `fallbackSrc`
- **AND** it SHALL render the globe glyph only if `fallbackSrc` also fails to load

#### Scenario: No usable source renders the globe without a flash

- **WHEN** a `Favicon` has an empty `src` and an empty (or `src`-identical)
  `fallbackSrc`, or every source has failed
- **THEN** it SHALL render the globe glyph
- **AND** the globe SHALL NOT have flashed before a non-empty source was attempted

### Requirement: Brand fonts are bundled locally and applied by role

Lunma SHALL bundle **Instrument Serif** (display) and **Mona Sans** (body) as
local woff2 assets under `public/fonts/`, declared via `@font-face` with
`font-display: swap`, with no remote/CDN font fetch. `--font-display` SHALL carry
Space identity (Space names, the wordmark, large headings); `--font-sans` SHALL
carry body and UI text with a `system-ui` fallback stack.

#### Scenario: Fonts load offline from bundled assets

- **WHEN** the extension renders any surface with no network available
- **THEN** Instrument Serif and Mona Sans SHALL render from the bundled woff2 assets
- **AND** no request SHALL be made to a remote font host

#### Scenario: Display face carries Space identity

- **WHEN** a Space name or the Lunma wordmark is rendered
- **THEN** it SHALL use `--font-display` (Instrument Serif)
- **AND** functional/body text SHALL use `--font-sans` (Mona Sans)

### Requirement: The workspace renders an immersive, colour-forward aesthetic by default

By default Lunma SHALL render the active Space's colour as an immersive
backdrop: an **aurora** hue-mesh behind the content, **frosted-glass** panels for
elevated surfaces (search field, results card, launcher card, menus), and a
**hue glow** on identity elements. The substrate MAY carry a low-chroma cast of
the active Space hue. This corresponds to the `vivid` tint level, which SHALL be
the default.

The aurora and glow SHALL read the scoped `--space-h` / `--space-chroma`, so they
recolour with the active Space and cross-fade on Space switch over `--motion-slow`.
A `gray` Space (chroma 0) SHALL wash neutral. The hue glow SHALL render **wherever it
is requested**, including on surfaces with no active-Space hue scope (e.g. the options
page): the glow tokens SHALL resolve to the base identity hue rather than silently
dropping out, and SHALL still recolour to the active Space where its hue is in scope.

#### Scenario: Default surface is immersive

- **WHEN** a surface renders with an active Space and no stored tint preference
- **THEN** it SHALL render at the `vivid` tint: aurora backdrop, glass panels, and hue glow
- **AND** the aurora SHALL be tinted by the active Space's hue

#### Scenario: Aurora recolours on Space switch

- **WHEN** the active Space changes
- **THEN** the aurora and hue glow SHALL cross-fade to the new hue over `--motion-slow`

#### Scenario: Hue glow renders without an active-Space scope

- **WHEN** an identity element requests the hue glow on a surface with no per-Space hue scope
- **THEN** the glow SHALL render at the base identity hue
- **AND** it SHALL NOT drop out to no shadow

### Requirement: A tint dial controls colour intensity down to a calm substrate

The colour intensity SHALL be controllable across `subtle | standard | vivid`.
At `subtle` and `standard` the substrate SHALL read as near-neutral (identity
through the edge stripe, chips, and accents — not surface chroma) and the aurora
SHALL be reduced or absent; `vivid` SHALL apply the full immersive treatment.
Selecting a calmer level SHALL NOT change layout, only colour intensity.

#### Scenario: Calm levels restore a near-neutral substrate

- **WHEN** the tint level is `subtle` or `standard`
- **THEN** surfaces SHALL render near-neutral and the aurora SHALL be reduced or absent
- **AND** the layout SHALL be identical to `vivid`

### Requirement: Shared immersive primitives exist with defined contracts

Lunma SHALL provide three cross-surface primitives in `apps/extension/src/ui/`, exported from
`apps/extension/src/ui/index.ts`, that encapsulate the immersive chrome so feature components
compose rather than re-roll it:

- `Surface.svelte` — a panel with `variant: 'glass' | 'elevated' | 'flat'`, a
  `radius`, and an optional `glow`, encapsulating the glass blur, border
  highlight, shadow, and radius.
- `Aurora.svelte` — an `aria-hidden` backdrop of drifting hue blobs plus a grain
  overlay, parameterised by the scoped hue, with an `intensity` matching the tint
  level, honouring `prefers-reduced-motion`.
- `SearchField.svelte` — the search pill with `mode: 'trigger' | 'input'`.

Feature components and surfaces SHALL NOT re-roll glass panels, aurora backdrops,
or search pills inline once these primitives exist.

#### Scenario: A panel composes Surface rather than re-rolling glass

- **WHEN** a feature component needs a frosted-glass or elevated panel
- **THEN** it SHALL render a `Surface` with the appropriate `variant`
- **AND** it SHALL NOT declare its own `backdrop-filter` glass styling inline

### Requirement: Immersive aesthetic preserves reduced-motion and contrast guarantees

The immersive treatment SHALL honour `prefers-reduced-motion`: aurora drift and
entrance/stagger animations SHALL be removed (end state identical) when reduced
motion is requested. Body text rendered on glass panels and over the aurora SHALL
meet WCAG AA at every tint level, verified by automated contrast tests rather than
assumed.

#### Scenario: Reduced motion removes ambient animation

- **WHEN** the user prefers reduced motion
- **THEN** the aurora SHALL NOT drift and entrance animations SHALL NOT play
- **AND** the final rendered state SHALL be identical to the animated end state

#### Scenario: Text on glass stays AA at every tint level

- **WHEN** body text is rendered on a glass `Surface` over the aurora at `subtle`, `standard`, or `vivid`
- **THEN** its contrast ratio SHALL meet WCAG AA
- **AND** a contrast test SHALL assert this for each level

### Requirement: Inline rename presents a chromeless field with a single row-owned focus affordance

Inline rename SHALL present a chromeless editable field with the enclosing row
carrying the sole focus affordance. On every inline-rename surface — a temporary
tab, a pinned tab, or a folder — the editable field SHALL have no
border, no background fill, no padding, and no focus ring or halo of its own,
retaining the row's font (so the text does not shift on the label→field swap) and
showing an `--accent` caret; and the enclosing ROW SHALL carry a single inset ring
in the **active Space's hue** (tab rows) or the **folder's hue** (folder rows)
over a soft wash. This affordance SHALL be provided by the shared `EditableLabel`
primitive plus the `editing` state of `TabRow` / `FolderRow`; no rename surface
re-rolls its own editor chrome, and no second outline is rendered on the field
inside an editing row.

#### Scenario: The edited field renders chromeless

- **WHEN** an inline rename opens on any rename surface
- **THEN** the editable field SHALL have no border, no background fill, and no
  focus ring or halo of its own
- **AND** the text SHALL stay in place in the row's own font as the label becomes
  editable

#### Scenario: The editing row carries the single hue-tinted affordance

- **WHEN** a tab row or folder row is in inline-rename mode
- **THEN** that row SHALL show exactly one focus affordance — an inset ring in the
  active Space's hue (tab row) or the folder's hue (folder row), over a soft wash
- **AND** no competing outline SHALL be rendered on the field inside it

#### Scenario: The affordance is shared across all inline-rename surfaces

- **WHEN** rename is invoked on a temporary tab, a pinned tab, or a folder
- **THEN** each SHALL present the same chromeless field plus row-owned affordance
  via the shared primitives, not a per-surface editor style

### Requirement: The sidebar renders the immersive treatment driven by the tint setting

The sidebar SHALL render the active Space's immersive treatment, scaled by the
user's `tint` setting. The sidebar SHALL read `tint` (default `vivid`) through the
settings engine and reflect it onto a `data-tint` attribute on the `.sidebar`
element, updating live via `watchSettings` so a change made in options recolours
the sidebar without a reload.

At `vivid` the sidebar SHALL render an `Aurora` backdrop behind the tab lists,
tuned to a lower intensity than the new-tab hero so tab rows stay legible, layered
with the existing edge stripe and Space-colour wash as one coherent identity
gesture; the active Space chip SHALL carry a hue glow on a glass `Surface` tile.
At `subtle` and `standard` the substrate SHALL return to near-neutral, with the
layout unchanged. Tab-row text SHALL meet WCAG AA at every tint level.

#### Scenario: Sidebar reflects the vivid tint by default

- **WHEN** the sidebar renders with an active Space and no stored tint preference
- **THEN** `.sidebar` SHALL carry `data-tint="vivid"`
- **AND** a low-intensity aurora backdrop SHALL render behind the tab lists
- **AND** the active Space chip SHALL carry a hue glow on a glass tile

#### Scenario: Changing Colour intensity recolours the sidebar live

- **WHEN** the user changes the Colour intensity setting from another surface
- **THEN** the sidebar SHALL update its `data-tint` via `watchSettings`
- **AND** the immersive treatment SHALL change without a reload

#### Scenario: Calm levels restore a near-neutral sidebar substrate

- **WHEN** the tint is `subtle` or `standard`
- **THEN** the sidebar substrate SHALL render near-neutral with the aurora reduced or absent
- **AND** the tab-list layout SHALL be identical to `vivid`

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

### Requirement: The resting identity hue is a warm hearth-ember

Lunma's **resting/base identity hue** SHALL be a warm **hearth-ember** in the orange
band (OKLCH hue ≈ 62), deliberately distinct from the `--warning` (≈75) and `--danger`
(≈25) status hues. This is the hue used wherever no Space hue is in scope — the
new-tab home before a Space exists, the options page, the launcher overlay before a
Space is active, and the sidebar's no-Space state.

It SHALL be defined once as `--base-hue` in `@lunma/tokens` and mirrored by
`DEFAULT_HUE` in `apps/extension/src/shared/space-hue.ts`, with the **same value** as the fallback hue in
every `var(--space-h, …)` glow/accent token (`@lunma/tokens`,
`apps/extension/src/ui/Aurora.svelte`, `apps/extension/src/launcher/overlay.css`).

The accent, glass, glow, and aurora token *formulas* SHALL remain **parametric** on
`--base-hue` (an `oklch(… var(--base-hue) …)` form, not a hardcoded literal hue), so
they stay consistent with the scope-level re-declarations that read `--space-h`
directly (the launcher overlay; the Space-editor accent preview), and so any scope
that rebinds `--base-hue` to `--space-h` resolves the token against the active Space's
hue. The nine per-Space `--space-<color>-l/-c/-h` palette tokens (this capability's
canonical palette) SHALL be unaffected by this requirement.

#### Scenario: Surfaces with no active Space render the ember identity hue

- **WHEN** a surface renders with no Space hue in scope (the new-tab home with no Space, the options page, or the launcher overlay before a Space is active)
- **THEN** its accent and hue glow SHALL render at the hearth-ember identity hue (≈62)
- **AND** they SHALL NOT render at the prior cool/violet hue

#### Scenario: Per-Space colours are unchanged

- **WHEN** a Space is active
- **THEN** the accent, aurora, and hue glow SHALL render at that Space's own hue
- **AND** the nine-colour Space palette SHALL be unchanged by this requirement
- **AND** a `gray` Space SHALL still wash neutral

#### Scenario: Contrast holds at the ember hue

- **WHEN** text and accents render at the resting ember identity hue, at any tint level
- **THEN** they SHALL meet WCAG AA
- **AND** the automated contrast test SHALL assert this with its default base hue set to the ember value

### Requirement: Per-Space identity renders each colour at its canonical OKLCH

Each `SpaceColor` SHALL have a canonical OKLCH lightness, chroma, and hue that is
**canonical in the `@lunma/tokens` package** as CSS custom properties (per colour),
the single cross-app source for the palette. Because `@lunma/tokens` is CSS-only
and the service worker needs the numbers in TypeScript, the extension's
`colourToOklch` / `PALETTE` in `apps/extension/src/shared/space-hue.ts` SHALL be a
runtime **mirror** of those token values, held in lockstep with the tokens by an
automated parity check (`vitest`) that fails on any drift — so although the palette
is declared in two representations (CSS for consumers, TS for the runtime) they can
never disagree. No app SHALL hand-duplicate the palette values or the on-ink
formula. The derived per-Space colour-scope family — the solid fill `--space-c` and
its translucent `--space-c-soft` / `--space-c-dim` variants — SHALL likewise be
composed **once** by a shared `@lunma/tokens` recipe (`.lunma-space-scope`), applied
on each surface that scopes a Space (the sidebar, new-tab, options page, and the
marketing mocks), so no surface hand-copies that formula either. The values are
chosen so the colour reads **true to its
name** (e.g. `yellow` light, `blue` deep) rather than a single flat lightness across
hues. The active Space's canonical lightness, chroma, and hue SHALL be exposed as the
scoped custom properties `--space-l`, `--space-chroma`, and `--space-h`, and every
per-Space identity surface — the colour swatch, the switcher chip (`--space-c`), the
sidebar wash, the aurora, the hue glow, and the accent — SHALL derive from
`oklch(var(--space-l) var(--space-chroma) var(--space-h) / <surface alpha>)` (a small
clamped `calc()` lightness offset is permitted where surface layering requires it), so
the whole identity renders the same true colour. A neutral (`gray`) Space SHALL render
at chroma 0 on every surface.

Text rendered on a Space colour (the chip count, on-accent labels) SHALL use a
per-colour readable token `--space-on` (dark on light colours, light on dark colours)
so it meets WCAG AA across the full light→dark range of the palette, asserted **per
colour** by automated contrast tests. The on-ink SHALL be provided by `@lunma/tokens`
(a per-colour `--space-<color>-on` custom property and/or a recipe), not re-derived by
each consumer.

#### Scenario: A colour renders true across the whole identity

- **WHEN** a Space with a warm colour (e.g. `yellow`) is active
- **THEN** its swatch, chip, wash, aurora, glow, and accent SHALL all render at the
  colour's canonical lightness/chroma/hue (a true yellow)
- **AND** they SHALL NOT render at a single flat lightness that muddies warm hues

#### Scenario: On-colour text stays readable across light and dark colours

- **WHEN** text is rendered on a Space colour (chip count, on-accent label) for any of
  the nine palette colours
- **THEN** it SHALL use `--space-on`
- **AND** it SHALL meet WCAG AA, verified per colour by a contrast test

#### Scenario: Gray stays neutral

- **WHEN** a `gray` Space is active
- **THEN** every identity surface SHALL render at chroma 0 with no visible hue tint

#### Scenario: The palette has one source — no hand-duplication

- **WHEN** the marketing site (`apps/site`) renders Space colours (e.g. the staged
  window mock or the OG image)
- **THEN** it SHALL consume the `@lunma/tokens` palette custom properties / on-ink
  recipe directly
- **AND** it SHALL NOT carry its own copy of the L/C/H tuples or a re-implemented
  `ink()` formula

#### Scenario: The colour-scope family has one source — no per-surface drift

- **WHEN** a surface scopes a Space and needs the derived colour family
  (`--space-c` / `--space-c-soft` / `--space-c-dim`) — the sidebar, the new-tab home,
  the options page, or a marketing mock
- **THEN** it SHALL obtain that family from the shared `@lunma/tokens`
  `.lunma-space-scope` recipe applied on its scope element
- **AND** it SHALL NOT re-declare the `oklch(var(--space-l) var(--space-chroma)
  var(--space-h) / …)` formula locally, so the variants' alphas cannot drift between
  surfaces

#### Scenario: The extension TS palette cannot drift from the tokens

- **WHEN** the `@lunma/tokens` palette values and `apps/extension/src/shared/space-hue.ts`
  disagree on any colour's lightness, chroma, hue, or on-ink
- **THEN** the automated parity check SHALL fail (`vitest`), so the TS runtime
  mirror stays locked to the canonical tokens

### Requirement: Toast auto-dismiss is interruptible

The shared `Toast` primitive's auto-dismiss timer SHALL pause while the
pointer is over the toast or while focus is within it, and SHALL resume with
the remaining time when the pointer leaves and focus moves out. Pressing
**Escape** while focus is within the toast SHALL dismiss it immediately. The
toast's visual presentation (surface, shadow, action styling) is unchanged —
pausing has no countdown chrome.

#### Scenario: Hover pauses the dismiss timer

- **WHEN** a 5s toast is showing and the user moves the pointer over it for 10
  seconds, then leaves
- **THEN** the toast is still visible throughout the hover
- **AND** it dismisses only after the remaining time elapses post-leave

#### Scenario: Focus within pauses, Escape dismisses

- **WHEN** the user tabs focus to the toast's Undo action and waits past the
  nominal timeout
- **THEN** the toast remains visible
- **AND WHEN** the user presses Escape
- **THEN** the toast dismisses without invoking the action

### Requirement: JS-driven move animations honour reduced motion

JS-driven list-move animations in the sidebar SHALL honour reduced motion:
the FLIP move helpers, Svelte `animate:flip` usages, and any JS-read
transition durations SHALL resolve from the motion tokens or collapse to zero when
`prefers-reduced-motion: reduce` is active, sampled at each animation start
(so an OS-level toggle takes effect without a reload). The sidebar surfaces
this change touches (the FLIP move helpers and the `SpaceSwitcher`'s JS-read
transition durations) SHALL NOT carry hard-coded millisecond literals for
those animations; their durations read the `--motion-*` tokens.

#### Scenario: Reduced motion suppresses FLIP moves

- **WHEN** `prefers-reduced-motion: reduce` is active and a tab reorder
  re-sorts the list
- **THEN** rows take their new positions without a sliding FLIP animation

#### Scenario: Mid-session OS toggle is respected

- **WHEN** the user enables reduced motion at the OS level while the sidebar is
  open and then triggers a Space-switch settle
- **THEN** the settle resolves on the fast tick without requiring a sidebar
  reload

### Requirement: A hearth glow colour token joins the immersive family

`packages/tokens/tokens.css` SHALL declare a `--glow-hearth` token in the
immersive family: the hearth bloom's **colour** — a full-alpha `oklch()`
colour value (NOT a box-shadow value like `--glow-space`, and not a
gradient), parametric on `var(--space-h)` / `var(--space-chroma)` with the
same `:root` fallbacks the other immersive tokens carry (`, 62` / `, 0.15`)
so it resolves to the ember at rest, recolours inside a per-Space scope, and
washes neutral for a `gray` Space. Consumers compose the colour into their
own gradients and apply their own per-tint alpha scaling (the launcher's
hearth requirement owns the new-tab home's alphas) — the token itself
carries colour only, and consumers SHALL read the token rather than
restating the formula. The new-tab home is the first consumer.

#### Scenario: The token resolves at :root without a Space scope

- **WHEN** `--glow-hearth` is read on a surface with no per-Space scope
- **THEN** it resolves to the ember-hue colour via the declared fallbacks (not
  invalid-at-computed-value)

#### Scenario: A Space scope recolours the token

- **WHEN** `--glow-hearth` is read inside a scope declaring `--space-h`/
  `--space-chroma` for a blue Space
- **THEN** it resolves to the blue Space's hue and chroma

#### Scenario: Contrast holds over the hearth at every tint

- **WHEN** the automated WCAG-AA contrast tests run
- **THEN** they include muted text over the hearth bloom's peak (at the
  consumer's per-tint alphas) at each tint level, and pass

### Requirement: The hover tooltip plays a transform-only entrance and tears down with its trigger

The shared `Tooltip` primitive (`apps/extension/src/ui/Tooltip.svelte`) SHALL
present its content when its trigger is hovered or focused and hide it on
leave/blur. Its entrance SHALL be **transform-only** over the fast motion token
(`--motion-fast` / `--ease-emphasised`), and SHALL be suppressed under
`prefers-reduced-motion: reduce` with an identical end state (the content simply
appears, no transform). Body text in the tooltip SHALL meet WCAG AA against its
surface.

The tooltip's positioned content layer SHALL be owned by the headless tooltip
behaviour rather than a hand-rolled presence gate, and SHALL unmount **together
with its trigger**: when the trigger is removed — for example a sidebar list row
unmounting on a Space switch, a lens refresh, hide-read, or an item
dropping out of a connector result set — the tooltip's content/positioning layer
SHALL NOT remain mounted beyond the trigger's teardown. No stale tooltip SHALL
linger after its trigger is gone, and no reactive read SHALL survive the
trigger's unmount (so the teardown emits no `derived_inert` warning). When the
primitive is disabled (`enabled={false}`), it SHALL render the trigger plain with
no tooltip layer and no behaviour-library wrappers at all.

#### Scenario: Hover shows the tooltip with a transform-only entrance

- **WHEN** the user hovers (or focuses) a trigger wrapped in an enabled `Tooltip`
- **THEN** the tooltip content SHALL appear positioned to the configured `side`
- **AND** its entrance SHALL animate transform only, over `--motion-fast`, with no
  layout shift of the trigger

#### Scenario: Reduced motion removes the tooltip entrance

- **WHEN** `prefers-reduced-motion: reduce` is active and a tooltip opens
- **THEN** the entrance animation SHALL NOT play
- **AND** the rendered tooltip SHALL be identical to the animated end state

#### Scenario: The tooltip layer unmounts with its trigger

- **WHEN** a trigger carrying an open (or closing) tooltip is removed from the DOM
  because its host (e.g. a sidebar list row) unmounts
- **THEN** the tooltip's content and positioning layer SHALL unmount as part of the
  same teardown
- **AND** no tooltip SHALL remain visible afterwards and no `derived_inert` warning
  SHALL be emitted

#### Scenario: A disabled tooltip renders no layer

- **WHEN** a `Tooltip` is rendered with `enabled={false}`
- **THEN** the trigger SHALL render plainly with no tooltip content in the DOM
- **AND** no behaviour-library provider/root wrappers SHALL be present and the
  trigger SHALL receive no tooltip ARIA props

### Requirement: Aurora and hue glow are suppressed when showGlares is false

When the `showGlares` setting is `false`, surfaces SHALL suppress the aurora
backdrop and hue-glow effects entirely, regardless of the `tint` level. The
suppression SHALL be applied via:

1. The surface root's `data-show-glares="false"` attribute (set by
   `watchSettings`) causing the `Aurora` component to not render (controlled
   by the host via `{#if}`, not `opacity: 0`).
2. A `[data-show-glares="false"]` block in each surface's own CSS file
   (`app.css` for the sidebar, `newtab.css` for the launcher new-tab, and the
   `<style>` block of `Options.svelte`) that overrides `--glow-space`,
   `--glow-space-soft`, and `--glow-hearth` to `0 0 0 0 transparent` /
   `transparent`. The overrides live in the surface files (not
   `packages/tokens/tokens.css`) because each surface redeclares these tokens
   at its own scope to capture the active Space hue — a `tokens.css` rule would
   be overridden by those redeclarations.

Glass panels (`Surface.svelte` `backdrop-filter`) SHALL be unaffected.
The `tint` setting continues to control colour intensity independently; when
`showGlares` is `false`, the aurora is absent and glow is cleared at every tint
level.

#### Scenario: Aurora does not render when showGlares is false

- **WHEN** a surface renders with `data-show-glares="false"`
- **THEN** the `Aurora` component SHALL NOT be mounted in the DOM
- **AND** no aurora backdrop SHALL be visible regardless of the `tint` value

#### Scenario: Hue glow resolves to nothing when showGlares is false

- **WHEN** an element reads `--glow-space` or `--glow-hearth` inside a
  `[data-show-glares="false"]` scope
- **THEN** both tokens SHALL resolve to `0 0 0 0 transparent`
- **AND** no hue-glow shadow SHALL be visible on identity elements

#### Scenario: Glass panels are unaffected

- **WHEN** `showGlares` is `false` and a `Surface` with `variant="glass"` renders
- **THEN** its `backdrop-filter` and border highlight SHALL remain unchanged
- **AND** only the aurora and glow SHALL be absent

#### Scenario: showGlares composes with tint

- **WHEN** `showGlares` is `false` and `tint` is `vivid`
- **THEN** the aurora SHALL NOT be mounted and the glow SHALL resolve to transparent
- **AND** the surface SHALL read as a glass-only panel with identity carried through colour chips, accent, and edge stripe only

#### Scenario: showGlares change reflects live

- **WHEN** the user toggles "Background effects" from On to Off while the sidebar is open
- **THEN** the sidebar SHALL update `data-show-glares` via `watchSettings`
- **AND** the aurora and glow SHALL disappear without a reload

