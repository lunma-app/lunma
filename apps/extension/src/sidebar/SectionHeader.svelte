<script lang="ts">
import type { Snippet } from 'svelte';
import Icon from '../ui/Icon.svelte';
import RowMenu, { type RowMenuItem } from '../ui/RowMenu.svelte';

interface Props {
  icon: string;
  label: string;
  /** Optional overflow actions on the trailing edge. The header is itself a row —
   * the Space icon + name laid out like the tab / folder rows — so the kebab is
   * hover-revealed in the trailing slot and the row morphs in place into an action
   * card via the SAME `RowMenu` primitive those rows compose. When omitted or
   * empty (e.g. the Temporary header) the trailing edge renders nothing and the
   * header does not morph. The header shows NO count — the list below carries it. */
  menu?: RowMenuItem[] | undefined;
  /** Pass-throughs to RowMenu's drill-in API (smart-folders): a titled `panel`
   * replaces the action list with `‹ panelTitle` + the panel — the "New smart
   * folder…" editor drills the header kebab in place (design D9). */
  panel?: Snippet | undefined;
  panelTitle?: string | undefined;
  onPanelBack?: (() => void) | undefined;
  /** Bindable menu-open state, so a host can close the morph after a panel
   * confirm (e.g. the editor's Add) without waiting for an outside click. */
  open?: boolean | undefined;
}

let {
  icon,
  label,
  menu,
  panel,
  panelTitle,
  onPanelBack,
  open = $bindable(false),
}: Props = $props();
const hasMenu = $derived(!!menu && menu.length > 0);

function onOpenChange(isOpen: boolean): void {
  // Closing dismisses an active drill-in, so the next open lands on the
  // actions (mirrors FolderRow's forwarded-panel treatment).
  if (!isOpen && panel) onPanelBack?.();
}
</script>

<div class="section-header">
  {#if hasMenu && menu}
    <RowMenu
      items={menu}
      label={`${label} actions`}
      testidPrefix="section-header-menu"
      header={headerRow}
      {panel}
      {panelTitle}
      {onPanelBack}
      bind:open
      {onOpenChange}
    />
  {:else}
    {@render headerRow({ trigger: undefined, expanded: false })}
  {/if}
</div>

<!-- Shared header content, rendered both standalone (no menu) and as the RowMenu
     morph's row header. `trigger` is the kebab button RowMenu hands us for the
     trailing slot (undefined when there is no menu). -->
{#snippet headerRow({ trigger }: { trigger: Snippet | undefined; expanded: boolean })}
  <div class="header" data-testid="section-header">
    <span class="glyph" aria-hidden="true"><Icon name={icon} size={16} /></span>
    <span class="label">{label}</span>
    {#if trigger}
      <span class="trailing">{@render trigger()}</span>
    {/if}
  </div>
{/snippet}

<style>
  /* The header is a row like everything else in the sidebar, so it shares the
   * pinned list's horizontal inset (`--list-pad`); the morph card that grows out
   * of it lines up with the rows below. A little top breathing room separates it
   * from the search trigger above. */
  .section-header {
    padding: var(--space-1) var(--list-pad) 0;
  }

  /* A row mirroring TabRow / FolderRow: a leading gutter of --space-3 (12px) puts
   * the Space glyph at the same x as a tab favicon / folder glyph, and the name at
   * the same x as their titles, so the header reads as the top of the same list.
   * Full --row-h, hover-revealed trailing kebab. */
  .header {
    display: flex;
    align-items: center;
    height: var(--row-h);
    /* Match TabRow's `0 var(--space-3)` so the glyph aligns with the tab favicons
     * AND the trailing kebab / ✕ sits in the same column as the tab-row kebabs
     * (a bare padding-left left the kebab flush to the edge, ~12px off-column). */
    padding: 0 var(--space-3);
    border-radius: var(--r-md);
    color: var(--text);
  }

  .glyph {
    flex-shrink: 0;
    width: var(--favicon-size);
    height: var(--favicon-size);
    margin-right: var(--space-2);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: inherit;
    opacity: 0.9;
  }

  .label {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    /* Title weight/size of a row, a touch heavier so the Space row reads as the
     * section's head rather than just another pinned tab. Sentence case (no
     * uppercase) — it's a row title now, not an Arc-style section label. */
    font: var(--weight-medium) var(--text-base) / 1 var(--font-sans);
  }

  /* Per-Space colour identity: under the immersive tints the Space's row (icon +
   * name) renders in its hue at the same lightness floor the old section label
   * used, so it stays ≥4.5:1 (WCAG 2.1 AA) over the same-hue top wash. Under
   * subtle / off it reads in the neutral text colour. */
  :global(.sidebar[data-tint='standard']) .header,
  :global(.sidebar[data-tint='vivid']) .header {
    color: oklch(from var(--space-c) max(l, 0.72) c h / 0.95);
  }

  /* Trailing kebab — quiet until header hover, focus, or the menu being open,
   * mirroring the tab + folder rows' trailing affordance exactly. (`RowMenu`
   * marks its open state via `.slot.open`, the ancestor of this `.trailing`.) */
  .trailing {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    margin-left: var(--space-1);
    opacity: 0;
    transition: opacity var(--motion-fast) var(--ease-standard);
  }
  .header:hover .trailing,
  .trailing:focus-within,
  :global(.slot.open) .trailing {
    opacity: 1;
  }

  /* Unify the morph surface. RowMenu paints the OPEN row-top with `--bg`, which on
   * a header reads as a darker, untinted bar sitting on top of the lighter,
   * Space-tinted action card — two stacked pieces, not one morph. Make the header
   * transparent when open so it sits ON the elevated card (same colour + Space
   * tint) and header + actions read as a single morphing surface. Scoped to the
   * header's RowMenu, so the tab/folder rows keep their own open treatment. */
  .section-header :global(.slot.open .row-top) {
    background: transparent;
  }
</style>
