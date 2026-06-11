<script lang="ts">
import type { FaviconSpec } from './apps';
import Favicon from './Favicon.svelte';

// A favicon-row tile, mirroring the extension's FaviconTile: a soft rounded
// plate holding a larger favicon. `live` rings it in the active Space's hue;
// `active` washes the plate in the Space colour (a selected favorite).
interface Props {
  fav: FaviconSpec;
  live?: boolean;
  active?: boolean;
  /** Plate size in px. Defaults to the `--favicon-tile` token (44). */
  size?: number;
}

let { fav, live = false, active = false, size }: Props = $props();

const favPx = $derived(size ? Math.round(size * 0.55) : 24);
</script>

<div
  class="tile"
  class:live
  class:active
  style:--tile-size={size ? `${size}px` : 'var(--favicon-tile)'}
  aria-hidden="true"
>
  <Favicon {fav} size={favPx} />
</div>

<style>
  .tile {
    display: grid;
    place-items: center;
    width: var(--tile-size);
    height: var(--tile-size);
    border-radius: var(--r-lg);
    background: var(--surface);
    border: 1px solid var(--border-soft);
    transition:
      border-color var(--motion-base) var(--ease-emphasised),
      box-shadow var(--motion-base) var(--ease-emphasised);
  }

  /* --space-c is the active Space colour, supplied by the surrounding stage /
     chapter scope (falls back to the resting ember accent outside one). */
  .tile.live {
    border-color: var(--space-c, var(--accent));
  }

  .tile.active {
    background: var(--space-c-soft, var(--accent-soft));
    border-color: var(--space-c, var(--accent));
    box-shadow: var(--glow-space-soft);
  }
</style>
