<script lang="ts">
import type { ResultSource } from '../shared/launcher-contract';
import ResultRow from './ResultRow.svelte';

interface Props {
  title?: string;
  url?: string;
  source?: ResultSource;
  faviconSrc?: string | undefined;
  selected?: boolean;
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
  onclick = noop,
  onhover = noop,
}: Props = $props();
</script>

<ResultRow {title} {url} {source} {faviconSrc} {selected} {onclick} {onhover} />
