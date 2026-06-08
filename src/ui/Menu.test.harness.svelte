<script lang="ts">
import Menu from './Menu.svelte';
import type { MenuItem } from './menu-types';

interface Props {
  items: MenuItem[];
  label?: string;
}

const { items, label }: Props = $props();
</script>

<Menu {items} {label} />
