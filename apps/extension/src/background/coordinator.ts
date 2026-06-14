import type { CommandAck, CommandAckResult } from '../shared/bus';
import { toPersistable } from '../shared/chrome/storage';
import { log } from '../shared/logger';
import type { LunmaStore } from '../shared/store.svelte';
import type { AppState } from '../shared/types';
import { BoundaryController } from './boundary-controller';
import { GroupOrchestrator } from './group-orchestrator';
import { autoArchiveHandlers } from './handlers/auto-archive';
import { backupHandlers } from './handlers/backup';
import { boundaryHandlers } from './handlers/boundary';
import { chromeGroupWindowHandlers } from './handlers/chrome-groups-windows';
import { chromeTabHandlers } from './handlers/chrome-tabs';
import type {
  EventPolicyEntry,
  Handler,
  HandlerContext,
  HandlersMap,
  PendingEvent,
  PendingEventKind,
  PendingPayload,
} from './handlers/context';
import { favoriteHandlers } from './handlers/favorites';
import { folderHandlers } from './handlers/folders';
import { pinnedTabHandlers } from './handlers/pinned-tabs';
import { smartFolderHandlers } from './handlers/smart-folders';
import { spaceHandlers } from './handlers/spaces';
import { tempTabHandlers } from './handlers/temp-tabs';

// Re-export of underlying types for documentation; kept narrow on purpose.
export type { SpaceId, WindowId } from '../shared/types';
// The `PendingEvent` union, the `Handler`/`HandlersMap` types, and the
// `HandlerContext` seam live in `./handlers/context` so the slice factories and
// this module can both import them without an import cycle (split-coordinator-
// handlers, design D4b). Re-exported here so every external import that reads them
// `from './coordinator'` is unchanged.
export type {
  EventPolicyEntry,
  Handler,
  HandlersMap,
  PendingEvent,
  PendingEventKind,
  SidebarPendingEvent,
} from './handlers/context';

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
  // Smart-folders (smart-folders): lifecycle commands are per-click distinct;
  // results are per-folder and infrequent — no coalescing (design D3).
  createSmartFolder: {},
  updateSmartFolder: {},
  deleteSmartFolder: {},
  refreshSmartFolder: {},
  // Per-click distinct (smart-folder-item-bindings): a re-click of an
  // already-bound row is the cheap focus path, so coalescing buys nothing.
  openSmartItem: {},
  'smartFolders.result': {},
  reorderTemp: {},
  reorderSpaces: {},
  focusTab: {},
  closeTab: {},
  newTab: {},
  clearTempTabs: {},
  // Per-invocation distinct — an undo restores its own captured batch.
  undoClearTempTabs: {},
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
  // Data-backup: each import is a distinct, non-coalescing user action.
  importState: {},
};

export const QUEUE_CAP = 1000;

export type Persist = (state: AppState) => void | Promise<void>;
export type Broadcast = (msg: { method: string; state: AppState }) => void;

export interface CoordinatorOptions {
  store: LunmaStore;
  persist: Persist;
  broadcast: Broadcast;
  /** Optional ack emitter; defaults to chrome.runtime.sendMessage. Test seam. */
  emitAck?: (ack: CommandAck) => void;
}

export function defaultEmitAck(ack: CommandAck): void {
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

  /**
   * Cross-cutting orchestration collaborators (split-coordinator-handlers). The
   * handler slices reach these via {@link ctx}; this class also delegates its two
   * public boundary methods to {@link boundary} so `index.ts` is unchanged.
   */
  private readonly groups: GroupOrchestrator;
  private readonly boundary: BoundaryController;

  /** The seam handed to every slice handler on dispatch. */
  private readonly ctx: HandlerContext;
  private readonly handlers: HandlersMap;

  constructor(options: CoordinatorOptions) {
    this.store = options.store;
    this.persist = options.persist;
    this.broadcast = options.broadcast;
    this.emitAck = options.emitAck ?? defaultEmitAck;
    this.boundary = new BoundaryController(options.store);
    this.groups = new GroupOrchestrator(options.store);
    this.ctx = {
      store: this.store,
      // `markDirty` lives only here, never as a public Coordinator method — it
      // sets the per-cycle dirty flag set-as-you-go so a mutate-then-await-throw
      // handler still persists (chrome-event-coordination, design D4).
      markDirty: () => {
        this.dirty = true;
      },
      runSideEffect: (fn) => this.runSideEffect(fn),
      groups: this.groups,
      boundary: this.boundary,
    };
    // Assemble the handlers map from one typed `Pick<HandlersMap, …>` fragment per
    // slice. The `HandlersMap`-typed field makes this assignment fail `tsc` if the
    // union of fragments omits any `kind` — exhaustiveness enforced at this site.
    this.handlers = {
      ...chromeTabHandlers(),
      ...chromeGroupWindowHandlers(),
      ...spaceHandlers(),
      ...pinnedTabHandlers(),
      ...favoriteHandlers(),
      ...folderHandlers(),
      // Smart-folders: the lifecycle handlers start refreshes whose result
      // events re-enter this coordinator's queue — hence the enqueue closure.
      ...smartFolderHandlers({ enqueue: (ev) => this.enqueue(ev) }),
      ...tempTabHandlers(),
      ...autoArchiveHandlers(),
      ...boundaryHandlers(),
      ...backupHandlers(),
    };
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
   * boundary). Delegates to {@link BoundaryController}; preserved on this class so
   * the SW's settings watcher (`index.ts`) keeps calling the same method.
   */
  setBoundaryDefault(value: 'off' | 'domain' | 'page'): void {
    this.boundary.setBoundaryDefault(value);
  }

  /**
   * Re-resolve and re-push the boundary config for every currently-bound saved
   * tab. Delegates to {@link BoundaryController}; preserved on this class so the
   * SW (boot + settings watcher) keeps calling the same method.
   */
  async refreshBoundTabBoundaries(): Promise<void> {
    await this.boundary.refreshBoundTabBoundaries();
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
            await handler(this.ctx, event);
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
}
