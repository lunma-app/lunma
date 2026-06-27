import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { Settings } from '../shared/settings';
import { LunmaStore } from '../shared/store.svelte';
import type { AppState, Space, SpaceId } from '../shared/types';
import {
  AUTO_ARCHIVE_ALARM_NAME,
  autoArchiveAlarmPeriodMinutes,
  computeArchiveCandidates,
  handleAutoArchiveAlarm,
  handleAutoArchiveSweep,
  handleRestoreArchivedTab,
  registerAutoArchiveAlarm,
  resolveSpaceAutoArchive,
  unregisterAutoArchiveAlarm,
} from './auto-archive';

function settings(over: Partial<Settings> = {}): Settings {
  return {
    density: 'normal',
    tint: 'vivid',
    theme: 'dark',
    showGlares: true,
    reduceMotion: false,
    pinnedTabBoundaryDefault: 'off',
    defaultSearchEngine: 'google',
    customSearchUrl: '',
    customSearchKeyword: '',
    launcherScope: 'prefer-current-space',
    dedupNewTabNavigations: true,
    autoArchiveEnabled: true,
    autoArchiveIdleMinutes: 60,
    autoArchiveRetentionDays: 30,
    ...over,
  };
}

function space(id: string, over: Partial<Space> = {}): Space {
  return { id, name: id, color: 'blue', icon: 'star', ...over };
}

// ── resolveSpaceAutoArchive (pure) ─────────────────────────────────────────
describe('resolveSpaceAutoArchive', () => {
  test('master off → disabled (defensive), threshold echoes the global', () => {
    expect(resolveSpaceAutoArchive(space('w'), settings({ autoArchiveEnabled: false }))).toEqual({
      enabled: false,
      idleMinutes: 60,
    });
  });

  test('absent override (master on) → inherit the global threshold', () => {
    expect(resolveSpaceAutoArchive(space('w'), settings())).toEqual({
      enabled: true,
      idleMinutes: 60,
    });
  });

  test('{ mode: off } (master on) → disabled even though the global toggle is on', () => {
    expect(
      resolveSpaceAutoArchive(space('w', { autoArchive: { mode: 'off' } }), settings()),
    ).toEqual({ enabled: false, idleMinutes: 60 });
  });

  test('{ mode: custom } → enabled at the Space’s own threshold', () => {
    expect(
      resolveSpaceAutoArchive(
        space('w', { autoArchive: { mode: 'custom', idleMinutes: 15 } }),
        settings(),
      ),
    ).toEqual({ enabled: true, idleMinutes: 15 });
  });

  test('idleMinutes is clamped to a floor of 1 (global and custom)', () => {
    expect(resolveSpaceAutoArchive(space('w'), settings({ autoArchiveIdleMinutes: 0 }))).toEqual({
      enabled: true,
      idleMinutes: 1,
    });
    expect(
      resolveSpaceAutoArchive(
        space('w', { autoArchive: { mode: 'custom', idleMinutes: 0 } }),
        settings(),
      ),
    ).toEqual({ enabled: true, idleMinutes: 1 });
  });
});

// ── computeArchiveCandidates (pure) ────────────────────────────────────────
const HOUR_MS = 60 * 60_000;

function snapshotWith(over: Partial<AppState> = {}): AppState {
  const store = new LunmaStore();
  Object.assign(store.state, over);
  return store.snapshot();
}

/** A constant effective config for all Spaces — enabled, 60-minute threshold. */
const enabled60 = (_spaceId: SpaceId) => ({ enabled: true, thresholdMs: HOUR_MS });

describe('computeArchiveCandidates', () => {
  function baseSnapshot(): AppState {
    return snapshotWith({
      spaceInstancesByWindow: {
        100: { work: { spaceId: 'work', groupId: 1, tempTabIds: [1, 2, 3], tempTabTitles: {} } },
      },
      tabLastActivity: { 1: 0, 2: 0, 3: 0 }, // all far older than the threshold
    });
  }

  test('all stale, non-excluded temporary tabs are candidates', () => {
    const got = computeArchiveCandidates(baseSnapshot(), {
      activeTabIds: new Set(),
      pinnedTabIds: new Set(),
      now: 10 * HOUR_MS,
      effectiveForSpace: enabled60,
    });
    expect(got).toEqual([
      { tabId: 1, spaceId: 'work' },
      { tabId: 2, spaceId: 'work' },
      { tabId: 3, spaceId: 'work' },
    ]);
  });

  test('a pinned tab is excluded', () => {
    const got = computeArchiveCandidates(baseSnapshot(), {
      activeTabIds: new Set(),
      pinnedTabIds: new Set([1]),
      now: 10 * HOUR_MS,
      effectiveForSpace: enabled60,
    });
    expect(got.map((c) => c.tabId)).toEqual([2, 3]);
  });

  test('the active tab of a window is excluded', () => {
    const got = computeArchiveCandidates(baseSnapshot(), {
      activeTabIds: new Set([2]),
      pinnedTabIds: new Set(),
      now: 10 * HOUR_MS,
      effectiveForSpace: enabled60,
    });
    expect(got.map((c) => c.tabId)).toEqual([1, 3]);
  });

  test('a Lunma-bound tab (value in tabBindings) is excluded', () => {
    const snap = snapshotWith({
      spaceInstancesByWindow: {
        100: { work: { spaceId: 'work', groupId: 1, tempTabIds: [1, 2, 3], tempTabTitles: {} } },
      },
      tabLastActivity: { 1: 0, 2: 0, 3: 0 },
      tabBindings: { st1: { 100: 3 } },
    });
    const got = computeArchiveCandidates(snap, {
      activeTabIds: new Set(),
      pinnedTabIds: new Set(),
      now: 10 * HOUR_MS,
      effectiveForSpace: enabled60,
    });
    expect(got.map((c) => c.tabId)).toEqual([1, 2]);
  });

  test('a tab with no tabLastActivity entry is never a candidate', () => {
    const snap = snapshotWith({
      spaceInstancesByWindow: {
        100: { work: { spaceId: 'work', groupId: 1, tempTabIds: [1, 2], tempTabTitles: {} } },
      },
      tabLastActivity: { 1: 0 }, // 2 has no entry
    });
    const got = computeArchiveCandidates(snap, {
      activeTabIds: new Set(),
      pinnedTabIds: new Set(),
      now: 10 * HOUR_MS,
      effectiveForSpace: enabled60,
    });
    expect(got.map((c) => c.tabId)).toEqual([1]);
  });

  test('a fresh tab (within its Space threshold) is excluded', () => {
    const snap = snapshotWith({
      spaceInstancesByWindow: {
        100: { work: { spaceId: 'work', groupId: 1, tempTabIds: [1], tempTabTitles: {} } },
      },
      tabLastActivity: { 1: 10 * HOUR_MS - 1000 }, // 1s ago, threshold is 60m
    });
    const got = computeArchiveCandidates(snap, {
      activeTabIds: new Set(),
      pinnedTabIds: new Set(),
      now: 10 * HOUR_MS,
      effectiveForSpace: enabled60,
    });
    expect(got).toEqual([]);
  });

  test('a Space resolving to off contributes no candidates', () => {
    const got = computeArchiveCandidates(baseSnapshot(), {
      activeTabIds: new Set(),
      pinnedTabIds: new Set(),
      now: 10 * HOUR_MS,
      effectiveForSpace: () => ({ enabled: false, thresholdMs: HOUR_MS }),
    });
    expect(got).toEqual([]);
  });

  test('per-Space thresholds apply independently', () => {
    const snap = snapshotWith({
      spaceInstancesByWindow: {
        100: {
          fast: { spaceId: 'fast', groupId: 1, tempTabIds: [1], tempTabTitles: {} },
          slow: { spaceId: 'slow', groupId: 2, tempTabIds: [2], tempTabTitles: {} },
        },
      },
      // Both idle ~30 minutes.
      tabLastActivity: { 1: 10 * HOUR_MS - 30 * 60_000, 2: 10 * HOUR_MS - 30 * 60_000 },
    });
    const got = computeArchiveCandidates(snap, {
      activeTabIds: new Set(),
      pinnedTabIds: new Set(),
      now: 10 * HOUR_MS,
      // fast: 15m threshold (30m idle → archive); slow: 60m threshold (still fresh).
      effectiveForSpace: (id) =>
        id === 'fast'
          ? { enabled: true, thresholdMs: 15 * 60_000 }
          : { enabled: true, thresholdMs: 60 * 60_000 },
    });
    expect(got).toEqual([{ tabId: 1, spaceId: 'fast' }]);
  });
});

// ── chrome-touching handlers ───────────────────────────────────────────────
interface AutoArchiveChromeStub {
  storage: { sync: { get: ReturnType<typeof vi.fn> } };
  tabs: {
    query: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
  };
  alarms: { create: ReturnType<typeof vi.fn>; clear: ReturnType<typeof vi.fn> };
}

function installChrome(
  opts: { settings?: Partial<Settings>; tabs?: Array<Partial<chrome.tabs.Tab>> } = {},
): AutoArchiveChromeStub {
  const tabs = opts.tabs ?? [];
  const stub: AutoArchiveChromeStub = {
    storage: {
      sync: { get: vi.fn(async () => (opts.settings ? { 'lunma.settings': opts.settings } : {})) },
    },
    tabs: {
      query: vi.fn(async () => tabs),
      remove: vi.fn(async () => undefined),
      create: vi.fn(async () => ({ id: 999, windowId: 100 }) as chrome.tabs.Tab),
    },
    alarms: { create: vi.fn(), clear: vi.fn(async () => true) },
  };
  (globalThis as unknown as { chrome: AutoArchiveChromeStub }).chrome = stub;
  return stub;
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('handleAutoArchiveSweep', () => {
  test('removes a stale tab, records it with the right fields, and prunes', async () => {
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
    const store = new LunmaStore();
    store.state.spaces.push({ id: 'work', name: 'Work', color: 'blue', icon: 'star' });
    store.state.spaceInstancesByWindow[100] = {
      work: { spaceId: 'work', groupId: 1, tempTabIds: [42], tempTabTitles: {} },
    };
    store.state.tabLastActivity[42] = 0;

    const changed = await handleAutoArchiveSweep(store);

    expect(changed).toBe(true);
    expect(chromeStub.tabs.remove).toHaveBeenCalledWith(42);
    expect(store.state.archivedTabs).toHaveLength(1);
    const rec = store.state.archivedTabs[0];
    expect(rec?.url).toBe('https://example.com/');
    expect(rec?.title).toBe('Example');
    expect(rec?.spaceId).toBe('work');
    expect(rec?.tabId).toBe(42);
    expect(typeof rec?.archivedAt).toBe('number');
  });

  test('prunes a >30-day-old entry even with zero candidates', async () => {
    installChrome({ settings: { autoArchiveEnabled: true, autoArchiveIdleMinutes: 60 }, tabs: [] });
    const store = new LunmaStore();
    store.state.archivedTabs.push({
      tabId: 1,
      url: 'https://old.example/',
      title: 'Old',
      spaceId: 'work',
      archivedAt: 0, // epoch → far older than 30 days
    });

    const changed = await handleAutoArchiveSweep(store);

    expect(changed).toBe(true);
    expect(store.state.archivedTabs).toHaveLength(0);
  });

  test('skips a stale candidate whose tab Chrome no longer has (no remove, no record, no error)', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const chromeStub = installChrome({
      settings: { autoArchiveEnabled: true, autoArchiveIdleMinutes: 60 },
      tabs: [], // Chrome has no tabs — the tempTabId below is stale.
    });
    const store = new LunmaStore();
    store.state.spaces.push({ id: 'work', name: 'Work', color: 'blue', icon: 'star' });
    store.state.spaceInstancesByWindow[100] = {
      work: { spaceId: 'work', groupId: 1, tempTabIds: [42], tempTabTitles: {} },
    };
    store.state.tabLastActivity[42] = 0; // stale, but tab 42 isn't live anymore

    const changed = await handleAutoArchiveSweep(store);

    expect(changed).toBe(false);
    expect(chromeStub.tabs.remove).not.toHaveBeenCalled();
    expect(store.state.archivedTabs).toHaveLength(0);
    // No error logged — a stale candidate is benign (debug only).
    expect(errSpy).not.toHaveBeenCalled();
  });

  test('honours the configured retention window (autoArchiveRetentionDays) when pruning', async () => {
    installChrome({
      settings: {
        autoArchiveEnabled: true,
        autoArchiveIdleMinutes: 60,
        autoArchiveRetentionDays: 1,
      },
      tabs: [],
    });
    const store = new LunmaStore();
    const day = 24 * 60 * 60 * 1000;
    // Archived 2 days ago — within the 30-day default but beyond a 1-day retention.
    store.state.archivedTabs.push({
      tabId: 1,
      url: 'https://old.example/',
      title: 'Old',
      spaceId: 'work',
      archivedAt: Date.now() - 2 * day,
    });

    const changed = await handleAutoArchiveSweep(store);

    expect(changed).toBe(true);
    expect(store.state.archivedTabs).toHaveLength(0);
  });

  test('a fully fresh sweep changes nothing (no broadcast signal)', async () => {
    installChrome({ settings: { autoArchiveEnabled: true, autoArchiveIdleMinutes: 60 }, tabs: [] });
    const store = new LunmaStore();
    const changed = await handleAutoArchiveSweep(store);
    expect(changed).toBe(false);
    expect(store.state.archivedTabs).toHaveLength(0);
  });
});

describe('handleRestoreArchivedTab', () => {
  test('opens the URL in the window and removes the record', async () => {
    const chromeStub = installChrome();
    const store = new LunmaStore();
    store.state.archivedTabs.push({
      tabId: 5,
      url: 'https://example.com/',
      title: 'Example',
      spaceId: 'work',
      archivedAt: 123,
    });

    await handleRestoreArchivedTab(store, { archivedAt: 123, tabId: 5, windowId: 100 });

    expect(chromeStub.tabs.create).toHaveBeenCalledWith({
      url: 'https://example.com/',
      windowId: 100,
    });
    expect(store.state.archivedTabs).toHaveLength(0);
  });

  test('disambiguates same-archivedAt entries by tabId', async () => {
    const chromeStub = installChrome();
    const store = new LunmaStore();
    // Two tabs archived in one sweep share archivedAt; only tabId distinguishes them.
    store.state.archivedTabs.push(
      { tabId: 1, url: 'https://a/', title: 'A', spaceId: 'work', archivedAt: 500 },
      { tabId: 2, url: 'https://b/', title: 'B', spaceId: 'work', archivedAt: 500 },
    );

    await handleRestoreArchivedTab(store, { archivedAt: 500, tabId: 2, windowId: 100 });

    // Exactly tab 2 reopened + removed; tab 1 untouched.
    expect(chromeStub.tabs.create).toHaveBeenCalledWith({ url: 'https://b/', windowId: 100 });
    expect(store.state.archivedTabs.map((e) => e.tabId)).toEqual([1]);
  });

  test('throws when no entry matches the (archivedAt, tabId) pair', async () => {
    const chromeStub = installChrome();
    const store = new LunmaStore();

    await expect(
      handleRestoreArchivedTab(store, { archivedAt: 999, tabId: 5, windowId: 100 }),
    ).rejects.toThrow(/no archived tab \(archivedAt 999, tabId 5\)/);
    expect(chromeStub.tabs.create).not.toHaveBeenCalled();
  });
});

describe('handleAutoArchiveAlarm', () => {
  const sweepAlarm = { name: AUTO_ARCHIVE_ALARM_NAME } as chrome.alarms.Alarm;

  test('enqueues exactly one sweep when the master switch is on', async () => {
    installChrome({ settings: { autoArchiveEnabled: true, autoArchiveIdleMinutes: 60 } });
    const enqueue = vi.fn();
    await handleAutoArchiveAlarm({ enqueue }, sweepAlarm);
    expect(enqueue).toHaveBeenCalledTimes(1);
    expect(enqueue).toHaveBeenCalledWith({ source: 'alarm', kind: 'autoArchiveSweep' });
  });

  test('does not enqueue when the master switch is off', async () => {
    installChrome({ settings: { autoArchiveEnabled: false, autoArchiveIdleMinutes: 60 } });
    const enqueue = vi.fn();
    await handleAutoArchiveAlarm({ enqueue }, sweepAlarm);
    expect(enqueue).not.toHaveBeenCalled();
  });

  test('ignores a foreign alarm name', async () => {
    installChrome({ settings: { autoArchiveEnabled: true, autoArchiveIdleMinutes: 60 } });
    const enqueue = vi.fn();
    await handleAutoArchiveAlarm({ enqueue }, { name: 'some/other-alarm' } as chrome.alarms.Alarm);
    expect(enqueue).not.toHaveBeenCalled();
  });
});

describe('autoArchiveAlarmPeriodMinutes', () => {
  test('is half the idle threshold, floored at Chrome’s 1-minute minimum', () => {
    expect(autoArchiveAlarmPeriodMinutes({ autoArchiveIdleMinutes: 720 })).toBe(360);
    expect(autoArchiveAlarmPeriodMinutes({ autoArchiveIdleMinutes: 60 })).toBe(30);
    expect(autoArchiveAlarmPeriodMinutes({ autoArchiveIdleMinutes: 3 })).toBe(1);
    expect(autoArchiveAlarmPeriodMinutes({ autoArchiveIdleMinutes: 1 })).toBe(1);
  });
});

describe('registerAutoArchiveAlarm', () => {
  test('creates the alarm at the threshold-derived period when enabled', () => {
    const chromeStub = installChrome();
    registerAutoArchiveAlarm({ autoArchiveEnabled: true, autoArchiveIdleMinutes: 60 });
    expect(chromeStub.alarms.create).toHaveBeenCalledWith(AUTO_ARCHIVE_ALARM_NAME, {
      periodInMinutes: 30,
    });
  });

  test('is a no-op when disabled (no alarm created)', () => {
    const chromeStub = installChrome();
    registerAutoArchiveAlarm({ autoArchiveEnabled: false, autoArchiveIdleMinutes: 60 });
    expect(chromeStub.alarms.create).not.toHaveBeenCalled();
  });
});

describe('unregisterAutoArchiveAlarm', () => {
  test('clears the sweep alarm by name', async () => {
    const chromeStub = installChrome();
    await unregisterAutoArchiveAlarm();
    expect(chromeStub.alarms.clear).toHaveBeenCalledWith(AUTO_ARCHIVE_ALARM_NAME);
  });
});
