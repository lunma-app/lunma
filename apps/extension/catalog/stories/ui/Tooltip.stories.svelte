<script module lang="ts">
import { defineStory } from '../../lib/story';

export const meta = defineStory({
  title: 'Tooltip',
  group: 'Atoms',
  controls: {
    label: { type: 'text', default: 'Saved to this Space', description: 'Tooltip text.' },
    side: {
      type: 'select',
      options: ['top', 'bottom', 'left', 'right'],
      default: 'top',
      typeLabel: "'top' | 'bottom' | 'left' | 'right'",
      description: 'Tooltip side.',
    },
    enabled: { type: 'boolean', default: true, description: 'Suppress the tooltip when false.' },
  },
});
</script>

<script lang="ts">
import Tooltip from '@/ui/Tooltip.svelte';
import type { Args } from '../../lib/controls';
import Story from '../../lib/Story.svelte';
import Variant from '../../lib/Variant.svelte';

const { source }: { source: string } = $props();
</script>

<Story {meta} {source}>
  {#snippet preview(args: Args)}
    <Tooltip
      label={args.label as string}
      side={args.side as 'top' | 'bottom' | 'left' | 'right'}
      enabled={args.enabled as boolean}
    >
      {#snippet children(props)}
        <!-- Spread the trigger props onto a NATIVE focusable <button> (not a wrapper
             span around <Button>, which Button doesn't forward to) so one element
             carries aria-describedby + the focus/pointer handlers (TOOLTIP-NEW1). -->
        <button {...props} type="button" class="tw-trigger">Hover me</button>
      {/snippet}
    </Tooltip>
  {/snippet}
  {#snippet examples()}
    <Variant label="top (hover the button)">
      <Tooltip label="Saved to this Space">
        {#snippet children(props)}
          <!-- Spread the trigger props onto a NATIVE focusable <button> (not a wrapper
             span around <Button>, which Button doesn't forward to) so one element
             carries aria-describedby + the focus/pointer handlers (TOOLTIP-NEW1). -->
        <button {...props} type="button" class="tw-trigger">Hover me</button>
        {/snippet}
      </Tooltip>
    </Variant>
    <Variant label="right">
      <Tooltip label="Open lens overview" side="right">
        {#snippet children(props)}
          <!-- Spread the trigger props onto a NATIVE focusable <button> (not a wrapper
             span around <Button>, which Button doesn't forward to) so one element
             carries aria-describedby + the focus/pointer handlers (TOOLTIP-NEW1). -->
        <button {...props} type="button" class="tw-trigger">Hover me</button>
        {/snippet}
      </Tooltip>
    </Variant>
    <Variant label="disabled (no tooltip)">
      <Tooltip label="Never shown" enabled={false}>
        {#snippet children(props)}
          <!-- Spread the trigger props onto a NATIVE focusable <button> (not a wrapper
             span around <Button>, which Button doesn't forward to) so one element
             carries aria-describedby + the focus/pointer handlers (TOOLTIP-NEW1). -->
        <button {...props} type="button" class="tw-trigger">Hover me</button>
        {/snippet}
      </Tooltip>
    </Variant>
  {/snippet}
</Story>

<style>
  /* A plain native button so the bits-ui trigger props (focus/pointer handlers +
     aria-describedby) land on one focusable element (TOOLTIP-NEW1). */
  .tw-trigger {
    appearance: none;
    height: var(--control-h-sm);
    padding: 0 var(--space-3);
    border: 1px solid var(--border);
    border-radius: var(--r-md);
    background: var(--surface-2);
    color: var(--text);
    font: var(--weight-medium) var(--text-sm) / 1 var(--font-sans);
    cursor: pointer;
  }
  .tw-trigger:focus-visible {
    outline: var(--focus-width) solid var(--focus-color);
    outline-offset: var(--focus-offset);
  }
</style>
