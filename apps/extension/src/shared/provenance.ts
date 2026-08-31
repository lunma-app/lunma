import type { TabId } from './types';

/** `sessionStorage` key holding a tab's provenance token. Named in the spec
 * because it is the most user-visible identifier this feature ships — a page can
 * read it, so it is disclosed in the options copy and in `/privacy`. */
export const TAB_TOKEN_KEY = 'lunma.tabToken';

/** `chrome.storage.session` key whose ABSENCE marks the first boot of a new
 * browser session — that area is cleared when the browser closes. */
export const PROVENANCE_SESSION_MARKER_KEY = 'lunma.provenanceSession';

/** Upper bound on persisted edges; the oldest are dropped past it. */
export const PROVENANCE_EDGE_CAP = 2000;

/** Deepest indent the Temporary list will render; a 390px panel cannot spend more. */
export const PROVENANCE_MAX_DEPTH = 5;

/** A persisted parent edge, keyed by the CHILD's token. `recordedAt` is what
 * gives the cap a definition of "oldest". */
export interface ProvenanceEdge {
  parentToken: string;
  recordedAt: number;
}

/**
 * Transitions that originate a tab rather than continue one, so they can carry no
 * parent. `start_page` covers the external-application handoff, which arrives with
 * a live `openerTabId` pointing at whatever tab was last focused — resolving from
 * the opener alone would confidently attribute it to an unrelated tab.
 *
 * Chrome is inconsistent between the `start_page` and `auto_toplevel` spellings
 * across platforms, so both are accepted.
 *
 * Anything unrecognised is a root: a wrong parent is worse than no parent.
 */
const CONTINUING_TRANSITIONS: ReadonlySet<string> = new Set(['link']);

export function isRootTransition(transitionType: string): boolean {
  return !CONTINUING_TRANSITIONS.has(transitionType);
}

/**
 * Walk the edge chain from a child token to the live tab id of its parent, or
 * `null` when it is a root. Terminates on a cycle rather than hanging.
 *
 * Returns the EDGE only. Indent depth is layout and belongs to the surface that
 * renders the list — only it knows which rows it is displaying.
 */
export function resolveParentTabId(
  childToken: string | undefined,
  edges: Readonly<Record<string, ProvenanceEdge>>,
  tabIdForToken: (token: string) => TabId | undefined,
): TabId | null {
  if (!childToken) return null;
  // Walk to the nearest LIVE ancestor rather than giving up one hop up. Closing a
  // tab in the middle of a chain must not orphan everything below it: the token
  // chain survives the close (edges are keyed by token, not by live tab), so the
  // grandparent is still reachable and the grandchild re-indents under it.
  const seen = new Set<string>([childToken]);
  let token = childToken;
  for (;;) {
    const edge = edges[token];
    if (!edge) return null;
    const parentToken = edge.parentToken;
    if (seen.has(parentToken)) return null; // a cycle resolves as a root
    seen.add(parentToken);
    const live = tabIdForToken(parentToken);
    if (live !== undefined) return live;
    token = parentToken;
  }
}

/**
 * The tabs opened from `rootTabId`, transitively (tab-close-cascade).
 *
 * Restricted to `spaceTempTabIds` so a cascade can never reach a pinned tab or a
 * tab in another Space — the subtree's visibility in the Temporary list is what
 * makes closing it legible, and a tab the user cannot see is not legible.
 *
 * `rootTabId` itself is never included: the caller closed it, the cascade owns
 * only what follows.
 */
export function collectDescendantTabIds(
  liveTabsById: Readonly<
    Record<number, { tabId: TabId; provenanceParentTabId?: TabId | undefined }>
  >,
  rootTabId: TabId,
  spaceTempTabIds: readonly TabId[],
): TabId[] {
  const eligible = new Set<TabId>(spaceTempTabIds);
  const childrenOf = new Map<TabId, TabId[]>();
  for (const live of Object.values(liveTabsById)) {
    const parent = live.provenanceParentTabId;
    if (parent === undefined || !eligible.has(live.tabId)) continue;
    const bucket = childrenOf.get(parent);
    if (bucket) bucket.push(live.tabId);
    else childrenOf.set(parent, [live.tabId]);
  }

  const out: TabId[] = [];
  const seen = new Set<TabId>([rootTabId]); // also the cycle guard
  const queue: TabId[] = [rootTabId];
  while (queue.length > 0) {
    const next = queue.shift() as TabId;
    for (const child of childrenOf.get(next) ?? []) {
      if (seen.has(child)) continue;
      seen.add(child);
      out.push(child);
      queue.push(child);
    }
  }
  return out;
}
