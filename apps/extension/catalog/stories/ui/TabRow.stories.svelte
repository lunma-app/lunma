<script module lang="ts">
import { defineStory } from '../../lib/story';

export const meta = defineStory({
  title: 'TabRow',
  group: 'Composite',
  controls: {
    title: {
      type: 'text',
      default: 'svelte/svelte · Pull Request #14201',
      description: 'Tab title.',
    },
    active: { type: 'boolean', default: false, description: 'Active-tab Space-wash treatment.' },
    loading: { type: 'boolean', default: false, description: 'Favicon → spinner.' },
    drifted: { type: 'boolean', default: false, description: 'Tab wandered off home.' },
    meta: { type: 'text', default: '', description: 'Right-edge metadata (e.g. archived age).' },
  },
});
</script>

<script lang="ts">
import IconButton from '@/ui/IconButton.svelte';
import TabRow from '@/ui/TabRow.svelte';
import type { Args } from '../../lib/controls';
import { favicon, noop } from '../../lib/mock';
import Story from '../../lib/Story.svelte';
import Variant from '../../lib/Variant.svelte';

const { source }: { source: string } = $props();
</script>

{#snippet closeAction()}
  <IconButton icon="x" ariaLabel="Close tab" onclick={noop} />
{/snippet}

<Story {meta} {source}>
  {#snippet preview(args: Args)}
    <div style="width: 18rem">
      <TabRow
        title={args.title as string}
        faviconSrc={favicon('github.com')}
        active={args.active as boolean}
        loading={args.loading as boolean}
        drifted={args.drifted as boolean}
        homeHost="github.com"
        onGoHome={noop}
        meta={(args.meta as string) || undefined}
        onclick={noop}
      />
    </div>
  {/snippet}
  {#snippet examples()}
    <Variant label="default">
      <div style="width: 18rem">
        <TabRow title="svelte/svelte · Pull Request #14201" faviconSrc={favicon('github.com')} onclick={noop} />
      </div>
    </Variant>
    <Variant label="active (Space wash)">
      <div style="width: 18rem">
        <TabRow title="Immersive shell — Figma" faviconSrc={favicon('figma.com')} active onclick={noop} />
      </div>
    </Variant>
    <Variant label="loading">
      <div style="width: 18rem">
        <TabRow title="Loading…" faviconSrc={favicon('vite.dev')} loading onclick={noop} />
      </div>
    </Variant>
    <Variant label="with meta + trailing close">
      <div style="width: 18rem">
        <TabRow title="Vite 8 release notes" faviconSrc={favicon('vite.dev')} meta="2d" trailing={closeAction} trailingVisible onclick={noop} />
      </div>
    </Variant>
    <Variant label="drifted (off home)">
      <div style="width: 18rem">
        <TabRow title="GitHub" faviconSrc={favicon('github.com')} drifted homeHost="github.com" onGoHome={noop} onclick={noop} />
      </div>
    </Variant>
  {/snippet}
</Story>
