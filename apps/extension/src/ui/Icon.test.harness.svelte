<script lang="ts">
import type { IconName } from '../shared/icon-names';
import Icon from './Icon.svelte';

interface Props {
  name: IconName;
  label?: string;
}

const { name, label }: Props = $props();
</script>

<Icon {name} {label} />
