<script module lang="ts">
import { defineStory } from '../../lib/story';

// All of ServiceConnectPicker's props are callbacks / arrays (no scalar props to
// expose as controls), so this story shows representative examples + source only.
export const meta = defineStory({ title: 'ServiceConnectPicker', group: 'Composite' });
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
  {/snippet}
</Story>
