<script module lang="ts">
import { defineStory } from '../../lib/story';

export const meta = defineStory({
  title: 'ResultRow',
  group: 'Composite',
  controlOverrides: {
    title: { default: 'svelte/svelte · Pull Request #14201', description: 'Result title.' },
    url: {
      default: 'https://github.com/sveltejs/svelte/pull/14201',
      description: 'Result URL (dimmed).',
    },
    selected: { description: 'Roving keyboard selection.' },
    alreadyOpen: { description: 'Tab-dedup "already open" line.' },
  },
  excludeControls: {
    source:
      'ResultSource is an imported type alias, not an inline string-literal union — not mechanically derivable (syntactic-only parsing). See the per-source Examples below.',
    id: 'Stable DOM id for aria-activedescendant wiring — not meaningful to fiddle with here.',
    tabindex: 'Roving-tabindex wiring — not meaningful to fiddle with in an isolated preview.',
    onclick: 'Callback prop — no meaningful live control.',
    onhover: 'Callback prop — no meaningful live control.',
  },
});
</script>

<script lang="ts">
import ResultRow from '@/ui/ResultRow.svelte';
import type { Args } from '../../lib/controls';
import { favicon, noop } from '../../lib/mock';
import Story from '../../lib/Story.svelte';
import Variant from '../../lib/Variant.svelte';

const { source }: { source: string } = $props();
</script>

<Story {meta} {source}>
  {#snippet preview(args: Args)}
    <div style="width: 22rem">
      <ResultRow
        title={args.title as string}
        url={args.url as string}
        source="tab"
        faviconSrc={(args.faviconSrc as string) || favicon('github.com')}
        selected={args.selected as boolean}
        alreadyOpen={args.alreadyOpen as boolean}
        spaceName={(args.spaceName as string) || undefined}
        spaceColor={(args.spaceColor as string) || undefined}
        onclick={noop}
      />
    </div>
  {/snippet}
  {#snippet examples()}
    <Variant label="tab">
      <div style="width: 22rem">
        <ResultRow title="svelte/svelte · Pull Request #14201" url="https://github.com/sveltejs/svelte/pull/14201" source="tab" faviconSrc={favicon('github.com')} onclick={noop} />
      </div>
    </Variant>
    <Variant label="selected (roving)">
      <div style="width: 22rem">
        <ResultRow title="Immersive shell — Figma" url="https://figma.com/file/abc" source="saved" faviconSrc={favicon('figma.com')} selected onclick={noop} />
      </div>
    </Variant>
    <Variant label="already open">
      <div style="width: 22rem">
        <ResultRow title="OKLCH colour picker" url="https://oklch.com" source="bookmark" faviconSrc={favicon('oklch.com')} alreadyOpen onclick={noop} />
      </div>
    </Variant>
    <Variant label="cross-Space marker">
      <div style="width: 22rem">
        <ResultRow title="Reading list — Longform" url="https://longform.org" source="saved" faviconSrc={favicon('longform.org')} spaceName="Reading" spaceColor="oklch(0.73 0.16 55)" onclick={noop} />
      </div>
    </Variant>
    <Variant label="websearch action">
      <div style="width: 22rem">
        <ResultRow title={'Search DuckDuckGo for "svelte 5 runes"'} url="https://duckduckgo.com/?q=svelte+5+runes" source="websearch" onclick={noop} />
      </div>
    </Variant>
    <!-- `tabindex={-1}` keeps the option out of the tab sequence under the
         combobox `aria-activedescendant` model (the launcher composition; the row
         looks identical, DOM focus stays on the input). -->
    <Variant label="activedescendant (tabindex -1)">
      <div style="width: 22rem">
        <ResultRow title="svelte/svelte · Pull Request #14201" url="https://github.com/sveltejs/svelte/pull/14201" source="tab" faviconSrc={favicon('github.com')} tabindex={-1} onclick={noop} />
      </div>
    </Variant>
  {/snippet}
</Story>
