import type { CommandAck, CommandAckResult, SidebarCommand } from '../shared/bus';
import { toPersistable } from '../shared/chrome/storage';
import { log } from '../shared/logger';
import { sendBoundaryConfig } from '../shared/messages';
import { isNewTabUrl } from '../shared/new-tab';
import { disambiguateSpaceName, normalizeSpaceName } from '../shared/space-names';
import type { LunmaStore } from '../shared/store.svelte';
import type { AppState, SavedTab, SavedTabId, SpaceId, TabId, WindowId } from '../shared/types';
import { resolveBoundaryAllow } from '../shared/url-boundary';
import { handleAutoArchiveSweep, handleRestoreArchivedTab } from './auto-archive';
import { injectBoundary } from './boundary-injection';
import {
  activateTab,
  addTabToActiveGroup,
  closeGroupsForSpace,
  collapseOtherTrackedGroups,
  ensureGroupForSpace,
  expandGroup,
  moveTabToStripStart,
  resolveGroup,
  ungroupTabs,
  updateGroupTitleColor,
} from './tab-groups';

// Per `typed-message-bus` change: `PendingEvent` now spans both chrome events
// and sidebar commands. Sidebar variants carry a `correlationId` so the
// drain tail can emit a matching `'lunma/command-ack'` back to the bus client.

type SidebarPayload<K extends SidebarCommand['kind']> = Extract<
  SidebarCommand,
  { kind: K }
>['payload'];

type SidebarVariant<K extends SidebarCommand['kind']> = {
  source: 'sidebar';
  kind: K;
  payload: SidebarPayload<K>;
  correlationId: string;
};

export type PendingEvent =
  | { source: 'chrome'; kind: 'tabs.onCreated'; payload: { tab: chrome.tabs.Tab } }
  | {
      source: 'chrome';
      kind: 'tabs.onRemoved';
      payload: { tabId: number; info: chrome.tabs.OnRemovedInfo };
    }
  | {
      source: 'chrome';
      kind: 'tabs.onUpdated';
      payload: { tabId: number; changeInfo: chrome.tabs.OnUpdatedInfo };
    }
  | {
      source: 'chrome';
      kind: 'tabs.onActivated';
      payload: { activeInfo: chrome.tabs.OnActivatedInfo };
    }
  | { source: 'chrome'; kind: 'tabGroups.onRemoved'; payload: { groupId: number } }
  | {
      source: 'chrome';
      kind: 'tabGroups.onUpdated';
      payload: { group: chrome.tabGroups.TabGroup };
    }
  | { source: 'chrome'; kind: 'windows.onCreated'; payload: { window: chrome.windows.Window } }
  | { source: 'chrome'; kind: 'windows.onRemoved'; payload: { windowId: number } }
  | SidebarVariant<'createSpace'>
  | SidebarVariant<'renameSpace'>
  | SidebarVariant<'recolourSpace'>
  | SidebarVariant<'changeSpaceIcon'>
  | SidebarVariant<'deleteSpace'>
  | SidebarVariant<'restoreSpaceFromTrash'>
  | SidebarVariant<'activateSpace'>
  | SidebarVariant<'openSavedTab'>
  | SidebarVariant<'focusSavedTab'>
  | SidebarVariant<'goHome'>
  | SidebarVariant<'makeThisHome'>
  | SidebarVariant<'deleteSavedTab'>
  | SidebarVariant<'pinTab'>
  | SidebarVariant<'unpinTab'>
  | SidebarVariant<'reorderPinned'>
  | SidebarVariant<'favoriteTab'>
  | SidebarVariant<'favoriteSavedTab'>
  | SidebarVariant<'pinSavedTab'>
  | SidebarVariant<'reorderFavorites'>
  | SidebarVariant<'createFolder'>
  | SidebarVariant<'createFolderFromTabs'>
  | SidebarVariant<'renameTab'>
  | SidebarVariant<'renameTempTab'>
  | SidebarVariant<'renameFolder'>
  | SidebarVariant<'setFolderIcon'>
  | SidebarVariant<'setFolderColor'>
  | SidebarVariant<'deleteFolder'>
  | SidebarVariant<'reorderTemp'>
  | SidebarVariant<'reorderSpaces'>
  | SidebarVariant<'focusTab'>
  | SidebarVariant<'closeTab'>
  | SidebarVariant<'newTab'>
  | SidebarVariant<'clearTempTabs'>
  | SidebarVariant<'openUrl'>
  | SidebarVariant<'setTabBoundary'>
  | SidebarVariant<'restoreArchivedTab'>
  | SidebarVariant<'setSpaceAutoArchive'>
  | SidebarVariant<'deleteArchivedTab'>
  | SidebarVariant<'clearArchivedTabs'>
  // Auto-archive (auto-archive, design D2): the `chrome.alarms`-driven idle-tab
  // sweep. A new `source: 'alarm'` — not a Chrome event, not a sidebar command —
  // carrying no payload and no `correlationId` (fire-and-forget; nobody awaits it).
  | { source: 'alarm'; kind: 'autoArchiveSweep' };

export type PendingEventKind = PendingEvent['kind'];

// Every PendingEvent EXCEPT the payload-less `autoArchiveSweep`. The coalesce /
// merge plumbing only runs for payloaded kinds (the sweep declares no
// coalesceKey, so it never reaches a merge), so its payload type comes from here.
type PayloadedEvent = Extract<PendingEvent, { payload: unknown }>;
type PendingPayload = PayloadedEvent['payload'];

export interface EventPolicyEntry {
  coalesceKey?: (ev: PendingEvent) => string | number;
  /**
   * Optional per-kind merge applied when coalescing removes a prior queued
   * event of the same key. Returns the surviving event's payload as a
   * field-wise merge of the prior and incoming payloads (incoming wins per
   * field; fields absent from the incoming event keep the prior value). When
   * omitted, coalescing replaces the prior payload wholesale (last-write-wins).
   */
  mergePayload?: (prev: PendingPayload, next: PendingPayload) => PendingPayload;
}

function spaceIdKey(ev: PendingEvent): string {
  return ev.kind === 'renameSpace' ? ev.payload.spaceId : '';
}

function windowIdKey(ev: PendingEvent): number {
  return ev.kind === 'activateSpace' ? ev.payload.windowId : -1;
}

/**
 * Merge for `tabs.onUpdated`. Chrome's `changeInfo` is a PARTIAL delta — a
 * navigation emits e.g. `{ status: 'complete' }` and then, separately,
 * `{ favIconUrl }`. Replacing the prior payload on coalesce would drop the
 * earlier `status`, leaving the row spinning after the favicon resolved.
 * Merging field-wise (incoming wins) preserves every field any merged event
 * carried.
 */
function mergeTabsOnUpdatedPayload(prev: PendingPayload, next: PendingPayload): PendingPayload {
  const p = prev as Extract<PendingEvent, { kind: 'tabs.onUpdated' }>['payload'];
  const n = next as Extract<PendingEvent, { kind: 'tabs.onUpdated' }>['payload'];
  return { tabId: n.tabId, changeInfo: { ...p.changeInfo, ...n.changeInfo } };
}

/**
 * Merge for `tabGroups.onUpdated`. Its payload is a FULL `group` snapshot today
 * (the handler reads `group.title`), so this merge is a no-op in practice —
 * `{ ...prev.group, ...next.group }` equals `next.group` when `next.group`
 * carries every key. Applied for symmetry with `tabs.onUpdated` and to stay
 * correct if Chrome ever delivers a partial group; it is defensive, not a
 * present-bug fix.
 */
function mergeTabGroupsOnUpdatedPayload(
  prev: PendingPayload,
  next: PendingPayload,
): PendingPayload {
  const p = prev as Extract<PendingEvent, { kind: 'tabGroups.onUpdated' }>['payload'];
  const n = next as Extract<PendingEvent, { kind: 'tabGroups.onUpdated' }>['payload'];
  return { group: { ...p.group, ...n.group } };
}

export const EventPolicy: Record<PendingEventKind, EventPolicyEntry> = {
  'tabs.onCreated': {},
  'tabs.onRemoved': {},
  'tabs.onUpdated': {
    coalesceKey: (e) => (e.kind === 'tabs.onUpdated' ? e.payload.tabId : -1),
    mergePayload: mergeTabsOnUpdatedPayload,
  },
  'tabs.onActivated': {
    coalesceKey: (e) => (e.kind === 'tabs.onActivated' ? e.payload.activeInfo.windowId : -1),
  },
  'tabGroups.onRemoved': {},
  'tabGroups.onUpdated': {
    coalesceKey: (e) => (e.kind === 'tabGroups.onUpdated' ? e.payload.group.id : -1),
    mergePayload: mergeTabGroupsOnUpdatedPayload,
  },
  'windows.onCreated': {},
  'windows.onRemoved': {},
  // Sidebar-source commands per design D4. Coalesce only the two clear
  // last-write-wins cases. Everything else is per-click distinct.
  createSpace: {},
  renameSpace: { coalesceKey: spaceIdKey },
  recolourSpace: {},
  changeSpaceIcon: {},
  deleteSpace: {},
  restoreSpaceFromTrash: {},
  activateSpace: { coalesceKey: windowIdKey },
  openSavedTab: {},
  focusSavedTab: {},
  goHome: {},
  makeThisHome: {},
  deleteSavedTab: {},
  pinTab: {},
  unpinTab: {},
  reorderPinned: {},
  // Favicon-row-model (ADR 0010): per-click distinct, like pin/unpin/reorder.
  favoriteTab: {},
  favoriteSavedTab: {},
  pinSavedTab: {},
  reorderFavorites: {},
  renameTab: {},
  renameTempTab: {},
  createFolder: {},
  createFolderFromTabs: {},
  renameFolder: {},
  setFolderIcon: {},
  setFolderColor: {},
  deleteFolder: {},
  reorderTemp: {},
  reorderSpaces: {},
  focusTab: {},
  closeTab: {},
  newTab: {},
  clearTempTabs: {},
  // Per-invocation distinct — each launcher pick opens its own tab.
  openUrl: {},
  // Per-tab boundary edit — distinct per saved tab (no coalesce).
  setTabBoundary: {},
  // Auto-archive (auto-archive): each is a distinct intent — no coalescing. Two
  // sweeps queued in close succession run SEQUENTIALLY (the second sees the
  // first's archived state and finds ~zero candidates), per design D7.
  autoArchiveSweep: {},
  restoreArchivedTab: {},
  setSpaceAutoArchive: {},
  deleteArchivedTab: {},
  clearArchivedTabs: {},
};

export const QUEUE_CAP = 1000;

export type Handler<E extends PendingEvent> = (event: E) => void | Promise<void>;

export type HandlersMap = {
  [K in PendingEventKind]: Handler<Extract<PendingEvent, { kind: K }>>;
};

export type Persist = (state: AppState) => void | Promise<void>;
export type Broadcast = (msg: { method: string; state: AppState }) => void;

export interface CoordinatorOptions {
  store: LunmaStore;
  persist: Persist;
  broadcast: Broadcast;
  /** Optional ack emitter; defaults to chrome.runtime.sendMessage. Test seam. */
  emitAck?: (ack: CommandAck) => void;
}

function defaultEmitAck(ack: CommandAck): void {
  try {
    void chrome.runtime.sendMessage(ack).catch((err: unknown) => {
      const message = err instanceof Error ? err.message : String(err);
      // Sidebar closed → no listener → benign, matches broadcastState behavior.
      if (message.includes('Receiving end does not exist')) {
        log.debug('ACK_EMIT_NO_LISTENER', { id: ack.id });
        return;
      }
      log.error('ACK_EMIT_FAILED', { id: ack.id, err });
    });
  } catch (err) {
    log.error('ACK_EMIT_FAILED', { id: ack.id, err });
  }
}

interface AckEntry {
  id: string;
  result: CommandAckResult;
}

export class Coordinator {
  private readonly events: PendingEvent[] = [];
  private draining = false;
  private dirty = false;
  /**
   * Serialization of the persisted projection (`toPersistable`) last written by
   * this coordinator. A drain persists only when the new projection's
   * serialization differs — so a favicon-only (ephemeral) drain, which mutates
   * only the stripped `liveTabsById`, skips the redundant
   * `chrome.storage.local.set` while still broadcasting. Starts `null` (boot
   * persists directly, outside the coordinator), so the first post-boot drain
   * persists once even if redundant. Conservative in the SAFE direction: it may
   * cause a redundant persist (two semantically-equal projections that serialize
   * differently) but never wrongly SKIPS a real write (design D2).
   */
  private lastPersistedSignature: string | null = null;
  private drainPromise: Promise<void> | null = null;
  /** Per-drain ack buffer. Includes both coalesce-time pushes (D5b) and
   * handler-tail pushes. Flushed at end of drain. */
  private acks: AckEntry[] = [];

  /**
   * Side-effects deliberately floated OFF the drain's critical path so they
   * cannot gate the per-drain persist/broadcast. The motivating case is boundary
   * injection on `openSavedTab`: `configureBoundary` awaits
   * `chrome.scripting.executeScript` against a brand-new, still-loading tab,
   * which can block for *seconds* — and that must never delay the broadcast that
   * shows the freshly-opened pin as selected (the user-reported stall). Tracked
   * here so {@link idle} can settle them (tests/callers observe a quiescent
   * coordinator), while the broadcast has already gone out ahead of them. Each
   * runs to completion independently and swallows its own errors.
   */
  private readonly inflightSideEffects = new Set<Promise<void>>();

  private readonly store: LunmaStore;
  private readonly persist: Persist;
  private readonly broadcast: Broadcast;
  private readonly emitAck: (ack: CommandAck) => void;
  private readonly handlers: HandlersMap;

  /**
   * The live global `pinnedTabBoundaryDefault` (pinned-tab-domain-boundary). An
   * inheriting saved tab (no explicit `boundary`) resolves its allow-set against
   * this. Seeded from settings at SW boot and updated by the SW's settings
   * watcher via {@link setBoundaryDefault}; defaults to `'off'` until seeded.
   */
  private boundaryDefault: 'off' | 'domain' = 'off';

  constructor(options: CoordinatorOptions) {
    this.store = options.store;
    this.persist = options.persist;
    this.broadcast = options.broadcast;
    this.emitAck = options.emitAck ?? defaultEmitAck;
    this.handlers = this.buildHandlers();
  }

  enqueue(ev: PendingEvent): void {
    const policy = EventPolicy[ev.kind];
    let toAppend: PendingEvent = ev;
    if (policy.coalesceKey) {
      const key = policy.coalesceKey(ev);
      const idx = this.events.findIndex((existing) => {
        if (existing.kind !== ev.kind) return false;
        const existingPolicy = EventPolicy[existing.kind];
        if (!existingPolicy.coalesceKey) return false;
        return existingPolicy.coalesceKey(existing) === key;
      });
      if (idx !== -1) {
        const [dropped] = this.events.splice(idx, 1);
        if (dropped) {
          // Merge partial payloads field-wise when the kind declares it, so an
          // earlier delta's fields (e.g. tabs.onUpdated status:'complete') are
          // not lost to a later partial event; replace (last-write-wins) when
          // no merge is declared — correct for sidebar commands whose payload
          // is a complete intent.
          // Only payloaded kinds declare a `mergePayload` + `coalesceKey`; the
          // `in` guards narrow both events to `PayloadedEvent` (the alarm sweep,
          // having no coalesceKey, never reaches this branch).
          if (policy.mergePayload && 'payload' in dropped && 'payload' in ev) {
            toAppend = {
              ...ev,
              payload: policy.mergePayload(dropped.payload, ev.payload),
            } as PendingEvent;
          }
          // D5b: coalesce-time ack — dropped sidebar commands ack 'ok' from here.
          if (dropped.source === 'sidebar') {
            this.acks.push({ id: dropped.correlationId, result: 'ok' });
          }
        }
      }
    }
    this.events.push(toAppend);
    if (this.events.length > QUEUE_CAP) {
      const dropped = this.events.shift();
      if (dropped) {
        log.error('EVENT_DROPPED', { kind: dropped.kind });
        // Dropping a queued sidebar command past the cap rejects its promise —
        // the user's intent was lost, not coalesced.
        if (dropped.source === 'sidebar') {
          this.acks.push({
            id: dropped.correlationId,
            result: { error: 'event dropped: queue capacity exceeded' },
          });
        }
      }
    }
    this.scheduleDrain();
  }

  /**
   * Run a side-effect WITHOUT gating the current drain's broadcast. The work is
   * started immediately but never awaited by the handler/drain, so the per-drain
   * persist+broadcast fire ahead of it. Errors are swallowed (logged) so a failed
   * side-effect never rejects an unrelated promise. The in-flight promise is
   * tracked so {@link idle} can await it (test determinism). See
   * {@link inflightSideEffects}.
   */
  private runSideEffect(fn: () => Promise<void>): void {
    const p = (async () => {
      try {
        await fn();
      } catch (err) {
        log.error('SIDE_EFFECT_FAILED', { err });
      }
    })();
    this.inflightSideEffects.add(p);
    void p.finally(() => {
      this.inflightSideEffects.delete(p);
    });
  }

  /**
   * Resolve once the coordinator is fully quiescent: the active drain has
   * settled, every floated side-effect (see {@link runSideEffect}) has run, and
   * any follow-up drain a side-effect scheduled has also settled. The per-drain
   * broadcast already fired inside `drain()` — before the floated side-effects —
   * so awaiting them here never re-introduces broadcast latency; it only gives
   * callers (tests) a settled observation point.
   */
  async idle(): Promise<void> {
    for (;;) {
      await (this.drainPromise ?? Promise.resolve());
      if (this.inflightSideEffects.size === 0) {
        if (this.drainPromise === null) return;
        continue;
      }
      await Promise.allSettled([...this.inflightSideEffects]);
    }
  }

  /**
   * Update the cached global `pinnedTabBoundaryDefault` (pinned-tab-domain-
   * boundary). The SW seeds this from `readSettings()` at boot and calls it again
   * from its settings watcher when the user flips the default. Does not itself
   * re-push config — the caller follows with {@link refreshBoundTabBoundaries}.
   */
  setBoundaryDefault(value: 'off' | 'domain'): void {
    this.boundaryDefault = value;
  }

  /**
   * Re-resolve and re-push the boundary config for every currently-bound saved
   * tab (pinned-tab-domain-boundary). Called by the SW at boot — so a tab bound
   * by restart recovery (which predates the extension load and lacks the
   * declarative boundary script) gets the script injected and its allow-set
   * pushed — and whenever the global `pinnedTabBoundaryDefault` changes, so every
   * inheriting bound tab re-arms/disarms live. Each tab's `configureBoundary`
   * recomputes independently, so an explicit `off` tab simply stays free.
   */
  async refreshBoundTabBoundaries(): Promise<void> {
    const { tabBindings, savedTabs } = this.store.state;
    // Configure in PARALLEL so one slow/blocked injection can't stall the rest.
    // Each `configureBoundary` swallows its own errors (injection + send), so the
    // `Promise.all` never rejects.
    const tasks: Promise<void>[] = [];
    for (const [savedTabId, slots] of Object.entries(tabBindings)) {
      const saved = savedTabs[savedTabId];
      if (!saved) continue;
      // A boundary is a property of the saved tab — arm/disarm EVERY window's
      // bound tab (per-window-tab-bindings, ADR 0009).
      for (const tabId of Object.values(slots)) {
        tasks.push(this.configureBoundary(tabId, saved));
      }
    }
    await Promise.all(tasks);
  }

  private scheduleDrain(): void {
    if (this.draining) return;
    this.draining = true;
    // Deferred one microtask so a synchronous burst of enqueues coalesces before
    // the first pass. `drain()` itself clears `draining`/`drainPromise` (in its
    // `finally`), so its final "queue empty" check and that reset are SYNCHRONOUS
    // with each other — no window for an enqueue to slip through (see drain()).
    this.drainPromise = Promise.resolve().then(() => this.drain());
  }

  private async drain(): Promise<void> {
    try {
      // Loop until the queue is fully empty. A single pass would STRAND any event
      // that enqueues during this drain's async tail (`await persist`): while
      // `draining` is true `scheduleDrain` no-ops, and the inner loop has already
      // emptied, so that event would sit unprocessed until the NEXT enqueue. That
      // was the favicon-stuck-on-loading bug — a `tabs.onUpdated {status:'complete'}`
      // arriving ~2ms behind a `{status:'loading'}` fell into the loading drain's
      // persist await, so the store kept `loading` (and the row kept spinning)
      // until an unrelated event (a tab click → `focusSavedTab`) drained it.
      // Re-checking after the tail processes such stragglers in the same cycle.
      for (;;) {
        for (let event = this.events.shift(); event !== undefined; event = this.events.shift()) {
          const handler = this.handlers[event.kind] as Handler<PendingEvent>;
          try {
            await handler(event);
            if (event.source === 'sidebar') {
              this.acks.push({ id: event.correlationId, result: 'ok' });
            }
          } catch (err) {
            log.error('HANDLER_THREW', { kind: event.kind, err });
            if (event.source === 'sidebar') {
              const message = err instanceof Error ? err.message : String(err);
              this.acks.push({ id: event.correlationId, result: { error: message } });
            }
          }
        }
        if (this.dirty) {
          this.dirty = false;
          // Snapshot once per pass — both persist (structured-clone into
          // chrome.storage) and broadcast (structured-clone over the runtime
          // message bus) need plain data, not the $state proxy.
          const snapshot = this.store.snapshot();
          // Persist only when the PERSISTED projection actually changed: a
          // favicon-only (ephemeral) drain mutates only the stripped
          // `liveTabsById`, so its serialization equals the last write and the
          // redundant `chrome.storage.local.set` is skipped. Broadcast still
          // fires below so surfaces swap the live icon even on a skipped cycle.
          // The compare is conservative in the SAFE direction — it can only
          // cause a redundant persist, never wrongly skip a real write (D2). The
          // signature is updated only AFTER a successful persist, so a (defensive)
          // rejection leaves it stale and the next drain retries the write.
          const sig = JSON.stringify(toPersistable(snapshot));
          if (sig !== this.lastPersistedSignature) {
            try {
              await this.persist(snapshot);
              this.lastPersistedSignature = sig;
            } catch (err) {
              log.error('coordinator persist failed', { err });
            }
          }
          try {
            this.broadcast({ method: '<batched>', state: snapshot });
          } catch (err) {
            log.error('coordinator broadcast failed', { err });
          }
        }
        // Flush acks after persist+broadcast. Per-ack try/catch so one failure
        // does not block the rest (3.8).
        if (this.acks.length > 0) {
          const toEmit = this.acks;
          this.acks = [];
          for (const ack of toEmit) {
            try {
              this.emitAck({ type: 'lunma/command-ack', id: ack.id, result: ack.result });
            } catch (err) {
              log.error('ACK_EMIT_FAILED', { id: ack.id, err });
            }
          }
        }
        // Stragglers enqueued during the async tail above were not scheduled
        // (draining=true), so loop and process them now. This `length` check and
        // the `finally` reset are synchronous, so nothing can slip the gap.
        if (this.events.length === 0) return;
      }
    } finally {
      this.draining = false;
      this.drainPromise = null;
    }
  }

  private buildHandlers(): HandlersMap {
    return {
      'tabs.onCreated': async (event) => {
        const { tab } = event.payload;
        // A home tab (the Lunma new-tab page) is grouped into the active Space
        // so the window shows it, but is NOT adopted into tempTabIds — it is the
        // Space's home, not a temporary tab. Recognised by URL (Chrome may report
        // either `url` or `pendingUrl` for a fresh NTP).
        const isHome = isNewTabUrl(tab.url) || isNewTabUrl(tab.pendingUrl);
        if (!isHome) {
          this.store.onTabCreated({ id: tab.id, windowId: tab.windowId });
        }
        this.store.syncLiveTab({
          id: tab.id,
          windowId: tab.windowId,
          title: tab.title,
          url: tab.url,
          active: tab.active,
          status: tab.status,
          favIconUrl: tab.favIconUrl,
        });
        if (isHome) {
          await this.groupHomeTab(tab.id, tab.windowId);
        } else {
          await this.groupNewTab(tab.id, tab.windowId);
        }
        this.dirty = true;
      },
      'tabs.onRemoved': (event) => {
        const { tabId, info } = event.payload;
        this.store.onTabRemoved(tabId, {
          windowId: info.windowId,
          isWindowClosing: info.isWindowClosing,
        });
        this.store.removeLiveTab(tabId);
        this.dirty = true;
      },
      'tabs.onUpdated': async (event) => {
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
          this.store.onTabUpdated(tabId, resolved);
        }
        // Mirror visible metadata into liveTabsById (no-ops if unchanged). The
        // favicon arrives via its own onUpdated once Chrome resolves it, which
        // is what lets the sidebar swap the placeholder for the real icon.
        this.store.syncLiveTab({
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
          !this.isTrackedTab(tabId)
        ) {
          const windowId = this.store.state.liveTabsById[tabId]?.windowId;
          if (windowId !== undefined) {
            this.store.onTabCreated({ id: tabId, windowId });
            await this.groupNewTab(tabId, windowId);
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
          const boundSavedId = this.savedTabIdForBoundTab(tabId);
          const boundSaved = boundSavedId ? this.store.state.savedTabs[boundSavedId] : undefined;
          if (
            boundSaved &&
            resolveBoundaryAllow(
              boundSaved.boundary,
              boundSaved.originalURL,
              this.effectiveBoundaryDefault(boundSaved),
            ) !== null
          ) {
            this.runSideEffect(() => this.configureBoundary(tabId, boundSaved));
          }
        }
        this.dirty = true;
      },
      'tabs.onActivated': (event) => {
        const { activeInfo } = event.payload;
        this.store.setActiveTab(activeInfo.windowId, activeInfo.tabId);
        this.dirty = true;
      },
      // Tab-group lifecycle hints (non-destructive, D3/D4). Both act only on
      // groups Lunma tracks; an untracked (user-created) group is ignored.
      'tabGroups.onRemoved': (event) => {
        const { groupId } = event.payload;
        // Untracked group (or one Lunma already forgot during deleteSpace) → no-op,
        // no persist. Deleting/ungrouping a Chrome group NEVER deletes a Space.
        if (this.findSpaceIdByGroupId(groupId) === null) return;
        this.store.forgetSpaceGroup(groupId);
        this.dirty = true;
      },
      'tabGroups.onUpdated': async (event) => {
        const { group } = event.payload;
        const spaceId = this.findSpaceIdByGroupId(group.id);
        if (spaceId === null) return; // untracked group → ignore
        // Mirror a TITLE change back to the Space name only. Colour and collapsed
        // changes are ignored (Lunma owns colour; collapse is Lunma-driven, D4).
        const title = group.title;
        if (title === undefined) return;
        const space = this.store.state.spaces.find((s) => s.id === spaceId);
        if (!space) return;
        // D5 feedback-loop guard: a Lunma-initiated retitle sets the group title
        // to the name already on the Space, so the echoed onUpdated is a no-op.
        if (title === space.name) return;
        // The user may have renamed the Chrome group to a name another Space
        // already uses. Interactive `renameSpace` THROWS on that collision — but
        // the mirror must never throw the drain (unique-space-names D5). Resolve
        // the title against the OTHER Spaces' names: a free title passes through,
        // a colliding one auto-disambiguates ("Work" → "Work 2"). When the result
        // differs from the typed title, re-title the live Chrome group so the
        // group and the record stay in lockstep.
        const taken = new Set(
          this.store.state.spaces
            .filter((s) => s.id !== spaceId)
            .map((s) => normalizeSpaceName(s.name)),
        );
        const resolved = disambiguateSpaceName(title, taken);
        if (resolved === space.name) return; // nothing to mirror (no real change)
        this.store.renameSpace(spaceId, resolved);
        if (resolved !== title) {
          // Best-effort re-title — a failure must not throw the drain; the group
          // re-syncs to the Space name on next activation.
          try {
            await updateGroupTitleColor(group.id, resolved, space.color);
          } catch (err) {
            log.debug('tabGroups.onUpdated: re-title after disambiguation failed', {
              spaceId,
              groupId: group.id,
              err,
            });
          }
        }
        this.dirty = true;
      },
      'windows.onCreated': (event) => {
        const id = event.payload.window.id;
        if (id === undefined) return;
        this.store.onWindowOpened(id);
        this.dirty = true;
      },
      'windows.onRemoved': (event) => {
        this.store.onWindowClosed(event.payload.windowId);
        this.dirty = true;
      },

      // Sidebar-source handlers per D7-bis: throw when the handler cannot
      // produce the effect the command's name implies.
      createSpace: async (event) => {
        const { name, color, icon, windowId } = event.payload;
        const before = new Set(this.store.state.spaces.map((s) => s.id));
        // The Space active in the window before this create — its home-only tab
        // (if any) is tidied when activation moves off it (see D4 close-on-leave).
        const outgoing = this.store.state.activeSpaceByWindow[windowId] ?? undefined;
        this.store.createSpace({ name, color, icon });
        const newSpace = this.store.state.spaces.find((s) => !before.has(s.id));
        if (!newSpace) {
          throw new Error('createSpace: new Space not found after creation');
        }
        this.store.activateSpace(windowId, newSpace.id);
        // Materialize the new Space's group (forms from the focused/opened tab)
        // and collapse the others — same sequence as a plain activation.
        await this.orchestrateActivation(windowId, newSpace.id, outgoing ?? undefined);
        this.dirty = true;
      },
      renameSpace: async (event) => {
        const { spaceId, newName } = event.payload;
        const space = this.store.state.spaces.find((s) => s.id === spaceId);
        if (!space) {
          throw new Error(`renameSpace: unknown spaceId '${spaceId}'`);
        }
        const prevName = space.name;
        this.store.renameSpace(spaceId, newName);
        try {
          await this.propagateGroupIdentity(spaceId);
        } catch (err) {
          // Rename atomicity: a failed chrome.tabGroups.update reverts the name.
          this.store.renameSpace(spaceId, prevName);
          throw new Error(
            `renameSpace: group update failed for '${spaceId}', reverted: ${
              err instanceof Error ? err.message : String(err)
            }`,
          );
        }
        this.dirty = true;
      },
      recolourSpace: async (event) => {
        const { spaceId, color } = event.payload;
        const space = this.store.state.spaces.find((s) => s.id === spaceId);
        if (!space) {
          throw new Error(`recolourSpace: unknown spaceId '${spaceId}'`);
        }
        const prevColor = space.color;
        this.store.recolourSpace(spaceId, color);
        try {
          await this.propagateGroupIdentity(spaceId);
        } catch (err) {
          // Mirror rename atomicity so state and the Chrome group never drift.
          this.store.recolourSpace(spaceId, prevColor);
          throw new Error(
            `recolourSpace: group update failed for '${spaceId}', reverted: ${
              err instanceof Error ? err.message : String(err)
            }`,
          );
        }
        this.dirty = true;
      },
      changeSpaceIcon: (event) => {
        const { spaceId, icon } = event.payload;
        if (!this.spaceExists(spaceId)) {
          throw new Error(`changeSpaceIcon: unknown spaceId '${spaceId}'`);
        }
        this.store.changeSpaceIcon(spaceId, icon);
        this.dirty = true;
      },
      deleteSpace: async (event) => {
        const { spaceId } = event.payload;
        if (!this.spaceExists(spaceId)) {
          throw new Error(`deleteSpace: unknown spaceId '${spaceId}'`);
        }
        // Capture the live group ids BEFORE the store deletes the instances.
        const groupIds = this.liveGroupIdsForSpace(spaceId);
        this.store.deleteSpace(spaceId);
        // The store refuses to delete the last Space (no-op); only close groups
        // when the record actually moved to trash.
        if (!this.spaceExists(spaceId)) {
          await closeGroupsForSpace(groupIds);
        }
        this.dirty = true;
      },
      restoreSpaceFromTrash: (event) => {
        const { spaceId } = event.payload;
        if (!this.store.state.trash[spaceId]) {
          throw new Error(`restoreSpaceFromTrash: unknown spaceId '${spaceId}'`);
        }
        this.store.restoreSpaceFromTrash(spaceId);
        this.dirty = true;
      },
      activateSpace: async (event) => {
        const { windowId, spaceId } = event.payload;
        if (!this.spaceExists(spaceId)) {
          throw new Error(`activateSpace: unknown spaceId '${spaceId}'`);
        }
        // Capture the outgoing Space BEFORE activation so we can close its
        // home-only tab on leave (D4) — no accumulation of blank tabs.
        const outgoing = this.store.state.activeSpaceByWindow[windowId] ?? undefined;
        this.store.activateSpace(windowId, spaceId);
        // The SWITCH path preserves a selected global favorite's focus (it belongs
        // to no Space, so it stays visible across switches — sidebar-favicon-row).
        await this.orchestrateActivation(windowId, spaceId, outgoing ?? undefined, true);
        this.dirty = true;
      },
      openSavedTab: async (event) => {
        const { savedTabId, windowId } = event.payload;
        const saved = this.store.state.savedTabs[savedTabId];
        if (!saved) {
          throw new Error(`openSavedTab: unknown savedTabId '${savedTabId}'`);
        }
        const tab = await chrome.tabs.create({ url: saved.originalURL, windowId });
        if (tab.id === undefined) {
          throw new Error('openSavedTab: created tab has no id');
        }
        // Capture the narrowed id in a const so it survives into the floated
        // side-effect closure below (TS widens `tab.id` back across a closure).
        const tabId = tab.id;
        this.store.bindSavedTab(savedTabId, windowId, tabId, saved.originalURL);
        // Seed the live-tab record + active flag straight from the just-created
        // tab so THIS drain's broadcast already shows the row selected — rather
        // than waiting for Chrome's onCreated/onActivated to round-trip back as
        // separate events (a second drain, a visible frame late). `chrome.tabs
        // .create` returns an active tab, so `tab.active` is true; both store
        // methods are idempotent, so the real events de-dupe when they arrive.
        this.store.syncLiveTab({
          id: tabId,
          windowId,
          title: tab.title,
          url: tab.url,
          active: tab.active,
          status: tab.status,
          favIconUrl: tab.favIconUrl,
        });
        this.store.setActiveTab(windowId, tabId);
        if (saved.spaceId === null) {
          // A global favorite (favicon-row-model, ADR 0010 D3/D8): leave its live
          // tab UNGROUPED (global) instead of adopting it into any Space's group,
          // so it stays visible across every Space switch. This is the formerly
          // unguarded-null call site — `addTabToSpaceGroup` keeps its
          // `spaceId: SpaceId` signature; a favorite is routed here before it
          // could ever reach it. The `onCreated`/`groupNewTab` auto-group path
          // needs NO hardening (design D9): `groupNewTab` early-returns for any
          // tab not in `tempTabIds`, and this bound favorite never is, so no new
          // drain race exists.
          await this.ensureFavoriteUngrouped(tabId);
        } else {
          // A pinned/saved tab belongs to its Space — when opened it joins that
          // Space's Chrome group in the window (not just temp tabs).
          await this.addTabToSpaceGroup(windowId, saved.spaceId, tabId);
        }
        this.dirty = true;
        // Arm/disarm the just-bound tab's boundary (pinned-tab-domain-boundary)
        // OFF the drain's critical path: `configureBoundary` awaits
        // `executeScript` against the still-loading tab, which can block for
        // seconds, and must NOT gate the broadcast above. The freshly-created tab
        // also receives the declarative boundary script on load and the
        // `onUpdated status:'complete'` handler re-pushes its allow-set, so this
        // imperative arm is the earliest attempt, not the only one (design D6).
        this.runSideEffect(() => this.configureBoundary(tabId, saved));
      },
      focusSavedTab: async (event) => {
        const { savedTabId, windowId } = event.payload;
        // Focus THIS window's bound tab only — never another window's slot
        // (per-window-tab-bindings, ADR 0009).
        const tabId = this.store.state.tabBindings[savedTabId]?.[windowId];
        if (tabId === undefined) {
          throw new Error(
            `focusSavedTab: saved tab '${savedTabId}' is dormant in window ${windowId} or unknown`,
          );
        }
        const tab = await chrome.tabs.update(tabId, { active: true });
        if (tab?.windowId !== undefined) {
          await chrome.windows.update(tab.windowId, { focused: true });
        }
        // Re-push the boundary config on focus — a refresh in case the tab's
        // content script was reset or never configured (pinned-tab-domain-boundary).
        const saved = this.store.state.savedTabs[savedTabId];
        if (saved) await this.configureBoundary(tabId, saved);
      },
      goHome: async (event) => {
        const { savedTabId, windowId } = event.payload;
        const saved = this.store.state.savedTabs[savedTabId];
        if (!saved) {
          throw new Error(`goHome: unknown savedTabId '${savedTabId}'`);
        }
        // Navigate THIS window's bound tab home (per-window-tab-bindings): the
        // drift "Go home" affordance is per-(saved tab, window).
        const tabId = this.store.state.tabBindings[savedTabId]?.[windowId];
        if (tabId === undefined) {
          throw new Error(`goHome: saved tab '${savedTabId}' is dormant in window ${windowId}`);
        }
        await chrome.tabs.update(tabId, { url: saved.originalURL });
      },
      makeThisHome: (event) => {
        const { savedTabId } = event.payload;
        const saved = this.store.state.savedTabs[savedTabId];
        if (!saved) {
          throw new Error(`makeThisHome: unknown savedTabId '${savedTabId}'`);
        }
        if (saved.currentURL === null) {
          throw new Error(`makeThisHome: currentURL is null for '${savedTabId}'`);
        }
        // Lunma-owned record: update originalURL in state only, no
        // chrome.bookmarks.update (ADR 0005).
        this.store.makeSavedTabHomeCurrent(savedTabId);
        this.dirty = true;
      },
      deleteSavedTab: async (event) => {
        const { savedTabId } = event.payload;
        if (!this.store.state.savedTabs[savedTabId]) {
          throw new Error(`deleteSavedTab: unknown savedTabId '${savedTabId}'`);
        }
        // Close EVERY bound live tab across all window slots (per-window-tab-
        // bindings, ADR 0009), then drop the record. Best-effort per D7-bis: the
        // user wants the saved tab gone regardless of any tab's state.
        const boundTabIds = Object.values(this.store.state.tabBindings[savedTabId] ?? {});
        for (const tabId of boundTabIds) {
          try {
            await chrome.tabs.remove(tabId);
          } catch (err) {
            log.error('deleteSavedTab: tab close failed', { savedTabId, tabId, err });
          }
        }
        this.store.removeSavedTab(savedTabId);
        this.dirty = true;
      },
      // Pinned-tab creation + lifecycle (sidebar-pinned-tabs). Pure
      // orchestration over the store — one coalesced mutation per drain.
      pinTab: (event) => {
        const { tabId, windowId, spaceId, targetIndex, placement } = event.payload;
        const liveTab = this.store.state.liveTabsById[tabId];
        if (!liveTab) {
          // Can't pin a tab Lunma has no live record of — log + no-op (D2).
          log.debug('pinTab: no live tab record', { tabId, windowId });
          return;
        }
        // Idempotent: a tab already bound (in ANY window) to any saved tab is
        // already pinned (per-window-tab-bindings — scan inner window slots).
        for (const slots of Object.values(this.store.state.tabBindings)) {
          if (Object.values(slots).includes(tabId)) {
            log.debug('pinTab: tab already bound', { tabId });
            return;
          }
        }
        // Mint the record FIRST (do NOT bind yet — binding removes the tab from
        // Temporary, and "never orphaned" means we only bind once the record is
        // actually placed somewhere reachable). Design D3.
        const id = crypto.randomUUID();
        this.store.registerSavedTab({
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
          if (!this.store.addPinnedToFolder(spaceId, placement.into, id)) {
            this.store.addPinned(spaceId, id, targetIndex);
          }
        } else if (placement && 'withSavedTabId' in placement) {
          const list = this.store.state.pinnedBySpace[spaceId] ?? [];
          const index = list.findIndex(
            (n) => n.kind === 'tab' && n.id === placement.withSavedTabId,
          );
          if (index !== -1) {
            this.store.createFolderFromTabs(spaceId, id, placement.withSavedTabId, index);
          } else {
            this.store.addPinned(spaceId, id, targetIndex);
          }
        } else {
          this.store.addPinned(spaceId, id, targetIndex);
        }

        // Bind LAST, and only when the record actually landed in the tree, so the
        // tab leaves Temporary exactly when it gains a visible placement (D3). The
        // fallbacks above make "not placed" unreachable; if it ever happens, undo
        // the mint and leave the tab in Temporary rather than orphan either.
        const placed = (this.store.state.pinnedBySpace[spaceId] ?? []).some((n) =>
          n.kind === 'tab' ? n.id === id : n.children.includes(id),
        );
        if (placed) {
          this.store.bindSavedTab(id, windowId, tabId, liveTab.url);
        } else {
          log.error('pinTab: record not placed, leaving tab in Temporary', {
            tabId,
            spaceId,
            id,
          });
          this.store.removeSavedTab(id);
        }
        this.dirty = true;
      },
      unpinTab: (event) => {
        const { savedTabId } = event.payload;
        const saved = this.store.state.savedTabs[savedTabId];
        if (!saved) {
          throw new Error(`unpinTab: unknown savedTabId '${savedTabId}'`);
        }
        // Capture every bound (window, tab) BEFORE removeSavedTab drops the slots:
        // each bound window's tab returns to THAT window's Temporary (per-window-
        // tab-bindings, ADR 0009). A dormant window has no slot, so nothing to do.
        const boundByWindow = Object.entries(this.store.state.tabBindings[savedTabId] ?? {});
        // Second unguarded-null site (favicon-row-model, ADR 0010 D8): a global
        // favorite (`spaceId === null`) is referenced by `faviconRow`, never by
        // `pinnedBySpace`, so it must NOT be routed through
        // `removePinned(null, …)`. `removeSavedTab` below cleans BOTH placement
        // families (the pinned tree AND `faviconRow`, design D6), so the favorite
        // path is fully handled there; only a coupled tab needs the explicit
        // `removePinned`.
        if (saved.spaceId !== null) {
          this.store.removePinned(saved.spaceId, savedTabId);
        }
        this.store.removeSavedTab(savedTabId);
        // Restore each tab (no chrome.tabs.remove). Must run after removeSavedTab
        // so the binding is gone and restoreTempTab sees each tab as unbound.
        for (const [windowIdStr, tabId] of boundByWindow) {
          this.store.restoreTempTab(Number(windowIdStr), tabId);
        }
        this.dirty = true;
      },
      reorderPinned: (event) => {
        const { spaceId, nodes } = event.payload;
        if (!this.spaceExists(spaceId)) {
          throw new Error(`reorderPinned: unknown spaceId '${spaceId}'`);
        }
        this.store.setPinned(spaceId, nodes);
        this.dirty = true;
      },
      // Favicon-row-model (ADR 0010): mint / decouple / couple / reorder global
      // favorites. The store performs the chrome-free record move; the
      // coordinator owns the group/ungroup I/O for every bound window (D5).
      //
      // Mint a global favorite from a live tab — non-destructive, the tab stays
      // open (D5). Idempotent: a tab already bound to any saved tab is a no-op
      // (mirrors pinTab's already-bound guard).
      favoriteTab: async (event) => {
        const { tabId, windowId, targetIndex } = event.payload;
        const liveTab = this.store.state.liveTabsById[tabId];
        if (!liveTab) {
          // Can't favorite a tab Lunma has no live record of — log + no-op.
          log.debug('favoriteTab: no live tab record', { tabId, windowId });
          return;
        }
        for (const slots of Object.values(this.store.state.tabBindings)) {
          if (Object.values(slots).includes(tabId)) {
            log.debug('favoriteTab: tab already bound', { tabId });
            return;
          }
        }
        // Mint the spaceId:null record, place it in faviconRow, then bind the
        // live tab (binding removes it from this window's Temporary list).
        const id = crypto.randomUUID();
        this.store.registerSavedTab({
          id,
          spaceId: null,
          title: liveTab.title,
          originalURL: liveTab.url,
          currentURL: liveTab.url,
        });
        this.store.addFavorite(id, targetIndex ?? this.store.state.faviconRow.length);
        this.store.bindSavedTab(id, windowId, tabId, liveTab.url);
        this.dirty = true;
        // The favorite stays OPEN but must be ungrouped (global) — D3/D5.
        await this.ensureFavoriteUngrouped(tabId);
      },
      // Decouple a pinned tab into a favorite: store moves the record from its
      // Space's pinned tree to faviconRow; coordinator ungroups its live tab in
      // EVERY bound window (D5).
      favoriteSavedTab: async (event) => {
        const { savedTabId } = event.payload;
        const saved = this.store.state.savedTabs[savedTabId];
        if (!saved) {
          throw new Error(`favoriteSavedTab: unknown savedTabId '${savedTabId}'`);
        }
        // Capture bound tabs BEFORE the move (the move leaves bindings intact).
        const boundTabIds = Object.values(this.store.state.tabBindings[savedTabId] ?? {});
        this.store.moveSavedTabToFavorites(savedTabId);
        this.dirty = true;
        for (const tabId of boundTabIds) {
          await this.ensureFavoriteUngrouped(tabId);
        }
      },
      // Couple a favorite to a Space (the active Space, supplied by the sidebar):
      // store moves the record from faviconRow into pinnedBySpace[spaceId];
      // coordinator groups its live tab into that Space in EVERY bound window (D5).
      pinSavedTab: async (event) => {
        const { savedTabId, spaceId, index } = event.payload;
        const saved = this.store.state.savedTabs[savedTabId];
        if (!saved) {
          throw new Error(`pinSavedTab: unknown savedTabId '${savedTabId}'`);
        }
        if (!this.spaceExists(spaceId)) {
          throw new Error(`pinSavedTab: unknown spaceId '${spaceId}'`);
        }
        // Capture bound (window, tab) pairs BEFORE the move.
        const boundByWindow = Object.entries(this.store.state.tabBindings[savedTabId] ?? {});
        // Default to appending at the end of the Space's pinned list when no
        // explicit drop index is supplied.
        const target = index ?? this.store.state.pinnedBySpace[spaceId]?.length ?? 0;
        this.store.moveSavedTabToSpace(savedTabId, spaceId, target);
        this.dirty = true;
        for (const [windowIdStr, tabId] of boundByWindow) {
          await this.addTabToSpaceGroup(Number(windowIdStr), spaceId, tabId);
        }
      },
      // Reorder the favicon row to the post-drop order; one persist + broadcast.
      reorderFavorites: (event) => {
        this.store.reorderFavorites(event.payload.ids);
        this.dirty = true;
      },
      // Pinned-tab folders (pinned-tab-folders). Structural moves ride
      // reorderPinned above; these mint ids / edit folder metadata / delete.
      createFolder: (event) => {
        const { spaceId } = event.payload;
        if (!this.spaceExists(spaceId)) {
          throw new Error(`createFolder: unknown spaceId '${spaceId}'`);
        }
        this.store.createFolder(spaceId);
        this.dirty = true;
      },
      createFolderFromTabs: (event) => {
        const { spaceId, tabIdA, tabIdB, index } = event.payload;
        if (!this.spaceExists(spaceId)) {
          throw new Error(`createFolderFromTabs: unknown spaceId '${spaceId}'`);
        }
        this.store.createFolderFromTabs(spaceId, tabIdA, tabIdB, index);
        this.dirty = true;
      },
      renameTab: (event) => {
        const { savedTabId, newName } = event.payload;
        this.store.renameTab(savedTabId, newName);
        this.dirty = true;
      },
      renameTempTab: (event) => {
        const { tabId, spaceId, windowId, newName } = event.payload;
        this.store.renameTempTab(windowId, spaceId, tabId, newName);
        this.dirty = true;
      },
      renameFolder: (event) => {
        const { spaceId, folderId, name } = event.payload;
        this.store.renameFolder(spaceId, folderId, name);
        this.dirty = true;
      },
      setFolderIcon: (event) => {
        const { spaceId, folderId, icon } = event.payload;
        this.store.setFolderIcon(spaceId, folderId, icon);
        this.dirty = true;
      },
      setFolderColor: (event) => {
        const { spaceId, folderId, color } = event.payload;
        this.store.setFolderColor(spaceId, folderId, color);
        this.dirty = true;
      },
      deleteFolder: (event) => {
        const { spaceId, folderId } = event.payload;
        this.store.deleteFolder(spaceId, folderId);
        this.dirty = true;
      },
      reorderTemp: (event) => {
        const { windowId, tabIds } = event.payload;
        this.store.reorderTemp(windowId, tabIds);
        this.dirty = true;
      },
      reorderSpaces: (event) => {
        this.store.reorderSpaces(event.payload.spaceIds);
        this.dirty = true;
      },
      // Temp-tab interactions (sidebar-temp-tabs). No direct state mutation —
      // the resulting tab events (onActivated / onRemoved) drive the store, so
      // a single source maintains liveTabsById.
      focusTab: async (event) => {
        const { tabId } = event.payload;
        const tab = await chrome.tabs.update(tabId, { active: true });
        if (tab?.windowId !== undefined) {
          await chrome.windows.update(tab.windowId, { focused: true });
        }
      },
      closeTab: async (event) => {
        const { tabId } = event.payload;
        await chrome.tabs.remove(tabId);
      },
      // New Tab affordance: when the window already has an unused home tab (the
      // Lunma new-tab page), FOCUS it rather than spawning a second blank tab —
      // so repeated New Tab clicks never pile up home tabs (at most one per
      // window). Otherwise open one; the resulting tabs.onCreated groups it into
      // the active Space (no direct state mutation here, like focusTab/closeTab).
      newTab: async (event) => {
        const { windowId, spaceId } = event.payload;
        // A New Tab row now lives on EVERY carousel panel (each pre-rendered for its
        // own Space), so it carries that panel's `spaceId`. A new tab is focused by
        // definition, so targeting a Space that is NOT the active one means activating
        // it first — the tab then lands in it and is visible. In the common case (the
        // centred panel) `spaceId` already IS the active Space, so this is skipped and
        // the behaviour is byte-for-byte unchanged; tabs.onCreated groups the tab in.
        if (
          spaceId !== undefined &&
          spaceId !== (this.store.state.activeSpaceByWindow[windowId] ?? undefined)
        ) {
          if (!this.spaceExists(spaceId)) {
            throw new Error(`newTab: unknown spaceId '${spaceId}'`);
          }
          const outgoing = this.store.state.activeSpaceByWindow[windowId] ?? undefined;
          this.store.activateSpace(windowId, spaceId);
          await this.orchestrateActivation(windowId, spaceId, outgoing ?? undefined);
        }
        const existingHome = this.homeTabIdInWindow(windowId);
        if (existingHome !== undefined) {
          await activateTab(existingHome);
          try {
            await chrome.windows.update(windowId, { focused: true });
          } catch (err) {
            log.debug('newTab: window focus failed', { windowId, err });
          }
          return;
        }
        await chrome.tabs.create({ windowId, active: true });
      },
      // Clear affordance: close the active Space's TEMPORARY tabs in the window.
      // tempTabIds are unbound by definition, so pinned/saved tabs are never
      // touched; tabs.onRemoved reconciles state. When the temp tabs are the
      // window's ONLY tabs, removing them all would close the window (and quit
      // the browser if it is the last) — so first open the Space home, keeping
      // the window alive on its home (Clear empties the list, it does NOT close
      // the window). The new home tab is grouped + unlisted via tabs.onCreated.
      clearTempTabs: async (event) => {
        const { windowId, spaceId: target } = event.payload;
        const s = this.store.state;
        // Clear THIS panel's Space (every carousel panel renders its own Clear now);
        // falls back to the window's active Space when no spaceId is carried. Clearing
        // a background Space's temps in place is safe — its tabs live in a collapsed
        // group, and the survivor check below still spans the whole window.
        const spaceId = target ?? s.activeSpaceByWindow[windowId];
        if (spaceId === null || spaceId === undefined) return;
        const tempTabIds = s.spaceInstancesByWindow[windowId]?.[spaceId]?.tempTabIds ?? [];
        const ids = tempTabIds.filter((id) => s.liveTabsById[id]?.windowId === windowId);
        if (ids.length === 0) return;
        try {
          const all = await chrome.tabs.query({ windowId });
          const removing = new Set(ids);
          const survivors = all.filter((t) => t.id !== undefined && !removing.has(t.id));
          if (survivors.length === 0) {
            await chrome.tabs.create({ windowId, active: true });
          }
        } catch (err) {
          log.error('clearTempTabs: survivor check failed', { windowId, err });
        }
        await chrome.tabs.remove(ids);
      },
      // Launcher: open a bookmark/history result's URL in the target window. No
      // direct state mutation — the resulting tabs.onCreated adopts + groups it
      // into the window's active Space (like focusTab/closeTab/newTab). A
      // create failure throws so the drain tail acks `{ error }` to the client.
      openUrl: async (event) => {
        const { url, windowId } = event.payload;
        await chrome.tabs.create({ url, windowId });
      },
      // Set or clear a pinned tab's domain boundary (pinned-tab-domain-boundary),
      // then re-push config to its bound tab so enforcement updates live without
      // re-opening the tab. Throws on an unknown id (the ack carries the error).
      setTabBoundary: async (event) => {
        const { savedTabId, boundary } = event.payload;
        const saved = this.store.state.savedTabs[savedTabId];
        if (!saved) {
          throw new Error(`setTabBoundary: unknown savedTabId '${savedTabId}'`);
        }
        this.store.setTabBoundary(savedTabId, boundary);
        this.dirty = true;
        // `saved` is the live store record, so it already reflects the new
        // boundary after the mutator ran. Push to EVERY window's bound tab
        // (per-window-tab-bindings, ADR 0009).
        const slots = this.store.state.tabBindings[savedTabId] ?? {};
        await Promise.all(
          Object.values(slots).map((tabId) => this.configureBoundary(tabId, saved)),
        );
      },
      // Auto-archive (auto-archive). The whole sweep runs inside this one tick:
      // the background handler reads settings, snapshots the store, queries Chrome
      // for active/pinned, removes + records each candidate, and prunes. The
      // resulting `tabs.onRemoved` events drain as separate commands that never
      // write `archivedTabs`. Only persist/broadcast when something actually
      // changed, so an empty sweep every minute does not churn.
      autoArchiveSweep: async () => {
        if (await handleAutoArchiveSweep(this.store)) {
          this.dirty = true;
        }
      },
      // Re-open an archived tab in the requesting window and drop its record. The
      // background handler throws when no entry matches `archivedAt` (the drain
      // tail acks the error); the created tab is adopted via the existing
      // `tabs.onCreated` path, so no direct temp/live mutation here.
      restoreArchivedTab: async (event) => {
        await handleRestoreArchivedTab(this.store, event.payload);
        this.dirty = true;
      },
      // Set or clear a Space's auto-archive override. Throws on an unknown id (the
      // ack carries the error); the next sweep reads the updated override (no live
      // re-resolution push needed, unlike a boundary).
      setSpaceAutoArchive: (event) => {
        const { spaceId, autoArchive } = event.payload;
        if (!this.spaceExists(spaceId)) {
          throw new Error(`setSpaceAutoArchive: unknown spaceId '${spaceId}'`);
        }
        this.store.setSpaceAutoArchive(spaceId, autoArchive);
        this.dirty = true;
      },
      // Discard ONE archived-tab record without restoring it (per-row delete).
      // Idempotent — a no-op (still acks ok) if the entry is already gone; only
      // persists/broadcasts when it actually removed something.
      deleteArchivedTab: (event) => {
        const { archivedAt, tabId } = event.payload;
        const before = this.store.state.archivedTabs.length;
        this.store.removeArchivedTab(archivedAt, tabId);
        if (this.store.state.archivedTabs.length !== before) this.dirty = true;
      },
      // Discard every archived-tab record ("Clear all"). Only persists/broadcasts
      // when something was actually cleared.
      clearArchivedTabs: () => {
        if (this.store.state.archivedTabs.length === 0) return;
        this.store.clearArchivedTabs();
        this.dirty = true;
      },
    };
  }

  private spaceExists(spaceId: SpaceId): boolean {
    return this.store.state.spaces.some((s) => s.id === spaceId);
  }

  /**
   * Inject (when needed) and push the boundary allow-set for one bound tab
   * (pinned-tab-domain-boundary, design D6). With effective enforcement, inject
   * the boundary content script (idempotent via its install guard; a forbidden
   * page degrades to drift) then push the resolved allow-set; otherwise push
   * `null` so a previously-armed script disarms. Never throws — a forbidden page
   * or a closed receiver is benign (the boundary is still recorded in state).
   */
  /**
   * Effective boundary default for a saved tab. Global FAVORITES (`spaceId === null`)
   * are **locked to their site by default** (domain-level) — a favorite's `undefined`
   * boundary resolves to `'domain'` regardless of the global `pinnedTabBoundaryDefault`
   * (sidebar-favicon-row, user request). Space-PINNED tabs inherit the global default.
   * An explicit per-tab `{ mode: 'off' }` still wins (it is not `undefined`), so a user
   * can unlock a specific favorite via the boundary editor.
   */
  private effectiveBoundaryDefault(saved: SavedTab): 'off' | 'domain' {
    return saved.spaceId === null ? 'domain' : this.boundaryDefault;
  }

  private async configureBoundary(tabId: TabId, saved: SavedTab): Promise<void> {
    const allow = resolveBoundaryAllow(
      saved.boundary,
      saved.originalURL,
      this.effectiveBoundaryDefault(saved),
    );
    if (allow === null) {
      sendBoundaryConfig(tabId, null);
      return;
    }
    await injectBoundary(tabId);
    sendBoundaryConfig(tabId, allow);
  }

  /** The saved-tab id currently bound to `tabId`, or `undefined`. Used to re-push
   * boundary config when a bound tab finishes (re)loading. */
  private savedTabIdForBoundTab(tabId: TabId): SavedTabId | undefined {
    for (const [savedTabId, slots] of Object.entries(this.store.state.tabBindings)) {
      if (Object.values(slots).includes(tabId)) return savedTabId;
    }
    return undefined;
  }

  /** The Space id of the (window, Space) instance Lunma tracks for `groupId`, or
   * `null` when no instance holds it (an untracked group, or one already
   * forgotten). Used by the tab-group lifecycle hints to ignore untracked groups. */
  private findSpaceIdByGroupId(groupId: number): SpaceId | null {
    if (groupId < 0) return null;
    for (const map of Object.values(this.store.state.spaceInstancesByWindow)) {
      if (!map) continue;
      for (const instance of Object.values(map)) {
        if (instance.groupId === groupId) return instance.spaceId;
      }
    }
    return null;
  }

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
  private async addTabToSpaceGroup(
    windowId: WindowId,
    spaceId: SpaceId,
    tabId: TabId,
  ): Promise<void> {
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
   * Enforce the favorite ungroup invariant (favicon-row-model, ADR 0010 D3): a
   * bound `spaceId === null` favorite's live tab is left **ungrouped** (global),
   * so it is never collapsed when other Spaces' groups hide and stays visible
   * across every Space switch. This is the SINGLE coordinator path that
   * establishes "a bound favorite's live tab is ungrouped", invoked from every
   * site that binds a favorite — opening a dormant favorite (`openSavedTab`),
   * favoriting a live tab (`favoriteTab`), decoupling (`favoriteSavedTab`), and
   * the boot restart-rebind reconciliation. Idempotent (ungrouping an
   * already-ungrouped tab is a no-op) and best-effort (the wrapper swallows a
   * Chrome refusal).
   */
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
    const savedId = this.savedTabIdForBoundTab(activeId);
    if (savedId === undefined) return false;
    return this.store.state.savedTabs[savedId]?.spaceId === null;
  }

  private async ensureFavoriteUngrouped(tabId: TabId): Promise<void> {
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
  private async orchestrateActivation(
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
  private homeTabIdInWindow(windowId: WindowId): TabId | undefined {
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
  private async groupNewTab(tabId?: TabId, windowId?: WindowId): Promise<void> {
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
  private async groupHomeTab(tabId?: TabId, windowId?: WindowId): Promise<void> {
    if (tabId === undefined || windowId === undefined) return;
    const s = this.store.state;
    const spaceId = s.activeSpaceByWindow[windowId];
    if (spaceId === null || spaceId === undefined) return;
    const instance = s.spaceInstancesByWindow[windowId]?.[spaceId];
    if (!instance) return;
    await this.addTabToSpaceGroup(windowId, spaceId, tabId);
  }

  /** Is `tabId` already tracked by Lunma — a temporary tab in any (window,
   * Space) instance, or bound to a saved tab? Used to distinguish a home tab
   * navigating to a real URL (untracked → adopt) from an ordinary navigation of
   * a tab already listed/pinned (tracked → no regroup). */
  private isTrackedTab(tabId: TabId): boolean {
    for (const map of Object.values(this.store.state.spaceInstancesByWindow)) {
      if (!map) continue;
      for (const inst of Object.values(map)) {
        if (inst.tempTabIds.includes(tabId)) return true;
      }
    }
    for (const slots of Object.values(this.store.state.tabBindings)) {
      if (Object.values(slots).includes(tabId)) return true;
    }
    return false;
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
  private async propagateGroupIdentity(spaceId: SpaceId): Promise<void> {
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
  private liveGroupIdsForSpace(spaceId: SpaceId): number[] {
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

// Helper exports so external code can construct sidebar PendingEvents in tests
// without restating the discriminated-union shape.
export type SidebarPendingEvent = Extract<PendingEvent, { source: 'sidebar' }>;

// Re-export of underlying types for documentation; kept narrow on purpose.
export type { SpaceId, WindowId };
