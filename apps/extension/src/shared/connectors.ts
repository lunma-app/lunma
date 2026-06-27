import { z } from 'zod';
import { log } from './logger';
import type { SourceAccount, SourceId } from './types';

/**
 * Per-source connector access tokens (connector-accounts, design D4).
 *
 * A single record under `'lunma.connectors'` in `chrome.storage.local`, keyed
 * by **`sourceId`** (the connected Account's id) — re-keyed from the legacy
 * per-host scheme by the v13 change so two accounts on one host (personal + work
 * `github.com`) hold distinct tokens. NEVER `chrome.storage.sync`: tokens must
 * not ride a Google account across machines, which is why they cannot live in
 * the sync-backed settings registry and get this dedicated record instead.
 *
 * Token hygiene: values are never logged, never included in any state
 * broadcast, and never echoed back into the UI (surfaces read only token
 * *presence* for an account). This module is the ONLY accessor.
 *
 * Tokens are stored plaintext — an inherent MV3 constraint. The Web Crypto
 * API can only XOR-encrypt against keys that are themselves in local storage,
 * which provides no real confidentiality. Accepted platform limitation.
 */

const CONNECTORS_KEY = 'lunma.connectors';

/** `{ [sourceId]: token }` — keyed by the connected Account's id. */
export type ConnectorsRecord = { [sourceId: string]: string };

const ConnectorsRecordSchema = z.record(z.string(), z.string());

/**
 * Read the full per-source token record. A missing or malformed record (storage
 * corruption, a stray manual write) resolves to `{}` rather than throwing —
 * the poll path treats "no token" as the cookie-riding rung, so degradation is
 * graceful either way.
 */
export async function readAccountTokens(): Promise<ConnectorsRecord> {
  let raw: unknown;
  try {
    const got = await chrome.storage.local.get(CONNECTORS_KEY);
    raw = got[CONNECTORS_KEY];
  } catch (err) {
    log.error('readAccountTokens failed', { err });
    return {};
  }
  if (raw === undefined || raw === null) return {};
  const parsed = ConnectorsRecordSchema.safeParse(raw);
  if (!parsed.success) {
    // Malformed record: default to empty. Deliberately no token material in
    // the log — only the fact that the record failed validation.
    log.error('lunma.connectors record malformed, treating as empty', {});
    return {};
  }
  return parsed.data;
}

/**
 * Set (or, with `null`, clear) the token for `sourceId`. Writes the whole record
 * back under the single key. Takes effect on the next poll — the connector
 * reads the record per fetch, so no reload is needed.
 */
export async function setAccountToken(sourceId: string, token: string | null): Promise<void> {
  const record = await readAccountTokens();
  if (token === null) {
    delete record[sourceId];
  } else {
    record[sourceId] = token;
  }
  try {
    await chrome.storage.local.set({ [CONNECTORS_KEY]: record });
  } catch (err) {
    // Deliberately no token material in the log — only the id and the error.
    log.error('setAccountToken failed', { err, sourceId });
  }
}

/**
 * One-time boot reconcile (connector-accounts, design D7): move legacy
 * **host**-keyed tokens in the `lunma.connectors` record onto the `sourceId` of
 * the account on that host. The v13 STATE migration extracts accounts and
 * rewrites lens references, but the secrets store lives under a separate,
 * unversioned `chrome.storage.local` key the pure migrate function cannot touch
 * — so this runs in the boot chain after the state is loaded.
 *
 * For each record key:
 *   - already a known `sourceId` (present in `sources`) → leave as-is;
 *   - a legacy host with EXACTLY ONE matching account (the migration mints one
 *     account per host, so this is the norm) → move its token to `[sourceId]`,
 *     remove the host key;
 *   - a host with MULTIPLE matching accounts (only possible for hand-seeded
 *     data) → assign to the FIRST by stable id order, remove the host key;
 *   - a host with NO matching account (an orphan — a token added in Options for a
 *     host no lens references) → LEAVE under its host key untouched (never drop a
 *     token); it binds the next time an account is created on that host.
 *
 * Idempotent (a second run finds only `sourceId` keys + orphans) and logged at
 * `debug` without token material. Returns whether the record changed.
 */
export async function reconcileAccountSecrets(sources: {
  [id: SourceId]: SourceAccount;
}): Promise<boolean> {
  const record = await readAccountTokens();
  const knownIds = new Set(Object.keys(sources));

  // host → account ids on that host, stable id order (so multi-match is
  // deterministic).
  const accountsByHost = new Map<string, SourceId[]>();
  for (const id of [...knownIds].sort()) {
    const account = sources[id];
    if (!account) continue;
    let host: string;
    try {
      host = new URL(account.baseUrl).host;
    } catch {
      continue;
    }
    const list = accountsByHost.get(host) ?? [];
    list.push(id);
    accountsByHost.set(host, list);
  }

  let changed = false;
  let moved = 0;
  for (const key of Object.keys(record)) {
    if (knownIds.has(key)) continue; // already a sourceId — leave as-is
    const matches = accountsByHost.get(key);
    if (!matches || matches.length === 0) continue; // orphan host token — leave it
    const targetId = matches[0] as SourceId;
    const token = record[key];
    if (token === undefined) continue;
    // Only write the target if it isn't already set (idempotence / never clobber
    // a deliberately-set per-source token with a stale host token).
    if (record[targetId] === undefined) record[targetId] = token;
    delete record[key];
    changed = true;
    moved += 1;
  }

  if (changed) {
    try {
      await chrome.storage.local.set({ [CONNECTORS_KEY]: record });
    } catch (err) {
      log.error('reconcileAccountSecrets write failed', { err });
      return false;
    }
    log.debug('reconcileAccountSecrets: re-keyed legacy host tokens', { moved });
  }
  return changed;
}
