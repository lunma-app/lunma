<script lang="ts">
import Menu from './Menu.svelte';
import type { MenuItem } from './menu-types';

interface Props {
  trigger: 'kebab' | 'context';
  items: MenuItem[];
  ariaLabel?: string;
  headerKind?: string;
  headerTitle?: string;
  open?: boolean;
}

let {
  trigger,
  items,
  ariaLabel,
  headerKind,
  headerTitle,
  open = $bindable(false),
}: Props = $props();
</script>

{#if trigger === 'context'}
  <Menu {trigger} {items} {ariaLabel} {headerKind} {headerTitle} bind:open>
    {#snippet children(props)}
      <button {...props} type="button" data-testid="anchor">right-click me</button>
    {/snippet}
  </Menu>
{:else}
  <Menu {trigger} {items} {ariaLabel} {headerKind} {headerTitle} bind:open />
{/if}
