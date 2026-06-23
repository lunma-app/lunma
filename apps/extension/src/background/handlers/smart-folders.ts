// Smart-folder lifecycle + connector-result handlers (smart-folders, design
// D12/D3). The lifecycle commands mint/edit/delete the persisted config node
// and retune the poll alarm; the connector-result handler is the slice's
// single writer of the ephemeral `smartFolders` runtime. The network engine
// itself lives in `../smart-folders.ts` — fetches always run OFF the drain.

import { log } from '../../shared/logger';
import type { FolderId, SmartFolderItem, SmartSourceConfig, SpaceId } from '../../shared/types';
import { pageGlob } from '../../shared/url-boundary';
import { markPageOpenedTab } from '../page-opened-tabs';
import {
  CONNECTORS,
  normalizeBaseUrl,
  REFRESH_MINUTES_FLOOR,
  resolvedConfigs,
  type SmartFolderDeps,
  type SmartFolderNode,
  sourceKey,
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

/**
 * Normalize + validate each entry's `baseUrl` (throws on a non-http(s) URL) and
 * enforce the per-source `queries` rule (multi-filter-smart-connectors): a queue
 * source (gitlab/github/jira) entry SHALL carry a NON-EMPTY `queries`; a feed
 * source (rss) entry SHALL carry `queries: []`. Throws on a violation so the ack
 * carries the error and no node is persisted/updated.
 */
function normalizeAndValidateSources(
  sources: SmartSourceConfig[],
  command: string,
): SmartSourceConfig[] {
  return sources.map((cfg) => {
    const baseUrl = normalizeBaseUrl(cfg.baseUrl);
    if (cfg.source === 'rss') {
      if (cfg.queries.length > 0) {
        throw new Error(`${command}: rss source '${baseUrl}' must carry an empty queries array`);
      }
    } else if (cfg.queries.length === 0) {
      throw new Error(`${command}: queue source '${cfg.source}' requires at least one query`);
    }
    return { ...cfg, baseUrl };
  });
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
  | 'markSmartItemUnread'
  | 'markAllSmartItemsRead'
  | 'setSmartFolderHideRead'
  | 'openSmartFolderListing'
  | 'openSmartFolderPage'
  | 'importOpml'
  | 'smartFolders.result'
> {
  return {
    createSmartFolder: (ctx, event) => {
      const { spaceId, sources, name, maxItems, refreshMinutes } = event.payload;
      if (!spaceExists(ctx.store.state, spaceId)) {
        throw new Error(`createSmartFolder: unknown spaceId '${spaceId}'`);
      }
      // SW-minted identity (D12): handler mints the node. Validate + normalize
      // each source's baseUrl + per-source queries rule (throws on invalid →
      // error ack, no node). Icon comes from the first-source connector when all
      // sources share a kind; 'layers' for a mixed multi-source folder. hideRead
      // starts TRUE — a feed's resting state is the drained unread queue.
      const normalizedSources = normalizeAndValidateSources(sources, 'createSmartFolder');
      const firstSource = normalizedSources[0]?.source;
      const icon =
        firstSource && normalizedSources.every((s) => s.source === firstSource)
          ? CONNECTORS[firstSource].mintedIcon
          : 'layers';
      const node: SmartFolderNode = {
        kind: 'smart',
        id: crypto.randomUUID(),
        name,
        icon,
        sources: normalizedSources,
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
      const { spaceId, folderId, sources, name, maxItems, refreshMinutes } = event.payload;
      const node = requireSmartNode(ctx, 'updateSmartFolder', spaceId, folderId);
      const normalizedSources = normalizeAndValidateSources(sources, 'updateSmartFolder');
      // Capture the resolved-section keys BEFORE the store mutates `node.sources`,
      // so the diff finds added/removed sections (multi-filter-smart-connectors
      // design D2/D6). A maxItems change invalidates EVERY section's cap → refetch
      // all; a sources-only change refetches only the ADDED resolved sections and
      // the store prunes the REMOVED ones.
      const oldKeys = new Set(resolvedConfigs(node).map(sourceKey));
      const maxItemsChanged = node.maxItems !== maxItems;
      const sourcesChanged = JSON.stringify(node.sources) !== JSON.stringify(normalizedSources);
      const firstSource = normalizedSources[0]?.source;
      const newIcon =
        firstSource && normalizedSources.every((s) => s.source === firstSource)
          ? CONNECTORS[firstSource].mintedIcon
          : 'layers';
      ctx.store.updateSmartFolder(spaceId, folderId, {
        sources: normalizedSources,
        name,
        icon: newIcon,
        maxItems,
        refreshMinutes: clampRefreshMinutes(refreshMinutes),
      });
      ctx.markDirty();
      ctx.runSideEffect(() => syncSmartFoldersAlarm(ctx.store));
      const updated = requireSmartNode(ctx, 'updateSmartFolder', spaceId, folderId);
      const refreshDeps = { store: ctx.store, enqueue: deps.enqueue };
      if (maxItemsChanged) {
        // Cap changed for every section — refetch the whole folder so each
        // section re-slices to the new maximum.
        const { completion } = startSmartFolderRefresh(refreshDeps, { ...updated });
        ctx.runSideEffect(() => completion);
      } else if (sourcesChanged) {
        // Refetch only the newly-added resolved sections (the store has already
        // dropped the removed ones; unchanged sections keep their results).
        const added = resolvedConfigs(updated).filter((cfg) => !oldKeys.has(sourceKey(cfg)));
        if (added.length > 0) {
          const { completion } = startSmartFolderRefresh(
            refreshDeps,
            { ...updated },
            undefined,
            added,
          );
          ctx.runSideEffect(() => completion);
        }
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
      const { spaceId, folderId, itemId, windowId, fromPage } = event.payload;
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
        // A page-originated re-open marks the (already bound) tab so its close
        // returns to the page rather than auto-advancing (smart-folder-page).
        if (fromPage) markPageOpenedTab(boundSlot.tabId);
        const tab = await chrome.tabs.update(boundSlot.tabId, { active: true });
        if (tab?.windowId !== undefined) {
          await chrome.windows.update(tab.windowId, { focused: true });
        }
        return;
      }
      // Open-if-dormant: resolve the item from the SW's own runtime slice.
      // itemId is namespaced "${sourceKey}:${nativeId}" where sourceKey is the
      // per-filter section key (3 segments for queue, 2 for rss) — find the
      // section whose key prefixes itemId and holds the trailing native id.
      // (Valid section keys never prefix each other, so the match is unambiguous;
      // item.url is RSS-feed-controlled and scheme-validated below before create.)
      const folderSections = ctx.store.state.smartFolders[folderId]?.sections ?? {};
      let item: SmartFolderItem | undefined;
      for (const sk of Object.keys(folderSections)) {
        if (!itemId.startsWith(`${sk}:`)) continue;
        const nativeId = itemId.slice(sk.length + 1);
        const candidate = folderSections[sk]?.items.find((i) => i.id === nativeId);
        if (candidate) {
          item = candidate;
          break;
        }
      }
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
      // Opened from the page → record so closing returns to the page instead of
      // auto-advancing (smart-folder-page).
      if (fromPage) markPageOpenedTab(tabId);
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
    // The page's explicit un-mark (smart-folder-page reading controls). Folder-keyed
    // like markSmartItemRead; no refetch.
    markSmartItemUnread: (ctx, event) => {
      const { folderId, itemId } = event.payload;
      ctx.store.markSmartItemUnread(folderId, itemId);
      ctx.markDirty();
    },
    markAllSmartItemsRead: (ctx, event) => {
      const { spaceId, folderId } = event.payload;
      const node = requireSmartNode(ctx, 'markAllSmartItemsRead', spaceId, folderId);
      // Collect namespaced ids from all RSS sections only (task 4.5: hideRead /
      // mark-all-read applies to feed sources exclusively).
      const sections = ctx.store.state.smartFolders[folderId]?.sections ?? {};
      const namespacedIds: string[] = [];
      for (const cfg of node.sources) {
        if (cfg.source !== 'rss') continue;
        let host: string;
        try {
          host = new URL(cfg.baseUrl).host;
        } catch {
          continue;
        }
        const sk = `${cfg.source}:${host}`;
        for (const item of sections[sk]?.items ?? []) {
          namespacedIds.push(`${sk}:${item.id}`);
        }
      }
      ctx.store.markAllSmartItemsRead(folderId, namespacedIds);
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
      // Multi-source: open the first source's listing URL.
      const firstCfg = node.sources[0];
      if (!firstCfg) return;
      const url = CONNECTORS[firstCfg.source].listingUrl(firstCfg);
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
    // Open-or-focus the smart folder's full-page view (smart-folder-page, design
    // D2). The page is an extension page (chrome-extension:// URL) carrying the
    // target folderId as a query param. Reuse is by tab-query dedupe — NOT a
    // persisted binding: the open tab is its own registry, so reuse self-heals
    // across SW restarts. NOT openUrl: that handler drops the non-http(s) URL.
    openSmartFolderPage: async (ctx, event) => {
      const { spaceId, folderId, windowId } = event.payload;
      requireSmartNode(ctx, 'openSmartFolderPage', spaceId, folderId);
      const pageBase = chrome.runtime.getURL('src/launcher/folderpage/index.html');
      const url = `${pageBase}?folderId=${encodeURIComponent(folderId)}`;
      // Dedupe: a tab in THIS window already showing this folder's page (match on
      // the stable path + the folderId param only; extra params are ignored). The
      // page tab is the registry — no SW state to consult, so restart-safe.
      const tabs = await chrome.tabs.query({ windowId });
      const existing = tabs.find((t) => {
        if (t.url === undefined) return false;
        // Compare the pre-query string directly — `chrome-extension://` URLs have
        // an opaque origin (`URL.origin` is "null"), so origin+pathname would
        // never match; `searchParams` still parses fine for the folderId check.
        if (t.url.split('?')[0] !== pageBase) return false;
        let parsed: URL;
        try {
          parsed = new URL(t.url);
        } catch {
          return false;
        }
        return parsed.searchParams.get('folderId') === folderId;
      });
      if (existing?.id !== undefined) {
        // Focus the existing page tab. Guarded: between the query and the update
        // the tab can vanish (the user closed it) — a benign race that must NOT
        // throw the handler (which would log HANDLER_THREW + a rejected ack). On
        // failure fall through to opening a fresh page tab.
        try {
          const tab = await chrome.tabs.update(existing.id, { active: true });
          if (tab?.windowId !== undefined) {
            await chrome.windows.update(tab.windowId, { focused: true });
          }
          return;
        } catch (err) {
          log.debug('openSmartFolderPage: existing tab gone, reopening', { folderId, err });
        }
      }
      const tab = await chrome.tabs.create({ url, windowId });
      if (tab.id === undefined) {
        throw new Error('openSmartFolderPage: opened tab has no id');
      }
      // The page tab belongs to its Space's Chrome group, like an opened pinned
      // tab (floated off the critical path — a forbidden/odd page is benign).
      await ctx.groups.addTabToSpaceGroup(windowId, spaceId, tab.id);
    },
    // OPML bulk-import (multi-source-smart-folders): collect all valid feed
    // entries as SmartSourceConfig[], then create ONE smart folder with N sources.
    // Invalid URLs (normalizeBaseUrl throws) are skipped and counted.
    importOpml: (ctx, event) => {
      const { spaceId, feeds } = event.payload;
      if (!spaceExists(ctx.store.state, spaceId)) {
        throw new Error(`importOpml: unknown spaceId '${spaceId}'`);
      }
      const validEntries: { name: string; cfg: SmartSourceConfig }[] = [];
      let skipped = 0;
      for (const { name, feedUrl } of feeds) {
        try {
          const baseUrl = normalizeBaseUrl(feedUrl);
          validEntries.push({ name, cfg: { source: 'rss', baseUrl, queries: [] } });
        } catch (err) {
          log.warn('importOpml: skipping invalid feed entry', { name, feedUrl, err });
          skipped++;
        }
      }
      const imported = validEntries.length;
      if (imported === 0) {
        log.debug('importOpml: no valid sources', { skipped });
        return;
      }
      const folderName = imported === 1 ? (validEntries[0]?.name ?? 'Feeds') : 'Feeds';
      const node: SmartFolderNode = {
        kind: 'smart',
        id: crypto.randomUUID(),
        name: folderName,
        icon: CONNECTORS.rss.mintedIcon,
        sources: validEntries.map((e) => e.cfg),
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
      log.debug('importOpml: done', { imported, skipped });
    },
    'smartFolders.result': (ctx, event) => {
      const { folderId, sourceKey: sk, runtime } = event.payload;
      // A result landing after its folder was deleted is dropped — writing it
      // would resurrect an orphan runtime entry the delete already cleaned up.
      const stillExists = Object.values(ctx.store.state.pinnedBySpace).some((nodes) =>
        nodes.some((n) => n.kind === 'smart' && n.id === folderId),
      );
      if (!stillExists) return;
      ctx.store.setSmartSectionRuntime(folderId, sk, runtime);
      // Prune feed read-state to the live window on a successful section fetch
      // (rss-connector design D3): only `ok` carries the authoritative item set
      // — `pending`/`error` hold last-known items, so pruning against their
      // empty `items` would wrongly wipe the read set.
      if (runtime.state === 'ok') {
        // Prune only THIS section's read ids (namespaced to match the keys used
        // by markSmartItemRead) — other sections prune on their own results.
        ctx.store.pruneSmartReadState(
          folderId,
          sk,
          runtime.items.map((i) => `${sk}:${i.id}`),
        );
      }
      ctx.markDirty();
    },
  };
}
