import { describe, expect, test } from 'vitest';
import { PROVENANCE_EDGE_CAP } from './provenance';
import { makeStore } from './store.test-helpers';

describe('LunmaStore provenance edges', () => {
  test('records an edge keyed by the child token', () => {
    const store = makeStore();
    store.recordProvenanceEdge('TC', 'TP', 42);
    expect(store.state.provenanceByToken.TC).toEqual({ parentToken: 'TP', recordedAt: 42 });
  });

  test('refuses a self-edge', () => {
    const store = makeStore();
    store.recordProvenanceEdge('T', 'T', 1);
    expect(store.state.provenanceByToken).toEqual({});
  });

  test('pruning retains a THREE-deep chain from one live token', () => {
    // A single unordered pass would sever this: only the deepest child is live.
    const store = makeStore();
    store.recordProvenanceEdge('C', 'B', 3);
    store.recordProvenanceEdge('B', 'A', 2);
    store.recordProvenanceEdge('A', 'ROOT', 1);
    store.pruneProvenanceEdges(new Set(['C']), PROVENANCE_EDGE_CAP);
    expect(Object.keys(store.state.provenanceByToken).sort()).toEqual(['A', 'B', 'C']);
  });

  test('pruning drops edges no live token claims', () => {
    const store = makeStore();
    store.recordProvenanceEdge('KEEP', 'P', 1);
    store.recordProvenanceEdge('DROP', 'Q', 1);
    store.pruneProvenanceEdges(new Set(['KEEP']), PROVENANCE_EDGE_CAP);
    expect(Object.keys(store.state.provenanceByToken)).toEqual(['KEEP']);
  });

  test('the cap evicts the OLDEST edges first', () => {
    const store = makeStore();
    const live = new Set<string>();
    for (let i = 0; i < 5; i++) {
      store.recordProvenanceEdge(`c${i}`, `p${i}`, i);
      live.add(`c${i}`);
    }
    store.pruneProvenanceEdges(live, 3);
    expect(Object.keys(store.state.provenanceByToken).sort()).toEqual(['c2', 'c3', 'c4']);
  });

  test('the cleanup flag round-trips', () => {
    const store = makeStore();
    expect(store.state.provenanceCleanupPending).toBe(false);
    store.setProvenanceCleanupPending(true);
    expect(store.state.provenanceCleanupPending).toBe(true);
  });

  test('setLiveTabParent clears with null rather than storing undefined', () => {
    const store = makeStore();
    store.state.liveTabsById[1] = {
      tabId: 1,
      windowId: 100,
      title: '',
      url: '',
      active: false,
      status: 'complete',
    };
    store.setLiveTabParent(1, 7);
    expect(store.state.liveTabsById[1]?.provenanceParentTabId).toBe(7);
    store.setLiveTabParent(1, null);
    expect('provenanceParentTabId' in (store.state.liveTabsById[1] ?? {})).toBe(false);
  });
});
