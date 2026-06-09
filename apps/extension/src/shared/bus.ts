import { log } from './logger';
import type {
  FolderId,
  IconName,
  PinNode,
  SavedTabId,
  SpaceAutoArchive,
  SpaceColor,
  SpaceId,
  TabBoundary,
  TabId,
  WindowId,
} from './types';

// Tasks 1.1, 1.2: typed command + ack discriminated unions.

export type SidebarCommand =
  | {
      kind: 'createSpace';
      payload: { name: string; color: SpaceColor; icon: IconName; windowId: WindowId };
    }
  | { kind: 'renameSpace'; payload: { spaceId: SpaceId; newName: string } }
  | { kind: 'recolourSpace'; payload: { spaceId: SpaceId; color: SpaceColor } }
  | { kind: 'changeSpaceIcon'; payload: { spaceId: SpaceId; icon: IconName } }
  | { kind: 'deleteSpace'; payload: { spaceId: SpaceId } }
  | { kind: 'restoreSpaceFromTrash'; payload: { spaceId: SpaceId } }
  | { kind: 'activateSpace'; payload: { windowId: WindowId; spaceId: SpaceId } }
  | { kind: 'openSavedTab'; payload: { savedTabId: SavedTabId; windowId: WindowId } }
  // Per-window-tab-bindings (ADR 0009): focus/go-home act on THIS window's bound
  // tab, so both carry the activating `windowId`.
  | { kind: 'focusSavedTab'; payload: { savedTabId: SavedTabId; windowId: WindowId } }
  | { kind: 'goHome'; payload: { savedTabId: SavedTabId; windowId: WindowId } }
  | { kind: 'makeThisHome'; payload: { savedTabId: SavedTabId } }
  | { kind: 'deleteSavedTab'; payload: { savedTabId: SavedTabId } }
  | {
      kind: 'pinTab';
      payload: {
        tabId: TabId;
        windowId: WindowId;
        spaceId: SpaceId;
        targetIndex: number;
        /**
         * Optional placement target for a temp→pinned drop (pin-temp-tab-into-folder).
         * Absent → pin at the top-level `targetIndex` (the prior behaviour).
         * `{ into }` → file into that folder's `children`; `{ withSavedTabId }` →
         * fold with that pinned tab into a new folder. Mutually exclusive; the SW
         * re-validates the target exists and falls back to the top-level insert
         * (no orphan), so a stale id never loses the tab.
         */
        placement?: { into: FolderId } | { withSavedTabId: SavedTabId };
      };
    }
  | { kind: 'unpinTab'; payload: { savedTabId: SavedTabId; windowId: WindowId } }
  | { kind: 'reorderPinned'; payload: { spaceId: SpaceId; nodes: PinNode[] } }
  // Favicon-row-model (ADR 0010): space-less twins of pin/unpin/reorder. Kept
  // separate from pinTab/unpinTab rather than overloaded with a null mode, so
  // the null-`spaceId` guard stays explicit (design D7/D8).
  // Mint a global favorite from a live tab (non-destructive — the tab stays open).
  | {
      kind: 'favoriteTab';
      payload: { tabId: TabId; windowId: WindowId; targetIndex?: number };
    }
  // Decouple a pinned tab into a favorite.
  | { kind: 'favoriteSavedTab'; payload: { savedTabId: SavedTabId } }
  // Couple a favorite to a Space (the active Space, supplied by the sidebar).
  | { kind: 'pinSavedTab'; payload: { savedTabId: SavedTabId; spaceId: SpaceId; index?: number } }
  // Reorder the favicon row to the post-drop order.
  | { kind: 'reorderFavorites'; payload: { ids: SavedTabId[] } }
  | { kind: 'createFolder'; payload: { spaceId: SpaceId } }
  | {
      kind: 'createFolderFromTabs';
      payload: { spaceId: SpaceId; tabIdA: SavedTabId; tabIdB: SavedTabId; index: number };
    }
  | { kind: 'renameFolder'; payload: { spaceId: SpaceId; folderId: FolderId; name: string } }
  | { kind: 'setFolderIcon'; payload: { spaceId: SpaceId; folderId: FolderId; icon: IconName } }
  | { kind: 'setFolderColor'; payload: { spaceId: SpaceId; folderId: FolderId; color: SpaceColor } }
  | { kind: 'deleteFolder'; payload: { spaceId: SpaceId; folderId: FolderId } }
  | { kind: 'reorderTemp'; payload: { windowId: WindowId; tabIds: TabId[] } }
  | { kind: 'reorderSpaces'; payload: { spaceIds: SpaceId[] } }
  | { kind: 'renameTab'; payload: { savedTabId: SavedTabId; newName: string } }
  | {
      kind: 'renameTempTab';
      payload: { tabId: TabId; spaceId: SpaceId; windowId: WindowId; newName: string };
    }
  | { kind: 'focusTab'; payload: { tabId: TabId } }
  | { kind: 'closeTab'; payload: { tabId: TabId } }
  | { kind: 'newTab'; payload: { windowId: WindowId; spaceId?: SpaceId } }
  | { kind: 'clearTempTabs'; payload: { windowId: WindowId; spaceId?: SpaceId } }
  // Undo a just-cleared batch (safety-destructive-actions). Carries `tabId`s, not
  // the SW-generated `archivedAt`: the sidebar knows the cleared `tabId`s locally,
  // whereas `archivedAt` never returns through the (void) bus ack. The coordinator
  // restores the most-recent archived entry per `tabId` into `windowId`.
  | { kind: 'undoClearTempTabs'; payload: { windowId: WindowId; tabIds: TabId[] } }
  | { kind: 'openUrl'; payload: { url: string; windowId: WindowId } }
  | {
      kind: 'setTabBoundary';
      payload: { savedTabId: SavedTabId; boundary: TabBoundary | null };
    }
  // Auto-archive (auto-archive): re-open an archived tab in the requesting window,
  // and set/clear a Space's override. The archived entry is identified by the
  // composite `(archivedAt, tabId)` — `archivedAt` alone is NOT unique (one sweep
  // stamps every tab it archives with the same `now`), but a tab is archived at
  // most once per sweep and sweeps carry distinct timestamps, so the pair is.
  | {
      kind: 'restoreArchivedTab';
      payload: { archivedAt: number; tabId: number; windowId: WindowId };
    }
  | {
      kind: 'setSpaceAutoArchive';
      payload: { spaceId: SpaceId; autoArchive: SpaceAutoArchive | null };
    }
  // Discard ONE archived-tab record without restoring it (the per-row delete in the
  // options Recently-archived view). Identified by the same `(archivedAt, tabId)`
  // composite as restore.
  | { kind: 'deleteArchivedTab'; payload: { archivedAt: number; tabId: number } }
  // Discard every archived-tab record (the "Clear all" affordance in the options
  // Recently-archived view). Global — not scoped to a Space. No payload.
  | { kind: 'clearArchivedTabs'; payload: Record<string, never> };

export type SidebarCommandKind = SidebarCommand['kind'];

export const SIDEBAR_COMMAND_KINDS: ReadonlySet<SidebarCommandKind> = new Set<SidebarCommandKind>([
  'createSpace',
  'renameSpace',
  'recolourSpace',
  'changeSpaceIcon',
  'deleteSpace',
  'restoreSpaceFromTrash',
  'activateSpace',
  'openSavedTab',
  'focusSavedTab',
  'goHome',
  'makeThisHome',
  'deleteSavedTab',
  'pinTab',
  'unpinTab',
  'reorderPinned',
  'favoriteTab',
  'favoriteSavedTab',
  'pinSavedTab',
  'reorderFavorites',
  'createFolder',
  'createFolderFromTabs',
  'renameFolder',
  'setFolderIcon',
  'setFolderColor',
  'deleteFolder',
  'reorderTemp',
  'reorderSpaces',
  'renameTab',
  'renameTempTab',
  'focusTab',
  'closeTab',
  'newTab',
  'clearTempTabs',
  'undoClearTempTabs',
  'openUrl',
  'setTabBoundary',
  'restoreArchivedTab',
  'setSpaceAutoArchive',
  'deleteArchivedTab',
  'clearArchivedTabs',
]);

// Compile-time exhaustiveness guard: if a new variant is added to `SidebarCommand`
// (and therefore to `SidebarCommandKind`), the `satisfies` assertion below will
// produce a type error until the corresponding string is added to the Set above.
const _kindExhaustiveness = {
  createSpace: true,
  renameSpace: true,
  recolourSpace: true,
  changeSpaceIcon: true,
  deleteSpace: true,
  restoreSpaceFromTrash: true,
  activateSpace: true,
  openSavedTab: true,
  focusSavedTab: true,
  goHome: true,
  makeThisHome: true,
  deleteSavedTab: true,
  pinTab: true,
  unpinTab: true,
  reorderPinned: true,
  favoriteTab: true,
  favoriteSavedTab: true,
  pinSavedTab: true,
  reorderFavorites: true,
  createFolder: true,
  createFolderFromTabs: true,
  renameFolder: true,
  setFolderIcon: true,
  setFolderColor: true,
  deleteFolder: true,
  reorderTemp: true,
  reorderSpaces: true,
  renameTab: true,
  renameTempTab: true,
  focusTab: true,
  closeTab: true,
  newTab: true,
  clearTempTabs: true,
  undoClearTempTabs: true,
  openUrl: true,
  setTabBoundary: true,
  restoreArchivedTab: true,
  setSpaceAutoArchive: true,
  deleteArchivedTab: true,
  clearArchivedTabs: true,
} satisfies Record<SidebarCommandKind, true>;

export interface CommandMessage {
  type: 'lunma/command';
  id: string;
  cmd: SidebarCommand;
}

export type CommandAckResult = 'ok' | { error: string };

export interface CommandAck {
  type: 'lunma/command-ack';
  id: string;
  result: CommandAckResult;
}

// Task 1.3: structured errors.

export class BusTimeoutError extends Error {
  readonly kind: SidebarCommandKind;
  readonly id: string;
  constructor(id: string, kind: SidebarCommandKind) {
    super(`[${kind}] bus timed out after ${BUS_TIMEOUT_MS}ms (id=${id})`);
    this.name = 'BusTimeoutError';
    this.kind = kind;
    this.id = id;
  }
}

export class BusSendError extends Error {
  readonly kind: SidebarCommandKind;
  readonly id: string;
  constructor(id: string, kind: SidebarCommandKind, cause: unknown) {
    super(`[${kind}] bus send failed (id=${id}): ${describeCause(cause)}`);
    this.name = 'BusSendError';
    this.kind = kind;
    this.id = id;
    (this as { cause?: unknown }).cause = cause;
  }
}

function describeCause(cause: unknown): string {
  if (cause instanceof Error) return cause.message;
  if (typeof cause === 'string') return cause;
  try {
    return JSON.stringify(cause);
  } catch {
    return String(cause);
  }
}

// Task 1.4: tunable timeout, no per-call override.
export const BUS_TIMEOUT_MS = 10000;

// Task 1.5: transport seam.
export interface BusTransport {
  sendMessage(msg: unknown): Promise<unknown>;
  onMessage: {
    addListener(listener: (raw: unknown) => void): void;
    removeListener(listener: (raw: unknown) => void): void;
  };
}

export interface Bus {
  send(cmd: SidebarCommand): Promise<void>;
  /** Test-only: returns the per-bus sessionId so tests can craft cross-instance acks. */
  readonly __sessionId: string;
}

interface PendingCall {
  resolve: () => void;
  reject: (err: Error) => void;
  timeoutHandle: ReturnType<typeof setTimeout>;
  kind: SidebarCommandKind;
}

function allocateSessionId(): string {
  // 32 random bits, base36 — short and unique enough for cross-instance disambiguation.
  return Math.floor(Math.random() * 0x100000000).toString(36);
}

function parseSession(id: string): string | null {
  const colon = id.indexOf(':');
  return colon === -1 ? null : id.slice(0, colon);
}

export function createBus(transport: BusTransport): Bus {
  const sessionId = allocateSessionId();
  let counter = 0;
  const pending = new Map<string, PendingCall>();

  const enrichError = (kind: SidebarCommandKind, msg: string): Error => {
    const err = new Error(`[${kind}] ${msg}`);
    (err as { kind?: string }).kind = kind;
    return err;
  };

  const ackListener = (raw: unknown): void => {
    if (!raw || typeof raw !== 'object') return;
    const m = raw as Partial<CommandAck>;
    if (m.type !== 'lunma/command-ack') return;
    const id = m.id;
    const result = m.result;
    if (typeof id !== 'string' || result === undefined) return;

    const call = pending.get(id);
    if (!call) {
      // No outstanding call for this id — both cases are benign, so debug, not
      // warn. Acks are BROADCAST to every surface, so a foreign id is normal
      // traffic: another surface's command, or a fire-and-forget SW-synthetic
      // one (`cmd:…` for pin-active-tab / a boundary divert, `ov:…` for the
      // launcher) that no bus client is awaiting. Same-session-but-cleared is a
      // timed-out command's late ack.
      if (parseSession(id) === sessionId) {
        log.debug('BUS_ACK_AFTER_CLEAR', { id });
      } else {
        log.debug('BUS_ACK_FOREIGN_ID', { id });
      }
      return;
    }

    clearTimeout(call.timeoutHandle);
    pending.delete(id);
    if (result === 'ok') {
      call.resolve();
    } else {
      call.reject(enrichError(call.kind, result.error));
    }
  };

  transport.onMessage.addListener(ackListener);

  const send = (cmd: SidebarCommand): Promise<void> => {
    counter += 1;
    const id = `${sessionId}:${counter}`;
    const message: CommandMessage = { type: 'lunma/command', id, cmd };

    return new Promise<void>((resolve, reject) => {
      const timeoutHandle = setTimeout(() => {
        if (pending.delete(id)) {
          reject(new BusTimeoutError(id, cmd.kind));
        }
      }, BUS_TIMEOUT_MS);

      pending.set(id, { resolve, reject, timeoutHandle, kind: cmd.kind });

      let sendPromise: Promise<unknown>;
      try {
        sendPromise = transport.sendMessage(message);
      } catch (err) {
        if (pending.delete(id)) {
          clearTimeout(timeoutHandle);
          reject(new BusSendError(id, cmd.kind, err));
        }
        return;
      }
      sendPromise.catch((err: unknown) => {
        if (pending.delete(id)) {
          clearTimeout(timeoutHandle);
          reject(new BusSendError(id, cmd.kind, err));
        }
      });
    });
  };

  return {
    send,
    get __sessionId() {
      return sessionId;
    },
  };
}

// Task 1.7: singleton wired to chrome.runtime. The transport adapter below
// wraps chrome.runtime so the BusTransport surface stays minimal.
//
// Lazy construction: in non-extension contexts (e.g. Vitest unit tests that
// import `bus.ts` for its types/factory but never touch the singleton), the
// `chrome` global may not exist. Constructing on first access avoids the
// reference error while preserving singleton semantics for real runs.
const chromeTransport: BusTransport = {
  sendMessage: (msg) => chrome.runtime.sendMessage(msg),
  onMessage: {
    addListener: (listener) => {
      chrome.runtime.onMessage.addListener(listener);
    },
    removeListener: (listener) => {
      chrome.runtime.onMessage.removeListener(listener);
    },
  },
};

let _bus: Bus | undefined;
export const bus: Bus = new Proxy({} as Bus, {
  get(_target, prop) {
    if (!_bus) _bus = createBus(chromeTransport);
    return Reflect.get(_bus, prop);
  },
});
