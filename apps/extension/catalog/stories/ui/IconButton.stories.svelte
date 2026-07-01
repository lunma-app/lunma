<script module lang="ts">
import { defineStory } from '../../lib/story';

export const meta = defineStory({
  title: 'IconButton',
  group: 'Atoms',
  controlOverrides: {
    icon: { default: 'settings', description: 'Any Lucide icon name.' },
    ariaLabel: { default: 'Settings', description: 'Accessible name.' },
    size: { default: 16, description: 'Icon size in px.' },
    disabled: { description: 'Disabled state.' },
  },
  excludeControls: {
    onclick: 'Callback prop — no meaningful live control.',
    testid: 'data-testid passthrough — not meaningful to fiddle with here.',
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
      title={(args.title as string) || undefined}
      variant={args.variant as 'ghost'}
      size={args.size as number}
      type={args.type as 'button' | 'submit'}
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
    <!-- No `ariaLabel`: the native `title` becomes the accessible name. (Omitting
         both would dev-warn — ICONBUTTON-NEW1.) -->
    <Variant label="name from title only">
      <IconButton icon="bookmark" title="Bookmark" onclick={noop} />
    </Variant>
    <Variant label="disabled">
      <IconButton icon="trash-2" ariaLabel="Delete" disabled onclick={noop} />
    </Variant>
  {/snippet}
</Story>
