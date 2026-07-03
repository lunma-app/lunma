import { log } from '../shared/logger';
import { isNewTabUrl } from '../shared/new-tab';
import { isSpaceEmpty } from '../shared/space-empty';
import {
  disambiguateSpaceName,
  groupDuplicateSpaceNames,
  normalizeSpaceName,
} from '../shared/space-names';
import type { LunmaStore } from '../shared/store.svelte';
import type { SpaceColor, SpaceId, TabId, WindowId } from '../shared/types';
import {
  collapseOtherTrackedGroups,
  ensureGroupForSpace,
  expandGroup,
  resolveGroup,
  setTabNativePinned,
  toGroupColor,
  ungroupTabs,
  updateGroupTitleColor,
} from './tab-groups';

/**
 * Boot reconciliation of Chrome tab groups (see the `spaces-and-tabs` "Boot
 * reconciliation of tab groups" requirement + design D1/D2/D2b). Group + tab ids
 * are session-scoped, so on a browser restart Chrome restores the previous groups
 * with NEW ids that Lunma's persisted `groupId`s no longer resolve. This one-shot
 * boot pass:
 *
 *  1. **Adopts** each restored group into the Space it most likely belongs to —
 *     re-binding that instance's `groupId` to the live id (state-only) instead of
 *     leaving a stale id that triggers a duplicate rebuild on next activation.
 *  2. **Releases** (preserve-user-tab-groups D5) any temp tab still listed in
 *     `tempTabIds` whose live group is a live **untracked** (user-created) group —
 *     state only, after adoption so restored tracked groups have already
 *     re-bound their ids. Skipped on a boot that just ran fresh-install
 *     conversion (every existing group was just claimed by it — nothing is
 *     "untracked" yet to protect).
 *  3. **Materializes** each window's active Space group when it has open tabs but
 *     still no live group, so the strip reflects the active Space from load (no
 *     "ungrouped until first `Cmd+T`" gap), then best-effort declutters — the
 *     sweep excludes any member whose live group is untracked (D3), so a
 *     user-created group is never drained to fill a Space's group. Also skipped
 *     on a fresh-install conversion boot, for the same reason as (2).
 *
 * Lunma stays the source of truth: the pass NEVER deletes a Space, NEVER converts
 * an untracked (user-created) group into a Space, NEVER moves a tab OUT of a live
 * untracked group (the user's group keeps its tab membership, not just its
 * identity — preserve-user-tab-groups), and (during materialization) NEVER opens
 * a tab or changes tab focus.
 */

/** Plain-data view of a Chrome tab group, for the pure matcher. */
export interface GroupDescriptor {
  id: number;
  windowId: WindowId;
  title: string | undefined;
  color: string | undefined;
  /** The group's current member tab ids. */
  memberTabIds: TabId[];
}

/** Plain-data view of a persisted (window, Space) instance, for the pure matcher. */
export interface SpaceCandidate {
  spaceId: SpaceId;
  name: string;
  color: string;
  tempTabIds: TabId[];
}

/**
 * Match a restored Chrome group to one of its window's persisted Space instances
 * (D1). Pure function over plain data — exhaustively unit-testable without faking
 * Chrome. Scoring:
 *
 *  1. **Tab-membership overlap** — how many of the group's member tab ids appear
 *     in the candidate's persisted `tempTabIds`. Highest positive overlap wins;
 *     this is the strongest signal (the tabs survive a restart even though the
 *     group id does not).
 *  2. **Title + colour tiebreaker** — only when overlap is zero/tied at zero:
 *     `group.title === candidate.name` AND `group.color === toGroupColor(color)`.
 *  3. **No match → `null`** — the user's own group; never adopted or retitled.
 *
 * Ties break deterministically by `candidates` order (caller passes `spaces[]`
 * order), since a strictly-greater comparison keeps the first max.
 */
export function matchGroupToSpace(
  group: GroupDescriptor,
  candidates: SpaceCandidate[],
): SpaceId | null {
  let best: { spaceId: SpaceId; overlap: number } | null = null;
  for (const candidate of candidates) {
    const overlap = group.memberTabIds.reduce(
      (count, id) => (candidate.tempTabIds.includes(id) ? count + 1 : count),
      0,
    );
    if (best === null || overlap > best.overlap) {
      best = { spaceId: candidate.spaceId, overlap };
    }
  }
  if (best !== null && best.overlap > 0) return best.spaceId;

  // Overlap is zero for every candidate → fall back to persisted title + colour.
  if (group.title !== undefined && group.color !== undefined) {
    for (const candidate of candidates) {
      if (group.title === candidate.name && group.color === toGroupColor(candidate.color)) {
        return candidate.spaceId;
      }
    }
  }
  return null;
}

/**
 * Adopt restored groups into Spaces (state only — D2/D6). For each group, build
 * the candidate set from the persisted instances in the group's window (in
 * `spaces[]` order for a deterministic tiebreak), match via
 * {@link matchGroupToSpace}, and `recordSpaceGroup` on a hit. Issues NO
 * `chrome.tabGroups` mutation, so it generates no events and never fights
 * Chrome's restored layout. Untracked groups (no matching instance) are skipped.
 */
export function adoptExistingGroups(
  store: LunmaStore,
  groups: chrome.tabGroups.TabGroup[],
  tabsByGroup: Map<number, TabId[]>,
): void {
  // Claim-guard (design D6): within one pass each Space is adopted by at most one
  // group per window. A Space already claimed by an earlier group is removed from
  // the candidate set for the window's remaining groups, so two groups in a
  // window (e.g. one hand-titled by the user to match a Space) can never both
  // bind to the same Space. Keyed per window because the same Space is a distinct
  // instance in each window.
  const claimedByWindow = new Map<WindowId, Set<SpaceId>>();
  for (const group of groups) {
    const windowMap = store.state.spaceInstancesByWindow[group.windowId];
    if (!windowMap) continue;
    const claimed = claimedByWindow.get(group.windowId) ?? new Set<SpaceId>();
    const candidates: SpaceCandidate[] = [];
    for (const space of store.state.spaces) {
      if (claimed.has(space.id)) continue; // already adopted by a prior group
      const instance = windowMap[space.id];
      if (!instance) continue;
      candidates.push({
        spaceId: space.id,
        name: space.name,
        color: space.color,
        tempTabIds: instance.tempTabIds,
      });
    }
    if (candidates.length === 0) continue;
    const descriptor: GroupDescriptor = {
      id: group.id,
      windowId: group.windowId,
      title: group.title,
      color: group.color,
      memberTabIds: tabsByGroup.get(group.id) ?? [],
    };
    const matched = matchGroupToSpace(descriptor, candidates);
    if (matched !== null) {
      store.recordSpaceGroup(group.windowId, matched, group.id);
      claimed.add(matched);
      claimedByWindow.set(group.windowId, claimed);
    }
  }
}

/**
 * Inverse of `toGroupColor`: map a Chrome `tabGroups.Color` to a Lunma
 * `SpaceColor` for a group adopted into a new Space. Chrome's palette is a subset
 * of Lunma's (no `lime`/`teal`), so every Chrome colour maps to the same-named
 * Lunma colour, except Chrome's `grey` → Lunma's `gray`. Anything unrecognised
 * folds to `gray`.
 */
export function fromGroupColor(color: string | undefined): SpaceColor {
  switch (color) {
    case 'grey':
      return 'gray';
    case 'blue':
    case 'cyan':
    case 'green':
    case 'orange':
    case 'pink':
    case 'purple':
    case 'red':
    case 'yellow':
      return color;
    default:
      return 'gray';
  }
}

/** The active tab descriptor per window, derived from the boot `chrome.tabs.query`. */
export type ActiveTabByWindow = { [windowId: number]: { groupId: number } };

/**
 * Fresh-install conversion (D7): when Lunma boots with NO persisted Spaces but
 * the browser already has Chrome tab groups, mint one Space per existing group so
 * the user's groups show up as Spaces instead of being lumped into the single
 * Default. For each group it creates a Space (`group.title` → name; `group.color`
 * → Space colour), MOVES that group's member tabs out of the Default into the new
 * Space's instance (`assignSpaceTabs`), and records the live group id. **Titled**
 * groups whose titles match under normalization (trim + casefold) fold into ONE
 * Space across windows — the same Space instantiated in multiple windows (Lunma's
 * multi-window model) — taking the FIRST folded group's colour, so two
 * same-name/different-colour groups become one Space rather than two same-named
 * ones. Every minted name is routed through `disambiguateSpaceName` so it never
 * collides with a pre-existing Default. **Untitled** groups never fold — each
 * becomes its own Space with a numbered name (`'Group 1'`, `'Group 2'`, …) so two
 * label-less groups stay distinct. Each window then activates the Space whose
 * group holds its active tab.
 * Finally the now-empty auto-created Default is discarded (kept if it still holds
 * ungrouped tabs). State-only — issues no `chrome.tabGroups` call; the subsequent
 * adopt/materialize pass handles the Chrome side.
 */
export function convertGroupsToSpaces(
  store: LunmaStore,
  groups: chrome.tabGroups.TabGroup[],
  tabsByGroup: Map<number, TabId[]>,
  activeTabByWindow: ActiveTabByWindow,
): void {
  const spaceIdByName = new Map<string, SpaceId>(); // normalized title → Space (fold key)
  const spaceIdByGroup = new Map<number, SpaceId>();
  const createdSpaceIds = new Set<SpaceId>();
  let untitledCount = 0;

  // PRE-EXISTING Space names (normalized) → id, captured BEFORE any mint this
  // pass — on a fresh install, just the auto-created Default. A TITLED group whose
  // name matches one of these folds into that Space instead of minting a
  // duplicate (e.g. a group literally titled "Default" → the Default, not a new
  // "Default 2"). See design D6.
  const preExistingSpaceIdByName = new Map<string, SpaceId>();
  for (const space of store.state.spaces) {
    preExistingSpaceIdByName.set(normalizeSpaceName(space.name), space.id);
  }

  const mintSpace = (name: string, color: SpaceColor): SpaceId | undefined => {
    // Disambiguate against every existing Space name — those minted earlier in
    // this pass AND any pre-existing Default (e.g. a Default literally named
    // "Group 1") — so the unique-name invariant holds and `createSpace` never
    // throws on a collision (the running taken-set is recomputed each mint).
    const taken = new Set(store.state.spaces.map((s) => normalizeSpaceName(s.name)));
    const uniqueName = disambiguateSpaceName(name, taken);
    const before = new Set(store.state.spaces.map((s) => s.id));
    store.createSpace({ name: uniqueName, color, icon: 'star' });
    const created = store.state.spaces.find((s) => !before.has(s.id));
    if (!created) return undefined;
    createdSpaceIds.add(created.id);
    return created.id;
  };

  for (const group of groups) {
    const title = group.title?.trim() ?? '';
    const color = fromGroupColor(group.color);
    let spaceId: SpaceId | undefined;
    if (title.length > 0) {
      // Titled: fold groups whose titles match under normalization (trim +
      // casefold) into ONE Space across windows. The folded Space keeps the
      // FIRST folded group's colour — so two same-name/different-colour groups
      // become one Space, not two same-named ones.
      const key = normalizeSpaceName(title);
      // Resolve in order: a this-pass folded Space → a PRE-EXISTING same-named
      // Space (fold into it, e.g. the auto-Default for a group titled "Default",
      // closing the "Default 2" double-mint) → else mint a fresh, disambiguated
      // Space.
      spaceId = spaceIdByName.get(key) ?? preExistingSpaceIdByName.get(key);
      if (spaceId === undefined) {
        spaceId = mintSpace(title, color);
        if (spaceId !== undefined) spaceIdByName.set(key, spaceId);
      } else {
        spaceIdByName.set(key, spaceId);
      }
    } else {
      // Untitled: never fold — each gets its own numbered Space.
      untitledCount += 1;
      spaceId = mintSpace(`Group ${untitledCount}`, color);
    }
    if (spaceId === undefined) continue;
    store.assignSpaceTabs(group.windowId, spaceId, tabsByGroup.get(group.id) ?? []);
    store.recordSpaceGroup(group.windowId, spaceId, group.id);
    spaceIdByGroup.set(group.id, spaceId);
  }

  // Activate, per window, the Space whose group holds the window's active tab.
  for (const [windowIdStr, active] of Object.entries(activeTabByWindow)) {
    const spaceId = spaceIdByGroup.get(active.groupId);
    if (spaceId !== undefined) store.activateSpace(Number(windowIdStr), spaceId);
  }

  // Discard the auto-created Default if conversion emptied it (no ungrouped tabs).
  // Only pre-existing Spaces (not the ones just minted) are candidates.
  for (const space of [...store.state.spaces]) {
    if (!createdSpaceIds.has(space.id)) store.removeEmptySpace(space.id);
  }
}

/**
 * The Space's tabs currently open in `windowId` — its live temp tabs plus its
 * bound (saved) tabs open in the window. Mirrors the coordinator's
 * `tabIdsForSpaceInWindow`; kept here so the boot pass derives the materialized
 * group's membership from the same reconciled store state.
 */
function spaceWindowTabSet(store: LunmaStore, windowId: WindowId, spaceId: SpaceId): TabId[] {
  const s = store.state;
  const temp = (s.spaceInstancesByWindow[windowId]?.[spaceId]?.tempTabIds ?? []).filter(
    (id) => s.liveTabsById[id]?.windowId === windowId,
  );
  // Per-window-tab-bindings (ADR 0003): read each saved tab's slot for THIS
  // window directly.
  const bound: TabId[] = [];
  for (const [savedTabId, slots] of Object.entries(s.tabBindings)) {
    const tabId = slots[windowId];
    if (tabId === undefined) continue;
    const saved = s.savedTabs[savedTabId];
    // A global favorite (`saved.spaceId === null`, favicon-row-model)
    // is INCIDENTALLY excluded here: `null !== <spaceId string>` is always true,
    // so a favorite never joins any materialized Space group at boot — its
    // ungrouping is handled by the favorite-ungroup reconciliation step below,
    // not by this membership filter (D8).
    if (!saved || saved.spaceId !== spaceId) continue;
    if (s.liveTabsById[tabId]?.windowId !== windowId) continue;
    bound.push(tabId);
  }
  return [...new Set([...temp, ...bound])];
}

/** Every home tab (the Lunma new-tab page) open in `windowId`, derived from the
 * boot-rebuilt `liveTabsById`. The boot pass groups ALL of them into the active
 * Space (not just one) so a reopened window with several home tabs never leaves
 * any orphaned outside the group. */
function homeTabIdsInWindow(store: LunmaStore, windowId: WindowId): TabId[] {
  const ids: TabId[] = [];
  for (const t of Object.values(store.state.liveTabsById)) {
    if (t.windowId === windowId && isNewTabUrl(t.url)) ids.push(t.tabId);
  }
  return ids;
}

/** Every Lunma-tracked (≥0) group id in `windowId` — the only groups the boot
 * pass may collapse. User-created groups are never in this set. */
function trackedGroupIdsForWindow(store: LunmaStore, windowId: WindowId): number[] {
  const map = store.state.spaceInstancesByWindow[windowId];
  if (!map) return [];
  return Object.values(map)
    .map((instance) => instance.groupId)
    .filter((groupId) => groupId >= 0);
}

/**
 * Materialize / reconcile each window's active Space group after adoption (D2b).
 * The active Space's membership is its window tab set (temp + bound tabs) PLUS
 * **every** home tab in the window (so none is orphaned). Then:
 *
 *  - **Stale persisted groupId (B):** the persisted `groupId` is resolved against
 *    Chrome; an id that no longer resolves is treated as "no live group" (and
 *    reset to `-1`), so a stale id never skips materialization.
 *  - **Untracked-group exclusion (D3, preserve-user-tab-groups):** UNLESS
 *    `skipUntrackedExclusion` is set (the caller passes `true` only on a boot
 *    pass that just ran fresh-install conversion — see
 *    `reconcileTabGroupsOnBoot`), a member whose current live group (per
 *    `tabGroupById`) is a live **untracked** group — not in
 *    `trackedGroupIdsForWindow` — is excluded from both the sweep and a fresh
 *    group's initial membership. It is left exactly where the user put it; the
 *    pass never drains a user-created group to fill a Space's group. On a
 *    fresh-install pass every existing group was just claimed by
 *    `convertGroupsToSpaces` (folded or minted its own Space), so there is no
 *    "the user's own, Lunma has never seen it" group to protect — and a
 *    claim-guard "loser" sibling from a same-title fold (its tabs already
 *    legitimately assigned by conversion) must still be mergeable, exactly
 *    like the pre-existing fold behaviour.
 *  - **Live group exists:** any remaining member not already in that group (a
 *    stray ungrouped home tab, a tab in a dead group, a tab in another TRACKED
 *    group) is swept into it — members already in the group are left untouched
 *    (no churn / reorder).
 *  - **No live group:** the (untracked-excluded) membership is grouped into a
 *    fresh group, titled + recoloured, expanded, and the window's other tracked
 *    groups collapsed.
 *
 * NEVER opens a tab and NEVER changes focus — an empty active Space (no tabs and
 * no home tab) stays groupless. `tabGroupById` maps each live tab id to its
 * current Chrome groupId (from the boot tabs query) for the no-churn membership
 * check and the untracked-group exclusion.
 */
async function materializeActiveGroups(
  store: LunmaStore,
  tabGroupById: Map<TabId, number>,
  skipUntrackedExclusion = false,
): Promise<void> {
  for (const [windowIdStr, spaceId] of Object.entries(store.state.activeSpaceByWindow)) {
    if (spaceId === null || spaceId === undefined) continue;
    const windowId = Number(windowIdStr);
    const instance = store.state.spaceInstancesByWindow[windowId]?.[spaceId];
    if (!instance) continue;

    // (B) Resolve any persisted groupId; a stale (non-resolving) id is treated as
    // "no live group" so materialization runs instead of being skipped.
    const live = instance.groupId >= 0 ? await resolveGroup(instance.groupId, windowId) : null;
    if (instance.groupId >= 0 && !live) {
      store.recordSpaceGroup(windowId, spaceId, -1); // drop the stale id
    }

    // (A) Membership: the Space's real tabs PLUS every home tab in the window,
    // EXCLUDING any tab whose live group is a live untracked (user-created)
    // group — D3: never drag a member out of the user's own group.
    const trackedGroupIds = new Set(trackedGroupIdsForWindow(store, windowId));
    const isInUntrackedGroup = (id: TabId): boolean => {
      if (skipUntrackedExclusion) return false;
      const liveGroupId = tabGroupById.get(id) ?? -1;
      return liveGroupId >= 0 && !trackedGroupIds.has(liveGroupId);
    };
    const members = [
      ...new Set([
        ...spaceWindowTabSet(store, windowId, spaceId),
        ...homeTabIdsInWindow(store, windowId),
      ]),
    ].filter((id) => !isInUntrackedGroup(id));

    if (live) {
      // Sweep only members NOT already in the live group (stray home tabs / tabs
      // left in a dead group / tabs in another tracked group) — leave existing
      // members untouched to avoid churn. Untracked-group members are already
      // excluded from `members` above.
      const stray = members.filter((id) => (tabGroupById.get(id) ?? -1) !== live.id);
      if (stray.length > 0) await ensureGroupForSpace(windowId, stray, live.id);
      continue;
    }

    if (members.length === 0) continue; // never open a tab at boot

    const groupId = await ensureGroupForSpace(windowId, members);
    if (groupId === null) continue;
    store.recordSpaceGroup(windowId, spaceId, groupId);

    const space = store.state.spaces.find((s) => s.id === spaceId);
    if (space) {
      try {
        await updateGroupTitleColor(groupId, space.name, space.color);
      } catch (err) {
        // Best-effort: a titling failure must not abort the boot pass.
        log.debug('materializeActiveGroups: title/colour failed', { spaceId, groupId, err });
      }
    }
    // Best-effort declutter to the post-switch end state. collapseOtherTrackedGroups
    // already swallows a Chrome refusal (e.g. the active tab sits in another group).
    await expandGroup(groupId);
    await collapseOtherTrackedGroups(windowId, groupId, trackedGroupIdsForWindow(store, windowId));
  }
}

/**
 * Reconcile global favorites' restored bound tabs to the favorite invariant
 * (favicon-row-model D4 / Q2, pin-favorites-natively): ungrouped AND natively
 * pinned. After adoption + materialization, for each favorite (`faviconRow` →
 * `savedTabs[id].spaceId === null`) and each window where its per-window bound
 * tab was restored, the pass ungroups the tab when it is still grouped
 * (`tabGroupById.get(tabId) >= 0`, the same boot tab→group map adoption read)
 * and natively pins it when it is unpinned (per `tabPinnedById`, from the same
 * boot tabs query) — the latter also converges favorites created before native
 * pinning existed, with no data migration. Best-effort (refusals are swallowed
 * by the wrappers) and bounded by favorite × window count. A favorite whose
 * bound tab Chrome restored already ungrouped and pinned is a no-op.
 */
async function reconcileRestoredFavorites(
  store: LunmaStore,
  tabGroupById: Map<TabId, number>,
  tabPinnedById: Map<TabId, boolean>,
): Promise<void> {
  const s = store.state;
  for (const savedTabId of s.faviconRow) {
    const saved = s.savedTabs[savedTabId];
    if (!saved || saved.spaceId !== null) continue; // defensive: only true favorites
    const slots = s.tabBindings[savedTabId];
    if (!slots) continue;
    for (const tabId of Object.values(slots)) {
      if ((tabGroupById.get(tabId) ?? -1) >= 0) {
        await ungroupTabs(tabId);
      }
      // A tab absent from the boot query was not restored — leave it alone.
      if (tabPinnedById.get(tabId) === false) {
        await setTabNativePinned(tabId, true);
      }
    }
  }
}

/**
 * Duplicate-Space cleanup (D9 / spec `spaces-and-tabs` "Boot reconciliation of
 * tab groups"): after adoption/materialization/favorite reconciliation, group
 * `store.state.spaces` into normalized-name collision groups and, for each
 * group, partition members via `isSpaceEmpty` exactly as the load-path
 * self-heal (`dedupePersistedState`) does. Every member the resolution marks
 * as a drop — the "exactly one non-empty" and "all empty" cases — is removed
 * via `store.removeEmptySpace`. A group resolved as "two or more non-empty
 * members" is left untouched here (the boot pass never renames; only the
 * load-path self-heal does — renaming mid-boot could retitle a Space out from
 * under an already-rendered sidebar with no user action). Runs unconditionally
 * every boot (not only on `freshInstall`), so a duplicate exposed only after
 * the boot's single `chrome.tabGroups.query({})` call (e.g. a window still
 * restoring at query time) is still caught before the broadcast.
 */
function cleanUpDuplicateSpaces(store: LunmaStore): void {
  const groups = groupDuplicateSpaceNames(store.state.spaces);
  for (const group of groups) {
    const nonEmptyIds = group.filter((id) => !isSpaceEmpty(store.state, id));
    if (nonEmptyIds.length > 1) continue; // left for the load-path self-heal
    const keepId = nonEmptyIds[0] ?? group[0];
    for (const id of group) {
      if (id !== keepId) store.removeEmptySpace(id);
    }
  }
}

/**
 * The boot entry point (called from the SW boot chain after
 * `seedExistingTabs` / `rebuildLiveTabs`, before the boot persist + broadcast).
 * Queries Chrome's existing groups + tabs once, then:
 *   - on a **fresh install** (`freshInstall` — no Spaces were loaded from
 *     storage — AND at least one Chrome group exists, `convertedThisBoot`),
 *     converts each existing Chrome group into a Space (D7) so the user's
 *     groups show up as Spaces rather than collapsing into one Default;
 *   - **adopts** restored groups into their Spaces (re-binds session-scoped ids);
 *   - **releases** (D5, preserve-user-tab-groups) any temp tab still listed in
 *     `tempTabIds` whose live group is untracked (the user's own group) — after
 *     adoption, so tracked groups' re-bound ids are already settled. **Skipped
 *     on `convertedThisBoot`**: conversion just claimed EVERY existing group
 *     (folded or minted), so there is no foreign group left to protect against,
 *     and a same-title fold's claim-guard "loser" sibling (its tabs already
 *     legitimately assigned by conversion) must stay releasable-into, not be
 *     mistaken for the user's own;
 *   - **materializes** any still-missing active-Space group, excluding
 *     untracked-group members from the sweep (D3) — **also skipped on
 *     `convertedThisBoot`**, same reasoning, so a same-title fold's second
 *     physical group is still merged into the first exactly as before this
 *     change;
 *   - **ungroups** any global favorite (`spaceId === null`) Chrome restored still
 *     inside a group, so it is global again before a Space switch can hide it
 *     (favicon-row-model D4);
 *   - **cleans up** any empty Space left duplicate-named after the above steps
 *     (D9), run every boot (not only on `freshInstall`), so a duplicate that
 *     escaped this boot's fresh-install fold or a prior boot's adoption is
 *     still caught before the broadcast.
 * Order matters: convert (mint Spaces + assign tabs) → adopt (re-bind) →
 * release (strip untracked-group tabs from tempTabIds, non-conversion boots
 * only) → materialize → ungroup-favorites → duplicate cleanup, so a restored
 * group is reused rather than duplicated, state is honest before materialization
 * sweeps, favorites end ungrouped, and any still-empty duplicate is gone before
 * the Space groups are settled and broadcast.
 */
export async function reconcileTabGroupsOnBoot(
  store: LunmaStore,
  freshInstall = false,
): Promise<void> {
  let groups: chrome.tabGroups.TabGroup[];
  let tabs: chrome.tabs.Tab[];
  try {
    [groups, tabs] = await Promise.all([chrome.tabGroups.query({}), chrome.tabs.query({})]);
  } catch (err) {
    log.error('reconcileTabGroupsOnBoot: query failed', { err });
    return;
  }

  const tabsByGroup = new Map<number, TabId[]>();
  const tabGroupById = new Map<TabId, number>();
  const tabPinnedById = new Map<TabId, boolean>();
  for (const tab of tabs) {
    if (tab.id === undefined) continue;
    tabGroupById.set(tab.id, tab.groupId ?? -1);
    tabPinnedById.set(tab.id, tab.pinned === true);
    if (tab.groupId === undefined || tab.groupId < 0) continue;
    const list = tabsByGroup.get(tab.groupId);
    if (list) list.push(tab.id);
    else tabsByGroup.set(tab.groupId, [tab.id]);
  }

  // Fresh-install conversion claims EVERY existing Chrome group (folded into a
  // Space or minted its own — D7), so on that one-time pass there is no
  // "untracked, the user's own" group left to protect: the D3/D5 exclusions
  // are skipped entirely for it (preserve-user-tab-groups — see
  // `materializeActiveGroups`'s and `releaseTabsInUntrackedGroups`'s docs).
  const convertedThisBoot = freshInstall && groups.length > 0;
  if (convertedThisBoot) {
    const activeTabByWindow: ActiveTabByWindow = {};
    for (const tab of tabs) {
      if (tab.active && tab.windowId !== undefined) {
        activeTabByWindow[tab.windowId] = { groupId: tab.groupId ?? -1 };
      }
    }
    convertGroupsToSpaces(store, groups, tabsByGroup, activeTabByWindow);
  }

  adoptExistingGroups(store, groups, tabsByGroup);
  if (!convertedThisBoot) store.releaseTabsInUntrackedGroups(tabGroupById);
  await materializeActiveGroups(store, tabGroupById, convertedThisBoot);
  await reconcileRestoredFavorites(store, tabGroupById, tabPinnedById);
  cleanUpDuplicateSpaces(store);
}
