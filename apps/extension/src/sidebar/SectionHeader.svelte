<script lang="ts">
import type { Snippet } from 'svelte';
import BottomSheet from '../ui/BottomSheet.svelte';
import Icon from '../ui/Icon.svelte';
import Menu from '../ui/Menu.svelte';
import type { MenuItem } from '../ui/menu-types';

interface Props {
  icon: string;
  label: string;
  /** Optional overflow actions on the trailing edge. The kebab is a quiet,
   * hover-revealed `Menu` (bits-ui DropdownMenu) — the same primitive the
   * tab / folder rows now compose — so the header reads identically to those
   * menus. When omitted or empty (e.g. the Temporary header) the trailing edge
   * renders nothing. The header shows NO count — the list below carries it. */
  menu?: MenuItem[] | undefined;
  /** A drill-in EDITOR (smart-folders: the "New lens…" LensEditor). The header
   * no longer morphs in place — the editor now lives in a `BottomSheet` scoped to
   * the sidebar panel (Sidebar Redesign §8). The consumer renders the editor as
   * this snippet and toggles it by passing/clearing `panel`; we host the sheet
   * and translate every dismissal into `onPanelBack`. */
  panel?: Snippet | undefined;
  /** Instrument Serif title for the BottomSheet hosting `panel`. */
  panelTitle?: string | undefined;
  /** Every sheet dismissal path (scrim / ✕ / Esc / focus-leave) calls this; the
   * consumer clears the state that decides whether `panel` is passed. The editor's
   * own confirm (`onDone`) likewise clears it on the consumer side. */
  onPanelBack?: (() => void) | undefined;
  /** Bindable kebab-open state, kept for the existing consumer contract — a host
   * may observe the menu opening/closing. Now reflects the `Menu` (bits-ui)
   * open state rather than the old row-morph. */
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
// The editor sheet is open exactly while the consumer is forwarding a panel.
const sheetOpen = $derived(!!panel);
</script>

<div class="section-header">
  <div class="header" data-testid="section-header">
    <span class="glyph" aria-hidden="true"><Icon name={icon} size={16} /></span>
    <span class="label">{label}</span>
    {#if hasMenu && menu}
      <span class="trailing">
        <Menu trigger="kebab" items={menu} label={`${label} actions`} bind:open />
      </span>
    {/if}
  </div>
</div>

<!-- The "New lens…" editor (and any future drill-in editor) is an EDITOR, not a
     menu, so it lands in a BottomSheet (bits-ui Dialog, scoped to the sidebar
     panel) rather than morphing the header in place. The consumer renders the
     existing editor unchanged as `panel`; we only host + title the sheet. -->
<BottomSheet
  open={sheetOpen}
  portalTo=".sidebar"
  title={panelTitle}
  onClose={() => onPanelBack?.()}
  testid="section-header-sheet"
>
  {#if panel}
    {@render panel()}
  {/if}
</BottomSheet>

<style>
  /* The header is a row like everything else in the sidebar, so it shares the
   * pinned list's horizontal inset (`--list-pad`). The comp (§4) gives the Space
   * title a little more air than a tab row — `--space-1` (4px) top off the search
   * trigger, `--space-2` (8px) bottom before the list opens. */
  .section-header {
    padding: var(--space-1) var(--list-pad) var(--space-2);
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
     * AND the trailing kebab sits in the same column as the tab-row kebabs. */
    padding: 0 var(--space-3);
    border-radius: var(--r-md);
    color: var(--text);
  }

  /* Per the comp (§4) the leading glyph carries the Space's colour identity at
   * every Colour-intensity level — it renders in the Space hue (`--space-c`,
   * the comp's `--space-text`) while the name stays in `--text`. */
  .glyph {
    flex-shrink: 0;
    width: var(--favicon-size);
    height: var(--favicon-size);
    margin-right: var(--space-2);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--space-c);
  }

  .label {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    /* Comp §4: the Space title is the bold head of the room — `--text-lg` (the
     * nearest size token to the comp's 17px) at `--weight-bold`, in `--text`
     * (the hue lives in the glyph, not the name). Slight negative tracking
     * matches the comp's tightened display feel. Sentence case — a row title,
     * not an Arc-style uppercase section label. */
    font: var(--weight-bold) var(--text-lg) / 1 var(--font-sans);
    letter-spacing: -0.01em;
  }

  /* Trailing kebab — quiet until header hover, focus, or the menu being open,
   * mirroring the tab + folder rows' trailing affordance. bits-ui marks the
   * trigger `[data-state='open']` while the popover is open, so the kebab stays
   * lit while the menu is up. */
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
  /* The kebab open-state attribute lives on bits-ui's trigger (a child
   * component's element), so the match must be `:global` to cross the scope. */
  .trailing:has(:global([data-state='open'])) {
    opacity: 1;
  }

  @media (prefers-reduced-motion: reduce) {
    .trailing {
      transition: none;
    }
  }
</style>
