<script lang="ts">
import Chip from './Chip.svelte';

interface Props {
  label?: string;
  tone?: 'neutral' | 'accent';
  iconUrl?: string;
  onRemove?: (() => void) | undefined;
  removeLabel?: string;
  onToggle?: (() => void) | undefined;
  selected?: boolean;
  disabled?: boolean;
}

const {
  label = 'example.com',
  tone,
  iconUrl,
  onRemove,
  removeLabel,
  onToggle,
  selected,
  disabled,
}: Props = $props();
</script>

<Chip {label} {tone} {iconUrl} {onRemove} {removeLabel} {onToggle} {selected} {disabled} />
