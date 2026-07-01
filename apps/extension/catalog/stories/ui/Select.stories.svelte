<script module lang="ts">
import { defineStory } from '../../lib/story';

export const meta = defineStory({
  title: 'Select',
  group: 'Form',
  controlOverrides: {
    ariaLabel: { default: 'Auto-archive', description: 'Accessible name.' },
  },
  excludeControls: {
    options: 'Array prop — no meaningful scalar control; the preview passes a fixed option list.',
    value:
      'Only valid when it matches one of `options` — a naive free-text control would let a reviewer put the preview into an invalid state.',
    onchange:
      'Callback prop — the preview binds it back to local playground state (see `value` above for why `value` itself is excluded).',
    testid: 'data-testid passthrough — not meaningful to fiddle with here.',
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

let playgroundValue = $state('30');
</script>

<Story {meta} {source}>
  {#snippet preview(args: Args)}
    <div style="width: 14rem">
      <Select
        {options}
        value={playgroundValue}
        onchange={(v) => (playgroundValue = v)}
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
