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
  color: string;
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
   * Coupling axis (favicon-row-model, ADR 0010 D1). A non-null `SpaceId` couples
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
 * A pinned-tab placement node. The pinned list for a Space is an ordered tree
 * of these: a `tab` node points at a `SavedTab` record; a `folder` node groups
 * tab ids. Folders are single-level — `children` holds `SavedTabId` values
 * only, never nested folders. `icon`/`color` are plain strings on the record
 * (as on `Space`); the narrow `IconName`/`SpaceColor` unions are applied only
 * at the bus boundary.
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
    };

/**
 * Per-pinned-tab domain boundary (pinned-tab-domain-boundary). `{ mode: 'off' }`
 * is *explicitly free* (overrides a global `'domain'` default); `{ mode:
 * 'locked', allow }` confines the bound tab's user-clicked, in-tab navigations
 * to the host-glob `allow` set. An ABSENT `boundary` on a `SavedTab` means
 * *inherit the global `pinnedTabBoundaryDefault` setting*.
 */
export type TabBoundary = { mode: 'off' } | { mode: 'locked'; allow: string[] };

/**
 * A saved tab's per-window live bindings (per-window-tab-bindings, ADR 0009): one
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
  favIconUrl?: string;
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
   * Per-(saved tab, window) live bindings (per-window-tab-bindings, ADR 0009).
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
   * Flat, global placement for **favicon-row favorites** (favicon-row-model,
   * ADR 0010 D2): the ordered list of `SavedTabId`s whose record carries
   * `spaceId === null`. A sibling to `pinnedBySpace`, but **not keyed by Space**
   * and **not** a `PinNode[]` tree — favorites do not nest into folders in v1.
   * A record is referenced here XOR in some `pinnedBySpace[spaceId]`, never both.
   */
  faviconRow: SavedTabId[];
  /**
   * Ephemeral live-tab metadata, keyed by Chrome tab id. Never persisted
   * (stripped in `persist()`); rebuilt at SW boot from `chrome.tabs.query`.
   */
  liveTabsById: { [tabId: TabId]: LiveTab };
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
}
