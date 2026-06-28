<script module lang="ts">
import { defineStory } from '../../lib/story';

export const meta = defineStory({
  title: 'LensRow',
  group: 'Composite',
  controls: {
    name: { type: 'text', default: 'Review requested', description: 'Lens name (row label).' },
    icon: {
      type: 'text',
      default: 'git-pull-request',
      description: 'Lens glyph (any Lucide name).',
    },
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
      default: 'purple',
      typeLabel: 'SpaceColor',
      description: 'Identity colour tinting the glyph.',
    },
    active: { type: 'boolean', default: false, description: 'Active "peek" wash + ring.' },
    expanded: { type: 'boolean', default: false, description: 'Chevron rotation state.' },
    busy: { type: 'boolean', default: false, description: 'Spin glyph during refresh.' },
    badge: { type: 'text', default: '4', description: 'Trailing count badge (empty = none).' },
  },
});
</script>

<script lang="ts">
import type { SpaceColor } from '@/shared/types';
import LensRow from '@/ui/LensRow.svelte';
import type { Args } from '../../lib/controls';
import { LENSES, noop } from '../../lib/mock';
import Story from '../../lib/Story.svelte';
import Variant from '../../lib/Variant.svelte';

const { source }: { source: string } = $props();
</script>

<Story {meta} {source}>
  {#snippet preview(args: Args)}
    <div style="width: 16rem">
      <LensRow
        name={args.name as string}
        icon={args.icon as string}
        color={args.color as SpaceColor}
        active={args.active as boolean}
        expanded={args.expanded as boolean}
        busy={args.busy as boolean}
        badge={(args.badge as string) || undefined}
        onToggle={noop}
        onOpenPage={noop}
      />
    </div>
  {/snippet}
  {#snippet examples()}
    <Variant label="default">
      <div style="width: 16rem">
        <LensRow name="Review requested" icon="git-pull-request" color="purple" badge="4" onToggle={noop} onOpenPage={noop} />
      </div>
    </Variant>
    <Variant label="active (peek)">
      <div style="width: 16rem">
        <LensRow name="Assigned to me" icon="user-check" color="blue" active badge="2" onToggle={noop} onOpenPage={noop} />
      </div>
    </Variant>
    <Variant label="expanded">
      <div style="width: 16rem">
        <LensRow name="Authored" icon="git-commit-horizontal" color="green" expanded onToggle={noop} onOpenPage={noop} />
      </div>
    </Variant>
    <Variant label="busy (refreshing)">
      <div style="width: 16rem">
        <LensRow name="Review requested" icon="git-pull-request" color="purple" busy onToggle={noop} />
      </div>
    </Variant>
    <!-- Composition coverage (component-catalog 4.5): a realistic stacked lens list. -->
    <Variant label="composed · stacked lens list">
      <div style="width: 16rem; display:flex; flex-direction:column; gap:2px">
        {#each LENSES as lens, i (lens.name)}
          <LensRow
            name={lens.name}
            icon={lens.icon}
            color={lens.color}
            active={i === 0}
            badge={lens.badge}
            onToggle={noop}
            onOpenPage={noop}
          />
        {/each}
      </div>
    </Variant>
  {/snippet}
</Story>
