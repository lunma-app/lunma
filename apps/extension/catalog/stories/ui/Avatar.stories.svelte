<script module lang="ts">
import { defineStory } from '../../lib/story';

export const meta = defineStory({
  title: 'Avatar',
  group: 'Atoms',
  controls: {
    initials: { type: 'text', default: 'AK', description: '1–2 character initials.' },
    size: {
      type: 'select',
      options: ['sm', 'md'],
      default: 'md',
      typeLabel: "'sm' | 'md'",
      description: 'Disc geometry.',
    },
    ring: {
      type: 'select',
      options: ['none', 'approved', 'changes', 'pending'],
      default: 'none',
      typeLabel: "'approved' | 'changes' | 'pending' | 'none'",
      description: 'Verdict ring tint.',
    },
    title: { type: 'text', default: 'Ada Kale', description: 'Tooltip / accessible label.' },
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
    <Variant label="ring: approved"><Avatar initials="AK" ring="approved" title="Ada Kale — approved" /></Variant>
    <Variant label="ring: changes"><Avatar initials="JR" ring="changes" title="Jun Reyes — changes requested" /></Variant>
    <Variant label="ring: pending"><Avatar initials="MO" ring="pending" title="Mira Osei — pending" /></Variant>
  {/snippet}
</Story>
