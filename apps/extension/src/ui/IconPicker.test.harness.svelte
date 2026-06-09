<script lang="ts">
import type { IconName } from '../shared/icon-names';
import IconPicker from './IconPicker.svelte';

interface Props {
  value?: IconName;
  onselect?: (icon: IconName) => void;
}

const { value = 'star', onselect = () => undefined }: Props = $props();
</script>

<IconPicker {value} {onselect} />
