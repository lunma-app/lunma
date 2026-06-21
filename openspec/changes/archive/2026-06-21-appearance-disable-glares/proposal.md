## Why

Users on lower-end hardware or with photosensitivity preferences want a way to fully turn off the aurora backdrop and hue-glow light effects without having to dial the Colour intensity all the way to `subtle` (which still carries identity through chips and accents, and does not guarantee the glow is fully off). A dedicated toggle gives a clean, predictable escape hatch: glares off means no aurora, no hue glow, period.

## What Changes

- A new `showGlares` `toggle` setting is declared in the `Appearance` group (default `true`). When `false`, the aurora backdrop and hue-glow effects are suppressed entirely on all surfaces, regardless of the `tint` setting.
- Surfaces that currently read `tint` to drive the aurora and glow (`Aurora.svelte`, the sidebar, the options page, the launcher overlay) also read `showGlares` and suppress those effects when it is `false`.
- The options page renders a new "Background effects" Off | On `SegmentedControl` in the Appearance group, with a short description.
- All updated surfaces reflect the setting live via `watchSettings` with no reload.

## Capabilities

### New Capabilities

*(none — this change only modifies existing capabilities)*

### Modified Capabilities

- `settings`: adds the `showGlares` toggle declaration and the derived `Settings.showGlares: boolean` field.
- `visual-system`: adds a requirement that the aurora and hue-glow effects respect `showGlares: false` and are fully suppressed when it is off, at every tint level.

## Impact

**Files likely to change:**

- `apps/extension/src/shared/settings.ts` — new `showGlares` toggle declaration.
- `apps/extension/src/ui/Aurora.svelte` — accept or read `showGlares`; render nothing when off.
- `apps/extension/src/sidebar/Sidebar.svelte` (and any file that applies the glow to the Space chip) — suppress the hue glow when `showGlares` is `false`.
- `apps/extension/src/options/Options.svelte` — already driven by the declarative registry; no render code change needed beyond the declaration (the engine handles it automatically).
- `apps/extension/src/launcher/overlay.css` / launcher surface — suppress glow when setting is off.
- Potentially `packages/tokens/tokens.css` — a `[data-show-glares='false']` override block (or a CSS custom property gate) so surfaces can suppress glow/aurora in CSS without per-component JS.

**No new primitives** are introduced; `Aurora.svelte` and the glow tokens already exist. The `settings` declarative engine automatically derives the Zod schema, default, and options-page rendering from the new declaration.

**Docs to update:** `docs/architecture.md` (if the data-attribute pattern is documented there); otherwise no architecture doc changes. The settings spec and visual-system spec will update through the change's spec deltas.

**Primitives composed (no new ones):**
- `Aurora.svelte` (existing — modified to honour the toggle)
- `Surface.svelte` (existing — glow prop may be gated by the toggle on callers)
- `SegmentedControl.svelte` (existing — rendered automatically by the options engine)
