<script lang="ts">
import type { ResultSource } from '../shared/launcher-contract';
import ResultRow from './ResultRow.svelte';

interface Props {
  title?: string;
  url?: string;
  source?: ResultSource;
  faviconSrc?: string | undefined;
  selected?: boolean;
  alreadyOpen?: boolean;
  spaceName?: string | undefined;
  spaceColor?: string | undefined;
  onclick?: () => void;
  onhover?: () => void;
}

function noop(): void {
  /* test default */
}

const {
  title = 'Example',
  url = 'https://example.com/',
  source = 'tab',
  faviconSrc,
  selected = false,
  alreadyOpen = false,
  spaceName,
  spaceColor,
  onclick = noop,
  onhover = noop,
}: Props = $props();
</script>

<ResultRow
  {title}
  {url}
  {source}
  {faviconSrc}
  {selected}
  {alreadyOpen}
  {spaceName}
  {spaceColor}
  {onclick}
  {onhover}
/>
