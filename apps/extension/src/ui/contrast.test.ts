/**
 * WCAG 2.1 contrast contract for the design tokens.
 *
 * This test holds the visual-quality policy honest: every text-on-background
 * pair Lunma ships MUST meet a stated WCAG level. If anyone changes a token
 * lightness or chroma that drops a pair below its required ratio, this test
 * fails and the change has to revisit the contrast budget.
 *
 * Math: we parse the OKLCH expressions from `@lunma/tokens/tokens.css`
 * (`packages/tokens/tokens.css`) literally so the test source-of-truth IS the
 * stylesheet — no duplicated hex values to drift. `culori` converts OKLCH →
 * sRGB → WCAG relative luminance and
 * computes the contrast ratio per the WCAG 2.1 formula.
 *
 * Levels:
 *   - AA Large  (3:1)    — large text, UI components
 *   - AA Normal (4.5:1)  — standard body text and most non-decorative copy
 *   - AAA Large (4.5:1)  — enhanced
 *   - AAA Normal(7:1)    — enhanced standard text
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse, rgb, wcagContrast } from 'culori';
import { describe, expect, test } from 'vitest';
import { colourToHue, colourToOklch, colourToOn } from '../shared/space-hue';
import type { SpaceColor } from '../shared/types';

const TOKENS_PATH = resolve(process.cwd(), '../../packages/tokens/tokens.css');
const APP_CSS_PATH = resolve(process.cwd(), 'src/sidebar/app.css');
const NEWTAB_CSS_PATH = resolve(process.cwd(), 'src/launcher/newtab/newtab.css');

/** The nine canonical Space colours (space-palette-refresh). */
const SPACE_COLORS: SpaceColor[] = [
  'red',
  'orange',
  'yellow',
  'green',
  'cyan',
  'blue',
  'purple',
  'pink',
  'gray',
];

/** Pull `:root { ... }` first block and parse `--name: value;` pairs. */
function readTokens(): Map<string, string> {
  const css = readFileSync(TOKENS_PATH, 'utf-8');
  const rootMatch = css.match(/:root\s*\{([\s\S]*?)\}/);
  if (!rootMatch?.[1]) throw new Error('no :root block in tokens.css');
  const body = rootMatch[1];
  const out = new Map<string, string>();
  // Strip /* ... */ comments before scanning.
  const stripped = body.replace(/\/\*[\s\S]*?\*\//g, '');
  for (const line of stripped.split(';')) {
    const m = line.match(/^\s*(--[a-z0-9-]+)\s*:\s*(.+?)\s*$/);
    if (!m?.[1] || !m?.[2]) continue;
    out.set(m[1], m[2]);
  }
  return out;
}

/** Pull the `[data-theme='light']` block and parse `--name: value;` pairs, so the
 * light token ramp is gated alongside the dark `:root` ramp
 * (harden-ui-accessibility THEME-NEW1). The light selector list is
 * `:root[data-theme='light'], [data-theme='light'] { … }`; we match the bare
 * `[data-theme='light'] {` arm (the `:root…` arm is followed by `,`, not `{`). */
function readLightTokens(): Map<string, string> {
  const css = readFileSync(TOKENS_PATH, 'utf-8');
  const m = css.match(/\[data-theme='light'\]\s*\{([\s\S]*?)\}/);
  if (!m?.[1]) throw new Error("no [data-theme='light'] block in tokens.css");
  const stripped = m[1].replace(/\/\*[\s\S]*?\*\//g, '');
  const out = new Map<string, string>();
  for (const line of stripped.split(';')) {
    const mm = line.match(/^\s*(--[a-z0-9-]+)\s*:\s*(.+?)\s*$/);
    if (!mm?.[1] || !mm?.[2]) continue;
    out.set(mm[1], mm[2]);
  }
  return out;
}

/** The chrome/body backgrounds every text-ramp pair is gated against. */
const SURFACE_BGS = ['--bg', '--bg-elev', '--surface', '--surface-2', '--surface-3'];

/** Evaluate the small `calc()` / `clamp()` math the identity tokens use
 * (space-palette-refresh + the warm-substrate redesign): `calc(<a> * <b>)`,
 * `calc(<a> + <b>)`, and `clamp(0, <v>, 1)`. Runs calc first (multiply before
 * add) so an inner `calc()` inside a `clamp()` collapses before the clamp. */
function evalMath(s: string): string {
  let out = s;
  let prev: string;
  do {
    prev = out;
    out = out
      .replace(/calc\(\s*([\d.]+)\s*\*\s*([\d.]+)\s*\)/g, (_m, a, b) =>
        String(Number(a) * Number(b)),
      )
      .replace(/calc\(\s*([\d.]+)\s*\+\s*([\d.]+)\s*\)/g, (_m, a, b) =>
        String(Number(a) + Number(b)),
      );
  } while (out !== prev);
  return out.replace(/clamp\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*\)/g, (_m, lo, v, hi) =>
    String(Math.min(Number(hi), Math.max(Number(lo), Number(v)))),
  );
}

/** Resolve `oklch(L C H ...)` strings, substituting the hue-axis custom
 * properties to their documented `:root` defaults (warm-substrate redesign:
 * `--base-hue`/`--ds-warm-h`/`--space-h` → 60, `--ds-warm-amt` → 1,
 * `--ds-primary-h` → 233, `--ds-primary-c` → 0.15, `--space-l` → 0.62,
 * `--space-chroma` → 0.15) and evaluating the `calc()` / `clamp()` math. Strip
 * optional `/ alpha` since for contrast we test the opaque colour. */
function resolveOklch(expr: string, baseHue = 60): string {
  // Drop trailing `/ <alpha>` — contrast for opacities folds into bg below
  // for borders/dividers, but for the text/bg pairs we test here we want
  // the opaque colour.
  const stripped = expr.replace(/\s*\/\s*[\d.]+\s*\)/, ')');
  const substituted = stripped
    .replace(/var\(--base-hue\)/g, String(baseHue))
    .replace(/var\(--ds-warm-h\)/g, String(baseHue))
    .replace(/var\(--ds-warm-amt\)/g, '1')
    .replace(/var\(--ds-primary-h\)/g, '233')
    .replace(/var\(--ds-primary-c\)/g, '0.15')
    .replace(/var\(--space-h(?:,\s*[\d.]+)?\)/g, String(baseHue))
    .replace(/var\(--space-l(?:,\s*[\d.]+)?\)/g, '0.62')
    .replace(/var\(--space-chroma(?:,\s*[\d.]+)?\)/g, '0.15');
  return evalMath(substituted);
}

function contrast(textTokenExpr: string, bgTokenExpr: string): number {
  const fg = parse(resolveOklch(textTokenExpr));
  const bg = parse(resolveOklch(bgTokenExpr));
  if (!fg || !bg) throw new Error('culori failed to parse');
  return wcagContrast(fg, bg);
}

describe('design tokens — WCAG 2.1 contrast', () => {
  const tokens = readTokens();

  function need(name: string): string {
    const v = tokens.get(name);
    if (!v) throw new Error(`tokens.css missing ${name}`);
    return v;
  }

  // Backgrounds we care about for body / chrome text.
  const BGS = ['--bg', '--bg-elev', '--surface', '--surface-2', '--surface-3'];

  describe('primary body text (`--text`) MUST meet WCAG AAA Normal (7:1) on every surface', () => {
    for (const bg of BGS) {
      test(`${bg}`, () => {
        const ratio = contrast(need('--text'), need(bg));
        expect(ratio).toBeGreaterThanOrEqual(7);
      });
    }
  });

  describe('secondary text (`--text-2`) MUST meet WCAG AA Normal (4.5:1) on every surface', () => {
    for (const bg of BGS) {
      test(`${bg}`, () => {
        const ratio = contrast(need('--text-2'), need(bg));
        expect(ratio).toBeGreaterThanOrEqual(4.5);
      });
    }
  });

  describe('muted text (`--text-muted`) MUST meet WCAG AA Normal (4.5:1) on every surface', () => {
    for (const bg of BGS) {
      test(`${bg}`, () => {
        const ratio = contrast(need('--text-muted'), need(bg));
        expect(ratio).toBeGreaterThanOrEqual(4.5);
      });
    }
  });

  describe('dim text (`--text-dim`) MUST meet WCAG AA Normal (4.5:1) on every surface', () => {
    for (const bg of BGS) {
      test(`${bg}`, () => {
        const ratio = contrast(need('--text-dim'), need(bg));
        expect(ratio).toBeGreaterThanOrEqual(4.5);
      });
    }
  });

  describe('faint text (`--text-faint`) MUST meet WCAG AA Large (3:1) on every surface', () => {
    // Faint text is reserved for non-essential annotations (timestamps,
    // secondary metadata, count badges). It's intentionally below body
    // contrast but stays at the WCAG-defined "large" threshold so it
    // remains accessible.
    for (const bg of BGS) {
      test(`${bg}`, () => {
        const ratio = contrast(need('--text-faint'), need(bg));
        expect(ratio).toBeGreaterThanOrEqual(3);
      });
    }
  });

  describe('accent surfaces', () => {
    test('--accent-on (the text/icon colour used on accent backgrounds) meets AA Normal (4.5:1) on --accent', () => {
      // Used inside primary buttons (see `src/ui/Button.svelte`) where the
      // background is the saturated accent. `--accent-on` is `var(--space-on)`
      // (space-palette-refresh), so resolve the alias to the concrete ink. This is
      // the contract pair that matters for accent surfaces (the resting ember).
      const ratio = contrast(need('--space-on'), need('--accent'));
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });
  });
});

/**
 * Light theme (`[data-theme='light']`) text ramp — the dark `:root` ramp above is
 * mirrored on the parsed light block so a light token lightness can't drift below
 * its WCAG level unnoticed (harden-ui-accessibility THEME-NEW1). Same contract as
 * dark: `--text` AAA 7:1, `--text-2`/`--text-muted`/`--text-dim` AA 4.5:1,
 * `--text-faint` AA-Large 3:1 (restricted to incidental/decorative text).
 */
describe('design tokens (light theme) — WCAG 2.1 contrast', () => {
  const light = readLightTokens();
  function need(name: string): string {
    const v = light.get(name);
    if (!v) throw new Error(`tokens.css light block missing ${name}`);
    return v;
  }
  const RAMP: [string, number][] = [
    ['--text', 7],
    ['--text-2', 4.5],
    ['--text-muted', 4.5],
    ['--text-dim', 4.5],
    ['--text-faint', 3],
  ];
  for (const [token, level] of RAMP) {
    describe(`${token} MUST meet ${level}:1 on every light surface`, () => {
      for (const bg of SURFACE_BGS) {
        test(`${bg}`, () => {
          expect(contrast(need(token), need(bg))).toBeGreaterThanOrEqual(level);
        });
      }
    });
  }
});

/**
 * Status tokens (`--success`/`--warning`/`--info`/`--danger`) — the PR/CI state
 * colours: Lens status dots, Diffstat +/- text & bars, ReviewerRail verdict glyphs.
 * They render as small text (the Diffstat counts) AND as graphical marks, so they
 * MUST clear AA Normal (4.5:1) on the list surfaces they sit on
 * (`--surface`/`--surface-2`/`--bg`) and the non-text 3:1 floor on the Diffstat bar
 * track (`--surface-3`). The dark `:root` brights failed this on the light
 * `--surface` (~2.1–2.6:1) until the `[data-theme='light']` block darkened them;
 * this gate keeps both ramps honest.
 */
describe('status tokens — WCAG contrast on list surfaces (both themes)', () => {
  const themes = [
    ['dark', readTokens()],
    ['light', readLightTokens()],
  ] as const;
  const STATUS = ['--success', '--warning', '--info', '--danger'];
  for (const [theme, toks] of themes) {
    describe(theme, () => {
      function need(name: string): string {
        const v = toks.get(name);
        if (!v) throw new Error(`tokens.css ${theme} block missing ${name}`);
        return v;
      }
      for (const tok of STATUS) {
        for (const bg of ['--surface', '--surface-2', '--bg']) {
          test(`${tok} vs ${bg} >= 4.5:1`, () => {
            expect(contrast(need(tok), need(bg))).toBeGreaterThanOrEqual(4.5);
          });
        }
        test(`${tok} vs --surface-3 >= 3:1`, () => {
          expect(contrast(need(tok), need('--surface-3'))).toBeGreaterThanOrEqual(3);
        });
      }
    });
  }
});

/**
 * `--accent-heading` — the accent-coloured uppercase section label (the lens
 * OverviewPage "Review requests"/"waiting on you" group head). It renders as
 * small text, so it MUST clear AA Normal (4.5:1) on the list surfaces it sits on.
 * It previously used an inline `oklch(var(--accent-text-l) 0.09 252)`, which left
 * the dark-theme lightness on the light surface (~1.7:1); this gate keeps the
 * shared heading token honest in both themes.
 */
describe('--accent-heading — WCAG AA on list surfaces (both themes)', () => {
  const themes = [
    ['dark', readTokens()],
    ['light', readLightTokens()],
  ] as const;
  for (const [theme, toks] of themes) {
    describe(theme, () => {
      function need(name: string): string {
        const v = toks.get(name);
        if (!v) throw new Error(`tokens.css ${theme} block missing ${name}`);
        return v;
      }
      for (const bg of ['--surface', '--surface-2', '--bg', '--surface-3']) {
        test(`--accent-heading vs ${bg} >= 4.5:1`, () => {
          expect(contrast(need('--accent-heading'), need(bg))).toBeGreaterThanOrEqual(4.5);
        });
      }
    });
  }
});

/**
 * Interactive control borders — the visible boundary of active UI components
 * (the dashed "add Space" tile in `SpaceSwitcher`). WCAG 1.4.11 requires 3:1 for
 * such boundaries. The decorative `--border` (~1.45:1 on the light surface) is
 * intentionally below this and is NOT used on interactive controls; `--border-strong`
 * is the AA-safe choice and clears the non-text floor on every list surface in both
 * themes. (`--border-field` is the field-on-base-surface token — it sits at ~2.98:1
 * on the dark `--surface-2`, so it is deliberately not used for free-floating chips.)
 */
describe('interactive borders — WCAG non-text 3:1 (both themes)', () => {
  const themes = [
    ['dark', readTokens()],
    ['light', readLightTokens()],
  ] as const;
  for (const [theme, toks] of themes) {
    describe(theme, () => {
      function need(name: string): string {
        const v = toks.get(name);
        if (!v) throw new Error(`tokens.css ${theme} block missing ${name}`);
        return v;
      }
      for (const bg of ['--surface', '--surface-2', '--bg']) {
        test(`--border-strong vs ${bg} >= 3:1`, () => {
          expect(contrast(need('--border-strong'), need(bg))).toBeGreaterThanOrEqual(3);
        });
      }
    });
  }
});

/**
 * Light-theme foreground tokens on a composited `.lunma-glass` surface
 * (harden-ui-accessibility THEME-01). `--glass-bg` now carries a light expression,
 * so a glass panel reads frosted-light in light theme; the catalog previews and any
 * future light glass surface place light foreground tokens on it. We composite the
 * translucent light `--glass-bg` over the light page substrate (`--bg`) exactly as
 * the browser does (source-over) and assert each informative foreground token clears
 * AA on the result (normal text 4.5:1; the decorative `--text-faint` floor is 3:1).
 */
describe('light theme — foreground tokens on `.lunma-glass` (WCAG AA)', () => {
  const light = readLightTokens();
  interface Rgba {
    r: number;
    g: number;
    b: number;
    a: number;
  }
  function need(name: string): string {
    const v = light.get(name);
    if (!v) throw new Error(`tokens.css light block missing ${name}`);
    return v;
  }
  // Substitute the hue-axis vars (keeping any `/ alpha` so the glass composites).
  function subst(expr: string): string {
    return evalMath(
      expr
        .replace(/var\(--base-hue\)/g, '60')
        .replace(/var\(--ds-warm-h\)/g, '60')
        .replace(/var\(--ds-warm-amt\)/g, '1'),
    );
  }
  function toRgba(expr: string): Rgba {
    const c = parse(subst(expr));
    if (!c) throw new Error(`culori failed to parse '${expr}'`);
    const r = rgb(c);
    const clamp = (n: number): number => Math.min(1, Math.max(0, n));
    return { r: clamp(r.r), g: clamp(r.g), b: clamp(r.b), a: c.alpha ?? 1 };
  }
  function over(fg: Rgba, bg: Rgba): Rgba {
    const a = fg.a;
    return {
      r: fg.r * a + bg.r * (1 - a),
      g: fg.g * a + bg.g * (1 - a),
      b: fg.b * a + bg.b * (1 - a),
      a: 1,
    };
  }
  function col(c: Rgba): { mode: 'rgb'; r: number; g: number; b: number } {
    return { mode: 'rgb', r: c.r, g: c.g, b: c.b };
  }

  const glass = over(toRgba(need('--glass-bg')), toRgba(need('--bg')));
  const FOREGROUND: [string, number][] = [
    ['--text', 4.5],
    ['--text-2', 4.5],
    ['--text-muted', 4.5],
    ['--text-dim', 4.5],
    ['--text-faint', 3],
  ];
  for (const [token, level] of FOREGROUND) {
    test(`${token} on light glass meets ${level}:1`, () => {
      expect(wcagContrast(col(toRgba(need(token))), col(glass))).toBeGreaterThanOrEqual(level);
    });
  }
});

/**
 * Idle form-control boundary — the non-text 3:1 minimum (WCAG 1.4.11,
 * harden-ui-accessibility THEME-02). An unfocused `TextInput`/`Select`/`MultiSelect`
 * is a recessed fill inside a 1px `--border-field` (hover steps to `--border-strong`);
 * the fill barely differs from the surface, so the border is the boundary cue and MUST
 * clear 3:1 against the surface behind it (`--surface` or `--bg`) in both themes.
 * `--border` itself is the soft decorative line (dividers, container edges) and is
 * deliberately NOT held to 3:1.
 */
describe('idle form-control boundary — border vs surface non-text contrast (WCAG 1.4.11)', () => {
  const themes = [
    ['dark', readTokens()],
    ['light', readLightTokens()],
  ] as const;
  for (const [theme, toks] of themes) {
    describe(theme, () => {
      function need(name: string): string {
        const v = toks.get(name);
        if (!v) throw new Error(`tokens.css ${theme} block missing ${name}`);
        return v;
      }
      for (const border of ['--border-field', '--border-strong']) {
        for (const surf of ['--surface', '--bg']) {
          test(`${border} vs ${surf} >= 3:1`, () => {
            expect(contrast(need(border), need(surf))).toBeGreaterThanOrEqual(3);
          });
        }
      }
    });
  }
});

/**
 * Per-colour Space identity — WCAG AA across the whole nine-colour palette
 * (space-palette-refresh, visual-system spec scenario "On-colour text stays
 * readable across light and dark colours"). The source of truth for each colour's
 * canonical OKLCH + on-colour ink is `space-hue.ts` (`colourToOklch`/`colourToOn`),
 * which feed the scoped `--space-l`/`--space-chroma`/`--space-h`/`--space-on`
 * tokens set inline on every identity surface. For each colour we assert:
 *
 *   1. on-colour text (the chip glyph/count, `--space-on`) on the chip itself
 *      (`oklch(l c h)`) meets AA Normal (4.5:1) — the gate that decides each
 *      colour's dark↔light ink;
 *   2. body text (`--text`) on the coloured wash (vivid substrate + the top wash
 *      stop at the colour) meets AA Normal (4.5:1);
 *   3. body text on a frosted-glass Surface over the coloured aurora (vivid)
 *      meets AA Normal (4.5:1).
 */
describe('per-colour Space identity — WCAG AA across the palette', () => {
  const tokens = readTokens();

  interface Rgba {
    r: number;
    g: number;
    b: number;
    a: number;
  }
  function toRgba(expr: string): Rgba {
    const c = parse(expr);
    if (!c) throw new Error(`culori failed to parse '${expr}'`);
    const r = rgb(c);
    const clamp = (n: number): number => Math.min(1, Math.max(0, n));
    return { r: clamp(r.r), g: clamp(r.g), b: clamp(r.b), a: c.alpha ?? 1 };
  }
  function over(fg: Rgba, bg: Rgba): Rgba {
    const a = fg.a;
    return {
      r: fg.r * a + bg.r * (1 - a),
      g: fg.g * a + bg.g * (1 - a),
      b: fg.b * a + bg.b * (1 - a),
      a: 1,
    };
  }
  function col(c: Rgba): { mode: 'rgb'; r: number; g: number; b: number } {
    return { mode: 'rgb', r: c.r, g: c.g, b: c.b };
  }
  function ratio(fg: string | Rgba, bg: string | Rgba): number {
    const f = typeof fg === 'string' ? col(toRgba(fg)) : col(fg);
    const b = typeof bg === 'string' ? col(toRgba(bg)) : col(bg);
    return wcagContrast(f, b);
  }
  function rootToken(name: string): string {
    const v = tokens.get(name);
    if (!v) throw new Error(`tokens.css missing ${name}`);
    return v;
  }
  const TEXT = resolveOklch(rootToken('--text'));

  for (const color of SPACE_COLORS) {
    const { l, c, h } = colourToOklch(color);
    const chip = `oklch(${l} ${c} ${h})`;
    const on = colourToOn(color);
    // Vivid substrate + glass are hue-tinted toward the active Space hue.
    const substrate = toRgba(resolveOklch(rootToken('--bg'), h));
    // Top wash stop (vivid): the colour at the strongest wash alpha (app.css
    // `.sidebar[data-tint='vivid'] --wash-a1: 0.1`).
    const wash = over(toRgba(`oklch(${l} ${c} ${h} / 0.1)`), substrate);
    // Brightest aurora point: the blob (Aurora.svelte: l+0.04, alpha 0.55) over
    // the substrate, the whole layer at the vivid `--aurora-opacity` (0.35), then
    // the vivid glass (`--glass-bg`) over that.
    const blobL = Math.min(1, l + 0.04);
    const blob = over(toRgba(`oklch(${blobL} ${c} ${h} / 0.55)`), substrate);
    const aurora = over({ ...blob, a: 0.35 }, substrate);
    const glass = over(toRgba(resolveOklch(rootToken('--glass-bg'), h)), aurora);

    describe(color, () => {
      test('on-colour ink (`--space-on`) on the chip meets AA Normal (4.5:1)', () => {
        expect(ratio(on, chip)).toBeGreaterThanOrEqual(4.5);
      });
      test('body text (`--text`) on the coloured wash meets AA Normal (4.5:1)', () => {
        expect(ratio(TEXT, wash)).toBeGreaterThanOrEqual(4.5);
      });
      test('body text (`--text`) on glass over the coloured aurora meets AA Normal (4.5:1)', () => {
        expect(ratio(TEXT, glass)).toBeGreaterThanOrEqual(4.5);
      });
    });
  }
});

/**
 * Immersive surfaces — body text on a frosted-glass `Surface` over the aurora,
 * verified per tint level rather than assumed (visual-system spec scenario
 * "Text on glass stays AA at every tint level").
 *
 * We composite exactly as the browser does (source-over in gamma-sRGB): the
 * aurora's brightest blob over the per-tint substrate, then the glass panel over
 * that, then measure the WCAG ratio of body text on the result. The per-tint
 * substrate / glass / aurora-opacity values are read from the real stylesheets
 * (`tokens.css` :root + the `.sidebar[data-tint=…]` overrides in `app.css`) so
 * the test source-of-truth IS the CSS — no duplicated values to drift.
 */
describe('immersive surfaces — text on glass over aurora (WCAG AA per tint)', () => {
  const tokens = readTokens();
  const APP_CSS = readFileSync(APP_CSS_PATH, 'utf-8');
  // A representative saturated Space (blue). Inside `.sidebar` `--base-hue` is
  // rebound to `--space-h`, so both resolve to the active Space hue.
  const HUE = 250;
  const CHROMA = 0.15;
  // The aurora primitive paints its blobs at this colour/alpha (src/ui/Aurora.svelte).
  const BLOB = 'oklch(0.66 var(--space-chroma) var(--space-h) / 0.55)';

  interface Rgba {
    r: number;
    g: number;
    b: number;
    a: number;
  }

  function subst(expr: string): string {
    // Keep alpha (the over() blends below use it); just substitute the hue-axis
    // vars and collapse the warm-substrate calc() math so culori can parse.
    return evalMath(
      expr
        .replace(/var\(--base-hue\)/g, String(HUE))
        .replace(/var\(--ds-warm-h\)/g, String(HUE))
        .replace(/var\(--ds-warm-amt\)/g, '1')
        .replace(/var\(--ds-primary-h\)/g, '233')
        .replace(/var\(--ds-primary-c\)/g, '0.15')
        .replace(/var\(--space-h[^)]*\)/g, String(HUE))
        .replace(/var\(--space-chroma[^)]*\)/g, String(CHROMA)),
    );
  }

  function toRgba(expr: string): Rgba {
    const c = parse(subst(expr));
    if (!c) throw new Error(`culori failed to parse '${expr}'`);
    const r = rgb(c);
    const clamp = (n: number): number => Math.min(1, Math.max(0, n));
    return { r: clamp(r.r), g: clamp(r.g), b: clamp(r.b), a: c.alpha ?? 1 };
  }

  /** Source-over: `fg` (with alpha) painted on opaque `bg`. */
  function over(fg: Rgba, bg: Rgba): Rgba {
    const a = fg.a;
    return {
      r: fg.r * a + bg.r * (1 - a),
      g: fg.g * a + bg.g * (1 - a),
      b: fg.b * a + bg.b * (1 - a),
      a: 1,
    };
  }

  function col(c: Rgba): { mode: 'rgb'; r: number; g: number; b: number } {
    return { mode: 'rgb', r: c.r, g: c.g, b: c.b };
  }

  function rootToken(name: string): string {
    const v = tokens.get(name);
    if (!v) throw new Error(`tokens.css missing ${name}`);
    return v;
  }

  /** The last declaration of `name` across all `.sidebar[data-tint='${tint}']`
   * blocks (CSS cascade = last wins), falling back to the :root token. */
  function tintToken(tint: string, name: string): string {
    const block = new RegExp(`\\.sidebar\\[data-tint='${tint}'\\]\\s*\\{([^}]*)\\}`, 'g');
    let body = '';
    let m: RegExpExecArray | null = block.exec(APP_CSS);
    while (m) {
      body += `;${m[1]}`;
      m = block.exec(APP_CSS);
    }
    const decl = [...body.matchAll(new RegExp(`${name}\\s*:\\s*([^;]+);`, 'g'))].pop();
    return decl?.[1]?.trim() ?? rootToken(name);
  }

  for (const tint of ['vivid', 'standard', 'subtle'] as const) {
    describe(tint, () => {
      const substrate = toRgba(tintToken(tint, '--bg'));
      const auroraOpacity = Number(tintToken(tint, '--aurora-opacity'));
      // Brightest aurora point: the blob (its own alpha) over the substrate,
      // then the whole aurora layer at `--aurora-opacity` over the substrate.
      const blobOverSubstrate = over(toRgba(BLOB), substrate);
      const auroraEff = over({ ...blobOverSubstrate, a: auroraOpacity }, substrate);
      const glassEff = over(toRgba(tintToken(tint, '--glass-bg')), auroraEff);

      test('primary body text (`--text`) on glass over the aurora meets AA Normal (4.5:1)', () => {
        expect(
          wcagContrast(col(toRgba(rootToken('--text'))), col(glassEff)),
        ).toBeGreaterThanOrEqual(4.5);
      });

      test('secondary text (`--text-2`) on glass over the aurora meets AA Normal (4.5:1)', () => {
        expect(
          wcagContrast(col(toRgba(rootToken('--text-2'))), col(glassEff)),
        ).toBeGreaterThanOrEqual(4.5);
      });

      test('`--text` directly over the brightest aurora stays ≥ AA Large (3:1)', () => {
        // Body text is always rendered on a glass Surface, never directly on the
        // aurora; this bounds the decorative backdrop layer itself.
        expect(
          wcagContrast(col(toRgba(rootToken('--text'))), col(auroraEff)),
        ).toBeGreaterThanOrEqual(3);
      });

      test('the serif identity-tinted group heading meets AA Normal (4.5:1) on glass', () => {
        // Options group headings + the sidebar section headers render in the active
        // Space's hue at a `0.72` lightness FLOOR (sidebar-firstrun-options-polish D5;
        // `oklch(from var(--space-c) max(l, 0.72) c h)`). Model the floored colour at
        // the representative hue over the same glass-over-aurora and assert it stays
        // legible (22px regular is not WCAG-large, so AA Normal applies).
        const heading = `oklch(0.72 ${CHROMA} ${HUE})`;
        expect(wcagContrast(col(toRgba(heading)), col(glassEff))).toBeGreaterThanOrEqual(4.5);
      });
    });
  }
});

/**
 * The new-tab hearth bloom (newtab-hearth) — the caption (`--text-muted`) is the
 * one text that crosses the low-centre ember bloom on the idle home. The bloom is
 * the `--glow-hearth` colour composed into a radial gradient at a per-tint PEAK
 * alpha owned by `newtab.css` (`--hearth-peak`, read here so the test's source of
 * truth IS the stylesheet). We composite the bloom at its peak over the home
 * substrate (`--bg`) and measure muted text on the result, at each tint level —
 * the bound the spec scopes ("muted text over the hearth bloom's peak"). This is
 * already conservative: the caption sits in the upper identity band, well ABOVE
 * the low-centre peak, so it never actually crosses this much bloom; the aurora's
 * own legibility budget is bounded separately by the immersive-surfaces tests
 * above. The bloom resolves to the resting ember hue via the token's `:root`
 * fallbacks (oklch(0.72 0.15 62)), the default-substitution convention this file
 * uses throughout.
 */
describe('new-tab hearth bloom — muted caption over the peak (WCAG AA per tint)', () => {
  const tokens = readTokens();
  const NEWTAB_CSS = readFileSync(NEWTAB_CSS_PATH, 'utf-8');

  interface Rgba {
    r: number;
    g: number;
    b: number;
    a: number;
  }
  function toRgba(expr: string): Rgba {
    const c = parse(expr);
    if (!c) throw new Error(`culori failed to parse '${expr}'`);
    const r = rgb(c);
    const clamp = (n: number): number => Math.min(1, Math.max(0, n));
    return { r: clamp(r.r), g: clamp(r.g), b: clamp(r.b), a: c.alpha ?? 1 };
  }
  function over(fg: Rgba, bg: Rgba): Rgba {
    const a = fg.a;
    return {
      r: fg.r * a + bg.r * (1 - a),
      g: fg.g * a + bg.g * (1 - a),
      b: fg.b * a + bg.b * (1 - a),
      a: 1,
    };
  }
  function col(c: Rgba): { mode: 'rgb'; r: number; g: number; b: number } {
    return { mode: 'rgb', r: c.r, g: c.g, b: c.b };
  }
  function rootToken(name: string): string {
    const v = tokens.get(name);
    if (!v) throw new Error(`tokens.css missing ${name}`);
    return v;
  }

  /** Read the per-tint `--hearth-peak` percentage from `newtab.css` (vivid is the
   * base `.hearth` block; the calmer tints are `[data-tint='..'] .hearth` overrides),
   * returned as a 0..1 alpha. */
  function hearthPeak(tint: 'vivid' | 'standard' | 'subtle'): number {
    const re =
      tint === 'vivid'
        ? /\.hearth\s*\{[^}]*?--hearth-peak:\s*([\d.]+)%/
        : new RegExp(
            `data-tint='${tint}'\\]\\s*\\.hearth\\s*\\{[^}]*?--hearth-peak:\\s*([\\d.]+)%`,
          );
    const m = NEWTAB_CSS.match(re);
    if (!m?.[1]) throw new Error(`newtab.css missing --hearth-peak for ${tint}`);
    return Number(m[1]) / 100;
  }

  // The home substrate is the :root `--bg` (the home does NOT override --bg per tint).
  const substrate = toRgba(resolveOklch(rootToken('--bg')));
  // The hearth bloom's colour, resolved to the resting ember via the token fallbacks.
  const hearthColour = resolveOklch(rootToken('--glow-hearth'));

  for (const tint of ['vivid', 'standard', 'subtle'] as const) {
    test(`muted caption (\`--text-muted\`) over the ${tint} hearth peak meets AA Normal (4.5:1)`, () => {
      const bloom = over({ ...toRgba(hearthColour), a: hearthPeak(tint) }, substrate);
      expect(
        wcagContrast(col(toRgba(resolveOklch(rootToken('--text-muted')))), col(bloom)),
      ).toBeGreaterThanOrEqual(4.5);
    });
  }
});

/**
 * The hue-tinted status/verdict token (`Chip` with `hue`). The recipe
 * (`src/ui/Chip.svelte` `.chip.hue`) is theme-aware: label
 * `oklch(var(--accent-text-l) 0.1 H)` over a
 * fill `oklch(0.55 0.13 H / var(--accent-fill-a))` composited on the surface
 * beneath. `--accent-text-l` / `--accent-fill-a` flip between dark and light
 * (tokens.css `:root` vs `[data-theme='light']`), so the token must stay legible
 * in BOTH themes across the hue wheel — gated here (it was previously ungated).
 */
describe('hue status/verdict token (`Chip` hue) — WCAG AA across the hue wheel × themes', () => {
  const css = readFileSync(TOKENS_PATH, 'utf-8');

  interface Rgba {
    r: number;
    g: number;
    b: number;
    a: number;
  }
  function toRgba(expr: string): Rgba {
    const c = parse(expr);
    if (!c) throw new Error(`culori failed to parse '${expr}'`);
    const r = rgb(c);
    const clamp = (n: number): number => Math.min(1, Math.max(0, n));
    return { r: clamp(r.r), g: clamp(r.g), b: clamp(r.b), a: c.alpha ?? 1 };
  }
  function over(fg: Rgba, bg: Rgba): Rgba {
    const a = fg.a;
    return {
      r: fg.r * a + bg.r * (1 - a),
      g: fg.g * a + bg.g * (1 - a),
      b: fg.b * a + bg.b * (1 - a),
      a: 1,
    };
  }
  function col(c: Rgba): { mode: 'rgb'; r: number; g: number; b: number } {
    return { mode: 'rgb', r: c.r, g: c.g, b: c.b };
  }

  /** Read `--name` from the `:root` block (dark) or the `[data-theme='light']`
   * block (light) so the test's source of truth IS the stylesheet. */
  function themeToken(theme: 'dark' | 'light', name: string): string {
    const block =
      theme === 'dark'
        ? css.match(/:root\s*\{([\s\S]*?)\}/)?.[1]
        : css.match(/\[data-theme='light'\]\s*\{([\s\S]*?)\}/)?.[1];
    if (!block) throw new Error(`no ${theme} block in tokens.css`);
    const stripped = block.replace(/\/\*[\s\S]*?\*\//g, '');
    const decl = [...stripped.matchAll(new RegExp(`${name}\\s*:\\s*([^;]+);`, 'g'))].pop();
    if (!decl?.[1]) throw new Error(`tokens.css ${theme} missing ${name}`);
    return decl[1].trim();
  }

  // Representative hues spanning the wheel (priority/verdict tokens use these).
  const HUES = [25, 55, 98, 150, 210, 252, 295, 350];

  for (const theme of ['dark', 'light'] as const) {
    describe(theme, () => {
      const textL = themeToken(theme, '--accent-text-l');
      const fillA = themeToken(theme, '--accent-fill-a');
      // The token sits on a card/list surface; test the realistic ones.
      for (const surfaceName of ['--surface', '--surface-2']) {
        const surface = toRgba(resolveOklch(themeToken(theme, surfaceName)));
        for (const h of HUES) {
          test(`hue ${h} label on ${surfaceName} meets AA Normal (4.5:1)`, () => {
            const fill = over(toRgba(`oklch(0.55 0.13 ${h} / ${fillA})`), surface);
            const label = toRgba(`oklch(${textL} 0.1 ${h})`);
            expect(wcagContrast(col(label), col(fill))).toBeGreaterThanOrEqual(4.5);
          });
        }
      }
    });
  }
});

/**
 * The reading nook's read-row title (rss-connector design D8) — a READ feed row
 * recedes to `--text-muted` (NOT `--text-faint`, which is reserved for the error
 * note), and it MUST stay legible over the sidebar's Space wash at every tint.
 * We composite the wash's peak stop (`--wash-a1`, the coloured overlay's
 * strongest alpha — read per tint from `app.css` so the test's source of truth
 * IS the stylesheet) over the per-tint substrate (`--bg`) and measure muted text
 * on the result, at each tint (the newtab-hearth precedent). Representative
 * saturated hue.
 */
describe('reading folder read-row title — muted over the Space wash (WCAG AA per tint)', () => {
  const tokens = readTokens();
  const APP_CSS = readFileSync(APP_CSS_PATH, 'utf-8');
  const HUE = 250;
  const CHROMA = 0.15;
  // The wash + identity tokens resolve `--space-l` to its documented default.
  const L = 0.62;

  interface Rgba {
    r: number;
    g: number;
    b: number;
    a: number;
  }
  function toRgba(expr: string): Rgba {
    const c = parse(expr);
    if (!c) throw new Error(`culori failed to parse '${expr}'`);
    const r = rgb(c);
    const clamp = (n: number): number => Math.min(1, Math.max(0, n));
    return { r: clamp(r.r), g: clamp(r.g), b: clamp(r.b), a: c.alpha ?? 1 };
  }
  function over(fg: Rgba, bg: Rgba): Rgba {
    const a = fg.a;
    return {
      r: fg.r * a + bg.r * (1 - a),
      g: fg.g * a + bg.g * (1 - a),
      b: fg.b * a + bg.b * (1 - a),
      a: 1,
    };
  }
  function col(c: Rgba): { mode: 'rgb'; r: number; g: number; b: number } {
    return { mode: 'rgb', r: c.r, g: c.g, b: c.b };
  }
  function rootToken(name: string): string {
    const v = tokens.get(name);
    if (!v) throw new Error(`tokens.css missing ${name}`);
    return v;
  }

  /** Walk every `.sidebar[data-tint='<tint>']` block (the grouped base AND the
   * per-tint override) in source order and return the last value of `prop` — the
   * CSS cascade for these equal-specificity blocks. */
  function tintCascade(tint: string, prop: string, fallback?: string): string {
    const blockRe = /([^{}]+)\{([^{}]*)\}/g;
    const declRe = new RegExp(`${prop}\\s*:\\s*([^;]+);`, 'g');
    let value = fallback;
    let m: RegExpExecArray | null = blockRe.exec(APP_CSS);
    while (m) {
      if (m[1]?.includes(`[data-tint='${tint}']`)) {
        const d = [...(m[2] ?? '').matchAll(declRe)].pop();
        if (d?.[1]) value = d[1].trim();
      }
      m = blockRe.exec(APP_CSS);
    }
    if (value === undefined) throw new Error(`app.css missing ${prop} for ${tint}`);
    return value;
  }

  for (const tint of ['vivid', 'standard', 'subtle'] as const) {
    test(`muted read-row title over the ${tint} Space wash meets AA Normal (4.5:1)`, () => {
      const washA1 = Number(tintCascade(tint, '--wash-a1'));
      // The per-tint `--bg` carries `var(--base-hue)` — resolve it to the hue.
      const substrate = toRgba(resolveOklch(tintCascade(tint, '--bg', rootToken('--bg')), HUE));
      const wash = over(toRgba(`oklch(${L} ${CHROMA} ${HUE} / ${washA1})`), substrate);
      const muted = toRgba(resolveOklch(rootToken('--text-muted')));
      expect(wcagContrast(col(muted), col(wash))).toBeGreaterThanOrEqual(4.5);
    });
  }
});

/* ════════════════════════════════════════════════════════════════════════════
 * catalog-contrast-tokens — the three new colour-role tokens and the DS-04/DS-05
 * consumer pairs. Each is gated in BOTH the dark `:root` and the
 * `[data-theme='light']` block so a lightness drift can't slip past in either
 * theme. Shared compositing helpers (`toRgba`/`over`/`col`) mirror the pattern
 * the immersive-surface blocks above use.
 * ════════════════════════════════════════════════════════════════════════════ */

interface Rgba {
  r: number;
  g: number;
  b: number;
  a: number;
}
/** Parse an OKLCH expr to clamped sRGB + alpha, substituting `--space-h` to the
 * given hue (and the warm-hue axis vars) but KEEPING any `/ alpha` so translucent
 * washes composite. */
function toRgbaHue(expr: string, hue = 60): string {
  return expr
    .replace(/var\(--base-hue\)/g, String(hue))
    .replace(/var\(--ds-warm-h\)/g, String(hue))
    .replace(/var\(--ds-warm-amt\)/g, '1')
    .replace(/var\(--space-h(?:,\s*[\d.]+)?\)/g, String(hue))
    .replace(/var\(--space-chroma(?:,\s*[\d.]+)?\)/g, '0.15');
}
function parseRgba(expr: string, hue = 60): Rgba {
  const c = parse(evalMath(toRgbaHue(expr, hue)));
  if (!c) throw new Error(`culori failed to parse '${expr}'`);
  const r = rgb(c);
  const clamp = (n: number): number => Math.min(1, Math.max(0, n));
  return { r: clamp(r.r), g: clamp(r.g), b: clamp(r.b), a: c.alpha ?? 1 };
}
function compose(fg: Rgba, bg: Rgba): Rgba {
  const a = fg.a;
  return {
    r: fg.r * a + bg.r * (1 - a),
    g: fg.g * a + bg.g * (1 - a),
    b: fg.b * a + bg.b * (1 - a),
    a: 1,
  };
}
function asColor(c: Rgba): { mode: 'rgb'; r: number; g: number; b: number } {
  return { mode: 'rgb', r: c.r, g: c.g, b: c.b };
}
function ratioRgba(fg: Rgba, bg: Rgba): number {
  return wcagContrast(asColor(fg), asColor(bg));
}

const THEMES = [
  ['dark', readTokens()],
  ['light', readLightTokens()],
] as const;

/** The nine canonical Space hues — `--accent-label` and the re-rolled palette
 * foregrounds follow the active Space hue, so they are swept across every hue
 * (worst case: the lightest, yellow ≈ 98, and the deepest, blue ≈ 252). */
const SPACE_HUES = SPACE_COLORS.map((c) => colourToHue(c));

/**
 * `--accent-label` (accent-coloured text/glyph on a plain surface) — the
 * IconPicker glyph, the MultiSelect Select-all/Clear action text, and the
 * MultiSelect/Select selected check use it. It follows `--space-h`, so it MUST
 * clear AA Normal (4.5:1) on `--surface`/`--surface-2`/`--bg` for EVERY Space
 * hue, in both themes.
 */
describe('--accent-label follows the Space hue — WCAG AA across the palette (both themes)', () => {
  for (const [theme, toks] of THEMES) {
    describe(theme, () => {
      function need(name: string): string {
        const v = toks.get(name);
        if (!v) throw new Error(`tokens.css ${theme} block missing ${name}`);
        return v;
      }
      for (const bg of ['--surface', '--surface-2', '--bg']) {
        for (const hue of SPACE_HUES) {
          test(`--accent-label @hue ${hue} vs ${bg} >= 4.5:1`, () => {
            expect(contrast2(need('--accent-label'), need(bg), hue)).toBeGreaterThanOrEqual(4.5);
          });
        }
      }
    });
  }
});

/** Hue-aware contrast: resolve both exprs at the same swept Space hue. */
function contrast2(fgExpr: string, bgExpr: string, hue: number): number {
  const fg = parse(resolveOklch(fgExpr, hue));
  const bg = parse(resolveOklch(bgExpr, hue));
  if (!fg || !bg) throw new Error('culori failed to parse');
  return wcagContrast(fg, bg);
}

/**
 * `--danger-text` (the legible destructive label, distinct from the `--danger`
 * graphic hue and the `--danger-soft` wash) — the InlineError body and the Menu
 * danger item. It MUST clear AA Normal (4.5:1) both bare on `--surface`/
 * `--bg-elev` AND composited over the `--danger-soft` wash on `--bg-elev`, in
 * both themes.
 */
describe('--danger-text stays AA on surfaces and over its own wash (both themes)', () => {
  for (const [theme, toks] of THEMES) {
    describe(theme, () => {
      function need(name: string): string {
        const v = toks.get(name);
        if (!v) throw new Error(`tokens.css ${theme} block missing ${name}`);
        return v;
      }
      for (const bg of ['--surface', '--bg-elev']) {
        test(`--danger-text vs ${bg} >= 4.5:1`, () => {
          expect(contrast(need('--danger-text'), need(bg))).toBeGreaterThanOrEqual(4.5);
        });
      }
      test('--danger-text over --danger-soft wash on --bg-elev >= 4.5:1', () => {
        const wash = compose(parseRgba(need('--danger-soft')), parseRgba(need('--bg-elev')));
        expect(ratioRgba(parseRgba(need('--danger-text')), wash)).toBeGreaterThanOrEqual(4.5);
      });
    });
  }
});

/**
 * `--status-neutral` (a neutral/pending status colour in the status family, NOT
 * the type-scale `--text-dim`) — the Avatar pending verdict ring AND its `clock`
 * glyph fill. Both are non-text UI marks, so the floor is the 3:1 non-text
 * minimum on `--surface`/`--surface-2`, in both themes.
 */
describe('--status-neutral meets the 3:1 non-text floor as ring + glyph (both themes)', () => {
  for (const [theme, toks] of THEMES) {
    describe(theme, () => {
      function need(name: string): string {
        const v = toks.get(name);
        if (!v) throw new Error(`tokens.css ${theme} block missing ${name}`);
        return v;
      }
      for (const bg of ['--surface', '--surface-2']) {
        test(`--status-neutral vs ${bg} >= 3:1`, () => {
          expect(contrast(need('--status-neutral'), need(bg))).toBeGreaterThanOrEqual(3);
        });
      }
    });
  }
});

/**
 * DS-04 informative text on its actual failing backing. Two consumers:
 *  - the `FolderRow` count badge, retargeted `--text-faint` → `--text-dim`, on
 *    `--surface-2` (AA Normal 4.5:1);
 *  - the `TabRow` `.meta` line (`--text-dim`) composited over the
 *    `--space-c-soft` hover/active wash — a distinct backing the opaque-surface
 *    floor does not cover. The wash is `oklch(--space-l --space-chroma --space-h
 *    / 0.16)` (light caps the lightness at `min(--space-l, 0.55)`), swept across
 *    every Space hue over the row substrates the tab list actually sits on
 *    (`--surface`/`--bg` ≈ `--atm-bg`).
 */
describe('DS-04 informative metadata on its failing backing (both themes)', () => {
  for (const [theme, toks] of THEMES) {
    const isLight = theme === 'light';
    describe(theme, () => {
      function need(name: string): string {
        const v = toks.get(name);
        if (!v) throw new Error(`tokens.css ${theme} block missing ${name}`);
        return v;
      }
      test('FolderRow count (`--text-dim`) vs --surface-2 >= 4.5:1', () => {
        expect(contrast(need('--text-dim'), need('--surface-2'))).toBeGreaterThanOrEqual(4.5);
      });
      for (const color of SPACE_COLORS) {
        const { l, c, h } = colourToOklch(color);
        const washL = isLight ? Math.min(l, 0.55) : l;
        for (const bg of ['--surface', '--bg']) {
          test(`TabRow .meta (\`--text-dim\`) over the ${color} --space-c-soft wash on ${bg} >= 4.5:1`, () => {
            const wash = compose(
              parseRgba(`oklch(${washL} ${c} ${h} / 0.16)`),
              parseRgba(resolveOklch(need(bg), h)),
            );
            expect(
              ratioRgba(parseRgba(resolveOklch(need('--text-dim'))), wash),
            ).toBeGreaterThanOrEqual(4.5);
          });
        }
      }
    });
  }
});

/**
 * DS-05 — a per-Space palette hue re-rolled directly as a foreground glyph
 * (`LensRow`) or selection ring (`ColorSwatch`), capped in light theme by a
 * lightness floor. The light-theme cap is `min(<raw L>, 0.50)`; the glyph
 * consumes the capped lightness, the ring consumes `capped + 0.04` (its existing
 * `+0.04` lift). Floors: glyph AA Normal 4.5:1, ring 3:1 non-text, on the light
 * `--surface` for every Space hue. NOTE: this recomputes `min()` in JS and so
 * only pins the CAP VALUE — that the CSS cap actually APPLIES (a self-reference
 * cycle would blank the colour instead) is verified in the manual catalog pass
 * (tasks 7.3 / 10.3), not here.
 */
describe('DS-05 re-rolled per-Space glyph + ring capped on the light surface', () => {
  const light = readLightTokens();
  const CAP = 0.5;
  function surf(): string {
    const v = light.get('--surface');
    if (!v) throw new Error('tokens.css light block missing --surface');
    return resolveOklch(v);
  }
  for (const color of SPACE_COLORS) {
    const { l, c, h } = colourToOklch(color);
    const capped = Math.min(l, CAP);
    test(`${color} glyph (\`min(L, 0.50)\`) vs light --surface >= 4.5:1`, () => {
      expect(contrast(`oklch(${capped} ${c} ${h})`, surf())).toBeGreaterThanOrEqual(4.5);
    });
    test(`${color} ring (\`min(L, 0.50) + 0.04\`) vs light --surface >= 3:1`, () => {
      expect(contrast(`oklch(${capped + 0.04} ${c} ${h})`, surf())).toBeGreaterThanOrEqual(3);
    });
  }
});
