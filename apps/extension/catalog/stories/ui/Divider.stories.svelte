<script module lang="ts">
import { defineStory } from '../../lib/story';

export const meta = defineStory({
  title: 'Divider',
  group: 'Atoms',
  controls: {
    withAction: {
      type: 'boolean',
      default: true,
      description: 'Render a trailing action at the rule’s right edge.',
    },
  },
});
</script>

<script lang="ts">
import Button from '@/ui/Button.svelte';
import Divider from '@/ui/Divider.svelte';
import type { Args } from '../../lib/controls';
import { noop } from '../../lib/mock';
import Story from '../../lib/Story.svelte';
import Variant from '../../lib/Variant.svelte';

const { source }: { source: string } = $props();
</script>

{#snippet addAction()}
  <Button variant="ghost" size="sm" onclick={noop}>Add</Button>
{/snippet}

<Story {meta} {source}>
  {#snippet preview(args: Args)}
    <div style="width: 16rem">
      {#if args.withAction}
        <Divider action={addAction} />
      {:else}
        <Divider />
      {/if}
    </div>
  {/snippet}
  {#snippet examples()}
    <Variant label="plain rule">
      <div style="width: 14rem"><Divider /></div>
    </Variant>
    <Variant label="rule trailing into action">
      <div style="width: 14rem"><Divider action={addAction} /></div>
    </Variant>
  {/snippet}
</Story>
