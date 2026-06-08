<script lang="ts">
import type { LunmaStore } from '../shared/store.svelte';
import { setStore, useStore } from './store-context.svelte';

interface Props {
  store: LunmaStore;
}

const { store }: Props = $props();
setStore(() => store);

let observed: LunmaStore | null = $state(null);
let error: string | null = $state(null);

try {
  observed = useStore();
} catch (err) {
  error = err instanceof Error ? err.message : String(err);
}
</script>

<div
  data-spaces-count={observed?.state.spaces.length ?? -1}
  data-error={error ?? ''}
></div>
