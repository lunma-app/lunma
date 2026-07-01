<script module lang="ts">
import { defineStory } from '../../lib/story';

export const meta = defineStory({
  title: 'TabRow',
  group: 'Composite',
  controlOverrides: {
    title: { default: 'svelte/svelte · Pull Request #14201', description: 'Tab title.' },
    active: { description: 'Active-tab Space-wash treatment.' },
    loading: { description: 'Favicon → spinner.' },
    drifted: { description: 'Tab wandered off home.' },
    meta: { description: 'Right-edge metadata (e.g. archived age).' },
  },
  excludeControls: {
    onGoHome: 'Callback prop — no meaningful live control.',
    onclick: 'Callback prop — no meaningful live control.',
    trailing: 'Snippet prop — see the "with meta + trailing close" example below.',
    oncommitName: 'Callback prop — no meaningful live control.',
    oncancelName: 'Callback prop — no meaningful live control.',
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
        faviconSrc={(args.faviconSrc as string) || favicon('github.com')}
        faviconFallbackSrc={(args.faviconFallbackSrc as string) || undefined}
        active={args.active as boolean}
        loading={args.loading as boolean}
        drifted={args.drifted as boolean}
        homeHost={(args.homeHost as string) || 'github.com'}
        onGoHome={noop}
        meta={(args.meta as string) || undefined}
        trailingVisible={args.trailingVisible as boolean}
        editing={args.editing as boolean}
        renameAllowEmpty={args.renameAllowEmpty as boolean}
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
    <!-- `active` now also sets `aria-current="true"` on the title button so the
         current tab is programmatically determinable, not wash-only (TABROW-01). -->
    <Variant label="active (Space wash)">
      <div style="width: 18rem">
        <TabRow title="Immersive shell — Figma" faviconSrc={favicon('figma.com')} active onclick={noop} />
      </div>
    </Variant>
    <!-- `loading` sets `aria-busy="true"` on the row; the spinner stays
         decorative (TABROW-02). -->
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
