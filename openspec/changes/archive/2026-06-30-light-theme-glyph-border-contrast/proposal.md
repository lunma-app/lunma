## Why

In light theme, four user-facing marks across the sidebar and the lens overview
were barely visible — a direct legibility regression a user reported from
screenshots. The "add Space" (`+`) tile's dashed outline used the decorative
`--border` (~1.45:1 on the near-white `--surface`), so the control's boundary
all but vanished; the lens overview's accent "Review requests" group label
rendered with a dark-theme lightness (~1.7:1) and read as pale lavender; the CI
status glyph and the active Space chip's icon both used hard-coded `~0.82–0.84`
lightness fills that wash out on light surfaces (the chip glyph is effectively
invisible for a gray Space). This change makes all four legible in light theme at
the WCAG-AA bar the `visual-system` requirement already promises for both
themes — so reviewing PRs and switching Spaces is usable on light paper.

This is the same root cause as the archived `2026-06-30-light-theme-status-contrast`
change (dark-tuned values used unchanged in light theme), now reaching borders,
an accent heading, and icon glyph fills. It removes hard-coded glyph/border
lightness from the feature components in favour of existing theme-aware tokens
(aligning with the "feature CSS never hard-codes design values" policy), and adds
contrast-test gates so the new floors can't silently regress.

## What Changes

- The "add Space" tile (`SpaceSwitcher.svelte` `.chip-add`) dashed outline moves
  from the decorative `--border` to `--border-strong`, so an interactive
  control's boundary clears the WCAG 1.4.11 3:1 non-text floor in both themes.
- The lens overview accent "Review requests" group label (`OverviewPage.svelte`
  `.group-label.waiting`) moves from an inline `oklch(var(--accent-text-l) 0.09 252)`
  to the theme-aware `--accent-heading` token, so it meets AA-Normal (4.5:1) on
  the list surfaces in both themes.
- The CI status glyph (`OverviewPage.svelte` `.ci`) stops hard-coding
  `oklch(0.82 0.1 var(--ci-h))` and composes the existing, already-light-darkened
  status tokens (`--success`/`--danger`/`--warning`; CI hues 150/25/75 map
  exactly, via a `tone` discriminant on `ciLight()`), so the glyph reads on the
  pale light tint in both themes.
- The active Space chip glyph (`SpaceSwitcher.svelte` `.chip[data-active] .tile`)
  stops hard-coding `oklch(0.84 var(--space-chroma) var(--space-h))` and composes
  the theme-aware, contrast-capped `--space-c` token, so the icon reads on the
  `--space-c-soft` fill in light theme (and for a gray Space).
- The automated contrast contract (`apps/extension/src/ui/contrast.test.ts`)
  gains gates asserting `--accent-heading` clears AA-Normal 4.5:1 on
  `--surface`/`--surface-2`/`--bg`/`--surface-3`, and `--border-strong` clears
  the 3:1 non-text floor on `--surface`/`--surface-2`/`--bg`, in both themes.

No new tokens, files, or primitives are introduced. The change hardens the
light-theme expression of existing behaviour and removes hard-coded glyph/border
lightness from two feature components in favour of existing theme-aware tokens.
Dark theme is unchanged in intent. It lands on top of the `redesign-lens-overview-board`
overview, which kept these selectors but never fixed the dark-tuned values.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `visual-system`: the "Immersive aesthetic preserves reduced-motion and
  contrast guarantees" requirement is extended so its enumeration of
  light-theme-legible marks and the contrast-test contract cover (a) the
  `--accent-heading` accent label token, (b) `--border-strong` as the AA-safe
  boundary for free-floating interactive controls (decorative `--border` is not
  used on interactive controls), and (c) icon glyph fills composing theme-aware
  tokens rather than hard-coding lightness.

## Impact

- `apps/extension/src/sidebar/SpaceSwitcher.svelte` — `.chip-add` border
  (`--border` → `--border-strong`); `.chip[data-active] .tile` glyph
  (`oklch(0.84 …)` → `--space-c`).
- `apps/extension/src/launcher/lenspage/OverviewPage.svelte` —
  `.group-label.waiting` colour (inline `oklch` → `--accent-heading`); `.ci`
  glyph colour (`oklch(0.82 …)` → status tokens via `tone`).
- `apps/extension/src/launcher/lenspage/overview-vm.ts` — `ciLight()` gains a
  `tone: 'passed' | 'failing' | 'running'` discriminant (raw `hue` retained for
  the draft case / existing consumers).
- `apps/extension/src/ui/contrast.test.ts` — new `--accent-heading` and
  `--border-strong` contrast gates (both themes).
- Consuming behaviour is unchanged; only contrast improves.
- Docs: no `docs/` file needs editing — the token/Stylelint contract in
  `docs/tech-stack.md` and the recipe families in `docs/architecture.md` already
  describe these tokens at a level that stays accurate; this change shifts which
  existing token a component reads and contradicts no doc prose.
