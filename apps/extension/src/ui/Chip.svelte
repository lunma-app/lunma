<script lang="ts">
import Icon from './Icon.svelte';

interface Props {
  /** The token's text. */
  label: string;
  /** Background tone. `neutral` (default) reads as `--surface-2`; `accent` tints
   * toward the active Space accent (`--accent-soft`) — used by the Tab-to-search
   * engine chip for Space cohesion (launcher-tab-to-search). Ignored when `hue`
   * is set (the hue-tinted token wins). */
  tone?: 'neutral' | 'accent' | undefined;
  /** Accent hue in OKLCH degrees (e.g. 150 = green, 25 = red) for a hue-tinted
   * **status/verdict token**. When set, the chip renders the theme-aware
   * `--accent-text-l` / `--accent-fill-a` recipe (legible in dark AND light) at
   * the `size` geometry, overriding the neutral chip box. Only meaningful on the
   * static chip (not the toggle pill). Omit → a normal chip. */
  hue?: number | undefined;
  /** Token size — only meaningful with `hue`. `sm` (default) is the
   * status/priority token; `md` is the larger Change verdict token. */
  size?: 'sm' | 'md' | undefined;
  /** Optional leading icon URL (e.g. an engine favicon) rendered before the
   * label as a small square image (launcher-tab-to-search). */
  iconUrl?: string | undefined;
  /** When provided, renders a trailing remove (×) button that calls this. */
  onRemove?: (() => void) | undefined;
  /** Accessible label / tooltip for the remove button. Defaults to
   * `Remove <label>`. */
  removeLabel?: string | undefined;
  /**
   * When provided, the chip becomes a **toggle pill** (multi-filter-smart-
   * connectors): the chip root renders as a `<button>` carrying `aria-pressed`,
   * and clicking it calls `onToggle`. Composes selectable filter pills (the
   * editor's filter multi-select). Mutually exclusive with `onRemove`. */
  onToggle?: (() => void) | undefined;
  /** Toggle pressed state — drives `aria-pressed`, the `--space-c-soft` selected
   * fill, and the leading check glyph. Only meaningful with `onToggle`. */
  selected?: boolean | undefined;
  /** Disables the toggle pill (e.g. a filter not applicable to a source):
   * `--text-dim`, no press, `aria-disabled`. Only meaningful with `onToggle`. */
  disabled?: boolean | undefined;
  /** Accessible name override for the toggle button (`aria-label`). Omit to let
   * the visible `label` name it; set it when the visible text alone is ambiguous
   * out of context (e.g. a boolean playground control whose label is `'true'`).
   * Only meaningful with `onToggle`. */
  ariaLabel?: string | undefined;
  /** `data-testid` for the chip root. Default `'chip'`. */
  testid?: string | undefined;
}

const {
  label,
  tone = 'neutral',
  hue,
  size = 'sm',
  iconUrl,
  onRemove,
  removeLabel,
  onToggle,
  selected = false,
  disabled = false,
  ariaLabel,
  testid = 'chip',
}: Props = $props();
</script>

{#if onToggle}
  <button
    type="button"
    class="chip chip-toggle"
    class:selected
    data-tone={tone}
    data-testid={testid}
    aria-pressed={selected}
    aria-label={ariaLabel}
    {disabled}
    onclick={() => {
      if (!disabled) onToggle?.();
    }}
  >
    {#if selected}
      <span class="chip-check" aria-hidden="true"><Icon name="check" size={12} /></span>
    {/if}
    <span class="chip-label">{label}</span>
  </button>
{:else}
  <span
    class="chip"
    class:hue={hue !== undefined}
    data-tone={tone}
    data-size={size}
    data-testid={testid}
    style:--chip-h={hue !== undefined ? String(hue) : undefined}
  >
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
{/if}

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

  /* Hue-tinted status/verdict token. Overrides the neutral chip box: theme-aware
   * accent recipe (`--accent-text-l` / `--accent-fill-a`, legible dark + light),
   * size-driven padding/font, and no fixed height. Placed after the tone rules so
   * it wins on equal specificity. */
  .chip.hue {
    height: auto;
    color: oklch(var(--accent-text-l) 0.1 var(--chip-h));
    background: oklch(0.55 0.13 var(--chip-h) / var(--accent-fill-a));
  }
  .chip.hue:hover {
    /* Static token — no hover shift. */
    background: oklch(0.55 0.13 var(--chip-h) / var(--accent-fill-a));
  }
  .chip.hue[data-size='sm'] {
    padding: 2px 9px;
    font: var(--weight-medium) var(--text-2xs) / 1.3 var(--font-sans);
  }
  .chip.hue[data-size='md'] {
    padding: 3px 11px;
    font: var(--weight-semibold) var(--text-xs) / 1.3 var(--font-sans);
  }

  /* Toggle pill (multi-filter-smart-connectors): a selectable filter chip. The
   * <button> resets its native chrome and inherits the .chip look; the selected
   * state fills with the Space-hue soft fill + a leading check glyph. */
  .chip-toggle {
    appearance: none;
    border: 0;
    cursor: pointer;
    /* Symmetric padding (no trailing remove button on a toggle pill). */
    padding: 0 var(--space-2);
    /* Unselected = an outlined ghost so selected (filled) reads as clearly
     * distinct, not a second shade of the same fill. The ring is an inset
     * box-shadow so toggling never changes the chip's box size. */
    background: transparent;
    color: var(--text-muted);
    /* Resting toggle ring uses `--border-strong` (the interactive-control
       boundary token) so it clears the 3:1 non-text minimum (WCAG 1.4.11),
       not the deliberately sub-floor `color-mix(--text-faint …)`. */
    box-shadow: inset 0 0 0 1px var(--border-strong);
    transition:
      background var(--motion-fast) var(--ease-standard),
      box-shadow var(--motion-fast) var(--ease-standard),
      color var(--motion-fast) var(--ease-standard),
      opacity var(--motion-fast) var(--ease-standard),
      transform var(--motion-fast) var(--ease-standard);
  }
  .chip-toggle:hover:not(:disabled) {
    background: var(--surface-2);
    color: var(--text);
  }
  .chip-toggle:active:not(:disabled) {
    transform: scale(var(--press-scale));
  }
  .chip-toggle:focus-visible {
    outline: var(--focus-width) solid var(--focus-color);
    outline-offset: var(--focus-offset);
  }
  .chip-toggle:disabled {
    color: var(--text-dim);
    cursor: default;
  }
  .chip-toggle.selected {
    background: var(--space-c-soft);
    color: var(--text);
    box-shadow: inset 0 0 0 1px color-mix(in oklch, var(--space-c) 45%, transparent);
  }
  .chip-toggle.selected:hover:not(:disabled) {
    background: oklch(from var(--space-c-soft) l c h / 0.85);
  }

  .chip-check {
    flex: 0 0 auto;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    /* The check is only rendered when selected — tint it the Space accent so the
     * selected state reads at a glance. */
    color: var(--space-c);
  }

  .chip-icon {
    flex: 0 0 auto;
    width: 14px;
    height: 14px;
    border-radius: var(--r-2xs);
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

  @media (prefers-reduced-motion: reduce) {
    .chip,
    .chip-toggle,
    .chip-remove {
      transition: none;
    }
    .chip-toggle:active:not(:disabled),
    .chip-remove:active {
      transform: none;
    }
  }
</style>
