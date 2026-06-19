## ADDED Requirements

### Requirement: Options cards compose shared card primitives

The options page's cards SHALL compose shared `apps/extension/src/ui/` primitives for their common chrome rather than each card re-rolling it, so the heading, frame, label column, and error box are defined once and cannot drift between cards. The primitives SHALL be token-only (referencing `@lunma/tokens`, no raw `font-size`/`z-index`/colour literals) and SHALL forward any `data-testid` their callers rely on:

- **`CardHeading.svelte`** — renders the card's `<h2>` heading in the display serif (`--font-display`) at `--text-xl` in sentence case, carrying the `:root[data-tint='standard'|'vivid']` identity-hue override (`oklch(from var(--space-c) max(l, 0.72) c h)`, the WCAG-AA-floored hue treatment). It SHALL accept the heading text and an optional `actions` slot rendered beside the heading (so a card whose heading shares a row with an action — e.g. Recently archived's Clear-all — composes the primitive instead of re-rolling its heading).
- **`SettingsCard.svelte`** — composes a glass `Surface` plus the card's inner padding, a `CardHeading`, and an optional muted `description` paragraph, with a `children` slot for the body. Every options card composes it.
- **`SettingText.svelte`** — the label + optional description column (the settings-row text trio).
- **`InlineError.svelte`** — a `role="alert"` inline error box carrying the shared danger styling.

#### Scenario: A card heading renders the shared serif treatment with its tint override

- **WHEN** any options card renders its heading via `CardHeading`
- **THEN** the heading SHALL be set in `--font-display` at `--text-xl` in sentence case
- **AND** at `data-tint` `standard`/`vivid` it SHALL render the identity-hue override, meeting WCAG AA

#### Scenario: Cards compose the primitives rather than re-rolling chrome

- **WHEN** an options card needs the card frame, heading, label column, or an error box
- **THEN** it SHALL compose `SettingsCard` / `CardHeading` / `SettingText` / `InlineError`
- **AND** it SHALL NOT declare its own glass panel, serif-heading rule, or `role="alert"` danger box inline

#### Scenario: A heading with a row action composes the actions slot

- **WHEN** a card's heading shares its row with an action control (e.g. Recently archived's Clear-all)
- **THEN** the action SHALL be rendered through `CardHeading`'s `actions` slot
- **AND** the card SHALL NOT re-roll its own `<h2>` to place the action

### Requirement: Options-page inline reveals manage focus and announce outcomes

The options page's inline reveals — the Backup import confirm, the Feed-subscriptions OPML import confirm, the Recently-archived Clear-all confirm, the Connectors token-replace reveal, and the Result-sources grant — SHALL keep keyboard users oriented and announce their outcome to assistive tech rather than unmounting the activated control and dropping focus to `<body>`. On opening a reveal, focus SHALL move to its primary revealed control (the confirm's primary action, or the connector-replace password field); on cancelling, focus SHALL return to the trigger that opened it. A state change with no follow-up control (the Result-sources grant, which swaps a button for an "Enabled" indicator) SHALL announce success through the shared `Toast` primitive, as the Backup and Feed flows already do.

#### Scenario: Opening a confirm moves focus to its primary action

- **WHEN** the user activates Backup's Import, Feed subscriptions' Import from OPML, or Recently archived's Clear all and the inline confirm row reveals
- **THEN** keyboard focus SHALL move to the confirm's primary action (Restore / Import / Delete), not fall to `<body>`

#### Scenario: Cancelling a reveal restores focus to the trigger

- **WHEN** the user cancels an inline confirm or the Connectors token-replace reveal
- **THEN** the reveal SHALL close and keyboard focus SHALL return to the trigger that opened it

#### Scenario: Granting a result source announces success

- **WHEN** the user activates a Result-sources "Enable" control and the grant succeeds, swapping the button for the "Enabled" indicator
- **THEN** a `Toast` SHALL announce the result, so the change is not a silent swap to assistive tech

## MODIFIED Requirements

### Requirement: The options page renders on-brand

The options page SHALL render Lunma's on-brand appearance. The wordmark SHALL be
set in the display serif (`--font-display`) with an identity-hue glow dot, and the
setting groups SHALL render on the shared `SettingsCard` primitive (a glass
`Surface`) over a subtle `Aurora` backdrop, without reducing form legibility below
WCAG AA. There is no live appearance preview — the page's own glass surfaces
reflect the active `density` and `tint` selections live.

The page SHALL carry an editorial hierarchy: every card heading — the registry
setting-groups AND the standalone management cards (Backup & restore, Feed
subscriptions, Recently archived, Connectors, Result sources) — SHALL be set in the
display serif (`--font-display`) at the `--text-xl` stop in sentence case with the
identity-hue treatment via the shared `CardHeading` primitive (serif carries
identity; the body and controls stay in the sans — the established pairing rule);
no card SHALL hand-roll its heading or fall back to the retired uppercase
micro-label. Group descriptions SHALL render in the muted body style, and cards
SHALL be separated by the `--space-6` rhythm so the page reads in three clear
levels (wordmark → card headings → controls). Headings and descriptions SHALL read
type and spacing from the token scale (no raw font sizes).

The Colour-intensity control drives a **graduated glass ramp**: the cards are glass
at every level and the tint calms the glass fill across `subtle` → `standard` →
`vivid` rather than switching between glass and an opaque card — form text SHALL
remain at least WCAG AA at every level. The page's own animations — the
shortcut-guidance card's entrance and the cards' tint cross-fade — SHALL be
suppressed under `prefers-reduced-motion: reduce` (end state identical), so reduced
motion holds at every colour-intensity level.

#### Scenario: Options page renders on-brand

- **WHEN** the options page renders
- **THEN** the wordmark SHALL be set in the display serif with an identity-hue glow dot
- **AND** the setting groups SHALL render on `SettingsCard` panels over a subtle aurora

#### Scenario: Group headings carry the editorial serif

- **WHEN** the options page renders its setting groups
- **THEN** each group heading SHALL render in `--font-display` at `--text-xl`
  in sentence case with the identity-hue treatment
- **AND** descriptions and controls SHALL remain in the sans with token-scale
  sizes only

#### Scenario: Every card heading uses the shared serif heading

- **WHEN** the options page renders the standalone management cards (Backup & restore, Feed subscriptions, Recently archived, Connectors, Result sources)
- **THEN** each card's heading SHALL render via the shared `CardHeading` serif treatment, matching the registry group headings
- **AND** no card heading SHALL render as the retired uppercase micro-label

#### Scenario: Colour-intensity ramps smoothly across levels

- **WHEN** the user moves the Colour intensity control across `subtle`, `standard`, and `vivid`
- **THEN** the cards SHALL be glass at every level, with the glass fill calming as colour is dialled down
- **AND** each level SHALL be visually distinct from the others, with no two levels identical and no opaque↔glass jump
- **AND** form text SHALL remain at least WCAG AA at every level

#### Scenario: Reduced motion is honoured on the options page

- **WHEN** `prefers-reduced-motion: reduce` is active and the shortcut-guidance card appears or the user changes the Colour intensity
- **THEN** the shortcut card's entrance animation and the cards' tint cross-fade SHALL NOT play
- **AND** the final rendered state SHALL be identical to the animated end state
