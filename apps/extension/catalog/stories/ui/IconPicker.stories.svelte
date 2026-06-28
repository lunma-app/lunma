<script module lang="ts">
import { defineStory } from '../../lib/story';

export const meta = defineStory({
  title: 'IconPicker',
  group: 'Composite',
  controls: {
    value: { type: 'text', default: 'house', description: 'Currently-selected icon name.' },
  },
});
</script>

<script lang="ts">
import IconPicker from '@/ui/IconPicker.svelte';
import type { Args } from '../../lib/controls';
import Story from '../../lib/Story.svelte';
import Variant from '../../lib/Variant.svelte';

const { source }: { source: string } = $props();

let exampleValue = $state('house');
</script>

<Story {meta} {source}>
  {#snippet preview(args: Args)}
    <div style="width: 20rem">
      <IconPicker value={args.value as string} onselect={(icon) => (args.value = icon)} />
    </div>
  {/snippet}
  {#snippet examples()}
    <Variant label="searchable grid (selection drives the value)">
      <div style="width: 20rem">
        <IconPicker value={exampleValue} onselect={(icon) => (exampleValue = icon)} />
      </div>
    </Variant>
  {/snippet}
</Story>
