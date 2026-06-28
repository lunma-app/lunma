<script module lang="ts">
import { defineStory } from '../../lib/story';

export const meta = defineStory({
  title: 'Diffstat',
  group: 'Atoms',
  controls: {
    additions: { type: 'number', default: 128, description: 'Additions count.' },
    deletions: { type: 'number', default: 84, description: 'Deletions count.' },
  },
});
</script>

<script lang="ts">
import Diffstat from '@/ui/Diffstat.svelte';
import type { Args } from '../../lib/controls';
import Story from '../../lib/Story.svelte';
import Variant from '../../lib/Variant.svelte';

const { source }: { source: string } = $props();
</script>

<Story {meta} {source}>
  {#snippet preview(args: Args)}
    <Diffstat additions={args.additions as number} deletions={args.deletions as number} />
  {/snippet}
  {#snippet examples()}
    <Variant label="balanced"><Diffstat additions={128} deletions={84} /></Variant>
    <Variant label="additions-heavy"><Diffstat additions={420} deletions={12} /></Variant>
    <Variant label="deletions-heavy"><Diffstat additions={6} deletions={310} /></Variant>
    <Variant label="additions only"><Diffstat additions={47} /></Variant>
    <Variant label="deletions only"><Diffstat deletions={23} /></Variant>
  {/snippet}
</Story>
