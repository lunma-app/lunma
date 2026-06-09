<script lang="ts">
import type { LunmaStore } from '../shared/store.svelte';
import type { SpaceId, WindowId } from '../shared/types';
import { setStore } from './store-context.svelte';
import TempTabs from './TempTabs.svelte';

interface Props {
  store: LunmaStore;
  windowId: WindowId;
  /** Defaults to the tests' 'work' Space (the one they seed temp tabs into). */
  spaceId?: SpaceId;
}

const { store, windowId, spaceId = 'work' }: Props = $props();
setStore(() => store);
</script>

<TempTabs {windowId} {spaceId} />
