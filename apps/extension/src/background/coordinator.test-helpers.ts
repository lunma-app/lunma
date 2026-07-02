import { vi } from 'vitest';
import type { CommandAck, SidebarCommand } from '../shared/bus';
import { LunmaStore } from '../shared/store.svelte';
import type { AppState } from '../shared/types';
import { Coordinator, type PendingEvent } from './coordinator';

export function makeCoordinator() {
  let counter = 0;
  const store = new LunmaStore({ idFactory: () => `id-${++counter}` });
  const persist = vi.fn<(state: AppState) => void>();
  const broadcast = vi.fn<(msg: { method: string; state: AppState }) => void>();
  const emitAck = vi.fn<(ack: CommandAck) => void>();
  const coordinator = new Coordinator({
    store,
    persist,
    broadcast,
    emitAck,
  });
  return { store, coordinator, persist, broadcast, emitAck };
}

export function tabCreated(tabId: number, windowId: number, url?: string): PendingEvent {
  return {
    source: 'chrome',
    kind: 'tabs.onCreated',
    payload: { tab: { id: tabId, windowId, url } as chrome.tabs.Tab },
  };
}

export function tabUpdated(
  tabId: number,
  changeInfo: {
    url?: string;
    status?: string;
    title?: string;
    favIconUrl?: string;
    groupId?: number;
  },
): PendingEvent {
  return {
    source: 'chrome',
    kind: 'tabs.onUpdated',
    payload: { tabId, changeInfo: changeInfo as chrome.tabs.OnUpdatedInfo },
  };
}

export function tabActivated(tabId: number, windowId: number): PendingEvent {
  return {
    source: 'chrome',
    kind: 'tabs.onActivated',
    payload: { activeInfo: { tabId, windowId } as chrome.tabs.OnActivatedInfo },
  };
}

export function windowCreated(
  id: number,
  type: `${chrome.windows.WindowType}` = 'normal',
): PendingEvent {
  return {
    source: 'chrome',
    kind: 'windows.onCreated',
    payload: { window: { id, type } as chrome.windows.Window },
  };
}

/** Construct a sidebar-source PendingEvent for a typed SidebarCommand. */
export function sidebar(cmd: SidebarCommand, correlationId: string): PendingEvent {
  return {
    source: 'sidebar',
    kind: cmd.kind,
    payload: cmd.payload,
    correlationId,
  } as PendingEvent;
}

/**
 * Install a chrome.bookmarks stub for tests that exercise the createSpace
 * handler. Returns the stub so individual tests can inspect calls.
 */
export interface BookmarksChromeStub {
  bookmarks: {
    create: ReturnType<typeof vi.fn>;
    getTree: ReturnType<typeof vi.fn>;
  };
  runtime?: {
    sendMessage: ReturnType<typeof vi.fn>;
  };
}

export function installBookmarksChromeStub(
  opts: { otherBookmarksId?: string } = {},
): BookmarksChromeStub {
  let nextId = 100;
  const otherBookmarks = {
    id: opts.otherBookmarksId ?? '2',
    title: 'Other Bookmarks',
    children: [],
  };
  const root = { id: '0', title: '', children: [otherBookmarks] };
  const stub: BookmarksChromeStub = {
    bookmarks: {
      getTree: vi.fn(async () => [root]),
      create: vi.fn(async (req: { parentId: string; title: string }) => ({
        id: `bm-${nextId++}`,
        parentId: req.parentId,
        title: req.title,
      })),
    },
    runtime: {
      sendMessage: vi.fn(() => Promise.resolve()),
    },
  };
  (globalThis as unknown as { chrome: BookmarksChromeStub }).chrome = stub;
  return stub;
}
