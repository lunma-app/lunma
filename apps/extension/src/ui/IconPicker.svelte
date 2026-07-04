<script lang="ts" module>
/** Columns in the grid — also the keyboard up/down stride (comp §8: 7 across). */
const COLS = 7;
/** Max search matches rendered at once (each tile lazy-loads its SVG). */
const SEARCH_CAP = 48;
</script>

<script lang="ts">
import { ICON_NAMES, type IconName } from '../shared/icon-names';
import Icon from './Icon.svelte';
import { scrollFade } from './scroll-fade';
import { SPACE_ICONS } from './space-icons';

interface Props {
  /** Currently-selected icon — a plain icon-name string (the stored value may
   * predate / fall outside the curated catalogue; it simply highlights no tile
   * when it isn't a catalogue member). The picker only ever EMITS catalogue
   * icons, so `onselect` stays `IconName`. */
  value: string;
  /** Fired with the chosen icon on click / keyboard activation. */
  onselect: (icon: IconName) => void;
}

const { value, onselect }: Props = $props();

// Full catalogue, curated defaults FIRST, then everything else — so the empty
// grid shows the whole icon set (browsable by scroll) instead of a short list,
// while still leading with the sensible Space defaults. Computed once.
const REST: readonly IconName[] = ICON_NAMES.filter(
  (name) => !SPACE_ICONS.includes(name),
);
const FULL_CATALOGUE: readonly IconName[] = [...SPACE_ICONS, ...REST];

let query = $state('');

// The visible icons: the full catalogue when the search box is empty, otherwise
// a capped substring match over it.
const icons = $derived.by<readonly IconName[]>(() => {
  const q = query.trim().toLowerCase();
  if (q === '') return FULL_CATALOGUE;
  const matches: IconName[] = [];
  for (const name of ICON_NAMES) {
    if (name.includes(q)) {
      matches.push(name);
      if (matches.length >= SEARCH_CAP) break;
    }
  }
  return matches;
});
const truncated = $derived(query.trim() !== '' && icons.length >= SEARCH_CAP);

// Result-state message, mirrored into a persistent polite live region so screen
// readers hear when the search empties or is capped as the user types — the
// visible `.empty`/`.more` text alone is not announced (ICONPICKER-NEW1).
const statusMessage = $derived(
  icons.length === 0
    ? `No icons match “${query.trim()}”.`
    : truncated
      ? `Showing the first ${SEARCH_CAP} — keep typing to narrow.`
      : '',
);

let gridEl = $state<HTMLElement>();

// Lazy SVG loading: the full catalogue is ~400 tiles, and each <Icon> dynamically
// imports its own lucide chunk on mount — mounting all of them at once would fire
// hundreds of imports and jank the open. So every tile renders as a cheap button
// immediately (keyboard nav + scroll work over the whole list), but its glyph is
// only mounted once the tile scrolls within ~200px of the viewport. `revealed`
// tracks which icons have crossed that threshold (they stay revealed — the Icon
// cache makes re-mounts free).
let revealed = $state<Set<string>>(new Set());

$effect(() => {
  // Re-runs when the list changes (search) or the grid mounts, (re)observing the
  // current tiles. Where IntersectionObserver is unavailable (headless tests),
  // fall back to revealing nothing — tiles still render as buttons, which is all
  // the DOM-level tests assert; no glyph imports fire, keeping the suite fast.
  const grid = gridEl;
  // Read `icons` so the effect re-runs (and re-observes) when the list changes.
  const list = icons;
  if (!grid || list.length === 0 || typeof IntersectionObserver === 'undefined') return;
  const obs = new IntersectionObserver(
    (entries) => {
      let changed = false;
      const next = new Set(revealed);
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const name = (entry.target as HTMLElement).dataset.icon;
        if (name && !next.has(name)) {
          next.add(name);
          changed = true;
        }
        obs.unobserve(entry.target);
      }
      if (changed) revealed = next;
    },
    { root: grid, rootMargin: '200px 0px' },
  );
  for (const tile of grid.querySelectorAll<HTMLElement>('[data-testid="icon-tile"]')) {
    obs.observe(tile);
  }
  return () => obs.disconnect();
});

// Roving-tabindex focus position over the *current* `icons` list. Re-anchors to
// the selected tile (or the first tile) whenever the list changes, so a search
// never leaves focus past the end.
let focusedIndex = $state(0);
$effect(() => {
  const sel = icons.findIndex((i) => i === value);
  focusedIndex = sel >= 0 ? sel : 0;
});

function focusTile(index: number): void {
  const clamped = Math.max(0, Math.min(icons.length - 1, index));
  focusedIndex = clamped;
  const tiles = gridEl?.querySelectorAll<HTMLButtonElement>('[data-testid="icon-tile"]');
  tiles?.[clamped]?.focus();
}

function onKeydown(event: KeyboardEvent): void {
  switch (event.key) {
    case 'ArrowRight':
      event.preventDefault();
      focusTile(focusedIndex + 1);
      break;
    case 'ArrowLeft':
      event.preventDefault();
      focusTile(focusedIndex - 1);
      break;
    case 'ArrowDown':
      event.preventDefault();
      focusTile(focusedIndex + COLS);
      break;
    case 'ArrowUp':
      event.preventDefault();
      focusTile(focusedIndex - COLS);
      break;
    case 'Home':
      event.preventDefault();
      focusTile(0);
      break;
    case 'End':
      event.preventDefault();
      focusTile(icons.length - 1);
      break;
    case 'Enter':
    case ' ': {
      event.preventDefault();
      const icon = icons[focusedIndex];
      if (icon) onselect(icon);
      break;
    }
  }
}

function choose(icon: IconName, index: number): void {
  focusedIndex = index;
  onselect(icon);
}
</script>

<div class="picker">
  <!-- Comp §8: a recessed search field with a leading magnifier glyph, distinct
       from the standard labelled `TextInput` (smaller text, icon prefix). -->
  <div class="search">
    <span class="search-icon" aria-hidden="true"><Icon name="search" size={14} /></span>
    <input
      class="search-input"
      type="text"
      bind:value={query}
      placeholder="Search icons…"
      aria-label="Search icons"
      data-testid="icon-search"
    />
  </div>

  <!-- Persistent polite live region (always in the DOM) carrying the current
       result-state message, so empties/caps are announced as the query changes;
       the visible copies below are aria-hidden to avoid a double read. -->
  <p class="sr-only" role="status" data-testid="icon-status">{statusMessage}</p>

  {#if icons.length === 0}
    <p class="empty" aria-hidden="true">No icons match “{query.trim()}”.</p>
  {:else}
    <!-- Roving tabindex: focus lives on the radio tiles; the group itself is
         removed from the tab order with tabindex=-1. -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      bind:this={gridEl}
      class="grid"
      role="radiogroup"
      aria-label="Space icon"
      tabindex={-1}
      style:--cols={String(COLS)}
      onkeydown={onKeydown}
      use:scrollFade
    >
      {#each icons as icon, index (icon)}
        {@const isSelected = icon === value}
        <button
          type="button"
          class="tile"
          class:selected={isSelected}
          role="radio"
          aria-checked={isSelected}
          aria-label={icon}
          data-testid="icon-tile"
          data-icon={icon}
          data-selected={isSelected ? 'true' : 'false'}
          tabindex={index === focusedIndex ? 0 : -1}
          onclick={() => choose(icon, index)}
        >
          <!-- Glyph mounts when the tile is revealed (scrolled near view) — the
               selected icon always shows so the current choice is never blank. -->
          {#if revealed.has(icon) || isSelected}
            <Icon name={icon} size={18} />
          {/if}
        </button>
      {/each}
    </div>
    {#if truncated}
      <p class="more" aria-hidden="true">Showing the first {SEARCH_CAP} — keep typing to narrow.</p>
    {/if}
  {/if}
</div>

<style>
  .picker {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  /* Comp §8 search field: recessed --input fill, hairline border, leading
   * magnifier, compact 12.5px text. Focus glides an accent halo in (mirrors
   * TextInput's treatment) so it reads as part of the same family. */
  .search {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    /* Comp §8: 36px — consistent with the sheet's other form fields. */
    height: var(--control-h-md);
    padding: 0 var(--space-3);
    border: 1px solid var(--border);
    border-radius: var(--r-md);
    background: var(--bg);
    transition:
      border-color var(--motion-base) var(--ease-standard),
      box-shadow var(--motion-base) var(--ease-standard),
      background var(--motion-base) var(--ease-standard);
  }
  .search:focus-within {
    border-color: oklch(from var(--accent) l c h / 0.55);
    box-shadow: 0 0 0 3px var(--accent-soft);
    background: var(--bg-elev);
  }
  .search-icon {
    display: inline-flex;
    flex-shrink: 0;
    color: var(--text-faint);
  }
  .search-input {
    appearance: none;
    flex: 1;
    min-width: 0;
    border: 0;
    background: none;
    outline: none;
    color: var(--text);
    font: var(--weight-medium) var(--text-sm) / 1 var(--font-sans);
  }
  .search-input::placeholder {
    color: var(--text-faint);
  }

  /* Comp §8: FIXED 40px tiles (not fluid) that left-pack and wrap, so the grid
   * matches the comp at any panel width instead of ballooning on a wide side
   * panel. `minmax(0, 40px)` caps each of the COLS columns at 40px yet lets them
   * shrink on a very narrow panel rather than overflow; `justify-content: start`
   * packs them left, leaving trailing space like the comp's flex-wrap. Caps to
   * ~5 rows and scrolls so a wide search result stays compact. */
  .grid {
    display: grid;
    grid-template-columns: repeat(var(--cols), minmax(0, 40px));
    justify-content: start;
    gap: var(--space-2);
    max-height: 216px;
    overflow-y: auto;
    overscroll-behavior: contain;
  }

  .tile {
    appearance: none;
    margin: 0;
    padding: 0;
    width: 100%;
    aspect-ratio: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    /* Comp §8: every tile carries a hairline border (not just the selected one),
       11px radius. */
    border: 1px solid var(--border-soft);
    border-radius: var(--r-lg);
    background: transparent;
    color: var(--text-muted);
    cursor: pointer;
    transition:
      background var(--motion-fast) var(--ease-standard),
      color var(--motion-fast) var(--ease-standard),
      transform var(--motion-fast) var(--ease-standard);
  }

  .tile:hover {
    background: var(--hover);
    color: var(--text);
  }
  .tile:active {
    transform: scale(var(--press-scale));
  }
  .tile:focus-visible {
    outline: var(--focus-width) solid var(--focus-color);
    outline-offset: var(--focus-offset);
  }

  /* Selection reads as a soft accent fill with a tinted glyph — no hard
   * outline. Cleaner and more "premium" than a 1px ring. */
  .tile.selected {
    background: oklch(from var(--accent) l c h / 0.16);
    /* Accent glyph on a soft accent WASH (a plain surface, not a solid accent
       fill), so `--accent-label` — the AA-tuned accent-on-surface token — not the
       frozen `--accent-text`/`--accent` fill hue. */
    color: var(--accent-label);
    border-color: oklch(from var(--accent) l c h / 0.5);
  }
  .tile.selected:hover {
    background: oklch(from var(--accent) l c h / 0.24);
    color: var(--accent-label);
  }

  .empty,
  .more {
    margin: 0;
    padding: var(--space-1) 0;
    font: var(--weight-medium) var(--text-xs) / 1.3 var(--font-sans);
    color: var(--text-faint);
  }

  /* Visually hidden, still in the accessibility tree (the result-state live region). */
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
