<script module lang="ts">
import { defineStory } from '../../lib/story';

export const meta = defineStory({
  title: 'Stack',
  group: 'Layout',
  controls: {
    direction: {
      type: 'select',
      options: ['column', 'row'],
      default: 'column',
      typeLabel: "'row' | 'column'",
      description: 'Flex direction.',
    },
    gap: {
      type: 'select',
      options: ['1', '2', '3', '4'],
      default: '2',
      typeLabel: "'1' | '2' | '3' | '4'",
      description: 'Space-token gap scale.',
    },
    align: {
      type: 'select',
      options: ['start', 'center', 'end'],
      default: 'start',
      typeLabel: "'start' | 'center' | 'end'",
      description: 'align-items.',
    },
    justify: {
      type: 'select',
      options: ['start', 'center', 'end', 'between'],
      default: 'start',
      typeLabel: "'start' | 'center' | 'end' | 'between'",
      description: 'justify-content.',
    },
  },
});
</script>

<script lang="ts">
import Button from '@/ui/Button.svelte';
import Stack from '@/ui/Stack.svelte';
import type { Args } from '../../lib/controls';
import { noop } from '../../lib/mock';
import Story from '../../lib/Story.svelte';
import Variant from '../../lib/Variant.svelte';

const { source }: { source: string } = $props();
</script>

<Story {meta} {source}>
  {#snippet preview(args: Args)}
    <div style="width: 16rem">
      <Stack
        direction={args.direction as 'row' | 'column'}
        gap={args.gap as '1' | '2' | '3' | '4'}
        align={args.align as 'start' | 'center' | 'end'}
        justify={args.justify as 'start' | 'center' | 'end' | 'between'}
      >
        <Button variant="secondary" size="sm" onclick={noop}>One</Button>
        <Button variant="primary" size="sm" onclick={noop}>Two</Button>
        <Button variant="ghost" size="sm" onclick={noop}>Three</Button>
      </Stack>
    </div>
  {/snippet}
  {#snippet examples()}
    <Variant label="column · gap 2">
      <Stack gap="2">
        <Button variant="secondary" size="sm" onclick={noop}>One</Button>
        <Button variant="secondary" size="sm" onclick={noop}>Two</Button>
        <Button variant="secondary" size="sm" onclick={noop}>Three</Button>
      </Stack>
    </Variant>
    <Variant label="row · gap 3 · center">
      <Stack direction="row" gap="3" align="center">
        <Button variant="secondary" size="sm" onclick={noop}>One</Button>
        <Button variant="primary" size="sm" onclick={noop}>Two</Button>
      </Stack>
    </Variant>
    <Variant label="row · justify between">
      <div style="width: 14rem">
        <Stack direction="row" justify="between">
          <Button variant="ghost" size="sm" onclick={noop}>Back</Button>
          <Button variant="primary" size="sm" onclick={noop}>Next</Button>
        </Stack>
      </div>
    </Variant>
  {/snippet}
</Story>
