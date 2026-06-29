<script module lang="ts">
import { defineStory } from '../../lib/story';

export const meta = defineStory({
  title: 'FolderRow',
  group: 'Composite',
  controls: {
    name: { type: 'text', default: 'Reading', description: 'Folder name (row label).' },
    icon: { type: 'text', default: 'book-open', description: 'Folder glyph (any Lucide name).' },
    color: {
      type: 'select',
      options: [
        'red',
        'orange',
        'yellow',
        'green',
        'teal',
        'cyan',
        'blue',
        'purple',
        'pink',
        'gray',
      ],
      default: 'orange',
      typeLabel: 'SpaceColor',
      description: 'Folder colour identity.',
    },
    expanded: { type: 'boolean', default: false, description: 'Chevron rotation state.' },
    dropTarget: { type: 'boolean', default: false, description: 'Active drop-target highlight.' },
    busy: { type: 'boolean', default: false, description: 'Spin glyph while refreshing.' },
    badge: { type: 'text', default: '', description: 'Trailing count badge (empty = none).' },
  },
});
</script>

<script lang="ts">
import FolderRow from '@/ui/FolderRow.svelte';
import type { SpaceColor } from '@/shared/types';
import type { Args } from '../../lib/controls';
import { noop, SPACE_COLORS } from '../../lib/mock';
import Story from '../../lib/Story.svelte';
import Variant from '../../lib/Variant.svelte';

const { source }: { source: string } = $props();
</script>

<Story {meta} {source}>
  {#snippet preview(args: Args)}
    <div style="width: 16rem">
      <FolderRow
        name={args.name as string}
        icon={args.icon as string}
        color={args.color as SpaceColor}
        expanded={args.expanded as boolean}
        dropTarget={args.dropTarget as boolean}
        busy={args.busy as boolean}
        badge={(args.badge as string) || undefined}
        onToggle={noop}
        colors={SPACE_COLORS}
      />
    </div>
  {/snippet}
  {#snippet examples()}
    <Variant label="collapsed">
      <div style="width: 16rem">
        <FolderRow name="Reading" icon="book-open" color="orange" onToggle={noop} colors={SPACE_COLORS} />
      </div>
    </Variant>
    <Variant label="expanded">
      <div style="width: 16rem">
        <FolderRow name="Design" icon="palette" color="purple" expanded onToggle={noop} colors={SPACE_COLORS} />
      </div>
    </Variant>
    <Variant label="with badge (smart folder)">
      <div style="width: 16rem">
        <FolderRow name="Open PRs" icon="git-pull-request" color="green" badge="7" onToggle={noop} colors={SPACE_COLORS} />
      </div>
    </Variant>
    <Variant label="drop target">
      <div style="width: 16rem">
        <FolderRow name="Inbox" icon="inbox" color="blue" dropTarget onToggle={noop} colors={SPACE_COLORS} />
      </div>
    </Variant>
    <!-- `busy` sets `aria-busy="true"` on the row; the spinning glyph stays
         decorative (API-06). -->
    <Variant label="busy (refreshing)">
      <div style="width: 16rem">
        <FolderRow name="Open PRs" icon="git-pull-request" color="green" busy onToggle={noop} colors={SPACE_COLORS} />
      </div>
    </Variant>
  {/snippet}
</Story>
