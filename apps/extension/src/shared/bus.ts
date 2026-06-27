import { z } from 'zod';
import { ICON_NAMES } from './icon-names';
import { log } from './logger';
import { BackupEnvelopeSchema } from './schemas';
import type {
  BackupEnvelope,
  FolderId,
  IconName,
  LensProvider,
  LensSourceRef,
  PinNode,
  SavedTabId,
  SourceId,
  SpaceAutoArchive,
  SpaceColor,
  SpaceId,
  TabBoundary,
  TabId,
  WindowId,
} from './types';

// Command + ack discriminated unions.

export type SidebarCommand =
  | {
      kind: 'createSpace';
      payload: {
        name: string;
        color: SpaceColor;
        icon: IconName;
        windowId: WindowId;
        /** Optional per-Space auto-archive override applied at mint. Absent =
         * inherit the global default (the common case; the New Space form leaves
         * it absent unless the user picks Off/Custom up front). */
        autoArchive?: SpaceAutoArchive | undefined;
      };
    }
  | { kind: 'renameSpace'; payload: { spaceId: SpaceId; newName: string } }
  | { kind: 'recolourSpace'; payload: { spaceId: SpaceId; color: SpaceColor } }
  | { kind: 'changeSpaceIcon'; payload: { spaceId: SpaceId; icon: IconName } }
  | { kind: 'deleteSpace'; payload: { spaceId: SpaceId } }
  | { kind: 'restoreSpaceFromTrash'; payload: { spaceId: SpaceId } }
  | { kind: 'activateSpace'; payload: { windowId: WindowId; spaceId: SpaceId } }
  // `replaceTabId` (newtab-hearth): the in-place open — when present the handler
  // navigates THAT existing tab to the saved tab and binds it (the new-tab home's
  // own tab id), instead of creating a new tab. Stale id → fall back to create;
  // absent → unchanged new-tab behaviour (existing callers unaffected).
  | {
      kind: 'openSavedTab';
      payload: { savedTabId: SavedTabId; windowId: WindowId; replaceTabId?: TabId };
    }
  // Per-window-tab-bindings (ADR 0003): focus/go-home act on THIS window's bound
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
  // Favicon-row-model: space-less twins of pin/unpin/reorder. Kept
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
  // Lens lifecycle (lenses). Flat payloads; update/delete/refresh address
  // `{ spaceId, folderId }` like the sibling folder commands. The SW mints the
  // node id + icon on create; `baseUrl` is normalized/validated SW-side
  // (absolute http(s), trailing slash stripped — invalid throws, error ack) and
  // `refreshMinutes` is clamped to the floor of 5.
  | {
      kind: 'createLens';
      payload: {
        spaceId: SpaceId;
        // OPTIONAL client-minted node id (sources-redesign — mirrors
        // `createAccount`): when present the SW uses it, so the editor can open
        // the new lens's overview page without awaiting an id; absent → the SW
        // mints `crypto.randomUUID()`.
        id?: FolderId;
        // Account REFERENCES (connector-accounts) — not embedded configs. The SW
        // validates each `sourceId` resolves to an `AppState.sources` account.
        sources: LensSourceRef[];
        name: string;
        maxItems: number;
        refreshMinutes: number;
        // No `lensKind` (sources-redesign): the SW derives it from the source set
        // (any github/gitlab source ⇒ 'review', else 'general') — never sent.
      };
    }
  | {
      kind: 'updateLens';
      payload: {
        spaceId: SpaceId;
        folderId: FolderId;
        sources: LensSourceRef[];
        name: string;
        maxItems: number;
        refreshMinutes: number;
        // No `lensKind` (sources-redesign): the SW re-derives it from the sources.
      };
    }
  | { kind: 'deleteLens'; payload: { spaceId: SpaceId; folderId: FolderId } }
  // Account lifecycle (connector-accounts). The token is NOT carried over the bus
  // — it is written directly via `setAccountToken`. `createAccount` carries a
  // CLIENT-minted `id` (a UUID generated on the surface) so a surface can
  // reference the new account inline in a following `createLens` without awaiting
  // the `void` ack. The SW normalizes/validates `baseUrl` and rejects a duplicate
  // `id`.
  | {
      kind: 'createAccount';
      payload: { id: SourceId; provider: LensProvider; baseUrl: string; name?: string };
    }
  | { kind: 'renameAccount'; payload: { id: SourceId; name: string } }
  | { kind: 'deleteAccount'; payload: { id: SourceId } }
  // Feed read-state (rss-connector design D3). Mark one item read (the open path
  // also marks read SW-side), mark every current item read, toggle the persisted
  // hide-read preference, and open the source's full listing in a tab.
  | { kind: 'markLensItemRead'; payload: { folderId: FolderId; itemId: string } }
  | { kind: 'markLensItemUnread'; payload: { folderId: FolderId; itemId: string } }
  | { kind: 'markAllLensItemsRead'; payload: { spaceId: SpaceId; folderId: FolderId } }
  | {
      kind: 'setLensHideRead';
      payload: { spaceId: SpaceId; folderId: FolderId; hideRead: boolean };
    }
  | {
      kind: 'openLensListing';
      payload: { spaceId: SpaceId; folderId: FolderId; windowId: WindowId };
    }
  // Unconditional refresh; acks ok once underway — the fetch OUTCOME lands via
  // the runtime slice and the state broadcast, never via the ack.
  | { kind: 'refreshLens'; payload: { spaceId: SpaceId; folderId: FolderId } }
  // Lens item activation (lenses): open-if-dormant, focus-if-bound. IDENTITY
  // ONLY — the SW resolves the item's URL from its own `lenses` runtime slice
  // and never trusts a URL on the wire (the `openUrl` scheme-hardening questions
  // don't arise; the attack surface is a lookup key). Unknown spaceId/folderId,
  // or an itemId neither bound nor listed, throws (error ack).
  | {
      kind: 'openLensItem';
      payload: {
        spaceId: SpaceId;
        folderId: FolderId;
        itemId: string;
        windowId: WindowId;
        // True when dispatched from the lens page: the SW records the bound tab
        // so closing it returns to the page rather than auto-advancing to the
        // next unread feed item. Absent for sidebar opens.
        fromPage?: boolean;
      };
    }
  // Open-or-focus the lens's full-page view. Opens an extension page
  // (chrome-extension:// URL carrying ?folderId=…) and reuses an existing page
  // tab in the window by tab-query dedupe — no persisted binding.
  // NOT openUrl: that handler hardens its scheme and drops the chrome-extension:// URL.
  | {
      kind: 'openLensPage';
      payload: { spaceId: SpaceId; folderId: FolderId; windowId: WindowId };
    }
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
  | { kind: 'openUrl'; payload: { url: string; windowId: WindowId; force?: boolean } }
  | { kind: 'duplicateTab'; payload: { tabId: TabId } }
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
  | { kind: 'clearArchivedTabs'; payload: Record<string, never> }
  // Data-backup (data-backup capability): the options page sends a parsed backup
  // file to the SW, which validates, migrates, and replaces the store state + broadcasts.
  | { kind: 'importState'; payload: { backup: BackupEnvelope } }
  // OPML import (opml-import-export): bulk-create RSS lenses from a
  // parsed OPML feed list. The handler loops createLens logic per entry.
  | {
      kind: 'importOpml';
      payload: { spaceId: string; feeds: { name: string; feedUrl: string }[] };
    };

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
  'createLens',
  'updateLens',
  'deleteLens',
  'createAccount',
  'renameAccount',
  'deleteAccount',
  'refreshLens',
  'openLensItem',
  'markLensItemRead',
  'markLensItemUnread',
  'markAllLensItemsRead',
  'setLensHideRead',
  'openLensListing',
  'openLensPage',
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
  'duplicateTab',
  'setTabBoundary',
  'restoreArchivedTab',
  'setSpaceAutoArchive',
  'deleteArchivedTab',
  'clearArchivedTabs',
  'importState',
  'importOpml',
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
  createLens: true,
  updateLens: true,
  deleteLens: true,
  createAccount: true,
  renameAccount: true,
  deleteAccount: true,
  refreshLens: true,
  openLensItem: true,
  markLensItemRead: true,
  markLensItemUnread: true,
  markAllLensItemsRead: true,
  setLensHideRead: true,
  openLensListing: true,
  openLensPage: true,
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
  duplicateTab: true,
  setTabBoundary: true,
  restoreArchivedTab: true,
  setSpaceAutoArchive: true,
  deleteArchivedTab: true,
  clearArchivedTabs: true,
  importState: true,
  importOpml: true,
} satisfies Record<SidebarCommandKind, true>;

// ── Runtime payload schema (Task 1.x) ──────────────────────────────────────────
//
// The SW bus adapter validates the FULL command payload against this Zod
// discriminated union (not just `kind`), closing the asymmetry with the
// fully-Zod-validated storage boundary. The schemas below mirror the
// `SidebarCommand` union's field types exactly; the narrow `SpaceColor` /
// `IconName` unions are applied here (the bus boundary) where Zod can express
// them, while folder `icon`/`color` on a `PinNode` stay plain strings (as on the
// persisted record). The leaf shapes (`PinNode`, `TabBoundary`, `SpaceAutoArchive`)
// mirror the persisted schemas in `schemas.ts`; they are re-stated locally so
// `bus.ts` stays the self-contained bus contract and never couples to the storage
// envelope's coercion/default quirks.

const SPACE_COLORS = [
  'red',
  'orange',
  'yellow',
  'green',
  'teal',
  'cyan',
  'blue',
  'purple',
  'pink',
  'gray',
] as const satisfies readonly SpaceColor[];

// Exhaustiveness: every `SpaceColor` is present above (a new colour added to the
// union without a string here fails this check) — the mirror of the `satisfies`
// above, which guards against an invalid colour.
type _SpaceColorExhaustive = [SpaceColor] extends [(typeof SPACE_COLORS)[number]] ? true : never;
const _spaceColorExhaustive: _SpaceColorExhaustive = true;
void _spaceColorExhaustive;

const SpaceColorSchema = z.enum(SPACE_COLORS);
const IconNameSchema = z.enum(ICON_NAMES);

// Per-pinned-tab domain boundary — mirrors `TabBoundary` in `types.ts`.
const TabBoundarySchema = z.discriminatedUnion('mode', [
  z.strictObject({ mode: z.literal('off') }),
  z.strictObject({ mode: z.literal('locked'), allow: z.array(z.string()) }),
]);

// Per-Space auto-archive override — mirrors `SpaceAutoArchive` in `types.ts`.
const SpaceAutoArchiveSchema = z.discriminatedUnion('mode', [
  z.strictObject({ mode: z.literal('off') }),
  z.strictObject({ mode: z.literal('custom'), idleMinutes: z.number().int().positive() }),
]);

// The canned lens query set — mirrors `LensQuery` in `types.ts`.
const LensQuerySchema = z.enum(['authored', 'assigned', 'review-requested']);

// The shipped connector sources — mirrors `LensProvider` in `types.ts`. An
// out-of-vocabulary source (e.g. 'bitbucket') rejects at the bus boundary.
const LensProviderSchema = z.enum(['gitlab', 'github', 'jira', 'rss']);

// Per-instance account REFERENCE — mirrors `LensSourceRef` in `types.ts`
// (connector-accounts): each entry references a connected Account by `sourceId`
// and carries the set of canned filters (`queries`) this reference contributes.
// Queue accounts carry a non-empty `queries`; rss carries `[]` — the per-source
// split (and that each `sourceId` resolves) is enforced by the SW's create/update
// handlers, not at the wire boundary.
const LensSourceRefSchema = z.strictObject({
  sourceId: z.string(),
  queries: z.array(LensQuerySchema),
});

// A pinned-tab placement node — mirrors `PinNode` in `types.ts` (all three
// kinds, so `reorderPinned` round-trips lens nodes losslessly with their
// config fields intact). Folder `icon`/`color` are plain strings on the record
// (the narrow unions live only on the dedicated `setFolderIcon`/`setFolderColor`
// commands).
const PinNodeSchema = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('tab'), id: z.string() }),
  z.strictObject({
    kind: z.literal('folder'),
    id: z.string(),
    name: z.string(),
    icon: z.string(),
    color: z.string(),
    children: z.array(z.string()),
  }),
  z.strictObject({
    kind: z.literal('lens'),
    id: z.string(),
    name: z.string(),
    icon: z.string(),
    // review-lens widened the persisted enum; reorderPinned must round-trip a
    // `review` lens node losslessly (this previously lagged at `general`-only).
    lensKind: z.enum(['general', 'review']),
    // Account references (connector-accounts) — the v13 lens node shape.
    sources: z.array(LensSourceRefSchema).min(1),
    maxItems: z.number(),
    hideRead: z.boolean(),
    refreshMinutes: z.number(),
  }),
]);

// Per-kind command schemas, keyed by `kind`. The `satisfies Record<…>` guard is
// the exhaustiveness mechanism (Decision 1): a kind added to the `SidebarCommand`
// union without an entry here — or a stray extra key — fails `tsc`, the same way
// `SIDEBAR_COMMAND_KINDS` is guarded. Per-payload *shape* correctness is covered
// by the schema's unit tests (the `Record<…, z.ZodType>` value type is broad on
// purpose, because Zod's `.optional()` adds `| undefined` that `exactOptional`-
// typed union fields do not, so a parameterised guard would mis-fire).
const COMMAND_SCHEMAS = {
  createSpace: z.strictObject({
    kind: z.literal('createSpace'),
    payload: z.strictObject({
      name: z.string(),
      color: SpaceColorSchema,
      icon: IconNameSchema,
      windowId: z.number(),
      autoArchive: SpaceAutoArchiveSchema.optional(),
    }),
  }),
  renameSpace: z.strictObject({
    kind: z.literal('renameSpace'),
    payload: z.strictObject({ spaceId: z.string(), newName: z.string() }),
  }),
  recolourSpace: z.strictObject({
    kind: z.literal('recolourSpace'),
    payload: z.strictObject({ spaceId: z.string(), color: SpaceColorSchema }),
  }),
  changeSpaceIcon: z.strictObject({
    kind: z.literal('changeSpaceIcon'),
    payload: z.strictObject({ spaceId: z.string(), icon: IconNameSchema }),
  }),
  deleteSpace: z.strictObject({
    kind: z.literal('deleteSpace'),
    payload: z.strictObject({ spaceId: z.string() }),
  }),
  restoreSpaceFromTrash: z.strictObject({
    kind: z.literal('restoreSpaceFromTrash'),
    payload: z.strictObject({ spaceId: z.string() }),
  }),
  activateSpace: z.strictObject({
    kind: z.literal('activateSpace'),
    payload: z.strictObject({ windowId: z.number(), spaceId: z.string() }),
  }),
  openSavedTab: z.strictObject({
    kind: z.literal('openSavedTab'),
    payload: z.strictObject({
      savedTabId: z.string(),
      windowId: z.number(),
      // Optional in-place open target (newtab-hearth).
      replaceTabId: z.number().optional(),
    }),
  }),
  focusSavedTab: z.strictObject({
    kind: z.literal('focusSavedTab'),
    payload: z.strictObject({ savedTabId: z.string(), windowId: z.number() }),
  }),
  goHome: z.strictObject({
    kind: z.literal('goHome'),
    payload: z.strictObject({ savedTabId: z.string(), windowId: z.number() }),
  }),
  makeThisHome: z.strictObject({
    kind: z.literal('makeThisHome'),
    payload: z.strictObject({ savedTabId: z.string() }),
  }),
  deleteSavedTab: z.strictObject({
    kind: z.literal('deleteSavedTab'),
    payload: z.strictObject({ savedTabId: z.string() }),
  }),
  pinTab: z.strictObject({
    kind: z.literal('pinTab'),
    payload: z.strictObject({
      tabId: z.number(),
      windowId: z.number(),
      spaceId: z.string(),
      targetIndex: z.number(),
      placement: z
        .union([
          z.strictObject({ into: z.string() }),
          z.strictObject({ withSavedTabId: z.string() }),
        ])
        .optional(),
    }),
  }),
  unpinTab: z.strictObject({
    kind: z.literal('unpinTab'),
    payload: z.strictObject({ savedTabId: z.string(), windowId: z.number() }),
  }),
  reorderPinned: z.strictObject({
    kind: z.literal('reorderPinned'),
    payload: z.strictObject({ spaceId: z.string(), nodes: z.array(PinNodeSchema) }),
  }),
  favoriteTab: z.strictObject({
    kind: z.literal('favoriteTab'),
    payload: z.strictObject({
      tabId: z.number(),
      windowId: z.number(),
      targetIndex: z.number().optional(),
    }),
  }),
  favoriteSavedTab: z.strictObject({
    kind: z.literal('favoriteSavedTab'),
    payload: z.strictObject({ savedTabId: z.string() }),
  }),
  pinSavedTab: z.strictObject({
    kind: z.literal('pinSavedTab'),
    payload: z.strictObject({
      savedTabId: z.string(),
      spaceId: z.string(),
      index: z.number().optional(),
    }),
  }),
  reorderFavorites: z.strictObject({
    kind: z.literal('reorderFavorites'),
    payload: z.strictObject({ ids: z.array(z.string()) }),
  }),
  createFolder: z.strictObject({
    kind: z.literal('createFolder'),
    payload: z.strictObject({ spaceId: z.string() }),
  }),
  createFolderFromTabs: z.strictObject({
    kind: z.literal('createFolderFromTabs'),
    payload: z.strictObject({
      spaceId: z.string(),
      tabIdA: z.string(),
      tabIdB: z.string(),
      index: z.number(),
    }),
  }),
  renameFolder: z.strictObject({
    kind: z.literal('renameFolder'),
    payload: z.strictObject({ spaceId: z.string(), folderId: z.string(), name: z.string() }),
  }),
  setFolderIcon: z.strictObject({
    kind: z.literal('setFolderIcon'),
    payload: z.strictObject({ spaceId: z.string(), folderId: z.string(), icon: IconNameSchema }),
  }),
  setFolderColor: z.strictObject({
    kind: z.literal('setFolderColor'),
    payload: z.strictObject({ spaceId: z.string(), folderId: z.string(), color: SpaceColorSchema }),
  }),
  deleteFolder: z.strictObject({
    kind: z.literal('deleteFolder'),
    payload: z.strictObject({ spaceId: z.string(), folderId: z.string() }),
  }),
  createLens: z.strictObject({
    kind: z.literal('createLens'),
    payload: z.strictObject({
      spaceId: z.string(),
      // Optional client-minted node id (sources-redesign) — see the payload type.
      id: z.string().optional(),
      sources: z.array(LensSourceRefSchema).min(1),
      name: z.string(),
      maxItems: z.number(),
      refreshMinutes: z.number(),
      // No `lensKind` (sources-redesign): the SW derives it from the sources.
    }),
  }),
  updateLens: z.strictObject({
    kind: z.literal('updateLens'),
    payload: z.strictObject({
      spaceId: z.string(),
      folderId: z.string(),
      sources: z.array(LensSourceRefSchema).min(1),
      name: z.string(),
      maxItems: z.number(),
      refreshMinutes: z.number(),
      // No `lensKind` (sources-redesign): the SW re-derives it from the sources.
    }),
  }),
  deleteLens: z.strictObject({
    kind: z.literal('deleteLens'),
    payload: z.strictObject({ spaceId: z.string(), folderId: z.string() }),
  }),
  // Account lifecycle (connector-accounts). `createAccount` carries a
  // client-minted `id`; the token is NOT on the wire (written via
  // `setAccountToken`).
  createAccount: z.strictObject({
    kind: z.literal('createAccount'),
    payload: z.strictObject({
      id: z.string(),
      provider: LensProviderSchema,
      baseUrl: z.string(),
      name: z.string().optional(),
    }),
  }),
  renameAccount: z.strictObject({
    kind: z.literal('renameAccount'),
    payload: z.strictObject({ id: z.string(), name: z.string() }),
  }),
  deleteAccount: z.strictObject({
    kind: z.literal('deleteAccount'),
    payload: z.strictObject({ id: z.string() }),
  }),
  refreshLens: z.strictObject({
    kind: z.literal('refreshLens'),
    payload: z.strictObject({ spaceId: z.string(), folderId: z.string() }),
  }),
  // Feed read-state (rss-connector design D3). `markLensItemRead` is keyed by
  // folder id alone (the read-state slice is not Space-keyed); the rest carry
  // `spaceId` for the `requireLensNode` validation.
  markLensItemRead: z.strictObject({
    kind: z.literal('markLensItemRead'),
    payload: z.strictObject({ folderId: z.string(), itemId: z.string() }),
  }),
  markLensItemUnread: z.strictObject({
    kind: z.literal('markLensItemUnread'),
    payload: z.strictObject({ folderId: z.string(), itemId: z.string() }),
  }),
  markAllLensItemsRead: z.strictObject({
    kind: z.literal('markAllLensItemsRead'),
    payload: z.strictObject({ spaceId: z.string(), folderId: z.string() }),
  }),
  setLensHideRead: z.strictObject({
    kind: z.literal('setLensHideRead'),
    payload: z.strictObject({
      spaceId: z.string(),
      folderId: z.string(),
      hideRead: z.boolean(),
    }),
  }),
  openLensListing: z.strictObject({
    kind: z.literal('openLensListing'),
    payload: z.strictObject({
      spaceId: z.string(),
      folderId: z.string(),
      windowId: z.number(),
    }),
  }),
  openLensPage: z.strictObject({
    kind: z.literal('openLensPage'),
    payload: z.strictObject({
      spaceId: z.string(),
      folderId: z.string(),
      windowId: z.number(),
    }),
  }),
  // Identity only — a payload smuggling a `url` key fails the strict parse
  // (lenses; the SW resolves the URL from its own runtime).
  openLensItem: z.strictObject({
    kind: z.literal('openLensItem'),
    payload: z.strictObject({
      spaceId: z.string(),
      folderId: z.string(),
      itemId: z.string(),
      windowId: z.number(),
      fromPage: z.boolean().optional(),
    }),
  }),
  reorderTemp: z.strictObject({
    kind: z.literal('reorderTemp'),
    payload: z.strictObject({ windowId: z.number(), tabIds: z.array(z.number()) }),
  }),
  reorderSpaces: z.strictObject({
    kind: z.literal('reorderSpaces'),
    payload: z.strictObject({ spaceIds: z.array(z.string()) }),
  }),
  renameTab: z.strictObject({
    kind: z.literal('renameTab'),
    payload: z.strictObject({ savedTabId: z.string(), newName: z.string() }),
  }),
  renameTempTab: z.strictObject({
    kind: z.literal('renameTempTab'),
    payload: z.strictObject({
      tabId: z.number(),
      spaceId: z.string(),
      windowId: z.number(),
      newName: z.string(),
    }),
  }),
  focusTab: z.strictObject({
    kind: z.literal('focusTab'),
    payload: z.strictObject({ tabId: z.number() }),
  }),
  closeTab: z.strictObject({
    kind: z.literal('closeTab'),
    payload: z.strictObject({ tabId: z.number() }),
  }),
  newTab: z.strictObject({
    kind: z.literal('newTab'),
    payload: z.strictObject({ windowId: z.number(), spaceId: z.string().optional() }),
  }),
  clearTempTabs: z.strictObject({
    kind: z.literal('clearTempTabs'),
    payload: z.strictObject({ windowId: z.number(), spaceId: z.string().optional() }),
  }),
  undoClearTempTabs: z.strictObject({
    kind: z.literal('undoClearTempTabs'),
    payload: z.strictObject({ windowId: z.number(), tabIds: z.array(z.number()) }),
  }),
  openUrl: z.strictObject({
    kind: z.literal('openUrl'),
    payload: z.strictObject({
      url: z.string(),
      windowId: z.number(),
      force: z.boolean().optional(),
    }),
  }),
  duplicateTab: z.strictObject({
    kind: z.literal('duplicateTab'),
    payload: z.strictObject({ tabId: z.number() }),
  }),
  setTabBoundary: z.strictObject({
    kind: z.literal('setTabBoundary'),
    payload: z.strictObject({ savedTabId: z.string(), boundary: TabBoundarySchema.nullable() }),
  }),
  restoreArchivedTab: z.strictObject({
    kind: z.literal('restoreArchivedTab'),
    payload: z.strictObject({ archivedAt: z.number(), tabId: z.number(), windowId: z.number() }),
  }),
  setSpaceAutoArchive: z.strictObject({
    kind: z.literal('setSpaceAutoArchive'),
    payload: z.strictObject({
      spaceId: z.string(),
      autoArchive: SpaceAutoArchiveSchema.nullable(),
    }),
  }),
  deleteArchivedTab: z.strictObject({
    kind: z.literal('deleteArchivedTab'),
    payload: z.strictObject({ archivedAt: z.number(), tabId: z.number() }),
  }),
  clearArchivedTabs: z.strictObject({
    kind: z.literal('clearArchivedTabs'),
    payload: z.strictObject({}),
  }),
  // Data-backup: validate the full backup envelope at the bus boundary so the
  // handler only ever receives a well-formed `BackupEnvelope`.
  importState: z.strictObject({
    kind: z.literal('importState'),
    payload: z.strictObject({ backup: BackupEnvelopeSchema }),
  }),
  // OPML import: bulk-create RSS lenses from a parsed feed list.
  importOpml: z.strictObject({
    kind: z.literal('importOpml'),
    payload: z.strictObject({
      spaceId: z.string(),
      feeds: z.array(z.strictObject({ name: z.string(), feedUrl: z.string() })),
    }),
  }),
} satisfies Record<SidebarCommandKind, z.ZodType>;

/**
 * The runtime schema for a `SidebarCommand` — a Zod discriminated union keyed on
 * `kind`, exhaustive against the `SidebarCommand` union by the `satisfies` guard
 * on `COMMAND_SCHEMAS` above. The SW bus adapter parses every incoming command's
 * full payload against this before enqueuing (Task 2.x).
 */
export const SidebarCommandSchema = z.discriminatedUnion('kind', [
  COMMAND_SCHEMAS.createSpace,
  COMMAND_SCHEMAS.renameSpace,
  COMMAND_SCHEMAS.recolourSpace,
  COMMAND_SCHEMAS.changeSpaceIcon,
  COMMAND_SCHEMAS.deleteSpace,
  COMMAND_SCHEMAS.restoreSpaceFromTrash,
  COMMAND_SCHEMAS.activateSpace,
  COMMAND_SCHEMAS.openSavedTab,
  COMMAND_SCHEMAS.focusSavedTab,
  COMMAND_SCHEMAS.goHome,
  COMMAND_SCHEMAS.makeThisHome,
  COMMAND_SCHEMAS.deleteSavedTab,
  COMMAND_SCHEMAS.pinTab,
  COMMAND_SCHEMAS.unpinTab,
  COMMAND_SCHEMAS.reorderPinned,
  COMMAND_SCHEMAS.favoriteTab,
  COMMAND_SCHEMAS.favoriteSavedTab,
  COMMAND_SCHEMAS.pinSavedTab,
  COMMAND_SCHEMAS.reorderFavorites,
  COMMAND_SCHEMAS.createFolder,
  COMMAND_SCHEMAS.createFolderFromTabs,
  COMMAND_SCHEMAS.renameFolder,
  COMMAND_SCHEMAS.setFolderIcon,
  COMMAND_SCHEMAS.setFolderColor,
  COMMAND_SCHEMAS.deleteFolder,
  COMMAND_SCHEMAS.createLens,
  COMMAND_SCHEMAS.updateLens,
  COMMAND_SCHEMAS.deleteLens,
  COMMAND_SCHEMAS.createAccount,
  COMMAND_SCHEMAS.renameAccount,
  COMMAND_SCHEMAS.deleteAccount,
  COMMAND_SCHEMAS.refreshLens,
  COMMAND_SCHEMAS.openLensItem,
  COMMAND_SCHEMAS.markLensItemRead,
  COMMAND_SCHEMAS.markLensItemUnread,
  COMMAND_SCHEMAS.markAllLensItemsRead,
  COMMAND_SCHEMAS.setLensHideRead,
  COMMAND_SCHEMAS.openLensListing,
  COMMAND_SCHEMAS.openLensPage,
  COMMAND_SCHEMAS.reorderTemp,
  COMMAND_SCHEMAS.reorderSpaces,
  COMMAND_SCHEMAS.renameTab,
  COMMAND_SCHEMAS.renameTempTab,
  COMMAND_SCHEMAS.focusTab,
  COMMAND_SCHEMAS.closeTab,
  COMMAND_SCHEMAS.newTab,
  COMMAND_SCHEMAS.clearTempTabs,
  COMMAND_SCHEMAS.undoClearTempTabs,
  COMMAND_SCHEMAS.openUrl,
  COMMAND_SCHEMAS.duplicateTab,
  COMMAND_SCHEMAS.setTabBoundary,
  COMMAND_SCHEMAS.restoreArchivedTab,
  COMMAND_SCHEMAS.setSpaceAutoArchive,
  COMMAND_SCHEMAS.deleteArchivedTab,
  COMMAND_SCHEMAS.clearArchivedTabs,
  COMMAND_SCHEMAS.importState,
  COMMAND_SCHEMAS.importOpml,
]);

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

// Structured errors.

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

// Tunable timeout — no per-call override.
export const BUS_TIMEOUT_MS = 10000;

// Transport seam — injectable for testing.
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

// Singleton wired to chrome.runtime. The transport adapter below
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

/** Runtime message type for the sidebar flash when dedup focuses an existing tab. */
export const TAB_DEDUP_FLASH = 'lunma/tab-dedup-flash' as const;

/**
 * Fire-and-forget command dispatch (Task 3.x). The single sanctioned path for
 * sidebar UI actions that do not await the ack: it calls `bus.send` and routes
 * any rejection (timeout, transport error, or an `{ error }` ack) through the
 * shared logger, so a failed command can never become an unhandled rejection.
 * Confirmation flows that need the ack keep awaiting `bus.send(...)` directly.
 *
 * The typed logger shape (`log.error(message, context)`) is required here — a
 * bare `.catch(log.error)` would pass the rejection as the `message` arg and
 * mis-log it.
 */
export function dispatch(cmd: SidebarCommand): void {
  bus.send(cmd).catch((err: unknown) => log.error('BUS_DISPATCH_FAILED', { err, kind: cmd.kind }));
}
