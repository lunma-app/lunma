<script module lang="ts">
import { defineStory } from '../../lib/story';

export const meta = defineStory({
  title: 'SegmentedControl',
  group: 'Form',
  controlOverrides: {
    block: { description: 'Full-width equal segments.' },
    ariaLabel: { default: 'Colour intensity', description: 'Radio-group accessible name.' },
  },
  excludeControls: {
    name: 'Must stay unique per control instance on the page — not meaningful as a freeform control.',
    options: 'Array prop — no meaningful scalar control; the preview passes a fixed option list.',
    value:
      'Only valid when it matches one of `options` — a naive free-text control would let a reviewer put the preview into an invalid state (mirrors the Select.value precedent). See the Examples below for each value.',
    onchange:
      'Callback prop — the preview binds it back to local playground state (see `value` above for why `value` itself is excluded).',
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

let playgroundValue = $state('vivid');
</script>

<Story {meta} {source}>
  {#snippet preview(args: Args)}
    <div style="width: 16rem">
      <SegmentedControl
        name="story-playground"
        ariaLabel={args.ariaLabel as string}
        options={tintOptions}
        value={playgroundValue}
        onchange={(v) => (playgroundValue = v)}
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
