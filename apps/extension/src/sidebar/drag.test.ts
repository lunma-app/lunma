// Unit tests for the custom pointer-drag controller (ADR 0006). These exercise
// the controller mechanics directly — press threshold, zone hit-testing,
// insertion-index from row mid-points, the one-shot justDragged flag, and the
// DropResult handed to the drop callback — independent of any component.
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import {
  type DragData,
  type DropOntoRow,
  type DropResult,
  drag,
  SPRING_LOAD_MS,
} from './drag.svelte';

interface Rect {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

/** A detached element whose layout rect is stubbed (jsdom returns zeros). */
function el(rect: Rect): HTMLElement {
  const node = document.createElement('div');
  const height = rect.bottom - rect.top;
  const width = rect.right - rect.left;
  node.getBoundingClientRect = () =>
    ({
      left: rect.left,
      right: rect.right,
      top: rect.top,
      bottom: rect.bottom,
      width,
      height,
      x: rect.left,
      y: rect.top,
      toJSON: () => ({}),
    }) as DOMRect;
  return node;
}

// jsdom lacks a PointerEvent constructor; a MouseEvent carries the
// clientX/clientY/button fields the controller reads. Cast for the press()
// signature (which wants a PointerEvent) — dispatchEvent accepts it as an Event.
function pointer(type: string, clientX: number, clientY: number): PointerEvent {
  return new MouseEvent(type, {
    clientX,
    clientY,
    button: 0,
    bubbles: true,
  }) as unknown as PointerEvent;
}

const DATA: DragData = { id: 'st-1', zone: 'pinned:work', title: 'Saved', faviconSrc: 'x' };

let cleanups: Array<() => void> = [];

beforeEach(() => {
  cleanups = [];
});
afterEach(() => {
  for (const c of cleanups) c();
  // Ensure the controller is idle between tests even if a drag was left open.
  window.dispatchEvent(pointer('pointerup', 0, 0));
  vi.restoreAllMocks();
});

function registerZone(
  id: string,
  zoneRect: Rect,
  rowRects: Rect[],
  axis?: 'x' | 'y' | 'grid',
): void {
  const zoneEl = el(zoneRect);
  const rowEls = rowRects.map(el);
  cleanups.push(
    drag.registerZone(id, { el: zoneEl, itemEls: () => rowEls, ...(axis ? { axis } : {}) }),
  );
}

/** Register a zone with per-row drop-onto descriptors + a spring-load hook. */
function registerOntoZone(
  id: string,
  zoneRect: Rect,
  rowRects: Rect[],
  rows: DropOntoRow[],
  onSpringLoad?: (rowId: string) => void,
): void {
  const zoneEl = el(zoneRect);
  const rowEls = rowRects.map(el);
  cleanups.push(
    drag.registerZone(id, {
      el: zoneEl,
      itemEls: () => rowEls,
      rows: () => rows,
      ...(onSpringLoad ? { onSpringLoad } : {}),
    }),
  );
}

describe('DragController press threshold', () => {
  test('a press with no movement past the threshold never starts a drag', () => {
    const onDrop = vi.fn();
    const rowEl = el({ left: 0, right: 100, top: 0, bottom: 20 });
    drag.press(DATA, pointer('pointerdown', 0, 0), rowEl, onDrop);

    // Move under the 5px threshold, then release.
    window.dispatchEvent(pointer('pointermove', 2, 2));
    window.dispatchEvent(pointer('pointerup', 2, 2));

    expect(drag.state.active).toBe(false);
    expect(onDrop).not.toHaveBeenCalled();
    expect(drag.consumeJustDragged()).toBe(false);
  });

  test('moving past the 5px threshold starts a drag', () => {
    const rowEl = el({ left: 0, right: 100, top: 0, bottom: 20 });
    registerZone('pinned:work', { left: 0, right: 100, top: 0, bottom: 60 }, [
      { left: 0, right: 100, top: 0, bottom: 20 },
    ]);
    drag.press(DATA, pointer('pointerdown', 0, 0), rowEl, vi.fn());

    window.dispatchEvent(pointer('pointermove', 0, 10));
    expect(drag.state.active).toBe(true);
    expect(drag.state.data?.id).toBe('st-1');
  });
});

describe('DragController insertion index from row mid-points', () => {
  // Rows at y 0–20, 20–40, 40–60 → mid-points 10, 30, 50.
  const rows: Rect[] = [
    { left: 0, right: 100, top: 0, bottom: 20 },
    { left: 0, right: 100, top: 20, bottom: 40 },
    { left: 0, right: 100, top: 40, bottom: 60 },
  ];

  test.each([
    [5, 0],
    [15, 1],
    [35, 2],
    [55, 3],
  ])('cursor y=%i yields insertion index %i', (y, expected) => {
    let dropped: DropResult | undefined;
    const rowEl = el(rows[0] as Rect);
    registerZone('pinned:work', { left: 0, right: 100, top: 0, bottom: 60 }, rows);
    drag.press(DATA, pointer('pointerdown', 50, 0), rowEl, (r) => {
      dropped = r;
    });
    window.dispatchEvent(pointer('pointermove', 50, 10)); // start
    window.dispatchEvent(pointer('pointermove', 50, y)); // hover
    expect(drag.state.targetIndex).toBe(expected);
    window.dispatchEvent(pointer('pointerup', 50, y));
    expect(dropped?.targetIndex).toBe(expected);
  });
});

describe('DragController horizontal zone insertion index (axis x)', () => {
  // Chips share a y band (0–32) and tile across x: 0–20, 20–40, 40–60 →
  // horizontal mid-points 10, 30, 50 (the Space switcher).
  const chips: Rect[] = [
    { left: 0, right: 20, top: 0, bottom: 32 },
    { left: 20, right: 40, top: 0, bottom: 32 },
    { left: 40, right: 60, top: 0, bottom: 32 },
  ];

  test.each([
    [5, 0],
    [15, 1],
    [35, 2],
    [55, 3],
  ])('cursor x=%i yields insertion index %i', (x, expected) => {
    let dropped: DropResult | undefined;
    const chipEl = el(chips[0] as Rect);
    registerZone('spaces', { left: 0, right: 60, top: 0, bottom: 32 }, chips, 'x');
    drag.press(DATA, pointer('pointerdown', 0, 16), chipEl, (r) => {
      dropped = r;
    });
    window.dispatchEvent(pointer('pointermove', 10, 16)); // past threshold → start
    window.dispatchEvent(pointer('pointermove', x, 16)); // hover
    expect(drag.state.targetIndex).toBe(expected);
    window.dispatchEvent(pointer('pointerup', x, 16));
    expect(dropped?.targetIndex).toBe(expected);
  });

  test('the same chips as a default (y) zone count along y, ignoring x (no regression)', () => {
    // Default axis = 'y'. The chips all share the y band 0–32 (mid 16), so at
    // y=10 (above every mid) the index is 0 regardless of x — proving the default
    // vertical behaviour is unchanged and distinct from the x-axis zone above.
    const chipEl = el(chips[0] as Rect);
    registerZone('spaces-y', { left: 0, right: 60, top: 0, bottom: 32 }, chips); // no axis → 'y'
    drag.press(DATA, pointer('pointerdown', 0, 16), chipEl, vi.fn());
    window.dispatchEvent(pointer('pointermove', 10, 16)); // past threshold → start
    window.dispatchEvent(pointer('pointermove', 35, 10)); // x=35 ignored; y=10 above all mids
    expect(drag.state.targetIndex).toBe(0);
  });
});

describe('DragController grid zone insertion index (axis grid)', () => {
  // A 2×2 wrapping grid (the favicon row). DOM/reading order: row0[col0,col1],
  // row1[col0,col1]. Cols tile x 0–20 / 20–40 (centres 10/30); rows tile y 0–20 /
  // 20–40. Insertion index is row-major across the wrap.
  const tiles: Rect[] = [
    { left: 0, right: 20, top: 0, bottom: 20 }, // i0 row0 col0
    { left: 20, right: 40, top: 0, bottom: 20 }, // i1 row0 col1
    { left: 0, right: 20, top: 20, bottom: 40 }, // i2 row1 col0
    { left: 20, right: 40, top: 20, bottom: 40 }, // i3 row1 col1
  ];

  test.each([
    [5, 5, 0], // before i0
    [15, 5, 1], // between i0 and i1 (row 0)
    [35, 5, 2], // end of row 0 → before i2
    [5, 25, 2], // start of row 1 → before i2
    [15, 25, 3], // between i2 and i3
    [35, 25, 4], // end of row 1 → end
    [5, 50, 4], // within the zone but below all rows (zone has bottom padding) → end
  ])('cursor (x=%i, y=%i) yields row-major insertion index %i', (x, y, expected) => {
    let dropped: DropResult | undefined;
    const tileEl = el(tiles[0] as Rect);
    // Zone is taller than the 0–40 tile block (bottom 60) — like the real grid's
    // vertical padding — so a cursor below the last row is still inside the zone.
    registerZone('favicon', { left: 0, right: 40, top: 0, bottom: 60 }, tiles, 'grid');
    drag.press(DATA, pointer('pointerdown', 5, 5), tileEl, (r) => {
      dropped = r;
    });
    window.dispatchEvent(pointer('pointermove', 5, 12)); // past threshold → start
    window.dispatchEvent(pointer('pointermove', x, y)); // hover
    expect(drag.state.targetIndex).toBe(expected);
    window.dispatchEvent(pointer('pointerup', x, y));
    expect(dropped?.targetIndex).toBe(expected);
  });
});

describe('DragController drop callback + cross-zone', () => {
  test('dropping in another zone reports that zone and sets justDragged once', () => {
    let dropped: DropResult | undefined;
    const rowEl = el({ left: 0, right: 100, top: 0, bottom: 20 });
    // Source zone (pinned) and a destination temp zone below it.
    registerZone('pinned:work', { left: 0, right: 100, top: 0, bottom: 60 }, [
      { left: 0, right: 100, top: 0, bottom: 20 },
    ]);
    registerZone('temp:work', { left: 0, right: 100, top: 100, bottom: 200 }, [
      { left: 0, right: 100, top: 100, bottom: 120 },
    ]);

    drag.press(DATA, pointer('pointerdown', 50, 0), rowEl, (r) => {
      dropped = r;
    });
    window.dispatchEvent(pointer('pointermove', 50, 10)); // start (in pinned)
    window.dispatchEvent(pointer('pointermove', 50, 150)); // move into temp
    window.dispatchEvent(pointer('pointerup', 50, 150));

    expect(dropped?.targetZone).toBe('temp:work');
    expect(dropped?.data.zone).toBe('pinned:work');
    expect(dropped?.data.id).toBe('st-1');
    expect(drag.state.active).toBe(false);
    expect(drag.consumeJustDragged()).toBe(true);
    expect(drag.consumeJustDragged()).toBe(false); // one-shot
  });

  test('releasing outside every zone commits the last in-zone target', () => {
    let dropped: DropResult | undefined;
    const rowEl = el({ left: 0, right: 100, top: 0, bottom: 20 });
    registerZone('pinned:work', { left: 0, right: 100, top: 0, bottom: 60 }, [
      { left: 0, right: 100, top: 0, bottom: 20 },
    ]);

    drag.press(DATA, pointer('pointerdown', 50, 0), rowEl, (r) => {
      dropped = r;
    });
    window.dispatchEvent(pointer('pointermove', 50, 10)); // start, in zone, index 1
    window.dispatchEvent(pointer('pointermove', 999, 999)); // outside every zone
    window.dispatchEvent(pointer('pointerup', 999, 999));

    expect(dropped?.targetZone).toBe('pinned:work');
    expect(dropped?.targetOntoId).toBeNull();
  });
});

describe('DragController drop-onto + nested zones (pinned-tab-folders)', () => {
  // Two rows 0–40 / 40–80; row 1 ('f1') is an onto-capable folder.
  const rowRects: Rect[] = [
    { left: 0, right: 100, top: 0, bottom: 40 },
    { left: 0, right: 100, top: 40, bottom: 80 },
  ];
  const onto: DropOntoRow[] = [
    { id: 'st-1', onto: true, springLoad: false },
    { id: 'f1', onto: true, springLoad: false },
  ];

  test('cursor in a folder row middle band reports a drop-onto target', () => {
    let dropped: DropResult | undefined;
    const rowEl = el(rowRects[0] as Rect);
    registerOntoZone('pinned:work', { left: 0, right: 100, top: 0, bottom: 80 }, rowRects, onto);
    drag.press(DATA, pointer('pointerdown', 50, 0), rowEl, (r) => {
      dropped = r;
    });
    window.dispatchEvent(pointer('pointermove', 50, 10)); // start
    window.dispatchEvent(pointer('pointermove', 50, 60)); // middle band of row 1 (40–80)
    expect(drag.state.targetOntoId).toBe('f1');
    window.dispatchEvent(pointer('pointerup', 50, 60));
    expect(dropped?.targetOntoId).toBe('f1');
  });

  test('the outer gutters of an onto row stay between-row insertion', () => {
    const rowEl = el(rowRects[0] as Rect);
    registerOntoZone('pinned:work', { left: 0, right: 100, top: 0, bottom: 80 }, rowRects, onto);
    drag.press(DATA, pointer('pointerdown', 50, 0), rowEl, vi.fn());
    window.dispatchEvent(pointer('pointermove', 50, 10)); // start
    // y=44 is in row 1's top gutter (band = 25% of 40 = 10px → onto is 50..70).
    window.dispatchEvent(pointer('pointermove', 50, 44));
    expect(drag.state.targetOntoId).toBeNull();
    expect(drag.state.targetIndex).toBe(1);
  });

  test('never reports drop-onto the drag source itself', () => {
    // Drag 'f1' (the folder) — hovering its own band must not become onto-self.
    const data: DragData = { id: 'f1', zone: 'pinned:work', title: 'F', faviconSrc: '' };
    const rowEl = el(rowRects[1] as Rect);
    registerOntoZone('pinned:work', { left: 0, right: 100, top: 0, bottom: 80 }, rowRects, onto);
    drag.press(data, pointer('pointerdown', 50, 40), rowEl, vi.fn());
    window.dispatchEvent(pointer('pointermove', 50, 50)); // start
    window.dispatchEvent(pointer('pointermove', 50, 60)); // its own middle band
    expect(drag.state.targetOntoId).toBeNull();
  });

  test('the smaller (nested) zone wins when zones overlap', () => {
    let dropped: DropResult | undefined;
    const rowEl = el({ left: 0, right: 100, top: 0, bottom: 20 });
    // Outer pinned zone fully contains a small nested folder child zone.
    registerZone('pinned:work', { left: 0, right: 100, top: 0, bottom: 200 }, [
      { left: 0, right: 100, top: 0, bottom: 20 },
    ]);
    registerZone('pinned:work:folder:f1', { left: 10, right: 90, top: 100, bottom: 140 }, [
      { left: 10, right: 90, top: 100, bottom: 120 },
    ]);
    drag.press(DATA, pointer('pointerdown', 50, 0), rowEl, (r) => {
      dropped = r;
    });
    window.dispatchEvent(pointer('pointermove', 50, 10)); // start in outer
    window.dispatchEvent(pointer('pointermove', 50, 130)); // inside nested zone
    window.dispatchEvent(pointer('pointerup', 50, 130));
    expect(dropped?.targetZone).toBe('pinned:work:folder:f1');
  });

  test('dwelling on a spring-load row fires onSpringLoad after the dwell', () => {
    vi.useFakeTimers();
    const onSpringLoad = vi.fn();
    const springRows: DropOntoRow[] = [
      { id: 'st-1', onto: true, springLoad: false },
      { id: 'f1', onto: true, springLoad: true },
    ];
    const rowEl = el(rowRects[0] as Rect);
    registerOntoZone(
      'pinned:work',
      { left: 0, right: 100, top: 0, bottom: 80 },
      rowRects,
      springRows,
      onSpringLoad,
    );
    drag.press(DATA, pointer('pointerdown', 50, 0), rowEl, vi.fn());
    window.dispatchEvent(pointer('pointermove', 50, 10)); // start
    window.dispatchEvent(pointer('pointermove', 50, 60)); // dwell on collapsed folder f1
    expect(onSpringLoad).not.toHaveBeenCalled();
    vi.advanceTimersByTime(SPRING_LOAD_MS + 10);
    expect(onSpringLoad).toHaveBeenCalledWith('f1');
    window.dispatchEvent(pointer('pointerup', 50, 60));
    vi.useRealTimers();
  });

  test('leaving the spring-load row before the dwell cancels it', () => {
    vi.useFakeTimers();
    const onSpringLoad = vi.fn();
    const springRows: DropOntoRow[] = [
      { id: 'st-1', onto: true, springLoad: false },
      { id: 'f1', onto: true, springLoad: true },
    ];
    const rowEl = el(rowRects[0] as Rect);
    registerOntoZone(
      'pinned:work',
      { left: 0, right: 100, top: 0, bottom: 80 },
      rowRects,
      springRows,
      onSpringLoad,
    );
    drag.press(DATA, pointer('pointerdown', 50, 0), rowEl, vi.fn());
    window.dispatchEvent(pointer('pointermove', 50, 10)); // start
    window.dispatchEvent(pointer('pointermove', 50, 60)); // dwell begins on f1
    vi.advanceTimersByTime(SPRING_LOAD_MS / 2);
    window.dispatchEvent(pointer('pointermove', 50, 5)); // leave to row 0 gutter
    vi.advanceTimersByTime(SPRING_LOAD_MS);
    expect(onSpringLoad).not.toHaveBeenCalled();
    window.dispatchEvent(pointer('pointerup', 50, 5));
    vi.useRealTimers();
  });
});
