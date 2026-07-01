<script module lang="ts">
import { defineStory } from '../../lib/story';

export const meta = defineStory({
  title: 'Button',
  group: 'Atoms',
  controlOverrides: {
    variant: { description: 'Style variant.' },
    size: { description: 'Control density.' },
    disabled: { description: 'Disabled state.' },
  },
  excludeControls: {
    onclick: 'Callback prop — no meaningful live control.',
    children:
      'Snippet prop — button content is rendered by the preview snippet below, not a control.',
    title: 'Passthrough HTML title attribute — not meaningful to fiddle with here.',
    testid: 'data-testid passthrough — not meaningful to fiddle with here.',
  },
});
</script>

<script lang="ts">
import Button from '@/ui/Button.svelte';
import type { Args } from '../../lib/controls';
import { noop } from '../../lib/mock';
import Story from '../../lib/Story.svelte';
import Variant from '../../lib/Variant.svelte';

const { source }: { source: string } = $props();
</script>

<Story {meta} {source}>
  {#snippet preview(args: Args)}
    <Button
      variant={args.variant as 'primary' | 'secondary' | 'ghost'}
      size={args.size as 'sm' | 'md'}
      disabled={args.disabled as boolean}
      onclick={noop}
    >
      Save changes
    </Button>
  {/snippet}
  {#snippet examples()}
    <Variant label="primary · md"><Button variant="primary" onclick={noop}>Save changes</Button></Variant>
    <Variant label="secondary · md"><Button variant="secondary" onclick={noop}>Cancel</Button></Variant>
    <Variant label="ghost · md"><Button variant="ghost" onclick={noop}>Skip</Button></Variant>
    <Variant label="primary · sm"><Button variant="primary" size="sm" onclick={noop}>Save</Button></Variant>
    <Variant label="disabled"><Button variant="primary" disabled onclick={noop}>Save changes</Button></Variant>
  {/snippet}
</Story>
