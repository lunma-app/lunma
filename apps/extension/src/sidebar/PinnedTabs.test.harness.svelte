<script lang="ts">
import type { LunmaStore } from '../shared/store.svelte';
import type { WindowId } from '../shared/types';
import PinnedTabs from './PinnedTabs.svelte';
import { setStore } from './store-context.svelte';

interface Props {
  store: LunmaStore;
  windowId: WindowId;
  spaceId: string;
  active?: boolean;
}

const { store, windowId, spaceId, active = true }: Props = $props();
setStore(() => store);
</script>

<PinnedTabs {windowId} {spaceId} {active} />
