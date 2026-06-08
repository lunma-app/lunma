import { crx } from '@crxjs/vite-plugin';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vitest/config';
import manifest from './public/manifest.json' with { type: 'json' };

const aliases = {
  '@': new URL('./src', import.meta.url).pathname,
};

export default defineConfig({
  plugins: [svelte(), crx({ manifest })],
  // Svelte 5 + @testing-library/svelte: resolve the browser entry so mount()
  // works in jsdom tests. Outside of tests, vite picks the right condition
  // automatically.
  resolve: process.env.VITEST ? { alias: aliases, conditions: ['browser'] } : { alias: aliases },
  build: {
    target: 'esnext',
    sourcemap: true,
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
  },
});
