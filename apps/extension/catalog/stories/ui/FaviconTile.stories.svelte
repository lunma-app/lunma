<script module lang="ts">
import { defineStory } from '../../lib/story';

export const meta = defineStory({
  title: 'FaviconTile',
  group: 'Atoms',
  controls: {
    title: { type: 'text', default: 'GitHub', description: 'Favorite title (tooltip).' },
    active: { type: 'boolean', default: false, description: 'Bound tab is focused.' },
    unbound: {
      type: 'boolean',
      default: false,
      description: 'No live tab in this window (dormant).',
    },
    loading: { type: 'boolean', default: false, description: 'Show spinner.' },
    drifted: { type: 'boolean', default: false, description: 'Tab wandered off home.' },
  },
});
</script>

<script lang="ts">
import FaviconTile from '@/ui/FaviconTile.svelte';
import type { Args } from '../../lib/controls';
import { favicon, noop } from '../../lib/mock';
import Story from '../../lib/Story.svelte';
import Variant from '../../lib/Variant.svelte';

const { source }: { source: string } = $props();
</script>

<Story {meta} {source}>
  {#snippet preview(args: Args)}
    <FaviconTile
      title={args.title as string}
      faviconSrc={favicon('github.com', 64)}
      active={args.active as boolean}
      unbound={args.unbound as boolean}
      loading={args.loading as boolean}
      drifted={args.drifted as boolean}
      homeHost="github.com"
      onGoHome={noop}
      onclick={noop}
    />
  {/snippet}
  {#snippet examples()}
    <Variant label="default"><FaviconTile title="GitHub" faviconSrc={favicon('github.com', 64)} onclick={noop} /></Variant>
    <Variant label="active (bound + focused)"><FaviconTile title="Figma" faviconSrc={favicon('figma.com', 64)} active onclick={noop} /></Variant>
    <Variant label="unbound (dormant)"><FaviconTile title="Vite" faviconSrc={favicon('vite.dev', 64)} unbound onclick={noop} /></Variant>
    <Variant label="loading"><FaviconTile title="Loading…" faviconSrc={favicon('oklch.com', 64)} loading onclick={noop} /></Variant>
    <Variant label="drifted (off home)">
      <FaviconTile title="GitHub" faviconSrc={favicon('github.com', 64)} drifted homeHost="github.com" onGoHome={noop} onclick={noop} />
    </Variant>
  {/snippet}
</Story>
