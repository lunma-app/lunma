import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import type { PersistedRead } from '../shared/chrome/storage';
import { BUILT_IN_ENGINES } from '../shared/search-engines';
import { createInitialState } from '../shared/store.svelte';

// The SW boot chain in `index.ts` runs at module-eval with many chrome-touching
// collaborators. Mock the read layer (so we can steer the boot `outcome`) and the
// rest of the boot collaborators (so importing `index` is inert beyond the gating
// logic under test). `store-singleton`, `store.svelte`, `default-space`, the
// logger, and the coordinator stay REAL so the gating actually mutates the store.
vi.mock('../shared/chrome/storage', () => ({
  readPersistedState: vi.fn(),
  persist: vi.fn(() => Promise.resolve()),
  // The coordinator is REAL here and imports `toPersistable` to compute its
  // persist-skip signature; mirror the real strip of the ephemeral `liveTabsById`.
  toPersistable: (state: { liveTabsById?: unknown }) => {
    const { liveTabsById: _liveTabsById, ...persistable } = state;
    return persistable;
  },
}));
vi.mock('../shared/messages', () => ({
  broadcastState: vi.fn(),
  respondWithCurrentWindow: vi.fn(),
}));
vi.mock('./bus-adapter', () => ({ installBusAdapter: vi.fn() }));
vi.mock('./launcher-suggestions-handler', () => ({ registerLauncherSuggestionsHandler: vi.fn() }));
vi.mock('./overlay-injection', () => ({
  backfillOverlayIntoOpenTabs: vi.fn(() => Promise.resolve()),
  injectOverlay: vi.fn(() => Promise.resolve()),
}));
vi.mock('./pin-active-tab', () => ({ resolvePinActiveTab: vi.fn() }));
vi.mock('./seed-existing-tabs', () => ({ seedExistingTabs: vi.fn() }));
vi.mock('./seed-existing-windows', () => ({ seedExistingWindows: vi.fn(() => Promise.resolve()) }));
vi.mock('./space-tint', () => ({ resolveSpaceTint: vi.fn(() => null) }));
vi.mock('./state-snapshot-handler', () => ({ registerStateSnapshotHandler: vi.fn() }));
vi.mock('./tab-bindings', () => ({ runRestartRecovery: vi.fn(() => Promise.resolve()) }));
vi.mock('./tab-group-adoption', () => ({
  reconcileTabGroupsOnBoot: vi.fn(() => Promise.resolve()),
}));
vi.mock('./trash-purge', () => ({ purgeExpiredTrash: vi.fn() }));

// Captures populated by `installChrome` so a test can drive the `toggle-launcher`
// command path: the registered command handler, the active tab the
// `{active:true}` query returns, and the `chrome.tabs.sendMessage` spy the open
// message is dispatched through. `windowTabs` is what a windowId-scoped query
// returns — the new-tab-launcher reuse lookup the fallback (launcher-reach) makes;
// `createTabSpy`/`updateTabSpy` capture the fallback opening (create) or focusing
// (update → active) of the new-tab launcher.
let commandHandler: ((command: string) => void) | undefined;
let activeTab: { id?: number; windowId?: number } | undefined;
let windowTabs: { id?: number; url?: string }[];
let sendMessageSpy: ReturnType<typeof vi.fn>;
let createTabSpy: ReturnType<typeof vi.fn>;
let updateTabSpy: ReturnType<typeof vi.fn>;
// launcher-sidebar-focus-reach: captured `runtime.onMessage` listeners (so a test
// can dispatch lunma/sidebar-focus or lunma/open-newtab-launcher), the captured
// `windows.onRemoved` handler (to test focus-key pruning), and the in-memory
// `chrome.storage.session` backing the per-window sidebar-focus state.
let messageListeners: Array<
  (raw: unknown, sender: unknown, sendResponse: (r: unknown) => void) => unknown
>;
let windowRemovedHandler: ((windowId: number) => void) | undefined;
let sessionStore: Record<string, unknown>;

/** A minimal chrome stub: enough for the synchronous listener registration and
 * the boot's single `chrome.tabs.query({})`, plus the `toggle-launcher` command
 * path (active-tab query + `tabs.sendMessage`). */
function installChrome(): void {
  const addListener = vi.fn();
  commandHandler = undefined;
  activeTab = undefined;
  windowTabs = [];
  messageListeners = [];
  windowRemovedHandler = undefined;
  sessionStore = {};
  sendMessageSpy = vi.fn(() => Promise.resolve());
  createTabSpy = vi.fn(() => Promise.resolve({ id: 999 }));
  updateTabSpy = vi.fn(() => Promise.resolve());
  (globalThis as unknown as { chrome: unknown }).chrome = {
    sidePanel: { setPanelBehavior: vi.fn(() => Promise.resolve()) },
    tabs: {
      // The active-tab query (`{active:…}`) gets the active tab when a test set
      // one; every other query — the boot's `query({})` and the launcher-reach
      // fallback's windowId-scoped reuse lookup — gets `windowTabs` (empty by
      // default, so boot is unchanged).
      query: vi.fn((q?: { active?: boolean }) =>
        Promise.resolve(q?.active ? (activeTab ? [activeTab] : []) : windowTabs),
      ),
      sendMessage: sendMessageSpy,
      create: createTabSpy,
      update: updateTabSpy,
      onCreated: { addListener },
      onRemoved: { addListener },
      onUpdated: { addListener },
      onActivated: { addListener },
    },
    tabGroups: { onRemoved: { addListener }, onUpdated: { addListener } },
    // Auto-archive (auto-archive): the boot registers the sweep-alarm listener
    // synchronously in registerChromeListeners(); the alarm itself is created/
    // cleared by syncAutoArchiveAlarm (settings-driven), so `clear` is stubbed too.
    alarms: {
      create: vi.fn(),
      clear: vi.fn(() => Promise.resolve(true)),
      onAlarm: { addListener },
    },
    // The boot subscribes to permission changes to heal gated smart folders
    // (least-privilege-permissions D5/D9); `contains` defaults to granted so the
    // post-boot refresh exercises the connectors.
    permissions: {
      contains: vi.fn(() => Promise.resolve(true)),
      request: vi.fn(() => Promise.resolve(true)),
      onAdded: { addListener },
      onRemoved: { addListener },
    },
    windows: {
      // The fallback resolves the focused window via `getLastFocused` when there
      // is no active tab to read a windowId from (launcher-reach).
      getLastFocused: vi.fn(() => Promise.resolve({ id: 100 })),
      onCreated: { addListener },
      // Captured so a test can fire window removal and assert the sidebar-focus key
      // is pruned (launcher-sidebar-focus-reach).
      onRemoved: {
        addListener: vi.fn((l: (windowId: number) => void) => {
          windowRemovedHandler = l;
        }),
      },
    },
    commands: {
      onCommand: {
        addListener: vi.fn((l: (command: string) => void) => {
          commandHandler = l;
        }),
      },
    },
    // `onMessage` carries the boundary-divert listener; `storage` backs the
    // settings read/watch the boot now performs (pinned-tab-domain-boundary);
    // `getURL` resolves the new-tab launcher's explicit URL the fallback opens.
    runtime: {
      onInstalled: { addListener },
      // Capture every onMessage listener so `dispatchMessage` can fan a message out
      // to the SW handlers (boundary, sidebar-focus, open-newtab-launcher).
      onMessage: {
        addListener: vi.fn(
          (l: (raw: unknown, sender: unknown, sendResponse: (r: unknown) => void) => unknown) => {
            messageListeners.push(l);
          },
        ),
      },
      getURL: (path: string) => `chrome-extension://test/${path}`,
    },
    storage: {
      sync: { get: vi.fn(() => Promise.resolve({})) },
      // In-memory chrome.storage.session backing the per-window sidebar-focus state
      // (launcher-sidebar-focus-reach). `set` assigns synchronously so a test can
      // dispatch a focus report and fire the command in the same tick.
      session: {
        get: vi.fn((key: string) =>
          Promise.resolve(key in sessionStore ? { [key]: sessionStore[key] } : {}),
        ),
        set: vi.fn((obj: Record<string, unknown>) => {
          Object.assign(sessionStore, obj);
          return Promise.resolve();
        }),
        remove: vi.fn((key: string) => {
          delete sessionStore[key];
          return Promise.resolve();
        }),
      },
      onChanged: { addListener },
    },
  };
}

/** Fan a runtime message out to every captured SW onMessage listener — mirrors
 * chrome.runtime.sendMessage delivery (launcher-sidebar-focus-reach). */
function dispatchMessage(msg: unknown): void {
  for (const l of messageListeners) l(msg, {}, () => undefined);
}

/** Drive a full SW boot with a controlled read outcome, then wait until the boot
 * chain reaches its terminal broadcast. Returns the (fresh) store + persist mock. */
async function boot(read: PersistedRead) {
  vi.resetModules();
  installChrome();
  const storage = await import('../shared/chrome/storage');
  vi.mocked(storage.readPersistedState).mockResolvedValue(read);
  const messages = await import('../shared/messages');
  const singleton = await import('./store-singleton');
  await import('./index'); // triggers the boot chain
  // The terminal `broadcastState('boot', …)` runs in EVERY outcome, so it is the
  // signal that the gating (mint / persist) decisions have all been made.
  await vi.waitFor(() => expect(messages.broadcastState).toHaveBeenCalled());
  return { store: singleton.store, persist: vi.mocked(storage.persist) };
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('SW boot — outcome gating', () => {
  test('an unavailable read mints no Default, persists nothing, and leaves the store empty', async () => {
    const { store, persist } = await boot({ kind: 'unavailable' });

    // No Default fabricated over the (unreadable-this-boot) on-disk state.
    expect(store.state.spaces).toEqual([]);
    // No boot persist → `lunma.state` is left byte-intact for the next boot.
    expect(persist).not.toHaveBeenCalled();
  });

  test('a salvaged read keeps the recovered Spaces, mints no Default, and persists (self-heal)', async () => {
    const state = createInitialState();
    state.spaces.push({ id: 'w', name: 'Work', color: 'blue', icon: 'star' });

    const { store, persist } = await boot({ kind: 'salvaged', state });

    // The recovered Space is present; no extra Default was minted.
    expect(store.state.spaces.map((s) => s.name)).toEqual(['Work']);
    expect(store.state.spaces.find((s) => s.name === 'Default')).toBeUndefined();
    // A salvaged boot still persists (writes the healed envelope back).
    expect(persist).toHaveBeenCalled();
  });

  test('a clean empty read (first boot) mints the Default and persists', async () => {
    const { store, persist } = await boot({ kind: 'empty' });

    expect(store.state.spaces.map((s) => s.name)).toEqual(['Default']);
    expect(persist).toHaveBeenCalled();
  });
});

describe('toggle-launcher command path (launcher-tab-to-search)', () => {
  test('the open message carries the Tab-to-search engine registry', async () => {
    await boot({ kind: 'empty' });
    activeTab = { id: 7, windowId: 100 };

    commandHandler?.('toggle-launcher');

    await vi.waitFor(() =>
      expect(sendMessageSpy).toHaveBeenCalledWith(
        7,
        expect.objectContaining({ type: 'lunma/toggle-launcher', windowId: 100 }),
      ),
    );
    const msg = sendMessageSpy.mock.calls.at(-1)?.[1] as {
      engines?: { id: string; keyword: string; urlTemplate: string }[];
    };
    // Default settings → all built-ins ride the message (each with its keyword +
    // template); no custom engine is configured. Derived from the registry so
    // adding a built-in engine doesn't silently break this assertion.
    expect(msg.engines?.length).toBe(BUILT_IN_ENGINES.length);
    expect(msg.engines?.find((e) => e.id === 'youtube')?.keyword).toBe('yt');
    expect(msg.engines?.every((e) => e.urlTemplate.includes('%s'))).toBe(true);
  });
});

describe('toggle-launcher command path — new-tab launcher fallback (launcher-reach)', () => {
  test('a page that forbids injection opens the new-tab launcher in the tab’s window', async () => {
    await boot({ kind: 'empty' });
    activeTab = { id: 7, windowId: 100 };
    // No overlay receiver, and on-demand injection is forbidden (chrome://, the
    // Web Store, an extension page): both the send and the inject reject.
    sendMessageSpy.mockRejectedValue(new Error('no receiver'));
    const overlay = await import('./overlay-injection');
    vi.mocked(overlay.injectOverlay).mockRejectedValue(new Error('cannot inject'));

    commandHandler?.('toggle-launcher');

    // The fallback opens a fresh new-tab launcher in that tab's window — no
    // existing one to reuse (windowTabs is empty) — rather than no-oping. It opens
    // the EXPLICIT extension URL (not the bare override) so the page keeps focus
    // and its autofocus lands in the search input, not the omnibox (D5).
    await vi.waitFor(() =>
      expect(createTabSpy).toHaveBeenCalledWith({
        url: 'chrome-extension://test/src/launcher/newtab/index.html',
        windowId: 100,
        active: true,
      }),
    );
    expect(updateTabSpy).not.toHaveBeenCalled();
  });

  test('an already-open new-tab launcher in the window is focused, not duplicated', async () => {
    await boot({ kind: 'empty' });
    activeTab = { id: 7, windowId: 100 };
    sendMessageSpy.mockRejectedValue(new Error('no receiver'));
    const overlay = await import('./overlay-injection');
    vi.mocked(overlay.injectOverlay).mockRejectedValue(new Error('cannot inject'));
    // A new-tab launcher is already open in the window — reuse (focus) it so
    // repeated Alt+L doesn't pile up empty tabs (design D3).
    windowTabs = [{ id: 555, url: 'chrome://newtab/' }];

    commandHandler?.('toggle-launcher');

    await vi.waitFor(() => expect(updateTabSpy).toHaveBeenCalledWith(555, { active: true }));
    expect(createTabSpy).not.toHaveBeenCalled();
  });

  test('the injectable on-demand path injects + re-sends and opens no new tab', async () => {
    await boot({ kind: 'empty' });
    activeTab = { id: 7, windowId: 100 };
    // First send finds no receiver; injection succeeds; the re-send then lands.
    sendMessageSpy.mockRejectedValueOnce(new Error('no receiver'));
    const overlay = await import('./overlay-injection');
    // Set the resolve explicitly: the module-mock fn is shared across the
    // resetModules boots, so a prior test's `mockRejectedValue` would otherwise
    // leak in and wrongly trip the fallback. (clearAllMocks resets call history,
    // not implementations.)
    vi.mocked(overlay.injectOverlay).mockResolvedValue(undefined);

    commandHandler?.('toggle-launcher');

    await vi.waitFor(() => expect(overlay.injectOverlay).toHaveBeenCalledWith(7));
    // The overlay opened in place — the new-tab launcher fallback never fires.
    expect(createTabSpy).not.toHaveBeenCalled();
    expect(updateTabSpy).not.toHaveBeenCalled();
    // Sent twice: the initial probe, then the post-inject re-send.
    expect(sendMessageSpy).toHaveBeenCalledTimes(2);
  });

  test('no injectable active tab opens the new-tab launcher in the focused window', async () => {
    await boot({ kind: 'empty' });
    activeTab = undefined; // the active-tab query returns []

    commandHandler?.('toggle-launcher');

    // The window is resolved via getLastFocused → 100; no existing new-tab there,
    // so one is created (explicit URL, so its input autofocuses — D5). Nothing is
    // messaged or injected off a non-injectable surface.
    await vi.waitFor(() =>
      expect(createTabSpy).toHaveBeenCalledWith({
        url: 'chrome-extension://test/src/launcher/newtab/index.html',
        windowId: 100,
        active: true,
      }),
    );
    expect(sendMessageSpy).not.toHaveBeenCalled();
  });
});

describe('toggle-launcher command path — sidebar focus routing (launcher-sidebar-focus-reach)', () => {
  const NEWTAB_URL = 'chrome-extension://test/src/launcher/newtab/index.html';

  test('with the sidebar focused, the command opens the new-tab launcher, not the overlay', async () => {
    await boot({ kind: 'empty' });
    dispatchMessage({ type: 'lunma/sidebar-focus', windowId: 100, focused: true });
    activeTab = { id: 7, windowId: 100 }; // an injectable http(s) tab behind the panel

    commandHandler?.('toggle-launcher');

    // The in-page overlay would be unfocusable behind the panel — route to the
    // focused new-tab launcher instead, and never message the page overlay.
    await vi.waitFor(() =>
      expect(createTabSpy).toHaveBeenCalledWith({ url: NEWTAB_URL, windowId: 100, active: true }),
    );
    expect(sendMessageSpy).not.toHaveBeenCalled();
  });

  test('focused:false reverts to the in-page overlay path', async () => {
    await boot({ kind: 'empty' });
    dispatchMessage({ type: 'lunma/sidebar-focus', windowId: 100, focused: true });
    dispatchMessage({ type: 'lunma/sidebar-focus', windowId: 100, focused: false });
    activeTab = { id: 7, windowId: 100 };

    commandHandler?.('toggle-launcher');

    await vi.waitFor(() =>
      expect(sendMessageSpy).toHaveBeenCalledWith(
        7,
        expect.objectContaining({ type: 'lunma/toggle-launcher', windowId: 100 }),
      ),
    );
    expect(createTabSpy).not.toHaveBeenCalled();
  });

  test('sidebar focus is per-window — a different window still gets the overlay', async () => {
    await boot({ kind: 'empty' });
    dispatchMessage({ type: 'lunma/sidebar-focus', windowId: 100, focused: true });
    activeTab = { id: 7, windowId: 200 }; // command fires in a DIFFERENT window

    commandHandler?.('toggle-launcher');

    await vi.waitFor(() =>
      expect(sendMessageSpy).toHaveBeenCalledWith(7, expect.objectContaining({ windowId: 200 })),
    );
    expect(createTabSpy).not.toHaveBeenCalled();
  });

  test('windows.onRemoved clears the focused window’s key', async () => {
    await boot({ kind: 'empty' });
    dispatchMessage({ type: 'lunma/sidebar-focus', windowId: 100, focused: true });
    windowRemovedHandler?.(100); // the window closes → key pruned
    activeTab = { id: 7, windowId: 100 };

    commandHandler?.('toggle-launcher');

    await vi.waitFor(() => expect(sendMessageSpy).toHaveBeenCalled());
    expect(createTabSpy).not.toHaveBeenCalled();
  });

  test('a cold SW (no in-memory state) still routes via persisted storage.session', async () => {
    await boot({ kind: 'empty' });
    // Simulate focus state persisted by a prior, now-torn-down SW session — the
    // command must read storage.session, not an in-memory cache.
    sessionStore['lunma.sidebarFocus:100'] = true;
    activeTab = { id: 7, windowId: 100 };

    commandHandler?.('toggle-launcher');

    await vi.waitFor(() =>
      expect(createTabSpy).toHaveBeenCalledWith({ url: NEWTAB_URL, windowId: 100, active: true }),
    );
    expect(sendMessageSpy).not.toHaveBeenCalled();
  });

  test('lunma/open-newtab-launcher opens the new-tab launcher directly', async () => {
    await boot({ kind: 'empty' });

    dispatchMessage({ type: 'lunma/open-newtab-launcher', windowId: 100 });

    await vi.waitFor(() =>
      expect(createTabSpy).toHaveBeenCalledWith({ url: NEWTAB_URL, windowId: 100, active: true }),
    );
  });
});
