import { beforeEach, describe, expect, test, vi } from 'vitest';
import { LunmaStore } from '../shared/store.svelte';
import type { SavedTab, TabBoundary } from '../shared/types';
import { BoundaryController } from './boundary-controller';
import { makeCoordinator, sidebar, tabUpdated } from './coordinator.test-helpers';

// Boundary wiring (pinned-tab-domain-boundary): the coordinator injects + pushes
// the effective allow-set to a bound tab's content script, re-pushes on reload,
// disarms non-enforced tabs, and re-resolves every inheriting tab when the global
// default flips.

interface BoundaryChromeStub {
  tabs: {
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
    sendMessage: ReturnType<typeof vi.fn>;
    query: ReturnType<typeof vi.fn>;
    group: ReturnType<typeof vi.fn>;
  };
  windows: { update: ReturnType<typeof vi.fn> };
  tabGroups: {
    update: ReturnType<typeof vi.fn>;
    get: ReturnType<typeof vi.fn>;
    move: ReturnType<typeof vi.fn>;
  };
  scripting: { executeScript: ReturnType<typeof vi.fn> };
  runtime: {
    getManifest: ReturnType<typeof vi.fn>;
    sendMessage: ReturnType<typeof vi.fn>;
    onMessage: { addListener: () => void; removeListener: () => void };
  };
}

function installChrome(): BoundaryChromeStub {
  const stub: BoundaryChromeStub = {
    tabs: {
      create: vi.fn(() => Promise.resolve({ id: 999, windowId: 100 } as chrome.tabs.Tab)),
      update: vi.fn(() => Promise.resolve({ id: 999, windowId: 100 } as chrome.tabs.Tab)),
      remove: vi.fn(() => Promise.resolve()),
      sendMessage: vi.fn(() => Promise.resolve()),
      query: vi.fn(() => Promise.resolve([])),
      group: vi.fn(() => Promise.resolve(1)),
    },
    windows: { update: vi.fn(() => Promise.resolve({ id: 100 } as chrome.windows.Window)) },
    tabGroups: {
      update: vi.fn(() => Promise.resolve()),
      get: vi.fn(() => Promise.resolve({ id: 1, windowId: 100 } as chrome.tabGroups.TabGroup)),
      move: vi.fn(() => Promise.resolve()),
    },
    scripting: { executeScript: vi.fn(() => Promise.resolve([])) },
    runtime: {
      getManifest: vi.fn(() => ({
        content_scripts: [
          { js: ['src/launcher/overlay.ts'] },
          { js: ['src/content/tab-boundary.ts'] },
        ],
      })),
      sendMessage: vi.fn(() => Promise.resolve()),
      onMessage: { addListener: () => undefined, removeListener: () => undefined },
    },
  };
  (globalThis as unknown as { chrome: BoundaryChromeStub }).chrome = stub;
  return stub;
}

function saved(
  id: string,
  originalURL: string,
  opts: { spaceId?: string; boundary?: TabBoundary } = {},
): SavedTab {
  return {
    id,
    spaceId: opts.spaceId ?? 'sp-1',
    title: id,
    originalURL,
    currentURL: null,
    ...(opts.boundary ? { boundary: opts.boundary } : {}),
  };
}

const BOUNDARY_FILES = ['src/content/tab-boundary.ts'];

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('setTabBoundary handler', () => {
  test('locking a bound tab records it, injects the script, and pushes the allow-set', async () => {
    const chromeStub = installChrome();
    const { coordinator, store, emitAck } = makeCoordinator();
    store.state.savedTabs['st-1'] = saved('st-1', 'https://mail.google.com/');
    store.state.tabBindings['st-1'] = { 100: 42 };

    coordinator.enqueue(
      sidebar(
        {
          kind: 'setTabBoundary',
          payload: { savedTabId: 'st-1', boundary: { mode: 'locked', allow: ['*.example.com'] } },
        },
        'sess:1',
      ),
    );
    await coordinator.idle();

    expect(store.state.savedTabs['st-1']?.boundary).toEqual({
      mode: 'locked',
      allow: ['*.example.com'],
    });
    expect(chromeStub.scripting.executeScript).toHaveBeenCalledWith({
      target: { tabId: 42 },
      files: BOUNDARY_FILES,
    });
    expect(chromeStub.tabs.sendMessage).toHaveBeenCalledWith(42, {
      type: 'lunma/boundary-config',
      allow: ['*.example.com'],
    });
    expect(emitAck).toHaveBeenCalledWith({ type: 'lunma/command-ack', id: 'sess:1', result: 'ok' });
  });

  test('an explicit off boundary disarms the tab without injecting', async () => {
    const chromeStub = installChrome();
    const { coordinator, store } = makeCoordinator();
    store.state.savedTabs['st-1'] = saved('st-1', 'https://mail.google.com/');
    store.state.tabBindings['st-1'] = { 100: 42 };

    coordinator.enqueue(
      sidebar(
        { kind: 'setTabBoundary', payload: { savedTabId: 'st-1', boundary: { mode: 'off' } } },
        'sess:1',
      ),
    );
    await coordinator.idle();

    expect(store.state.savedTabs['st-1']?.boundary).toEqual({ mode: 'off' });
    expect(chromeStub.scripting.executeScript).not.toHaveBeenCalled();
    expect(chromeStub.tabs.sendMessage).toHaveBeenCalledWith(42, {
      type: 'lunma/boundary-config',
      allow: null,
    });
  });

  test('clearing to inherit (null) removes the field', async () => {
    installChrome();
    const { coordinator, store } = makeCoordinator();
    store.state.savedTabs['st-1'] = saved('st-1', 'https://mail.google.com/', {
      boundary: { mode: 'locked', allow: ['x.com'] },
    });
    store.state.tabBindings['st-1'] = { 100: 42 };

    coordinator.enqueue(
      sidebar(
        { kind: 'setTabBoundary', payload: { savedTabId: 'st-1', boundary: null } },
        'sess:1',
      ),
    );
    await coordinator.idle();

    expect(store.state.savedTabs['st-1']?.boundary).toBeUndefined();
  });

  test('a dormant (unbound) saved tab records the boundary but pushes nothing', async () => {
    const chromeStub = installChrome();
    const { coordinator, store } = makeCoordinator();
    store.state.savedTabs['st-1'] = saved('st-1', 'https://mail.google.com/');
    store.state.tabBindings['st-1'] = {};

    coordinator.enqueue(
      sidebar(
        {
          kind: 'setTabBoundary',
          payload: { savedTabId: 'st-1', boundary: { mode: 'locked', allow: ['x.com'] } },
        },
        'sess:1',
      ),
    );
    await coordinator.idle();

    expect(store.state.savedTabs['st-1']?.boundary).toEqual({ mode: 'locked', allow: ['x.com'] });
    expect(chromeStub.scripting.executeScript).not.toHaveBeenCalled();
    expect(chromeStub.tabs.sendMessage).not.toHaveBeenCalled();
  });

  test('unknown savedTabId throws → error ack', async () => {
    installChrome();
    const { coordinator, emitAck } = makeCoordinator();

    coordinator.enqueue(
      sidebar(
        { kind: 'setTabBoundary', payload: { savedTabId: 'nope', boundary: { mode: 'off' } } },
        'sess:1',
      ),
    );
    await coordinator.idle();

    expect(emitAck.mock.calls[0]?.[0]).toMatchObject({
      id: 'sess:1',
      result: { error: expect.stringContaining("unknown savedTabId 'nope'") },
    });
  });
});

describe('openSavedTab boundary configuration', () => {
  test('binding an enforced pin injects the boundary script and pushes the allow-set', async () => {
    const chromeStub = installChrome();
    const { coordinator, store } = makeCoordinator();
    store.state.savedTabs['st-1'] = saved('st-1', 'https://mail.google.com/', {
      boundary: { mode: 'locked', allow: ['*.google.com'] },
    });

    coordinator.enqueue(
      sidebar({ kind: 'openSavedTab', payload: { savedTabId: 'st-1', windowId: 100 } }, 'sess:1'),
    );
    await coordinator.idle();

    expect(store.state.tabBindings['st-1']?.[100]).toBe(999);
    expect(chromeStub.scripting.executeScript).toHaveBeenCalledWith({
      target: { tabId: 999 },
      files: BOUNDARY_FILES,
    });
    expect(chromeStub.tabs.sendMessage).toHaveBeenCalledWith(999, {
      type: 'lunma/boundary-config',
      allow: ['*.google.com'],
    });
  });

  test('a global FAVORITE (spaceId null) with no explicit boundary is locked to its domain by DEFAULT', async () => {
    const chromeStub = installChrome();
    const { coordinator, store } = makeCoordinator();
    // A favorite: spaceId null, NO explicit boundary. The global default stays 'off'.
    store.state.savedTabs['fav-1'] = {
      id: 'fav-1',
      spaceId: null,
      title: 'fav-1',
      originalURL: 'https://mail.google.com/',
      currentURL: null,
    };

    coordinator.enqueue(
      sidebar({ kind: 'openSavedTab', payload: { savedTabId: 'fav-1', windowId: 100 } }, 'sess:1'),
    );
    await coordinator.idle();

    // Locked-by-default: even though the global pinnedTabBoundaryDefault is 'off' and the
    // favorite set no boundary, a domain allow-set is injected + pushed.
    expect(chromeStub.scripting.executeScript).toHaveBeenCalledWith({
      target: { tabId: 999 },
      files: BOUNDARY_FILES,
    });
    expect(chromeStub.tabs.sendMessage).toHaveBeenCalledWith(999, {
      type: 'lunma/boundary-config',
      allow: ['google.com'],
    });
  });

  test('a favorite with an explicit { mode: off } boundary is NOT locked (the user override wins)', async () => {
    const chromeStub = installChrome();
    const { coordinator, store } = makeCoordinator();
    store.state.savedTabs['fav-2'] = {
      id: 'fav-2',
      spaceId: null,
      title: 'fav-2',
      originalURL: 'https://mail.google.com/',
      currentURL: null,
      boundary: { mode: 'off' },
    };

    coordinator.enqueue(
      sidebar({ kind: 'openSavedTab', payload: { savedTabId: 'fav-2', windowId: 100 } }, 'sess:1'),
    );
    await coordinator.idle();

    expect(chromeStub.scripting.executeScript).not.toHaveBeenCalled();
    expect(chromeStub.tabs.sendMessage).toHaveBeenCalledWith(999, {
      type: 'lunma/boundary-config',
      allow: null,
    });
  });

  test("a global FAVORITE follows the global 'page' default to its page glob", async () => {
    const chromeStub = installChrome();
    const { coordinator, store } = makeCoordinator();
    coordinator.setBoundaryDefault('page');
    // A favorite: spaceId null, NO explicit boundary.
    store.state.savedTabs['fav-3'] = {
      id: 'fav-3',
      spaceId: null,
      title: 'fav-3',
      originalURL: 'https://gitlab.com/dashboard/merge_requests',
      currentURL: null,
    };

    coordinator.enqueue(
      sidebar({ kind: 'openSavedTab', payload: { savedTabId: 'fav-3', windowId: 100 } }, 'sess:1'),
    );
    await coordinator.idle();

    // The favorite floors at domain, but a global 'page' default exceeds it → page glob.
    expect(chromeStub.tabs.sendMessage).toHaveBeenCalledWith(999, {
      type: 'lunma/boundary-config',
      allow: ['https://gitlab.com/dashboard/merge_requests*'],
    });
  });

  // Regression (dormant-pin selection latency): boundary injection awaits
  // chrome.scripting.executeScript against the still-loading tab, which can block
  // for seconds. That MUST NOT gate the broadcast that shows the opened pin as
  // selected — injection is floated off the drain's critical path, and the live
  // tab + active flag are seeded at bind time so the very first broadcast already
  // shows the row selected.
  test('the selected-state broadcast fires before boundary injection resolves', async () => {
    const chromeStub = installChrome();
    // Make injection HANG: if the broadcast waited on it, this test would time out.
    let resolveInject!: (value: unknown) => void;
    chromeStub.scripting.executeScript.mockReturnValueOnce(
      new Promise((res) => {
        resolveInject = res;
      }),
    );
    const { coordinator, store, broadcast } = makeCoordinator();
    store.state.savedTabs['st-1'] = saved('st-1', 'https://mail.google.com/', {
      boundary: { mode: 'locked', allow: ['*.google.com'] },
    });

    coordinator.enqueue(
      sidebar({ kind: 'openSavedTab', payload: { savedTabId: 'st-1', windowId: 100 } }, 'sess:1'),
    );
    // Wait for the drain's broadcast — NOT coordinator.idle(), which would also
    // await the deliberately-hung injection side-effect.
    await vi.waitFor(() => expect(broadcast).toHaveBeenCalled());

    // The broadcast already carries the tab bound + selected (active), even though
    // injection is still pending.
    const state = broadcast.mock.calls.at(-1)?.[0].state;
    expect(state?.tabBindings['st-1']?.[100]).toBe(999);
    expect(state?.liveTabsById[999]?.active).toBe(true);
    // Injection was kicked off (its executeScript call) but had not resolved.
    expect(chromeStub.scripting.executeScript).toHaveBeenCalledWith({
      target: { tabId: 999 },
      files: BOUNDARY_FILES,
    });

    // Let the floated injection settle so the run leaves no dangling promise.
    resolveInject([]);
    await coordinator.idle();
    expect(chromeStub.tabs.sendMessage).toHaveBeenCalledWith(999, {
      type: 'lunma/boundary-config',
      allow: ['*.google.com'],
    });
  });
});

describe('bound-tab reload re-push', () => {
  test('a status:complete on an enforced bound tab re-pushes the allow-set', async () => {
    const chromeStub = installChrome();
    const { coordinator, store } = makeCoordinator();
    store.state.savedTabs['st-1'] = saved('st-1', 'https://mail.google.com/', {
      boundary: { mode: 'locked', allow: ['*.google.com'] },
    });
    store.state.tabBindings['st-1'] = { 100: 42 };

    coordinator.enqueue(tabUpdated(42, { status: 'complete' }));
    await coordinator.idle();

    expect(chromeStub.scripting.executeScript).toHaveBeenCalledWith({
      target: { tabId: 42 },
      files: BOUNDARY_FILES,
    });
    expect(chromeStub.tabs.sendMessage).toHaveBeenCalledWith(42, {
      type: 'lunma/boundary-config',
      allow: ['*.google.com'],
    });
  });

  test('a status:complete on a NON-enforced bound tab pushes nothing (no chatter)', async () => {
    const chromeStub = installChrome();
    const { coordinator, store } = makeCoordinator();
    store.state.savedTabs['st-1'] = saved('st-1', 'https://mail.google.com/', {
      boundary: { mode: 'off' },
    });
    store.state.tabBindings['st-1'] = { 100: 42 };

    coordinator.enqueue(tabUpdated(42, { status: 'complete' }));
    await coordinator.idle();

    expect(chromeStub.scripting.executeScript).not.toHaveBeenCalled();
    expect(chromeStub.tabs.sendMessage).not.toHaveBeenCalled();
  });
});

describe('global default flip (refreshBoundTabBoundaries)', () => {
  test("'domain' arms an inheriting bound tab and leaves an explicit off tab free", async () => {
    const chromeStub = installChrome();
    const { coordinator, store } = makeCoordinator();
    // Inheriting (no explicit boundary) bound to tab 100.
    store.state.savedTabs.inherit = saved('inherit', 'https://mail.google.com/');
    store.state.tabBindings.inherit = { 100: 100 };
    // Explicitly free bound to tab 200.
    store.state.savedTabs.free = saved('free', 'https://linear.app/', {
      boundary: { mode: 'off' },
    });
    store.state.tabBindings.free = { 100: 200 };

    coordinator.setBoundaryDefault('domain');
    await coordinator.refreshBoundTabBoundaries();

    // The inheriting tab is armed with its registrable domain + script injected.
    expect(chromeStub.scripting.executeScript).toHaveBeenCalledWith({
      target: { tabId: 100 },
      files: BOUNDARY_FILES,
    });
    expect(chromeStub.tabs.sendMessage).toHaveBeenCalledWith(100, {
      type: 'lunma/boundary-config',
      allow: ['google.com'],
    });
    // The explicit-off tab stays free: disarmed, never injected.
    expect(chromeStub.scripting.executeScript).not.toHaveBeenCalledWith({
      target: { tabId: 200 },
      files: BOUNDARY_FILES,
    });
    expect(chromeStub.tabs.sendMessage).toHaveBeenCalledWith(200, {
      type: 'lunma/boundary-config',
      allow: null,
    });
  });

  test("'page' arms an inheriting bound tab with its page glob", async () => {
    const chromeStub = installChrome();
    const { coordinator, store } = makeCoordinator();
    // Inheriting (no explicit boundary) Space-pinned tab bound to tab 100.
    store.state.savedTabs.inherit = saved('inherit', 'https://gitlab.com/dashboard/merge_requests');
    store.state.tabBindings.inherit = { 100: 100 };

    coordinator.setBoundaryDefault('page');
    await coordinator.refreshBoundTabBoundaries();

    expect(chromeStub.scripting.executeScript).toHaveBeenCalledWith({
      target: { tabId: 100 },
      files: BOUNDARY_FILES,
    });
    expect(chromeStub.tabs.sendMessage).toHaveBeenCalledWith(100, {
      type: 'lunma/boundary-config',
      allow: ['https://gitlab.com/dashboard/merge_requests*'],
    });
  });
});

describe('off-allow divert reuses openUrl', () => {
  test('an openUrl command (the divert target) creates a tab in the sender window', async () => {
    const chromeStub = installChrome();
    const { coordinator } = makeCoordinator();

    coordinator.enqueue(
      sidebar(
        { kind: 'openUrl', payload: { url: 'https://evil.test/', windowId: 100 } },
        'cmd:divert',
      ),
    );
    await coordinator.idle();

    expect(chromeStub.tabs.create).toHaveBeenCalledWith({
      url: 'https://evil.test/',
      windowId: 100,
    });
  });
});

// ── configureLensItemBoundary (smart-tab-boundary) ──────────────────────────

describe('BoundaryController.configureLensItemBoundary', () => {
  test('empty allowGlob is a no-op (no inject or send called)', async () => {
    const chromeStub = installChrome();
    const store = new LunmaStore();
    const boundary = new BoundaryController(store);

    await boundary.configureLensItemBoundary(42, '');

    expect(chromeStub.scripting.executeScript).not.toHaveBeenCalled();
    expect(chromeStub.tabs.sendMessage).not.toHaveBeenCalled();
  });

  test('non-empty allowGlob calls injectBoundary then sendBoundaryConfig with [allowGlob]', async () => {
    const chromeStub = installChrome();
    const store = new LunmaStore();
    const boundary = new BoundaryController(store);

    await boundary.configureLensItemBoundary(42, 'https://gitlab.example.com/mr/42*');

    expect(chromeStub.scripting.executeScript).toHaveBeenCalledWith({
      target: { tabId: 42 },
      files: BOUNDARY_FILES,
    });
    expect(chromeStub.tabs.sendMessage).toHaveBeenCalledWith(42, {
      type: 'lunma/boundary-config',
      allow: ['https://gitlab.example.com/mr/42*'],
    });
  });

  test('a thrown error does not propagate', async () => {
    const chromeStub = installChrome();
    chromeStub.scripting.executeScript.mockRejectedValueOnce(new Error('injection forbidden'));
    const store = new LunmaStore();
    const boundary = new BoundaryController(store);

    await expect(
      boundary.configureLensItemBoundary(42, 'https://example.com/page*'),
    ).resolves.toBeUndefined();
  });
});

// ── smart-item boundary re-arm on tabs.onUpdated ─────────────────────────────

describe('smart-item boundary re-arm on tabs.onUpdated', () => {
  test('tab id matches a slot with non-empty allowGlob → configureLensItemBoundary called', async () => {
    const chromeStub = installChrome();
    const { coordinator, store } = makeCoordinator();
    store.state.lensItemBindings['sf-1'] = {
      '42': { 100: { tabId: 7, allowGlob: 'https://gitlab.example.com/mr/42*' } },
    };

    coordinator.enqueue(tabUpdated(7, { status: 'complete' }));
    await coordinator.idle();

    expect(chromeStub.scripting.executeScript).toHaveBeenCalledWith({
      target: { tabId: 7 },
      files: BOUNDARY_FILES,
    });
    expect(chromeStub.tabs.sendMessage).toHaveBeenCalledWith(7, {
      type: 'lunma/boundary-config',
      allow: ['https://gitlab.example.com/mr/42*'],
    });
  });

  test('slot allowGlob empty → skipped (no inject or send)', async () => {
    const chromeStub = installChrome();
    const { coordinator, store } = makeCoordinator();
    store.state.lensItemBindings['sf-1'] = {
      '42': { 100: { tabId: 7, allowGlob: '' } },
    };

    coordinator.enqueue(tabUpdated(7, { status: 'complete' }));
    await coordinator.idle();

    expect(chromeStub.scripting.executeScript).not.toHaveBeenCalled();
    expect(chromeStub.tabs.sendMessage).not.toHaveBeenCalled();
  });

  test('tab id not in any slot → saved-tab path unaffected, smart-item path skipped', async () => {
    const chromeStub = installChrome();
    const { coordinator, store } = makeCoordinator();
    store.state.savedTabs['st-1'] = saved('st-1', 'https://mail.google.com/', {
      boundary: { mode: 'locked', allow: ['*.google.com'] },
    });
    store.state.tabBindings['st-1'] = { 100: 42 };
    // Smart item binding on a different tab (999), not the updated tab (42).
    store.state.lensItemBindings['sf-1'] = {
      '7': { 100: { tabId: 999, allowGlob: 'https://gitlab.example.com/mr/7*' } },
    };

    coordinator.enqueue(tabUpdated(42, { status: 'complete' }));
    await coordinator.idle();

    // Only the saved-tab re-arm fires (tab 42 ↔ st-1); the smart-item path is skipped.
    expect(chromeStub.scripting.executeScript).toHaveBeenCalledTimes(1);
    expect(chromeStub.scripting.executeScript).toHaveBeenCalledWith({
      target: { tabId: 42 },
      files: BOUNDARY_FILES,
    });
    expect(chromeStub.tabs.sendMessage).toHaveBeenCalledWith(42, {
      type: 'lunma/boundary-config',
      allow: ['*.google.com'],
    });
  });
});
