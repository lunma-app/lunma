// Custom pointer-based drag-and-drop for the sidebar lists (supersedes ADR 0003's
// svelte-dnd-action choice). Interaction model: the source row STAYS in place
// (dimmed), a floating clone follows the cursor with the grab offset, and a thin
// insertion line marks where the item will land. Nothing reorders until drop.
//
// One drag at a time, so a single module-level reactive controller coordinates
// every zone (enables cross-zone pin/unpin). Zones register their container +
// a getter for their rendered row elements; the controller hit-tests the cursor
// against zones and computes the insertion index from row mid-points.
//
// pinned-tab-folders (Phase 6) adds a second target MODE alongside
// between-insertion: "drop-onto". When the cursor sits in a row's middle band
// and that row opts into drop-onto (`DropOntoRow.onto`), the target resolves to
// "onto this row" (`targetOntoId`) rather than an insertion index — the sidebar
// turns that into "move into this folder" / "create a folder from these two".
// Collapsed folders additionally spring-load: dwelling on one past a short timer
// fires the zone's `onSpringLoad` so it auto-expands mid-drag.
//
// Zones are vertical lists by default; a zone may opt into a horizontal layout
// (`axis: 'x'`, e.g. the bottom Space switcher) so the index + drop-onto
// hit-testing run along x instead of y.

import type { IconName } from '../shared/icon-names';

export interface DragData {
  /** Stable id of the dragged item: a `SavedTabId` (pinned) or `TabId` (temp), stringified. */
  id: string;
  /** Originating zone id (e.g. 'pinned:<spaceId>' / 'temp:<windowId>'). */
  zone: string;
  /** Clone presentation. */
  title: string;
  faviconSrc: string;
  /** Optional chip-style clone (Space-switcher reorder): when set, the floating
   * clone renders a Space chip tile instead of a `TabRow`. Carries the Space's
   * full canonical OKLCH (`hue`/`chroma`/`l`) plus its on-colour ink (`on`) so
   * the clone renders the SAME true colour + readable glyph as the live chip. */
  chip?: { icon: IconName; hue: number; chroma: number; l: number; on: string };
}

/** Per-row drop-onto descriptor, aligned 1:1 (order + length) with a zone's
 * `itemEls()`. Absent → the zone is between-insertion only (the prior behaviour,
 * used by Temporary and folder child lists). */
export interface DropOntoRow {
  /** The row's node id (folder id or saved-tab id). */
  id: string;
  /** Whether this row accepts a drop ONTO it (folder = move-in, tab = create-folder). */
  onto: boolean;
  /** Whether dwelling on this row mid-drag should spring-load it (collapsed folder). */
  springLoad: boolean;
}

export interface DropResult {
  data: DragData;
  targetZone: string;
  targetIndex: number;
  /** Non-null = a drop ONTO this row (folder/tab id); `targetIndex` is then
   * irrelevant. Null = a between-rows insertion at `targetIndex`. */
  targetOntoId: string | null;
  /** True when the pointer was released over NO registered zone (`targetZone` then
   * reflects the last in-zone position the drag passed through — the bounce-back
   * fallback). Lets a source treat "dragged clean out of every zone" specially —
   * e.g. the favicon row removes a favorite dragged outside it. */
  outsideAllZones: boolean;
}

interface ZoneReg {
  el: HTMLElement;
  /** Rendered item elements in visual order (top→bottom for a `y` zone,
   * left→right for an `x` zone); used for index + line position. */
  itemEls: () => HTMLElement[];
  /** Optional per-row drop-onto descriptors, aligned with `itemEls()`. */
  rows?: () => DropOntoRow[];
  /** Called when the cursor dwells on a spring-load row past the dwell timer. */
  onSpringLoad?: (rowId: string) => void;
  /** Layout axis. `'y'` (default) = vertical list; `'x'` = horizontal row (the
   * Space switcher), so index + onto hit-testing run along x. `'grid'` = a wrapping
   * grid (the favicon row) — the insertion index is computed in row-major reading
   * order across rows + columns (drop-onto is not used by grid zones). */
  axis?: 'x' | 'y' | 'grid';
}

interface DragState {
  active: boolean;
  data: DragData | null;
  /** Live cursor position (viewport coords). */
  x: number;
  y: number;
  /** Offset from the grabbed row's top-left to the cursor, so the clone keeps the grip. */
  grabDX: number;
  grabDY: number;
  /** Clone size (matches the source row). */
  w: number;
  h: number;
  /** Zone currently under the cursor, and the insertion index within it. */
  targetZone: string | null;
  targetIndex: number;
  /** When set, the cursor is over this row's drop-onto band (id of a folder/tab);
   * `targetIndex` is then irrelevant. */
  targetOntoId: string | null;
}

function initialState(): DragState {
  return {
    active: false,
    data: null,
    x: 0,
    y: 0,
    grabDX: 0,
    grabDY: 0,
    w: 0,
    h: 0,
    targetZone: null,
    targetIndex: 0,
    targetOntoId: null,
  };
}

const DRAG_THRESHOLD_PX = 5;
/** Fraction of a row's height trimmed top+bottom to form its drop-onto band, so
 * the outer gutters still read as between-row insertion. */
const ONTO_BAND = 0.25;
/** Dwell (ms) on a collapsed folder before it spring-loads open. */
export const SPRING_LOAD_MS = 600;

class DragController {
  state = $state<DragState>(initialState());

  #zones = new Map<string, ZoneReg>();
  #onDrop: ((r: DropResult) => void) | null = null;
  /** Last in-zone target, committed on a drop that lands outside every zone. */
  #lastValid: { zone: string; index: number; ontoId: string | null } | null = null;
  /** Set true at drop so a row's click handler can suppress the post-drag click. */
  #justDragged = false;
  /** Spring-load dwell tracking: the row currently being dwelled on + its timer. */
  #springRow: { zone: string; rowId: string } | null = null;
  #springTimer: ReturnType<typeof setTimeout> | null = null;

  registerZone(id: string, reg: ZoneReg): () => void {
    this.#zones.set(id, reg);
    return () => {
      this.#zones.delete(id);
    };
  }

  /** One-shot: true exactly once after a real drag, so click-to-focus can skip itself. */
  consumeJustDragged(): boolean {
    const v = this.#justDragged;
    this.#justDragged = false;
    return v;
  }

  /**
   * Test-only: hard-reset all transient controller state between tests. The
   * singleton outlives a `cleanup()` unmount, so a flag/timer/zone left set by
   * one test can otherwise bleed into the next (e.g. a stale `justDragged`
   * making the next click a no-op).
   */
  __resetForTest(): void {
    this.#onDrop = null;
    this.#lastValid = null;
    this.#justDragged = false;
    this.#clearSpring();
    this.#zones.clear();
    this.state = initialState();
  }

  /**
   * Call on a row's `pointerdown`. Waits for movement past a small threshold
   * before starting a drag, so plain clicks are never treated as drags.
   */
  press(
    data: DragData,
    down: PointerEvent,
    rowEl: HTMLElement,
    onDrop: (r: DropResult) => void,
  ): void {
    if (down.button !== 0) return; // primary button only
    const startX = down.clientX;
    const startY = down.clientY;

    const onMove = (ev: PointerEvent): void => {
      if (
        Math.abs(ev.clientX - startX) >= DRAG_THRESHOLD_PX ||
        Math.abs(ev.clientY - startY) >= DRAG_THRESHOLD_PX
      ) {
        cleanup();
        this.#start(data, ev, rowEl, onDrop);
      }
    };
    const cleanup = (): void => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', cleanup);
      window.removeEventListener('pointercancel', cleanup);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', cleanup, { once: true });
    window.addEventListener('pointercancel', cleanup, { once: true });
  }

  #start(
    data: DragData,
    ev: PointerEvent,
    rowEl: HTMLElement,
    onDrop: (r: DropResult) => void,
  ): void {
    const rect = rowEl.getBoundingClientRect();
    this.#onDrop = onDrop;
    this.#lastValid = null;
    this.state = {
      active: true,
      data,
      x: ev.clientX,
      y: ev.clientY,
      grabDX: ev.clientX - rect.left,
      grabDY: ev.clientY - rect.top,
      w: rect.width,
      h: rect.height,
      targetZone: null,
      targetIndex: 0,
      targetOntoId: null,
    };
    document.body.style.userSelect = 'none';
    window.addEventListener('pointermove', this.#move);
    window.addEventListener('pointerup', this.#end, { once: true });
    window.addEventListener('pointercancel', this.#end, { once: true });
    this.#computeTarget(ev.clientX, ev.clientY);
  }

  #move = (ev: PointerEvent): void => {
    this.state.x = ev.clientX;
    this.state.y = ev.clientY;
    this.#computeTarget(ev.clientX, ev.clientY);
  };

  #computeTarget(x: number, y: number): void {
    // Pick the MOST SPECIFIC (smallest-area) zone under the cursor, so an
    // expanded folder's nested child zone wins over the enclosing pinned zone.
    let best: { id: string; zone: ZoneReg; area: number } | null = null;
    for (const [id, zone] of this.#zones) {
      const r = zone.el.getBoundingClientRect();
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) {
        const area = (r.right - r.left) * (r.bottom - r.top);
        if (!best || area < best.area) best = { id, zone, area };
      }
    }

    if (!best) {
      this.state.targetZone = null;
      this.state.targetOntoId = null;
      this.#clearSpring();
      return;
    }

    const { id, zone } = best;
    const onto = this.#hitOnto(zone, x, y);
    if (onto) {
      this.state.targetZone = id;
      this.state.targetOntoId = onto.id;
      this.state.targetIndex = onto.index;
      this.#lastValid = { zone: id, index: onto.index, ontoId: onto.id };
      this.#armSpring(id, onto.id, onto.springLoad ? zone : null);
      return;
    }

    const index = this.#indexInZone(zone, x, y);
    this.state.targetZone = id;
    this.state.targetOntoId = null;
    this.state.targetIndex = index;
    this.#lastValid = { zone: id, index, ontoId: null };
    this.#clearSpring();
  }

  /**
   * Drop-onto hit-test: if the cursor sits inside a drop-onto-capable row's middle
   * band (along the zone's axis), return that row's id (+ its index + springLoad
   * flag). Skips the drag source itself. Returns null when no row qualifies (→
   * between-insertion).
   */
  #hitOnto(
    zone: ZoneReg,
    x: number,
    y: number,
  ): { id: string; index: number; springLoad: boolean } | null {
    const rows = zone.rows?.();
    if (!rows) return null;
    const horizontal = zone.axis === 'x';
    const els = zone.itemEls();
    for (let i = 0; i < els.length; i += 1) {
      const desc = rows[i];
      const elRow = els[i];
      if (!desc || !elRow || !desc.onto) continue;
      if (desc.id === this.state.data?.id) continue; // never onto the source row
      const r = elRow.getBoundingClientRect();
      const hit = horizontal
        ? x >= r.left + (r.right - r.left) * ONTO_BAND &&
          x <= r.right - (r.right - r.left) * ONTO_BAND
        : y >= r.top + (r.bottom - r.top) * ONTO_BAND &&
          y <= r.bottom - (r.bottom - r.top) * ONTO_BAND;
      if (hit) {
        return { id: desc.id, index: i, springLoad: desc.springLoad };
      }
    }
    return null;
  }

  /** Insertion index = number of items whose mid-point (along the zone's axis) is
   * before the cursor. Vertical (`y`) by default; a horizontal zone (`axis: 'x'`,
   * the Space switcher) counts along x instead; a `grid` zone (the favicon row) counts
   * in row-major reading order across wrapping rows. */
  #indexInZone(zone: ZoneReg, x: number, y: number): number {
    const els = zone.itemEls();
    let index = 0;
    if (zone.axis === 'grid') {
      // Row-major: an item precedes the cursor if it sits in a row entirely above the
      // cursor (`bottom <= y`) OR shares the cursor's row and its centre is left of the
      // cursor. Items are in DOM = reading order, so the first non-preceding item ends
      // the count (everything after it is past the cursor).
      for (const el of els) {
        const r = el.getBoundingClientRect();
        const precedes = r.bottom <= y || (y >= r.top && y <= r.bottom && r.left + r.width / 2 < x);
        if (precedes) index += 1;
        else break;
      }
      return index;
    }
    const horizontal = zone.axis === 'x';
    for (const el of els) {
      const r = el.getBoundingClientRect();
      const mid = horizontal ? r.left + r.width / 2 : r.top + r.height / 2;
      const cursor = horizontal ? x : y;
      if (cursor > mid) index += 1;
      else break;
    }
    return index;
  }

  /** Start (or keep) the spring-load dwell timer for a row. Re-arming on the same
   * row is a no-op so the timer runs continuously; moving to a different row (or
   * a non-spring zone, `springZone === null`) resets it. */
  #armSpring(zoneId: string, rowId: string, springZone: ZoneReg | null): void {
    if (springZone === null) {
      this.#clearSpring();
      return;
    }
    if (this.#springRow && this.#springRow.zone === zoneId && this.#springRow.rowId === rowId) {
      return; // already dwelling on this row — let the timer run
    }
    this.#clearSpring();
    this.#springRow = { zone: zoneId, rowId };
    this.#springTimer = setTimeout(() => {
      this.#springTimer = null;
      // Only fire if we're still dwelling on the same row.
      if (this.#springRow && this.#springRow.zone === zoneId && this.#springRow.rowId === rowId) {
        springZone.onSpringLoad?.(rowId);
      }
    }, SPRING_LOAD_MS);
  }

  #clearSpring(): void {
    if (this.#springTimer !== null) {
      clearTimeout(this.#springTimer);
      this.#springTimer = null;
    }
    this.#springRow = null;
  }

  #end = (): void => {
    window.removeEventListener('pointermove', this.#move);
    window.removeEventListener('pointerup', this.#end);
    window.removeEventListener('pointercancel', this.#end);
    document.body.style.userSelect = '';
    this.#clearSpring();

    const data = this.state.data;
    // Released over NO zone? (`targetZone === null` at release). We still commit the
    // last in-zone target below so a stray release bounces back, but the flag lets a
    // source act on the clean drag-out (e.g. the favicon row removes the favorite).
    const outsideAllZones = this.state.targetZone === null;
    // Commit the current in-zone target, or the last one we had if released
    // outside every zone (so a stray release keeps the last shown position).
    const target =
      this.state.targetZone !== null
        ? {
            zone: this.state.targetZone,
            index: this.state.targetIndex,
            ontoId: this.state.targetOntoId,
          }
        : this.#lastValid;
    const cb = this.#onDrop;

    this.#onDrop = null;
    this.#justDragged = true;
    this.state = initialState();

    if (cb && data && target) {
      cb({
        data,
        targetZone: target.zone,
        targetIndex: target.index,
        targetOntoId: target.ontoId,
        outsideAllZones,
      });
    }
  };
}

/** Singleton — one drag at a time across the sidebar. */
export const drag = new DragController();
