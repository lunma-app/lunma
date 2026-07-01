<script module lang="ts">
import { defineStory } from '../../lib/story';

export const meta = defineStory({
  title: 'Avatar',
  group: 'Atoms',
  controlOverrides: {
    initials: { default: 'AK', description: '1–2 character initials.' },
    size: { description: 'Disc geometry.' },
    ring: { description: 'Verdict ring tint.' },
    title: { default: 'Ada Kale', description: 'Tooltip / accessible label.' },
  },
  excludeControls: {
    testid: 'data-testid passthrough — not meaningful to fiddle with here.',
  },
});
</script>

<script lang="ts">
import Avatar from '@/ui/Avatar.svelte';
import type { Args } from '../../lib/controls';
import Story from '../../lib/Story.svelte';
import Variant from '../../lib/Variant.svelte';

const { source }: { source: string } = $props();
</script>

<Story {meta} {source}>
  {#snippet preview(args: Args)}
    <Avatar
      initials={String(args.initials)}
      size={args.size as 'sm' | 'md'}
      ring={args.ring as 'approved' | 'changes' | 'pending' | 'none'}
      title={String(args.title)}
    />
  {/snippet}
  {#snippet examples()}
    <Variant label="md · no ring"><Avatar initials="AK" title="Ada Kale" /></Variant>
    <Variant label="sm · no ring"><Avatar initials="JR" size="sm" title="Jun Reyes" /></Variant>
    <!-- Each ring carries a corner glyph (✓ / ! / ◷) so the verdict is shape +
         colour, never hue alone (AVATAR-01). -->
    <Variant label="ring: approved"><Avatar initials="AK" ring="approved" title="Ada Kale — approved" /></Variant>
    <Variant label="ring: changes"><Avatar initials="JR" ring="changes" title="Jun Reyes — changes requested" /></Variant>
    <Variant label="ring: pending"><Avatar initials="MO" ring="pending" title="Mira Osei — pending" /></Variant>
    <Variant label="sm · ring: approved"><Avatar initials="AK" size="sm" ring="approved" title="Ada Kale — approved" /></Variant>
  {/snippet}
</Story>
