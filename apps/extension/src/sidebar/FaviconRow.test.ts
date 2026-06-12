import { cleanup, fireEvent, render } from '@testing-library/svelte';
import { flushSync } from 'svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { LunmaStore } from '../shared/store.svelte';
import type { SavedTab } from '../shared/types';
import { drag } from './drag.svelte';
import FaviconRowHarness from './FaviconRow.test.harness.svelte';

/** Stub an element's layout rect (jsdom returns zeros), for drag hit-testing. */
function stubRect(node: Element, left: number, right: number, top = 0, bottom = 28): void {
  node.getBoundingClientRect = () =>
    ({
      left,
      right,
      top,
      bottom,
      width: right - left,
      height: bottom - top,
      x: left,
      y: top,
      toJSON: () => ({}),
    }) as DOMRect;
}

function pointer(type: string, clientX: number, clientY: number): MouseEvent {
  return new MouseEvent(type, { clientX, clientY, button: 0, bubbles: true });
}

const { sendMock } = vi.hoisted(() => ({ sendMock: vi.fn(() => Promise.resolve()) }));
// The surface dispatches fire-and-forget via `dispatch`; route it to the same
// spy as `bus.send` so call assertions hold.
vi.mock('../shared/bus', () => ({ bus: { send: sendMock }, dispatch: sendMock }));

function installChrome(): void {
  (globalThis as unknown as { chrome: unknown }).chrome = {
    runtime: { getURL: (path: string) => `chrome-extension://abc${path}` },
  };
}

beforeEach(() => {
  installChrome();
  sendMock.mockClear();
});

afterEach(() => {
  // Unmount + reset the module-level `drag` singleton so a zone registration or
  // the one-shot `justDragged` flag from a drag test never leaks into the next.
  cleanup();
  drag.__resetForTest();
  delete (globalThis as unknown as { chrome?: unknown }).chrome;
  vi.restoreAllMocks();
});

function savedFavorite(id: string, overrides: Partial<SavedTab> = {}): SavedTab {
  return {
    id,
    spaceId: null,
    title: id.toUpperCase(),
    originalURL: `https://${id}.example/`,
    currentURL: null,
    ...overrides,
  };
}

/** A store whose favicon row is `ids`, with a saved record for each. */
function makeStore(ids: string[], overrides: Record<string, Partial<SavedTab>> = {}): LunmaStore {
  const store = new LunmaStore();
  store.state.faviconRow = [...ids];
  for (const id of ids) {
    store.state.savedTabs[id] = savedFavorite(id, overrides[id] ?? {});
  }
  return store;
}

describe('FaviconRow', () => {
  test('renders favorites as icon-only tiles in array order', () => {
    const store = makeStore(['f1', 'f2', 'f3']);
    const { container } = render(FaviconRowHarness, { props: { store, windowId: 100 } });
    const tiles = container.querySelectorAll('[data-testid="favicon-tile"]');
    expect(tiles).toHaveLength(3);
    // Order f1, f2, f3 — the title is the accessible name, never inline text.
    expect(Array.from(tiles).map((t) => t.getAttribute('aria-label'))).toEqual(['F1', 'F2', 'F3']);
    for (const tile of tiles) expect(tile.textContent?.trim()).toBe('');
  });

  test('the populated row is a transparent strip (no boxed glass card)', () => {
    const store = makeStore(['f1']);
    const { container } = render(FaviconRowHarness, { props: { store, windowId: 100 } });
    // The strip renders the favicons directly — no glass `Surface` card around them.
    expect(container.querySelector('[data-testid="favicon-strip"]')).not.toBeNull();
    expect(container.querySelector('[data-variant="glass"]')).toBeNull();
    expect(container.querySelector('[data-testid="favicon-tile"]')).not.toBeNull();
  });

  test('an empty favicon row renders the empty-state placeholder and no tiles or glass card', () => {
    const store = makeStore([]);
    const { container } = render(FaviconRowHarness, { props: { store, windowId: 100 } });
    // The strip region is structurally present (Space-independent shell region)…
    expect(container.querySelector('[data-testid="favicon-row"]')).not.toBeNull();
    // …holding the empty-state placeholder, with zero favorite tiles and no glass card.
    expect(container.querySelector('[data-testid="favicon-empty"]')).not.toBeNull();
    expect(container.querySelector('[data-variant="glass"]')).toBeNull();
    expect(container.querySelectorAll('[data-testid="favicon-tile"]')).toHaveLength(0);
  });

  test('a favicon that fails to load falls back to a globe', async () => {
    const store = makeStore(['f1']);
    const { container } = render(FaviconRowHarness, { props: { store, windowId: 100 } });
    // Preload-then-swap: the source is staged on the hidden preloader. A dormant
    // favorite's primary IS the endpoint, so failing it goes straight to the globe.
    const preload = container.querySelector('img.favicon-preload') as HTMLImageElement;
    expect(preload).not.toBeNull();
    await fireEvent.error(preload);
    expect(container.querySelector('img.favicon-img')).toBeNull();
    expect(container.querySelector('[data-icon-name="globe"]')).not.toBeNull();
  });

  // Live-refresh guarantee (lunma-bookmark-bindings): a BOUND favorite reflects its
  // bound live tab's CURRENT favIconUrl and swaps flicker-free when it changes — the
  // WhatsApp unread-count badge case.
  test('a bound favorite swaps its favicon flicker-free when the live favIconUrl changes', async () => {
    const store = makeStore(['f1']);
    store.state.tabBindings.f1 = { 100: 42 };
    store.state.liveTabsById[42] = {
      tabId: 42,
      windowId: 100,
      title: 'F1',
      url: 'https://f1.example/',
      active: true,
      status: 'complete',
      favIconUrl: 'data:image/png;base64,AAAA',
    };
    const { container } = render(FaviconRowHarness, { props: { store, windowId: 100 } });
    const visible = () =>
      (container.querySelector('img.favicon-img') as HTMLImageElement | null)?.getAttribute('src');
    const preloader = () => container.querySelector('img.favicon-preload') as HTMLImageElement;

    // Icon A loads and paints.
    await fireEvent.load(preloader());
    expect(visible()).toBe('data:image/png;base64,AAAA');

    // The page re-badges its favicon: the new favIconUrl flows into liveTabsById
    // and the tile re-projects (proving the projection reads favIconUrl reactively).
    store.state.liveTabsById[42] = {
      tabId: 42,
      windowId: 100,
      title: 'F1',
      url: 'https://f1.example/',
      active: true,
      status: 'complete',
      favIconUrl: 'data:image/png;base64,BBBB',
    };
    flushSync();
    // Flicker-free: A is held while B preloads — never a globe mid-swap.
    expect(visible()).toBe('data:image/png;base64,AAAA');
    expect(preloader().getAttribute('src')).toBe('data:image/png;base64,BBBB');
    expect(container.querySelector('[data-icon-name="globe"]')).toBeNull();

    await fireEvent.load(preloader());
    expect(visible()).toBe('data:image/png;base64,BBBB');
  });

  // WhatsApp's per-count favicon is a CORP-blocked http URL: the sidebar can't load
  // the primary and lands on the `_favicon` endpoint, which must be cache-busted on
  // the live favIconUrl or its constant URL would freeze the badge.
  test('a CORP-blocked live favicon refreshes via the cache-busted endpoint', async () => {
    const F13 = 'https://web.whatsapp.com/favicon/2x/f13/v4/';
    const F14 = 'https://web.whatsapp.com/favicon/2x/f14/v4/';
    const liveAt = (favIconUrl: string) => ({
      tabId: 42,
      windowId: 100,
      title: 'WA',
      url: 'https://web.whatsapp.com/',
      active: true,
      status: 'complete' as const,
      favIconUrl,
    });
    const store = makeStore(['f1']);
    store.state.tabBindings.f1 = { 100: 42 };
    store.state.liveTabsById[42] = liveAt(F13);
    const { container } = render(FaviconRowHarness, { props: { store, windowId: 100 } });
    const preloader = () => container.querySelector('img.favicon-preload') as HTMLImageElement;
    const visible = () =>
      (container.querySelector('img.favicon-img') as HTMLImageElement | null)?.getAttribute('src');

    // Primary is the CORP-blocked per-count URL → fails to load → endpoint fallback.
    expect(preloader().getAttribute('src')).toBe(F13);
    await fireEvent.error(preloader());
    const endpoint13 = preloader().getAttribute('src') ?? '';
    expect(endpoint13).toContain('/_favicon/');
    const v13 = new URL(endpoint13).searchParams.get('v');
    expect(v13).not.toBeNull();
    await fireEvent.load(preloader());
    expect(visible()).toBe(endpoint13);

    // Count ticks to 14: the live favIconUrl changes → the busted endpoint changes.
    store.state.liveTabsById[42] = liveAt(F14);
    flushSync();
    // The new primary (f14) is staged and CORP-fails again → the endpoint, now with
    // a DIFFERENT `v`, so the browser refetches instead of serving its cache.
    expect(preloader().getAttribute('src')).toBe(F14);
    await fireEvent.error(preloader());
    const endpoint14 = preloader().getAttribute('src') ?? '';
    expect(new URL(endpoint14).searchParams.get('v')).not.toBe(v13);
    await fireEvent.load(preloader());
    expect(visible()).toBe(endpoint14);
  });

  // A DORMANT favorite (no binding in this window) shows the static `_favicon`
  // endpoint for `currentURL ?? originalURL` and must NOT track any live tab's badge.
  test("a dormant favorite uses the _favicon endpoint and ignores other tabs' live favIconUrl", () => {
    const store = makeStore(['f1']); // f1 dormant in window 100 (no binding)
    // An unrelated live tab exists in the window, with its own badge.
    store.state.liveTabsById[99] = {
      tabId: 99,
      windowId: 100,
      title: 'Other',
      url: 'https://other.example/',
      active: true,
      status: 'complete',
      favIconUrl: 'data:image/png;base64,ZZZZ',
    };
    const { container } = render(FaviconRowHarness, { props: { store, windowId: 100 } });
    const stagedSrc = () =>
      (container.querySelector('img.favicon-preload') as HTMLImageElement | null)?.getAttribute(
        'src',
      );
    // The dormant favorite's primary IS the `_favicon` endpoint for its home URL.
    expect(stagedSrc()).toContain('/_favicon/');
    expect(stagedSrc()).toContain(encodeURIComponent('https://f1.example/'));
    const before = stagedSrc();

    // Some unrelated live tab re-badges — a closed favorite must not fake the badge.
    store.state.liveTabsById[99] = {
      tabId: 99,
      windowId: 100,
      title: 'Other',
      url: 'https://other.example/',
      active: true,
      status: 'complete',
      favIconUrl: 'data:image/png;base64,YYYY',
    };
    flushSync();
    expect(stagedSrc()).toBe(before);
  });

  test('a favorite bound to the focused tab in this window renders active', () => {
    const store = makeStore(['f1']);
    store.state.tabBindings.f1 = { 100: 42 };
    store.state.liveTabsById[42] = {
      tabId: 42,
      windowId: 100,
      title: 'F1 live',
      url: 'https://f1.example/',
      active: true,
      status: 'complete',
    };
    const { container } = render(FaviconRowHarness, { props: { store, windowId: 100 } });
    const tile = container.querySelector('[data-testid="favicon-tile"]') as HTMLElement;
    expect(tile.getAttribute('data-active')).toBe('true');
  });

  test('per-window mapping: active in one window, dormant in another', () => {
    const store = makeStore(['f1']);
    store.state.tabBindings.f1 = { 100: 42 };
    store.state.liveTabsById[42] = {
      tabId: 42,
      windowId: 100,
      title: 'F1 live',
      url: 'https://f1.example/',
      active: true,
      status: 'complete',
    };
    // Window 100: bound + active.
    const w100 = render(FaviconRowHarness, { props: { store, windowId: 100 } });
    const t100 = w100.container.querySelector('[data-testid="favicon-tile"]') as HTMLElement;
    expect(t100.getAttribute('data-active')).toBe('true');
    expect(t100.classList.contains('unbound')).toBe(false);

    // Window 200: no binding slot → dormant (dimmed, not active).
    const w200 = render(FaviconRowHarness, { props: { store, windowId: 200 } });
    const t200 = w200.container.querySelector('[data-testid="favicon-tile"]') as HTMLElement;
    expect(t200.classList.contains('unbound')).toBe(true);
    expect(t200.getAttribute('data-active')).toBe('false');
  });

  test('a favorite with no live tab in this window renders dormant, without drift/active', () => {
    const store = makeStore(['f1']);
    const { container } = render(FaviconRowHarness, { props: { store, windowId: 100 } });
    const tile = container.querySelector('[data-testid="favicon-tile"]') as HTMLElement;
    expect(tile.classList.contains('unbound')).toBe(true);
    expect(tile.getAttribute('data-active')).toBe('false');
    expect(container.querySelector('[data-testid="drift-dot"]')).toBeNull();
  });

  test('a favorite whose bound tab is loading renders the shared spinner', () => {
    const store = makeStore(['f1']);
    store.state.tabBindings.f1 = { 100: 42 };
    store.state.liveTabsById[42] = {
      tabId: 42,
      windowId: 100,
      title: 'F1',
      url: 'https://f1.example/',
      active: false,
      status: 'loading',
    };
    const { container } = render(FaviconRowHarness, { props: { store, windowId: 100 } });
    expect(container.querySelector('img.favicon-img')).toBeNull();
    expect(container.querySelector('.spin [data-icon-name="loader-circle"]')).not.toBeNull();
  });

  test('only a freshly-appeared favorite gets the one-shot favoriting pulse', async () => {
    const store = makeStore(['f1', 'f2']);
    const { container } = render(FaviconRowHarness, { props: { store, windowId: 100 } });
    // The initial favorites do NOT pulse (the firstSeen guard).
    expect(container.querySelectorAll('.favicon-tile.favoriting')).toHaveLength(0);

    // A favorite that ENTERS the row pulses; existing ones stay calm.
    store.state.savedTabs.f3 = savedFavorite('f3');
    store.state.faviconRow = ['f1', 'f2', 'f3'];
    flushSync();
    const pulsing = container.querySelectorAll('.favicon-tile.favoriting');
    expect(pulsing).toHaveLength(1);
    expect((pulsing[0] as HTMLElement).getAttribute('aria-label')).toBe('F3');
  });

  test('a drifted favorite shows the corner dot AND the favicon return affordance', () => {
    const store = makeStore(['f1']);
    store.state.tabBindings.f1 = { 100: 42 };
    store.state.liveTabsById[42] = {
      tabId: 42,
      windowId: 100,
      title: 'F1 wandered',
      url: 'https://elsewhere.example/page',
      active: false,
      status: 'complete',
    };
    const { container } = render(FaviconRowHarness, { props: { store, windowId: 100 } });
    // Dot retained on tiles (no subtitle room) PLUS the return affordance + name.
    expect(container.querySelector('[data-testid="drift-dot"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="favicon-return"]')).not.toBeNull();
    const tile = container.querySelector('[data-testid="favicon-tile"]') as HTMLElement;
    expect(tile.getAttribute('aria-label')).toBe('Return to f1.example');
  });

  test('left-clicking a drifted favorite returns home (dispatches goHome)', async () => {
    const store = makeStore(['f1']);
    store.state.tabBindings.f1 = { 100: 42 };
    store.state.liveTabsById[42] = {
      tabId: 42,
      windowId: 100,
      title: 'F1 wandered',
      url: 'https://elsewhere.example/page',
      active: false,
      status: 'complete',
    };
    const { container } = render(FaviconRowHarness, { props: { store, windowId: 100 } });
    await fireEvent.click(container.querySelector('[data-testid="favicon-tile"]') as HTMLElement);
    expect(sendMock).toHaveBeenCalledWith({
      kind: 'goHome',
      payload: { savedTabId: 'f1', windowId: 100 },
    });
    // The drifted tile's click returns home, it does NOT focus the wandered tab.
    expect(sendMock).not.toHaveBeenCalledWith(expect.objectContaining({ kind: 'focusSavedTab' }));
  });

  test('clicking a dormant favorite opens its saved tab; a bound one focuses it', async () => {
    const store = makeStore(['f1', 'f2']);
    store.state.tabBindings.f2 = { 100: 7 };
    store.state.liveTabsById[7] = {
      tabId: 7,
      windowId: 100,
      title: 'F2',
      url: 'https://f2.example/',
      active: false,
      status: 'complete',
    };
    const { container } = render(FaviconRowHarness, { props: { store, windowId: 100 } });
    const tiles = container.querySelectorAll('[data-testid="favicon-tile"]');

    await fireEvent.click(tiles[0] as HTMLElement); // f1 dormant → open
    expect(sendMock).toHaveBeenCalledWith({
      kind: 'openSavedTab',
      payload: { savedTabId: 'f1', windowId: 100 },
    });

    await fireEvent.click(tiles[1] as HTMLElement); // f2 bound → focus
    expect(sendMock).toHaveBeenCalledWith({
      kind: 'focusSavedTab',
      payload: { savedTabId: 'f2', windowId: 100 },
    });
  });

  test('dragging a favorite OUT of every zone removes it (unpinTab, non-destructive, no optimistic mutate)', async () => {
    const store = makeStore(['f1', 'f2']);
    const { container } = render(FaviconRowHarness, { props: { store, windowId: 100 } });
    await Promise.resolve(); // let the favicon zone register

    // The favicon zone occupies y 0–60; the tiles live inside it.
    const root = container.querySelector('[data-testid="favicon-row"]') as HTMLElement;
    const wraps = container.querySelectorAll('.tile-wrap');
    stubRect(root, 0, 300, 0, 60);
    stubRect(wraps[0] as Element, 0, 44, 0, 44);

    // Grab f1 inside the strip (so the drag's last in-zone target is the favicon
    // zone), then drag it CLEAN OUT (y 500 → over no zone) and release there.
    await fireEvent.pointerDown(wraps[0] as Element, { clientX: 20, clientY: 20, button: 0 });
    window.dispatchEvent(pointer('pointermove', 30, 20)); // past threshold, still over the strip
    window.dispatchEvent(pointer('pointermove', 30, 500)); // dragged out — over no zone
    window.dispatchEvent(pointer('pointerup', 30, 500));

    expect(sendMock).toHaveBeenCalledWith({
      kind: 'unpinTab',
      payload: { savedTabId: 'f1', windowId: 100 },
    });
    // It must NOT reorder (the drag-out is a removal, not an in-strip move)…
    expect(sendMock).not.toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'reorderFavorites' }),
    );
    // …and must not optimistically mutate the row.
    expect(store.state.faviconRow).toEqual(['f1', 'f2']);
  });

  test('the strip is not inside a transformed carousel track (it stays fixed)', () => {
    const store = makeStore(['f1']);
    const { container } = render(FaviconRowHarness, { props: { store, windowId: 100 } });
    const row = container.querySelector('[data-testid="favicon-row"]') as HTMLElement;
    // No own transform / will-change, and not nested under a carousel track.
    expect(row.style.transform).toBe('');
    expect(row.closest('[data-testid="carousel-track"]')).toBeNull();
  });
});

describe('FaviconRow couple / reorder drag', () => {
  test('reordering a favorite within the strip dispatches reorderFavorites (no optimistic mutate)', async () => {
    const store = makeStore(['f1', 'f2', 'f3']);
    const { container } = render(FaviconRowHarness, { props: { store, windowId: 100 } });
    await Promise.resolve(); // let the zone-registration $effect run

    const root = container.querySelector('[data-testid="favicon-row"]') as HTMLElement;
    const wraps = container.querySelectorAll('.tile-wrap');
    stubRect(root, 0, 300, 0, 44); // the horizontal `favicon` zone
    stubRect(wraps[0] as Element, 0, 28); // f1, mid 14
    stubRect(wraps[1] as Element, 40, 68); // f2, mid 54
    stubRect(wraps[2] as Element, 80, 108); // f3, mid 94

    // Grab f3 and drag it to the front of the strip (cursor before f1 → index 0).
    await fireEvent.pointerDown(wraps[2] as Element, { clientX: 90, clientY: 14, button: 0 });
    window.dispatchEvent(pointer('pointermove', 84, 14)); // past threshold → drag starts
    window.dispatchEvent(pointer('pointermove', 4, 14)); // before f1's mid-point
    window.dispatchEvent(pointer('pointerup', 4, 14));

    expect(sendMock).toHaveBeenCalledWith({
      kind: 'reorderFavorites',
      payload: { ids: ['f3', 'f1', 'f2'] },
    });
    // No optimistic mutation: the row order stands until the broadcast.
    expect(store.state.faviconRow).toEqual(['f1', 'f2', 'f3']);
  });

  test('the empty-state placeholder becomes a decouple drop target while a pinned tab is dragged', async () => {
    const store = makeStore([]); // empty favicon row → the empty-state placeholder
    const { container } = render(FaviconRowHarness, { props: { store, windowId: 100 } });
    await Promise.resolve();
    const empty = () => container.querySelector('[data-testid="favicon-empty"]') as HTMLElement;
    // The placeholder is always present; at rest it is NOT a drop target.
    expect(empty()).not.toBeNull();
    expect(empty().classList.contains('over')).toBe(false);

    // The favicon zone is registered on the row root — stub it under the cursor.
    const root = container.querySelector('[data-testid="favicon-row"]') as HTMLElement;
    stubRect(root, 0, 300, 200, 260);
    // Start a PINNED-sourced drag from a detached source row, past the threshold.
    const src = document.createElement('div');
    stubRect(src, 0, 200, 200, 240);
    drag.press(
      { id: 'p1', zone: 'pinned:work', title: 'Pinned', faviconSrc: '' },
      pointer('pointerdown', 50, 210) as unknown as PointerEvent,
      src,
      () => undefined, // drop callback not exercised — we only assert the target lights up
    );
    window.dispatchEvent(pointer('pointermove', 50, 230)); // past threshold, over the row
    flushSync();

    // The placeholder lights up as the first-favorite-by-drag decouple target.
    expect(empty().classList.contains('over')).toBe(true);
    expect(empty().textContent).toContain('Drop to favorite');
    window.dispatchEvent(pointer('pointerup', 50, 230));
  });

  test('the empty-state placeholder also lights up while a TEMP tab is dragged (favorite-by-drag)', async () => {
    const store = makeStore([]); // empty favicon row → the empty-state placeholder
    const { container } = render(FaviconRowHarness, { props: { store, windowId: 100 } });
    await Promise.resolve();
    const empty = () => container.querySelector('[data-testid="favicon-empty"]') as HTMLElement;
    expect(empty().classList.contains('over')).toBe(false);

    const root = container.querySelector('[data-testid="favicon-row"]') as HTMLElement;
    stubRect(root, 0, 300, 200, 260);
    // Start a TEMP-sourced drag (zone `temp:<windowId>`) from a detached source row.
    const src = document.createElement('div');
    stubRect(src, 0, 200, 200, 240);
    drag.press(
      { id: '17', zone: 'temp:100', title: 'A temp tab', faviconSrc: '' },
      pointer('pointerdown', 50, 210) as unknown as PointerEvent,
      src,
      () => undefined, // drop callback not exercised — we only assert the target lights up
    );
    window.dispatchEvent(pointer('pointermove', 50, 230)); // past threshold, over the row
    flushSync();

    // A temp tab is a favorite-by-drag candidate too (not only pinned tabs).
    expect(empty().classList.contains('over')).toBe(true);
    expect(empty().textContent).toContain('Drop to favorite');
    window.dispatchEvent(pointer('pointerup', 50, 230));
  });

  test('dragging a favorite into a Space pinned list dispatches pinSavedTab (couple, no optimistic mutate)', async () => {
    const store = makeStore(['f1']);
    const { container } = render(FaviconRowHarness, { props: { store, windowId: 100 } });
    await Promise.resolve();

    const root = container.querySelector('[data-testid="favicon-row"]') as HTMLElement;
    const wraps = container.querySelectorAll('.tile-wrap');
    stubRect(root, 0, 300, 0, 44);
    stubRect(wraps[0] as Element, 0, 28);

    // A pinned zone for the active Space "work" below the strip (empty → index 0).
    const pinnedEl = document.createElement('div');
    stubRect(pinnedEl, 0, 300, 200, 260);
    const unregister = drag.registerZone('pinned:work', { el: pinnedEl, itemEls: () => [] });

    await fireEvent.pointerDown(wraps[0] as Element, { clientX: 14, clientY: 14, button: 0 });
    window.dispatchEvent(pointer('pointermove', 14, 34)); // past threshold → drag starts
    window.dispatchEvent(pointer('pointermove', 50, 230)); // over the pinned zone
    window.dispatchEvent(pointer('pointerup', 50, 230));
    unregister();

    expect(sendMock).toHaveBeenCalledWith({
      kind: 'pinSavedTab',
      payload: { savedTabId: 'f1', spaceId: 'work', index: 0 },
    });
    expect(store.state.faviconRow).toEqual(['f1']); // no optimistic mutation
  });

  test('dragging a favorite onto the Temporary list removes it (unpinTab, move back)', async () => {
    const store = makeStore(['f1']);
    const { container } = render(FaviconRowHarness, { props: { store, windowId: 100 } });
    await Promise.resolve();

    const root = container.querySelector('[data-testid="favicon-row"]') as HTMLElement;
    const wraps = container.querySelectorAll('.tile-wrap');
    stubRect(root, 0, 60, 0, 200);
    stubRect(wraps[0] as Element, 0, 44);

    // A Temporary zone for this window, below the strip.
    const tempEl = document.createElement('div');
    stubRect(tempEl, 200, 300, 0, 200);
    const unregister = drag.registerZone('temp:100', { el: tempEl, itemEls: () => [] });

    await fireEvent.pointerDown(wraps[0] as Element, { clientX: 14, clientY: 14, button: 0 });
    window.dispatchEvent(pointer('pointermove', 14, 34)); // past threshold → drag starts
    window.dispatchEvent(pointer('pointermove', 50, 250)); // over the temp zone
    window.dispatchEvent(pointer('pointerup', 50, 250));
    unregister();

    // Move back to Temporary = unpin (non-destructive); NOT a reorder.
    expect(sendMock).toHaveBeenCalledWith({
      kind: 'unpinTab',
      payload: { savedTabId: 'f1', windowId: 100 },
    });
    expect(sendMock).not.toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'reorderFavorites' }),
    );
    expect(store.state.faviconRow).toEqual(['f1']); // no optimistic mutation
  });

  test('right-clicking a favorite opens a context menu; Remove dispatches unpinTab', async () => {
    const store = makeStore(['f1']);
    const { container } = render(FaviconRowHarness, { props: { store, windowId: 100 } });
    await Promise.resolve();

    const tile = container.querySelector('[data-testid="favicon-tile"]') as HTMLElement;
    // Right-click → custom menu opens (and the native menu is prevented).
    await fireEvent(
      tile,
      new MouseEvent('contextmenu', { button: 2, clientX: 20, clientY: 20, bubbles: true }),
    );
    const menu = document.querySelector('[data-testid="favicon-menu"]');
    expect(menu).not.toBeNull();

    const remove = [...document.querySelectorAll('[data-testid="favicon-menu-item"]')].find(
      (e) => e.getAttribute('data-menu-id') === 'remove',
    ) as HTMLButtonElement;
    await fireEvent.click(remove);

    expect(sendMock).toHaveBeenCalledWith({
      kind: 'unpinTab',
      payload: { savedTabId: 'f1', windowId: 100 },
    });
  });

  test('right-click → "Lock to its site…" opens the boundary editor (pinned-row parity)', async () => {
    const store = makeStore(['f1']);
    const { container } = render(FaviconRowHarness, { props: { store, windowId: 100 } });
    await Promise.resolve();

    const tile = container.querySelector('[data-testid="favicon-tile"]') as HTMLElement;
    await fireEvent(
      tile,
      new MouseEvent('contextmenu', { button: 2, clientX: 20, clientY: 20, bubbles: true }),
    );
    const lock = [...document.querySelectorAll('[data-testid="favicon-menu-item"]')].find(
      (e) => e.getAttribute('data-menu-id') === 'lock',
    ) as HTMLButtonElement;
    expect(lock).not.toBeNull();

    await fireEvent.click(lock);
    expect(document.querySelector('[data-testid="favicon-boundary-editor"]')).not.toBeNull();
  });

  test('the boundary editor has a back arrow that returns to the menu actions', async () => {
    const store = makeStore(['f1']);
    const { container } = render(FaviconRowHarness, { props: { store, windowId: 100 } });
    await Promise.resolve();

    const tile = container.querySelector('[data-testid="favicon-tile"]') as HTMLElement;
    await fireEvent(
      tile,
      new MouseEvent('contextmenu', { button: 2, clientX: 20, clientY: 20, bubbles: true }),
    );
    const lock = [...document.querySelectorAll('[data-testid="favicon-menu-item"]')].find(
      (e) => e.getAttribute('data-menu-id') === 'lock',
    ) as HTMLButtonElement;
    await fireEvent.click(lock);
    expect(document.querySelector('[data-testid="favicon-boundary-editor"]')).not.toBeNull();

    // The drill-in back affordance returns to the action list (parity with pinned rows).
    const back = document.querySelector('[data-testid="favicon-menu-back"]') as HTMLButtonElement;
    expect(back).not.toBeNull();
    await fireEvent.click(back);
    expect(document.querySelector('[data-testid="favicon-boundary-editor"]')).toBeNull();
    expect(document.querySelectorAll('[data-testid="favicon-menu-item"]').length).toBeGreaterThan(
      0,
    );
  });

  // --- two-step Delete confirm (compliance: deleting a bound favorite closes its tab) ---

  /** A favorite bound to a live tab in window 100 (so Delete must confirm). */
  function makeBoundStore(): LunmaStore {
    const store = makeStore(['f1']);
    store.state.tabBindings.f1 = { 100: 42 };
    store.state.liveTabsById[42] = {
      tabId: 42,
      windowId: 100,
      title: 'F1',
      url: 'https://f1.example/',
      active: true,
      status: 'complete',
    };
    return store;
  }

  async function openMenu(container: HTMLElement): Promise<void> {
    const tile = container.querySelector('[data-testid="favicon-tile"]') as HTMLElement;
    await fireEvent(
      tile,
      new MouseEvent('contextmenu', { button: 2, clientX: 20, clientY: 20, bubbles: true }),
    );
  }
  const deleteItem = (): HTMLButtonElement =>
    [...document.querySelectorAll('[data-testid="favicon-menu-item"]')].find(
      (e) => e.getAttribute('data-menu-id') === 'delete',
    ) as HTMLButtonElement;

  test('Delete on a bound favorite is a two-step confirm', async () => {
    const store = makeBoundStore();
    const { container } = render(FaviconRowHarness, { props: { store, windowId: 100 } });
    await Promise.resolve();
    await openMenu(container);

    // First activation arms: danger-treated confirm, menu stays open, no dispatch.
    await fireEvent.click(deleteItem());
    expect(sendMock).not.toHaveBeenCalledWith(expect.objectContaining({ kind: 'deleteSavedTab' }));
    expect(document.querySelector('[data-testid="favicon-menu"]')).not.toBeNull();
    expect(deleteItem().textContent).toContain('confirm');

    // Second activation dispatches the delete and closes the menu.
    await fireEvent.click(deleteItem());
    expect(sendMock).toHaveBeenCalledWith({
      kind: 'deleteSavedTab',
      payload: { savedTabId: 'f1' },
    });
    expect(document.querySelector('[data-testid="favicon-menu"]')).toBeNull();
  });

  test('Delete on a favorite dormant in all windows deletes without prompting', async () => {
    const store = makeStore(['f1']); // no binding anywhere
    const { container } = render(FaviconRowHarness, { props: { store, windowId: 100 } });
    await Promise.resolve();
    await openMenu(container);

    expect(deleteItem().textContent).not.toContain('confirm');
    await fireEvent.click(deleteItem());
    expect(sendMock).toHaveBeenCalledWith({
      kind: 'deleteSavedTab',
      payload: { savedTabId: 'f1' },
    });
  });

  test('Escape after arming Delete disarms it (no dispatch, unarmed on next open)', async () => {
    const store = makeBoundStore();
    const { container } = render(FaviconRowHarness, { props: { store, windowId: 100 } });
    await Promise.resolve();
    await openMenu(container);

    await fireEvent.click(deleteItem()); // arm
    const panel = document.querySelector('[data-testid="favicon-menu"]') as HTMLElement;
    await fireEvent.keyDown(panel, { key: 'Escape' }); // closes + disarms
    expect(sendMock).not.toHaveBeenCalledWith(expect.objectContaining({ kind: 'deleteSavedTab' }));

    // Re-open: Delete is unarmed again (back to its plain label).
    await openMenu(container);
    expect(deleteItem().textContent).not.toContain('confirm');
  });

  // --- Move left/right (keyboard/touch-reachable reorder) ---

  const moveItem = (id: string): HTMLButtonElement =>
    [...document.querySelectorAll('[data-testid="favicon-menu-item"]')].find(
      (e) => e.getAttribute('data-menu-id') === id,
    ) as HTMLButtonElement;

  test('Move right reorders a favorite by one (reorderFavorites with the full order)', async () => {
    const store = makeStore(['f1', 'f2', 'f3']);
    const { container } = render(FaviconRowHarness, { props: { store, windowId: 100 } });
    await Promise.resolve();
    await openMenu(container); // first tile = f1
    await fireEvent.click(moveItem('move-right'));
    expect(sendMock).toHaveBeenCalledWith({
      kind: 'reorderFavorites',
      payload: { ids: ['f2', 'f1', 'f3'] },
    });
  });

  test('Move left is disabled on the first favorite and dispatches nothing', async () => {
    const store = makeStore(['f1', 'f2', 'f3']);
    const { container } = render(FaviconRowHarness, { props: { store, windowId: 100 } });
    await Promise.resolve();
    await openMenu(container); // first tile = f1
    expect(moveItem('move-left').getAttribute('aria-disabled')).toBe('true');
    await fireEvent.click(moveItem('move-left'));
    expect(sendMock).not.toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'reorderFavorites' }),
    );
  });
});

// revert-firstrun-welcome: the favicon grid's empty state is ALWAYS the standard
// EmptyState placeholder — there is no consolidated first-run welcome. These guard the
// revert across the matrix that used to gate the (now-removed) welcome: an active Space
// with zero pins, an active Space with pins, and no active Space all render the
// placeholder, never a welcome block.
describe('FaviconRow empty-state placeholder (no welcome)', () => {
  /** A store with an active Space; `pins` seeds its pinned list, `favs` the row. */
  function freshStore(
    opts: { favs?: string[]; pins?: number; activeSpace?: boolean } = {},
  ): LunmaStore {
    const store = new LunmaStore();
    if (opts.activeSpace !== false) {
      store.state.spaces.push({ id: 'work', name: 'Work', color: 'blue', icon: 'star' });
      store.state.activeSpaceByWindow[100] = 'work';
    }
    for (const id of opts.favs ?? []) {
      store.state.faviconRow.push(id);
      store.state.savedTabs[id] = savedFavorite(id);
    }
    if (opts.pins && opts.pins > 0) {
      store.state.pinnedBySpace.work = Array.from({ length: opts.pins }, (_, i) => ({
        kind: 'tab' as const,
        id: `p${i}`,
      }));
    }
    return store;
  }
  const welcome = (c: HTMLElement) => c.querySelector('[data-testid="sidebar-welcome"]');
  const placeholder = (c: HTMLElement) => c.querySelector('[data-testid="favicon-empty"]');
  const tiles = (c: HTMLElement) => c.querySelectorAll('[data-testid="favicon-tile"]');

  test('empty row + active Space with zero pins → the standard placeholder (never a welcome), no tiles', () => {
    const { container } = render(FaviconRowHarness, {
      props: { store: freshStore({ favs: [], pins: 0 }), windowId: 100 },
    });
    expect(placeholder(container)).not.toBeNull();
    expect(welcome(container)).toBeNull();
    expect(tiles(container)).toHaveLength(0);
  });

  test('empty row + active Space WITH pins → the standard placeholder', () => {
    const { container } = render(FaviconRowHarness, {
      props: { store: freshStore({ favs: [], pins: 2 }), windowId: 100 },
    });
    expect(placeholder(container)).not.toBeNull();
    expect(welcome(container)).toBeNull();
  });

  test('no active Space → the standard placeholder', () => {
    const { container } = render(FaviconRowHarness, {
      props: { store: freshStore({ favs: [], pins: 0, activeSpace: false }), windowId: 100 },
    });
    expect(placeholder(container)).not.toBeNull();
    expect(welcome(container)).toBeNull();
  });

  test('favorites present → tiles render, no placeholder', () => {
    const { container } = render(FaviconRowHarness, {
      props: { store: freshStore({ favs: ['f1', 'f2'], pins: 0 }), windowId: 100 },
    });
    expect(tiles(container)).toHaveLength(2);
    expect(placeholder(container)).toBeNull();
  });
});
