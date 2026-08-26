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

/** The confirmation request the worker sent, if it sent one. */
function ask(): { spaceId: string; tabIds: number[]; title: string } | undefined {
  return sent.find((m) => (m as { type?: string }).type === 'lunma/cascade-confirm') as
    | { spaceId: string; tabIds: number[]; title: string }
    | undefined;
}

/** Answer the worker's request with a yes — what clicking the prompt does. */
function accept(coordinator: ReturnType<typeof makeCoordinator>['coordinator']) {
  const asked = ask();
  if (!asked) throw new Error('accept(): the worker never asked');
  coordinator.enqueue({
    source: 'sidebar',
    kind: 'closeChildTabs',
    payload: { windowId: WINDOW, spaceId: asked.spaceId, tabIds: asked.tabIds },
    correlationId: 'cmd:test',
  });
  return coordinator.idle();
}

describe('close cascade — what goes, once confirmed', () => {
  test('a parent takes both its children', async () => {
    const { coordinator } = seed([1, 2, 3], { 2: 1, 3: 1 });
    await close(coordinator, 1);
    expect(removed).toEqual([]); // asked, not acted on
    await accept(coordinator);
    expect(removed.sort()).toEqual([2, 3]);
  });

  test('a three-level chain goes whole', async () => {
    const { coordinator } = seed([1, 2, 3], { 2: 1, 3: 2 });
    await close(coordinator, 1);
    await accept(coordinator);
    expect(removed.sort()).toEqual([2, 3]);
  });

  test('an unrelated tab survives', async () => {
    const { coordinator } = seed([1, 2, 9], { 2: 1 });
    await close(coordinator, 1);
    await accept(coordinator);
    expect(removed).toEqual([2]);
  });

  test('closing a child leaves the parent open', async () => {
    const { coordinator } = seed([1, 2], { 2: 1 });
    await close(coordinator, 2);
    expect(ask()).toBeUndefined();
    expect(removed).toEqual([]);
  });

  test('an unanswered prompt closes nothing', async () => {
    // Dismissing is a decision, and the decision is no. Nothing is archived
    // either — the batch is not touched until the answer arrives.
    const { coordinator, store } = seed([1, 2], { 2: 1 });
    await close(coordinator, 1);
    expect(ask()?.tabIds).toEqual([2]);
    expect(removed).toEqual([]);
    expect(store.state.archivedTabs).toEqual([]);
  });
});

describe('close cascade — guards', () => {
  test('a window teardown cascades nothing', async () => {
    // Every tab is removed on a window close; cascading would archive the whole
    // session as though the user had discarded it.
    const { coordinator, store } = seed([1, 2], { 2: 1 });
    await close(coordinator, 1, true);
    expect(ask()).toBeUndefined(); // not even asked
    expect(removed).toEqual([]);
    expect(store.state.archivedTabs).toEqual([]);
  });

  test('the setting off cascades nothing', async () => {
    const { coordinator } = seed([1, 2], { 2: 1 });
    coordinator.setCloseChildTabsWithParent(false);
    await close(coordinator, 1);
    expect(ask()).toBeUndefined();
  });

  test('provenance off cascades nothing', async () => {
    const { coordinator } = seed([1, 2], { 2: 1 });
    coordinator.setProvenanceEnabled(false);
    await close(coordinator, 1);
    expect(ask()).toBeUndefined();
  });

  test('a removal that is the cascade’s own work starts no second cascade', async () => {
    // Chrome reports onRemoved for each tab the cascade closed. Re-entering would
    // produce one archive batch per level and undo would restore only the last.
    const { coordinator } = seed([1, 2, 3], { 2: 1, 3: 2 });
    await close(coordinator, 1);
    await accept(coordinator);
    sent.length = 0;
    removed.length = 0;

    await close(coordinator, 2); // the cascade's own removal reported back
    expect(ask()).toBeUndefined();
    expect(removed).toEqual([]);
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

    expect(ask()).toBeUndefined();
  });
});

describe('close cascade — scope', () => {
  test('a descendant outside the Space temp list survives', async () => {
    const { coordinator } = seed([1, 2], { 2: 1, 5: 1 }, [5]);
    await close(coordinator, 1);
    await accept(coordinator);
    expect(removed).toEqual([2]);
  });

  test('a subtree below an excluded tab survives', async () => {
    // 1 ← 5 (pinned) ← 6 (temp): 6 is only reachable through 5, which the cascade
    // may not touch, so 6 is not confidently part of the subtree.
    const { coordinator } = seed([1, 6], { 5: 1, 6: 5 }, [5]);
    await close(coordinator, 1);
    expect(ask()).toBeUndefined();
    expect(removed).toEqual([]);
  });
});

describe('close cascade — the request, and the batch it produces', () => {
  test('the request names the tabs and the Space, and archives nothing yet', async () => {
    const { coordinator, store } = seed([1, 2, 3], { 2: 1, 3: 2 });
    await close(coordinator, 1);

    expect(ask()?.spaceId).toBe('work');
    expect([...(ask()?.tabIds ?? [])].sort()).toEqual([2, 3]);
    expect(store.state.archivedTabs).toEqual([]);
  });

  test('the request carries the closed tab’s title, so the prompt can name it', async () => {
    const { coordinator } = seed([1, 2], { 2: 1 });
    await close(coordinator, 1);
    expect(ask()?.title).toBe('tab 1');
  });

  test('a request nobody answers leaves everything open', async () => {
    // The send rejects when no surface is listening. Not being able to ask is
    // not permission to act.
    (
      globalThis as unknown as { chrome: { runtime: { sendMessage: unknown } } }
    ).chrome.runtime.sendMessage = vi.fn(async () => {
      throw new Error('Could not establish connection.');
    });
    const { coordinator, store } = seed([1, 2], { 2: 1 });
    await close(coordinator, 1);
    expect(removed).toEqual([]);
    expect(store.state.archivedTabs).toEqual([]);
  });

  test('once confirmed, every tab is archived under ONE stamp', async () => {
    const { coordinator, store } = seed([1, 2, 3], { 2: 1, 3: 2 });
    await close(coordinator, 1);
    await accept(coordinator);

    const stamps = new Set(store.state.archivedTabs.map((a) => a.archivedAt));
    expect(store.state.archivedTabs.map((a) => a.tabId).sort()).toEqual([2, 3]);
    expect(stamps.size).toBe(1);
  });

  test('the directly-closed tab is NOT archived', async () => {
    const { coordinator, store } = seed([1, 2], { 2: 1 });
    await close(coordinator, 1);
    await accept(coordinator);
    expect(store.state.archivedTabs.map((a) => a.tabId)).not.toContain(1);
  });

  test('no tab is archived twice', async () => {
    const { coordinator, store } = seed([1, 2, 3], { 2: 1, 3: 1 });
    await close(coordinator, 1);
    await accept(coordinator);
    const ids = store.state.archivedTabs.map((a) => a.tabId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('a confirmation is re-validated against the tabs that still exist', async () => {
    // Seconds pass between the request and the answer. A tab that has since gone
    // is not closed again, and nothing outside the Space's temp list is touched.
    const { coordinator } = seed([1, 2], { 2: 1 });
    await close(coordinator, 1);
    coordinator.enqueue({
      source: 'sidebar',
      kind: 'closeChildTabs',
      payload: { windowId: WINDOW, spaceId: 'work', tabIds: [2, 4242] },
      correlationId: 'cmd:test',
    });
    await coordinator.idle();
    expect(removed).toEqual([2]);
  });

  test('the window is never left empty', async () => {
    (globalThis as unknown as { chrome: { tabs: { query: unknown } } }).chrome.tabs.query = vi.fn(
      async () => [{ id: 2, windowId: WINDOW }],
    );
    const { coordinator } = seed([1, 2], { 2: 1 });
    await close(coordinator, 1);
    await accept(coordinator);
    expect(created).toBe(1);
  });
});
