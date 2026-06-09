<script lang="ts">
import type { Snippet } from 'svelte';
import RowMenu, { type RowMenuItem } from './RowMenu.svelte';

interface Props {
  items?: RowMenuItem[];
  onA?: () => void;
}

function noop(): void {
  /* test default */
}

let panelOpen = $state(false);
const { items, onA = noop }: Props = $props();

const defaultItems: RowMenuItem[] = [
  { id: 'a', label: 'Action A', icon: 'pencil', onSelect: () => onA() },
  {
    id: 'panel',
    label: 'Toggle panel',
    keepOpen: true,
    onSelect: () => {
      panelOpen = !panelOpen;
    },
  },
  { id: 'del', label: 'Delete', danger: true, onSelect: noop },
];
</script>

<RowMenu items={items ?? defaultItems} label="Row actions" testidPrefix="row-menu" header={hdr}>
  {#snippet panel()}
    {#if panelOpen}
      <div data-testid="row-menu-panel">panel content</div>
    {/if}
  {/snippet}
</RowMenu>

{#snippet hdr({ trigger }: { trigger: Snippet; expanded: boolean })}
  <div data-testid="row-header">
    <span>Header</span>
    {@render trigger()}
  </div>
{/snippet}
