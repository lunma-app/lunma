<script lang="ts">
import type { ResolvedSourceConfig } from '../shared/types';
import SmartSectionHeader from './SmartSectionHeader.svelte';

interface Props {
  cfg: ResolvedSourceConfig;
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
