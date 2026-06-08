<script lang="ts">
import type { AnimationConfig } from 'svelte/animate';
import { cubicOut } from 'svelte/easing';
import { bus, type SidebarCommand } from '../shared/bus';
import type { IconName } from '../shared/icon-names';
import { log } from '../shared/logger';
import type {
  FolderId,
  PinNode,
  SavedTabId,
  SpaceColor,
  SpaceId,
  TabBoundary,
  WindowId,
} from '../shared/types';
import FolderRow from '../ui/FolderRow.svelte';
import { faviconCacheKey, faviconFor, faviconUrl } from '../ui/favicon';
import TabRowMenu, { type TabRowMenuItem } from '../ui/TabRowMenu.svelte';
import { boundaryDefault } from './boundary-default.svelte';
import { type DropResult, drag } from './drag.svelte';
import EmptyState from './EmptyState.svelte';
import { useStore } from './store-context.svelte';
import TabBoundaryEditor from './TabBoundaryEditor.svelte';

interface Props {
  windowId: WindowId;
  spaceId: SpaceId;
  /** Only the centre (active) carousel slide registers a drop zone — off-screen
   * slides sit inside a transformed ancestor and aren't interactive. */
  active?: boolean;
}

const { windowId, spaceId, active = true }: Props = $props();
const store = useStore();

const ZONE = $derived(`pinned:${spaceId}`);
// Post-drop reorder animation (the list only moves AFTER the authoritative
// broadcast, never during the drag). Mid-band per the visual policy.
const FLIP_MS = 160;

/**
 * Translate-only FLIP. Svelte's built-in `flip` also animates scale when an
 * element's SIZE changes between layouts — which made expanding a folder stretch
 * its row (the wrapper grows taller as children appear) before snapping back.
 * Reorder only needs position to glide, so we animate `translate` from the old
 * top-left delta to zero and ignore size entirely. A row whose position is
 * unchanged (dx=dy=0) gets a no-op, so expand/collapse never animates the row.
 */
function flipMove(_node: Element, { from, to }: { from: DOMRect; to: DOMRect }): AnimationConfig {
  const dx = from.left - to.left;
  const dy = from.top - to.top;
  if (dx === 0 && dy === 0) return { duration: 0 };
  return {
    duration: FLIP_MS,
    easing: cubicOut,
    css: (_t, u) => `transform: translate(${u * dx}px, ${u * dy}px)`,
  };
}

/** The palette colours for the folder-appearance editor (canonical order). */
const COLORS: readonly SpaceColor[] = [
  'red',
  'orange',
  'yellow',
  'green',
  'cyan',
  'blue',
  'purple',
  'pink',
  'gray',
];

interface TabView {
  kind: 'tab';
  id: SavedTabId;
  title: string;
  faviconSrc: string;
  /** The `_favicon` endpoint, retried when the primary `faviconSrc` fails to load. */
  faviconFallbackSrc: string;
  active: boolean;
  loading: boolean;
  drifted: boolean;
  dormant: boolean;
  /** True when the user has set a custom name (`SavedTab.customTitle`) — drives
   * the "Reset name" menu item's visibility. */
  renamed: boolean;
  /** The tab's home URL — passed to the boundary editor to seed the domain. */
  originalURL: string;
  /** The saved tab's explicit boundary (undefined ⇒ inheriting the global default). */
  boundary: TabBoundary | undefined;
}
interface FolderView {
  kind: 'folder';
  id: FolderId;
  name: string;
  icon: IconName;
  color: SpaceColor;
  expanded: boolean;
  children: TabView[];
}
type TopRow = TabView | FolderView;

/** Never render a blank row: fall back to the URL host when the title is empty. */
function labelFor(title: string, url: string): string {
  if (title) return title;
  try {
    return new URL(url).hostname || 'Untitled';
  } catch {
    return 'Untitled';
  }
}

/** Project a saved-tab id into a renderable tab view, or null on drift (no record). */
function projectTab(id: SavedTabId): TabView | null {
  const saved = store.state.savedTabs[id];
  if (!saved) return null;
  // Per-window-tab-bindings (ADR 0009, design D7): the sidebar is a per-window
  // surface, so it reads ONLY this window's slot — bound/active/drift reflect
  // THIS window's bound tab, never another window's.
  const boundTabId = store.state.tabBindings[id]?.[windowId];
  const bound = boundTabId !== undefined;
  const live = bound ? store.state.liveTabsById[boundTabId] : undefined;
  // Drift is derived per window from this window's bound tab's LIVE url (design
  // D3): the single canonical `currentURL` may hold another window's last write,
  // so it must not drive this row's drift. A transient empty url is not drift.
  const liveUrl = live?.url;
  const drifted = bound && liveUrl !== undefined && liveUrl !== '' && liveUrl !== saved.originalURL;
  // Display resolves `customTitle ?? liveOrSavedTitle ?? url`. A BOUND pinned tab
  // otherwise shows its live page title (so a tab pinned while blank, then
  // navigated, tracks the real title — matching the Chrome tab); the stored
  // `saved.title` (captured at pin time) is the fallback for a dormant tab. A
  // user-set `customTitle` overrides both and survives navigation/restart.
  const liveOrSaved = live?.title ? live.title : saved.title;
  // Favicon/display url: this window's live page when bound, else the record's
  // last-known (`currentURL`) or home (`originalURL`) for a dormant row.
  const url = bound
    ? liveUrl && liveUrl !== ''
      ? liveUrl
      : saved.originalURL
    : (saved.currentURL ?? saved.originalURL);
  return {
    kind: 'tab',
    id,
    title: saved.customTitle ?? labelFor(liveOrSaved, url),
    faviconSrc: faviconFor(url, live?.favIconUrl),
    // Cache-bust the endpoint fallback on the live `favIconUrl` so a CORP-blocked
    // primary that re-badges (e.g. WhatsApp's per-count icon) refreshes through it.
    faviconFallbackSrc: faviconUrl(url, 16, faviconCacheKey(live?.favIconUrl)),
    active: live?.active ?? false,
    loading: live?.status === 'loading',
    drifted,
    dormant: !bound,
    renamed: saved.customTitle !== undefined,
    originalURL: saved.originalURL,
    boundary: saved.boundary,
  };
}

/** Per-window, ephemeral folder expand state (design D2) — augmented onto the
 * store by `setFolderExpanded`, never part of `AppState`. Read reactively. */
function isExpanded(folderId: FolderId): boolean {
  const augmented = store.state as unknown as {
    expandedFoldersByWindow?: { [w: WindowId]: { [f: FolderId]: boolean } };
  };
  return augmented.expandedFoldersByWindow?.[windowId]?.[folderId] ?? false;
}

// SW state is authoritative: the list is a pure projection of the PinNode tree.
const rows = $derived.by<TopRow[]>(() => {
  const nodes = store.state.pinnedBySpace[spaceId] ?? [];
  const out: TopRow[] = [];
  // Defensive de-dup: a duplicate id in (corrupted or same-tick re-broadcast)
  // state would collide the keyed {#each} below and crash the sidebar. First
  // occurrence wins; one seen-set spans top-level node ids and folder children.
  // (The store also de-dups on the read path; this guards the render itself.)
  const seen = new Set<string>();
  for (const node of nodes) {
    if (seen.has(node.id)) continue;
    seen.add(node.id);
    if (node.kind === 'tab') {
      const view = projectTab(node.id);
      if (view) out.push(view);
    } else {
      const children: TabView[] = [];
      for (const childId of node.children) {
        if (seen.has(childId)) continue;
        seen.add(childId);
        const view = projectTab(childId);
        if (view) children.push(view);
      }
      out.push({
        kind: 'folder',
        id: node.id,
        name: node.name,
        icon: node.icon as IconName,
        color: node.color as SpaceColor,
        expanded: isExpanded(node.id),
        children,
      });
    }
  }
  return out;
});

const isEmpty = $derived(rows.length === 0);

// --- drag zones --------------------------------------------------------------
// The top-level zone's item elements are the top-level row wrappers, so its drop
// index maps 1:1 onto the top-level PinNode array. Each top-level row also
// carries a drop-onto descriptor (design D4): folders accept a tab dropped ONTO
// them (move-in) and spring-load when collapsed; tabs accept a tab dropped onto
// them (create-folder-from-two). Each EXPANDED folder additionally registers its
// own nested child zone `pinned:<spaceId>:folder:<folderId>` for ordering within
// it / dropping into an open folder.
const FOLDER_ZONE = (folderId: FolderId): string => `${ZONE}:folder:${folderId}`;

let containerEl = $state<HTMLElement>();
let rowEls = $state<HTMLElement[]>([]);
let childZoneEls = $state<Record<FolderId, HTMLElement>>({});
// Folder child rows, keyed by the child's SavedTabId (a saved tab lives in
// exactly one place, so a flat record is unambiguous and avoids the per-folder
// nested-array bind that would require a render-time mutation).
let childRowElById = $state<Record<SavedTabId, HTMLElement>>({});

/** Live child row elements for a folder, in current child order. */
function childEls(folderId: FolderId): HTMLElement[] {
  const folder = rows.find((r) => r.kind === 'folder' && r.id === folderId);
  if (!folder || folder.kind !== 'folder') return [];
  return folder.children.map((c) => childRowElById[c.id]).filter(Boolean) as HTMLElement[];
}

$effect(() => {
  if (!active || !containerEl) return;
  return drag.registerZone(ZONE, {
    el: containerEl,
    itemEls: () => rowEls.filter(Boolean),
    rows: () =>
      rows.map((row) =>
        row.kind === 'folder'
          ? { id: row.id, onto: true, springLoad: !row.expanded }
          : // A tab accepts a drop-onto (→ create folder) only from another tab.
            { id: row.id, onto: true, springLoad: false },
      ),
    onSpringLoad: (folderId) => store.setFolderExpanded(windowId, folderId, true),
  });
});

// Register a nested drop zone for each expanded folder. Keyed effect per folder
// id so zones unregister when a folder collapses or is removed.
$effect(() => {
  if (!active) return;
  const cleanups: Array<() => void> = [];
  for (const row of rows) {
    if (row.kind !== 'folder' || !row.expanded) continue;
    const zoneEl = childZoneEls[row.id];
    if (!zoneEl) continue;
    const fid = row.id;
    cleanups.push(
      drag.registerZone(FOLDER_ZONE(fid), {
        el: zoneEl,
        itemEls: () => childEls(fid),
      }),
    );
  }
  return () => {
    for (const c of cleanups) c();
  };
});

const isDragSource = (id: string): boolean => drag.state.active && drag.state.data?.id === id;

/** Whether `row` is the live drop-onto target (for the folder/tab highlight). */
const isOntoTarget = (id: string): boolean => drag.state.active && drag.state.targetOntoId === id;

/** Y (relative to the zone) of the insertion line for the given top-level index. */
function lineTop(index: number): number {
  const els = rowEls.filter(Boolean);
  if (els.length === 0) return 0;
  if (index >= els.length) {
    const last = els[els.length - 1] as HTMLElement;
    return last.offsetTop + last.offsetHeight - 1;
  }
  return (els[index] as HTMLElement).offsetTop - 1;
}

/** Insertion-line Y within an expanded folder's child zone. */
function childLineTop(folderId: FolderId, index: number): number {
  const els = childEls(folderId);
  if (els.length === 0) return 0;
  if (index >= els.length) {
    const last = els[els.length - 1] as HTMLElement;
    return last.offsetTop + last.offsetHeight - 1;
  }
  return (els[index] as HTMLElement).offsetTop - 1;
}

function onRowPointerDown(e: PointerEvent, row: TabView, sourceZone: string): void {
  // Tab rows (top-level or folder children) initiate drags. The menu
  // trigger/actions stop propagation themselves.
  const el = e.currentTarget as HTMLElement;
  drag.press(
    { id: row.id, zone: sourceZone, title: row.title, faviconSrc: row.faviconSrc },
    e,
    el,
    handleDrop,
  );
}

function onFolderPointerDown(e: PointerEvent, row: FolderView): void {
  // No drag while the folder is being renamed — the press belongs to the inline
  // name field (text selection), not a reorder.
  if (renamingFolderId === row.id) return;
  // A folder reorders among top-level entries. Its actions menu (in the trailing
  // slot) stops propagation, so a press here is always a folder drag. The grab
  // element is the top-level row wrapper so the clone matches the folder row.
  const wrap = (e.currentTarget as HTMLElement).closest('.row-wrap') as HTMLElement | null;
  drag.press(
    { id: row.id, zone: ZONE, title: row.name, faviconSrc: '' },
    e,
    wrap ?? (e.currentTarget as HTMLElement),
    handleDrop,
  );
}

function handleDrop(r: DropResult): void {
  if (!isOurSource(r)) return;

  // Folder nodes have no temp equivalent and can't nest: a folder drag only ever
  // reorders at top level (its onto/child/temp drops are no-ops → bounce back).
  const draggingFolder = (store.state.pinnedBySpace[spaceId] ?? []).some(
    (n) => n.kind === 'folder' && n.id === r.data.id,
  );

  // Pinned tab → favicon strip = DECOUPLE into a global favorite (favicon-row-model
  // `favoriteSavedTab`). The drag controller routes a drop to the SOURCE row's
  // handler, so a pinned-sourced decouple lands here. A FOLDER dropped on the
  // favicon zone bounces (no-op) — folders have no favorite equivalent. No
  // optimistic mutation; the authoritative broadcast defines the result.
  if (r.targetZone === 'favicon') {
    if (!draggingFolder) {
      dispatch({ kind: 'favoriteSavedTab', payload: { savedTabId: r.data.id } });
    }
    return;
  }

  // Pinned tab → Temporary = unpin (keeps the live tab). A FOLDER dropped on the
  // temp zone bounces (no-op) — folders have no temporary equivalent (design D5).
  if (r.targetZone.startsWith('temp:')) {
    if (!draggingFolder) {
      dispatch({ kind: 'unpinTab', payload: { savedTabId: r.data.id, windowId } });
    }
    return;
  }

  const inThisSpace = r.targetZone === ZONE || r.targetZone.startsWith(`${ZONE}:folder:`);
  if (!inThisSpace) return;

  // Drop ONTO a row in the top-level zone: into a folder, or create one.
  if (r.targetZone === ZONE && r.targetOntoId !== null && !draggingFolder) {
    const ontoFolder = (store.state.pinnedBySpace[spaceId] ?? []).find(
      (n) => n.kind === 'folder' && n.id === r.targetOntoId,
    );
    if (ontoFolder) {
      // Move the dragged tab into this folder (tree-replace).
      const nodes = removeId(clone(store.state.pinnedBySpace[spaceId] ?? []), r.data.id);
      for (const n of nodes) {
        if (n.kind === 'folder' && n.id === r.targetOntoId) n.children.push(r.data.id);
      }
      dispatch({ kind: 'reorderPinned', payload: { spaceId, nodes } });
      return;
    }
    // Dropped onto another top-level TAB → create a folder of the two.
    if (r.targetOntoId !== r.data.id) {
      const list = store.state.pinnedBySpace[spaceId] ?? [];
      const index = list.findIndex((n) => n.kind === 'tab' && n.id === r.targetOntoId);
      if (index !== -1) {
        // Folding two tabs mints a NEW folder; open its inline rename the moment
        // it arrives, matching the New-folder button (pin-temp-tab-into-folder).
        pendingCreate = true;
        dispatch({
          kind: 'createFolderFromTabs',
          payload: { spaceId, tabIdA: r.data.id, tabIdB: r.targetOntoId, index },
        });
      }
      return;
    }
    return;
  }

  // Drop INTO an expanded folder's child zone (insertion at index).
  if (r.targetZone.startsWith(`${ZONE}:folder:`) && !draggingFolder) {
    const folderId = r.targetZone.slice(`${ZONE}:folder:`.length);
    const nodes = removeId(clone(store.state.pinnedBySpace[spaceId] ?? []), r.data.id);
    for (const n of nodes) {
      if (n.kind === 'folder' && n.id === folderId) {
        const at = Math.max(0, Math.min(r.targetIndex, n.children.length));
        n.children.splice(at, 0, r.data.id);
      }
    }
    dispatch({ kind: 'reorderPinned', payload: { spaceId, nodes } });
    return;
  }

  // Between-rows in the top-level zone = reorder/move-out to top level.
  if (r.targetZone === ZONE) {
    const nodes = removeId(clone(store.state.pinnedBySpace[spaceId] ?? []), r.data.id);
    const reinsert: PinNode = draggingFolder
      ? findFolderNode(store.state.pinnedBySpace[spaceId] ?? [], r.data.id)
      : { kind: 'tab', id: r.data.id };
    const at = Math.max(0, Math.min(r.targetIndex, nodes.length));
    nodes.splice(at, 0, reinsert);
    dispatch({ kind: 'reorderPinned', payload: { spaceId, nodes } });
  }
}

/** A drag that originated in this Space's pinned area (top level or a folder). */
function isOurSource(r: DropResult): boolean {
  return r.data.zone === ZONE || r.data.zone.startsWith(`${ZONE}:folder:`);
}

/** Deep-ish clone of the node list so we never mutate the reactive `$state`. */
function clone(list: PinNode[]): PinNode[] {
  return list.map((n) =>
    n.kind === 'tab' ? { kind: 'tab', id: n.id } : { ...n, children: n.children.slice() },
  );
}
/** Remove a tab id from anywhere in a (cloned) node list — top level or a
 * folder's children. Folder nodes themselves are matched by `findFolderNode`. */
function removeId(list: PinNode[], id: string): PinNode[] {
  const out: PinNode[] = [];
  for (const n of list) {
    if (n.kind === 'tab') {
      if (n.id === id) continue;
      out.push(n);
    } else {
      out.push({ ...n, children: n.children.filter((c) => c !== id) });
    }
  }
  return out;
}
/** The folder node with `id`, cloned (for reinsertion during a folder reorder). */
function findFolderNode(list: PinNode[], id: string): PinNode {
  const found = list.find((n) => n.kind === 'folder' && n.id === id);
  return found && found.kind === 'folder'
    ? { ...found, children: found.children.slice() }
    : { kind: 'tab', id }; // defensive fallback (shouldn't happen)
}

// --- folder expand/collapse (sidebar-local, no bus) --------------------------
function toggleFolder(folderId: FolderId): void {
  if (drag.consumeJustDragged()) return;
  store.setFolderExpanded(windowId, folderId, !isExpanded(folderId));
}

// --- create + inline rename --------------------------------------------------
// The bus is fire-and-forget; after dispatching createFolder we discover the new
// folder by diffing folder ids across the next authoritative broadcast, then
// open its inline rename field in place on the folder row (design D3 / D7). The
// editable draft lives inside `FolderRow`; here we only track which folder is
// being renamed.
let renamingFolderId = $state<FolderId | null>(null);
let pendingCreate = $state(false);
let knownFolderIds: Set<FolderId> = new Set();

$effect(() => {
  const ids = new Set<FolderId>();
  for (const node of store.state.pinnedBySpace[spaceId] ?? []) {
    if (node.kind === 'folder') ids.add(node.id);
  }
  // Open inline rename on a freshly-created folder. Two arming sources converge
  // here: `pendingCreate` (a within-pinned tab→tab fold, initiated in PinnedTabs
  // — see `handleDrop`) and the per-window `autoRenameNextFolderByWindow` flag (a
  // temp→tab fold armed from the sibling TempTabs, OR the pinned-header "New
  // folder" menu armed from App — both via `setAutoRenameNextFolder`). The store
  // flag is gated on `active` so only the centre carousel slide reacts to and
  // consumes it (off-screen slides share the store but must never steal the
  // rename).
  const augmented = store.state as unknown as {
    autoRenameNextFolderByWindow?: { [w: WindowId]: boolean };
  };
  const armedFromFold = active && (augmented.autoRenameNextFolderByWindow?.[windowId] ?? false);
  if (pendingCreate || armedFromFold) {
    const fresh = [...ids].find((id) => !knownFolderIds.has(id));
    if (fresh) {
      pendingCreate = false;
      if (armedFromFold) store.setAutoRenameNextFolder(windowId, false);
      renamingFolderId = fresh;
      store.setFolderExpanded(windowId, fresh, true);
    }
  }
  knownFolderIds = ids;
});

function commitRename(folderId: FolderId, name: string): void {
  const trimmed = name.trim();
  if (trimmed) dispatch({ kind: 'renameFolder', payload: { spaceId, folderId, name: trimmed } });
  renamingFolderId = null;
}
function cancelRename(): void {
  renamingFolderId = null;
}

// --- pinned-tab rename (inline, via double-click or the row menu) -------------
// Mirrors the folder rename pattern: the parent owns the editing flag and the
// trigger; TabRowMenu forwards `editing`/`oncommitName`/`oncancelName` to its
// header TabRow, which swaps the title for an EditableLabel.
let renamingTabId = $state<SavedTabId | null>(null);

function startTabRename(savedTabId: SavedTabId): void {
  renamingTabId = savedTabId;
}

function commitTabRename(savedTabId: SavedTabId, newName: string): void {
  renamingTabId = null;
  dispatch({ kind: 'renameTab', payload: { savedTabId, newName: newName.trim() } });
}

function cancelTabRename(): void {
  renamingTabId = null;
}

// "Reset name" → clear the custom title by sending an empty newName.
function resetTabName(savedTabId: SavedTabId): void {
  dispatch({ kind: 'renameTab', payload: { savedTabId, newName: '' } });
}

// --- folder appearance editor (icon + colour), reusing primitives ------------
// The picker now lives inline in the folder's RowMenu morph (FolderRow owns the
// panel); these handlers dispatch the chosen icon/colour.
function chooseColor(folderId: FolderId, color: SpaceColor): void {
  dispatch({ kind: 'setFolderColor', payload: { spaceId, folderId, color } });
}
function chooseIcon(folderId: FolderId, icon: IconName): void {
  dispatch({ kind: 'setFolderIcon', payload: { spaceId, folderId, icon } });
}

// --- dispatch + tab interactions ---------------------------------------------
function dispatch(cmd: SidebarCommand): void {
  bus.send(cmd).catch((err: unknown) => {
    log.debug('PinnedTabs: bus dispatch failed', { kind: cmd.kind, err });
  });
}

let confirmingDeleteId = $state<SavedTabId | null>(null);
// Which row's boundary editor is open in its menu drawer (pinned-tab-domain-boundary).
let editingBoundaryId = $state<SavedTabId | null>(null);

function onTabClick(row: TabView): void {
  if (drag.consumeJustDragged()) return; // a drag just ended — not a click
  if (row.dormant) {
    dispatch({ kind: 'openSavedTab', payload: { savedTabId: row.id, windowId } });
  } else {
    dispatch({ kind: 'focusSavedTab', payload: { savedTabId: row.id, windowId } });
  }
}

function tabMenuItems(row: TabView): TabRowMenuItem[] {
  const items: TabRowMenuItem[] = [];
  if (row.drifted) {
    items.push({
      id: 'go-home',
      label: 'Go home',
      icon: 'house',
      onSelect: () => dispatch({ kind: 'goHome', payload: { savedTabId: row.id, windowId } }),
    });
    items.push({
      id: 'make-home',
      label: 'Make this home',
      icon: 'map-pin-house',
      onSelect: () => dispatch({ kind: 'makeThisHome', payload: { savedTabId: row.id } }),
    });
  }
  items.push({
    id: 'rename',
    label: 'Rename',
    icon: 'pencil',
    onSelect: () => startTabRename(row.id),
  });
  if (row.renamed) {
    items.push({
      id: 'reset-name',
      label: 'Reset name',
      icon: 'history',
      onSelect: () => resetTabName(row.id),
    });
  }
  items.push({
    id: 'keep-on-site',
    label: 'Lock to its site…',
    icon: 'anchor',
    keepOpen: true,
    submenu: true,
    onSelect: () => {
      editingBoundaryId = editingBoundaryId === row.id ? null : row.id;
    },
  });
  items.push({
    id: 'unpin',
    label: 'Unpin',
    icon: 'pin-off',
    onSelect: () => dispatch({ kind: 'unpinTab', payload: { savedTabId: row.id, windowId } }),
  });
  if (!row.dormant && confirmingDeleteId !== row.id) {
    items.push({
      id: 'delete',
      label: 'Delete',
      icon: 'trash-2',
      danger: true,
      keepOpen: true,
      onSelect: () => {
        confirmingDeleteId = row.id;
      },
    });
  } else {
    items.push({
      id: 'delete',
      label: row.dormant ? 'Delete' : 'Delete — confirm',
      icon: 'trash-2',
      danger: true,
      onSelect: () => {
        confirmingDeleteId = null;
        dispatch({ kind: 'deleteSavedTab', payload: { savedTabId: row.id } });
      },
    });
  }
  return items;
}
</script>

{#if isEmpty}
  <!-- Match the list's --list-pad inset so the empty-state text lines up with the
       header glyph + the favicon column (EmptyState adds its own --space-3). -->
  <div class="pinned-empty">
    <EmptyState
      title="No pinned tabs yet."
      subtitle="Drag a tab up here, or press Option+D, to pin it."
    />
  </div>
{/if}

<div class="pinned" class:empty={isEmpty} data-testid="pinned-tabs" bind:this={containerEl}>
  {#if drag.state.active && drag.state.targetZone === ZONE}
    <div class="drop-line" style:top={`${lineTop(drag.state.targetIndex)}px`}></div>
  {/if}
  {#each rows as row, i (row.id)}
    <!-- One keyed wrapper per row so `animate:flip` is the sole child of the
         {#each} (Svelte requirement); the tab/folder branch lives inside. Tab
         rows (top-level + folder children) arm the drag; folder rows reorder via
         their own pointerdown below. -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="row-wrap"
      class:dragging={isDragSource(row.id)}
      class:onto-target={row.kind === 'tab' && isOntoTarget(row.id)}
      data-row-kind={row.kind}
      data-row-id={row.id}
      bind:this={rowEls[i]}
      onpointerdown={row.kind === 'tab' ? (e) => onRowPointerDown(e, row, ZONE) : undefined}
      animate:flipMove
    >
      {#if row.kind === 'tab'}
        {#snippet boundaryPanel()}
          <TabBoundaryEditor
            savedTabId={row.id}
            boundary={row.boundary}
            originalURL={row.originalURL}
            globalDefault={boundaryDefault.value}
          />
        {/snippet}
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div class="drag-handle" ondblclick={() => startTabRename(row.id)}>
          <TabRowMenu
            header={{
              title: row.title,
              faviconSrc: row.faviconSrc,
              faviconFallbackSrc: row.faviconFallbackSrc,
              active: row.active,
              loading: row.loading,
              drifted: row.drifted,
            }}
            items={tabMenuItems(row)}
            panel={editingBoundaryId === row.id ? boundaryPanel : undefined}
            panelTitle={editingBoundaryId === row.id ? 'Lock to its site' : undefined}
            onPanelBack={() => {
              editingBoundaryId = null;
            }}
            onRowClick={() => onTabClick(row)}
            label="Tab actions"
            editing={renamingTabId === row.id}
            oncommitName={(next) => commitTabRename(row.id, next)}
            oncancelName={cancelTabRename}
            onOpenChange={(open) => {
              if (!open) {
                if (confirmingDeleteId === row.id) confirmingDeleteId = null;
                if (editingBoundaryId === row.id) editingBoundaryId = null;
              }
            }}
          />
        </div>
      {:else}
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div onpointerdown={(e) => onFolderPointerDown(e, row)}>
          <FolderRow
            name={row.name}
            icon={row.icon}
            color={row.color}
            expanded={row.expanded}
            dropTarget={isOntoTarget(row.id)}
            editing={renamingFolderId === row.id}
            colors={COLORS}
            onToggle={() => toggleFolder(row.id)}
            onRename={(name) => commitRename(row.id, name)}
            onRenameCancel={cancelRename}
            onStartRename={() => {
              renamingFolderId = row.id;
            }}
            onSetColor={(c) => chooseColor(row.id, c)}
            onSetIcon={(ic) => chooseIcon(row.id, ic)}
            onDelete={() => dispatch({ kind: 'deleteFolder', payload: { spaceId, folderId: row.id } })}
          />
        </div>

        {#if row.expanded}
          <div class="children" data-testid="folder-children" bind:this={childZoneEls[row.id]}>
            {#if drag.state.active && drag.state.targetZone === FOLDER_ZONE(row.id)}
              <div class="drop-line" style:top={`${childLineTop(row.id, drag.state.targetIndex)}px`}></div>
            {/if}
            {#each row.children as child (child.id)}
              <!-- svelte-ignore a11y_no_static_element_interactions -->
              <!-- svelte-ignore a11y_no_static_element_interactions -->
              <div
                class="child-wrap"
                class:dragging={isDragSource(child.id)}
                bind:this={childRowElById[child.id]}
                onpointerdown={(e) => onRowPointerDown(e, child, FOLDER_ZONE(row.id))}
                ondblclick={() => startTabRename(child.id)}
              >
                {#snippet childBoundaryPanel()}
                  <TabBoundaryEditor
                    savedTabId={child.id}
                    boundary={child.boundary}
                    originalURL={child.originalURL}
                    globalDefault={boundaryDefault.value}
                  />
                {/snippet}
                <TabRowMenu
                  header={{
                    title: child.title,
                    faviconSrc: child.faviconSrc,
                    faviconFallbackSrc: child.faviconFallbackSrc,
                    active: child.active,
                    loading: child.loading,
                    drifted: child.drifted,
                  }}
                  items={tabMenuItems(child)}
                  panel={editingBoundaryId === child.id ? childBoundaryPanel : undefined}
                  panelTitle={editingBoundaryId === child.id ? 'Lock to its site' : undefined}
                  onPanelBack={() => {
                    editingBoundaryId = null;
                  }}
                  onRowClick={() => onTabClick(child)}
                  label="Tab actions"
                  editing={renamingTabId === child.id}
                  oncommitName={(next) => commitTabRename(child.id, next)}
                  oncancelName={cancelTabRename}
                  onOpenChange={(open) => {
                    if (!open) {
                      if (confirmingDeleteId === child.id) confirmingDeleteId = null;
                      if (editingBoundaryId === child.id) editingBoundaryId = null;
                    }
                  }}
                />
              </div>
            {/each}
            {#if row.children.length === 0}
              <div class="folder-empty">Empty — drag tabs here.</div>
            {/if}
          </div>
        {/if}
      {/if}
    </div>
  {/each}
</div>

<style>
  /* Share the list's horizontal inset so the empty-state text lines up with the
   * header glyph and the favicon column (EmptyState adds its own --space-3). */
  .pinned-empty {
    padding: 0 var(--list-pad);
  }

  .pinned {
    position: relative;
    display: flex;
    flex-direction: column;
    padding: var(--space-1) var(--list-pad);
  }
  .pinned.empty {
    min-height: 28px;
  }

  .row-wrap {
    padding-bottom: var(--row-gap);
    animation: pinned-row-in var(--motion-base) var(--ease-emphasised);
    touch-action: none;
  }
  .row-wrap.dragging {
    opacity: 0.4;
  }
  /* Drop-onto a top-level TAB (create-folder-from-two): a colour-tinted ring,
   * distinct from the between-row insertion line. Folder rows get their own
   * highlight from FolderRow's `dropTarget` prop. */
  .row-wrap.onto-target :global(.tab-row) {
    box-shadow: inset 0 0 0 1.5px var(--space-c);
    background: var(--space-c-soft);
    border-radius: var(--r-md);
  }

  .child-wrap.dragging {
    opacity: 0.4;
  }

  .children {
    /* Inset the children with PADDING (not margin) so the box stays full width:
     * each child row's right edge stays aligned with the top-level rows and the
     * indentation never causes horizontal overflow. */
    padding-left: var(--space-4);
    display: flex;
    flex-direction: column;
    /* No `overflow: hidden` here: a child row's TabRowMenu action drawer grows
     * downward (absolutely positioned, beyond the row) and would be clipped,
     * making a folder-child's actions menu invisible. The `folder-open`
     * entrance is translate + opacity only, so it needs no clipping. */
    animation: folder-open var(--motion-base) var(--ease-emphasised);
  }
  .child-wrap {
    padding-bottom: var(--row-gap);
  }
  .folder-empty {
    padding: var(--space-1) var(--space-2);
    color: var(--text-faint);
    font: 400 11.5px/1.2 var(--font-sans);
  }

  .drop-line {
    position: absolute;
    left: calc(var(--list-pad) + 2px);
    right: calc(var(--list-pad) + 2px);
    height: 0;
    z-index: 2;
    pointer-events: none;
    animation: drop-line-in 120ms var(--ease-emphasised);
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

  @keyframes drop-line-in {
    from {
      opacity: 0;
      transform: scaleX(0.96);
    }
    to {
      opacity: 1;
      transform: scaleX(1);
    }
  }

  @keyframes pinned-row-in {
    from {
      opacity: 0;
      transform: translateY(-4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes folder-open {
    from {
      opacity: 0;
      transform: translateY(-3px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .row-wrap,
    .children {
      animation: none;
    }
  }
</style>
