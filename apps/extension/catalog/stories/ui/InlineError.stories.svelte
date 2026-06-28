<script module lang="ts">
import { defineStory } from '../../lib/story';

export const meta = defineStory({
  title: 'InlineError',
  group: 'Layout',
  controls: {
    message: {
      type: 'text',
      default: "That token didn't work.",
      description: 'Error message text.',
    },
  },
});
</script>

<script lang="ts">
import InlineError from '@/ui/InlineError.svelte';
import type { Args } from '../../lib/controls';
import Story from '../../lib/Story.svelte';
import Variant from '../../lib/Variant.svelte';

const { source }: { source: string } = $props();
</script>

<Story {meta} {source}>
  {#snippet preview(args: Args)}
    <div style="width: 18rem">
      <InlineError message={args.message as string} />
    </div>
  {/snippet}
  {#snippet examples()}
    <Variant label="short">
      <div style="width: 18rem">
        <InlineError message="That token didn't work." />
      </div>
    </Variant>
    <Variant label="longer">
      <div style="width: 18rem">
        <InlineError message="Couldn't reach github.com — check the base URL and that the token has repo scope." />
      </div>
    </Variant>
  {/snippet}
</Story>
