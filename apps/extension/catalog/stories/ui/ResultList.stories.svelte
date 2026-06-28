<script module lang="ts">
import { defineStory } from '../../lib/story';

// ResultList's props are arrays/callbacks (no scalar props to expose), so this
// story shows representative examples + source; the array IS the matrix.
export const meta = defineStory({ title: 'ResultList', group: 'Composite' });
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
    <Variant label="short list">
      <div style="width: 22rem">
        <Surface variant="glass" radius="lg">
          <ResultList results={RESULTS.slice(0, 3)} {faviconSrc} onact={noop} onescape={noop} />
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
