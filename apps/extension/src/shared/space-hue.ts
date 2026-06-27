import type { SpaceColor } from './types';

/**
 * Global default OKLCH hue (matches `--base-hue` in tokens.css). `gray`
 * resolves to this — i.e. a Space marked `gray` reads as the default neutral
 * hue, with no visible identity tint.
 */
export const DEFAULT_HUE = 62;

/**
 * Resting-ember base lightness — the `:root` default for the scoped `--space-l`
 * token. Surfaces with no active Space (the options page, an unscoped overlay)
 * and the no-active-Space fallback in `App`/`NewTab` render at this lightness so
 * the identity tokens reproduce the previous flat-L ember exactly. Equals the
 * old hard-coded `--space-c` lightness (`0.62`).
 */
export const DEFAULT_L = 0.62;

/**
 * The OKLCH chroma for the resting-ember / no-active-Space fallback. Per-colour
 * chroma comes from {@link colourToOklch}; this is only the neutral default for
 * `--space-chroma` when no Space is active. Drives the `--space-chroma` custom
 * property in that fallback case.
 */
export const SPACE_CHROMA = 0.15;

/** A Space colour's canonical OKLCH lightness, chroma, and hue. */
export interface SpaceOklch {
  /** Canonical lightness — per colour so it reads true to its name (yellow
   * light, blue deep) rather than a single flat lightness across hues. */
  l: number;
  /** Canonical chroma — `0` for the `gray` neutral, saturated otherwise. */
  c: number;
  /** OKLCH hue angle. */
  h: number;
}

/** Whether text/icons drawn on a colour use dark ink or light ink. */
type OnInk = 'dark' | 'light';

interface PaletteEntry extends SpaceOklch {
  on: OnInk;
}

/**
 * The ten canonical Space colours. Nine are exactly Chrome's `tabGroups.Color`
 * set; `teal` is Lunma-only — Chrome has no teal, so `toGroupColor` folds it onto
 * Chrome's `cyan` in the NATIVE tab strip (so a teal and a cyan Space share that
 * one native colour). Everywhere Lunma draws its own identity (picker swatch,
 * chip, wash, aurora, glow, accent) teal renders as its true hue. Each carries a
 * per-colour OKLCH lightness/chroma/hue tuned
 * so the colour reads true to its name across the whole identity (the picker
 * swatch, the chip, the wash, the aurora, the glow, the accent), not a single
 * flat lightness that muddies the warm hues. `on` records whether text on the
 * colour wants dark or light ink — the palette spans light (`yellow`) to dark
 * (`purple`), so a single ink can't stay WCAG AA across it. The L/C and `on`
 * choices are gated by the per-colour contrast tests in `contrast.test.ts`.
 */
const PALETTE: Record<SpaceColor, PaletteEntry> = {
  red: { l: 0.56, c: 0.18, h: 25, on: 'light' },
  orange: { l: 0.73, c: 0.16, h: 55, on: 'dark' },
  yellow: { l: 0.87, c: 0.16, h: 98, on: 'dark' },
  green: { l: 0.74, c: 0.17, h: 150, on: 'dark' },
  teal: { l: 0.78, c: 0.12, h: 188, on: 'dark' },
  cyan: { l: 0.77, c: 0.12, h: 210, on: 'dark' },
  blue: { l: 0.55, c: 0.16, h: 252, on: 'light' },
  purple: { l: 0.56, c: 0.17, h: 295, on: 'light' },
  pink: { l: 0.7, c: 0.18, h: 350, on: 'dark' },
  gray: { l: 0.66, c: 0, h: DEFAULT_HUE, on: 'dark' },
};

/** Near-black / near-white ink for on-colour text, carrying a faint hue tint so
 * it doesn't read as a foreign pure black/white over the colour. */
function ink(on: OnInk, h: number, c: number): string {
  return on === 'dark'
    ? `oklch(0.21 ${Math.min(c * 0.25, 0.04).toFixed(3)} ${h})`
    : `oklch(0.99 ${Math.min(c * 0.1, 0.02).toFixed(3)} ${h})`;
}

/** The `--space-on` ink for the resting ember / no-active-Space fallback (dark,
 * since the ember base lightness is light). */
export const DEFAULT_ON = ink('dark', DEFAULT_HUE, SPACE_CHROMA);

/**
 * Map a bus-contract `SpaceColor` to its canonical OKLCH `{ l, c, h }`. Pure:
 * deterministic, no side effects, no Date / random / chrome access. The triple
 * drives the scoped `--space-l` / `--space-chroma` / `--space-h` custom
 * properties from which every per-Space identity surface derives.
 */
export function colourToOklch(c: SpaceColor): SpaceOklch {
  const { l, c: chroma, h } = PALETTE[c];
  return { l, c: chroma, h };
}

/**
 * Map a `SpaceColor` to its OKLCH hue angle — a thin accessor over
 * {@link colourToOklch} (`.h`). Pure, exhaustive over `SpaceColor`.
 */
export function colourToHue(c: SpaceColor): number {
  return PALETTE[c].h;
}

/**
 * Map a `SpaceColor` to its OKLCH chroma — a thin accessor over
 * {@link colourToOklch} (`.c`): `0` for `gray` (neutral) so it reads as a true
 * grey, the colour's saturated value otherwise. Pure, exhaustive over
 * `SpaceColor`. Drives the `--space-chroma` custom property.
 */
export function colourToChroma(c: SpaceColor): number {
  return PALETTE[c].c;
}

/**
 * Map a `SpaceColor` to its readable on-colour ink (`--space-on`): dark on light
 * colours, light on dark ones, so text drawn on the colour (the chip count,
 * on-accent labels) stays WCAG AA across the palette's light→dark range. Pure,
 * exhaustive over `SpaceColor`. Verified per colour by `contrast.test.ts`.
 */
export function colourToOn(c: SpaceColor): string {
  const { h, c: chroma, on } = PALETTE[c];
  return ink(on, h, chroma);
}
