<script lang="ts">
import BitsContextMenu from './BitsContextMenu.svelte';
import type { MenuItem } from './menu-types';

interface Props {
  items: MenuItem[];
  label?: string;
}

const { items, label }: Props = $props();
</script>

<BitsContextMenu {items} {label}>
  {#snippet children(props)}
    <button {...props} type="button" data-testid="anchor">right-click me</button>
  {/snippet}
</BitsContextMenu>
