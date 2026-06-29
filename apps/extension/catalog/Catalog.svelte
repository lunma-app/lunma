<script lang="ts">
import type { ThemeMode, Tint } from '@/shared/settings';
import { colourToOklch, colourToOn } from '@/shared/space-hue';
import { applyThemeToDocument } from '@/shared/surface-boot';
import type { SpaceColor } from '@/shared/types';
import Aurora from '@/ui/Aurora.svelte';
import ColorSwatch from '@/ui/ColorSwatch.svelte';
import IconButton from '@/ui/IconButton.svelte';
import RowButton from '@/ui/RowButton.svelte';
import SegmentedControl from '@/ui/SegmentedControl.svelte';
import { SPACE_COLORS } from './lib/mock';
import { buildGroups, type StoryEntry } from './lib/registry';

const groups = buildGroups();

// Default selection: the first story of the first group (if any).
let selected = $state<StoryEntry | undefined>(groups[0]?.stories[0]);

// Immersive controls. Space hue drives the scoped `--space-*` family (exactly as
// the new-tab home does); the colour-intensity tier drives `data-tint` + the
// `<Aurora intensity>`; reduced-motion sets `data-force-motion` (R1 — the freeze
// lives in catalog.css since Aurora can't be prop-overridden).
let color = $state<SpaceColor>('blue');
let tint = $state<Tint>('vivid');
let theme = $state<ThemeMode>('dark');
let forceReduced = $state(false);

const oklch = $derived(colourToOklch(color));
const spaceOn = $derived(colourToOn(color));

// Reflect the theme onto <html> so @lunma/tokens' `[data-theme="light"]` set
// takes over (and native scrollbars/controls match) — the same helper the
// extension surfaces use.
$effect(() => {
  applyThemeToDocument(theme);
});

const TINT_OPTIONS: Array<{ value: Tint; label: string }> = [
  { value: 'subtle', label: 'Subtle' },
  { value: 'standard', label: 'Standard' },
  { value: 'vivid', label: 'Vivid' },
];

const THEME_OPTIONS: Array<{ value: ThemeMode; label: string }> = [
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
];

function select(entry: StoryEntry): void {
  selected = entry;
}
</script>

<div class="catalog">
  <nav class="nav" aria-label="Components">
    <div class="wordmark">
      <span class="brand">Lunma</span>
      <span class="brand-sub">Catalog</span>
    </div>
    {#each groups as group (group.name)}
      <div class="nav-group">
        <h2 class="nav-group-heading">{group.name}</h2>
        <ul>
          {#each group.stories as entry (entry.id)}
            {@const isActive = selected?.id === entry.id}
            <li class="nav-item" class:active={isActive}>
              <RowButton
                icon="shapes"
                label={entry.title}
                ariaCurrent={isActive ? 'page' : undefined}
                onclick={() => select(entry)}
              />
            </li>
          {/each}
        </ul>
      </div>
    {/each}
  </nav>

  <main
    class="stage lunma-space-scope"
    data-tint={tint}
    data-force-motion={forceReduced ? 'reduced' : null}
    style:--space-h={String(oklch.h)}
    style:--space-chroma={String(oklch.c)}
    style:--space-l={String(oklch.l)}
    style:--space-on={spaceOn}
  >
    <Aurora intensity={tint} />

    <header class="toolbar lunma-glass">
      <div class="control">
        <span class="control-label">Space hue</span>
        <div class="swatches">
          {#each SPACE_COLORS as c (c)}
            <ColorSwatch color={c} selected={color === c} onclick={() => (color = c)} />
          {/each}
        </div>
      </div>
      <div class="control">
        <span class="control-label" id="catalog-intensity-label">Intensity</span>
        <SegmentedControl
          name="catalog-intensity"
          ariaLabel="Colour intensity"
          options={TINT_OPTIONS}
          value={tint}
          onchange={(v) => (tint = v as Tint)}
        />
      </div>
      <div class="control">
        <span class="control-label">Theme</span>
        <SegmentedControl
          name="catalog-theme"
          ariaLabel="Theme"
          options={THEME_OPTIONS}
          value={theme}
          onchange={(v) => (theme = v as ThemeMode)}
        />
      </div>
      <div class="control">
        <span class="control-label">Motion</span>
        <IconButton
          icon={forceReduced ? 'snowflake' : 'wind'}
          ariaLabel={forceReduced ? 'Reduced motion on — click to allow motion' : 'Motion on — click to freeze'}
          title={forceReduced ? 'Reduced motion' : 'Full motion'}
          onclick={() => (forceReduced = !forceReduced)}
        />
      </div>
    </header>

    <section class="story-pane">
      {#if selected}
        {#key selected.id}
          {#await Promise.all([selected.load(), selected.loadSource()]) then [StoryComponent, source]}
            <StoryComponent {source} />
          {:catch error}
            <p class="error" role="alert">Failed to load story <code>{selected.id}</code>: {error}</p>
          {/await}
        {/key}
      {:else}
        <p class="empty">No stories discovered.</p>
      {/if}
    </section>
  </main>
</div>

<style>
  .catalog {
    display: grid;
    grid-template-columns: 16rem 1fr;
    height: 100%;
  }

  .nav {
    overflow-y: auto;
    padding: var(--space-4) var(--space-3);
    border-right: 1px solid var(--border-soft);
    background: var(--surface);
  }

  .wordmark {
    display: flex;
    align-items: baseline;
    gap: var(--space-2);
    padding: 0 var(--space-3) var(--space-4);
  }
  .brand {
    font-family: var(--font-display);
    font-size: var(--text-xl);
    color: var(--text);
  }
  .brand-sub {
    font-size: var(--text-xs);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-muted);
  }

  .nav-group + .nav-group {
    margin-top: var(--space-4);
  }
  .nav-group-heading {
    margin: 0 0 var(--space-1);
    padding: 0 var(--space-3);
    font-size: var(--text-2xs);
    font-weight: var(--weight-semibold);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-faint);
  }
  .nav ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  /* RowButton owns hover/focus; the wrapper paints the active-selection wash
   * (RowButton has no `selected` prop). */
  .nav-item.active :global(.row-button) {
    background: var(--accent-soft);
    color: var(--text);
  }

  .stage {
    position: relative;
    overflow-y: auto;
    padding: var(--space-5);
  }

  .toolbar {
    position: relative;
    z-index: var(--z-raised);
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: var(--space-5);
    padding: var(--space-4);
    margin-bottom: var(--space-5);
    border-radius: var(--r-lg);
  }
  .control {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }
  .control-label {
    font-size: var(--text-2xs);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-muted);
  }
  .swatches {
    display: flex;
    gap: var(--space-2);
  }

  .story-pane {
    position: relative;
    z-index: var(--z-raised);
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }
  .empty {
    color: var(--text-muted);
  }
  .error {
    color: var(--danger);
  }
  .error code {
    font-family: var(--font-mono);
  }
</style>
