## Context

The `visual-system` requirement "Immersive aesthetic preserves reduced-motion and
contrast guarantees" promises WCAG-AA in both themes, gated by
`apps/extension/src/ui/contrast.test.ts`. The archived
`2026-06-30-light-theme-status-contrast` change closed the status-token and
`--space-c`-ring gaps, but four marks still used dark-tuned values directly in
light theme:

- `SpaceSwitcher` `.chip-add` (the dashed "+" add-Space tile) outlined with the
  decorative `--border` — `oklch(0.875 …)` ≈ **1.45:1** on the near-white
  `--surface`, below the WCAG 1.4.11 3:1 non-text floor for an interactive
  control.
- `OverviewPage` `.group-label.waiting` (the accent "Review requests" group head)
  coloured with an inline `oklch(var(--accent-text-l) 0.09 252)`. The inline
  literal duplicates the intent of the existing `--accent-heading` token
  (`0.74 0.13 235` dark / `0.48 0.15 252` light) without its theme contract, and
  was never gated.
- `OverviewPage` `.ci` CI glyph coloured `oklch(0.82 0.1 var(--ci-h))` on a
  `oklch(0.55 0.13 var(--ci-h) / 0.2)` tint — a ~0.82 glyph washes out on the
  pale light composite.
- `SpaceSwitcher` `.chip[data-active] .tile` (the active Space's icon) coloured
  `oklch(0.84 var(--space-chroma) var(--space-h))` — barely visible on the light
  `--space-c-soft` fill, and effectively invisible for a gray Space (chroma 0).

The common fault is a hard-coded ~0.82–0.84 lightness (correct on a dark
substrate, washed out on light paper) and, for the border, reuse of a token
documented as decorative. The gap was invisible because the contrast test
covered neither the accent label nor interactive-control borders. This change
lands on top of the `redesign-lens-overview-board` overview, which restructured
the page but kept these selectors with their dark-tuned values.

## Goals / Non-Goals

**Goals:**
- Make all four marks legible in light theme at the WCAG-AA bar the requirement
  already promises, without regressing dark.
- Remove the hard-coded glyph/border lightness from the two feature components in
  favour of existing theme-aware tokens.
- Close the test gap so the new floors can't silently regress.

**Non-Goals:**
- No new tokens, primitives, components, or files.
- No change to the dark-theme token *values* themselves.
- No restyling beyond the colour/border tokens these elements read.
- No change to the lens-overview layout (owned by `redesign-lens-overview-board`),
  the per-Space palette (`space-hue.ts`), or the status-token values.

## Decisions

**1. `.chip-add` border `--border` → `--border-strong`.** `--border-strong`
(`oklch(0.56 …)` light / `0.58 …` dark) clears 3:1 on every list surface in both
themes (light 4.64:1 on `--surface`; dark ≥3:1). It is the system's
"clearly-visible boundary" token; `--border-field` was rejected because it sits
at 2.98:1 on the dark `--surface-2`, and the dashed tile floats on the bar rather
than a form surface.
- *Alternative — keep `--border`, add a `[data-theme='light']` override:* rejected;
  `--border` is intentionally decorative and reused widely, and a per-component
  light override re-introduces hard-coded values.

**2. `.group-label.waiting` inline `oklch(var(--accent-text-l) …)` →
`--accent-heading`.** `--accent-heading` is the existing theme-aware accent-label
token (light 6.55:1 on `--surface`, dark 8.27:1); using it removes the inline
literal and brings the label under the token contract.

**3. `.ci` CI glyph composes the status tokens via a `tone` discriminant.** The
CI hues map exactly onto the already-light-darkened status tokens — passed→
`--success` (150), failing→`--danger` (25), running/unstable→`--warning` (75).
`ciLight()` in `overview-vm.ts` gains a `tone: 'passed' | 'failing' | 'running'`
field (draft keeps `draft: true` → the existing `.hollow` `--text-dim` ring); the
`.ci` element applies `class:ci--passed`/`ci--failing`/`ci--running`, and the CSS
sets `color: var(--success|--danger|--warning)` with the tint as
`background: color-mix(in oklch, var(--<token>) 18%, transparent)`. This removes
both hard-coded `oklch()` values and inherits the status tokens' existing
both-theme contrast gate.
- *Adding the `tone` field to `ciLight`'s return is a named view-model change;*
  the raw `hue` field is retained for the draft case and any existing consumers.
- *Alternative — keep `--ci-h` and add a light lightness override:* rejected; it
  keeps hard-coded lightness and duplicates the status-token light tuning.

**4. `.chip[data-active] .tile` glyph `oklch(0.84 …)` → `--space-c`.** The active
chip's icon adopts the same theme-aware, contrast-capped Space colour the chip's
ring already uses (`--space-c`), so glyph and ring read as one identity and the
icon darkens correctly on the light `--space-c-soft` fill. For a gray Space the
glyph becomes the neutral `--space-c` (visible) instead of the near-white 0.84.
- *Trade-off:* the dark-theme glyph shifts from a bright `0.84` to the Space's own
  `--space-c` lightness (slightly less neon, hue identity unchanged). Accepted as
  the cost of a single theme-aware source.

**5. Gate `--accent-heading` (AA 4.5:1 on `--surface`/`--surface-2`/`--bg`/
`--surface-3`) and `--border-strong` (3:1 non-text on `--surface`/`--surface-2`/
`--bg`) in `contrast.test.ts`, both themes.** The glyph fills (decisions 3–4)
inherit the status-token and `--space-c` gates that already exist; a composited
glyph-on-`--space-c-soft` gate is **not** added (the soft wash is a low-alpha
composite the token-pair harness does not model) — a known coverage edge, logged
here rather than silently assumed covered.

No decision diverges from `docs/`; no `docs/` file needs editing (the token and
recipe families are already described at a level that stays accurate).

## Visual language

Contrast-only — this shifts which existing token each mark reads; it adds no
motion, layout, or new surface.

- **Colour usage.** Every mark keeps its hue identity: the add-tile boundary
  stays a neutral hairline (just dark enough to read), the "Review requests"
  label stays the accent blue, the CI glyphs stay green/red/amber, and the active
  Space glyph stays the Space's own hue. Only lightness firms up on light paper.
- **Parity with dark.** Dark theme keeps its values (decision 4's glyph shift
  aside), so both themes present the same legibility budget for borders, accent
  labels, and status/identity glyphs.
- **Reduced motion / Arc.** No motion involved. This is the WCAG-AA floor the
  requirement already binds for both themes.

## Risks / Trade-offs

- **The active-chip glyph is slightly less bright in dark theme** (`--space-c`
  instead of `0.84`). → Acceptable; it unifies glyph and ring, hue identity
  preserved; the alternative keeps a hard-coded value the policy forbids.
- **Glyph-on-`--space-c-soft` is not gated** (composited low-alpha wash). → The
  glyph reads `--space-c`, already capped/gated as a non-text mark; the residual
  soft-wash composite is logged as a known coverage edge.
- **`ciLight` gains a `tone` field.** → Named in the proposal; additive,
  non-breaking, retains `hue` for existing consumers.

## Migration Plan

Pure token/CSS/view-model-field change; no data or API migration. Rollback is
reverting the edited files; no persisted state depends on the values.

## Open Questions

None.
