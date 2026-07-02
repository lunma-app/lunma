// The shared leaf module for the coordinator's handler slices (split-coordinator-
// handlers). It hosts the `PendingEvent` event-shape types (moved verbatim out of
// `coordinator.ts` so the slice factories and the coordinator can both import
// them without an import cycle — see design D4b), the `Handler`/`HandlersMap`
// types, and the `HandlerContext` seam each slice receives. `coordinator.ts`
// re-exports `PendingEvent`/`PendingEventKind`/`SidebarPendingEvent`/`Handler`/
// `HandlersMap`, so every external import that reads them `from './coordinator'`
// is unchanged.

import type { SidebarCommand } from '../../shared/bus';
import type { LunmaStore } from '../../shared/store.svelte';
import type { FolderId, LensSectionRuntime } from '../../shared/types';
import type { BoundaryController } from '../boundary-controller';
import type { GroupOrchestrator } from '../group-orchestrator';

// Per `typed-message-bus`: `PendingEvent` spans both chrome events and sidebar
// commands. Sidebar variants carry a `correlationId` so the drain tail can emit a
// matching `'lunma/command-ack'` back to the bus client.

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
  | SidebarVariant<'createLens'>
  | SidebarVariant<'updateLens'>
  | SidebarVariant<'deleteLens'>
  | SidebarVariant<'createAccount'>
  | SidebarVariant<'renameAccount'>
  | SidebarVariant<'deleteAccount'>
  | SidebarVariant<'refreshLens'>
  | SidebarVariant<'openLensItem'>
  | SidebarVariant<'markLensItemRead'>
  | SidebarVariant<'markLensItemUnread'>
  | SidebarVariant<'markAllLensItemsRead'>
  | SidebarVariant<'setLensHideRead'>
  | SidebarVariant<'setLensFilter'>
  | SidebarVariant<'setLensArticleLayout'>
  | SidebarVariant<'openLensListing'>
  | SidebarVariant<'openLensPage'>
  | SidebarVariant<'reorderTemp'>
  | SidebarVariant<'reorderSpaces'>
  | SidebarVariant<'focusTab'>
  | SidebarVariant<'closeTab'>
  | SidebarVariant<'newTab'>
  | SidebarVariant<'clearTempTabs'>
  | SidebarVariant<'undoClearTempTabs'>
  | SidebarVariant<'openUrl'>
  | SidebarVariant<'duplicateTab'>
  | SidebarVariant<'setTabBoundary'>
  | SidebarVariant<'restoreArchivedTab'>
  | SidebarVariant<'setSpaceAutoArchive'>
  | SidebarVariant<'deleteArchivedTab'>
  | SidebarVariant<'clearArchivedTabs'>
  // Data-backup (data-backup capability): replace the whole store state from an
  // imported backup file. Dispatched by the options page; handled by the SW.
  | SidebarVariant<'importState'>
  // OPML import (opml-import-export): bulk-create RSS lenses from a parsed feed
  // list. Dispatched by the options page; handled by the SW.
  | SidebarVariant<'importOpml'>
  // Auto-archive (auto-archive, design D2): the `chrome.alarms`-driven idle-tab
  // sweep. A new `source: 'alarm'` — not a Chrome event, not a sidebar command —
  // carrying no payload and no `correlationId` (fire-and-forget; nobody awaits it).
  | { source: 'alarm'; kind: 'autoArchiveSweep' }
  // Lenses (lenses, design D3): a connector fetch's outcome, enqueued OFF-drain
  // by `background/lenses.ts` so only the drain's handler writes the `lenses`
  // runtime slice (single-writer). A new `source: 'connector'` — results also
  // arrive from manual refresh and the sidebar-open kick, so reusing `'alarm'`
  // would dilute what it means. No `correlationId` (fire-and-forget; the refresh
  // ack never carries the fetch outcome).
  | {
      source: 'connector';
      kind: 'lenses.result';
      payload: { folderId: FolderId; sourceKey: string; runtime: LensSectionRuntime };
    };

export type PendingEventKind = PendingEvent['kind'];

// Every PendingEvent EXCEPT the payload-less `autoArchiveSweep`. The coalesce /
// merge plumbing only runs for payloaded kinds (the sweep declares no
// coalesceKey, so it never reaches a merge), so its payload type comes from here.
type PayloadedEvent = Extract<PendingEvent, { payload: unknown }>;
export type PendingPayload = PayloadedEvent['payload'];

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

export type Handler<E extends PendingEvent> = (
  ctx: HandlerContext,
  event: E,
) => void | Promise<void>;

export type HandlersMap = {
  [K in PendingEventKind]: Handler<Extract<PendingEvent, { kind: K }>>;
};

// Helper for external code that constructs sidebar PendingEvents in tests without
// restating the discriminated-union shape.
export type SidebarPendingEvent = Extract<PendingEvent, { source: 'sidebar' }>;

/**
 * The seam every handler slice receives. Deliberately small (5 members): the
 * effectful cross-cutting orchestration lives behind `groups` / `boundary`, the
 * pure read predicates live as free functions in `./queries`, and `markDirty` is
 * set imperatively (set-as-you-go) so a handler that mutates state then awaits
 * I/O that throws still has its mutation persisted (design D4). `markDirty` lives
 * ONLY here — never on the `Coordinator` public class.
 */
export interface HandlerContext {
  readonly store: LunmaStore;
  /** Signal that this drain cycle mutated persisted state → persist + broadcast. */
  markDirty(): void;
  /** Run a side-effect OFF the drain's critical path (see Coordinator.runSideEffect). */
  runSideEffect(fn: () => Promise<void>): void;
  /** Enqueue a PendingEvent into this coordinator's queue. */
  enqueue(ev: PendingEvent): void;
  /**
   * Read the cached `dedupNewTabNavigations` setting (navigation-tab-dedup),
   * pushed by the SW settings watcher onto the coordinator (like
   * `pinnedTabBoundaryDefault`) so the tab handler reads it SYNCHRONOUSLY on the
   * drain — no per-navigation `readSettings()`. Defaults to `true` until seeded.
   */
  dedupNewTabNavigations(): boolean;
  /**
   * Read the cached `dedupMovesTabToTop` setting (dedup-moves-tab-to-top),
   * pushed by the SW settings watcher onto the coordinator, mirroring
   * {@link dedupNewTabNavigations}. When `true`, a dedup focus (any of
   * `openUrl`, onCreated-time, or navigation dedup) also promotes the focused
   * temp tab to the top of its Temporary list. Defaults to `true` until
   * seeded.
   */
  dedupMovesTabToTop(): boolean;
  readonly groups: GroupOrchestrator;
  readonly boundary: BoundaryController;
}
