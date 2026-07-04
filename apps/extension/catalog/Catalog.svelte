<script lang="ts">
import type { ThemeMode, Tint } from '@/shared/settings';
import { colourToOklch, colourToOn } from '@/shared/space-hue';
import type { SpaceColor } from '@/shared/types';
import { SPACE_COLORS } from './lib/mock';
import { setPreviewContext } from './lib/preview-context';
import { buildGroups, type StoryEntry } from './lib/registry';

const groups = buildGroups();

// Default selection: the first story of the first group (if any).
let selected = $state<StoryEntry | undefined>(groups[0]?.stories[0]);

// Persisted controls (one localStorage key): the chrome theme, plus the
// preview-only knobs (Space hue / intensity / reduced-motion). The stage theme
// is NOT persisted — it reseeds from the selected story's `meta.theme`.
const PREFS_KEY = 'lunma_catalog_prefs';
interface Prefs {
  color: SpaceColor;
  tint: Tint;
  chromeTheme: ThemeMode;
  forceReduced: boolean;
  stageTheme: ThemeMode;
  canvasSurface: 'neutral' | 'theme';
}
function readPrefs(): Partial<Prefs> {
  if (typeof localStorage === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(PREFS_KEY) ?? '{}') as Partial<Prefs>;
  } catch {
    return {};
  }
}
const saved = readPrefs();
// A stale/garbage stored hue would break `colourToOklch`; only trust a known one.
const savedColor = saved.color && SPACE_COLORS.includes(saved.color) ? saved.color : 'blue';

let color = $state<SpaceColor>(savedColor);
let tint = $state<Tint>(saved.tint ?? 'vivid');
let chromeTheme = $state<ThemeMode>(saved.chromeTheme ?? 'dark');
let forceReduced = $state(saved.forceReduced ?? false);
// Live Canvas surface: clean neutral grey, or the theme habitat (atm-bg + bloom
// + aurora). A global, persisted preference — independent of a story's own
// `meta.background` (which only decides whether the habitat includes aurora).
let canvasSurface = $state<'neutral' | 'theme'>(saved.canvasSurface ?? 'neutral');
// Stage theme: the previewed primitive's own light/dark. Persists across
// navigation and reloads with the other controls; a story that explicitly
// declares `meta.theme` overrides it on selection, otherwise it keeps the
// reviewer's chosen value. Lives on <html data-theme> so lunma tokens AND
// body-portalled overlays (Menu, BottomSheet, Toast) resolve to it.
let stageTheme = $state<ThemeMode>(saved.stageTheme ?? 'dark');

$effect(() => {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(
      PREFS_KEY,
      JSON.stringify({ color, tint, chromeTheme, forceReduced, stageTheme, canvasSurface }),
    );
  } catch {
    // storage blocked — controls still apply for this session
  }
});

$effect(() => {
  if (selected?.theme) stageTheme = selected.theme;
});

const canvas = $derived(selected?.background ?? 'neutral');
const oklch = $derived(colourToOklch(color));
const spaceOn = $derived(colourToOn(color));

// Share the intensity + canvas with each render surface so an aurora story can
// render its own scoped `<Aurora>` inside the neutral chrome panels.
setPreviewContext({
  get tint() {
    return tint;
  },
  get canvas() {
    return canvas;
  },
  get surface() {
    return canvasSurface;
  },
});

// Two independent theme axes on <html>: `data-cat-theme` drives the bespoke
// `--cat-*` chrome (tool comfort); `data-theme` drives lunma's tokens for the
// preview canvas + its portalled overlays. color-scheme follows the chrome.
$effect(() => {
  const el = document.documentElement;
  el.setAttribute('data-cat-theme', chromeTheme);
  el.style.colorScheme = chromeTheme;
});
$effect(() => {
  document.documentElement.setAttribute('data-theme', stageTheme);
});
// The Space-hue axes MUST live on <html> (`:root`): the hue-dependent tokens
// (`--accent`, `--glow-hearth`, aurora) are declared at `:root` and resolve
// their `var(--space-*)` there, so a lower scope wouldn't recolour them. The
// chrome is unaffected (it uses only `--cat-*`); the preview recolours.
$effect(() => {
  const s = document.documentElement.style;
  s.setProperty('--space-h', String(oklch.h));
  s.setProperty('--space-chroma', String(oklch.c));
  s.setProperty('--space-l', String(oklch.l));
  s.setProperty('--space-on', spaceOn);
});

const TINT_OPTIONS: Tint[] = ['subtle', 'standard', 'vivid'];
const THEME_OPTIONS: ThemeMode[] = ['dark', 'light'];
const SURFACE_OPTIONS: Array<'neutral' | 'theme'> = ['neutral', 'theme'];

function hueCss(c: SpaceColor): string {
  const o = colourToOklch(c);
  return `oklch(${o.l} ${o.c} ${o.h})`;
}

// The selected swatch's ring reads as a lightened cut of its own hue (mirrors the
// ColorSwatch primitive's `--swatch-l + 0.04`), so selection stays on-hue rather
// than a flat neutral outline.
function ringCss(c: SpaceColor): string {
  const o = colourToOklch(c);
  return `oklch(${Math.min(o.l + 0.04, 1)} ${o.c} ${o.h})`;
}

function select(entry: StoryEntry): void {
  selected = entry;
}
</script>

<div class="cat">
  <nav class="cat-nav" aria-label="Components">
    <div class="cat-wordmark">Lunma<span>Catalog</span></div>
    <div class="cat-nav-scroll">
      {#each groups as group (group.name)}
        <div class="cat-nav-group">
          <h2 class="cat-nav-heading">{group.name}</h2>
          {#each group.stories as entry (entry.id)}
            {@const isActive = selected?.id === entry.id}
            <button
              type="button"
              class="cat-nav-item"
              class:active={isActive}
              aria-current={isActive ? 'page' : undefined}
              onclick={() => select(entry)}
            >
              {entry.title}
            </button>
          {/each}
        </div>
      {/each}
    </div>
    <div class="cat-nav-footer">
      <span class="cat-label">Theme</span>
      <button
        type="button"
        class="cat-btn"
        aria-label={`Catalog theme: ${chromeTheme}. Toggle.`}
        onclick={() => (chromeTheme = chromeTheme === 'dark' ? 'light' : 'dark')}
      >
        {chromeTheme}
      </button>
    </div>
  </nav>

  <main class="cat-main">
    <header class="cat-topbar">
      <h1 class="cat-title">{selected?.title ?? 'Catalog'}</h1>
    </header>

    <div class="cat-toolbar">
      <div class="cat-field">
        <span class="cat-label">Stage theme</span>
        <div class="cat-seg" role="group" aria-label="Stage theme">
          {#each THEME_OPTIONS as t (t)}
            <button
              type="button"
              class="cat-seg-btn"
              class:on={stageTheme === t}
              aria-pressed={stageTheme === t}
              onclick={() => (stageTheme = t)}
            >
              {t}
            </button>
          {/each}
        </div>
      </div>
      <div class="cat-field">
        <span class="cat-label">Canvas</span>
        <div class="cat-seg" role="group" aria-label="Canvas surface">
          {#each SURFACE_OPTIONS as s (s)}
            <button
              type="button"
              class="cat-seg-btn"
              class:on={canvasSurface === s}
              aria-pressed={canvasSurface === s}
              onclick={() => (canvasSurface = s)}
            >
              {s}
            </button>
          {/each}
        </div>
      </div>
      <div class="cat-field">
        <span class="cat-label">Space hue</span>
        <div class="cat-swatches">
          {#each SPACE_COLORS as c (c)}
            <button
              type="button"
              class="cat-swatch"
              class:on={color === c}
              style:background={hueCss(c)}
              style:--cat-swatch-ring={ringCss(c)}
              aria-label={c}
              aria-pressed={color === c}
              onclick={() => (color = c)}
            ></button>
          {/each}
        </div>
      </div>
      <div class="cat-field">
        <span class="cat-label">Intensity</span>
        <div class="cat-seg" role="group" aria-label="Colour intensity">
          {#each TINT_OPTIONS as t (t)}
            <button
              type="button"
              class="cat-seg-btn"
              class:on={tint === t}
              aria-pressed={tint === t}
              onclick={() => (tint = t)}
            >
              {t}
            </button>
          {/each}
        </div>
      </div>
      <div class="cat-field">
        <span class="cat-label">Motion</span>
        <button
          type="button"
          class="cat-btn"
          aria-pressed={forceReduced}
          onclick={() => (forceReduced = !forceReduced)}
        >
          {forceReduced ? 'frozen' : 'motion'}
        </button>
      </div>
    </div>

    <section
      class="cat-scroll lunma-space-scope"
      data-canvas={canvas}
      data-tint={tint}
      data-force-motion={forceReduced ? 'reduced' : null}
    >
      {#if selected}
        {#key selected.id}
          {#await Promise.all([selected.load(), selected.loadSource()]) then [StoryComponent, source]}
            <StoryComponent {source} />
          {:catch error}
            <p class="cat-error" role="alert">Failed to load story <code>{selected.id}</code>: {error}</p>
          {/await}
        {/key}
      {:else}
        <p class="cat-empty">No stories discovered.</p>
      {/if}
    </section>
  </main>
</div>

<style>
  .cat {
    display: grid;
    grid-template-columns: 15rem 1fr;
    height: 100%;
    background: var(--cat-bg);
    color: var(--cat-text);
  }

  /* ── Nav ─────────────────────────────────────────────────────────────── */
  .cat-nav {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border-right: 1px solid var(--cat-border);
    background: var(--cat-surface);
  }
  .cat-wordmark {
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
    padding: 1rem 1.25rem;
    font-size: 0.8rem;
    font-weight: 600;
    letter-spacing: -0.01em;
    border-bottom: 1px solid var(--cat-border);
  }
  .cat-wordmark span {
    font-size: 0.6rem;
    font-weight: 500;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--cat-faint);
  }
  .cat-nav-scroll {
    flex: 1;
    overflow-y: auto;
    padding: 0.75rem;
  }
  .cat-nav-group + .cat-nav-group {
    margin-top: 1.25rem;
  }
  .cat-nav-heading {
    margin: 0 0 0.375rem;
    padding: 0 0.5rem;
    font-size: 0.6rem;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--cat-faint);
  }
  .cat-nav-item {
    display: block;
    width: 100%;
    padding: 0.375rem 0.5rem;
    border: 0;
    border-radius: 6px;
    background: transparent;
    text-align: left;
    font: inherit;
    font-size: 0.8rem;
    color: var(--cat-muted);
    cursor: pointer;
    transition: background 120ms, color 120ms;
  }
  .cat-nav-item:hover {
    background: var(--cat-active);
    color: var(--cat-text);
  }
  .cat-nav-item.active {
    background: var(--cat-active);
    color: var(--cat-text);
    font-weight: 500;
  }
  .cat-nav-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    padding: 0.625rem 1.25rem;
    border-top: 1px solid var(--cat-border);
  }

  /* ── Main ────────────────────────────────────────────────────────────── */
  .cat-main {
    display: flex;
    flex-direction: column;
    min-width: 0;
    overflow: hidden;
  }
  .cat-topbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.875rem 1.5rem;
    border-bottom: 1px solid var(--cat-border);
    background: var(--cat-surface);
  }
  .cat-title {
    margin: 0;
    font-size: 0.95rem;
    font-weight: 600;
    letter-spacing: -0.01em;
  }
  .cat-toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: 1.5rem;
    padding: 0.75rem 1.5rem;
    border-bottom: 1px solid var(--cat-border);
    background: var(--cat-panel);
  }
  .cat-field {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
  .cat-label {
    font-size: 0.6rem;
    font-weight: 500;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--cat-faint);
  }

  /* ── Chrome controls (plain, --cat-*) ────────────────────────────────── */
  .cat-btn {
    height: 1.75rem;
    padding: 0 0.6rem;
    border: 1px solid var(--cat-border-strong);
    border-radius: 6px;
    background: var(--cat-surface);
    font: inherit;
    font-size: 0.72rem;
    text-transform: capitalize;
    color: var(--cat-text);
    cursor: pointer;
    transition: background 120ms, border-color 120ms;
  }
  .cat-btn:hover {
    background: var(--cat-active);
  }
  .cat-seg {
    display: inline-flex;
    padding: 2px;
    border: 1px solid var(--cat-border);
    border-radius: 7px;
    background: var(--cat-surface);
  }
  .cat-seg-btn {
    padding: 0.2rem 0.55rem;
    border: 0;
    border-radius: 5px;
    background: transparent;
    font: inherit;
    font-size: 0.72rem;
    text-transform: capitalize;
    color: var(--cat-muted);
    cursor: pointer;
    transition: background 120ms, color 120ms;
  }
  .cat-seg-btn:hover {
    color: var(--cat-text);
  }
  .cat-seg-btn.on {
    background: var(--cat-active);
    color: var(--cat-text);
  }
  .cat-swatches {
    display: flex;
    gap: 0.375rem;
  }
  .cat-swatch {
    width: 1.25rem;
    height: 1.25rem;
    padding: 0;
    border: 1px solid var(--cat-border-strong);
    border-radius: 5px;
    cursor: pointer;
  }
  .cat-swatch.on {
    outline: 2px solid var(--cat-swatch-ring);
    outline-offset: 1px;
  }

  /* ── Stage / scroll ──────────────────────────────────────────────────── */
  .cat-scroll {
    flex: 1;
    overflow-y: auto;
    background: var(--cat-bg);
    /* Ambient-bloom strength for the render canvas, scaled by the Intensity
     * control so Space hue + Intensity visibly drive every story's habitat. */
    --cat-bloom: 16%;
  }
  .cat-scroll[data-tint='subtle'] {
    --cat-bloom: 9%;
  }
  .cat-scroll[data-tint='vivid'] {
    --cat-bloom: 26%;
  }
  .cat-empty {
    padding: 1.5rem;
    color: var(--cat-muted);
  }
  .cat-error {
    color: #dc2626;
  }
  .cat-error code {
    font-family: var(--cat-mono);
  }
</style>
