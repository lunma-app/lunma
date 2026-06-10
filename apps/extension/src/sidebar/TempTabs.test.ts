import { fireEvent, render } from '@testing-library/svelte';
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

const { sendMock } = vi.hoisted(() => ({ sendMock: vi.fn(() => Promise.resolve()) }));

// The surface dispatches fire-and-forget via `dispatch`; route it to the same
// spy as `bus.send` so call assertions hold.
vi.mock('../shared/bus', () => ({
  bus: { send: sendMock },
  dispatch: sendMock,
}));

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
    const firstHit = container.querySelector('button.hit') as HTMLButtonElement;
    await fireEvent.click(firstHit);
    expect(sendMock).toHaveBeenCalledTimes(1);
    expect(sendMock).toHaveBeenCalledWith({ kind: 'focusTab', payload: { tabId: 17 } });
  });

  /** Open the overflow menu on the first temp row and return its action items. */
  async function openFirstRowMenu(container: HTMLElement): Promise<HTMLButtonElement[]> {
    const trigger = container.querySelector(
      '[data-testid="tab-row-menu-trigger"]',
    ) as HTMLButtonElement;
    await fireEvent.click(trigger);
    return Array.from(
      container.querySelectorAll('[data-testid="tab-row-menu-item"]'),
    ) as HTMLButtonElement[];
  }

  function menuItem(items: HTMLButtonElement[], id: string): HTMLButtonElement {
    return items.find((el) => el.getAttribute('data-menu-id') === id) as HTMLButtonElement;
  }

  test('the overflow-menu Close action dispatches closeTab and not focusTab', async () => {
    // The inline ✕ moved into the row's TabRowMenu morph (sidebar-favicon-row,
    // Option B): temp + pinned rows now share one overflow-menu interaction.
    const { container } = render(TempTabsHarness, { props: { store: makeStore(), windowId: 100 } });
    const items = await openFirstRowMenu(container);
    await fireEvent.click(menuItem(items, 'close'));
    expect(sendMock).toHaveBeenCalledWith({ kind: 'closeTab', payload: { tabId: 17 } });
    expect(sendMock).not.toHaveBeenCalledWith({ kind: 'focusTab', payload: { tabId: 17 } });
  });

  test('the overflow-menu Favorite action dispatches favoriteTab and keeps the tab open', async () => {
    const { container } = render(TempTabsHarness, { props: { store: makeStore(), windowId: 100 } });
    const items = await openFirstRowMenu(container);
    await fireEvent.click(menuItem(items, 'favorite'));
    expect(sendMock).toHaveBeenCalledWith({
      kind: 'favoriteTab',
      payload: { tabId: 17, windowId: 100 },
    });
    // Non-destructive: favoriting an open tab never closes it.
    expect(sendMock).not.toHaveBeenCalledWith({ kind: 'closeTab', payload: { tabId: 17 } });
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

describe('TempTabs drag dispatch (ADR 0006 Layer 1)', () => {
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
