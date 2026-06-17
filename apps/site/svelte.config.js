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
    // Strict same-origin Content-Security-Policy, emitted as a <meta> per page
    // (the only prerender-compatible mode — `nonce` needs a per-request server).
    // `hash` mode SHA-hashes SvelteKit's own inline hydration script at build
    // time, so `script-src` needs neither `'unsafe-inline'` nor hand-maintained
    // hashes that would rot on every build (design D5). The site loads nothing
    // cross-origin — no analytics, no external scripts; fonts/images/OG are all
    // self-hosted — so every directive is `'self'`.
    //
    // `style-src` carries `'unsafe-inline'`: the prerendered HTML contains inline
    // `style="…"` attributes (the per-space colour custom properties in
    // Chapters/StageWindow/og, and app.html's `display:contents` wrapper). CSP
    // style HASHES do not cover inline style ATTRIBUTES, and refactoring the
    // colour-driving attributes out is not worth it — so this is the narrow,
    // documented fallback design D5 pre-agreed (`'unsafe-inline'` on `style-src`
    // ONLY, never `script-src`). No inline `<style>` blocks are emitted, so no
    // style hash is present to make a CSP-3 browser ignore `'unsafe-inline'`.
    csp: {
      mode: 'hash',
      directives: {
        'default-src': ['self'],
        'script-src': ['self'],
        'style-src': ['self', 'unsafe-inline'],
        'img-src': ['self', 'data:'],
        'font-src': ['self'],
        'connect-src': ['self'],
        'object-src': ['none'],
        'base-uri': ['self'],
        'form-action': ['none'],
        'frame-ancestors': ['none'],
      },
    },
  },
  compilerOptions: {
    runes: true,
  },
};
