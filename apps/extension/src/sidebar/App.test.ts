import { cleanup, fireEvent, render } from '@testing-library/svelte';
import { flushSync } from 'svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { LunmaStore } from '../shared/store.svelte';
import type { SidebarLocalState } from '../shared/types';
import AppHarness from './App.test.harness.svelte';

function makeTouch(clientX: number, clientY: number, identifier = 0): Touch {
  return { clientX, clientY, identifier } as unknown as Touch;
}
function touchEvent(type: string, touches: Touch[], changed?: Touch[]): TouchEvent {
  const evt = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperty(evt, 'touches', { value: touches });
  Object.defineProperty(evt, 'changedTouches', { value: changed ?? touches });
  return evt as unknown as TouchEvent;
}
function wheelEvent(deltaX: number, deltaY: number): WheelEvent {
  const evt = new Event('wheel', { bubbles: true, cancelable: true });
  Object.defineProperty(evt, 'deltaX', { value: deltaX });
  Object.defineProperty(evt, 'deltaY', { value: deltaY });
  return evt as unknown as WheelEvent;
}
/** Parse the px x-offset out of the track's imperative `translate3d(Xpx, 0, 0)`. */
function parseTx(el: HTMLElement): number {
  const m = /translate3d\((-?\d+(?:\.\d+)?)px/.exec(el.style.transform);
  return m?.[1] === undefined ? Number.NaN : Number.parseFloat(m[1]);
}

const { sendMock } = vi.hoisted(() => ({ sendMock: vi.fn(() => Promise.resolve()) }));
// Both the awaited `bus.send` (clearTempTabs confirmation flow) and the
// fire-and-forget `dispatch` route to the same spy, so existing call assertions
// hold whichever path the surface uses.
vi.mock('../shared/bus', () => ({ bus: { send: sendMock }, dispatch: sendMock }));

// Backing store for the `chrome.storage.sync` mock, reset per test. Drives the
// first-run-notice gating (settings: `autoArchiveEnabled`/`autoArchiveIdleMinutes`;
// onboarding: `autoArchiveNoticeDismissed`).
let syncData: Record<string, unknown> = {};
// Spies for the options-deep-link path ("Recently archived" / "Manage in settings").
let tabsCreate: ReturnType<typeof vi.fn>;

function installChrome(): void {
  tabsCreate = vi.fn(async () => undefined);
  (globalThis as unknown as { chrome: unknown }).chrome = {
    runtime: {
      sendMessage: vi.fn(async () => undefined),
      onMessage: { addListener: vi.fn(), removeListener: vi.fn() },
      openOptionsPage: vi.fn(),
      getURL: (path: string) => `chrome-extension://abc/${path}`,
    },
    storage: {
      sync: {
        get: vi.fn(async (key: string | null) => {
          if (key === null) return { ...syncData };
          const value = syncData[key];
          return value === undefined ? {} : { [key]: value };
        }),
        set: vi.fn(async (items: Record<string, unknown>) => {
          Object.assign(syncData, items);
        }),
      },
      onChanged: { addListener: vi.fn(), removeListener: vi.fn() },
    },
    tabs: { query: vi.fn(async () => []), create: tabsCreate, update: vi.fn() },
    windows: { update: vi.fn() },
  };
}

beforeEach(() => {
  syncData = {};
  installChrome();
  sendMock.mockClear();
});

afterEach(() => {
  // Unmount BEFORE removing `chrome`: the sidebar's `watchSettings` subscription
  // calls `chrome.storage.onChanged.removeListener` on destroy.
  cleanup();
  delete (globalThis as unknown as { chrome?: unknown }).chrome;
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function makeStore(active: 'blue' | 'orange' | null): LunmaStore {
  const store = new LunmaStore();
  store.state.spaces.push({
    id: 'work',
    name: 'Work',
    color: 'blue',
    icon: 'star',
  });
  store.state.spaces.push({
    id: 'reading',
    name: 'Reading',
    color: 'orange',
    icon: 'book',
  });
  if (active === 'blue') store.state.activeSpaceByWindow[1] = 'work';
  if (active === 'orange') store.state.activeSpaceByWindow[1] = 'reading';
  if (active === null) store.state.activeSpaceByWindow[1] = null;
  return store;
}

/** A store with `n` Spaces (`s0…s{n-1}`), active one at `activeIdx`. */
function makeStoreN(n: number, activeIdx: number): LunmaStore {
  const store = new LunmaStore();
  for (let i = 0; i < n; i++) {
    store.state.spaces.push({
      id: `s${i}`,
      name: `Space ${i}`,
      color: i % 2 === 0 ? 'blue' : 'orange',
      icon: 'star',
    });
  }
  store.state.activeSpaceByWindow[1] = `s${activeIdx}`;
  return store;
}

describe('App', () => {
  test('mounts with the active Space hue inline and the immersive data-tint="vivid" default', () => {
    const { container } = render(AppHarness, { props: { store: makeStore('blue'), windowId: 1 } });
    const sidebar = container.querySelector('[data-testid="sidebar"]') as HTMLElement;
    expect(sidebar).not.toBeNull();
    // Immersive by default — the `tint` prop defaults to `vivid` (main.ts seeds
    // it from the setting and updates it live).
    expect(sidebar.getAttribute('data-tint')).toBe('vivid');
    expect(sidebar.style.getPropertyValue('--space-h')).toBe('252');
  });

  test('mounts the global favicon strip in the top slot and no longer the search pill', () => {
    const { container } = render(AppHarness, { props: { store: makeStore('blue'), windowId: 1 } });
    // The strip replaces the SearchTrigger pill in the freed top slot…
    const strip = container.querySelector('[data-testid="favicon-row"]') as HTMLElement;
    expect(strip).not.toBeNull();
    // …and is a SIBLING of the carousel viewport, above it (it never swipes).
    const stage = container.querySelector('[data-testid="sidebar-content"]') as HTMLElement;
    expect(strip.parentElement).toBe(stage.parentElement);
    expect(strip.compareDocumentPosition(stage) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    // The search pill is gone.
    expect(container.querySelector('[data-testid="search-trigger"]')).toBeNull();
  });

  test('clicking the top search bar opens the new-tab launcher (launcher-sidebar-focus-reach)', async () => {
    const { container } = render(AppHarness, { props: { store: makeStore('blue'), windowId: 1 } });
    // The launcher entry is the restored top search bar (trigger mode), not a switcher button.
    await fireEvent.click(container.querySelector('[data-testid="sidebar-search"]') as HTMLElement);
    const sendMessage = (
      globalThis as unknown as { chrome: { runtime: { sendMessage: ReturnType<typeof vi.fn> } } }
    ).chrome.runtime.sendMessage;
    expect(sendMessage).toHaveBeenCalledWith({ type: 'lunma/open-newtab-launcher', windowId: 1 });
  });

  test('renders an aria-hidden Aurora backdrop behind the content', () => {
    const { container } = render(AppHarness, { props: { store: makeStore('blue'), windowId: 1 } });
    const aurora = container.querySelector('[data-testid="aurora"]');
    expect(aurora).not.toBeNull();
    // Ambient, decorative, never announced.
    expect(aurora?.getAttribute('aria-hidden')).toBe('true');
  });

  test('reflects the tint prop onto .sidebar and updates when it changes', async () => {
    const store = makeStore('blue');
    const { container, rerender } = render(AppHarness, {
      props: { store, windowId: 1, tint: 'subtle' },
    });
    const sidebar = container.querySelector('[data-testid="sidebar"]') as HTMLElement;
    expect(sidebar.getAttribute('data-tint')).toBe('subtle');
    // main.ts re-applies live by mutating this attribute; the prop drives first
    // paint, and a prop change must flow straight through to data-tint.
    await rerender({ store, windowId: 1, tint: 'standard' });
    expect(sidebar.getAttribute('data-tint')).toBe('standard');
  });

  test('each slide shows the Space-name pinned header, a divider, and a New Tab row', () => {
    // The "Temporary" header is gone. Each slide now has ONE section header (the
    // pinned one, showing the Space name) + a divider + a New Tab row.
    // A favorite is seeded so the favicon row is non-empty — otherwise the fresh-Space
    // welcome would replace the favorites placeholder AND suppress the per-area pinned
    // empty rows (sidebar-firstrun-options-polish; that case has its own test below).
    const store = makeStore('blue');
    store.state.faviconRow = ['fav'];
    store.state.savedTabs.fav = {
      id: 'fav',
      spaceId: null,
      title: 'Fav',
      originalURL: 'https://fav/',
      currentURL: null,
    };
    const { container } = render(AppHarness, { props: { store, windowId: 1 } });
    expect(container.querySelectorAll('[data-testid="section-header"]')).toHaveLength(2);
    expect(container.querySelectorAll('[data-testid="divider"]')).toHaveLength(2);
    expect(container.querySelectorAll('[data-testid="row-button"]')).toHaveLength(2);
    // Only pinned empty states remain (no temp empty-state copy).
    expect(container.querySelectorAll('[data-testid="empty-state"]')).toHaveLength(2);

    const workSlide = container.querySelector('[data-space-id="work"]') as HTMLElement;
    expect(workSlide.textContent).toContain('Work'); // pinned header = Space name
    expect(workSlide.textContent).toContain('No pinned tabs yet.');
    expect(workSlide.textContent).toContain('New Tab');
    expect(workSlide.textContent).not.toContain('Temporary');
    expect(workSlide.textContent).not.toContain('No temporary tabs.');
    // No temp tabs → no Clear action.
    expect(workSlide.textContent).not.toContain('Clear');
  });

  test('both favorites and pinned empty → the consolidated welcome, no per-area empty states', () => {
    // A fresh start (sidebar-firstrun-options-polish): empty favicon row AND the active
    // Space has zero pinned bookmarks → ONE welcome in the fixed grid region, with the
    // grid placeholder AND the pinned empty-state row both suppressed.
    const { container } = render(AppHarness, { props: { store: makeStore('blue'), windowId: 1 } });
    expect(container.querySelector('[data-testid="sidebar-welcome"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="favicon-empty"]')).toBeNull();
    // The active slide's pinned empty-state row is suppressed (the header stays).
    const workSlide = container.querySelector('[data-space-id="work"]') as HTMLElement;
    expect(workSlide.textContent).not.toContain('No pinned tabs yet.');
    expect(workSlide.textContent).toContain('Work'); // the pinned header remains
  });

  test('clicking New Tab dispatches newTab carrying the panel Space', async () => {
    const { container } = render(AppHarness, { props: { store: makeStore('blue'), windowId: 1 } });
    const workSlide = container.querySelector('[data-space-id="work"]') as HTMLElement;
    const newTab = workSlide.querySelector('[data-testid="row-button"]') as HTMLButtonElement;
    await fireEvent.click(newTab);
    expect(sendMock).toHaveBeenCalledWith({
      kind: 'newTab',
      payload: { windowId: 1, spaceId: 'work' },
    });
  });

  test('the pinned-header New-folder menu dispatches createFolder and arms the rename', async () => {
    const store = makeStore('blue');
    const { container } = render(AppHarness, { props: { store, windowId: 1 } });
    const workSlide = container.querySelector('[data-space-id="work"]') as HTMLElement;
    // Open the pinned header's kebab — the RowMenu morph (same primitive the tab
    // + folder rows use), on the header's trailing edge, no count.
    const trigger = workSlide.querySelector(
      '[data-testid="section-header"] [data-testid="section-header-menu-trigger"]',
    ) as HTMLButtonElement;
    expect(trigger).not.toBeNull();
    await fireEvent.click(trigger);
    const item = [...workSlide.querySelectorAll('[data-testid="section-header-menu-item"]')].find(
      (el) => el.getAttribute('data-menu-id') === 'new-folder',
    ) as HTMLButtonElement;
    expect(item).not.toBeNull();
    expect(item.textContent).toContain('New folder');
    await fireEvent.click(item);
    expect(sendMock).toHaveBeenCalledWith({ kind: 'createFolder', payload: { spaceId: 'work' } });
    // App arms the active PinnedTabs (the cross-surface bridge) so the freshly
    // created folder opens straight into inline rename — the "create → name it"
    // flow is preserved even though the trigger moved out of PinnedTabs.
    expect((store.state as unknown as SidebarLocalState).autoRenameNextFolderByWindow?.[1]).toBe(
      true,
    );
  });

  test('Clear shows only with temp tabs and dispatches clearTempTabs carrying the panel Space', async () => {
    const store = makeStore('blue');
    store.state.spaceInstancesByWindow[1] = {
      work: { spaceId: 'work', groupId: 1, tempTabIds: [5], tempTabTitles: {} },
    };
    store.state.liveTabsById[5] = {
      tabId: 5,
      windowId: 1,
      title: 'A temp tab',
      url: 'https://example.com/',
      active: true,
      status: 'complete',
    };
    const { container } = render(AppHarness, { props: { store, windowId: 1 } });
    const workSlide = container.querySelector('[data-space-id="work"]') as HTMLElement;
    const clear = workSlide.querySelector('[data-testid="divider"] button') as HTMLButtonElement;
    expect(clear).not.toBeNull();
    await fireEvent.click(clear);
    expect(sendMock).toHaveBeenCalledWith({
      kind: 'clearTempTabs',
      payload: { windowId: 1, spaceId: 'work' },
    });
  });

  test('New Tab is live on every slide and targets its own Space (§9 fully-live)', async () => {
    // Reverses the old "active-slide only" rule: the off-centre slide's New Tab is
    // enabled and dispatches newTab carrying THAT slide's Space.
    const { container } = render(AppHarness, { props: { store: makeStore('blue'), windowId: 1 } });
    const readingSlide = container.querySelector('[data-space-id="reading"]') as HTMLElement;
    const newTab = readingSlide.querySelector('[data-testid="row-button"]') as HTMLButtonElement;
    expect(newTab.disabled).toBe(false);
    await fireEvent.click(newTab);
    expect(sendMock).toHaveBeenCalledWith({
      kind: 'newTab',
      payload: { windowId: 1, spaceId: 'reading' },
    });
  });

  test('a non-active slide pre-renders its own temp list and a Clear that targets that Space', async () => {
    // "reading" is the off-centre slide; give IT (not the active Space) temp tabs.
    const store = makeStore('blue');
    store.state.spaceInstancesByWindow[1] = {
      reading: { spaceId: 'reading', groupId: 2, tempTabIds: [9], tempTabTitles: {} },
    };
    store.state.liveTabsById[9] = {
      tabId: 9,
      windowId: 1,
      title: 'A reading temp tab',
      url: 'https://example.org/',
      active: false,
      status: 'complete',
    };
    const { container } = render(AppHarness, { props: { store, windowId: 1 } });
    const readingSlide = container.querySelector('[data-space-id="reading"]') as HTMLElement;
    // The non-active panel renders its OWN temp list already populated (no
    // mid-settle mount), even though it is not centred.
    expect(readingSlide.querySelector('[data-testid="temp-tabs"]')).not.toBeNull();
    expect(readingSlide.querySelector('[data-testid="tab-row"]')).not.toBeNull();
    // And its Clear targets its own Space.
    const clear = readingSlide.querySelector('[data-testid="divider"] button') as HTMLButtonElement;
    expect(clear).not.toBeNull();
    await fireEvent.click(clear);
    expect(sendMock).toHaveBeenCalledWith({
      kind: 'clearTempTabs',
      payload: { windowId: 1, spaceId: 'reading' },
    });
  });

  test('renders the Temporary list when the active Space has temp tabs', () => {
    const store = makeStore('blue');
    store.state.spaceInstancesByWindow[1] = {
      work: {
        spaceId: 'work',
        groupId: 1,
        tempTabIds: [5],
        tempTabTitles: {},
      },
    };
    store.state.tabLastActivity = { 5: 1 };
    store.state.liveTabsById[5] = {
      tabId: 5,
      windowId: 1,
      title: 'A temp tab',
      url: 'https://example.com/',
      active: true,
      status: 'complete',
    };
    const { container } = render(AppHarness, { props: { store, windowId: 1 } });
    const workSlide = container.querySelector('[data-space-id="work"]') as HTMLElement;
    expect(workSlide.querySelector('[data-testid="temp-tabs"]')).not.toBeNull();
    expect(workSlide.textContent).not.toContain('No temporary tabs.');
    // The New Tab row sits above the list; the temp row renders below it.
    expect(workSlide.querySelector('[data-testid="row-button"]')).not.toBeNull();
    expect(workSlide.querySelector('[data-testid="tab-row"]')).not.toBeNull();
  });

  test('hides section headers and empty states when no active Space', () => {
    const { container } = render(AppHarness, { props: { store: makeStore(null), windowId: 1 } });
    expect(container.querySelectorAll('[data-testid="section-header"]')).toHaveLength(0);
    expect(container.querySelectorAll('[data-testid="empty-state"]')).toHaveLength(0);
    // No divider / New Tab row either when there is no active Space.
    expect(container.querySelectorAll('[data-testid="divider"]')).toHaveLength(0);
    expect(container.querySelectorAll('[data-testid="row-button"]')).toHaveLength(0);
    // The Space-independent global favicon strip and the switcher still render.
    expect(container.querySelector('[data-testid="favicon-row"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="space-switcher"]')).not.toBeNull();
    // The removed search pill is gone everywhere.
    expect(container.querySelector('[data-testid="search-trigger"]')).toBeNull();
  });

  test('falls back to base hue (62) when no active Space', () => {
    const { container } = render(AppHarness, { props: { store: makeStore(null), windowId: 1 } });
    const sidebar = container.querySelector('[data-testid="sidebar"]') as HTMLElement;
    expect(sidebar.style.getPropertyValue('--space-h')).toBe('62');
  });

  test('colourToHue round-trip: orange → 55 inline', () => {
    const { container } = render(AppHarness, {
      props: { store: makeStore('orange'), windowId: 1 },
    });
    const sidebar = container.querySelector('[data-testid="sidebar"]') as HTMLElement;
    expect(sidebar.style.getPropertyValue('--space-h')).toBe('55');
  });

  test('carousel renders one panel per Space in list order', () => {
    // Single composited track: ALL Space panels render (the spike model), centred
    // by translating the whole track — not a keyed prev/current/next trio. With
    // two Spaces the DOM order is [work, reading]; see the single-track suite below
    // for the ≥4-Space case that distinguishes render-all from the old trio.
    const { container } = render(AppHarness, {
      props: { store: makeStore('blue'), windowId: 1 },
    });
    const slides = container.querySelectorAll('[data-testid="content-slide"]');
    expect(slides).toHaveLength(2);
    const ids = Array.from(slides).map((el) => (el as HTMLElement).getAttribute('data-space-id'));
    expect(ids).toEqual(['work', 'reading']);
  });

  test('each slide carries its own --space-h so the peek shows the right colour', () => {
    const { container } = render(AppHarness, {
      props: { store: makeStore('blue'), windowId: 1 },
    });
    const work = container.querySelector('[data-space-id="work"]') as HTMLElement;
    const reading = container.querySelector('[data-space-id="reading"]') as HTMLElement;
    expect(work.style.getPropertyValue('--space-h')).toBe('252');
    expect(reading.style.getPropertyValue('--space-h')).toBe('55');
  });
});

describe('App — single-track carousel (spike model)', () => {
  // The carousel is ONE composited track holding ALL Space panels, translated to
  // centre the active one — NOT a keyed prev/current/next trio. With ≥4 Spaces
  // this is observable: every Space renders a panel, in list order.
  test('renders one panel per Space across the whole list (not a prev/current/next trio)', () => {
    const { container } = render(AppHarness, { props: { store: makeStoreN(5, 2), windowId: 1 } });
    expect(container.querySelector('[data-testid="carousel-track"]')).not.toBeNull();
    const slides = container.querySelectorAll('[data-testid="content-slide"]');
    expect(slides).toHaveLength(5);
    expect(
      Array.from(slides).map((el) => (el as HTMLElement).getAttribute('data-space-id')),
    ).toEqual(['s0', 's1', 's2', 's3', 's4']);
  });

  test('a swipe past the threshold broadcasts activateSpace and settles the track to the next panel (compositor transition)', () => {
    const W = 350;
    // Give the content stage a width so `stageWidth` (the 15% threshold + the baseX rest
    // positions) is real. The settle is a compositor CSS transition — jsdom does not
    // animate it — so we assert the TARGET transform + that the transition is set, not
    // per-frame eased values.
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(W);
    const store = makeStoreN(5, 2); // active = s2
    const { container } = render(AppHarness, { props: { store, windowId: 1 } });
    flushSync();
    const track = container.querySelector('[data-testid="carousel-track"]') as HTMLElement;
    // At rest the track centres panel 2: -2 * 350.
    expect(parseTx(track)).toBe(-2 * W);

    // Leftward swipe well past the 15% threshold.
    const sidebar = container.querySelector('[data-testid="sidebar"]') as HTMLElement;
    sidebar.dispatchEvent(touchEvent('touchstart', [makeTouch(200, 100)]));
    sidebar.dispatchEvent(touchEvent('touchmove', [makeTouch(110, 100)]));
    flushSync();

    // Commit broadcasts the NEXT Space exactly as a chip click would.
    expect(sendMock).toHaveBeenCalledWith({
      kind: 'activateSpace',
      payload: { windowId: 1, spaceId: 's3' },
    });
    // The track is targeted at panel 3's rest position (-3*350) with a compositor
    // `transform` transition (the glide itself runs on the compositor thread).
    expect(parseTx(track)).toBe(-3 * W);
    expect(track.style.transition).toMatch(/^transform \d+(?:\.\d+)?ms/);
  });

  test('an external activation glides the track to the new panel without re-broadcasting', () => {
    const W = 350;
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(W);
    const store = makeStoreN(5, 1); // active = s1
    const { container } = render(AppHarness, { props: { store, windowId: 1 } });
    flushSync();
    const track = container.querySelector('[data-testid="carousel-track"]') as HTMLElement;
    expect(parseTx(track)).toBe(-1 * W);

    // A chip click in this window / a broadcast from another window: the store's
    // active Space jumps to s4 — NOT one of our optimistic commits.
    store.state.activeSpaceByWindow[1] = 's4';
    flushSync();

    // Reconcile glides the track to panel 4 (-4*350) via the compositor transition…
    expect(parseTx(track)).toBe(-4 * W);
    expect(track.style.transition).toMatch(/^transform \d+(?:\.\d+)?ms/);
    // …and must NOT echo a redundant activateSpace back onto the bus.
    expect(sendMock).not.toHaveBeenCalled();
  });

  test('a lagging echo of an own rapid re-swipe does NOT glide the rail back (jumps-two fix)', () => {
    const W = 350;
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(W);
    const store = makeStoreN(5, 0); // active = s0
    const { container } = render(AppHarness, { props: { store, windowId: 1 } });
    flushSync();
    const track = container.querySelector('[data-testid="carousel-track"]') as HTMLElement;
    const sidebar = container.querySelector('[data-testid="sidebar"]') as HTMLElement;
    expect(parseTx(track)).toBe(0); // centred on s0

    // Rapid re-swipe: commit s0→s1, then s1→s2 — BOTH optimistically, before any
    // broadcast round-trip returns (the store's activeSpaceByWindow is still s0).
    const swipeNext = (): void => {
      sidebar.dispatchEvent(touchEvent('touchstart', [makeTouch(200, 100)]));
      sidebar.dispatchEvent(touchEvent('touchmove', [makeTouch(110, 100)]));
      sidebar.dispatchEvent(touchEvent('touchend', [], [makeTouch(110, 100)]));
    };
    swipeNext();
    flushSync();
    swipeNext();
    flushSync();

    // Optimistically centred on s2; both commits were broadcast.
    expect(parseTx(track)).toBe(-2 * W);
    expect(sendMock).toHaveBeenCalledWith({
      kind: 'activateSpace',
      payload: { windowId: 1, spaceId: 's1' },
    });
    expect(sendMock).toHaveBeenCalledWith({
      kind: 'activateSpace',
      payload: { windowId: 1, spaceId: 's2' },
    });

    // The LAGGING s1 echo lands first (the store steps through our commit trail in
    // order). It is one of OUR commits — the rail must STAY on s2, NEVER glide back to
    // s1. Without the pending-trail this reconciles s1 as "external" and glides to -350.
    store.state.activeSpaceByWindow[1] = 's1';
    flushSync();
    expect(parseTx(track)).toBe(-2 * W); // ⬅ the fix

    // The final s2 echo lands → fully in sync, still on s2.
    store.state.activeSpaceByWindow[1] = 's2';
    flushSync();
    expect(parseTx(track)).toBe(-2 * W);

    // A GENUINE external activation (a Space we never committed) STILL glides the rail —
    // the trail suppresses only our own echoes, not real external changes.
    store.state.activeSpaceByWindow[1] = 's4';
    flushSync();
    expect(parseTx(track)).toBe(-4 * W);
  });

  test('a wheel push past the LAST Space locks the rail at rest and does not activate', () => {
    const W = 350;
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(W);
    vi.stubGlobal('requestAnimationFrame', () => 1);
    vi.stubGlobal('cancelAnimationFrame', () => undefined);

    const store = makeStoreN(3, 2); // active = s2, the LAST Space (no neighbour ahead)
    const { container } = render(AppHarness, { props: { store, windowId: 1 } });
    flushSync();

    const track = container.querySelector('[data-testid="carousel-track"]') as HTMLElement;
    const sidebar = container.querySelector('[data-testid="sidebar"]') as HTMLElement;
    // At rest, centred on the last Space (s2).
    expect(parseTx(track)).toBe(-2 * W);
    // Finger-left (positive deltaX) hard, well past the 15% threshold (≈53px).
    sidebar.dispatchEvent(wheelEvent(80, 0));
    flushSync();

    // No wrap: the push commits nothing, and the rail stays LOCKED at rest (no over-scroll).
    expect(sendMock).not.toHaveBeenCalled();
    expect(parseTx(track)).toBe(-2 * W);
  });
});

describe('App — first-run auto-archive notice (auto-archive)', () => {
  function syncGet(): ReturnType<typeof vi.fn> {
    return (
      globalThis as unknown as { chrome: { storage: { sync: { get: ReturnType<typeof vi.fn> } } } }
    ).chrome.storage.sync.get;
  }
  /** Let the onMount async settings + onboarding reads resolve and flush reactivity.
   * Both reads issue one `storage.sync.get`, so two calls means both have returned;
   * draining a couple of microtasks then lets the `.then` assignments + the `{#if}`
   * render settle. */
  async function settle(): Promise<void> {
    await vi.waitFor(() => expect(syncGet()).toHaveBeenCalledTimes(2));
    // A macrotask drains every queued microtask (the awaited reads + Promise.all
    // + the `.then` assignments) before we flush reactivity and assert.
    await new Promise((resolve) => setTimeout(resolve, 0));
    flushSync();
  }
  function noticeButton(container: HTMLElement, label: string): HTMLButtonElement {
    const notice = container.querySelector('[data-testid="first-run-notice"]') as HTMLElement;
    const btn = [...notice.querySelectorAll('button')].find((b) => b.textContent?.trim() === label);
    if (!btn) throw new Error(`notice button "${label}" not found`);
    return btn as HTMLButtonElement;
  }

  test('shows on first run when enabled and not dismissed, with the derived threshold', async () => {
    // Empty sync → settings + onboarding DEFAULTS (enabled, 720min, not dismissed).
    const { container } = render(AppHarness, { props: { store: makeStore('blue'), windowId: 1 } });
    await settle();
    const notice = container.querySelector('[data-testid="first-run-notice"]') as HTMLElement;
    expect(notice).not.toBeNull();
    expect(notice.textContent).toContain('Auto-archive is on');
    expect(notice.textContent).toContain('12 hours');
  });

  test('does not show when autoArchiveEnabled is false', async () => {
    syncData['lunma.settings'] = { autoArchiveEnabled: false };
    const { container } = render(AppHarness, { props: { store: makeStore('blue'), windowId: 1 } });
    await settle();
    expect(container.querySelector('[data-testid="first-run-notice"]')).toBeNull();
  });

  test('does not show after dismissal (onboarding flag true)', async () => {
    syncData['lunma.onboarding'] = { autoArchiveNoticeDismissed: true };
    const { container } = render(AppHarness, { props: { store: makeStore('blue'), windowId: 1 } });
    await settle();
    expect(container.querySelector('[data-testid="first-run-notice"]')).toBeNull();
  });

  test('dismissing persists the flag and hides the notice', async () => {
    const { container } = render(AppHarness, { props: { store: makeStore('blue'), windowId: 1 } });
    await settle();
    const set = (
      globalThis as unknown as { chrome: { storage: { sync: { set: ReturnType<typeof vi.fn> } } } }
    ).chrome.storage.sync.set;
    await fireEvent.click(noticeButton(container, 'Got it'));
    flushSync();
    expect(container.querySelector('[data-testid="first-run-notice"]')).toBeNull();
    expect(set).toHaveBeenCalledWith({ 'lunma.onboarding': { autoArchiveNoticeDismissed: true } });
  });

  test('"Manage in settings" opens the options page to the #auto-archive group', async () => {
    const { container } = render(AppHarness, { props: { store: makeStore('blue'), windowId: 1 } });
    await settle();
    await fireEvent.click(noticeButton(container, 'Manage in settings'));
    // No existing options tab (query → []), so it creates one deep-linked to the group.
    expect(tabsCreate).toHaveBeenCalledWith({
      url: 'chrome-extension://abc/src/options/index.html#auto-archive',
    });
  });

  test('disclosure does not archive: no bus command on show or dismiss', async () => {
    const { container } = render(AppHarness, { props: { store: makeStore('blue'), windowId: 1 } });
    await settle();
    expect(sendMock).not.toHaveBeenCalled();
    await fireEvent.click(noticeButton(container, 'Got it'));
    flushSync();
    expect(sendMock).not.toHaveBeenCalled();
  });
});
