<script module lang="ts">
import { defineStory } from '../../lib/story';

export const meta = defineStory({
  title: 'EditableLabel',
  group: 'Form',
  controls: {
    value: { type: 'text', default: 'Work', description: 'Current text / draft seed.' },
    editing: { type: 'boolean', default: false, description: 'Parent-owned edit mode.' },
    placeholder: { type: 'text', default: 'Name…', description: 'Input placeholder.' },
    allowEmpty: {
      type: 'boolean',
      default: false,
      description: 'Treat an empty commit as commit("").',
    },
  },
});
</script>

<script lang="ts">
import EditableLabel from '@/ui/EditableLabel.svelte';
import type { Args } from '../../lib/controls';
import { noop } from '../../lib/mock';
import Story from '../../lib/Story.svelte';
import Variant from '../../lib/Variant.svelte';

const { source }: { source: string } = $props();
</script>

<Story {meta} {source}>
  {#snippet preview(args: Args)}
    <div style="width: 12rem">
      <EditableLabel
        value={args.value as string}
        editing={args.editing as boolean}
        placeholder={args.placeholder as string}
        allowEmpty={args.allowEmpty as boolean}
        oncommit={(next) => {
          args.value = next;
          args.editing = false;
        }}
        oncancel={() => (args.editing = false)}
        ariaLabel="Space name"
      />
    </div>
  {/snippet}
  {#snippet examples()}
    <Variant label="static label">
      <div style="width: 12rem">
        <EditableLabel value="Work" editing={false} oncommit={noop} oncancel={noop} ariaLabel="Space name" />
      </div>
    </Variant>
    <Variant label="editing (input)">
      <div style="width: 12rem">
        <EditableLabel value="Reading" editing oncommit={noop} oncancel={noop} ariaLabel="Space name" />
      </div>
    </Variant>
  {/snippet}
</Story>
