<script lang="ts">
import Favicon from './Favicon.svelte';

/**
 * Thin harness over `Favicon` — forwards the primitive's public props verbatim so
 * tests can `rerender` to drive a live `src` change. Favicon renders two `<img>`s:
 * the PAINTED image `img.favicon-img` (present only once a source has loaded) and
 * the hidden, zero-box PRELOADER `img.favicon-preload` (keyed by the candidate).
 * Tests drive the swap by firing `load`/`error` on `img.favicon-preload`.
 */
interface Props {
  src?: string;
  fallbackSrc?: string;
  size?: number;
  alt?: string;
}

const { src, fallbackSrc, size = 16, alt }: Props = $props();
</script>

<Favicon {src} {fallbackSrc} {size} {alt} />
