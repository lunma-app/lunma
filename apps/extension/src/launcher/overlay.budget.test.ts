import { resolve } from 'node:path';
import { gzipSync } from 'node:zlib';
import { build, type Rollup } from 'vite';
import { describe, expect, test } from 'vitest';

/**
 * Verify-time guard for the dormant launcher overlay's bundle budget
 * (the *overlay bundle budget is enforced by a verify-time guard* requirement).
 *
 * The overlay (`overlay.ts`) ships as a content-script chunk that MUST stay
 * vanilla — no Svelte runtime — and under 15KB gzipped (design D5/D7). Those
 * SHALLs were historically enforced only by a code comment; this test enforces
 * them mechanically by bundling the overlay entry in isolation with Vite's own
 * bundler (the pinned stack's bundler — rolldown under Vite 8), inspecting the
 * resulting chunk's dependency graph, and gzipping its code.
 *
 * Self-contained: no crxjs pipeline, no `dist/`. Vite resolves the `?inline`
 * CSS import and workspace packages natively, so the bundle mirrors what ships.
 */

// Vitest runs with the package root as cwd (root `pnpm verify` → `pnpm --filter`
// runs the script there), so resolve the overlay entry relative to it.
const EXTENSION_ROOT = process.cwd();
const OVERLAY_ENTRY = resolve(EXTENSION_ROOT, 'src/launcher/overlay.ts');
const MAX_GZIP_BYTES = 15 * 1024;

async function bundleOverlay(): Promise<{ code: string; moduleIds: string[] }> {
  const result = (await build({
    root: EXTENSION_ROOT,
    configFile: false,
    logLevel: 'silent',
    build: {
      write: false,
      minify: true,
      lib: { entry: OVERLAY_ENTRY, formats: ['es'], fileName: 'overlay' },
    },
  })) as Rollup.RollupOutput | Rollup.RollupOutput[];
  const first = Array.isArray(result) ? result[0] : result;
  if (!first) {
    throw new Error('overlay budget guard: Vite build produced no output');
  }
  const chunk = first.output.find((o) => o.type === 'chunk');
  if (chunk?.type !== 'chunk') {
    throw new Error('overlay budget guard: no JS chunk produced by the bundle');
  }
  return { code: chunk.code, moduleIds: Object.keys(chunk.modules) };
}

describe('overlay bundle budget', () => {
  test('ships no Svelte runtime and stays under the gzip budget', async () => {
    const { code, moduleIds } = await bundleOverlay();

    const svelteInputs = moduleIds.filter((id) => id.includes('node_modules/svelte/'));
    expect(
      svelteInputs,
      `overlay bundle pulled in Svelte runtime module(s):\n  ${svelteInputs.join('\n  ')}`,
    ).toEqual([]);

    // The launcher scorer (uFuzzy) runs SW-side only — it must never reach the
    // overlay content-script graph (launcher-fuzzy-smart-folders, design D3).
    const fuzzyInputs = moduleIds.filter((id) => id.includes('ufuzzy'));
    expect(
      fuzzyInputs,
      `overlay bundle pulled in the uFuzzy matcher:\n  ${fuzzyInputs.join('\n  ')}`,
    ).toEqual([]);

    const gzipBytes = gzipSync(Buffer.from(code)).length;
    expect(
      gzipBytes,
      `overlay bundle is ${gzipBytes} B gzipped, at or over the ${MAX_GZIP_BYTES} B budget`,
    ).toBeLessThan(MAX_GZIP_BYTES);
  }, 30_000);
});
