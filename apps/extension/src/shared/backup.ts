import { dedupePersistedState } from './chrome/storage';
import { runMigrations } from './migrations';
import { AppStateV10Schema, BackupEnvelopeSchema, CURRENT_SCHEMA_VERSION } from './schemas';
import type { Settings } from './settings';
import { createInitialState } from './store.svelte';
import type { AppState, BackupEnvelope, PortableAppState } from './types';

/**
 * Serialize a store snapshot into a `BackupEnvelope`, dropping all machine-bound
 * and secret data. The caller must pass a plain (non-reactive) snapshot — use
 * `store.snapshot()` or read directly from `chrome.storage.local`. Connector
 * tokens are excluded: they live in a separate `chrome.storage.local` key and
 * are never in `AppState`. `settings` is included only when the caller passes it
 * (the user's opt-in toggle in the UI).
 */
export function buildBackup(state: AppState, settings?: Settings): BackupEnvelope {
  const portable: PortableAppState = {
    schemaVersion: state.schemaVersion,
    spaces: state.spaces,
    savedTabs: state.savedTabs,
    pinnedBySpace: state.pinnedBySpace,
    faviconRow: state.faviconRow,
    archivedTabs: state.archivedTabs,
    trash: state.trash,
    lastActivatedSpaceId: state.lastActivatedSpaceId,
  };
  const envelope: BackupEnvelope = {
    formatVersion: 1,
    schemaVersion: state.schemaVersion,
    exportedAt: Date.now(),
    state: portable,
  };
  if (settings !== undefined) envelope.settings = settings;
  return envelope;
}

export type ParseBackupResult =
  | { ok: true; state: AppState; settings?: Settings | undefined }
  | { ok: false; error: string };

/**
 * Validate + migrate a raw backup payload (parsed from JSON) and return the
 * resulting `AppState`. The pipeline mirrors the storage load-path exactly:
 * `BackupEnvelopeSchema` → `runMigrations` → re-seed window-bound maps to empty
 * defaults → `AppStateV10Schema` → `dedupePersistedState`. Returns `{ ok: false }`
 * on any validation failure with no mutation. On success the caller must call
 * `store.replaceState(result.state)` and `ctx.markDirty()`.
 */
export function parseBackup(raw: unknown): ParseBackupResult {
  const envelopeParsed = BackupEnvelopeSchema.safeParse(raw);
  if (!envelopeParsed.success) {
    return { ok: false, error: envelopeParsed.error.message };
  }
  const envelope = envelopeParsed.data;

  // Run migrations so an older-schemaVersion backup reaches the current schema.
  const migrated = runMigrations(envelope.state, envelope.schemaVersion);

  // Re-seed all window-bound maps to empty defaults so the imported data adopts
  // the new machine's live tabs on next boot. The AppStateV10Schema `.default({})`
  // on `smartItemBindings` handles that field; the ephemeral slices are optional
  // in the schema and filled after parse.
  const initial = createInitialState();
  const toValidate = {
    ...(migrated as object),
    // Bump to current version after migration so re-persisting doesn't re-migrate.
    schemaVersion: CURRENT_SCHEMA_VERSION,
    // Machine-bound: empty on import
    tabBindings: initial.tabBindings,
    spaceInstancesByWindow: initial.spaceInstancesByWindow,
    activeSpaceByWindow: initial.activeSpaceByWindow,
    tabLastActivity: initial.tabLastActivity,
  };

  const stateParsed = AppStateV10Schema.safeParse(toValidate);
  if (!stateParsed.success) {
    return { ok: false, error: stateParsed.error.message };
  }

  const { state: deduped } = dedupePersistedState(stateParsed.data);

  const fullState: AppState = {
    ...deduped,
    // Always empty on import: these slices are machine/session-bound and were not
    // exported; they re-seed via boot reconciliation on the new machine.
    liveTabsById: {},
    smartFolders: {},
  };

  const result: ParseBackupResult = { ok: true, state: fullState };
  if (envelope.settings !== undefined) result.settings = envelope.settings;
  return result;
}
