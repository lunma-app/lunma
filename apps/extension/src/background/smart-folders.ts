import { log } from '../shared/logger';
import type { LunmaStore } from '../shared/store.svelte';
import type { AppState, FolderId, PinNode, SmartFolderRuntime, SmartSource } from '../shared/types';
import type { ConnectorCaches, SourceConnector } from './connectors/connector';
import { githubConnector } from './connectors/github';
import { gitlabConnector } from './connectors/gitlab';

/**
 * Smart-folders engine (smart-folders; connector extraction by
 * github-connector design D1/D2). Everything source-AGNOSTIC lives here:
 *
 *   - scheduling: one repeating alarm (`lunma/smart-folders-poll`) at the
 *     minimum configured cadence with per-folder due-clocks, plus the parallel
 *     `'lunma/state-request'` refresh-kick listener;
 *   - single-writer discipline: fetches run OFF the coordinator drain and
 *     enqueue `{ source: 'connector', kind: 'smartFolders.result' }` events;
 *     only the drain's handler writes the runtime slice;
 *   - dispatch: fetches go through the closed `CONNECTORS` registry keyed by
 *     the node's `source` discriminant — exactly the two shipped connectors
 *     (`background/connectors/`), no plug-in mechanism.
 */

export const SMART_FOLDERS_ALARM_NAME = 'lunma/smart-folders-poll';

/** Cadence floor in minutes (rate-limit kindness); the SW clamps lower values
 * on create/update. Default is 10 (the editor's initial selection). */
export const REFRESH_MINUTES_FLOOR = 5;
export const REFRESH_MINUTES_DEFAULT = 10;

export type SmartFolderNode = Extract<PinNode, { kind: 'smart' }>;

/**
 * The closed connector registry (github-connector design D1): exactly the
 * shipped sources, no speculative members. Exported for tests.
 */
export const CONNECTORS: Record<SmartSource, SourceConnector> = {
  gitlab: gitlabConnector,
  github: githubConnector,
};

/**
 * The connector-result event this engine enqueues. Declared LOCALLY (mirroring
 * `auto-archive.ts`'s `SweepEnqueuer`) so this module never imports from
 * `handlers/` — engine modules sit below the handler slices in the layer rule,
 * and `handlers/context.ts`'s `PendingEvent` member is the matching shape. The
 * coordinator's wider `enqueue(PendingEvent)` is assignable to this.
 */
export interface SmartFoldersResultEvent {
  source: 'connector';
  kind: 'smartFolders.result';
  payload: { folderId: FolderId; runtime: SmartFolderRuntime };
}

/** The connector's two seams: read the store (never mutate — single-writer)
 * and enqueue result events onto the coordinator queue. */
export interface SmartFolderDeps {
  store: LunmaStore;
  enqueue: (event: SmartFoldersResultEvent) => void;
}

// ── baseUrl handling ───────────────────────────────────────────────────────────

/**
 * Normalize + validate a smart folder's instance base URL: must parse as an
 * absolute http(s) URL; the trailing slash is stripped so every endpoint can
 * string-append (subpath instances work unchanged). Throws on anything else —
 * the create/update handlers let the throw reach the error ack.
 */
export function normalizeBaseUrl(raw: string): string {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error(`invalid base URL '${raw}': not an absolute URL`);
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error(`invalid base URL '${raw}': must be http(s)`);
  }
  return raw.endsWith('/') ? raw.slice(0, -1) : raw;
}

// ── registry dispatch ──────────────────────────────────────────────────────────

/**
 * Fetch one smart folder's results through its source's connector. Never
 * throws — every failure shape resolves to a runtime state (the connectors'
 * contract). The node Pick includes `source` because dispatch needs the
 * discriminant; `caches` is the per-poll-cycle scratch map (absent on a
 * manual/single refresh — the connector defaults its own).
 */
export async function fetchSmartFolderRuntime(
  node: Pick<SmartFolderNode, 'source' | 'baseUrl' | 'query'>,
  caches?: ConnectorCaches,
): Promise<SmartFolderRuntime> {
  return CONNECTORS[node.source].fetchRuntime(node, caches);
}

// ── scheduling ─────────────────────────────────────────────────────────────────

/** Every smart node across every Space. */
export function collectSmartFolders(state: AppState): SmartFolderNode[] {
  const out: SmartFolderNode[] = [];
  for (const nodes of Object.values(state.pinnedBySpace)) {
    for (const node of nodes) {
      if (node.kind === 'smart') out.push(node);
    }
  }
  return out;
}

/**
 * Retune the single repeating poll alarm to the minimum `refreshMinutes`
 * across all smart folders; clear it when none exist (zero idle cost for
 * non-users). Called on folder create/update/delete and once post-boot.
 * `chrome.alarms.create` replaces a same-named schedule, so re-registering is
 * safe and idempotent.
 */
export async function syncSmartFoldersAlarm(store: LunmaStore): Promise<void> {
  const folders = collectSmartFolders(store.state);
  if (folders.length === 0) {
    await chrome.alarms.clear(SMART_FOLDERS_ALARM_NAME);
    return;
  }
  const period = Math.max(REFRESH_MINUTES_FLOOR, Math.min(...folders.map((f) => f.refreshMinutes)));
  chrome.alarms.create(SMART_FOLDERS_ALARM_NAME, { periodInMinutes: period });
}

/** Folder ids with a fetch currently in flight — the duplicate-fire guard
 * shared by the alarm tick, the state-request kick, and manual refresh. */
const inflight = new Set<FolderId>();

/** Test-only: reset the in-flight guard between cases. */
export function resetSmartFoldersInflight(): void {
  inflight.clear();
}

/**
 * Begin one folder's refresh: enqueue the `pending` mark (the drain's
 * mutator preserves last-known items, so the list never blinks), then run the
 * fetch OFF the drain and enqueue the result event on completion. Returns the
 * fetch's completion promise so the coordinator handler can track it via
 * `ctx.runSideEffect` (test determinism) — callers never need to await it.
 * A folder already in flight is not re-fired. `caches` threads the poll
 * cycle's `ConnectorCaches` (see {@link refreshDueSmartFolders}).
 */
export function startSmartFolderRefresh(
  deps: SmartFolderDeps,
  node: SmartFolderNode,
  caches?: ConnectorCaches,
): { started: boolean; completion: Promise<void> } {
  if (inflight.has(node.id)) {
    return { started: false, completion: Promise.resolve() };
  }
  inflight.add(node.id);
  deps.enqueue({
    source: 'connector',
    kind: 'smartFolders.result',
    payload: {
      folderId: node.id,
      runtime: { state: 'pending', items: [], fetchedAt: null },
    },
  });
  const completion = (async () => {
    try {
      const runtime = await fetchSmartFolderRuntime(node, caches);
      deps.enqueue({
        source: 'connector',
        kind: 'smartFolders.result',
        payload: { folderId: node.id, runtime },
      });
    } catch (err) {
      // fetchSmartFolderRuntime never throws by contract; this is the backstop
      // that keeps a defect from leaving the folder stuck pending.
      log.error('smart-folders refresh failed unexpectedly', { err, folderId: node.id });
      deps.enqueue({
        source: 'connector',
        kind: 'smartFolders.result',
        payload: {
          folderId: node.id,
          runtime: { state: 'error', items: [], fetchedAt: Date.now() },
        },
      });
    } finally {
      inflight.delete(node.id);
    }
  })();
  return { started: true, completion };
}

/** Whether a folder's clock is due: a `null`/absent `fetchedAt` is always due;
 * otherwise `now - fetchedAt ≥ refreshMinutes`. */
export function isDue(
  node: Pick<SmartFolderNode, 'id' | 'refreshMinutes'>,
  smartFolders: AppState['smartFolders'],
  now: number,
): boolean {
  const fetchedAt = smartFolders[node.id]?.fetchedAt ?? null;
  if (fetchedAt === null) return true;
  return now - fetchedAt >= node.refreshMinutes * 60_000;
}

/**
 * Refresh exactly the folders whose per-folder clock is due. Shared by the
 * alarm tick and the sidebar-open kick. Constructs ONE `ConnectorCaches` per
 * cycle and threads it into every started fetch, so per-cycle resolutions
 * (GitLab's `/api/v4/user`) happen once per cycle, not once per folder.
 * Resolves when every started fetch has completed (the result events are
 * enqueued; the drain applies them).
 */
export async function refreshDueSmartFolders(deps: SmartFolderDeps): Promise<void> {
  const now = Date.now();
  const due = collectSmartFolders(deps.store.state).filter((node) =>
    isDue(node, deps.store.state.smartFolders, now),
  );
  const caches: ConnectorCaches = new Map();
  await Promise.all(due.map((node) => startSmartFolderRefresh(deps, node, caches).completion));
}

/** Handle a fired alarm: on the poll alarm, run the due-check. Mirrors
 * `handleAutoArchiveAlarm` — never mutates the store directly. */
export async function handleSmartFoldersAlarm(
  deps: SmartFolderDeps,
  alarm: chrome.alarms.Alarm,
): Promise<void> {
  if (alarm.name !== SMART_FOLDERS_ALARM_NAME) return;
  await refreshDueSmartFolders(deps);
}

/**
 * The parallel `'lunma/state-request'` refresh-kick listener (chrome-event-
 * coordination delta). A SECOND, independent listener on the sidebar's
 * boot/open signal whose only effect is to kick the refresh-due check. It
 * never calls `sendResponse` and never returns `true` — the message's response
 * channel belongs to the pure-read snapshot handler in
 * `state-snapshot-handler.ts`, which this change does not touch. It mutates
 * nothing: the kick only schedules connector work whose results ride the
 * normal drain.
 *
 * Returns an unregister function.
 */
export function registerSmartFoldersRefreshKick(
  deps: SmartFolderDeps,
  whenReady: Promise<unknown> = Promise.resolve(),
): () => void {
  const listener = (raw: unknown): undefined => {
    if (!raw || typeof raw !== 'object') return undefined;
    if ((raw as { type?: unknown }).type !== 'lunma/state-request') return undefined;
    void whenReady.then(() => refreshDueSmartFolders(deps));
    return undefined;
  };
  chrome.runtime.onMessage.addListener(listener);
  return () => chrome.runtime.onMessage.removeListener(listener);
}
