<script lang="ts">
import type { IconName } from '../shared/icon-names';
import type { MenuItem } from '../ui/menu-types';
import SectionHeader from './SectionHeader.svelte';

interface Props {
  icon?: IconName;
  label?: string;
  menu?: MenuItem[];
  /** When set, the harness forwards a drill-in editor panel rendering this text —
   * SectionHeader now hosts it inside a BottomSheet. */
  panelContent?: string;
  panelTitle?: string;
  onPanelBack?: () => void;
  open?: boolean;
}

let {
  icon = 'pin',
  label = 'Pinned',
  menu,
  panelContent,
  panelTitle,
  onPanelBack,
  open = $bindable(false),
}: Props = $props();
</script>

{#snippet forwardedPanel()}
  <div data-testid="header-forwarded-panel">{panelContent}</div>
{/snippet}

<SectionHeader
  {icon}
  {label}
  {menu}
  panel={panelContent !== undefined ? forwardedPanel : undefined}
  {panelTitle}
  {onPanelBack}
  bind:open
/>
