<script lang="ts">
import ContextMenu from './ContextMenu.svelte';
import type { MenuItem } from './menu-types';

interface Props {
  items: MenuItem[];
  label?: string;
}

const { items, label }: Props = $props();

let open = $state(false);
let x = $state(0);
let y = $state(0);
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<button
  type="button"
  data-testid="anchor"
  oncontextmenu={(e) => {
    e.preventDefault();
    x = e.clientX;
    y = e.clientY;
    open = true;
  }}
>
  right-click me
</button>

<ContextMenu bind:open {x} {y} {items} {label} />
