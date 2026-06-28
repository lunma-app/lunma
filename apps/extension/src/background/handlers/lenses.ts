// Smart-folder lifecycle + connector-result handlers (smart-folders, design
// D12/D3). The lifecycle commands mint/edit/delete the persisted config node
// and retune the poll alarm; the connector-result handler is the slice's
// single writer of the ephemeral `smartFolders` runtime. The network engine
// itself lives in `../smart-folders.ts` — fetches always run OFF the drain.

import { deriveLensKind } from '../../shared/lens-entity';
import { log } from '../../shared/logger';
import type {
  AppState,
  FolderId,
  LensItem,
  LensSourceRef,
  SourceAccount,
  SpaceId,
} from '../../shared/types';
import { pageGlob } from '../../shared/url-boundary';
import {
  CONNECTORS,
  fetchLensSectionRuntime,
  isCloudBitbucketHost,
  type LensDeps,
  type LensNode,
  normalizeBaseUrl,
  REFRESH_MINUTES_FLOOR,
  resolvedConfigs,
  sourceKey,
  startLensRefresh,
  syncLensesAlarm,
} from '../lenses';
import { markPageOpenedTab } from '../page-opened-tabs';
import { closeTab } from '../tab-groups';
import type { HandlersMap } from './context';
import { spaceExists } from './queries';

/** Clamp a requested cadence to the floor of 5 minutes (rate-limit kindness). */
function clampRefreshMinutes(minutes: number): number {
  return Math.max(REFRESH_MINUTES_FLOOR, Math.floor(minutes));
}

/**
 * Validate each lens reference (connector-accounts): every `sourceId` SHALL
 * resolve to an existing `AppState.sources` account, and the per-source `queries`
 * rule SHALL hold against the RESOLVED provider — a queue account
 * (gitlab/github/jira) reference carries a NON-EMPTY `queries`; a feed account
 * (rss) reference carries `queries: []`. Throws on a violation so the ack carries
 * the error and no node is persisted/updated. Returns the (validated) refs.
 */
function validateSourceRefs(
  sources: AppState['sources'],
  refs: LensSourceRef[],
  command: string,
): LensSourceRef[] {
  return refs.map((ref) => {
    const account = sources[ref.sourceId];
    if (!account) {
      throw new Error(`${command}: unknown sourceId '${ref.sourceId}'`);
    }
    if (account.provider === 'rss') {
      if (ref.queries.length > 0) {
        throw new Error(
          `${command}: rss account '${ref.sourceId}' must carry an empty queries array`,
        );
      }
    } else if (ref.queries.length === 0) {
      throw new Error(
        `${command}: queue account '${account.provider}' requires at least one query`,
      );
    }
    // A Cloud bitbucket source (host bitbucket.org) cannot carry
    // `review-requested` (add-bitbucket-connector, D4) — Cloud has no
    // workspace/user-level reviewer endpoint, so it supports `authored` only.
    if (
      account.provider === 'bitbucket' &&
      isCloudBitbucketHost(account.baseUrl) &&
      ref.queries.includes('review-requested')
    ) {
      throw new Error(
        `${command}: Cloud bitbucket account '${ref.sourceId}' does not support review-requested`,
      );
    }
    return { sourceId: ref.sourceId, queries: ref.queries };
  });
}

/**
 * The icon for a lens (connector-accounts): the FIRST referenced account's
 * provider `mintedIcon` when every referenced account shares that provider, else
 * the compound `'layers'`. A dangling reference (no account) is ignored for the
 * single-provider check. Falls back to `'layers'` when nothing resolves.
 */
function iconForRefs(sources: AppState['sources'], refs: LensSourceRef[]): string {
  const providers = refs.flatMap((ref) => {
    const account = sources[ref.sourceId];
    return account ? [account.provider] : [];
  });
  const first = providers[0];
  if (first !== undefined && providers.every((p) => p === first)) {
    return CONNECTORS[first].mintedIcon;
  }
  return 'layers';
}

/** The smart node addressed by `{ spaceId, folderId }`, with the same error
 * contract as the sibling folder commands: unknown spaceId or folderId throws
 * (the ack carries the error). */
function requireLensNode(
  ctx: { store: LensDeps['store'] },
  command: string,
  spaceId: SpaceId,
  folderId: FolderId,
): LensNode {
  if (!spaceExists(ctx.store.state, spaceId)) {
    throw new Error(`${command}: unknown spaceId '${spaceId}'`);
  }
  const node = (ctx.store.state.pinnedBySpace[spaceId] ?? []).find(
    (n): n is LensNode => n.kind === 'lens' && n.id === folderId,
  );
  if (!node) {
    throw new Error(`${command}: unknown lens '${folderId}' in Space '${spaceId}'`);
  }
  return node;
}

export function lensHandlers(
  deps: Pick<LensDeps, 'enqueue'>,
): Pick<
  HandlersMap,
  | 'createLens'
  | 'updateLens'
  | 'deleteLens'
  | 'refreshLens'
  | 'openLensItem'
  | 'markLensItemRead'
  | 'markLensItemUnread'
  | 'markAllLensItemsRead'
  | 'setLensHideRead'
  | 'setLensFilter'
  | 'setLensArticleLayout'
  | 'openLensListing'
  | 'openLensPage'
  | 'importOpml'
  | 'lenses.result'
> {
  return {
    createLens: (ctx, event) => {
      const { spaceId, id, sources, name, maxItems, refreshMinutes } = event.payload;
      if (!spaceExists(ctx.store.state, spaceId)) {
        throw new Error(`createLens: unknown spaceId '${spaceId}'`);
      }
      // SW-minted identity (D12): handler mints the node. Validate each
      // reference (every `sourceId` resolves + the per-source queries rule;
      // throws on invalid → error ack, no node). Icon comes from the first
      // referenced account's provider when all references share a provider;
      // 'layers' for a mixed multi-account lens. hideRead starts TRUE — a feed's
      // resting state is the drained unread queue.
      const refs = validateSourceRefs(ctx.store.state.sources, sources, 'createLens');
      const icon = iconForRefs(ctx.store.state.sources, refs);
      const node: LensNode = {
        kind: 'lens',
        // sources-redesign: honor a client-minted id (mirrors createAccount) so
        // the editor can open the new lens's page without awaiting; else mint.
        id: id ?? crypto.randomUUID(),
        name,
        icon,
        // sources-redesign (D4): the kind is DERIVED from the source set, never
        // sent by the editor — any github/gitlab source ⇒ 'review', else 'general'.
        lensKind: deriveLensKind(refs, (id) => ctx.store.state.sources[id]),
        sources: refs,
        maxItems,
        hideRead: true,
        refreshMinutes: clampRefreshMinutes(refreshMinutes),
      };
      ctx.store.addLens(spaceId, node);
      ctx.markDirty();
      ctx.runSideEffect(() => syncLensesAlarm(ctx.store));
      // Immediate first fetch — off the drain's critical path; the outcome
      // rides the runtime slice, never this command's ack.
      const { completion } = startLensRefresh({ store: ctx.store, enqueue: deps.enqueue }, node);
      ctx.runSideEffect(() => completion);
    },
    updateLens: (ctx, event) => {
      const { spaceId, folderId, sources, name, maxItems, refreshMinutes } = event.payload;
      const node = requireLensNode(ctx, 'updateLens', spaceId, folderId);
      const refs = validateSourceRefs(ctx.store.state.sources, sources, 'updateLens');
      // Capture the resolved-section keys BEFORE the store mutates `node.sources`,
      // so the diff finds added/removed sections (multi-filter-smart-connectors
      // design D2/D6). A maxItems change invalidates EVERY section's cap → refetch
      // all; a sources-only change refetches only the ADDED resolved sections and
      // the store prunes the REMOVED ones.
      const oldKeys = new Set(resolvedConfigs(node, ctx.store.state.sources).map(sourceKey));
      const maxItemsChanged = node.maxItems !== maxItems;
      const sourcesChanged = JSON.stringify(node.sources) !== JSON.stringify(refs);
      const newIcon = iconForRefs(ctx.store.state.sources, refs);
      ctx.store.updateLens(spaceId, folderId, {
        sources: refs,
        name,
        icon: newIcon,
        // sources-redesign (D4): re-derive the kind from the (possibly edited)
        // sources — the editor never sends a kind.
        lensKind: deriveLensKind(refs, (id) => ctx.store.state.sources[id]),
        maxItems,
        refreshMinutes: clampRefreshMinutes(refreshMinutes),
      });
      ctx.markDirty();
      ctx.runSideEffect(() => syncLensesAlarm(ctx.store));
      const updated = requireLensNode(ctx, 'updateLens', spaceId, folderId);
      const refreshDeps = { store: ctx.store, enqueue: deps.enqueue };
      if (maxItemsChanged) {
        // Cap changed for every section — refetch the whole folder so each
        // section re-slices to the new maximum.
        const { completion } = startLensRefresh(refreshDeps, { ...updated });
        ctx.runSideEffect(() => completion);
      } else if (sourcesChanged) {
        // Refetch only the newly-added resolved sections (the store has already
        // dropped the removed ones; unchanged sections keep their results).
        const added = resolvedConfigs(updated, ctx.store.state.sources).filter(
          (cfg) => !oldKeys.has(sourceKey(cfg)),
        );
        if (added.length > 0) {
          const { completion } = startLensRefresh(refreshDeps, { ...updated }, undefined, added);
          ctx.runSideEffect(() => completion);
        }
      }
    },
    deleteLens: (ctx, event) => {
      const { spaceId, folderId } = event.payload;
      requireLensNode(ctx, 'deleteLens', spaceId, folderId);
      // Capture + drop the folder's item bindings FIRST (smart-folder-item-
      // bindings, design D4): each orphaned still-open bound tab demotes into
      // its window's active instance (`tempTabIds`) — honestly listed, never
      // invisible. The drop must precede the demotion so `restoreTempTab`'s
      // isBound guard no longer sees the binding. No tab closes.
      const orphaned = ctx.store.dropLensBindings(folderId);
      for (const tabId of orphaned) {
        const windowId = ctx.store.state.liveTabsById[tabId]?.windowId;
        if (windowId !== undefined) ctx.store.restoreTempTab(windowId, tabId);
      }
      // Removes the node AND drops its runtime entry — both are store state
      // (D12). No tabs close; the config is recreatable in seconds.
      ctx.store.deleteLens(spaceId, folderId);
      ctx.markDirty();
      ctx.runSideEffect(() => syncLensesAlarm(ctx.store));
    },
    // Smart-item activation (smart-folder-item-bindings, design D2): identity
    // in, URL from the SW's own runtime — open-if-dormant, focus-if-bound.
    openLensItem: async (ctx, event) => {
      const { spaceId, folderId, itemId, windowId, fromPage } = event.payload;
      // Unknown spaceId/folderId throws (error ack) — the unknown-id convention.
      const node = requireLensNode(ctx, 'openLensItem', spaceId, folderId);
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
      const boundSlot = ctx.store.state.lensItemBindings[folderId]?.[itemId]?.[windowId];
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
      // per-account, per-filter section key (`${sourceId}:${query}` for queue,
      // `${sourceId}` for rss) — find the section whose key prefixes itemId and
      // holds the trailing native id.
      // (Valid section keys never prefix each other, so the match is unambiguous;
      // item.url is RSS-feed-controlled and scheme-validated below before create.)
      const findItem = (): LensItem | undefined => {
        const sections = ctx.store.state.lenses[folderId]?.sections ?? {};
        for (const sk of Object.keys(sections)) {
          if (!itemId.startsWith(`${sk}:`)) continue;
          const candidate = sections[sk]?.items.find((i) => i.id === itemId.slice(sk.length + 1));
          if (candidate) return candidate;
        }
        return undefined;
      };
      let item = findItem();
      // The runtime is EPHEMERAL (stripped from persistence): after the SW idles
      // out and respawns it is empty until the boot refresh lands, so a click
      // through the overview would throw here. On a miss, resolve the item's
      // owning section from the (persisted) node config and — unless it's already
      // settled `ok` (then the item is genuinely gone) — fetch THAT section
      // on-demand and read the item straight off the result. We can't read it
      // back from the store: the `lenses.result` we enqueue (so the UI catches
      // up) is applied by a LATER drain iteration, after this handler returns.
      if (!item) {
        const cfg = resolvedConfigs(node, ctx.store.state.sources).find((c) =>
          itemId.startsWith(`${sourceKey(c)}:`),
        );
        const ownerSk = cfg && sourceKey(cfg);
        if (cfg && ownerSk && ctx.store.state.lenses[folderId]?.sections[ownerSk]?.state !== 'ok') {
          const runtime = await fetchLensSectionRuntime(cfg, node.maxItems);
          deps.enqueue({
            source: 'connector',
            kind: 'lenses.result',
            payload: { folderId, sourceKey: ownerSk, runtime },
          });
          item = runtime.items.find((i) => i.id === itemId.slice(ownerSk.length + 1));
        }
      }
      if (!item) {
        throw new Error(
          `openLensItem: item '${itemId}' is neither bound nor listed in folder '${folderId}'`,
        );
      }
      // Scheme guard: mirrors openUrl / openSmartFolderListing.
      let itemScheme: string;
      try {
        itemScheme = new URL(item.url).protocol;
      } catch {
        log.warn('openLensItem: unparseable item URL, dropping', { itemId, folderId });
        return;
      }
      if (itemScheme !== 'http:' && itemScheme !== 'https:') {
        log.warn('openLensItem: blocked non-http(s) item URL', {
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
        throw new Error('openLensItem: opened tab has no id');
      }
      const tabId = tab.id;
      // Opened from the page → record so closing returns to the page instead of
      // auto-advancing (smart-folder-page).
      if (fromPage) markPageOpenedTab(tabId);
      // Bind in the SAME drain (the openSavedTab ordering): the binding lands
      // before Chrome's onCreated round-trips, so the temp classifier's
      // isBound check passes the tab over — it NEVER appears in Temporary.
      ctx.store.bindLensItem(folderId, itemId, windowId, tabId, allowGlob);
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
      ctx.runSideEffect(async () => ctx.boundary.configureLensItemBoundary(tabId, allowGlob));
    },
    refreshLens: (ctx, event) => {
      const { spaceId, folderId } = event.payload;
      const node = requireLensNode(ctx, 'refreshLens', spaceId, folderId);
      // Unconditional refresh. The handler returns synchronously once the
      // fetch is underway, so the ack is 'ok' BEFORE the fetch resolves; the
      // outcome lands via the runtime slice on a later drain (D12).
      const { completion } = startLensRefresh(
        { store: ctx.store, enqueue: deps.enqueue },
        { ...node },
      );
      ctx.runSideEffect(() => completion);
    },
    // Feed read-state (rss-connector design D3). `markSmartItemRead` carries no
    // spaceId (the read-state slice is folder-keyed); the rest validate via
    // requireLensNode. None refetch — read-state is independent of the fetch
    // window (only baseUrl/query/source/maxItems invalidate results).
    markLensItemRead: (ctx, event) => {
      const { folderId, itemId } = event.payload;
      ctx.store.markLensItemRead(folderId, itemId);
      ctx.markDirty();
    },
    // The page's explicit un-mark (smart-folder-page reading controls). Folder-keyed
    // like markSmartItemRead; no refetch.
    markLensItemUnread: (ctx, event) => {
      const { folderId, itemId } = event.payload;
      ctx.store.markLensItemUnread(folderId, itemId);
      ctx.markDirty();
    },
    markAllLensItemsRead: (ctx, event) => {
      const { spaceId, folderId } = event.payload;
      const node = requireLensNode(ctx, 'markAllLensItemsRead', spaceId, folderId);
      // Collect namespaced ids from all RSS sections only (task 4.5: hideRead /
      // mark-all-read applies to feed sources exclusively).
      const sections = ctx.store.state.lenses[folderId]?.sections ?? {};
      const namespacedIds: string[] = [];
      // Only rss sections have read-state (mark-all-read is feed-only). Derive
      // each section key via the canonical `sourceKey` over the resolved configs.
      for (const cfg of resolvedConfigs(node, ctx.store.state.sources)) {
        if (cfg.source !== 'rss') continue;
        const sk = sourceKey(cfg);
        for (const item of sections[sk]?.items ?? []) {
          namespacedIds.push(`${sk}:${item.id}`);
        }
      }
      ctx.store.markAllLensItemsRead(folderId, namespacedIds);
      ctx.markDirty();
    },
    setLensHideRead: (ctx, event) => {
      const { spaceId, folderId, hideRead } = event.payload;
      requireLensNode(ctx, 'setLensHideRead', spaceId, folderId);
      ctx.store.setLensHideRead(folderId, hideRead);
      ctx.markDirty();
    },
    setLensFilter: (ctx, event) => {
      const { spaceId, folderId, filter } = event.payload;
      // No-op (calm error) when the folderId does not resolve to a lens.
      const node = (ctx.store.state.pinnedBySpace[spaceId] ?? []).find(
        (n) => n.kind === 'lens' && n.id === folderId,
      );
      if (!node) {
        log.warn('setLensFilter: folderId does not resolve to a lens', { folderId, spaceId });
        return;
      }
      ctx.store.setLensFilter(folderId, filter);
      ctx.markDirty();
    },
    setLensArticleLayout: (ctx, event) => {
      const { spaceId, folderId, layout } = event.payload;
      // No-op (calm warning) when the folderId does not resolve to a lens. No
      // refetch — a layout change touches no source.
      const node = (ctx.store.state.pinnedBySpace[spaceId] ?? []).find(
        (n) => n.kind === 'lens' && n.id === folderId,
      );
      if (!node) {
        log.warn('setLensArticleLayout: folderId does not resolve to a lens', {
          folderId,
          spaceId,
        });
        return;
      }
      ctx.store.setLensArticleLayout(folderId, layout);
      ctx.markDirty();
    },
    // Open the source's full listing in a new tab (rss-connector design D6) — the
    // connector's `listingUrl`, scheme-hardened like `openUrl` (a feed's channel
    // link is arbitrary-origin). No state mutation; the tab adopts into the
    // window's active Space via the normal `tabs.onCreated` path.
    openLensListing: async (ctx, event) => {
      const { spaceId, folderId, windowId } = event.payload;
      const node = requireLensNode(ctx, 'openLensListing', spaceId, folderId);
      // Multi-source: open the first source's listing URL. Resolve it to a
      // single-query config carrying the lens kind (review-lens, D4a) — listing
      // URLs are query-independent for the queue sources, so the first source's
      // resolved config suffices.
      const firstCfg = resolvedConfigs(node, ctx.store.state.sources)[0];
      if (!firstCfg) return;
      const url = CONNECTORS[firstCfg.source].listingUrl(firstCfg);
      let scheme: string;
      try {
        scheme = new URL(url).protocol;
      } catch {
        log.warn('openLensListing: unparseable listing URL, dropping', { url });
        return;
      }
      if (scheme !== 'http:' && scheme !== 'https:') {
        log.warn('openLensListing: blocked non-http(s) scheme', { url, scheme });
        return;
      }
      await chrome.tabs.create({ url, windowId });
    },
    // Open-or-focus the smart folder's full-page view (smart-folder-page, design
    // D2). The page is an extension page (chrome-extension:// URL) carrying the
    // target folderId as a query param. Reuse is by tab-query dedupe — NOT a
    // persisted binding: the open tab is its own registry, so reuse self-heals
    // across SW restarts. NOT openUrl: that handler drops the non-http(s) URL.
    openLensPage: async (ctx, event) => {
      const { spaceId, folderId, windowId } = event.payload;
      requireLensNode(ctx, 'openLensPage', spaceId, folderId);
      // Track this overview as the window's open lens overview (lens-overview-peek):
      // the sidebar renders the lens row active while it is open. Opening a different
      // lens's overview replaces (closes) the previous one (one overview per window).
      const prevPeek = ctx.store.state.lensPeekByWindow[windowId] ?? null;
      const trackPeek = (peekTabId: number): void => {
        ctx.store.setLensPeek(windowId, { folderId, tabId: peekTabId });
        if (prevPeek !== null && prevPeek.tabId !== peekTabId) {
          ctx.runSideEffect(() => closeTab(prevPeek.tabId));
        }
        ctx.markDirty();
      };
      const pageBase = chrome.runtime.getURL('src/launcher/lenspage/index.html');
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
          const tab = await chrome.tabs.update(existing.id, {
            active: true,
            autoDiscardable: false,
          });
          if (tab?.windowId !== undefined) {
            await chrome.windows.update(tab.windowId, { focused: true });
          }
          trackPeek(existing.id);
          return;
        } catch (err) {
          log.debug('openLensPage: existing tab gone, reopening', { folderId, err });
        }
      }
      const tab = await chrome.tabs.create({ url, windowId });
      if (tab.id === undefined) {
        throw new Error('openLensPage: opened tab has no id');
      }
      // Keep Chrome's Memory Saver from auto-discarding the overview tab: discarding
      // reloads it on return (flicker, and the first click only wakes the tab instead
      // of opening an item). It's a managed view, not a browsing tab, so pin it loaded
      // for the tab's lifetime. (`autoDiscardable` is a persistent tab property.)
      await chrome.tabs.update(tab.id, { autoDiscardable: false });
      // The page tab belongs to its Space's Chrome group, like an opened pinned
      // tab (floated off the critical path — a forbidden/odd page is benign).
      await ctx.groups.addTabToSpaceGroup(windowId, spaceId, tab.id);
      trackPeek(tab.id);
    },
    // OPML bulk-import (opml-import-export under connector-accounts):
    // find-or-mint an rss `SourceAccount` per valid feed (dedupe by normalized
    // baseUrl — reuse an existing rss account on the same URL, else mint a new
    // SW-generated-id account into `AppState.sources`), then create ONE lens with
    // N `LensSourceRef[]`. Invalid URLs (normalizeBaseUrl throws) are skipped and
    // counted. When `imported === 0` no account and no lens are created.
    importOpml: (ctx, event) => {
      const { spaceId, feeds } = event.payload;
      if (!spaceExists(ctx.store.state, spaceId)) {
        throw new Error(`importOpml: unknown spaceId '${spaceId}'`);
      }
      // Existing rss accounts indexed by normalized baseUrl (find-or-mint reuse).
      const rssByBaseUrl = new Map<string, string>();
      for (const account of Object.values(ctx.store.state.sources)) {
        if (account.provider === 'rss') rssByBaseUrl.set(account.baseUrl, account.id);
      }
      // Accounts minted by THIS import, so a repeated feed URL within the same
      // file references the one minted account rather than minting twice.
      const mintedThisImport: SourceAccount[] = [];
      const validEntries: { name: string; ref: LensSourceRef }[] = [];
      let skipped = 0;
      for (const { name, feedUrl } of feeds) {
        let baseUrl: string;
        try {
          baseUrl = normalizeBaseUrl(feedUrl);
        } catch (err) {
          log.warn('importOpml: skipping invalid feed entry', { name, feedUrl, err });
          skipped++;
          continue;
        }
        let sourceId = rssByBaseUrl.get(baseUrl);
        if (sourceId === undefined) {
          sourceId = crypto.randomUUID();
          rssByBaseUrl.set(baseUrl, sourceId);
          // Name the account from the feed's OPML title (the per-source name
          // moved onto the account); display-only.
          mintedThisImport.push({ id: sourceId, provider: 'rss', baseUrl, name });
        }
        validEntries.push({ name, ref: { sourceId, queries: [] } });
      }
      const imported = validEntries.length;
      if (imported === 0) {
        log.debug('importOpml: no valid feeds', { skipped });
        return;
      }
      // Mint the new accounts before the lens references them.
      for (const account of mintedThisImport) ctx.store.addSource(account);
      const folderName = imported === 1 ? (validEntries[0]?.name ?? 'Feeds') : 'Feeds';
      const node: LensNode = {
        kind: 'lens',
        id: crypto.randomUUID(),
        name: folderName,
        icon: CONNECTORS.rss.mintedIcon,
        lensKind: 'general',
        sources: validEntries.map((e) => e.ref),
        maxItems: 10,
        hideRead: true,
        refreshMinutes: 30,
      };
      ctx.store.addLens(spaceId, node);
      ctx.markDirty();
      ctx.runSideEffect(() => syncLensesAlarm(ctx.store));
      const { completion } = startLensRefresh({ store: ctx.store, enqueue: deps.enqueue }, node);
      ctx.runSideEffect(() => completion);
      log.debug('importOpml: done', { imported, skipped });
    },
    'lenses.result': (ctx, event) => {
      const { folderId, sourceKey: sk, runtime } = event.payload;
      // A result landing after its folder was deleted is dropped — writing it
      // would resurrect an orphan runtime entry the delete already cleaned up.
      const stillExists = Object.values(ctx.store.state.pinnedBySpace).some((nodes) =>
        nodes.some((n) => n.kind === 'lens' && n.id === folderId),
      );
      if (!stillExists) return;
      ctx.store.setLensSectionRuntime(folderId, sk, runtime);
      // Prune feed read-state to the live window on a successful section fetch
      // (rss-connector design D3): only `ok` carries the authoritative item set
      // — `pending`/`error` hold last-known items, so pruning against their
      // empty `items` would wrongly wipe the read set.
      if (runtime.state === 'ok') {
        // Prune only THIS section's read ids (namespaced to match the keys used
        // by markSmartItemRead) — other sections prune on their own results.
        ctx.store.pruneLensReadState(
          folderId,
          sk,
          runtime.items.map((i) => `${sk}:${i.id}`),
        );
      }
      ctx.markDirty();
    },
  };
}
