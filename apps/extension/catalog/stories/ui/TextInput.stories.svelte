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
    required: { type: 'boolean', default: false, description: 'Sets aria-required="true".' },
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
import InlineError from '@/ui/InlineError.svelte';
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
        required={args.required as boolean}
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
      <TextInput label="Token" type="password" value="supersecret" autocomplete="current-password" />
    </Variant>
    <!-- `required` + `describedById` ↔ `InlineError` `id`: the error is announced on
         inject (role="alert") AND re-announced on refocus as the field's
         description (ACF-02/ACF-03, TI-01/TI-03, API-04). -->
    <Variant label="required + described error">
      <div style="width: 18rem">
        <TextInput
          label="Account name"
          value="not a url"
          required
          invalid
          autocomplete="username"
          describedById="ti-story-err"
        />
        <InlineError id="ti-story-err" message="That account name didn't work." />
      </div>
    </Variant>
  {/snippet}
</Story>
