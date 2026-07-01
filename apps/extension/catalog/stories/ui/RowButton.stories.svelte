<script module lang="ts">
import { defineStory } from '../../lib/story';

export const meta = defineStory({
  title: 'RowButton',
  group: 'Atoms',
  controlOverrides: {
    icon: { default: 'plus', description: 'Leading Lucide icon name.' },
    label: { default: 'New tab', description: 'Row label.' },
    disabled: { description: 'Disabled state.' },
  },
  excludeControls: {
    onclick: 'Callback prop — no meaningful live control.',
    ariaCurrent:
      'Unsafe as a naive select default: the neutral state is "absent", not one of the literal options — a naive control would default to a real value ("page"), misrepresenting the common case. See the "current" example below.',
  },
});
</script>

<script lang="ts">
import RowButton from '@/ui/RowButton.svelte';
import type { Args } from '../../lib/controls';
import { noop } from '../../lib/mock';
import Story from '../../lib/Story.svelte';
import Variant from '../../lib/Variant.svelte';

const { source }: { source: string } = $props();
</script>

<Story {meta} {source}>
  {#snippet preview(args: Args)}
    <div style="width: 14rem">
      <RowButton
        icon={args.icon as string}
        label={args.label as string}
        disabled={args.disabled as boolean}
        title={(args.title as string) || undefined}
        onclick={noop}
      />
    </div>
  {/snippet}
  {#snippet examples()}
    <Variant label="default">
      <div style="width: 14rem">
        <RowButton icon="plus" label="New tab" onclick={noop} />
      </div>
    </Variant>
    <Variant label="other glyph">
      <div style="width: 14rem">
        <RowButton icon="folder-plus" label="New folder" onclick={noop} />
      </div>
    </Variant>
    <Variant label="disabled">
      <div style="width: 14rem">
        <RowButton icon="plus" label="New tab" disabled onclick={noop} />
      </div>
    </Variant>
    <!-- `ariaCurrent="page"` marks the one row that is the current location (the
         catalog nav's active item) so it isn't conveyed by the wash alone. -->
    <Variant label="current (aria-current)">
      <div style="width: 14rem">
        <RowButton icon="box" label="Button" ariaCurrent="page" onclick={noop} />
      </div>
    </Variant>
  {/snippet}
</Story>
