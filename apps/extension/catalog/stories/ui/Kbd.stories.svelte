<script module lang="ts">
import { defineStory } from '../../lib/story';

export const meta = defineStory({
  title: 'Kbd',
  group: 'Atoms',
  excludeControls: {
    children:
      'Snippet prop — the keybinding glyph is rendered by the preview snippet below, not a control.',
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
    <Kbd ariaLabel={(args.ariaLabel as string) || undefined}>⌥L</Kbd>
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
    <!-- `ariaLabel` spells the pictograph out for screen readers (shows `⌥L`,
         announces "Option L"). -->
    <Variant label="named glyph (ariaLabel)">
      <Kbd ariaLabel="Option L">⌥L</Kbd>
    </Variant>
  {/snippet}
</Story>
