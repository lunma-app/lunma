## ADDED Requirements

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
