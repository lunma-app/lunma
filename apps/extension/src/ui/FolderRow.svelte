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
  /** Delete the folder (the destructive action, gated behind a two-step confirm). */
  onDelete?: (() => void) | undefined;
  /** Reorder the folder one slot up/down within the top-level pinned list. */
  onMoveUp?: (() => void) | undefined;
  onMoveDown?: (() => void) | undefined;
  /** Whether Move up/down are available — false renders the entry disabled (the
   * folder is already at that end of the top-level list). */
  canMoveUp?: boolean | undefined;
  canMoveDown?: boolean | undefined;
  /** The colour palette for the inline swatch row. */
  colors?: readonly SpaceColor[];
  /** Optional trailing badge (e.g. a smart folder's quiet item count). Absent →
   * no badge element renders, the prior layout byte-for-byte. */
  badge?: string | undefined;
  /** Menu override: when provided, REPLACES the built-in folder action morph
   * (rename / Icon & colour / Move / two-step Delete) wholesale — for rows
   * whose actions are not folder-shaped (e.g. a smart folder). */
  menuItems?: RowMenuItem[] | undefined;
  /** Spins the glyph at the established 0.8s-linear cadence while an in-flight
   * refresh runs; static `--text-dim` under reduced motion (a refresh indicator
   * is decoration, not information — calmer than a loading spinner). */
  busy?: boolean | undefined;
  /** Pass-throughs to RowMenu's drill-in API: a titled `panel` replaces the
   * action list with `‹ panelTitle` + the panel (e.g. a smart folder's Edit…
   * editor). Absent → the built-in Icon & colour panel behavior, unchanged. */
  panel?: Snippet | undefined;
  panelTitle?: string | undefined;
  onPanelBack?: (() => void) | undefined;
  /** Optional bindable kebab-menu open state (the `SectionHeader` precedent):
   * lets a host close the menu programmatically — e.g. a smart folder's
   * editor confirm dismissing the whole morph. Unbound callers keep the
   * prior internal open/close behavior unchanged. */
  menuOpen?: boolean;
}

let {
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
  onMoveUp,
  onMoveDown,
  canMoveUp = false,
  canMoveDown = false,
  colors = [],
  badge,
  menuItems,
  busy = false,
  panel,
  panelTitle,
  onPanelBack,
  // Action-morph open state — bindable so hosts can dismiss; defaults to the
  // same internal `false` the previous private $state held.
  menuOpen = $bindable(false),
}: Props = $props();

const hue = $derived(colourToHue(color));

// The in-drawer icon/colour panel toggle.
let showAppearance = $state(false);
// Two-step Delete arm — Delete folder arms into a danger confirm before dispatching.
let confirmingDelete = $state(false);

// Move entries are plain text (no icon) per the change's visual language; the
// destructive Delete stays last and arms before firing. A caller-provided
// `menuItems` override replaces this list wholesale.
const builtinMenuItems = $derived<RowMenuItem[]>([
  { id: 'rename', label: 'Rename', icon: 'pencil', onSelect: () => onStartRename?.() },
  {
    id: 'appearance',
    label: 'Icon & colour',
    icon: 'palette',
    keepOpen: true,
    onSelect: () => {
      confirmingDelete = false; // selecting another entry disarms a pending Delete
      showAppearance = !showAppearance;
    },
  },
  {
    id: 'move-up',
    label: 'Move up',
    disabled: !canMoveUp,
    onSelect: () => onMoveUp?.(),
  },
  {
    id: 'move-down',
    label: 'Move down',
    disabled: !canMoveDown,
    onSelect: () => onMoveDown?.(),
  },
  confirmingDelete
    ? {
        id: 'delete-folder',
        label: 'Delete folder — confirm',
        icon: 'trash-2',
        danger: true,
        onSelect: () => {
          confirmingDelete = false;
          onDelete?.();
        },
      }
    : {
        id: 'delete-folder',
        label: 'Delete folder',
        icon: 'trash-2',
        danger: true,
        keepOpen: true, // arm in place, keep the drawer open
        onSelect: () => {
          confirmingDelete = true;
        },
      },
]);

function onMenuOpenChange(open: boolean): void {
  if (!open) {
    showAppearance = false;
    confirmingDelete = false; // closing / Escape disarms a pending Delete
    // A forwarded drill-in is dismissed with the menu, so the parent's flag
    // resets and the next open lands on the action list, not a stale panel.
    if (panel) onPanelBack?.();
  }
}
</script>

<RowMenu
  items={menuItems ?? builtinMenuItems}
  label="Folder actions"
  bind:open={menuOpen}
  onOpenChange={onMenuOpenChange}
  testidPrefix="folder-row-menu"
  header={folderHeader}
  panel={panel ?? appearancePanel}
  {panelTitle}
  {onPanelBack}
/>

{#snippet appearancePanel()}
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
      <span class="glyph" class:busy aria-hidden="true">
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
        <span class="glyph" class:busy aria-hidden="true">
          <Icon name={icon} size={16} />
        </span>
        <span class="name">{name}</span>
        {#if badge !== undefined}
          <span class="badge" data-testid="folder-row-badge">{badge}</span>
        {/if}
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

  /* In-flight refresh — TabRow's 0.8s-linear spinner cadence. Under reduced
   * motion the indicator holds STATIC at --text-dim (a refresh indicator is
   * decoration, not information — calmer than FaviconTile's slowed spin). */
  .glyph.busy {
    animation: folder-row-busy 0.8s linear infinite;
  }
  @keyframes folder-row-busy {
    to {
      transform: rotate(360deg);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .glyph.busy {
      animation: none;
      color: var(--text-dim);
    }
  }

  .name {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    font: var(--weight-regular) var(--text-base) / 1 var(--font-sans);
  }

  /* Quiet trailing count badge — a soft pill that never competes with the name. */
  .badge {
    flex-shrink: 0;
    margin-left: var(--space-2);
    padding: var(--space-1) var(--space-2);
    border-radius: var(--r-pill);
    background: var(--surface-2);
    color: var(--text-faint);
    font: var(--weight-medium) var(--text-2xs) / 1 var(--font-sans);
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
