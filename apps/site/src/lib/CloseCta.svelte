<script lang="ts">
import InstallCta from '$lib/InstallCta.svelte';
import { CHROME_WEB_STORE_URL, EDGE_ADDONS_URL, EDGE_LAUNCHED } from '$lib/links';
import { reveal } from '$lib/reveal';
</script>

<section class="close wrap" use:reveal>
  <div class="glow" aria-hidden="true"></div>
  <p class="kicker">Get started</p>
  <h2>Add Lunma to Chrome{EDGE_LAUNCHED ? ' or Edge' : ''}.</h2>
  <p class="sub">
    Free, local-only, and open source. Install it once, and your tabs settle
    into Spaces.
  </p>
  <div class="ctas">
    <InstallCta href={CHROME_WEB_STORE_URL}>Add to Chrome, it's free</InstallCta>
    {#if EDGE_LAUNCHED}
      <InstallCta href={EDGE_ADDONS_URL} variant="ghost">Add to Edge</InstallCta>
    {/if}
  </div>
</section>

<style>
  .close {
    position: relative;
    padding: 104px 24px 96px;
    text-align: center;
  }

  /* A soft hearth glow pooling behind the closing line, in the active hue. */
  .glow {
    position: absolute;
    left: 50%;
    top: 38%;
    width: min(560px, 80%);
    height: 280px;
    transform: translate(-50%, -50%);
    border-radius: var(--r-pill);
    background: radial-gradient(
      closest-side,
      oklch(var(--space-l, 0.62) var(--space-chroma, 0.15) var(--space-h, 62) / 0.2),
      transparent 70%
    );
    filter: blur(28px);
    pointer-events: none;
    z-index: var(--z-base);
  }

  .kicker,
  h2,
  .sub,
  .ctas {
    position: relative;
    z-index: var(--z-raised);
  }

  h2 {
    font-size: clamp(32px, 5.4vw, 54px);
    line-height: 1.08;
  }

  .sub {
    max-width: 50ch;
    margin: 22px auto 0;
    font-size: var(--text-lg);
    color: var(--text-muted);
  }

  .ctas {
    display: flex;
    gap: 14px;
    justify-content: center;
    margin-top: 36px;
    flex-wrap: wrap;
  }
</style>
