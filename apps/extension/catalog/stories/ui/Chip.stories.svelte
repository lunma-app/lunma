<script module lang="ts">
import { defineStory } from '../../lib/story';

export const meta = defineStory({
  title: 'Chip',
  group: 'Atoms',
  controlOverrides: {
    label: { default: 'Drafts', description: 'Token text.' },
    tone: {
      description: 'Background tone. Ignored when a hue-tinted chip sets `hue` (see Examples).',
    },
    selected: { description: 'Toggle pressed state (toggle mode).' },
    disabled: { description: 'Disables the toggle pill.' },
  },
  excludeControls: {
    onRemove: 'Callback prop — see the "removable" example below.',
    onToggle:
      'Callback prop — this playground is always in toggle mode; see the static-chip examples below.',
    testid: 'data-testid passthrough — not meaningful to fiddle with here.',
    hue: 'Only relevant to the static (non-toggle) chip this playground doesn\'t render — see the hue-tinted Examples below. Also unsafe as a naive number control: 0 is a real hue, not "unset".',
    size: "Only relevant to the static (non-toggle) chip this playground doesn't render — see the hue-tinted Examples below.",
    iconUrl:
      'Only relevant to the static (non-toggle) chip this playground doesn\'t render — see the "with icon" example below.',
    removeLabel:
      'Only relevant with onRemove, which this playground doesn\'t demonstrate — see the "removable" example below.',
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
      disabled={args.disabled as boolean}
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
    <!-- `ariaLabel` overrides the accessible name when the visible text is
         ambiguous out of context (e.g. a boolean playground control): announces
         "Dark mode" while showing "true". -->
    <Variant label="toggle · ariaLabel override"><Chip label="true" onToggle={noop} selected ariaLabel="Dark mode" /></Variant>
    <!-- Hue-tinted status/verdict token. -->
    <Variant label="hue · status sm (green)"><Chip label="Open" hue={150} /></Variant>
    <Variant label="hue · status sm (red)"><Chip label="Blocked" hue={25} /></Variant>
    <Variant label="hue · verdict md (blue)"><Chip label="Approved" hue={252} size="md" /></Variant>
    <Variant label="hue · verdict md (purple)"><Chip label="Review" hue={295} size="md" /></Variant>
  {/snippet}
</Story>
