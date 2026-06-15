<script lang="ts">
import { Tooltip as Bits } from 'bits-ui';
import type { Snippet } from 'svelte';

interface Props {
  /** The text shown in the tooltip. */
  label: string;
  /** Tooltip side relative to the trigger. Default 'top'. The explicit
   * `| undefined` mirrors `enabled` below: callers (e.g. the test harness)
   * may forward an optional `side` that is structurally `undefined` under
   * `exactOptionalPropertyTypes`, which falls through to the `'top'` default. */
  side?: 'top' | 'bottom' | 'left' | 'right' | undefined;
  /** When `false`, the tooltip is suppressed (renders the trigger plain). */
  enabled?: boolean | undefined;
  /** Trigger snippet. Receives the Bits.Tooltip.Trigger props which you
   * MUST spread onto your interactive element, e.g. `<button {...props}>`.
   * This forwards the right event handlers, ARIA description, and id. */
  children: Snippet<[Record<string, unknown>]>;
}

const { label, side = 'top', enabled = true, children }: Props = $props();
</script>

{#if enabled}
  <Bits.Provider delayDuration={0} skipDelayDuration={0}>
    <Bits.Root>
      <Bits.Trigger>
        {#snippet child({ props })}
          {@render children(props)}
        {/snippet}
      </Bits.Trigger>
      <Bits.Portal>
        <Bits.Content {side} sideOffset={6} class="lunma-tooltip-content">
          {#snippet child({ props })}
            <div {...props} class="lunma-tooltip">
              {label}
            </div>
          {/snippet}
        </Bits.Content>
      </Bits.Portal>
    </Bits.Root>
  </Bits.Provider>
{:else}
  {@render children({})}
{/if}

<style>
  /* Portaled to document.body — styles must be global. */
  :global(.lunma-tooltip) {
    background: var(--surface-3);
    color: var(--text);
    border: 1px solid var(--border-soft);
    border-radius: var(--r-sm);
    padding: 4px 8px;
    font: var(--weight-medium) var(--text-xs) / 1 var(--font-sans);
    white-space: nowrap;
    pointer-events: none;
    z-index: var(--z-dropdown);
    box-shadow: var(--shadow-md);
  }

  /* Slight transform-only entrance, anchored to bits-ui's presence state
   * rather than the (incidental) per-open mount. With delayDuration /
   * skipDelayDuration 0 an open resolves to `instant-open`; bits-ui spreads
   * `data-state` onto the content via `props`. Bits owns mount/unmount, and
   * there is no opacity-only fade or exit animation (the user wanted it to
   * read as instantaneous). */
  :global(.lunma-tooltip[data-state='instant-open']) {
    animation: lunma-tooltip-in var(--motion-fast) var(--ease-emphasised);
  }

  @keyframes lunma-tooltip-in {
    from {
      transform: translateY(-2px);
      opacity: 0.6;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    /* Match the entrance selector's specificity so the guard reliably wins. */
    :global(.lunma-tooltip[data-state='instant-open']) {
      animation: none;
    }
  }
</style>
