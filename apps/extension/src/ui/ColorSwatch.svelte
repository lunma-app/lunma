<script lang="ts">
import { colourToOklch } from '../shared/space-hue';
import type { SpaceColor } from '../shared/types';

interface Props {
  /** The Space colour this swatch represents. */
  color: SpaceColor;
  /** Whether this swatch is the current selection. */
  selected?: boolean | undefined;
  /** Fired on click / keyboard activation. */
  onclick: () => void;
  /** Tabindex — the parent grid uses a roving tabindex. Default 0. */
  tabindex?: number | undefined;
}

const { color, selected = false, onclick, tabindex = 0 }: Props = $props();

// The swatch dot renders the colour's TRUE canonical OKLCH (yellow light, blue
// deep), so the picker is an honest preview of the Space identity. `gray` has
// chroma 0, so the general formula renders it neutral with no special case.
const ok = $derived(colourToOklch(color));
</script>

<button
  type="button"
  class="swatch"
  class:selected
  data-testid="color-swatch"
  data-color={color}
  data-selected={selected ? 'true' : 'false'}
  aria-pressed={selected}
  aria-label={color}
  {tabindex}
  style:--swatch-l={String(ok.l)}
  style:--swatch-c={String(ok.c)}
  style:--swatch-h={String(ok.h)}
  {onclick}
>
  <span class="dot"></span>
</button>

<style>
  /* Comp §8: a fixed 30px swatch (matches the dot) so the palette keeps its true
   * size and the selection ring isn't clipped. */
  .swatch {
    appearance: none;
    margin: 0;
    padding: 0;
    width: 30px;
    height: 30px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 0;
    border-radius: 9px;
    background: transparent;
    cursor: pointer;
    transition: transform var(--motion-fast) var(--ease-standard);
  }

  /* Comp (Sidebar Redesign §8): a 30px rounded-SQUARE filled with the colour's
   * true hue. Unselected swatches sit at scale .92; the selected one pops to full
   * size with a 2px gap + a 2px ring in a lightened cut of its own hue. */
  .dot {
    width: 30px;
    height: 30px;
    border-radius: 9px;
    background: oklch(var(--swatch-l) var(--swatch-c) var(--swatch-h));
    box-shadow: inset 0 0 0 1px oklch(0 0 0 / 0.18);
    transform: scale(0.92);
    transition:
      transform var(--motion-fast) var(--ease-standard),
      box-shadow var(--motion-fast) var(--ease-standard);
  }

  .swatch:active .dot {
    transform: scale(calc(0.92 * var(--press-scale)));
  }
  .swatch:focus-visible {
    outline: var(--focus-width) solid var(--focus-color);
    outline-offset: var(--focus-offset);
    border-radius: 9px;
  }

  .swatch.selected .dot {
    box-shadow:
      0 0 0 2px var(--bg-elev),
      0 0 0 4px oklch(calc(var(--swatch-l) + 0.04) var(--swatch-c) var(--swatch-h));
    transform: scale(1);
  }
</style>
