import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { assertMigrationsTerminal, type Migration, migrations, runMigrations } from './migrations';
import { CURRENT_SCHEMA_VERSION } from './schemas';

// Snapshot of the REAL migration chain, captured at module load (before the
// runner suites below clear the array to exercise the mechanics in isolation).
const realMigrations = [...migrations];

describe('the real migration chain', () => {
  test('holds exactly the v2 and v3 pass-through entries', () => {
    expect(realMigrations).toHaveLength(2);
    expect(realMigrations[0]?.toVersion).toBe(2);
    expect(realMigrations[1]?.toVersion).toBe(3);
    expect(CURRENT_SCHEMA_VERSION).toBe(3);
    // Pass-throughs: v1 data cannot contain smart nodes (v2), v2 data cannot
    // contain `source: 'github'` nodes (v3); no field changes shape.
    const input = { schemaVersion: 1, pinnedBySpace: { work: [{ kind: 'tab', id: 'a' }] } };
    expect(realMigrations[0]?.migrate(input)).toBe(input);
    expect(realMigrations[1]?.migrate(input)).toBe(input);
  });

  test('a v1 payload chains through both pass-throughs unchanged', () => {
    // The file-level beforeEach clears the live array for the runner suites —
    // restore the real chain so this exercises it, not an empty list.
    migrations.push(...realMigrations);
    const input = { schemaVersion: 1, pinnedBySpace: { work: [{ kind: 'tab', id: 'a' }] } };
    expect(runMigrations(input, 1)).toBe(input);
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
