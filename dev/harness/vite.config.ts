import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';

// Standalone harness config — the real svelte plugin WITHOUT @crxjs, so the
// sidebar mounts in a plain tab (chrome is shimmed in chrome-shim.ts). Used only
// for manual / Playwright validation of the carousel motion.
export default defineConfig({
  root: new URL('.', import.meta.url).pathname,
  plugins: [svelte()],
  resolve: {
    alias: { '@': new URL('../../src', import.meta.url).pathname },
    conditions: ['browser'],
  },
  server: { port: 5199, strictPort: true },
});
