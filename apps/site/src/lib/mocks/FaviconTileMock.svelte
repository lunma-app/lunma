<script lang="ts">
import type { FaviconSpec } from './apps';
import Favicon from './Favicon.svelte';

// A favicon-row tile, mirroring the extension's borderless FaviconTile: a soft
// rounded --surface plate holding a larger favicon. `active` washes the plate in
// the Space colour (a selected favorite) — no border or glow, matching the real
// plate.
interface Props {
  fav: FaviconSpec;
  active?: boolean;
  /** Plate size in px. Defaults to the `--favicon-tile` token (44). */
  size?: number;
}

let { fav, active = false, size }: Props = $props();

const favPx = $derived(size ? Math.round(size * 0.55) : 24);
</script>

<div
  class="tile"
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
  }

  /* --space-c-soft is the active Space wash, supplied by the surrounding stage /
     chapter scope (falls back to the resting ember accent outside one). The plate
     stays borderless and glow-free, matching the extension's FaviconTile. */
  .tile.active {
    background: var(--space-c-soft, var(--accent-soft));
  }
</style>
