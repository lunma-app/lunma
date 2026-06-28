<script module lang="ts">
import { defineStory } from '../../lib/story';

export const meta = defineStory({
  title: 'BitsContextMenu',
  group: 'Composite',
  controls: {
    label: { type: 'text', default: 'Tab actions', description: 'Menu accessible label.' },
    headerKind: { type: 'text', default: 'TAB', description: 'Uppercase eyebrow on the header.' },
    headerTitle: { type: 'text', default: 'svelte/svelte', description: 'Header title.' },
  },
});
</script>

<script lang="ts">
import BitsContextMenu from '@/ui/BitsContextMenu.svelte';
import type { MenuItem } from '@/ui/menu-types';
import type { Args } from '../../lib/controls';
import { noop } from '../../lib/mock';
import Story from '../../lib/Story.svelte';
import Variant from '../../lib/Variant.svelte';

const { source }: { source: string } = $props();

const items: MenuItem[] = [
  { id: 'rename', label: 'Rename', icon: 'pencil', onSelect: noop },
  { id: 'duplicate', label: 'Duplicate', icon: 'copy', onSelect: noop },
  { id: 'delete', label: 'Delete', icon: 'trash-2', onSelect: noop, danger: true },
];
</script>

<Story {meta} {source}>
  {#snippet preview(args: Args)}
    <BitsContextMenu
      {items}
      label={args.label as string}
      headerKind={args.headerKind as string}
      headerTitle={args.headerTitle as string}
    >
      {#snippet children(props)}
        <button {...props} type="button" class="target">Right-click me</button>
      {/snippet}
    </BitsContextMenu>
  {/snippet}
  {#snippet examples()}
    <Variant label="right-click the target">
      <BitsContextMenu {items} label="Tab actions" headerKind="TAB" headerTitle="svelte/svelte">
        {#snippet children(props)}
          <button {...props} type="button" class="target">Right-click me</button>
        {/snippet}
      </BitsContextMenu>
    </Variant>
  {/snippet}
</Story>

<style>
  .target {
    padding: var(--space-3) var(--space-4);
    border: 1px dashed var(--border-strong);
    border-radius: var(--r-md);
    background: var(--surface-2);
    color: var(--text);
    cursor: context-menu;
  }
</style>
