<script lang="ts">
import type { Snippet } from 'svelte';
import type { IconName } from '../shared/icon-names';
import { colourToHue } from '../shared/space-hue';
import type { SpaceColor } from '../shared/types';
import BitsMenu from './BitsMenu.svelte';
import BottomSheet from './BottomSheet.svelte';
import ColorSwatch from './ColorSwatch.svelte';
import EditableLabel from './EditableLabel.svelte';
import Icon from './Icon.svelte';
import IconPicker from './IconPicker.svelte';
import type { MenuItem } from './menu-types';

interface Props {
  /** Folder name (the row label). */
  name: string;
  /** Folder glyph (a lucide icon name). A plain string: it's rendered via the
   * generic `Icon` and seeds the picker's `value` (highlight only). The picker's
   * `onSetIcon` output stays `IconName`. */
  icon: string;
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
  /** Set the folder colour (an "Appearance" swatch pick). */
  onSetColor?: ((color: SpaceColor) => void) | undefined;
  /** Set the folder icon (an "Appearance" picker pick). */
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
   * (rename / Appearance / Move / two-step Delete) wholesale — for rows
   * whose actions are not folder-shaped (e.g. a smart folder). */
  menuItems?: MenuItem[] | undefined;
  /** Spins the glyph at the established 0.8s-linear cadence while an in-flight
   * refresh runs; static `--text-dim` under reduced motion (a refresh indicator
   * is decoration, not information — calmer than a loading spinner). */
  busy?: boolean | undefined;
  /** Forwarded editor surface: when a `panel` snippet + `panelTitle` are given
   * (e.g. a smart folder's "Edit lens" editor), FolderRow renders that editor in
   * a {@link BottomSheet} titled `panelTitle`. The sheet is open exactly while
   * `panel` is set — the host owns that (it toggles the snippet on/off) — and any
   * dismissal (scrim / ✕ / Escape) calls `onPanelBack`. Absent → the built-in
   * Appearance sheet (icon + colour), opened by the kebab's "Appearance" item. */
  panel?: Snippet | undefined;
  panelTitle?: string | undefined;
  onPanelBack?: (() => void) | undefined;
  /** Optional bindable kebab-menu open state. bits-ui owns the menu's own open
   * lifecycle now, so this is a read-only mirror a host may observe (the
   * `SectionHeader` precedent): it reflects opens/closes via `onOpenChange` but
   * writing it back does NOT drive bits-ui (a forwarded editor dismisses by
   * toggling `panel`, not by closing the menu). Kept for API stability. */
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
  // Read-only mirror of the kebab open state — bindable so existing hosts keep
  // their binding; driven by BitsMenu's `onOpenChange`.
  menuOpen = $bindable(false),
}: Props = $props();

const hue = $derived(colourToHue(color));

// The built-in Appearance editor (icon + colour) now opens in a BottomSheet.
let showAppearance = $state(false);
// Two-step Delete arm — Delete folder arms into a danger confirm before dispatching.
let confirmingDelete = $state(false);

// A forwarded editor (`panel` + `panelTitle`) drives its own sheet, open exactly
// while the host passes the snippet. The built-in Appearance sheet is internal.
const forwardedOpen = $derived(panel !== undefined && panelTitle !== undefined);

// Move entries are plain text (no icon) per the change's visual language; the
// destructive Delete stays last and arms before firing. A caller-provided
// `menuItems` override replaces this list wholesale.
const builtinMenuItems = $derived<MenuItem[]>([
  { id: 'rename', label: 'Rename', icon: 'pencil', onSelect: () => onStartRename?.() },
  {
    id: 'appearance',
    label: 'Appearance',
    icon: 'palette',
    onSelect: () => {
      confirmingDelete = false; // selecting another entry disarms a pending Delete
      showAppearance = true;
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
        keepOpen: true, // arm in place, keep the menu open
        onSelect: () => {
          confirmingDelete = true;
        },
      },
]);

function onMenuOpenChange(open: boolean): void {
  menuOpen = open;
  if (!open) {
    confirmingDelete = false; // closing / Escape disarms a pending Delete
  }
}
</script>

<div
  class="folder-row"
  class:drop-target={dropTarget}
  class:editing
  class:menu-open={menuOpen}
  data-testid="folder-row"
  style:--folder-c={`oklch(var(--folder-l, 0.62) var(--folder-chroma, 0.16) ${hue})`}
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
    </button>
  {/if}
  <span class="trailing">
    {#if badge !== undefined}
      <span class="badge" data-testid="folder-row-badge">{badge}</span>
    {/if}
    <span class="kebab">
      <BitsMenu
        items={menuItems ?? builtinMenuItems}
        label="Folder actions"
        onOpenChange={onMenuOpenChange}
      />
    </span>
  </span>
</div>

<!-- Built-in Appearance editor — icon + colour, in a sheet (no forwarded panel). -->
{#if !forwardedOpen}
  <BottomSheet
    open={showAppearance}
    title="Appearance"
    onClose={() => {
      showAppearance = false;
    }}
    testid="folder-appearance"
  >
    <div class="appearance">
      <div class="swatch-row" role="radiogroup" aria-label="Folder colour">
        {#each colors as c (c)}
          <ColorSwatch color={c} selected={c === color} onclick={() => onSetColor?.(c)} />
        {/each}
      </div>
      <IconPicker value={icon} onselect={(i) => onSetIcon?.(i)} />
    </div>
  </BottomSheet>
{/if}

<!-- Forwarded editor (e.g. a smart folder's Edit lens) — host toggles `panel`. -->
{#if forwardedOpen && panel}
  <BottomSheet
    open={forwardedOpen}
    title={panelTitle}
    onClose={() => onPanelBack?.()}
    testid="folder-forwarded-panel"
  >
    {@render panel()}
  </BottomSheet>
{/if}

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
    /* Redesign rounds the row harder — the nav/card radius (comp's lens rows). */
    border-radius: var(--r-lg);
    color: var(--text-2);
    transition:
      background var(--motion-fast) var(--ease-standard),
      box-shadow var(--motion-fast) var(--ease-standard);
  }
  .folder-row:hover {
    background: var(--hover);
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
  /* The disclosure chevron is NOT shown at rest (it read as visual noise on
     every row); it fades in on row hover / focus / open menu. The 12px gutter is
     kept reserved so the glyph tile never shifts when the chevron appears. */
  .chevron {
    flex-shrink: 0;
    width: var(--space-3);
    height: 100%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--text-dim);
    opacity: 0;
    transition:
      opacity var(--motion-fast) var(--ease-standard),
      transform var(--motion-base) var(--ease-emphasised);
  }
  .folder-row:hover .chevron,
  .folder-row:focus-within .chevron,
  .folder-row.menu-open .chevron,
  .folder-row.editing .chevron {
    opacity: 1;
  }
  .chevron.expanded {
    transform: rotate(90deg);
  }

  @media (prefers-reduced-motion: reduce) {
    .chevron {
      transition: none;
    }
  }

  /* The glyph sits in a rounded tile in the folder's own hue — mirrors the comp's
   * lens-header icon tile (a ~24-26px rounded plate, `--space-soft`/`--space-text`)
   * and TabRow's favicon tile, so folders and tabs share one leading-mark anatomy.
   * The icon inside stays --favicon-size (16px). */
  .glyph {
    --glyph-tile: 24px;
    flex-shrink: 0;
    width: var(--glyph-tile);
    height: var(--glyph-tile);
    margin-right: var(--space-2);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--r-md);
    background: color-mix(in oklch, var(--folder-c) 16%, transparent);
    color: var(--folder-c);
  }
  .glyph :global(svg) {
    width: var(--favicon-size);
    height: var(--favicon-size);
  }

  /* In-flight refresh — TabRow's 0.8s-linear spinner cadence. Spins the inner
   * glyph (not the tile plate) so the rounded tile stays put. Under reduced
   * motion the indicator holds STATIC at --text-dim (a refresh indicator is
   * decoration, not information — calmer than FaviconTile's slowed spin). */
  .glyph.busy :global(svg) {
    animation: folder-row-busy 0.8s linear infinite;
  }
  @keyframes folder-row-busy {
    to {
      transform: rotate(360deg);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .glyph.busy :global(svg) {
      animation: none;
    }
    .glyph.busy {
      color: var(--text-dim);
    }
  }

  .name {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    /* Comp's lens/folder header name sits at semibold. */
    font: var(--weight-semibold) var(--text-base) / 1 var(--font-sans);
  }

  /* Trailing slot — the quiet count badge and the kebab share one right-aligned
   * grid cell, so the kebab lands exactly where the badge sat. The badge shows
   * at rest; row hover, keyboard focus, or an open menu swaps it for the kebab
   * (mirroring the result rows' status-dot → ✕ swap). Both stay mounted, so the
   * column width is constant — the swap is a cross-fade with no layout shift. */
  .trailing {
    flex-shrink: 0;
    display: inline-grid;
    align-items: center;
    justify-items: end;
    margin-left: var(--space-2);
  }
  .trailing > * {
    grid-area: 1 / 1; /* stack badge + kebab in the same cell */
  }

  /* Quiet trailing count badge — a soft pill that never competes with the name.
   * pointer-events: none is load-bearing, not cosmetic: the badge shares the
   * kebab's grid cell, and on hover it fades to opacity 0 — which creates a
   * stacking context that paints ABOVE the (opacity-1, in-flow) kebab. An
   * invisible-but-hit-testable badge would then swallow every click on the ⋮.
   * The count is never interactive, so opting it out of hit-testing lets clicks
   * fall through to the kebab beneath in every state. */
  .badge {
    padding: var(--space-1) var(--space-2);
    border-radius: var(--r-pill);
    background: var(--surface-2);
    color: var(--text-faint);
    font: var(--weight-medium) var(--text-2xs) / 1 var(--font-sans);
    pointer-events: none;
    transition: opacity var(--motion-fast) var(--ease-standard);
  }

  /* Kebab — hidden behind the badge until the row is hovered/focused or the
   * menu is open, then it fades in over the badge's spot. */
  .kebab {
    display: inline-flex;
    align-items: center;
    opacity: 0;
    transition: opacity var(--motion-fast) var(--ease-standard);
  }
  .folder-row:hover .kebab,
  .folder-row.menu-open .kebab,
  .trailing:focus-within .kebab {
    opacity: 1;
  }
  .folder-row:hover .badge,
  .folder-row.menu-open .badge,
  .trailing:focus-within .badge {
    opacity: 0;
  }

  /* Appearance editor body (icon + colour), rendered inside the BottomSheet. */
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
