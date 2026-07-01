// Chrome tab-lifecycle handlers (split-coordinator-handlers): the four
// `tabs.*` events. Handler bodies are verbatim moves of the former coordinator
// closures — `this.store` → `ctx.store`, `this.dirty = true` → `ctx.markDirty()`,
// group/boundary helpers → `ctx.groups.*` / `ctx.boundary.*`, read predicates →
// `./queries`.

import { TAB_DEDUP_FLASH } from '../../shared/bus';
import { log } from '../../shared/logger';
import { isLensPageUrl, isNewTabUrl } from '../../shared/new-tab';
import { resolveBoundaryAllow } from '../../shared/url-boundary';
import { forgetPageOpenedTab, isPageOpenedTab } from '../page-opened-tabs';
import { closeTab } from '../tab-groups';
import { activateSpaceInWindow } from './activation';
import type { HandlersMap } from './context';
import { consumePendingDuplicateTab } from './pending-duplicate-tabs';
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
      // A smart-folder page is a Lunma-managed view (smart-folder-page), not a
      // browsing tab — grouped with its Space by `openSmartFolderPage`, but never
      // adopted into the Temporary list. Treated like `isHome` for adoption.
      const isLensPage = isLensPageUrl(tab.url) || isLensPageUrl(tab.pendingUrl);
      if (!isHome && !isLensPage) {
        // Direct-URL creation dedup (tab-dedup): a tab born with its target URL
        // already populated (`tab.url` or, mid-navigation, `tab.pendingUrl`) never
        // reaches the `tabs.onUpdated` first-navigation dedup path below, because
        // `ctx.store.onTabCreated` (a few lines down) marks it tracked immediately —
        // this is the gap that path leaves for external-app "open in Chrome"
        // handoffs. Deliberately UNSCOPED by gesture: a live empirical test (real
        // built extension, Playwright-driven Chromium, every gesture including a
        // no-opener CDP Target.createTarget call) showed `openerTabId` is present
        // for every new tab landing in an existing window regardless of how it was
        // created, so it cannot distinguish "external app" from "in-page gesture" —
        // see design.md (fix-direct-url-tab-dedup) Decision 1. So this dedupes
        // middle-click/target="_blank"/window.open/"open in new window" too, not
        // just external handoffs — a disclosed, intentional behaviour change from
        // the previous blanket exclusion.
        //
        // The ONE exclusion: a tab created via chrome.tabs.duplicate (the
        // `duplicateTab` handler in temp-tabs.ts) must never be caught here — it's
        // the deliberate "give me a second tab of this page" action, and its clone's
        // URL is by definition identical to its still-open source tab's URL (always
        // an exact match). `duplicateTab` records the source's (windowId, url) via
        // `markPendingDuplicateTab` BEFORE calling `chrome.tabs.duplicate`;
        // `consumePendingDuplicateTab` here recognises and consumes that record.
        //
        // `about:blank` is excluded too: it is Chrome's placeholder for "not yet
        // navigated" (any freshly-blank tab reports it, including Ctrl+T, a tab
        // opened with no `url`, or a tool creating one for later use), not a
        // destination a user is deliberately reopening. `isNewTabUrl` does not
        // match it — that only covers Lunma's/Chrome's actual new-tab-override
        // URLs — so without this it collapses every second blank tab into the
        // first, defeating "open a new blank tab" entirely.
        const resolvedUrl = tab.url || tab.pendingUrl;
        if (
          resolvedUrl &&
          resolvedUrl !== 'about:blank' &&
          ctx.dedupNewTabNavigations() &&
          !consumePendingDuplicateTab(tab.windowId, resolvedUrl)
        ) {
          const found = findTabInActiveSpace(ctx.store.state, tab.windowId, resolvedUrl);
          if (found !== null && tab.id !== undefined) {
            try {
              await chrome.tabs.update(found, { active: true });
              await chrome.windows.update(tab.windowId, { focused: true });
              await chrome.tabs.remove(tab.id);
              ctx.runSideEffect(async () => {
                await chrome.runtime.sendMessage({ type: TAB_DEDUP_FLASH, tabId: found });
              });
              return;
            } catch (err) {
              log.debug('onCreated dedup: focus/close failed, adopting normally', {
                tabId: tab.id,
                found,
                err,
              });
            }
          }
        }
        ctx.store.onTabCreated({ id: tab.id, windowId: tab.windowId });
      }
      ctx.store.syncLiveTab({
        id: tab.id,
        windowId: tab.windowId,
        title: tab.title,
        // A tab opened with a target URL reports `url: ''` until the navigation
        // commits, carrying the target in `pendingUrl` meanwhile (same reason the
        // home check above reads both). Mirror `pendingUrl` so a tab pinned before
        // its first commit still records its real `originalURL` instead of '' —
        // `onUpdated` overwrites with the committed URL when it lands.
        url: tab.url || tab.pendingUrl,
        active: tab.active,
        status: tab.status,
        favIconUrl: tab.favIconUrl,
      });
      if (isHome) {
        await ctx.groups.groupHomeTab(tab.id, tab.windowId);
      } else if (!isLensPage) {
        // The folder page is already grouped into its Space by openSmartFolderPage
        // (which knows the folder's owning Space) — don't regroup into the active
        // Space here, which may differ.
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
      // Was this item opened from the folder page? (Checked before the binding is
      // dropped/forgotten below.) If so, its close returns to the page rather
      // than auto-advancing (smart-folder-page).
      const openedFromPage = isPageOpenedTab(tabId);
      ctx.store.onTabRemoved(tabId, {
        windowId: info.windowId,
        isWindowClosing: info.isWindowClosing,
      });
      ctx.store.removeLiveTab(tabId);
      // When the overview tab is closed, drop its tracking so the lens row stops
      // showing active (lens-overview-peek).
      ctx.store.clearLensPeekForTab(tabId);
      forgetPageOpenedTab(tabId);
      ctx.markDirty();
      // Auto-advance: open the next unread feed item in the same section — but
      // ONLY for items opened from the sidebar reading flow. An item opened from
      // the folder page returns to the page on close, never the next item.
      if (advance && !openedFromPage) {
        ctx.enqueue({
          source: 'sidebar',
          kind: 'openLensItem',
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
        !isLensPageUrl(changeInfo.url) &&
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
        for (const byItem of Object.values(ctx.store.state.lensItemBindings)) {
          for (const slots of Object.values(byItem)) {
            for (const slot of Object.values(slots)) {
              if (slot.tabId === tabId && slot.allowGlob) {
                ctx.runSideEffect(() =>
                  ctx.boundary.configureLensItemBoundary(slot.tabId, slot.allowGlob),
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
