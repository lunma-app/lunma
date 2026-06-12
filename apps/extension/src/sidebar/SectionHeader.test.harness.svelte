<script lang="ts">
import type { IconName } from '../shared/icon-names';
import type { RowMenuItem } from '../ui/RowMenu.svelte';
import SectionHeader from './SectionHeader.svelte';

interface Props {
  icon?: IconName;
  label?: string;
  menu?: RowMenuItem[];
  /** When set, the harness forwards a drill-in panel rendering this text. */
  panelContent?: string;
  panelTitle?: string;
  onPanelBack?: () => void;
}

const {
  icon = 'pin',
  label = 'Pinned',
  menu,
  panelContent,
  panelTitle,
  onPanelBack,
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
/>
