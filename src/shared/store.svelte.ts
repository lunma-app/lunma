import { log } from './logger';
import { disambiguateSpaceName, normalizeSpaceName } from './space-names';
import type {
  AppState,
  ArchivedTab,
  FolderId,
  LiveTab,
  PinNode,
  SavedTab,
  SavedTabId,
  Space,
  SpaceAutoArchive,
  SpaceId,
  SpaceInstance,
  TabBoundary,
  TabId,
  WindowId,
} from './types';

/** Defaults for a freshly-minted pinned-tab folder (icon/color are plain
 * strings on the record, narrowed to IconName/SpaceColor only at the bus). */
const DEFAULT_FOLDER_ICON = 'folder';
const DEFAULT_FOLDER_COLOR = 'gray';
const DEFAULT_FOLDER_NAME = 'New Folder';

/** Chrome tab status → our narrow `LiveTab.status`. Anything but 'loading'
 * (e.g. 'complete', 'unloaded', undefined) resolves to 'complete'. */
function normalizeStatus(status: string | undefined): LiveTab['status'] {
  return status === 'loading' ? 'loading' : 'complete';
}

export type IdFactory = () => string;

export interface LunmaStoreOptions {
  idFactory?: IdFactory;
  initial?: AppState;
}

// Kept in lockstep with `CURRENT_SCHEMA_VERSION` (schemas.ts): the in-state
// `schemaVersion` field must match the envelope's at write time (storage-and-
// migrations). Fresh state is minted at the current version.
export const SCHEMA_VERSION = 11;

/**
 * Retention bounds for `archivedTabs` (auto-archive). {@link LunmaStore.pruneArchivedTabs}
 * enforces BOTH at the end of every sweep: at most `ARCHIVE_MAX_ENTRIES` entries
 * (oldest by `archivedAt` evicted, FIFO) AND no entry older than `ARCHIVE_TTL_MS`.
 */
export const ARCHIVE_MAX_ENTRIES = 100;
export const ARCHIVE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export const createInitialState = (): AppState => ({
  schemaVersion: SCHEMA_VERSION,
  spaces: [],
  activeSpaceByWindow: {},
  spaceInstancesByWindow: {},
  tabBindings: {},
  savedTabs: {},
  lastActivatedSpaceId: null,
  tabLastActivity: {},
  archivedTabs: [],
  trash: {},
  pinnedBySpace: {},
  faviconRow: [],
  liveTabsById: {},
});

const defaultIdFactory: IdFactory = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `id-${Math.random().toString(36).slice(2)}-${Date.now()}`;

export class LunmaStore {
  state: AppState = $state(createInitialState());

  private readonly newId: IdFactory;

  constructor(options: LunmaStoreOptions = {}) {
    this.newId = options.idFactory ?? defaultIdFactory;
    if (options.initial) {
      Object.assign(this.state, options.initial);
    }
  }

  /**
   * Plain (non-reactive) snapshot of `state`, suitable for `chrome.storage.local.set`
   * and any other consumer that uses `structuredClone`. Svelte 5 `$state` proxies
   * don't round-trip through `structuredClone` cleanly — array proxies serialize as
   * plain objects, which then fail Zod validation on read-back. Always go through
   * this method when persisting or broadcasting.
   */
  snapshot(): AppState {
    return $state.snapshot(this.state) as AppState;
  }

  createSpace(params: { name: string; color: string; icon: string }): void {
    // Space names are unique under normalization (trim + casefold) — see the
    // `spaces-and-tabs` "Space names are unique" requirement. Interactive
    // creation REJECTS a collision (the throw surfaces through the command ack);
    // non-interactive mints pre-disambiguate, so they never reach this throw.
    const taken = normalizeSpaceName(params.name);
    if (this.state.spaces.some((s) => normalizeSpaceName(s.name) === taken)) {
      throw new Error(`createSpace: a Space named '${params.name}' already exists`);
    }
    const space: Space = {
      id: this.newId(),
      name: params.name,
      color: params.color,
      icon: params.icon,
    };
    this.state.spaces.push(space);
    if (this.state.lastActivatedSpaceId === null) {
      this.state.lastActivatedSpaceId = space.id;
    }
  }

  renameSpace(spaceId: SpaceId, newName: string): void {
    const space = this.state.spaces.find((s) => s.id === spaceId);
    if (!space) {
      log.error('renameSpace: unknown spaceId', { spaceId });
      return;
    }
    // Reject a collision with ANOTHER Space's name (normalized). The Space being
    // renamed is excluded from the taken-set, so re-applying its own name or
    // changing only its casing (e.g. "Work" → "work") is allowed.
    const taken = normalizeSpaceName(newName);
    if (this.state.spaces.some((s) => s.id !== spaceId && normalizeSpaceName(s.name) === taken)) {
      throw new Error(`renameSpace: a Space named '${newName}' already exists`);
    }
    space.name = newName;
  }

  recolourSpace(spaceId: SpaceId, color: string): void {
    const space = this.state.spaces.find((s) => s.id === spaceId);
    if (!space) {
      log.error('recolourSpace: unknown spaceId', { spaceId });
      return;
    }
    space.color = color;
  }

  changeSpaceIcon(spaceId: SpaceId, icon: string): void {
    const space = this.state.spaces.find((s) => s.id === spaceId);
    if (!space) {
      log.error('changeSpaceIcon: unknown spaceId', { spaceId });
      return;
    }
    space.icon = icon;
  }

  deleteSpace(spaceId: SpaceId): void {
    const index = this.state.spaces.findIndex((s) => s.id === spaceId);
    const space = index === -1 ? undefined : this.state.spaces[index];
    if (!space) {
      log.error('deleteSpace: unknown spaceId', { spaceId });
      return;
    }
    if (this.state.spaces.length === 1) {
      log.error('LAST_SPACE_DELETION_REFUSED', { spaceId });
      return;
    }
    this.state.spaces.splice(index, 1);
    this.state.trash[spaceId] = { ...space, deletedAt: new Date().toISOString() };

    for (const [windowIdStr, windowMap] of Object.entries(this.state.spaceInstancesByWindow)) {
      if (windowMap?.[spaceId]) {
        delete windowMap[spaceId];
        // Drop the whole window entry once its last Space instance is gone.
        if (Object.keys(windowMap).length === 0) {
          delete this.state.spaceInstancesByWindow[Number(windowIdStr)];
        }
      }
    }
    for (const [windowIdStr, activeSpaceId] of Object.entries(this.state.activeSpaceByWindow)) {
      if (activeSpaceId === spaceId) {
        this.state.activeSpaceByWindow[Number(windowIdStr)] = null;
      }
    }
    if (this.state.lastActivatedSpaceId === spaceId) {
      this.state.lastActivatedSpaceId = this.state.spaces[0]?.id ?? null;
    }
  }

  /**
   * Reorder `state.spaces` to the given id order (user drag-reorder in the
   * switcher). Mutates the array IN PLACE (splice, like {@link deleteSpace}) so
   * the `$state` proxy and its subscribers survive — never reassigns it. Keeps
   * only ids that currently exist (drops unknown defensively) and appends any
   * current id the caller omitted (race safety, mirroring {@link reorderTemp});
   * a no-op when the resulting order matches the current one. Space order is
   * global — `activeSpaceByWindow` / `spaceInstancesByWindow` are untouched, so
   * reordering never changes the active Space in any window.
   */
  reorderSpaces(spaceIds: SpaceId[]): void {
    const current = this.state.spaces;
    const byId = new Map(current.map((s) => [s.id, s]));
    const next: Space[] = [];
    const placed = new Set<SpaceId>();
    for (const id of spaceIds) {
      const space = byId.get(id);
      if (space && !placed.has(id)) {
        next.push(space);
        placed.add(id);
      }
    }
    // Append any current Space the caller omitted, preserving its relative order.
    for (const space of current) {
      if (!placed.has(space.id)) next.push(space);
    }
    // No-op when nothing moved (avoids a needless mutation/broadcast).
    if (next.every((s, i) => s === current[i])) return;
    this.state.spaces.splice(0, current.length, ...next);
  }

  restoreSpaceFromTrash(spaceId: SpaceId): void {
    const trashed = this.state.trash[spaceId];
    if (!trashed) {
      log.error('restoreSpaceFromTrash: unknown spaceId', { spaceId });
      return;
    }
    const { deletedAt: _deletedAt, ...space } = trashed;
    // The name may now collide with a Space created while this one was trashed.
    // This is a non-interactive mint (the user did not type the name), so it
    // auto-disambiguates instead of throwing: "Work" → "Work 2".
    const taken = new Set(this.state.spaces.map((s) => normalizeSpaceName(s.name)));
    space.name = disambiguateSpaceName(space.name, taken);
    this.state.spaces.push(space);
    delete this.state.trash[spaceId];
  }

  activateSpace(windowId: WindowId, spaceId: SpaceId): void {
    const exists = this.state.spaces.some((s) => s.id === spaceId);
    if (!exists) {
      log.error('activateSpace: unknown spaceId', { spaceId });
      return;
    }
    this.state.activeSpaceByWindow[windowId] = spaceId;
    // Ensure this (window, Space) has an instance WITHOUT discarding any other
    // Space's instance in the window — that discard was the "switch loses temp
    // tabs" bug. Re-activating a Space reuses its existing instance.
    this.ensureInstance(windowId, spaceId);
    this.state.lastActivatedSpaceId = spaceId;
  }

  /**
   * Record a freshly-created (or reconciled) Chrome tab group id on the
   * (window, Space) instance, creating the instance if absent. State-only;
   * the coordinator owns the `chrome.tabGroups` call that produced `groupId`.
   */
  recordSpaceGroup(windowId: WindowId, spaceId: SpaceId, groupId: number): void {
    // A live `groupId` is never shared by two instances in a window (claim-guard,
    // design D6). Before binding, evict any OTHER instance in this window that
    // currently holds `groupId` — so the "two Spaces, one group" collapse state
    // is unrepresentable even if adoption tried to bind a group twice. The `-1`
    // "no live group" sentinel is shared freely, so it is never evicted.
    if (groupId >= 0) {
      const windowMap = this.state.spaceInstancesByWindow[windowId];
      if (windowMap) {
        for (const [otherSpaceId, instance] of Object.entries(windowMap)) {
          if (otherSpaceId !== spaceId && instance?.groupId === groupId) {
            instance.groupId = -1;
          }
        }
      }
    }
    const instance = this.ensureInstance(windowId, spaceId);
    instance.groupId = groupId;
  }

  /**
   * Reset the (window, Space) instance holding `groupId` back to the `-1` "no
   * live group" sentinel — the non-destructive reconciliation for a Chrome group
   * the user ungrouped/closed (`tabGroups.onRemoved`). The Space, its
   * `tempTabIds`, and its pinned saved-tab records are all retained; the next
   * activation rebuilds a group from whatever tabs remain. No-op when no instance
   * holds `groupId` (e.g. Lunma itself just closed it during `deleteSpace`, so the
   * instance is already gone). Synchronous and chrome-free.
   */
  forgetSpaceGroup(groupId: number): void {
    if (groupId < 0) return;
    for (const instance of this.allInstances()) {
      if (instance.groupId === groupId) {
        instance.groupId = -1;
        return;
      }
    }
  }

  /**
   * Assign `tabIds` to the (window, Space) instance as its temporary tabs,
   * MOVING them out of any other instance in the same window that currently
   * holds them. Used by fresh-install group→Space conversion to redistribute the
   * window's tabs (which `seedExistingTabs` lumped into the active/Default Space)
   * into the per-group Space they belong to. Bound (saved) tabs are skipped — a
   * bound tab is owned by its saved-tab record, not a temp slot. The given order
   * is preserved at the head of the instance's list; any tabs it already held
   * (and were not re-listed) are kept after. Synchronous, chrome-free.
   */
  assignSpaceTabs(windowId: WindowId, spaceId: SpaceId, tabIds: TabId[]): void {
    const incoming = tabIds.filter((id) => !this.isBound(id));
    const moving = new Set(incoming);
    const windowMap = this.state.spaceInstancesByWindow[windowId];
    if (windowMap) {
      for (const [otherSpaceId, instance] of Object.entries(windowMap)) {
        if (otherSpaceId === spaceId || !instance) continue;
        instance.tempTabIds = instance.tempTabIds.filter((id) => !moving.has(id));
        for (const id of moving) delete instance.tempTabTitles[id];
      }
    }
    const target = this.ensureInstance(windowId, spaceId);
    const kept = target.tempTabIds.filter((id) => !moving.has(id));
    target.tempTabIds = [...incoming, ...kept];
  }

  /**
   * One-time boot heal of the per-window ownership invariant (prevent-space-
   * group-collapse). For each window, any tab id present in MORE THAN ONE
   * instance's `tempTabIds` is kept in its single correct owner — the instance
   * whose recorded `groupId` matches the tab's live Chrome group (per
   * `tabGroupById`), else the window's active instance, else (when neither holds
   * it) the first holder so the tab is never orphaned — and stripped (with its
   * `tempTabTitles` entry) from every other instance. `tabGroupById` maps each
   * live tab id to its current Chrome group id (`-1` = ungrouped), built from the
   * boot tabs query. State-only and idempotent: a second pass finds no
   * duplicates. Scoped per window, so the same Space active in two windows keeps
   * its independent `tempTabIds`.
   */
  reconcileTabOwnership(tabGroupById: ReadonlyMap<TabId, number>): void {
    for (const [windowIdStr, windowMap] of Object.entries(this.state.spaceInstancesByWindow)) {
      if (!windowMap) continue;
      const windowId = Number(windowIdStr);
      const activeSpaceId = this.state.activeSpaceByWindow[windowId] ?? null;
      // Per-window `groupId → spaceId` index (skip the shared `-1` "no live
      // group" sentinel, which several instances may carry).
      const spaceByGroup = new Map<number, SpaceId>();
      for (const [spaceId, instance] of Object.entries(windowMap)) {
        if (instance && instance.groupId >= 0) spaceByGroup.set(instance.groupId, spaceId);
      }
      // Which instances hold each tab id, in instance-iteration order.
      const holdersByTab = new Map<TabId, SpaceId[]>();
      for (const [spaceId, instance] of Object.entries(windowMap)) {
        if (!instance) continue;
        for (const tabId of instance.tempTabIds) {
          const holders = holdersByTab.get(tabId);
          if (holders) holders.push(spaceId);
          else holdersByTab.set(tabId, [spaceId]);
        }
      }
      for (const [tabId, holders] of holdersByTab) {
        if (holders.length < 2) continue; // single owner — nothing to heal
        const liveGroup = tabGroupById.get(tabId);
        const grouped =
          liveGroup !== undefined && liveGroup >= 0 ? spaceByGroup.get(liveGroup) : undefined;
        const owner =
          grouped !== undefined && holders.includes(grouped)
            ? grouped
            : activeSpaceId !== null && holders.includes(activeSpaceId)
              ? activeSpaceId
              : holders[0];
        if (owner === undefined) continue;
        for (const spaceId of holders) {
          if (spaceId === owner) continue;
          const instance = windowMap[spaceId];
          if (!instance) continue;
          const idx = instance.tempTabIds.indexOf(tabId);
          if (idx !== -1) instance.tempTabIds.splice(idx, 1);
          delete instance.tempTabTitles[tabId];
        }
      }
    }
  }

  /**
   * Hard-remove a Space that has no temporary tabs in any window and no pinned
   * tabs — used by fresh-install conversion to discard the auto-created Default
   * once every open tab has been redistributed into a group-derived Space. Unlike
   * {@link deleteSpace} this does NOT move the record to trash (the Default was
   * never user-authored) and refuses to act when it is the last remaining Space.
   * No-op when the Space is unknown, non-empty, or last. Synchronous, chrome-free.
   */
  removeEmptySpace(spaceId: SpaceId): void {
    if (this.state.spaces.length <= 1) return;
    const index = this.state.spaces.findIndex((s) => s.id === spaceId);
    if (index === -1) return;
    if ((this.state.pinnedBySpace[spaceId]?.length ?? 0) > 0) return;
    for (const windowMap of Object.values(this.state.spaceInstancesByWindow)) {
      if ((windowMap?.[spaceId]?.tempTabIds.length ?? 0) > 0) return;
    }
    this.state.spaces.splice(index, 1);
    for (const [windowIdStr, windowMap] of Object.entries(this.state.spaceInstancesByWindow)) {
      if (windowMap?.[spaceId]) {
        delete windowMap[spaceId];
        if (Object.keys(windowMap).length === 0) {
          delete this.state.spaceInstancesByWindow[Number(windowIdStr)];
        }
      }
    }
    const fallback = this.state.spaces[0]?.id ?? null;
    for (const [windowIdStr, activeSpaceId] of Object.entries(this.state.activeSpaceByWindow)) {
      if (activeSpaceId === spaceId) {
        this.state.activeSpaceByWindow[Number(windowIdStr)] = fallback;
      }
    }
    if (this.state.lastActivatedSpaceId === spaceId) {
      this.state.lastActivatedSpaceId = fallback;
    }
  }

  onWindowOpened(windowId: WindowId): void {
    this.state.activeSpaceByWindow[windowId] = this.state.lastActivatedSpaceId;
  }

  /**
   * Ensure a `spaceInstance` exists for `windowId`'s active Space, creating an
   * empty one if missing. Unlike `activateSpace` it does NOT touch
   * `lastActivatedSpaceId` or `activeSpaceByWindow` — it only materializes the
   * instance so a window that is active but un-instanced (e.g. the already-open
   * window at SW boot) can begin tracking temporary tabs. No-op when the window
   * has no active Space or already has an instance.
   */
  ensureSpaceInstance(windowId: WindowId): void {
    const spaceId = this.state.activeSpaceByWindow[windowId];
    if (spaceId === null || spaceId === undefined) return;
    this.ensureInstance(windowId, spaceId);
  }

  onWindowClosed(windowId: WindowId): void {
    delete this.state.spaceInstancesByWindow[windowId];
    delete this.state.activeSpaceByWindow[windowId];
  }

  onTabCreated(tab: { id?: TabId | undefined; windowId?: WindowId | undefined }): void {
    const tabId = tab.id;
    const windowId = tab.windowId;
    if (tabId === undefined || windowId === undefined) {
      log.error('onTabCreated: missing tab.id or tab.windowId', { tab });
      return;
    }
    const spaceId = this.state.activeSpaceByWindow[windowId];
    if (spaceId === null || spaceId === undefined) return;
    const instance = this.state.spaceInstancesByWindow[windowId]?.[spaceId];
    if (!instance) return;
    if (this.isBound(tabId)) return;
    if (instance.tempTabIds.includes(tabId)) return;
    // Per-window ownership guard (prevent-space-group-collapse): a tab belongs to
    // exactly one Space instance in a window — evict it from any sibling before
    // claiming it for the active instance here.
    this.claimTabForInstance(windowId, spaceId, tabId);
    // New tabs land at the top of the manual order (sidebar-pinned-tabs:
    // Temporary is a manually-ordered list, newest-first).
    instance.tempTabIds.unshift(tabId);
  }

  /**
   * Replace a window instance's Temporary order with `tabIds` (manual reorder
   * via drag). Keeps only ids currently temp, in the requested order; any temp
   * id the caller omitted is appended (race safety). No-op when the window has
   * no instance.
   */
  reorderTemp(windowId: WindowId, tabIds: TabId[]): void {
    const instance = this.activeInstance(windowId);
    if (!instance) {
      log.error('reorderTemp: no instance for window', { windowId });
      return;
    }
    const current = instance.tempTabIds;
    const present = new Set(current);
    const next = tabIds.filter((id) => present.has(id));
    for (const id of current) {
      if (!next.includes(id)) next.push(id);
    }
    instance.tempTabIds = next;
  }

  /**
   * Return a live tab id to a window instance's `tempTabIds` — the inverse of
   * the `bindSavedTab` invariant, used by the unpin flow (design D4) to drop a
   * formerly-pinned tab back into Temporary without closing it. Idempotent:
   * no-op when the window has no instance, when the tab is still bound to any
   * saved tab, or when it is already present in `tempTabIds`.
   */
  restoreTempTab(windowId: WindowId, tabId: TabId): void {
    const spaceId = this.state.activeSpaceByWindow[windowId];
    if (spaceId === null || spaceId === undefined) return;
    const instance = this.state.spaceInstancesByWindow[windowId]?.[spaceId];
    if (!instance) return;
    if (this.isBound(tabId)) return;
    if (instance.tempTabIds.includes(tabId)) return;
    // Per-window ownership guard (prevent-space-group-collapse): evict from any
    // sibling instance first so the restored tab is owned by exactly one Space
    // instance in this window.
    this.claimTabForInstance(windowId, spaceId, tabId);
    // An unpinned tab returns to the top of Temporary (most visible).
    instance.tempTabIds.unshift(tabId);
  }

  onTabRemoved(tabId: TabId, info: { windowId?: WindowId; isWindowClosing?: boolean }): void {
    for (const instance of this.allInstances()) {
      const idx = instance.tempTabIds.indexOf(tabId);
      if (idx !== -1) {
        instance.tempTabIds.splice(idx, 1);
        delete instance.tempTabTitles[tabId];
      }
    }
    // Per-window-tab-bindings: a closing tab can occupy exactly one window slot
    // (Chrome tab ids are globally unique). Delete that slot; when it was the
    // saved tab's LAST remaining slot, the record becomes dormant everywhere and
    // its single canonical `currentURL` clears.
    for (const [savedTabId, slots] of Object.entries(this.state.tabBindings)) {
      let removed = false;
      for (const [windowIdStr, boundTabId] of Object.entries(slots)) {
        if (boundTabId === tabId) {
          delete slots[Number(windowIdStr)];
          removed = true;
        }
      }
      if (removed && Object.keys(slots).length === 0) {
        const saved = this.state.savedTabs[savedTabId];
        if (saved) saved.currentURL = null;
      }
    }
    delete this.state.tabLastActivity[tabId];
    void info;
  }

  onTabUpdated(tabId: TabId, changeInfo: { url?: string; status?: string }): void {
    if (changeInfo.url !== undefined) {
      this.state.tabLastActivity[tabId] = Date.now();
      // Single canonical `currentURL` (last-writer-wins across windows, design
      // D3): whichever window's bound tab navigated updates the one field.
      for (const [savedTabId, slots] of Object.entries(this.state.tabBindings)) {
        for (const boundTabId of Object.values(slots)) {
          if (boundTabId === tabId) {
            const saved = this.state.savedTabs[savedTabId];
            if (saved) saved.currentURL = changeInfo.url;
          }
        }
      }
    }
  }

  /**
   * Bind a saved tab to a live Chrome tab id IN A SPECIFIC WINDOW (per-window-
   * tab-bindings, ADR 0009): set `tabBindings[savedTabId][windowId] = tabId`,
   * leaving any other window's slot untouched. Updates the single canonical
   * `currentURL` and enforces the bound-not-temp invariant for `windowId`.
   */
  bindSavedTab(savedTabId: SavedTabId, windowId: WindowId, tabId: TabId, currentURL: string): void {
    const saved = this.state.savedTabs[savedTabId];
    if (!saved) {
      log.error('bindSavedTab: unknown savedTabId', { savedTabId });
      return;
    }
    this.ensureBindingRecord(savedTabId)[windowId] = tabId;
    saved.currentURL = currentURL;
    this.removeFromWindowTemp(windowId, tabId);
  }

  /**
   * Drop ONE window's binding slot for a saved tab (per-window-tab-bindings).
   * The saved tab stays bound in any other window where it still holds a slot.
   * `currentURL` is left to the single-canonical `onTabUpdated` writer (design
   * D3) — unbinding one window never rewrites it.
   */
  unbindSavedTab(savedTabId: SavedTabId, windowId: WindowId): void {
    const saved = this.state.savedTabs[savedTabId];
    if (!saved) {
      log.error('unbindSavedTab: unknown savedTabId', { savedTabId });
      return;
    }
    const slots = this.state.tabBindings[savedTabId];
    if (slots) delete slots[windowId];
  }

  makeSavedTabHomeCurrent(savedTabId: SavedTabId): void {
    const saved = this.state.savedTabs[savedTabId];
    if (!saved) {
      log.error('makeSavedTabHomeCurrent: unknown savedTabId', { savedTabId });
      return;
    }
    if (saved.currentURL === null) {
      log.error('makeSavedTabHomeCurrent: currentURL is null', { savedTabId });
      return;
    }
    saved.originalURL = saved.currentURL;
  }

  /**
   * Apply restart-recovery results PER WINDOW (per-window-tab-bindings, ADR
   * 0009). The map is keyed `savedTabId → windowId → result`: a non-null result
   * rebinds `tabBindings[savedTabId][windowId]` to the matched tab id (and
   * enforces the bound-not-temp invariant for that window); a `null` result drops
   * that window's slot (no live tab matched). Other window slots are untouched.
   * `currentURL` is only rewritten when a result explicitly carries one — restart
   * recovery rebinds by URL WITHOUT modifying `currentURL` (design D5).
   */
  applyRestartRecovery(map: {
    [savedTabId: SavedTabId]: {
      [windowId: WindowId]: { tabId: TabId; currentURL?: string } | null;
    };
  }): void {
    for (const [savedTabId, byWindow] of Object.entries(map)) {
      const saved = this.state.savedTabs[savedTabId];
      if (!saved) {
        log.error('applyRestartRecovery: unknown savedTabId', { savedTabId });
        continue;
      }
      const slots = this.ensureBindingRecord(savedTabId);
      for (const [windowIdStr, entry] of Object.entries(byWindow)) {
        const windowId = Number(windowIdStr);
        if (entry === null) {
          delete slots[windowId];
          continue;
        }
        slots[windowId] = entry.tabId;
        if (entry.currentURL !== undefined) {
          saved.currentURL = entry.currentURL;
        }
        this.removeFromWindowTemp(windowId, entry.tabId);
      }
    }
  }

  registerSavedTab(tab: SavedTab): void {
    if (this.state.savedTabs[tab.id]) return;
    this.state.savedTabs[tab.id] = { ...tab };
    if (this.state.tabBindings[tab.id] === undefined) {
      // Dormant in every window: an empty per-window record (per-window-tab-
      // bindings, ADR 0009).
      this.state.tabBindings[tab.id] = {};
    }
  }

  /**
   * Replace a Space's pinned tree with `nodes` after validating it (tree-replace
   * — the single structural-drag path, design D7): unknown ids (no `savedTabs`
   * record) are dropped, any id appearing more than once across the whole tree
   * is de-duplicated, and folder `children` are flattened to ids only
   * (single-level). Empty folders are kept.
   */
  setPinned(spaceId: SpaceId, nodes: PinNode[]): void {
    this.state.pinnedBySpace[spaceId] = this.sanitizePinned(nodes);
  }

  /** Insert a tab node at a top-level index. No-op if the id is already placed
   * anywhere in the tree (top level or inside a folder). */
  addPinned(spaceId: SpaceId, savedTabId: SavedTabId, index: number): void {
    const list = this.state.pinnedBySpace[spaceId] ?? [];
    if (this.pinnedContains(list, savedTabId)) return;
    const clamped = Math.max(0, Math.min(index, list.length));
    list.splice(clamped, 0, { kind: 'tab', id: savedTabId });
    this.state.pinnedBySpace[spaceId] = list;
  }

  /**
   * Append a saved tab to a folder's `children`, returning whether it placed it.
   * No-op returning `false` when the Space has no list, the folder id is unknown,
   * or the id is already placed anywhere in the tree (top level or any folder) —
   * mirroring `addPinned`'s idempotency. The coordinator uses the boolean for the
   * no-orphan place-then-bind ordering (design D3/D4): a temp tab leaves Temporary
   * only when its record was actually placed.
   */
  addPinnedToFolder(spaceId: SpaceId, folderId: FolderId, savedTabId: SavedTabId): boolean {
    const list = this.state.pinnedBySpace[spaceId];
    if (!list) return false;
    if (this.pinnedContains(list, savedTabId)) return false;
    const folder = this.findFolder(spaceId, folderId);
    if (!folder) return false;
    folder.children.push(savedTabId);
    return true;
  }

  /** Remove a tab id from a Space's tree, whether at top level or inside a
   * folder's `children`. Empty folders left behind are kept. */
  removePinned(spaceId: SpaceId, savedTabId: SavedTabId): void {
    const list = this.state.pinnedBySpace[spaceId];
    if (!list) return;
    this.removeIdFromNodes(list, savedTabId);
  }

  /**
   * Insert a favorite into the flat global `faviconRow` at a clamped index
   * (favicon-row-model, ADR 0010). No-op when the id is already present —
   * mirrors {@link addPinned}'s idempotency. The favicon row is flat (not a
   * `PinNode[]` tree); favorites do not nest into folders in v1.
   */
  addFavorite(savedTabId: SavedTabId, index: number): void {
    const row = this.state.faviconRow;
    if (row.includes(savedTabId)) return;
    const clamped = Math.max(0, Math.min(index, row.length));
    row.splice(clamped, 0, savedTabId);
  }

  /**
   * Replace `faviconRow` with the post-drop order (favicon-row-model). Keeps
   * only ids currently present (drops unknown defensively) and appends any
   * present id the caller omitted (race safety) — mirrors {@link reorderTemp} /
   * {@link reorderSpaces}.
   */
  reorderFavorites(ids: SavedTabId[]): void {
    const current = this.state.faviconRow;
    const present = new Set(current);
    const next = ids.filter((id) => present.has(id));
    for (const id of current) {
      if (!next.includes(id)) next.push(id);
    }
    this.state.faviconRow = next;
  }

  /**
   * Decouple a pinned saved tab into a global favorite (favicon-row-model, ADR
   * 0010 D5 — the store half of `favoriteSavedTab`): set the record's
   * `spaceId = null`, remove its id from its current `pinnedBySpace[oldSpaceId]`
   * placement, and append it to the flat `faviconRow`. A MOVE, never a copy —
   * the record ends in exactly one placement (the no-duplicate-placement rule).
   * Idempotent no-op when the record is already a favorite. Chrome-free: the
   * coordinator owns the `chrome.tabs.ungroup` I/O for each bound window.
   */
  moveSavedTabToFavorites(savedTabId: SavedTabId): void {
    const saved = this.state.savedTabs[savedTabId];
    if (!saved) {
      log.error('moveSavedTabToFavorites: unknown savedTabId', { savedTabId });
      return;
    }
    if (saved.spaceId === null) return; // already a favorite
    const oldSpaceId = saved.spaceId;
    saved.spaceId = null;
    const list = this.state.pinnedBySpace[oldSpaceId];
    if (list) this.removeIdFromNodes(list, savedTabId);
    if (!this.state.faviconRow.includes(savedTabId)) {
      this.state.faviconRow.push(savedTabId);
    }
  }

  /**
   * Couple a global favorite to a Space (favicon-row-model, ADR 0010 D5 — the
   * store half of `pinSavedTab`): set the record's `spaceId = spaceId`, remove
   * its id from the flat `faviconRow`, and insert it into `pinnedBySpace[spaceId]`
   * at a clamped top-level index (via {@link addPinned}). A MOVE, never a copy —
   * the record ends in exactly one placement. Chrome-free: the coordinator owns
   * the `chrome.tabs.group` I/O for each bound window.
   */
  moveSavedTabToSpace(savedTabId: SavedTabId, spaceId: SpaceId, index: number): void {
    const saved = this.state.savedTabs[savedTabId];
    if (!saved) {
      log.error('moveSavedTabToSpace: unknown savedTabId', { savedTabId });
      return;
    }
    saved.spaceId = spaceId;
    const row = this.state.faviconRow;
    const idx = row.indexOf(savedTabId);
    if (idx !== -1) row.splice(idx, 1);
    this.addPinned(spaceId, savedTabId, index);
  }

  /** Mint an empty folder at the top of a Space's pinned list. */
  createFolder(spaceId: SpaceId): void {
    const list = this.state.pinnedBySpace[spaceId] ?? [];
    list.unshift({
      kind: 'folder',
      id: this.newId(),
      name: DEFAULT_FOLDER_NAME,
      icon: DEFAULT_FOLDER_ICON,
      color: DEFAULT_FOLDER_COLOR,
      children: [],
    });
    this.state.pinnedBySpace[spaceId] = list;
  }

  /**
   * Drag-onto-create: mint a folder holding `[tabIdB, tabIdA]` at `index`,
   * removing both ids from their prior positions first. `tabIdA` is the dragged
   * tab dropped onto `tabIdB`; the folder lands at B's place.
   */
  createFolderFromTabs(
    spaceId: SpaceId,
    tabIdA: SavedTabId,
    tabIdB: SavedTabId,
    index: number,
  ): void {
    const list = this.state.pinnedBySpace[spaceId];
    if (!list) return;
    if (!this.state.savedTabs[tabIdA] || !this.state.savedTabs[tabIdB]) {
      log.error('createFolderFromTabs: unknown savedTab', { tabIdA, tabIdB });
      return;
    }
    this.removeIdFromNodes(list, tabIdA);
    this.removeIdFromNodes(list, tabIdB);
    const clamped = Math.max(0, Math.min(index, list.length));
    list.splice(clamped, 0, {
      kind: 'folder',
      id: this.newId(),
      name: DEFAULT_FOLDER_NAME,
      icon: DEFAULT_FOLDER_ICON,
      color: DEFAULT_FOLDER_COLOR,
      children: [tabIdB, tabIdA],
    });
  }

  renameFolder(spaceId: SpaceId, folderId: FolderId, name: string): void {
    const folder = this.findFolder(spaceId, folderId);
    if (!folder) {
      log.error('renameFolder: unknown folder', { spaceId, folderId });
      return;
    }
    folder.name = name;
  }

  /**
   * Set or clear a pinned (saved) tab's custom display name. A trimmed,
   * non-empty `newName` sets `customTitle`; empty/whitespace clears it (the row
   * then falls back to the stored `title`).
   */
  renameTab(savedTabId: SavedTabId, newName: string): void {
    const saved = this.state.savedTabs[savedTabId];
    if (!saved) {
      log.error('renameTab: unknown savedTabId', { savedTabId });
      return;
    }
    const trimmed = newName.trim();
    if (trimmed) saved.customTitle = trimmed;
    else delete saved.customTitle;
  }

  /**
   * Set or clear a saved tab's domain boundary (pinned-tab-domain-boundary). A
   * `null` boundary REMOVES the field (absent ⇒ inherit the global
   * `pinnedTabBoundaryDefault`); an explicit `{ mode: 'off' }` / `{ mode:
   * 'locked', allow }` sets it. Thin-store rule: plain data only — the
   * coordinator handles validation (throw on unknown id) and re-pushing config.
   */
  setTabBoundary(savedTabId: SavedTabId, boundary: TabBoundary | null): void {
    const saved = this.state.savedTabs[savedTabId];
    if (!saved) {
      log.error('setTabBoundary: unknown savedTabId', { savedTabId });
      return;
    }
    if (boundary === null) delete saved.boundary;
    else saved.boundary = boundary;
  }

  /**
   * Set or clear a temporary tab's custom display name in one (window, Space)
   * instance. A trimmed, non-empty `newName` sets the override; empty/whitespace
   * deletes it (the row then falls back to the live tab title). No-op when the
   * window/Space has no instance.
   */
  renameTempTab(windowId: WindowId, spaceId: SpaceId, tabId: TabId, newName: string): void {
    const instance = this.state.spaceInstancesByWindow[windowId]?.[spaceId];
    if (!instance) {
      log.error('renameTempTab: no instance', { windowId, spaceId });
      return;
    }
    const trimmed = newName.trim();
    if (trimmed) instance.tempTabTitles[tabId] = trimmed;
    else delete instance.tempTabTitles[tabId];
  }

  setFolderIcon(spaceId: SpaceId, folderId: FolderId, icon: string): void {
    const folder = this.findFolder(spaceId, folderId);
    if (!folder) {
      log.error('setFolderIcon: unknown folder', { spaceId, folderId });
      return;
    }
    folder.icon = icon;
  }

  setFolderColor(spaceId: SpaceId, folderId: FolderId, color: string): void {
    const folder = this.findFolder(spaceId, folderId);
    if (!folder) {
      log.error('setFolderColor: unknown folder', { spaceId, folderId });
      return;
    }
    folder.color = color;
  }

  /** Remove a folder, spilling its children back to top-level tab nodes at the
   * folder's former position (children are neither unpinned nor trashed). */
  deleteFolder(spaceId: SpaceId, folderId: FolderId): void {
    const list = this.state.pinnedBySpace[spaceId];
    if (!list) return;
    const idx = list.findIndex((n) => n.kind === 'folder' && n.id === folderId);
    if (idx === -1) {
      log.error('deleteFolder: unknown folder', { spaceId, folderId });
      return;
    }
    const folder = list[idx] as Extract<PinNode, { kind: 'folder' }>;
    // Spill the children back to top level at the folder's former slot, but skip
    // any id already placed elsewhere in the list (or repeated within the
    // folder). A duplicate top-level id would crash the sidebar's keyed render;
    // remove the folder first so `pinnedContains` checks the remaining list.
    list.splice(idx, 1);
    const spilled: PinNode[] = [];
    const seen = new Set<SavedTabId>();
    for (const id of folder.children) {
      if (seen.has(id) || this.pinnedContains(list, id)) continue;
      seen.add(id);
      spilled.push({ kind: 'tab', id });
    }
    list.splice(idx, 0, ...spilled);
  }

  /**
   * Sidebar-local mutator (see D5). The SW never calls this; the field
   * `pinnedExpandedByWindow` is augmented onto `state` by the sidebar's
   * `createSidebarStore` and is NOT part of `AppState`. We mutate through
   * a structural cast so the LunmaStore class can carry the method without
   * polluting `AppState` with sidebar-only fields.
   */
  setPinnedExpanded(windowId: WindowId, expanded: boolean): void {
    const augmented = this.state as unknown as {
      pinnedExpandedByWindow?: { [windowId: WindowId]: boolean };
    };
    if (!augmented.pinnedExpandedByWindow) augmented.pinnedExpandedByWindow = {};
    augmented.pinnedExpandedByWindow[windowId] = expanded;
  }

  /**
   * Sidebar-local, per-window folder expand/collapse state (design D2). Like
   * `setPinnedExpanded`, the `expandedFoldersByWindow` field is augmented onto
   * `state` by the sidebar and is NOT part of `AppState` — folder open/closed is
   * a property of "this window's view", never persisted, so the same Space's
   * folder can be open in one window and collapsed in another.
   */
  setFolderExpanded(windowId: WindowId, folderId: FolderId, expanded: boolean): void {
    const augmented = this.state as unknown as {
      expandedFoldersByWindow?: { [windowId: WindowId]: { [folderId: FolderId]: boolean } };
    };
    if (!augmented.expandedFoldersByWindow) augmented.expandedFoldersByWindow = {};
    if (!augmented.expandedFoldersByWindow[windowId]) {
      augmented.expandedFoldersByWindow[windowId] = {};
    }
    const forWindow = augmented.expandedFoldersByWindow[windowId];
    if (forWindow) forWindow[folderId] = expanded;
  }

  /**
   * Sidebar-local, per-window one-shot "open inline rename on the next
   * newly-created folder" flag (pin-temp-tab-into-folder). Armed when two tabs
   * are folded into a NEW folder — a temporary tab dropped onto a pinned tab,
   * whose fold is initiated in `TempTabs` but whose rename UI lives in
   * `PinnedTabs` (siblings); the active `PinnedTabs` consumes it (sets `false`)
   * the moment it opens the editor. Like `setFolderExpanded`, the
   * `autoRenameNextFolderByWindow` field is augmented onto `state` by the sidebar
   * and is NOT part of `AppState` — never persisted, never broadcast, so an arm
   * in one window can never open a spurious rename in another (each window keys
   * its own flag, and the broadcast carries only `AppState`).
   */
  setAutoRenameNextFolder(windowId: WindowId, armed: boolean): void {
    const augmented = this.state as unknown as {
      autoRenameNextFolderByWindow?: { [windowId: WindowId]: boolean };
    };
    if (!augmented.autoRenameNextFolderByWindow) augmented.autoRenameNextFolderByWindow = {};
    augmented.autoRenameNextFolderByWindow[windowId] = armed;
  }

  /**
   * Remove a SavedTab record entirely: drop it from `savedTabs`, its binding,
   * and every placement family — `pinnedBySpace` (the pinned tree) AND the flat
   * `faviconRow` (favicon-row-model, ADR 0010 D6 chokepoint), so a deleted /
   * unpinned favorite can never leak a dangling id. The coordinator's
   * `deleteSavedTab` handler closes any bound tab before calling this.
   */
  removeSavedTab(savedTabId: SavedTabId): void {
    if (!this.state.savedTabs[savedTabId]) {
      log.error('removeSavedTab: unknown savedTabId', { savedTabId });
      return;
    }
    delete this.state.savedTabs[savedTabId];
    delete this.state.tabBindings[savedTabId];
    for (const list of Object.values(this.state.pinnedBySpace)) {
      this.removeIdFromNodes(list, savedTabId);
    }
    const favIdx = this.state.faviconRow.indexOf(savedTabId);
    if (favIdx !== -1) this.state.faviconRow.splice(favIdx, 1);
  }

  removeTrashedSpace(spaceId: SpaceId): void {
    delete this.state.trash[spaceId];
  }

  /**
   * Set or clear a Space's auto-archive override (auto-archive). A `null`
   * `autoArchive` REMOVES the field (absent ⇒ inherit the global
   * `autoArchiveEnabled` / `autoArchiveIdleMinutes` settings); an explicit
   * `{ mode: 'off' }` / `{ mode: 'custom'; idleMinutes }` sets it. Thin-store
   * rule: plain data only — the coordinator validates (throw on unknown id).
   * Logs + no-ops on an unknown `spaceId`. Mirrors {@link setTabBoundary}.
   */
  setSpaceAutoArchive(spaceId: SpaceId, autoArchive: SpaceAutoArchive | null): void {
    const space = this.state.spaces.find((s) => s.id === spaceId);
    if (!space) {
      log.error('setSpaceAutoArchive: unknown spaceId', { spaceId });
      return;
    }
    if (autoArchive === null) delete space.autoArchive;
    else space.autoArchive = autoArchive;
  }

  // ───────────────────────────────────────────────────────────────────────
  // Archived temporary tabs (auto-archive). Plain-data, synchronous mutators;
  // the background sweep handler owns all chrome.* I/O and the `now` timestamp.
  // ───────────────────────────────────────────────────────────────────────

  /**
   * Append an `ArchivedTab` record to `archivedTabs` (auto-archive sweep). The
   * sweep handler appends one per removed tab, then calls
   * {@link pruneArchivedTabs} once at the end of the tick to bound the list.
   */
  appendArchivedTab(record: ArchivedTab): void {
    this.state.archivedTabs.push(record);
  }

  /**
   * Enforce the retention bounds on `archivedTabs` (auto-archive): drop entries
   * older than `ttlMs` before `now`, then keep only the most recent
   * `ARCHIVE_MAX_ENTRIES` by `archivedAt` (oldest evicted, FIFO). Runs at the end
   * of every sweep, even one that archived nothing. `ttlMs` is the user-tunable
   * retention window (`autoArchiveRetentionDays`), passed by the sweep handler;
   * defaults to `ARCHIVE_TTL_MS` (30 days) for callers that don't override it. The
   * entry-count cap is FIXED. Survivors keep their original order; replaces in
   * place (so the `$state` proxy + subscribers survive) and only when the contents
   * actually change.
   */
  pruneArchivedTabs(now: number, ttlMs: number = ARCHIVE_TTL_MS): void {
    const cutoff = now - ttlMs;
    const withinTtl = this.state.archivedTabs.filter((e) => e.archivedAt >= cutoff);
    let kept = withinTtl;
    if (withinTtl.length > ARCHIVE_MAX_ENTRIES) {
      // Keep the N most-recent by archivedAt, in their ORIGINAL order (no
      // reordering of the persisted/broadcast array). `sort` is stable, so ties
      // at the same archivedAt resolve deterministically by prior position.
      const survivors = new Set(
        [...withinTtl].sort((a, b) => b.archivedAt - a.archivedAt).slice(0, ARCHIVE_MAX_ENTRIES),
      );
      kept = withinTtl.filter((e) => survivors.has(e));
    }
    if (kept.length !== this.state.archivedTabs.length) {
      this.state.archivedTabs.splice(0, this.state.archivedTabs.length, ...kept);
    }
  }

  /**
   * Remove the `archivedTabs` entry identified by the composite `(archivedAt,
   * tabId)` (auto-archive restore). No-op when none matches. The pair is unique —
   * `archivedAt` alone is not (a sweep stamps every tab it archives with the same
   * `now`), but a tab is archived at most once per sweep and sweeps carry distinct
   * timestamps — so this removes exactly the restored entry.
   */
  removeArchivedTab(archivedAt: number, tabId: number): void {
    const idx = this.state.archivedTabs.findIndex(
      (e) => e.archivedAt === archivedAt && e.tabId === tabId,
    );
    if (idx !== -1) this.state.archivedTabs.splice(idx, 1);
  }

  /** Discard ALL archived-tab records (auto-archive "Clear all"). Splices in place
   * so the `$state` array proxy + subscribers survive; no-op when already empty. */
  clearArchivedTabs(): void {
    if (this.state.archivedTabs.length === 0) return;
    this.state.archivedTabs.splice(0, this.state.archivedTabs.length);
  }

  // ───────────────────────────────────────────────────────────────────────
  // Ephemeral live-tab metadata (sidebar-temp-tabs). Maintained from Chrome
  // tab events; broadcast as part of AppState; stripped before persist.
  // ───────────────────────────────────────────────────────────────────────

  /**
   * Insert or update a `LiveTab` from `onCreated` / `onUpdated`. Provided
   * fields override the existing entry; absent fields are preserved (so a
   * partial `onUpdated` changeInfo doesn't clobber `windowId`/`active`).
   * No-ops when none of the visible fields (`title`/`url`/`active`/`status`)
   * — nor `windowId` — change, so a redundant event mutates nothing.
   */
  syncLiveTab(tab: {
    id?: TabId | undefined;
    windowId?: WindowId | undefined;
    title?: string | undefined;
    url?: string | undefined;
    active?: boolean | undefined;
    status?: string | undefined;
    favIconUrl?: string | undefined;
  }): void {
    const tabId = tab.id;
    if (tabId === undefined) {
      log.error('syncLiveTab: missing tab.id', { tab });
      return;
    }
    const existing = this.state.liveTabsById[tabId];
    const windowId = tab.windowId ?? existing?.windowId;
    if (windowId === undefined) {
      // No existing entry and no windowId to place the tab — a benign race
      // (e.g. an onUpdated arriving before the create/boot-rebuild seeds it).
      log.debug('syncLiveTab: cannot resolve windowId yet', { tabId });
      return;
    }
    const next: LiveTab = {
      tabId,
      windowId,
      // An empty incoming title (Chrome emits `title: ''` mid-navigation) must
      // NOT clobber a previously-resolved title — `??` wouldn't catch `''`, so
      // guard it explicitly and keep the last good title until a real one lands.
      title: tab.title !== undefined && tab.title !== '' ? tab.title : (existing?.title ?? ''),
      url: tab.url ?? existing?.url ?? '',
      active: tab.active ?? existing?.active ?? false,
      status:
        tab.status !== undefined ? normalizeStatus(tab.status) : (existing?.status ?? 'complete'),
    };
    // Carry the Chrome-resolved favicon when present, else keep the last good
    // one. Set conditionally so the optional key isn't assigned `undefined`.
    const favIconUrl = tab.favIconUrl ?? existing?.favIconUrl;
    if (favIconUrl !== undefined) next.favIconUrl = favIconUrl;
    if (
      existing &&
      existing.windowId === next.windowId &&
      existing.title === next.title &&
      existing.url === next.url &&
      existing.active === next.active &&
      existing.status === next.status &&
      existing.favIconUrl === next.favIconUrl
    ) {
      return; // visible fields unchanged — no mutation, no broadcast needed
    }
    this.state.liveTabsById[tabId] = next;
  }

  removeLiveTab(tabId: TabId): void {
    delete this.state.liveTabsById[tabId];
  }

  /**
   * Mark `tabId` as the active tab in `windowId`, clearing the active flag on
   * every other tab in that window. Only mutates entries whose flag changes.
   *
   * A tab going active → inactive just LOST focus, which counts as activity for
   * auto-archive: its `tabLastActivity` is refreshed to now, so its idle clock
   * measures "time since you last looked at it," not merely "time since its last
   * navigation" — a tab you read for a while without navigating isn't archived
   * the moment you switch away. Only tabs that ALREADY have a `tabLastActivity`
   * entry are refreshed (a never-navigated tab carries no staleness signal and
   * stays unarchivable, per the auto-archive candidate rules).
   */
  setActiveTab(windowId: WindowId, tabId: TabId): void {
    for (const entry of Object.values(this.state.liveTabsById)) {
      if (entry.windowId !== windowId) continue;
      const shouldBeActive = entry.tabId === tabId;
      if (entry.active !== shouldBeActive) {
        entry.active = shouldBeActive;
        if (!shouldBeActive && entry.tabId in this.state.tabLastActivity) {
          this.state.tabLastActivity[entry.tabId] = Date.now();
        }
      }
    }
  }

  /** Seed the whole map from `chrome.tabs.query` results (boot rebuild). */
  rebuildLiveTabs(
    tabs: ReadonlyArray<{
      id?: TabId | undefined;
      windowId?: WindowId | undefined;
      title?: string | undefined;
      url?: string | undefined;
      active?: boolean | undefined;
      status?: string | undefined;
      favIconUrl?: string | undefined;
    }>,
  ): void {
    const next: { [tabId: TabId]: LiveTab } = {};
    for (const tab of tabs) {
      if (tab.id === undefined || tab.windowId === undefined) continue;
      const entry: LiveTab = {
        tabId: tab.id,
        windowId: tab.windowId,
        title: tab.title ?? '',
        url: tab.url ?? '',
        active: tab.active ?? false,
        status: normalizeStatus(tab.status),
      };
      if (tab.favIconUrl !== undefined) entry.favIconUrl = tab.favIconUrl;
      next[tab.id] = entry;
    }
    this.state.liveTabsById = next;
  }

  /**
   * The active (window, Space) instance, or `undefined` when the window has no
   * active Space or that Space has no instance yet. The active Space is
   * `activeSpaceByWindow[windowId]`; its instance lives at
   * `spaceInstancesByWindow[windowId][activeSpaceId]`.
   */
  private activeInstance(windowId: WindowId): SpaceInstance | undefined {
    const spaceId = this.state.activeSpaceByWindow[windowId];
    if (spaceId === null || spaceId === undefined) return undefined;
    return this.state.spaceInstancesByWindow[windowId]?.[spaceId];
  }

  /** Iterate every (window, Space) instance across all windows. */
  private *allInstances(): Generator<SpaceInstance> {
    for (const windowMap of Object.values(this.state.spaceInstancesByWindow)) {
      if (!windowMap) continue;
      for (const instance of Object.values(windowMap)) {
        yield instance;
      }
    }
  }

  /**
   * Ensure the (window, Space) instance exists, creating the window map and/or
   * an empty `{ groupId: -1, tempTabIds: [] }` instance as needed. Returns the
   * live (reactive) instance. Idempotent — returns the existing instance
   * untouched when present.
   */
  private ensureInstance(windowId: WindowId, spaceId: SpaceId): SpaceInstance {
    let windowMap = this.state.spaceInstancesByWindow[windowId];
    if (!windowMap) {
      this.state.spaceInstancesByWindow[windowId] = {};
      // Re-read so we mutate the reactive proxy, not the plain literal.
      windowMap = this.state.spaceInstancesByWindow[windowId] as {
        [spaceId: SpaceId]: SpaceInstance;
      };
    }
    if (!windowMap[spaceId]) {
      windowMap[spaceId] = { spaceId, groupId: -1, tempTabIds: [], tempTabTitles: {} };
    }
    return windowMap[spaceId];
  }

  /**
   * Per-window ownership guard (prevent-space-group-collapse): remove `tabId`
   * from every OTHER Space instance in `windowId` (and its `tempTabTitles`), so a
   * subsequent add to `spaceId`'s instance is exclusive within the window —
   * generalizing the eviction loop in {@link assignSpaceTabs}. Does NOT add the
   * tab; the caller appends it. Scoped to `windowId`, so the same Space active in
   * another window keeps its independent `tempTabIds`.
   */
  private claimTabForInstance(windowId: WindowId, spaceId: SpaceId, tabId: TabId): void {
    const windowMap = this.state.spaceInstancesByWindow[windowId];
    if (!windowMap) return;
    for (const [otherSpaceId, instance] of Object.entries(windowMap)) {
      if (otherSpaceId === spaceId || !instance) continue;
      const idx = instance.tempTabIds.indexOf(tabId);
      if (idx !== -1) instance.tempTabIds.splice(idx, 1);
      delete instance.tempTabTitles[tabId];
    }
  }

  /**
   * Validate a pinned tree for `setPinned`: drop tab ids with no `savedTabs`
   * record, de-duplicate any id seen more than once across the whole tree (top
   * level and every folder's children), and rebuild folder children as plain id
   * lists (single-level). Empty folders are preserved. Returns a fresh array.
   */
  private sanitizePinned(nodes: PinNode[]): PinNode[] {
    const seen = new Set<SavedTabId>();
    const out: PinNode[] = [];
    for (const node of nodes) {
      if (node.kind === 'tab') {
        if (!this.state.savedTabs[node.id] || seen.has(node.id)) continue;
        seen.add(node.id);
        out.push({ kind: 'tab', id: node.id });
      } else {
        const children: SavedTabId[] = [];
        for (const id of node.children) {
          if (!this.state.savedTabs[id] || seen.has(id)) continue;
          seen.add(id);
          children.push(id);
        }
        out.push({
          kind: 'folder',
          id: node.id,
          name: node.name,
          icon: node.icon,
          color: node.color,
          children,
        });
      }
    }
    return out;
  }

  /** Whether `id` is placed anywhere in `list` (top level or a folder child). */
  private pinnedContains(list: PinNode[], id: SavedTabId): boolean {
    for (const node of list) {
      if (node.kind === 'tab') {
        if (node.id === id) return true;
      } else if (node.children.includes(id)) {
        return true;
      }
    }
    return false;
  }

  /** Remove the first occurrence of `id` from `list` (top level or a folder
   * child). Mutates in place; an emptied folder is left in place. */
  private removeIdFromNodes(list: PinNode[], id: SavedTabId): void {
    for (let i = 0; i < list.length; i += 1) {
      const node = list[i];
      if (node === undefined) continue;
      if (node.kind === 'tab') {
        if (node.id === id) {
          list.splice(i, 1);
          return;
        }
      } else {
        const ci = node.children.indexOf(id);
        if (ci !== -1) {
          node.children.splice(ci, 1);
          return;
        }
      }
    }
  }

  private findFolder(
    spaceId: SpaceId,
    folderId: FolderId,
  ): Extract<PinNode, { kind: 'folder' }> | undefined {
    const list = this.state.pinnedBySpace[spaceId];
    if (!list) return undefined;
    for (const node of list) {
      if (node.kind === 'folder' && node.id === folderId) return node;
    }
    return undefined;
  }

  private isBound(tabId: TabId): boolean {
    for (const slots of Object.values(this.state.tabBindings)) {
      for (const boundTabId of Object.values(slots)) {
        if (boundTabId === tabId) return true;
      }
    }
    return false;
  }

  /**
   * Return the (reactive) per-window binding record for `savedTabId`, creating an
   * empty one if absent. Mirrors {@link ensureInstance}: re-reads through the
   * `$state` proxy after assigning the literal so mutations stay reactive.
   */
  private ensureBindingRecord(savedTabId: SavedTabId): { [windowId: WindowId]: TabId } {
    let slots = this.state.tabBindings[savedTabId];
    if (!slots) {
      this.state.tabBindings[savedTabId] = {};
      slots = this.state.tabBindings[savedTabId] as { [windowId: WindowId]: TabId };
    }
    return slots;
  }

  /**
   * Enforce the bound-not-temp invariant for one window: drop `tabId` (and its
   * custom title) from every Space instance's `tempTabIds` in `windowId`. A
   * globally-unique Chrome tab id lives in exactly one window, so scoping the
   * removal to that window is sufficient.
   */
  private removeFromWindowTemp(windowId: WindowId, tabId: TabId): void {
    const windowMap = this.state.spaceInstancesByWindow[windowId];
    if (!windowMap) return;
    for (const instance of Object.values(windowMap)) {
      const idx = instance.tempTabIds.indexOf(tabId);
      if (idx !== -1) {
        instance.tempTabIds.splice(idx, 1);
        delete instance.tempTabTitles[tabId];
      }
    }
  }
}

// Compile-time guard: every public mutator is SYNCHRONOUS (returns void or a
// plain value such as `addPinnedToFolder`'s placed/not-placed boolean — never a
// Promise). Adding a method that returns Promise<*> here will fail tsc --noEmit,
// keeping the coordinator's one-mutation-per-drain model intact. The return-type
// test is wrapped in a tuple (`[R] extends [Promise<unknown>]`) so a union return
// like `boolean` is checked as a whole instead of distributing into an impossible
// `(=> true) & (=> false)` intersection.
type _MutatorMethods = {
  [K in keyof LunmaStore as LunmaStore[K] extends (...args: never[]) => unknown
    ? K
    : never]: LunmaStore[K];
};
type _NonAsyncReturning<T> = {
  [K in keyof T]: T[K] extends (...args: infer _A) => infer R
    ? [R] extends [Promise<unknown>]
      ? never
      : T[K]
    : T[K];
};
type _GuardNoAsyncMutators = _NonAsyncReturning<_MutatorMethods>;
const _lunmaStoreNoAsyncMutatorGuard: _GuardNoAsyncMutators = {} as unknown as _MutatorMethods;
void _lunmaStoreNoAsyncMutatorGuard;
