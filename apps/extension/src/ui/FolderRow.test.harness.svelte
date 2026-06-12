<script lang="ts">
import type { IconName } from '../shared/icon-names';
import type { SpaceColor } from '../shared/types';
import FolderRow from './FolderRow.svelte';
import type { RowMenuItem } from './RowMenu.svelte';

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
  onStartRename?: () => void;
  onDelete?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  badge?: string;
  menuItems?: RowMenuItem[];
  busy?: boolean;
  /** When set, the harness passes a forwarded drill-in panel rendering this text. */
  panelContent?: string;
  panelTitle?: string;
  onPanelBack?: () => void;
  /** When true, the harness BINDS `menuOpen` and renders a host-side mirror +
   * close control, exercising the bindable pass-through; the default branch
   * keeps every other test on the unbound path. */
  bindMenuOpen?: boolean;
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
  onStartRename,
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
  <button
    type="button"
    data-testid="host-close-menu"
    onclick={() => {
      menuOpen = false;
    }}
  >
    host close
  </button>
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
    {label}
    {editing}
    {onRename}
    {onRenameCancel}
    {onStartRename}
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
