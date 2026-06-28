import { CURRENT_SCHEMA_VERSION, PinNodeSchema } from './schemas';

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
  {
    // v10 (smart-source-rename): additive — `SmartSourceConfig` gains an OPTIONAL
    // `name`. Pre-v10 nodes simply lack it and remain valid, so there is nothing
    // to transform; identity pass-through, present only to advance the version.
    toVersion: 10,
    migrate: (raw: unknown): unknown => raw,
  },
  {
    // v11 (establish-lens-model): (a) for every PinNode with `kind === 'smart'`,
    // set `kind = 'lens'` and stamp `lensKind = 'general'`; (b) rename top-level
    // persisted keys `smartItemBindings`→`lensItemBindings` and
    // `smartReadState`→`lensReadState`. Provider/query values + `queries[]` are
    // untouched. The ephemeral `smartFolders` slice is stripped before persist so
    // it needs only the code rename — no data transform here.
    toVersion: 11,
    migrate: (raw: unknown): unknown => {
      if (typeof raw !== 'object' || raw === null) return raw;
      const state = raw as Record<string, unknown>;

      // Step 1: rename smart→lens in every PinNode across every Space.
      const pinnedBySpace = state.pinnedBySpace;
      if (typeof pinnedBySpace === 'object' && pinnedBySpace !== null) {
        for (const nodes of Object.values(pinnedBySpace as Record<string, unknown>)) {
          if (!Array.isArray(nodes)) continue;
          for (const node of nodes) {
            if (typeof node !== 'object' || node === null) continue;
            const n = node as Record<string, unknown>;
            if (n.kind === 'smart') {
              n.kind = 'lens';
              n.lensKind = 'general';
            }
          }
        }
      }

      // Step 2: rename persisted top-level keys.
      if ('smartItemBindings' in state) {
        state.lensItemBindings = state.smartItemBindings;
        delete state.smartItemBindings;
      }
      if ('smartReadState' in state) {
        state.lensReadState = state.smartReadState;
        delete state.smartReadState;
      }

      return raw;
    },
  },
  {
    // v12 (review-lens): additive — the persisted lens node's `lensKind` enum
    // widens from `'general'` to `'general' | 'review'`. Every existing node
    // already carries `lensKind: 'general'`, valid under the widened enum, so
    // there is nothing to transform; identity pass-through, present only to
    // advance the version (so a downgrade past v12 is detectable).
    toVersion: 12,
    migrate: (raw: unknown): unknown => raw,
  },
  {
    // v13 (decouple-source-accounts): extract each lens node's EMBEDDED
    // `sources: LensSource[]` (`{ source, baseUrl, queries, name? }`) into
    // first-class `SourceAccount` records under a new top-level `sources` map,
    // and rewrite each lens's `sources` entries to `LensSourceRef`
    // (`{ sourceId, queries }`). One account is minted per DISTINCT
    // `(provider, baseUrl)` pair across ALL lenses (de-duplicated by that
    // composite key, so two lenses on the same host share one account); a
    // source's `name` migrates onto its account (first occurrence wins). The
    // separate, unversioned `lunma.connectors` secrets store is re-keyed
    // host→sourceId by the boot-chain `reconcileAccountSecrets` step, NOT here
    // (a pure migrate fn cannot touch a different storage key).
    toVersion: 13,
    migrate: (raw: unknown): unknown => {
      if (typeof raw !== 'object' || raw === null) return raw;
      const state = raw as Record<string, unknown>;

      // Seed the new top-level accounts map (idempotent: keep an existing one).
      const sources =
        typeof state.sources === 'object' && state.sources !== null
          ? (state.sources as Record<string, unknown>)
          : {};
      state.sources = sources;

      const pinnedBySpace = state.pinnedBySpace;
      if (typeof pinnedBySpace !== 'object' || pinnedBySpace === null) return raw;

      // Dedupe minted accounts by the composite `${provider}:${baseUrl}` key.
      const accountIdByKey = new Map<string, string>();

      // Iterate Spaces, then nodes, then sources in order so minting is
      // deterministic (a Space/node/source order-stable id assignment).
      for (const nodes of Object.values(pinnedBySpace as Record<string, unknown>)) {
        if (!Array.isArray(nodes)) continue;
        for (const node of nodes) {
          if (typeof node !== 'object' || node === null) continue;
          const n = node as Record<string, unknown>;
          if (n.kind !== 'lens') continue;
          const entries = n.sources;
          if (!Array.isArray(entries)) continue;
          const refs: Array<{ sourceId: string; queries: unknown }> = [];
          for (const entry of entries) {
            if (typeof entry !== 'object' || entry === null) continue;
            const e = entry as Record<string, unknown>;
            // Idempotent: an entry already in the v13 ref shape is left as-is.
            if (typeof e.sourceId === 'string') {
              refs.push({
                sourceId: e.sourceId,
                queries: Array.isArray(e.queries) ? e.queries : [],
              });
              continue;
            }
            const provider = e.source;
            const baseUrl = e.baseUrl;
            const queries = Array.isArray(e.queries) ? e.queries : [];
            if (typeof provider !== 'string' || typeof baseUrl !== 'string') continue;
            const key = `${provider}:${baseUrl}`;
            let sourceId = accountIdByKey.get(key);
            if (sourceId === undefined) {
              sourceId = crypto.randomUUID();
              accountIdByKey.set(key, sourceId);
              const account: Record<string, unknown> = { id: sourceId, provider, baseUrl };
              if (typeof e.name === 'string') account.name = e.name;
              sources[sourceId] = account;
            }
            refs.push({ sourceId, queries });
          }
          n.sources = refs;
        }
      }

      return raw;
    },
  },
  {
    // v14 (lens-view-filters): additive — the lens `PinNode` gains an OPTIONAL
    // `filter?: LensFilter`. Pre-v14 nodes simply lack it and remain valid, so
    // there is nothing to transform; identity pass-through, present only to
    // advance the version (so a downgrade past v14 is detectable).
    toVersion: 14,
    migrate: (raw: unknown): unknown => raw,
  },
  {
    // v15 (rekey-lens-sections-by-source-id): a REAL transformation — re-key
    // lens sections by account `sourceId` instead of host. Rewrite both
    // persisted `sourceKey`-embedding slices: every `lensItemBindings[folderId]`
    // KEY and every `lensReadState[folderId][]` ID, from the legacy
    // `${source}:${host}:${query}:${nativeId}` form (rss:
    // `${source}:${host}:${nativeId}`) to `${sourceId}:${query}:${nativeId}`
    // (rss: `${sourceId}:${nativeId}`). Resolution is match-first by LONGEST
    // prefix (a host carries ports and rss nativeIds are URLs, so a blind
    // `split(':')` cannot recover the boundary); see `rewriteNamespacedId`.
    // Synchronous, pure, idempotent.
    toVersion: 15,
    migrate: (raw: unknown): unknown => {
      if (typeof raw !== 'object' || raw === null) return raw;
      const state = raw as Record<string, unknown>;
      const sources = state.sources;
      if (typeof sources !== 'object' || sources === null) return raw;
      const sourceRecord = sources as Record<string, unknown>;

      // Each account's legacy section prefix `${provider}:${host}:` (port-bearing
      // host, mirroring the pre-v15 `sourceKey`). A malformed `baseUrl` degrades
      // to the raw string exactly as the old key derivation did.
      const accounts: Array<{ id: string; prefix: string }> = [];
      for (const acc of Object.values(sourceRecord)) {
        if (typeof acc !== 'object' || acc === null) continue;
        const a = acc as Record<string, unknown>;
        if (
          typeof a.id !== 'string' ||
          typeof a.provider !== 'string' ||
          typeof a.baseUrl !== 'string'
        )
          continue;
        accounts.push({ id: a.id, prefix: `${a.provider}:${hostFromBaseUrl(a.baseUrl)}:` });
      }
      const sourceIds = new Set(Object.keys(sourceRecord));

      // (a) lensItemBindings — rewrite KEYS, dropping unmappable/ambiguous slots.
      const bindings = state.lensItemBindings;
      if (typeof bindings === 'object' && bindings !== null) {
        const byFolder = bindings as Record<string, unknown>;
        for (const [folderId, byId] of Object.entries(byFolder)) {
          if (typeof byId !== 'object' || byId === null) continue;
          const rewritten: Record<string, unknown> = {};
          for (const [namespacedId, slot] of Object.entries(byId as Record<string, unknown>)) {
            const next = rewriteNamespacedId(namespacedId, accounts, sourceIds);
            if (next !== null) rewritten[next] = slot;
          }
          byFolder[folderId] = rewritten;
        }
      }

      // (b) lensReadState — rewrite ID strings, dropping unmappable/ambiguous ids.
      const readState = state.lensReadState;
      if (typeof readState === 'object' && readState !== null) {
        const byFolder = readState as Record<string, unknown>;
        for (const [folderId, ids] of Object.entries(byFolder)) {
          if (!Array.isArray(ids)) continue;
          const rewritten: string[] = [];
          for (const id of ids) {
            if (typeof id !== 'string') continue;
            const next = rewriteNamespacedId(id, accounts, sourceIds);
            if (next !== null) rewritten.push(next);
          }
          byFolder[folderId] = rewritten;
        }
      }

      return raw;
    },
  },
];

/** Port-bearing host for an account `baseUrl`, degrading a malformed url to the
 * raw string (the pre-v15 `sourceKey` did the same). */
function hostFromBaseUrl(baseUrl: string): string {
  try {
    return new URL(baseUrl).host;
  } catch {
    return baseUrl;
  }
}

/**
 * Rewrite a legacy namespaced id (`${source}:${host}:${query}:${nativeId}`, rss
 * `${source}:${host}:${nativeId}`) onto the v15 `${sourceId}:…` form by
 * **match-first, longest-prefix** resolution against the known account prefixes.
 * Returns `null` to DROP the id when no account matches (deleted account) or two
 * accounts share an identical `${provider}:${host}:` prefix (the genuinely
 * same-origin collision this migration exists to disambiguate — the legacy id
 * cannot say which account it belonged to). Idempotent: an id whose first
 * segment is already an account id is returned unchanged.
 */
function rewriteNamespacedId(
  id: string,
  accounts: Array<{ id: string; prefix: string }>,
  sourceIds: Set<string>,
): string | null {
  // Idempotent: a v15 id's first segment is a minted account id (UUID); a legacy
  // id's first segment is a provider enum, which never collides with an id.
  const firstColon = id.indexOf(':');
  const firstSegment = firstColon === -1 ? id : id.slice(0, firstColon);
  if (sourceIds.has(firstSegment)) return id;

  let best: { id: string; prefix: string } | null = null;
  let tieAtBest = false;
  for (const acc of accounts) {
    if (!id.startsWith(acc.prefix)) continue;
    if (best === null || acc.prefix.length > best.prefix.length) {
      best = acc;
      tieAtBest = false;
    } else if (acc.prefix.length === best.prefix.length) {
      tieAtBest = true;
    }
  }
  if (best === null || tieAtBest) return null;
  return `${best.id}:${id.slice(best.prefix.length)}`;
}

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

/**
 * Terminal normalization (harden-migration-salvage): drop any `pinnedBySpace`
 * node that fails the current-version `PinNodeSchema`. An earlier migration can
 * leave a structurally-invalid node — most notably a `kind: 'lens'` whose
 * `sources` ends up empty (v13 dropping every malformed embedded entry) or
 * absent (a pre-v8 flat smart node migrated without a `baseUrl`). Such a node
 * would fail whole-state validation and trigger the coarse salvage fallback that
 * resets the ENTIRE pinned tree. A lens with no resolvable source is already
 * dead, so dropping that one node is strictly safer than poisoning the rest.
 *
 * Decides drop-or-keep via `safeParse` but KEEPS the original node object (never
 * the parsed/defaulted one) so the subsequent whole-state parse stays the single
 * place `.default()`s are materialized. Order is preserved; a Space whose every
 * node is dropped becomes `[]` (the key is kept); a non-array Space value is left
 * untouched for the downstream parse/salvage to handle.
 */
function normalizePinnedNodes(raw: unknown): unknown {
  if (typeof raw !== 'object' || raw === null) return raw;
  const state = raw as Record<string, unknown>;
  const pinnedBySpace = state.pinnedBySpace;
  if (typeof pinnedBySpace !== 'object' || pinnedBySpace === null) return raw;
  for (const [spaceId, nodes] of Object.entries(pinnedBySpace as Record<string, unknown>)) {
    if (!Array.isArray(nodes)) continue;
    (pinnedBySpace as Record<string, unknown>)[spaceId] = nodes.filter(
      (node) => PinNodeSchema.safeParse(node).success,
    );
  }
  return raw;
}

export function runMigrations(raw: unknown, persistedVersion: number): unknown {
  let current = raw;
  for (const migration of migrations) {
    if (migration.toVersion > persistedVersion) {
      current = migration.migrate(current);
    }
  }
  // Runs unconditionally — also when persistedVersion === CURRENT_SCHEMA_VERSION —
  // so a node corrupted by a prior buggy write is still normalized on read.
  return normalizePinnedNodes(current);
}
