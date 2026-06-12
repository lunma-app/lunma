<script lang="ts">
import { reveal } from '$lib/reveal';

// "This is the real thing." — one coherent browser window of the shipped
// extension: the sidebar (a Chrome side panel) docked flush beside the new-tab
// page, both real captures at the same scale under a single title bar, so it
// reads as one real browser with Lunma open — not two pasted screenshots. No
// colour glow; a neutral shadow grounds the window. Motion is the shared
// `reveal`, reduced-motion safe.
</script>

<section class="showcase" aria-labelledby="real-h">
  <div class="head wrap-narrow">
    <p class="kicker" use:reveal>No mockups</p>
    <h2 id="real-h" use:reveal={{ delay: 60 }}>This is the actual extension.</h2>
    <p class="lede" use:reveal={{ delay: 120 }}>
      One live capture, straight from the browser — the sidebar open beside the new-tab
      page, exactly as you'll use them.
    </p>
  </div>

  <figure class="window" use:reveal={{ delay: 160 }}>
    <div class="bar" aria-hidden="true"><i></i><i></i><i></i></div>
    <div class="body">
      <img
        class="side"
        src="/shots/sidebar.webp"
        width="760"
        height="1900"
        alt="The Lunma sidebar for a purple Design Space: a favourites row, three pinned tabs, and temporary tabs, all with real favicons."
        loading="lazy"
      />
      <img
        class="page"
        src="/shots/newtab.webp"
        width="1600"
        height="1031"
        alt="The Lunma new-tab page for the Design Space, its colour filling the page behind the Space name and a row of favourites."
        loading="lazy"
      />
    </div>
  </figure>
</section>

<style>
  .showcase {
    position: relative;
    padding: 124px 24px 136px;
  }

  .head {
    text-align: center;
    margin-bottom: 60px;
  }
  h2 {
    margin-top: 10px;
    font-size: var(--text-2xl);
    line-height: 1.1;
  }
  .lede {
    max-width: 52ch;
    margin: 18px auto 0;
    font-size: var(--text-lg);
    color: var(--text-muted);
  }

  /* One browser window: a slim title bar over a flush split of the two captures.
     A neutral shadow (no hue) grounds it; the page's own aurora is the only
     colour around it, so the window reads as a real object, not a lit cutout. */
  .window {
    max-width: 1080px;
    margin: 0 auto;
    border-radius: var(--r-lg);
    border: 1px solid var(--glass-border);
    overflow: hidden;
    background: oklch(0.2 0.012 var(--base-hue));
    box-shadow: var(--shadow-pop);
  }
  .bar {
    display: flex;
    align-items: center;
    gap: 7px;
    height: 32px;
    padding: 0 14px;
    border-bottom: 1px solid var(--glass-border);
    background: oklch(0.22 0.014 var(--base-hue) / 0.7);
  }
  .bar i {
    width: 10px;
    height: 10px;
    border-radius: var(--r-pill);
    background: var(--surface-3);
  }

  /* Sidebar + page docked at the SAME height: the width split (≈20.5/79.5) matches
     the two captures' aspect ratios (760:1900 and 1600:1031), so both render full
     and exactly equal-height with no crop and no overlap — a real side panel sitting
     beside the page, under one window chrome. */
  .body {
    display: flex;
    align-items: flex-start;
  }
  .body img {
    display: block;
    height: auto;
  }
  .side {
    width: 20.5%;
    border-right: 1px solid var(--glass-border);
  }
  .page {
    width: 79.5%;
  }

  @media (max-width: 640px) {
    /* Too narrow to dock the side panel legibly — show just the new-tab page in
       the window; the sidebar is shown large in the feature beats anyway. */
    .side {
      display: none;
    }
    .page {
      width: 100%;
    }
  }
</style>
