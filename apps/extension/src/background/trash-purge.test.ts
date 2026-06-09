import { describe, expect, test } from 'vitest';
import { LunmaStore } from '../shared/store.svelte';
import { purgeExpiredTrash } from './trash-purge';

const DAY_MS = 24 * 60 * 60 * 1000;
const PURGE_AGE_MS = 30 * DAY_MS;

/** Epoch ms that is exactly N ms before `nowMs`. */
function msAgo(nowMs: number, deltaMs: number): number {
  return nowMs - deltaMs;
}

describe('purgeExpiredTrash', () => {
  const NOW = 1_000_000_000_000; // a stable "now" for all tests

  test('a space trashed exactly 30 days ago is purged', () => {
    const store = new LunmaStore();
    const deletedAt = new Date(msAgo(NOW, PURGE_AGE_MS)).toISOString();
    store.state.trash.s1 = { id: 's1', name: 'Work', color: 'blue', icon: 'star', deletedAt };

    purgeExpiredTrash(store, NOW);

    expect(store.state.trash.s1).toBeUndefined();
  });

  test('a space trashed 30 days minus 1 ms ago is NOT purged', () => {
    const store = new LunmaStore();
    const deletedAt = new Date(msAgo(NOW, PURGE_AGE_MS - 1)).toISOString();
    store.state.trash.s2 = { id: 's2', name: 'Study', color: 'green', icon: 'book', deletedAt };

    purgeExpiredTrash(store, NOW);

    expect(store.state.trash.s2).toBeDefined();
  });

  test('a trash entry with a NaN deletedAt is skipped without error', () => {
    const store = new LunmaStore();
    store.state.trash.s3 = {
      id: 's3',
      name: 'Bad',
      color: 'red',
      icon: 'star',
      deletedAt: 'not-a-date',
    };

    expect(() => purgeExpiredTrash(store, NOW)).not.toThrow();
    // Entry is left in place — NaN skip means no purge.
    expect(store.state.trash.s3).toBeDefined();
  });

  test('savedTabs belonging to the purged space are removed', () => {
    const store = new LunmaStore();
    const deletedAt = new Date(msAgo(NOW, PURGE_AGE_MS)).toISOString();
    store.state.trash.sp = { id: 'sp', name: 'Old', color: 'blue', icon: 'star', deletedAt };

    // Two saved tabs: one in the purged space, one in a different space.
    store.state.savedTabs.st1 = {
      id: 'st1',
      spaceId: 'sp',
      title: 'Tab A',
      originalURL: 'https://a.com',
      currentURL: null,
    };
    store.state.savedTabs.st2 = {
      id: 'st2',
      spaceId: 'other',
      title: 'Tab B',
      originalURL: 'https://b.com',
      currentURL: null,
    };

    purgeExpiredTrash(store, NOW);

    expect(store.state.savedTabs.st1).toBeUndefined();
    expect(store.state.savedTabs.st2).toBeDefined();
  });

  test('pinnedBySpace entry for the purged space is removed', () => {
    const store = new LunmaStore();
    const deletedAt = new Date(msAgo(NOW, PURGE_AGE_MS)).toISOString();
    store.state.trash.sp2 = { id: 'sp2', name: 'Old2', color: 'blue', icon: 'star', deletedAt };
    store.state.pinnedBySpace.sp2 = [{ kind: 'tab', id: 'st3' }];

    purgeExpiredTrash(store, NOW);

    expect(store.state.pinnedBySpace.sp2).toBeUndefined();
  });

  test('unrelated trash entries and their savedTabs are untouched', () => {
    const store = new LunmaStore();
    const oldDeletedAt = new Date(msAgo(NOW, PURGE_AGE_MS)).toISOString();
    const freshDeletedAt = new Date(msAgo(NOW, DAY_MS)).toISOString();

    store.state.trash.old = {
      id: 'old',
      name: 'Old',
      color: 'blue',
      icon: 'star',
      deletedAt: oldDeletedAt,
    };
    store.state.trash.fresh = {
      id: 'fresh',
      name: 'Fresh',
      color: 'green',
      icon: 'leaf',
      deletedAt: freshDeletedAt,
    };
    store.state.savedTabs.stFresh = {
      id: 'stFresh',
      spaceId: 'fresh',
      title: 'Keep me',
      originalURL: 'https://keep.com',
      currentURL: null,
    };

    purgeExpiredTrash(store, NOW);

    expect(store.state.trash.old).toBeUndefined();
    expect(store.state.trash.fresh).toBeDefined();
    expect(store.state.savedTabs.stFresh).toBeDefined();
  });
});
