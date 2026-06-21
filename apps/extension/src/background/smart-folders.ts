import { log } from '../shared/logger';
import { hasHostPermissions, onPermissionsChange } from '../shared/permissions';
import type { LunmaStore } from '../shared/store.svelte';
import type {
  AppState,
  FolderId,
  PinNode,
  SmartSectionRuntime,
  SmartSource,
  SmartSourceConfig,
} from '../shared/types';
import type { ConnectorCaches, SourceConnector } from './connectors/connector';
// All 4 connectors are eagerly imported on every SW boot (~52 KB / ~11 KB gzip
// total, even for users who have enabled none). Converting to a lazy registry
// (dynamic import on first use of each source) is the straightforward fix when
// SW boot budget becomes a concern.
import { githubConnector } from './connectors/github';
import { gitlabConnector } from './connectors/gitlab';
import { jiraConnector } from './connectors/jira';
import { rssConnector } from './connectors/rss';

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
 *     the source discriminant — exactly the four shipped connectors
 *     (`background/connectors/`), no plug-in mechanism.
 */

export const SMART_FOLDERS_ALARM_NAME = 'lunma/smart-folders-poll';

/** Cadence floor in minutes (rate-limit kindness); the SW clamps lower values
 * on create/update. Default is 10 (the editor's initial selection). */
export const REFRESH_MINUTES_FLOOR = 5;
export const REFRESH_MINUTES_DEFAULT = 10;

export type SmartFolderNode = Extract<PinNode, { kind: 'smart' }>;

/**
 * Stable section identity key for a source config: `${source}:${host}`.
 * Derived from `baseUrl` so two configs with the same source + host always
 * land in the same section regardless of query. Exported so the sidebar can
 * derive the same key without importing from `background/`.
 */
export function sourceKey(cfg: SmartSourceConfig): string {
  return `${cfg.source}:${new URL(cfg.baseUrl).host}`;
}

/**
 * The closed connector registry (github-connector design D1): exactly the
 * shipped sources, no speculative members. Exported for tests.
 */
export const CONNECTORS: Record<SmartSource, SourceConnector> = {
  gitlab: gitlabConnector,
  github: githubConnector,
  jira: jiraConnector,
  rss: rssConnector,
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
  payload: { folderId: FolderId; sourceKey: string; runtime: SmartSectionRuntime };
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
 * Fetch one smart folder section's results through its source's connector.
 * Never throws — every failure shape resolves to a runtime state (the
 * connectors' contract). The host-permission gate (least-privilege-permissions
 * design D8/D9) runs here per-source: a section whose connector-required
 * origins are not ALL granted resolves to `needs-access` WITHOUT a network
 * request. Partial grants are allowed — one section can be `needs-access` while
 * another fetches normally.
 */
export async function fetchSmartSectionRuntime(
  cfg: SmartSourceConfig,
  maxItems: number,
  caches?: ConnectorCaches,
): Promise<SmartSectionRuntime> {
  const connector = CONNECTORS[cfg.source];
  if (!(await hasHostPermissions(connector.requiredOrigins(cfg)))) {
    return { state: 'needs-access', items: [], fetchedAt: Date.now() };
  }
  return connector.fetchRuntime(cfg, maxItems, caches);
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
 * Begin one folder's refresh: enqueue a `pending` mark per source section
 * (the drain's mutator preserves last-known items, so the list never blinks),
 * then fan out one `fetchSmartSectionRuntime` per source OFF the drain,
 * enqueuing each section's result event on completion. Returns the fetch's
 * completion promise so the coordinator handler can track it via
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

  // Emit pending per section so the UI can transition immediately.
  for (const cfg of node.sources) {
    const sk = sourceKey(cfg);
    deps.enqueue({
      source: 'connector',
      kind: 'smartFolders.result',
      payload: {
        folderId: node.id,
        sourceKey: sk,
        runtime: { state: 'pending', items: [], fetchedAt: null },
      },
    });
  }

  const completion = (async () => {
    try {
      await Promise.all(
        node.sources.map(async (cfg) => {
          const sk = sourceKey(cfg);
          try {
            const runtime = await fetchSmartSectionRuntime(cfg, node.maxItems, caches);
            deps.enqueue({
              source: 'connector',
              kind: 'smartFolders.result',
              payload: { folderId: node.id, sourceKey: sk, runtime },
            });
          } catch (err) {
            // fetchSmartSectionRuntime never throws by contract; this backstop
            // keeps a defect from leaving a section stuck pending.
            log.error('smart-folders section refresh failed unexpectedly', {
              err,
              folderId: node.id,
              sourceKey: sk,
            });
            deps.enqueue({
              source: 'connector',
              kind: 'smartFolders.result',
              payload: {
                folderId: node.id,
                sourceKey: sk,
                runtime: { state: 'error', items: [], fetchedAt: Date.now() },
              },
            });
          }
        }),
      );
    } finally {
      inflight.delete(node.id);
    }
  })();
  return { started: true, completion };
}

/** Whether a folder's clock is due: a `null` fetchedAt in ANY section is
 * always due; otherwise `now - minFetchedAt ≥ refreshMinutes`. */
export function isDue(
  node: Pick<SmartFolderNode, 'id' | 'refreshMinutes'>,
  smartFolders: AppState['smartFolders'],
  now: number,
): boolean {
  const folder = smartFolders[node.id];
  if (!folder) return true;
  const sections = Object.values(folder.sections);
  if (sections.length === 0) return true;
  let minFetchedAt = Infinity;
  for (const s of sections) {
    if (s.fetchedAt === null) return true;
    if (s.fetchedAt < minFetchedAt) minFetchedAt = s.fetchedAt;
  }
  return now - minFetchedAt >= node.refreshMinutes * 60_000;
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
  const listener = (raw: unknown, sender: chrome.runtime.MessageSender): undefined => {
    if (sender.id !== chrome.runtime.id) return undefined;
    if (!raw || typeof raw !== 'object') return undefined;
    if ((raw as { type?: unknown }).type !== 'lunma/state-request') return undefined;
    void whenReady.then(() => refreshDueSmartFolders(deps));
    return undefined;
  };
  chrome.runtime.onMessage.addListener(listener);
  return () => chrome.runtime.onMessage.removeListener(listener);
}

// ── host-permission sync (least-privilege-permissions design D5/D9) ──────────────

/**
 * Re-evaluate every smart folder section's host grant after a permission
 * change and enqueue the right result event (the drain applies + broadcasts
 * each). Per-source checks allow partial grants: one section may be unblocked
 * while another stays `needs-access`.
 *
 *   - **granted** and the section was `needs-access` → trigger a full folder
 *     refresh (the gate in {@link fetchSmartSectionRuntime} now passes for that
 *     source; other sections fetch normally or return `needs-access` as
 *     appropriate).
 *   - **ungranted** and the section is not already `needs-access` → drop that
 *     section to `needs-access` (a revoke returns the section to its gated
 *     state).
 *   - due-clock check: if the folder is due regardless of grant changes, a
 *     full refresh is also triggered.
 *
 * Re-checks each section via `hasHostPermissions` (the source of truth) rather
 * than matching the change's raw match patterns. One `ConnectorCaches` per
 * pass, like a poll cycle. Exported for tests.
 */
export async function reconcileSmartFolderGrants(deps: SmartFolderDeps): Promise<void> {
  const now = Date.now();
  const folders = collectSmartFolders(deps.store.state);
  const caches: ConnectorCaches = new Map();
  await Promise.all(
    folders.map(async (node) => {
      const sections = deps.store.state.smartFolders[node.id]?.sections ?? {};

      // Resolve grant status for every source in parallel.
      const grantResults = await Promise.all(
        node.sources.map(async (cfg) => {
          const sk = sourceKey(cfg);
          const granted = await hasHostPermissions(CONNECTORS[cfg.source].requiredOrigins(cfg));
          return { cfg, sk, granted, sectionState: sections[sk]?.state };
        }),
      );

      // A newly-granted source that was stuck at needs-access should be
      // unblocked immediately; if the folder is also due, do a full refresh.
      const anyUnblocked = grantResults.some((r) => r.granted && r.sectionState === 'needs-access');
      if (anyUnblocked || isDue(node, deps.store.state.smartFolders, now)) {
        await startSmartFolderRefresh(deps, node, caches).completion;
        return;
      }

      // Revoke: drop ungranted sections that aren't already needs-access.
      for (const { sk, granted, sectionState } of grantResults) {
        if (!granted && sectionState !== 'needs-access') {
          deps.enqueue({
            source: 'connector',
            kind: 'smartFolders.result',
            payload: {
              folderId: node.id,
              sourceKey: sk,
              runtime: { state: 'needs-access', items: [], fetchedAt: now },
            },
          });
        }
      }
    }),
  );
}

/**
 * Subscribe (in the SW) to `chrome.permissions` grants/revocations and heal
 * smart folders without a reload (design D5/D9). Any change — added or removed —
 * triggers a full {@link reconcileSmartFolderGrants} pass (granting one origin
 * may unblock several folders; the source-of-truth re-check is cheap). The pass
 * defers to `whenReady` so a change that wakes a dormant SW never reads a
 * half-loaded store (mirrors {@link registerSmartFoldersRefreshKick}). Returns
 * an unsubscribe.
 */
export function registerSmartFoldersPermissionSync(
  deps: SmartFolderDeps,
  whenReady: Promise<unknown> = Promise.resolve(),
): () => void {
  return onPermissionsChange(() => {
    void whenReady.then(() => reconcileSmartFolderGrants(deps));
  });
}
