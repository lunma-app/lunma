<script lang="ts">
import type { SourceAccount, SpaceId } from '../shared/types';
import ServiceConnectPicker from './ServiceConnectPicker.svelte';

// Test harness for ServiceConnectPicker: forwards `spaces`/`onImportFeeds` and
// records every minted account into `connected` so a test can assert what
// `onConnected` saw.
interface Props {
  spaces?: { id: SpaceId; name: string }[];
  connected?: SourceAccount[];
  onImportFeeds?: ((feeds: { name: string; feedUrl: string }[]) => void) | undefined;
}
let { spaces = [], connected = $bindable([]), onImportFeeds }: Props = $props();
</script>

<ServiceConnectPicker
  {spaces}
  {onImportFeeds}
  onConnected={(a) => (connected = [...connected, a])}
/>
