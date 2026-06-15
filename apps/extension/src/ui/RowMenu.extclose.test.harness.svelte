<script lang="ts">
import type { Snippet } from 'svelte';
import RowMenu, { type RowMenuItem } from './RowMenu.svelte';

// Reproduces the smart-folder editor's host wiring: a titled drill-in panel
// whose confirm dismisses the WHOLE morph by flipping the bindable `open` to
// false directly (the `onDone` contract) — NOT via the trigger / Esc / outside
// path. Exercises RowMenu's host-driven close teardown.

let open = $state(false);
let drilledIn = $state(false);

const items: RowMenuItem[] = [
  {
    id: 'edit',
    label: 'Edit…',
    keepOpen: true,
    submenu: true,
    onSelect: () => {
      drilledIn = true;
    },
  },
];

function onConfirm(): void {
  drilledIn = false;
  open = false;
}
</script>

<RowMenu
  {items}
  label="Row actions"
  testidPrefix="row-menu"
  header={hdr}
  panel={drilledIn ? editorPanel : undefined}
  panelTitle={drilledIn ? 'Edit' : undefined}
  onPanelBack={() => {
    drilledIn = false;
  }}
  bind:open
/>

{#snippet editorPanel()}
  <div data-testid="editor-panel">
    <button type="button" data-testid="editor-confirm" onclick={onConfirm}>Confirm</button>
  </div>
{/snippet}

{#snippet hdr({ trigger }: { trigger: Snippet; expanded: boolean })}
  <div data-testid="row-header">
    <span>Header</span>
    {@render trigger()}
  </div>
{/snippet}
