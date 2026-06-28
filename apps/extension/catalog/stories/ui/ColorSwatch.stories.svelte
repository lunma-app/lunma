<script module lang="ts">
import { defineStory } from '../../lib/story';

export const meta = defineStory({
  title: 'ColorSwatch',
  group: 'Atoms',
  controls: {
    color: {
      type: 'select',
      options: [
        'red',
        'orange',
        'yellow',
        'green',
        'teal',
        'cyan',
        'blue',
        'purple',
        'pink',
        'gray',
      ],
      default: 'purple',
      typeLabel: 'SpaceColor',
      description: 'The Space colour this swatch represents.',
    },
    selected: { type: 'boolean', default: true, description: 'Selected (ring + full scale).' },
  },
});
</script>

<script lang="ts">
import type { SpaceColor } from '@/shared/types';
import ColorSwatch from '@/ui/ColorSwatch.svelte';
import type { Args } from '../../lib/controls';
import { noop, SPACE_COLORS } from '../../lib/mock';
import Story from '../../lib/Story.svelte';
import Variant from '../../lib/Variant.svelte';

const { source }: { source: string } = $props();

let selected = $state<SpaceColor>('blue');
</script>

<Story {meta} {source}>
  {#snippet preview(args: Args)}
    <ColorSwatch color={args.color as SpaceColor} selected={args.selected as boolean} onclick={noop} />
  {/snippet}
  {#snippet examples()}
    <Variant label="full palette · selectable">
      {#each SPACE_COLORS as c (c)}
        <ColorSwatch color={c} selected={selected === c} onclick={() => (selected = c)} />
      {/each}
    </Variant>
    <Variant label="selected"><ColorSwatch color="purple" selected onclick={noop} /></Variant>
    <Variant label="unselected"><ColorSwatch color="purple" onclick={noop} /></Variant>
  {/snippet}
</Story>
