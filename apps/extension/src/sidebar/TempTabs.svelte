<script lang="ts">
import '../ui/drop-line.css';
import { flip } from 'svelte/animate';
import { dispatch } from '../shared/bus';
import { labelFor } from '../shared/label-for';
import type { IconName, LiveTab, SpaceId, TabId, WindowId } from '../shared/types';
import ContextMenu from '../ui/ContextMenu.svelte';
import { faviconCacheKey, faviconFor, faviconUrl } from '../ui/favicon';
import IconButton from '../ui/IconButton.svelte';
import type { MenuItem } from '../ui/menu-types';
import TabRow from '../ui/TabRow.svelte';
import { type DropResult, drag } from './drag.svelte';
import { useStore } from './store-context.svelte';

interface Props {
  windowId: WindowId;
  /** The Space this list belongs to. Every carousel panel pre-renders its OWN
   * Space's temp list (so a commit is a pure transform — no mount), and the centred
   * panel is the `active` one. */
  spaceId: SpaceId;
  /** Only the centre (active) carousel slide registers a drop zone (see PinnedTabs). */
  active?: boolean;
}

const { windowId, spaceId, active = true }: Props = $props();
const store = useStore();

const ZONE = $derived(`temp:${windowId}`);
const FLIP_MS = 160;

interface TempItem {
  id: string; // stringified TabId — the drag-controller item id
  tabId: TabId;
  title: string;
  faviconSrc: string;
  /** The `_favicon` endpoint, retried when the primary `faviconSrc` fails to load. */
  faviconFallbackSrc: string;
  active: boolean;
  loading: boolean;
}

// Pure projection of authoritative SW state. Temporary is a manually-ordered
// list now (sidebar-pinned-tabs): render in `tempTabIds` array order (newest
// first; drag to reorder), NOT by activity. The custom DnD never reorders the
// list during a drag, so no guard is needed (see PinnedTabs).
const items = $derived.by<TempItem[]>(() => {
  // This panel's OWN Space (the prop), not the active one — so every pre-rendered
  // carousel panel shows its Space's temp tabs as it slides in.
  const instance = store.state.spaceInstancesByWindow[windowId]?.[spaceId];
  // Defensive de-dup: a duplicate tab id in (corrupted or same-tick re-broadcast)
  // tempTabIds would collide the keyed {#each} and crash the sidebar. First wins.
  const seen = new Set<number>();
  return (instance?.tempTabIds ?? [])
    .filter((tabId) => {
      if (seen.has(tabId)) return false;
      seen.add(tabId);
      return true;
    })
    .map((tabId) => store.state.liveTabsById[tabId])
    .filter((tab): tab is LiveTab => tab !== undefined)
    .map((tab) => ({
      id: String(tab.tabId),
      tabId: tab.tabId,
      title: instance?.tempTabTitles?.[tab.tabId] ?? labelFor(tab.title, tab.url),
      faviconSrc: faviconFor(tab.url, tab.favIconUrl),
      // Cache-bust the endpoint fallback on the live `favIconUrl` so a CORP-blocked
      // primary that re-badges (e.g. WhatsApp's per-count icon) refreshes through it.
      faviconFallbackSrc: faviconUrl(tab.url, 16, faviconCacheKey(tab.favIconUrl)),
      active: tab.active,
      loading: tab.status === 'loading',
    }));
});

// --- drag zone registration ------------------------------------------------
let containerEl = $state<HTMLElement>();
let rowEls = $state<HTMLElement[]>([]);

$effect(() => {
  if (!active || !containerEl) return;
  return drag.registerZone(ZONE, {
    el: containerEl,
    itemEls: () => rowEls.filter(Boolean),
  });
});

const isDragSource = (item: TempItem): boolean =>
  drag.state.active && drag.state.data?.zone === ZONE && drag.state.data?.id === item.id;

function lineTop(index: number): number {
  const els = rowEls.filter(Boolean);
  if (els.length === 0) return 0;
  if (index >= els.length) {
    const last = els[els.length - 1] as HTMLElement;
    return last.offsetTop + last.offsetHeight - 1;
  }
  return (els[index] as HTMLElement).offsetTop - 1;
}

function onRowPointerDown(e: PointerEvent, item: TempItem): void {
  if (item.id === renamingId) return; // editing: let the input handle pointer events
  const el = e.currentTarget as HTMLElement;
  drag.press(
    { id: item.id, zone: ZONE, title: item.title, faviconSrc: item.faviconSrc },
    e,
    el,
    handleDrop,
  );
}

function handleDrop(r: DropResult): void {
  if (r.data.zone !== ZONE) return; // only temp-sourced drags route through here
  // Released outside every zone → cancel: snap back, dispatch nothing (cancellable-drag).
  if (r.targetZone === null) return;

  // Temporary → favicon strip = FAVORITE this live tab (favicon-row-model
  // `favoriteTab`, non-destructive — the tab stays open). The drag controller routes
  // a drop to the SOURCE row's handler, so a temp-sourced favorite-drop lands here —
  // the drag equivalent of this row's overflow-menu Favorite action, and the temp
  // counterpart of PinnedTabs' decouple-onto-favicon. No optimistic mutation; the
  // authoritative broadcast defines the result.
  if (r.targetZone === 'favicon') {
    dispatch({ kind: 'favoriteTab', payload: { tabId: Number(r.data.id), windowId } });
    return;
  }

  if (r.targetZone.startsWith('pinned:')) {
    // Temporary → Pinned. Parse the REAL spaceId by splitting on `:folder:` — an
    // expanded folder's child zone is `pinned:<spaceId>:folder:<folderId>`, so the
    // old `slice('pinned:'.length)` produced a garbage "<spaceId>:folder:<id>" key
    // that pinned the record under a Space the sidebar never renders (the orphan).
    const rest = r.targetZone.slice('pinned:'.length);
    const sep = rest.indexOf(':folder:');
    const spaceId = sep === -1 ? rest : rest.slice(0, sep);
    const childFolderId = sep === -1 ? null : rest.slice(sep + ':folder:'.length);

    // Honor the same drop-onto semantics as a within-pinned drag (see
    // PinnedTabs.handleDrop): a child zone or a collapsed-folder onto-target files
    // INTO that folder; an onto-target that is a tab folds the two into a new
    // folder; everything else is a top-level insert at `targetIndex`. The SW
    // re-validates the target exists and falls back to the top-level insert, so a
    // stale/removed target never loses the tab (no orphan — pin-temp-tab-into-folder).
    let placement: { into: string } | { withSavedTabId: string } | undefined;
    if (childFolderId !== null) {
      placement = { into: childFolderId };
    } else if (r.targetOntoId !== null) {
      const ontoId = r.targetOntoId;
      const ontoFolder = (store.state.pinnedBySpace[spaceId] ?? []).some(
        (n) => n.kind === 'folder' && n.id === ontoId,
      );
      placement = ontoFolder ? { into: ontoId } : { withSavedTabId: ontoId };
    }

    dispatch({
      kind: 'pinTab',
      payload: {
        tabId: Number(r.data.id),
        windowId,
        spaceId,
        targetIndex: r.targetIndex,
        ...(placement ? { placement } : {}),
      },
    });
    // Folding onto a pinned tab mints a NEW folder; arm the active PinnedTabs to
    // open its inline rename the moment it appears (pin-temp-tab-into-folder),
    // matching the New-folder button and the within-pinned fold. Filing INTO an
    // existing folder ({ into }) must NOT rename it, so only arm for the fold.
    if (placement && 'withSavedTabId' in placement) {
      store.setAutoRenameNextFolder(windowId, true);
    }
  } else if (r.targetZone === ZONE) {
    // Reorder within Temporary: move the dragged tab to the drop index.
    const ids = items.map((i) => i.tabId);
    const draggedTabId = Number(r.data.id);
    const from = ids.indexOf(draggedTabId);
    if (from === -1) return;
    ids.splice(from, 1);
    const insertAt = r.targetIndex > from ? r.targetIndex - 1 : r.targetIndex;
    ids.splice(insertAt, 0, draggedTabId);
    dispatch({ kind: 'reorderTemp', payload: { windowId, tabIds: ids } });
  }
}

function focusTab(item: TempItem): void {
  if (drag.consumeJustDragged()) return; // a drag just ended — not a click
  dispatch({ kind: 'focusTab', payload: { tabId: item.tabId } });
}

function closeTab(tabId: TabId): void {
  dispatch({ kind: 'closeTab', payload: { tabId } });
}

// Favorite the live tab non-destructively (favicon-row-model `favoriteTab`): mint
// a global favorite from this open tab; the tab STAYS open (it is not closed or
// moved). Surfaced in the row's overflow menu (sidebar-favicon-row D5 / D7).
function favoriteTab(item: TempItem): void {
  dispatch({ kind: 'favoriteTab', payload: { tabId: item.tabId, windowId } });
}

/** The right-click action menu for a temporary row: Favorite (non-destructive),
 * Rename (inline), and Close tab. Built as `ContextMenu` `MenuItem[]` so temp +
 * pinned rows share the favicon-tile right-click interaction. The one-click close
 * lives separately on the row's trailing ✕. */
function tabMenuItems(item: TempItem): MenuItem[] {
  return [
    {
      id: 'favorite',
      label: 'Favorite',
      icon: 'star',
      onSelect: () => favoriteTab(item),
    },
    {
      id: 'rename',
      label: 'Rename',
      icon: 'pencil',
      onSelect: () => startRename(item),
    },
    {
      id: 'close',
      label: 'Close tab',
      icon: 'x',
      onSelect: () => closeTab(item.tabId),
    },
  ];
}

// --- right-click menu (one shared instance, opened at the cursor) -------------
// Mirrors FaviconRow: a single ContextMenu floated at the pointer for whichever
// row was right-clicked; the active row is re-derived by `tabId` against `items`
// so the menu auto-closes when its row leaves the list.
let menuOpen = $state(false);
let menuX = $state(0);
let menuY = $state(0);
let menuTabId = $state<TabId | null>(null);
const activeMenuItem = $derived(
  menuTabId !== null ? (items.find((i) => i.tabId === menuTabId) ?? null) : null,
);

function onRowContextMenu(e: MouseEvent, item: TempItem): void {
  // Open the action menu at the cursor and suppress Chrome's native menu. A
  // right-click never focuses/switches the tab (design D4).
  e.preventDefault();
  menuX = e.clientX;
  menuY = e.clientY;
  menuTabId = item.tabId;
  menuOpen = true;
}

// Inline rename: double-click a row to name it. The custom name lives only in
// this window's Space instance (ephemeral — see store `renameTempTab`). An
// empty commit cancels (leaves the name unchanged).
let renamingId = $state<string | null>(null);

function startRename(item: TempItem): void {
  renamingId = item.id;
}

function commitRename(item: TempItem, newName: string): void {
  renamingId = null;
  dispatch({ kind: 'renameTempTab', payload: { tabId: item.tabId, spaceId, windowId, newName } });
}
</script>

<div
  class="temp-tabs"
  data-testid="temp-tabs"
  bind:this={containerEl}
>
  {#if drag.state.active && drag.state.targetZone === ZONE}
    <div class="drop-line" style:top={`${lineTop(drag.state.targetIndex)}px`}></div>
  {/if}
  {#each items as item, i (item.id)}
    <!-- Drag handle is the whole row; the focusable control lives in TabRow's
         button. Keyboard reorder is a Phase 7 a11y concern. -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="row-wrap"
      class:dragging={isDragSource(item)}
      bind:this={rowEls[i]}
      onpointerdown={(e) => onRowPointerDown(e, item)}
      oncontextmenu={(e) => onRowContextMenu(e, item)}
      ondblclick={() => startRename(item)}
      animate:flip={{ duration: FLIP_MS }}
    >
      {#snippet closeButton()}
        <!-- The ✕ stops pointerdown propagation so pressing it never arms the
             row's drag; the button's own click closes the tab (it is not nested
             inside the row's hit target, so it never focuses the row). -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <span class="close-slot" onpointerdown={(e) => e.stopPropagation()}>
          <IconButton
            icon={'x' as IconName}
            ariaLabel="Close tab"
            title="Close tab"
            size={14}
            testid="temp-close"
            onclick={() => closeTab(item.tabId)}
          />
        </span>
      {/snippet}
      <TabRow
        title={item.title}
        faviconSrc={item.faviconSrc}
        faviconFallbackSrc={item.faviconFallbackSrc}
        active={item.active}
        loading={item.loading}
        editing={item.id === renamingId}
        oncommitName={(next) => commitRename(item, next)}
        oncancelName={() => (renamingId = null)}
        onclick={() => focusTab(item)}
        trailing={closeButton}
      />
    </div>
  {/each}
</div>

<!-- One shared right-click menu, opened at the cursor for whichever row was
     right-clicked (mirrors FaviconRow). The active row is re-derived by id so the
     menu auto-closes if that row leaves the list. -->
{#if activeMenuItem}
  <ContextMenu
    bind:open={menuOpen}
    x={menuX}
    y={menuY}
    items={tabMenuItems(activeMenuItem)}
    label="Tab actions"
    testid="temp-menu"
  />
{/if}

<style>
  .temp-tabs {
    position: relative;
    display: flex;
    flex-direction: column;
    /* Vertical padding gives the drag insertion line room at the first/last
     * slot so it never crams against the section header above or the next
     * section below. */
    padding: var(--space-1) var(--list-pad);
  }

  .row-wrap {
    /* Inter-row gap as in-box padding so adjacent row rects stay contiguous;
     * tracks the active density. */
    padding-bottom: var(--row-gap);
    animation: temp-row-in var(--motion-base) var(--ease-emphasised);
    touch-action: none;
  }

  /* Wraps the trailing ✕ so it can swallow its own pointerdown (no drag) while the
   * IconButton primitive keeps its box/ring. */
  .close-slot {
    display: inline-flex;
  }
  /* Source row stays in place but dims while dragged. */
  .row-wrap.dragging {
    opacity: 0.4;
  }

  /* Insertion line — glowing bar + leading dot, zero-height so it never reflows
   * the list (see PinnedTabs). */
  .drop-line {
    position: absolute;
    left: calc(var(--list-pad) + 2px);
    right: calc(var(--list-pad) + 2px);
    height: 0;
    z-index: 2;
    pointer-events: none;
  }
  .drop-line::before {
    content: '';
    position: absolute;
    left: 6px;
    right: 0;
    top: -1px;
    height: 2px;
    border-radius: var(--r-pill);
    background: linear-gradient(90deg, var(--space-c), color-mix(in oklch, var(--space-c) 35%, transparent));
    box-shadow: 0 0 7px var(--space-c-dim);
  }
  .drop-line::after {
    content: '';
    position: absolute;
    left: 0;
    top: -3px;
    width: 6px;
    height: 6px;
    border-radius: var(--r-pill);
    background: var(--space-c);
    box-shadow: 0 0 6px var(--space-c);
  }

  @keyframes temp-row-in {
    from {
      opacity: 0;
      transform: translateY(-4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
