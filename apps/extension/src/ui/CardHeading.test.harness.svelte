<script lang="ts">
import CardHeading from './CardHeading.svelte';

interface Props {
  heading?: string;
  testid?: string;
  withActions?: boolean;
}

const { heading = 'Recently archived', testid, withActions = false }: Props = $props();
</script>

{#if withActions}
  <CardHeading {heading} {testid}>
    {#snippet actions()}
      <button type="button" data-testid="heading-action">Clear all</button>
    {/snippet}
  </CardHeading>
{:else}
  <CardHeading {heading} {testid} />
{/if}
