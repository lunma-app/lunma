<script module lang="ts">
import { defineStory } from '../../lib/story';

export const meta = defineStory({
  title: 'SegmentedControl',
  group: 'Form',
  controls: {
    value: {
      type: 'select',
      options: ['subtle', 'standard', 'vivid'],
      default: 'vivid',
      typeLabel: 'string',
      description: 'Selected value (`options` is an array prop).',
    },
    block: { type: 'boolean', default: false, description: 'Full-width equal segments.' },
    ariaLabel: {
      type: 'text',
      default: 'Colour intensity',
      description: 'Radio-group accessible name.',
    },
  },
});
</script>

<script lang="ts">
import SegmentedControl from '@/ui/SegmentedControl.svelte';
import type { Args } from '../../lib/controls';
import { noop } from '../../lib/mock';
import Story from '../../lib/Story.svelte';
import Variant from '../../lib/Variant.svelte';

const { source }: { source: string } = $props();

const tintOptions = [
  { value: 'subtle', label: 'Subtle' },
  { value: 'standard', label: 'Standard' },
  { value: 'vivid', label: 'Vivid' },
];
const themeOptions = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];
</script>

<Story {meta} {source}>
  {#snippet preview(args: Args)}
    <div style="width: 16rem">
      <SegmentedControl
        name="story-playground"
        ariaLabel={args.ariaLabel as string}
        options={tintOptions}
        value={args.value as string}
        onchange={(v) => (args.value = v)}
        block={args.block as boolean}
      />
    </div>
  {/snippet}
  {#snippet examples()}
    <Variant label="intensity">
      <SegmentedControl
        name="story-tint"
        ariaLabel="Colour intensity"
        options={tintOptions}
        value="vivid"
        onchange={noop}
      />
    </Variant>
    <Variant label="block (full width)">
      <div style="width: 16rem">
        <SegmentedControl
          name="story-theme"
          ariaLabel="Theme"
          options={themeOptions}
          value="dark"
          onchange={noop}
          block
        />
      </div>
    </Variant>
  {/snippet}
</Story>
