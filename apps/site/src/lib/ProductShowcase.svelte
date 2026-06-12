<script lang="ts">
import { reveal } from '$lib/reveal';

// "This is the real thing." — the two captured screenshots of the shipped
// extension, staged the way they actually relate: the new-tab page inside a
// browser window, with the sidebar (a Chrome side panel) floating beside it.
// Real pixels, no mock. The aurora + glow read the resting `--base-hue` (the
// moonlit identity), so it re-hues with the brand. Motion is the shared `reveal`
// (staggered), reduced-motion safe.
</script>

<section class="showcase" aria-labelledby="real-h">
  <div class="aura" aria-hidden="true"></div>

  <div class="head wrap-narrow">
    <p class="kicker" use:reveal>No mockups</p>
    <h2 id="real-h" use:reveal={{ delay: 60 }}>This is the actual extension.</h2>
    <p class="lede" use:reveal={{ delay: 120 }}>
      Both screenshots below are the shipped product, captured live in a browser. The
      new-tab page and the sidebar, exactly as you'll use them.
    </p>
  </div>

  <div class="scene">
    <div class="floor" aria-hidden="true"></div>

    <!-- The new-tab page, framed as the browser window it fills. -->
    <figure class="frame" use:reveal={{ delay: 140 }}>
      <div class="bar" aria-hidden="true"><i></i><i></i><i></i></div>
      <img
        class="shot"
        src="/shots/newtab.webp"
        width="1600"
        height="1031"
        alt="The Lunma new-tab page for a purple Design Space, its colour filling the page behind the Space name and a row of favourites."
        loading="lazy"
      />
    </figure>

    <!-- The sidebar — a Chrome side panel, so it floats free of the window. -->
    <img
      class="side shot"
      src="/shots/sidebar.webp"
      width="760"
      height="1900"
      alt="The Lunma sidebar for the Design Space: a favourites row, three pinned tabs, and temporary tabs, all with real favicons."
      loading="lazy"
      use:reveal={{ delay: 260 }}
    />
  </div>
</section>

<style>
  .showcase {
    position: relative;
    padding: 124px 24px 136px;
    overflow: hidden;
  }

  /* Resting aurora — soft pools of the identity hue (moonlit blue) so the panels
     read as lit objects in a room, not flat cutouts. Re-hues with `--base-hue`. */
  .aura {
    position: absolute;
    inset: -10% -8% -4%;
    z-index: 0;
    pointer-events: none;
    background:
      radial-gradient(
        48% 44% at 52% 22%,
        oklch(0.58 0.13 var(--base-hue) / 0.2),
        transparent 70%
      ),
      radial-gradient(
        58% 50% at 30% 78%,
        oklch(0.5 0.12 var(--base-hue) / 0.12),
        transparent 72%
      );
    filter: blur(20px);
  }

  .head {
    position: relative;
    z-index: 1;
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

  /* The staged scene — a fixed-ratio canvas the window + side panel sit within. */
  .scene {
    position: relative;
    z-index: 1;
    width: 100%;
    max-width: 1060px;
    margin: 0 auto;
    aspect-ratio: 1060 / 660;
  }

  /* A soft pool of identity light under the composition — the "lit room" floor. */
  .floor {
    position: absolute;
    left: 50%;
    bottom: -6%;
    width: 78%;
    height: 38%;
    transform: translateX(-50%);
    border-radius: var(--r-pill);
    background: radial-gradient(
      closest-side,
      oklch(0.6 0.13 var(--base-hue) / 0.22),
      transparent 72%
    );
    filter: blur(34px);
    pointer-events: none;
  }

  .shot {
    display: block;
    height: auto;
    border-radius: var(--r-md);
    border: 1px solid var(--glass-border);
    background: var(--bg);
  }

  /* The browser window: the new-tab page under a slim title bar with the three
     lights — so the screenshot reads unmistakably as a real browser window. */
  .frame {
    position: absolute;
    right: 0;
    top: 8%;
    width: 66%;
    margin: 0;
    z-index: 1;
    border-radius: var(--r-lg);
    border: 1px solid var(--glass-border);
    overflow: hidden;
    background: oklch(0.2 0.012 var(--base-hue));
    box-shadow: var(--shadow-lg);
  }
  .bar {
    display: flex;
    align-items: center;
    gap: 7px;
    height: 30px;
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
  .frame .shot {
    width: 100%;
    border: 0;
    border-radius: 0;
  }

  /* The sidebar — a tall side panel floating in front-left, its natural portrait
     extending above and below the window for depth. Strongest shadow + a breath
     of hue glow, so it reads as nearest the viewer. */
  .side {
    position: absolute;
    left: 12%;
    top: 2%;
    width: 24%;
    z-index: 2;
    box-shadow: var(--shadow-pop), var(--glow-space-soft);
  }

  @media (max-width: 900px) {
    /* Unstack into a clean vertical gallery — window then sidebar, no overlap. */
    .scene {
      aspect-ratio: auto;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 28px;
      max-width: 440px;
    }
    .frame,
    .side {
      position: static;
      width: 100%;
    }
    .side {
      width: 70%;
    }
    .floor {
      display: none;
    }
  }
</style>
