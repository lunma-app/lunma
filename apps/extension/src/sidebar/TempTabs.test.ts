import { fireEvent, render, waitFor } from '@testing-library/svelte';
import { flushSync } from 'svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { LunmaStore } from '../shared/store.svelte';
import type { LiveTab, SidebarLocalState } from '../shared/types';
import { drag } from './drag.svelte';
import TempTabsHarness from './TempTabs.test.harness.svelte';

/** Stub an element's layout rect (jsdom returns zeros), for drag hit-testing. */
function stubRect(node: Element, top: number, bottom: number, left = 0, right = 200): void {
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

/** jsdom has no `AnimationEvent`; fake one carrying the `animationName` the
 * flash-reset handler reads. */
function animationEnd(animationName: string): Event {
  const ev = new Event('animationend', { bubbles: true });
  Object.defineProperty(ev, 'animationName', { value: animationName });
  return ev;
}

const { sendMock } = vi.hoisted(() => ({ sendMock: vi.fn(() => Promise.resolve()) }));

// The surface dispatches fire-and-forget via `dispatch`; route it to the same
// spy as `bus.send` so call assertions hold.
vi.mock('../shared/bus', () => ({
  bus: { send: sendMock },
  dispatch: sendMock,
  TAB_DEDUP_FLASH: 'lunma/tab-dedup-flash',
}));

/** The most-recent `chrome.runtime.onMessage` listener TempTabs registered. */
let flashListener: ((msg: unknown) => void) | null = null;

function installChrome(): void {
  flashListener = null;
  (globalThis as unknown as { chrome: unknown }).chrome = {
    runtime: {
      getURL: (path: string) => `chrome-extension://abc${path}`,
      onMessage: {
        addListener: (fn: (msg: unknown) => void) => {
          flashListener = fn;
        },
        removeListener: () => {
          flashListener = null;
        },
      },
    },
  };
}

beforeEach(() => {
  installChrome();
  sendMock.mockClear();
});

afterEach(() => {
  delete (globalThis as unknown as { chrome?: unknown }).chrome;
  vi.restoreAllMocks();
});

/** Read the per-window auto-rename-next-folder arm flag (sidebar-local). */
function armedFor(store: LunmaStore, windowId: number): boolean | undefined {
  return (store.state as unknown as SidebarLocalState).autoRenameNextFolderByWindow?.[windowId];
}

function liveTab(partial: Partial<LiveTab> & { tabId: number }): LiveTab {
  return {
    windowId: 100,
    title: `Tab ${partial.tabId}`,
    url: `https://example.com/${partial.tabId}`,
    active: false,
    status: 'complete',
    ...partial,
  };
}

function makeStore(): LunmaStore {
  const store = new LunmaStore();
  store.state.spaces.push({ id: 'work', name: 'Work', color: 'blue', icon: 'star' });
  store.state.activeSpaceByWindow[100] = 'work';
  store.state.spaceInstancesByWindow[100] = {
    work: {
      spaceId: 'work',
      groupId: 1,
      tempTabIds: [17, 22],
      tempTabTitles: {},
    },
  };
  store.state.tabLastActivity = { 17: 1000, 22: 2000 };
  store.state.liveTabsById[17] = liveTab({ tabId: 17, title: 'Older' });
  store.state.liveTabsById[22] = liveTab({ tabId: 22, title: 'Newer', active: true });
  return store;
}

describe('TempTabs live favicon refresh', () => {
  // The Temporary row composes the same `Favicon` primitive + reads favIconUrl via
  // its reactive projection, so it inherits the flicker-free live swap (the temp row
  // has no favicon spec of record — this test is its coverage, per the proposal).
  test('a Temporary row swaps its favicon flicker-free when the live favIconUrl changes', async () => {
    const store = makeStore();
    store.state.liveTabsById[17] = liveTab({
      tabId: 17,
      title: 'Older',
      favIconUrl: 'data:image/png;base64,AAAA',
    });
    const { container } = render(TempTabsHarness, { props: { store, windowId: 100 } });
    // tempTabIds order is [17, 22], so the first row is tab 17.
    const firstRow = () => container.querySelectorAll('[data-testid="tab-row"]')[0] as HTMLElement;
    const visible = () =>
      (firstRow().querySelector('img.favicon-img') as HTMLImageElement | null)?.getAttribute('src');
    const preloader = () => firstRow().querySelector('img.favicon-preload') as HTMLImageElement;

    await fireEvent.load(preloader());
    expect(visible()).toBe('data:image/png;base64,AAAA');

    store.state.liveTabsById[17] = liveTab({
      tabId: 17,
      title: 'Older',
      favIconUrl: 'data:image/png;base64,BBBB',
    });
    flushSync();
    // A is held while B preloads — no globe mid-swap.
    expect(visible()).toBe('data:image/png;base64,AAAA');
    expect(preloader().getAttribute('src')).toBe('data:image/png;base64,BBBB');
    expect(firstRow().querySelector('[data-icon-name="globe"]')).toBeNull();

    await fireEvent.load(preloader());
    expect(visible()).toBe('data:image/png;base64,BBBB');
  });
});

describe('TempTabs duplicate-id resilience', () => {
  test('renders a duplicate temp tab id once and does not throw', () => {
    const store = new LunmaStore();
    store.state.spaces.push({ id: 'work', name: 'Work', color: 'blue', icon: 'star' });
    store.state.activeSpaceByWindow[100] = 'work';
    store.state.spaceInstancesByWindow[100] = {
      work: { spaceId: 'work', groupId: 1, tempTabIds: [17, 17], tempTabTitles: {} },
    };
    store.state.liveTabsById[17] = liveTab({ tabId: 17, title: 'Once' });
    const { container } = render(TempTabsHarness, { props: { store, windowId: 100 } });
    expect(container.querySelectorAll('[data-testid="tab-row"]')).toHaveLength(1);
  });
});

describe('TempTabs', () => {
  test('renders one TabRow per temp tab in manual (tempTabIds array) order', () => {
    const { container } = render(TempTabsHarness, { props: { store: makeStore(), windowId: 100 } });
    const rows = container.querySelectorAll('[data-testid="tab-row"]');
    expect(rows).toHaveLength(2);
    const titles = Array.from(container.querySelectorAll('.title')).map((el) => el.textContent);
    expect(titles).toEqual(['Older', 'Newer']); // array order [17, 22], not activity
  });

  test('clicking a row dispatches focusTab', async () => {
    const { container } = render(TempTabsHarness, { props: { store: makeStore(), windowId: 100 } });
    const firstHit = container.querySelector('button.title-btn') as HTMLButtonElement;
    await fireEvent.click(firstHit);
    expect(sendMock).toHaveBeenCalledTimes(1);
    expect(sendMock).toHaveBeenCalledWith({ kind: 'focusTab', payload: { tabId: 17 } });
  });

  /** Right-click a temp row's wrapper to open its bits-ui ContextMenu. The popover
   * is portaled to <body> and opens ASYNC, so wait for the items to mount before
   * returning them. */
  async function openRowMenu(container: HTMLElement, rowIndex = 0): Promise<HTMLButtonElement[]> {
    // The bits-ui trigger lives on the row's inner `.menu-trigger` (a
    // `display:contents` wrapper); a real right-click originates on the row content
    // and bubbles to it, so fire the contextmenu there.
    const trigger = container.querySelectorAll('.menu-trigger')[rowIndex] as HTMLElement;
    await fireEvent(
      trigger,
      new MouseEvent('contextmenu', { button: 2, clientX: 12, clientY: 18, bubbles: true }),
    );
    await waitFor(() =>
      expect(document.querySelectorAll('[data-testid="temp-menu-item"]').length).toBeGreaterThan(0),
    );
    return Array.from(
      document.querySelectorAll('[data-testid="temp-menu-item"]'),
    ) as HTMLButtonElement[];
  }

  function menuItem(items: HTMLButtonElement[], id: string): HTMLButtonElement {
    return items.find((el) => el.getAttribute('data-menu-id') === id) as HTMLButtonElement;
  }

  test('the hover close (✕) dispatches closeTab and not focusTab', async () => {
    // The one-click inline close is restored to the row's trailing slot (it had
    // been folded into the overflow menu); it closes directly without focusing.
    const { container } = render(TempTabsHarness, { props: { store: makeStore(), windowId: 100 } });
    const close = container.querySelector('[data-testid="temp-close"]') as HTMLButtonElement;
    await fireEvent.click(close);
    expect(sendMock).toHaveBeenCalledWith({ kind: 'closeTab', payload: { tabId: 17 } });
    expect(sendMock).not.toHaveBeenCalledWith({ kind: 'focusTab', payload: { tabId: 17 } });
  });

  test('right-click opens the (portaled) menu, suppresses the native menu, and does not focus', async () => {
    // bits-ui's ContextMenu.Trigger owns the right-click: it preventDefaults the
    // native menu, portals the popover to <body>, and clamps it into the viewport
    // — positioning/outside-click/collision are bits-ui's, no longer asserted here.
    const { container } = render(TempTabsHarness, { props: { store: makeStore(), windowId: 100 } });
    const trigger = container.querySelector('.menu-trigger') as HTMLElement;
    const ev = new MouseEvent('contextmenu', {
      bubbles: true,
      cancelable: true,
      button: 2,
      clientX: 12,
      clientY: 18,
    });
    await fireEvent(trigger, ev);
    // Native context menu suppressed by bits-ui's trigger.
    expect(ev.defaultPrevented).toBe(true);
    // Menu mounts in the document body portal (async).
    await waitFor(() => expect(document.querySelector('[data-testid="temp-menu"]')).not.toBeNull());
    // Right-click never focuses/switches the tab.
    expect(sendMock).not.toHaveBeenCalledWith({ kind: 'focusTab', payload: { tabId: 17 } });
  });

  test('Escape dismisses the right-click menu', async () => {
    const { container } = render(TempTabsHarness, { props: { store: makeStore(), windowId: 100 } });
    await openRowMenu(container);
    const menu = document.querySelector('[data-testid="temp-menu"]') as HTMLElement;
    await fireEvent.keyDown(menu, { key: 'Escape' });
    await waitFor(() => expect(document.querySelector('[data-testid="temp-menu"]')).toBeNull());
  });

  test('the right-click menu Close tab dispatches closeTab and not focusTab', async () => {
    const { container } = render(TempTabsHarness, { props: { store: makeStore(), windowId: 100 } });
    const items = await openRowMenu(container);
    await fireEvent.click(menuItem(items, 'close'));
    expect(sendMock).toHaveBeenCalledWith({ kind: 'closeTab', payload: { tabId: 17 } });
    expect(sendMock).not.toHaveBeenCalledWith({ kind: 'focusTab', payload: { tabId: 17 } });
  });

  test('the right-click menu Favorite dispatches favoriteTab and keeps the tab open', async () => {
    const { container } = render(TempTabsHarness, { props: { store: makeStore(), windowId: 100 } });
    const items = await openRowMenu(container);
    await fireEvent.click(menuItem(items, 'favorite'));
    expect(sendMock).toHaveBeenCalledWith({
      kind: 'favoriteTab',
      payload: { tabId: 17, windowId: 100 },
    });
    // Non-destructive: favoriting an open tab never closes it.
    expect(sendMock).not.toHaveBeenCalledWith({ kind: 'closeTab', payload: { tabId: 17 } });
  });

  test('the right-click menu Rename opens the inline editor', async () => {
    const { container } = render(TempTabsHarness, { props: { store: makeStore(), windowId: 100 } });
    const items = await openRowMenu(container);
    await fireEvent.click(menuItem(items, 'rename'));
    expect(container.querySelector('[data-testid="tab-rename-input"]')).not.toBeNull();
  });

  test('Move down reorders a temp row by one (reorderTemp with the full post-move order)', async () => {
    const store = makeStore();
    // Three temp tabs [17, 22, 31]; Move down on 17 → [22, 17, 31].
    store.state.spaceInstancesByWindow[100] = {
      work: { spaceId: 'work', groupId: 1, tempTabIds: [17, 22, 31], tempTabTitles: {} },
    };
    store.state.liveTabsById[31] = liveTab({ tabId: 31, title: 'Third' });
    const { container } = render(TempTabsHarness, { props: { store, windowId: 100 } });
    const items = await openRowMenu(container, 0); // row for tab 17
    await fireEvent.click(menuItem(items, 'move-down'));
    expect(sendMock).toHaveBeenCalledWith({
      kind: 'reorderTemp',
      payload: { windowId: 100, tabIds: [22, 17, 31] },
    });
  });

  test('Move up is disabled on the first temp row and dispatches nothing', async () => {
    const { container } = render(TempTabsHarness, { props: { store: makeStore(), windowId: 100 } });
    const items = await openRowMenu(container, 0); // first row (tab 17)
    expect(menuItem(items, 'move-up').getAttribute('aria-disabled')).toBe('true');
    await fireEvent.click(menuItem(items, 'move-up'));
    expect(sendMock).not.toHaveBeenCalledWith(expect.objectContaining({ kind: 'reorderTemp' }));
  });

  test('the right-click menu Duplicate dispatches duplicateTab for that row', async () => {
    const { container } = render(TempTabsHarness, { props: { store: makeStore(), windowId: 100 } });
    const items = await openRowMenu(container, 0); // first row (tab 17)
    await fireEvent.click(menuItem(items, 'duplicate'));
    expect(sendMock).toHaveBeenCalledWith({ kind: 'duplicateTab', payload: { tabId: 17 } });
  });

  test('a tab-dedup-flash message flashes the matching row (and only that row)', async () => {
    const { container } = render(TempTabsHarness, { props: { store: makeStore(), windowId: 100 } });
    flushSync();
    // The component registered an onMessage listener on mount.
    expect(flashListener).not.toBeNull();
    flashListener?.({ type: 'lunma/tab-dedup-flash', tabId: 22 });
    flushSync();
    const flashed = container.querySelectorAll('.row-wrap.flash');
    expect(flashed).toHaveLength(1);
    // tempTabIds order is [17, 22], so the flashed row is the second (tab 22).
    expect(container.querySelectorAll('.row-wrap')[1]).toBe(flashed[0]);
  });

  test('animationend on the flash clears the pulse so it can re-fire', async () => {
    const { container } = render(TempTabsHarness, { props: { store: makeStore(), windowId: 100 } });
    flushSync();
    flashListener?.({ type: 'lunma/tab-dedup-flash', tabId: 17 });
    flushSync();
    const row = container.querySelectorAll('.row-wrap')[0] as HTMLElement;
    expect(row.classList.contains('flash')).toBe(true);
    // Svelte scopes the keyframe name; the handler matches on the `tab-flash` substring.
    row.dispatchEvent(animationEnd('svelte-x-tab-flash'));
    flushSync();
    expect(row.classList.contains('flash')).toBe(false);
  });

  test('an unrelated animationend does not clear an active flash', async () => {
    const { container } = render(TempTabsHarness, { props: { store: makeStore(), windowId: 100 } });
    flushSync();
    flashListener?.({ type: 'lunma/tab-dedup-flash', tabId: 17 });
    flushSync();
    const row = container.querySelectorAll('.row-wrap')[0] as HTMLElement;
    row.dispatchEvent(animationEnd('temp-row-in'));
    flushSync();
    expect(row.classList.contains('flash')).toBe(true);
  });

  test('a secondary (right) button press does not start a drag', async () => {
    // drag.press guards on `button !== 0`, so a right-click never arms a drag —
    // the right-click path needs no separate drag suppression (design / impact).
    const { container } = render(TempTabsHarness, { props: { store: makeStore(), windowId: 100 } });
    await Promise.resolve();
    const rows = container.querySelectorAll('.row-wrap');
    await fireEvent.pointerDown(rows[0] as Element, { clientX: 50, clientY: 10, button: 2 });
    window.dispatchEvent(
      new MouseEvent('pointermove', { clientX: 50, clientY: 60, button: 2, bubbles: true }),
    );
    expect(drag.state.active).toBe(false);
    window.dispatchEvent(
      new MouseEvent('pointerup', { clientX: 50, clientY: 60, button: 2, bubbles: true }),
    );
  });

  test('a tempTabId missing from liveTabsById is skipped without error', () => {
    const store = makeStore();
    store.state.spaceInstancesByWindow[100] = {
      work: {
        spaceId: 'work',
        groupId: 1,
        tempTabIds: [17, 99, 22],
        tempTabTitles: {}, // 99 has no liveTabsById entry
      },
    };
    const { container } = render(TempTabsHarness, { props: { store, windowId: 100 } });
    const rows = container.querySelectorAll('[data-testid="tab-row"]');
    expect(rows).toHaveLength(2);
  });

  test('the active tab renders with the active treatment', () => {
    const { container } = render(TempTabsHarness, { props: { store: makeStore(), windowId: 100 } });
    const activeRows = container.querySelectorAll('[data-testid="tab-row"].active');
    expect(activeRows).toHaveLength(1);
  });
});

describe('TempTabs drag dispatch', () => {
  test('dragging a temp row into the Pinned zone dispatches pinTab at the drop index', async () => {
    const { container } = render(TempTabsHarness, { props: { store: makeStore(), windowId: 100 } });
    await Promise.resolve(); // let the zone-registration $effect run

    const zone = container.querySelector('[data-testid="temp-tabs"]') as HTMLElement;
    const rows = container.querySelectorAll('.row-wrap');
    stubRect(zone, 0, 80);
    stubRect(rows[0] as Element, 0, 40);
    stubRect(rows[1] as Element, 40, 80);

    // A separate Pinned drop zone for Space "work", below the temp list. Empty,
    // so any drop into it resolves to insertion index 0.
    const pinnedEl = document.createElement('div');
    stubRect(pinnedEl, 200, 260);
    const unregister = drag.registerZone('pinned:work', { el: pinnedEl, itemEls: () => [] });

    // Grab temp row 0 (tab 17) and drag it into the Pinned zone.
    await fireEvent.pointerDown(rows[0] as Element, { clientX: 50, clientY: 10, button: 0 });
    window.dispatchEvent(pointer('pointermove', 50, 30)); // past threshold → drag starts
    window.dispatchEvent(pointer('pointermove', 50, 230)); // hover over Pinned zone
    window.dispatchEvent(pointer('pointerup', 50, 230));
    unregister();

    expect(sendMock).toHaveBeenCalledWith({
      kind: 'pinTab',
      payload: { tabId: 17, windowId: 100, spaceId: 'work', targetIndex: 0 },
    });
  });

  test('dragging a temp row onto the favicon zone dispatches favoriteTab (tab stays open)', async () => {
    const { container } = render(TempTabsHarness, { props: { store: makeStore(), windowId: 100 } });
    await Promise.resolve(); // let the zone-registration $effect run

    const zone = container.querySelector('[data-testid="temp-tabs"]') as HTMLElement;
    const rows = container.querySelectorAll('.row-wrap');
    stubRect(zone, 0, 80);
    stubRect(rows[0] as Element, 0, 40);
    stubRect(rows[1] as Element, 40, 80);

    // The global favicon strip's horizontal drop zone (it lives at the sidebar top,
    // but its rect can be anywhere for the test — here below the temp list).
    const faviconEl = document.createElement('div');
    stubRect(faviconEl, 200, 260);
    const unregister = drag.registerZone('favicon', {
      el: faviconEl,
      itemEls: () => [],
      axis: 'x',
    });

    // Grab temp row 0 (tab 17) and drag it onto the favicon zone.
    await fireEvent.pointerDown(rows[0] as Element, { clientX: 50, clientY: 10, button: 0 });
    window.dispatchEvent(pointer('pointermove', 50, 30)); // past threshold → drag starts
    window.dispatchEvent(pointer('pointermove', 50, 230)); // hover over the favicon zone
    window.dispatchEvent(pointer('pointerup', 50, 230));
    unregister();

    // Favorite the live tab non-destructively (favoriteTab) — the drag equivalent of
    // the row's overflow-menu Favorite; no pin/close/reorder.
    expect(sendMock).toHaveBeenCalledWith({
      kind: 'favoriteTab',
      payload: { tabId: 17, windowId: 100 },
    });
    expect(sendMock).not.toHaveBeenCalledWith(expect.objectContaining({ kind: 'pinTab' }));
  });

  test('dropping a temp row ONTO a pinned folder dispatches pinTab { into }', async () => {
    const store = makeStore();
    store.state.pinnedBySpace.work = [
      { kind: 'folder', id: 'fld-1', name: 'F', icon: 'folder', color: 'gray', children: [] },
    ];
    const { container } = render(TempTabsHarness, { props: { store, windowId: 100 } });
    await Promise.resolve();

    const zone = container.querySelector('[data-testid="temp-tabs"]') as HTMLElement;
    const rows = container.querySelectorAll('.row-wrap');
    stubRect(zone, 0, 80);
    stubRect(rows[0] as Element, 0, 40);
    stubRect(rows[1] as Element, 40, 80);

    // A folder row in the Pinned zone (200–240). Its onto-band (middle 50%) is
    // y∈[210,230]; the descriptor marks it drop-onto-capable like PinnedTabs does.
    const pinnedEl = document.createElement('div');
    stubRect(pinnedEl, 200, 280);
    const folderRowEl = document.createElement('div');
    stubRect(folderRowEl, 200, 240);
    const unregister = drag.registerZone('pinned:work', {
      el: pinnedEl,
      itemEls: () => [folderRowEl],
      rows: () => [{ id: 'fld-1', onto: true, springLoad: true }],
    });

    await fireEvent.pointerDown(rows[0] as Element, { clientX: 50, clientY: 10, button: 0 });
    window.dispatchEvent(pointer('pointermove', 50, 30)); // past threshold → drag starts
    window.dispatchEvent(pointer('pointermove', 50, 220)); // onto the folder row's band
    window.dispatchEvent(pointer('pointerup', 50, 220));
    unregister();

    expect(sendMock).toHaveBeenCalledWith({
      kind: 'pinTab',
      payload: {
        tabId: 17,
        windowId: 100,
        spaceId: 'work',
        targetIndex: 0,
        placement: { into: 'fld-1' },
      },
    });
    // Filing INTO an existing folder must NOT arm auto-rename.
    expect(armedFor(store, 100)).toBeUndefined();
  });

  test('dropping a temp row ONTO a pinned tab dispatches pinTab { withSavedTabId }', async () => {
    const store = makeStore();
    store.state.pinnedBySpace.work = [{ kind: 'tab', id: 'st-1' }];
    const { container } = render(TempTabsHarness, { props: { store, windowId: 100 } });
    await Promise.resolve();

    const zone = container.querySelector('[data-testid="temp-tabs"]') as HTMLElement;
    const rows = container.querySelectorAll('.row-wrap');
    stubRect(zone, 0, 80);
    stubRect(rows[0] as Element, 0, 40);
    stubRect(rows[1] as Element, 40, 80);

    const pinnedEl = document.createElement('div');
    stubRect(pinnedEl, 200, 280);
    const tabRowEl = document.createElement('div');
    stubRect(tabRowEl, 200, 240);
    const unregister = drag.registerZone('pinned:work', {
      el: pinnedEl,
      itemEls: () => [tabRowEl],
      rows: () => [{ id: 'st-1', onto: true, springLoad: false }],
    });

    await fireEvent.pointerDown(rows[0] as Element, { clientX: 50, clientY: 10, button: 0 });
    window.dispatchEvent(pointer('pointermove', 50, 30));
    window.dispatchEvent(pointer('pointermove', 50, 220)); // onto the tab row's band
    window.dispatchEvent(pointer('pointerup', 50, 220));
    unregister();

    expect(sendMock).toHaveBeenCalledWith({
      kind: 'pinTab',
      payload: {
        tabId: 17,
        windowId: 100,
        spaceId: 'work',
        targetIndex: 0,
        placement: { withSavedTabId: 'st-1' },
      },
    });
    // Folding onto a pinned tab creates a NEW folder → arm auto-rename.
    expect(armedFor(store, 100)).toBe(true);
  });

  test('dropping a temp row BETWEEN pinned rows dispatches a top-level pinTab (no placement)', async () => {
    const store = makeStore();
    store.state.pinnedBySpace.work = [{ kind: 'tab', id: 'st-1' }];
    const { container } = render(TempTabsHarness, { props: { store, windowId: 100 } });
    await Promise.resolve();

    const zone = container.querySelector('[data-testid="temp-tabs"]') as HTMLElement;
    const rows = container.querySelectorAll('.row-wrap');
    stubRect(zone, 0, 80);
    stubRect(rows[0] as Element, 0, 40);
    stubRect(rows[1] as Element, 40, 80);

    const pinnedEl = document.createElement('div');
    stubRect(pinnedEl, 200, 280);
    const tabRowEl = document.createElement('div');
    stubRect(tabRowEl, 200, 240); // mid 220
    const unregister = drag.registerZone('pinned:work', {
      el: pinnedEl,
      itemEls: () => [tabRowEl],
      rows: () => [{ id: 'st-1', onto: true, springLoad: false }],
    });

    await fireEvent.pointerDown(rows[0] as Element, { clientX: 50, clientY: 10, button: 0 });
    window.dispatchEvent(pointer('pointermove', 50, 30));
    window.dispatchEvent(pointer('pointermove', 50, 250)); // below the row → between-rows
    window.dispatchEvent(pointer('pointerup', 50, 250));
    unregister();

    expect(sendMock).toHaveBeenCalledWith({
      kind: 'pinTab',
      payload: { tabId: 17, windowId: 100, spaceId: 'work', targetIndex: 1 },
    });
    // A top-level (between-rows) pin creates no folder → no arm.
    expect(armedFor(store, 100)).toBeUndefined();
  });

  test('dropping a temp row into an expanded folder child zone dispatches pinTab { into }', async () => {
    const store = makeStore();
    const { container } = render(TempTabsHarness, { props: { store, windowId: 100 } });
    await Promise.resolve();

    const zone = container.querySelector('[data-testid="temp-tabs"]') as HTMLElement;
    const rows = container.querySelectorAll('.row-wrap');
    stubRect(zone, 0, 80);
    stubRect(rows[0] as Element, 0, 40);
    stubRect(rows[1] as Element, 40, 80);

    // The expanded folder's nested child zone, id `pinned:<spaceId>:folder:<id>`.
    const childZoneEl = document.createElement('div');
    stubRect(childZoneEl, 200, 280);
    const unregister = drag.registerZone('pinned:work:folder:fld-1', {
      el: childZoneEl,
      itemEls: () => [],
    });

    await fireEvent.pointerDown(rows[0] as Element, { clientX: 50, clientY: 10, button: 0 });
    window.dispatchEvent(pointer('pointermove', 50, 30));
    window.dispatchEvent(pointer('pointermove', 50, 240)); // inside the child zone
    window.dispatchEvent(pointer('pointerup', 50, 240));
    unregister();

    expect(sendMock).toHaveBeenCalledWith({
      kind: 'pinTab',
      payload: {
        tabId: 17,
        windowId: 100,
        spaceId: 'work',
        targetIndex: 0,
        placement: { into: 'fld-1' },
      },
    });
    // Filing into an expanded folder's child zone must NOT arm auto-rename.
    expect(armedFor(store, 100)).toBeUndefined();
  });

  test('reordering within Temporary dispatches reorderTemp with the post-drop order', async () => {
    const { container } = render(TempTabsHarness, { props: { store: makeStore(), windowId: 100 } });
    await Promise.resolve();

    const zone = container.querySelector('[data-testid="temp-tabs"]') as HTMLElement;
    const rows = container.querySelectorAll('.row-wrap');
    stubRect(zone, 0, 80);
    stubRect(rows[0] as Element, 0, 40); // tab 17, mid 20
    stubRect(rows[1] as Element, 40, 80); // tab 22, mid 60

    // Drag tab 17 (row 0) below tab 22 → order becomes [22, 17].
    await fireEvent.pointerDown(rows[0] as Element, { clientX: 50, clientY: 10, button: 0 });
    window.dispatchEvent(pointer('pointermove', 50, 70));
    window.dispatchEvent(pointer('pointermove', 50, 75));
    window.dispatchEvent(pointer('pointerup', 50, 75));

    expect(sendMock).toHaveBeenCalledWith({
      kind: 'reorderTemp',
      payload: { windowId: 100, tabIds: [22, 17] },
    });
  });
});
