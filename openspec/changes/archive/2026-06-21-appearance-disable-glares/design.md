## Context

Lunma's immersive aesthetic has two layers of light effect: the **aurora** (the drifting hue-mesh backdrop behind surfaces) and the **hue glow** (the shadow-based glow on identity elements such as the active Space chip). Both are currently gated only by the `tint` setting (`subtle | standard | vivid`). At `subtle`, the aurora is "reduced or absent" and the substrate is near-neutral, but the spec does not guarantee the glow is fully off; users who want zero ambient light effects have no clean escape hatch.

This change adds a single `showGlares: boolean` toggle (default `true`) that, when `false`, fully suppresses the aurora and hue glow on every surface — independent of the `tint` setting.

**Glass/backdrop-filter is explicitly excluded.** The frosted-glass treatment of `Surface.svelte` (`backdrop-filter: blur(…)`) is not a "light effect" — it is a surface treatment that aids legibility. Turning off glares does not change glass panels.

## Goals / Non-Goals

**Goals:**

- Add `showGlares` toggle to the settings registry (default `true`).
- When `false`: fully suppress the `Aurora` component and the hue glow on all surfaces (sidebar, launcher, options page, new-tab home).
- The option reflects live via `watchSettings` with no reload — consistent with how `tint` and `density` work.
- The options page renders the new control automatically from the declaration.

**Non-Goals:**

- Does not affect glass panels (`Surface.svelte` `backdrop-filter`).
- Does not change the `tint` setting semantics — the two settings compose independently.
- Does not add per-surface granularity (no "glares off in sidebar only").
- No new animation or transition for the toggle — the on/off change is instantaneous (a settings page action, not an in-session micro-interaction).

## Decisions

### Decision 1 — CSS data-attribute gate, not a JS prop

**Chosen:** Surfaces that already read `watchSettings` (sidebar, launcher, options) set `data-show-glares="false"` on their root element when `showGlares` is `false`. CSS rules scoped to `[data-show-glares="false"]` then suppress the aurora and glow via token overrides — exactly the same pattern `data-tint` and `data-density` use.

**Alternative considered — pass a JS prop to Aurora.svelte:** Every caller would need to read the setting and thread it as a prop. The data-attribute approach requires no new prop signatures and lets CSS handle the suppression at the root scope, making it easy to add new effects in the future without touching callers.

**Alternative considered — a global CSS custom property toggle:** Injecting `--glares: 0 | 1` and multiplying effect intensities by it. Slightly more fragile (multiply-by-zero is implicit); the data-attribute makes intent explicit and matches the established project pattern.

### Decision 2 — Suppress aurora by rendering nothing; suppress glow via per-surface CSS token overrides

**Aurora:** The `Aurora.svelte` component shall not be rendered (via `{#if showGlares}` in the host surface, or by CSS `display: none` for surfaces that can't reactively gate a prop). Rendering with `opacity: 0` would waste GPU compositing budget.

**Hue glow:** The glow tokens (`--glow-space`, `--glow-space-soft`, `--glow-hearth`) are **redeclared at each surface scope** (`.sidebar` in app.css, `.home` in newtab.css, `.page` in Options.svelte) so that their `var()` substitutions pick up the scoped `--space-h`/`--space-chroma`. Because these surface-scope rules load **after** `packages/tokens/tokens.css` in the cascade and have equal specificity, a generic `[data-show-glares="false"]` block in tokens.css would lose to them. The suppression therefore lives in each surface's own CSS file as `.surface-root[data-show-glares="false"] { --glow-space: 0 0 0 0 transparent; ... }`, where the selector matches the element that carries the attribute and wins the cascade by coming after the base redeclaration.

This is a deviation from the initial design plan (which assumed tokens.css would be sufficient). Agreed by the user during implementation.

### Decision 3 — Composition with `tint`

`showGlares: false` wins over any `tint` level. The aurora is unmounted and the glow token resolves to nothing regardless of `data-tint`. This is the simplest mental model for the user: "Background effects: Off" means off.

**Doc update implied:** `docs/architecture.md` does not document the `data-tint` / `data-density` pattern in detail; no update needed. If a future change adds that documentation, this attribute should be listed alongside them.

## Visual language

- **Background effects On (default):** Existing aurora + hue glow behaviour unchanged at every tint level.
- **Background effects Off:** Aurora unmounts immediately (no fade); glow tokens resolve to `none`. The surface reads as a clean, glass-only panel with the active Space identity carried only through colour chips, accent, and edge stripe.
- **Motion:** No entrance/exit animation for the toggle itself — this is a settings-page change and the effect is applied on next render of the setting-reading surface (the sidebar reflects live via `watchSettings`; so does the launcher and options page). No 150ms tween is applied — the surface just re-renders with the data attribute removed/added.
- **Colour at glares-off:** The glass `Surface` panels remain, carrying their standard `backdrop-filter` and border highlights. Contrast stays WCAG-AA because the glare-off state is a strict subset of the `subtle` tint (which is already WCAG-AA verified).
- **Options page preview:** The live appearance preview in `Options.svelte` reflects `showGlares` alongside `tint` and `density`. When glares are off, the preview cards show glass panels without aurora or glow behind them.

## Risks / Trade-offs

- [Risk] **Subtle and showGlares=false overlap:** At `subtle` tint, the aurora is already "reduced or absent." Toggling glares off in `subtle` mode produces essentially the same visual result — this is acceptable (idempotent composition); no user-visible oddity.
  → No mitigation needed; document the composition rule in the spec.

- [Risk] **New token values for glow suppression in `packages/tokens`:** If `--glow-space: none` causes parse issues in consumers that pass it directly to a shorthand property (e.g. `box-shadow: var(--glow-space)`), it could break layout.
  → Use `0 0 0 0 transparent` as the null glow value rather than `none`, which is safe in all `box-shadow` contexts.

- [Risk] **Aurora unmount flicker on settings-change:** `watchSettings` fires asynchronously. There could be a one-frame flash of the aurora before `data-show-glares` is updated.
  → The existing `watchSettings` path for `tint` and `density` has the same latency and users have not reported it. Accept; mitigate only if observed.

## Open Questions

*(none — scope is well-defined)*
