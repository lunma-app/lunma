<script lang="ts">
import '../ui/drop-line.css';
import { SvelteSet } from 'svelte/reactivity';
import { dispatch } from '../shared/bus';
import { hostOf, labelFor } from '../shared/label-for';
import { log } from '../shared/logger';
import type { SavedTabId, TabBoundary, WindowId } from '../shared/types';
import ContextMenu from '../ui/ContextMenu.svelte';
import FaviconTile from '../ui/FaviconTile.svelte';
import { faviconCacheKey, faviconFor, faviconUrl } from '../ui/favicon';
import type { MenuItem } from '../ui/menu-types';
import { type DropResult, drag } from './drag.svelte';
import EmptyState from './EmptyState.svelte';
import { useStore } from './store-context.svelte';
import TabBoundaryEditor from './TabBoundaryEditor.svelte';
import Welcome from './Welcome.svelte';

interface Props {
  windowId: WindowId;
}

const { windowId }: Props = $props();
const store = useStore();

interface FavView {
  id: SavedTabId;
  title: string;
  faviconSrc: string;
  /** The `_favicon` endpoint, retried when the primary `faviconSrc` fails to load. */
  faviconFallbackSrc: string;
  /** The favorite's home/live URL — used by the context menu's Copy link. */
  url: string;
  /** The favorite's home URL — seeds the boundary editor's domain. */
  originalURL: string;
  /** Home hostname (`hostOf(originalURL)`) — the drift "Return to <host>"
   * affordance's text. Empty when `originalURL` has no host. */
  homeHost: string;
  /** The favorite's explicit site-boundary (undefined ⇒ favorites default to locked). */
  boundary: TabBoundary | undefined;
  active: boolean;
  loading: boolean;
  drifted: boolean;
  /** Dormant: no live tab bound in THIS window. */
  unbound: boolean;
  /** Bound to a live tab in ANY window — gates the Delete two-step: a favorite
   * dormant in every window deletes without a confirm (per the deletion spec),
   * whereas one with a live tab somewhere arms first (deletion closes that tab). */
  boundAnywhere: boolean;
}

/**
 * Project a favicon-row saved-tab id into a renderable tile view, deriving its
 * per-window binding state (lunma-bookmark-bindings: "reflects its bound tab's
 * per-window state"). Mirrors `PinnedTabs.projectTab`, minus the folder/boundary
 * concerns favorites don't have — the sidebar is a per-window surface, so it
 * reads ONLY this window's `tabBindings[id][windowId]` slot.
 */
function projectFavorite(id: SavedTabId): FavView | null {
  const saved = store.state.savedTabs[id];
  if (!saved) return null;
  const bindings = store.state.tabBindings[id];
  const boundTabId = bindings?.[windowId];
  const bound = boundTabId !== undefined;
  const live = bound ? store.state.liveTabsById[boundTabId] : undefined;
  // Bound in ANY window? (gates the Delete confirm — see FavView.boundAnywhere).
  const boundAnywhere = bindings
    ? Object.values(bindings).some((tid) => store.state.liveTabsById[tid] !== undefined)
    : false;
  // Drift is per window: this window's bound tab's LIVE url diverging from home.
  const liveUrl = live?.url;
  const drifted = bound && liveUrl !== undefined && liveUrl !== '' && liveUrl !== saved.originalURL;
  const liveOrSaved = live?.title ? live.title : saved.title;
  const url = bound
    ? liveUrl && liveUrl !== ''
      ? liveUrl
      : saved.originalURL
    : (saved.currentURL ?? saved.originalURL);
  return {
    id,
    url,
    originalURL: saved.originalURL,
    homeHost: hostOf(saved.originalURL),
    boundary: saved.boundary,
    title: saved.customTitle ?? labelFor(liveOrSaved, url),
    // Request a hi-res favicon (64px) for the `_favicon` fallback: the row's tiles
    // render the favicon at 26px (`--favicon-img`), so the 16px TabRow default would
    // upscale and look blurry — especially on a retina panel. Chrome serves the
    // nearest cached size, so this is crisp when available and no worse otherwise.
    faviconSrc: faviconFor(url, live?.favIconUrl, 64),
    // Endpoint fallback for a CORP-blocked primary `favIconUrl` (same 64px hi-res
    // request as the primary, so the retina plate stays crisp). Cache-busted on
    // the live `favIconUrl` so a page that re-badges its favicon (e.g. WhatsApp's
    // CORP-blocked per-count icon, which always lands here) still refreshes — the
    // endpoint URL is otherwise constant and the browser would serve it from cache.
    faviconFallbackSrc: faviconUrl(url, 64, faviconCacheKey(live?.favIconUrl)),
    active: live?.active ?? false,
    loading: live?.status === 'loading',
    drifted,
    unbound: !bound,
    boundAnywhere,
  };
}

// Fresh-Space welcome (sidebar-firstrun-options-polish D1): when the favicon row
// is empty AND the window's active Space has zero pinned bookmarks, this fixed
// region renders the consolidated `Welcome` in place of the standard placeholder
// (the pinned panel suppresses its own empty-state row in turn — see
// PinnedTabs.svelte), so a fresh user sees ONE instructional block. With no active
// Space (or one that already has pins), the standard placeholder renders — never
// the welcome. The active Space is read authoritatively from the store (it changes
// at commit, not mid-swipe, so the fixed welcome never pops during a drag).
const activeSpaceId = $derived(store.state.activeSpaceByWindow[windowId] ?? null);
const showWelcome = $derived(
  activeSpaceId !== null &&
    store.state.faviconRow.length === 0 &&
    (store.state.pinnedBySpace[activeSpaceId]?.length ?? 0) === 0,
);

// Pure projection of authoritative SW state: render `faviconRow` in array order.
// Defensive de-dup so a duplicate id (corrupted / same-tick re-broadcast) can't
// collide the keyed {#each} and crash the strip (matches PinnedTabs/TempTabs).
const favorites = $derived.by<FavView[]>(() => {
  const seen = new Set<string>();
  const out: FavView[] = [];
  for (const id of store.state.faviconRow) {
    if (seen.has(id)) continue;
    seen.add(id);
    const view = projectFavorite(id);
    if (view) out.push(view);
  }
  return out;
});

// --- favoriting-pulse: pulse only a tile that JUST entered the row -------------
// Diff the favorite ids across broadcasts; a freshly-appeared id gets the one-shot
// `favoriting-pulse` for its animation window, then clears (so a re-render or a
// later Space switch never replays it). Empty on first mount, so the initial set
// of favorites does NOT all pulse.
let knownIds: Set<string> = new Set();
let firstSeen = false;
// A reactive Set (a plain `$state(new Set())` does NOT make `.add`/`.has`
// reactive in Svelte 5, so the pulse class would never update).
const pulsing = new SvelteSet<string>();
$effect(() => {
  const ids = new Set(favorites.map((f) => f.id));
  if (!firstSeen) {
    firstSeen = true;
    knownIds = ids;
    return;
  }
  for (const id of ids) {
    if (!knownIds.has(id)) {
      pulsing.add(id);
      const pulseId = id;
      setTimeout(() => {
        pulsing.delete(pulseId);
      }, 320);
    }
  }
  knownIds = ids;
});

// --- click → open / focus the favorite's bound tab ---------------------------
function onTileClick(fav: FavView): void {
  if (drag.consumeJustDragged()) return; // a drag just ended — not a click
  if (fav.unbound) {
    dispatch({ kind: 'openSavedTab', payload: { savedTabId: fav.id, windowId } });
  } else {
    dispatch({ kind: 'focusSavedTab', payload: { savedTabId: fav.id, windowId } });
  }
}

// Remove a favorite from the row (by dragging it OUT — released outside every drop
// zone). Non-destructive: `unpinTab` handles a global favorite (`spaceId === null`)
// by dropping it from `faviconRow` and returning any bound live tab to its window's
// Temporary list — the tab stays OPEN (a dormant favorite simply leaves the row).
function removeFavorite(savedTabId: SavedTabId): void {
  dispatch({ kind: 'unpinTab', payload: { savedTabId, windowId } });
}

// Copy a favorite's URL to the clipboard (context-menu action). Best-effort: a
// clipboard rejection (permissions / no focus) is logged, never thrown.
function copyLink(url: string): void {
  navigator.clipboard?.writeText(url).catch((err: unknown) => {
    log.debug('FaviconRow: clipboard write failed', { err });
  });
}

// --- keyboard/touch reorder via the menu (Move left/right) --------------------
// Move reorders a favorite ONE slot within the row, dispatching the existing
// `reorderFavorites` with the full post-move id order (no new bus kinds; no
// optimistic mutation). Disabled at the row ends.

/** Whether `fav` can move left/right within the favicon row. */
function favBounds(fav: FavView): { left: boolean; right: boolean } {
  const i = favorites.findIndex((f) => f.id === fav.id);
  return { left: i > 0, right: i !== -1 && i < favorites.length - 1 };
}

/** Move `fav` one slot (`dir` = -1 left / +1 right) and dispatch the full order. */
function moveFavorite(fav: FavView, dir: -1 | 1): void {
  const ids = favorites.map((f) => f.id);
  const from = ids.indexOf(fav.id);
  if (from === -1) return;
  const to = from + dir;
  if (to < 0 || to >= ids.length) return;
  [ids[from], ids[to]] = [ids[to] as SavedTabId, ids[from] as SavedTabId];
  dispatch({ kind: 'reorderFavorites', payload: { ids } });
}

// Right-click context-menu actions for a favorite tile — the discoverable removal
// path (the user found drag-out alone undiscoverable), plus open + copy. Remove is
// `danger` and dispatches `unpinTab` (non-destructive — a bound tab returns to
// Temporary and stays open).
function contextItemsFor(fav: FavView): MenuItem[] {
  // Parity with the pinned-row menu (PinnedTabs): Go home / Make this home (when
  // drifted), Lock to its site… (the boundary editor), plus open / copy / remove /
  // delete.
  const items: MenuItem[] = [
    {
      id: 'open',
      label: fav.unbound ? 'Open' : 'Go to tab',
      icon: 'external-link',
      onSelect: () => onTileClick(fav),
    },
  ];
  if (fav.drifted) {
    items.push(
      {
        id: 'go-home',
        label: 'Go home',
        icon: 'house',
        onSelect: () => dispatch({ kind: 'goHome', payload: { savedTabId: fav.id, windowId } }),
      },
      {
        id: 'make-home',
        label: 'Make this home',
        icon: 'map-pin-house',
        onSelect: () => dispatch({ kind: 'makeThisHome', payload: { savedTabId: fav.id } }),
      },
    );
  }
  items.push(
    {
      id: 'copy',
      label: 'Copy link',
      icon: 'link',
      onSelect: () => copyLink(fav.url),
    },
    {
      // Drills the menu into the same boundary editor pinned tabs use (a back-arrow
      // header + the allow-list editor) — set the site(s) the locked favorite stays
      // within. `keepOpen` so the menu morphs in place rather than closing.
      id: 'lock',
      label: 'Lock to its site…',
      icon: 'anchor',
      submenu: true,
      keepOpen: true,
      onSelect: () => {
        confirmingDeleteId = null; // selecting another entry disarms a pending Delete
        panelOpen = true;
      },
    },
  );
  // Move left/right — reorder within the row, disabled at the ends so favorites
  // reordering is reachable from the keyboard (context-menu key) and touch long-press.
  const bounds = favBounds(fav);
  items.push(
    {
      id: 'move-left',
      label: 'Move left',
      disabled: !bounds.left,
      onSelect: () => moveFavorite(fav, -1),
    },
    {
      id: 'move-right',
      label: 'Move right',
      disabled: !bounds.right,
      onSelect: () => moveFavorite(fav, 1),
    },
    {
      // Gentle: leaves favorites; a bound tab returns to Temporary and STAYS OPEN.
      id: 'remove',
      label: 'Remove from favorites',
      icon: 'x',
      onSelect: () => removeFavorite(fav.id),
    },
  );
  // Destructive Delete (`deleteSavedTab` removes the record and closes its bound tab).
  // Two-step confirm when the favorite is bound to a live tab in ANY window (the
  // confirmation the deletion spec requires); a favorite dormant in every window
  // deletes without prompting. The arm mirrors the pinned-row pattern.
  if (fav.boundAnywhere && confirmingDeleteId !== fav.id) {
    items.push({
      id: 'delete',
      label: 'Delete',
      icon: 'trash-2',
      danger: true,
      keepOpen: true,
      onSelect: () => {
        confirmingDeleteId = fav.id;
      },
    });
  } else {
    items.push({
      id: 'delete',
      label: fav.boundAnywhere ? 'Delete — confirm' : 'Delete',
      icon: 'trash-2',
      danger: true,
      onSelect: () => {
        confirmingDeleteId = null;
        dispatch({ kind: 'deleteSavedTab', payload: { savedTabId: fav.id } });
      },
    });
  }
  return items;
}

// --- couple / decouple / reorder by drag (sidebar-favicon-row D7) -------------
// ONE global `favicon` zone with `axis: 'grid'` (the favicons lay out in a wrapping
// grid, so the drop index is computed in row-major reading order), registered on the
// always-present row root so a tab can favorite onto it even when the grid is empty.
// The drag controller routes a drop to the SOURCE row's handler, so THIS handler runs
// for favicon-sourced drags only: reorder within the grid, couple a favorite into a
// Space's pinned list, or move it back to Temporary. Drops that ORIGINATE elsewhere
// and land on this zone are handled where that drag originates: a pinned-sourced
// DECOUPLE in `PinnedTabs.handleDrop` (→ `favoriteSavedTab`), and a temp-sourced
// FAVORITE in `TempTabs.handleDrop` (→ `favoriteTab`). No optimistic mutation — the
// authoritative `state-broadcast` defines the result.
const FAVICON_ZONE = 'favicon';
let containerEl = $state<HTMLElement>();

$effect(() => {
  if (!containerEl) return;
  return drag.registerZone(FAVICON_ZONE, {
    el: containerEl,
    itemEls: () => tileWrapEls.filter(Boolean),
    axis: 'grid',
  });
});

const isDragSource = (fav: FavView): boolean =>
  drag.state.active && drag.state.data?.zone === FAVICON_ZONE && drag.state.data?.id === fav.id;

// A pinned OR temp tab being dragged is a "drop here to favorite" candidate — both
// can land on the strip to become a global favorite (pinned = decouple, temp =
// favorite), so surface the empty-strip drop target for either so the gesture has
// somewhere to land before the first favorite exists.
const incomingTabDrag = $derived(
  drag.state.active &&
    ((drag.state.data?.zone?.startsWith('pinned:') ?? false) ||
      (drag.state.data?.zone?.startsWith('temp:') ?? false)),
);
const faviconZoneTargeted = $derived(drag.state.active && drag.state.targetZone === FAVICON_ZONE);
// A pinned or temp tab held over the (empty-state) strip — the meaningful
// favorite-drop target (decouple a pinned tab, or favorite a temp tab).
const favoriteDropTargeted = $derived(faviconZoneTargeted && incomingTabDrag);

/** The vertical insertion caret's box (relative to the row root) for a grid: a bar in
 * the gap before the target tile, on that tile's row (so it lands correctly across
 * wraps), or just after the last tile when inserting at the end. */
function lineRect(index: number): { left: number; top: number; height: number } {
  const els = tileWrapEls.filter(Boolean);
  const root = containerEl;
  if (els.length === 0 || !root) return { left: 0, top: 0, height: 0 };
  const GAP_HALF = 4; // half of --space-2 (8px) so the caret sits in the tile gap
  const base = root.getBoundingClientRect();
  if (index >= els.length) {
    const r = (els[els.length - 1] as HTMLElement).getBoundingClientRect();
    return { left: r.right - base.left + GAP_HALF, top: r.top - base.top, height: r.height };
  }
  const r = (els[index] as HTMLElement).getBoundingClientRect();
  return { left: r.left - base.left - GAP_HALF, top: r.top - base.top, height: r.height };
}

function onTilePointerDown(e: PointerEvent, fav: FavView): void {
  const el = e.currentTarget as HTMLElement;
  drag.press(
    { id: fav.id, zone: FAVICON_ZONE, title: fav.title, faviconSrc: fav.faviconSrc },
    e,
    el,
    handleDrop,
  );
}

function handleDrop(r: DropResult): void {
  if (r.data.zone !== FAVICON_ZONE) return; // only favicon-sourced drags route here

  // The only two gestures that KEEP the favorite are a drop landing squarely ON the
  // grid (reorder) or ON a Space's pinned list (couple). Both require an actual
  // in-zone release — `outsideAllZones` means the cursor left every zone, so it must
  // NOT reorder/couple even though `targetZone` still echoes the last in-zone spot.

  // Reorder within the grid → the post-drop (row-major) order.
  if (!r.outsideAllZones && r.targetZone === FAVICON_ZONE) {
    const ids = favorites.map((f) => f.id);
    const from = ids.indexOf(r.data.id);
    if (from === -1) return; // tile vanished mid-drag
    ids.splice(from, 1);
    // The dragged id was removed, so a target past the source shifts left by one.
    const insertAt = r.targetIndex > from ? r.targetIndex - 1 : r.targetIndex;
    ids.splice(insertAt, 0, r.data.id);
    dispatch({ kind: 'reorderFavorites', payload: { ids } });
    return;
  }

  // Couple into a Space's pinned list → pin the favorite to that (active) Space.
  // Only the centre carousel slide registers a pinned zone, so the target Space
  // is the active one. Parse the real spaceId (a folder child zone is
  // `pinned:<spaceId>:folder:<folderId>`); favorites couple at the top level.
  if (!r.outsideAllZones && r.targetZone?.startsWith('pinned:')) {
    const rest = r.targetZone.slice('pinned:'.length);
    const sep = rest.indexOf(':folder:');
    const spaceId = sep === -1 ? rest : rest.slice(0, sep);
    dispatch({
      kind: 'pinSavedTab',
      payload: {
        savedTabId: r.data.id,
        spaceId,
        ...(sep === -1 ? { index: r.targetIndex } : {}),
      },
    });
    return;
  }

  // Dropped ANYWHERE ELSE — onto the Temporary list, the content area, a Space chip,
  // or released over no zone at all — REMOVES the favorite from the grid (drag it off
  // the favorites to remove it). This is the robust "drag-out" the user wanted: in a
  // densely-tiled sidebar there is rarely true empty space, so any off-grid release
  // (other than a pinned-list couple) means "take this out". Non-destructive:
  // `unpinTab` returns any bound live tab to this window's Temporary list (stays open).
  removeFavorite(r.data.id);
}

// (The favicon area is a wrapping GRID — it grows vertically and never scrolls
// horizontally, so the old strip's overflow/edge-fade/wheel-pan machinery is gone.)

// --- keyboard: roving tabindex + scrollIntoView ------------------------------
let rovingIndex = $state(0);
let tileWrapEls = $state<HTMLElement[]>([]);

// The tile that holds `tabindex=0` (the strip's single tab stop). Clamped to the
// live favorite count so that when the row shrinks below `rovingIndex` (a favorite
// was removed) the LAST tile still takes the tab stop — the strip never loses its
// keyboard entry point.
const rovingTile = $derived(Math.min(rovingIndex, Math.max(0, favorites.length - 1)));

function tileButton(i: number): HTMLButtonElement | null {
  return (tileWrapEls[i]?.querySelector('[data-testid="favicon-tile"]') ??
    null) as HTMLButtonElement | null;
}

function focusTile(i: number): void {
  const n = favorites.length;
  if (n === 0) return;
  const clamped = Math.max(0, Math.min(i, n - 1));
  rovingIndex = clamped;
  const btn = tileButton(clamped);
  btn?.focus();
  btn?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
}

function onStripKeydown(e: KeyboardEvent): void {
  if (favorites.length === 0) return;
  switch (e.key) {
    case 'ArrowRight':
      e.preventDefault();
      focusTile(rovingIndex + 1);
      break;
    case 'ArrowLeft':
      e.preventDefault();
      focusTile(rovingIndex - 1);
      break;
    case 'Home':
      e.preventDefault();
      focusTile(0);
      break;
    case 'End':
      e.preventDefault();
      focusTile(favorites.length - 1);
      break;
  }
}

// Tab/click into a tile keeps the roving index in sync with the real focus.
function onStripFocusIn(e: FocusEvent): void {
  const target = e.target as HTMLElement | null;
  const wrap = target?.closest('[data-favicon-index]') as HTMLElement | null;
  if (!wrap) return;
  const idx = Number(wrap.dataset.faviconIndex);
  if (Number.isFinite(idx)) rovingIndex = idx;
}

// --- favorite right-click menu (with the "Lock to its site…" drill-in) ---------
// The menu lives HERE (not in the FaviconTile primitive) because its actions + the
// drill-in boundary panel are feature concerns. ONE `ContextMenu` is opened at the
// cursor for whichever tile was right-clicked; `panelOpen` drills it into the SAME
// `TabBoundaryEditor` the pinned rows use, with a back-arrow header. The active
// favorite is re-derived by id so the panel reflects state after each round-trip.
let menuOpen = $state(false);
let menuX = $state(0);
let menuY = $state(0);
let menuFavId = $state<SavedTabId | null>(null);
// The tile element a keyboard-invoked menu anchors to (see onTileContextMenu / D6).
let menuAnchorEl = $state<HTMLElement | undefined>(undefined);
let panelOpen = $state(false);
// Two-step Delete arm: holds the favorite whose Delete is armed into its
// "Delete — confirm" affordance. Reset on menu close, Escape, opening another
// tile's menu, or selecting any other entry (see contextItemsFor / onclose).
let confirmingDeleteId = $state<SavedTabId | null>(null);
const activeMenuFav = $derived(
  menuFavId !== null ? (favorites.find((f) => f.id === menuFavId) ?? null) : null,
);

function onTileContextMenu(e: MouseEvent, fav: FavView): void {
  menuX = e.clientX;
  menuY = e.clientY;
  // The invoking tile — ContextMenu anchors to it for a keyboard-invoked menu (D6).
  menuAnchorEl = e.currentTarget as HTMLElement;
  menuFavId = fav.id;
  panelOpen = false;
  confirmingDeleteId = null; // a fresh open starts unarmed
  menuOpen = true;
}
</script>

<!-- The strip root is ALWAYS present (a Space-independent shell region, so it
     renders with or without an active Space); the glass shelf renders always —
     populated with tiles, or an empty-state placeholder inviting the first
     favorite. It is a SIBLING of the carousel, painting above the aurora by DOM
     order, with NO transform / will-change so it can never ride the carousel
     track — it stays fixed through a swipe (sidebar-favicon-row D3). -->
<div class="favicon-row" data-testid="favicon-row" bind:this={containerEl}>
  {#if favorites.length > 0}
    <!-- A transparent, no-chrome wrapping GRID of plated tiles on the sidebar's top
         Space-colour wash. While a pinned/temp tab is dragged toward it, the WHOLE
         grid lights up as a drop target (drop anywhere on it to favorite). -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="strip"
      class:drop-target={favoriteDropTargeted}
      data-testid="favicon-strip"
      onkeydown={onStripKeydown}
      onfocusin={onStripFocusIn}
    >
      {#if faviconZoneTargeted}
        {@const caret = lineRect(drag.state.targetIndex)}
        <!-- Reorder/insertion caret: a Space-hue bar in the gap before the drop index,
             on that tile's row (so it lands right across grid wraps). -->
        <div
          class="drop-line-x"
          style:left={`${caret.left}px`}
          style:top={`${caret.top}px`}
          style:height={`${caret.height}px`}
        ></div>
      {/if}
      {#each favorites as fav, i (fav.id)}
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
          class="tile-wrap"
          class:dragging={isDragSource(fav)}
          data-favicon-index={i}
          bind:this={tileWrapEls[i]}
          onpointerdown={(e) => onTilePointerDown(e, fav)}
        >
          <FaviconTile
            title={fav.title}
            faviconSrc={fav.faviconSrc}
            faviconFallbackSrc={fav.faviconFallbackSrc}
            active={fav.active}
            loading={fav.loading}
            drifted={fav.drifted}
            homeHost={fav.homeHost}
            onGoHome={() => dispatch({ kind: 'goHome', payload: { savedTabId: fav.id, windowId } })}
            unbound={fav.unbound}
            favoriting={pulsing.has(fav.id)}
            tabindex={i === rovingTile ? 0 : -1}
            onclick={() => onTileClick(fav)}
            oncontextmenu={(e) => onTileContextMenu(e, fav)}
          />
        </div>
      {/each}
    </div>
  {:else if showWelcome}
    <!-- Fresh start: the favorites row is empty AND the active Space has zero pinned
         bookmarks, so this fixed slot renders the consolidated Welcome instead of the
         bare placeholder (and the pinned panel suppresses its own empty row). It keeps
         the placeholder's drop contract — `over` brightens it as the favorites target. -->
    <Welcome over={favoriteDropTargeted} />
  {:else}
    <!-- Empty-state placeholder — the SAME plated drop-zone card the pinned list uses
         (shared `EmptyState`), so favorites and pinned read as one language. It doubles
         as the decouple/favorite drop target: when a pinned/temp tab is dragged over the
         row the card lights up to read as "drop here" (`over`), and its hint swaps to the
         active copy. -->
    <EmptyState
      icon="star"
      testid="favicon-empty"
      title="No favorites yet."
      subtitle={favoriteDropTargeted ? 'Drop to favorite' : 'Drag a tab up here to favorite it.'}
      over={favoriteDropTargeted}
    />
  {/if}
</div>

{#snippet boundaryPanel()}
  {#if activeMenuFav}
    <div class="boundary-body" data-testid="favicon-boundary-editor">
      <TabBoundaryEditor
        savedTabId={activeMenuFav.id}
        boundary={activeMenuFav.boundary}
        originalURL={activeMenuFav.originalURL}
        globalDefault="domain"
      />
    </div>
  {/if}
{/snippet}

<!-- The favorite right-click menu (one instance, opened at the cursor for the tile
     that was right-clicked). "Lock to its site…" drills it into the boundary editor
     with a back-arrow header — parity with the pinned-row menu. -->
{#if activeMenuFav}
  <ContextMenu
    bind:open={menuOpen}
    x={menuX}
    y={menuY}
    anchorEl={menuAnchorEl}
    items={contextItemsFor(activeMenuFav)}
    label="Favorite actions"
    testid="favicon-menu"
    panel={panelOpen ? boundaryPanel : undefined}
    panelTitle={panelOpen ? 'Lock to its site' : undefined}
    onPanelBack={() => {
      panelOpen = false;
    }}
    onclose={() => {
      panelOpen = false;
      confirmingDeleteId = null; // closing / Escape disarms a pending Delete
    }}
  />
{/if}

<style>
  /* Fully bare: no glass card, no shadow, no divider line. The favicons read
   * directly on the sidebar's Space-tinted top wash. Positioned (not transformed)
   * so it paints above the aurora by DOM order; plumb-aligned via `--list-pad`.
   *
   * Sits just under the top search bar: a `--space-3` (12px) gap above the grid and a
   * `--space-3` bottom inset that sets a defined rhythm down to the Space section
   * header — the grid reads as a deliberate top band, not a stray row. */
  .favicon-row {
    position: relative;
    padding: var(--space-3) var(--list-pad);
  }

  /* A responsive auto-fill GRID of plated tiles: as many fixed-`--favicon-tile`-wide
   * columns as the sidebar width allows, wrapping to new rows. It grows vertically
   * (the `flex: 1` carousel below shrinks) — no horizontal scroll. `--space-3` padding
   * gives the band breathing room; `--r-lg` lets the whole-grid drop wash read as a
   * soft region. */
  .strip {
    display: grid;
    grid-template-columns: repeat(auto-fill, var(--favicon-tile));
    justify-content: start;
    gap: var(--space-2);
    padding: var(--space-3);
    border-radius: var(--r-lg);
    transition: background var(--motion-base) var(--ease-standard);
  }
  /* Whole-grid drop target — while a pinned/temp tab is dragged toward the grid the
   * ENTIRE row washes in the Space colour, so dropping anywhere on it favorites. */
  .strip.drop-target {
    background: var(--space-c-soft);
  }

  .tile-wrap {
    position: relative;
    /* No resting `touch-action: none` — touch users must be able to pan the lists
     * (row-drag-does-not-block-touch-panning). The drag controller suppresses
     * panning only for the duration of an active pointer drag. */
  }
  /* Drag source stays in place but dims while its clone is carried. */
  .tile-wrap.dragging {
    opacity: 0.4;
  }

  /* Insertion caret — a glowing Space-hue bar + leading dot in the gap before the
   * drop index, positioned (left/top/height set inline from `lineRect`) on the target
   * tile's grid row so it lands correctly across wraps. Zero-width so it never reflows. */
  .drop-line-x {
    position: absolute;
    width: 0;
    z-index: 2;
    pointer-events: none;
  }
  .drop-line-x::before {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    left: -1px;
    width: 2px;
    border-radius: var(--r-pill);
    background: linear-gradient(
      180deg,
      var(--space-c),
      color-mix(in oklch, var(--space-c) 35%, transparent)
    );
    box-shadow: 0 0 7px var(--space-c-dim);
  }
  .drop-line-x::after {
    content: '';
    position: absolute;
    top: -3px;
    left: -3px;
    width: 6px;
    height: 6px;
    border-radius: var(--r-pill);
    background: var(--space-c);
    box-shadow: 0 0 6px var(--space-c);
  }

  /* (The empty-state placeholder is the shared `EmptyState` plated drop-zone card —
   * same component the pinned list uses — so no bespoke empty styling lives here.) */

  /* "Lock to its site…" boundary editor — rendered as the favorite menu's drill-in
   * panel (ContextMenu owns the padding); a min-width so the allow-list editor has room. */
  .boundary-body {
    min-width: 216px;
  }

</style>
