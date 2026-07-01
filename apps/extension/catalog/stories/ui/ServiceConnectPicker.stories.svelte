<script module lang="ts">
import { defineStory } from '../../lib/story';

// ServiceConnectPicker's props are callbacks/arrays, plus a non-meaningful
// testid passthrough — no controls worth a live playground, so this story
// shows representative examples + source only.
export const meta = defineStory({
  title: 'ServiceConnectPicker',
  group: 'Composite',
  excludeControls: {
    testid: 'data-testid passthrough — not meaningful to fiddle with here.',
    onConnected: 'Callback prop — no meaningful live control.',
    spaces: 'Array prop — no meaningful scalar control; the preview passes a fixed space list.',
    onImportFeeds: 'Callback prop — no meaningful live control.',
    onCancel: 'Callback prop — no meaningful live control.',
  },
});
</script>

<script lang="ts">
import ServiceConnectPicker from '@/ui/ServiceConnectPicker.svelte';
import { noop } from '../../lib/mock';
import Story from '../../lib/Story.svelte';
import Variant from '../../lib/Variant.svelte';

const { source }: { source: string } = $props();

const spaces = [
  { id: 'sp-work', name: 'Work' },
  { id: 'sp-reading', name: 'Reading' },
];
</script>

<Story {meta} {source}>
  {#snippet examples()}
    <!-- The hidden OPML file input is programmatically clicked by "Import OPML…"
         and stays out of the tab order / a11y tree (SCP-01); when a file is parsed
         the "Found N feeds" confirm reveals in a role="status" region (SCP-03). -->
    <Variant label="provider picker (Options mode · OPML import)">
      <div style="width: 22rem">
        <ServiceConnectPicker onConnected={noop} {spaces} onImportFeeds={noop} onCancel={noop} />
      </div>
    </Variant>
    <Variant label="lens-editor mode (no spaces)">
      <div style="width: 22rem">
        <ServiceConnectPicker onConnected={noop} onCancel={noop} />
      </div>
    </Variant>
    <Variant
      label="Bitbucket Cloud (pick Bitbucket, host bitbucket.org → required workspace field)"
    >
      <div style="width: 22rem">
        <ServiceConnectPicker onConnected={noop} onCancel={noop} />
      </div>
    </Variant>
  {/snippet}
</Story>
