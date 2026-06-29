<script module lang="ts">
import { defineStory } from '../../lib/story';

export const meta = defineStory({
  title: 'SearchField',
  group: 'Form',
  controls: {
    mode: {
      type: 'select',
      options: ['input', 'trigger'],
      default: 'input',
      typeLabel: "'trigger' | 'input'",
      description: 'Live field or button.',
    },
    placeholder: {
      type: 'text',
      default: 'Search tabs, bookmarks…',
      description: 'Placeholder / trigger label.',
    },
    value: { type: 'text', default: '', description: 'Current value (input mode).' },
    ariaLabel: {
      type: 'text',
      default: 'Search',
      description: 'Accessible name (input falls back to the placeholder when unset).',
    },
    kbd: { type: 'text', default: '⌥L', description: 'Trailing keyboard hint.' },
  },
});
</script>

<script lang="ts">
import Chip from '@/ui/Chip.svelte';
import SearchField from '@/ui/SearchField.svelte';
import type { Args } from '../../lib/controls';
import { favicon, noop } from '../../lib/mock';
import Story from '../../lib/Story.svelte';
import Variant from '../../lib/Variant.svelte';

const { source }: { source: string } = $props();
</script>

{#snippet engineChip()}
  <Chip label="DuckDuckGo" tone="accent" iconUrl={favicon('duckduckgo.com')} onRemove={noop} />
{/snippet}

<Story {meta} {source}>
  {#snippet preview(args: Args)}
    <div style="width: 18rem">
      <SearchField
        mode={args.mode as 'input' | 'trigger'}
        placeholder={args.placeholder as string}
        value={args.value as string}
        ariaLabel={args.ariaLabel as string}
        kbd={args.kbd as string}
        oninput={(v) => (args.value = v)}
        onclick={noop}
      />
    </div>
  {/snippet}
  {#snippet examples()}
    <!-- Input mode passes an explicit `ariaLabel` (modelled usage); without it the
         field now falls back to the placeholder for its name, matching trigger
         mode (SF-01). -->
    <Variant label="input mode">
      <div style="width: 18rem">
        <SearchField mode="input" ariaLabel="Search tabs and bookmarks" placeholder="Search tabs, bookmarks…" kbd="⌥L" />
      </div>
    </Variant>
    <Variant label="trigger mode">
      <div style="width: 18rem">
        <SearchField mode="trigger" placeholder="Search…" kbd="⌥L" onclick={noop} />
      </div>
    </Variant>
    <Variant label="engine mode (leading chip)">
      <div style="width: 18rem">
        <SearchField mode="input" placeholder="Search DuckDuckGo…" leading={engineChip} />
      </div>
    </Variant>
  {/snippet}
</Story>
