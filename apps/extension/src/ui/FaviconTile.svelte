<script lang="ts">
import Favicon from './Favicon.svelte';
import Icon from './Icon.svelte';
import Tooltip from './Tooltip.svelte';

/**
 * Global-favorite tile — a **plated** icon tile: a soft rounded-square plate
 * (`--favicon-tile`, `--surface`, `--r-lg`) holding a centred `--favicon-img` favicon,
 * laid out in the favicon-row GRID (Arc-style, sidebar-favicon-row redesign). The
 * favicon-row counterpart of `TabRow`, sharing its state primitives so a favorite and a
 * pinned tab speak one visual language (D5): the `--space-c` drift dot ringed in `--bg`,
 * the `--space-c` `loader-circle` spinner, the `--text-muted` globe fallback, the
 * Space-hue focus ring, and the `--press-scale` squish.
 *
 * `active` (the bound tab is focused) uses the SAME selection treatment as `TabRow`'s
 * active row — the plate fills with `--space-c-soft` — so a selected favorite reads
 * identically to a selected tab (TabRow's *leading* accent bar is withheld — D5 — no
 * analog on a centred square plate). Hover lifts the plate to `--hover` + a 1px raise;
 * `unbound` (dormant) dims the favicon. All feedback is `transform` / `opacity` /
 * `box-shadow` / `background` — no `backdrop-filter` on the tile (compositor cost).
 */
interface Props {
  /** The favorite's title — reachable on hover (tooltip), never rendered inline. */
  title: string;
  /** Primary favicon URL (e.g. from `faviconFor`). Forwarded to the composed
   * `Favicon`, which retries `faviconFallbackSrc` then a globe on load error. */
  faviconSrc?: string | undefined;
  /** Fallback favicon URL — the Chrome `_favicon` endpoint (`faviconUrl`) — tried
   * by the composed `Favicon` when `faviconSrc` fails to load (staged fallback). */
  faviconFallbackSrc?: string | undefined;
  /** Active treatment: this favorite's bound tab is the focused tab in this window. */
  active?: boolean | undefined;
  /** Loading treatment: the favicon slot becomes the shared spinner. */
  loading?: boolean | undefined;
  /** Drift treatment: a Space-coloured corner dot — the bound tab wandered off home.
   * A drifted tile also turns its favicon into a one-click "return home" affordance
   * on hover (see `onGoHome` / `homeHost`); the corner dot stays as the at-rest
   * signal (a square tile has no room for a subtitle — D4). */
  drifted?: boolean | undefined;
  /** One-click "return home" for a drifted tile — fired by a LEFT-CLICK on the tile
   * while drifted. When absent, or the tile is not drifted, the click falls through
   * to `onclick` (focus the favorite's tab). */
  onGoHome?: (() => void) | undefined;
  /** Home hostname (`hostOf(originalURL)`, e.g. `figma.com`) shown in the drift
   * "Return to <host>" tooltip + accessible name. An empty/absent host suppresses
   * the return affordance even while drifted (the corner dot still renders). */
  homeHost?: string | undefined;
  /** Dormant: no live tab in this window. Dims the favicon; suppresses drift/active. */
  unbound?: boolean | undefined;
  /** One-shot `favoriting-pulse` entrance (a tile that just became a favorite). */
  favoriting?: boolean | undefined;
  /** Roving-tabindex value, set by the composing strip (`0` for the roving tile,
   * `-1` for the rest). Omitted → the tile keeps natural tab order. */
  tabindex?: number | undefined;
  /** Whole-tile click — opens / focuses the favorite's bound tab. */
  onclick?: (() => void) | undefined;
  /** Right-click handler — the composing feature (FaviconRow) opens the favorite
   * actions menu at the cursor. When provided, the native browser menu is suppressed. */
  oncontextmenu?: ((e: MouseEvent) => void) | undefined;
}

const {
  title,
  faviconSrc,
  faviconFallbackSrc,
  active = false,
  loading = false,
  drifted = false,
  onGoHome,
  homeHost,
  unbound = false,
  favoriting = false,
  tabindex,
  onclick,
  oncontextmenu,
}: Props = $props();

// Right-click → let the feature open the favorite-actions menu at the cursor, and
// suppress the native browser menu (only when a handler is wired).
function onContextMenu(e: MouseEvent): void {
  if (!oncontextmenu) return;
  e.preventDefault();
  oncontextmenu(e);
}

// Favicon image / glyph pixel size — kept in sync with the `--favicon-img` token
// (the tile box itself sizes from `--favicon-tile` in CSS).
const FAVICON_PX = 24;

// A dormant favorite has no live tab, so it can neither be active nor drift —
// guard here too (the row already withholds them), per the spec scenario.
const isActive = $derived(active && !unbound);
const isDrift = $derived(drifted && !unbound);
// "Returnable" — the favicon becomes a one-click return-home control — needs a
// resolvable home host on top of drift; without it the tile keeps its dot but the
// click stays focus (a weird URL degrades, never breaks — Risks: odd URLs).
const returnable = $derived(isDrift && !!homeHost);
</script>

<Tooltip label={returnable ? `Return to ${homeHost}` : title} side="bottom">
  {#snippet children(props)}
    <button
      {...props}
      type="button"
      class="favicon-tile"
      class:active={isActive}
      class:loading
      class:unbound
      class:favoriting
      class:returnable
      data-testid="favicon-tile"
      data-active={isActive}
      aria-label={returnable ? `Return to ${homeHost}` : title}
      {tabindex}
      onclick={() => (returnable ? onGoHome?.() : onclick?.())}
      oncontextmenu={onContextMenu}
    >
      <span class="favicon">
        {#if loading}
          <span class="spin"><Icon name="loader-circle" size={FAVICON_PX} /></span>
        {:else}
          <Favicon src={faviconSrc} fallbackSrc={faviconFallbackSrc} size={FAVICON_PX} />
        {/if}
        {#if isDrift}
          <span class="drift-dot" data-testid="drift-dot" aria-label="Off home"></span>
        {/if}
      </span>
      <!-- Drifted tile: hover/focus cross-fades the favicon → a Space-hued ↩ return
           glyph. The dot stays as the at-rest signal; this is the one-click return. -->
      {#if returnable}
        <span class="return-glyph" data-testid="favicon-return" aria-hidden="true">
          <Icon name="corner-up-left" size={20} />
        </span>
      {/if}
    </button>
  {/snippet}
</Tooltip>

<style>
  /* A soft rounded-square PLATE (like an app-icon tile): a `--surface` fill a touch
   * lighter than the sidebar bg reads as a quiet plate with no border. Flat at rest
   * (the grid of plates stays calm); hover lifts it (`--hover` + a 1px raise + a small
   * contact shadow); active fills it with the Space-wash (`TabRow`'s selection colour);
   * press squishes. `box-shadow` is fine here — the plate is a real rectangle, so there
   * is no alpha-halo problem the bare icons had. NO backdrop-filter. */
  .favicon-tile {
    position: relative;
    width: var(--favicon-tile);
    height: var(--favicon-tile);
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    border: 0;
    background: var(--surface);
    border-radius: var(--r-lg);
    cursor: pointer;
    transition:
      transform var(--motion-fast) var(--ease-standard),
      background var(--motion-base) var(--ease-emphasised),
      box-shadow var(--motion-base) var(--ease-standard);
  }

  /* Hover — the plate lifts toward the light. */
  .favicon-tile:hover {
    background: var(--hover);
    box-shadow: var(--shadow-sm);
    transform: translateY(-1px);
  }

  /* Press — the plate squishes. */
  .favicon-tile:active {
    transform: scale(var(--press-scale));
  }

  .favicon-tile:focus-visible {
    outline: var(--focus-width) solid var(--focus-color);
    outline-offset: var(--focus-offset);
  }

  /* Active (bound tab focused) — the SAME selection treatment the tab rows use
   * (`TabRow.active`): the plate fills with the soft `--space-c-soft` Space-wash, so a
   * selected favorite reads identically to a selected tab. Stays lit even on hover. No
   * leading accent bar (D5 — no analog on a centred square plate). */
  .favicon-tile.active,
  .favicon-tile.active:hover {
    background: var(--space-c-soft);
  }

  .favicon {
    position: relative;
    flex: 0 0 auto;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--favicon-img);
    height: var(--favicon-img);
    color: var(--text-muted);
    transition: opacity var(--motion-fast) var(--ease-standard);
  }
  /* Dormant: dim the favicon — the primary "no live tab" signal, corroborated by the
   * absence of any drift/active treatment. */
  .favicon-tile.unbound .favicon {
    opacity: 0.45;
  }

  /* Drift indicator — TabRow's dot recipe, scaled up a touch for the larger tile:
   * a `--space-c` dot at the bottom-right, ringed in the sidebar background so it
   * reads over any favicon. Fades in over 150ms. */
  .drift-dot {
    position: absolute;
    right: -1px;
    bottom: -1px;
    width: 9px;
    height: 9px;
    border-radius: var(--r-pill);
    background: var(--space-c);
    box-shadow: 0 0 0 1.5px var(--bg);
    animation: favicon-tile-drift-in var(--motion-subtle) var(--ease-standard);
  }

  @keyframes favicon-tile-drift-in {
    from {
      opacity: 0;
      transform: scale(0.4);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  /* Return affordance — TabRow's recipe, tile-sized: a Space-hued ↩ overlaying the
   * favicon, revealed on hover/focus of a drifted tile as the favicon fades out. The
   * whole tile is the click target (left-click → onGoHome), so the glyph is purely a
   * visual swap (pointer-events off). */
  .return-glyph {
    position: absolute;
    inset: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--space-c);
    opacity: 0;
    pointer-events: none;
    transition: opacity var(--motion-fast) var(--ease-standard);
  }
  .favicon-tile.returnable:hover .favicon,
  .favicon-tile.returnable:focus-visible .favicon {
    opacity: 0;
  }
  .favicon-tile.returnable:hover .return-glyph,
  .favicon-tile.returnable:focus-visible .return-glyph {
    opacity: 1;
  }

  /* Loading — TabRow's verbatim spinner: 0.8s linear, `--space-c`. */
  .spin {
    display: inline-flex;
    animation: favicon-tile-spin 0.8s linear infinite;
    color: var(--space-c);
  }

  @keyframes favicon-tile-spin {
    to {
      transform: rotate(360deg);
    }
  }

  /* Favoriting entrance — a one-shot pop when a tile just became a favorite: scales
   * up from 0.4 and settles. */
  .favicon-tile.favoriting {
    animation: favicon-tile-favoriting var(--motion-slow) var(--ease-emphasised);
  }

  @keyframes favicon-tile-favoriting {
    0% {
      transform: scale(0.4);
    }
    60% {
      transform: scale(1.06);
    }
    100% {
      transform: scale(1);
    }
  }

  /* Reduced motion — every animated state drops to its pixel-identical END state:
   * the drift dot, the favoriting pop, and the hover lift settle instantly; only the
   * spinner keeps turning, slowed to 1.6s (matching TabRow) so "loading" stays
   * legible without a fast strobe. */
  @media (prefers-reduced-motion: reduce) {
    .drift-dot {
      animation: none;
    }
    .favicon-tile.favoriting {
      animation: none;
    }
    .favicon-tile:hover {
      transform: none;
    }
    /* Favicon → return-glyph swap is instant (no cross-fade) under reduced motion. */
    .favicon,
    .return-glyph {
      transition: none;
    }
    .spin {
      animation-duration: 1.6s;
    }
  }
</style>
