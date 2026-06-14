import { log } from '../shared/logger';
import type { TabId, WindowId } from '../shared/types';

/**
 * Thin, guarded wrappers over `chrome.tabGroups.*` / `chrome.tabs.group|ungroup`
 * / activation `chrome.tabs.update`. Per `spaces-and-tabs` "Space tab-group
 * orchestration" + design D5, ALL Chrome tab-group I/O lives here; the
 * coordinator composes these into the activation / create / rename / delete
 * sequences and owns the reconciliation decisions. Store mutators stay
 * synchronous and chrome-free.
 *
 * Each wrapper is guarded (D4): a missing or stale group — dissolved by a
 * browser restart, or the user ungrouped it — resolves to a benign no-op /
 * `null` rather than throwing, EXCEPT `updateGroupTitleColor`, which propagates
 * its error so the rename-atomicity revert (task 4.1) can fire.
 */

/** Sentinel for "no live Chrome group" — mirrors `chrome.tabGroups.TAB_GROUP_ID_NONE`
 * (`-1`) without referencing it at module eval (chrome may be undefined then). */
const NO_GROUP = -1;

/**
 * Map a Lunma `SpaceColor` to a `chrome.tabGroups.Color`. The nine `SpaceColor`
 * values are exactly Chrome's nine group colours, so every colour maps 1:1 — the
 * only spelling difference is Lunma's `gray` vs Chrome's `grey`. Anything
 * unrecognised → `grey`.
 */
export function toGroupColor(color: string): `${chrome.tabGroups.Color}` {
  switch (color) {
    case 'gray':
      return 'grey';
    case 'blue':
    case 'cyan':
    case 'green':
    case 'grey':
    case 'orange':
    case 'pink':
    case 'purple':
    case 'red':
    case 'yellow':
      return color;
    default:
      return 'grey';
  }
}

/**
 * Resolve a persisted `groupId` to its live Chrome group, but only if it still
 * exists AND lives in `windowId`. Returns `null` for the sentinel, for a group
 * that no longer resolves (restart dissolved it / user ungrouped it), or for a
 * group that has migrated to another window. The coordinator uses `null` as the
 * "rebuild from scratch" signal (D4).
 */
export async function resolveGroup(
  groupId: number,
  windowId: WindowId,
): Promise<chrome.tabGroups.TabGroup | null> {
  if (groupId === NO_GROUP) return null;
  try {
    const group = await chrome.tabGroups.get(groupId);
    if (group.windowId !== windowId) return null;
    return group;
  } catch {
    return null;
  }
}

/**
 * Group `tabIds` into a Chrome group: into the existing `groupId` when one is
 * supplied and live, else into a new group created in `windowId`. Returns the
 * resulting group id, or `null` when there is nothing to group / the call
 * failed. A Chrome group cannot be empty, so an empty `tabIds` is a no-op that
 * returns the passed-through `groupId` (or `null`).
 */
export async function ensureGroupForSpace(
  windowId: WindowId,
  tabIds: TabId[],
  groupId?: number,
): Promise<number | null> {
  if (tabIds.length === 0) return groupId !== undefined && groupId !== NO_GROUP ? groupId : null;
  try {
    const options: chrome.tabs.GroupOptions = {
      tabIds: tabIds as [TabId, ...TabId[]],
    };
    if (groupId !== undefined && groupId !== NO_GROUP) {
      options.groupId = groupId;
    } else {
      options.createProperties = { windowId };
    }
    return await chrome.tabs.group(options);
  } catch (err) {
    log.error('ensureGroupForSpace failed', { windowId, tabIds, groupId, err });
    return null;
  }
}

/**
 * Ungroup a single live tab (favicon-row-model, ADR 0010 D3): remove it from
 * whatever Chrome tab group it currently sits in, leaving it **global**
 * (`groupId === -1`). Best-effort like the other wrappers — a Chrome refusal
 * (a stale/closed tab, or one already ungrouped) is swallowed, never thrown.
 * Idempotent: ungrouping an already-ungrouped tab is a cheap no-op. Fronted by
 * the coordinator's `ensureFavoriteUngrouped`, which is the single path that
 * enforces "a bound `spaceId === null` favorite's live tab is ungrouped".
 */
export async function ungroupTabs(tabId: TabId): Promise<void> {
  try {
    await chrome.tabs.ungroup(tabId);
  } catch (err) {
    log.debug('ungroupTabs: ungroup refused (stale/closed/already ungrouped)', { tabId, err });
  }
}

/**
 * Park a tab at the start of its window's tab strip (`index: 0`), the
 * conventional favorites zone (sidebar-favicon-row D10). Pairs with
 * {@link ungroupTabs} in the coordinator's `ensureFavoriteUngrouped`: ungrouping
 * alone leaves the now-global tab sitting WHERE it was — immediately adjacent to
 * its former Space group's contiguous span — so a later Space switch that
 * collapses that group reads as sweeping the favorite under the collapse (it
 * appears to "disappear"). Moving it to the strip start puts it unambiguously
 * OUTSIDE every group, so no collapse can ever hide it. Chrome clamps `index: 0`
 * to just after any natively-pinned tabs. Best-effort — a refusal (stale/closed
 * tab) is swallowed, never thrown.
 */
export async function moveTabToStripStart(tabId: TabId): Promise<void> {
  try {
    await chrome.tabs.move(tabId, { index: 0 });
  } catch (err) {
    log.debug('moveTabToStripStart: move refused (stale/closed)', { tabId, err });
  }
}

/**
 * Close a tab, best-effort. The consume=close paths (rss-connector's draining
 * queue, and the pinned/smart consume floats) hand us a tab id the store just
 * marked consumed, then close it OFF the drain. By the time the float runs the
 * tab is often already gone — the user closed it manually (Chrome fires
 * `onActivated` for the next tab before `onRemoved` reconciles the binding), or
 * a concurrent path already removed it — so `chrome.tabs.remove` rejects with
 * `No tab with id: N`. That is the *desired* end-state, not an error: swallow it
 * at `debug`, never let it bubble to the coordinator's `SIDE_EFFECT_FAILED`.
 * Mirrors {@link ungroupTabs} / {@link moveTabToStripStart}.
 */
export async function closeTab(tabId: TabId): Promise<void> {
  try {
    await chrome.tabs.remove(tabId);
  } catch (err) {
    log.debug('closeTab: remove refused (stale/already closed)', { tabId, err });
  }
}

/**
 * Add a single (unbound) tab to its window's active Space group — into the
 * existing `groupId` when live, else into a new group. Returns the resulting
 * group id or `null`. Thin alias over {@link ensureGroupForSpace} for the
 * `tabs.onCreated` path (task 3.1).
 */
export async function addTabToActiveGroup(
  windowId: WindowId,
  tabId: TabId,
  groupId?: number,
): Promise<number | null> {
  return ensureGroupForSpace(windowId, [tabId], groupId);
}

/**
 * Focus a tab so Chrome will allow the outgoing group to collapse — Chrome
 * refuses to collapse a group that contains the active tab (D3 step c). Guarded:
 * a closed/stale tab logs and is skipped.
 */
export async function activateTab(tabId: TabId): Promise<void> {
  try {
    await chrome.tabs.update(tabId, { active: true });
  } catch (err) {
    log.error('activateTab failed', { tabId, err });
  }
}

/** Expand a group (the activated Space's group, D3 step d). No-op for the sentinel. */
export async function expandGroup(groupId: number): Promise<void> {
  if (groupId === NO_GROUP) return;
  try {
    await chrome.tabGroups.update(groupId, { collapsed: false });
  } catch (err) {
    log.error('expandGroup failed', { groupId, err });
  }
}

/**
 * Collapse every Lunma-tracked group in `windowId` except `keepGroupId`
 * (D3 step d). Only `trackedGroupIds` (the `groupId`s Lunma persists in
 * `spaceInstancesByWindow`) are touched — a user's own manually-created tab
 * group is NEVER collapsed. A group that has gone stale is skipped.
 */
export async function collapseOtherTrackedGroups(
  windowId: WindowId,
  keepGroupId: number,
  trackedGroupIds: number[],
): Promise<void> {
  for (const groupId of trackedGroupIds) {
    if (groupId === keepGroupId || groupId === NO_GROUP) continue;
    try {
      const group = await chrome.tabGroups.get(groupId);
      if (group.windowId !== windowId) continue;
      if (!group.collapsed) await chrome.tabGroups.update(groupId, { collapsed: true });
    } catch (err) {
      log.debug('collapseOtherTrackedGroups: group missing/stale', { groupId, err });
    }
  }
}

/**
 * Retitle + recolour a live group (rename / recolour propagation, task 4.1).
 * Unlike the other wrappers this DOES propagate its error, so the coordinator
 * can revert the in-state name change when Chrome rejects the update
 * (rename-atomicity requirement).
 */
export async function updateGroupTitleColor(
  groupId: number,
  title: string,
  color: string,
): Promise<void> {
  await chrome.tabGroups.update(groupId, { title, color: toGroupColor(color) });
}

/**
 * Close the Space's live groups (soft-delete, task 4.2): close every tab in
 * each group, which dissolves the group. Only tracked group ids are passed in,
 * so user groups are never touched. Guarded per group so one failure doesn't
 * abort the rest.
 */
export async function closeGroupsForSpace(groupIds: number[]): Promise<void> {
  for (const groupId of groupIds) {
    if (groupId === NO_GROUP) continue;
    try {
      const tabs = await chrome.tabs.query({ groupId });
      const ids = tabs.map((t) => t.id).filter((id): id is TabId => id !== undefined);
      if (ids.length > 0) {
        await chrome.tabs.remove(ids);
      }
    } catch (err) {
      log.error('closeGroupsForSpace failed', { groupId, err });
    }
  }
}
