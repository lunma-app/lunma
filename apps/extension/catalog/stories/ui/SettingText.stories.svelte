<script module lang="ts">
import { defineStory } from '../../lib/story';

export const meta = defineStory({
  title: 'SettingText',
  group: 'Atoms',
  controlOverrides: {
    label: { default: 'Colour intensity', description: 'Setting label.' },
    description: {
      default: "How strongly the active Space's hue washes the workspace.",
      description: 'Optional secondary description.',
    },
  },
});
</script>

<script lang="ts">
import SettingText from '@/ui/SettingText.svelte';
import type { Args } from '../../lib/controls';
import Story from '../../lib/Story.svelte';
import Variant from '../../lib/Variant.svelte';

const { source }: { source: string } = $props();
</script>

<Story {meta} {source}>
  {#snippet preview(args: Args)}
    <SettingText label={args.label as string} description={args.description as string} />
  {/snippet}
  {#snippet examples()}
    <Variant label="label + description">
      <SettingText
        label="Colour intensity"
        description="How strongly the active Space's hue washes the workspace."
      />
    </Variant>
    <Variant label="label only">
      <SettingText label="Reduced motion" />
    </Variant>
  {/snippet}
</Story>
