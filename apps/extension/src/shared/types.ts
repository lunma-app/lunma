export type WindowId = number;
export type TabId = number;
export type SpaceId = string;
export type SavedTabId = string;
export type FolderId = string;

/**
 * Space colour palette. The values are bus-contract identifiers; the visual
 * mapping (CSS variables) is the frontend's concern. Frontend was wiped — the
 * union is preserved here so the bus and store contracts keep their narrow
 * typing.
 */
export type SpaceColor =
  | 'red'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'cyan'
  | 'blue'
  | 'purple'
  | 'pink'
  | 'gray';

/**
 * Space icon name — the lucide name union. Imported from the frontend's icon
 * catalogue so the bus contract stays narrow. Keeping the import shape this
 * way (re-export from shared) means consumers don't reach into `src/ui/`
 * directly for the type.
 */
export type { IconName } from './icon-names';

/**
 * Per-Space auto-archive override (auto-archive). Mirrors the per-tab
 * `TabBoundary` override shape. An ABSENT `autoArchive` on a `Space` means
 * *inherit the global `autoArchiveEnabled` / `autoArchiveIdleMinutes` settings*;
 * `{ mode: 'off' }` means *never auto-archive this Space's temporary tabs*;
 * `{ mode: 'custom'; idleMinutes }` carries a positive-integer idle threshold for
 * this Space alone. Resolution (master switch + inherit/off/custom) is owned by
 * the auto-archive capability; the persisted shape is owned by
 * storage-and-migrations (schema V11).
 */
export type SpaceAutoArchive = { mode: 'off' } | { mode: 'custom'; idleMinutes: number };

export interface Space {
  id: SpaceId;
  name: string;
  color: SpaceColor;
  icon: string;
  /**
   * Optional per-Space auto-archive override (auto-archive). ABSENT = *inherit*
   * the global setting; `{ mode: 'off' }` = never archive this Space;
   * `{ mode: 'custom'; idleMinutes }` = archive this Space at its own threshold.
   * Typed `| undefined` to match the persisted schema's `.optional()` inference
   * under `exactOptionalPropertyTypes` (see the equality guard in `schemas.ts`).
   */
  autoArchive?: SpaceAutoArchive | undefined;
}

export interface SpaceInstance {
  spaceId: SpaceId;
  /**
   * The id of this (Space, window)'s live Chrome tab group, or the reserved
   * sentinel `-1` meaning "no live Chrome group yet" — the Space has no tab in
   * this window, or its group has not been (re)created (e.g. dissolved by a
   * browser restart, awaiting reconciliation on next activation).
   */
  groupId: number;
  tempTabIds: TabId[];
  /**
   * Per-(window, Space) custom display names for temporary tabs, keyed by
   * `TabId`. A user-chosen name overrides the live tab title in this window
   * only. Ephemeral by design: an entry is pruned when its tab leaves
   * `tempTabIds`, and the whole instance is discarded when the window closes —
   * so temp-tab names never survive a restart (mirrors `tempTabIds`).
   *
   * Optional like `liveTabsById`: persisted envelopes written before this
   * field existed parse without it, and test fixtures may omit it. Code that
   * mutates it initialises it on first write; `ensureInstance` seeds `{}`.
   */
  tempTabTitles: Record<TabId, string>;
}

/**
 * A saved tab (a pinned tab or a favicon-row entry) — a Lunma-owned record
 * persisted in `chrome.storage.local`, NOT a Chrome bookmark. `title` is owned
 * by Lunma; `originalURL` is the record's "home"; `currentURL` is where the
 * bound tab is now, or `null` when dormant.
 */
export interface SavedTab {
  id: SavedTabId;
  /**
   * Coupling axis (favicon-row-model). A non-null `SpaceId` couples
   * the record to that Space — it is a **pinned** tab, referenced by
   * `pinnedBySpace[spaceId]`, and its bound live tab joins that Space's Chrome
   * group. A `null` `spaceId` is the **decoupled / global** state: the record is
   * a **favicon-row favorite**, referenced only by the flat `faviconRow`
   * placement, and its bound live tab is left **ungrouped** (global) so it stays
   * visible across every Space switch. A record is never referenced by both
   * placements (the no-duplicate-placement rule).
   */
  spaceId: SpaceId | null;
  title: string;
  originalURL: string;
  currentURL: string | null;
  /**
   * Optional user-chosen display name. When set it takes precedence over
   * `title` for rendering (`customTitle ?? title ?? currentURL`); clearing it
   * falls back to the stored `title`. Owned entirely by the rename flow — the
   * live-tab title mirror never writes here, so a custom name survives
   * navigation and restart.
   *
   * Typed `| undefined` to match the persisted Zod schema's `.optional()`
   * inference exactly under `exactOptionalPropertyTypes` (the schema↔AppState
   * equality guard in `schemas.ts` compares these structurally).
   */
  customTitle?: string | undefined;
  /**
   * Optional domain boundary (pinned-tab-domain-boundary). ABSENT = *inherit*
   * the global `pinnedTabBoundaryDefault` setting; `{ mode: 'off' }` =
   * explicitly free; `{ mode: 'locked', allow }` = confine the bound tab's
   * user-clicked navigations to the host-glob allow-set. Typed `| undefined` to
   * match the persisted schema's `.optional()` inference under
   * `exactOptionalPropertyTypes` (see the equality guard in `schemas.ts`).
   */
  boundary?: TabBoundary | undefined;
}

/**
 * The canned lens query set (lenses). Deliberately NOT a free-form query
 * language — three queries each connector translates to documented REST params.
 */
export type LensQuery = 'authored' | 'assigned' | 'review-requested';

/**
 * The shipped lens connector sources (github-connector, then jira-connector,
 * then rss-connector). A closed union — the `CONNECTORS` registry in
 * `background/lenses.ts` holds exactly these four; widening it is a
 * schema-version bump (the v2→v3, v4→v5, then v5→v6 precedent). `rss` is the
 * first FEED source (a public address, no identity, no canned query), which is
 * why a feed entry carries an empty `queries` array.
 */
export type LensProvider = 'gitlab' | 'github' | 'jira' | 'rss';

/**
 * One connector **instance** within a lens (multi-filter-smart-connectors).
 * Each entry is one connector instance (source + host); its `queries` array is
 * the set of canned filters that instance contributes. A **queue** source
 * (`gitlab`/`github`/`jira`) carries a NON-EMPTY `queries` (one section per
 * filter); a **feed** source (`rss`) carries `queries: []` (rss has no filter
 * axis — its feed URL is the selector). The folder-level fields (`maxItems`,
 * `hideRead`, `refreshMinutes`) apply across all entries. The engine expands
 * each entry over its `queries[]` into per-section {@link ResolvedLensSource}s
 * before dispatch.
 */
export type LensSource = {
  source: LensProvider;
  /** Absolute http(s) instance URL, stored without a trailing slash. For a
   * feed source (`rss`) this IS the feed URL. */
  baseUrl: string;
  /** The set of canned filters this instance contributes — one section per
   * filter. Non-empty for queue sources; empty (`[]`) for feed sources. */
  queries: LensQuery[];
  /** Optional display name (smart-source-rename) — labels this source's
   * section(s) in place of the host. Display-only; absent for an unnamed source.
   * Typed `| undefined` to match the persisted schema's `.optional()` under
   * `exactOptionalPropertyTypes`. */
  name?: string | undefined;
};

/**
 * The per-**section** connector unit (multi-filter-smart-connectors), produced
 * by expanding a {@link LensSource} over its `queries[]` (one resolved config
 * per filter; a single resolved config for a feed entry). This is the unit a
 * connector fetches, the unit `sourceKey` is derived from, and the unit the
 * `lensItemBindings` namespace keys on. Shape-identical to the pre-v9
 * `LensSource`: a single optional `query`, present for queue sources, absent
 * for rss. Typed `| undefined` to match `exactOptionalPropertyTypes`.
 */
export type ResolvedLensSource = {
  source: LensProvider;
  baseUrl: string;
  /** The single canned query for this section. Present for queue sections,
   * absent for rss. */
  query?: LensQuery | undefined;
  /** The owning source's optional display name (smart-source-rename) — when set,
   * labels this section in place of the host. */
  name?: string | undefined;
};

/**
 * The kind of lens (lenses). A closed union widened by later typed-kind
 * changes. `'general'` is today's untyped multi-provider bag — the only kind
 * that may mix providers. Later typed kinds (e.g. `'review'`) are narrower and
 * single-provider.
 */
export type LensKind = 'general';

/**
 * A pinned-tab placement node. The pinned list for a Space is an ordered tree
 * of these: a `tab` node points at a `SavedTab` record; a `folder` node groups
 * tab ids; a `lens` node is connector configuration (lenses) whose displayed
 * children are ephemeral query results in `AppState.lenses`, never persisted on
 * the node. Folders are single-level — `children` holds `SavedTabId` values
 * only, never nested folders; a lens node has no `children` field at all.
 * `icon`/`color` are plain strings on the record (as on `Space`); the narrow
 * `IconName`/`SpaceColor` unions are applied only at the bus boundary.
 */
export type PinNode =
  | { kind: 'tab'; id: SavedTabId }
  | {
      kind: 'folder';
      id: FolderId;
      name: string;
      icon: string;
      color: string;
      children: SavedTabId[];
    }
  | {
      kind: 'lens';
      id: FolderId;
      name: string;
      icon: string;
      lensKind: LensKind;
      /** The ordered list of connector sub-sources. At least one entry is
       * required; the editor blocks confirming with an empty list. */
      sources: LensSource[];
      /** Per-section result cap (multi-source-smart-folders design D3): each
       * section shows up to `maxItems` rows. Migrated nodes default to 20. */
      maxItems: number;
      /** Per-folder "hide read" reading preference (rss-connector design D9;
       * applies to `rss` sections only). Persisted so it survives restart. */
      hideRead: boolean;
      /** Poll cadence in minutes; default 10, floor 5 (SW-clamped). */
      refreshMinutes: number;
    };

/**
 * One lens result row (lenses, design D2) — link-shaped, not tab-shaped: no
 * `SavedTab` record, no binding. `status` is the MR's pipeline state as a
 * semantic tone the renderer maps to tokens; absent means the MR has no
 * pipeline (or an unmapped status) and the row shows no glyph.
 */
export interface LensItem {
  id: string;
  title: string;
  url: string;
  status?: { tone: 'ok' | 'pending' | 'warn' | 'fail'; label: string } | undefined;
  // Optional richer-content fields (smart-folder-page). Populated by connectors
  // that have them — today the RSS connector (description, thumbnail, pubdate);
  // queue connectors leave them absent. They ride the ephemeral runtime slice
  // (never persisted → no schema migration), and the sidebar projection ignores
  // them: only the full-page projection (`launcher/lenspage`) renders them.
  /** Plain-text summary (HTML stripped, clamped) — the feed entry description. */
  excerpt?: string | undefined;
  /** Thumbnail/hero image URL (feed media/enclosure or first inline image). */
  imageUrl?: string | undefined;
  /** Publication time as epoch ms (RSS pubDate / Atom published|updated). */
  publishedAt?: number | undefined;
}

/**
 * One connector section's ephemeral fetch state (multi-source-smart-folders).
 * A refresh that begins while items exist keeps `items` (the list never blinks)
 * and flips `state` to `'pending'`. `'needs-access'` means the section's
 * connector-required host origins are not granted; produced WITHOUT any network
 * request and preceding the connector's own `'signed-out'` short-circuit.
 */
export interface LensSectionRuntime {
  state: 'pending' | 'ok' | 'signed-out' | 'error' | 'needs-access';
  items: LensItem[];
  fetchedAt: number | null;
}

/**
 * A lens's ephemeral runtime (multi-source-smart-folders): a map of per-section
 * runtimes keyed by `sourceKey` (`${source}:${host}:${query}` for queue
 * sections, `${source}:${host}` for rss). Lives only in the broadcast
 * `AppState.lenses` slice — stripped in `persist()` like `liveTabsById`,
 * rebuilt by connector polls after a SW restart.
 */
export interface LensRuntime {
  sections: { [sourceKey: string]: LensSectionRuntime };
}

/**
 * Per-pinned-tab domain boundary (pinned-tab-domain-boundary). `{ mode: 'off' }`
 * is *explicitly free* (overrides a global `'domain'` default); `{ mode:
 * 'locked', allow }` confines the bound tab's user-clicked, in-tab navigations
 * to the host-glob `allow` set. An ABSENT `boundary` on a `SavedTab` means
 * *inherit the global `pinnedTabBoundaryDefault` setting*.
 */
export type TabBoundary = { mode: 'off' } | { mode: 'locked'; allow: string[] };

/**
 * A saved tab's per-window live bindings (per-window-tab-bindings, ADR 0003): one
 * live Chrome tab id per window in which the saved tab is currently bound. A
 * window's **absence** from this record means the saved tab is dormant in that
 * window; an **empty** record means dormant everywhere. Repurposed from the old
 * flat `TabId | null` when bindings became per-window (V9 schema).
 */
export type TabBinding = { [windowId: WindowId]: TabId };

export interface TrashedSpace extends Space {
  deletedAt: string;
}

export interface MutationOptions {
  origin: 'self' | 'chrome';
}

export interface ArchivedTab {
  tabId: number;
  url: string;
  title: string;
  spaceId: SpaceId;
  archivedAt: number;
}

/**
 * Ephemeral live-tab metadata mirrored from Chrome tab events for rendering
 * (favicon/title/active/loading). Maintained entirely by the service worker,
 * broadcast as part of `AppState`, and STRIPPED before persist — never written
 * to `chrome.storage.local`, rebuilt from `chrome.tabs.query` at SW boot.
 */
export interface LiveTab {
  tabId: TabId;
  windowId: WindowId;
  title: string;
  url: string;
  active: boolean;
  status: 'loading' | 'complete';
  /**
   * The tab's Chrome-resolved favicon URL (`chrome.tabs.Tab.favIconUrl`), when
   * known. Surfaces prefer this over the `_favicon` page-URL endpoint so the
   * real favicon shows (and refreshes) once Chrome reports it — the endpoint
   * returns a generic default until Chrome has cached one. Absent until a
   * `tabs.onUpdated` reports it.
   */
  favIconUrl?: string | undefined;
}

export interface AppState {
  schemaVersion: number;
  spaces: Space[];
  activeSpaceByWindow: { [windowId: WindowId]: SpaceId | null };
  /**
   * Per-(window, Space) instance map. A window's entry holds an instance for
   * **every** Space instantiated in that window — not only the active one — so
   * a Space's `groupId` and `tempTabIds` survive switching away and back. The
   * active instance for a window is
   * `spaceInstancesByWindow[windowId]?.[activeSpaceByWindow[windowId]]`.
   */
  spaceInstancesByWindow: {
    [windowId: WindowId]: { [spaceId: SpaceId]: SpaceInstance } | undefined;
  };
  /**
   * Per-(saved tab, window) live bindings (per-window-tab-bindings, ADR 0003).
   * The inner record holds one live Chrome tab id for each window in which the
   * saved tab is currently bound; a window's absence means dormant in that
   * window, an empty inner record means dormant everywhere.
   */
  tabBindings: { [savedTabId: SavedTabId]: TabBinding };
  savedTabs: { [savedTabId: SavedTabId]: SavedTab };
  lastActivatedSpaceId: SpaceId | null;
  tabLastActivity: { [tabId: TabId]: number };
  archivedTabs: ArchivedTab[];
  trash: { [spaceId: SpaceId]: TrashedSpace };
  pinnedBySpace: { [spaceId: SpaceId]: PinNode[] };
  /**
   * Flat, global placement for **favicon-row favorites** (favicon-row-model):
   * the ordered list of `SavedTabId`s whose record carries
   * `spaceId === null`. A sibling to `pinnedBySpace`, but **not keyed by Space**
   * and **not** a `PinNode[]` tree — favorites do not nest into folders in v1.
   * A record is referenced here XOR in some `pinnedBySpace[spaceId]`, never both.
   */
  faviconRow: SavedTabId[];
  /**
   * Per-(lens item, window) live bindings (lenses): a result row activated like
   * a pinned tab — open-if-dormant, focus-if-bound. Keyed by folder id, then by
   * the connector item id (stable across polls); each innermost slot stores the
   * bound tab id AND the `pageGlob(itemUrl)` computed at open time
   * (smart-tab-boundary), so the boundary content script can be re-armed on
   * reload and at boot without the ephemeral runtime slice. PERSISTED; across a
   * browser restart tab ids don't survive, so boot pruning drops the entries and
   * the restored tabs classify as temporary naturally.
   */
  lensItemBindings: {
    [folderId: FolderId]: {
      [itemId: string]: { [windowId: WindowId]: { tabId: TabId; allowGlob: string } };
    };
  };
  /**
   * Per-feed-folder read-state (rss-connector, design D3): the read item ids
   * per lens. PERSISTED — kept by `toPersistable` (like `lensItemBindings`),
   * NOT stripped like the ephemeral `lenses` runtime — so read marks survive SW
   * sleeps and Chrome restarts. **Ids only** (never the item's title/URL — the
   * reading-sensitive payload stays off disk). Ids are namespaced
   * `${sectionKey}:${nativeId}`, so a folder's read set spans all its sections.
   * **Pruned per resolved section** after that section's successful fetch
   * (`pruneLensReadState`) — a section drops only its own absent ids, never
   * another section's — so the set stays bounded by the sum of the folder's
   * section windows without one section's refresh wiping another's read marks.
   * Read-state is RSS-only in v1 — queue items self-resolve as you act on them.
   */
  lensReadState: { [folderId: FolderId]: string[] };
  /**
   * Ephemeral live-tab metadata, keyed by Chrome tab id. Never persisted
   * (stripped in `persist()`); rebuilt at SW boot from `chrome.tabs.query`.
   */
  liveTabsById: { [tabId: TabId]: LiveTab };
  /**
   * Ephemeral lens runtime results keyed by folder id (lenses, design D2).
   * Never persisted (stripped in `persist()` exactly like `liveTabsById`);
   * written only by the coordinator drain via `setLensRuntime`, rebuilt by
   * connector polls after a SW restart — work-sensitive MR titles never touch
   * disk.
   */
  lenses: { [folderId: FolderId]: LensRuntime };
}

// Data-backup: the portable backup envelope types (data-backup capability).

/**
 * The portable subset of `AppState` that travels in a backup file. Excludes
 * machine-bound maps (`tabBindings`, `spaceInstancesByWindow`,
 * `activeSpaceByWindow`, `tabLastActivity`, `lensItemBindings`) and the
 * ephemeral slices (`liveTabsById`, `lenses`). On import these are re-seeded
 * to empty defaults so the imported data adopts the new machine's live tabs
 * cleanly on next boot.
 */
export type PortableAppState = Pick<
  AppState,
  | 'spaces'
  | 'savedTabs'
  | 'pinnedBySpace'
  | 'faviconRow'
  | 'archivedTabs'
  | 'trash'
  | 'lastActivatedSpaceId'
> & { schemaVersion: number };

/**
 * The on-file backup envelope written by `buildBackup` and validated by
 * `BackupEnvelopeSchema` in `schemas.ts`. `formatVersion` is the backup FILE
 * FORMAT version (independent of the storage `schemaVersion`), always `1` for
 * this first shipped format. `schemaVersion` carries the storage schema the
 * `state` payload was written at, so import can run `runMigrations` forward.
 */
export interface BackupEnvelope {
  formatVersion: 1;
  schemaVersion: number;
  exportedAt: number;
  state: PortableAppState;
  /** Typed `| undefined` to match the Zod schema's `.optional()` inference under
   * `exactOptionalPropertyTypes` (see the equality guard in `schemas.ts`). */
  settings?: import('./settings').Settings | undefined;
}

/**
 * Sidebar-local, per-window UI state augmented onto the `LunmaStore`'s `state`
 * by the sidebar (`createSidebarStore`) — NEVER part of `AppState`, never
 * persisted, never broadcast. The single source of truth for the shape of these
 * ephemeral fields: the store's sidebar-only mutators (`setPinnedExpanded`,
 * `setFolderExpanded`, `setAutoRenameNextFolder`), the `SidebarState` projection
 * (`sidebar/store-context.svelte.ts`), and the `PinnedTabs` readers all reference
 * THIS interface rather than re-declaring the shape inline. Each field is
 * optional because it is lazily created on first write.
 */
export interface SidebarLocalState {
  /** Per-window pinned-section expand/collapse (sidebar-pinned-tabs). */
  pinnedExpandedByWindow?: { [windowId: WindowId]: boolean };
  /**
   * Per-window folder expand/collapse (pinned-tab-folders, design D2). The same
   * Space's folder can be open in one window and collapsed in another.
   */
  expandedFoldersByWindow?: {
    [windowId: WindowId]: { [folderId: FolderId]: boolean };
  };
  /**
   * Per-window one-shot "open inline rename on the next new folder" flag
   * (pin-temp-tab-into-folder). Armed when two tabs fold into a new folder;
   * consumed by the active `PinnedTabs` the moment it opens the editor.
   */
  autoRenameNextFolderByWindow?: { [windowId: WindowId]: boolean };
  /**
   * Per-window per-section collapse state for multi-source lenses
   * (collapsible-smart-folder-sections). Keyed by `folderId` then by the
   * section's `sourceKey` (`${source}:${host}`). Like `expandedFoldersByWindow`
   * it is sidebar-local, per-window, NEVER persisted and NEVER broadcast — the
   * same folder's section can be collapsed in one window and expanded in
   * another. An ABSENT leaf means **expanded**; `true` means collapsed, so a
   * freshly rendered folder (and any folder after an SW restart) shows all
   * sections.
   */
  collapsedLensSectionsByWindow?: {
    [windowId: WindowId]: { [folderId: FolderId]: { [sourceKey: string]: boolean } };
  };
  /**
   * Per-window per-section "reveal recently read" peek for feed sections
   * (collapsible-smart-folder-sections). Keyed by `folderId` then by the
   * section's `sourceKey`. Sidebar-local, per-window, NEVER persisted/broadcast
   * — like the collapse state above, revealing one feed's read rows in this
   * window is independent of every other feed and window. An ABSENT leaf means
   * NOT revealed (the folder's drained `hideRead` default holds); `true` reveals
   * that one section's read rows. Ephemeral by design (a peek): it resets on
   * reload, leaving the folder back at its resting drained state.
   */
  revealedReadLensSectionsByWindow?: {
    [windowId: WindowId]: { [folderId: FolderId]: { [sourceKey: string]: boolean } };
  };
}
