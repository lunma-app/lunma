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
 * '' }` so the boundary content script can be re-armed at boot. The seventh
 * (v8, multi-source-smart-folders) wraps each smart node's flat
 * `source`/`baseUrl`/`query?` into `sources: [{ source, baseUrl, query }]` and
 * re-keys `smartItemBindings` item ids as `${sourceKey}:${nativeId}`.
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
  {
    toVersion: 8,
    migrate: (raw: unknown): unknown => {
      if (typeof raw !== 'object' || raw === null) return raw;
      const state = raw as Record<string, unknown>;
      const pinnedBySpace = state.pinnedBySpace;
      if (typeof pinnedBySpace !== 'object' || pinnedBySpace === null) return raw;

      // Build a lookup: folderId → { source, baseUrl } for sourceKey derivation
      // in step 2. Must be populated BEFORE we mutate the nodes in step 1.
      const smartNodeById = new Map<string, { source: string; baseUrl: string }>();

      // Step 1: wrap each smart node's flat source/baseUrl/query? into sources[].
      for (const nodes of Object.values(pinnedBySpace as Record<string, unknown>)) {
        if (!Array.isArray(nodes)) continue;
        for (const node of nodes) {
          if (typeof node !== 'object' || node === null) continue;
          const n = node as Record<string, unknown>;
          if (n.kind !== 'smart') continue;
          const { source, baseUrl, query, id } = n;
          if (typeof source !== 'string' || typeof baseUrl !== 'string' || typeof id !== 'string')
            continue;
          // Record original values before mutating.
          smartNodeById.set(id, { source, baseUrl });
          const cfg: Record<string, unknown> = { source, baseUrl };
          if (typeof query === 'string') cfg.query = query;
          n.sources = [cfg];
          delete n.source;
          delete n.baseUrl;
          delete n.query;
        }
      }

      // Step 2: re-key smartItemBindings item ids with sourceKey namespace.
      const bindings = state.smartItemBindings;
      if (typeof bindings !== 'object' || bindings === null) return raw;
      const bindingsMap = bindings as Record<string, unknown>;
      for (const [folderId, byItem] of Object.entries(bindingsMap)) {
        const smartInfo = smartNodeById.get(folderId);
        if (!smartInfo) {
          // Orphaned binding — no matching smart node, drop it.
          delete bindingsMap[folderId];
          continue;
        }
        let host: string;
        try {
          host = new URL(smartInfo.baseUrl).host;
        } catch {
          // Malformed baseUrl — drop the folderId entry defensively.
          delete bindingsMap[folderId];
          continue;
        }
        const sk = `${smartInfo.source}:${host}`;
        if (typeof byItem !== 'object' || byItem === null) continue;
        const newByItem: Record<string, unknown> = {};
        for (const [itemId, slots] of Object.entries(byItem as Record<string, unknown>)) {
          newByItem[`${sk}:${itemId}`] = slots;
        }
        bindingsMap[folderId] = newByItem;
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
