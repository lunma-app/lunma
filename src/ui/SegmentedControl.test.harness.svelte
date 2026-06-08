<script lang="ts">
import SegmentedControl from './SegmentedControl.svelte';

interface Props {
  value?: string;
  onchange?: (value: string) => void;
}

function noop(): void {
  /* test default */
}

let { value = 'normal', onchange = noop }: Props = $props();

const options = [
  { value: 'compact', label: 'Compact' },
  { value: 'normal', label: 'Normal' },
  { value: 'comfort', label: 'Comfort' },
];

// Reflect the selection locally so the bound value updates like a real consumer.
function handle(next: string): void {
  value = next;
  onchange(next);
}
</script>

<SegmentedControl name="density" {options} {value} onchange={handle} />
