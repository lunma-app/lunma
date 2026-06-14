<script lang="ts">
import type { LunmaStore } from '../shared/store.svelte';
import type { PinNode, SpaceId, WindowId } from '../shared/types';
// biome-ignore lint/style/useImportType: Svelte component used as value in template
import SmartFolder from './SmartFolder.svelte';
import { setStore } from './store-context.svelte';

type SmartNode = Extract<PinNode, { kind: 'smart' }>;

interface Props {
  store: LunmaStore;
  windowId: WindowId;
  spaceId: SpaceId;
  node: SmartNode;
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
// tests fire `contextmenu` on it to open SmartFolder's ContextMenu path.
let smartFolder = $state<ReturnType<typeof SmartFolder> | undefined>();
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  data-testid="context-surface"
  oncontextmenu={(e) => smartFolder?.onContextMenu(e)}
></div>

<SmartFolder
  bind:this={smartFolder}
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
