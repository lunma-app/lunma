<script module lang="ts">
import { defineStory } from '../../lib/story';

export const meta = defineStory({
  title: 'TextInput',
  group: 'Form',
  controls: {
    label: { type: 'text', default: 'Account name', description: 'Visible label above the field.' },
    placeholder: { type: 'text', default: 'ghp_…', description: 'Placeholder text.' },
    value: { type: 'text', default: 'octocat', description: 'Current value (bindable).' },
    invalid: { type: 'boolean', default: false, description: 'Danger border + aria-invalid.' },
    type: {
      type: 'select',
      options: ['text', 'password'],
      default: 'text',
      typeLabel: "'text' | 'password'",
      description: 'Input type.',
    },
  },
});
</script>

<script lang="ts">
import TextInput from '@/ui/TextInput.svelte';
import type { Args } from '../../lib/controls';
import Story from '../../lib/Story.svelte';
import Variant from '../../lib/Variant.svelte';

const { source }: { source: string } = $props();
</script>

<Story {meta} {source}>
  {#snippet preview(args: Args)}
    <div style="width: 18rem">
      <TextInput
        label={args.label as string}
        placeholder={args.placeholder as string}
        value={args.value as string}
        invalid={args.invalid as boolean}
        type={args.type as 'text' | 'password'}
        oninput={(v) => (args.value = v)}
      />
    </div>
  {/snippet}
  {#snippet examples()}
    <Variant label="with label">
      <TextInput label="Account name" value="octocat" />
    </Variant>
    <Variant label="placeholder">
      <TextInput ariaLabel="Token" placeholder="ghp_…" />
    </Variant>
    <Variant label="invalid">
      <TextInput label="Base URL" value="not a url" invalid />
    </Variant>
    <Variant label="password">
      <TextInput label="Token" type="password" value="supersecret" />
    </Variant>
  {/snippet}
</Story>
