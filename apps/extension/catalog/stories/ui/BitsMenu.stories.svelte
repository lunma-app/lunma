<script module lang="ts">
import { defineStory } from '../../lib/story';

export const meta = defineStory({
  title: 'BitsMenu',
  group: 'Composite',
  controls: {
    label: { type: 'text', default: 'Folder actions', description: 'Kebab trigger + menu label.' },
    icon: {
      type: 'text',
      default: 'ellipsis-vertical',
      description: 'Trigger glyph (any Lucide name).',
    },
    headerKind: { type: 'text', default: '', description: 'Uppercase eyebrow (empty = none).' },
    headerTitle: { type: 'text', default: '', description: 'Header title (empty = none).' },
  },
});
</script>

<script lang="ts">
import BitsMenu from '@/ui/BitsMenu.svelte';
import type { MenuItem } from '@/ui/menu-types';
import type { Args } from '../../lib/controls';
import { noop } from '../../lib/mock';
import Story from '../../lib/Story.svelte';
import Variant from '../../lib/Variant.svelte';

const { source }: { source: string } = $props();

const items: MenuItem[] = [
  { id: 'pin', label: 'Pin to Space', icon: 'pin', onSelect: noop },
  { id: 'edit', label: 'Edit…', icon: 'pencil', onSelect: noop },
  { id: 'delete', label: 'Delete', icon: 'trash-2', onSelect: noop, danger: true },
];
</script>

<Story {meta} {source}>
  {#snippet preview(args: Args)}
    <BitsMenu
      {items}
      label={args.label as string}
      icon={args.icon as string}
      headerKind={(args.headerKind as string) || undefined}
      headerTitle={(args.headerTitle as string) || undefined}
    />
  {/snippet}
  {#snippet examples()}
    <Variant label="kebab trigger">
      <BitsMenu {items} label="Folder actions" />
    </Variant>
    <Variant label="with header">
      <BitsMenu {items} label="Folder actions" headerKind="FOLDER" headerTitle="Reading" />
    </Variant>
    <Variant label="custom trigger glyph">
      <BitsMenu {items} icon="settings" label="Settings" />
    </Variant>
  {/snippet}
</Story>
