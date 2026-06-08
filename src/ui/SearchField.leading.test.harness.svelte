<script lang="ts">
// Harness: snippets can't be handed to `render(... { props })` directly, so this
// wrapper passes a concrete `leading` snippet into SearchField for the slot test.
import SearchField from './SearchField.svelte';
</script>

<SearchField mode="input" testid="sf">
  {#snippet leading()}
    <span data-testid="leading-token">YouTube</span>
  {/snippet}
</SearchField>
