<script module lang="ts">
import { defineStory } from '../../lib/story';

export const meta = defineStory({
  title: 'CardHeading',
  group: 'Layout',
  controlOverrides: {
    heading: { default: 'Connections', description: 'Card heading text (sentence case).' },
  },
  excludeControls: {
    actions: 'Snippet prop — see the "heading + actions" example below.',
    testid: 'data-testid passthrough — not meaningful to fiddle with here.',
  },
});
</script>

<script lang="ts">
import Button from '@/ui/Button.svelte';
import CardHeading from '@/ui/CardHeading.svelte';
import type { Args } from '../../lib/controls';
import { noop } from '../../lib/mock';
import Story from '../../lib/Story.svelte';
import Variant from '../../lib/Variant.svelte';

const { source }: { source: string } = $props();
</script>

{#snippet addAction()}
  <Button variant="ghost" size="sm" onclick={noop}>Connect</Button>
{/snippet}

<Story {meta} {source}>
  {#snippet preview(args: Args)}
    <div style="width: 18rem">
      <CardHeading heading={args.heading as string} />
    </div>
  {/snippet}
  {#snippet examples()}
    <Variant label="heading">
      <div style="width: 18rem">
        <CardHeading heading="Connections" />
      </div>
    </Variant>
    <Variant label="heading + actions">
      <div style="width: 18rem">
        <CardHeading heading="Connections" actions={addAction} />
      </div>
    </Variant>
  {/snippet}
</Story>
