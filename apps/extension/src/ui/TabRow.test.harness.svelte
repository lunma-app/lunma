<script lang="ts">
import TabRow from './TabRow.svelte';

interface Props {
  title?: string;
  faviconSrc?: string;
  faviconFallbackSrc?: string;
  active?: boolean;
  loading?: boolean;
  drifted?: boolean;
  meta?: string;
  onclick?: () => void;
  withTrailing?: boolean;
  onTrailingClick?: () => void;
}

function noop(): void {
  /* test default */
}

const {
  title = 'Example tab',
  faviconSrc,
  faviconFallbackSrc,
  active = false,
  loading = false,
  drifted = false,
  meta,
  onclick = noop,
  withTrailing = false,
  onTrailingClick = noop,
}: Props = $props();
</script>

{#snippet trailingAction()}
  <button type="button" data-testid="trailing-action" onclick={onTrailingClick}>x</button>
{/snippet}

<TabRow
  {title}
  {faviconSrc}
  {faviconFallbackSrc}
  {active}
  {loading}
  {drifted}
  {meta}
  {onclick}
  trailing={withTrailing ? trailingAction : undefined}
/>
