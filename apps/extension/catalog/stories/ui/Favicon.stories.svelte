<script module lang="ts">
import { defineStory } from '../../lib/story';

export const meta = defineStory({
  title: 'Favicon',
  group: 'Atoms',
  controls: {
    src: {
      type: 'text',
      default: 'https://www.google.com/s2/favicons?domain=github.com&sz=32',
      description: 'Primary favicon URL.',
    },
    size: { type: 'number', default: 32, description: 'Square pixel size.' },
    alt: { type: 'text', default: 'GitHub', description: 'Image alt text.' },
  },
});
</script>

<script lang="ts">
import Favicon from '@/ui/Favicon.svelte';
import type { Args } from '../../lib/controls';
import { favicon } from '../../lib/mock';
import Story from '../../lib/Story.svelte';
import Variant from '../../lib/Variant.svelte';

const { source }: { source: string } = $props();
</script>

<Story {meta} {source}>
  {#snippet preview(args: Args)}
    <Favicon src={args.src as string} size={args.size as number} alt={args.alt as string} />
  {/snippet}
  {#snippet examples()}
    <Variant label="16px"><Favicon src={favicon('github.com', 16)} size={16} alt="GitHub" /></Variant>
    <Variant label="32px"><Favicon src={favicon('figma.com', 32)} size={32} alt="Figma" /></Variant>
    <Variant label="fallback chain (broken primary)">
      <Favicon src="https://example.invalid/nope.png" fallbackSrc={favicon('vite.dev', 32)} size={32} alt="Vite" />
    </Variant>
    <Variant label="globe fallback (no src)"><Favicon size={32} alt="Unknown site" /></Variant>
  {/snippet}
</Story>
