/**
 * WCAG 2.1 contrast contract for the marketing site.
 *
 * The site composes the SAME tokens the extension ships (from
 * `@lunma/tokens/tokens.css`), so this test parses that stylesheet as its
 * source-of-truth — no mirrored values — and asserts that every text/accent
 * pairing the landing page actually renders meets WCAG-AA for its size. This is
 * the automated half of the `marketing-site` accessibility contract (the manual
 * reduced-motion / immersive-visual pass is task 5.2); it mirrors the
 * extension's own `contrast.test.ts` so the AA bar is gated, not eyeballed.
 *
 * `culori` converts OKLCH → sRGB → WCAG relative luminance and computes the
 * contrast ratio per the WCAG 2.1 formula.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse, wcagContrast } from 'culori';
import { describe, expect, test } from 'vitest';

// vitest runs with cwd = apps/site; the shared token home lives in the package.
const TOKENS_PATH = resolve(process.cwd(), '../../packages/tokens/tokens.css');

/** Pull the first `:root { ... }` block and parse `--name: value;` pairs. */
function readTokens(): Map<string, string> {
  const css = readFileSync(TOKENS_PATH, 'utf-8');
  const rootMatch = css.match(/:root\s*\{([\s\S]*?)\}/);
  if (!rootMatch?.[1]) throw new Error('no :root block in tokens.css');
  const stripped = rootMatch[1].replace(/\/\*[\s\S]*?\*\//g, '');
  const out = new Map<string, string>();
  for (const line of stripped.split(';')) {
    const m = line.match(/^\s*(--[a-z0-9-]+)\s*:\s*(.+?)\s*$/);
    if (m?.[1] && m?.[2]) out.set(m[1], m[2]);
  }
  return out;
}

/** Collapse the `calc(a * b)` / `calc(a + b)` / `clamp(0, v, 1)` math the
 * identity tokens use (the warm-substrate redesign multiplies the neutral chroma
 * by `--ds-warm-amt`). */
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

/** Resolve an `oklch(...)` expression at the site's resting Space (now the warm
 * substrate, hue 60): substitute the hue-axis custom properties to their `:root`
 * defaults and drop the alpha (we test the opaque colour). */
function resolveOklch(expr: string, hue = 60): string {
  const stripped = expr.replace(/\s*\/\s*[\d.]+\s*\)/, ')');
  const substituted = stripped
    .replace(/var\(--base-hue\)/g, String(hue))
    .replace(/var\(--ds-warm-h\)/g, String(hue))
    .replace(/var\(--ds-warm-amt\)/g, '1')
    .replace(/var\(--ds-primary-h\)/g, '233')
    .replace(/var\(--ds-primary-c\)/g, '0.15')
    .replace(/var\(--space-h(?:,\s*[\d.]+)?\)/g, String(hue))
    .replace(/var\(--space-l(?:,\s*[\d.]+)?\)/g, '0.62')
    .replace(/var\(--space-chroma(?:,\s*[\d.]+)?\)/g, '0.15');
  return evalMath(substituted);
}

describe('marketing site — WCAG-AA contrast', () => {
  const tokens = readTokens();

  function need(name: string): string {
    const v = tokens.get(name);
    if (!v) throw new Error(`tokens.css missing ${name}`);
    return v;
  }

  function ratio(fgToken: string, bgToken: string): number {
    const fg = parse(resolveOklch(need(fgToken)));
    const bg = parse(resolveOklch(need(bgToken)));
    if (!fg || !bg) throw new Error('culori failed to parse');
    return wcagContrast(fg, bg);
  }

  // The exact pairings the landing page renders, each at the WCAG level its
  // text size demands (4.5 normal / 3 large). `[fg, bg, minRatio, where]`.
  const PAIRS: Array<[string, string, number, string]> = [
    ['--text', '--bg', 7, 'headings, hero, primary copy on the substrate'],
    ['--text', '--surface', 7, 'privacy policy headings + body copy on the glass sheet'],
    ['--text-2', '--bg', 4.5, 'FAQ summaries, preview tab rows'],
    ['--text-2', '--surface', 4.5, 'the Alt / L keycaps'],
    ['--text-muted', '--bg', 4.5, 'lede, feature copy, nav links, trust cells'],
    ['--text-dim', '--bg', 4.5, 'hero hint, fine print, footer credit, section labels'],
    ['--space-on', '--accent', 4.5, 'install CTA label on the accent fill'],
    ['--accent', '--bg', 4.5, 'the eyebrow kickers and the "public" / source link'],
    // --surface stands in for the frosted-glass panels (a translucent surface
    // tint over --bg composites to roughly --surface lightness), so any text the
    // redesign sets on a .lunma-glass panel is gated here too.
    ['--text-muted', '--surface', 4.5, 'body copy on glass panels (the trust cells)'],
    ['--text-dim', '--surface', 4.5, 'search-pill placeholders / meta on the staged preview'],
    ['--accent', '--surface', 4.5, 'the "public" source link inside a glass trust cell'],
  ];

  for (const [fg, bg, min, where] of PAIRS) {
    test(`${fg} on ${bg} ≥ ${min}:1 (${where})`, () => {
      expect(ratio(fg, bg)).toBeGreaterThanOrEqual(min);
    });
  }
});
