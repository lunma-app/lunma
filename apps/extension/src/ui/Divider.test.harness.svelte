<script lang="ts">
import Divider from './Divider.svelte';

interface Props {
  withAction?: boolean;
}

const { withAction = false }: Props = $props();
</script>

{#if withAction}
  <Divider>
    {#snippet action()}
      <button type="button" data-testid="action-btn">Clear</button>
    {/snippet}
  </Divider>
{:else}
  <Divider />
{/if}
