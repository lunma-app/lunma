<script lang="ts">
import type { IconName } from '../shared/icon-names';
import RowButton from './RowButton.svelte';

interface Props {
  icon?: IconName;
  label?: string;
  onclick?: () => void;
  disabled?: boolean;
}

function noop(): void {
  /* test default */
}

const { icon = 'star', label = 'New Tab', onclick = noop, disabled = false }: Props = $props();
</script>

<RowButton {icon} {label} {onclick} {disabled} />
