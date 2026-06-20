<script lang="ts">
import Icon from '../ui/Icon.svelte';
import TabRow from '../ui/TabRow.svelte';
import { drag } from './drag.svelte';

// The floating clone that follows the cursor during a drag. Rendered at the App
// root (outside the transformed carousel slides) so its `position: fixed` is
// relative to the viewport and never clipped by a slide's transform/overflow.
// A tab/folder drag clones the `TabRow`; a Space-switcher chip drag clones the
// chip tile (driven by the dragged Space's own hue), so the clone always reads
// as the thing being picked up.
</script>

{#if drag.state.active && drag.state.data}
  {@const data = drag.state.data}
  {@const isFavicon = data.zone === 'favicon'}
  {@const overPinned = drag.state.targetZone?.startsWith('pinned:') ?? false}
  {@const overFavicon = drag.state.targetZone === 'favicon'}
  {@const asFaviconClone = isFavicon || overFavicon}
  <div
    class="drag-clone"
    data-clone={data.chip ? 'chip' : asFaviconClone ? 'favicon' : 'row'}
    data-testid="drag-clone"
    style:left={`${drag.state.x - drag.state.grabDX}px`}
    style:top={`${drag.state.y - drag.state.grabDY}px`}
    style:width={data.chip ? `${drag.state.w}px` : null}
    style:height={data.chip ? `${drag.state.h}px` : null}
  >
    {#if data.chip}
      <span
        class="tile"
        style:--space-h={String(data.chip.hue)}
        style:--space-chroma={String(data.chip.chroma)}
        style:--space-l={String(data.chip.l)}
        style:--space-on={data.chip.on}
      >
        <Icon name={data.chip.icon} size={12} />
      </span>
    {:else if asFaviconClone}
      <!-- Clone MORPHS between a 28px square (over the favicon strip — what a
           favorite IS) and a TabRow silhouette (over a Space's pinned list — what
           it becomes when coupled), so the gesture previews its outcome in BOTH
           directions: a favicon-sourced clone expands to a row as it crosses into
           the pinned list (couple); a pinned/temp-sourced clone collapses to the
           square as it crosses into the shelf (decouple). Width / radius /
           title-reveal tween; transform-only otherwise. -->
      <div class="fav-clone" class:expanded={isFavicon && overPinned}>
        <span class="fav-favicon">
          {#if data.faviconSrc}
            <img class="fav-img" src={data.faviconSrc} alt="" width="16" height="16" />
          {:else}
            <Icon name="globe" size={16} />
          {/if}
        </span>
        <span class="fav-title">{data.title}</span>
      </div>
    {:else}
      <TabRow title={data.title} faviconSrc={data.faviconSrc} />
    {/if}
  </div>
{/if}

<style>
  .drag-clone {
    position: fixed;
    z-index: var(--z-overlay);
    pointer-events: none;
    box-shadow: var(--shadow-pop);
    opacity: 0.92;
    /* A touch of lift so it reads as "picked up". */
    transform: scale(1.02);
  }
  .drag-clone[data-clone='row'] {
    border-radius: var(--r-md);
    background: var(--surface-2);
  }
  /* Favicon clone: width unset so the morphing `.fav-clone` sizes itself, plus a
   * Space-hue halo so the picked-up favorite reads as "lifted". */
  .drag-clone[data-clone='favicon'] {
    border-radius: var(--r-md);
    box-shadow: var(--shadow-pop), var(--glow-space);
  }

  .fav-clone {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    width: var(--icon-btn);
    height: var(--icon-btn);
    padding: 0;
    box-sizing: border-box;
    overflow: hidden;
    border-radius: var(--r-md);
    background: var(--glass-bg-strong);
    color: var(--text);
    /* Morph: width + radius glide on the base curve so the square ↔ row change
     * reads as one continuous shape, not a swap. */
    transition:
      width var(--motion-base) var(--ease-emphasised),
      padding var(--motion-base) var(--ease-emphasised),
      border-radius var(--motion-base) var(--ease-emphasised);
  }
  .fav-clone.expanded {
    width: 220px;
    padding: 0 var(--space-3);
    border-radius: var(--r-md);
  }

  .fav-favicon {
    flex: 0 0 auto;
    width: var(--favicon-size);
    height: var(--favicon-size);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto;
    color: var(--text-muted);
  }
  .fav-clone.expanded .fav-favicon {
    margin: 0;
  }
  .fav-img {
    width: var(--favicon-size);
    height: var(--favicon-size);
    border-radius: var(--r-2xs);
    object-fit: contain;
  }

  /* The title is hidden in the square form and fades in as the clone expands into
   * a row silhouette. */
  .fav-title {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    opacity: 0;
    font: var(--weight-regular) var(--text-base) / 1 var(--font-sans);
    transition: opacity var(--motion-base) var(--ease-standard);
  }
  .fav-clone.expanded .fav-title {
    opacity: 1;
  }

  @media (prefers-reduced-motion: reduce) {
    .fav-clone,
    .fav-title {
      transition: none;
    }
  }
  /* Chip clone: a centred Space tile (matches SpaceSwitcher's `.tile` recipe), the
   * floating equivalent of the 32px chip, coloured by the dragged Space's hue. */
  .drag-clone[data-clone='chip'] {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--r-md);
  }
  .tile {
    width: 20px;
    height: 20px;
    border-radius: var(--r-sm);
    background: oklch(var(--space-l, 0.62) var(--space-chroma, 0.15) var(--space-h));
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--space-on);
    flex: 0 0 20px;
  }
</style>
