import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { ARCHIVE_MAX_ENTRIES, ARCHIVE_TTL_MS, LunmaStore } from './store.svelte';
import type { ArchivedTab } from './types';

function archived(archivedAt: number, overrides: Partial<ArchivedTab> = {}): ArchivedTab {
  return {
    tabId: archivedAt,
    url: `https://example.com/${archivedAt}`,
    title: `tab ${archivedAt}`,
    spaceId: 'work',
    archivedAt,
    ...overrides,
  };
}

let store: LunmaStore;

beforeEach(() => {
  store = new LunmaStore();
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('appendArchivedTab', () => {
  test('appends a record to archivedTabs', () => {
    const rec = archived(100);
    store.appendArchivedTab(rec);
    expect(store.state.archivedTabs).toEqual([rec]);
  });

  test('appends in call order', () => {
    store.appendArchivedTab(archived(1));
    store.appendArchivedTab(archived(2));
    expect(store.state.archivedTabs.map((e) => e.archivedAt)).toEqual([1, 2]);
  });
});

describe('pruneArchivedTabs', () => {
  test('enforces the FIFO entry cap, evicting the oldest by archivedAt', () => {
    // 101 entries, all within the TTL window (now = 101).
    for (let i = 1; i <= ARCHIVE_MAX_ENTRIES + 1; i += 1) store.appendArchivedTab(archived(i));
    store.pruneArchivedTabs(ARCHIVE_MAX_ENTRIES + 1);

    expect(store.state.archivedTabs).toHaveLength(ARCHIVE_MAX_ENTRIES);
    // The lowest archivedAt (1) is evicted; the newest (101) survives.
    expect(store.state.archivedTabs.find((e) => e.archivedAt === 1)).toBeUndefined();
    expect(
      store.state.archivedTabs.find((e) => e.archivedAt === ARCHIVE_MAX_ENTRIES + 1),
    ).toBeDefined();
  });

  test('drops entries older than the 30-day TTL', () => {
    const now = 100 * ARCHIVE_TTL_MS;
    store.appendArchivedTab(archived(now - ARCHIVE_TTL_MS - 1)); // older than 30d → dropped
    store.appendArchivedTab(archived(now - 1000)); // recent → kept
    store.pruneArchivedTabs(now);

    expect(store.state.archivedTabs.map((e) => e.archivedAt)).toEqual([now - 1000]);
  });

  test('an entry exactly at the TTL boundary is retained', () => {
    const now = 100 * ARCHIVE_TTL_MS;
    store.appendArchivedTab(archived(now - ARCHIVE_TTL_MS)); // == cutoff → kept (>=)
    store.pruneArchivedTabs(now);
    expect(store.state.archivedTabs).toHaveLength(1);
  });

  test('a zero-candidate prune (under both bounds) leaves the list unchanged', () => {
    const now = 100 * ARCHIVE_TTL_MS;
    store.appendArchivedTab(archived(now - 10));
    store.appendArchivedTab(archived(now - 5));
    store.pruneArchivedTabs(now);
    expect(store.state.archivedTabs.map((e) => e.archivedAt)).toEqual([now - 10, now - 5]);
  });

  test('uses a custom ttlMs when provided (the configurable retention window)', () => {
    const now = 100 * ARCHIVE_TTL_MS;
    const day = 24 * 60 * 60 * 1000;
    store.appendArchivedTab(archived(now - 8 * day)); // 8 days old
    store.appendArchivedTab(archived(now - 1000)); // fresh
    store.pruneArchivedTabs(now, 7 * day); // 7-day retention → the 8-day entry goes
    expect(store.state.archivedTabs.map((e) => e.archivedAt)).toEqual([now - 1000]);
  });

  test('defaults to the 30-day TTL when ttlMs is omitted', () => {
    const now = 100 * ARCHIVE_TTL_MS;
    store.appendArchivedTab(archived(now - ARCHIVE_TTL_MS - 1)); // > 30 days
    store.appendArchivedTab(archived(now - 1000));
    store.pruneArchivedTabs(now); // no ttlMs → 30-day default
    expect(store.state.archivedTabs.map((e) => e.archivedAt)).toEqual([now - 1000]);
  });

  test('both bounds compose: an entry must be within the cap AND younger than the TTL', () => {
    const now = 100 * ARCHIVE_TTL_MS;
    // One stale-but-recent-index entry (within the cap, beyond the TTL) → dropped.
    store.appendArchivedTab(archived(now - ARCHIVE_TTL_MS - 1));
    // Fill past the cap with fresh entries so the count bound also engages.
    for (let i = 0; i < ARCHIVE_MAX_ENTRIES; i += 1) store.appendArchivedTab(archived(now - i));
    store.pruneArchivedTabs(now);

    expect(store.state.archivedTabs).toHaveLength(ARCHIVE_MAX_ENTRIES);
    expect(store.state.archivedTabs.some((e) => e.archivedAt === now - ARCHIVE_TTL_MS - 1)).toBe(
      false,
    );
  });
});

describe('removeArchivedTab', () => {
  test('removes the entry matching the composite (archivedAt, tabId)', () => {
    store.appendArchivedTab(archived(10, { tabId: 1 }));
    store.appendArchivedTab(archived(20, { tabId: 2 }));
    store.appendArchivedTab(archived(10, { tabId: 3 })); // same archivedAt, different tab

    // Target the SECOND entry sharing archivedAt 10 by its tabId — composite
    // identity removes exactly it, not the first match.
    store.removeArchivedTab(10, 3);

    expect(store.state.archivedTabs.map((e) => e.tabId)).toEqual([1, 2]);
  });

  test('a matching archivedAt with a different tabId is a no-op', () => {
    store.appendArchivedTab(archived(10, { tabId: 1 }));
    store.removeArchivedTab(10, 999); // right time, wrong tab
    expect(store.state.archivedTabs.map((e) => e.tabId)).toEqual([1]);
  });

  test('is a no-op for an unknown (archivedAt, tabId)', () => {
    store.appendArchivedTab(archived(10, { tabId: 1 }));
    store.removeArchivedTab(999, 1);
    expect(store.state.archivedTabs.map((e) => e.archivedAt)).toEqual([10]);
  });
});

describe('clearArchivedTabs', () => {
  test('removes every archived record', () => {
    store.appendArchivedTab(archived(1, { tabId: 1 }));
    store.appendArchivedTab(archived(2, { tabId: 2 }));
    store.clearArchivedTabs();
    expect(store.state.archivedTabs).toEqual([]);
  });

  test('is a no-op when already empty', () => {
    store.clearArchivedTabs();
    expect(store.state.archivedTabs).toEqual([]);
  });
});

describe('setSpaceAutoArchive', () => {
  beforeEach(() => {
    store.state.spaces.push({ id: 'work', name: 'Work', color: 'blue', icon: 'star' });
  });

  test('sets an off override', () => {
    store.setSpaceAutoArchive('work', { mode: 'off' });
    expect(store.state.spaces[0]?.autoArchive).toEqual({ mode: 'off' });
  });

  test('sets a custom override', () => {
    store.setSpaceAutoArchive('work', { mode: 'custom', idleMinutes: 15 });
    expect(store.state.spaces[0]?.autoArchive).toEqual({ mode: 'custom', idleMinutes: 15 });
  });

  test('clears the override back to inherit when passed null', () => {
    store.setSpaceAutoArchive('work', { mode: 'custom', idleMinutes: 15 });
    store.setSpaceAutoArchive('work', null);
    expect(store.state.spaces[0]?.autoArchive).toBeUndefined();
    expect('autoArchive' in (store.state.spaces[0] ?? {})).toBe(false);
  });

  test('logs and no-ops on an unknown spaceId', () => {
    store.setSpaceAutoArchive('nope', { mode: 'off' });
    expect(store.state.spaces[0]?.autoArchive).toBeUndefined();
    expect(console.error).toHaveBeenCalled();
  });
});

describe('setActiveTab refreshes tabLastActivity on focus-loss (auto-archive activity signal)', () => {
  function liveTab(tabId: number, active: boolean): void {
    store.state.liveTabsById[tabId] = {
      tabId,
      windowId: 100,
      title: `t${tabId}`,
      url: `https://example.com/${tabId}`,
      active,
      status: 'complete',
    };
  }

  test('a tab losing focus has its tabLastActivity refreshed to now', () => {
    liveTab(1, true); // currently focused
    liveTab(2, false);
    store.state.tabLastActivity[1] = 1000; // stale (last navigation)
    store.state.tabLastActivity[2] = 2000;
    vi.spyOn(Date, 'now').mockReturnValue(999_000);

    store.setActiveTab(100, 2); // focus moves 1 → 2

    // The defocused tab's idle clock is refreshed to "now"…
    expect(store.state.tabLastActivity[1]).toBe(999_000);
    // …the incoming active tab is NOT stamped (it's excluded while active).
    expect(store.state.tabLastActivity[2]).toBe(2000);
  });

  test('a never-navigated outgoing tab is NOT given a tabLastActivity entry', () => {
    liveTab(1, true);
    liveTab(2, false);
    // tab 1 has no tabLastActivity entry (never navigated) → stays unarchivable.
    vi.spyOn(Date, 'now').mockReturnValue(999_000);

    store.setActiveTab(100, 2);

    expect(1 in store.state.tabLastActivity).toBe(false);
  });

  test('re-activating the already-active tab stamps nothing', () => {
    liveTab(1, true);
    store.state.tabLastActivity[1] = 1000;
    vi.spyOn(Date, 'now').mockReturnValue(999_000);

    store.setActiveTab(100, 1); // no flag changes

    expect(store.state.tabLastActivity[1]).toBe(1000);
  });

  test('only the focused window is affected', () => {
    liveTab(1, true);
    store.state.liveTabsById[3] = {
      tabId: 3,
      windowId: 200,
      title: 't3',
      url: 'https://example.com/3',
      active: true,
      status: 'complete',
    };
    store.state.tabLastActivity[1] = 1000;
    store.state.tabLastActivity[3] = 3000;
    liveTab(2, false);
    vi.spyOn(Date, 'now').mockReturnValue(999_000);

    store.setActiveTab(100, 2);

    expect(store.state.tabLastActivity[1]).toBe(999_000); // window 100 outgoing refreshed
    expect(store.state.tabLastActivity[3]).toBe(3000); // window 200 untouched
  });
});
