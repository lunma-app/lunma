<script lang="ts">
import type { FaviconSpec } from './apps';
import FaviconTileMock from './FaviconTileMock.svelte';

// A grid of favourite tiles, mirroring the extension's FaviconRow. With
// `columns` set it's a fixed N-up row (the sidebar / a Space panel); without it
// the tiles wrap and centre (the favourites feature hero). No selection state —
// favourites are shortcuts.
interface Props {
  items: FaviconSpec[];
  size?: number;
  /** Fixed column count; omit for a wrapping, centred grid. */
  columns?: number;
}

let { items, size = 44, columns }: Props = $props();
</script>

<div
  class="favgrid"
  data-fixed={columns ? 'true' : 'false'}
  style:--fg-size={`${size}px`}
  style:--fg-cols={columns ? String(columns) : null}
  aria-hidden="true"
>
  {#each items as fav, i (i)}
    <FaviconTileMock {fav} {size} />
  {/each}
</div>

<style>
  .favgrid {
    display: grid;
    gap: var(--space-2);
  }

  .favgrid[data-fixed='true'] {
    grid-template-columns: repeat(var(--fg-cols), var(--fg-size));
    justify-content: space-between;
  }

  .favgrid[data-fixed='false'] {
    grid-template-columns: repeat(auto-fit, var(--fg-size));
    gap: var(--space-3);
    justify-content: center;
    align-content: center;
    min-height: 132px;
  }
</style>
