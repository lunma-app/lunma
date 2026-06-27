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
  permissions: {
    contains: ReturnType<typeof vi.fn>;
    request: ReturnType<typeof vi.fn>;
    onAdded: { addListener: ReturnType<typeof vi.fn>; removeListener: ReturnType<typeof vi.fn> };
    onRemoved: { addListener: ReturnType<typeof vi.fn>; removeListener: ReturnType<typeof vi.fn> };
  };
}

interface StubData {
  tabs?: chrome.tabs.Tab[];
  bookmarks?: chrome.bookmarks.BookmarkTreeNode[];
  history?: chrome.history.HistoryItem[];
  /** Stored `lunma.settings` (partial; missing fields degrade to DEFAULTS). */
  settings?: Record<string, unknown>;
  /** Optional-permission grants (least-privilege-permissions D5). Each defaults
   * to GRANTED, so existing suites consult both optional providers unchanged. */
  granted?: { bookmarks?: boolean; history?: boolean };
}

function installChromeStub(data: StubData = {}): {
  deliver: (msg: unknown, send: (r: unknown) => void) => unknown;
  chromeStub: ChromeStub;
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
    // `readSettings()` reads here; an empty object resolves to DEFAULTS (google,
    // launcherScope `prefer-current-space`).
    storage: {
      sync: {
        get: vi.fn(async () => (data.settings ? { 'lunma.settings': data.settings } : {})),
      },
    },
    // The handler gates `bookmarks`/`history` on `hasApiPermission` (D5); resolve
    // each query from `data.granted` (defaulting to granted).
    permissions: {
      contains: vi.fn(async (q: { permissions?: string[] }) => {
        const name = q.permissions?.[0];
        if (name === 'bookmarks') return data.granted?.bookmarks ?? true;
        if (name === 'history') return data.granted?.history ?? true;
        return true;
      }),
      request: vi.fn(async () => true),
      onAdded: { addListener: vi.fn(), removeListener: vi.fn() },
      onRemoved: { addListener: vi.fn(), removeListener: vi.fn() },
    },
  };
  (globalThis as unknown as { chrome: ChromeStub }).chrome = chromeStub;
  return { deliver: (msg, send) => registered?.(msg, {}, send), chromeStub };
}

function request(query: string, windowId = 100, requestId = 'r1') {
  return { type: 'lunma/launcher-suggestions-request', requestId, query, windowId };
}

/** Await a sendResponse callback that the async handler resolves on a microtask. */
function deferred() {
  let resolve!: (r: unknown) => void;
  const promise = new Promise<{
    type: string;
    requestId: string;
    results: LauncherResult[];
    openUrls?: string[];
  }>((res) => {
    resolve = res as (r: unknown) => void;
  });
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

  // ── optional-permission gating (least-privilege-permissions D5) ────────────
  describe('optional-permission gating', () => {
    const bm = [
      { id: 'b1', title: 'Docs bookmark', url: 'https://bm-docs/' },
    ] as chrome.bookmarks.BookmarkTreeNode[];
    const hist = [
      { id: 'h1', title: 'Docs history', url: 'https://hist-docs/', lastVisitTime: 1 },
    ] as chrome.history.HistoryItem[];

    test('with both granted, the engine consults bookmarks and history', async () => {
      const { deliver, chromeStub } = installChromeStub({ bookmarks: bm, history: hist });
      registerLauncherSuggestionsHandler(new LunmaStore({ idFactory: () => 'id-1' }));
      const { send, promise } = deferred();
      deliver(request('docs', 100, 'r-both'), send);
      const reply = await promise;
      expect(chromeStub.bookmarks.search).toHaveBeenCalled();
      expect(chromeStub.history.search).toHaveBeenCalled();
      expect(reply.results.some((r) => r.source === 'bookmark')).toBe(true);
      expect(reply.results.some((r) => r.source === 'history')).toBe(true);
    });

    test('ungranted history is omitted entirely — no chrome.history.* call, no error', async () => {
      const { deliver, chromeStub } = installChromeStub({
        bookmarks: bm,
        history: hist,
        granted: { history: false },
      });
      registerLauncherSuggestionsHandler(new LunmaStore({ idFactory: () => 'id-1' }));
      const { send, promise } = deferred();
      deliver(request('docs', 100, 'r-nohist'), send);
      const reply = await promise;
      expect(chromeStub.history.search).not.toHaveBeenCalled();
      expect(reply.results.some((r) => r.source === 'history')).toBe(false);
      // The remaining optional provider (bookmarks) still runs.
      expect(chromeStub.bookmarks.search).toHaveBeenCalled();
      expect(reply.results.some((r) => r.source === 'bookmark')).toBe(true);
    });

    test('ungranted bookmarks is omitted entirely — no chrome.bookmarks.* call, no error', async () => {
      const { deliver, chromeStub } = installChromeStub({
        bookmarks: bm,
        history: hist,
        granted: { bookmarks: false },
      });
      registerLauncherSuggestionsHandler(new LunmaStore({ idFactory: () => 'id-1' }));
      const { send, promise } = deferred();
      deliver(request('docs', 100, 'r-nobm'), send);
      const reply = await promise;
      expect(chromeStub.bookmarks.search).not.toHaveBeenCalled();
      expect(reply.results.some((r) => r.source === 'bookmark')).toBe(false);
      expect(chromeStub.history.search).toHaveBeenCalled();
      expect(reply.results.some((r) => r.source === 'history')).toBe(true);
    });

    test('both ungranted: open tabs still run and no error is surfaced', async () => {
      const { deliver, chromeStub } = installChromeStub({
        tabs: [
          { id: 7, windowId: 100, title: 'Docs site', url: 'https://docs.example/', active: false },
        ] as chrome.tabs.Tab[],
        bookmarks: bm,
        history: hist,
        granted: { bookmarks: false, history: false },
      });
      registerLauncherSuggestionsHandler(new LunmaStore({ idFactory: () => 'id-1' }));
      const { send, promise } = deferred();
      deliver(request('docs', 100, 'r-none'), send);
      const reply = await promise;
      expect(chromeStub.bookmarks.search).not.toHaveBeenCalled();
      expect(chromeStub.history.search).not.toHaveBeenCalled();
      // The always-on open-tabs source still contributes; the response is normal.
      expect(reply.results.some((r) => r.source === 'tab')).toBe(true);
    });
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

  test('reports openUrls for a result already open in the active Space (tab-dedup)', async () => {
    // No chrome tab at react.dev (so the navigate row survives, additive); but the
    // store's active Space has a temp tab there → isUrlOpenInActiveSpace is true.
    const { deliver } = installChromeStub();
    const store = new LunmaStore({ idFactory: () => 'id-1' });
    store.state.spaces.push({ id: 'work', name: 'Work', color: 'blue', icon: 'star' });
    store.state.activeSpaceByWindow[100] = 'work';
    store.state.spaceInstancesByWindow[100] = {
      work: { spaceId: 'work', groupId: 1, tempTabIds: [42], tempTabTitles: {} },
    };
    store.state.liveTabsById[42] = {
      tabId: 42,
      windowId: 100,
      title: 'React',
      url: 'https://react.dev',
      active: false,
      status: 'complete',
    };
    registerLauncherSuggestionsHandler(store);

    const { send, promise } = deferred();
    deliver(request('react.dev', 100, 'r-open'), send);
    const reply = await promise;
    // The navigate row carries https://react.dev and that URL is open in the Space.
    expect(
      reply.results.some((r) => r.source === 'navigate' && r.url === 'https://react.dev'),
    ).toBe(true);
    expect(reply.openUrls).toContain('https://react.dev');
  });

  test('omits openUrls when nothing is open in the active Space', async () => {
    const { deliver } = installChromeStub();
    const store = new LunmaStore({ idFactory: () => 'id-1' });
    registerLauncherSuggestionsHandler(store);

    const { send, promise } = deferred();
    deliver(request('react.dev', 100, 'r-noopen'), send);
    const reply = await promise;
    // No active Space / no open tabs → the field is omitted (kept off the wire).
    expect(reply.openUrls).toBeUndefined();
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

  // ── Current-Space scope (launcher-fuzzy-smart-folders, design D9) ──────────

  /** A store with two Spaces, each owning one smart folder of one item; window
   * 100's active Space is `work`. The two items match the same query (`parser`). */
  function storeWithCrossSpaceLens(): LunmaStore {
    const store = new LunmaStore({ idFactory: () => 'id-1' });
    store.state.spaces.push(
      { id: 'work', name: 'Work', color: 'blue', icon: 'star' },
      { id: 'home', name: 'Home', color: 'green', icon: 'star' },
    );
    store.state.activeSpaceByWindow[100] = 'work';
    store.state.pinnedBySpace.work = [
      {
        kind: 'lens',
        lensKind: 'general',
        id: 'sf-work',
        name: 'Work PRs',
        icon: 'git-pull-request',
        sources: [{ sourceId: 'acc-gh', queries: ['authored'] }],
        maxItems: 20,
        hideRead: false,
        refreshMinutes: 10,
      },
    ];
    store.state.pinnedBySpace.home = [
      {
        kind: 'lens',
        lensKind: 'general',
        id: 'sf-home',
        name: 'Home Feed',
        icon: 'rss',
        sources: [{ sourceId: 'acc-rss', queries: [] }],
        maxItems: 20,
        hideRead: false,
        refreshMinutes: 10,
      },
    ];
    store.state.lenses['sf-work'] = {
      sections: {
        'github:github.com': {
          state: 'ok',
          fetchedAt: 1,
          items: [{ id: 'w1', title: 'parser fix', url: 'https://work/pr/1' }],
        },
      },
    };
    store.state.lenses['sf-home'] = {
      sections: {
        'rss:h.example': {
          state: 'ok',
          fetchedAt: 1,
          items: [{ id: 'h1', title: 'parser fix', url: 'https://home/post/1' }],
        },
      },
    };
    return store;
  }

  const lensByUrl = (reply: { results: LauncherResult[] }, url: string) =>
    reply.results.find((r) => r.source === 'lens' && r.url === url);

  test('global scope: cross-Space smart items appear and are not boosted', async () => {
    const { deliver } = installChromeStub({ settings: { launcherScope: 'global' } });
    const store = storeWithCrossSpaceLens();
    registerLauncherSuggestionsHandler(store);

    const { send, promise } = deferred();
    deliver(request('parser', 100, 'r-global'), send);
    const reply = await promise;
    const work = lensByUrl(reply, 'https://work/pr/1');
    const home = lensByUrl(reply, 'https://home/post/1');
    expect(work).toBeDefined();
    expect(home).toBeDefined();
    // Equal match + equal source + no boost → equal score (global is Space-blind).
    expect(work?.score).toBeCloseTo(home?.score ?? -1, 10);
  });

  test('prefer-current-space scope: the in-Space item outscores its cross-Space peer', async () => {
    // Default settings ⇒ prefer-current-space (no override needed).
    const { deliver } = installChromeStub();
    const store = storeWithCrossSpaceLens();
    registerLauncherSuggestionsHandler(store);

    const { send, promise } = deferred();
    deliver(request('parser', 100, 'r-prefer'), send);
    const reply = await promise;
    const work = lensByUrl(reply, 'https://work/pr/1');
    const home = lensByUrl(reply, 'https://home/post/1');
    expect(work).toBeDefined();
    expect(home).toBeDefined();
    // The active-Space (work) item carries the boost; both still reachable.
    expect(work?.score ?? 0).toBeGreaterThan(home?.score ?? 0);
  });

  test('cross-Space items carry a Space marker (name + colour); in-Space items do not', async () => {
    const { deliver } = installChromeStub(); // default prefer-current-space
    const store = storeWithCrossSpaceLens(); // active Space = "Work"
    registerLauncherSuggestionsHandler(store);

    const { send, promise } = deferred();
    deliver(request('parser', 100, 'r-mark'), send);
    const reply = await promise;
    const home = lensByUrl(reply, 'https://home/post/1');
    const work = lensByUrl(reply, 'https://work/pr/1');
    // The other-Space ("Home") item is marked with its name + a paintable colour.
    expect(home?.spaceName).toBe('Home');
    expect(home?.spaceColor).toMatch(/^oklch\(/);
    // The active-Space ("Work") item is NOT marked.
    expect(work?.spaceName).toBeUndefined();
    expect(work?.spaceColor).toBeUndefined();
  });

  test('current-space-only scope: cross-Space smart items are filtered out', async () => {
    const { deliver } = installChromeStub({ settings: { launcherScope: 'current-space-only' } });
    const store = storeWithCrossSpaceLens();
    registerLauncherSuggestionsHandler(store);

    const { send, promise } = deferred();
    deliver(request('parser', 100, 'r-strict'), send);
    const reply = await promise;
    expect(lensByUrl(reply, 'https://work/pr/1')).toBeDefined();
    expect(lensByUrl(reply, 'https://home/post/1')).toBeUndefined();
  });

  test('current-space-only scope keeps global favorites (no owning Space)', async () => {
    const { deliver } = installChromeStub({ settings: { launcherScope: 'current-space-only' } });
    const store = storeWithCrossSpaceLens();
    // A favicon-row favorite (spaceId null) is global — it must survive the filter.
    store.state.savedTabs.fav = {
      id: 'fav',
      spaceId: null,
      title: 'parser favorite',
      originalURL: 'https://fav/parser',
      currentURL: null,
    };
    store.state.faviconRow = ['fav'];
    registerLauncherSuggestionsHandler(store);

    const { send, promise } = deferred();
    deliver(request('parser', 100, 'r-strict-fav'), send);
    const reply = await promise;
    expect(reply.results.some((r) => r.source === 'saved' && r.savedTabId === 'fav')).toBe(true);
    // …while the other Space's smart item is still hidden.
    expect(lensByUrl(reply, 'https://home/post/1')).toBeUndefined();
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
