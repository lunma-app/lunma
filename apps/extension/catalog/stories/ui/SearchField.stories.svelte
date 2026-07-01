<script module lang="ts">
import { defineStory } from '../../lib/story';

export const meta = defineStory({
  title: 'SearchField',
  group: 'Form',
  controlOverrides: {
    placeholder: {
      default: 'Search tabs, bookmarks…',
      description: 'Placeholder / trigger label.',
    },
    value: { description: 'Current value (input mode).' },
    ariaLabel: {
      default: 'Search',
      description: 'Accessible name (input falls back to the placeholder when unset).',
    },
    kbd: { default: '⌥L', description: 'Trailing keyboard hint.' },
  },
  excludeControls: {
    mode: 'SearchFieldMode is an imported type alias, not an inline string-literal union — not mechanically derivable (syntactic-only parsing). See the trigger-mode example below.',
    leading: 'Snippet prop — see the "engine mode" example below.',
    leadingIcon:
      'IconName is an imported type alias, not an inline string-literal union — not mechanically derivable (syntactic-only parsing).',
    oninput: 'Callback prop — the preview binds it back to the value control above.',
    onenter: 'Callback prop — no meaningful live control.',
    onkeydown: 'Callback prop — no meaningful live control.',
    onclick: 'Callback prop — no meaningful live control.',
    testid: 'data-testid passthrough — not meaningful to fiddle with here.',
    autofocus:
      'Stealing page focus on every story mount would hijack the catalog itself — not meaningful to fiddle with here.',
    combobox:
      'Only meaningful paired with `controls`/`expanded`/`activeDescendant` — an all-or-nothing aria-combobox wiring group, not a standalone control.',
    controls: 'Only meaningful paired with `combobox` — see above.',
    expanded: 'Only meaningful paired with `combobox` — see above.',
    activeDescendant: 'Only meaningful paired with `combobox` — see above.',
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
        mode="input"
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
