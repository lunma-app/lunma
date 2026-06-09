<script lang="ts">
import Select, { type SelectOption } from './Select.svelte';

interface Props {
  options?: SelectOption[];
  value?: string;
  onchange?: (value: string) => void;
  ariaLabel?: string;
}

function noop(): void {
  /* test default */
}

const {
  options = [
    { value: 'google', label: 'Google' },
    { value: 'duckduckgo', label: 'DuckDuckGo' },
    { value: 'custom', label: 'Custom' },
  ],
  value = 'google',
  onchange = noop,
  ariaLabel = 'Default search engine',
}: Props = $props();
</script>

<Select {options} {value} {onchange} {ariaLabel} />
