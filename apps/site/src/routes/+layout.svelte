<script lang="ts">
// The site's entire visual identity comes from the shared package — tokens,
// the self-hosted brand faces, and the aurora/glass/glow recipes — NOT a
// hand-mirrored copy. Brand stays in lockstep with the extension by import.
import '@lunma/tokens/tokens.css';
import '@lunma/tokens/fonts.css';
import '@lunma/tokens/recipes.css';
import '../app.css';

let { children } = $props();
</script>

<!-- Ambient firelight filling the room — the shared aurora recipe, set to a
     calmer full-page opacity. The Space demo re-binds --space-h live, so the
     whole backdrop recolours with the chosen Space. -->
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
    /* A softer wash than the extension's sidebar default (0.9) — this fills a
       whole viewport, so it reads better dialled back. */
    --aurora-opacity: 0.55;
  }

  .aurora-backdrop :global(.lunma-aurora) {
    position: absolute;
  }

  .page {
    position: relative;
    z-index: var(--z-raised);
  }
</style>
