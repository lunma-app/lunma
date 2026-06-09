import { describe, expect, test } from 'vitest';
import { makeStore, seedSpace } from './store.test-helpers';

describe('LunmaStore.onWindowOpened', () => {
  test('seeds activeSpaceByWindow with lastActivatedSpaceId', () => {
    const store = makeStore();
    seedSpace(store);
    store.onWindowOpened(300);
    expect(store.state.activeSpaceByWindow[300]).toBe('work');
  });

  test('seeds with null when no Spaces exist', () => {
    const store = makeStore();
    store.onWindowOpened(300);
    expect(store.state.activeSpaceByWindow[300]).toBeNull();
  });

  test('seeds with current lastActivatedSpaceId across calls', () => {
    const store = makeStore();
    seedSpace(store, { id: 'a' });
    seedSpace(store, { id: 'b' });
    store.state.lastActivatedSpaceId = 'b';
    store.onWindowOpened(7);
    expect(store.state.activeSpaceByWindow[7]).toBe('b');
  });
});

describe('LunmaStore.onWindowClosed', () => {
  test('removes both maps for the window', () => {
    const store = makeStore();
    const space = seedSpace(store);
    store.state.activeSpaceByWindow[100] = space.id;
    store.state.spaceInstancesByWindow[100] = {
      [space.id]: { spaceId: space.id, groupId: 1, tempTabIds: [], tempTabTitles: {} },
    };
    store.onWindowClosed(100);
    expect(store.state.activeSpaceByWindow[100]).toBeUndefined();
    expect(store.state.spaceInstancesByWindow[100]).toBeUndefined();
  });
});
