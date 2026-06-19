<script lang="ts">
import SettingsCard from './SettingsCard.svelte';

interface Props {
  heading?: string;
  id?: string;
  testid?: string;
  headingTestid?: string;
  description?: string;
  withActions?: boolean;
}

const {
  heading = 'Connectors',
  id,
  testid,
  headingTestid,
  description,
  withActions = false,
}: Props = $props();
</script>

{#if withActions}
  <SettingsCard {heading} {id} {testid} {headingTestid} {description}>
    {#snippet actions()}
      <button type="button" data-testid="card-action">Clear all</button>
    {/snippet}
    <p data-testid="card-body">body content</p>
  </SettingsCard>
{:else}
  <SettingsCard {heading} {id} {testid} {headingTestid} {description}>
    <p data-testid="card-body">body content</p>
  </SettingsCard>
{/if}
