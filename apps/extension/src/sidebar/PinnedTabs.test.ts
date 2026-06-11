import { cleanup, fireEvent, render } from '@testing-library/svelte';
import { flushSync } from 'svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { LunmaStore } from '../shared/store.svelte';
import type { LiveTab, SavedTab, SidebarLocalState } from '../shared/types';
import { drag } from './drag.svelte';
import PinnedTabsHarness from './PinnedTabs.test.harness.svelte';

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

/**
 * Layout stub keyed by `data-row-id` / `data-testid`, applied at the prototype
 * level. Robust to mid-drag node recreation (the keyed `{#each}` re-renders when
 * `drag.state` changes, replacing per-row DOM nodes — so stubbing specific node
 * instances goes stale). Returns a restore fn.
 */
function installLayout(map: Record<string, [number, number]>): () => void {
  const orig = Element.prototype.getBoundingClientRect;
  Element.prototype.getBoundingClientRect = function (this: Element): DOMRect {
    const key = this.getAttribute('data-row-id') ?? this.getAttribute('data-testid');
    const entry = key ? map[key] : undefined;
    if (!entry) return orig.call(this);
    const [top, bottom] = entry;
    return {
      left: 0,
      right: 200,
      top,
      bottom,
      width: 200,
      height: bottom - top,
      x: 0,
      y: top,
      toJSON: () => ({}),
    } as DOMRect;
  };
  return () => {
    Element.prototype.getBoundingClientRect = orig;
  };
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
  // Unmount rendered components so the module-level `drag` singleton's zone
  // registrations (and their DOM) don't leak into the next test. Also clear the
  // singleton's one-shot `justDragged` flag left set after a drop test, which
  // would otherwise make the next test's first click a no-op.
  cleanup();
  drag.__resetForTest();
  delete (globalThis as unknown as { chrome?: unknown }).chrome;
  vi.restoreAllMocks();
});

function savedTab(partial: Partial<SavedTab> & { id: string }): SavedTab {
  return {
    spaceId: 'work',
    title: `Saved ${partial.id}`,
    originalURL: 'https://example.com/',
    currentURL: 'https://example.com/',
    ...partial,
  };
}

function liveTab(partial: Partial<LiveTab> & { tabId: number }): LiveTab {
  return {
    windowId: 100,
    title: `Tab ${partial.tabId}`,
    url: 'https://example.com/',
    active: false,
    status: 'complete',
    ...partial,
  };
}

function makeStore(): LunmaStore {
  const store = new LunmaStore();
  store.state.spaces.push({ id: 'work', name: 'Work', color: 'blue', icon: 'star' });
  store.state.activeSpaceByWindow[100] = 'work';
  return store;
}

describe('PinnedTabs duplicate-id resilience', () => {
  test('renders a duplicate pinned id once and does not throw (each_key_duplicate guard)', () => {
    const store = makeStore();
    store.state.savedTabs['st-1'] = savedTab({ id: 'st-1', title: 'Dup', currentURL: null });
    // A duplicate top-level id (as a corrupted/transient broadcast could carry)
    // must not collide the keyed {#each} — it renders once.
    store.state.pinnedBySpace.work = [
      { kind: 'tab', id: 'st-1' },
      { kind: 'tab', id: 'st-1' },
    ];
    const { container } = render(PinnedTabsHarness, {
      props: { store, windowId: 100, spaceId: 'work' },
    });
    expect(container.querySelectorAll('[data-testid="tab-row"]')).toHaveLength(1);
  });
});

describe('PinnedTabs title source', () => {
  test('a bound pinned tab shows its live page title, not the stale stored title', () => {
    const store = makeStore();
    // Pinned while blank ("New Tab"), then navigated to Google Maps.
    store.state.savedTabs['st-1'] = savedTab({
      id: 'st-1',
      title: 'New Tab',
      currentURL: 'https://google.com/maps',
    });
    store.state.tabBindings['st-1'] = { 100: 42 };
    store.state.liveTabsById[42] = liveTab({ tabId: 42, title: 'Google Maps' });
    store.state.pinnedBySpace.work = [{ kind: 'tab', id: 'st-1' }];

    const { container } = render(PinnedTabsHarness, {
      props: { store, windowId: 100, spaceId: 'work' },
    });
    expect(container.querySelector('[data-testid="tab-row"] .title')?.textContent).toBe(
      'Google Maps',
    );
  });

  test('a dormant pinned tab falls back to the stored title', () => {
    const store = makeStore();
    store.state.savedTabs['st-1'] = savedTab({ id: 'st-1', title: 'Saved Maps', currentURL: null });
    store.state.tabBindings['st-1'] = {};
    store.state.pinnedBySpace.work = [{ kind: 'tab', id: 'st-1' }];

    const { container } = render(PinnedTabsHarness, {
      props: { store, windowId: 100, spaceId: 'work' },
    });
    expect(container.querySelector('[data-testid="tab-row"] .title')?.textContent).toBe(
      'Saved Maps',
    );
  });
});

describe('PinnedTabs live favicon refresh', () => {
  // Live-refresh guarantee (lunma-bookmark-bindings): a bound pinned tile swaps its
  // favicon flicker-free when its bound tab's live favIconUrl changes.
  test('a bound pinned tab swaps its favicon flicker-free when the live favIconUrl changes', async () => {
    const store = makeStore();
    store.state.savedTabs['st-1'] = savedTab({ id: 'st-1' });
    store.state.tabBindings['st-1'] = { 100: 42 };
    store.state.liveTabsById[42] = liveTab({ tabId: 42, favIconUrl: 'data:image/png;base64,AAAA' });
    store.state.pinnedBySpace.work = [{ kind: 'tab', id: 'st-1' }];
    const { container } = render(PinnedTabsHarness, {
      props: { store, windowId: 100, spaceId: 'work' },
    });
    const visible = () =>
      (container.querySelector('img.favicon-img') as HTMLImageElement | null)?.getAttribute('src');
    const preloader = () => container.querySelector('img.favicon-preload') as HTMLImageElement;

    await fireEvent.load(preloader());
    expect(visible()).toBe('data:image/png;base64,AAAA');

    store.state.liveTabsById[42] = liveTab({ tabId: 42, favIconUrl: 'data:image/png;base64,BBBB' });
    flushSync();
    // A is held while B preloads — no globe mid-swap.
    expect(visible()).toBe('data:image/png;base64,AAAA');
    expect(preloader().getAttribute('src')).toBe('data:image/png;base64,BBBB');
    expect(container.querySelector('[data-icon-name="globe"]')).toBeNull();

    await fireEvent.load(preloader());
    expect(visible()).toBe('data:image/png;base64,BBBB');
  });

  // The spinner stays load-gated (lunma-bookmark-bindings D4): a favicon-only delta
  // carries no `status`, so the row keeps `status: 'complete'` and shows no spinner;
  // only a real load (`status: 'loading'`) shows it.
  test('the spinner is load-gated: complete shows no spinner, loading does', () => {
    const store = makeStore();
    store.state.savedTabs['st-1'] = savedTab({ id: 'st-1' });
    store.state.tabBindings['st-1'] = { 100: 42 };
    store.state.liveTabsById[42] = liveTab({
      tabId: 42,
      status: 'complete',
      favIconUrl: 'data:image/png;base64,AAAA',
    });
    store.state.pinnedBySpace.work = [{ kind: 'tab', id: 'st-1' }];
    const { container } = render(PinnedTabsHarness, {
      props: { store, windowId: 100, spaceId: 'work' },
    });
    expect(container.querySelector('.spin [data-icon-name="loader-circle"]')).toBeNull();

    store.state.liveTabsById[42] = liveTab({
      tabId: 42,
      status: 'loading',
      favIconUrl: 'data:image/png;base64,AAAA',
    });
    flushSync();
    expect(container.querySelector('.spin [data-icon-name="loader-circle"]')).not.toBeNull();
  });
});

describe('PinnedTabs active treatment', () => {
  test('a pinned tab bound to the window-active tab renders active', () => {
    const store = makeStore();
    store.state.savedTabs['st-1'] = savedTab({ id: 'st-1' });
    store.state.tabBindings['st-1'] = { 100: 42 };
    store.state.liveTabsById[42] = liveTab({ tabId: 42, active: true });
    store.state.pinnedBySpace.work = [{ kind: 'tab', id: 'st-1' }];

    const { container } = render(PinnedTabsHarness, {
      props: { store, windowId: 100, spaceId: 'work' },
    });
    const row = container.querySelector('[data-testid="tab-row"]');
    expect(row?.classList.contains('active')).toBe(true);
  });

  test('reactively gains the active treatment when the bound tab becomes active', async () => {
    const store = makeStore();
    store.state.savedTabs['st-1'] = savedTab({ id: 'st-1' });
    store.state.tabBindings['st-1'] = { 100: 42 };
    store.state.liveTabsById[42] = liveTab({ tabId: 42, active: false });
    store.state.pinnedBySpace.work = [{ kind: 'tab', id: 'st-1' }];

    const { container } = render(PinnedTabsHarness, {
      props: { store, windowId: 100, spaceId: 'work' },
    });
    expect(container.querySelector('[data-testid="tab-row"]')?.classList.contains('active')).toBe(
      false,
    );

    store.setActiveTab(100, 42);
    await Promise.resolve();
    expect(container.querySelector('[data-testid="tab-row"]')?.classList.contains('active')).toBe(
      true,
    );
  });

  test('a dormant pinned tab is not active and click dispatches openSavedTab', async () => {
    const store = makeStore();
    store.state.savedTabs['st-1'] = savedTab({ id: 'st-1', currentURL: null });
    store.state.tabBindings['st-1'] = {};
    store.state.pinnedBySpace.work = [{ kind: 'tab', id: 'st-1' }];

    const { container } = render(PinnedTabsHarness, {
      props: { store, windowId: 100, spaceId: 'work' },
    });
    const row = container.querySelector('[data-testid="tab-row"]');
    expect(row?.classList.contains('active')).toBe(false);
    await fireEvent.click(container.querySelector('button.hit') as HTMLButtonElement);
    expect(sendMock).toHaveBeenCalledWith({
      kind: 'openSavedTab',
      payload: { savedTabId: 'st-1', windowId: 100 },
    });
  });
});

describe('PinnedTabs per-window drift (per-window-tab-bindings, ADR 0009)', () => {
  test('renders drift in the window whose bound tab navigated away, not the other', () => {
    const store = makeStore();
    // Same saved tab bound to a different live tab in each window: window 100's
    // tab sits at home (no drift), window 200's has navigated away (drift).
    store.state.savedTabs['st-1'] = savedTab({ id: 'st-1', originalURL: 'https://example.com/' });
    store.state.tabBindings['st-1'] = { 100: 42, 200: 77 };
    store.state.liveTabsById[42] = liveTab({
      tabId: 42,
      windowId: 100,
      url: 'https://example.com/',
    });
    store.state.liveTabsById[77] = liveTab({
      tabId: 77,
      windowId: 200,
      url: 'https://example.com/elsewhere',
    });
    store.state.pinnedBySpace.work = [{ kind: 'tab', id: 'st-1' }];

    // Window 100 surface — bound tab at home → no drift indicator.
    const home = render(PinnedTabsHarness, {
      props: { store, windowId: 100, spaceId: 'work', active: false },
    });
    expect(home.container.querySelector('[data-testid="drift-dot"]')).toBeNull();
    cleanup();

    // Window 200 surface — bound tab drifted → drift indicator shown.
    const drifted = render(PinnedTabsHarness, {
      props: { store, windowId: 200, spaceId: 'work', active: false },
    });
    expect(drifted.container.querySelector('[data-testid="drift-dot"]')).not.toBeNull();
  });

  test('a tab dormant in this window renders neither bound nor drifted', () => {
    const store = makeStore();
    store.state.savedTabs['st-1'] = savedTab({ id: 'st-1', originalURL: 'https://example.com/' });
    // Bound only in window 200; window 100 has no slot → dormant here.
    store.state.tabBindings['st-1'] = { 200: 77 };
    store.state.liveTabsById[77] = liveTab({
      tabId: 77,
      windowId: 200,
      url: 'https://example.com/elsewhere',
    });
    store.state.pinnedBySpace.work = [{ kind: 'tab', id: 'st-1' }];

    const { container } = render(PinnedTabsHarness, {
      props: { store, windowId: 100, spaceId: 'work', active: false },
    });
    expect(container.querySelector('[data-testid="drift-dot"]')).toBeNull();
    expect(container.querySelector('[data-testid="tab-row"]')?.classList.contains('active')).toBe(
      false,
    );
  });
});

describe('PinnedTabs drag dispatch (ADR 0006 Layer 1)', () => {
  test('reordering a pinned row dispatches reorderPinned with the post-drop order', async () => {
    const store = makeStore();
    store.state.savedTabs['st-1'] = savedTab({ id: 'st-1', currentURL: null });
    store.state.savedTabs['st-2'] = savedTab({ id: 'st-2', currentURL: null });
    store.state.tabBindings['st-1'] = {};
    store.state.tabBindings['st-2'] = {};
    store.state.pinnedBySpace.work = [
      { kind: 'tab', id: 'st-1' },
      { kind: 'tab', id: 'st-2' },
    ];

    const { container } = render(PinnedTabsHarness, {
      props: { store, windowId: 100, spaceId: 'work' },
    });
    await Promise.resolve();

    const zone = container.querySelector('[data-testid="pinned-tabs"]') as HTMLElement;
    const rows = container.querySelectorAll('.row-wrap');
    stubRect(zone, 0, 80);
    stubRect(rows[0] as Element, 0, 40); // mid 20
    stubRect(rows[1] as Element, 40, 80); // mid 60

    // Grab row 0 and drag it below row 1 (cursor past both mid-points → index 2).
    await fireEvent.pointerDown(rows[0] as Element, { clientX: 50, clientY: 10, button: 0 });
    window.dispatchEvent(pointer('pointermove', 50, 70)); // past threshold → drag starts
    window.dispatchEvent(pointer('pointermove', 50, 75)); // hover below both rows
    window.dispatchEvent(pointer('pointerup', 50, 75));

    expect(sendMock).toHaveBeenCalledWith({
      kind: 'reorderPinned',
      payload: {
        spaceId: 'work',
        nodes: [
          { kind: 'tab', id: 'st-2' },
          { kind: 'tab', id: 'st-1' },
        ],
      },
    });
  });

  test('releasing a pinned-row drag outside every zone cancels (no reorderPinned)', async () => {
    // cancellable-drag: an outside-all-zones release reports `targetZone: null`, so
    // the reorder consumer's null-guard dispatches nothing and the list is untouched.
    const store = makeStore();
    store.state.savedTabs['st-1'] = savedTab({ id: 'st-1', currentURL: null });
    store.state.savedTabs['st-2'] = savedTab({ id: 'st-2', currentURL: null });
    store.state.tabBindings['st-1'] = {};
    store.state.tabBindings['st-2'] = {};
    store.state.pinnedBySpace.work = [
      { kind: 'tab', id: 'st-1' },
      { kind: 'tab', id: 'st-2' },
    ];

    const { container } = render(PinnedTabsHarness, {
      props: { store, windowId: 100, spaceId: 'work' },
    });
    await Promise.resolve();

    const zone = container.querySelector('[data-testid="pinned-tabs"]') as HTMLElement;
    const rows = container.querySelectorAll('.row-wrap');
    stubRect(zone, 0, 80);
    stubRect(rows[0] as Element, 0, 40);
    stubRect(rows[1] as Element, 40, 80);

    // Grab row 0, then release far outside every registered zone.
    await fireEvent.pointerDown(rows[0] as Element, { clientX: 50, clientY: 10, button: 0 });
    window.dispatchEvent(pointer('pointermove', 50, 30)); // past threshold → drag starts
    window.dispatchEvent(pointer('pointermove', 999, 999)); // outside every zone
    window.dispatchEvent(pointer('pointerup', 999, 999));

    expect(sendMock).not.toHaveBeenCalledWith(expect.objectContaining({ kind: 'reorderPinned' }));
  });

  test('dragging a pinned tab into the favicon strip decouples it (favoriteSavedTab, no optimistic mutate)', async () => {
    const store = makeStore();
    store.state.savedTabs['st-1'] = savedTab({ id: 'st-1', currentURL: null });
    store.state.tabBindings['st-1'] = {};
    store.state.pinnedBySpace.work = [{ kind: 'tab', id: 'st-1' }];

    const { container } = render(PinnedTabsHarness, {
      props: { store, windowId: 100, spaceId: 'work' },
    });
    await Promise.resolve();

    const zone = container.querySelector('[data-testid="pinned-tabs"]') as HTMLElement;
    const rows = container.querySelectorAll('.row-wrap');
    stubRect(zone, 100, 200); // pinned list sits lower down
    stubRect(rows[0] as Element, 100, 140);

    // A global, horizontal `favicon` zone above the pinned list (the strip).
    const favEl = document.createElement('div');
    stubRect(favEl, 0, 44);
    const unregister = drag.registerZone('favicon', { el: favEl, itemEls: () => [], axis: 'x' });

    // Grab the pinned row and drag it up into the favicon strip.
    await fireEvent.pointerDown(rows[0] as Element, { clientX: 50, clientY: 110, button: 0 });
    window.dispatchEvent(pointer('pointermove', 50, 90)); // past threshold → drag starts
    window.dispatchEvent(pointer('pointermove', 50, 20)); // over the favicon zone (0–44)
    window.dispatchEvent(pointer('pointerup', 50, 20));
    unregister();

    expect(sendMock).toHaveBeenCalledWith({
      kind: 'favoriteSavedTab',
      payload: { savedTabId: 'st-1' },
    });
    // No optimistic mutation: the record stays pinned until the broadcast.
    expect(store.state.pinnedBySpace.work).toEqual([{ kind: 'tab', id: 'st-1' }]);
  });
});

describe('PinnedTabs active treatment via broadcast (Object.assign path)', () => {
  test('gains active when a broadcast snapshot flips the bound tab active', async () => {
    const store = makeStore();
    store.state.savedTabs['st-1'] = savedTab({ id: 'st-1' });
    store.state.tabBindings['st-1'] = { 100: 42 };
    store.state.liveTabsById[42] = liveTab({ tabId: 42, active: false });
    store.state.pinnedBySpace.work = [{ kind: 'tab', id: 'st-1' }];

    const { container } = render(PinnedTabsHarness, {
      props: { store, windowId: 100, spaceId: 'work' },
    });
    expect(container.querySelector('[data-testid="tab-row"]')?.classList.contains('active')).toBe(
      false,
    );

    const snapshot = store.snapshot();
    const next = {
      ...snapshot,
      liveTabsById: { 42: { ...snapshot.liveTabsById[42], active: true } },
    };
    Object.assign(store.state, next);
    await Promise.resolve();

    expect(container.querySelector('[data-testid="tab-row"]')?.classList.contains('active')).toBe(
      true,
    );
  });
});

describe('PinnedTabs folders', () => {
  function withFolder(): LunmaStore {
    const store = makeStore();
    store.state.savedTabs['st-1'] = savedTab({ id: 'st-1', currentURL: null });
    store.state.savedTabs['st-2'] = savedTab({ id: 'st-2', currentURL: null });
    store.state.tabBindings['st-1'] = {};
    store.state.tabBindings['st-2'] = {};
    store.state.pinnedBySpace.work = [
      { kind: 'tab', id: 'st-1' },
      {
        kind: 'folder',
        id: 'f1',
        name: 'Reading',
        icon: 'book',
        color: 'blue',
        children: ['st-2'],
      },
    ];
    return store;
  }

  test('renders a folder row; children hidden until expanded', () => {
    const store = withFolder();
    const { container } = render(PinnedTabsHarness, {
      props: { store, windowId: 100, spaceId: 'work' },
    });
    expect(container.querySelector('[data-testid="folder-row"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="folder-children"]')).toBeNull();
  });

  test('the folder Rename action opens an inline field on the row; Enter dispatches renameFolder', async () => {
    const store = withFolder(); // folder f1
    const { container } = render(PinnedTabsHarness, {
      props: { store, windowId: 100, spaceId: 'work' },
    });
    // The folder's actions are a plain kebab `Menu` — NOT a row that composes a
    // TabRow header (which would render a duplicate row: folder name + globe
    // favicon floated right).
    const folderRow = container.querySelector('[data-testid="folder-row"]') as HTMLElement;
    expect(folderRow.querySelector('[data-testid="tab-row"]')).toBeNull();
    expect(folderRow.querySelector('[data-testid="tab-row-menu-trigger"]')).toBeNull();

    // Open the kebab and pick Rename.
    await fireEvent.click(
      folderRow.querySelector('[data-testid="folder-row-menu-trigger"]') as HTMLButtonElement,
    );
    const rename = [...container.querySelectorAll('[data-testid="folder-row-menu-item"]')].find(
      (el) => el.getAttribute('data-menu-id') === 'rename',
    ) as HTMLButtonElement;
    await fireEvent.click(rename);

    // The name becomes an inline field, in place, with the folder glyph still shown.
    const input = container.querySelector(
      '[data-testid="folder-rename-input"]',
    ) as HTMLInputElement;
    expect(input).not.toBeNull();
    expect(container.querySelector('[data-testid="folder-row"] .glyph')).not.toBeNull();
    expect(input.value).toBe('Reading');

    // `bind:value` only updates on an input event, so set the value that way.
    await fireEvent.input(input, { target: { value: 'Recipes' } });
    await fireEvent.keyDown(input, { key: 'Enter' });
    expect(sendMock).toHaveBeenCalledWith({
      kind: 'renameFolder',
      payload: { spaceId: 'work', folderId: 'f1', name: 'Recipes' },
    });
  });

  test('toggling a folder reveals its children (per-window, ephemeral)', async () => {
    const store = withFolder();
    const { container } = render(PinnedTabsHarness, {
      props: { store, windowId: 100, spaceId: 'work' },
    });
    await fireEvent.click(
      container.querySelector('[data-testid="folder-row"] .hit') as HTMLElement,
    );
    expect(container.querySelector('[data-testid="folder-children"]')).not.toBeNull();
  });

  test('the folder actions menu is a kebab, not a duplicate tab row', () => {
    const store = withFolder();
    const { container } = render(PinnedTabsHarness, {
      props: { store, windowId: 100, spaceId: 'work' },
    });
    const folderRow = container.querySelector('[data-testid="folder-row"]') as HTMLElement;
    // The folder trailing is a plain Menu kebab — it must NOT compose a TabRow
    // (which would paint a second name + globe favicon on the right).
    expect(folderRow.querySelector('[data-testid="folder-row-menu-trigger"]')).not.toBeNull();
    expect(folderRow.querySelector('[data-testid="tab-row"]')).toBeNull();
    expect(folderRow.querySelector('[data-testid="tab-row-menu-trigger"]')).toBeNull();
  });

  test('a folder child row reaches its actions menu (Unpin dispatches)', async () => {
    const store = withFolder(); // folder f1 has child st-2
    const { container } = render(PinnedTabsHarness, {
      props: { store, windowId: 100, spaceId: 'work' },
    });
    // Expand the folder so its children render.
    await fireEvent.click(
      container.querySelector('[data-testid="folder-row"] .hit') as HTMLElement,
    );
    const childArea = container.querySelector('[data-testid="folder-children"]') as HTMLElement;
    expect(childArea).not.toBeNull();

    // Right-click the child row to open the shared action menu, then pick Unpin.
    (childArea.querySelector('.child-wrap') as HTMLElement).dispatchEvent(
      new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 5, clientY: 5 }),
    );
    await Promise.resolve();
    const unpin = [...container.querySelectorAll('[data-testid="pinned-menu-item"]')].find(
      (el) => el.getAttribute('data-menu-id') === 'unpin',
    ) as HTMLButtonElement;
    expect(unpin).toBeTruthy();
    await fireEvent.click(unpin);

    expect(sendMock).toHaveBeenCalledWith({
      kind: 'unpinTab',
      payload: { savedTabId: 'st-2', windowId: 100 },
    });
  });

  test('clicking a folder child row focuses/opens that tab', async () => {
    const store = withFolder(); // child st-2 is dormant (currentURL null)
    const { container } = render(PinnedTabsHarness, {
      props: { store, windowId: 100, spaceId: 'work' },
    });
    await fireEvent.click(
      container.querySelector('[data-testid="folder-row"] .hit') as HTMLElement,
    );
    const childArea = container.querySelector('[data-testid="folder-children"]') as HTMLElement;
    await fireEvent.click(childArea.querySelector('button.hit') as HTMLButtonElement);
    expect(sendMock).toHaveBeenCalledWith({
      kind: 'openSavedTab',
      payload: { savedTabId: 'st-2', windowId: 100 },
    });
  });

  // The "New folder" trigger moved from a full-width row in PinnedTabs to the
  // pinned-header kebab Menu (owned by App). createFolder-from-the-header is
  // covered in App.test.ts; the post-create inline-rename arming PinnedTabs
  // consumes is covered by the temp→tab fold test below.

  test('reordering a top-level tab past a folder preserves the folder node', async () => {
    const store = withFolder();
    const { container } = render(PinnedTabsHarness, {
      props: { store, windowId: 100, spaceId: 'work' },
    });
    await Promise.resolve();
    const restore = installLayout({ 'pinned-tabs': [0, 80], 'st-1': [0, 40], f1: [40, 80] });
    const rows = container.querySelectorAll('.row-wrap');

    // Drag the tab (row 0) below the folder (row 1) → index 2.
    await fireEvent.pointerDown(rows[0] as Element, { clientX: 50, clientY: 10, button: 0 });
    window.dispatchEvent(pointer('pointermove', 50, 78)); // below both rows (bottom gutter)
    window.dispatchEvent(pointer('pointermove', 50, 79));
    window.dispatchEvent(pointer('pointerup', 50, 79));
    restore();

    expect(sendMock).toHaveBeenCalledWith({
      kind: 'reorderPinned',
      payload: {
        spaceId: 'work',
        nodes: [
          {
            kind: 'folder',
            id: 'f1',
            name: 'Reading',
            icon: 'book',
            color: 'blue',
            children: ['st-2'],
          },
          { kind: 'tab', id: 'st-1' },
        ],
      },
    });
  });

  test('dragging a tab onto a collapsed folder moves it into the folder', async () => {
    const store = withFolder(); // row0 = tab st-1, row1 = folder f1 [st-2]
    const { container } = render(PinnedTabsHarness, {
      props: { store, windowId: 100, spaceId: 'work' },
    });
    await Promise.resolve();
    const restore = installLayout({ 'pinned-tabs': [0, 80], 'st-1': [0, 40], f1: [40, 80] });
    const rows = container.querySelectorAll('.row-wrap');

    await fireEvent.pointerDown(rows[0] as Element, { clientX: 50, clientY: 10, button: 0 });
    window.dispatchEvent(pointer('pointermove', 50, 30));
    window.dispatchEvent(pointer('pointermove', 50, 60)); // onto the folder (band 50–70)
    window.dispatchEvent(pointer('pointerup', 50, 60));
    restore();

    expect(sendMock).toHaveBeenCalledWith({
      kind: 'reorderPinned',
      payload: {
        spaceId: 'work',
        nodes: [
          {
            kind: 'folder',
            id: 'f1',
            name: 'Reading',
            icon: 'book',
            color: 'blue',
            children: ['st-2', 'st-1'],
          },
        ],
      },
    });
  });

  test('dragging a tab onto another tab dispatches createFolderFromTabs', async () => {
    const store = makeStore();
    for (const id of ['st-1', 'st-2']) {
      store.state.savedTabs[id] = savedTab({ id, currentURL: null });
      store.state.tabBindings[id] = {};
    }
    store.state.pinnedBySpace.work = [
      { kind: 'tab', id: 'st-1' },
      { kind: 'tab', id: 'st-2' },
    ];
    const { container } = render(PinnedTabsHarness, {
      props: { store, windowId: 100, spaceId: 'work' },
    });
    await Promise.resolve();
    const restore = installLayout({ 'pinned-tabs': [0, 80], 'st-1': [0, 40], 'st-2': [40, 80] });
    const rows = container.querySelectorAll('.row-wrap');

    await fireEvent.pointerDown(rows[0] as Element, { clientX: 50, clientY: 10, button: 0 });
    window.dispatchEvent(pointer('pointermove', 50, 30));
    window.dispatchEvent(pointer('pointermove', 50, 60)); // onto st-2 (band 50–70)
    window.dispatchEvent(pointer('pointerup', 50, 60));
    restore();

    expect(sendMock).toHaveBeenCalledWith({
      kind: 'createFolderFromTabs',
      payload: { spaceId: 'work', tabIdA: 'st-1', tabIdB: 'st-2', index: 1 },
    });
  });

  test('folding two pinned tabs opens inline rename on the new folder', async () => {
    const store = makeStore();
    for (const id of ['st-1', 'st-2']) {
      store.state.savedTabs[id] = savedTab({ id, currentURL: null });
      store.state.tabBindings[id] = {};
    }
    store.state.pinnedBySpace.work = [
      { kind: 'tab', id: 'st-1' },
      { kind: 'tab', id: 'st-2' },
    ];
    const { container } = render(PinnedTabsHarness, {
      props: { store, windowId: 100, spaceId: 'work' },
    });
    await Promise.resolve();
    const restore = installLayout({ 'pinned-tabs': [0, 80], 'st-1': [0, 40], 'st-2': [40, 80] });
    const rows = container.querySelectorAll('.row-wrap');

    await fireEvent.pointerDown(rows[0] as Element, { clientX: 50, clientY: 10, button: 0 });
    window.dispatchEvent(pointer('pointermove', 50, 30));
    window.dispatchEvent(pointer('pointermove', 50, 60)); // onto st-2 (band 50–70)
    window.dispatchEvent(pointer('pointerup', 50, 60));
    restore();
    expect(sendMock).toHaveBeenCalledWith({
      kind: 'createFolderFromTabs',
      payload: { spaceId: 'work', tabIdA: 'st-1', tabIdB: 'st-2', index: 1 },
    });

    // Simulate the SW broadcast that actually creates the folder.
    store.state.pinnedBySpace.work = [
      {
        kind: 'folder',
        id: 'f-new',
        name: 'New Folder',
        icon: 'folder',
        color: 'gray',
        children: ['st-2', 'st-1'],
      },
    ];
    await Promise.resolve();
    // The new folder opened straight into inline rename.
    expect(container.querySelector('[data-testid="folder-rename-input"]')).not.toBeNull();
  });

  test('a temp→tab fold arm (active slide) opens rename on the new folder and consumes the flag', async () => {
    const store = makeStore();
    store.state.pinnedBySpace.work = [];
    const { container } = render(PinnedTabsHarness, {
      props: { store, windowId: 100, spaceId: 'work', active: true },
    });
    await Promise.resolve();
    // Arm as TempTabs would after folding a temp tab onto a pinned tab.
    store.setAutoRenameNextFolder(100, true);
    await Promise.resolve();
    // Arming alone (no folder yet) must NOT prematurely consume the flag.
    expect((store.state as unknown as SidebarLocalState).autoRenameNextFolderByWindow?.[100]).toBe(
      true,
    );

    // The SW broadcast mints the folder of the two.
    store.state.savedTabs['st-1'] = savedTab({ id: 'st-1', currentURL: null });
    store.state.savedTabs['st-2'] = savedTab({ id: 'st-2', currentURL: null });
    store.state.tabBindings['st-1'] = {};
    store.state.tabBindings['st-2'] = {};
    store.state.pinnedBySpace.work = [
      {
        kind: 'folder',
        id: 'f-new',
        name: 'New Folder',
        icon: 'folder',
        color: 'gray',
        children: ['st-2', 'st-1'],
      },
    ];
    await Promise.resolve();
    expect(container.querySelector('[data-testid="folder-rename-input"]')).not.toBeNull();
    // The one-shot flag is consumed once the rename opens.
    expect((store.state as unknown as SidebarLocalState).autoRenameNextFolderByWindow?.[100]).toBe(
      false,
    );
  });

  test('an armed fold flag is ignored on a non-active slide (no rename, flag retained)', async () => {
    const store = makeStore();
    store.state.pinnedBySpace.work = [];
    const { container } = render(PinnedTabsHarness, {
      props: { store, windowId: 100, spaceId: 'work', active: false },
    });
    await Promise.resolve();
    store.setAutoRenameNextFolder(100, true);
    store.state.savedTabs['st-2'] = savedTab({ id: 'st-2', currentURL: null });
    store.state.tabBindings['st-2'] = {};
    store.state.pinnedBySpace.work = [
      {
        kind: 'folder',
        id: 'f-new',
        name: 'New Folder',
        icon: 'folder',
        color: 'gray',
        children: ['st-2'],
      },
    ];
    await Promise.resolve();
    // Off-screen slide must not steal the rename, and must not consume the flag.
    expect(container.querySelector('[data-testid="folder-rename-input"]')).toBeNull();
    expect((store.state as unknown as SidebarLocalState).autoRenameNextFolderByWindow?.[100]).toBe(
      true,
    );
  });

  test('dragging a folder onto the temporary zone bounces (no dispatch)', async () => {
    const store = withFolder();
    const { container } = render(PinnedTabsHarness, {
      props: { store, windowId: 100, spaceId: 'work' },
    });
    await Promise.resolve();
    const rows = container.querySelectorAll('.row-wrap');

    // A connected temp zone below the pinned list (the controller's isConnected
    // guard ignores detached zones).
    const tempEl = document.createElement('div');
    tempEl.setAttribute('data-testid', 'temp');
    document.body.appendChild(tempEl);
    const restore = installLayout({
      'pinned-tabs': [0, 80],
      'st-1': [0, 40],
      f1: [40, 80],
      temp: [100, 200],
    });
    const unregister = drag.registerZone('temp:100', { el: tempEl, itemEls: () => [] });

    // Grab the folder row (row 1) and drop it in the temp zone.
    await fireEvent.pointerDown(rows[1] as Element, { clientX: 50, clientY: 50, button: 0 });
    window.dispatchEvent(pointer('pointermove', 50, 70));
    window.dispatchEvent(pointer('pointermove', 50, 150)); // into temp
    window.dispatchEvent(pointer('pointerup', 50, 150));
    restore();
    unregister();
    tempEl.remove();

    expect(sendMock).not.toHaveBeenCalled();
  });
});

describe('PinnedTabs right-click menu + hover close', () => {
  /** A pinned row bound to a live tab (42) in window 100. */
  function boundStore(extra?: Partial<SavedTab>, live?: Partial<LiveTab>): LunmaStore {
    const store = makeStore();
    store.state.savedTabs['st-1'] = savedTab({ id: 'st-1', ...extra });
    store.state.tabBindings['st-1'] = { 100: 42 };
    store.state.liveTabsById[42] = liveTab({ tabId: 42, ...live });
    store.state.pinnedBySpace.work = [{ kind: 'tab', id: 'st-1' }];
    return store;
  }

  async function openMenu(container: HTMLElement, rowId = 'st-1'): Promise<HTMLButtonElement[]> {
    const wrap = container.querySelector(`.row-wrap[data-row-id="${rowId}"]`) as HTMLElement;
    wrap.dispatchEvent(
      new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 12, clientY: 18 }),
    );
    await Promise.resolve();
    return [
      ...container.querySelectorAll('[data-testid="pinned-menu-item"]'),
    ] as HTMLButtonElement[];
  }

  const byId = (items: HTMLButtonElement[], id: string): HTMLButtonElement | undefined =>
    items.find((el) => el.getAttribute('data-menu-id') === id);

  test('a bound row shows the ✕ close; activating it closes the bound tab without focusing', async () => {
    const store = boundStore();
    const { container } = render(PinnedTabsHarness, {
      props: { store, windowId: 100, spaceId: 'work' },
    });
    const close = container.querySelector('[data-testid="pinned-close"]') as HTMLButtonElement;
    expect(close).not.toBeNull();
    await fireEvent.click(close);
    // Closes the bound LIVE tab (→ dormant record), never focuses/switches.
    expect(sendMock).toHaveBeenCalledWith({ kind: 'closeTab', payload: { tabId: 42 } });
    expect(sendMock).not.toHaveBeenCalledWith({
      kind: 'focusSavedTab',
      payload: { savedTabId: 'st-1', windowId: 100 },
    });
  });

  test('a dormant row shows no ✕ close (Delete/Unpin stay in the menu)', () => {
    const store = makeStore();
    store.state.savedTabs['st-1'] = savedTab({ id: 'st-1', currentURL: null });
    store.state.tabBindings['st-1'] = {};
    store.state.pinnedBySpace.work = [{ kind: 'tab', id: 'st-1' }];
    const { container } = render(PinnedTabsHarness, {
      props: { store, windowId: 100, spaceId: 'work' },
    });
    expect(container.querySelector('[data-testid="pinned-close"]')).toBeNull();
  });

  test('right-click opens the menu at the cursor, suppresses the native menu, and does not focus', async () => {
    const store = boundStore();
    const { container } = render(PinnedTabsHarness, {
      props: { store, windowId: 100, spaceId: 'work' },
    });
    const wrap = container.querySelector('.row-wrap[data-row-id="st-1"]') as HTMLElement;
    const ev = new MouseEvent('contextmenu', {
      bubbles: true,
      cancelable: true,
      clientX: 12,
      clientY: 18,
    });
    wrap.dispatchEvent(ev);
    await Promise.resolve();
    expect(ev.defaultPrevented).toBe(true);
    const menu = container.querySelector('[data-testid="pinned-menu"]') as HTMLElement;
    expect(menu).not.toBeNull();
    expect(menu.style.left).toBe('12px');
    expect(menu.style.top).toBe('18px');
    expect(sendMock).not.toHaveBeenCalledWith({
      kind: 'focusSavedTab',
      payload: { savedTabId: 'st-1', windowId: 100 },
    });
  });

  test('the menu Unpin dispatches unpinTab', async () => {
    const store = boundStore();
    const { container } = render(PinnedTabsHarness, {
      props: { store, windowId: 100, spaceId: 'work' },
    });
    const items = await openMenu(container);
    await fireEvent.click(byId(items, 'unpin') as HTMLButtonElement);
    expect(sendMock).toHaveBeenCalledWith({
      kind: 'unpinTab',
      payload: { savedTabId: 'st-1', windowId: 100 },
    });
  });

  test('Go home / Make this home appear only when the bound tab has drifted', async () => {
    const stay = boundStore(
      { originalURL: 'https://example.com/' },
      { url: 'https://example.com/' },
    );
    const r1 = render(PinnedTabsHarness, {
      props: { store: stay, windowId: 100, spaceId: 'work' },
    });
    let items = await openMenu(r1.container);
    expect(byId(items, 'go-home')).toBeUndefined();
    expect(byId(items, 'make-home')).toBeUndefined();
    cleanup();
    drag.__resetForTest();

    const drift = boundStore(
      { originalURL: 'https://example.com/' },
      { url: 'https://example.com/elsewhere' },
    );
    const r2 = render(PinnedTabsHarness, {
      props: { store: drift, windowId: 100, spaceId: 'work' },
    });
    items = await openMenu(r2.container);
    expect(byId(items, 'go-home')).toBeTruthy();
    expect(byId(items, 'make-home')).toBeTruthy();
  });

  test('Delete is a two-step confirm', async () => {
    const store = boundStore();
    const { container } = render(PinnedTabsHarness, {
      props: { store, windowId: 100, spaceId: 'work' },
    });
    const items = await openMenu(container);
    await fireEvent.click(byId(items, 'delete') as HTMLButtonElement);
    // keepOpen — not dispatched yet; the entry becomes a confirm affordance.
    expect(sendMock).not.toHaveBeenCalledWith({
      kind: 'deleteSavedTab',
      payload: { savedTabId: 'st-1' },
    });
    expect(container.querySelector('[data-menu-id="delete"] .label')?.textContent).toBe(
      'Delete — confirm',
    );
    await fireEvent.click(container.querySelector('[data-menu-id="delete"]') as HTMLButtonElement);
    expect(sendMock).toHaveBeenCalledWith({
      kind: 'deleteSavedTab',
      payload: { savedTabId: 'st-1' },
    });
  });

  test('Rename opens the inline editor; Reset name shows only when a custom name is set', async () => {
    const store = boundStore({ customTitle: 'Custom' });
    const { container } = render(PinnedTabsHarness, {
      props: { store, windowId: 100, spaceId: 'work' },
    });
    const items = await openMenu(container);
    expect(byId(items, 'reset-name')).toBeTruthy();
    await fireEvent.click(byId(items, 'rename') as HTMLButtonElement);
    expect(container.querySelector('[data-testid="tab-rename-input"]')).not.toBeNull();
  });

  test('Reset name is absent when the tab has no custom name', async () => {
    const store = boundStore();
    const { container } = render(PinnedTabsHarness, {
      props: { store, windowId: 100, spaceId: 'work' },
    });
    const items = await openMenu(container);
    expect(byId(items, 'reset-name')).toBeUndefined();
  });

  test('"Lock to its site…" drills into the boundary editor and dispatches setTabBoundary', async () => {
    const store = boundStore();
    const { container } = render(PinnedTabsHarness, {
      props: { store, windowId: 100, spaceId: 'work' },
    });
    const items = await openMenu(container);
    const lock = byId(items, 'keep-on-site') as HTMLButtonElement;
    // Advertises its drill-in via the submenu affordance.
    expect(lock.getAttribute('aria-haspopup')).toBe('menu');
    await fireEvent.click(lock);
    // Drilled in: the back affordance + the boundary editor render.
    expect(container.querySelector('[data-testid="pinned-menu-back"]')).not.toBeNull();
    const editor = container.querySelector('[data-testid="tab-boundary-editor"]') as HTMLElement;
    expect(editor).not.toBeNull();
    // Selecting a mode (Off) dispatches setTabBoundary.
    const off = editor.querySelector('input[type="radio"][value="off"]') as HTMLInputElement;
    await fireEvent.click(off);
    expect(sendMock).toHaveBeenCalledWith({
      kind: 'setTabBoundary',
      payload: { savedTabId: 'st-1', boundary: { mode: 'off' } },
    });
  });
});
