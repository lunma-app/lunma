<script lang="ts">
import type { IconName } from '../shared/icon-names';
import type { SpaceColor } from '../shared/types';
import FolderRow from './FolderRow.svelte';

interface Props {
  name: string;
  icon: IconName;
  color: SpaceColor;
  expanded?: boolean;
  dropTarget?: boolean;
  onToggle?: () => void;
  label?: string;
  editing?: boolean;
  onRename?: (name: string) => void;
  onRenameCancel?: () => void;
}

const {
  name,
  icon,
  color,
  expanded,
  dropTarget,
  onToggle,
  label,
  editing,
  onRename,
  onRenameCancel,
}: Props = $props();
</script>

<FolderRow
  {name}
  {icon}
  {color}
  {expanded}
  {dropTarget}
  {onToggle}
  {label}
  {editing}
  {onRename}
  {onRenameCancel}
/>
