<script lang="ts">
import Tooltip from './Tooltip.svelte';

interface Props {
  label?: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
  enabled?: boolean;
}

const { label = 'Tooltip label', side, enabled }: Props = $props();
</script>

<Tooltip {label} {side} {enabled}>
  {#snippet children(props)}
    <button {...props} data-testid="trigger">Hover me</button>
  {/snippet}
</Tooltip>
