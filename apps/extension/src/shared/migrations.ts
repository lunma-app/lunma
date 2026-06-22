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
 * re-keys `smartItemBindings` item ids as `${sourceKey}:${nativeId}`. The eighth
 * (v9, multi-filter-smart-connectors) rewrites each `sources[]` entry from the
 * flat `query?` shape to `queries: SmartQuery[]` (queue → `[query]`, rss → `[]`)
 * and re-keys `smartItemBindings` from the v8 `${source}:${host}:${nativeId}`
 * form to the per-filter `${source}:${host}:${query}:${nativeId}` form.
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
  {
    toVersion: 9,
    migrate: (raw: unknown): unknown => {
      if (typeof raw !== 'object' || raw === null) return raw;
      const state = raw as Record<string, unknown>;
      const pinnedBySpace = state.pinnedBySpace;
      if (typeof pinnedBySpace !== 'object' || pinnedBySpace === null) return raw;

      // Step 1: rewrite each smart node's sources[] entries from the flat
      // `query?` shape to `queries[]` (queue → [query], rss → []). Record, per
      // folder, the ordered instances `{ oldKey: `${source}:${host}`, query? }`
      // for the binding re-key in step 2 (query = the instance's first filter).
      const instancesByFolder = new Map<
        string,
        Array<{ oldKey: string; query: string | undefined }>
      >();
      for (const nodes of Object.values(pinnedBySpace as Record<string, unknown>)) {
        if (!Array.isArray(nodes)) continue;
        for (const node of nodes) {
          if (typeof node !== 'object' || node === null) continue;
          const n = node as Record<string, unknown>;
          if (n.kind !== 'smart') continue;
          const id = n.id;
          const sources = n.sources;
          if (typeof id !== 'string' || !Array.isArray(sources)) continue;
          const instances: Array<{ oldKey: string; query: string | undefined }> = [];
          for (const entry of sources) {
            if (typeof entry !== 'object' || entry === null) continue;
            const e = entry as Record<string, unknown>;
            const { source, baseUrl, query } = e;
            // Idempotent: an entry already in the v9 shape (carries `queries`)
            // is left untouched — only the flat `query?` shape is rewritten.
            const queries = Array.isArray(e.queries)
              ? (e.queries as unknown[])
              : typeof query === 'string'
                ? [query]
                : [];
            if (!Array.isArray(e.queries)) {
              e.queries = queries;
              delete e.query;
            }
            if (typeof source === 'string' && typeof baseUrl === 'string') {
              let host: string;
              try {
                host = new URL(baseUrl).host;
              } catch {
                continue; // malformed baseUrl — skip this instance for re-keying
              }
              const firstQuery = typeof queries[0] === 'string' ? queries[0] : undefined;
              instances.push({ oldKey: `${source}:${host}`, query: firstQuery });
            }
          }
          instancesByFolder.set(id, instances);
        }
      }

      // Step 2: re-key smartItemBindings from `${source}:${host}:${nativeId}` to
      // the per-filter `${source}:${host}:${query}:${nativeId}`. An rss instance
      // (no query) leaves the key unchanged. A folderId with no matching node is
      // an orphan — dropped entirely. An ambiguous key (two instances sharing
      // source:host) re-keys from the FIRST matching instance (array order).
      const bindings = state.smartItemBindings;
      if (typeof bindings !== 'object' || bindings === null) return raw;
      const bindingsMap = bindings as Record<string, unknown>;
      for (const [folderId, byItem] of Object.entries(bindingsMap)) {
        const instances = instancesByFolder.get(folderId);
        if (!instances) {
          delete bindingsMap[folderId]; // orphaned binding — no matching node
          continue;
        }
        if (typeof byItem !== 'object' || byItem === null) continue;
        const newByItem: Record<string, unknown> = {};
        for (const [itemId, slots] of Object.entries(byItem as Record<string, unknown>)) {
          const matched = instances.find((inst) => itemId.startsWith(`${inst.oldKey}:`));
          if (matched && matched.query !== undefined) {
            const nativeId = itemId.slice(matched.oldKey.length + 1);
            newByItem[`${matched.oldKey}:${matched.query}:${nativeId}`] = slots;
          } else {
            // rss instance (no query) or unmatched key — leave the key as-is.
            newByItem[itemId] = slots;
          }
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
