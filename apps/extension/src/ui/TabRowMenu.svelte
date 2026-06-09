<script lang="ts" module>
import type { IconName } from '../shared/icon-names';

/**
 * One action row in a {@link TabRowMenu}. `onSelect` fires on click or keyboard
 * activation. `danger` paints the row in `--danger` (destructive actions).
 * `keepOpen` suppresses the default close-on-select so a row can mutate the menu
 * in place (e.g. a two-step "Delete? → Confirm" confirmation).
 */
export interface TabRowMenuItem {
  id: string;
  label: string;
  onSelect: () => void;
  icon?: IconName | undefined;
  danger?: boolean | undefined;
  keepOpen?: boolean | undefined;
  /** Renders a trailing chevron + `aria-haspopup` to signal the row opens a
   * drill-in sub-view (e.g. the boundary editor) rather than firing an action. */
  submenu?: boolean | undefined;
}

/** The row's data, rendered into the composed {@link TabRow} that forms the
 * morphing card's header. */
export interface TabRowMenuHeader {
  title: string;
  faviconSrc?: string | undefined;
  /** Fallback favicon URL (the `_favicon` endpoint) — forwarded to the header
   * `TabRow`'s composed `Favicon` for its staged fallback. */
  faviconFallbackSrc?: string | undefined;
  active?: boolean | undefined;
  loading?: boolean | undefined;
  drifted?: boolean | undefined;
}
</script>

<script lang="ts">
import type { Snippet } from 'svelte';
import RowMenu from './RowMenu.svelte';
import TabRow from './TabRow.svelte';

interface Props {
  /** The tab row's data — rendered as the card header (a `TabRow`). */
  header: TabRowMenuHeader;
  /** Actions, top to bottom. */
  items: TabRowMenuItem[];
  /** Optional in-drawer disclosure (e.g. the boundary editor), forwarded to the
   * underlying `RowMenu`. With `panelTitle` it becomes a drill-in view that
   * replaces the actions; without it, a below-actions strip. */
  panel?: Snippet | undefined;
  /** Drill-in title for `panel` (forwarded to `RowMenu`). */
  panelTitle?: string | undefined;
  /** Drill-in back handler (forwarded to `RowMenu`). */
  onPanelBack?: (() => void) | undefined;
  /** Whole-row click (focus/open the tab) — forwarded to the composed `TabRow`. */
  onRowClick?: (() => void) | undefined;
  /** Accessible label for the kebab trigger (and the action menu). */
  label?: string;
  /** Bindable open state — callers reset transient row state on close. */
  open?: boolean;
  /** Fired whenever the menu opens or closes (e.g. to reset a pending confirm). */
  onOpenChange?: (open: boolean) => void;
  /** Inline rename: when true the header `TabRow` becomes an editable field. */
  editing?: boolean | undefined;
  /** Commit a renamed title (Enter or blur) — forwarded to the header `TabRow`. */
  oncommitName?: ((next: string) => void) | undefined;
  /** Abandon a rename (Escape / empty commit) — forwarded to the header `TabRow`. */
  oncancelName?: (() => void) | undefined;
}

let {
  header,
  items,
  panel,
  panelTitle,
  onPanelBack,
  onRowClick,
  label = 'Open menu',
  open = $bindable(false),
  onOpenChange,
  editing = false,
  oncommitName,
  oncancelName,
}: Props = $props();
</script>

<!-- A thin wrapper over the generic RowMenu morph: the header is a TabRow, the
     trigger RowMenu provides is placed in the TabRow's trailing slot. The
     `tab-row-menu` testid prefix preserves the established trigger/item testids. -->
<RowMenu
  {items}
  {panel}
  {panelTitle}
  {onPanelBack}
  {label}
  bind:open
  {onOpenChange}
  testidPrefix="tab-row-menu"
  header={rowHeader}
/>

{#snippet rowHeader({ trigger, expanded }: { trigger: import('svelte').Snippet; expanded: boolean })}
  <TabRow
    title={header.title}
    faviconSrc={header.faviconSrc}
    faviconFallbackSrc={header.faviconFallbackSrc}
    active={header.active}
    loading={header.loading}
    drifted={header.drifted}
    trailingVisible={expanded}
    {editing}
    {oncommitName}
    {oncancelName}
    onclick={() => onRowClick?.()}
  >
    {#snippet trailing()}
      {@render trigger()}
    {/snippet}
  </TabRow>
{/snippet}
