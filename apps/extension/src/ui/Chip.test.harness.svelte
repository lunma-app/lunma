<script lang="ts">
import Chip from './Chip.svelte';

interface Props {
  label?: string;
  tone?: 'neutral' | 'accent';
  iconUrl?: string;
  onRemove?: (() => void) | undefined;
  removeLabel?: string;
}

const { label = 'example.com', tone, iconUrl, onRemove, removeLabel }: Props = $props();
</script>

<Chip {label} {tone} {iconUrl} {onRemove} {removeLabel} />
