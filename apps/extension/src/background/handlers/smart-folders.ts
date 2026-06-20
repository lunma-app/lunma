// Smart-folder lifecycle + connector-result handlers (smart-folders, design
// D12/D3). The lifecycle commands mint/edit/delete the persisted config node
// and retune the poll alarm; the connector-result handler is the slice's
// single writer of the ephemeral `smartFolders` runtime. The network engine
// itself lives in `../smart-folders.ts` — fetches always run OFF the drain.

import { log } from '../../shared/logger';
import type { FolderId, SpaceId } from '../../shared/types';
import { pageGlob } from '../../shared/url-boundary';
import {
  CONNECTORS,
  normalizeBaseUrl,
  REFRESH_MINUTES_FLOOR,
  type SmartFolderDeps,
  type SmartFolderNode,
  startSmartFolderRefresh,
  syncSmartFoldersAlarm,
} from '../smart-folders';
import { closeTab } from '../tab-groups';
import type { HandlersMap } from './context';
import { spaceExists } from './queries';

/** Clamp a requested cadence to the floor of 5 minutes (rate-limit kindness). */
function clampRefreshMinutes(minutes: number): number {
  return Math.max(REFRESH_MINUTES_FLOOR, Math.floor(minutes));
}

/** The smart node addressed by `{ spaceId, folderId }`, with the same error
 * contract as the sibling folder commands: unknown spaceId or folderId throws
 * (the ack carries the error). */
function requireSmartNode(
  ctx: { store: SmartFolderDeps['store'] },
  command: string,
  spaceId: SpaceId,
  folderId: FolderId,
): SmartFolderNode {
  if (!spaceExists(ctx.store.state, spaceId)) {
    throw new Error(`${command}: unknown spaceId '${spaceId}'`);
  }
  const node = (ctx.store.state.pinnedBySpace[spaceId] ?? []).find(
    (n): n is SmartFolderNode => n.kind === 'smart' && n.id === folderId,
  );
  if (!node) {
    throw new Error(`${command}: unknown smart folder '${folderId}' in Space '${spaceId}'`);
  }
  return node;
}

export function smartFolderHandlers(
  deps: Pick<SmartFolderDeps, 'enqueue'>,
): Pick<
  HandlersMap,
  | 'createSmartFolder'
  | 'updateSmartFolder'
  | 'deleteSmartFolder'
  | 'refreshSmartFolder'
  | 'openSmartItem'
  | 'markSmartItemRead'
  | 'markAllSmartItemsRead'
  | 'setSmartFolderHideRead'
  | 'openSmartFolderListing'
  | 'importOpml'
  | 'smartFolders.result'
> {
  return {
    createSmartFolder: (ctx, event) => {
      const { spaceId, source, name, baseUrl, query, maxItems, refreshMinutes } = event.payload;
      if (!spaceExists(ctx.store.state, spaceId)) {
        throw new Error(`createSmartFolder: unknown spaceId '${spaceId}'`);
      }
      // SW-minted identity (D12): the handler mints rather than the store
      // because the immediate first fetch needs the new id, and mutators are
      // void-returning. The icon comes from the source connector's
      // `mintedIcon` (the bus boundary rejects out-of-vocabulary sources, so
      // the registry lookup is total). An invalid baseUrl throws here —
      // error ack, no node. A feed source carries no `query` (rss-connector
      // design D2); `hideRead` starts TRUE — a feed's resting state is the
      // drained unread queue (the draining-queue model; inert on queue sources).
      const node: SmartFolderNode = {
        kind: 'smart',
        id: crypto.randomUUID(),
        name,
        icon: CONNECTORS[source].mintedIcon,
        source,
        baseUrl: normalizeBaseUrl(baseUrl),
        ...(query !== undefined ? { query } : {}),
        maxItems,
        hideRead: true,
        refreshMinutes: clampRefreshMinutes(refreshMinutes),
      };
      ctx.store.addSmartFolder(spaceId, node);
      ctx.markDirty();
      ctx.runSideEffect(() => syncSmartFoldersAlarm(ctx.store));
      // Immediate first fetch — off the drain's critical path; the outcome
      // rides the runtime slice, never this command's ack.
      const { completion } = startSmartFolderRefresh(
        { store: ctx.store, enqueue: deps.enqueue },
        node,
      );
      ctx.runSideEffect(() => completion);
    },
    updateSmartFolder: (ctx, event) => {
      const { spaceId, folderId, source, name, baseUrl, query, maxItems, refreshMinutes } =
        event.payload;
      const node = requireSmartNode(ctx, 'updateSmartFolder', spaceId, folderId);
      const normalized = normalizeBaseUrl(baseUrl);
      // A baseUrl/query/source/maxItems change invalidates the results (the store
      // mutator also nulls the runtime's fetchedAt) → immediate refetch
      // (rss-connector design D5 adds `maxItems`).
      const resultsInvalidated =
        node.baseUrl !== normalized ||
        node.query !== query ||
        node.source !== source ||
        node.maxItems !== maxItems;
      ctx.store.updateSmartFolder(spaceId, folderId, {
        source,
        name,
        baseUrl: normalized,
        query,
        maxItems,
        refreshMinutes: clampRefreshMinutes(refreshMinutes),
      });
      ctx.markDirty();
      ctx.runSideEffect(() => syncSmartFoldersAlarm(ctx.store));
      if (resultsInvalidated) {
        const updated = requireSmartNode(ctx, 'updateSmartFolder', spaceId, folderId);
        const { completion } = startSmartFolderRefresh(
          { store: ctx.store, enqueue: deps.enqueue },
          { ...updated },
        );
        ctx.runSideEffect(() => completion);
      }
    },
    deleteSmartFolder: (ctx, event) => {
      const { spaceId, folderId } = event.payload;
      requireSmartNode(ctx, 'deleteSmartFolder', spaceId, folderId);
      // Capture + drop the folder's item bindings FIRST (smart-folder-item-
      // bindings, design D4): each orphaned still-open bound tab demotes into
      // its window's active instance (`tempTabIds`) — honestly listed, never
      // invisible. The drop must precede the demotion so `restoreTempTab`'s
      // isBound guard no longer sees the binding. No tab closes.
      const orphaned = ctx.store.dropSmartFolderBindings(folderId);
      for (const tabId of orphaned) {
        const windowId = ctx.store.state.liveTabsById[tabId]?.windowId;
        if (windowId !== undefined) ctx.store.restoreTempTab(windowId, tabId);
      }
      // Removes the node AND drops its runtime entry — both are store state
      // (D12). No tabs close; the config is recreatable in seconds.
      ctx.store.deleteSmartFolder(spaceId, folderId);
      ctx.markDirty();
      ctx.runSideEffect(() => syncSmartFoldersAlarm(ctx.store));
    },
    // Smart-item activation (smart-folder-item-bindings, design D2): identity
    // in, URL from the SW's own runtime — open-if-dormant, focus-if-bound.
    openSmartItem: async (ctx, event) => {
      const { spaceId, folderId, itemId, windowId } = event.payload;
      // Unknown spaceId/folderId throws (error ack) — the unknown-id convention.
      requireSmartNode(ctx, 'openSmartItem', spaceId, folderId);
      // NOTE (rss-connector, the draining queue): opening a FEED item does NOT
      // mark it read — that would drain it from the list the instant you open
      // it. An item is "consumed" (marked read) only when you MOVE ON: its bound
      // tab is deactivated (you navigate to another tab) or closed. The store
      // does this in `setActiveTab` (which the open path's own setActiveTab below
      // and every tab-switch invoke) and in `onTabRemoved`. So the just-opened
      // item stays put — bound, active, unread — until you leave it.
      // Focus-if-bound: THIS window's slot only (the focusSavedTab shape). A
      // held row is by definition bound, so it always takes this path and
      // needs no URL at all.
      const boundSlot = ctx.store.state.smartItemBindings[folderId]?.[itemId]?.[windowId];
      if (boundSlot !== undefined) {
        const tab = await chrome.tabs.update(boundSlot.tabId, { active: true });
        if (tab?.windowId !== undefined) {
          await chrome.windows.update(tab.windowId, { focused: true });
        }
        return;
      }
      // Open-if-dormant: resolve the item from the SW's own runtime slice.
      // The itemId lookup key is safe, but item.url is RSS-feed-controlled data
      // and could carry a non-http(s) scheme — validate it before tabs.create.
      const item = ctx.store.state.smartFolders[folderId]?.items.find((i) => i.id === itemId);
      if (!item) {
        throw new Error(
          `openSmartItem: item '${itemId}' is neither bound nor listed in folder '${folderId}'`,
        );
      }
      // Scheme guard: mirrors openUrl / openSmartFolderListing.
      let itemScheme: string;
      try {
        itemScheme = new URL(item.url).protocol;
      } catch {
        log.warn('openSmartItem: unparseable item URL, dropping', { itemId, folderId });
        return;
      }
      if (itemScheme !== 'http:' && itemScheme !== 'https:') {
        log.warn('openSmartItem: blocked non-http(s) item URL', {
          itemId,
          folderId,
          scheme: itemScheme,
        });
        return;
      }
      // Compute the allow-glob for boundary enforcement (smart-tab-boundary, D2):
      // origin + pathname + '*' so every sub-path of the item stays in-tab.
      const allowGlob = pageGlob(item.url) ?? '';
      const tab = await chrome.tabs.create({ url: item.url, windowId });
      if (tab.id === undefined) {
        throw new Error('openSmartItem: opened tab has no id');
      }
      const tabId = tab.id;
      // Bind in the SAME drain (the openSavedTab ordering): the binding lands
      // before Chrome's onCreated round-trips, so the temp classifier's
      // isBound check passes the tab over — it NEVER appears in Temporary.
      ctx.store.bindSmartItem(folderId, itemId, windowId, tabId, allowGlob);
      // Seed the live-tab record + active flag straight from the just-created
      // tab so THIS drain's broadcast already shows the row bound/active
      // (idempotent with the real onCreated/onActivated events).
      ctx.store.syncLiveTab({
        id: tabId,
        windowId,
        title: tab.title,
        url: tab.url,
        active: tab.active,
        status: tab.status,
        favIconUrl: tab.favIconUrl,
      });
      // Activating the new tab deactivates the PREVIOUS feed entry's tab, which
      // consumes it (rss-connector, the draining queue) → close those tabs
      // (consume = close). The just-opened tab is active, so it is never closed.
      const consumed = ctx.store.setActiveTab(windowId, tabId);
      for (const closeId of consumed) ctx.runSideEffect(() => closeTab(closeId));
      // The bound tab belongs to its Space — it joins the Space's Chrome group
      // in this window, like an opened pinned tab.
      await ctx.groups.addTabToSpaceGroup(windowId, spaceId, tabId);
      ctx.markDirty();
      // Arm the boundary content script as a side effect (smart-tab-boundary):
      // floated off the drain's critical path like openSavedTab's arm.
      ctx.runSideEffect(async () => ctx.boundary.configureSmartItemBoundary(tabId, allowGlob));
    },
    refreshSmartFolder: (ctx, event) => {
      const { spaceId, folderId } = event.payload;
      const node = requireSmartNode(ctx, 'refreshSmartFolder', spaceId, folderId);
      // Unconditional refresh. The handler returns synchronously once the
      // fetch is underway, so the ack is 'ok' BEFORE the fetch resolves; the
      // outcome lands via the runtime slice on a later drain (D12).
      const { completion } = startSmartFolderRefresh(
        { store: ctx.store, enqueue: deps.enqueue },
        { ...node },
      );
      ctx.runSideEffect(() => completion);
    },
    // Feed read-state (rss-connector design D3). `markSmartItemRead` carries no
    // spaceId (the read-state slice is folder-keyed); the rest validate via
    // requireSmartNode. None refetch — read-state is independent of the fetch
    // window (only baseUrl/query/source/maxItems invalidate results).
    markSmartItemRead: (ctx, event) => {
      const { folderId, itemId } = event.payload;
      ctx.store.markSmartItemRead(folderId, itemId);
      ctx.markDirty();
    },
    markAllSmartItemsRead: (ctx, event) => {
      const { spaceId, folderId } = event.payload;
      requireSmartNode(ctx, 'markAllSmartItemsRead', spaceId, folderId);
      // Mark every CURRENTLY-listed item read — the runtime slice's items are the
      // live window the pruning keeps the read-state aligned to.
      const items = ctx.store.state.smartFolders[folderId]?.items ?? [];
      ctx.store.markAllSmartItemsRead(
        folderId,
        items.map((i) => i.id),
      );
      ctx.markDirty();
    },
    setSmartFolderHideRead: (ctx, event) => {
      const { spaceId, folderId, hideRead } = event.payload;
      requireSmartNode(ctx, 'setSmartFolderHideRead', spaceId, folderId);
      ctx.store.setSmartFolderHideRead(folderId, hideRead);
      ctx.markDirty();
    },
    // Open the source's full listing in a new tab (rss-connector design D6) — the
    // connector's `listingUrl`, scheme-hardened like `openUrl` (a feed's channel
    // link is arbitrary-origin). No state mutation; the tab adopts into the
    // window's active Space via the normal `tabs.onCreated` path.
    openSmartFolderListing: async (ctx, event) => {
      const { spaceId, folderId, windowId } = event.payload;
      const node = requireSmartNode(ctx, 'openSmartFolderListing', spaceId, folderId);
      const url = CONNECTORS[node.source].listingUrl(node);
      let scheme: string;
      try {
        scheme = new URL(url).protocol;
      } catch {
        log.warn('openSmartFolderListing: unparseable listing URL, dropping', { url });
        return;
      }
      if (scheme !== 'http:' && scheme !== 'https:') {
        log.warn('openSmartFolderListing: blocked non-http(s) scheme', { url, scheme });
        return;
      }
      await chrome.tabs.create({ url, windowId });
    },
    // OPML bulk-import (opml-import-export): iterate feeds, apply
    // createSmartFolder logic per entry; catch per-entry validation errors
    // (normalizeBaseUrl throws on an invalid URL), increment skipped.
    importOpml: (ctx, event) => {
      const { spaceId, feeds } = event.payload;
      if (!spaceExists(ctx.store.state, spaceId)) {
        throw new Error(`importOpml: unknown spaceId '${spaceId}'`);
      }
      let imported = 0;
      let skipped = 0;
      for (const { name, feedUrl } of feeds) {
        try {
          const node: SmartFolderNode = {
            kind: 'smart',
            id: crypto.randomUUID(),
            name,
            icon: CONNECTORS.rss.mintedIcon,
            source: 'rss',
            baseUrl: normalizeBaseUrl(feedUrl),
            maxItems: 10,
            hideRead: true,
            refreshMinutes: 30,
          };
          ctx.store.addSmartFolder(spaceId, node);
          ctx.markDirty();
          ctx.runSideEffect(() => syncSmartFoldersAlarm(ctx.store));
          const { completion } = startSmartFolderRefresh(
            { store: ctx.store, enqueue: deps.enqueue },
            node,
          );
          ctx.runSideEffect(() => completion);
          imported++;
        } catch (err) {
          log.warn('importOpml: skipping invalid feed entry', { name, feedUrl, err });
          skipped++;
        }
      }
      log.debug('importOpml: done', { imported, skipped });
    },
    'smartFolders.result': (ctx, event) => {
      const { folderId, runtime } = event.payload;
      // A result landing after its folder was deleted is dropped — writing it
      // would resurrect an orphan runtime entry the delete already cleaned up.
      const stillExists = Object.values(ctx.store.state.pinnedBySpace).some((nodes) =>
        nodes.some((n) => n.kind === 'smart' && n.id === folderId),
      );
      if (!stillExists) return;
      ctx.store.setSmartFolderRuntime(folderId, runtime);
      // Prune feed read-state to the live window on a successful fetch
      // (rss-connector design D3): only `ok` carries the authoritative item set
      // — `pending`/`error` hold last-known items, so pruning against their
      // empty `items` would wrongly wipe the read set.
      if (runtime.state === 'ok') {
        ctx.store.pruneSmartReadState(
          folderId,
          runtime.items.map((i) => i.id),
        );
      }
      ctx.markDirty();
    },
  };
}
