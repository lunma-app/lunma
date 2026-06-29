<script module lang="ts">
import { defineStory } from '../../lib/story';

export const meta = defineStory({
  title: 'Toast',
  group: 'Composite',
  controls: {
    message: { type: 'text', default: 'Space archived.', description: 'Status line text.' },
    actionLabel: {
      type: 'text',
      default: '',
      description: 'Optional action button label (empty = none).',
    },
    duration: { type: 'number', default: 6000, description: 'Auto-dismiss delay (ms).' },
  },
});
</script>

<script lang="ts">
import Button from '@/ui/Button.svelte';
import Toast from '@/ui/Toast.svelte';
import type { Args } from '../../lib/controls';
import { noop } from '../../lib/mock';
import Story from '../../lib/Story.svelte';
import Variant from '../../lib/Variant.svelte';

const { source }: { source: string } = $props();

// Toast is fixed bottom-centre and auto-dismisses, so trigger on demand.
let live = $state(false);
let plain = $state(false);
let withAction = $state(false);
</script>

<Story {meta} {source}>
  {#snippet preview(args: Args)}
    <Button variant="secondary" size="sm" onclick={() => (live = true)}>Show toast</Button>
    {#if live}
      <Toast
        message={args.message as string}
        actionLabel={(args.actionLabel as string) || undefined}
        onAction={noop}
        onDismiss={() => (live = false)}
        duration={args.duration as number}
      />
    {/if}
  {/snippet}
  {#snippet examples()}
    <!-- Message-only: the container is itself a tab stop (with a focus ring) so a
         keyboard user can focus it to pause the timer and Escape-dismiss it — it
         renders no focusable child otherwise (TOAST-02). -->
    <Variant label="message only (appears bottom-centre)">
      <Button variant="secondary" size="sm" onclick={() => (plain = true)}>Show toast</Button>
      {#if plain}
        <Toast message="Space archived." onDismiss={() => (plain = false)} duration={4000} />
      {/if}
    </Variant>
    <Variant label="with action (undo)">
      <Button variant="secondary" size="sm" onclick={() => (withAction = true)}>Show toast</Button>
      {#if withAction}
        <Toast
          message="Tab removed from Reading."
          actionLabel="Undo"
          onAction={noop}
          onDismiss={() => (withAction = false)}
          duration={6000}
        />
      {/if}
    </Variant>
  {/snippet}
</Story>
