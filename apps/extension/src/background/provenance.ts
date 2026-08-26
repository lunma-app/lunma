import { log } from '../shared/logger';
import {
  PROVENANCE_EDGE_CAP,
  PROVENANCE_SESSION_MARKER_KEY,
  resolveParentTabId,
} from '../shared/provenance';
import { effectiveProvenanceState } from '../shared/settings';
import type { LunmaStore } from '../shared/store.svelte';
import type { TabId } from '../shared/types';

/**
 * Service-worker half of tab-provenance: the identity exchange, parent
 * resolution, and the teardown sweep.
 *
 * Nothing here runs while the effective state is off — the content script is
 * never messaged, so a user who has not enabled provenance sees no
 * `sessionStorage` interaction at all.
 */

/** Send a message to one tab, swallowing the "no receiver" rejection a
 * non-injectable page (chrome://, PDF, the Web Store) always produces. */
async function tell(tabId: TabId, message: unknown): Promise<void> {
  try {
    await chrome.tabs.sendMessage(tabId, message);
  } catch {
    /* no content script in that tab — it is simply a root */
  }
}

/**
 * Establish this tab's identity. Mints a CANDIDATE and offers it; the page keeps
 * whatever token it already holds and replies with the token now in effect. A
 * page-carried token therefore WINS — which is precisely what makes lineage
 * survive a session restore, because a restored page brings its token back.
 *
 * A tab already mapped this session is re-stamped with the SAME token rather than
 * a new candidate, so one tab keeps one identity across a cross-origin commit,
 * where `sessionStorage` resets.
 */
export async function syncTabIdentity(store: LunmaStore, tabId: TabId): Promise<void> {
  const known = store.state.liveTabsById[tabId]?.provenanceToken;
  const candidate = known ?? crypto.randomUUID();
  try {
    const reply = (await chrome.tabs.sendMessage(tabId, {
      type: 'lunma/provenance-sync',
      token: candidate,
    })) as { type?: string; token?: unknown } | undefined;
    if (reply?.type !== 'lunma/provenance-token' || typeof reply.token !== 'string') return;
    store.setLiveTabToken(tabId, reply.token);
  } catch {
    /* not injectable → no identity → root */
  }
}

/**
 * Give every already-open tab an identity.
 *
 * Without this, enabling provenance leaves existing tabs untokenised, so the
 * FIRST link opened from one resolves to a root and the feature looks broken on
 * the very first thing a user tries. Identity is not lineage — no edge is
 * invented here; the tabs simply become attributable from now on.
 */
export async function syncAllTabIdentities(store: LunmaStore): Promise<void> {
  const tabs = await chrome.tabs.query({});
  await Promise.all(
    tabs
      .filter((t) => t.id !== undefined && (t.url ?? '').startsWith('http'))
      .map((t) => syncTabIdentity(store, t.id as TabId)),
  );
  resolveAllParents(store);
}

/** Recompute every live tab's resolved parent from the persisted edges. The SW
 * resolves the EDGE only; indent depth is layout and belongs to the surface. */
export function resolveAllParents(store: LunmaStore): void {
  const byToken = new Map<string, TabId>();
  for (const live of Object.values(store.state.liveTabsById)) {
    if (live.provenanceToken) byToken.set(live.provenanceToken, live.tabId);
  }
  for (const live of Object.values(store.state.liveTabsById)) {
    const parent = resolveParentTabId(live.provenanceToken, store.state.provenanceByToken, (t) =>
      byToken.get(t),
    );
    store.setLiveTabParent(live.tabId, parent);
  }
}

/** Drop edges no live tab can still claim, then cap the slice. */
export function pruneOnBoot(store: LunmaStore): void {
  const liveTokens = new Set<string>();
  for (const live of Object.values(store.state.liveTabsById)) {
    if (live.provenanceToken) liveTokens.add(live.provenanceToken);
  }
  store.pruneProvenanceEdges(liveTokens, PROVENANCE_EDGE_CAP);
}

/**
 * Tear down when the setting is turned off. Stops at clearing OUR state and the
 * markers we can still reach — the `webNavigation` grant is deliberately NOT
 * revoked: `runtime-permissions` holds that revocation is observed, never
 * initiated by Lunma, and an unheld-but-granted permission is inert.
 */
export async function tearDownProvenance(store: LunmaStore): Promise<void> {
  store.state.provenanceByToken = {};
  for (const live of Object.values(store.state.liveTabsById)) {
    store.setLiveTabParent(live.tabId, null);
  }
  // A tab that is not loaded keeps its marker, and a later session restore would
  // bring it back — so the sweep stays pending until it can be proven empty.
  store.setProvenanceCleanupPending(true);
  const tabs = await chrome.tabs.query({});
  await Promise.all(
    tabs
      .filter((t) => t.id !== undefined && (t.url ?? '').startsWith('http'))
      .map((t) => tell(t.id as TabId, { type: 'lunma/provenance-clear' })),
  );
}

/** Clear one tab's marker as it loads, while a sweep is pending. */
export async function sweepTabOnLoad(store: LunmaStore, tabId: TabId): Promise<void> {
  if (!store.state.provenanceCleanupPending) return;
  await tell(tabId, { type: 'lunma/provenance-clear' });
}

/**
 * End the sweep only when it is provably finished.
 *
 * NOT when a sweep finds nothing among loaded tabs — teardown already cleared
 * those, so that check is vacuous and would end cleanup before a single unloaded
 * tab reloads. Instead: this must be the first boot of a NEW browser session
 * (`chrome.storage.session` is wiped when the browser closes) AND no `http(s)`
 * tab exists, so no page can still be holding a marker.
 *
 * The marker is READ before it is written — writing first would make the
 * condition unsatisfiable forever.
 */
export async function maybeEndSweep(store: LunmaStore): Promise<void> {
  let freshSession = false;
  try {
    const got = await chrome.storage.session.get(PROVENANCE_SESSION_MARKER_KEY);
    freshSession = got[PROVENANCE_SESSION_MARKER_KEY] === undefined;
    await chrome.storage.session.set({ [PROVENANCE_SESSION_MARKER_KEY]: true });
  } catch (err) {
    log.debug('provenance: session marker unavailable', { err });
    return;
  }
  if (!freshSession || !store.state.provenanceCleanupPending) return;
  const tabs = await chrome.tabs.query({});
  if (tabs.some((t) => (t.url ?? t.pendingUrl ?? '').startsWith('http'))) return;
  store.setProvenanceCleanupPending(false);
}

/** Whether provenance is effectively on right now. */
export async function isProvenanceOn(): Promise<boolean> {
  return effectiveProvenanceState();
}
