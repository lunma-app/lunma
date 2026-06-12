<script lang="ts">
import type { Snippet } from 'svelte';
import { reveal } from '$lib/reveal';

// A numbered editorial chapter: a big faint serif numeral + eyebrow + display
// heading + copy on one side, a glass-framed product visual on the other. The
// `layout` prop varies the rhythm down the page (copy-left / copy-right / a
// wide stack where the visual wants width). Composes the shared .lunma-glass
// recipe and the type/colour tokens — no design values are hard-coded here.
interface Props {
  index: number;
  kicker: string;
  title: string;
  layout?: 'left' | 'right' | 'wide';
  id?: string;
  copy: Snippet;
  visual: Snippet;
}

let { index, kicker, title, layout = 'left', id, copy, visual }: Props = $props();

const label = $derived(String(index).padStart(2, '0'));
</script>

<section class="chapter" {id} use:reveal>
  <div class="inner wrap" data-layout={layout}>
    <div class="copy">
      <span class="num" aria-hidden="true">{label}</span>
      <p class="kicker">{kicker}</p>
      <h2>{title}</h2>
      {@render copy()}
    </div>
    <div class="visual">
      <div class="panel lunma-glass">
        {@render visual()}
      </div>
    </div>
  </div>
</section>

<style>
  .chapter {
    padding: 64px 0;
  }

  .inner {
    display: grid;
    gap: clamp(36px, 5vw, 72px);
    align-items: center;
  }

  .inner[data-layout='left'] {
    grid-template-columns: minmax(0, 0.92fr) minmax(0, 1.08fr);
  }

  .inner[data-layout='right'] {
    grid-template-columns: minmax(0, 1.08fr) minmax(0, 0.92fr);
  }

  .inner[data-layout='right'] .copy {
    order: 2;
  }

  .inner[data-layout='wide'] {
    grid-template-columns: 1fr;
    justify-items: center;
    text-align: center;
    gap: 40px;
  }

  .inner[data-layout='wide'] .copy {
    max-width: 52ch;
  }

  .inner[data-layout='wide'] .visual {
    width: 100%;
  }

  /* A wide chapter's visual is a centred showcase, not a full-bleed band: the
     panel hugs its content so it never reads as a near-empty box around a small
     element (e.g. the favourites tray). */
  .inner[data-layout='wide'] .panel {
    width: fit-content;
    margin-inline: auto;
  }

  .num {
    display: block;
    font-family: var(--font-display);
    font-size: clamp(40px, 6vw, 64px);
    line-height: 1;
    color: var(--text-faint);
    opacity: 0.55;
    margin-bottom: 14px;
  }

  .inner[data-layout='wide'] .num {
    margin-left: auto;
    margin-right: auto;
  }

  h2 {
    font-size: var(--text-2xl);
    line-height: 1.12;
  }

  .copy :global(p) {
    max-width: 46ch;
    margin-top: 18px;
    color: var(--text-muted);
  }

  .inner[data-layout='wide'] .copy :global(p) {
    margin-left: auto;
    margin-right: auto;
  }

  .copy :global(p.fine) {
    font-size: var(--text-md);
    color: var(--text-dim);
  }

  .panel {
    padding: 28px;
  }

  @media (max-width: 880px) {
    .inner,
    .inner[data-layout='left'],
    .inner[data-layout='right'] {
      grid-template-columns: 1fr;
      gap: 32px;
    }

    .inner[data-layout='right'] .copy {
      order: 0;
    }
  }
</style>
