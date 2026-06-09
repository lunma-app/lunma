<script lang="ts">
import type { SearchEngine } from '../../shared/search-engines';
import type { Tint } from '../../shared/settings';
import type { AppState, WindowId } from '../../shared/types';
import NewTab from './NewTab.svelte';

interface Props {
  windowId: WindowId;
  initialState?: AppState | null;
  tint?: Tint;
  engines?: SearchEngine[];
}

const { windowId, initialState = null, tint = 'vivid', engines = [] }: Props = $props();
</script>

<NewTab {windowId} {initialState} {tint} {engines} />
