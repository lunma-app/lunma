// Chrome tab-lifecycle handlers (split-coordinator-handlers): the four
// `tabs.*` events. Handler bodies are verbatim moves of the former coordinator
// closures — `this.store` → `ctx.store`, `this.dirty = true` → `ctx.markDirty()`,
// group/boundary helpers → `ctx.groups.*` / `ctx.boundary.*`, read predicates →
// `./queries`.

import { TAB_DEDUP_FLASH } from '../../shared/bus';
import { log } from '../../shared/logger';
import { isNewTabUrl } from '../../shared/new-tab';
import { resolveBoundaryAllow } from '../../shared/url-boundary';
import { closeTab } from '../tab-groups';
import { activateSpaceInWindow } from './activation';
import type { HandlersMap } from './context';
import {
  findTabInActiveSpace,
  isTrackedTab,
  savedTabIdForBoundTab,
  spaceOwningTab,
} from './queries';

export function chromeTabHandlers(): Pick<
  HandlersMap,
  'tabs.onCreated' | 'tabs.onRemoved' | 'tabs.onUpdated' | 'tabs.onActivated'
> {
  return {
    'tabs.onCreated': async (ctx, event) => {
      const { tab } = event.payload;
      // A home tab (the Lunma new-tab page) is grouped into the active Space
      // so the window shows it, but is NOT adopted into tempTabIds — it is the
      // Space's home, not a temporary tab. Recognised by URL (Chrome may report
      // either `url` or `pendingUrl` for a fresh NTP).
      const isHome = isNewTabUrl(tab.url) || isNewTabUrl(tab.pendingUrl);
      if (!isHome) {
        ctx.store.onTabCreated({ id: tab.id, windowId: tab.windowId });
      }
      ctx.store.syncLiveTab({
        id: tab.id,
        windowId: tab.windowId,
        title: tab.title,
        url: tab.url,
        active: tab.active,
        status: tab.status,
        favIconUrl: tab.favIconUrl,
      });
      if (isHome) {
        await ctx.groups.groupHomeTab(tab.id, tab.windowId);
      } else {
        await ctx.groups.groupNewTab(tab.id, tab.windowId);
      }
      ctx.markDirty();
    },
    'tabs.onRemoved': (ctx, event) => {
      const { tabId, info } = event.payload;
      // Query next feed item BEFORE onTabRemoved (binding still visible, item still unread).
      const advance = info.isWindowClosing
        ? undefined
        : ctx.store.nextUnreadFeedItemAfterClose(tabId, info.windowId);
      ctx.store.onTabRemoved(tabId, {
        windowId: info.windowId,
        isWindowClosing: info.isWindowClosing,
      });
      ctx.store.removeLiveTab(tabId);
      ctx.markDirty();
      // Auto-advance: open the next unread feed item in the same section.
      if (advance) {
        ctx.enqueue({
          source: 'sidebar',
          kind: 'openSmartItem',
          payload: advance,
          correlationId: `feed-auto-advance-${tabId}`,
        });
      }
    },
    'tabs.onUpdated': async (ctx, event) => {
      const { tabId, changeInfo } = event.payload;
      if (
        changeInfo.url === undefined &&
        changeInfo.status === undefined &&
        changeInfo.title === undefined &&
        changeInfo.favIconUrl === undefined
      ) {
        return;
      }
      // Saved-tab binding / activity tracking only cares about url + status.
      if (changeInfo.url !== undefined || changeInfo.status !== undefined) {
        const resolved: { url?: string; status?: string } = {};
        if (changeInfo.url !== undefined) resolved.url = changeInfo.url;
        if (changeInfo.status !== undefined) resolved.status = changeInfo.status;
        ctx.store.onTabUpdated(tabId, resolved);
      }
      // Mirror visible metadata into liveTabsById (no-ops if unchanged). The
      // favicon arrives via its own onUpdated once Chrome resolves it, which
      // is what lets the sidebar swap the placeholder for the real icon.
      ctx.store.syncLiveTab({
        id: tabId,
        title: changeInfo.title,
        url: changeInfo.url,
        status: changeInfo.status,
        favIconUrl: changeInfo.favIconUrl,
      });
      // A home tab that navigated to a real URL stops being a home tab and
      // becomes an ordinary temporary tab (listed + kept). Detect the
      // transition: an untracked tab (neither temp nor bound) whose new URL is
      // not a newtab URL — adopt it into the active Space's Temporary list and
      // ensure it is grouped. Guarded on "untracked" so a normal navigation of
      // an already-temp/bound tab does not trigger a redundant regroup.
      if (
        changeInfo.url !== undefined &&
        !isNewTabUrl(changeInfo.url) &&
        !isTrackedTab(ctx.store.state, tabId)
      ) {
        const navigatedUrl = changeInfo.url;
        const windowId = ctx.store.state.liveTabsById[tabId]?.windowId;
        if (windowId !== undefined) {
          // Navigation dedup (navigation-tab-dedup): the address-bar counterpart
          // to the launcher's `openUrl` dedup. A blank new tab committing its
          // FIRST real URL that is already open in this window's active Space
          // focuses the existing tab and closes this one, instead of adopting a
          // duplicate. Gated by the cached `dedupNewTabNavigations` mirror; reuses
          // `findTabInActiveSpace` + the `tab-dedup` flash (current window, active
          // Space, exact match — never cross-window/Space). Wrapped in try/catch
          // so any failure (existing tab just closed, focus rejected) falls
          // through to normal adoption — a tab is never lost. No `markDirty` on the
          // hit path: the focus/close fire `tabs.onActivated`/`onRemoved`, which
          // reconcile state, exactly like the `openUrl` dedup.
          if (ctx.dedupNewTabNavigations()) {
            const found = findTabInActiveSpace(ctx.store.state, windowId, navigatedUrl);
            if (found !== null && found !== tabId) {
              try {
                await chrome.tabs.update(found, { active: true });
                await chrome.windows.update(windowId, { focused: true });
                await chrome.tabs.remove(tabId);
                ctx.runSideEffect(async () => {
                  await chrome.runtime.sendMessage({ type: TAB_DEDUP_FLASH, tabId: found });
                });
                return;
              } catch (err) {
                log.debug('navigation dedup: focus/close failed, adopting normally', {
                  tabId,
                  found,
                  err,
                });
              }
            }
          }
          ctx.store.onTabCreated({ id: tabId, windowId });
          await ctx.groups.groupNewTab(tabId, windowId);
        }
      }
      // Re-push boundary config when a BOUND tab finishes (re)loading (design
      // D6): a navigation spins up a fresh content-script instance that starts
      // disarmed, so an enforced tab must be re-armed. Skip non-enforced tabs —
      // a freshly-loaded script is already disarmed, so they need nothing.
      //
      // FLOATED off the drain's critical path (like `openSavedTab`'s arm):
      // `configureBoundary` awaits `chrome.scripting.executeScript`, which can
      // block for *seconds* against a still-busy page (e.g. a heavy SPA). Awaiting
      // it here gated THIS drain's persist+broadcast — so the `status: 'complete'`
      // that `syncLiveTab` already wrote to the store above was not broadcast until
      // the injection settled, leaving the bound tab's sidebar row (favicon-row /
      // pinned) spinning until an unrelated event (e.g. a tab switch) forced a
      // broadcast. Re-arming a frame later is harmless; stalling the status
      // broadcast was the bug.
      if (changeInfo.status === 'complete') {
        const boundSavedId = savedTabIdForBoundTab(ctx.store.state, tabId);
        const boundSaved = boundSavedId ? ctx.store.state.savedTabs[boundSavedId] : undefined;
        if (
          boundSaved &&
          resolveBoundaryAllow(
            boundSaved.boundary,
            boundSaved.originalURL,
            ctx.boundary.effectiveBoundaryDefault(boundSaved),
          ) !== null
        ) {
          ctx.runSideEffect(() => ctx.boundary.configureBoundary(tabId, boundSaved));
        }
        // Re-arm smart item boundary on page load (smart-tab-boundary): each
        // navigation spins up a fresh content-script context that starts disarmed.
        for (const byItem of Object.values(ctx.store.state.smartItemBindings)) {
          for (const slots of Object.values(byItem)) {
            for (const slot of Object.values(slots)) {
              if (slot.tabId === tabId && slot.allowGlob) {
                ctx.runSideEffect(() =>
                  ctx.boundary.configureSmartItemBoundary(slot.tabId, slot.allowGlob),
                );
              }
            }
          }
        }
      }
      ctx.markDirty();
    },
    'tabs.onActivated': async (ctx, event) => {
      const { activeInfo } = event.payload;
      // Navigating to another tab consumes the feed entry you were on
      // (rss-connector, the draining queue): the store marks it read and returns
      // its bound tab(s) to CLOSE (consume = close — no tab trail).
      const consumed = ctx.store.setActiveTab(activeInfo.windowId, activeInfo.tabId);
      for (const tabId of consumed) ctx.runSideEffect(() => closeTab(tabId));
      // The focused tab's Space is always the Space on screen
      // (focused-tab-switches-space, design D1). When the activated tab has an
      // owning Space in this window that differs from the window's active Space,
      // switch to it — the same store-activation + group-orchestration sequence a
      // manual switch runs. `activateSpaceInWindow` no-ops for a same-Space owner
      // (the common case) and `spaceOwningTab` returns `null` for global favorites
      // / ungrouped tabs, so neither switches. The re-fired `onActivated` from the
      // switch's own focus-tab activation lands on a tab now in the active Space →
      // owner equals active Space → the helper no-ops: one switch per activation
      // (D4). Caller-agnostic — fixes launcher, sidebar, Chrome tab strip, and
      // keyboard at once, since they all funnel through this event.
      const owningSpace = spaceOwningTab(ctx.store.state, activeInfo.windowId, activeInfo.tabId);
      if (
        owningSpace !== null &&
        owningSpace !== ctx.store.state.activeSpaceByWindow[activeInfo.windowId]
      ) {
        await activateSpaceInWindow(ctx, activeInfo.windowId, owningSpace);
      }
      ctx.markDirty();
    },
  };
}
