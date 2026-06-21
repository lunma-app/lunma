<script lang="ts" module>
/** Columns in the grid — also the keyboard up/down stride. */
const COLS = 8;
/** Max search matches rendered at once (each tile lazy-loads its SVG). */
const SEARCH_CAP = 48;
</script>

<script lang="ts">
import { ICON_NAMES, type IconName } from '../shared/icon-names';
import Icon from './Icon.svelte';
import { SPACE_ICONS } from './space-icons';
import TextInput from './TextInput.svelte';

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

let query = $state('');

// The visible icons: the curated shortlist when the search box is empty,
// otherwise a capped substring match over the full catalogue.
const icons = $derived.by<readonly IconName[]>(() => {
  const q = query.trim().toLowerCase();
  if (q === '') return SPACE_ICONS;
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

// Roving-tabindex focus position over the *current* `icons` list. Re-anchors to
// the selected tile (or the first tile) whenever the list changes, so a search
// never leaves focus past the end.
let focusedIndex = $state(0);
$effect(() => {
  const sel = icons.findIndex((i) => i === value);
  focusedIndex = sel >= 0 ? sel : 0;
});

let gridEl = $state<HTMLElement>();

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
  <TextInput
    bind:value={query}
    placeholder="Search all icons…"
    ariaLabel="Search icons"
    testid="icon-search"
  />

  {#if icons.length === 0}
    <p class="empty">No icons match “{query.trim()}”.</p>
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
          <Icon name={icon} size={18} />
        </button>
      {/each}
    </div>
    {#if truncated}
      <p class="more">Showing the first {SEARCH_CAP} — keep typing to narrow.</p>
    {/if}
  {/if}
</div>

<style>
  .picker {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  /* Full-width grid: COLS equal columns whose tiles flex to fill the panel.
   * Caps to ~5 rows and scrolls so a wide search result stays compact. */
  .grid {
    display: grid;
    grid-template-columns: repeat(var(--cols), 1fr);
    gap: var(--space-1);
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
    border: 1px solid transparent;
    border-radius: var(--r-md);
    background: transparent;
    color: var(--text-dim);
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
    background: oklch(from var(--accent) l c h / 0.22);
    color: var(--accent-text);
    border-color: transparent;
  }
  .tile.selected:hover {
    background: oklch(from var(--accent) l c h / 0.3);
    color: var(--accent-text);
  }

  .empty,
  .more {
    margin: 0;
    padding: var(--space-1) 0;
    font: var(--weight-medium) var(--text-xs) / 1.3 var(--font-sans);
    color: var(--text-faint);
  }
</style>
