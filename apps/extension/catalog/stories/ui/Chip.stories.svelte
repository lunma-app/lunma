<script module lang="ts">
import { defineStory } from '../../lib/story';

export const meta = defineStory({
  title: 'Chip',
  group: 'Atoms',
  controls: {
    label: { type: 'text', default: 'Drafts', description: 'Token text.' },
    tone: {
      type: 'select',
      options: ['neutral', 'accent'],
      default: 'neutral',
      typeLabel: "'neutral' | 'accent'",
      description: 'Background tone.',
    },
    selected: {
      type: 'boolean',
      default: false,
      description: 'Toggle pressed state (toggle mode).',
    },
  },
});
</script>

<script lang="ts">
import Chip from '@/ui/Chip.svelte';
import type { Args } from '../../lib/controls';
import { favicon, noop } from '../../lib/mock';
import Story from '../../lib/Story.svelte';
import Variant from '../../lib/Variant.svelte';

const { source }: { source: string } = $props();
</script>

<Story {meta} {source}>
  {#snippet preview(args: Args)}
    <Chip
      label={args.label as string}
      tone={args.tone as 'neutral' | 'accent'}
      selected={args.selected as boolean}
      onToggle={() => (args.selected = !args.selected)}
    />
  {/snippet}
  {#snippet examples()}
    <Variant label="neutral"><Chip label="bookmark" /></Variant>
    <Variant label="accent"><Chip label="github.com" tone="accent" /></Variant>
    <Variant label="with icon"><Chip label="DuckDuckGo" tone="accent" iconUrl={favicon('duckduckgo.com')} /></Variant>
    <Variant label="removable"><Chip label="svelte" onRemove={noop} /></Variant>
    <Variant label="toggle · off"><Chip label="Drafts" onToggle={noop} /></Variant>
    <Variant label="toggle · on"><Chip label="Drafts" onToggle={noop} selected /></Variant>
    <!-- Hue-tinted status/verdict token. -->
    <Variant label="hue · status sm (green)"><Chip label="Open" hue={150} /></Variant>
    <Variant label="hue · status sm (red)"><Chip label="Blocked" hue={25} /></Variant>
    <Variant label="hue · verdict md (blue)"><Chip label="Approved" hue={252} size="md" /></Variant>
    <Variant label="hue · verdict md (purple)"><Chip label="Review" hue={295} size="md" /></Variant>
  {/snippet}
</Story>
