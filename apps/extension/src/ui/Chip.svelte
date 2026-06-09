<script lang="ts">
import Icon from './Icon.svelte';

interface Props {
  /** The token's text. */
  label: string;
  /** Background tone. `neutral` (default) reads as `--surface-2`; `accent` tints
   * toward the active Space accent (`--accent-soft`) — used by the Tab-to-search
   * engine chip for Space cohesion (launcher-tab-to-search). */
  tone?: 'neutral' | 'accent' | undefined;
  /** Optional leading icon URL (e.g. an engine favicon) rendered before the
   * label as a small square image (launcher-tab-to-search). */
  iconUrl?: string | undefined;
  /** When provided, renders a trailing remove (×) button that calls this. */
  onRemove?: (() => void) | undefined;
  /** Accessible label / tooltip for the remove button. Defaults to
   * `Remove <label>`. */
  removeLabel?: string | undefined;
  /** `data-testid` for the chip root. Default `'chip'`. */
  testid?: string | undefined;
}

const {
  label,
  tone = 'neutral',
  iconUrl,
  onRemove,
  removeLabel,
  testid = 'chip',
}: Props = $props();
</script>

<span class="chip" data-tone={tone} data-testid={testid}>
  {#if iconUrl}
    <img class="chip-icon" src={iconUrl} alt="" width="14" height="14" />
  {/if}
  <span class="chip-label">{label}</span>
  {#if onRemove}
    <button
      type="button"
      class="chip-remove"
      aria-label={removeLabel ?? `Remove ${label}`}
      title={removeLabel ?? `Remove ${label}`}
      data-testid="chip-remove"
      onclick={() => onRemove?.()}
    >
      <Icon name="x" size={12} />
    </button>
  {/if}
</span>

<style>
  .chip {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    max-width: 100%;
    height: var(--control-h-xs);
    padding: 0 var(--space-1) 0 var(--space-2);
    border-radius: var(--r-pill);
    background: var(--surface-2);
    color: var(--text);
    font: var(--weight-medium) var(--text-xs) / 1 var(--font-sans);
    transition: background var(--motion-fast) var(--ease-standard);
  }
  .chip:hover {
    background: var(--surface-3);
  }

  /* Accent tone — tints toward the active Space accent for the Tab-to-search
   * chip; falls back to a neutral ember accent outside a Space scope (the
   * `--accent-soft` token already carries that fallback). */
  .chip[data-tone='accent'] {
    background: var(--accent-soft);
  }
  .chip[data-tone='accent']:hover {
    background: oklch(from var(--accent) l c h / 0.28);
  }

  .chip-icon {
    flex: 0 0 auto;
    width: 14px;
    height: 14px;
    border-radius: 3px;
    object-fit: contain;
  }

  .chip-label {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .chip-remove {
    appearance: none;
    flex: 0 0 auto;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    margin: 0;
    padding: 0;
    border: 0;
    border-radius: var(--r-pill);
    background: transparent;
    color: var(--text-muted);
    cursor: pointer;
    transition:
      background var(--motion-fast) var(--ease-standard),
      color var(--motion-fast) var(--ease-standard),
      transform var(--motion-fast) var(--ease-standard);
  }
  .chip-remove:hover {
    background: var(--hover);
    color: var(--text);
  }
  .chip-remove:active {
    transform: scale(var(--press-scale));
  }
  .chip-remove:focus-visible {
    outline: var(--focus-width) solid var(--focus-color);
    outline-offset: var(--focus-offset);
  }
</style>
