<script lang="ts">
import type { LunmaStore } from '../shared/store.svelte';
import SpaceEditor, { type SpaceEditorMode } from './SpaceEditor.svelte';
import { setStore } from './store-context.svelte';

interface Props {
  store: LunmaStore;
  mode: SpaceEditorMode;
  open?: boolean;
  onClose?: () => void;
}

let { store, mode, open = $bindable(true), onClose }: Props = $props();
setStore(() => store);

function handleClose(): void {
  open = false;
  onClose?.();
}
</script>

<div style="position: relative">
  <SpaceEditor {mode} {open} onClose={handleClose} />
</div>
