## Why

In light theme, the PR/CI status colours and the selected-Space identity ring
were nearly invisible: a user reviewing PRs in the sidebar could not reliably
tell an open/failed/passed dot apart, and the active Space tile barely read as
selected. The status brights (`--success`/`--warning`/`--info`) sat at
~2.1–2.6:1 on the near-white light `--surface` — below even the 3:1 non-text
floor — and the selected-Space ring (`--space-c`) failed 3:1 for every
light-leaning hue (yellow 1.46:1, green 2.14:1, teal/cyan/orange/pink all
sub-3:1). This change makes those marks legible in light theme so the sidebar's
GitHub/CI lens and Space switching are usable at the WCAG-AA bar the
visual-system requirement already promises for both themes.

The fix is already implemented and verified (`pnpm verify` green); this proposal
records the now-shipped behaviour in the `visual-system` capability spec so the
spec and code stay in lockstep.

## What Changes

- `--success`, `--warning`, and `--info` gain `[data-theme='light']` overrides
  (darkened + saturated, mirroring the existing `--danger` light treatment), so
  the PR status dots (`Lens`), the `+N −N` Diffstat text and bars, and the
  `ReviewerRail` verdict glyphs clear WCAG-AA on the light surfaces they render
  on.
- The derived per-Space colour-scope family gains a `[data-theme='light']
  .lunma-space-scope` override that caps `--space-c`/`--space-c-soft`/
  `--space-c-dim` lightness at `min(--space-l, 0.55)`, so the selected-Space
  tile's identity ring/line clears the 3:1 non-text floor on light surfaces
  without shifting the Space's hue identity.
- The automated contrast contract (`apps/extension/src/ui/contrast.test.ts`)
  gains a gate asserting the four status tokens
  (`--success`/`--warning`/`--info`/`--danger`) clear AA-Normal 4.5:1 on
  `--surface`/`--surface-2`/`--bg` and the 3:1 non-text floor on the
  `--surface-3` Diffstat track, in both dark and light themes.

No new tokens, files, types, or primitives are introduced — this hardens the
light-theme expression of existing tokens and extends an existing test.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `visual-system`: the "Immersive aesthetic preserves reduced-motion and
  contrast guarantees" requirement is extended so its enumeration of
  light-theme-expressed tokens and the contrast-test contract cover the status
  tokens and the `--space-c` light cap (previously it named only glass, idle
  form-control borders, and metadata text).

## Impact

- `packages/tokens/tokens.css` — `[data-theme='light']` block:
  `--success`/`--warning`/`--info` overrides.
- `packages/tokens/recipes.css` — new `[data-theme='light'] .lunma-space-scope`
  block capping the `--space-c` family lightness.
- `apps/extension/src/ui/contrast.test.ts` — new status-token contrast gate
  (both themes).
- Consuming surfaces (behaviour unchanged, contrast improved): `Lens.svelte`
  status dots, `Diffstat.svelte`, `ReviewerRail.svelte`, `SpaceSwitcher.svelte`
  active chip.
- Docs: no `docs/` file needs editing — `docs/architecture.md` (lines ~1002–03)
  already lists the `--space-c` Space-scope recipe family and `docs/tech-stack.md`
  describes the token/Stylelint contract at a level that stays accurate; the
  light cap and status overrides are token-internal values that contradict no
  doc prose.
