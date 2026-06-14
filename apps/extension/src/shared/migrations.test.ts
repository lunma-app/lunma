import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { assertMigrationsTerminal, type Migration, migrations, runMigrations } from './migrations';
import { AppStateV6Schema, AppStateV7Schema, CURRENT_SCHEMA_VERSION } from './schemas';
import { createInitialState } from './store.svelte';

// Snapshot of the REAL migration chain, captured at module load (before the
// runner suites below clear the array to exercise the mechanics in isolation).
const realMigrations = [...migrations];

describe('the real migration chain', () => {
  test('holds exactly the v2, v3, v4, v5, v6, and v7 entries', () => {
    expect(realMigrations).toHaveLength(6);
    expect(realMigrations[0]?.toVersion).toBe(2);
    expect(realMigrations[1]?.toVersion).toBe(3);
    expect(realMigrations[2]?.toVersion).toBe(4);
    expect(realMigrations[3]?.toVersion).toBe(5);
    expect(realMigrations[4]?.toVersion).toBe(6);
    expect(realMigrations[5]?.toVersion).toBe(7);
    expect(CURRENT_SCHEMA_VERSION).toBe(7);
    // v2–v6 are pass-throughs (see comment in migrations.ts). v7 is the
    // smart-tab-boundary real transformation — tested in the describe block below.
    const input = { schemaVersion: 1, pinnedBySpace: { work: [{ kind: 'tab', id: 'a' }] } };
    expect(realMigrations[0]?.migrate(input)).toBe(input);
    expect(realMigrations[1]?.migrate(input)).toBe(input);
    expect(realMigrations[2]?.migrate(input)).toBe(input);
    expect(realMigrations[3]?.migrate(input)).toBe(input);
    expect(realMigrations[4]?.migrate(input)).toBe(input);
  });

  test('a v1 payload chains through all six entries cleanly', () => {
    // The file-level beforeEach clears the live array for the runner suites —
    // restore the real chain so this exercises it, not an empty list.
    migrations.push(...realMigrations);
    // v1 data has no smartItemBindings, so the v7 real migration is a no-op;
    // all six migrations return the same reference.
    const input = { schemaVersion: 1, pinnedBySpace: { work: [{ kind: 'tab', id: 'a' }] } };
    expect(runMigrations(input, 1)).toBe(input);
  });

  test('a v5 envelope migrates losslessly and defaults the new v6 node + slice fields', () => {
    migrations.push(...realMigrations);
    // A v5-shaped state whose smart node carries NO maxItems/hideRead and which
    // has no smartReadState slice — exactly what a build before rss-connector
    // wrote. The v5→v6 migration is a pass-through; the V6 schema's `.default()`s
    // supply the new fields on parse (rss-connector design D5/D9/D3).
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
      expect(node.query).toBe('authored'); // preserved
    }
    expect(parsed.smartReadState).toEqual({});
  });
});

describe('v7 migration — smart-tab-boundary slot widening', () => {
  test('v6 envelope with a numeric smartItemBindings slot migrates to { tabId, allowGlob: "" }', () => {
    migrations.push(...realMigrations);
    const v6State = {
      ...createInitialState(),
      schemaVersion: 6,
      // Bare number slot — the shape written by the previous code.
      smartItemBindings: { f1: { 'item-a': { 100: 42 } } },
    } as unknown as Record<string, unknown>;

    const migrated = runMigrations(v6State, 6);
    const parsed = AppStateV7Schema.parse(migrated);
    expect(parsed.smartItemBindings).toEqual({
      f1: { 'item-a': { 100: { tabId: 42, allowGlob: '' } } },
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
    const parsed = AppStateV7Schema.parse(migrated);
    expect(parsed.smartItemBindings).toEqual({});
  });

  test('v1 envelope migrates through all six entries cleanly (no smartItemBindings)', () => {
    migrations.push(...realMigrations);
    const v1State = {
      ...createInitialState(),
      schemaVersion: 1,
    } as unknown as Record<string, unknown>;
    // No smartItemBindings in v1 — v7 migration is a no-op; v7 schema default fills it.
    const migrated = runMigrations(v1State, 1);
    const parsed = AppStateV7Schema.parse(migrated);
    expect(parsed.smartItemBindings).toEqual({});
    expect(parsed.schemaVersion).toBe(1); // the schema version field itself is from the state
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
