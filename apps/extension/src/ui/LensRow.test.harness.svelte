<script lang="ts">
import type { SpaceColor } from '../shared/types';
import LensRow from './LensRow.svelte';

interface Props {
  name: string;
  icon: string;
  color: SpaceColor;
  active?: boolean;
  expanded?: boolean;
  onToggle?: () => void;
  onOpenPage?: () => void;
  openPageLabel?: string;
  label?: string;
  badge?: string;
  busy?: boolean;
}

const {
  name,
  icon,
  color,
  active,
  expanded,
  onToggle,
  onOpenPage,
  openPageLabel,
  label,
  badge,
  busy,
}: Props = $props();
</script>

<LensRow
  {name}
  {icon}
  {color}
  {active}
  {expanded}
  {onToggle}
  {onOpenPage}
  {openPageLabel}
  {label}
  {badge}
  {busy}
/>
