<script lang="ts">
// The site's entire visual identity comes from the shared package — tokens,
// the self-hosted brand faces, and the aurora/glass/glow recipes — NOT a
// hand-mirrored copy. Brand stays in lockstep with the extension by import.
import { onMount } from 'svelte';
import { initPlatform } from '$lib/platform.svelte';
import '@lunma/tokens/tokens.css';
import '@lunma/tokens/fonts.css';
import '@lunma/tokens/recipes.css';
import '../app.css';

let { children } = $props();

// Sample the OS once on the client so the launcher shortcut reads "Option" on a
// Mac and "Alt" elsewhere (same key, different label — see platform.svelte.ts).
onMount(initPlatform);
</script>

<!-- Preload the two brand faces the FIRST PAINT uses — the Instrument Serif regular
     face (the hero <h1>) and the Mona Sans variable face (body/nav) — so the serif
     headline doesn't FOUT/reflow. They are served at the stable `/fonts/*` path the
     package's `@font-face` urls expect (vite.config copies them into static/fonts),
     so the preload hrefs match the font fetches exactly. `crossorigin` is required:
     font fetches are CORS-mode even same-origin, so the hint must match to be used. -->
<svelte:head>
  <link
    rel="preload"
    href="/fonts/InstrumentSerif-Regular.woff2"
    as="font"
    type="font/woff2"
    crossorigin="anonymous"
  />
  <link
    rel="preload"
    href="/fonts/MonaSans-Variable.woff2"
    as="font"
    type="font/woff2"
    crossorigin="anonymous"
  />
</svelte:head>

<!-- Ambient firelight filling the room — the shared aurora recipe at its
     @lunma/tokens vivid default opacity. The Space demo re-binds --space-h live,
     so the whole backdrop recolours with the chosen Space. -->
<div class="aurora-backdrop" aria-hidden="true">
  <div class="lunma-aurora">
    <span class="lunma-aurora__blob lunma-aurora__blob--1"></span>
    <span class="lunma-aurora__blob lunma-aurora__blob--2"></span>
    <span class="lunma-aurora__blob lunma-aurora__blob--3"></span>
    <span class="lunma-aurora__grain"></span>
  </div>
</div>

<div class="page">
  {@render children()}
</div>

<style>
  .aurora-backdrop {
    position: fixed;
    inset: 0;
    z-index: var(--z-base);
    pointer-events: none;
    /* No --aurora-opacity override: the backdrop inherits the @lunma/tokens vivid
       default (0.5), so the page's atmosphere tracks the product by construction. */
  }

  .aurora-backdrop :global(.lunma-aurora) {
    position: absolute;
  }

  .page {
    position: relative;
    z-index: var(--z-raised);
  }
</style>
