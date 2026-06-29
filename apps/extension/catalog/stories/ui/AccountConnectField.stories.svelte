<script module lang="ts">
import { defineStory } from '../../lib/story';

export const meta = defineStory({
  title: 'AccountConnectField',
  group: 'Composite',
  controls: {
    host: {
      type: 'text',
      default: 'github.com',
      description: 'Account host (labels / aria target).',
    },
    requirement: {
      type: 'select',
      options: ['required', 'optional'],
      default: 'required',
      typeLabel: "'required' | 'optional'",
      description: 'Token necessity.',
    },
    hasToken: {
      type: 'boolean',
      default: false,
      description: 'Whether a token is stored (collapses the field).',
    },
    error: { type: 'text', default: '', description: 'Error message to render (empty = none).' },
  },
});
</script>

<script lang="ts">
import AccountConnectField from '@/ui/AccountConnectField.svelte';
import type { Args } from '../../lib/controls';
import { noop } from '../../lib/mock';
import Story from '../../lib/Story.svelte';
import Variant from '../../lib/Variant.svelte';

const { source }: { source: string } = $props();
</script>

<Story {meta} {source}>
  {#snippet preview(args: Args)}
    <div style="width: 20rem">
      <AccountConnectField
        host={args.host as string}
        requirement={args.requirement as 'required' | 'optional'}
        hasToken={args.hasToken as boolean}
        onConnect={noop}
        onReplace={noop}
        error={(args.error as string) || undefined}
      />
    </div>
  {/snippet}
  {#snippet examples()}
    <Variant label="required · no token">
      <div style="width: 20rem">
        <AccountConnectField host="github.com" requirement="required" hasToken={false} onConnect={noop} />
      </div>
    </Variant>
    <Variant label="optional · no token">
      <div style="width: 20rem">
        <AccountConnectField host="gitlab.com" requirement="optional" hasToken={false} onConnect={noop} />
      </div>
    </Variant>
    <Variant label="token set (collapsed)">
      <div style="width: 20rem">
        <AccountConnectField host="github.com" requirement="required" hasToken onConnect={noop} onReplace={noop} />
      </div>
    </Variant>
    <!-- A `required` field sets `aria-required` on the input (ACF-02); when `error`
         is set the input's `aria-describedby` points at the `InlineError` `id` so the
         message re-announces on refocus (ACF-03). -->
    <Variant label="error">
      <div style="width: 20rem">
        <AccountConnectField
          host="github.com"
          requirement="required"
          hasToken={false}
          onConnect={noop}
          error="That token was rejected (needs repo scope)."
        />
      </div>
    </Variant>
  {/snippet}
</Story>
