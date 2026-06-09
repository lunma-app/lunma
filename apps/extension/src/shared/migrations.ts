import { CURRENT_SCHEMA_VERSION } from './schemas';

export type Migration = {
  toVersion: number;
  migrate: (raw: unknown) => unknown;
};

/**
 * Pre-release clean baseline (rebrand-to-lunma): the placeholder-era `v1→v11`
 * migration chain was collapsed to a single current schema (`AppStateV1Schema`),
 * so there are no historical persisted versions to migrate from — the list is
 * empty. The `Migration` type, the terminal guard, and the runner are retained
 * so the next schema bump re-introduces a migration the usual append-only way;
 * today they simply operate over an empty list.
 */
export const migrations: Migration[] = [];

export function assertMigrationsTerminal(list: Migration[], currentVersion: number): void {
  if (list.length === 0) return;
  const last = list[list.length - 1];
  if (last !== undefined && last.toVersion !== currentVersion) {
    throw new Error(
      `migrations: last entry toVersion (${last.toVersion}) must equal CURRENT_SCHEMA_VERSION (${currentVersion})`,
    );
  }
}

assertMigrationsTerminal(migrations, CURRENT_SCHEMA_VERSION);

export function runMigrations(raw: unknown, persistedVersion: number): unknown {
  let current = raw;
  for (const migration of migrations) {
    if (migration.toVersion > persistedVersion) {
      current = migration.migrate(current);
    }
  }
  return current;
}
