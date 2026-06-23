import { copyFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { crx } from '@crxjs/vite-plugin';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vitest/config';
import manifest from './public/manifest.json' with { type: 'json' };

// The two brand faces live once in the @lunma/tokens package (its `fonts/` dir
// is the single source of truth). The extension must serve them at the stable
// `/fonts/*` path — `@font-face` urls in fonts.css, the manifest's
// `web_accessible_resources: ["fonts/*"]`, and overlay.ts's
// `chrome.runtime.getURL('fonts/...')` all expect fixed filenames there. So copy
// them from the package into the extension's `public/fonts/` (gitignored,
// generated) at config load — before crxjs processes the manifest or vite copies
// publicDir — rather than committing a second copy of the woff2 bytes.
const fontsSrc = fileURLToPath(new URL('../../packages/tokens/fonts/', import.meta.url));
const fontsDest = fileURLToPath(new URL('./public/fonts/', import.meta.url));
mkdirSync(fontsDest, { recursive: true });
for (const file of ['MonaSans-Variable.woff2', 'InstrumentSerif-Regular.woff2']) {
  copyFileSync(fontsSrc + file, fontsDest + file);
}

const aliases = {
  '@': new URL('./src', import.meta.url).pathname,
};

export default defineConfig(({ mode }) => ({
  plugins: [svelte(), crx({ manifest })],
  // Svelte 5 + @testing-library/svelte: resolve the browser entry so mount()
  // works in jsdom tests. Outside of tests, vite picks the right condition
  // automatically.
  resolve: process.env.VITEST ? { alias: aliases, conditions: ['browser'] } : { alias: aliases },
  build: {
    target: 'esnext',
    sourcemap: mode !== 'production',
    rollupOptions: {
      // The smart-folder page (smart-folder-page) is an extension page the
      // extension opens itself (chrome.tabs.create on its runtime URL). It is not
      // referenced by the manifest (not a new-tab override, side panel, or options
      // page), so crxjs won't discover it — declare it as an explicit input so it
      // builds. NOT in web_accessible_resources: WAR would over-expose a
      // state-mirroring page to all web origins (least privilege).
      input: {
        folderpage: new URL('./src/launcher/folderpage/index.html', import.meta.url).pathname,
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.ts'],
    setupFiles: ['./vitest.setup.ts'],
    server: {
      deps: {
        inline: [/^svelte/],
      },
    },
    coverage: {
      provider: 'v8',
      include: ['src/shared/store*'],
      thresholds: { branches: 90 },
    },
  },
}));
