<script lang="ts">
import { codeToHtml } from 'shiki';
import type { Snippet } from 'svelte';
import Aurora from '@/ui/Aurora.svelte';
import { type Args, defaultArgs } from './controls';
import { extractVariantCode, generatePlaygroundCode } from './extract-code';
import { getPreviewContext } from './preview-context';
import { resolveControls } from './registry';
import type { StoryMeta } from './story';
import { setVariantCodeContext } from './variant-code';

interface Props {
  meta: StoryMeta;
  /** Raw source of the story file (registry-supplied), shown in the source panel. */
  source: string;
  /** Live preview: rendered with the current `args` when controls are declared. */
  preview?: Snippet<[Args]>;
  /** Curated example variants (the `<Variant>` matrix). */
  examples?: Snippet;
}

const { meta, source, preview, examples }: Props = $props();

const ctx = getPreviewContext();
const canvas = $derived(ctx?.canvas ?? 'neutral');
const surface = $derived(ctx?.surface ?? 'neutral');

const controls = $derived(resolveControls(meta));
const controlEntries = $derived(Object.entries(controls));
const hasControls = $derived(controlEntries.length > 0);

// svelte-ignore state_referenced_locally
const args = $state<Args>(defaultArgs(controls));

// Examples: each `<Variant>`'s exact authored markup, keyed by label, extracted
// from the raw `source` (a stable per-mount prop — the catalog remounts per
// story via `{#key}`). A tile's `</>` opens its code in the shared drawer below.
// svelte-ignore state_referenced_locally
const variantCodes = extractVariantCode(source);
let openLabel = $state<string | null>(null);
let variantHighlighted = $state<Promise<string>>();
setVariantCodeContext({
  codeFor: (label) => variantCodes.get(label),
  toggle: (label) => {
    if (openLabel === label) {
      openLabel = null;
      return;
    }
    openLabel = label;
    variantHighlighted = codeToHtml(variantCodes.get(label) ?? '', {
      lang: 'svelte',
      themes: { light: 'vitesse-light', dark: 'vitesse-dark' },
      defaultColor: false,
    });
  },
  get openLabel() {
    return openLabel;
  },
});

// Playground live code — rebuilt from the current control values. `meta.title`
// is the primitive's component name by convention.
const liveTokens = $derived(generatePlaygroundCode(meta.title, controls, args));
function tokClass(kind: string): string {
  if (kind === 'tag') return 'cat-tok-tag';
  if (kind === 'attr') return 'cat-tok-attr';
  if (kind === 'str') return 'cat-tok-str';
  return '';
}

// Viewport state (per playground).
let canvasWidth = $state<'full' | '768' | '480' | '320'>('full');
let canvasBg = $state<'plain' | 'dots' | 'grid'>('plain');
let activeTab = $state<'code' | 'api'>('code');
let stageW = $state<number>();
let stageH = $state<number>();
let stageEl = $state<HTMLDivElement>();

// Apply a width preset imperatively (only when the preset changes) so a manual
// drag-resize of the stage isn't reset on unrelated re-renders.
$effect(() => {
  const w = canvasWidth;
  if (stageEl) stageEl.style.width = w === 'full' ? '100%' : `${w}px`;
});

const WIDTHS = ['full', '768', '480', '320'] as const;
const BGS = ['plain', 'dots', 'grid'] as const;

// A number control only commits valid numbers — an in-progress value (`-`,
// `1.`) parses to NaN, which would poison the preview; hold the last good value.
function updateNumber(prop: string, v: string): void {
  const n = v === '' ? 0 : Number(v);
  if (!Number.isNaN(n)) args[prop] = n;
}

let highlighted = $state<Promise<string>>();
function highlightSource(): void {
  highlighted ??= codeToHtml(source, {
    lang: 'svelte',
    themes: { light: 'vitesse-light', dark: 'vitesse-dark' },
    defaultColor: false,
  });
}
</script>

<div class="story">
  {#if examples}
    <section class="panel">
      <div class="panel-head"><span class="panel-title">Examples</span></div>
      <div class="panel-body">
        <div class="examples">{@render examples()}</div>
        {#if openLabel}
          <div class="variant-code">
            <div class="variant-code-head">
              <span class="panel-title">Code for</span>
              <code>{openLabel}</code>
            </div>
            {#if variantHighlighted}
              {#await variantHighlighted then html}
                <!-- Shiki output over our own extracted story source, not user input. -->
                <div class="shiki-wrap">{@html html}</div>
              {/await}
            {/if}
          </div>
        {/if}
      </div>
    </section>
  {/if}

  {#if preview}
    <section class="panel">
      <div class="panel-head"><span class="panel-title">Playground</span></div>
      <div class="panel-body">
        <div class="viewport">
          <div class="viewport-left">
            <div class="vp-field">
              <span class="vp-label">Width</span>
              <div class="seg" role="group" aria-label="Canvas width">
                {#each WIDTHS as w (w)}
                  <button type="button" class="seg-btn" class:on={canvasWidth === w} aria-pressed={canvasWidth === w} onclick={() => (canvasWidth = w)}>
                    {w === 'full' ? 'Full' : w}
                  </button>
                {/each}
              </div>
            </div>
            <div class="vp-field">
              <span class="vp-label">Background</span>
              <div class="seg" role="group" aria-label="Canvas background">
                {#each BGS as b (b)}
                  <button type="button" class="seg-btn cap" class:on={canvasBg === b} aria-pressed={canvasBg === b} onclick={() => (canvasBg = b)}>
                    {b}
                  </button>
                {/each}
              </div>
            </div>
          </div>
          <span class="vp-dims">{stageW ? `${Math.round(stageW)} × ${Math.round(stageH ?? 0)} px` : ''}</span>
        </div>

        <div class="stage-wrap">
          <div
            bind:this={stageEl}
            bind:clientWidth={stageW}
            bind:clientHeight={stageH}
            class="cat-stage"
            data-bg={canvasBg}
            data-canvas={canvas}
            data-surface={surface}
            title="Drag the lower-right corner to resize"
          >
            {#if canvas === 'aurora' && surface === 'theme'}
              <Aurora intensity={ctx?.tint ?? 'vivid'} />
            {/if}
            <div class="stage-content">{@render preview(args)}</div>
          </div>
        </div>

        <div class="pg-grid" class:two-col={hasControls}>
          {#if hasControls}
            <div class="card">
              <div class="card-head">Controls</div>
              <div class="card-body controls">
                {#each controlEntries as [prop, def] (prop)}
                  <div class="ctl">
                    {#if def.type === 'boolean'}
                      <label class="ctl-check">
                        <input type="checkbox" checked={Boolean(args[prop])} onchange={(e) => (args[prop] = e.currentTarget.checked)} />
                        <span class="ctl-name">{prop}</span>
                      </label>
                    {:else}
                      <label class="ctl-name" for={`ctl-${prop}`}>{prop}</label>
                      {#if def.type === 'select' && def.options}
                        <select id={`ctl-${prop}`} class="input" value={String(args[prop])} onchange={(e) => (args[prop] = e.currentTarget.value)}>
                          {#each def.options as option (option)}<option value={option}>{option}</option>{/each}
                        </select>
                      {:else if def.type === 'number'}
                        <input id={`ctl-${prop}`} class="input" type="text" inputmode="numeric" value={String(args[prop])} oninput={(e) => updateNumber(prop, e.currentTarget.value)} />
                      {:else}
                        <input id={`ctl-${prop}`} class="input" type="text" value={String(args[prop])} oninput={(e) => (args[prop] = e.currentTarget.value)} />
                      {/if}
                    {/if}
                    {#if def.description}<span class="ctl-desc">{def.description}</span>{/if}
                  </div>
                {/each}
              </div>
            </div>
          {/if}

          <div class="card">
            {#if hasControls}
              <div class="tabs">
                {#each ['code', 'api'] as const as tab (tab)}
                  <button type="button" class="tab" class:on={activeTab === tab} role="tab" aria-selected={activeTab === tab} onclick={() => (activeTab = tab)}>{tab}</button>
                {/each}
              </div>
            {:else}
              <div class="card-head">Code</div>
            {/if}
            <div class="card-body">
              {#if activeTab === 'code' || !hasControls}
                <pre class="code-pre"><code>{#each liveTokens as tok, i (i)}<span class={tokClass(tok.kind)}>{tok.text}</span>{/each}</code></pre>
              {:else}
                <table class="api">
                  <thead>
                    <tr><th>Prop</th><th>Type</th><th>Default</th><th>Description</th></tr>
                  </thead>
                  <tbody>
                    {#each controlEntries as [prop, def] (prop)}
                      <tr>
                        <td><code>{prop}</code></td>
                        <td><code>{def.typeLabel ?? def.type}</code></td>
                        <td><code>{JSON.stringify(def.default)}</code></td>
                        <td>{def.description ?? ''}</td>
                      </tr>
                    {/each}
                  </tbody>
                </table>
              {/if}
            </div>
          </div>
        </div>
      </div>
    </section>
  {/if}

  <section class="source-section">
    <details ontoggle={highlightSource}>
      <summary>Source</summary>
      {#if highlighted}
        {#await highlighted then html}
          <!-- Shiki output is escaped HTML over our own story source (not user input). -->
          <div class="shiki-wrap">{@html html}</div>
        {:catch}
          <pre class="source-fallback"><code>{source}</code></pre>
        {/await}
      {/if}
    </details>
  </section>
</div>

<style>
  .story {
    max-width: 64rem;
    margin: 0 auto;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  /* ── Panels (chrome) ─────────────────────────────────────────────────── */
  .panel {
    overflow: hidden;
    border: 1px solid var(--cat-border);
    border-radius: var(--cat-radius);
    background: var(--cat-surface);
  }
  .panel-head {
    padding: 0.6rem 1rem;
    border-bottom: 1px solid var(--cat-border);
    background: var(--cat-panel);
  }
  .panel-title {
    font-size: 0.62rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--cat-muted);
  }
  .panel-body {
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  /* ── Viewport toolbar ────────────────────────────────────────────────── */
  .viewport {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.4rem 0.6rem;
    border: 1px solid var(--cat-border);
    border-radius: 8px;
    background: var(--cat-panel);
  }
  .viewport-left {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 1.25rem;
  }
  .vp-field {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .vp-label {
    font-size: 0.58rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--cat-faint);
  }
  .vp-dims {
    font-family: var(--cat-mono);
    font-size: 0.68rem;
    color: var(--cat-muted);
    white-space: nowrap;
  }

  /* Shared segmented control (viewport + tabs share the look). */
  .seg {
    display: inline-flex;
    padding: 2px;
    border: 1px solid var(--cat-border);
    border-radius: 7px;
    background: var(--cat-surface);
  }
  .seg-btn {
    padding: 0.15rem 0.5rem;
    border: 0;
    border-radius: 5px;
    background: transparent;
    font: inherit;
    font-size: 0.68rem;
    color: var(--cat-muted);
    cursor: pointer;
    transition: background 120ms, color 120ms;
  }
  .seg-btn.cap {
    text-transform: capitalize;
  }
  .seg-btn:hover {
    color: var(--cat-text);
  }
  .seg-btn.on {
    background: var(--cat-active);
    color: var(--cat-text);
  }

  /* ── Render stage ────────────────────────────────────────────────────── */
  .stage-wrap {
    display: flex;
    justify-content: center;
  }
  /* The render stage follows the Canvas toggle: a clean neutral grey
   * (`--cat-canvas`) for focus, or the THEME's own atmospheric background
   * (`--atm-bg` + hue bloom, flips with the stage theme) as the real habitat. */
  .cat-stage {
    position: relative;
    display: flex;
    min-height: 9.5rem;
    width: 100%;
    max-width: 100%;
    min-width: 14rem;
    overflow: auto;
    resize: horizontal;
    border-radius: 10px;
    border: 1px solid var(--border-soft);
  }
  .cat-stage[data-surface='neutral'] {
    background: var(--cat-canvas);
    border-color: var(--cat-canvas-border);
  }
  .cat-stage[data-surface='theme'] {
    background: var(--atm-bg);
  }
  /* Ambient hue bloom — the app's resting "hearth", only in the theme habitat:
   * its colour follows Space hue (`--glow-hearth` reads the `:root` `--space-*`)
   * and its strength follows Intensity (`--cat-bloom`). */
  .cat-stage[data-surface='theme']::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    background: radial-gradient(
      130% 100% at 50% 100%,
      color-mix(in oklch, var(--glow-hearth) var(--cat-bloom, 16%), transparent),
      transparent 72%
    );
  }
  .cat-stage[data-bg='dots'] {
    background-image: radial-gradient(color-mix(in srgb, var(--text-muted) 30%, transparent) 1px, transparent 1px);
    background-size: 14px 14px;
  }
  .cat-stage[data-bg='grid'] {
    background-image:
      linear-gradient(color-mix(in srgb, var(--text-muted) 18%, transparent) 1px, transparent 1px),
      linear-gradient(90deg, color-mix(in srgb, var(--text-muted) 18%, transparent) 1px, transparent 1px);
    background-size: 22px 22px;
  }
  .stage-content {
    position: relative;
    z-index: 1;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    width: 100%;
    padding: 2rem;
  }

  /* ── Controls + tabbed code/API ──────────────────────────────────────── */
  .pg-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  @media (min-width: 60rem) {
    .pg-grid.two-col {
      grid-template-columns: minmax(0, 1fr) minmax(0, 1.05fr);
    }
  }
  .card {
    overflow: hidden;
    border: 1px solid var(--cat-border);
    border-radius: 10px;
  }
  .card-head {
    padding: 0.5rem 0.875rem;
    border-bottom: 1px solid var(--cat-border);
    background: var(--cat-panel);
    font-size: 0.6rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--cat-muted);
  }
  .card-body {
    padding: 1rem;
  }
  .tabs {
    display: flex;
    padding: 0 0.5rem;
    border-bottom: 1px solid var(--cat-border);
    background: var(--cat-panel);
  }
  .tab {
    padding: 0.5rem 0.6rem;
    margin-bottom: -1px;
    border: 0;
    border-bottom: 2px solid transparent;
    background: transparent;
    font: inherit;
    font-size: 0.6rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--cat-faint);
    cursor: pointer;
  }
  .tab.on {
    border-bottom-color: var(--cat-text);
    color: var(--cat-text);
  }

  .controls {
    display: grid;
    gap: 0.875rem;
  }
  .ctl {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }
  .ctl-name {
    font-size: 0.78rem;
    font-weight: 500;
    color: var(--cat-text);
  }
  .ctl-desc {
    font-size: 0.68rem;
    color: var(--cat-muted);
  }
  .ctl-check {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    cursor: pointer;
  }
  .input {
    height: 1.9rem;
    padding: 0 0.5rem;
    border: 1px solid var(--cat-border-strong);
    border-radius: 6px;
    background: var(--cat-surface);
    font: inherit;
    font-size: 0.78rem;
    color: var(--cat-text);
    outline: none;
  }
  .input:focus-visible {
    border-color: var(--cat-text);
  }

  .code-pre {
    margin: 0;
    overflow-x: auto;
    font-family: var(--cat-mono);
    font-size: 0.72rem;
    line-height: 1.6;
    color: var(--cat-text);
    white-space: pre;
  }

  .api {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.78rem;
  }
  .api th {
    text-align: left;
    padding: 0.4rem 0.6rem;
    color: var(--cat-muted);
    border-bottom: 1px solid var(--cat-border-strong);
    font-weight: 600;
  }
  .api td {
    padding: 0.4rem 0.6rem;
    border-bottom: 1px solid var(--cat-border);
    vertical-align: top;
    color: var(--cat-text);
  }
  .api code {
    font-family: var(--cat-mono);
    font-size: 0.72rem;
    color: var(--cat-text);
  }

  /* ── Examples ────────────────────────────────────────────────────────── */
  .examples {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr));
    gap: 1rem;
  }
  .variant-code {
    margin-top: 0.25rem;
  }
  .variant-code-head {
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }
  .variant-code-head code {
    font-family: var(--cat-mono);
    font-size: 0.72rem;
    color: var(--cat-muted);
  }

  /* ── Source ──────────────────────────────────────────────────────────── */
  .source-section summary {
    cursor: pointer;
    font-size: 0.6rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--cat-faint);
    user-select: none;
  }
  .shiki-wrap {
    margin-top: 0.75rem;
  }
  .source-fallback {
    margin: 0.75rem 0 0;
    padding: 1rem;
    border-radius: 8px;
    background: var(--cat-panel);
    border: 1px solid var(--cat-border);
    overflow: auto;
    max-height: 28rem;
    font-family: var(--cat-mono);
    font-size: 0.72rem;
    color: var(--cat-text);
    white-space: pre;
  }
</style>
