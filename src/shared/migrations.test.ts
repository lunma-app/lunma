import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { assertMigrationsTerminal, type Migration, migrations, runMigrations } from './migrations';

// The persisted migration list is empty at the v1 baseline (rebrand-to-lunma),
// so these tests exercise the migration *runner* in isolation: clear the array
// around each test, then each case sets up its own minimal migration list to
// drive the runner / terminal-guard mechanics.
beforeEach(() => {
  migrations.length = 0;
});

afterEach(() => {
  migrations.length = 0;
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
