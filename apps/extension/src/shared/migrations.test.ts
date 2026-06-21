import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { assertMigrationsTerminal, type Migration, migrations, runMigrations } from './migrations';
import { AppStateV6Schema, AppStateV8Schema, CURRENT_SCHEMA_VERSION } from './schemas';
import { createInitialState } from './store.svelte';

// Snapshot of the REAL migration chain, captured at module load (before the
// runner suites below clear the array to exercise the mechanics in isolation).
const realMigrations = [...migrations];

describe('the real migration chain', () => {
  test('holds exactly the v2, v3, v4, v5, v6, v7, and v8 entries', () => {
    expect(realMigrations).toHaveLength(7);
    expect(realMigrations[0]?.toVersion).toBe(2);
    expect(realMigrations[1]?.toVersion).toBe(3);
    expect(realMigrations[2]?.toVersion).toBe(4);
    expect(realMigrations[3]?.toVersion).toBe(5);
    expect(realMigrations[4]?.toVersion).toBe(6);
    expect(realMigrations[5]?.toVersion).toBe(7);
    expect(realMigrations[6]?.toVersion).toBe(8);
    expect(CURRENT_SCHEMA_VERSION).toBe(8);
    // v2–v6 are pass-throughs (see comment in migrations.ts). v7 is the
    // smart-tab-boundary real transformation; v8 is the multi-source wrap.
    const input = { schemaVersion: 1, pinnedBySpace: { work: [{ kind: 'tab', id: 'a' }] } };
    expect(realMigrations[0]?.migrate(input)).toBe(input);
    expect(realMigrations[1]?.migrate(input)).toBe(input);
    expect(realMigrations[2]?.migrate(input)).toBe(input);
    expect(realMigrations[3]?.migrate(input)).toBe(input);
    expect(realMigrations[4]?.migrate(input)).toBe(input);
  });

  test('a v1 payload chains through all seven entries cleanly', () => {
    // The file-level beforeEach clears the live array for the runner suites —
    // restore the real chain so this exercises it, not an empty list.
    migrations.push(...realMigrations);
    // v1 data has no smartItemBindings and no smart nodes, so the v7 and v8
    // real migrations are both no-ops; all seven migrations return the same reference.
    const input = { schemaVersion: 1, pinnedBySpace: { work: [{ kind: 'tab', id: 'a' }] } };
    expect(runMigrations(input, 1)).toBe(input);
  });

  test('a v5 envelope migrates losslessly and defaults the new v6 node + slice fields', () => {
    migrations.push(...realMigrations);
    // A v5-shaped state whose smart node carries NO maxItems/hideRead and which
    // has no smartReadState slice — exactly what a build before rss-connector
    // wrote. The v5→v6 migration is a pass-through; the V6 schema's `.default()`s
    // supply the new fields on parse (rss-connector design D5/D9/D3). The v8
    // migration wraps source/baseUrl/query into sources[].
    const v5State = {
      ...createInitialState(),
      schemaVersion: 5,
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
    } as unknown as Record<string, unknown>;
    delete v5State.smartReadState; // the slice did not exist pre-v6

    const migrated = runMigrations(v5State, 5);
    const parsed = AppStateV6Schema.parse(migrated);
    const node = parsed.pinnedBySpace.work?.[0];
    expect(node?.kind).toBe('smart');
    if (node?.kind === 'smart') {
      expect(node.maxItems).toBe(20);
      // The draining-queue default: a feed's resting state hides read (drained).
      expect(node.hideRead).toBe(true);
      // query moved to sources[0] by the v8 migration.
      expect(node.sources?.[0]?.query).toBe('authored');
    }
    expect(parsed.smartReadState).toEqual({});
  });
});

describe('v7 migration — smart-tab-boundary slot widening', () => {
  test('v6 envelope with a numeric smartItemBindings slot migrates to { tabId, allowGlob: "" } and then v8 re-keys the item id', () => {
    migrations.push(...realMigrations);
    const v6State = {
      ...createInitialState(),
      schemaVersion: 6,
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
      // Bare number slot — the shape written by the previous code.
      smartItemBindings: { f1: { 'item-a': { 100: 42 } } },
    } as unknown as Record<string, unknown>;

    const migrated = runMigrations(v6State, 6);
    // Parse against V8 since the full chain now ends at v8.
    const parsed = AppStateV8Schema.parse(migrated);
    // v7 widened the slot; v8 re-keyed the item id with the sourceKey namespace.
    expect(parsed.smartItemBindings).toEqual({
      f1: { 'gitlab:gitlab.com:item-a': { 100: { tabId: 42, allowGlob: '' } } },
    });
  });

  test('v6 envelope with empty smartItemBindings passes through unchanged', () => {
    migrations.push(...realMigrations);
    const v6State = {
      ...createInitialState(),
      schemaVersion: 6,
      smartItemBindings: {},
    } as unknown as Record<string, unknown>;

    const migrated = runMigrations(v6State, 6);
    const parsed = AppStateV8Schema.parse(migrated);
    expect(parsed.smartItemBindings).toEqual({});
  });

  test('v1 envelope migrates through all seven entries cleanly (no smartItemBindings)', () => {
    migrations.push(...realMigrations);
    const v1State = {
      ...createInitialState(),
      schemaVersion: 1,
    } as unknown as Record<string, unknown>;
    // No smartItemBindings or smart nodes in v1 — v7 and v8 migrations are both
    // no-ops; v8 schema default fills smartItemBindings with {}.
    const migrated = runMigrations(v1State, 1);
    const parsed = AppStateV8Schema.parse(migrated);
    expect(parsed.smartItemBindings).toEqual({});
    expect(parsed.schemaVersion).toBe(1); // the schema version field itself is from the state
  });
});

describe('v8 migration — multi-source-smart-folders node wrap', () => {
  const v8Migration = realMigrations.at(-1);
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
