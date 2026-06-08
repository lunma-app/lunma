<script lang="ts">
import type { IconName } from '../shared/icon-names';
import type { RowMenuItem } from '../ui/RowMenu.svelte';
import SectionHeader from './SectionHeader.svelte';

interface Props {
  icon?: IconName;
  label?: string;
  menu?: RowMenuItem[];
}

const { icon = 'pin', label = 'Pinned', menu }: Props = $props();
</script>

<SectionHeader {icon} {label} {menu} />
