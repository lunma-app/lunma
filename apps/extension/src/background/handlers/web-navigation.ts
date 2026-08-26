import { isRootTransition } from '../../shared/provenance';
import type { HandlersMap } from './context';

/**
 * `webNavigation.onCommitted` → parent resolution (tab-provenance).
 *
 * Pure and synchronous against in-memory state: it reads the coordinator's cached
 * `provenanceEnabled()` mirror rather than awaiting `hasApiPermission`, and it
 * performs no `chrome.*` I/O — the identity sync a commit may require is
 * dispatched as a side effect by the caller.
 *
 * A parent is recorded ONLY when the transition is a continuing one AND the
 * opener's token is known. An external application handoff commits as
 * `start_page` while carrying a live `openerTabId` pointing at whatever tab was
 * last focused, so resolving from the opener alone would confidently attribute it
 * to an unrelated tab. Anything not positively attributable is a root.
 */
export function webNavigationHandlers(): Pick<HandlersMap, 'webNavigation.onCommitted'> {
  return {
    'webNavigation.onCommitted': (ctx, event) => {
      if (!ctx.provenanceEnabled()) return;
      const { tabId, frameId, transitionType } = event.payload;
      if (frameId !== 0) return; // subframes are filtered at the listener too

      const s = ctx.store.state;
      const child = s.liveTabsById[tabId];
      if (!child) return;

      // A root: nothing to attribute, and the tab keeps whatever identity it has.
      if (isRootTransition(transitionType)) {
        ctx.store.setLiveTabParent(tabId, null);
        ctx.markDirty();
        return;
      }

      const openerTabId = child.openerTabId;
      if (openerTabId === undefined) return; // no opener → nothing to attribute
      const childToken = child.provenanceToken;
      const parentToken = s.liveTabsById[openerTabId]?.provenanceToken;
      if (!childToken || !parentToken) return; // not positively attributable → root

      ctx.store.recordProvenanceEdge(childToken, parentToken, Date.now());
      // Resolve THIS tab's parent here too. `resolveAllParents` runs during the
      // identity exchange, which precedes this handler, so relying on it alone
      // leaves the newest tab unindented until some LATER tab happens to trigger
      // another pass — the tab you just opened is exactly the one you are looking
      // at. The opener is already known to be live and tokenised (both were
      // checked above), so no walk is needed.
      ctx.store.setLiveTabParent(tabId, openerTabId);
      ctx.markDirty();
    },
  };
}
