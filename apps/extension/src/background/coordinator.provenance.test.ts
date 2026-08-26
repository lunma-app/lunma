import { beforeEach, describe, expect, test } from 'vitest';
import type { Space, SpaceColor } from '../shared/types';
import { makeCoordinator } from './coordinator.test-helpers';
import { installTabGroupsChrome, type TabGroupsController } from './tab-groups.test-helpers';

function space(id: string, name = id, color: SpaceColor = 'blue'): Space {
  return { id, name, color, icon: 'star' };
}

let chromeCtl: TabGroupsController;
beforeEach(() => {
  chromeCtl = installTabGroupsChrome();
});

/**
 * End-to-end through the coordinator, because every bug in this feature so far
 * lived in the WIRING rather than in a unit: `syncLiveTab` accepted an
 * `openerTabId` that `tabs.onCreated` never passed, so `LiveTab.openerTabId` was
 * always undefined and provenance could not resolve a single edge in a real
 * browser — while every unit test still passed.
 */
describe('provenance through the coordinator', () => {
  test('tabs.onCreated records the opener on the live tab', async () => {
    const { coordinator, store } = makeCoordinator();
    store.state.spaces.push(space('work'));
    store.state.activeSpaceByWindow[100] = 'work';
    store.state.spaceInstancesByWindow[100] = {
      work: { spaceId: 'work', groupId: 1, tempTabIds: [], tempTabTitles: {} },
    };
    chromeCtl.addTab({ id: 10, windowId: 100, groupId: -1 });

    coordinator.enqueue({
      source: 'chrome',
      kind: 'tabs.onCreated',
      payload: {
        tab: {
          id: 10,
          windowId: 100,
          url: 'https://child/',
          openerTabId: 7,
          active: false,
        } as chrome.tabs.Tab,
      },
    });
    await coordinator.idle();

    expect(store.state.liveTabsById[10]?.openerTabId).toBe(7);
  });
});

/**
 * The commit handler both RECORDS the durable edge and RESOLVES the child's
 * parent. Recording alone is not enough: `resolveAllParents` runs during the
 * identity exchange, which happens BEFORE the commit is handled, so a
 * record-only handler leaves the tab you just opened flat until some later tab
 * triggers another resolve pass — which looked, in a real browser, like
 * provenance working intermittently.
 */
describe('a handled commit resolves the child immediately', () => {
  function seedPair() {
    const { coordinator, store } = makeCoordinator();
    coordinator.setProvenanceEnabled(true);
    store.state.spaces.push(space('work'));
    store.state.activeSpaceByWindow[100] = 'work';
    store.state.spaceInstancesByWindow[100] = {
      work: { spaceId: 'work', groupId: 1, tempTabIds: [7, 10], tempTabTitles: {} },
    };
    for (const [id, extra] of [
      [7, { provenanceToken: 'PARENT' }],
      [10, { provenanceToken: 'CHILD', openerTabId: 7 }],
    ] as const) {
      store.state.liveTabsById[id] = {
        tabId: id,
        windowId: 100,
        title: `tab ${id}`,
        url: `https://x/${id}`,
        active: false,
        status: 'complete',
        ...extra,
      };
    }
    return { coordinator, store };
  }

  function commit(coordinator: ReturnType<typeof makeCoordinator>['coordinator'], type: string) {
    coordinator.enqueue({
      source: 'chrome',
      kind: 'webNavigation.onCommitted',
      payload: {
        tabId: 10,
        frameId: 0,
        url: 'https://x/10',
        transitionType: type,
        transitionQualifiers: [],
      },
    });
    return coordinator.idle();
  }

  test('a link commit records the edge AND sets the resolved parent', async () => {
    const { coordinator, store } = seedPair();

    await commit(coordinator, 'link');

    expect(store.state.provenanceByToken.CHILD?.parentToken).toBe('PARENT');
    // Without this the row renders flat until an unrelated tab resolves it.
    expect(store.state.liveTabsById[10]?.provenanceParentTabId).toBe(7);
  });

  test('a root commit clears any resolved parent', async () => {
    const { coordinator, store } = seedPair();
    await commit(coordinator, 'link');

    await commit(coordinator, 'typed'); // address bar: a root

    expect(store.state.liveTabsById[10]?.provenanceParentTabId).toBeUndefined();
  });

  test('an untokenised opener leaves the child flat', async () => {
    const { coordinator, store } = seedPair();
    delete store.state.liveTabsById[7]?.provenanceToken;

    await commit(coordinator, 'link');

    expect(store.state.provenanceByToken.CHILD).toBeUndefined();
    expect(store.state.liveTabsById[10]?.provenanceParentTabId).toBeUndefined();
  });
});
