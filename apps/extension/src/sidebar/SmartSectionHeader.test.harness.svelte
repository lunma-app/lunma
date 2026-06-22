<script lang="ts">
import type { ResolvedSourceConfig } from '../shared/types';
import SmartSectionHeader from './SmartSectionHeader.svelte';

interface Props {
  cfg: ResolvedSourceConfig;
  count?: string | undefined;
  collapsed?: boolean;
  onToggle?: () => void;
  controlsId?: string | undefined;
  first?: boolean;
}

const {
  cfg,
  count = undefined,
  collapsed = false,
  onToggle = () => undefined,
  controlsId = undefined,
  first = false,
}: Props = $props();
</script>

<SmartSectionHeader {cfg} {count} {collapsed} {onToggle} {controlsId} {first} />
