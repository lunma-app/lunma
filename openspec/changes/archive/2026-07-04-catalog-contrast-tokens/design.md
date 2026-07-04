## Context

Phase-1 change #1 of the catalog-review roadmap. The roadmap titled it
"colour-role tokens — all edit `tokens.css`", but an audit of the current
`packages/tokens/tokens.css` (both theme blocks) found most of the tokens the
review's DS items call for **already exist**:

- `--border-strong` / `--border-field` — present, lifted to the 3:1 non-text
  floor in both themes (the interactive-boundary tokens DS-01 targets).
- `--accent-on: var(--space-on)` — present, flips per Space (DS-02's ink-on-
  accent half).
- `--danger-soft` — present, the destructive hover wash (DS-03's wash half).
- `--text-dim` — already darkened to clear AA 4.5:1 on `--surface-3` in light
  (part of DS-04).
- The `.lunma-space-scope` light-theme lightness cap (`min(--space-l, 0.55)`)
  that keeps `--space-c` ≥3:1 as a boundary (DS-05's mechanism, for `--space-c`).

So the real work is ~90% **retargeting primitive CSS to consume existing/new
tokens**, not adding tokens. Only three colour roles are genuinely missing.
`apps/extension/src/ui/contrast.test.ts` already exists and asserts both theme
blocks — it is the RED gate this change extends. The findings and their
consumers come from `docs/design/catalog-review.md` (DS-01..05, DS-25).

## Goals / Non-Goals

**Goals:**

- Add exactly three colour-role tokens (`--accent-label`, `--danger-text`,
  `--status-neutral`), both theme blocks, each with a `contrast.test.ts` pair.
- Retarget every consumer named in DS-01..05 + DS-25 to route its colour through
  the correct named token; delete the per-primitive `color-mix`/raw-hue re-rolls.
- Clear WCAG 1.4.11 (DS-01, DS-05 ring) and 1.4.3 (DS-02, DS-03, DS-04, DS-05
  glyph) for the listed primitives in **both** themes, verified by the automated
  contrast test, not assumed.

**Non-Goals:**

- The accent-pill fill recipe (DS-37), glass-on-aurora muted assertion (DS-20),
  and per-story axis coverage (DS-38) — separate roadmap changes.
- Any **public** prop/API/contract change to a primitive. The work is token + CSS,
  with one internal exception: LensRow gains a private `--lens-l` CSS custom
  property (not a Svelte prop) so the light-theme cap can reach its hue (DS-05).
- Retuning `--danger`/`--success`/`--warning`/`--info` themselves; DS-04 here is
  narrowed to its two real consumers — the `FolderRow` count (`--text-faint` on
  `--surface-2`) and the `TabRow` `.meta` over the `--space-c-soft` wash. The
  review's DS-04 also named `Diffstat` numerals, but they are `--success`/
  `--danger` over a `--surface-3` bar track (not `--text-faint`, not on
  `--surface-3`) and are already asserted by the status-token contract — so
  Diffstat is **out of scope** here (a spec-reviewer correction).

## Decisions

- **Only three new tokens; everything else is retargeting.** Deviates from the
  roadmap's "all edit `tokens.css`" shorthand — confirmed with the user (scope:
  "whole contrast fix", DS-05 included). Adding a token no primitive consumes
  would strand infrastructure (banned by the user-value policy), so token adds
  and their consumers land together in this one change.
- **`--accent-label` is Space-hue-following, not the frozen-blue
  `--accent-heading`.** DS-02's failures (MultiSelect Select-all/Clear text +
  check, Select check, IconPicker glyph) are *selection/action affordances that
  must read in the active Space hue* — a fixed blue would break identity. So
  `--accent-label` follows `--space-h`, with its lightness chosen per theme to
  clear 4.5:1 on `--surface`/`--surface-2`/`--bg` for every Space hue (dark:
  high-L; light: capped low, same spirit as the space-scope floor but tuned to
  the 4.5:1 text floor, tighter than the 3:1 boundary cap). Distinct from
  `--accent-on` (ink *on* a solid accent fill) — different surface, different
  role. Exact lightness is pinned by `contrast.test.ts`, not guessed here.
- **`--danger-text` is a third danger role.** `--danger` stays the graphic hue
  (dots, bars, borders, verified 4.5:1 only bare on base surfaces); `--danger-soft`
  stays the wash; `--danger-text` is the legible destructive *label*, tuned to
  clear 4.5:1 both on `--surface`/`--bg-elev` and over the `--danger-soft` wash
  (the InlineError/Menu case where danger text sits on its own danger tint).
- **`--status-neutral` is decoupled from `--text-dim`.** DS-25's root cause is
  Avatar borrowing the text-scale `--text-dim` for a pending *status* signal, so
  a type-scale retune silently shifts a status colour. The new token is a
  status-family sibling of `--success`/`--danger` (neutral/desaturated), owned by
  the status contract, not the text scale.
- **DS-05 caps via a two-name derivation, not a self-referential property.**
  LensRow's glyph and ColorSwatch's ring re-roll a per-item palette hue from JS,
  bypassing `--space-c` and its `.lunma-space-scope` cap. The cap must apply to
  the hue's **lightness**. A property cannot cap **itself** —
  `--swatch-l: min(var(--swatch-l), …)` is a custom-property self-reference cycle,
  invalid at computed-value time (CSS Custom Properties L1 §3), so the consuming
  `oklch()` computes invalid and the colour blanks rather than caps. Worse, the
  contrast unit test (task 1.2) recomputes `min()` in `culori` and would
  false-green over the broken CSS. So the pattern is two distinct names: keep the
  raw inline `--swatch-l`/`--lens-l`, and consume a **separately named** derived
  property — base `--dot-l: var(--swatch-l)`, then `[data-theme='light'] { --dot-l:
  min(var(--swatch-l), …) }` — composing the ring/glyph from `var(--dot-l)`.
  ColorSwatch already exposes `--swatch-l` (a bare number), so only the derived
  property is added. LensRow composes its hue as a complete `oklch(${l} ${c} ${h})`
  **string** (`LensRow.svelte:78`) that CSS cannot cap — so LensRow gains a raw
  `--lens-l` custom property (a small markup change) plus the derived
  `--glyph-l`, recomposing the colour from the parts. The cap is theme-scoped
  (`[data-theme='light']` only) so the dark-theme glyph is untouched; the CSS
  correctness (which the unit test can't see) is verified in the manual catalog
  light-theme pass. Ring floor 3:1; glyph floor 4.5:1. This is why the change is
  **not** "CSS-only" — LensRow
  needs one markup edit (surfaced and agreed).
- **The Avatar and MultiSelect retargets each modify a second living
  requirement, in this change.** Retargeting Avatar's pending ring
  (`--text-dim` → `--status-neutral`, DS-25) contradicts the "Review-lens
  primitives" requirement, which pins `--text-dim (pending)`; retargeting the
  MultiSelect check (`--accent-text` → `--accent-on`) and its Select-all/Clear
  text (→ `--accent-label`, DS-02) contradicts the "MultiSelect" requirement,
  which pins `--accent-text`. OpenSpec MODIFIED replaces a whole requirement on
  archive, so leaving these unmodified would make the archived spec assert both
  the old and new tokens for the same element. Both requirements are therefore
  reproduced verbatim in the delta with only their token line(s) changed (a
  spec-reviewer finding; verified by diffing the delta blocks against the living
  spec — only the intended lines differ).
- **`--text-dim` hardened for the wash case (apply-time decision, agreed).** The
  RED assertion added in task 1.2 (TabRow `.meta` = `--text-dim` composited over
  the `--space-c-soft` hover/active wash, swept across every Space hue over the
  `--surface`/`--bg` substrates the tab list sits on) failed at bright Space hues
  in **both** themes on the real backing (~4.0:1 dark yellow, ~4.3:1 light red) —
  below the 4.5:1 floor. Task 6.2 pre-authorised hardening "the token or the wash
  alpha"; the user chose to harden the token (preserves the colour-forward wash
  intensity, vs. lowering the shared `--space-c-soft` alpha or capping the dark
  wash lightness, both of which ripple across ~8 wash consumers). `--text-dim` is
  lifted dark `0.650 → 0.690` and darkened light `0.495 → 0.480` — it merely
  honours `--text-dim`'s own AA 4.5:1 contract on a backing (the wash) the
  opaque-surface tests didn't cover, and only increases contrast on every other
  surface. This is a fourth token value changed beyond the three new tokens; the
  proposal's Impact line is updated to match. Both values are pinned by
  `contrast.test.ts`.
- **DS-05 light-theme lightness cap = `0.50` (both consumers).** ColorSwatch's
  ring (`--dot-l`) and LensRow's glyph (`--glyph-l`) cap the raw lightness at
  `min(<raw>, 0.50)` under `[data-theme='light']`. `0.50` is the loosest cap that
  keeps the glyph ≥4.5:1 (worst hue green, 5.5:1) and the `+0.04` ring ≥3:1 (4.7:1)
  on the near-white light `--surface` across the palette; `0.55` (the
  `.lunma-space-scope` boundary cap) leaves the glyph at 4.47:1, just under floor.
- **TDD order.** Extend `contrast.test.ts` with the new pairs first (RED), then
  add tokens + retarget consumers to GREEN. The contrast test is the gate that
  pins each token's exact OKLCH lightness; the design fixes roles, not numbers.
- **Stories: per-primitive compliance check (agreed).** All 13 touched primitives
  already have catalog stories (the coverage guard is satisfied). The retargets
  change the *colour* of states the stories already render (selection checks,
  rings, danger items, pending indicators, boundaries) — no new visible *state* is
  introduced, and LensRow's `--lens-l` is an internal plumbing change, not a new
  prop or axis. Task 9 therefore verifies, per primitive, that its story exercises
  the retargeted state and adds a variant only where it does not — this is
  compliance with the story gate (a story that already shows the state has nothing
  to add), not a self-granted exception. The new colours render automatically and
  are reviewed in the manual catalog visual pass.

## Risks / Trade-offs

- **Blast radius.** Token/consumer edits ripple across 13 primitives and every
  surface that composes them. Mitigation: the automated `contrast.test.ts` (both
  themes) is the correctness gate, plus a manual catalog visual pass
  (`pnpm --filter @lunma/extension catalog`) at `subtle`/`standard`/`vivid` in
  both stage themes — `tsc`/lint cannot see contrast.
- **`--accent-label` across all Space hues.** A single lightness must clear 4.5:1
  for the lightest (yellow) and deepest (blue) Space hues in each theme. If no
  single value satisfies every hue, fall back to the space-scope-style per-hue
  lightness cap (as `--space-c` already does) rather than a flat lightness. The
  contrast test asserts the worst-case hues.
- **Verbatim-reproduction risk in the delta.** Two large living requirements
  (Review-lens, MultiSelect) are reproduced whole to change a few tokens; a
  transcription slip would silently alter the living spec on archive. Mitigation:
  the delta blocks were diffed against the living spec — only the intended token
  lines differ — and this diff is re-run before archive.
