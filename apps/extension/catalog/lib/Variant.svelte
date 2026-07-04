<script lang="ts">
import type { Snippet } from 'svelte';
import Aurora from '@/ui/Aurora.svelte';
import { getPreviewContext } from './preview-context';
import { getVariantCodeContext } from './variant-code';

interface Props {
  /** The variant's caption (e.g. `primary · sm · disabled`). */
  label: string;
  /** The rendered primitive(s) for this cell. */
  children: Snippet;
}

const { label, children }: Props = $props();

const preview = getPreviewContext();
const canvas = $derived(preview?.canvas ?? 'neutral');
const surface = $derived(preview?.surface ?? 'neutral');

const codeCtx = getVariantCodeContext();
const hasCode = $derived(!!codeCtx?.codeFor(label));
const isOpen = $derived(codeCtx?.openLabel === label);
</script>

<figure class="variant" data-canvas={canvas} data-surface={surface}>
  {#if canvas === 'aurora' && surface === 'theme'}
    <Aurora intensity={preview?.tint ?? 'vivid'} />
  {/if}
  <div class="stage">{@render children()}</div>
  <figcaption>
    <span class="label">{label}</span>
    {#if hasCode && codeCtx}
      <button
        type="button"
        class="code-btn"
        class:on={isOpen}
        aria-expanded={isOpen}
        aria-label={isOpen ? `Hide code for ${label}` : `Show code for ${label}`}
        onclick={() => codeCtx.toggle(label)}
      >
        &lt;/&gt;
      </button>
    {/if}
  </figcaption>
</figure>

<style>
  /* A labelled example tile. Neutral: a plain --cat-canvas card. Aurora: the
   * primitive reads against a scoped `<Aurora>` (z0) frosted by a glass overlay
   * (`::after`, z1) — backdrop-filter on `::after` (not `.variant`) so the tile
   * isn't a stacking context that would trap a child popover below a later
   * sibling. `overflow: hidden` clips the aurora but is applied ONLY to aurora
   * tiles (none of which host an in-tile popover); neutral tiles stay unclipped
   * so a MultiSelect/Menu/Select popover can escape. */
  .variant {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 1rem;
    border-radius: 10px;
  }
  .variant[data-surface='neutral'] {
    background: var(--cat-canvas);
    border: 1px solid var(--cat-canvas-border);
  }
  .variant[data-surface='theme'][data-canvas='neutral'] {
    background: var(--surface);
    border: 1px solid var(--border-soft);
  }
  .variant[data-surface='theme'][data-canvas='aurora'] {
    overflow: hidden;
    border: 1px solid var(--glass-border);
  }
  .variant[data-surface='theme'][data-canvas='aurora']::after {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 1;
    border-radius: inherit;
    background: var(--glass-bg);
    -webkit-backdrop-filter: blur(var(--glass-blur));
    backdrop-filter: blur(var(--glass-blur));
    box-shadow: var(--glass-highlight);
  }

  .stage {
    position: relative;
    z-index: 2;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.75rem;
    min-height: 2.5rem;
  }

  figcaption {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }
  .label {
    font-size: 0.7rem;
    color: var(--cat-muted);
    font-family: var(--cat-mono);
  }
  .variant[data-surface='theme'][data-canvas='aurora'] .label {
    color: var(--space-on, var(--text));
  }
  .code-btn {
    padding: 0.1rem 0.3rem;
    border: 1px solid var(--cat-border);
    border-radius: 5px;
    background: transparent;
    font-family: var(--cat-mono);
    font-size: 0.62rem;
    color: var(--cat-muted);
    cursor: pointer;
    transition: background 120ms, color 120ms;
  }
  .code-btn:hover {
    color: var(--cat-text);
  }
  .code-btn.on {
    background: var(--cat-active);
    color: var(--cat-text);
    border-color: var(--cat-border-strong);
  }
</style>
