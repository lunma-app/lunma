<script lang="ts">
import type { LunmaStore } from '../shared/store.svelte';
import type { WindowId } from '../shared/types';
import FaviconRow from './FaviconRow.svelte';
import { setStore } from './store-context.svelte';

interface Props {
  store: LunmaStore;
  windowId: WindowId;
}

const { store, windowId }: Props = $props();
setStore(() => store);
</script>

<FaviconRow {windowId} />
