import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { assertMigrationsTerminal, type Migration, migrations, runMigrations } from './migrations';
import {
  AppStateV10Schema,
  AppStateV11Schema,
  AppStateV12Schema,
  AppStateV13Schema,
  AppStateV14Schema,
  AppStateV16Schema,
  CURRENT_SCHEMA_VERSION,
} from './schemas';
import { createInitialState } from './store.svelte';

// Snapshot of the REAL migration chain, captured at module load (before the
// runner suites below clear the array to exercise the mechanics in isolation).
const realMigrations = [...migrations];

describe('the real migration chain', () => {
  test('holds exactly the v2 through v17 entries', () => {
    expect(realMigrations).toHaveLength(16);
    expect(realMigrations[0]?.toVersion).toBe(2);
    expect(realMigrations[1]?.toVersion).toBe(3);
    expect(realMigrations[2]?.toVersion).toBe(4);
    expect(realMigrations[3]?.toVersion).toBe(5);
    expect(realMigrations[4]?.toVersion).toBe(6);
    expect(realMigrations[5]?.toVersion).toBe(7);
    expect(realMigrations[6]?.toVersion).toBe(8);
    expect(realMigrations[7]?.toVersion).toBe(9);
    expect(realMigrations[8]?.toVersion).toBe(10);
    expect(realMigrations[9]?.toVersion).toBe(11);
    expect(realMigrations[10]?.toVersion).toBe(12);
    expect(realMigrations[11]?.toVersion).toBe(13);
    expect(realMigrations[12]?.toVersion).toBe(14);
    expect(realMigrations[13]?.toVersion).toBe(15);
    expect(realMigrations[14]?.toVersion).toBe(16);
    expect(realMigrations[15]?.toVersion).toBe(17);
    expect(CURRENT_SCHEMA_VERSION).toBe(17);
    // v2–v6 are pass-throughs (see comment in migrations.ts). v7 is the
    // smart-tab-boundary real transformation; v8 is the multi-source wrap.
    const input = { schemaVersion: 1, pinnedBySpace: { work: [{ kind: 'tab', id: 'a' }] } };
    expect(realMigrations[0]?.migrate(input)).toBe(input);
    expect(realMigrations[1]?.migrate(input)).toBe(input);
    expect(realMigrations[2]?.migrate(input)).toBe(input);
    expect(realMigrations[3]?.migrate(input)).toBe(input);
    expect(realMigrations[4]?.migrate(input)).toBe(input);
  });

  test('a v1 payload chains through all ten entries cleanly', () => {
    // The file-level beforeEach clears the live array for the runner suites —
    // restore the real chain so this exercises it, not an empty list.
    migrations.push(...realMigrations);
    // v1 data has no lensItemBindings and no smart/lens nodes, so the v7 and v8
    // real migrations are both no-ops; v11 finds no smartItemBindings/smartReadState
    // to rename. All migrations return the same reference.
    const input = { schemaVersion: 1, pinnedBySpace: { work: [{ kind: 'tab', id: 'a' }] } };
    expect(runMigrations(input, 1)).toBe(input);
  });

  test('a v5 envelope migrates losslessly and defaults the new v6 node + slice fields', () => {
    migrations.push(...realMigrations);
    // A v5-shaped state whose smart node carries NO maxItems/hideRead and which
    // has no smartReadState/lensReadState slice — exactly what a build before
    // rss-connector wrote. The v5→v6 migration is a pass-through; the V6 schema's
    // `.default()`s supply the new fields on parse (rss-connector design D5/D9/D3).
    // The v8 migration wraps source/baseUrl/query into sources[]; v11 stamps
    // lensKind and renames the node discriminant.
    const v5State: Record<string, unknown> = {
      schemaVersion: 5,
      spaces: [],
      activeSpaceByWindow: {},
      spaceInstancesByWindow: {},
      tabBindings: {},
      savedTabs: {},
      lastActivatedSpaceId: null,
      tabLastActivity: {},
      archivedTabs: [],
      trash: {},
      pinnedBySpace: {
        work: [
          {
            kind: 'smart',
            id: 'sf1',
            name: 'My MRs',
            icon: 'folder-git-2',
            source: 'gitlab',
            baseUrl: 'https://gitlab.com',
            query: 'authored',
            refreshMinutes: 10,
          },
        ],
      },
      faviconRow: [],
      smartItemBindings: {},
      // no smartReadState — the slice did not exist pre-v6
    };

    const migrated = runMigrations(v5State, 5);
    const parsed = AppStateV13Schema.parse(migrated);
    const node = parsed.pinnedBySpace.work?.[0];
    expect(node?.kind).toBe('lens');
    if (node?.kind === 'lens') {
      expect(node.lensKind).toBe('general');
      expect(node.maxItems).toBe(20);
      // The draining-queue default: a feed's resting state hides read (drained).
      expect(node.hideRead).toBe(true);
      // query moved to sources[0] by v8, then rewritten to queries[] by v9.
      expect(node.sources?.[0]?.queries).toEqual(['authored']);
    }
    expect(parsed.lensReadState).toEqual({});
  });
});

describe('v7 migration — smart-tab-boundary slot widening', () => {
  test('v6 envelope with a numeric smartItemBindings slot migrates to { tabId, allowGlob: "" } and then v8/v9 re-key the item id', () => {
    migrations.push(...realMigrations);
    const v6State: Record<string, unknown> = {
      schemaVersion: 6,
      spaces: [],
      activeSpaceByWindow: {},
      spaceInstancesByWindow: {},
      tabBindings: {},
      savedTabs: {},
      lastActivatedSpaceId: null,
      tabLastActivity: {},
      archivedTabs: [],
      trash: {},
      // Smart node required so the v8 migration can look up the sourceKey for re-keying
      // (without it the binding would be treated as orphaned and dropped by v8).
      pinnedBySpace: {
        s1: [
          {
            kind: 'smart',
            id: 'f1',
            name: 'Test',
            icon: 'folder-git-2',
            source: 'gitlab',
            baseUrl: 'https://gitlab.com',
            query: 'authored',
            maxItems: 20,
            hideRead: true,
            refreshMinutes: 10,
          },
        ],
      },
      faviconRow: [],
      // Bare number slot — the shape written by the previous code.
      smartItemBindings: { f1: { 'item-a': { 100: 42 } } },
      smartReadState: {},
    };

    const migrated = runMigrations(v6State, 6);
    const parsed = AppStateV14Schema.parse(migrated);
    // v7 widened the slot; v8 namespaced the item id (`gitlab:gitlab.com:item-a`);
    // v9 inserted the per-filter axis from the node's single migrated filter;
    // v11 renamed smartItemBindings → lensItemBindings; v13 minted an account for
    // gitlab/gitlab.com; v15 re-keyed the binding onto that account's id.
    const accId = Object.keys(parsed.sources)[0];
    expect(accId).toBeDefined();
    expect(parsed.lensItemBindings).toEqual({
      f1: { [`${accId}:authored:item-a`]: { 100: { tabId: 42, allowGlob: '' } } },
    });
  });

  test('v6 envelope with empty smartItemBindings passes through unchanged', () => {
    migrations.push(...realMigrations);
    const v6State: Record<string, unknown> = {
      schemaVersion: 6,
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
      smartItemBindings: {},
      smartReadState: {},
    };

    const migrated = runMigrations(v6State, 6);
    const parsed = AppStateV13Schema.parse(migrated);
    expect(parsed.lensItemBindings).toEqual({});
  });

  test('v1 envelope migrates through all twelve entries cleanly (no smartItemBindings)', () => {
    migrations.push(...realMigrations);
    const v1State = {
      ...createInitialState(),
      schemaVersion: 1,
    } as unknown as Record<string, unknown>;
    // No smart nodes in v1 — v7 and v8 migrations are both no-ops.
    const migrated = runMigrations(v1State, 1);
    const parsed = AppStateV13Schema.parse(migrated);
    expect(parsed.lensItemBindings).toEqual({});
    expect(parsed.schemaVersion).toBe(1); // the schema version field itself is from the state
  });
});

describe('v8 migration — multi-source-smart-folders node wrap', () => {
  const v8Migration = realMigrations.find((m) => m.toVersion === 8);
  if (!v8Migration) throw new Error('expected v8 migration');

  const mkSmartNode = (id: string, source: string, baseUrl: string, query?: string) => ({
    kind: 'smart',
    id,
    name: 'Test',
    icon: 'folder-git-2',
    source,
    baseUrl,
    ...(query ? { query } : {}),
    maxItems: 20,
    hideRead: false,
    refreshMinutes: 10,
  });

  test('wraps single-source node into sources[]', () => {
    const state = {
      pinnedBySpace: { s1: [mkSmartNode('f1', 'gitlab', 'https://gitlab.com', 'authored')] },
      smartItemBindings: {},
    };
    const result = v8Migration.migrate(state) as typeof state;
    const node = result.pinnedBySpace.s1[0] as Record<string, unknown>;
    expect(node.source).toBeUndefined();
    expect(node.baseUrl).toBeUndefined();
    expect(node.query).toBeUndefined();
    expect(node.sources).toEqual([
      { source: 'gitlab', baseUrl: 'https://gitlab.com', query: 'authored' },
    ]);
  });

  test('re-keys smartItemBindings item id with sourceKey namespace', () => {
    const state = {
      pinnedBySpace: { s1: [mkSmartNode('f1', 'github', 'https://api.github.com')] },
      smartItemBindings: { f1: { 'pr-42': { 1: { tabId: 99, allowGlob: '' } } } },
    };
    const result = v8Migration.migrate(state) as typeof state;
    expect(result.smartItemBindings).toEqual({
      f1: { 'github:api.github.com:pr-42': { 1: { tabId: 99, allowGlob: '' } } },
    });
  });

  test('drops orphaned binding when folderId has no matching smart node', () => {
    const state = {
      pinnedBySpace: { s1: [] },
      smartItemBindings: { orphan: { 'item-x': { 1: { tabId: 1, allowGlob: '' } } } },
    };
    const result = v8Migration.migrate(state) as typeof state;
    expect(result.smartItemBindings).toEqual({});
  });

  test('empty smartItemBindings passes through unchanged', () => {
    const state = {
      pinnedBySpace: { s1: [mkSmartNode('f1', 'jira', 'https://company.atlassian.net')] },
      smartItemBindings: {},
    };
    const result = v8Migration.migrate(state) as typeof state;
    expect(result.smartItemBindings).toEqual({});
  });

  test('no smart nodes — non-smart pins pass through, no binding re-keying', () => {
    const state = {
      pinnedBySpace: {
        s1: [{ kind: 'tab', id: 't1', url: 'https://example.com', name: 'Ex', icon: '' }],
      },
      smartItemBindings: {},
    };
    const result = v8Migration.migrate(state) as typeof state;
    expect(result.smartItemBindings).toEqual({});
    // Tab node unchanged
    const node = result.pinnedBySpace.s1[0] as Record<string, unknown>;
    expect(node.kind).toBe('tab');
    expect(node.sources).toBeUndefined();
  });
});

describe('v9 migration — multi-filter-smart-connectors queries[] rewrite + per-filter re-key', () => {
  const v9Migration = realMigrations.find((m) => m.toVersion === 9);
  if (!v9Migration) throw new Error('expected v9 migration');

  // A v8-shaped smart node: sources[] entries carry the flat `query?`.
  const mkV8SmartNode = (id: string, source: string, baseUrl: string, query?: string) => ({
    kind: 'smart',
    id,
    name: 'Test',
    icon: 'folder-git-2',
    sources: [{ source, baseUrl, ...(query ? { query } : {}) }],
    maxItems: 20,
    hideRead: false,
    refreshMinutes: 10,
  });

  test('a queue source entry is rewritten { query } → { queries: [query] }', () => {
    const state = {
      pinnedBySpace: { s1: [mkV8SmartNode('f1', 'gitlab', 'https://gitlab.com', 'authored')] },
      smartItemBindings: {},
    };
    const result = v9Migration.migrate(state) as typeof state;
    const node = result.pinnedBySpace.s1[0] as Record<string, unknown>;
    expect(node.sources).toEqual([
      { source: 'gitlab', baseUrl: 'https://gitlab.com', queries: ['authored'] },
    ]);
  });

  test('an rss source entry gains queries: []', () => {
    const state = {
      pinnedBySpace: { s1: [mkV8SmartNode('f1', 'rss', 'https://feeds.example.com/rss')] },
      smartItemBindings: {},
    };
    const result = v9Migration.migrate(state) as typeof state;
    const node = result.pinnedBySpace.s1[0] as Record<string, unknown>;
    expect(node.sources).toEqual([
      { source: 'rss', baseUrl: 'https://feeds.example.com/rss', queries: [] },
    ]);
  });

  test('a v8 smartItemBindings key is re-keyed with the filter axis', () => {
    const state = {
      pinnedBySpace: { s1: [mkV8SmartNode('f1', 'gitlab', 'https://gitlab.com', 'authored')] },
      smartItemBindings: { f1: { 'gitlab:gitlab.com:42': { 100: { tabId: 7, allowGlob: '' } } } },
    };
    const result = v9Migration.migrate(state) as typeof state;
    expect(result.smartItemBindings).toEqual({
      f1: { 'gitlab:gitlab.com:authored:42': { 100: { tabId: 7, allowGlob: '' } } },
    });
  });

  test('an rss binding key is unchanged (rss carries no query axis)', () => {
    const state = {
      pinnedBySpace: { s1: [mkV8SmartNode('f1', 'rss', 'https://feeds.example.com/rss')] },
      smartItemBindings: {
        f1: { 'rss:feeds.example.com:item-9': { 100: { tabId: 7, allowGlob: '' } } },
      },
    };
    const result = v9Migration.migrate(state) as typeof state;
    expect(result.smartItemBindings).toEqual({
      f1: { 'rss:feeds.example.com:item-9': { 100: { tabId: 7, allowGlob: '' } } },
    });
  });

  test('an ambiguous binding key re-keys from the FIRST matching instance', () => {
    const state = {
      pinnedBySpace: {
        s1: [
          {
            kind: 'smart',
            id: 'f1',
            name: 'Test',
            icon: 'folder-git-2',
            sources: [
              { source: 'gitlab', baseUrl: 'https://gitlab.com', query: 'authored' },
              { source: 'gitlab', baseUrl: 'https://gitlab.com', query: 'assigned' },
            ],
            maxItems: 20,
            hideRead: false,
            refreshMinutes: 10,
          },
        ],
      },
      smartItemBindings: { f1: { 'gitlab:gitlab.com:42': { 100: { tabId: 7, allowGlob: '' } } } },
    };
    const result = v9Migration.migrate(state) as typeof state;
    expect(result.smartItemBindings).toEqual({
      f1: { 'gitlab:gitlab.com:authored:42': { 100: { tabId: 7, allowGlob: '' } } },
    });
  });

  test('an orphaned binding (no matching node) is dropped', () => {
    const state = {
      pinnedBySpace: { s1: [] },
      smartItemBindings: { ghost: { 'gitlab:gitlab.com:1': { 1: { tabId: 1, allowGlob: '' } } } },
    };
    const result = v9Migration.migrate(state) as typeof state;
    expect(result.smartItemBindings).toEqual({});
  });

  test('a v8 envelope with no smart nodes or bindings passes through cleanly', () => {
    const state = {
      pinnedBySpace: { s1: [{ kind: 'tab', id: 't1' }] },
      smartItemBindings: {},
    };
    const result = v9Migration.migrate(state) as typeof state;
    expect(result.smartItemBindings).toEqual({});
    const node = result.pinnedBySpace.s1[0] as Record<string, unknown>;
    expect(node.kind).toBe('tab');
  });

  test('a full v1 → v13 chain validates against the v13 schema', () => {
    migrations.push(...realMigrations);
    const v1State: Record<string, unknown> = {
      schemaVersion: 1,
      spaces: [],
      activeSpaceByWindow: {},
      spaceInstancesByWindow: {},
      tabBindings: {},
      savedTabs: {},
      lastActivatedSpaceId: null,
      tabLastActivity: {},
      archivedTabs: [],
      trash: {},
      pinnedBySpace: {
        s1: [
          {
            kind: 'smart',
            id: 'f1',
            name: 'My MRs',
            icon: 'folder-git-2',
            source: 'gitlab',
            baseUrl: 'https://gitlab.com',
            query: 'authored',
            refreshMinutes: 10,
          },
        ],
      },
      faviconRow: [],
      smartItemBindings: {},
      // no smartReadState — pre-v6 envelope
    };

    const migrated = runMigrations(v1State, 1);
    const parsed = AppStateV13Schema.parse(migrated);
    const node = parsed.pinnedBySpace.s1?.[0];
    expect(node?.kind).toBe('lens');
    if (node?.kind === 'lens') {
      expect(node.lensKind).toBe('general');
      expect(node.sources[0]?.queries).toEqual(['authored']);
      // v13 extracted the embedded gitlab/gitlab.com source into an account the
      // lens now references.
      const sourceId = node.sources[0]?.sourceId;
      expect(sourceId).toBeDefined();
      if (sourceId) {
        expect(parsed.sources[sourceId]).toMatchObject({
          provider: 'gitlab',
          baseUrl: 'https://gitlab.com',
        });
      }
    }
  });
});

describe('v11 migration — establish-lens-model rename', () => {
  const v11Migration = realMigrations.find((m) => m.toVersion === 11);
  if (!v11Migration) throw new Error('expected v11 migration');

  test('a smart PinNode becomes a lens node with lensKind: general', () => {
    const state = {
      pinnedBySpace: {
        s1: [
          {
            kind: 'smart',
            id: 'f1',
            name: 'My MRs',
            icon: 'folder-git-2',
            sources: [{ source: 'gitlab', baseUrl: 'https://gitlab.com', queries: ['authored'] }],
            maxItems: 20,
            hideRead: true,
            refreshMinutes: 10,
          },
        ],
      },
      smartItemBindings: {},
      smartReadState: {},
    };
    const result = v11Migration.migrate(state) as typeof state;
    const node = result.pinnedBySpace.s1[0] as Record<string, unknown>;
    expect(node.kind).toBe('lens');
    expect(node.lensKind).toBe('general');
    // Provider/query values are untouched.
    const sources = node.sources as Array<Record<string, unknown>>;
    expect(sources[0]?.source).toBe('gitlab');
    expect(sources[0]?.queries).toEqual(['authored']);
  });

  test('smartItemBindings is renamed to lensItemBindings', () => {
    const state = {
      pinnedBySpace: {},
      smartItemBindings: {
        f1: { 'gitlab:gitlab.com:authored:42': { 1: { tabId: 7, allowGlob: '' } } },
      },
      smartReadState: {},
    };
    const result = v11Migration.migrate(state) as Record<string, unknown>;
    expect('smartItemBindings' in result).toBe(false);
    expect(result.lensItemBindings).toEqual({
      f1: { 'gitlab:gitlab.com:authored:42': { 1: { tabId: 7, allowGlob: '' } } },
    });
  });

  test('smartReadState is renamed to lensReadState', () => {
    const state = {
      pinnedBySpace: {},
      smartItemBindings: {},
      smartReadState: { f1: ['rss:feeds.example.com:item-1', 'rss:feeds.example.com:item-2'] },
    };
    const result = v11Migration.migrate(state) as Record<string, unknown>;
    expect('smartReadState' in result).toBe(false);
    expect(result.lensReadState).toEqual({
      f1: ['rss:feeds.example.com:item-1', 'rss:feeds.example.com:item-2'],
    });
  });

  test('provider/query values are untouched', () => {
    const state = {
      pinnedBySpace: {
        s1: [
          {
            kind: 'smart',
            id: 'f1',
            name: 'Issues',
            icon: 'folder-git-2',
            sources: [
              {
                source: 'github',
                baseUrl: 'https://api.github.com',
                queries: ['authored', 'assigned'],
              },
              { source: 'rss', baseUrl: 'https://feeds.example.com/rss', queries: [] },
            ],
            maxItems: 20,
            hideRead: false,
            refreshMinutes: 10,
          },
        ],
      },
      smartItemBindings: {},
      smartReadState: {},
    };
    const result = v11Migration.migrate(state) as typeof state;
    const node = result.pinnedBySpace.s1[0] as Record<string, unknown>;
    const sources = node.sources as Array<Record<string, unknown>>;
    expect(sources[0]?.source).toBe('github');
    expect(sources[0]?.queries).toEqual(['authored', 'assigned']);
    expect(sources[1]?.source).toBe('rss');
    expect(sources[1]?.queries).toEqual([]);
  });

  test('idempotent — running again on already-migrated data is a no-op', () => {
    const state = {
      pinnedBySpace: {
        s1: [
          {
            kind: 'lens',
            lensKind: 'general',
            id: 'f1',
            name: 'My MRs',
            icon: 'folder-git-2',
            sources: [{ source: 'gitlab', baseUrl: 'https://gitlab.com', queries: ['authored'] }],
            maxItems: 20,
            hideRead: true,
            refreshMinutes: 10,
          },
        ],
      },
      lensItemBindings: {},
      lensReadState: {},
    };
    const result = v11Migration.migrate(state) as typeof state;
    const node = result.pinnedBySpace.s1[0] as Record<string, unknown>;
    expect(node.kind).toBe('lens');
    expect(node.lensKind).toBe('general');
    expect('smartItemBindings' in result).toBe(false);
    expect('smartReadState' in result).toBe(false);
    expect((result as Record<string, unknown>).lensItemBindings).toEqual({});
    expect((result as Record<string, unknown>).lensReadState).toEqual({});
  });

  test('a v10 envelope validates under AppStateV11Schema after migration', () => {
    const v10State: Record<string, unknown> = {
      schemaVersion: 10,
      spaces: [],
      activeSpaceByWindow: {},
      spaceInstancesByWindow: {},
      tabBindings: {},
      savedTabs: {},
      lastActivatedSpaceId: null,
      tabLastActivity: {},
      archivedTabs: [],
      trash: {},
      pinnedBySpace: {
        s1: [
          {
            kind: 'smart',
            id: 'f1',
            name: 'My MRs',
            icon: 'folder-git-2',
            sources: [{ source: 'gitlab', baseUrl: 'https://gitlab.com', queries: ['authored'] }],
            maxItems: 20,
            hideRead: true,
            refreshMinutes: 10,
          },
        ],
      },
      faviconRow: [],
      smartItemBindings: {
        f1: { 'gitlab:gitlab.com:authored:42': { 1: { tabId: 7, allowGlob: '' } } },
      },
      smartReadState: { f1: ['rss:feeds.example.com:item-1'] },
    };

    const migrated = v11Migration.migrate(v10State);
    const parsed = AppStateV11Schema.parse(migrated);
    const node = parsed.pinnedBySpace.s1?.[0];
    expect(node?.kind).toBe('lens');
    if (node?.kind === 'lens') {
      expect(node.lensKind).toBe('general');
    }
    expect(parsed.lensItemBindings).toEqual({
      f1: { 'gitlab:gitlab.com:authored:42': { 1: { tabId: 7, allowGlob: '' } } },
    });
    expect(parsed.lensReadState).toEqual({ f1: ['rss:feeds.example.com:item-1'] });
  });

  test('non-smart (tab/folder) nodes are untouched', () => {
    const state = {
      pinnedBySpace: {
        s1: [
          { kind: 'tab', id: 't1' },
          {
            kind: 'folder',
            id: 'fdr1',
            name: 'Docs',
            icon: 'folder',
            color: 'blue',
            children: ['t1'],
          },
        ],
      },
      smartItemBindings: {},
      smartReadState: {},
    };
    const result = v11Migration.migrate(state) as typeof state;
    const tab = result.pinnedBySpace.s1[0] as Record<string, unknown>;
    const folder = result.pinnedBySpace.s1[1] as Record<string, unknown>;
    expect(tab.kind).toBe('tab');
    expect(folder.kind).toBe('folder');
    expect(tab.lensKind).toBeUndefined();
    expect(folder.lensKind).toBeUndefined();
  });

  // Compile-time guard: AppStateV10Schema (v10 on-disk shape) is kept for
  // migration fixtures. The coherence assertion lives in schemas.ts.
  test('AppStateV10Schema still parses a v10 on-disk envelope', () => {
    const v10 = {
      schemaVersion: 10,
      spaces: [],
      activeSpaceByWindow: {},
      spaceInstancesByWindow: {},
      tabBindings: {},
      savedTabs: {},
      lastActivatedSpaceId: null,
      tabLastActivity: {},
      archivedTabs: [],
      trash: {},
      pinnedBySpace: {
        s1: [
          {
            kind: 'smart',
            id: 'f1',
            name: 'Test',
            icon: 'folder-git-2',
            sources: [{ source: 'gitlab', baseUrl: 'https://gitlab.com', queries: ['authored'] }],
            maxItems: 20,
            hideRead: true,
            refreshMinutes: 10,
          },
        ],
      },
      faviconRow: [],
    };
    const parsed = AppStateV10Schema.parse(v10);
    const node = parsed.pinnedBySpace.s1?.[0];
    expect(node?.kind).toBe('smart');
  });
});

describe('v12 migration — review-lens lensKind enum widening', () => {
  const v12Migration = realMigrations.find((m) => m.toVersion === 12);
  if (!v12Migration) throw new Error('expected v12 migration');

  // A minimal valid v11 envelope carrying one `general` lens node.
  function v11Envelope(): Record<string, unknown> {
    return {
      schemaVersion: 11,
      spaces: [],
      activeSpaceByWindow: {},
      spaceInstancesByWindow: {},
      tabBindings: {},
      savedTabs: {},
      lastActivatedSpaceId: null,
      tabLastActivity: {},
      archivedTabs: [],
      trash: {},
      pinnedBySpace: {
        s1: [
          {
            kind: 'lens',
            lensKind: 'general',
            id: 'f1',
            name: 'My MRs',
            icon: 'folder-git-2',
            sources: [{ source: 'gitlab', baseUrl: 'https://gitlab.com', queries: ['authored'] }],
            maxItems: 20,
            hideRead: true,
            refreshMinutes: 10,
          },
        ],
      },
      faviconRow: [],
      lensItemBindings: {},
      lensReadState: {},
    };
  }

  test('is structural identity — a v11 general node is unchanged apart from the bump', () => {
    const input = v11Envelope();
    const out = v12Migration.migrate(input) as typeof input;
    // The v12 migration returns its input unchanged (identity pass-through).
    expect(out).toBe(input);
    const node = (out.pinnedBySpace as Record<string, Array<Record<string, unknown>>>).s1?.[0];
    expect(node?.lensKind).toBe('general');
  });

  test('a migrated v11 envelope validates under AppStateV12Schema', () => {
    const migrated = v12Migration.migrate(v11Envelope());
    const parsed = AppStateV12Schema.parse(migrated);
    const node = parsed.pinnedBySpace.s1?.[0];
    expect(node?.kind).toBe('lens');
    if (node?.kind === 'lens') expect(node.lensKind).toBe('general');
  });

  test('a lensKind: review node validates under AppStateV12Schema (the widened enum)', () => {
    const env = v11Envelope();
    const node = (env.pinnedBySpace as Record<string, Array<Record<string, unknown>>>).s1?.[0];
    if (node) {
      node.lensKind = 'review';
      node.sources = [
        { source: 'github', baseUrl: 'https://github.com', queries: ['review-requested'] },
      ];
    }
    const parsed = AppStateV12Schema.parse(env);
    const lens = parsed.pinnedBySpace.s1?.[0];
    expect(lens?.kind).toBe('lens');
    if (lens?.kind === 'lens') expect(lens.lensKind).toBe('review');
  });

  test('the v11 schema (frozen) rejects a review node — downgrade is detectable', () => {
    const env = v11Envelope();
    const node = (env.pinnedBySpace as Record<string, Array<Record<string, unknown>>>).s1?.[0];
    if (node) node.lensKind = 'review';
    expect(AppStateV11Schema.safeParse(env).success).toBe(false);
  });
});

describe('v13 migration — decouple-source-accounts extract + rewrite', () => {
  const v13Migration = realMigrations.find((m) => m.toVersion === 13);
  if (!v13Migration) throw new Error('expected v13 migration');

  // A minimal valid v12 envelope carrying two lens nodes that each embed the
  // SAME (provider, baseUrl) source — so the migration must dedupe to one account.
  function v12Envelope(): Record<string, unknown> {
    return {
      schemaVersion: 12,
      spaces: [],
      activeSpaceByWindow: {},
      spaceInstancesByWindow: {},
      tabBindings: {},
      savedTabs: {},
      lastActivatedSpaceId: null,
      tabLastActivity: {},
      archivedTabs: [],
      trash: {},
      pinnedBySpace: {
        s1: [
          {
            kind: 'lens',
            lensKind: 'general',
            id: 'f1',
            name: 'Authored',
            icon: 'folder-git-2',
            sources: [
              {
                source: 'github',
                baseUrl: 'https://github.com',
                queries: ['authored'],
                name: 'GH',
              },
            ],
            maxItems: 20,
            hideRead: true,
            refreshMinutes: 10,
          },
          {
            kind: 'lens',
            lensKind: 'review',
            id: 'f2',
            name: 'Reviews',
            icon: 'folder-git-2',
            sources: [
              { source: 'github', baseUrl: 'https://github.com', queries: ['review-requested'] },
            ],
            maxItems: 20,
            hideRead: true,
            refreshMinutes: 10,
          },
        ],
      },
      faviconRow: [],
      lensItemBindings: {},
      lensReadState: {},
    };
  }

  test('extracts ONE account both lenses reference by the same sourceId; carries the name', () => {
    const out = v13Migration.migrate(v12Envelope()) as Record<string, unknown>;
    const sources = out.sources as Record<
      string,
      { provider: string; baseUrl: string; name?: string }
    >;
    const ids = Object.keys(sources);
    expect(ids).toHaveLength(1);
    const accId = ids[0] as string;
    expect(sources[accId]).toMatchObject({ provider: 'github', baseUrl: 'https://github.com' });
    // The source `name` migrated onto the account (first occurrence wins).
    expect(sources[accId]?.name).toBe('GH');

    const nodes = (out.pinnedBySpace as Record<string, Array<Record<string, unknown>>>).s1;
    expect(nodes?.[0]?.sources).toEqual([{ sourceId: accId, queries: ['authored'] }]);
    expect(nodes?.[1]?.sources).toEqual([{ sourceId: accId, queries: ['review-requested'] }]);
  });

  test('a migrated v12 envelope validates under AppStateV13Schema', () => {
    const migrated = v13Migration.migrate(v12Envelope());
    const parsed = AppStateV13Schema.parse(migrated);
    expect(Object.keys(parsed.sources)).toHaveLength(1);
    const node = parsed.pinnedBySpace.s1?.[0];
    expect(node?.kind).toBe('lens');
    if (node?.kind === 'lens') {
      expect(node.sources[0]).toHaveProperty('sourceId');
      expect(node.sources[0]).not.toHaveProperty('source');
    }
  });

  test('AppStateV13Schema rejects a v12 embedded-source lens node (downgrade is detectable)', () => {
    // The pre-migration v12 envelope's lens node carries the embedded
    // `{ source, baseUrl, queries }` shape — invalid under the ref-only v13 schema.
    expect(AppStateV13Schema.safeParse(v12Envelope()).success).toBe(false);
  });
});

describe('v14 migration — lens-view-filters pass-through', () => {
  const v14Migration = realMigrations.find((m) => m.toVersion === 14);
  if (!v14Migration) throw new Error('expected v14 migration');

  function v13Envelope(): Record<string, unknown> {
    return {
      schemaVersion: 13,
      spaces: [],
      sources: { 'acc-1': { id: 'acc-1', provider: 'github', baseUrl: 'https://github.com' } },
      activeSpaceByWindow: {},
      spaceInstancesByWindow: {},
      tabBindings: {},
      savedTabs: {},
      lastActivatedSpaceId: null,
      tabLastActivity: {},
      archivedTabs: [],
      trash: {},
      pinnedBySpace: {
        s1: [
          {
            kind: 'lens',
            lensKind: 'general',
            id: 'f1',
            name: 'Authored',
            icon: 'folder-git-2',
            sources: [{ sourceId: 'acc-1', queries: ['authored'] }],
            maxItems: 20,
            hideRead: true,
            refreshMinutes: 10,
          },
        ],
      },
      faviconRow: [],
      lensItemBindings: {},
      lensReadState: {},
    };
  }

  test('the v14 migration is an identity pass-through (returns the same reference)', () => {
    const input = v13Envelope();
    expect(v14Migration.migrate(input)).toBe(input);
  });

  test('a migrated v13 envelope validates under AppStateV14Schema with no filter', () => {
    const migrated = v14Migration.migrate(v13Envelope());
    const parsed = AppStateV14Schema.parse(migrated);
    const node = parsed.pinnedBySpace.s1?.[0];
    expect(node?.kind).toBe('lens');
    if (node?.kind === 'lens') {
      expect(node.filter).toBeUndefined();
    }
  });

  test('a v14 state with a lens carrying a filter round-trips under AppStateV14Schema', () => {
    const env = v13Envelope();
    const nodes = (env.pinnedBySpace as Record<string, unknown[]>).s1;
    (nodes?.[0] as Record<string, unknown>).filter = {
      entities: ['ticket'],
      projects: ['Payments'],
    };
    const parsed = AppStateV14Schema.parse(v14Migration.migrate(env));
    const node = parsed.pinnedBySpace.s1?.[0];
    expect(node?.kind === 'lens' && node.filter).toEqual({
      entities: ['ticket'],
      projects: ['Payments'],
    });
  });

  test('AppStateV13Schema rejects a v14 lens node carrying a filter (downgrade detectable)', () => {
    const env = v13Envelope();
    const nodes = (env.pinnedBySpace as Record<string, unknown[]>).s1;
    (nodes?.[0] as Record<string, unknown>).filter = { entities: ['change'] };
    expect(AppStateV13Schema.safeParse(env).success).toBe(false);
  });
});

describe('v15 migration — rekey lens sections by sourceId', () => {
  const v15Migration = realMigrations.find((m) => m.toVersion === 15);
  if (!v15Migration) throw new Error('expected v15 migration');
  const migrate = v15Migration.migrate;

  // Build a minimal envelope carrying only the slices the v15 migration reads.
  function run(
    sources: Record<string, { id: string; provider: string; baseUrl: string }>,
    lensItemBindings: Record<string, Record<string, unknown>>,
    lensReadState: Record<string, string[]>,
  ): {
    lensItemBindings: Record<string, Record<string, unknown>>;
    lensReadState: Record<string, string[]>;
  } {
    const env = { schemaVersion: 14, sources, lensItemBindings, lensReadState };
    return migrate(structuredClone(env)) as ReturnType<typeof run>;
  }

  const SLOT = { 100: { tabId: 1, allowGlob: '' } };

  test('rewrites a single-account binding key and read-state id onto the sourceId', () => {
    const out = run(
      { 'acc-1': { id: 'acc-1', provider: 'github', baseUrl: 'https://github.com' } },
      { f1: { 'github:github.com:authored:42': SLOT } },
      { f1: ['github:github.com:authored:7'] },
    );
    expect(out.lensItemBindings.f1).toEqual({ 'acc-1:authored:42': SLOT });
    expect(out.lensReadState.f1).toEqual(['acc-1:authored:7']);
  });

  test('is idempotent on re-run (first segment already an account id)', () => {
    const sources = { 'acc-1': { id: 'acc-1', provider: 'github', baseUrl: 'https://github.com' } };
    const once = run(
      sources,
      { f1: { 'github:github.com:authored:42': SLOT } },
      { f1: ['github:github.com:authored:7'] },
    );
    const twice = run(sources, once.lensItemBindings, once.lensReadState);
    expect(twice.lensItemBindings.f1).toEqual({ 'acc-1:authored:42': SLOT });
    expect(twice.lensReadState.f1).toEqual(['acc-1:authored:7']);
  });

  test('drops an unmappable id (no matching account)', () => {
    const out = run(
      { 'acc-1': { id: 'acc-1', provider: 'gitlab', baseUrl: 'https://gitlab.com' } },
      { f1: { 'github:github.com:authored:42': SLOT } },
      { f1: ['github:github.com:authored:7'] },
    );
    expect(out.lensItemBindings.f1).toEqual({});
    expect(out.lensReadState.f1).toEqual([]);
  });

  test('drops a same-origin-ambiguous id (two accounts share an identical provider:host:)', () => {
    const out = run(
      {
        'acc-work': { id: 'acc-work', provider: 'github', baseUrl: 'https://github.com' },
        'acc-personal': { id: 'acc-personal', provider: 'github', baseUrl: 'https://github.com' },
      },
      { f1: { 'github:github.com:authored:42': SLOT } },
      { f1: ['github:github.com:authored:7'] },
    );
    expect(out.lensItemBindings.f1).toEqual({});
    expect(out.lensReadState.f1).toEqual([]);
  });

  test('longest-prefix: a port-bearing host coexisting with a port-less sibling keeps its data', () => {
    const out = run(
      {
        'acc-A': { id: 'acc-A', provider: 'gitlab', baseUrl: 'https://git.example.com' },
        'acc-B': { id: 'acc-B', provider: 'gitlab', baseUrl: 'https://git.example.com:8443' },
      },
      {
        f1: {
          'gitlab:git.example.com:8443:authored:42': SLOT,
          'gitlab:git.example.com:authored:7': SLOT,
        },
      },
      { f1: ['gitlab:git.example.com:8443:authored:99', 'gitlab:git.example.com:authored:5'] },
    );
    expect(out.lensItemBindings.f1).toEqual({
      'acc-B:authored:42': SLOT,
      'acc-A:authored:7': SLOT,
    });
    expect(out.lensReadState.f1).toEqual(['acc-B:authored:99', 'acc-A:authored:5']);
  });

  test('rewrites an rss URL nativeId match-first (not a colon split)', () => {
    const out = run(
      { 'acc-r': { id: 'acc-r', provider: 'rss', baseUrl: 'https://feeds.x.com' } },
      { f1: { 'rss:feeds.x.com:https://x.com/post/1': SLOT } },
      { f1: ['rss:feeds.x.com:https://x.com/post/1'] },
    );
    expect(out.lensItemBindings.f1).toEqual({ 'acc-r:https://x.com/post/1': SLOT });
    expect(out.lensReadState.f1).toEqual(['acc-r:https://x.com/post/1']);
  });
});

describe('v16 migration — add-bitbucket-connector identity pass-through', () => {
  const v16Migration = realMigrations.find((m) => m.toVersion === 16);
  if (!v16Migration) throw new Error('expected v16 migration');

  // A minimal valid v15 envelope: a Cloud bitbucket account (with workspace), a
  // non-bitbucket account (without workspace), and a lens referencing the former.
  function v15Envelope(): Record<string, unknown> {
    return {
      schemaVersion: 15,
      spaces: [],
      sources: {
        'acc-bb': {
          id: 'acc-bb',
          provider: 'bitbucket',
          baseUrl: 'https://bitbucket.org',
          workspace: 'acme',
        },
        'acc-gh': { id: 'acc-gh', provider: 'github', baseUrl: 'https://github.com' },
      },
      activeSpaceByWindow: {},
      spaceInstancesByWindow: {},
      tabBindings: {},
      savedTabs: {},
      lastActivatedSpaceId: null,
      tabLastActivity: {},
      archivedTabs: [],
      trash: {},
      pinnedBySpace: {
        s1: [
          {
            kind: 'lens',
            lensKind: 'review',
            id: 'f1',
            name: 'My PRs',
            icon: 'folder-git-2',
            sources: [{ sourceId: 'acc-bb', queries: ['authored'] }],
            maxItems: 20,
            hideRead: true,
            refreshMinutes: 10,
          },
        ],
      },
      faviconRow: [],
      lensItemBindings: {},
      lensReadState: {},
    };
  }

  test('is an identity pass-through (returns the same reference, version advances)', () => {
    const input = v15Envelope();
    expect(v16Migration.migrate(input)).toBe(input);
  });

  test('AppStateV16Schema accepts a Cloud bitbucket account with a workspace and a non-bitbucket account without one', () => {
    const parsed = AppStateV16Schema.parse(v16Migration.migrate(v15Envelope()));
    expect(parsed.sources['acc-bb']?.workspace).toBe('acme');
    expect(parsed.sources['acc-bb']?.provider).toBe('bitbucket');
    expect(parsed.sources['acc-gh']?.workspace).toBeUndefined();
  });
});

// The runner suites clear the array around each test, then each case sets up
// its own minimal migration list to drive the runner / terminal-guard
// mechanics. The real chain is restored after the last test.
beforeEach(() => {
  migrations.length = 0;
});

afterEach(() => {
  migrations.length = 0;
  migrations.push(...realMigrations);
});

describe('runMigrations', () => {
  test('empty migrations is a no-op', () => {
    const input = { foo: 1 };
    expect(runMigrations(input, 0)).toBe(input);
    expect(runMigrations(input, 5)).toBe(input);
  });

  test('pending migrations apply in array order, threading outputs', () => {
    const calls: Array<{ to: number; in: unknown }> = [];
    const m2: Migration = {
      toVersion: 2,
      migrate: (raw) => {
        calls.push({ to: 2, in: raw });
        return { ...(raw as object), step: 2 };
      },
    };
    const m3: Migration = {
      toVersion: 3,
      migrate: (raw) => {
        calls.push({ to: 3, in: raw });
        return { ...(raw as object), step: 3 };
      },
    };
    migrations.push(m2, m3);

    const result = runMigrations({ start: true }, 1);
    expect(calls).toEqual([
      { to: 2, in: { start: true } },
      { to: 3, in: { start: true, step: 2 } },
    ]);
    expect(result).toEqual({ start: true, step: 3 });
  });

  test('entries with toVersion <= persistedVersion are skipped', () => {
    const calls: number[] = [];
    migrations.push(
      {
        toVersion: 2,
        migrate: (raw) => {
          calls.push(2);
          return raw;
        },
      },
      {
        toVersion: 3,
        migrate: (raw) => {
          calls.push(3);
          return raw;
        },
      },
    );

    runMigrations({}, 2);
    expect(calls).toEqual([3]);
  });

  test('empty list passes the terminal guard', () => {
    expect(() => assertMigrationsTerminal([], 1)).not.toThrow();
  });

  test('non-terminal last entry trips the guard', () => {
    const bad: Migration[] = [{ toVersion: 2, migrate: (x) => x }];
    expect(() => assertMigrationsTerminal(bad, 3)).toThrow(/must equal/);
  });

  test('terminal last entry passes the guard', () => {
    const ok: Migration[] = [{ toVersion: 3, migrate: (x) => x }];
    expect(() => assertMigrationsTerminal(ok, 3)).not.toThrow();
  });

  test('a throwing migrate propagates', () => {
    migrations.push({
      toVersion: 2,
      migrate: () => {
        throw new Error('boom');
      },
    });
    expect(() => runMigrations({}, 1)).toThrow('boom');
  });
});
