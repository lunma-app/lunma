<script lang="ts">
import BitsMenu from './BitsMenu.svelte';
import type { MenuItem } from './menu-types';

interface Props {
  items: MenuItem[];
  label?: string;
  headerKind?: string;
  headerTitle?: string;
  open?: boolean;
}

let { items, label, headerKind, headerTitle, open = $bindable(false) }: Props = $props();
</script>

<BitsMenu {items} {label} {headerKind} {headerTitle} bind:open />
