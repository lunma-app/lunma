/**
 * WCAG 2.1 contrast contract for the design tokens.
 *
 * This test holds the visual-quality policy honest: every text-on-background
 * pair Lunma ships MUST meet a stated WCAG level. If anyone changes a token
 * lightness or chroma that drops a pair below its required ratio, this test
 * fails and the change has to revisit the contrast budget.
 *
 * Math: we parse the OKLCH expressions from `src/ui/tokens.css` literally so
 * the test source-of-truth IS the stylesheet — no duplicated hex values to
 * drift. `culori` converts OKLCH → sRGB → WCAG relative luminance and
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
import { colourToOklch, colourToOn } from '../shared/space-hue';
import type { SpaceColor } from '../shared/types';

const TOKENS_PATH = resolve(process.cwd(), 'src/ui/tokens.css');
const APP_CSS_PATH = resolve(process.cwd(), 'src/sidebar/app.css');

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

/** Evaluate the small `calc()` / `clamp()` math the identity tokens use
 * (space-palette-refresh): `calc(<a> + <b>)` and `clamp(0, <v>, 1)`. Runs calc
 * first so an inner `calc()` inside a `clamp()` collapses before the clamp. */
function evalMath(s: string): string {
  let out = s;
  let prev: string;
  do {
    prev = out;
    out = out.replace(/calc\(\s*([\d.]+)\s*\+\s*([\d.]+)\s*\)/g, (_m, a, b) =>
      String(Number(a) + Number(b)),
    );
  } while (out !== prev);
  return out.replace(/clamp\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*\)/g, (_m, lo, v, hi) =>
    String(Math.min(Number(hi), Math.max(Number(lo), Number(v)))),
  );
}

/** Resolve `oklch(L C H ...)` strings, substituting the hue-axis custom
 * properties to their documented `:root` defaults (`--base-hue`/`--space-h` → 62,
 * `--space-l` → 0.62, `--space-chroma` → 0.15) and evaluating the `calc()` /
 * `clamp()` the identity tokens use. Strip optional `/ alpha` since for contrast
 * we test the opaque colour. */
function resolveOklch(expr: string, baseHue = 62): string {
  // Drop trailing `/ <alpha>` — contrast for opacities folds into bg below
  // for borders/dividers, but for the text/bg pairs we test here we want
  // the opaque colour.
  const stripped = expr.replace(/\s*\/\s*[\d.]+\s*\)/, ')');
  const substituted = stripped
    .replace(/var\(--base-hue\)/g, String(baseHue))
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
    return expr
      .replace(/var\(--base-hue\)/g, String(HUE))
      .replace(/var\(--space-h[^)]*\)/g, String(HUE))
      .replace(/var\(--space-chroma[^)]*\)/g, String(CHROMA));
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
    });
  }
});
