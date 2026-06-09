import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

// Fully static output (adapter-static) — the site prerenders to plain files
// deployable to any static host bound to lunma.app, with no server runtime. The
// site-wide `prerender = true` flag lives in src/routes/+layout.ts.
export default {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      pages: 'build',
      assets: 'build',
      fallback: undefined,
      precompress: false,
      strict: true,
    }),
  },
  compilerOptions: {
    runes: true,
  },
};
