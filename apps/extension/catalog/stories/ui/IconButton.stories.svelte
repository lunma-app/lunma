<script module lang="ts">
import { defineStory } from '../../lib/story';

export const meta = defineStory({
  title: 'IconButton',
  group: 'Atoms',
  controls: {
    icon: { type: 'text', default: 'settings', description: 'Any Lucide icon name.' },
    ariaLabel: { type: 'text', default: 'Settings', description: 'Accessible name.' },
    size: { type: 'number', default: 16, description: 'Icon size in px.' },
    disabled: { type: 'boolean', default: false, description: 'Disabled state.' },
  },
});
</script>

<script lang="ts">
import IconButton from '@/ui/IconButton.svelte';
import type { Args } from '../../lib/controls';
import { noop } from '../../lib/mock';
import Story from '../../lib/Story.svelte';
import Variant from '../../lib/Variant.svelte';

const { source }: { source: string } = $props();
</script>

<Story {meta} {source}>
  {#snippet preview(args: Args)}
    <IconButton
      icon={args.icon as string}
      ariaLabel={args.ariaLabel as string}
      size={args.size as number}
      disabled={args.disabled as boolean}
      onclick={noop}
    />
  {/snippet}
  {#snippet examples()}
    <Variant label="ghost · 16">
      <IconButton icon="settings" ariaLabel="Settings" onclick={noop} />
    </Variant>
    <Variant label="ghost · 20">
      <IconButton icon="bell" ariaLabel="Notifications" size={20} onclick={noop} />
    </Variant>
    <Variant label="with tooltip title">
      <IconButton icon="star" ariaLabel="Favourite" title="Favourite" onclick={noop} />
    </Variant>
    <Variant label="disabled">
      <IconButton icon="trash-2" ariaLabel="Delete" disabled onclick={noop} />
    </Variant>
  {/snippet}
</Story>
