<script lang="ts">
import MultiSelect, { type MultiSelectOption } from './MultiSelect.svelte';

interface Props {
  options?: MultiSelectOption[];
  values?: string[];
  onchange?: (values: string[]) => void;
  label?: string;
  ariaLabel?: string;
  clearLabel?: string;
  selectAllLabel?: string;
  mode?: 'dropdown' | 'inline';
  searchPlaceholder?: string;
  /** Render a leading snippet (an AccountChip stand-in) before each row. */
  withLeading?: boolean;
}

function noop(): void {
  /* test default */
}

const {
  options = [
    { value: 'hn', label: 'Hacker News' },
    { value: 'lobsters', label: 'Lobsters' },
    { value: 'verge', label: 'The Verge' },
  ],
  values = [],
  onchange = noop,
  label = 'All feeds',
  ariaLabel = 'Filter by feed',
  clearLabel = 'Clear filter',
  selectAllLabel,
  mode = 'dropdown',
  searchPlaceholder,
  withLeading = false,
}: Props = $props();
</script>

{#snippet lead(option: MultiSelectOption)}
  <span data-testid="lead-content">★ {option.label}</span>
{/snippet}

<MultiSelect
  {options}
  {values}
  {onchange}
  {label}
  {ariaLabel}
  {clearLabel}
  {selectAllLabel}
  {mode}
  {searchPlaceholder}
  leading={withLeading ? lead : undefined}
/>
