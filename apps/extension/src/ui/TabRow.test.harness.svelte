<script lang="ts">
import TabRow from './TabRow.svelte';

interface Props {
  title?: string;
  faviconSrc?: string;
  faviconFallbackSrc?: string;
  active?: boolean;
  loading?: boolean;
  drifted?: boolean;
  homeHost?: string;
  onGoHome?: () => void;
  meta?: string;
  onclick?: () => void;
  withTrailing?: boolean;
  onTrailingClick?: () => void;
  editing?: boolean;
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
  homeHost,
  onGoHome = noop,
  meta,
  onclick = noop,
  withTrailing = false,
  onTrailingClick = noop,
  editing = false,
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
  {homeHost}
  {onGoHome}
  {meta}
  {onclick}
  {editing}
  trailing={withTrailing ? trailingAction : undefined}
/>
