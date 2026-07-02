import { copyFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';
import { generateDerivedControls } from './catalog/lib/generate-derived-controls';

// Dev-only component catalog (see openspec component-catalog capability). A
// SIBLING of vite.config.ts: plain `svelte()` (no @crxjs/vite-plugin — the
// catalog is not an extension), `root: catalog/`, and the same `@`→`src` alias
// the extension uses so stories import primitives as `@/ui/*`. It ships NOTHING
// in the MV3 bundle: it has its own root and is never referenced by
// manifest.json or vite.config.ts's rollup input.

// Replicate the extension's font-copy: the brand faces live once in
// @lunma/tokens (its `fonts/` dir is the source of truth); the catalog serves
// them at the stable `/fonts/*` path the `@font-face` urls in fonts.css expect,
// so copy them into the catalog's (gitignored, generated) `public/fonts/`.
const fontsSrc = fileURLToPath(new URL('../../packages/tokens/fonts/', import.meta.url));
const fontsDest = fileURLToPath(new URL('./catalog/public/fonts/', import.meta.url));
mkdirSync(fontsDest, { recursive: true });
for (const file of ['MonaSans-Variable.woff2', 'InstrumentSerif-Regular.woff2']) {
  copyFileSync(fontsSrc + file, fontsDest + file);
}

// Derive each src/ui primitive's base controls from its own `Props` interface
// (see the derive-catalog-controls-from-props OpenSpec change) and write them
// to a gitignored, generated module — same synchronous-Node-side-effect
// pattern as the font copy above. `registry.ts` imports this to merge with
// each story's `controlOverrides`/`excludeControls`. `vite.config.ts` also
// calls this (see its own comment) since plain `vitest run` needs it too.
generateDerivedControls();

export default defineConfig({
  root: fileURLToPath(new URL('./catalog', import.meta.url)),
  plugins: [svelte()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  // A distinct port from the extension dev server (`pnpm dev` → Vite's default
  // 5173) so the catalog and the extension can run side by side. 6006 is the
  // conventional component-catalog port.
  server: { port: 6006 },
});
