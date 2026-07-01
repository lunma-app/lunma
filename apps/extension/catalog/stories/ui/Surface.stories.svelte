<script module lang="ts">
import { defineStory } from '../../lib/story';

export const meta = defineStory({
  title: 'Surface',
  group: 'Layout',
  controlOverrides: {
    glow: { description: 'Soft Space-hue glow.' },
    clip: { description: 'overflow:hidden for full-bleed children.' },
  },
  excludeControls: {
    variant:
      'SurfaceVariant is a module-script type alias, not an inline string-literal union on the Props interface itself — not mechanically derivable (syntactic-only parsing). See the per-variant Examples below.',
    radius:
      'SurfaceRadius is a module-script type alias, not an inline string-literal union on the Props interface itself — not mechanically derivable (syntactic-only parsing).',
    testid: 'data-testid passthrough — not meaningful to fiddle with here.',
    children:
      'Snippet prop — the panel content is rendered by the preview snippet below, not a control.',
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
    <Surface variant="glass" radius="lg" glow={args.glow as boolean} clip={args.clip as boolean}>
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
