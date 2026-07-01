<script module lang="ts">
import { defineStory } from '../../lib/story';

// ResultList's only scalar props (listboxId/ariaLabel) have no live preview to
// bind to here — this story shows representative examples + source, the array
// IS the matrix — so both are excluded rather than left as inert controls.
export const meta = defineStory({
  title: 'ResultList',
  group: 'Composite',
  excludeControls: {
    listboxId: 'No live preview in this story to bind an id control to — see the Examples below.',
    ariaLabel:
      'No live preview in this story to bind an ariaLabel control to — see the Examples below.',
    results: 'Array prop — no meaningful scalar control; the preview passes a fixed result list.',
    onact: 'Callback prop — no meaningful live control.',
    onescape: 'Callback prop — no meaningful live control.',
    faviconSrc: 'Callback prop — no meaningful live control.',
    alreadyOpen: 'Callback prop — no meaningful live control.',
    onready: 'Callback prop — no meaningful live control.',
    onactivedescendant: 'Callback prop — no meaningful live control.',
    onfocuschange: 'Callback prop — no meaningful live control.',
  },
});
</script>

<script lang="ts">
import type { LauncherResult } from '@/shared/launcher-contract';
import ResultList from '@/ui/ResultList.svelte';
import Surface from '@/ui/Surface.svelte';
import { favicon, noop, RESULTS } from '../../lib/mock';
import Story from '../../lib/Story.svelte';
import Variant from '../../lib/Variant.svelte';

const { source }: { source: string } = $props();

function faviconSrc(result: LauncherResult): string {
  try {
    return favicon(new URL(result.url).hostname);
  } catch {
    return favicon('example.com');
  }
}

const open = new Set(['r-tab']);
const alreadyOpen = (r: LauncherResult): boolean => open.has(r.id);
</script>

<Story {meta} {source}>
  {#snippet examples()}
    <!-- `ariaLabel` names the `role="listbox"` for a surface that focuses the list
         root directly (RESULTLIST-01). -->
    <Variant label="short list (named listbox)">
      <div style="width: 22rem">
        <Surface variant="glass" radius="lg">
          <ResultList results={RESULTS.slice(0, 3)} ariaLabel="Search results" {faviconSrc} onact={noop} onescape={noop} />
        </Surface>
      </div>
    </Variant>
    <!-- Composition coverage (component-catalog 4.5): the full launcher result set. -->
    <Variant label="composed · full launcher results">
      <div style="width: 22rem">
        <Surface variant="glass" radius="lg">
          <ResultList results={RESULTS} {faviconSrc} {alreadyOpen} onact={noop} onescape={noop} />
        </Surface>
      </div>
    </Variant>
  {/snippet}
</Story>
