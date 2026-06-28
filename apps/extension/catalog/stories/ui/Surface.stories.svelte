<script module lang="ts">
import { defineStory } from '../../lib/story';

export const meta = defineStory({
  title: 'Surface',
  group: 'Layout',
  controls: {
    variant: {
      type: 'select',
      options: ['glass', 'elevated', 'flat', 'section'],
      default: 'glass',
      typeLabel: "'glass' | 'elevated' | 'flat' | 'section'",
      description: 'Panel chrome treatment.',
    },
    radius: {
      type: 'select',
      options: ['sm', 'md', 'lg', 'xl', '2xl'],
      default: 'lg',
      typeLabel: "'sm' | 'md' | 'lg' | 'xl' | '2xl'",
      description: 'Corner radius.',
    },
    glow: { type: 'boolean', default: false, description: 'Soft Space-hue glow.' },
    clip: {
      type: 'boolean',
      default: false,
      description: 'overflow:hidden for full-bleed children.',
    },
  },
});
</script>

<script lang="ts">
import Surface from '@/ui/Surface.svelte';
import type { Args } from '../../lib/controls';
import Story from '../../lib/Story.svelte';
import Variant from '../../lib/Variant.svelte';

const { source }: { source: string } = $props();
</script>

<Story {meta} {source}>
  {#snippet preview(args: Args)}
    <Surface
      variant={args.variant as 'glass' | 'elevated' | 'flat' | 'section'}
      radius={args.radius as 'sm' | 'md' | 'lg' | 'xl' | '2xl'}
      glow={args.glow as boolean}
      clip={args.clip as boolean}
    >
      <span style="padding:8px">Surface content</span>
    </Surface>
  {/snippet}
  {#snippet examples()}
    <Variant label="glass">
      <Surface variant="glass"><span style="padding:8px">Frosted glass</span></Surface>
    </Variant>
    <Variant label="glass · glow">
      <Surface variant="glass" glow><span style="padding:8px">Glass with Space glow</span></Surface>
    </Variant>
    <Variant label="elevated">
      <Surface variant="elevated"><span style="padding:8px">Elevated card</span></Surface>
    </Variant>
    <Variant label="flat">
      <Surface variant="flat"><span style="padding:8px">Flat inset</span></Surface>
    </Variant>
    <Variant label="section">
      <Surface variant="section"><span style="padding:8px">Section card</span></Surface>
    </Variant>
  {/snippet}
</Story>
