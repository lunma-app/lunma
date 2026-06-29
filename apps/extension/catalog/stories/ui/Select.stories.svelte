<script module lang="ts">
import { defineStory } from '../../lib/story';

export const meta = defineStory({
  title: 'Select',
  group: 'Form',
  controls: {
    value: {
      type: 'select',
      options: ['off', '30', '120'],
      default: '30',
      typeLabel: 'string',
      description: 'Selected option value (`options` is an array prop).',
    },
    ariaLabel: { type: 'text', default: 'Auto-archive', description: 'Accessible name.' },
  },
});
</script>

<script lang="ts">
import Select, { type SelectOption } from '@/ui/Select.svelte';
import type { Args } from '../../lib/controls';
import { noop } from '../../lib/mock';
import Story from '../../lib/Story.svelte';
import Variant from '../../lib/Variant.svelte';

const { source }: { source: string } = $props();

// The trailing disabled `Custom…` exercises the roving model: ArrowUp/Down,
// Home/End skip it rather than dead-ending there (SEL-03); each option button is
// owned directly by the listbox via `role="presentation"` <li> wrappers (SEL-04).
const options: SelectOption[] = [
  { value: 'off', label: 'Never archive' },
  { value: '30', label: 'After 30 minutes' },
  { value: '120', label: 'After 2 hours' },
  { value: 'custom', label: 'Custom…', disabled: true },
];
</script>

<Story {meta} {source}>
  {#snippet preview(args: Args)}
    <div style="width: 14rem">
      <Select
        {options}
        value={args.value as string}
        onchange={(v) => (args.value = v)}
        ariaLabel={args.ariaLabel as string}
      />
    </div>
  {/snippet}
  {#snippet examples()}
    <Variant label="closed">
      <div style="width: 14rem">
        <Select {options} value="30" onchange={noop} ariaLabel="Auto-archive" />
      </div>
    </Variant>
  {/snippet}
</Story>
