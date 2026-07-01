<script module lang="ts">
import { defineStory } from '../../lib/story';

export const meta = defineStory({
  title: 'ColorSwatch',
  group: 'Atoms',
  controlOverrides: {
    selected: { default: true, description: 'Selected (ring + full scale).' },
  },
  excludeControls: {
    color:
      'SpaceColor is an imported type alias, not an inline string-literal union — not mechanically derivable (syntactic-only parsing). See the full-palette example below.',
    onclick: 'Callback prop — no meaningful live control.',
    tabindex: 'Roving-tabindex wiring — not meaningful to fiddle with in an isolated preview.',
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
    <ColorSwatch color="purple" selected={args.selected as boolean} onclick={noop} />
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
