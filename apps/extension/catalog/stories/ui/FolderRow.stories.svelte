<script module lang="ts">
import { defineStory } from '../../lib/story';

export const meta = defineStory({
  title: 'FolderRow',
  group: 'Composite',
  controlOverrides: {
    name: { default: 'Reading', description: 'Folder name (row label).' },
    icon: { default: 'book-open', description: 'Folder glyph (any Lucide name).' },
    expanded: { description: 'Chevron rotation state.' },
    dropTarget: { description: 'Active drop-target highlight.' },
    busy: { description: 'Spin glyph while refreshing.' },
    badge: { description: 'Trailing count badge (empty = none).' },
  },
  excludeControls: {
    color:
      'SpaceColor is an imported type alias, not an inline string-literal union — not mechanically derivable (syntactic-only parsing). See the coloured Examples below.',
    onToggle: 'Callback prop — no meaningful live control.',
    onRename: 'Callback prop — no meaningful live control.',
    onRenameCancel: 'Callback prop — no meaningful live control.',
    onStartRename: 'Callback prop — no meaningful live control.',
    onSetColor: 'Callback prop — no meaningful live control.',
    onSetIcon: 'Callback prop — no meaningful live control.',
    onDelete: 'Callback prop — no meaningful live control.',
    onMoveUp: 'Callback prop — no meaningful live control.',
    onMoveDown: 'Callback prop — no meaningful live control.',
    canMoveUp: "Only visible inside the kebab menu, which this playground doesn't open.",
    canMoveDown: "Only visible inside the kebab menu, which this playground doesn't open.",
    colors: 'Array prop — no meaningful scalar control; the preview passes the full Space palette.',
    menuItems:
      'Array prop — no meaningful scalar control; see the built-in menu in the Examples below.',
    panel: "Snippet prop — see FolderRow's composing feature for the forwarded-editor case.",
    panelTitle: "Only relevant with `panel`, which this playground doesn't demonstrate.",
    onPanelBack: 'Callback prop — no meaningful live control.',
    menuOpen: 'Read-only kebab-menu mirror — not meaningful to fiddle with here.',
    portalTo:
      'A CSS selector for a live DOM ancestor — not meaningful in the isolated catalog preview.',
  },
});
</script>

<script lang="ts">
import FolderRow from '@/ui/FolderRow.svelte';
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
        color="orange"
        expanded={args.expanded as boolean}
        dropTarget={args.dropTarget as boolean}
        busy={args.busy as boolean}
        badge={(args.badge as string) || undefined}
        ariaLabel={(args.ariaLabel as string) || undefined}
        editing={args.editing as boolean}
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
