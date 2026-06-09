import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { SavedTab } from '../shared/types';

interface ChromeStub {
  tabs: {
    query: ReturnType<typeof vi.fn>;
  };
  storage: { local: { set: ReturnType<typeof vi.fn>; get: ReturnType<typeof vi.fn> } };
  runtime: {
    sendMessage: ReturnType<typeof vi.fn>;
    onMessage: { addListener: () => void; removeListener: () => void };
  };
}

function savedTab(id: string, originalURL: string, currentURL: string | null): SavedTab {
  return { id, spaceId: 'work', title: id, originalURL, currentURL };
}

/** A live tab with the `windowId` the per-window recovery buckets on. */
function liveTab(id: number, windowId: number, url: string): chrome.tabs.Tab {
  return { id, windowId, url } as chrome.tabs.Tab;
}

function installChromeStub(liveTabs: chrome.tabs.Tab[]): ChromeStub {
  const stub: ChromeStub = {
    tabs: {
      // Per-window-tab-bindings (ADR 0009): recovery does ONE `query({})` and
      // buckets the result by windowId — no per-binding `tabs.get`.
      query: vi.fn(() => Promise.resolve(liveTabs)),
    },
    storage: {
      local: {
        set: vi.fn(() => Promise.resolve()),
        get: vi.fn(() => Promise.resolve({})),
      },
    },
    runtime: {
      sendMessage: vi.fn(() => Promise.resolve()),
      onMessage: { addListener: () => undefined, removeListener: () => undefined },
    },
  };
  (globalThis as unknown as { chrome: ChromeStub }).chrome = stub;
  return stub;
}

async function freshImports() {
  vi.resetModules();
  const singleton = await import('./store-singleton');
  const recovery = await import('./tab-bindings');
  return { ...singleton, ...recovery };
}

describe('runRestartRecovery (per-window)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  test('recovers a window slot by currentURL when a restored tab matches', async () => {
    installChromeStub([
      liveTab(200, 100, 'https://github.com/notifications'),
      liveTab(201, 100, 'https://github.com/'),
    ]);
    const { store, runRestartRecovery } = await freshImports();
    store.state.savedTabs.gh = savedTab(
      'gh',
      'https://github.com/',
      'https://github.com/notifications',
    );
    store.state.tabBindings.gh = { 100: 999 };

    await runRestartRecovery();

    expect(store.state.tabBindings.gh).toEqual({ 100: 200 });
    expect(store.state.savedTabs.gh?.currentURL).toBe('https://github.com/notifications');
  });

  test('falls back to originalURL when currentURL is gone', async () => {
    installChromeStub([liveTab(300, 100, 'https://github.com/')]);
    const { store, runRestartRecovery } = await freshImports();
    store.state.savedTabs.gh = savedTab(
      'gh',
      'https://github.com/',
      'https://github.com/notifications',
    );
    store.state.tabBindings.gh = { 100: 999 };

    await runRestartRecovery();

    expect(store.state.tabBindings.gh).toEqual({ 100: 300 });
  });

  test('clears a window slot when neither URL matches (currentURL untouched)', async () => {
    installChromeStub([liveTab(400, 100, 'https://example.com/')]);
    const { store, runRestartRecovery } = await freshImports();
    store.state.savedTabs.gh = savedTab(
      'gh',
      'https://github.com/',
      'https://github.com/notifications',
    );
    store.state.tabBindings.gh = { 100: 999 };

    await runRestartRecovery();

    expect(store.state.tabBindings.gh).toEqual({});
    // Recovery rebinds by URL without modifying the single-canonical currentURL.
    expect(store.state.savedTabs.gh?.currentURL).toBe('https://github.com/notifications');
  });

  test('first-claim-wins when two saved tabs match the same tab in a window', async () => {
    installChromeStub([liveTab(500, 100, 'https://github.com/')]);
    const { store, runRestartRecovery } = await freshImports();
    store.state.savedTabs['gh-a'] = savedTab('gh-a', 'https://github.com/', 'https://github.com/');
    store.state.savedTabs['gh-b'] = savedTab('gh-b', 'https://github.com/', 'https://github.com/');
    store.state.tabBindings['gh-a'] = { 100: 999 };
    store.state.tabBindings['gh-b'] = { 100: 1000 };

    await runRestartRecovery();

    const a = store.state.tabBindings['gh-a']?.[100];
    const b = store.state.tabBindings['gh-b']?.[100];
    const values = [a, b];
    expect(values).toContain(500);
    expect(values).toContain(undefined);
  });

  test('keeps a slot whose tab is still alive in its window', async () => {
    installChromeStub([liveTab(42, 100, 'https://github.com/')]);
    const { store, runRestartRecovery } = await freshImports();
    store.state.savedTabs.gh = savedTab('gh', 'https://github.com/', 'https://github.com/');
    store.state.tabBindings.gh = { 100: 42 };

    await runRestartRecovery();

    expect(store.state.tabBindings.gh).toEqual({ 100: 42 });
  });

  test("evaluates a saved tab's windows independently: recover one, clear the other", async () => {
    installChromeStub([
      liveTab(50, 100, 'https://github.com/sub'), // window 100 — matches currentURL
      liveTab(60, 200, 'https://other.example/'), // window 200 — no match
    ]);
    const { store, runRestartRecovery } = await freshImports();
    store.state.savedTabs.gh = savedTab('gh', 'https://github.com/', 'https://github.com/sub');
    store.state.tabBindings.gh = { 100: 1, 200: 2 }; // both stale (ids gone)

    await runRestartRecovery();

    expect(store.state.tabBindings.gh).toEqual({ 100: 50 });
  });
});
