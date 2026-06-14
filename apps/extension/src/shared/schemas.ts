import { z } from 'zod';
import { SettingsSchema } from './settings';
import type { AppState, BackupEnvelope } from './types';

// Pre-release clean baseline (rebrand-to-lunma): the placeholder-era v1→v11
// schema history was collapsed to a single v1 shape. v2 (smart-folders) widens
// the persisted `PinNode` union with the `smart` kind; v3 (github-connector)
// widens the smart node's `source` to `'gitlab' | 'github'`; v4
// (smart-folder-item-bindings) adds the persisted ids-only `smartItemBindings`
// slice (`.default({})`, so older envelopes parse unchanged); v5 (jira-connector)
// widens the smart node's `source` to `'gitlab' | 'github' | 'jira'`; v6
// (rss-connector) widens it to add `'rss'`, makes the smart node's `query`
// optional, adds `maxItems` (`.default(20)`) / `hideRead` (`.default(false)`),
// and adds the persisted ids-only `smartReadState` slice (`.default({})`) — all
// pass-through entries in the append-only `migrations` list (see `migrations.ts`);
// v7 (smart-tab-boundary) widens each `smartItemBindings` innermost slot from a
// bare `TabId` to `{ tabId: TabId; allowGlob: string }` — a REAL transformation,
// not a pass-through. Each bump is deliberate: it makes a downgrade detectable.
export const CURRENT_SCHEMA_VERSION = 7;

const SpaceInstanceSchema = z.strictObject({
  spaceId: z.string(),
  groupId: z.number(),
  tempTabIds: z.array(z.number()),
  // Ephemeral per-instance custom temp-tab names. `.optional()` via `.default({})`
  // (like `liveTabsById`) so envelopes written before this field existed parse
  // cleanly.
  tempTabTitles: z.record(z.coerce.number(), z.string()).default({}),
});

// Per-Space auto-archive override (auto-archive). An ABSENT `autoArchive` means
// "inherit the global setting"; `{ mode: 'off' }` never archives the Space;
// `{ mode: 'custom', idleMinutes }` carries a positive-integer idle threshold.
const SpaceAutoArchiveSchema = z.discriminatedUnion('mode', [
  z.strictObject({ mode: z.literal('off') }),
  // A positive integer (`> 0`) — `0` / negatives are rejected at the storage
  // boundary; the resolver additionally clamps to a floor of 1 (defense-in-depth).
  z.strictObject({ mode: z.literal('custom'), idleMinutes: z.number().int().positive() }),
]);

const SpaceSchema = z.strictObject({
  id: z.string(),
  name: z.string(),
  color: z.string(),
  icon: z.string(),
  autoArchive: SpaceAutoArchiveSchema.optional(),
});

const TrashedSpaceSchema = z.strictObject({
  id: z.string(),
  name: z.string(),
  color: z.string(),
  icon: z.string(),
  deletedAt: z.string(),
  autoArchive: SpaceAutoArchiveSchema.optional(),
});

// Per-pinned-tab URL boundary (pinned-tab-url-boundary). An ABSENT `boundary` on
// a saved tab means "inherit the global default". The `locked` `allow` list is a
// `z.array(z.string())` of **URL globs** (a bare host meaning the whole host, or
// a URL pattern with a path); validation stays permissive — the matcher tolerates
// a malformed entry by simply not matching, so a bad pattern cannot brick a tab.
const TabBoundarySchema = z.discriminatedUnion('mode', [
  z.strictObject({ mode: z.literal('off') }),
  z.strictObject({ mode: z.literal('locked'), allow: z.array(z.string()) }),
]);

// A saved tab — a Lunma-owned record (a pinned tab or a favicon-row favorite),
// NOT a Chrome bookmark. A `null` `spaceId` is the decoupled / global-favorite
// state (favicon-row-model, ADR 0010).
const SavedTabSchema = z.strictObject({
  id: z.string(),
  spaceId: z.string().nullable(),
  title: z.string(),
  originalURL: z.string(),
  currentURL: z.string().nullable(),
  // Optional user-chosen display name (takes precedence over `title`).
  customTitle: z.string().optional(),
  boundary: TabBoundarySchema.optional(),
});

const ArchivedTabSchema = z.strictObject({
  tabId: z.number(),
  url: z.string(),
  title: z.string(),
  spaceId: z.string(),
  archivedAt: z.number(),
});

// A pinned-tab placement node: a tab node, a single-level folder node, or a
// smart-folder config node (smart-folders — configuration only; results are
// ephemeral and never persisted). Folder `icon`/`color` are plain strings on
// the record (as on `Space`); the narrow `IconName`/`SpaceColor` unions live
// only at the bus boundary.
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
    kind: z.literal('smart'),
    id: z.string(),
    name: z.string(),
    icon: z.string(),
    source: z.enum(['gitlab', 'github', 'jira', 'rss']),
    baseUrl: z.string(),
    // Source-optional (rss-connector design D2): queue sources carry a canned
    // query; a feed source (`rss`) omits it.
    query: z.enum(['authored', 'assigned', 'review-requested']).optional(),
    // Per-folder cap (rss-connector design D5). For QUEUE sources the total
    // result cap; for the FEED source the UNREAD budget (the draining-queue
    // model — the connector keeps the whole feed, the sidebar surfaces the
    // newest `maxItems` unread). `.default(20)` so pre-v6 nodes migrate
    // losslessly with the prior hardcoded cap.
    maxItems: z.number().default(20),
    // Feed read-hiding state (rss-connector design D9; feed sources only).
    // `.default(true)` — a feed's resting state is the DRAINED unread queue
    // (read hidden); the footer's "Show recently read" reveals them. Inert on
    // queue sources. `default` so pre-v6 nodes parse unchanged.
    hideRead: z.boolean().default(true),
    refreshMinutes: z.number(),
  }),
]);

// Ephemeral live-tab metadata (sidebar-temp-tabs). The schema ACCEPTS this slice
// when present so a broadcast/runtime state round-trips, but it is `.optional()`
// because `persist()` strips it before writing — on-disk envelopes never carry
// it, and reads must still parse.
const LiveTabSchema = z.strictObject({
  tabId: z.number(),
  windowId: z.number(),
  title: z.string(),
  url: z.string(),
  active: z.boolean(),
  status: z.enum(['loading', 'complete']),
  favIconUrl: z.string().optional(),
});

// Per-(saved tab, window) live bindings (per-window-tab-bindings, ADR 0009):
// `{ [savedTabId]: { [windowId]: liveTabId } }`. Inner keys are `windowId`s,
// coerced from their JSON string form.
const TabBindingsSchema = z.record(z.string(), z.record(z.coerce.number(), z.number()));

// The smart-folder runtime slice (smart-folders, design D2). Ephemeral like
// `liveTabsById`: the schema ACCEPTS it when present so a broadcast/runtime
// state round-trips, but it is `.optional()` because `persist()` strips it —
// on-disk envelopes never carry it (MR titles never touch disk).
const SmartFolderItemSchema = z.strictObject({
  id: z.string(),
  title: z.string(),
  url: z.string(),
  status: z
    .strictObject({
      tone: z.enum(['ok', 'pending', 'warn', 'fail']),
      label: z.string(),
    })
    .optional(),
});

const SmartFolderRuntimeSchema = z.strictObject({
  state: z.enum(['pending', 'ok', 'signed-out', 'error']),
  items: z.array(SmartFolderItemSchema),
  fetchedAt: z.number().nullable(),
});

// Per-(smart-folder item, window) live bindings (smart-folder-item-bindings):
// `{ [folderId]: { [itemId]: { [windowId]: tabId } } }` — v6 shape (bare TabId).
// Kept so the v6 schema below can remain a stable parse target for migration tests.
const SmartItemBindingsSchema = z.record(
  z.string(),
  z.record(z.string(), z.record(z.coerce.number(), z.number())),
);

// v7 shape (smart-tab-boundary): each slot stores `{ tabId, allowGlob }` so the
// boundary content script can be re-armed at boot without the ephemeral runtime.
const SmartItemBindingsV7Schema = z.record(
  z.string(),
  z.record(
    z.string(),
    z.record(z.coerce.number(), z.object({ tabId: z.number(), allowGlob: z.string() })),
  ),
);

// Per-feed-folder read-state (rss-connector, design D3): `{ [folderId]: string[] }`
// — the read item ids per smart folder. PERSISTED (kept by `toPersistable`, like
// `smartItemBindings`; not stripped like the ephemeral `smartFolders`), but IDS
// ONLY — never the item's title/URL. `.default({})` (the `smartItemBindings`
// precedent) so pre-v6 envelopes, written before this slice existed, parse
// cleanly through the v6 pass-through.
const SmartReadStateSchema = z.record(z.string(), z.array(z.string()));

export const AppStateV6Schema = z.strictObject({
  schemaVersion: z.number(),
  spaces: z.array(SpaceSchema),
  activeSpaceByWindow: z.record(z.coerce.number(), z.string().nullable()),
  spaceInstancesByWindow: z.record(
    z.coerce.number(),
    z.record(z.string(), SpaceInstanceSchema).optional(),
  ),
  tabBindings: TabBindingsSchema,
  savedTabs: z.record(z.string(), SavedTabSchema),
  lastActivatedSpaceId: z.string().nullable(),
  tabLastActivity: z.record(z.coerce.number(), z.number()),
  archivedTabs: z.array(ArchivedTabSchema),
  trash: z.record(z.string(), TrashedSpaceSchema),
  pinnedBySpace: z.record(z.string(), z.array(PinNodeSchema)),
  liveTabsById: z.record(z.coerce.number(), LiveTabSchema).optional(),
  faviconRow: z.array(z.string()),
  smartItemBindings: SmartItemBindingsSchema.default({}),
  smartReadState: SmartReadStateSchema.default({}),
  smartFolders: z.record(z.string(), SmartFolderRuntimeSchema).optional(),
});

// v7: same as v6 but with the widened SmartItemBindingsV7Schema (smart-tab-boundary).
export const AppStateV7Schema = z.strictObject({
  schemaVersion: z.number(),
  spaces: z.array(SpaceSchema),
  activeSpaceByWindow: z.record(z.coerce.number(), z.string().nullable()),
  spaceInstancesByWindow: z.record(
    z.coerce.number(),
    z.record(z.string(), SpaceInstanceSchema).optional(),
  ),
  tabBindings: TabBindingsSchema,
  savedTabs: z.record(z.string(), SavedTabSchema),
  lastActivatedSpaceId: z.string().nullable(),
  tabLastActivity: z.record(z.coerce.number(), z.number()),
  archivedTabs: z.array(ArchivedTabSchema),
  trash: z.record(z.string(), TrashedSpaceSchema),
  pinnedBySpace: z.record(z.string(), z.array(PinNodeSchema)),
  liveTabsById: z.record(z.coerce.number(), LiveTabSchema).optional(),
  faviconRow: z.array(z.string()),
  smartItemBindings: SmartItemBindingsV7Schema.default({}),
  smartReadState: SmartReadStateSchema.default({}),
  smartFolders: z.record(z.string(), SmartFolderRuntimeSchema).optional(),
});

export const EnvelopeSchema = z.strictObject({
  schemaVersion: z.number(),
  state: AppStateV7Schema,
});

export type AppStateV6 = z.infer<typeof AppStateV6Schema>;
export type AppStateV7 = z.infer<typeof AppStateV7Schema>;
export type Envelope = z.infer<typeof EnvelopeSchema>;

type AssertEqual<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

// `liveTabsById` and `smartFolders` are ephemeral: required on the runtime
// `AppState`, optional on the persisted schema (stripped before write). Compare
// the persisted shapes — every NON-ephemeral field must still match exactly
// (the persisted `smartReadState` slice is included, like `smartItemBindings`).
type Persisted<T> = Omit<T, 'liveTabsById' | 'smartFolders'>;
const _schemaMatchesAppState: AssertEqual<Persisted<AppStateV7>, Persisted<AppState>> = true;
void _schemaMatchesAppState;

// ── Data-backup: BackupEnvelopeSchema ────────────────────────────────────────
// The portable backup envelope schema (data-backup capability). Strict: an
// unknown top-level key rejects. The `state` slice reuses the portable-subset
// field schemas above (no coerce/default so the backup boundary is clean); the
// window-bound maps are intentionally absent and re-seeded on import.

const PortableAppStateSchema = z.strictObject({
  schemaVersion: z.number(),
  spaces: z.array(SpaceSchema),
  savedTabs: z.record(z.string(), SavedTabSchema),
  pinnedBySpace: z.record(z.string(), z.array(PinNodeSchema)),
  faviconRow: z.array(z.string()),
  archivedTabs: z.array(ArchivedTabSchema),
  trash: z.record(z.string(), TrashedSpaceSchema),
  lastActivatedSpaceId: z.string().nullable(),
});

export const BackupEnvelopeSchema = z.strictObject({
  formatVersion: z.literal(1),
  schemaVersion: z.number(),
  exportedAt: z.number(),
  state: PortableAppStateSchema,
  settings: SettingsSchema.optional(),
});

// Directional compile-time guard: the Zod inferred type must be assignable to
// `BackupEnvelope`. The reverse direction (BackupEnvelope → schema) is verified
// by the `parseBackup` return-type check in `backup.ts`.
const _schemaAssignableToBackupEnvelope: z.infer<typeof BackupEnvelopeSchema> =
  {} as BackupEnvelope;
void _schemaAssignableToBackupEnvelope;
