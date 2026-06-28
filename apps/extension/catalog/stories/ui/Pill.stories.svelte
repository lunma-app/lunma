<script module lang="ts">
import { defineStory } from '../../lib/story';

export const meta = defineStory({
  title: 'Pill',
  group: 'Atoms',
  controls: {
    hue: {
      type: 'number',
      default: 150,
      description: 'OKLCH hue degrees (omit-equivalent 0 reads neutral-ish).',
    },
    size: {
      type: 'select',
      options: ['sm', 'md'],
      default: 'sm',
      typeLabel: "'sm' | 'md'",
      description: 'Pill density (md = verdict).',
    },
    label: { type: 'text', default: 'Open', description: 'Pill content (`children`).' },
  },
});
</script>

<script lang="ts">
import Pill from '@/ui/Pill.svelte';
import type { Args } from '../../lib/controls';
import Story from '../../lib/Story.svelte';
import Variant from '../../lib/Variant.svelte';

const { source }: { source: string } = $props();
</script>

<Story {meta} {source}>
  {#snippet preview(args: Args)}
    <Pill hue={args.hue as number} size={args.size as 'sm' | 'md'}>{args.label}</Pill>
  {/snippet}
  {#snippet examples()}
    <Variant label="neutral · sm">
      <Pill>Draft</Pill>
    </Variant>
    <Variant label="green · sm">
      <Pill hue={150}>Open</Pill>
    </Variant>
    <Variant label="red · sm">
      <Pill hue={25}>Blocked</Pill>
    </Variant>
    <Variant label="blue · md (verdict)">
      <Pill hue={252} size="md">Approved</Pill>
    </Variant>
    <Variant label="purple · md">
      <Pill hue={295} size="md">Review</Pill>
    </Variant>
  {/snippet}
</Story>
