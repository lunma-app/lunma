import { CURRENT_SCHEMA_VERSION } from './schemas';

export type Migration = {
  toVersion: number;
  migrate: (raw: unknown) => unknown;
};

/**
 * Append-only from the v1 clean baseline (rebrand-to-lunma) onward. The first
 * five entries are pure pass-throughs (see detailed reasons below); the sixth
 * (v7, smart-tab-boundary) is a REAL transformation — each `smartItemBindings`
 * slot that holds a bare `TabId` (number) is widened to `{ tabId, allowGlob:
 * '' }` so the boundary content script can be re-armed at boot.
 *
 * Pass-through rationale: v1→v2 (v1 data cannot contain `smart` pinned nodes),
 * v2→v3 (v2 data cannot contain `source: 'github'` nodes), v3→v4 (new
 * `smartItemBindings` slice parses via `.default({})`), v4→v5 (v4 data cannot
 * contain `source: 'jira'` nodes), v5→v6 (v5 data cannot contain `source: 'rss'`
 * nodes; the new `maxItems`/`hideRead`/`smartReadState` fields parse via schema
 * defaults). Each bump exists so a DOWNGRADE is detectable (an older build reading
 * newer data quarantines on the version gate instead of Zod-rejecting unfamiliar
 * nodes/fields with a confusing parse error).
 */
export const migrations: Migration[] = [
  { toVersion: 2, migrate: (raw) => raw },
  { toVersion: 3, migrate: (raw) => raw },
  { toVersion: 4, migrate: (raw) => raw },
  { toVersion: 5, migrate: (raw) => raw },
  { toVersion: 6, migrate: (raw) => raw },
  {
    toVersion: 7,
    migrate: (raw: unknown): unknown => {
      if (typeof raw !== 'object' || raw === null) return raw;
      const state = raw as Record<string, unknown>;
      const bindings = state.smartItemBindings;
      if (typeof bindings !== 'object' || bindings === null) return raw;
      for (const byItem of Object.values(bindings as Record<string, unknown>)) {
        if (typeof byItem !== 'object' || byItem === null) continue;
        for (const slots of Object.values(byItem as Record<string, unknown>)) {
          if (typeof slots !== 'object' || slots === null) continue;
          const slotMap = slots as Record<string, unknown>;
          for (const [windowId, slot] of Object.entries(slotMap)) {
            if (typeof slot === 'number') {
              slotMap[windowId] = { tabId: slot, allowGlob: '' };
            }
          }
        }
      }
      return raw;
    },
  },
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
