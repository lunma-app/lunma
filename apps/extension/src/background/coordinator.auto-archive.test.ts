import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { Settings } from '../shared/settings';
import type { PendingEvent } from './coordinator';
import { makeCoordinator, sidebar } from './coordinator.test-helpers';

interface AutoArchiveChromeStub {
  storage: { sync: { get: ReturnType<typeof vi.fn> } };
  tabs: {
    query: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
  };
}

function installChrome(
  opts: { settings?: Partial<Settings>; tabs?: Array<Partial<chrome.tabs.Tab>> } = {},
): AutoArchiveChromeStub {
  const tabs = opts.tabs ?? [];
  const stub: AutoArchiveChromeStub = {
    storage: {
      sync: {
        get: vi.fn(async () => (opts.settings ? { 'lunma.settings': opts.settings } : {})),
      },
    },
    tabs: {
      query: vi.fn(async () => tabs),
      remove: vi.fn(async () => undefined),
      create: vi.fn(async () => ({ id: 999, windowId: 100 }) as chrome.tabs.Tab),
    },
  };
  (globalThis as unknown as { chrome: AutoArchiveChromeStub }).chrome = stub;
  return stub;
}

const alarmSweep = (): PendingEvent => ({ source: 'alarm', kind: 'autoArchiveSweep' });

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('autoArchiveSweep coordinator command', () => {
  test('a sweep drains: a stale temporary tab is removed, recorded, and broadcast', async () => {
    const chromeStub = installChrome({
      settings: { autoArchiveEnabled: true, autoArchiveIdleMinutes: 60 },
      tabs: [
        {
          id: 42,
          windowId: 100,
          url: 'https://example.com/',
          title: 'Example',
          active: false,
          pinned: false,
        },
      ],
    });
    const { coordinator, store, persist, broadcast, emitAck } = makeCoordinator();
    store.state.spaces.push({ id: 'work', name: 'Work', color: 'blue', icon: 'star' });
    store.state.spaceInstancesByWindow[100] = {
      work: { spaceId: 'work', groupId: 1, tempTabIds: [42], tempTabTitles: {} },
    };
    store.state.tabLastActivity[42] = 0; // epoch → far older than the 60-minute threshold
    store.state.liveTabsById[42] = {
      tabId: 42,
      windowId: 100,
      url: 'https://example.com/',
      title: 'Example',
      active: false,
      status: 'complete',
    };

    coordinator.enqueue(alarmSweep());
    await coordinator.idle();

    expect(chromeStub.tabs.remove).toHaveBeenCalledWith(42);
    expect(store.state.archivedTabs).toHaveLength(1);
    expect(store.state.archivedTabs[0]).toMatchObject({
      tabId: 42,
      url: 'https://example.com/',
      title: 'Example',
      spaceId: 'work',
    });
    expect(persist).toHaveBeenCalledTimes(1);
    expect(broadcast).toHaveBeenCalledTimes(1);
    // The alarm source is fire-and-forget — no ack is emitted for it.
    expect(emitAck).not.toHaveBeenCalled();
  });

  test('two queued sweeps run sequentially (not coalesced)', async () => {
    const chromeStub = installChrome({
      settings: { autoArchiveEnabled: true, autoArchiveIdleMinutes: 60 },
      tabs: [],
    });
    const { coordinator } = makeCoordinator();

    coordinator.enqueue(alarmSweep());
    coordinator.enqueue(alarmSweep());
    await coordinator.idle();

    // Both ran (each queries Chrome once) — coalescing would collapse to one.
    expect(chromeStub.tabs.query).toHaveBeenCalledTimes(2);
  });
});

describe('restoreArchivedTab coordinator command', () => {
  test('opens the URL, removes the record, acks ok, and broadcasts', async () => {
    const chromeStub = installChrome();
    const { coordinator, store, persist, broadcast, emitAck } = makeCoordinator();
    store.state.archivedTabs.push({
      tabId: 5,
      url: 'https://example.com/',
      title: 'Example',
      spaceId: 'work',
      archivedAt: 123,
    });

    coordinator.enqueue(
      sidebar(
        { kind: 'restoreArchivedTab', payload: { archivedAt: 123, tabId: 5, windowId: 100 } },
        'sess:1',
      ),
    );
    await coordinator.idle();

    expect(chromeStub.tabs.create).toHaveBeenCalledWith({
      url: 'https://example.com/',
      windowId: 100,
    });
    expect(store.state.archivedTabs).toHaveLength(0);
    expect(persist).toHaveBeenCalledTimes(1);
    expect(broadcast).toHaveBeenCalledTimes(1);
    expect(emitAck).toHaveBeenCalledWith({ type: 'lunma/command-ack', id: 'sess:1', result: 'ok' });
  });

  test('an unknown archivedAt throws → error ack, no tab created', async () => {
    const chromeStub = installChrome();
    const { coordinator, emitAck } = makeCoordinator();

    coordinator.enqueue(
      sidebar(
        { kind: 'restoreArchivedTab', payload: { archivedAt: 999, tabId: 5, windowId: 100 } },
        'sess:1',
      ),
    );
    await coordinator.idle();

    expect(chromeStub.tabs.create).not.toHaveBeenCalled();
    expect(emitAck.mock.calls[0]?.[0]).toMatchObject({
      id: 'sess:1',
      result: { error: expect.stringContaining('no archived tab (archivedAt 999, tabId 5)') },
    });
  });
});

describe('undoClearTempTabs coordinator command', () => {
  test('restores the most-recent archived entry per tabId into the window, in order', async () => {
    const chromeStub = installChrome();
    const { coordinator, store, emitAck } = makeCoordinator();
    // One cleared batch (shared archivedAt 500) plus an OLDER entry for tab 10 —
    // the undo must target the BATCH entry (latest), not the stale one.
    store.state.archivedTabs.push(
      { tabId: 10, url: 'https://old/', title: 'old', spaceId: 'work', archivedAt: 100 },
      { tabId: 10, url: 'https://a/', title: 'A', spaceId: 'work', archivedAt: 500 },
      { tabId: 11, url: 'https://b/', title: 'B', spaceId: 'work', archivedAt: 500 },
    );

    coordinator.enqueue(
      sidebar(
        { kind: 'undoClearTempTabs', payload: { windowId: 100, tabIds: [10, 11] } },
        'sess:1',
      ),
    );
    await coordinator.idle();

    // Restored in tabIds order, into window 100, picking the latest entry for tab 10.
    expect(chromeStub.tabs.create).toHaveBeenNthCalledWith(1, {
      url: 'https://a/',
      windowId: 100,
    });
    expect(chromeStub.tabs.create).toHaveBeenNthCalledWith(2, {
      url: 'https://b/',
      windowId: 100,
    });
    // The two restored batch records are removed; tab 10's older entry survives.
    expect(store.state.archivedTabs).toEqual([
      { tabId: 10, url: 'https://old/', title: 'old', spaceId: 'work', archivedAt: 100 },
    ]);
    expect(emitAck).toHaveBeenCalledWith({ type: 'lunma/command-ack', id: 'sess:1', result: 'ok' });
  });

  test('skips a tabId whose archived entry no longer survives, without error', async () => {
    const chromeStub = installChrome();
    const { coordinator, store, emitAck } = makeCoordinator();
    // tab 11 was evicted (no entry) — undo must skip it and still restore 10 and 12.
    store.state.archivedTabs.push(
      { tabId: 10, url: 'https://a/', title: 'A', spaceId: 'work', archivedAt: 500 },
      { tabId: 12, url: 'https://c/', title: 'C', spaceId: 'work', archivedAt: 500 },
    );

    coordinator.enqueue(
      sidebar(
        { kind: 'undoClearTempTabs', payload: { windowId: 100, tabIds: [10, 11, 12] } },
        'sess:1',
      ),
    );
    await coordinator.idle();

    expect(chromeStub.tabs.create).toHaveBeenCalledTimes(2); // 10 and 12 only
    expect(store.state.archivedTabs).toHaveLength(0);
    expect(emitAck).toHaveBeenCalledWith({ type: 'lunma/command-ack', id: 'sess:1', result: 'ok' });
  });
});

describe('setSpaceAutoArchive coordinator command', () => {
  test('applies the override, acks ok, and broadcasts', async () => {
    installChrome();
    const { coordinator, store, persist, broadcast, emitAck } = makeCoordinator();
    store.state.spaces.push({ id: 'work', name: 'Work', color: 'blue', icon: 'star' });

    coordinator.enqueue(
      sidebar(
        {
          kind: 'setSpaceAutoArchive',
          payload: { spaceId: 'work', autoArchive: { mode: 'custom', idleMinutes: 15 } },
        },
        'sess:1',
      ),
    );
    await coordinator.idle();

    expect(store.state.spaces[0]?.autoArchive).toEqual({ mode: 'custom', idleMinutes: 15 });
    expect(persist).toHaveBeenCalledTimes(1);
    expect(broadcast).toHaveBeenCalledTimes(1);
    expect(emitAck).toHaveBeenCalledWith({ type: 'lunma/command-ack', id: 'sess:1', result: 'ok' });
  });

  test('clearing to inherit (null) removes the override', async () => {
    installChrome();
    const { coordinator, store } = makeCoordinator();
    store.state.spaces.push({
      id: 'work',
      name: 'Work',
      color: 'blue',
      icon: 'star',
      autoArchive: { mode: 'off' },
    });

    coordinator.enqueue(
      sidebar(
        { kind: 'setSpaceAutoArchive', payload: { spaceId: 'work', autoArchive: null } },
        'sess:1',
      ),
    );
    await coordinator.idle();

    expect(store.state.spaces[0]?.autoArchive).toBeUndefined();
  });

  test('an unknown spaceId throws → error ack', async () => {
    installChrome();
    const { coordinator, emitAck } = makeCoordinator();

    coordinator.enqueue(
      sidebar(
        { kind: 'setSpaceAutoArchive', payload: { spaceId: 'nope', autoArchive: { mode: 'off' } } },
        'sess:1',
      ),
    );
    await coordinator.idle();

    expect(emitAck.mock.calls[0]?.[0]).toMatchObject({
      id: 'sess:1',
      result: { error: expect.stringContaining("unknown spaceId 'nope'") },
    });
  });
});

describe('clearArchivedTabs coordinator command', () => {
  test('clears all archived records, acks ok, and broadcasts', async () => {
    installChrome();
    const { coordinator, store, persist, broadcast, emitAck } = makeCoordinator();
    store.state.archivedTabs.push(
      { tabId: 1, url: 'https://a/', title: 'A', spaceId: 'work', archivedAt: 1 },
      { tabId: 2, url: 'https://b/', title: 'B', spaceId: 'work', archivedAt: 2 },
    );

    coordinator.enqueue(sidebar({ kind: 'clearArchivedTabs', payload: {} }, 'sess:1'));
    await coordinator.idle();

    expect(store.state.archivedTabs).toHaveLength(0);
    expect(persist).toHaveBeenCalledTimes(1);
    expect(broadcast).toHaveBeenCalledTimes(1);
    expect(emitAck).toHaveBeenCalledWith({ type: 'lunma/command-ack', id: 'sess:1', result: 'ok' });
  });

  test('is a no-op (no broadcast) when already empty, but still acks ok', async () => {
    installChrome();
    const { coordinator, broadcast, emitAck } = makeCoordinator();

    coordinator.enqueue(sidebar({ kind: 'clearArchivedTabs', payload: {} }, 'sess:1'));
    await coordinator.idle();

    expect(broadcast).not.toHaveBeenCalled();
    expect(emitAck).toHaveBeenCalledWith({ type: 'lunma/command-ack', id: 'sess:1', result: 'ok' });
  });
});

describe('deleteArchivedTab coordinator command', () => {
  test('removes the matching record (no tab reopened), acks ok, and broadcasts', async () => {
    const chromeStub = installChrome();
    const { coordinator, store, persist, broadcast, emitAck } = makeCoordinator();
    store.state.archivedTabs.push(
      { tabId: 1, url: 'https://a/', title: 'A', spaceId: 'work', archivedAt: 100 },
      { tabId: 2, url: 'https://b/', title: 'B', spaceId: 'work', archivedAt: 200 },
    );

    coordinator.enqueue(
      sidebar({ kind: 'deleteArchivedTab', payload: { archivedAt: 100, tabId: 1 } }, 'sess:1'),
    );
    await coordinator.idle();

    expect(store.state.archivedTabs.map((e) => e.tabId)).toEqual([2]);
    expect(chromeStub.tabs.create).not.toHaveBeenCalled(); // delete, not restore
    expect(persist).toHaveBeenCalledTimes(1);
    expect(broadcast).toHaveBeenCalledTimes(1);
    expect(emitAck).toHaveBeenCalledWith({ type: 'lunma/command-ack', id: 'sess:1', result: 'ok' });
  });

  test('is a no-op (no broadcast) when the entry is already gone, but still acks ok', async () => {
    installChrome();
    const { coordinator, broadcast, emitAck } = makeCoordinator();

    coordinator.enqueue(
      sidebar({ kind: 'deleteArchivedTab', payload: { archivedAt: 999, tabId: 1 } }, 'sess:1'),
    );
    await coordinator.idle();

    expect(broadcast).not.toHaveBeenCalled();
    expect(emitAck).toHaveBeenCalledWith({ type: 'lunma/command-ack', id: 'sess:1', result: 'ok' });
  });
});
