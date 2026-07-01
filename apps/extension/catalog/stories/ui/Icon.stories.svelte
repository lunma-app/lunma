<script module lang="ts">
import { defineStory } from '../../lib/story';

export const meta = defineStory({
  title: 'Icon',
  group: 'Atoms',
  controlOverrides: {
    name: { default: 'star', description: 'Any Lucide icon name.' },
    size: { default: 24, description: 'Icon size in px.' },
    color: { default: 'currentColor', description: 'CSS colour (token or literal).' },
    label: { default: 'star', description: 'Accessible label (sets role="img").' },
  },
});
</script>

<script lang="ts">
import Icon from '@/ui/Icon.svelte';
import type { Args } from '../../lib/controls';
import { ICON_NAMES } from '../../lib/mock';
import Story from '../../lib/Story.svelte';
import Variant from '../../lib/Variant.svelte';

const { source }: { source: string } = $props();
</script>

<Story {meta} {source}>
  {#snippet preview(args: Args)}
    <Icon
      name={args.name as string}
      size={args.size as number}
      color={args.color as string}
      label={args.label as string}
    />
  {/snippet}
  {#snippet examples()}
    <Variant label="curated set · 20px">
      {#each ICON_NAMES as name (name)}
        <Icon {name} size={20} label={name} />
      {/each}
    </Variant>
    <Variant label="size 16">
      <Icon name="star" size={16} label="star" />
    </Variant>
    <Variant label="size 40">
      <Icon name="star" size={40} label="star" />
    </Variant>
    <Variant label="accent colour">
      <Icon name="bell" size={24} color="var(--accent)" label="bell" />
    </Variant>
  {/snippet}
</Story>
