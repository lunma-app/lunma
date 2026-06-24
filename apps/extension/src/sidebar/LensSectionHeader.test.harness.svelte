<script lang="ts">
import type { ResolvedLensSource } from '../shared/types';
import LensSectionHeader from './LensSectionHeader.svelte';

interface Props {
  cfg: ResolvedLensSource;
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

<LensSectionHeader {cfg} {count} {collapsed} {onToggle} {controlsId} {first} />
