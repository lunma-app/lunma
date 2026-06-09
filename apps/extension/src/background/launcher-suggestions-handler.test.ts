import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { LauncherResult } from '../shared/launcher-contract';
import { LunmaStore } from '../shared/store.svelte';
import { registerLauncherSuggestionsHandler } from './launcher-suggestions-handler';

interface ChromeStub {
  runtime: {
    sendMessage: ReturnType<typeof vi.fn>;
    onMessage: {
      addListener: ReturnType<typeof vi.fn>;
      removeListener: ReturnType<typeof vi.fn>;
    };
  };
  tabs: { query: ReturnType<typeof vi.fn> };
  bookmarks: { search: ReturnType<typeof vi.fn> };
  history: { search: ReturnType<typeof vi.fn> };
  storage: { sync: { get: ReturnType<typeof vi.fn> } };
}

interface StubData {
  tabs?: chrome.tabs.Tab[];
  bookmarks?: chrome.bookmarks.BookmarkTreeNode[];
  history?: chrome.history.HistoryItem[];
}

function installChromeStub(data: StubData = {}): {
  deliver: (msg: unknown, send: (r: unknown) => void) => unknown;
} {
  let registered: ((raw: unknown, sender: unknown, send: unknown) => unknown) | null = null;
  const chromeStub: ChromeStub = {
    runtime: {
      sendMessage: vi.fn(() => Promise.resolve()),
      onMessage: {
        addListener: vi.fn((l: typeof registered) => {
          registered = l;
        }),
        removeListener: vi.fn(),
      },
    },
    tabs: { query: vi.fn(async () => data.tabs ?? []) },
    bookmarks: { search: vi.fn(async () => data.bookmarks ?? []) },
    history: { search: vi.fn(async () => data.history ?? []) },
    // `readSettings()` reads here; an empty object resolves to DEFAULTS (google).
    storage: { sync: { get: vi.fn(async () => ({})) } },
  };
  (globalThis as unknown as { chrome: ChromeStub }).chrome = chromeStub;
  return { deliver: (msg, send) => registered?.(msg, {}, send) };
}

function request(query: string, windowId = 100, requestId = 'r1') {
  return { type: 'lunma/launcher-suggestions-request', requestId, query, windowId };
}

/** Await a sendResponse callback that the async handler resolves on a microtask. */
function deferred() {
  let resolve!: (r: unknown) => void;
  const promise = new Promise<{ type: string; requestId: string; results: LauncherResult[] }>(
    (res) => {
      resolve = res as (r: unknown) => void;
    },
  );
  return { send: (r: unknown) => resolve(r), promise };
}

describe('registerLauncherSuggestionsHandler', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  test('responds with scored results echoing the requestId', async () => {
    const { deliver } = installChromeStub({
      tabs: [
        { id: 7, windowId: 100, title: 'Docs site', url: 'https://docs.example/', active: false },
      ] as chrome.tabs.Tab[],
      bookmarks: [
        { id: 'b1', title: 'Docs bookmark', url: 'https://other-docs/' },
      ] as chrome.bookmarks.BookmarkTreeNode[],
      history: [] as chrome.history.HistoryItem[],
    });
    const store = new LunmaStore({ idFactory: () => 'id-1' });
    registerLauncherSuggestionsHandler(store);

    const { send, promise } = deferred();
    const ret = deliver(request('docs', 100, 'req-42'), send);
    expect(ret).toBe(true); // async response kept open

    const reply = await promise;
    expect(reply.type).toBe('lunma/launcher-suggestions-response');
    expect(reply.requestId).toBe('req-42');
    expect(reply.results.length).toBeGreaterThan(0);
    // The websearch action row leads (search-first); among the data results the
    // open tab (highest source weight) is first.
    expect(reply.results[0]?.source).toBe('websearch');
    const dataResults = reply.results.filter(
      (r) => r.source !== 'websearch' && r.source !== 'navigate',
    );
    expect(dataResults[0]?.source).toBe('tab');
  });

  test('an empty query yields an empty result list without hitting chrome data APIs', async () => {
    const { deliver } = installChromeStub();
    const chromeStub = (globalThis as unknown as { chrome: ChromeStub }).chrome;
    const store = new LunmaStore({ idFactory: () => 'id-1' });
    registerLauncherSuggestionsHandler(store);

    const { send, promise } = deferred();
    deliver(request('   ', 100, 'r-empty'), send);
    const reply = await promise;
    expect(reply.results).toEqual([]);
    expect(reply.requestId).toBe('r-empty');
    expect(chromeStub.bookmarks.search).not.toHaveBeenCalled();
    expect(chromeStub.history.search).not.toHaveBeenCalled();
  });

  test('sources saved tabs from the store', async () => {
    const { deliver } = installChromeStub();
    const store = new LunmaStore({ idFactory: () => 'id-1' });
    store.state.savedTabs.s1 = {
      id: 's1',
      spaceId: 'work',
      title: 'Saved docs',
      originalURL: 'https://saved-docs/',
      currentURL: null,
    };
    registerLauncherSuggestionsHandler(store);

    const { send, promise } = deferred();
    deliver(request('docs', 100, 'r-saved'), send);
    const reply = await promise;
    expect(reply.results.some((r) => r.source === 'saved' && r.savedTabId === 's1')).toBe(true);
  });

  test('leads with the websearch action row for a non-empty query', async () => {
    const { deliver } = installChromeStub();
    const store = new LunmaStore({ idFactory: () => 'id-1' });
    registerLauncherSuggestionsHandler(store);

    const { send, promise } = deferred();
    deliver(request('react hooks', 100, 'r-ws'), send);
    const reply = await promise;
    const first = reply.results[0];
    expect(first?.source).toBe('websearch'); // top + preselected → Enter searches
    // Default engine is google (DEFAULTS); query encoded into the template.
    expect(first?.url).toBe('https://www.google.com/search?q=react%20hooks');
    // A multi-word query (whitespace) is search-only — no navigate row.
    expect(reply.results.some((r) => r.source === 'navigate')).toBe(false);
  });

  test('places the navigate action row second (right under search) for a URL-shaped query', async () => {
    const { deliver } = installChromeStub();
    const store = new LunmaStore({ idFactory: () => 'id-1' });
    registerLauncherSuggestionsHandler(store);

    const { send, promise } = deferred();
    deliver(request('react.dev', 100, 'r-nav'), send);
    const reply = await promise;
    // Search leads; the go-to row sits directly beneath it.
    expect(reply.results[0]?.source).toBe('websearch');
    expect(reply.results[1]?.source).toBe('navigate');
    expect(reply.results[1]?.url).toBe('https://react.dev');
  });

  test('an empty query yields no action rows', async () => {
    const { deliver } = installChromeStub();
    const store = new LunmaStore({ idFactory: () => 'id-1' });
    registerLauncherSuggestionsHandler(store);

    const { send, promise } = deferred();
    deliver(request('   ', 100, 'r-empty2'), send);
    const reply = await promise;
    expect(reply.results).toEqual([]);
  });

  test('action rows survive past the MAX_RESULTS cap (additive, not capped)', async () => {
    // 14 matching tabs → runSearch caps provider results to MAX_RESULTS (12);
    // the websearch action row rides past the cap (list length 13).
    const tabs = Array.from({ length: 14 }, (_, i) => ({
      id: i + 1,
      windowId: 100,
      title: `Doc ${i + 1}`,
      url: `https://doc${i + 1}.example/`,
      active: false,
    })) as chrome.tabs.Tab[];
    const { deliver } = installChromeStub({ tabs });
    const store = new LunmaStore({ idFactory: () => 'id-1' });
    registerLauncherSuggestionsHandler(store);

    const { send, promise } = deferred();
    deliver(request('doc', 100, 'r-cap'), send);
    const reply = await promise;
    expect(reply.results).toHaveLength(13); // 1 websearch + 12 provider
    expect(reply.results.filter((r) => r.source === 'tab')).toHaveLength(12);
    expect(reply.results[0]?.source).toBe('websearch'); // leads, beyond the cap
  });

  test('static analysis: never enqueues / mutates / persists / broadcasts', () => {
    const source = readFileSync(resolve(__dirname, 'launcher-suggestions-handler.ts'), 'utf-8');
    expect(source).not.toMatch(/\benqueue\b/);
    expect(source).not.toMatch(/\bCoordinator\b/);
    expect(source).not.toMatch(/broadcastState/);
    expect(source).not.toMatch(/from ['"].*chrome\/storage['"]/);
    // No persist import/call (the docstring's "persists" is not a word match).
    expect(source).not.toMatch(/from ['"].*messages['"][^\n]*persist/);
    expect(source).not.toMatch(/\bpersist\(/);
    // It only emits the suggestions response — never the broadcast helper.
    expect(source).not.toMatch(/broadcastState/);
  });

  test('concurrent with a drain: the response does not block on the queue', async () => {
    // The handler holds no coordinator reference; a slow data API resolving is
    // the only thing the response waits on, never a queue drain.
    let releaseTabs!: () => void;
    const tabsGate = new Promise<void>((res) => {
      releaseTabs = res;
    });
    const { deliver } = installChromeStub();
    const chromeStub = (globalThis as unknown as { chrome: ChromeStub }).chrome;
    chromeStub.tabs.query = vi.fn(async () => {
      await tabsGate;
      return [];
    });
    const store = new LunmaStore({ idFactory: () => 'id-1' });
    registerLauncherSuggestionsHandler(store);

    const { send, promise } = deferred();
    deliver(request('docs', 100, 'r-conc'), send);
    let settled = false;
    void promise.then(() => {
      settled = true;
    });
    await Promise.resolve();
    expect(settled).toBe(false); // still awaiting its own data fetch, nothing else
    releaseTabs();
    const reply = await promise;
    expect(reply.requestId).toBe('r-conc');
  });
});
