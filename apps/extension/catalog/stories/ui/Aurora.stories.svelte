<script module lang="ts">
import { defineStory } from '../../lib/story';

export const meta = defineStory({
  title: 'Aurora',
  group: 'Layout',
  controls: {
    intensity: {
      type: 'select',
      options: ['subtle', 'standard', 'vivid'],
      default: 'vivid',
      typeLabel: "'subtle' | 'standard' | 'vivid'",
      description: 'Backdrop opacity tier (omit to inherit --aurora-opacity).',
    },
  },
});
</script>

<script lang="ts">
import Aurora from '@/ui/Aurora.svelte';
import type { Args } from '../../lib/controls';
import Story from '../../lib/Story.svelte';
import Variant from '../../lib/Variant.svelte';

const { source }: { source: string } = $props();
</script>

<Story {meta} {source}>
  {#snippet preview(args: Args)}
    <div class="frame lunma-space-scope">
      <Aurora intensity={args.intensity as 'subtle' | 'standard' | 'vivid'} />
    </div>
  {/snippet}
  {#snippet examples()}
    <!-- Aurora is an absolutely-positioned backdrop; each cell gives it a sized,
         positioned, hue-scoped frame. The toolbar hue/intensity also drives these. -->
    <Variant label="subtle">
      <div class="frame lunma-space-scope"><Aurora intensity="subtle" /></div>
    </Variant>
    <Variant label="standard">
      <div class="frame lunma-space-scope"><Aurora intensity="standard" /></div>
    </Variant>
    <Variant label="vivid">
      <div class="frame lunma-space-scope"><Aurora intensity="vivid" /></div>
    </Variant>
  {/snippet}
</Story>

<style>
  .frame {
    position: relative;
    width: 100%;
    height: 8rem;
    border-radius: var(--r-lg);
    overflow: hidden;
  }
</style>
