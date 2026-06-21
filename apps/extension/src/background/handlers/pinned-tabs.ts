// Pinned / saved-tab lifecycle handlers (split-coordinator-handlers): open /
// focus / go-home / make-this-home / delete, plus pin / unpin / reorder. Verbatim
// moves of the former coordinator closures.

import { log } from '../../shared/logger';
import { closeTab } from '../tab-groups';
import { activateSpaceInWindow } from './activation';
import type { HandlersMap } from './context';
import { spaceExists } from './queries';

function assertHttps(url: string, ctx: string): boolean {
  let scheme: string;
  try {
    scheme = new URL(url).protocol;
  } catch {
    log.warn(`${ctx}: unparseable URL, dropping`, { url });
    return false;
  }
  if (scheme !== 'http:' && scheme !== 'https:') {
    log.warn(`${ctx}: blocked non-http(s) scheme`, { url, scheme });
    return false;
  }
  return true;
}

export function pinnedTabHandlers(): Pick<
  HandlersMap,
  | 'openSavedTab'
  | 'focusSavedTab'
  | 'goHome'
  | 'makeThisHome'
  | 'deleteSavedTab'
  | 'pinTab'
  | 'unpinTab'
  | 'reorderPinned'
> {
  return {
    openSavedTab: async (ctx, event) => {
      const { savedTabId, windowId, replaceTabId } = event.payload;
      const saved = ctx.store.state.savedTabs[savedTabId];
      if (!saved) {
        throw new Error(`openSavedTab: unknown savedTabId '${savedTabId}'`);
      }
      if (!assertHttps(saved.originalURL, 'openSavedTab')) return;
      // In-place open (newtab-hearth): when the home passes `replaceTabId` (its
      // own tab id), navigate THAT tab to the saved tab instead of spawning a new
      // one and stranding the home — the Arc/Chrome new-tab convention. A stale id
      // (the tab closed between click and handling, or `update` rejects) falls back
      // to the create path: the command's effect is "open the saved tab", so the
      // in-place navigation is a refinement, not a precondition. Absent
      // `replaceTabId` → unchanged create path (existing callers unaffected).
      let tab: chrome.tabs.Tab | undefined;
      if (replaceTabId !== undefined) {
        try {
          tab = await chrome.tabs.update(replaceTabId, { url: saved.originalURL });
        } catch (err) {
          log.debug('openSavedTab: replaceTabId stale, falling back to create', {
            savedTabId,
            replaceTabId,
            err,
          });
        }
      }
      if (!tab) {
        tab = await chrome.tabs.create({ url: saved.originalURL, windowId });
      }
      if (tab.id === undefined) {
        throw new Error('openSavedTab: opened tab has no id');
      }
      // Capture the narrowed id in a const so it survives into the floated
      // side-effect closure below (TS widens `tab.id` back across a closure).
      const tabId = tab.id;
      ctx.store.bindSavedTab(savedTabId, windowId, tabId, saved.originalURL);
      // Seed the live-tab record + active flag straight from the just-created
      // tab so THIS drain's broadcast already shows the row selected — rather
      // than waiting for Chrome's onCreated/onActivated to round-trip back as
      // separate events (a second drain, a visible frame late). `chrome.tabs
      // .create` returns an active tab, so `tab.active` is true; both store
      // methods are idempotent, so the real events de-dupe when they arrive.
      ctx.store.syncLiveTab({
        id: tabId,
        windowId,
        title: tab.title,
        url: tab.url,
        active: tab.active,
        status: tab.status,
        favIconUrl: tab.favIconUrl,
      });
      // Activating a pinned tab deactivates (and so consumes) any feed entry you
      // were on (rss-connector, the draining queue) → close those tabs.
      const consumed = ctx.store.setActiveTab(windowId, tabId);
      for (const closeId of consumed) ctx.runSideEffect(() => closeTab(closeId));
      // The grouping side-effect applies to `tabId` whether it was created OR
      // navigated in place (newtab-hearth, spaces-and-tabs rule 2b): the navigated
      // tab takes the created tab's grouping role. This matters on the in-place
      // path because the home tab may ALREADY sit inside the active Space's group
      // (grouped on creation, rule 2) — `ensureFavoriteUngrouped`'s ungroup + park
      // establishes the favorite invariant regardless of that prior membership.
      if (saved.spaceId === null) {
        // A global favorite (favicon-row-model D3/D8): leave its live
        // tab UNGROUPED (global) instead of adopting it into any Space's group,
        // so it stays visible across every Space switch. This is the formerly
        // unguarded-null call site — `addTabToSpaceGroup` keeps its
        // `spaceId: SpaceId` signature; a favorite is routed here before it
        // could ever reach it. The `onCreated`/`groupNewTab` auto-group path
        // needs NO hardening (design D9): `groupNewTab` early-returns for any
        // tab not in `tempTabIds`, and this bound favorite never is, so no new
        // drain race exists.
        await ctx.groups.ensureFavoriteUngrouped(tabId);
      } else {
        // A pinned/saved tab belongs to its Space. If that Space is not the
        // window's active one (e.g. a cross-Space open from the launcher),
        // switch to it FIRST (cross-space-tab-switch D3) so the target group is
        // the shown one when the new tab joins it — otherwise the tab lands in a
        // hidden background group. The helper no-ops for a same-Space open, so
        // the sidebar's always-same-Space clicks are unchanged.
        await activateSpaceInWindow(ctx, windowId, saved.spaceId);
        // Now joins the active Space's Chrome group in the window (not just temp tabs).
        await ctx.groups.addTabToSpaceGroup(windowId, saved.spaceId, tabId);
      }
      ctx.markDirty();
      // Arm/disarm the just-bound tab's boundary (pinned-tab-domain-boundary)
      // OFF the drain's critical path: `configureBoundary` awaits
      // `executeScript` against the still-loading tab, which can block for
      // seconds, and must NOT gate the broadcast above. The freshly-created tab
      // also receives the declarative boundary script on load and the
      // `onUpdated status:'complete'` handler re-pushes its allow-set, so this
      // imperative arm is the earliest attempt, not the only one (design D6).
      ctx.runSideEffect(() => ctx.boundary.configureBoundary(tabId, saved));
    },
    focusSavedTab: async (ctx, event) => {
      const { savedTabId, windowId } = event.payload;
      // Focus THIS window's bound tab only — never another window's slot
      // (per-window-tab-bindings, ADR 0003).
      const tabId = ctx.store.state.tabBindings[savedTabId]?.[windowId];
      if (tabId === undefined) {
        throw new Error(
          `focusSavedTab: saved tab '${savedTabId}' is dormant in window ${windowId} or unknown`,
        );
      }
      // When the bound tab is coupled (`spaceId !== null`) and lives in a Space
      // other than the window's active one, switch the window to that Space FIRST
      // (cross-space-tab-switch D3) so the tab is focused into its now-shown group
      // rather than forcing Chrome to expand a hidden one. A favorite
      // (`spaceId === null`) or a same-Space focus never switches, so the sidebar
      // is unchanged. The store activation here must be persisted/broadcast, so
      // mark dirty only when the switch actually runs.
      const savedRecord = ctx.store.state.savedTabs[savedTabId];
      if (
        savedRecord &&
        savedRecord.spaceId !== null &&
        savedRecord.spaceId !== ctx.store.state.activeSpaceByWindow[windowId]
      ) {
        await activateSpaceInWindow(ctx, windowId, savedRecord.spaceId);
        ctx.markDirty();
      }
      const tab = await chrome.tabs.update(tabId, { active: true });
      if (tab?.windowId !== undefined) {
        await chrome.windows.update(tab.windowId, { focused: true });
      }
      // Re-push the boundary config on focus — a refresh in case the tab's
      // content script was reset or never configured (pinned-tab-domain-boundary).
      const saved = ctx.store.state.savedTabs[savedTabId];
      if (saved) await ctx.boundary.configureBoundary(tabId, saved);
    },
    goHome: async (ctx, event) => {
      const { savedTabId, windowId } = event.payload;
      const saved = ctx.store.state.savedTabs[savedTabId];
      if (!saved) {
        throw new Error(`goHome: unknown savedTabId '${savedTabId}'`);
      }
      if (!assertHttps(saved.originalURL, 'goHome')) return;
      // Navigate THIS window's bound tab home (per-window-tab-bindings): the
      // drift "Go home" affordance is per-(saved tab, window).
      const tabId = ctx.store.state.tabBindings[savedTabId]?.[windowId];
      if (tabId === undefined) {
        throw new Error(`goHome: saved tab '${savedTabId}' is dormant in window ${windowId}`);
      }
      await chrome.tabs.update(tabId, { url: saved.originalURL });
    },
    makeThisHome: (ctx, event) => {
      const { savedTabId } = event.payload;
      const saved = ctx.store.state.savedTabs[savedTabId];
      if (!saved) {
        throw new Error(`makeThisHome: unknown savedTabId '${savedTabId}'`);
      }
      if (saved.currentURL === null) {
        throw new Error(`makeThisHome: currentURL is null for '${savedTabId}'`);
      }
      // Lunma-owned record: update originalURL in state only, no
      // chrome.bookmarks.update (ADR 0001).
      ctx.store.makeSavedTabHomeCurrent(savedTabId);
      ctx.markDirty();
    },
    deleteSavedTab: async (ctx, event) => {
      const { savedTabId } = event.payload;
      if (!ctx.store.state.savedTabs[savedTabId]) {
        throw new Error(`deleteSavedTab: unknown savedTabId '${savedTabId}'`);
      }
      // Close EVERY bound live tab across all window slots (per-window-tab-
      // bindings, ADR 0003), then drop the record. Best-effort per D7-bis: the
      // user wants the saved tab gone regardless of any tab's state.
      const boundTabIds = Object.values(ctx.store.state.tabBindings[savedTabId] ?? {});
      for (const tabId of boundTabIds) {
        try {
          await chrome.tabs.remove(tabId);
        } catch (err) {
          log.error('deleteSavedTab: tab close failed', { savedTabId, tabId, err });
        }
      }
      ctx.store.removeSavedTab(savedTabId);
      ctx.markDirty();
    },
    // Pinned-tab creation + lifecycle (sidebar-pinned-tabs). Pure
    // orchestration over the store — one coalesced mutation per drain.
    pinTab: (ctx, event) => {
      const { tabId, windowId, spaceId, targetIndex, placement } = event.payload;
      const liveTab = ctx.store.state.liveTabsById[tabId];
      if (!liveTab) {
        // Can't pin a tab Lunma has no live record of — log + no-op (D2).
        log.debug('pinTab: no live tab record', { tabId, windowId });
        return;
      }
      // Idempotent: a tab already bound (in ANY window) to any saved tab is
      // already pinned (per-window-tab-bindings — scan inner window slots).
      for (const slots of Object.values(ctx.store.state.tabBindings)) {
        if (Object.values(slots).includes(tabId)) {
          log.debug('pinTab: tab already bound', { tabId });
          return;
        }
      }
      // Mint the record FIRST (do NOT bind yet — binding removes the tab from
      // Temporary, and "never orphaned" means we only bind once the record is
      // actually placed somewhere reachable). Design D3.
      const id = crypto.randomUUID();
      ctx.store.registerSavedTab({
        id,
        spaceId,
        title: liveTab.title,
        originalURL: liveTab.url,
        currentURL: liveTab.url,
      });

      // Route by placement. Each branch falls back to a top-level insert at
      // `targetIndex` when its drop target no longer exists at handle time, so
      // the record is always placed (no orphan). Folder and saved-tab ids are
      // disjoint, so a `{ into }`/`{ withSavedTabId }` shape can only resolve or
      // miss within its own kind — it can never address the wrong entity.
      if (placement && 'into' in placement) {
        if (!ctx.store.addPinnedToFolder(spaceId, placement.into, id)) {
          ctx.store.addPinned(spaceId, id, targetIndex);
        }
      } else if (placement && 'withSavedTabId' in placement) {
        const list = ctx.store.state.pinnedBySpace[spaceId] ?? [];
        const index = list.findIndex((n) => n.kind === 'tab' && n.id === placement.withSavedTabId);
        if (index !== -1) {
          ctx.store.createFolderFromTabs(spaceId, id, placement.withSavedTabId, index);
        } else {
          ctx.store.addPinned(spaceId, id, targetIndex);
        }
      } else {
        ctx.store.addPinned(spaceId, id, targetIndex);
      }

      // Bind LAST, and only when the record actually landed in the tree, so the
      // tab leaves Temporary exactly when it gains a visible placement (D3). The
      // fallbacks above make "not placed" unreachable; if it ever happens, undo
      // the mint and leave the tab in Temporary rather than orphan either.
      const placed = (ctx.store.state.pinnedBySpace[spaceId] ?? []).some(
        (n) =>
          (n.kind === 'tab' && n.id === id) || (n.kind === 'folder' && n.children.includes(id)),
      );
      if (placed) {
        ctx.store.bindSavedTab(id, windowId, tabId, liveTab.url);
      } else {
        log.error('pinTab: record not placed, leaving tab in Temporary', {
          tabId,
          spaceId,
          id,
        });
        ctx.store.removeSavedTab(id);
      }
      ctx.markDirty();
    },
    unpinTab: (ctx, event) => {
      const { savedTabId } = event.payload;
      const saved = ctx.store.state.savedTabs[savedTabId];
      if (!saved) {
        throw new Error(`unpinTab: unknown savedTabId '${savedTabId}'`);
      }
      // Capture every bound (window, tab) BEFORE removeSavedTab drops the slots:
      // each bound window's tab returns to THAT window's Temporary (per-window-
      // tab-bindings, ADR 0003). A dormant window has no slot, so nothing to do.
      const boundByWindow = Object.entries(ctx.store.state.tabBindings[savedTabId] ?? {});
      // Second unguarded-null site (favicon-row-model D8): a global
      // favorite (`spaceId === null`) is referenced by `faviconRow`, never by
      // `pinnedBySpace`, so it must NOT be routed through
      // `removePinned(null, …)`. `removeSavedTab` below cleans BOTH placement
      // families (the pinned tree AND `faviconRow`, design D6), so the favorite
      // path is fully handled there; only a coupled tab needs the explicit
      // `removePinned`.
      if (saved.spaceId !== null) {
        ctx.store.removePinned(saved.spaceId, savedTabId);
      }
      ctx.store.removeSavedTab(savedTabId);
      // Restore each tab (no chrome.tabs.remove). Must run after removeSavedTab
      // so the binding is gone and restoreTempTab sees each tab as unbound.
      for (const [windowIdStr, tabId] of boundByWindow) {
        ctx.store.restoreTempTab(Number(windowIdStr), tabId);
      }
      ctx.markDirty();
    },
    reorderPinned: (ctx, event) => {
      const { spaceId, nodes } = event.payload;
      if (!spaceExists(ctx.store.state, spaceId)) {
        throw new Error(`reorderPinned: unknown spaceId '${spaceId}'`);
      }
      ctx.store.setPinned(spaceId, nodes);
      ctx.markDirty();
    },
  };
}
