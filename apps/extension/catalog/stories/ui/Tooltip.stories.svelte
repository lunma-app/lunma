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
import Button from '@/ui/Button.svelte';
import Tooltip from '@/ui/Tooltip.svelte';
import type { Args } from '../../lib/controls';
import { noop } from '../../lib/mock';
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
        <span {...props}><Button variant="secondary" size="sm" onclick={noop}>Hover me</Button></span>
      {/snippet}
    </Tooltip>
  {/snippet}
  {#snippet examples()}
    <Variant label="top (hover the button)">
      <Tooltip label="Saved to this Space">
        {#snippet children(props)}
          <span {...props}><Button variant="secondary" size="sm" onclick={noop}>Hover me</Button></span>
        {/snippet}
      </Tooltip>
    </Variant>
    <Variant label="right">
      <Tooltip label="Open lens overview" side="right">
        {#snippet children(props)}
          <span {...props}><Button variant="secondary" size="sm" onclick={noop}>Hover me</Button></span>
        {/snippet}
      </Tooltip>
    </Variant>
    <Variant label="disabled (no tooltip)">
      <Tooltip label="Never shown" enabled={false}>
        {#snippet children(props)}
          <span {...props}><Button variant="secondary" size="sm" onclick={noop}>Hover me</Button></span>
        {/snippet}
      </Tooltip>
    </Variant>
  {/snippet}
</Story>
