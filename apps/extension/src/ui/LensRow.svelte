<script lang="ts">
import { colourToOklch } from '../shared/space-hue';
import type { SpaceColor } from '../shared/types';
import Icon from './Icon.svelte';
import IconButton from './IconButton.svelte';

/**
 * LensRow — the lens "folder" header in the sidebar. Forked from {@link FolderRow}.
 * Interaction model:
 *  - Clicking ANYWHERE on the row toggles expand/collapse (the leading glyph
 *    crossfades type-icon → chevron on hover; the chevron rotates with state).
 *  - A trailing icon, revealed on hover/focus, OPENS THE LENS OVERVIEW (the page).
 *  - Lens actions live in the right-click context menu (the row carries no kebab).
 * Hover and the active peek share the lens-hue wash (`--lens-fill`); only the
 * active peek adds the inset hue ring.
 */
interface Props {
  /** Lens name (the row label). */
  name: string;
  /** Lens glyph (a lucide icon name). */
  icon: string;
  /** Identity colour — tints the leading glyph. */
  color: SpaceColor;
  /** Whether this lens's overview is the active "peek" — applies the selected wash + ring. */
  active?: boolean | undefined;
  /** Whether the lens body is expanded (rotates the chevron 0°→90°). */
  expanded?: boolean | undefined;
  /** Toggle expand/collapse — fired by clicking the row. */
  onToggle?: (() => void) | undefined;
  /** Open the lens overview — fired by the trailing icon. */
  onOpenPage?: (() => void) | undefined;
  /** Accessible label for the open-overview icon. */
  openPageLabel?: string | undefined;
  /** Accessible-name override for the row/toggle (name-only, no visible text);
   * defaults to a name-derived label. (Renamed from `label` — see the `label` vs
   * `ariaLabel` convention in docs/architecture.md.) */
  ariaLabel?: string | undefined;
  /** Trailing count badge (quiet); absent → no badge. */
  badge?: string | undefined;
  /** Spins the glyph while an in-flight refresh runs (static under reduced motion). */
  busy?: boolean | undefined;
}

let {
  name,
  icon,
  color,
  active = false,
  expanded = false,
  onToggle,
  onOpenPage,
  openPageLabel = 'Open lens',
  ariaLabel,
  badge,
  busy = false,
}: Props = $props();

// The lens's own OKLCH (per-colour lightness/chroma/hue) tints the leading glyph.
const ok = $derived(colourToOklch(color));
// Active "peek" treatment mirrors the comp's ACTIVE_STYLE: a soft hue wash
// (--space-soft ≡ 0.16 alpha) + an inset hue ring (--space-line ≡ 0.5), derived here
// from the lens hue.
const fill = $derived(`oklch(${ok.l} ${ok.c} ${ok.h} / 0.16)`);
const ring = $derived(`oklch(${ok.l} ${ok.c} ${ok.h} / 0.5)`);

// Fold the trailing count into the toggle's accessible name so it isn't announced
// as a context-free bare number; the visible badge is then hidden from AT
// (LENSROW-NEW1).
const baseLabel = $derived(ariaLabel ?? (expanded ? `Collapse ${name}` : `Expand ${name}`));
const toggleLabel = $derived(badge !== undefined ? `${baseLabel}, ${badge}` : baseLabel);
</script>

<div
  class="lens-row"
  class:active
  data-testid="lens-row"
  aria-current={active ? 'true' : undefined}
  style:--lens-l={String(ok.l)}
  style:--lens-chroma={String(ok.c)}
  style:--lens-hue={String(ok.h)}
  style:--lens-fill={fill}
  style:--lens-ring={ring}
>
  <!-- The whole row is the expand/collapse toggle. Leading glyph: lens type icon at
       rest, crossfading to a chevron on hover/focus (the chevron rotates with state). -->
  <button
    type="button"
    class="toggle"
    aria-expanded={expanded}
    aria-label={toggleLabel}
    onclick={() => onToggle?.()}
  >
    <span class="tile" class:busy class:expanded aria-hidden="true">
      <span class="tile-mark"><Icon name={icon} size={16} /></span>
      <span class="tile-caret"><Icon name="chevron-right" size={16} /></span>
    </span>
    <span class="name">{name}</span>
  </button>

  <!-- Trailing: count badge at rest, an open-overview icon on hover/focus (one
       cell, so there is no layout shift). -->
  <span class="trailing">
    {#if badge !== undefined}
      <!-- The count is folded into the toggle's accessible name, so the visible
           badge is decorative for AT (avoids a context-free re-read). -->
      <span class="badge" data-testid="lens-row-badge" aria-hidden="true">{badge}</span>
    {/if}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <span class="open-page" onpointerdown={(e) => e.stopPropagation()}>
      <IconButton
        icon="app-window"
        ariaLabel={openPageLabel}
        title={openPageLabel}
        size={16}
        testid="lens-open-page"
        onclick={() => onOpenPage?.()}
      />
    </span>
  </span>

  <!-- Polite live region: the in-flight refresh spins a decorative (aria-hidden)
       glyph, so announce it here for AT. Empty when idle (LENSROW-02). -->
  <span class="sr-only" aria-live="polite" data-testid="lens-row-busy"
    >{busy ? `Refreshing ${name}…` : ''}</span
  >
</div>

<style>
  .lens-row {
    /* Leading-glyph lightness, derived from the raw inline `--lens-l` under a
       SEPARATE name (never `--lens-l: min(var(--lens-l), …)` — a custom-property
       self-reference cycle blanks the colour). Capped in light theme so a light
       Space hue clears the 4.5:1 glyph floor on the near-white surface; the dark
       glyph is untouched. The wash (`--lens-fill`/`--lens-ring`) keeps the raw hue. */
    --glyph-l: var(--lens-l);
    position: relative;
    display: flex;
    align-items: center;
    /* border-box so width:100% INCLUDES the right padding — otherwise the row
       overflows the list's right inset and reads wider than the rows below it. */
    box-sizing: border-box;
    width: 100%;
    height: var(--row-h);
    padding: 0 var(--space-2) 0 0;
    border-radius: var(--r-lg);
    color: var(--text-2);
    transition: background var(--motion-fast) var(--ease-standard);
  }
  :global([data-theme='light']) .lens-row {
    --glyph-l: min(var(--lens-l), 0.5);
  }
  /* Hover mirrors the selected wash (the same `--lens-fill`) but WITHOUT the inset
     ring — the ring is reserved for the active "peek". `.lens-row.active` below is
     equal specificity but later in source, so an active row keeps its ring while
     hovered. */
  .lens-row:hover {
    background: var(--lens-fill);
  }
  /* Active "peek": the selected hue wash + inset hue ring (the comp's ACTIVE_STYLE).
     More specific than :hover, so it holds while hovered too. */
  .lens-row.active {
    background: var(--lens-fill);
    box-shadow: inset 0 0 0 1px var(--lens-ring);
  }

  /* The toggle = leading glyph + name, filling the row up to the trailing slot.
     padding-left lands the 16px glyph under the Space header's glyph (centre ~28px)
     and the name under its label, so the row lines up with the header above. */
  .toggle {
    display: flex;
    align-items: center;
    flex: 1;
    min-width: 0;
    gap: var(--space-2);
    height: 100%;
    padding: 0 0 0 var(--space-3);
    background: none;
    border: none;
    cursor: pointer;
    color: inherit;
    font: inherit;
    text-align: left;
  }
  .toggle:focus-visible {
    outline: none;
  }
  .lens-row:has(.toggle:focus-visible) {
    outline: var(--focus-width) solid var(--focus-color);
    outline-offset: var(--focus-offset);
  }

  /* Leading glyph slot (16px): type icon at rest, chevron on hover/focus — a hard
     display swap so the name never shifts. The chevron rotates 0°→90° when open. */
  .tile {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--favicon-size);
    height: var(--favicon-size);
    color: oklch(var(--glyph-l) var(--lens-chroma) var(--lens-hue));
  }
  .tile-mark,
  .tile-caret {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  .tile-mark :global(svg),
  .tile-caret :global(svg) {
    width: 16px;
    height: 16px;
  }
  .tile-caret {
    display: none;
    transition: transform var(--motion-base) var(--ease-emphasised);
  }
  .lens-row:hover .tile-mark {
    display: none;
  }
  .lens-row:hover .tile-caret {
    display: inline-flex;
  }
  .tile.expanded .tile-caret {
    transform: rotate(90deg);
  }

  /* In-flight refresh spinner; spins the type-icon glyph only. */
  .tile.busy .tile-mark :global(svg) {
    animation: lens-row-busy 0.8s linear infinite;
  }
  @keyframes lens-row-busy {
    to {
      transform: rotate(360deg);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .tile-caret {
      transition: none;
    }
    .tile.busy .tile-mark :global(svg) {
      animation: none;
    }
    .tile.busy {
      color: var(--text-dim);
    }
  }

  .name {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    font: var(--weight-semibold) var(--text-base) / 1 var(--font-sans);
  }

  /* Trailing: count badge (rest) and the open-overview icon (hover/focus) share one
     right-aligned cell — no layout shift. */
  .trailing {
    flex-shrink: 0;
    display: inline-grid;
    align-items: center;
    justify-items: end;
    margin-left: var(--space-2);
  }
  .trailing > * {
    grid-area: 1 / 1;
  }
  /* Plain count (not a pill): a pill's side padding would inset the digits, so they
     couldn't share a right edge with the plain feed-section counts below. The
     `--space-1` margin lands the digits' right edge on the same `--space-3` (12px)
     trailing column as the feed counts + status dots. Brighter than the feed counts
     (`--text-2` vs `--text-dim`) to keep the lens's own total prominent. */
  .badge {
    margin-right: var(--space-1);
    color: var(--text-2);
    font: var(--weight-semibold) var(--text-xs) / 1 var(--font-sans);
    pointer-events: none;
    transition: opacity var(--motion-fast) var(--ease-standard);
  }
  .open-page {
    opacity: 0;
    /* Non-interactive while hidden, so clicks on the row's right edge toggle the
       row (the primary action) instead of hitting the invisible overview button. */
    pointer-events: none;
    transition: opacity var(--motion-fast) var(--ease-standard);
  }
  /* Crossfade: hover (or the open-overview button's own focus) hides the count and
     reveals the icon. */
  .lens-row:hover .badge,
  .lens-row:has(.open-page:focus-within) .badge {
    opacity: 0;
  }
  /* Reveal on hover, or when the open-overview button ITSELF is focused (so it stays
     Tab-reachable) — scoped to `.open-page`, NOT the row's `:focus-within`, so a
     click/focus on the row body never sticks the icon visible. */
  .lens-row:hover .open-page,
  .open-page:focus-within {
    opacity: 1;
    pointer-events: auto;
  }

  @media (prefers-reduced-motion: reduce) {
    .badge,
    .open-page {
      transition: none;
    }
  }

  /* Visually hidden, still in the accessibility tree (the busy live region). */
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
</style>
