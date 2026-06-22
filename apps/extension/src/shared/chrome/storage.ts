import { log } from '../logger';
import { runMigrations } from '../migrations';
import { type AppStateV10, AppStateV10Schema, CURRENT_SCHEMA_VERSION } from '../schemas';
import { createInitialState } from '../store.svelte';
import type { AppState } from '../types';

/** The single `chrome.storage.local` key the persisted app-state envelope lives
 * under. Exported so the options data cards (Backup & restore, Feed
 * subscriptions, Recently archived) read the same key instead of each
 * re-declaring the `'lunma.state'` literal. */
export const STATE_STORAGE_KEY = 'lunma.state';
const QUARANTINE_KEY_PREFIX = '__corrupt_backup_';
const QUARANTINE_MAX_ENTRIES = 10;

// A thrown `chrome.storage.local.get` is commonly a single transient SW/IO blip
// that succeeds on the next call. Retry up to this many times (3 total attempts)
// before declaring the read `unavailable`. The retry is a latency optimisation,
// not the safety mechanism — a sustained failure still falls through to the
// no-overwrite `unavailable` guarantee (design D2).
export const READ_RETRY_ATTEMPTS = 2;

// Loaded state is the persisted shape: the ephemeral `liveTabsById` and
// `smartFolders` slices are stripped before write and never read back from
// disk, so the parsed state may lack them (rebuilt at SW boot / by connector
// polls). Hence `AppStateV10` (optional slices) rather than the full runtime
// `AppState`. `AppStateV10Schema` is the current persisted schema; v1…v5
// envelopes reach it through the pass-through `toVersion: 2` … `toVersion: 6`
// migrations (smart-folders, github-connector, smart-folder-item-bindings,
// jira-connector, rss-connector). The persisted `smartReadState` slice
// (rss-connector) is KEPT by `toPersistable` below, like `smartItemBindings` —
// only the ephemeral `liveTabsById` / `smartFolders` are stripped.
export type PersistedRead =
  | { kind: 'ok'; state: AppStateV10 }
  | { kind: 'empty' }
  | { kind: 'corrupt' }
  // The read itself failed (every `get` attempt threw). Distinct from `empty`
  // (a genuinely-absent key): an `unavailable` read MUST NOT overwrite the
  // on-disk state with a fresh Default — there may be real data we couldn't read.
  | { kind: 'unavailable' }
  // Whole-state validation failed but per-slice salvage recovered a valid
  // `AppStateV10` (every individually-valid Space preserved). The raw payload was
  // still quarantined; this state is written back to self-heal.
  | { kind: 'salvaged'; state: AppStateV10 };

/**
 * The exact persisted projection `persist` writes: the runtime `state` minus the
 * ephemeral `liveTabsById` (sidebar-temp-tabs) and `smartFolders`
 * (smart-folders) slices, stripped before write so the on-disk shape never
 * carries volatile tab metadata or work-sensitive connector results — both are
 * rebuilt after SW boot (`chrome.tabs.query` / connector polls). The SINGLE
 * owner of the strip: `persist` builds its payload from this, and the
 * coordinator serializes it to decide whether a drain actually changed the
 * persisted projection — so an ephemeral-only drain can skip the redundant
 * `chrome.storage.local.set` (chrome-event-coordination: persist skipped on an
 * ephemeral-only drain).
 */
export function toPersistable(state: AppState): Omit<AppState, 'liveTabsById' | 'smartFolders'> {
  const { liveTabsById: _liveTabsById, smartFolders: _smartFolders, ...persistable } = state;
  return persistable;
}

export async function persist(state: AppState): Promise<void> {
  try {
    await chrome.storage.local.set({
      [STATE_STORAGE_KEY]: { schemaVersion: CURRENT_SCHEMA_VERSION, state: toPersistable(state) },
    });
  } catch (err) {
    log.error('persist failed', { err });
  }
}

/**
 * Remove duplicate ids from the persisted state so the sidebar's keyed `{#each}`
 * renders can never collide (a duplicate id throws Svelte `each_key_duplicate`,
 * crashing the whole sidebar). Enforced per keyed collection:
 *
 *   - `spaces` — unique by Space id;
 *   - `pinnedBySpace[spaceId]` — each id unique across the whole tree (top-level
 *     tab/folder nodes AND folder `children` share one seen-set per Space);
 *   - each Space instance's `tempTabIds` — unique by tab id.
 *
 * Pure: the input is untouched; returns a new state only when something changed
 * (so the caller can decide whether to write the healed state back). First
 * occurrence wins and ordering is preserved; valid non-duplicate ids are never
 * dropped — this de-duplicates, it does not validate against `savedTabs`.
 */
export function dedupePersistedState(state: AppStateV10): { state: AppStateV10; changed: boolean } {
  let changed = false;

  const seenSpace = new Set<string>();
  const spaces = state.spaces.filter((s) => {
    if (seenSpace.has(s.id)) {
      changed = true;
      return false;
    }
    seenSpace.add(s.id);
    return true;
  });

  const pinnedBySpace: AppStateV10['pinnedBySpace'] = {};
  for (const [spaceId, nodes] of Object.entries(state.pinnedBySpace)) {
    const seen = new Set<string>();
    const out: typeof nodes = [];
    for (const node of nodes) {
      if (seen.has(node.id)) {
        changed = true;
        continue;
      }
      seen.add(node.id);
      if (node.kind !== 'folder') {
        // Tab and smart nodes carry no `children` — nothing further to dedupe.
        out.push(node);
      } else {
        const children: string[] = [];
        for (const childId of node.children) {
          if (seen.has(childId)) {
            changed = true;
            continue;
          }
          seen.add(childId);
          children.push(childId);
        }
        out.push(children.length === node.children.length ? node : { ...node, children });
      }
    }
    pinnedBySpace[spaceId] = out;
  }

  const spaceInstancesByWindow: AppStateV10['spaceInstancesByWindow'] = {};
  for (const key of Object.keys(state.spaceInstancesByWindow)) {
    const wid = Number(key);
    const bySpace = state.spaceInstancesByWindow[wid];
    if (!bySpace) {
      // No instance map for this window — equivalent to an absent key. Loaded
      // state never carries an explicit `undefined` (it drops on serialize), so
      // skip it rather than writing an explicit-undefined property back.
      continue;
    }
    const nextBySpace: NonNullable<AppStateV10['spaceInstancesByWindow'][number]> = {};
    for (const [spaceId, instance] of Object.entries(bySpace)) {
      const seen = new Set<number>();
      const tempTabIds: number[] = [];
      for (const tabId of instance.tempTabIds) {
        if (seen.has(tabId)) {
          changed = true;
          continue;
        }
        seen.add(tabId);
        tempTabIds.push(tabId);
      }
      nextBySpace[spaceId] =
        tempTabIds.length === instance.tempTabIds.length ? instance : { ...instance, tempTabIds };
    }
    spaceInstancesByWindow[wid] = nextBySpace;
  }

  if (!changed) return { state, changed };
  return { state: { ...state, spaces, pinnedBySpace, spaceInstancesByWindow }, changed };
}

/**
 * Recover a valid `AppStateV10` from a payload that failed whole-state validation,
 * preserving as much real data as possible instead of discarding all of it
 * (design D4). Pure — no Chrome, no I/O.
 *
 *   - Non-object input → `null` (nothing to salvage).
 *   - `spaces` is salvaged **element-wise**: every individually-valid Space is
 *     kept (order preserved), only malformed elements are dropped — one bad Space
 *     never costs the others. This is the guaranteed win (Space identity).
 *   - Every other top-level slice is salvaged **slice-wise**: kept when it
 *     validates against its own schema, otherwise reset to the empty default.
 *   - The assembled object is re-validated against `AppStateV10Schema`; on success
 *     it is returned, otherwise `null`.
 *
 * Dangling references that result from a dropped Space/slice (e.g. a
 * `pinnedBySpace` entry pointing at a reset `savedTabs`) are tolerated by the
 * load-path dedupe and the sidebar projections (unbound ids drop at render).
 */
export function salvagePersistedState(migrated: unknown): AppStateV10 | null {
  if (typeof migrated !== 'object' || migrated === null || Array.isArray(migrated)) {
    return null;
  }
  const input = migrated as Record<string, unknown>;
  const shape = AppStateV10Schema.shape;

  // Empty, current-version base — every slice starts at its valid default.
  const assembled: Record<string, unknown> = { ...createInitialState() };

  // `spaces` element-wise: keep each Space that individually validates.
  const spaceSchema = shape.spaces.element;
  assembled.spaces = Array.isArray(input.spaces)
    ? input.spaces.flatMap((element) => {
        const parsed = spaceSchema.safeParse(element);
        return parsed.success ? [parsed.data] : [];
      })
    : [];

  // Every other persisted slice, slice-wise: keep the input's value when it
  // validates against that slice's own schema, else keep the empty default.
  const sliceFields = [
    'schemaVersion',
    'activeSpaceByWindow',
    'spaceInstancesByWindow',
    'tabBindings',
    'savedTabs',
    'lastActivatedSpaceId',
    'tabLastActivity',
    'archivedTabs',
    'trash',
    'pinnedBySpace',
    'faviconRow',
    'smartItemBindings',
    'smartReadState',
  ] as const;
  for (const field of sliceFields) {
    const parsed = shape[field].safeParse(input[field]);
    if (parsed.success) assembled[field] = parsed.data;
  }

  const result = AppStateV10Schema.safeParse(assembled);
  return result.success ? result.data : null;
}

/** Write the current-version envelope back to disk (self-heal). Best-effort: a
 * write failure is logged but never throws into the load path. */
async function writeBackEnvelope(state: AppStateV10): Promise<void> {
  try {
    await chrome.storage.local.set({
      [STATE_STORAGE_KEY]: { schemaVersion: CURRENT_SCHEMA_VERSION, state: toPersistable(state) },
    });
  } catch (err) {
    log.error('write-back of loaded envelope failed', { err });
  }
}

export async function readPersistedState(): Promise<PersistedRead> {
  let raw: unknown;
  let succeeded = false;
  let lastErr: unknown;
  // Bounded immediate retry (design D2): a one-off `get` rejection commonly
  // succeeds on the next call. Only when EVERY attempt throws do we report
  // `unavailable` — never `empty` (which the boot would mistake for a first
  // install and overwrite real data). No payload exists here, so never quarantine.
  for (let attempt = 0; attempt <= READ_RETRY_ATTEMPTS; attempt++) {
    try {
      const got = await chrome.storage.local.get(STATE_STORAGE_KEY);
      raw = got[STATE_STORAGE_KEY];
      succeeded = true;
      break;
    } catch (err) {
      lastErr = err;
    }
  }
  if (!succeeded) {
    log.error('readPersistedState failed', { err: lastErr });
    return { kind: 'unavailable' };
  }

  if (raw === undefined || raw === null) {
    return { kind: 'empty' };
  }

  const envelope = raw as { schemaVersion?: unknown; state?: unknown };
  const persistedVersion =
    typeof envelope.schemaVersion === 'number' ? envelope.schemaVersion : Number.NaN;
  const persistedState = envelope.state;

  if (!Number.isFinite(persistedVersion)) {
    await quarantine(raw, { reason: 'invalid envelope.schemaVersion' });
    return { kind: 'corrupt' };
  }

  let migrated: unknown;
  try {
    migrated = runMigrations(persistedState, persistedVersion);
  } catch (err) {
    await quarantine(raw, {
      reason: 'migration threw',
      error: (err as Error).message,
    });
    return { kind: 'corrupt' };
  }

  const parsed = AppStateV10Schema.safeParse(migrated);
  if (!parsed.success) {
    // Per-slice salvage BEFORE the corrupt fallback (D4): recover every valid
    // Space (and any valid slice) instead of discarding the whole payload. The
    // raw payload is STILL quarantined for diagnosis in either outcome.
    const salvaged = salvagePersistedState(migrated);
    await quarantine(raw, {
      reason: 'schema parse failed',
      zodIssues: parsed.error.issues,
    });
    if (salvaged === null) {
      return { kind: 'corrupt' };
    }
    // Self-heal: dedupe and write the salvaged (clean) envelope back over the
    // corrupt one, mirroring the ok-with-changes write-back. A salvage is by
    // definition a change (whole-state validation failed), so always write back.
    const deduped = dedupePersistedState(salvaged);
    await writeBackEnvelope(deduped.state);
    return { kind: 'salvaged', state: deduped.state };
  }

  // De-duplicate ids on the read path so a corrupted/legacy duplicate never
  // reaches the sidebar's keyed `{#each}` (which would throw each_key_duplicate).
  const deduped = dedupePersistedState(parsed.data);

  // Write the envelope back when we migrated up a version OR de-dup healed a
  // duplicate, so the crash-inducing data is removed from disk on the first load
  // that sees it (self-healing) rather than only after the next mutation.
  if (persistedVersion < CURRENT_SCHEMA_VERSION || deduped.changed) {
    await writeBackEnvelope(deduped.state);
  }

  return { kind: 'ok', state: deduped.state };
}

export interface QuarantineMeta {
  reason: string;
  error?: string;
  zodIssues?: unknown;
}

export interface QuarantineRecord {
  capturedAt: number;
  reason: string;
  error?: string;
  zodIssues?: unknown;
  rawBytes: unknown;
}

async function quarantine(raw: unknown, meta: QuarantineMeta): Promise<void> {
  const capturedAt = Date.now();
  const key = `${QUARANTINE_KEY_PREFIX}${new Date(capturedAt).toISOString()}`;
  const record: QuarantineRecord = {
    capturedAt,
    reason: meta.reason,
    ...(meta.error !== undefined ? { error: meta.error } : {}),
    ...(meta.zodIssues !== undefined ? { zodIssues: meta.zodIssues } : {}),
    rawBytes: raw,
  };

  try {
    await pruneQuarantineBackups(QUARANTINE_MAX_ENTRIES - 1);
  } catch (err) {
    log.error('quarantine prune failed', { err, code: 'STORAGE_CORRUPT' });
  }

  try {
    await chrome.storage.local.set({ [key]: record });
  } catch (err) {
    log.error('quarantine write failed', { err, code: 'STORAGE_CORRUPT' });
  }
  log.error('STORAGE_CORRUPT', {
    code: 'STORAGE_CORRUPT',
    reason: meta.reason,
    backupKey: key,
  });
}

async function pruneQuarantineBackups(keepCount: number): Promise<void> {
  const all = (await chrome.storage.local.get(null)) as Record<string, unknown>;
  const backupKeys = Object.keys(all)
    .filter((k) => k.startsWith(QUARANTINE_KEY_PREFIX))
    .sort();
  const toRemove = backupKeys.slice(0, Math.max(0, backupKeys.length - keepCount));
  if (toRemove.length === 0) return;
  await chrome.storage.local.remove(toRemove);
}
