<script lang="ts">
import InstallCta from '$lib/InstallCta.svelte';
import { CHROME_WEB_STORE_URL, EDGE_ADDONS_URL } from '$lib/links';
import StageWindow from '$lib/StageWindow.svelte';
</script>

<header class="hero" id="top">
  <div class="hero-inner wrap">
    <div class="copy">
      <p class="kicker kindle k0">A Chrome &amp; Edge extension</p>
      <h1 class="kindle k1">Your tabs, organized into Spaces.</h1>
      <p class="lede kindle k2">
        Lunma is a vertical sidebar for Chrome and Edge. Group your tabs into
        colour-coded Spaces, jump to anything with a launcher on
        <kbd class="key">Alt</kbd> <kbd class="key">L</kbd>, and let the tabs you
        don't pin archive themselves.
      </p>
      <div class="ctas kindle k3">
        <InstallCta href={CHROME_WEB_STORE_URL}>Add to Chrome — it's free</InstallCta>
        <InstallCta href={EDGE_ADDONS_URL} variant="ghost">Add to Edge</InstallCta>
      </div>
      <p class="hint kindle k3">No account. No server. Open source.</p>
    </div>

    <div class="stage-wrap kindle k2">
      <StageWindow />
    </div>
  </div>
</header>

<style>
  .hero {
    padding: 40px 0 72px;
  }

  .hero-inner {
    display: grid;
    grid-template-columns: minmax(0, 0.86fr) minmax(0, 1.14fr);
    gap: clamp(32px, 5vw, 76px);
    align-items: center;
  }

  .copy {
    max-width: 30ch;
  }

  h1 {
    font-size: var(--text-display);
    line-height: 1.04;
  }

  .lede {
    max-width: 44ch;
    margin-top: 24px;
    font-size: var(--text-xl);
    line-height: 1.5;
    color: var(--text-muted);
  }

  .key {
    display: inline-flex;
    align-items: center;
    padding: 2px 9px;
    border: 1px solid var(--border);
    border-bottom-width: 2px;
    border-radius: var(--r-sm);
    background: var(--surface);
    font-family: var(--font-sans);
    font-size: var(--text-base);
    font-weight: var(--weight-semibold);
    color: var(--text-2);
    white-space: nowrap;
  }

  .ctas {
    display: flex;
    gap: 14px;
    margin: 32px 0 0;
    flex-wrap: wrap;
  }

  .hint {
    font-size: var(--text-md);
    color: var(--text-dim);
    margin-top: 16px;
  }

  /* Kindle entrance — the brand's signature first paint. Content settles in,
     staggered, riding the heavier --slow band; fully disabled under reduced
     motion (identical end state). */
  .kindle {
    animation: kindle var(--motion-slow) var(--ease-emphasised) both;
  }
  .k1 {
    animation-delay: 70ms;
  }
  .k2 {
    animation-delay: 150ms;
  }
  .k3 {
    animation-delay: 230ms;
  }

  @keyframes kindle {
    from {
      opacity: 0;
      transform: translateY(16px);
    }
    to {
      opacity: 1;
      transform: none;
    }
  }

  @media (max-width: 940px) {
    .hero-inner {
      grid-template-columns: 1fr;
      gap: 44px;
    }

    .copy {
      max-width: 32ch;
    }

    .lede {
      font-size: var(--text-lg);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .kindle {
      animation: none;
    }
  }
</style>
