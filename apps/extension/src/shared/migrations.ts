import { CURRENT_SCHEMA_VERSION } from './schemas';

export type Migration = {
  toVersion: number;
  migrate: (raw: unknown) => unknown;
};

/**
 * Append-only from the v1 clean baseline (rebrand-to-lunma) onward. Both real
 * entries are pure pass-throughs: the smart-folders v1→v2 bump (v1 data cannot
 * contain `smart` pinned nodes — the v2 schema simply admits the new `PinNode`
 * kind) and the github-connector v2→v3 bump (v2 data cannot contain
 * `source: 'github'` nodes and no field changes shape — the v3 schema simply
 * admits the value). Each bump exists so a DOWNGRADE is detectable (an older
 * build reading newer data quarantines on the version gate instead of
 * Zod-rejecting unfamiliar nodes with a confusing parse error).
 */
export const migrations: Migration[] = [
  { toVersion: 2, migrate: (raw) => raw },
  { toVersion: 3, migrate: (raw) => raw },
];

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
