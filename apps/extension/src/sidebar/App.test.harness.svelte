<script lang="ts">
import type { Tint } from '../shared/settings';
import type { LunmaStore } from '../shared/store.svelte';
import type { WindowId } from '../shared/types';
import App from './App.svelte';

interface Props {
  store: LunmaStore;
  windowId: WindowId;
  /** Forwarded so tests can drive the sidebar's first-paint tint and rerender it. */
  tint?: Tint;
}

const { store, windowId, tint }: Props = $props();
</script>

<App {store} {windowId} {tint} />
