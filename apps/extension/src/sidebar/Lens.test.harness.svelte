<script lang="ts">
import type { LunmaStore } from '../shared/store.svelte';
import type { PinNode, SpaceId, WindowId } from '../shared/types';
import Lens from './Lens.svelte';
import { setStore } from './store-context.svelte';

type LensNode = Extract<PinNode, { kind: 'lens' }>;

interface Props {
  store: LunmaStore;
  windowId: WindowId;
  spaceId: SpaceId;
  node: LensNode;
  expanded?: boolean;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onToggle?: () => void;
}

const {
  store,
  windowId,
  spaceId,
  node,
  expanded = true,
  canMoveUp = false,
  canMoveDown = false,
  onMoveUp = () => undefined,
  onMoveDown = () => undefined,
  onToggle = () => undefined,
}: Props = $props();
setStore(() => store);

// The host-side right-click forwarding surface (the PinnedTabs pattern):
// tests fire `contextmenu` on it to open Lens's ContextMenu path.
let lensRef = $state<ReturnType<typeof Lens> | undefined>();
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  data-testid="context-surface"
  oncontextmenu={(e) => lensRef?.onContextMenu(e)}
></div>

<Lens
  bind:this={lensRef}
  {windowId}
  {spaceId}
  {node}
  {expanded}
  {canMoveUp}
  {canMoveDown}
  {onMoveUp}
  {onMoveDown}
  {onToggle}
/>
