import { beforeEach, describe, expect, test, vi } from 'vitest';
import { PROVENANCE_SESSION_MARKER_KEY } from '../shared/provenance';
import { makeStore } from '../shared/store.test-helpers';
import {
  maybeEndSweep,
  pruneOnBoot,
  resolveAllParents,
  syncAllTabIdentities,
  tearDownProvenance,
} from './provenance';

const tabsQuery = vi.fn();
const sendMessage = vi.fn();
const sessionGet = vi.fn();
const sessionSet = vi.fn();
const executeScript = vi.fn();
const getManifest = vi.fn();

beforeEach(() => {
  tabsQuery.mockReset().mockResolvedValue([]);
  sendMessage.mockReset().mockResolvedValue(undefined);
  sessionGet.mockReset().mockResolvedValue({});
  sessionSet.mockReset().mockResolvedValue(undefined);
  executeScript.mockReset().mockResolvedValue([]);
  getManifest.mockReset().mockReturnValue({
    content_scripts: [
      { js: ['assets/overlay.ts-loader.js'] },
      { js: ['assets/tab-token.ts-loader.js'] },
    ],
  });
  vi.stubGlobal('chrome', {
    tabs: { query: tabsQuery, sendMessage },
    storage: { session: { get: sessionGet, set: sessionSet } },
    scripting: { executeScript },
    runtime: { getManifest },
  });
});

function liveTab(store: ReturnType<typeof makeStore>, tabId: number, token?: string) {
  store.state.liveTabsById[tabId] = {
    tabId,
    windowId: 100,
    title: '',
    url: 'https://x/',
    active: false,
    status: 'complete',
    ...(token ? { provenanceToken: token } : {}),
  };
}

describe('resolveAllParents', () => {
  test('maps a child to its parent TAB id via the token edge', () => {
    const store = makeStore();
    liveTab(store, 1, 'TP');
    liveTab(store, 2, 'TC');
    store.recordProvenanceEdge('TC', 'TP', 1);
    resolveAllParents(store);
    expect(store.state.liveTabsById[2]?.provenanceParentTabId).toBe(1);
    expect(store.state.liveTabsById[1]?.provenanceParentTabId).toBeUndefined();
  });

  test('a parent token with no live tab leaves the child a root', () => {
    const store = makeStore();
    liveTab(store, 2, 'TC');
    store.recordProvenanceEdge('TC', 'GONE', 1);
    resolveAllParents(store);
    expect(store.state.liveTabsById[2]?.provenanceParentTabId).toBeUndefined();
  });
});

describe('pruneOnBoot', () => {
  test('keeps only what live tokens can still claim', () => {
    const store = makeStore();
    liveTab(store, 1, 'TC');
    store.recordProvenanceEdge('TC', 'TP', 1);
    store.recordProvenanceEdge('ORPHAN', 'X', 1);
    pruneOnBoot(store);
    expect(Object.keys(store.state.provenanceByToken)).toEqual(['TC']);
  });
});

describe('tearDownProvenance', () => {
  test('clears edges and parents, flags the sweep, and does NOT revoke anything', () => {
    const store = makeStore();
    liveTab(store, 1, 'TP');
    liveTab(store, 2, 'TC');
    store.recordProvenanceEdge('TC', 'TP', 1);
    resolveAllParents(store);
    tabsQuery.mockResolvedValue([{ id: 2, url: 'https://x/' }]);
    return tearDownProvenance(store).then(() => {
      expect(store.state.provenanceByToken).toEqual({});
      expect(store.state.liveTabsById[2]?.provenanceParentTabId).toBeUndefined();
      expect(store.state.provenanceCleanupPending).toBe(true);
      expect(sendMessage).toHaveBeenCalledWith(2, { type: 'lunma/provenance-clear' });
    });
  });
});

describe('maybeEndSweep', () => {
  test('does NOT end on a vacuous sweep within the same browser session', async () => {
    const store = makeStore();
    store.setProvenanceCleanupPending(true);
    sessionGet.mockResolvedValue({ [PROVENANCE_SESSION_MARKER_KEY]: true }); // same session
    await maybeEndSweep(store);
    expect(store.state.provenanceCleanupPending).toBe(true);
  });

  test('does NOT end on a fresh session that restored http tabs', async () => {
    const store = makeStore();
    store.setProvenanceCleanupPending(true);
    tabsQuery.mockResolvedValue([{ id: 1, url: 'https://restored/' }]);
    await maybeEndSweep(store);
    expect(store.state.provenanceCleanupPending).toBe(true);
  });

  test('ends on a fresh session with no http tab — nothing can hold a marker', async () => {
    const store = makeStore();
    store.setProvenanceCleanupPending(true);
    tabsQuery.mockResolvedValue([{ id: 1, url: 'chrome://newtab/' }]);
    await maybeEndSweep(store);
    expect(store.state.provenanceCleanupPending).toBe(false);
  });

  test('reads the marker BEFORE writing it, or the condition never holds', async () => {
    const store = makeStore();
    store.setProvenanceCleanupPending(true);
    await maybeEndSweep(store);
    expect(sessionGet).toHaveBeenCalled();
    expect(sessionSet).toHaveBeenCalledWith({ [PROVENANCE_SESSION_MARKER_KEY]: true });
    expect(sessionGet.mock.invocationCallOrder[0]).toBeLessThan(
      sessionSet.mock.invocationCallOrder[0] as number,
    );
  });
});

// Reloading the extension kills the content scripts already running in open
// pages, and a declarative content script only enters tabs opened or reloaded
// AFTER the extension loads. So on every install, update, or unpacked reload,
// messaging an open tab finds no receiver: the tab stays unidentified and every
// link opened from it resolves to a root — until the user manually reloads that
// page. The sweep therefore injects before it talks.
describe('syncAllTabIdentities — reaching pages that predate this extension load', () => {
  test('injects the token script into each http tab before messaging it', async () => {
    const store = makeStore();
    tabsQuery.mockResolvedValue([
      { id: 1, url: 'https://a.example/' },
      { id: 2, url: 'https://b.example/' },
    ]);
    const order: string[] = [];
    executeScript.mockImplementation(async (o: { target: { tabId: number } }) => {
      order.push(`inject:${o.target.tabId}`);
      return [];
    });
    sendMessage.mockImplementation(async (tabId: number) => {
      order.push(`send:${tabId}`);
      return undefined;
    });

    await syncAllTabIdentities(store);

    expect(order.indexOf('inject:1')).toBeLessThan(order.indexOf('send:1'));
    expect(order.indexOf('inject:2')).toBeLessThan(order.indexOf('send:2'));
  });

  test('injects the token script, not another content script', async () => {
    const store = makeStore();
    tabsQuery.mockResolvedValue([{ id: 1, url: 'https://a.example/' }]);

    await syncAllTabIdentities(store);

    expect(executeScript).toHaveBeenCalledWith({
      target: { tabId: 1 },
      files: ['assets/tab-token.ts-loader.js'],
    });
  });

  test('a tab Chrome forbids injecting does not abort the sweep', async () => {
    const store = makeStore();
    tabsQuery.mockResolvedValue([
      { id: 1, url: 'https://a.example/' },
      { id: 2, url: 'https://b.example/' },
    ]);
    executeScript.mockImplementation(async (o: { target: { tabId: number } }) => {
      if (o.target.tabId === 1) throw new Error('Cannot access contents of the page');
      return [];
    });

    await syncAllTabIdentities(store);

    expect(executeScript).toHaveBeenCalledTimes(2);
    expect(sendMessage).toHaveBeenCalledWith(2, expect.anything());
  });

  test('non-http tabs are never injected', async () => {
    const store = makeStore();
    tabsQuery.mockResolvedValue([{ id: 3, url: 'chrome://settings' }]);

    await syncAllTabIdentities(store);

    expect(executeScript).not.toHaveBeenCalled();
  });
});
