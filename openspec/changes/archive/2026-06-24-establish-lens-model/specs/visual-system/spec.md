# visual-system Specification

## MODIFIED Requirements

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
