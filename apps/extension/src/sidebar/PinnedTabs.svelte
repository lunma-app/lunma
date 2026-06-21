<script lang="ts">
import '../ui/drop-line.css';
import type { AnimationConfig } from 'svelte/animate';
import { cubicOut } from 'svelte/easing';
import { dispatch } from '../shared/bus';
import type { IconName } from '../shared/icon-names';
import { hostOf, labelFor } from '../shared/label-for';
import type {
  AppState,
  FolderId,
  PinNode,
  SavedTabId,
  SidebarLocalState,
  SpaceColor,
  SpaceId,
  TabBoundary,
  TabId,
  WindowId,
} from '../shared/types';
import ContextMenu from '../ui/ContextMenu.svelte';
import FolderRow from '../ui/FolderRow.svelte';
import { faviconCacheKey, faviconFor, faviconUrl } from '../ui/favicon';
import IconButton from '../ui/IconButton.svelte';
import type { MenuItem } from '../ui/menu-types';
import TabRow from '../ui/TabRow.svelte';
import { boundaryDefault } from './boundary-default.svelte';
import { type DropResult, drag, reorderFlipMs } from './drag.svelte';
import EmptyState from './EmptyState.svelte';
import SmartFolder from './SmartFolder.svelte';
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

/**
 * Translate-only FLIP. Svelte's built-in `flip` also animates scale when an
 * element's SIZE changes between layouts — which made expanding a folder stretch
 * its row (the wrapper grows taller as children appear) before snapping back.
 * Reorder only needs position to glide, so we animate `translate` from the old
 * top-left delta to zero and ignore size entirely. A row whose position is
 * unchanged (dx=dy=0) gets a no-op, so expand/collapse never animates the row.
 *
 * Duration is sampled from `reorderFlipMs()` at animation start (0 under reduced
 * motion, else `--motion-base`) — no hard-coded millisecond literal.
 */
function flipMove(_node: Element, { from, to }: { from: DOMRect; to: DOMRect }): AnimationConfig {
  const dx = from.left - to.left;
  const dy = from.top - to.top;
  if (dx === 0 && dy === 0) return { duration: 0 };
  return {
    duration: reorderFlipMs(),
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
  /** This window's bound live tab id, or undefined when dormant — the target of
   * the trailing ✕ close (closing it leaves the saved record dormant). */
  boundTabId: TabId | undefined;
  /** True when the user has set a custom name (`SavedTab.customTitle`) — drives
   * the "Reset name" menu item's visibility. */
  renamed: boolean;
  /** The tab's home URL — passed to the boundary editor to seed the domain. */
  originalURL: string;
  /** Home hostname (`hostOf(originalURL)`) — the drift subtitle + the favicon
   * "Return to <host>" affordance's text. Empty when `originalURL` has no host. */
  homeHost: string;
  /** The saved tab's explicit boundary (undefined ⇒ inheriting the global default). */
  boundary: TabBoundary | undefined;
}
interface FolderView {
  kind: 'folder';
  id: FolderId;
  name: string;
  icon: string;
  color: SpaceColor;
  expanded: boolean;
  children: TabView[];
}
interface SmartRowView {
  kind: 'smart';
  id: FolderId;
  /** The config node itself — `SmartFolder.svelte` reads its runtime results
   * from the store's ephemeral `smartFolders` slice. */
  node: Extract<PinNode, { kind: 'smart' }>;
  expanded: boolean;
}
type TopRow = TabView | FolderView | SmartRowView;

/** Project a saved-tab id into a renderable tab view, or null on drift (no record). */
function projectTab(id: SavedTabId): TabView | null {
  const saved = store.state.savedTabs[id];
  if (!saved) return null;
  // Per-window-tab-bindings (ADR 0003, design D7): the sidebar is a per-window
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
    boundTabId,
    renamed: saved.customTitle !== undefined,
    originalURL: saved.originalURL,
    homeHost: hostOf(saved.originalURL),
    boundary: saved.boundary,
  };
}

/** Per-window, ephemeral folder expand state (design D2) — augmented onto the
 * store by `setFolderExpanded`, never part of `AppState`. Read reactively. */
function isExpanded(folderId: FolderId): boolean {
  const augmented = store.state as AppState & SidebarLocalState;
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
    } else if (node.kind === 'smart') {
      // A smart folder reuses the folder expand/collapse mechanism, keyed by
      // node id; its children are connector results owned by SmartFolder.svelte.
      out.push({ kind: 'smart', id: node.id, node, expanded: isExpanded(node.id) });
    } else if (node.kind === 'folder') {
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
        icon: node.icon,
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
// Smart-folder component refs — the wrapper's contextmenu routes to the
// component's own ContextMenu (the smart row's right-click menu).
let smartFolderRefs = $state<Record<FolderId, { onContextMenu: (e: MouseEvent) => void }>>({});
// Folder child rows, keyed by the child's SavedTabId (a saved tab lives in
// exactly one place, so a flat record is unambiguous and avoids the per-folder
// nested-array bind that would require a render-time mutation).
let childRowElById = $state<Record<SavedTabId, HTMLElement>>({});

/** Live child row elements for a folder, in current child order. */
function childEls(folderId: FolderId): HTMLElement[] {
  const folder = rows.find((r) => r.kind === 'folder' && r.id === folderId);
  if (folder?.kind !== 'folder') return [];
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
          : row.kind === 'smart'
            ? // A smart row is an INERT onto target (design D13): never reported
              // via targetOntoId, so a drop on it degrades to nearest-edge
              // top-level insertion — it has no children to file into, and
              // folder-minting drops apply to pinned tab targets only.
              { id: row.id, onto: false, springLoad: false }
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

function onSmartPointerDown(e: PointerEvent, row: SmartRowView): void {
  // A smart node drags/reorders among pins as ONE unit, exactly like a folder
  // (design D13). Its result rows stop their own pointerdown (activate-only,
  // never drag sources), so a press here is always the node drag.
  const wrap = (e.currentTarget as HTMLElement).closest('.row-wrap') as HTMLElement | null;
  drag.press(
    { id: row.id, zone: ZONE, title: row.node.name, faviconSrc: '' },
    e,
    wrap ?? (e.currentTarget as HTMLElement),
    handleDrop,
  );
}

function handleDrop(r: DropResult): void {
  if (!isOurSource(r)) return;
  // Released outside every zone → cancel: snap back, dispatch nothing (cancellable-drag).
  if (r.targetZone === null) return;

  // Folder and smart nodes have no temp equivalent and can't nest: a unit drag
  // only ever reorders at top level (its onto/child/temp drops are no-ops →
  // bounce back). Design D5 (folders) + D13 (smart nodes drag as one unit).
  const draggingUnit = (store.state.pinnedBySpace[spaceId] ?? []).some(
    (n) => n.kind !== 'tab' && n.id === r.data.id,
  );

  // Pinned tab → favicon strip = DECOUPLE into a global favorite (favicon-row-model
  // `favoriteSavedTab`). The drag controller routes a drop to the SOURCE row's
  // handler, so a pinned-sourced decouple lands here. A FOLDER or SMART node
  // dropped on the favicon zone bounces (no-op) — neither has a favorite
  // equivalent. No optimistic mutation; the broadcast defines the result.
  if (r.targetZone === 'favicon') {
    if (!draggingUnit) {
      dispatch({ kind: 'favoriteSavedTab', payload: { savedTabId: r.data.id } });
    }
    return;
  }

  // Pinned tab → Temporary = unpin (keeps the live tab). A FOLDER or SMART node
  // dropped on the temp zone bounces (no-op) — no temporary equivalent
  // (design D5; smart-to-temporary rejected exactly like a folder, D13).
  if (r.targetZone.startsWith('temp:')) {
    if (!draggingUnit) {
      dispatch({ kind: 'unpinTab', payload: { savedTabId: r.data.id, windowId } });
    }
    return;
  }

  const inThisSpace = r.targetZone === ZONE || r.targetZone.startsWith(`${ZONE}:folder:`);
  if (!inThisSpace) return;

  // Drop ONTO a row in the top-level zone: into a folder, or create one. Only
  // TAB drags file or mint — a folder/smart unit never lands "into" anything.
  if (r.targetZone === ZONE && r.targetOntoId !== null && !draggingUnit) {
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
  if (r.targetZone.startsWith(`${ZONE}:folder:`) && !draggingUnit) {
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
    const reinsert: PinNode = draggingUnit
      ? findUnitNode(store.state.pinnedBySpace[spaceId] ?? [], r.data.id)
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
  return list.map((n) => (n.kind === 'folder' ? { ...n, children: n.children.slice() } : { ...n }));
}
/** Remove `id` from anywhere in a (cloned) node list — a top-level node of any
 * kind, or a folder child. Removing the dragged folder/smart node here matters:
 * the SW's tree sanitizer de-dups FIRST-occurrence-wins, so leaving the
 * original in place would make the reinserted copy lose and a unit drag
 * DOWNWARD silently no-op. Tab and folder/smart ids never collide (UUIDs), so
 * the exact-id match is unambiguous. */
function removeId(list: PinNode[], id: string): PinNode[] {
  const out: PinNode[] = [];
  for (const n of list) {
    if (n.id === id) continue;
    if (n.kind === 'folder') {
      out.push({ ...n, children: n.children.filter((c) => c !== id) });
    } else {
      out.push(n);
    }
  }
  return out;
}
/** The folder/smart node with `id`, cloned (for reinsertion during a unit
 * reorder) — a smart node round-trips with its config fields intact (D13). */
function findUnitNode(list: PinNode[], id: string): PinNode {
  const found = list.find((n) => n.kind !== 'tab' && n.id === id);
  if (found?.kind === 'folder') return { ...found, children: found.children.slice() };
  if (found?.kind === 'smart') return { ...found };
  return { kind: 'tab', id }; // defensive fallback (shouldn't happen)
}

// --- keyboard/touch reorder via the menu (Move up/down) -----------------------
// Move reorders a node ONE slot within its CONTAINING list — the top level for a
// top-level tab or a folder, the folder's `children` for a child row. It never
// escapes a folder (a child at an edge reports `can: false` → disabled entry).
// The reorder dispatches the existing `reorderPinned` with the full post-move
// tree (no new bus kinds; no optimistic mutation — the broadcast defines order).

/** Whether `id` (a top-level node or a folder child) can move up/down within its
 * containing list. */
function moveBounds(id: string): { up: boolean; down: boolean } {
  const nodes = store.state.pinnedBySpace[spaceId] ?? [];
  const top = nodes.findIndex((n) => n.id === id);
  if (top !== -1) return { up: top > 0, down: top < nodes.length - 1 };
  for (const n of nodes) {
    if (n.kind === 'folder') {
      const ci = n.children.indexOf(id);
      if (ci !== -1) return { up: ci > 0, down: ci < n.children.length - 1 };
    }
  }
  return { up: false, down: false };
}

/** Move `id` one slot (`dir` = -1 up / +1 down) within its containing list and
 * dispatch the full post-move node order. A no-op at the containing list's edge. */
function moveNode(id: string, dir: -1 | 1): void {
  const nodes = clone(store.state.pinnedBySpace[spaceId] ?? []);
  const swap = <T,>(arr: T[], i: number, j: number): boolean => {
    if (j < 0 || j >= arr.length) return false;
    [arr[i], arr[j]] = [arr[j] as T, arr[i] as T];
    return true;
  };
  const top = nodes.findIndex((n) => n.id === id);
  if (top !== -1) {
    if (!swap(nodes, top, top + dir)) return;
    dispatch({ kind: 'reorderPinned', payload: { spaceId, nodes } });
    return;
  }
  for (const n of nodes) {
    if (n.kind === 'folder') {
      const ci = n.children.indexOf(id);
      if (ci !== -1) {
        if (!swap(n.children, ci, ci + dir)) return;
        dispatch({ kind: 'reorderPinned', payload: { spaceId, nodes } });
        return;
      }
    }
  }
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
  const augmented = store.state as AppState & SidebarLocalState;
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
// trigger; the row's `TabRow` takes `editing`/`oncommitName`/`oncancelName`
// directly, swapping the title for an EditableLabel.
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
let confirmingDeleteId = $state<SavedTabId | null>(null);
// Which row's boundary editor is open as the menu's drill-in.
let editingBoundaryId = $state<SavedTabId | null>(null);

// --- right-click menu (one shared instance, opened at the cursor) -------------
// Mirrors FaviconRow: a single ContextMenu floated at the pointer for whichever
// row was right-clicked. The active row is re-derived by id across the live rows
// (top-level + folder children) so the menu reflects state after each round-trip
// and auto-closes when that row leaves the list (design D2).
let menuOpen = $state(false);
let menuX = $state(0);
let menuY = $state(0);
let menuRowId = $state<SavedTabId | null>(null);
// The row element a keyboard-invoked menu anchors to (see onRowContextMenu / D6).
let menuAnchorEl = $state<HTMLElement | undefined>(undefined);

/** Every tab view in the list, flattened across folders — the lookup the menu
 * re-derives its active row from. */
const allTabViews = $derived.by<TabView[]>(() => {
  const out: TabView[] = [];
  for (const row of rows) {
    if (row.kind === 'tab') out.push(row);
    else if (row.kind === 'folder') out.push(...row.children);
    // Smart rows carry no tab views — their results are not tabs.
  }
  return out;
});
const activeMenuRow = $derived(
  menuRowId !== null ? (allTabViews.find((t) => t.id === menuRowId) ?? null) : null,
);

function onRowContextMenu(e: MouseEvent, row: TabView): void {
  // Open the action menu at the cursor and suppress Chrome's native menu. A
  // right-click never focuses/switches the tab (design D4). Reset transient row
  // state so the menu opens into the actions list, not a stale drill-in/confirm.
  e.preventDefault();
  menuX = e.clientX;
  menuY = e.clientY;
  // The invoking row element — ContextMenu anchors to it when the event carries no
  // pointer position (keyboard menu key / Shift+F10 reports clientX/Y 0,0; D6).
  menuAnchorEl = e.currentTarget as HTMLElement;
  menuRowId = row.id;
  editingBoundaryId = null;
  confirmingDeleteId = null;
  menuOpen = true;
}

function onTabClick(row: TabView): void {
  if (drag.consumeJustDragged()) return; // a drag just ended — not a click
  if (row.dormant) {
    dispatch({ kind: 'openSavedTab', payload: { savedTabId: row.id, windowId } });
  } else {
    dispatch({ kind: 'focusSavedTab', payload: { savedTabId: row.id, windowId } });
  }
}

// The trailing ✕ closes the row's BOUND live tab (→ dormant saved record, the
// Arc model). Only rendered for bound rows, so `boundTabId` is defined here.
function closeBoundTab(row: TabView): void {
  if (row.boundTabId !== undefined) {
    dispatch({ kind: 'closeTab', payload: { tabId: row.boundTabId } });
  }
}

function tabMenuItems(row: TabView): MenuItem[] {
  const items: MenuItem[] = [];
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
      // Drill the menu into the boundary editor (ContextMenu's panel view). The
      // back affordance / Esc returns to the actions.
      confirmingDeleteId = null; // selecting another entry disarms a pending Delete
      editingBoundaryId = row.id;
    },
  });
  // Move up/down — reorder within the containing list (top level, or the folder's
  // children for a child row; never escaping the folder), disabled at the edges so
  // reordering is reachable from the keyboard (context-menu key) and touch long-press.
  const bounds = moveBounds(row.id);
  items.push(
    {
      id: 'move-up',
      label: 'Move up',
      disabled: !bounds.up,
      onSelect: () => moveNode(row.id, -1),
    },
    {
      id: 'move-down',
      label: 'Move down',
      disabled: !bounds.down,
      onSelect: () => moveNode(row.id, 1),
    },
  );
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

<div
  class="pinned"
  class:empty={isEmpty}
  data-testid="pinned-tabs"
  bind:this={containerEl}
>
  {#if isEmpty}
    <!-- The empty state lives INSIDE the registered drop zone (`.pinned` is the
         zone el), so the drop-zone card is itself the hit target — dragging a tab
         over the card lights it up (`over`) instead of a thin strip beneath it. -->
    <EmptyState
      icon="pin"
      title="No pinned tabs yet."
      subtitle="Drag a tab up here, or press Option+D, to pin it."
      over={drag.state.active && drag.state.targetZone === ZONE}
    />
  {:else if drag.state.active && drag.state.targetZone === ZONE}
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
      oncontextmenu={row.kind === 'tab' ? (e) => onRowContextMenu(e, row) : undefined}
      animate:flipMove
    >
      {#if row.kind === 'tab'}
        {#snippet closeButton()}
          <!-- Bound rows only: the ✕ closes the live tab (→ dormant). It swallows
               its own pointerdown so pressing it never arms the row's drag; the
               button is outside the row hit target, so it never focuses the row. -->
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <span class="close-slot" onpointerdown={(e) => e.stopPropagation()}>
            <IconButton
              icon="x"
              ariaLabel="Close tab"
              title="Close tab"
              size={14}
              testid="pinned-close"
              onclick={() => closeBoundTab(row)}
            />
          </span>
        {/snippet}
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div class="drag-handle" ondblclick={() => startTabRename(row.id)}>
          <TabRow
            title={row.title}
            faviconSrc={row.faviconSrc}
            faviconFallbackSrc={row.faviconFallbackSrc}
            active={row.active}
            loading={row.loading}
            drifted={row.drifted}
            homeHost={row.homeHost}
            onGoHome={() => dispatch({ kind: 'goHome', payload: { savedTabId: row.id, windowId } })}
            editing={renamingTabId === row.id}
            oncommitName={(next) => commitTabRename(row.id, next)}
            oncancelName={cancelTabRename}
            onclick={() => onTabClick(row)}
            trailing={row.dormant ? undefined : closeButton}
          />
        </div>
      {:else if row.kind === 'smart'}
        <!-- A smart folder: folder-row chrome + live connector results. The
             wrapper arms the smart node's unit drag; the result rows inside
             SmartFolder stop their own pointerdown (activate-only). -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
          onpointerdown={(e) => onSmartPointerDown(e, row)}
          oncontextmenu={(e) => smartFolderRefs[row.id]?.onContextMenu(e)}
        >
          <SmartFolder
            bind:this={smartFolderRefs[row.id]}
            {windowId}
            {spaceId}
            node={row.node}
            expanded={row.expanded}
            canMoveUp={moveBounds(row.id).up}
            canMoveDown={moveBounds(row.id).down}
            onMoveUp={() => moveNode(row.id, -1)}
            onMoveDown={() => moveNode(row.id, 1)}
            onToggle={() => toggleFolder(row.id)}
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
            canMoveUp={moveBounds(row.id).up}
            canMoveDown={moveBounds(row.id).down}
            onMoveUp={() => moveNode(row.id, -1)}
            onMoveDown={() => moveNode(row.id, 1)}
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
              <div
                class="child-wrap"
                class:dragging={isDragSource(child.id)}
                bind:this={childRowElById[child.id]}
                onpointerdown={(e) => onRowPointerDown(e, child, FOLDER_ZONE(row.id))}
                oncontextmenu={(e) => onRowContextMenu(e, child)}
                ondblclick={() => startTabRename(child.id)}
              >
                {#snippet childCloseButton()}
                  <!-- svelte-ignore a11y_no_static_element_interactions -->
                  <span class="close-slot" onpointerdown={(e) => e.stopPropagation()}>
                    <IconButton
                      icon="x"
                      ariaLabel="Close tab"
                      title="Close tab"
                      size={14}
                      testid="pinned-close"
                      onclick={() => closeBoundTab(child)}
                    />
                  </span>
                {/snippet}
                <TabRow
                  title={child.title}
                  faviconSrc={child.faviconSrc}
                  faviconFallbackSrc={child.faviconFallbackSrc}
                  active={child.active}
                  loading={child.loading}
                  drifted={child.drifted}
                  homeHost={child.homeHost}
                  onGoHome={() => dispatch({ kind: 'goHome', payload: { savedTabId: child.id, windowId } })}
                  editing={renamingTabId === child.id}
                  oncommitName={(next) => commitTabRename(child.id, next)}
                  oncancelName={cancelTabRename}
                  onclick={() => onTabClick(child)}
                  trailing={child.dormant ? undefined : childCloseButton}
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

{#snippet boundaryPanel()}
  {#if activeMenuRow}
    <div class="boundary-body">
      <TabBoundaryEditor
        savedTabId={activeMenuRow.id}
        boundary={activeMenuRow.boundary}
        originalURL={activeMenuRow.originalURL}
        globalDefault={boundaryDefault.value}
      />
    </div>
  {/if}
{/snippet}

<!-- One shared right-click menu, opened at the cursor for whichever row was
     right-clicked (mirrors FaviconRow). "Lock to its site…" drills it into the
     boundary editor with a back-header; the active row is re-derived by id so the
     panel reflects state after each round-trip and the menu closes if the row
     leaves the list. -->
{#if activeMenuRow}
  <ContextMenu
    bind:open={menuOpen}
    x={menuX}
    y={menuY}
    anchorEl={menuAnchorEl}
    items={tabMenuItems(activeMenuRow)}
    label="Tab actions"
    testid="pinned-menu"
    panel={editingBoundaryId === activeMenuRow.id ? boundaryPanel : undefined}
    panelTitle={editingBoundaryId === activeMenuRow.id ? 'Lock to its site' : undefined}
    onPanelBack={() => {
      editingBoundaryId = null;
    }}
    onclose={() => {
      confirmingDeleteId = null;
      editingBoundaryId = null;
    }}
  />
{/if}

<style>
  .pinned {
    position: relative;
    display: flex;
    flex-direction: column;
    padding: var(--space-1) var(--list-pad);
  }

  .row-wrap {
    padding-bottom: var(--row-gap);
    animation: pinned-row-in var(--motion-base) var(--ease-emphasised);
    /* No resting `touch-action: none` — touch users pan the pinned list; the drag
     * controller suppresses panning only during an active pointer drag
     * (row-drag-does-not-block-touch-panning). */
  }
  .row-wrap.dragging {
    opacity: 0.4;
  }

  /* Wraps the trailing ✕ so it can swallow its own pointerdown (no drag) while the
   * IconButton primitive keeps its box/ring. */
  .close-slot {
    display: inline-flex;
  }

  /* "Lock to its site…" boundary editor — rendered as the menu's drill-in panel
   * (ContextMenu owns the padding); a min-width so the allow-list editor has room. */
  .boundary-body {
    min-width: 216px;
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
    /* The `folder-open` entrance is translate + opacity only, so it needs no
     * clipping; we leave `overflow` unset so a child row's hover affordances are
     * never clipped. */
    animation: folder-open var(--motion-base) var(--ease-emphasised);
  }
  .child-wrap {
    padding-bottom: var(--row-gap);
  }
  .folder-empty {
    padding: var(--space-1) var(--space-2);
    color: var(--text-faint);
    font: var(--weight-regular) var(--text-xs)/1.2 var(--font-sans);
  }

  .drop-line {
    position: absolute;
    left: calc(var(--list-pad) + 2px);
    right: calc(var(--list-pad) + 2px);
    height: 0;
    z-index: var(--z-raised);
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
