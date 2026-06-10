<script lang="ts">
import '../ui/drop-line.css';
import { SvelteSet } from 'svelte/reactivity';
import { dispatch } from '../shared/bus';
import { labelFor } from '../shared/label-for';
import { log } from '../shared/logger';
import type { SavedTabId, TabBoundary, WindowId } from '../shared/types';
import ContextMenu from '../ui/ContextMenu.svelte';
import FaviconTile from '../ui/FaviconTile.svelte';
import { faviconCacheKey, faviconFor, faviconUrl } from '../ui/favicon';
import type { MenuItem } from '../ui/menu-types';
import { type DropResult, drag } from './drag.svelte';
import { useStore } from './store-context.svelte';
import TabBoundaryEditor from './TabBoundaryEditor.svelte';

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
  /** The favorite's explicit site-boundary (undefined ⇒ favorites default to locked). */
  boundary: TabBoundary | undefined;
  active: boolean;
  loading: boolean;
  drifted: boolean;
  /** Dormant: no live tab bound in THIS window. */
  unbound: boolean;
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
  const boundTabId = store.state.tabBindings[id]?.[windowId];
  const bound = boundTabId !== undefined;
  const live = bound ? store.state.liveTabsById[boundTabId] : undefined;
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
  };
}

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
        panelOpen = true;
      },
    },
    {
      // Gentle: leaves favorites; a bound tab returns to Temporary and STAYS OPEN.
      id: 'remove',
      label: 'Remove from favorites',
      icon: 'x',
      onSelect: () => removeFavorite(fav.id),
    },
    {
      // Destructive: deletes the favorite record entirely (and closes its bound tab) —
      // the same `deleteSavedTab` the pinned-row Delete uses.
      id: 'delete',
      label: 'Delete',
      icon: 'trash-2',
      danger: true,
      onSelect: () => dispatch({ kind: 'deleteSavedTab', payload: { savedTabId: fav.id } }),
    },
  );
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
  if (!r.outsideAllZones && r.targetZone.startsWith('pinned:')) {
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
let panelOpen = $state(false);
const activeMenuFav = $derived(
  menuFavId !== null ? (favorites.find((f) => f.id === menuFavId) ?? null) : null,
);

function onTileContextMenu(e: MouseEvent, fav: FavView): void {
  menuX = e.clientX;
  menuY = e.clientY;
  menuFavId = fav.id;
  panelOpen = false;
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
            unbound={fav.unbound}
            favoriting={pulsing.has(fav.id)}
            tabindex={i === rovingTile ? 0 : -1}
            onclick={() => onTileClick(fav)}
            oncontextmenu={(e) => onTileContextMenu(e, fav)}
          />
        </div>
      {/each}
    </div>
  {:else}
    <!-- Empty-state placeholder: a quiet preview of the favorite shape (Space-tinted
         ghost tiles) + a hint, on the same transparent strip. It doubles as the
         decouple drop target — when a pinned tab is dragged over it the ghosts +
         hint light up to read as "drop here". -->
    <div class="empty-state" class:over={favoriteDropTargeted} data-testid="favicon-empty">
      <span class="empty-ghosts" aria-hidden="true">
        <span class="ghost"></span>
        <span class="ghost"></span>
        <span class="ghost"></span>
      </span>
      <span class="empty-hint">{favoriteDropTargeted ? 'Drop to favorite' : 'Drag tabs up to favorite'}</span>
    </div>
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
    /* Tiles are pointer-draggable to reorder / couple / move back; suppress touch
     * scrolling so a press becomes a drag, not a pan. */
    touch-action: none;
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

  /* Empty-state placeholder: fills the glass shelf with a preview of the favorite
   * shape (ghost tiles) + an editorial hint, left-aligned on the same `--space-3`
   * inset the populated strip uses so the row reads identically full-or-empty. */
  .empty-state {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: var(--space-3);
    /* Same `--space-3` box as the populated `.strip` so the row height is identical
     * empty-or-populated — adding the first favorite never makes the band jump. */
    padding: var(--space-3);
    transition: opacity var(--motion-base) var(--ease-standard);
  }
  .empty-ghosts {
    flex: 0 0 auto;
    display: inline-flex;
    gap: var(--space-2);
  }
  /* Each ghost is a `--favicon-tile`-sized dashed outline in the Space hue
   * (`--space-c-dim` carries the floored chroma at every tint), previewing where
   * favorite plates land. A gentle opacity step makes the row trail off into "room for
   * more". Matches the plated tiles' `--r-lg` corners. */
  .ghost {
    width: var(--favicon-tile);
    height: var(--favicon-tile);
    border: 1px dashed var(--space-c-dim);
    border-radius: var(--r-lg);
    opacity: 0.7;
    transition:
      border-color var(--motion-slow) var(--ease-emphasised),
      background var(--motion-fast) var(--ease-standard),
      opacity var(--motion-fast) var(--ease-standard);
  }
  .ghost:nth-child(2) {
    opacity: 0.5;
  }
  .ghost:nth-child(3) {
    opacity: 0.32;
  }
  .empty-hint {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--text-dim);
    font: var(--weight-medium) var(--text-xs) / 1 var(--font-sans);
    transition: color var(--motion-fast) var(--ease-standard);
  }
  /* Decouple hover: a pinned tab is held over the empty shelf — the ghosts fill
   * with the soft Space wash + brighten, and the hint lifts to full text, so the
   * placeholder reads as an active "drop here" target. (The shelf's own under-glow
   * swell rides `.favicon-row.drop-active`, above.) */
  .empty-state.over .ghost {
    background: var(--space-c-soft);
    border-color: var(--space-c);
    opacity: 1;
  }
  .empty-state.over .empty-hint {
    color: var(--text);
  }

  /* "Lock to its site…" boundary editor — rendered as the favorite menu's drill-in
   * panel (ContextMenu owns the padding); a min-width so the allow-list editor has room. */
  .boundary-body {
    min-width: 216px;
  }

</style>
