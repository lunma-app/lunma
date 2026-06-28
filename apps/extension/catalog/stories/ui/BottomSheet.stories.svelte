<script module lang="ts">
import { defineStory } from '../../lib/story';

export const meta = defineStory({
  title: 'BottomSheet',
  group: 'Composite',
  controls: {
    open: { type: 'boolean', default: true, description: 'Controlled open state.' },
    title: {
      type: 'text',
      default: 'Rename Space',
      description: 'Header title (empty = headerless).',
    },
  },
});
</script>

<script lang="ts">
import BottomSheet from '@/ui/BottomSheet.svelte';
import Button from '@/ui/Button.svelte';
import TextInput from '@/ui/TextInput.svelte';
import type { Args } from '../../lib/controls';
import { noop } from '../../lib/mock';
import Story from '../../lib/Story.svelte';
import Variant from '../../lib/Variant.svelte';

const { source }: { source: string } = $props();
</script>

<Story {meta} {source}>
  {#snippet preview(args: Args)}
    <!-- The sheet scopes position:absolute;inset:0 to the nearest positioned
         ancestor — this frame, not the viewport. Toggle `open` to show/hide. -->
    <div class="frame">
      <BottomSheet
        open={args.open as boolean}
        title={(args.title as string) || undefined}
        onClose={() => (args.open = false)}
      >
        <TextInput label="Name" value="Work" />
      </BottomSheet>
    </div>
  {/snippet}
  {#snippet examples()}
    <Variant label="with title + body">
      <div class="frame">
        <BottomSheet open title="Rename Space" onClose={noop}>
          <TextInput label="Name" value="Work" />
          <div style="display:flex; gap:8px; margin-top:12px">
            <Button variant="ghost" size="sm" onclick={noop}>Cancel</Button>
            <Button variant="primary" size="sm" onclick={noop}>Save</Button>
          </div>
        </BottomSheet>
      </div>
    </Variant>
    <Variant label="no title (headerless)">
      <div class="frame">
        <BottomSheet open onClose={noop}>
          <p style="margin:0">A headerless sheet body.</p>
        </BottomSheet>
      </div>
    </Variant>
  {/snippet}
</Story>

<style>
  .frame {
    position: relative;
    width: 18rem;
    height: 16rem;
    border: 1px solid var(--border-soft);
    border-radius: var(--r-lg);
    overflow: hidden;
    padding: var(--space-3);
  }
</style>
