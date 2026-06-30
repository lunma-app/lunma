## Context

The `visual-system` requirement "Immersive aesthetic preserves reduced-motion and
contrast guarantees" promises WCAG-AA in both themes, gated by
`apps/extension/src/ui/contrast.test.ts`. But the light-theme token block only
darkened `--danger`; `--success`/`--warning`/`--info` kept their dark-tuned bright
values and the per-Space `--space-c` family had no light treatment at all. On the
near-white light `--surface` (`oklch(0.998 …)`) the result was sub-floor contrast
for two user-facing marks:

- PR/CI status (Lens dots, `Diffstat` `+N −N` text and bars, `ReviewerRail`
  verdict glyphs): `--success` 2.32:1, `--warning` 2.10:1, `--info` 2.59:1 on
  `--surface` — below the 3:1 non-text floor, and well below the 4.5:1 the
  Diffstat counts need as text.
- The selected-Space tile's identity ring (`SpaceSwitcher` active chip border =
  `--space-c`): light-leaning hues failed 3:1 — yellow 1.46:1, green 2.14:1,
  teal 1.89:1, cyan 1.98:1, orange 2.49:1, pink 2.9:1.

The gap was invisible because the contrast test never covered these pairs.

## Goals / Non-Goals

**Goals:**
- Make the PR/CI status marks and the selected-Space ring legible in light theme
  at the WCAG-AA bar the requirement already promises.
- Close the test gap so the new floors can't silently regress.
- Keep the dark theme and the Space hue identities unchanged.

**Non-Goals:**
- No new tokens, primitives, components, or files.
- No change to dark-theme values (already 4.88:1+ on dark surfaces).
- No restyling of the consuming components beyond the token values they read.
- No change to the per-colour Space palette (`space-hue.ts`) or its dark-context
  contrast tests.

## Decisions

**1. Add `[data-theme='light']` overrides for `--success`/`--warning`/`--info`,
mirroring the existing `--danger` light treatment** (darker + more saturated).
Chosen values: `--success oklch(0.5 0.15 150)`, `--warning oklch(0.52 0.13 70)`,
`--info oklch(0.52 0.15 233)`. These land at 4.56–5.65:1 on `--surface`/
`--surface-2` and ≥4.0:1 on `--surface-3`/`--bg`, matching `--danger`'s light
profile (5.34/4.57/4.04/4.85).
- *Alternative — `color-mix`/relative-color auto-darken at the consumer:* rejected;
  it scatters contrast logic across components and defeats the single-source token
  contract. The token block is the one place light expression lives.

**2. Cap the `--space-c` family lightness in light via a `[data-theme='light']
.lunma-space-scope` override, `min(--space-l, 0.55)`** for all three variants
(`--space-c`/`-soft`/`-dim`). A flat ceiling (not a per-hue table) keeps the recipe
a single formula; it only darkens hues that exceed 0.55 (yellow/teal/cyan/green/
orange/pink) and leaves the already-dark hues (red/blue/purple) and a `gray` Space
(chroma 0) effectively unchanged. Worst-case border contrast after the cap is
3.82:1 on `--surface-2` (green); most hues clear 4.5:1.
- *Alternative — darken `--space-l` itself per colour in `space-hue.ts`:* rejected;
  that would shift the Space identity colour everywhere (chips, washes, glow,
  on-colour ink) and break the dark-context per-colour contrast tests. Capping only
  the derived `--space-c` family in light theme is the minimal, surgical change.
- *Alternative — local fix in `SpaceSwitcher.svelte` only:* considered and rejected
  in favour of the recipe-level cap so every `--space-c` line/ring (not just the
  switcher chip) reads on light. Decision confirmed with the user.

**3. Gate the four status tokens in `contrast.test.ts` for both themes:** AA-Normal
4.5:1 on `--surface`/`--surface-2`/`--bg`, 3:1 non-text on the `--surface-3`
Diffstat track. 4.5:1 is chosen because the same token serves as small text (the
Diffstat counts) as well as graphical marks; the stricter text floor governs.

No decision diverges from `docs/`; no `docs/` file needs editing (the
`--space-c` family and the token/Stylelint contract are already described at a
level that stays accurate). The `visual-system` spec is the only artifact that
changes.

## Visual language

This change is contrast-only — it shifts existing token *values* in light theme; it
adds no motion, layout, or new surface.

- **Colour usage.** Status marks keep their hue identity (red ≈25, green ≈150,
  amber ≈70, blue ≈233) but drop ~0.20 in OKLCH lightness in light theme so they
  read as saturated, confident marks on warm paper instead of washed-out pastels —
  the same move already applied to `--danger`. The selected-Space ring keeps its
  Space hue; only its lightness is capped so the ring reads as a crisp coloured
  hairline on the near-white tile rather than a ghost.
- **States.** Unchanged. The selected chip still composes the glass `Surface`
  backing + `--space-c-soft` wash + `--space-c` border; only the border/wash
  lightness firms up in light. Hover (`--hover`) and inactive (`--surface`) states
  are untouched.
- **Hierarchy / parity with dark.** Dark theme is unchanged, so the two themes now
  present the same legibility budget for status and Space identity — the immersive,
  colour-forward language holds on light paper as it does on the dark substrate.
- **Reduced motion / Arc.** No motion involved. This is the WCAG-AA floor the
  visual-system requirement already binds for both themes; Arc's light mode keeps
  status colour saturated and legible — Lunma matches that bar.

## Risks / Trade-offs

- **Darker light-theme status hues read slightly less vivid than the dark-theme
  brights.** → Acceptable and intended; the alternative is illegible pastels. Values
  are tuned to the minimum darkening that clears the floor (4.5:1), not deeper.
- **The flat `0.55` cap makes light-theme Space rings roughly uniform in lightness
  across hues.** → Identity is carried by hue, not lightness; the cap only affects
  the ≥0.55 hues and the ring stays unmistakably the Space's colour.
- **A future Space hue tuned brighter than 0.55 is auto-handled** by the `min()`;
  no per-hue maintenance. No regression risk to dark (the cap is light-only).

## Migration Plan

Pure token/test change, no data or API migration. Already implemented and verified
(`pnpm verify` green). Rollback is reverting the three edited files; no persisted
state depends on the values.

## Open Questions

None.
