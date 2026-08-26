import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { Space, SpaceColor } from '../shared/types';
import { resetCloseCascade } from './close-cascade';
import { makeCoordinator } from './coordinator.test-helpers';

function space(id: string, name = id, color: SpaceColor = 'blue'): Space {
  return { id, name, color, icon: 'star' };
}

const WINDOW = 100;

let removed: number[];
let created: number;
let sent: unknown[];

beforeEach(() => {
  resetCloseCascade();
  removed = [];
  created = 0;
  sent = [];
  (globalThis as unknown as { chrome: unknown }).chrome = {
    tabs: {
      // A survivor is always present unless a test says otherwise, so the
      // replacement-tab path stays out of the way of the cascade assertions.
      query: vi.fn(async () => [{ id: 999, windowId: WINDOW }]),
      create: vi.fn(async () => {
        created += 1;
        return { id: 1000 };
      }),
      remove: vi.fn(async (ids: number[]) => {
        removed.push(...ids);
      }),
      sendMessage: vi.fn(async () => undefined),
    },
    runtime: {
      id: 'test',
      sendMessage: vi.fn(async (msg: unknown) => {
        sent.push(msg);
      }),
    },
  };
});

/**
 * A Space in one window with `temp` as its temporary tabs, plus a lineage map of
 * `tabId → resolved parent`. Pinned/other-Space tabs are added to `liveTabsById`
 * without appearing in `temp`, which is exactly how the cascade must see them.
 */
function seed(
  temp: number[],
  parents: Record<number, number | undefined>,
  extraLive: number[] = [],
) {
  const { coordinator, store } = makeCoordinator();
  coordinator.setProvenanceEnabled(true);
  coordinator.setCloseChildTabsWithParent(true);
  store.state.spaces.push(space('work'));
  store.state.activeSpaceByWindow[WINDOW] = 'work';
  store.state.spaceInstancesByWindow[WINDOW] = {
    work: { spaceId: 'work', groupId: 1, tempTabIds: [...temp], tempTabTitles: {} },
  };
  for (const id of [...temp, ...extraLive]) {
    store.state.liveTabsById[id] = {
      tabId: id,
      windowId: WINDOW,
      title: `tab ${id}`,
      url: `https://x/${id}`,
      active: false,
      status: 'complete',
      provenanceToken: `T${id}`,
      ...(parents[id] === undefined ? {} : { provenanceParentTabId: parents[id] }),
    };
  }
  // Back the resolved parents with the durable token edges they are derived
  // from. Without these, the first close's `resolveAllParents` finds an empty
  // edge slice and flattens every remaining tab — which would silently make any
  // follow-up assertion about lineage vacuous.
  for (const [child, parent] of Object.entries(parents)) {
    if (parent === undefined) continue;
    store.state.provenanceByToken[`T${child}`] = {
      parentToken: `T${parent}`,
      recordedAt: 1,
    };
  }
  return { coordinator, store };
}

function close(
  coordinator: ReturnType<typeof makeCoordinator>['coordinator'],
  tabId: number,
  isWindowClosing = false,
) {
  coordinator.enqueue({
    source: 'chrome',
    kind: 'tabs.onRemoved',
    payload: { tabId, info: { windowId: WINDOW, isWindowClosing } },
  });
  return coordinator.idle();
}

describe('close cascade — what goes', () => {
  test('a parent takes both its children', async () => {
    const { coordinator } = seed([1, 2, 3], { 2: 1, 3: 1 });
    await close(coordinator, 1);
    expect(removed.sort()).toEqual([2, 3]);
  });

  test('a three-level chain goes whole', async () => {
    const { coordinator } = seed([1, 2, 3], { 2: 1, 3: 2 });
    await close(coordinator, 1);
    expect(removed.sort()).toEqual([2, 3]);
  });

  test('an unrelated tab survives', async () => {
    const { coordinator } = seed([1, 2, 9], { 2: 1 });
    await close(coordinator, 1);
    expect(removed).toEqual([2]);
  });

  test('closing a child leaves the parent open', async () => {
    const { coordinator } = seed([1, 2], { 2: 1 });
    await close(coordinator, 2);
    expect(removed).toEqual([]);
  });
});

describe('close cascade — guards', () => {
  test('a window teardown cascades nothing', async () => {
    // Every tab is removed on a window close; cascading would archive the whole
    // session as though the user had discarded it.
    const { coordinator, store } = seed([1, 2], { 2: 1 });
    await close(coordinator, 1, true);
    expect(removed).toEqual([]);
    expect(store.state.archivedTabs).toEqual([]);
  });

  test('the setting off cascades nothing', async () => {
    const { coordinator } = seed([1, 2], { 2: 1 });
    coordinator.setCloseChildTabsWithParent(false);
    await close(coordinator, 1);
    expect(removed).toEqual([]);
  });

  test('provenance off cascades nothing', async () => {
    const { coordinator } = seed([1, 2], { 2: 1 });
    coordinator.setProvenanceEnabled(false);
    await close(coordinator, 1);
    expect(removed).toEqual([]);
  });

  test('a removal that is the cascade’s own work starts no second cascade', async () => {
    // Chrome reports onRemoved for each tab the cascade closed. Re-entering would
    // produce one archive batch per level and undo would restore only the last.
    const { coordinator, store } = seed([1, 2, 3], { 2: 1, 3: 2 });
    await close(coordinator, 1);
    const batches = new Set(store.state.archivedTabs.map((a) => a.archivedAt));
    removed.length = 0;

    await close(coordinator, 2); // the cascade's own removal reported back
    expect(removed).toEqual([]);
    expect(new Set(store.state.archivedTabs.map((a) => a.archivedAt))).toEqual(batches);
  });

  test('closing a pinned tab cascades nothing', async () => {
    // `spaceOwningTab` answers for a pinned tab too — through `tabBindings`, not
    // `tempTabIds` — so resolving a Space is NOT enough to justify a cascade.
    // The binding below is what makes this test exercise the temp-list fence
    // rather than falling out at the `spaceId === null` check above it.
    const { coordinator, store } = seed([2], { 2: 7 }, [7]);
    store.state.savedTabs.saved1 = {
      id: 'saved1',
      spaceId: 'work',
      title: 'pinned',
      originalURL: 'https://x/7',
      currentURL: null,
    };
    store.state.tabBindings.saved1 = { [WINDOW]: 7 };

    await close(coordinator, 7);

    expect(removed).toEqual([]);
  });
});

describe('close cascade — scope', () => {
  test('a descendant outside the Space temp list survives', async () => {
    const { coordinator } = seed([1, 2], { 2: 1, 5: 1 }, [5]);
    await close(coordinator, 1);
    expect(removed).toEqual([2]);
  });

  test('a subtree below an excluded tab survives', async () => {
    // 1 ← 5 (pinned) ← 6 (temp): 6 is only reachable through 5, which the cascade
    // may not touch, so 6 is not confidently part of the subtree.
    const { coordinator } = seed([1, 6], { 5: 1, 6: 5 }, [5]);
    await close(coordinator, 1);
    expect(removed).toEqual([]);
  });
});

describe('close cascade — batch, undo, announcement', () => {
  test('every descendant is archived under ONE stamp', async () => {
    const { coordinator, store } = seed([1, 2, 3], { 2: 1, 3: 2 });
    await close(coordinator, 1);
    const stamps = new Set(store.state.archivedTabs.map((a) => a.archivedAt));
    expect(store.state.archivedTabs.map((a) => a.tabId).sort()).toEqual([2, 3]);
    expect(stamps.size).toBe(1);
  });

  test('the directly-closed tab is NOT archived', async () => {
    const { coordinator, store } = seed([1, 2], { 2: 1 });
    await close(coordinator, 1);
    expect(store.state.archivedTabs.map((a) => a.tabId)).not.toContain(1);
  });

  test('no descendant is archived twice', async () => {
    const { coordinator, store } = seed([1, 2, 3], { 2: 1, 3: 1 });
    await close(coordinator, 1);
    const ids = store.state.archivedTabs.map((a) => a.tabId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('the announcement carries exactly the archived ids', async () => {
    const { coordinator, store } = seed([1, 2, 3], { 2: 1, 3: 2 });
    await close(coordinator, 1);
    const msg = sent.find((m) => (m as { type?: string }).type === 'lunma/cascade-closed') as
      | { windowId: number; tabIds: number[] }
      | undefined;
    expect(msg?.windowId).toBe(WINDOW);
    expect([...(msg?.tabIds ?? [])].sort()).toEqual(
      store.state.archivedTabs.map((a) => a.tabId).sort(),
    );
  });

  test('a rejected announcement does not fail the cascade', async () => {
    // No sidebar listening is the ORDINARY case for a tab-strip close, so the
    // broadcast rejecting must not read as an error or undo the archive.
    (
      globalThis as unknown as { chrome: { runtime: { sendMessage: unknown } } }
    ).chrome.runtime.sendMessage = vi.fn(async () => {
      throw new Error('Could not establish connection.');
    });
    const { coordinator, store } = seed([1, 2], { 2: 1 });
    await close(coordinator, 1);
    expect(removed).toEqual([2]);
    expect(store.state.archivedTabs.map((a) => a.tabId)).toEqual([2]);
  });

  test('the window is never left empty', async () => {
    (globalThis as unknown as { chrome: { tabs: { query: unknown } } }).chrome.tabs.query = vi.fn(
      async () => [{ id: 2, windowId: WINDOW }],
    );
    const { coordinator } = seed([1, 2], { 2: 1 });
    await close(coordinator, 1);
    expect(created).toBe(1);
  });
});
