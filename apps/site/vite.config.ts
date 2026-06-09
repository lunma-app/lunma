import { copyFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

// The two brand faces live once in @lunma/tokens (its `fonts/` dir). The site
// serves them at the stable `/fonts/*` path the package's fonts.css @font-face
// urls expect, so copy them into `static/fonts/` (gitignored, generated) at
// config load — rather than committing a second copy of the woff2 bytes.
const fontsSrc = fileURLToPath(new URL('../../packages/tokens/fonts/', import.meta.url));
const fontsDest = fileURLToPath(new URL('./static/fonts/', import.meta.url));
mkdirSync(fontsDest, { recursive: true });
for (const file of ['MonaSans-Variable.woff2', 'InstrumentSerif-Regular.woff2']) {
  copyFileSync(fontsSrc + file, fontsDest + file);
}

export default defineConfig({
  // The SvelteKit plugin owns the build/dev server. For the Vitest contrast
  // check (a pure node test that reads the token CSS) it is omitted so the
  // suite needs no kit context.
  plugins: process.env.VITEST ? [] : [sveltekit()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
