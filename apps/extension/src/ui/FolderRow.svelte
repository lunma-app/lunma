<script lang="ts">
import type { Snippet } from 'svelte';
import type { IconName } from '../shared/icon-names';
import { colourToHue } from '../shared/space-hue';
import type { SpaceColor } from '../shared/types';
import ColorSwatch from './ColorSwatch.svelte';
import EditableLabel from './EditableLabel.svelte';
import Icon from './Icon.svelte';
import IconPicker from './IconPicker.svelte';
import RowMenu, { type RowMenuItem } from './RowMenu.svelte';

interface Props {
  /** Folder name (the row label). */
  name: string;
  /** Folder glyph (a lucide icon name). */
  icon: IconName;
  /** Folder colour identity — tints the glyph and the drop-target highlight. */
  color: SpaceColor;
  /** Whether the folder is expanded (rotates the chevron 0°→90°). */
  expanded?: boolean | undefined;
  /** Highlight as the active drop-into target during a drag. */
  dropTarget?: boolean | undefined;
  /** Toggle expand/collapse (chevron + label click). */
  onToggle?: (() => void) | undefined;
  /** Accessible label override; defaults to `name`. */
  label?: string | undefined;
  /** When true, the name becomes an inline editable field (rename in place). */
  editing?: boolean | undefined;
  /** Commit a rename (Enter or blur with a non-empty value). */
  onRename?: ((name: string) => void) | undefined;
  /** Abandon a rename (Escape, or blur with an empty value). */
  onRenameCancel?: (() => void) | undefined;
  /** Begin rename-in-place (the "Rename" action). */
  onStartRename?: (() => void) | undefined;
  /** Set the folder colour (an "Icon & colour" swatch pick). */
  onSetColor?: ((color: SpaceColor) => void) | undefined;
  /** Set the folder icon (an "Icon & colour" picker pick). */
  onSetIcon?: ((icon: IconName) => void) | undefined;
  /** Delete the folder (the destructive action). */
  onDelete?: (() => void) | undefined;
  /** The colour palette for the inline swatch row. */
  colors?: readonly SpaceColor[];
}

const {
  name,
  icon,
  color,
  expanded = false,
  dropTarget = false,
  onToggle,
  label,
  editing = false,
  onRename,
  onRenameCancel,
  onStartRename,
  onSetColor,
  onSetIcon,
  onDelete,
  colors = [],
}: Props = $props();

const hue = $derived(colourToHue(color));

// Action-morph state + the in-drawer icon/colour panel toggle.
let menuOpen = $state(false);
let showAppearance = $state(false);

const menuItems = $derived<RowMenuItem[]>([
  { id: 'rename', label: 'Rename', icon: 'pencil', onSelect: () => onStartRename?.() },
  {
    id: 'appearance',
    label: 'Icon & colour',
    icon: 'palette',
    keepOpen: true,
    onSelect: () => {
      showAppearance = !showAppearance;
    },
  },
  {
    id: 'delete-folder',
    label: 'Delete folder',
    icon: 'trash-2',
    danger: true,
    onSelect: () => onDelete?.(),
  },
]);

function onMenuOpenChange(open: boolean): void {
  if (!open) showAppearance = false;
}
</script>

<RowMenu
  items={menuItems}
  label="Folder actions"
  bind:open={menuOpen}
  onOpenChange={onMenuOpenChange}
  testidPrefix="folder-row-menu"
  header={folderHeader}
>
  {#snippet panel()}
    {#if showAppearance}
      <div class="appearance" data-testid="folder-appearance">
        <div class="swatch-row" role="radiogroup" aria-label="Folder colour">
          {#each colors as c (c)}
            <ColorSwatch color={c} selected={c === color} onclick={() => onSetColor?.(c)} />
          {/each}
        </div>
        <IconPicker value={icon} onselect={(i) => onSetIcon?.(i)} />
      </div>
    {/if}
  {/snippet}
</RowMenu>

{#snippet folderHeader({ trigger }: { trigger: Snippet; expanded: boolean })}
  <div
    class="folder-row"
    class:drop-target={dropTarget}
    class:editing
    data-testid="folder-row"
    style:--folder-c={`oklch(0.62 0.16 ${hue})`}
  >
    {#if editing}
      <span class="chevron" class:expanded aria-hidden="true">
        <Icon name="chevron-right" size={12} />
      </span>
      <span class="glyph" aria-hidden="true">
        <Icon name={icon} size={16} />
      </span>
      <EditableLabel
        value={name}
        editing
        ariaLabel="Folder name"
        testid="folder-rename-input"
        oncommit={(next) => onRename?.(next)}
        oncancel={() => onRenameCancel?.()}
      />
    {:else}
      <button
        type="button"
        class="hit"
        aria-label={label ?? name}
        aria-expanded={expanded}
        onclick={onToggle}
      >
        <span class="chevron" class:expanded aria-hidden="true">
          <Icon name="chevron-right" size={12} />
        </span>
        <span class="glyph" aria-hidden="true">
          <Icon name={icon} size={16} />
        </span>
        <span class="name">{name}</span>
      </button>
    {/if}
    <span class="trailing">{@render trigger()}</span>
  </div>
{/snippet}

<style>
  /* Columns mirror TabRow: the chevron sits in a leading gutter of width
   * --space-3 (12px), so the glyph lands at the same x as a tab favicon (12px)
   * and the name at the same x as a tab title (12 + 16 + 8 = 36px). No left
   * padding on the row; the chevron gutter provides it. */
  .folder-row {
    position: relative;
    display: flex;
    align-items: center;
    width: 100%;
    height: var(--row-h);
    padding: 0 var(--space-2) 0 0;
    border-radius: var(--r-md);
    color: var(--text-2);
    transition:
      background var(--motion-fast) var(--ease-standard),
      box-shadow var(--motion-fast) var(--ease-standard);
  }
  .folder-row:hover {
    background: var(--surface-2);
  }
  .folder-row.drop-target {
    background: color-mix(in oklch, var(--folder-c) 22%, transparent);
    box-shadow: inset 0 0 0 1.5px var(--folder-c);
  }
  /* Rename-in-place: the row lights up in the folder's own hue — a faint wash
   * plus a single crisp ring. EditableLabel renders chromeless inside it, so
   * this ring is the sole focus affordance (no competing input outline). */
  .folder-row.editing {
    background: color-mix(in oklch, var(--folder-c) 14%, var(--surface-2));
    box-shadow: inset 0 0 0 1.5px color-mix(in oklch, var(--folder-c) 62%, transparent);
  }

  .hit {
    display: flex;
    align-items: center;
    flex: 1;
    min-width: 0;
    height: 100%;
    padding: 0;
    background: none;
    border: none;
    cursor: pointer;
    color: inherit;
    font: inherit;
    text-align: left;
  }

  .hit:focus-visible {
    outline: var(--focus-width) solid var(--focus-color);
    outline-offset: var(--focus-offset);
    border-radius: var(--r-sm);
  }

  /* Leading gutter — same width as TabRow's left padding, so the glyph aligns
   * with a tab favicon and the chevron never displaces it. */
  .chevron {
    flex-shrink: 0;
    width: var(--space-3);
    height: 100%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--text-dim);
    transition: transform var(--motion-base) var(--ease-emphasised);
  }
  .chevron.expanded {
    transform: rotate(90deg);
  }

  .glyph {
    flex-shrink: 0;
    width: var(--favicon-size);
    height: var(--favicon-size);
    margin-right: var(--space-2);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--folder-c);
  }

  .name {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    font: var(--weight-regular) var(--text-base) / 1 var(--font-sans);
  }

  /* Trailing kebab — quiet until row hover or the menu is open. */
  .trailing {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    margin-left: var(--space-1);
    opacity: 0;
    transition: opacity var(--motion-fast) var(--ease-standard);
  }
  .folder-row:hover .trailing,
  .trailing:focus-within {
    opacity: 1;
  }

  /* In-drawer icon/colour editor (revealed by "Icon & colour"). */
  .appearance {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }
  .swatch-row {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-1);
  }
</style>
