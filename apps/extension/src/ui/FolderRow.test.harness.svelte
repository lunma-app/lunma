<script lang="ts">
import type { IconName } from '../shared/icon-names';
import type { SpaceColor } from '../shared/types';
import FolderRow from './FolderRow.svelte';
import type { MenuItem } from './menu-types';

interface Props {
  name: string;
  icon: IconName;
  color: SpaceColor;
  expanded?: boolean;
  dropTarget?: boolean;
  onToggle?: () => void;
  ariaLabel?: string;
  editing?: boolean;
  onRename?: (name: string) => void;
  onRenameCancel?: () => void;
  onStartRename?: () => void;
  onSetColor?: (color: SpaceColor) => void;
  onSetIcon?: (icon: IconName) => void;
  colors?: readonly SpaceColor[];
  onDelete?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  badge?: string;
  menuItems?: MenuItem[];
  busy?: boolean;
  /** When set, the harness passes a forwarded editor snippet rendering this text
   * (FolderRow renders it inside a BottomSheet titled `panelTitle`). */
  panelContent?: string;
  panelTitle?: string;
  onPanelBack?: () => void;
  /** When true, the harness BINDS `menuOpen` and renders a host-side mirror,
   * exercising the bindable open mirror; the default branch keeps every other
   * test on the unbound path. */
  bindMenuOpen?: boolean;
}

const {
  name,
  icon,
  color,
  expanded,
  dropTarget,
  onToggle,
  ariaLabel,
  editing,
  onRename,
  onRenameCancel,
  onStartRename,
  onSetColor,
  onSetIcon,
  colors,
  onDelete,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  badge,
  menuItems,
  busy,
  panelContent,
  panelTitle,
  onPanelBack,
  bindMenuOpen = false,
}: Props = $props();

let menuOpen = $state(false);
</script>

{#snippet forwardedPanel()}
  <div data-testid="forwarded-panel">{panelContent}</div>
{/snippet}

{#if bindMenuOpen}
  <span data-testid="host-menu-open">{String(menuOpen)}</span>
  <FolderRow
    {name}
    {icon}
    {color}
    {menuItems}
    panel={panelContent !== undefined ? forwardedPanel : undefined}
    {panelTitle}
    {onPanelBack}
    bind:menuOpen
  />
{:else}
  <FolderRow
    {name}
    {icon}
    {color}
    {expanded}
    {dropTarget}
    {onToggle}
    {ariaLabel}
    {editing}
    {onRename}
    {onRenameCancel}
    {onStartRename}
    {onSetColor}
    {onSetIcon}
    colors={colors ?? []}
    {onDelete}
    {onMoveUp}
    {onMoveDown}
    {canMoveUp}
    {canMoveDown}
    {badge}
    {menuItems}
    {busy}
    panel={panelContent !== undefined ? forwardedPanel : undefined}
    {panelTitle}
    {onPanelBack}
  />
{/if}
