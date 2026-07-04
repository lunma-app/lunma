<script module lang="ts">
import { defineStory } from '../../lib/story';

export const meta = defineStory({
  title: 'EntityBadge',
  group: 'Atoms',
  // `entity` is a module-script type alias the deriver can't parse; author it
  // here so the primitive still gets a live Playground + API table.
  controls: {
    entity: {
      type: 'select',
      default: 'change',
      options: ['change', 'ticket', 'article'],
      typeLabel: 'Entity',
      description: 'Which entity glyph + hue to render.',
    },
  },
  excludeControls: {
    testid: 'data-testid passthrough — not meaningful to fiddle with here.',
  },
});
</script>

<script lang="ts">
import EntityBadge from '@/ui/EntityBadge.svelte';
import type { Args } from '../../lib/controls';
import Story from '../../lib/Story.svelte';
import Variant from '../../lib/Variant.svelte';

const { source }: { source: string } = $props();
</script>

<Story {meta} {source}>
  {#snippet preview(args: Args)}
    <EntityBadge entity={args.entity as 'change' | 'ticket' | 'article'} />
  {/snippet}
  {#snippet examples()}
    <!-- Distinct glyph AND hue per entity: a pull-request mark on change-blue, an
         issue-dot on ticket-purple, an article mark on article-green. Shape carries
         the meaning so the PR/ticket distinction survives colour-blindness. -->
    <Variant label="change"><EntityBadge entity="change" /></Variant>
    <Variant label="ticket"><EntityBadge entity="ticket" /></Variant>
    <Variant label="article"><EntityBadge entity="article" /></Variant>
  {/snippet}
</Story>
