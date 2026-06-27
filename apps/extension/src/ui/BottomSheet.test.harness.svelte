<script lang="ts">
import BottomSheet from './BottomSheet.svelte';

interface Props {
  open?: boolean;
  /** Defaulted by the test, not here — so a test can pass `undefined` to
   * exercise the no-header path (a harness-level default would mask it). The
   * `| undefined` lets a test forward `undefined` under exactOptionalPropertyTypes. */
  title?: string | undefined;
  onClose?: () => void;
}

let { open = false, title, onClose = () => undefined }: Props = $props();
</script>

<!-- A positioned shell, mirroring the sidebar: the sheet scopes its
     `position:absolute;inset:0` to this, not the viewport. The trigger lets the
     test assert focus returns here on close. -->
<div style="position:relative;width:300px;height:500px;">
  <button data-testid="trigger" onclick={() => (open = true)}>Open</button>
  <BottomSheet {open} {title} onClose={() => { open = false; onClose(); }} testid="sheet">
    <label for="space-name">Name</label>
    <input id="space-name" data-testid="body-input" />
    <button data-testid="body-action">Save</button>
  </BottomSheet>
</div>
