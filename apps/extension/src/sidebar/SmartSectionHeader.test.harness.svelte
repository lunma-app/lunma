<script lang="ts">
import type { SmartSourceConfig } from '../shared/types';
import SmartSectionHeader from './SmartSectionHeader.svelte';

interface Props {
  cfg: SmartSourceConfig;
  count?: string | undefined;
  collapsed?: boolean;
  onToggle?: () => void;
  controlsId?: string | undefined;
}

const {
  cfg,
  count = undefined,
  collapsed = false,
  onToggle = () => undefined,
  controlsId = undefined,
}: Props = $props();
</script>

<SmartSectionHeader {cfg} {count} {collapsed} {onToggle} {controlsId} />
