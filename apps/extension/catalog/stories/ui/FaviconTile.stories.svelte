<script module lang="ts">
import { defineStory } from '../../lib/story';

export const meta = defineStory({
  title: 'FaviconTile',
  group: 'Atoms',
  controlOverrides: {
    title: { default: 'GitHub', description: 'Favorite title (tooltip).' },
    active: { description: 'Bound tab is focused.' },
    unbound: { description: 'No live tab in this window (dormant).' },
    loading: { description: 'Show spinner.' },
    drifted: { description: 'Tab wandered off home.' },
  },
  excludeControls: {
    onGoHome: 'Callback prop — no meaningful live control.',
    onclick: 'Callback prop — no meaningful live control.',
    oncontextmenu: 'Callback prop — no meaningful live control.',
    tabindex: 'Roving-tabindex wiring — not meaningful to fiddle with in an isolated preview.',
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
      faviconSrc={(args.faviconSrc as string) || favicon('github.com', 64)}
      faviconFallbackSrc={(args.faviconFallbackSrc as string) || undefined}
      active={args.active as boolean}
      unbound={args.unbound as boolean}
      loading={args.loading as boolean}
      drifted={args.drifted as boolean}
      favoriting={args.favoriting as boolean}
      homeHost={(args.homeHost as string) || 'github.com'}
      onGoHome={noop}
      onclick={noop}
    />
  {/snippet}
  {#snippet examples()}
    <Variant label="default"><FaviconTile title="GitHub" faviconSrc={favicon('github.com', 64)} onclick={noop} /></Variant>
    <!-- `active` adds `aria-current="true"` (FAVICONTILE-NEW2); `loading` adds
         `aria-busy="true"` (FAVICONTENT-01) — neither is colour/spinner-only now. -->
    <Variant label="active (bound + focused)"><FaviconTile title="Figma" faviconSrc={favicon('figma.com', 64)} active onclick={noop} /></Variant>
    <Variant label="unbound (dormant)"><FaviconTile title="Vite" faviconSrc={favicon('vite.dev', 64)} unbound onclick={noop} /></Variant>
    <Variant label="loading"><FaviconTile title="Loading…" faviconSrc={favicon('oklch.com', 64)} loading onclick={noop} /></Variant>
    <Variant label="drifted · returnable (Return home)">
      <FaviconTile title="GitHub" faviconSrc={favicon('github.com', 64)} drifted homeHost="github.com" onGoHome={noop} onclick={noop} />
    </Variant>
    <!-- Drifted with no resolvable home host: the off-home state is folded into the
         accessible name ("…— off home") since the dot is decorative (FAVICONTILE-NEW1). -->
    <Variant label="drifted · no home (off home in name)">
      <FaviconTile title="GitHub" faviconSrc={favicon('github.com', 64)} drifted onclick={noop} />
    </Variant>
  {/snippet}
</Story>
