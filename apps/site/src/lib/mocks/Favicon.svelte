<script lang="ts">
import type { FaviconSpec } from './apps';

// A favicon stand-in: a brand-coloured rounded plate with the app's brand
// glyph (simple-icons path, when set) or the app's initial (letter fallback).
interface Props {
  fav: FaviconSpec;
  /** Pixel size of the glyph. */
  size?: number;
}

let { fav, size = 16 }: Props = $props();
</script>

<span
  class="fav"
  style:--fh={fav.hue}
  style:--fc={fav.chroma ?? 0.14}
  style:--fz="{size}px"
  aria-hidden="true"
>
  {#if fav.path}
    <svg class="icon" viewBox="0 0 24 24"><path d={fav.path} /></svg>
  {:else}
    {fav.letter}
  {/if}
</span>

<style>
  .fav {
    display: inline-grid;
    place-items: center;
    flex: none;
    width: var(--fz);
    height: var(--fz);
    border-radius: calc(var(--fz) * 0.26);
    background: oklch(0.62 var(--fc) var(--fh));
    color: oklch(0.99 0.01 var(--fh));
    box-shadow: inset 0 1px 0 oklch(1 0 0 / 0.18);
    font-family: var(--font-sans);
    font-weight: var(--weight-bold);
    font-size: calc(var(--fz) * 0.56);
    line-height: 1;
  }

  .icon {
    width: calc(var(--fz) * 0.62);
    height: calc(var(--fz) * 0.62);
    fill: currentColor;
  }
</style>
