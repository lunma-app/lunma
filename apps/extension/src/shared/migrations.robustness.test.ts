import { describe, expect, test } from 'vitest';
import { migrations, runMigrations } from './migrations';
import {
  AppStateV8Schema,
  AppStateV10Schema,
  AppStateV11Schema,
  AppStateV12Schema,
  AppStateV13Schema,
  AppStateV14Schema,
} from './schemas';

// This suite guards the two invariants that actually prevent post-update
// corruption — distinct from the per-migration happy-path suite in
// migrations.test.ts:
//
//   1. END-TO-END FORWARD COMPAT: a realistic on-disk envelope from EVERY
//      historical schemaVersion (v1…v13) migrates through the full chain and
//      parses cleanly under the CURRENT schema (AppStateV14Schema). This is the
//      regression backbone — if a future migration breaks an old shape, one of
//      these starts failing.
//   2. CRASH-PROOFING: a migration must NEVER throw on malformed input. The
//      storage layer quarantines the ENTIRE state (total data loss for the user)
//      the moment a migrate fn throws — see chrome/storage.ts `runMigrations`
//      try/catch → `quarantine` → `{ kind: 'corrupt' }`. So every defensive
//      guard in migrations.ts is load-bearing and gets an adversarial test here.
//
// Unlike migrations.test.ts this file never mutates the `migrations` array, so
// it needs no beforeEach/afterEach — the real chain is live throughout.

type Json = Record<string, unknown>;
const rec = (v: unknown): Json => v as Json;
const arr = (v: unknown): Json[] => v as Json[];

const byVersion = (v: number) => {
  const m = migrations.find((x) => x.toVersion === v);
  if (!m) throw new Error(`no migration for v${v}`);
  return m;
};

// ── Per-version on-disk fixtures ─────────────────────────────────────────────
// Each reflects what that version ACTUALLY wrote to disk (not a post-hoc shape):
// nodes are flat pre-v8, `sources[]` v8+, `queries[]` v9+, `lens` v11+, account
// refs v13+; binding slots are bare numbers pre-v7 and `{ tabId, allowGlob }` v7+.

function baseEnvelope(schemaVersion: number, overrides: Json): Json {
  return {
    schemaVersion,
    spaces: [],
    activeSpaceByWindow: {},
    spaceInstancesByWindow: {},
    tabBindings: {},
    savedTabs: {},
    lastActivatedSpaceId: null,
    tabLastActivity: {},
    archivedTabs: [],
    trash: {},
    pinnedBySpace: {},
    faviconRow: [],
    ...overrides,
  };
}

function flatSmart(
  id: string,
  source: string,
  baseUrl: string,
  query: string | undefined,
  extra: Json = {},
): Json {
  return {
    kind: 'smart',
    id,
    name: 'Test',
    icon: 'folder-git-2',
    source,
    baseUrl,
    ...(query ? { query } : {}),
    refreshMinutes: 10,
    ...extra,
  };
}

function v8Smart(id: string, source: string, baseUrl: string, query?: string): Json {
  return {
    kind: 'smart',
    id,
    name: 'Test',
    icon: 'folder-git-2',
    sources: [{ source, baseUrl, ...(query ? { query } : {}) }],
    maxItems: 20,
    hideRead: true,
    refreshMinutes: 10,
  };
}

function v10Smart(
  id: string,
  source: string,
  baseUrl: string,
  queries: string[],
  name?: string,
): Json {
  return {
    kind: 'smart',
    id,
    name: 'Test',
    icon: 'folder-git-2',
    sources: [{ source, baseUrl, queries, ...(name ? { name } : {}) }],
    maxItems: 20,
    hideRead: true,
    refreshMinutes: 10,
  };
}

function lensNode(id: string, lensKind: string, sources: Json[]): Json {
  return {
    kind: 'lens',
    lensKind,
    id,
    name: 'Test',
    icon: 'folder-git-2',
    sources,
    maxItems: 20,
    hideRead: true,
    refreshMinutes: 10,
  };
}

function fixtureForVersion(v: number): Json {
  switch (v) {
    case 1:
      return baseEnvelope(1, { pinnedBySpace: { s1: [{ kind: 'tab', id: 't1' }] } });
    case 2:
      // gitlab is the only source available at v2; no smartItemBindings slice yet.
      return baseEnvelope(2, {
        pinnedBySpace: { s1: [flatSmart('f1', 'gitlab', 'https://gitlab.com', 'authored')] },
      });
    case 3:
      return baseEnvelope(3, {
        pinnedBySpace: { s1: [flatSmart('f1', 'github', 'https://api.github.com', 'assigned')] },
      });
    case 4:
      // v4 introduced smartItemBindings; slots are bare numbers (pre-v7).
      return baseEnvelope(4, {
        pinnedBySpace: { s1: [flatSmart('f1', 'gitlab', 'https://gitlab.com', 'authored')] },
        smartItemBindings: { f1: { 'item-1': { 100: 42 } } },
      });
    case 5:
      return baseEnvelope(5, {
        pinnedBySpace: { s1: [flatSmart('f1', 'jira', 'https://team.atlassian.net', 'assigned')] },
        smartItemBindings: { f1: { 'item-1': { 100: 7 } } },
      });
    case 6:
      // v6 added rss (query optional) + maxItems/hideRead + smartReadState.
      return baseEnvelope(6, {
        pinnedBySpace: {
          s1: [
            flatSmart('f1', 'rss', 'https://feeds.example.com/rss', undefined, {
              maxItems: 20,
              hideRead: true,
            }),
          ],
        },
        smartItemBindings: { f1: { 'item-1': { 100: 9 } } },
        smartReadState: { f1: ['item-1'] },
      });
    case 7:
      // v7 widened binding slots to { tabId, allowGlob }; item keys still
      // un-namespaced (v8 namespaces them).
      return baseEnvelope(7, {
        pinnedBySpace: {
          s1: [
            flatSmart('f1', 'gitlab', 'https://gitlab.com', 'authored', {
              maxItems: 20,
              hideRead: true,
            }),
          ],
        },
        smartItemBindings: { f1: { 'item-1': { 100: { tabId: 42, allowGlob: '' } } } },
        smartReadState: {},
      });
    case 8:
      // v8 wrapped flat source into sources[] (still flat `query?`) and
      // namespaced binding keys `${source}:${host}:${nativeId}`.
      return baseEnvelope(8, {
        pinnedBySpace: { s1: [v8Smart('f1', 'gitlab', 'https://gitlab.com', 'authored')] },
        smartItemBindings: {
          f1: { 'gitlab:gitlab.com:item-1': { 100: { tabId: 42, allowGlob: '' } } },
        },
        smartReadState: {},
      });
    case 9:
    case 10:
      // v9 rewrote sources[] to queries[] and re-keyed bindings per-filter; v10
      // added the optional source `name`.
      return baseEnvelope(v, {
        pinnedBySpace: {
          s1: [
            v10Smart(
              'f1',
              'gitlab',
              'https://gitlab.com',
              ['authored'],
              v === 10 ? 'My MRs' : undefined,
            ),
          ],
        },
        smartItemBindings: {
          f1: { 'gitlab:gitlab.com:authored:item-1': { 100: { tabId: 42, allowGlob: '' } } },
        },
        smartReadState: {},
      });
    case 11:
      return baseEnvelope(11, {
        pinnedBySpace: {
          s1: [
            lensNode('f1', 'general', [
              { source: 'gitlab', baseUrl: 'https://gitlab.com', queries: ['authored'] },
            ]),
          ],
        },
        lensItemBindings: {
          f1: { 'gitlab:gitlab.com:authored:item-1': { 100: { tabId: 42, allowGlob: '' } } },
        },
        lensReadState: {},
      });
    case 12:
      return baseEnvelope(12, {
        pinnedBySpace: {
          s1: [
            lensNode('f1', 'review', [
              { source: 'github', baseUrl: 'https://github.com', queries: ['review-requested'] },
            ]),
          ],
        },
        lensItemBindings: {},
        lensReadState: {},
      });
    case 13:
      return baseEnvelope(13, {
        sources: { 'acc-1': { id: 'acc-1', provider: 'github', baseUrl: 'https://github.com' } },
        pinnedBySpace: {
          s1: [lensNode('f1', 'general', [{ sourceId: 'acc-1', queries: ['authored'] }])],
        },
        lensItemBindings: {},
        lensReadState: {},
      });
    default:
      throw new Error(`no fixture for v${v}`);
  }
}

// Frozen schemas that faithfully model their version's on-disk node shape. v1–v7
// and v9 have no faithful frozen schema (the V6/V7 schemas use the post-v8 node
// shape), so those fixtures are validated only by the final V14 parse.
const FROZEN_SOURCE_SCHEMA: Record<number, { safeParse: (v: unknown) => { success: boolean } }> = {
  8: AppStateV8Schema,
  10: AppStateV10Schema,
  11: AppStateV11Schema,
  12: AppStateV12Schema,
  13: AppStateV13Schema,
};

describe('forward compatibility — every persisted version migrates to the current schema', () => {
  for (let v = 1; v <= 13; v++) {
    test(`a v${v} on-disk envelope migrates and parses under AppStateV14Schema`, () => {
      const fixture = fixtureForVersion(v);

      // Authenticity: where a faithful frozen schema exists, the fixture must be
      // a valid envelope for its own version before we migrate it forward.
      const frozen = FROZEN_SOURCE_SCHEMA[v];
      if (frozen) expect(frozen.safeParse(structuredClone(fixture)).success).toBe(true);

      const migrated = runMigrations(structuredClone(fixture), v);
      const result = AppStateV14Schema.safeParse(migrated);
      expect(
        result.success,
        result.success
          ? ''
          : JSON.stringify((result as { error: { issues: unknown } }).error.issues),
      ).toBe(true);
      if (!result.success) return;

      // Every lens node must end as account-references (v13 shape), never the
      // pre-v13 embedded `{ source, baseUrl }` shape.
      for (const nodes of Object.values(result.data.pinnedBySpace)) {
        for (const node of nodes) {
          if (node.kind !== 'lens') continue;
          for (const s of node.sources) {
            expect(s).toHaveProperty('sourceId');
            expect(s).not.toHaveProperty('source');
            expect(s).not.toHaveProperty('baseUrl');
          }
        }
      }
    });
  }
});

describe('crash-proofing — the full chain never throws on hostile input', () => {
  // A throwing migrate fn makes the storage layer quarantine the WHOLE state.
  // None of these inputs may throw from any starting version.
  const hostile: unknown[] = [
    null,
    undefined,
    42,
    'a string',
    true,
    [],
    {},
    { schemaVersion: 'not-a-number' },
    { pinnedBySpace: null },
    { pinnedBySpace: { s1: null } },
    { pinnedBySpace: { s1: [null, 5, 'x', {}, { kind: 'smart' }] }, smartItemBindings: 'garbage' },
    {
      pinnedBySpace: {
        s1: [{ kind: 'smart', id: 'f', source: 'gitlab', baseUrl: 'bad url', query: 'authored' }],
      },
      smartItemBindings: { f: { i: { 1: 9 } } },
    },
    { smartItemBindings: { a: { b: { c: [1, 2, 3] } } } },
    { pinnedBySpace: { s1: [{ kind: 'lens', id: 'f', sources: 'no' }] } },
    { pinnedBySpace: { s1: [{ kind: 'lens', id: 'f', sources: [null, 7, { source: 9 }] }] } },
  ];

  for (let i = 0; i < hostile.length; i++) {
    test(`hostile input #${i} migrates from every start version without throwing`, () => {
      for (let v = 0; v <= 14; v++) {
        expect(() => runMigrations(structuredClone(hostile[i]), v)).not.toThrow();
      }
    });
  }
});

describe('v7 — defensive against malformed smartItemBindings', () => {
  const m7 = byVersion(7);

  test('a non-object raw is returned unchanged', () => {
    for (const raw of [null, 42, 'x', undefined]) {
      expect(() => m7.migrate(raw)).not.toThrow();
      expect(m7.migrate(raw)).toBe(raw);
    }
  });

  test('null / non-object bindings and inner entries are tolerated', () => {
    for (const bindings of [null, 'x', 42]) {
      expect(() => m7.migrate({ smartItemBindings: bindings })).not.toThrow();
    }
    const raw = { smartItemBindings: { f1: null, f2: 'x', f3: { item: null }, f4: { item: 5 } } };
    expect(() => m7.migrate(raw)).not.toThrow();
  });

  test('only numeric slots widen — object/string slots are left intact', () => {
    const raw = {
      smartItemBindings: { f1: { item: { 1: 42, 2: { tabId: 7, allowGlob: '' }, 3: 'weird' } } },
    };
    const out = rec(m7.migrate(raw));
    const slots = rec(rec(rec(out.smartItemBindings).f1).item);
    expect(slots[1]).toEqual({ tabId: 42, allowGlob: '' });
    expect(slots[2]).toEqual({ tabId: 7, allowGlob: '' });
    expect(slots[3]).toBe('weird');
  });
});

describe('v8 — defensive against malformed nodes & URLs', () => {
  const m8 = byVersion(8);

  test('null pinnedBySpace, non-array node lists, and non-object nodes are tolerated', () => {
    expect(() => m8.migrate({ pinnedBySpace: null })).not.toThrow();
    const raw = {
      pinnedBySpace: { s1: 'nope', s2: [null, 42, { kind: 'tab', id: 't' }] },
      smartItemBindings: {},
    };
    expect(() => m8.migrate(raw)).not.toThrow();
  });

  test('a smart node with a malformed baseUrl still wraps, but its binding folder is dropped', () => {
    const raw = {
      pinnedBySpace: {
        s1: [
          {
            kind: 'smart',
            id: 'f1',
            name: 'x',
            icon: 'i',
            source: 'gitlab',
            baseUrl: 'not a url',
            query: 'authored',
          },
        ],
      },
      smartItemBindings: { f1: { 'item-1': { 1: { tabId: 9, allowGlob: '' } } } },
    };
    const out = rec(m8.migrate(raw));
    expect(rec(arr(rec(out.pinnedBySpace).s1)[0]).sources).toEqual([
      { source: 'gitlab', baseUrl: 'not a url', query: 'authored' },
    ]);
    // The unparseable host means the binding folder cannot be namespaced, so it
    // is dropped defensively rather than corrupting the key.
    expect(out.smartItemBindings).toEqual({});
  });

  test('a smart node with a non-string source/baseUrl/id is left unwrapped', () => {
    const raw = {
      pinnedBySpace: { s1: [{ kind: 'smart', id: 5, source: 'gitlab', baseUrl: 'https://x.com' }] },
      smartItemBindings: {},
    };
    const out = rec(m8.migrate(raw));
    expect(rec(arr(rec(out.pinnedBySpace).s1)[0]).sources).toBeUndefined();
  });
});

describe('v9 — defensive against malformed sources', () => {
  const m9 = byVersion(9);

  test('null pinnedBySpace and non-array sources are tolerated', () => {
    expect(() => m9.migrate({ pinnedBySpace: null })).not.toThrow();
    expect(() =>
      m9.migrate({ pinnedBySpace: { s1: [{ kind: 'smart', id: 'f1', sources: 'nope' }] } }),
    ).not.toThrow();
  });

  test('a malformed-baseUrl entry is skipped for re-keying but its queries are still rewritten', () => {
    const raw = {
      pinnedBySpace: {
        s1: [
          {
            kind: 'smart',
            id: 'f1',
            sources: [{ source: 'gitlab', baseUrl: 'bad url', query: 'authored' }],
          },
        ],
      },
      smartItemBindings: {},
    };
    const out = rec(m9.migrate(raw));
    const entry = rec(arr(rec(arr(rec(out.pinnedBySpace).s1)[0]).sources)[0]);
    expect(entry.queries).toEqual(['authored']);
    expect(entry.query).toBeUndefined();
  });

  test('null / non-object entries within sources are skipped', () => {
    const raw = {
      pinnedBySpace: {
        s1: [
          {
            kind: 'smart',
            id: 'f1',
            sources: [null, 7, { source: 'rss', baseUrl: 'https://f.com/r' }],
          },
        ],
      },
      smartItemBindings: {},
    };
    expect(() => m9.migrate(raw)).not.toThrow();
  });
});

describe('v11 — defensive against malformed nodes', () => {
  const m11 = byVersion(11);

  test('a non-object raw is returned unchanged', () => {
    expect(m11.migrate(null)).toBe(null);
    expect(m11.migrate(7)).toBe(7);
  });

  test('null pinnedBySpace still renames the persisted top-level keys', () => {
    const out = rec(
      m11.migrate({ pinnedBySpace: null, smartItemBindings: { a: 1 }, smartReadState: { b: 2 } }),
    );
    expect('smartItemBindings' in out).toBe(false);
    expect(out.lensItemBindings).toEqual({ a: 1 });
    expect('smartReadState' in out).toBe(false);
    expect(out.lensReadState).toEqual({ b: 2 });
  });

  test('non-object nodes are skipped', () => {
    expect(() =>
      m11.migrate({ pinnedBySpace: { s1: [null, 5, { kind: 'tab', id: 't' }] } }),
    ).not.toThrow();
  });
});

describe('v13 — account extraction, dedup, and defensive guards', () => {
  const m13 = byVersion(13);
  const lensWith = (id: string, sources: Json[]): Json => lensNode(id, 'general', sources);

  test('a non-object raw is returned unchanged; null pinnedBySpace seeds an empty sources map', () => {
    expect(m13.migrate(null)).toBe(null);
    expect(rec(m13.migrate({ pinnedBySpace: null })).sources).toEqual({});
  });

  test('non-lens nodes and entries lacking provider/baseUrl are skipped; ref entries survive', () => {
    const raw = {
      pinnedBySpace: {
        s1: [
          { kind: 'tab', id: 't' },
          {
            kind: 'lens',
            id: 'f1',
            sources: [{ source: 5, baseUrl: 'x' }, null, { sourceId: 'pre', queries: [] }],
          },
        ],
      },
    };
    const out = rec(m13.migrate(raw));
    expect(arr(rec(arr(rec(out.pinnedBySpace).s1)[1]).sources)).toEqual([
      { sourceId: 'pre', queries: [] },
    ]);
    expect(out.sources).toEqual({});
  });

  test('distinct (provider, baseUrl) pairs mint distinct accounts', () => {
    const raw = {
      pinnedBySpace: {
        s1: [
          lensWith('a', [
            { source: 'github', baseUrl: 'https://github.com', queries: ['authored'] },
          ]),
          lensWith('b', [
            { source: 'github', baseUrl: 'https://ghe.corp.com', queries: ['authored'] },
          ]),
          lensWith('c', [
            { source: 'gitlab', baseUrl: 'https://github.com', queries: ['authored'] },
          ]),
        ],
      },
    };
    expect(Object.keys(rec(rec(m13.migrate(raw)).sources))).toHaveLength(3);
  });

  test('three lenses on the same (provider, baseUrl) share ONE account', () => {
    const raw = {
      pinnedBySpace: {
        s1: [
          lensWith('a', [
            { source: 'github', baseUrl: 'https://github.com', queries: ['authored'] },
          ]),
          lensWith('b', [
            { source: 'github', baseUrl: 'https://github.com', queries: ['assigned'] },
          ]),
          lensWith('c', [
            { source: 'github', baseUrl: 'https://github.com', queries: ['review-requested'] },
          ]),
        ],
      },
    };
    const out = rec(m13.migrate(raw));
    const ids = Object.keys(rec(out.sources));
    expect(ids).toHaveLength(1);
    for (const node of arr(rec(out.pinnedBySpace).s1)) {
      expect(rec(arr(rec(node).sources)[0]).sourceId).toBe(ids[0]);
    }
  });

  test('the FIRST occurrence of a name wins; a later name never overwrites an earlier account', () => {
    const firstNamed = {
      pinnedBySpace: {
        s1: [
          lensWith('a', [
            {
              source: 'github',
              baseUrl: 'https://github.com',
              queries: ['authored'],
              name: 'Work',
            },
          ]),
          lensWith('b', [
            { source: 'github', baseUrl: 'https://github.com', queries: ['assigned'] },
          ]),
        ],
      },
    };
    const acc1 = Object.values(rec(rec(m13.migrate(firstNamed)).sources))[0] as { name?: string };
    expect(acc1.name).toBe('Work');

    const firstUnnamed = {
      pinnedBySpace: {
        s1: [
          lensWith('a', [
            { source: 'github', baseUrl: 'https://github.com', queries: ['authored'] },
          ]),
          lensWith('b', [
            {
              source: 'github',
              baseUrl: 'https://github.com',
              queries: ['assigned'],
              name: 'Late',
            },
          ]),
        ],
      },
    };
    const acc2 = Object.values(rec(rec(m13.migrate(firstUnnamed)).sources))[0] as { name?: string };
    expect(acc2.name).toBeUndefined();
  });

  test('an already-migrated ref entry is preserved and mints no new account', () => {
    const raw = {
      sources: { 'acc-x': { id: 'acc-x', provider: 'github', baseUrl: 'https://github.com' } },
      pinnedBySpace: { s1: [lensWith('a', [{ sourceId: 'acc-x', queries: ['authored'] }])] },
    };
    const out = rec(m13.migrate(raw));
    expect(Object.keys(rec(out.sources))).toEqual(['acc-x']);
    expect(arr(rec(arr(rec(out.pinnedBySpace).s1)[0]).sources)).toEqual([
      { sourceId: 'acc-x', queries: ['authored'] },
    ]);
  });
});

describe('v10 — smart-source-rename identity pass-through', () => {
  const m10 = byVersion(10);

  test('returns its input by reference (no transform)', () => {
    const input = { anything: true };
    expect(m10.migrate(input)).toBe(input);
  });

  test('an optional source `name` survives the full v10 → v14 chain onto the account', () => {
    const fixture = baseEnvelope(10, {
      pinnedBySpace: {
        s1: [v10Smart('f1', 'github', 'https://github.com', ['authored'], 'Personal')],
      },
    });
    const parsed = AppStateV14Schema.parse(runMigrations(structuredClone(fixture), 10));
    const accounts = Object.values(parsed.sources);
    expect(accounts).toHaveLength(1);
    expect(accounts[0]?.name).toBe('Personal');
  });
});

// Regression: a migration must never hand the schema a structurally-invalid
// PinNode. Before the terminal normalization, these left a lens with empty /
// missing `sources` (violating PinNodeSchema's `.min(1)`), which failed
// whole-state validation and triggered the coarse salvage that wiped the entire
// pinned tree across every Space.
describe('migration output drops structurally-invalid nodes instead of poisoning the tree', () => {
  test('a v13 migration that empties a lens `sources` drops only that node, keeps the rest', () => {
    const envelope = baseEnvelope(12, {
      pinnedBySpace: {
        s1: [
          { kind: 'tab', id: 't1' },
          {
            kind: 'lens',
            lensKind: 'general',
            id: 'lens-broken',
            name: 'My MRs',
            icon: 'folder-git-2',
            // garbage entries: not refs, not valid embedded sources -> all dropped
            sources: [{ nonsense: true }, null],
            maxItems: 20,
            hideRead: true,
            refreshMinutes: 10,
          },
        ],
        s2: [{ kind: 'tab', id: 't2' }],
      },
    });

    const parsed = AppStateV14Schema.parse(runMigrations(structuredClone(envelope), 12));
    expect(parsed.pinnedBySpace.s1?.map((n) => n.id)).toEqual(['t1']);
    expect(parsed.pinnedBySpace.s2?.map((n) => n.id)).toEqual(['t2']);
  });

  test('a pre-v8 flat smart node missing baseUrl is dropped, not left as a sourceless lens', () => {
    const envelope = baseEnvelope(6, {
      pinnedBySpace: {
        s1: [
          { kind: 'tab', id: 't1' },
          {
            kind: 'smart',
            id: 'smart-nobaseurl',
            name: 'Legacy',
            icon: 'folder-git-2',
            source: 'gitlab',
            // baseUrl intentionally absent (early build / partial write)
            query: 'authored',
            refreshMinutes: 10,
          },
        ],
        s2: [{ kind: 'tab', id: 't2' }],
      },
    });

    const parsed = AppStateV14Schema.parse(runMigrations(structuredClone(envelope), 6));
    expect(parsed.pinnedBySpace.s1?.map((n) => n.id)).toEqual(['t1']);
    expect(parsed.pinnedBySpace.s2?.map((n) => n.id)).toEqual(['t2']);
  });

  test('a Space whose every node is invalid becomes an empty array, not a removed key', () => {
    const envelope = baseEnvelope(6, {
      pinnedBySpace: {
        s1: [
          {
            kind: 'smart',
            id: 'bad',
            name: 'Legacy',
            icon: 'folder-git-2',
            source: 'gitlab',
            query: 'authored',
            refreshMinutes: 10,
          },
        ],
      },
    });
    const parsed = AppStateV14Schema.parse(runMigrations(structuredClone(envelope), 6));
    expect(parsed.pinnedBySpace.s1).toEqual([]);
  });
});
