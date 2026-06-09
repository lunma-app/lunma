<script lang="ts">
import type { FaviconSpec } from './apps';

// A favicon stand-in: a brand-coloured rounded plate with the app initial.
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
  aria-hidden="true">{fav.letter}</span
>

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
</style>
