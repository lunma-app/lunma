import { z } from 'zod';
import { log } from './logger';

/**
 * Per-host connector access tokens (smart-folders, design D5/D10).
 *
 * A single record under `'lunma.connectors'` in `chrome.storage.local`, keyed
 * by instance host (`new URL(baseUrl).host` — hostname plus any explicit
 * port). NEVER `chrome.storage.sync`: tokens must not ride a Google account
 * across machines, which is why they cannot live in the sync-backed settings
 * registry and get this dedicated record instead.
 *
 * Token hygiene: values are never logged, never included in any state
 * broadcast, and never echoed back into the options UI (the Connectors card
 * shows a token-set indicator instead). This module is the ONLY accessor.
 *
 * Tokens are stored plaintext — an inherent MV3 constraint. The Web Crypto
 * API can only XOR-encrypt against keys that are themselves in local storage,
 * which provides no real confidentiality. Accepted platform limitation.
 */

const CONNECTORS_KEY = 'lunma.connectors';

/** `{ [host]: token }` — flat by design; per-connector metadata can widen this
 * record when a second connector source ships. */
export type ConnectorsRecord = { [host: string]: string };

const ConnectorsRecordSchema = z.record(z.string(), z.string());

/**
 * Read the full per-host token record. A missing or malformed record (storage
 * corruption, a stray manual write) resolves to `{}` rather than throwing —
 * the poll path treats "no token" as the cookie-riding rung, so degradation is
 * graceful either way.
 */
export async function readConnectors(): Promise<ConnectorsRecord> {
  let raw: unknown;
  try {
    const got = await chrome.storage.local.get(CONNECTORS_KEY);
    raw = got[CONNECTORS_KEY];
  } catch (err) {
    log.error('readConnectors failed', { err });
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
 * Set (or, with `null`, clear) the token for `host`. Writes the whole record
 * back under the single key. Takes effect on the next poll — the connector
 * reads the record per fetch, so no reload is needed.
 */
export async function setConnectorToken(host: string, token: string | null): Promise<void> {
  const record = await readConnectors();
  if (token === null) {
    delete record[host];
  } else {
    record[host] = token;
  }
  try {
    await chrome.storage.local.set({ [CONNECTORS_KEY]: record });
  } catch (err) {
    log.error('setConnectorToken failed', { err, host });
  }
}
