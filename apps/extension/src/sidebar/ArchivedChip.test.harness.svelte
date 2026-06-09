<script lang="ts">
import type { LunmaStore } from '../shared/store.svelte';
import ArchivedChip from './ArchivedChip.svelte';
import { setStore } from './store-context.svelte';

interface Props {
  store: LunmaStore;
  spaceId?: string;
  onOpen?: () => void;
}

const {
  store,
  spaceId = 'work',
  onOpen = () => {
    /* test default */
  },
}: Props = $props();
setStore(() => store);
</script>

<ArchivedChip {spaceId} {onOpen} />
