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
