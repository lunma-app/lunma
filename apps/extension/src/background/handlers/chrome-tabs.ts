// Chrome tab-lifecycle handlers (split-coordinator-handlers): the four
// `tabs.*` events. Handler bodies are verbatim moves of the former coordinator
// closures — `this.store` → `ctx.store`, `this.dirty = true` → `ctx.markDirty()`,
// group/boundary helpers → `ctx.groups.*` / `ctx.boundary.*`, read predicates →
// `./queries`.

import { TAB_DEDUP_FLASH } from '../../shared/bus';
import { log } from '../../shared/logger';
import { isLensPageUrl, isNewTabUrl } from '../../shared/new-tab';
import { resolveBoundaryAllow } from '../../shared/url-boundary';
import { clearInitialLoad, isInitialLoad, markInitialLoad } from '../initial-load-tabs';
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
        // Redirect-chain tab dedup: mark this tab as still mid-initial-load
        // regardless of what happens below — a tab that turns out to be a
        // dedup match gets closed shortly (which cleans this up via
        // `tabs.onRemoved`), and a tab that gets tracked normally stays
        // eligible for the `tabs.onUpdated` dedup check below until its
        // first `status: 'complete'`, covering a tab created at (or later
        // redirected through) an intermediate URL — e.g. a corporate mail/
        // security link-rewriter — that only reaches its real destination
        // after this creation event.
        if (tab.id !== undefined) markInitialLoad(tab.id);
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
        // an exact match). `duplicateTab` records the source's (windowId, url,
        // tabId) via `markPendingDuplicateTab` BEFORE calling `chrome.tabs.duplicate`;
        // `consumePendingDuplicateTab` here recognises and consumes that record,
        // returning the SOURCE tab's id — consumed unconditionally (not gated on
        // `dedupNewTabNavigations`, unlike the dedup lookup below), since a
        // duplicate's placement (see `duplicateSourceTabId` below) is a separate
        // concern from whether dedup itself is enabled.
        //
        // `about:blank` is excluded too: it is Chrome's placeholder for "not yet
        // navigated" (any freshly-blank tab reports it, including Ctrl+T, a tab
        // opened with no `url`, or a tool creating one for later use), not a
        // destination a user is deliberately reopening. `isNewTabUrl` does not
        // match it — that only covers Lunma's/Chrome's actual new-tab-override
        // URLs — so without this it collapses every second blank tab into the
        // first, defeating "open a new blank tab" entirely.
        const resolvedUrl = tab.url || tab.pendingUrl;
        const duplicateSourceTabId = resolvedUrl
          ? consumePendingDuplicateTab(tab.windowId, resolvedUrl)
          : null;
        if (
          duplicateSourceTabId === null &&
          resolvedUrl &&
          resolvedUrl !== 'about:blank' &&
          ctx.dedupNewTabNavigations()
        ) {
          const found = findTabInActiveSpace(ctx.store.state, tab.windowId, resolvedUrl);
          if (found === null) {
            // Diagnostic only (no behavior change): logs the exact URL Chrome
            // reported at creation time whenever a dedup check runs but finds
            // no match — the fastest way to tell "the URL genuinely isn't open
            // elsewhere" apart from "a link-rewriting layer (e.g. a corporate
            // mail/security proxy) changed the URL before it reached us, so the
            // exact-match lookup can't find the already-open tab." Compare
            // `resolvedUrl` here against the URL shown in an already-open tab
            // for the same destination.
            log.debug('onCreated dedup: no match found, adopting normally', {
              tabId: tab.id,
              windowId: tab.windowId,
              resolvedUrl,
            });
          }
          if (found !== null && tab.id !== undefined) {
            try {
              await chrome.tabs.update(found, { active: true });
              await chrome.windows.update(tab.windowId, { focused: true });
              await chrome.tabs.remove(tab.id);
              // dedup-moves-tab-to-top: promote the reused tab like a fresh one.
              // This mutates tempTabIds directly (not driven by the tabs.onActivated/
              // onRemoved this focus/close fires), so it needs its own markDirty.
              if (ctx.dedupMovesTabToTop()) {
                const activeSpaceId = ctx.store.state.activeSpaceByWindow[tab.windowId];
                if (activeSpaceId != null) {
                  ctx.store.promoteTempTab(tab.windowId, activeSpaceId, found);
                  ctx.markDirty();
                }
              }
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
        // duplicate-tab-adjacent-placement: a duplicateTab clone is inserted
        // immediately after its source instead of the ordinary newest-first
        // top-of-list every other new tab gets.
        if (duplicateSourceTabId !== null && tab.id !== undefined) {
          ctx.store.insertTempTabAfter(tab.windowId, duplicateSourceTabId, tab.id);
        } else {
          ctx.store.onTabCreated({ id: tab.id, windowId: tab.windowId });
        }
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
      // Redirect-chain tab dedup: bounded cleanup for a tab that closes (via
      // dedup or otherwise) before ever reaching `status: 'complete'`.
      clearInitialLoad(tabId);
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
        changeInfo.favIconUrl === undefined &&
        changeInfo.groupId === undefined
      ) {
        return;
      }
      // Redirect-chain tab dedup: capture BEFORE this event's own `complete`
      // (if any) clears it below — a hop that both lands on the real
      // destination AND completes in the same coalesced event must still be
      // read as "was mid-initial-load" for the eligibility check further down.
      const wasInitialLoad = isInitialLoad(tabId);
      // Mid-session ownership follow (preserve-user-tab-groups D6): a tab's
      // Chrome group changed — reconcile Space ownership BEFORE the
      // url/status/title/favIconUrl handling below (which is independent of
      // this and may itself run in the same coalesced event).
      if (changeInfo.groupId !== undefined) {
        ctx.store.onTabGroupIdChanged(tabId, changeInfo.groupId);
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
      // transition: an untracked tab whose new URL is not a newtab URL —
      // adopt it into the active Space's Temporary list and ensure it is
      // grouped. A BOUND (pinned) tab is always excluded — its navigation is
      // never "adopt as temporary," regardless of load state.
      //
      // Redirect-chain tab dedup: also re-enter for a tab that IS already
      // tracked as temporary, as long as it hasn't reached `status: 'complete'`
      // even once since creation (`wasInitialLoad`) — a tab born at (or
      // redirected through) an intermediate URL is tracked immediately at
      // `tabs.onCreated`, which otherwise makes it permanently ineligible for
      // this dedup check the moment it lands, even though its real
      // destination hasn't loaded yet. `ctx.store.onTabCreated`/
      // `ctx.groups.groupNewTab` below are idempotent no-ops for a tab
      // that's already tracked/grouped, so re-entering here for that case is
      // safe — only the dedup lookup does new work.
      const isBound = savedTabIdForBoundTab(ctx.store.state, tabId) !== undefined;
      if (
        changeInfo.url !== undefined &&
        !isNewTabUrl(changeInfo.url) &&
        !isLensPageUrl(changeInfo.url) &&
        !isBound &&
        (!isTrackedTab(ctx.store.state, tabId) || wasInitialLoad)
      ) {
        const navigatedUrl = changeInfo.url;
        const windowId = ctx.store.state.liveTabsById[tabId]?.windowId;
        if (windowId !== undefined) {
          // Navigation dedup (navigation-tab-dedup): the address-bar counterpart
          // to the launcher's `openUrl` dedup. A tab's navigation to a URL
          // already open in this window's active Space focuses the existing
          // tab and closes this one, instead of adopting a duplicate — eligible
          // either while the tab is still fully untracked (a blank new tab
          // committing its first real URL) or, per the redirect-chain
          // eligibility above, anywhere within its initial load chain. Gated by
          // the cached `dedupNewTabNavigations` mirror; reuses
          // `findTabInActiveSpace` + the `tab-dedup` flash (current window, active
          // Space, exact match — never cross-window/Space). Wrapped in try/catch
          // so any failure (existing tab just closed, focus rejected) falls
          // through to normal adoption — a tab is never lost. No `markDirty` for the
          // focus/close itself: `tabs.onActivated`/`onRemoved` reconcile that state,
          // exactly like the `openUrl` dedup. The optional tab-to-top promotion
          // below mutates `tempTabIds` directly, so it calls `markDirty` itself.
          if (ctx.dedupNewTabNavigations()) {
            const found = findTabInActiveSpace(ctx.store.state, windowId, navigatedUrl, tabId);
            if (found === null) {
              // Diagnostic only (no behavior change) — see the matching log in
              // the onCreated-time dedup check above for what to look for.
              log.debug('navigation dedup: no match found, adopting normally', {
                tabId,
                windowId,
                navigatedUrl,
              });
            }
            if (found !== null && found !== tabId) {
              try {
                await chrome.tabs.update(found, { active: true });
                await chrome.windows.update(windowId, { focused: true });
                await chrome.tabs.remove(tabId);
                // dedup-moves-tab-to-top: promote the reused tab like a fresh one.
                if (ctx.dedupMovesTabToTop()) {
                  const activeSpaceId = ctx.store.state.activeSpaceByWindow[windowId];
                  if (activeSpaceId != null) {
                    ctx.store.promoteTempTab(windowId, activeSpaceId, found);
                    ctx.markDirty();
                  }
                }
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
        // Redirect-chain tab dedup: this tab has now reached its first
        // completed load — it's no longer within an initial load chain, so a
        // LATER re-navigation is ordinary browsing, not eligible for dedup.
        clearInitialLoad(tabId);
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
