/**
 * Palette single-source parity (promote-space-palette-to-tokens, Decision 2).
 *
 * The nine-colour Space palette is **canonical in `@lunma/tokens`** as the
 * per-colour `--space-<color>-l/-c/-h/-on` custom properties; this file's
 * `colourToOklch` / `colourToOn` in `space-hue.ts` is the TS runtime mirror the
 * service worker and inline-style code read (tokens are CSS-only). Because the
 * palette is declared in two representations, this test locks them together: it
 * parses the token custom-property values and asserts they equal the TS
 * `colourToOklch` components and the `colourToOn` ink (already in the
 * `.toFixed(3)` form, Decision 3), failing on ANY drift. No codegen — the parity
 * test is the guarantee.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';
import { colourToOklch, colourToOn } from './space-hue';
import type { SpaceColor } from './types';

const TOKENS_PATH = resolve(process.cwd(), '../../packages/tokens/tokens.css');

/** The nine canonical Space colours (promote-space-palette-to-tokens). */
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

/** Parse the first `:root { ... }` block into `--name -> value` pairs (same
 * shape as the contrast tests' reader, so the stylesheet IS the source). */
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

describe('Space palette — tokens ↔ space-hue.ts parity (no drift)', () => {
  const tokens = readTokens();

  function need(name: string): string {
    const v = tokens.get(name);
    if (!v) throw new Error(`tokens.css missing ${name}`);
    return v;
  }

  for (const color of SPACE_COLORS) {
    describe(color, () => {
      const { l, c, h } = colourToOklch(color);

      test(`--space-${color}-l matches space-hue.ts lightness`, () => {
        expect(Number(need(`--space-${color}-l`))).toBe(l);
      });
      test(`--space-${color}-c matches space-hue.ts chroma`, () => {
        expect(Number(need(`--space-${color}-c`))).toBe(c);
      });
      test(`--space-${color}-h matches space-hue.ts hue`, () => {
        expect(Number(need(`--space-${color}-h`))).toBe(h);
      });
      test(`--space-${color}-on matches space-hue.ts ink (.toFixed(3) form)`, () => {
        expect(need(`--space-${color}-on`)).toBe(colourToOn(color));
      });
    });
  }
});
