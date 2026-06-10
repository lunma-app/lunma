// Tab-group / activation / home-tab orchestration subsystem, extracted from the
// coordinator (split-coordinator-handlers). Owns every `chrome.tabGroups` /
// `chrome.tabs` side effect required to materialize, reconcile, title, and
// collapse the Chrome groups that back Lunma Spaces, plus the home-tab
// reconciliation invariants. Method bodies are verbatim moves of the former
// `Coordinator` members; the former private read predicates now route through
// `./handlers/queries`. Constructed with the store.

import { log } from '../shared/logger';
import { isNewTabUrl } from '../shared/new-tab';
import type { LunmaStore } from '../shared/store.svelte';
import type { SpaceId, TabId, WindowId } from '../shared/types';
import { savedTabIdForBoundTab } from './handlers/queries';
import {
  activateTab,
  addTabToActiveGroup,
  collapseOtherTrackedGroups,
  ensureGroupForSpace,
  expandGroup,
  moveTabToStripStart,
  resolveGroup,
  ungroupTabs,
  updateGroupTitleColor,
} from './tab-groups';

export class GroupOrchestrator {
  constructor(private readonly store: LunmaStore) {}

  /**
   * The Space's tabs currently open in `windowId`: its temporary tabs
   * (`instance.tempTabIds` ∩ tabs Chrome still has in the window, per D4) plus
   * its bound (saved) tabs open in the window. Both belong to the Space's group
   * — a pinned tab is as much a member of its Space as a temp tab.
   */
  private tabIdsForSpaceInWindow(windowId: WindowId, spaceId: SpaceId): TabId[] {
    const s = this.store.state;
    const temp = (s.spaceInstancesByWindow[windowId]?.[spaceId]?.tempTabIds ?? []).filter(
      (id) => s.liveTabsById[id]?.windowId === windowId,
    );
    const bound = this.boundTabIdsForSpaceInWindow(windowId, spaceId);
    // Temp first (top of the group), then bound; de-dupe defensively.
    return [...new Set([...temp, ...bound])];
  }

  /** Bound (saved-tab) tab ids for `spaceId` that are currently open in `windowId`.
   * Per-window-tab-bindings: read each saved tab's slot for THIS window directly. */
  private boundTabIdsForSpaceInWindow(windowId: WindowId, spaceId: SpaceId): TabId[] {
    const s = this.store.state;
    const ids: TabId[] = [];
    for (const [savedTabId, slots] of Object.entries(s.tabBindings)) {
      const tabId = slots[windowId];
      if (tabId === undefined) continue;
      const saved = s.savedTabs[savedTabId];
      // A global favorite (`saved.spaceId === null`, favicon-row-model ADR 0010)
      // is INCIDENTALLY excluded here: `null !== <spaceId string>` is always
      // true, so a favorite is never a member of any Space's group set — exactly
      // the ungrouped/global behaviour we want, handled by exclusion (D8).
      if (!saved || saved.spaceId !== spaceId) continue;
      if (s.liveTabsById[tabId]?.windowId !== windowId) continue;
      ids.push(tabId);
    }
    return ids;
  }

  /**
   * Add `tabId` to `spaceId`'s Chrome group in `windowId`. When the Space has a
   * live group, the tab is added to it. When it does NOT (e.g. the Space was
   * never activated this session, so it has open tabs but no materialized group —
   * the boot state), the group is built from the Space's WHOLE window tab set
   * (its existing temp + bound tabs PLUS this tab), not just this lone tab — so a
   * `Cmd+T` before the group exists groups the new tab together with its siblings
   * instead of spawning a one-tab group. Shared by `groupNewTab` (new temp tab)
   * and `openSavedTab` (opened pinned tab).
   */
  async addTabToSpaceGroup(windowId: WindowId, spaceId: SpaceId, tabId: TabId): Promise<void> {
    const existingGroupId =
      this.store.state.spaceInstancesByWindow[windowId]?.[spaceId]?.groupId ?? -1;
    if (existingGroupId >= 0) {
      // Live group → add the tab to it. A non-null return means it landed in the
      // group; null means the group was stale, so fall through to a rebuild.
      const added = await addTabToActiveGroup(windowId, tabId, existingGroupId);
      if (added !== null) return;
    }
    // No live group (or it was stale) → materialize from the Space's full window
    // tab set so the existing tabs join too.
    const tabIds = this.tabIdsForSpaceInWindow(windowId, spaceId);
    if (!tabIds.includes(tabId)) tabIds.push(tabId);
    const rebuilt = await ensureGroupForSpace(windowId, tabIds);
    if (rebuilt !== null) {
      this.store.recordSpaceGroup(windowId, spaceId, rebuilt);
      await this.applyGroupIdentity(spaceId, rebuilt);
    }
  }

  /**
   * True when the window's currently-selected Chrome tab is a bound GLOBAL
   * favorite (`savedTabs[id].spaceId === null`). Drives `orchestrateActivation`'s
   * focus-preservation on a Space switch (sidebar-favicon-row): a favorite belongs
   * to no Space, so switching Space should leave it selected rather than yank focus
   * into the incoming Space. Authoritative (queries Chrome for the active tab).
   */
  private async activeTabIsGlobalFavorite(windowId: WindowId): Promise<boolean> {
    let tabs: chrome.tabs.Tab[] = [];
    try {
      tabs = await chrome.tabs.query({ windowId, active: true });
    } catch (err) {
      log.debug('activeTabIsGlobalFavorite: query failed', { windowId, err });
      return false;
    }
    const activeId = tabs[0]?.id;
    if (activeId === undefined) return false;
    const savedId = savedTabIdForBoundTab(this.store.state, activeId);
    if (savedId === undefined) return false;
    return this.store.state.savedTabs[savedId]?.spaceId === null;
  }

  /**
   * Enforce the favorite ungroup invariant (favicon-row-model, ADR 0010 D3): a
   * bound `spaceId === null` favorite's live tab is left **ungrouped** (global),
   * so it is never collapsed when other Spaces' groups hide and stays visible
   * across every Space switch. Idempotent and best-effort.
   */
  async ensureFavoriteUngrouped(tabId: TabId): Promise<void> {
    await ungroupTabs(tabId);
    // Park the now-global tab at the tab-strip start (design D10). Ungrouping
    // alone leaves it adjacent to its former Space group, so a later Space switch
    // that collapses that group reads as hiding the favorite ("disappears on
    // switch"); moving it outside every group keeps it visible across switches.
    await moveTabToStripStart(tabId);
  }

  /** Every Lunma-tracked (live) group id in `windowId` — the only groups the
   * coordinator may collapse/expand. User-created groups are never in this set. */
  private trackedGroupIdsForWindow(windowId: WindowId): number[] {
    const map = this.store.state.spaceInstancesByWindow[windowId];
    if (!map) return [];
    return Object.values(map)
      .map((instance) => instance.groupId)
      .filter((groupId) => groupId >= 0);
  }

  /**
   * The D3 activation sequence (shared by `activateSpace` + `createSpace`). The
   * store has already set the active Space and ensured its instance; this runs
   * the `chrome.tabGroups` side effects:
   *   (a) reconcile/create the target group (reuse live `groupId`, else rebuild),
   *   (b) ensure a focusable tab (open one if the Space has none in the window),
   *   (c) activate a tab in the target group so focus leaves the outgoing group,
   *   (d) expand the target group and collapse every other tracked group.
   * `recordSpaceGroup` persists any freshly-created id. No persist/broadcast here
   * — the caller's drain tail does that once.
   *
   * `preserveFavoriteFocus` (set only by the `activateSpace` *switch* path, NOT
   * by create/new-tab which deliberately land in the target) keeps a SELECTED
   * global favorite focused across the switch (sidebar-favicon-row): a favorite
   * belongs to no Space, so it stays visible regardless of which Space is active.
   * When the window's active tab is such a favorite, steps (b) + (c) are skipped
   * — focus is NOT moved and an empty incoming Space spawns NO home tab; it
   * materializes its focusable tab lazily the next time it actually receives
   * focus. Steps (a) + (d) still run, so the sidebar/strip reflect the new active
   * Space. Applies ONLY to favorites; a regular selected tab switches normally.
   */
  async orchestrateActivation(
    windowId: WindowId,
    spaceId: SpaceId,
    outgoingSpaceId?: SpaceId,
    preserveFavoriteFocus = false,
  ): Promise<void> {
    const keepFavoriteFocus =
      preserveFavoriteFocus && (await this.activeTabIsGlobalFavorite(windowId));
    const instance = this.store.state.spaceInstancesByWindow[windowId]?.[spaceId];
    const persistedGroupId = instance?.groupId ?? -1;

    // (a) Reconcile the target group: reuse it if the persisted id still resolves
    // in this window, else rebuild from the Space's reconciled tab set.
    const live = await resolveGroup(persistedGroupId, windowId);
    let groupId = live ? live.id : -1;
    let tabIds = this.tabIdsForSpaceInWindow(windowId, spaceId);

    if (!live && tabIds.length > 0) {
      const rebuilt = await ensureGroupForSpace(windowId, tabIds);
      if (rebuilt !== null) {
        groupId = rebuilt;
        this.store.recordSpaceGroup(windowId, spaceId, rebuilt);
      }
    }

    // (b) Ensure the active Space shows EXACTLY ONE focusable tab — its Lunma
    // home — when it has no open tabs. AUTHORITATIVE + idempotent: ask Chrome
    // which home tabs the window actually has right now, rather than the
    // `liveTabsById` mirror (which trails Chrome by however many drains the tab
    // lifecycle events take to arrive — a mirror-based reuse check races, so it
    // could both MISS a live home tab and spawn a duplicate, and never collapse
    // the duplicates it spawned). Reuse one (the active/focused one), CLOSE any
    // extras (self-healing the "≤1 home tab per window" invariant after a prior
    // race), and open one only when the window has none. A reused/created home
    // tab is NOT a temporary tab — it joins the group but is never listed.
    let reusedHomeTabId: TabId | undefined;
    if (tabIds.length === 0 && !keepFavoriteFocus) {
      const homeTabs = await this.homeTabIdsInWindow(windowId);
      const extras = homeTabs.slice(1);
      if (extras.length > 0) {
        try {
          await chrome.tabs.remove(extras);
        } catch (err) {
          log.error('orchestrateActivation: closing duplicate home tabs failed', {
            windowId,
            extras,
            err,
          });
        }
      }
      const tabToUse = homeTabs[0] ?? (await this.openTabInWindow(windowId));
      if (tabToUse !== undefined) {
        const grouped = await ensureGroupForSpace(
          windowId,
          [tabToUse],
          groupId >= 0 ? groupId : undefined,
        );
        if (grouped !== null) {
          groupId = grouped;
          this.store.recordSpaceGroup(windowId, spaceId, grouped);
        }
        tabIds = [tabToUse];
        // Exclude it from the outgoing-home close below — whether it was reused
        // (it may belong to the outgoing group) or freshly created.
        reusedHomeTabId = tabToUse;
      }
    }

    if (groupId < 0) {
      // Could not materialize the incoming group — still tidy the outgoing
      // home-only tab so leaving an empty Space doesn't strand a blank tab.
      await this.closeOutgoingHomeIfEmpty(windowId, outgoingSpaceId, spaceId, reusedHomeTabId);
      return;
    }

    // Title + colour the group with the Space's identity (proposal: activation
    // "title it with the Space's name + colour"). Best-effort here — a titling
    // failure must not abort the activation (unlike the rename path).
    await this.applyGroupIdentity(spaceId, groupId);

    // (c) Move focus into the target group (Chrome refuses to collapse a group
    // holding the active tab) — UNLESS we are preserving a selected global
    // favorite's focus (it is ungrouped, so the collapse in (d) never holds it).
    const focusTabId = tabIds[0];
    if (focusTabId !== undefined && !keepFavoriteFocus) await activateTab(focusTabId);

    // Close the outgoing Space's home-only tab (if any), so empty Spaces don't
    // accumulate blank tabs — but never the tab the incoming Space just reused.
    await this.closeOutgoingHomeIfEmpty(windowId, outgoingSpaceId, spaceId, reusedHomeTabId);

    // (d) Expand the target group and collapse every other tracked group.
    await expandGroup(groupId);
    await collapseOtherTrackedGroups(windowId, groupId, this.trackedGroupIdsForWindow(windowId));
  }

  /**
   * Every home tab (Lunma new-tab page) actually open in `windowId` right now,
   * queried straight from Chrome — NOT from the `liveTabsById` mirror, which
   * trails Chrome by however many drains the tab lifecycle events take to
   * arrive. Empty-Space activation reconciles against this authoritative set
   * (D4 "reuse on enter"): it reuses the first id and closes the rest, so the
   * window converges on the "≤1 home tab per window" invariant even after a
   * race spawned a duplicate. The active tab sorts first, so the kept home tab
   * is the one the user is looking at. Recognises a fresh NTP by either `url` or
   * `pendingUrl` (Chrome may surface either while it loads).
   */
  private async homeTabIdsInWindow(windowId: WindowId): Promise<TabId[]> {
    let tabs: chrome.tabs.Tab[] = [];
    try {
      tabs = await chrome.tabs.query({ windowId });
    } catch (err) {
      log.error('homeTabIdsInWindow query failed', { windowId, err });
      return [];
    }
    return tabs
      .filter(
        (t): t is chrome.tabs.Tab & { id: number } =>
          t.id !== undefined && (isNewTabUrl(t.url) || isNewTabUrl(t.pendingUrl)),
      )
      .sort((a, b) => Number(b.active ?? false) - Number(a.active ?? false))
      .map((t) => t.id);
  }

  /** The id of ANY home tab open in `windowId` (active or not), or `undefined`.
   * Used by the New Tab affordance to reuse an existing unused home tab rather
   * than spawning a second one. There is normally at most one home tab per
   * window (close-on-leave keeps it so). */
  homeTabIdInWindow(windowId: WindowId): TabId | undefined {
    for (const t of Object.values(this.store.state.liveTabsById)) {
      if (t.windowId === windowId && isNewTabUrl(t.url)) return t.tabId;
    }
    return undefined;
  }

  /**
   * Close the outgoing Space's home tab(s) when leaving a Space whose ONLY tab
   * in the window is its home (D4 "close on leave"). A home-only Space has no
   * temp/bound tabs but a live group holding the home tab; closing it dissolves
   * the group, and we reset the instance to `groupId === -1` (truly empty), so
   * visiting N empty Spaces never leaves N blank tabs behind. Skips the tab the
   * incoming Space reused, and never touches a Space with real tabs (a
   * navigated-away tab is no longer a home tab, so it is never auto-closed).
   */
  private async closeOutgoingHomeIfEmpty(
    windowId: WindowId,
    outgoingSpaceId: SpaceId | undefined,
    incomingSpaceId: SpaceId,
    reusedHomeTabId: TabId | undefined,
  ): Promise<void> {
    if (outgoingSpaceId === undefined || outgoingSpaceId === incomingSpaceId) return;
    const outInstance = this.store.state.spaceInstancesByWindow[windowId]?.[outgoingSpaceId];
    if (!outInstance || outInstance.groupId < 0) return;
    // Real (temp/bound) tabs → not home-only → leave the Space intact.
    if (this.tabIdsForSpaceInWindow(windowId, outgoingSpaceId).length > 0) return;
    // The outgoing group holds only home tab(s). Close them (excluding any the
    // incoming Space reused) and reset the instance to "no live group".
    let groupTabs: chrome.tabs.Tab[] = [];
    try {
      groupTabs = await chrome.tabs.query({ groupId: outInstance.groupId });
    } catch (err) {
      log.debug('closeOutgoingHomeIfEmpty: group query failed', { outgoingSpaceId, err });
    }
    const ids = groupTabs
      .map((t) => t.id)
      .filter((id): id is TabId => id !== undefined && id !== reusedHomeTabId);
    if (ids.length > 0) {
      try {
        await chrome.tabs.remove(ids);
      } catch (err) {
        log.error('closeOutgoingHomeIfEmpty: close failed', { outgoingSpaceId, ids, err });
      }
    }
    this.store.recordSpaceGroup(windowId, outgoingSpaceId, -1);
  }

  /**
   * Add a freshly-created temp tab to its window's active Space group
   * (`tabs.onCreated`, task 3.1). Only acts on tabs the store actually tracks as
   * temporary (unbound) for the active Space — a bound/saved tab is never
   * grouped here, and a tab in a window with no active Space is left alone.
   * Creates the group from this tab when it is the Space's first.
   */
  async groupNewTab(tabId?: TabId, windowId?: WindowId): Promise<void> {
    if (tabId === undefined || windowId === undefined) return;
    const s = this.store.state;
    const spaceId = s.activeSpaceByWindow[windowId];
    if (spaceId === null || spaceId === undefined) return;
    const instance = s.spaceInstancesByWindow[windowId]?.[spaceId];
    if (!instance) return;
    if (!instance.tempTabIds.includes(tabId)) return;
    await this.addTabToSpaceGroup(windowId, spaceId, tabId);
  }

  /**
   * Group a freshly-created HOME tab into its window's active Space group
   * (`tabs.onCreated` for a home tab — the Lunma new-tab page). Unlike
   * {@link groupNewTab} this does NOT require the tab to be in `tempTabIds` (a
   * home tab is never a temporary tab); it is grouped so the window shows it but
   * stays unlisted. No-op when the window has no active Space / instance.
   */
  async groupHomeTab(tabId?: TabId, windowId?: WindowId): Promise<void> {
    if (tabId === undefined || windowId === undefined) return;
    const s = this.store.state;
    const spaceId = s.activeSpaceByWindow[windowId];
    if (spaceId === null || spaceId === undefined) return;
    const instance = s.spaceInstancesByWindow[windowId]?.[spaceId];
    if (!instance) return;
    await this.addTabToSpaceGroup(windowId, spaceId, tabId);
  }

  /**
   * Best-effort retitle + recolour of a single live group with its Space's
   * identity (used when a group is created during activation / first-tab
   * grouping). Swallows failures — titling must never abort the operation that
   * created the group. The rename/recolour path uses {@link propagateGroupIdentity}
   * instead, which DOES throw so it can revert.
   */
  private async applyGroupIdentity(spaceId: SpaceId, groupId: number): Promise<void> {
    if (groupId < 0) return;
    const space = this.store.state.spaces.find((s) => s.id === spaceId);
    if (!space) return;
    try {
      await updateGroupTitleColor(groupId, space.name, space.color);
    } catch (err) {
      log.debug('applyGroupIdentity failed (best-effort)', { spaceId, groupId, err });
    }
  }

  /**
   * Retitle + recolour the Space's live group in EVERY window where it is
   * instantiated (rename / recolour propagation, task 4.1 / D6).
   *
   * Each instance's persisted `groupId` is first reconciled against Chrome via
   * {@link resolveGroup}: a **stale** id (group dissolved by a restart, the user
   * ungrouped it, or it migrated windows) resolves to `null` and is SKIPPED —
   * the Space's identity is re-applied to that group when it is next
   * (re)materialized on activation. Only a genuine `chrome.tabGroups.update`
   * failure on a **live** group throws, so the caller's rename/recolour revert
   * still fires for the case that actually risks state↔Chrome drift. Without this
   * guard a stale id made `update` reject, reverting the user's colour/name
   * change even though no live group existed to drift (the recolour bug).
   */
  async propagateGroupIdentity(spaceId: SpaceId): Promise<void> {
    const s = this.store.state;
    const space = s.spaces.find((sp) => sp.id === spaceId);
    if (!space) return;
    for (const [windowKey, map] of Object.entries(s.spaceInstancesByWindow)) {
      const instance = map?.[spaceId];
      if (!instance || instance.groupId < 0) continue;
      const live = await resolveGroup(instance.groupId, Number(windowKey));
      if (!live) continue; // stale group → re-titled on next activation
      await updateGroupTitleColor(live.id, space.name, space.color);
    }
  }

  /** Every live (≥0) group id for `spaceId` across all windows — captured before
   * a delete so the groups can be closed after the store drops the instances. */
  liveGroupIdsForSpace(spaceId: SpaceId): number[] {
    const ids: number[] = [];
    for (const map of Object.values(this.store.state.spaceInstancesByWindow)) {
      const instance = map?.[spaceId];
      if (instance && instance.groupId >= 0) ids.push(instance.groupId);
    }
    return ids;
  }

  /** Open a fresh tab in `windowId`; returns its id (or `undefined` on failure).
   * Factored out so the activation sequence's one `chrome.tabs.create` is easy to
   * fake in tests. */
  private async openTabInWindow(windowId: WindowId): Promise<TabId | undefined> {
    try {
      const tab = await chrome.tabs.create({ windowId });
      return tab.id;
    } catch (err) {
      log.error('openTabInWindow failed', { windowId, err });
      return undefined;
    }
  }
}
