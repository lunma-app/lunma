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
  const edge = edges[childToken];
  if (!edge) return null;
  return tabIdForToken(edge.parentToken) ?? null;
}
