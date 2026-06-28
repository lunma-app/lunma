<script module lang="ts">
import { defineStory } from '../../lib/story';

export const meta = defineStory({
  title: 'Kbd',
  group: 'Atoms',
  controls: {
    label: {
      type: 'text',
      default: '⌥L',
      description: 'Keybinding text (the `children` content).',
    },
  },
});
</script>

<script lang="ts">
import Kbd from '@/ui/Kbd.svelte';
import type { Args } from '../../lib/controls';
import Story from '../../lib/Story.svelte';
import Variant from '../../lib/Variant.svelte';

const { source }: { source: string } = $props();
</script>

<Story {meta} {source}>
  {#snippet preview(args: Args)}
    <Kbd>{args.label}</Kbd>
  {/snippet}
  {#snippet examples()}
    <Variant label="shortcut">
      <Kbd>⌥L</Kbd>
    </Variant>
    <Variant label="enter">
      <Kbd>⏎</Kbd>
    </Variant>
    <Variant label="tab">
      <Kbd>⇥</Kbd>
    </Variant>
    <Variant label="inline run">
      <span style="display:inline-flex; gap:6px; align-items:center">
        <Kbd>⌘</Kbd><Kbd>K</Kbd>
      </span>
    </Variant>
  {/snippet}
</Story>
