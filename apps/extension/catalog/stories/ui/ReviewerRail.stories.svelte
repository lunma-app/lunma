<script module lang="ts">
import { defineStory } from '../../lib/story';

export const meta = defineStory({
  title: 'ReviewerRail',
  group: 'Composite',
  controls: {
    max: { type: 'number', default: 4, description: 'Avatars shown before the +N overflow badge.' },
  },
});
</script>

<script lang="ts">
import ReviewerRail from '@/ui/ReviewerRail.svelte';
import type { Args } from '../../lib/controls';
import { REVIEWERS } from '../../lib/mock';
import Story from '../../lib/Story.svelte';
import Variant from '../../lib/Variant.svelte';

const { source }: { source: string } = $props();
</script>

<Story {meta} {source}>
  {#snippet preview(args: Args)}
    <ReviewerRail reviewers={REVIEWERS} max={args.max as number} ariaLabel="Reviewers" />
  {/snippet}
  {#snippet examples()}
    <Variant label="all approved">
      <ReviewerRail reviewers={REVIEWERS.filter((r) => r.state === 'approved')} />
    </Variant>
    <Variant label="blocking-wins (changes requested)">
      <ReviewerRail reviewers={REVIEWERS.slice(0, 3)} />
    </Variant>
    <Variant label="pending only">
      <ReviewerRail reviewers={REVIEWERS.filter((r) => r.state === 'pending')} />
    </Variant>
    <!-- Composition coverage (component-catalog 4.5): a full overlapped rail that
         overflows the cap into a +N badge. -->
    <Variant label="composed · overflow (+N) · max 4">
      <ReviewerRail reviewers={REVIEWERS} max={4} />
    </Variant>
    <Variant label="composed · max 2">
      <ReviewerRail reviewers={REVIEWERS} max={2} />
    </Variant>
    <!-- `ariaLabel` makes the cluster a named `role="group"` (REVIEWERRAIL-02);
         the +N badge announces "N more reviewers" (REVIEWERRAIL-01). -->
    <Variant label="named group (ariaLabel)">
      <ReviewerRail reviewers={REVIEWERS} max={4} ariaLabel="Reviewers" />
    </Variant>
  {/snippet}
</Story>
