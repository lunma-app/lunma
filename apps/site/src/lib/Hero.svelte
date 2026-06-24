<script lang="ts">
import InstallCta from '$lib/InstallCta.svelte';
import { CHROME_WEB_STORE_URL, EDGE_ADDONS_URL, EDGE_LAUNCHED } from '$lib/links';
import { altKeySymbol } from '$lib/platform.svelte';
import StageWindow from '$lib/StageWindow.svelte';
</script>

<header class="hero" id="top">
  <div class="hero-inner wrap">
    <div class="copy">
      <p class="kicker kindle k0">A Chrome &amp; Edge extension</p>
      <h1 class="kindle k1">Your tabs, organised into Spaces.</h1>
      <p class="lede kindle k2">
        Lunma is a vertical sidebar for Chrome and Edge. Every project gets its own
        colour-coded Space, and the launcher on <kbd class="key">{altKeySymbol()}</kbd>
        <kbd class="key">L</kbd> jumps you to any tab.
      </p>
      <div class="ctas kindle k3">
        <InstallCta href={CHROME_WEB_STORE_URL}>Add to Chrome, it's free</InstallCta>
        {#if EDGE_LAUNCHED}
          <InstallCta href={EDGE_ADDONS_URL} variant="ghost">Add to Edge</InstallCta>
        {/if}
      </div>
      <p class="hint kindle k3">Free, and it never phones home.</p>
    </div>

    <div class="stage-wrap kindle k2">
      <StageWindow />
    </div>
  </div>
</header>

<style>
  /* The hero owns the first screen: fill the viewport below the sticky nav (82px),
     content centred. The clamp CAPS the height (~900px) so on tall monitors the
     content doesn't float in a sea of space under the nav — there it holds a
     comfortable height and lets beat 01 peek below to invite the scroll. min-height
     (not height) so short laptops grow and never clip the mock; svh so mobile
     browser chrome doesn't over-tallen it. */
  .hero {
    min-height: clamp(560px, calc(100svh - 82px), 900px);
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 48px 0;
  }

  /* Flex, not grid: grid fr/minmax tracks left dead space beside the copy at wide
     widths (the copy column resolved to its max while the text was narrower, and
     the mock never filled its track). Flex is deterministic — the copy hugs its
     text, the mock grows to fill the rest, and the visible gap is exactly `gap`. */
  .hero-inner {
    display: flex;
    align-items: center;
    gap: clamp(36px, 4.5vw, 72px);
  }

  .copy {
    flex: 0 1 auto;
    max-width: 30ch;
  }

  /* The mock takes all the space the copy doesn't, so it grows to the right edge
     and the gap stays put. min-width:0 lets it shrink below content if needed. */
  .stage-wrap {
    flex: 1 1 0;
    min-width: 0;
  }

  h1 {
    font-size: var(--text-display);
    line-height: 1.04;
  }

  .lede {
    max-width: 44ch;
    margin-top: 24px;
    font-size: var(--text-lg);
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
    /* Stack: reset the flex sizing so copy and mock fall into natural block flow. */
    .hero-inner {
      flex-direction: column;
      align-items: stretch;
      gap: 44px;
    }

    .copy {
      flex: initial;
      max-width: 32ch;
    }

    .stage-wrap {
      flex: initial;
      width: 100%;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .kindle {
      animation: none;
    }
  }
</style>
