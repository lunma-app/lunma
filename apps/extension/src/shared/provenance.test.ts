import { describe, expect, test } from 'vitest';
import {
  collectDescendantTabIds,
  isRootTransition,
  PROVENANCE_EDGE_CAP,
  PROVENANCE_MAX_DEPTH,
  PROVENANCE_SESSION_MARKER_KEY,
  type ProvenanceEdge,
  resolveParentTabId,
  TAB_TOKEN_KEY,
} from './provenance';

describe('isRootTransition', () => {
  test('treats every documented root transition as a root', () => {
    for (const t of [
      'start_page',
      'auto_toplevel',
      'typed',
      'auto_bookmark',
      'generated',
      'reload',
      'keyword',
    ]) {
      expect(isRootTransition(t), `${t} should be a root`).toBe(true);
    }
  });

  test('a link transition is not a root — it is the attributable case', () => {
    expect(isRootTransition('link')).toBe(false);
  });

  test('an unrecognised transition is treated as a root (fail open)', () => {
    // A wrong parent is worse than no parent, so anything unfamiliar is a root.
    expect(isRootTransition('form_submit')).toBe(true);
    expect(isRootTransition('')).toBe(true);
  });
});

describe('provenance constants', () => {
  test('the page key and session marker key are the specified literals', () => {
    expect(TAB_TOKEN_KEY).toBe('lunma.tabToken');
    expect(PROVENANCE_SESSION_MARKER_KEY).toBe('lunma.provenanceSession');
  });

  test('the caps carry their specified values', () => {
    expect(PROVENANCE_EDGE_CAP).toBe(2000);
    expect(PROVENANCE_MAX_DEPTH).toBe(5);
  });
});

// Edges are keyed by TOKEN, so a chain outlives the tabs in it. Resolution must
// therefore walk to the nearest LIVE ancestor: stopping one hop up orphans every
// tab below a closed tab, flattening a whole subtree the moment its parent goes.
describe('resolveParentTabId', () => {
  /** `A <- B <- C`: C's parent is B, B's parent is A. */
  const CHAIN: Record<string, ProvenanceEdge> = {
    C: { parentToken: 'B', recordedAt: 2 },
    B: { parentToken: 'A', recordedAt: 1 },
  };
  /** Only the named tokens are live tabs. */
  const liveOnly =
    (...tokens: string[]) =>
    (token: string) =>
      tokens.includes(token) ? (tokens.indexOf(token) + 1) * 10 : undefined;

  test('resolves to the immediate parent when it is live', () => {
    expect(resolveParentTabId('C', CHAIN, liveOnly('B'))).toBe(10);
  });

  test('skips a closed parent and resolves to the live grandparent', () => {
    // B was closed. Without the walk, C would flatten to a root even though A is
    // right there and the A<-B<-C edges are intact.
    expect(resolveParentTabId('C', CHAIN, liveOnly('A'))).toBe(10);
  });

  test('resolves to a root when no ancestor is live', () => {
    expect(resolveParentTabId('C', CHAIN, liveOnly())).toBeNull();
  });

  test('a token with no edge is a root', () => {
    expect(resolveParentTabId('A', CHAIN, liveOnly('A'))).toBeNull();
  });

  test('an absent token is a root', () => {
    expect(resolveParentTabId(undefined, CHAIN, liveOnly('A'))).toBeNull();
  });

  test('a cycle terminates as a root rather than looping', () => {
    const cyclic: Record<string, ProvenanceEdge> = {
      X: { parentToken: 'Y', recordedAt: 1 },
      Y: { parentToken: 'X', recordedAt: 2 },
    };
    expect(resolveParentTabId('X', cyclic, liveOnly())).toBeNull();
  });

  test('a self-edge terminates as a root', () => {
    const selfish: Record<string, ProvenanceEdge> = { S: { parentToken: 'S', recordedAt: 1 } };
    expect(resolveParentTabId('S', selfish, liveOnly())).toBeNull();
  });
});

// The cascade closes what the user can SEE indented under the tab they closed —
// so collection follows resolved parents, and is fenced to the Space's temporary
// tabs. Anything outside that fence (a pinned descendant, another Space's tab)
// is deliberately unreachable.
describe('collectDescendantTabIds', () => {
  type Live = { tabId: number; provenanceParentTabId?: number };

  /** `[id, parent]` pairs → the live-tab map the collector reads. */
  function live(...pairs: [number, number?][]): Record<number, Live> {
    const out: Record<number, Live> = {};
    for (const [id, parent] of pairs) {
      out[id] = { tabId: id, ...(parent === undefined ? {} : { provenanceParentTabId: parent }) };
    }
    return out;
  }

  test('collects both children of a parent', () => {
    const tabs = live([1], [2, 1], [3, 1]);
    expect(collectDescendantTabIds(tabs, 1, [1, 2, 3]).sort()).toEqual([2, 3]);
  });

  test('collects a whole chain, not just one level', () => {
    const tabs = live([1], [2, 1], [3, 2], [4, 3]);
    expect(collectDescendantTabIds(tabs, 1, [1, 2, 3, 4]).sort()).toEqual([2, 3, 4]);
  });

  test('never includes the root itself', () => {
    const tabs = live([1], [2, 1]);
    expect(collectDescendantTabIds(tabs, 1, [1, 2])).not.toContain(1);
  });

  test('excludes an unrelated tab', () => {
    const tabs = live([1], [2, 1], [9]);
    expect(collectDescendantTabIds(tabs, 1, [1, 2, 9])).toEqual([2]);
  });

  test('excludes a descendant outside the Space temp list', () => {
    // Tab 3 is a real descendant but pinned (or in another Space), so it is not
    // in `spaceTempTabIds` and must survive the cascade.
    const tabs = live([1], [2, 1], [3, 2]);
    expect(collectDescendantTabIds(tabs, 1, [1, 2])).toEqual([2]);
  });

  test('a fenced-out tab also fences out its own subtree', () => {
    // 3 is excluded, so 4 (below it) is unreachable even though 4 IS in the list.
    const tabs = live([1], [2, 1], [3, 1], [4, 3]);
    expect(collectDescendantTabIds(tabs, 1, [1, 2, 4]).sort()).toEqual([2]);
  });

  test('a closing tab with no children collects nothing', () => {
    const tabs = live([1], [2]);
    expect(collectDescendantTabIds(tabs, 1, [1, 2])).toEqual([]);
  });

  test('a cycle terminates and collects each tab once', () => {
    // A cycle is only reachable from INSIDE it, so collection starts at 2:
    // 2 → 3 → back to 2. Without the visited guard the walk never ends.
    // (`live` keys by tab id, so a cycle cannot be written as duplicate pairs —
    // building the map directly is what makes this test exercise anything.)
    const tabs: Record<number, Live> = {
      2: { tabId: 2, provenanceParentTabId: 3 },
      3: { tabId: 3, provenanceParentTabId: 2 },
    };
    expect(collectDescendantTabIds(tabs, 2, [2, 3])).toEqual([3]);
  });

  test('a self-parented tab collects nothing', () => {
    const tabs: Record<number, Live> = { 5: { tabId: 5, provenanceParentTabId: 5 } };
    expect(collectDescendantTabIds(tabs, 5, [5])).toEqual([]);
  });
});
