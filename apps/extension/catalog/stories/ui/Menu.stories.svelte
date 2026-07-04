<script module lang="ts">
import { defineStory } from '../../lib/story';

export const meta = defineStory({
  title: 'Menu',
  group: 'Overlay',
  controlOverrides: {
    trigger: { default: 'kebab', description: 'Kebab dropdown or right-click context popover.' },
    ariaLabel: {
      default: 'Folder actions',
      description: 'Accessible name (trigger + popover), name-only.',
    },
    icon: { default: 'ellipsis-vertical', description: 'Kebab trigger glyph (trigger=kebab).' },
    headerKind: { description: 'Uppercase header eyebrow (empty = none).' },
    headerTitle: { description: 'Header title (empty = none).' },
  },
  excludeControls: {
    items: 'Array prop — no meaningful scalar control; the preview passes a fixed action list.',
    testid: 'data-testid passthrough — not meaningful to fiddle with here.',
    onOpenChange: 'Callback prop — no meaningful live control.',
    open: "Bindable open state — the menu's own trigger already drives open/close interactively.",
    children:
      'Snippet prop — the context-menu target is rendered by the preview snippet below, not a control.',
  },
});
</script>

<script lang="ts">
import Menu from '@/ui/Menu.svelte';
import type { MenuItem } from '@/ui/menu-types';
import type { Args } from '../../lib/controls';
import { noop } from '../../lib/mock';
import Story from '../../lib/Story.svelte';
import Variant from '../../lib/Variant.svelte';

const { source }: { source: string } = $props();

const items: MenuItem[] = [
  { id: 'edit', label: 'Edit', icon: 'pencil', onSelect: noop },
  { id: 'move-up', label: 'Move up', icon: 'arrow-up', onSelect: noop },
  { id: 'delete', label: 'Delete folder', icon: 'trash-2', danger: true, onSelect: noop },
];
</script>

<Story {meta} {source}>
  {#snippet preview(args: Args)}
    <Menu
      trigger={args.trigger as 'kebab' | 'context'}
      {items}
      ariaLabel={args.ariaLabel as string}
      icon={args.icon as string}
      headerKind={(args.headerKind as string) || undefined}
      headerTitle={(args.headerTitle as string) || undefined}
    >
      {#snippet children(props)}
        <button {...props} type="button" class="ctx-target">Right-click me</button>
      {/snippet}
    </Menu>
  {/snippet}
  {#snippet examples()}
    <Variant label="kebab trigger (dropdown)">
      <Menu trigger="kebab" {items} ariaLabel="Folder actions" />
    </Variant>
    <Variant label="kebab · with header">
      <Menu trigger="kebab" {items} ariaLabel="Folder actions" headerKind="FOLDER" headerTitle="Reading" />
    </Variant>
    <Variant label="context (right-click the target)">
      <Menu trigger="context" {items} ariaLabel="Tab actions" headerKind="TAB" headerTitle="svelte/svelte">
        {#snippet children(props)}
          <button {...props} type="button" class="ctx-target">Right-click me</button>
        {/snippet}
      </Menu>
    </Variant>
  {/snippet}
</Story>

<style>
  .ctx-target {
    padding: var(--space-3) var(--space-4);
    border: 1px dashed var(--border-strong);
    border-radius: var(--r-md);
    background: var(--surface-2);
    color: var(--text);
    cursor: context-menu;
  }
</style>
