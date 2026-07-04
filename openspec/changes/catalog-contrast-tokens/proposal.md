## Why

The catalog UX review (`docs/design/catalog-review.md`) found the P1 contrast
trio plus three related WCAG failures: interactive controls whose idle boundary
is imperceptible (<3:1), the Space accent misused as foreground text/glyph
(~1.1:1 on light Space hues), destructive text self-tinting below AA, and
status/hue foregrounds that were never hardened for elevated/washed surfaces or
re-rolled palette hues. These are real, testable accessibility defects across
~14 primitives, and they share a single root cause — colour roles resolved
ad-hoc per primitive instead of through named, theme-aware tokens — so one
colour-role change repairs all of them and is the roadmap's Phase-1 entry point.

## What Changes

- Add three genuinely-missing colour-role tokens to `@lunma/tokens`, both theme
  blocks: `--accent-label` (accent-coloured text/glyph, distinct from the
  already-present `--accent-on` ink-on-accent), `--danger-text` (legibility-tuned
  destructive text, distinct from `--danger` graphic/`--danger-soft` wash), and
  `--status-neutral` (a pending/neutral status colour beside `--success`/`--danger`).
- Retarget interactive-control idle boundaries to the existing `--border-strong`/
  `--border-field`: Button (`--border`/`--border-soft`), SegmentedControl, and
  Chip (currently an ad-hoc `color-mix(--text-faint …)`) (DS-01).
- Route accent-as-foreground through `--accent-on` (check on an accent-filled
  box) / `--accent-label` (accent text on a plain surface): IconPicker selected
  glyph, MultiSelect Select-all/Clear action text + checkmark, Select selected
  check (DS-02).
- Route destructive text/wash through `--danger-text` over `--danger-soft`:
  InlineError body, Menu danger item (replacing per-primitive `color-mix`) (DS-03).
- Fix informative text on its actual failing backing: the `FolderRow` count badge
  (`--text-faint` → an AA token on `--surface-2`) and the `TabRow` `.meta` line
  (`--text-dim`, verified/hardened where it is composited over the `--space-c-soft`
  hover wash). Diffstat numerals are already `--success`/`--danger` over a
  `--surface-3` track (already contrast-tested) — not part of this change (DS-04).
- Normalise per-Space hues re-rolled as foreground/ring through a light-theme
  lightness floor: ColorSwatch selection ring (CSS cap on its existing
  `--swatch-l`) and LensRow leading glyph (which composes its hue as an inline
  `oklch()` string, so it gains a raw `--lens-l` custom property for the CSS cap
  to reach — a small markup change) (DS-05).
- Consume `--status-neutral` for the Avatar pending indicator (DS-25).
- Extend `apps/extension/src/ui/contrast.test.ts` with the new colour-role pairs
  so none of the above can regress unnoticed.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `visual-system`: four requirements change. (1) "Design values are defined as
  tokens and consumed by primitives" — the minimum-token-set grows by
  `--accent-label`, `--danger-text`, `--status-neutral`. (2) "Immersive aesthetic
  preserves reduced-motion and contrast guarantees" — gains contract bullets +
  scenarios for interactive-control idle boundaries, accent-as-foreground,
  danger-as-text, informative text on its failing backing, per-Space hue re-rolled
  as foreground/ring, and neutral status. (3) "Review-lens primitives are
  token-driven ui/ components" — the `Avatar` pending ring moves from `--text-dim`
  to `--status-neutral` (must be updated here, or the archived spec would assert
  both). (4) "A shared MultiSelect primitive…" — the selected check moves from the
  frozen `--accent-text` to `--accent-on`, and the Select-all/Clear action text to
  `--accent-label` (same self-consistency reason).

## Impact

- `packages/tokens/tokens.css` — 3 new tokens × 2 theme blocks, plus a hardening
  of the existing `--text-dim` in both blocks (dark 0.650→0.690, light
  0.495→0.480) so the `TabRow` `.meta` line still clears 4.5:1 when composited
  over the bright-Space `--space-c-soft` wash, not only on the opaque surface
  (agreed at apply time; see design.md Decisions).
- `apps/extension/src/ui/` — CSS retargeting in 13 primitives (Button, Chip,
  SegmentedControl, IconPicker, MultiSelect, Select, InlineError, Menu, FolderRow,
  TabRow, ColorSwatch, Avatar) plus one small markup change in `LensRow.svelte`
  (exposing a raw `--lens-l` custom property so the light-theme CSS cap can reach
  its hue). No prop/contract changes; each touched primitive already has a catalog
  story that exercises its retargeted state (story-parity guard satisfied), so a
  story is updated only where a retarget surfaces a state its story did not
  already show (DS-38, broader story-axis coverage, is a separate change).
- `apps/extension/src/ui/contrast.test.ts` — new asserted pairs (the RED gate),
  including a `--space-h` sweep for the worst-case Space hues.
- No import-DAG, Zod, or message-bus surface touched.
