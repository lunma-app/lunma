<script lang="ts">
import FaviconTile from './FaviconTile.svelte';

interface Props {
  title?: string;
  faviconSrc?: string;
  faviconFallbackSrc?: string;
  active?: boolean;
  loading?: boolean;
  drifted?: boolean;
  unbound?: boolean;
  favoriting?: boolean;
  onclick?: () => void;
}

function noop(): void {
  /* test default */
}

const {
  title = 'Example',
  faviconSrc,
  faviconFallbackSrc,
  active,
  loading,
  drifted,
  unbound,
  favoriting,
  onclick = noop,
}: Props = $props();
</script>

<FaviconTile
  {title}
  {faviconSrc}
  {faviconFallbackSrc}
  {active}
  {loading}
  {drifted}
  {unbound}
  {favoriting}
  {onclick}
/>
