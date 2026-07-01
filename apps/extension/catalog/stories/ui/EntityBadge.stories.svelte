<script module lang="ts">
import { defineStory } from '../../lib/story';

export const meta = defineStory({
  title: 'EntityBadge',
  group: 'Atoms',
  excludeControls: {
    entity:
      'Entity is a module-script type alias, not an inline string-literal union on the Props interface itself — not mechanically derivable (syntactic-only parsing). See the Examples below for each entity.',
    testid: 'data-testid passthrough — not meaningful to fiddle with here.',
  },
});
</script>

<script lang="ts">
import EntityBadge from '@/ui/EntityBadge.svelte';
import Story from '../../lib/Story.svelte';
import Variant from '../../lib/Variant.svelte';

const { source }: { source: string } = $props();
</script>

<Story {meta} {source}>
  {#snippet examples()}
    <!-- Distinct glyph AND hue per entity: a pull-request mark on change-blue, an
         issue-dot on ticket-purple, an article mark on article-green. Shape carries
         the meaning so the PR/ticket distinction survives colour-blindness. -->
    <Variant label="change"><EntityBadge entity="change" /></Variant>
    <Variant label="ticket"><EntityBadge entity="ticket" /></Variant>
    <Variant label="article"><EntityBadge entity="article" /></Variant>
  {/snippet}
</Story>
