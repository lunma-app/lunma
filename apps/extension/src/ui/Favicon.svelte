<script lang="ts">
import Icon from './Icon.svelte';

/**
 * Shared favicon slot — renders a square favicon image with a STAGED fallback,
 * so the favicon-bearing primitives (`FaviconTile`, `TabRow`, `ResultRow`) compose
 * it instead of re-rolling the `<img>` + load-error + globe machine.
 *
 * Stage machine (`candidate`): `primary` (`src`) → `fallback` (`fallbackSrc`) →
 * `globe`.
 * - Begins at the first non-empty of `src`, then `fallbackSrc`, else the globe.
 * - On a load error at `primary`, advances to `fallback` ONLY when `fallbackSrc`
 *   is non-empty and differs from `src` (no point retrying an identical URL);
 *   otherwise the globe.
 * - On a load error at `fallback`, the globe.
 * - A change to `src`/`fallbackSrc` resets the error flags, so a recycled
 *   instance re-tries from the primary.
 *
 * **Preload-then-swap (no flicker on a live update).** The painted source
 * (`displayedSrc`) is kept distinct from the `candidate` being loaded. A hidden,
 * zero-box preloader `<img>` carries the load: only when the candidate has loaded
 * does it promote to `displayedSrc` and swap in place. So a page that re-badges
 * its favicon at runtime (e.g. WhatsApp's unread-count badge written to
 * `<link rel="icon">`) updates without the slot blanking or the globe flashing —
 * the current icon holds until the new one is ready. A FAILED later update never
 * regresses a shown icon: the globe terminal applies only when nothing has ever
 * displayed (`displayedSrc === undefined`). Keying the preloader by `candidate`
 * mounts a fresh element per candidate, so a superseded candidate's `onload`
 * never fires — last-write-wins without a generation token. The globe glyph
 * renders ONLY at the terminal stage with nothing displayed (no globe-then-icon
 * flash); its colour inherits `currentColor` from the composing slot.
 */
interface Props {
  /** The primary favicon URL (e.g. from `faviconFor`). */
  src?: string | undefined;
  /** A retry URL — the Chrome `_favicon` page-URL endpoint (`faviconUrl`). */
  fallbackSrc?: string | undefined;
  /** Square pixel size of both the image and the globe glyph. */
  size: number;
  /** Image alt text (default empty — the favicon is decorative beside a title). */
  alt?: string | undefined;
}

const { src, fallbackSrc, size, alt = '' }: Props = $props();

type Stage = 'primary' | 'fallback' | 'globe';

// Per-source load-error flags (mirrors the reset idiom the favicon primitives
// already use). The stage is DERIVED from them, not stored, so the initial
// render is always correct and the globe can never flash before a source is
// attempted.
let primaryFailed = $state(false);
let fallbackFailed = $state(false);

// The source currently PAINTED. Distinct from the `candidate` being loaded: it
// is promoted only when a preload succeeds, so a live `src` change holds the
// current icon until the replacement is ready (preload-then-swap).
let displayedSrc = $state<string | undefined>(undefined);

// The hidden preloader element, bound so the effect below can read its load
// state (the `onload` event alone is not enough — see the effect).
let preloadEl = $state<HTMLImageElement>();

// Reset the error flags whenever either source changes so a recycled instance
// re-tries from the primary. `displayedSrc` is deliberately NOT reset here —
// that is what holds the current icon across a live update until the new source
// has loaded. Reading both props here tracks them; the flags are written, not
// read, so this never loops with the onerror advance below.
$effect(() => {
  src;
  fallbackSrc;
  primaryFailed = false;
  fallbackFailed = false;
});

const hasPrimary = $derived(src !== undefined && src !== '');
// A fallback worth attempting: non-empty AND distinct from `src` (don't retry an
// identical URL). When `src` is empty this still holds for any non-empty fallback.
const hasDistinctFallback = $derived(
  fallbackSrc !== undefined && fallbackSrc !== '' && fallbackSrc !== src,
);

const stage = $derived.by<Stage>(() => {
  if (hasPrimary && !primaryFailed) return 'primary';
  if (hasDistinctFallback && !fallbackFailed) return 'fallback';
  return 'globe';
});

// The source we are currently trying to load (primary → distinct fallback →
// none). `undefined` means the staged resolution is exhausted — the globe
// terminal (rendered only when nothing has ever displayed).
const candidate = $derived(
  stage === 'primary' ? src : stage === 'fallback' ? fallbackSrc : undefined,
);

// Preload resolved → promote the now-ready source to the painted one (the swap).
function onPreloadLoad(): void {
  displayedSrc = candidate;
}

// Real-browser safety net for the swap. The preloader normally promotes via its
// `onload` below, but an already-decoded source — a `data:` favicon (e.g. a
// canvas-rendered live badge) or a cached image — can finish loading BEFORE
// Svelte attaches `onload`, so the event is missed and `displayedSrc` would stay
// stranded on the previous icon (the live badge appears to lag by one). After
// each `candidate` (re)mounts the preloader, also promote synchronously when the
// element reports it has already loaded (`complete` + a non-zero `naturalWidth`,
// which distinguishes a decoded image from a broken/empty one). Errors stay on
// the `onerror` event. jsdom never decodes, so `naturalWidth` is 0 here and this
// is a no-op — tests still drive the swap via `fireEvent.load`/`fireEvent.error`.
$effect(() => {
  candidate; // re-run whenever the staged candidate (re)mounts the preloader
  const el = preloadEl;
  // `bind:this` is null while no preloader is mounted (candidate exhausted).
  if (el?.complete && el.naturalWidth > 0) onPreloadLoad();
});

// Preload failed → advance the active stage's error flag so `candidate`
// recomputes (primary→fallback→globe). `displayedSrc` is LEFT untouched, so a
// failed live update keeps the current icon rather than regressing to the globe.
function onPreloadError(): void {
  if (stage === 'primary') primaryFailed = true;
  else if (stage === 'fallback') fallbackFailed = true;
}
</script>

{#if displayedSrc !== undefined}
  <img
    class="favicon-img"
    src={displayedSrc}
    {alt}
    width={size}
    height={size}
    draggable="false"
    style:--favicon-px={`${size}px`}
  />
{:else if candidate === undefined}
  <Icon name="globe" {size} />
{:else}
  <!-- Empty sized box while the FIRST source preloads — never a visible image
       with no/failed source, never a broken-image glyph; promoting the first
       icon then never shifts layout. -->
  <span class="favicon-box" style:--favicon-px={`${size}px`} aria-hidden="true"></span>
{/if}

<!-- Hidden in-DOM preloader: keyed by `candidate` so each candidate gets a fresh
     element (last-write-wins — a superseded candidate's handlers never fire). It
     must still LOAD its src, so it is layout-zeroed + aria-hidden rather than
     removed from the box model; this sits outside the token contract by design. -->
{#key candidate}
  {#if candidate !== undefined}
    <img
      bind:this={preloadEl}
      class="favicon-preload"
      src={candidate}
      alt=""
      aria-hidden="true"
      onload={onPreloadLoad}
      onerror={onPreloadError}
    />
  {/if}
{/key}

<style>
  .favicon-img {
    width: var(--favicon-px);
    height: var(--favicon-px);
    border-radius: var(--r-xs);
    object-fit: contain;
  }
  /* Reserve the square while the first source preloads (before any image has
   * displayed), so promoting the first icon never shifts layout. */
  .favicon-box {
    display: inline-block;
    width: var(--favicon-px);
    height: var(--favicon-px);
  }
  /* The preloader must keep loading its `src`, so it is LAYOUT-ZEROED (not
   * display:none-d) and aria-hidden — raw zeroing values, not design tokens, by
   * design (it carries no visual styling, so it sits outside the token contract). */
  .favicon-preload {
    position: absolute;
    width: 0;
    height: 0;
    overflow: hidden;
  }
</style>
