<script lang="ts">
import Wordmark from '$lib/Wordmark.svelte';

// The canonical Space palette shown as a row of dots — the colour identity,
// exactly as the product ships it. Sourced from `@lunma/tokens` (the per-colour
// `--space-<color>-l/-c/-h` custom properties); no hand-copied tuples here. The
// eight saturated colours (gray, the neutral, is omitted from the brand row).
const palette = ['red', 'orange', 'yellow', 'green', 'cyan', 'blue', 'purple', 'pink'];
</script>

<div class="og">
  <div class="hearth" aria-hidden="true"></div>
  <p class="eyebrow">A Chrome &amp; Edge extension</p>
  <div class="mark"><Wordmark href="#" size={148} /></div>
  <h1>Your tabs, organized into Spaces.</h1>
  <p class="sub">Colour-coded Spaces · a keyboard launcher · tabs that archive themselves</p>
  <div class="footer">
    <div class="hues" aria-hidden="true">
      {#each palette as color (color)}
        <i style="--l: var(--space-{color}-l); --c: var(--space-{color}-c); --h: var(--space-{color}-h)"></i>
      {/each}
    </div>
    <p class="foot">Local-only · open source · lunma.app</p>
  </div>
</div>

<style>
  .og {
    position: relative;
    width: 1200px;
    height: 630px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    padding: 72px;
    overflow: hidden;
    background: var(--bg);
  }

  /* A hearth glow pooling behind the wordmark, in the resting ember hue. */
  .hearth {
    position: absolute;
    left: 50%;
    top: 44%;
    width: 760px;
    height: 420px;
    transform: translate(-50%, -50%);
    border-radius: var(--r-pill);
    background: radial-gradient(
      closest-side,
      oklch(var(--space-l, 0.62) var(--space-chroma, 0.15) var(--space-h, 62) / 0.26),
      transparent 70%
    );
    filter: blur(36px);
  }

  .eyebrow,
  .mark,
  h1,
  .sub,
  .footer {
    position: relative;
    z-index: var(--z-raised);
  }

  .eyebrow {
    font-size: 22px;
    font-weight: var(--weight-semibold);
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--accent);
    margin-bottom: 14px;
  }

  .mark {
    margin-bottom: 10px;
  }

  h1 {
    font-family: var(--font-display);
    font-size: 74px;
    line-height: 1.05;
    color: var(--text);
    text-align: center;
  }

  .sub {
    margin-top: 18px;
    font-size: 26px;
    color: var(--text-muted);
  }

  .footer {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 18px;
    margin-top: 44px;
  }

  .hues {
    display: flex;
    gap: 14px;
  }

  .hues i {
    width: 15px;
    height: 15px;
    border-radius: var(--r-pill);
    background: oklch(var(--l) var(--c) var(--h));
    box-shadow: 0 0 14px oklch(var(--l) var(--c) var(--h) / 0.6);
  }

  .foot {
    font-size: 20px;
    letter-spacing: 0.04em;
    color: var(--text-dim);
  }
</style>
