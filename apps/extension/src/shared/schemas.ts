import { z } from 'zod';
import { SettingsSchema } from './settings';
import type { AppState, BackupEnvelope, SpaceColor } from './types';

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
// not a pass-through; v8 (multi-source-smart-folders) wraps each smart node's
// flat source/baseUrl/query? into `sources: [{…}]`; v9 (multi-filter-smart-
// connectors) rewrites each `sources[]` entry from the flat `query?` shape to
// `queries: SmartQuery[]` and re-keys `smartItemBindings` with the per-filter
// axis. v10 (smart-source-rename) additive — adds optional `name` to
// `SmartSourceConfig`. v11 (establish-lens-model) renames the `smart` PinNode
// discriminant to `lens`, adds `lensKind: 'general'`, and renames the persisted
// top-level keys `smartItemBindings`→`lensItemBindings`,
// `smartReadState`→`lensReadState`. v12 (review-lens) widens the persisted lens
// node's `lensKind` enum from `'general'` to `'general' | 'review'` — an additive
// enum widening, structurally identical for existing nodes (its migration is an
// identity pass-through). v13 (decouple-source-accounts) adds the top-level
// `sources` slice (the `SourceAccount` map) and rewrites each lens node's
// `sources` from embedded `LensSource[]` to `LensSourceRef[]` references — a REAL
// transformation that extracts the embedded `(provider, baseUrl)` pairs into
// first-class accounts. Each bump is deliberate: it makes a downgrade detectable.
export const CURRENT_SCHEMA_VERSION = 17;

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

export const SPACE_COLORS = [
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
] as const satisfies SpaceColor[];

const SpaceSchema = z.strictObject({
  id: z.string(),
  name: z.string(),
  color: z.enum(SPACE_COLORS),
  icon: z.string(),
  autoArchive: SpaceAutoArchiveSchema.optional(),
});

const TrashedSpaceSchema = z.strictObject({
  id: z.string(),
  name: z.string(),
  color: z.enum(SPACE_COLORS),
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
// state (favicon-row-model).
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

// Per-instance connector entry (multi-filter-smart-connectors). Each entry is
// one connector instance (source + host); its `queries` array is the set of
// canned filters that instance contributes. Queue sources carry a non-empty
// `queries`; feed sources (`rss`) carry an empty `queries` (the create/update
// handlers enforce the non-empty/empty split per source — the persisted schema
// only types the shape). This is the CURRENT (v9+) shape.
const LensSourceSchema = z.strictObject({
  source: z.enum(['gitlab', 'github', 'jira', 'rss']),
  baseUrl: z.string(),
  queries: z.array(z.enum(['authored', 'assigned', 'review-requested'])),
  // Optional display name (smart-source-rename, v10): labels the source's
  // section(s) in place of the host. Display-only — absent for an unnamed source.
  name: z.string().optional(),
});

// A connected Account (connector-accounts, v13). `z.strictObject` carrying NO
// token field — the secret lives only in the separate `lunma.connectors` store,
// keyed by this account's `id`. `baseUrl` is a normalized absolute http(s) URL
// (validated at the create/update boundary; the schema only types the shape).
const SourceAccountSchema = z.strictObject({
  id: z.string(),
  provider: z.enum(['gitlab', 'github', 'bitbucket', 'jira', 'rss']),
  baseUrl: z.string(),
  name: z.string().optional(),
  // Cloud bitbucket workspace slug (add-bitbucket-connector, v16). Optional in the
  // schema (absent for every other provider and for self-hosted bitbucket);
  // REQUIRED-when-Cloud is enforced at the create/update boundary, not by Zod.
  workspace: z.string().optional(),
});

// A lens's per-instance REFERENCE to a connected Account (connector-accounts,
// v13) — replaces the embedded `LensSourceSchema` on a lens node. The
// provider/baseUrl are read from the referenced account at resolve time; only the
// `sourceId` and the per-reference `queries` live here.
const LensSourceRefSchema = z.strictObject({
  sourceId: z.string(),
  queries: z.array(z.enum(['authored', 'assigned', 'review-requested'])),
});

// Historical (v6–v8) per-entry connector sub-source — the flat `query?` shape
// the multi-filter-smart-connectors change replaced with `queries[]`. Kept as a
// stable parse target for the V6/V7/V8 schemas the migration tests build
// fixtures against; the v9 migration rewrites this into the `queries[]` shape.
const SmartSourceConfigV8Schema = z.strictObject({
  source: z.enum(['gitlab', 'github', 'jira', 'rss']),
  baseUrl: z.string(),
  query: z.enum(['authored', 'assigned', 'review-requested']).optional(),
});

// Per-lens view filter (lens-view-filters, v14). All axes optional; an absent
// or fully-empty filter means "no narrowing". `repos` stores host-qualified
// keys (`${host}/${owner}/${repo}`) so the same slug on two hosts never merges.
const LensFilterSchema = z.strictObject({
  entities: z.array(z.enum(['change', 'ticket', 'article', 'generic'])).optional(),
  repos: z.array(z.string()).optional(),
  projects: z.array(z.string()).optional(),
  feeds: z.array(z.string()).optional(),
});

// Historical (v13) pinned-tab node: identical to the current `PinNodeSchema`
// except the lens branch has no `filter` field. Frozen so pre-v14 envelopes
// (or v13-migration output) validate exactly as they did before
// lens-view-filters added the optional filter.
const PinNodeV13Schema = z.discriminatedUnion('kind', [
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
    lensKind: z.enum(['general', 'review']),
    sources: z.array(LensSourceRefSchema).min(1),
    maxItems: z.number().default(20),
    hideRead: z.boolean().default(true),
    refreshMinutes: z.number(),
  }),
]);

// A pinned-tab placement node (CURRENT/v14 shape): a tab node, a single-level
// folder node, or a lens config node whose `sources[]` entries are account
// REFERENCES (`{ sourceId, queries }`) into the top-level `sources` map
// (connector-accounts — configuration only; results are ephemeral and never
// persisted). The lens branch carries the optional `filter` added by
// lens-view-filters (v14). Folder `icon`/`color` are plain strings on the
// record (as on `Space`); the narrow `IconName`/`SpaceColor` unions live only
// at the bus boundary.
// Exported so the migration chain's terminal normalization
// (`normalizePinnedNodes` in migrations.ts) can validate each migrated node and
// drop any that fails the current shape — preventing a structurally-invalid node
// (e.g. a lens left without sources) from poisoning whole-state validation.
export const PinNodeSchema = z.discriminatedUnion('kind', [
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
    lensKind: z.enum(['general', 'review']),
    // One or more account references (connector-accounts). `.min(1)` enforced at
    // the schema boundary; the editor also blocks confirming with an empty list.
    sources: z.array(LensSourceRefSchema).min(1),
    maxItems: z.number().default(20),
    hideRead: z.boolean().default(true),
    refreshMinutes: z.number(),
    // Optional view filter (lens-view-filters, v14).
    filter: LensFilterSchema.optional(),
    // Optional Articles-section layout (persist-lens-article-layout, v17). Absent
    // resolves to `'grid'` (the first-open default).
    articleLayout: z.enum(['grid', 'list']).optional(),
  }),
]);

// Historical (v14–v16) pinned-tab node: identical to the current `PinNodeSchema`
// except the lens branch has no `articleLayout` field. Frozen so pre-v17 envelopes
// (or v16-migration output) validate exactly as they did before
// persist-lens-article-layout added the optional layout.
const PinNodeV16Schema = z.discriminatedUnion('kind', [
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
    lensKind: z.enum(['general', 'review']),
    sources: z.array(LensSourceRefSchema).min(1),
    maxItems: z.number().default(20),
    hideRead: z.boolean().default(true),
    refreshMinutes: z.number(),
    filter: LensFilterSchema.optional(),
  }),
]);

// Historical (v2–v12) pinned-tab node: the lens/smart branch carries EMBEDDED
// `sources: LensSource[]` (provider/baseUrl on each entry) rather than the v13
// `LensSourceRef[]`. Frozen so pre-v13 envelopes (or v12-migration output)
// validate exactly as they did before decouple-source-accounts moved sources
// onto first-class accounts. The v13 migration reads this shape to extract
// accounts; the V12 AppState schema references it.
const PinNodeV12Schema = z.discriminatedUnion('kind', [
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
    lensKind: z.enum(['general', 'review']),
    sources: z.array(LensSourceSchema).min(1),
    maxItems: z.number().default(20),
    hideRead: z.boolean().default(true),
    refreshMinutes: z.number(),
  }),
]);

// Historical (v11) pinned-tab node (establish-lens-model): identical to the
// current `PinNodeSchema` except the lens branch's `lensKind` enum is the narrow
// `z.enum(['general'])` — frozen so pre-v12 envelopes (or v11-migration output)
// validate exactly as they did before review-lens widened the enum.
const PinNodeV11Schema = z.discriminatedUnion('kind', [
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
    lensKind: z.enum(['general']),
    sources: z.array(LensSourceSchema).min(1),
    maxItems: z.number().default(20),
    hideRead: z.boolean().default(true),
    refreshMinutes: z.number(),
  }),
]);

// Historical (v2–v10) pinned-tab node: identical to the current `PinNodeSchema`
// except the smart/lens branch uses the old `smart` discriminant and the
// flat `query?` / `queries[]` shapes. Kept so pre-v11 envelopes (or v10
// migration output) still validate in migration tests.
const PinNodeV10Schema = z.discriminatedUnion('kind', [
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
    sources: z.array(LensSourceSchema).min(1),
    maxItems: z.number().default(20),
    hideRead: z.boolean().default(true),
    refreshMinutes: z.number(),
  }),
]);

// Historical (v6–v8) pinned-tab node: identical to `PinNodeV10Schema` except the
// smart branch uses the flat `query?` `SmartSourceConfigV8Schema`. The V6/V7/V8
// AppState schemas reference this so a pre-v9 envelope (or v8-migration output)
// still validates.
const PinNodeV8Schema = z.discriminatedUnion('kind', [
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
    sources: z.array(SmartSourceConfigV8Schema).min(1),
    maxItems: z.number().default(20),
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

// Per-(saved tab, window) live bindings (per-window-tab-bindings, ADR 0003):
// `{ [savedTabId]: { [windowId]: liveTabId } }`. Inner keys are `windowId`s,
// coerced from their JSON string form.
const TabBindingsSchema = z.record(z.string(), z.record(z.coerce.number(), z.number()));

// The canonical Change entity mirror (review-lens) — populated by the
// github/gitlab connectors for review-kind lenses. Ephemeral like the rest of
// the `lenses` slice (never persisted → no migration). `state` on a reviewer is
// optional (absent = unknown, rendered `pending`).
const ChangeDataSchema = z.strictObject({
  author: z.string(),
  repo: z.string(),
  reviewers: z.array(
    z.strictObject({
      login: z.string(),
      state: z.enum(['approved', 'changes', 'pending']).optional(),
    }),
  ),
  draft: z.boolean(),
  additions: z.number().optional(),
  deletions: z.number().optional(),
  targetBranch: z.string().optional(),
  updatedAt: z.number(),
});

// The canonical Ticket entity mirror (lens-overview) — Jira issues + github/gitlab
// issues, normalised. Ephemeral like the rest of the `lenses` slice (never
// persisted → no migration). Optional fields mirror `TicketData`'s `| undefined`.
const TicketDataSchema = z.strictObject({
  key: z.string(),
  statusCategory: z.enum(['todo', 'in-progress', 'done']),
  statusLabel: z.string(),
  project: z.string().optional(),
  assignee: z.string().optional(),
  priority: z.enum(['low', 'med', 'high', 'urgent']).optional(),
  labels: z.array(z.string()).optional(),
  updatedAt: z.number(),
});

// A cross-entity reference mirror (lens-overview, L0) — the linked-ticket chip on
// a Change. Ephemeral.
const EntityRefSchema = z.strictObject({
  kind: z.enum(['ticket', 'change', 'run']),
  key: z.string(),
  url: z.string(),
  label: z.string(),
});

// The lens runtime slice (lenses, design D2). Ephemeral like `liveTabsById`: the
// schema ACCEPTS it when present so a broadcast/runtime state round-trips, but it
// is `.optional()` because `persist()` strips it — on-disk envelopes never carry
// it (MR titles never touch disk).
const LensItemSchema = z.strictObject({
  id: z.string(),
  title: z.string(),
  url: z.string(),
  status: z
    .strictObject({
      tone: z.enum(['ok', 'pending', 'warn', 'fail']),
      label: z.string(),
    })
    .optional(),
  // Optional richer-content fields (smart-folder-page) — populated by the RSS
  // connector; ephemeral like the rest of the slice (never persisted).
  excerpt: z.string().optional(),
  imageUrl: z.string().optional(),
  publishedAt: z.number().optional(),
  // Article categories (lens-overview) — RSS `<category>` values; ephemeral.
  categories: z.array(z.string()).optional(),
  // The canonical Change entity (review-lens) — populated by the github/gitlab
  // connectors for review-kind lenses only; ephemeral (never persisted).
  change: ChangeDataSchema.optional(),
  // The canonical Ticket entity (lens-overview) — Jira + github/gitlab issues;
  // ephemeral.
  ticket: TicketDataSchema.optional(),
  // Cross-entity references (lens-overview, L0) — the linked-ticket chip on a
  // Change; ephemeral.
  refs: z.array(EntityRefSchema).optional(),
});

// Per-section runtime (multi-source-smart-folders). The slice is ephemeral
// (stripped by `toPersistable`, never read back from disk).
const LensSectionRuntimeSchema = z.strictObject({
  state: z.enum(['pending', 'ok', 'signed-out', 'error', 'needs-access']),
  items: z.array(LensItemSchema),
  fetchedAt: z.number().nullable(),
});

// Sectioned lens runtime: a map of per-section runtimes keyed by sourceKey.
const LensRuntimeSchema = z.strictObject({
  sections: z.record(z.string(), LensSectionRuntimeSchema),
});

// Per-(lens item, window) live bindings (lenses): `{ [folderId]: { [itemId]: {
// [windowId]: tabId } } }` — v6 shape (bare TabId). Kept so the v6 schema below
// can remain a stable parse target for migration tests.
const SmartItemBindingsSchema = z.record(
  z.string(),
  z.record(z.string(), z.record(z.coerce.number(), z.number())),
);

// v7 shape (smart-tab-boundary): each slot stores `{ tabId, allowGlob }` so the
// boundary content script can be re-armed at boot without the ephemeral runtime.
const LensItemBindingsSchema = z.record(
  z.string(),
  z.record(
    z.string(),
    z.record(z.coerce.number(), z.object({ tabId: z.number(), allowGlob: z.string() })),
  ),
);

// Per-feed-folder read-state (rss-connector, design D3): `{ [folderId]: string[] }`
// — the read item ids per lens. PERSISTED (kept by `toPersistable`, like
// `lensItemBindings`; not stripped like the ephemeral `lenses`), but IDS
// ONLY — never the item's title/URL. `.default({})` (the precedent) so pre-v6
// envelopes, written before this slice existed, parse cleanly through the v6
// pass-through.
const LensReadStateSchema = z.record(z.string(), z.array(z.string()));

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
  pinnedBySpace: z.record(z.string(), z.array(PinNodeV8Schema)),
  liveTabsById: z.record(z.coerce.number(), LiveTabSchema).optional(),
  faviconRow: z.array(z.string()),
  smartItemBindings: SmartItemBindingsSchema.default({}),
  smartReadState: LensReadStateSchema.default({}),
  smartFolders: z.record(z.string(), LensRuntimeSchema).optional(),
});

// v7: same as v6 but with the widened LensItemBindingsSchema (smart-tab-boundary).
// Note: `LensRuntimeSchema` now reflects the sectioned v8 shape; `smartFolders`
// is ephemeral (never persisted), so on-disk v7 envelopes never carry it and the
// `.default({})` makes it a non-issue for v7 parsing in migration tests.
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
  pinnedBySpace: z.record(z.string(), z.array(PinNodeV8Schema)),
  liveTabsById: z.record(z.coerce.number(), LiveTabSchema).default({}),
  faviconRow: z.array(z.string()),
  smartItemBindings: LensItemBindingsSchema.default({}),
  smartReadState: LensReadStateSchema.default({}),
  smartFolders: z.record(z.string(), LensRuntimeSchema).default({}),
});

// v8: widens the smart PinNode from a flat source triple to `sources[]`
// (multi-source-smart-folders) and adopts the sectioned LensRuntime.
export const AppStateV8Schema = z.strictObject({
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
  pinnedBySpace: z.record(z.string(), z.array(PinNodeV8Schema)),
  liveTabsById: z.record(z.coerce.number(), LiveTabSchema).default({}),
  faviconRow: z.array(z.string()),
  smartItemBindings: LensItemBindingsSchema.default({}),
  smartReadState: LensReadStateSchema.default({}),
  smartFolders: z.record(z.string(), LensRuntimeSchema).default({}),
});

// v9–v10: rewrites each smart node's `sources[]` entries from the flat `query?`
// shape to `queries: LensQuery[]` (multi-filter-smart-connectors) via the current
// `PinNodeV10Schema`. `smartItemBindings` item keys gain the per-filter
// `${source}:${host}:${query}:${nativeId}` axis, but they remain arbitrary
// strings so `LensItemBindingsSchema` is unchanged. Uses old persisted key names
// (`smartItemBindings`, `smartReadState`, `smartFolders`) — these are the v10
// on-disk names; v11 migration renames them.
export const AppStateV10Schema = z.strictObject({
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
  pinnedBySpace: z.record(z.string(), z.array(PinNodeV10Schema)),
  liveTabsById: z.record(z.coerce.number(), LiveTabSchema).default({}),
  faviconRow: z.array(z.string()),
  smartItemBindings: LensItemBindingsSchema.default({}),
  smartReadState: LensReadStateSchema.default({}),
  smartFolders: z.record(z.string(), LensRuntimeSchema).default({}),
});

// v11 (establish-lens-model): renames the `smart` PinNode discriminant to `lens`,
// adds `lensKind: z.enum(['general'])`, and renames the persisted top-level keys
// `smartItemBindings`→`lensItemBindings`, `smartReadState`→`lensReadState`.
// The ephemeral `smartFolders`→`lenses` slice needs only the code rename. Frozen
// at the narrow `PinNodeV11Schema` (general-only `lensKind`); v12 widens it.
export const AppStateV11Schema = z.strictObject({
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
  pinnedBySpace: z.record(z.string(), z.array(PinNodeV11Schema)),
  liveTabsById: z.record(z.coerce.number(), LiveTabSchema).default({}),
  faviconRow: z.array(z.string()),
  lensItemBindings: LensItemBindingsSchema.default({}),
  lensReadState: LensReadStateSchema.default({}),
  lenses: z.record(z.string(), LensRuntimeSchema).default({}),
});

// v12 (review-lens): the v11 schema with the lens node's `lensKind` enum widened
// to `z.enum(['general', 'review'])` (via the frozen embedded-source
// `PinNodeV12Schema`). Frozen at the embedded-`LensSource[]` lens shape; v13
// rewrites it to account references.
export const AppStateV12Schema = z.strictObject({
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
  pinnedBySpace: z.record(z.string(), z.array(PinNodeV12Schema)),
  liveTabsById: z.record(z.coerce.number(), LiveTabSchema).default({}),
  faviconRow: z.array(z.string()),
  lensItemBindings: LensItemBindingsSchema.default({}),
  lensReadState: LensReadStateSchema.default({}),
  lenses: z.record(z.string(), LensRuntimeSchema).default({}),
});

// v13 (decouple-source-accounts): the v12 schema PLUS the top-level `sources`
// slice (the `SourceAccount` map, `.default({})` so a migrated/older state with
// no accounts parses) AND the lens node's `sources` validated as account
// references (`LensSourceRef[]`, via the frozen `PinNodeV13Schema`) rather than
// embedded `LensSource[]`. Frozen at the pre-v14 lens shape (no `filter`); v14
// adds the optional `filter` field via the current `PinNodeSchema`.
export const AppStateV13Schema = z.strictObject({
  schemaVersion: z.number(),
  spaces: z.array(SpaceSchema),
  sources: z.record(z.string(), SourceAccountSchema).default({}),
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
  pinnedBySpace: z.record(z.string(), z.array(PinNodeV13Schema)),
  liveTabsById: z.record(z.coerce.number(), LiveTabSchema).default({}),
  faviconRow: z.array(z.string()),
  lensItemBindings: LensItemBindingsSchema.default({}),
  lensReadState: LensReadStateSchema.default({}),
  lenses: z.record(z.string(), LensRuntimeSchema).default({}),
  lensPeekByWindow: z
    .record(z.coerce.number(), z.object({ folderId: z.string(), tabId: z.number() }).nullable())
    .default({}),
});

// v14 (lens-view-filters): the v13 schema with the lens node's optional
// `filter?: LensFilter` field added (via the current `PinNodeSchema`). The
// field is fully additive — pre-v14 nodes simply lack `filter` and remain
// valid; the v14 migration is an identity pass-through. This is the
// CURRENT-version schema — the migration runner validates against it after
// running the v14 migration.
export const AppStateV14Schema = z.strictObject({
  schemaVersion: z.number(),
  spaces: z.array(SpaceSchema),
  sources: z.record(z.string(), SourceAccountSchema).default({}),
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
  pinnedBySpace: z.record(z.string(), z.array(PinNodeV16Schema)),
  liveTabsById: z.record(z.coerce.number(), LiveTabSchema).default({}),
  faviconRow: z.array(z.string()),
  lensItemBindings: LensItemBindingsSchema.default({}),
  lensReadState: LensReadStateSchema.default({}),
  lenses: z.record(z.string(), LensRuntimeSchema).default({}),
  // Ephemeral lens-overview "peek" per window (lens-overview-peek). Like
  // `liveTabsById`/`lenses`: `.default({})` so persisted envelopes (which strip it)
  // and broadcasts both parse; never written to disk.
  lensPeekByWindow: z
    .record(z.coerce.number(), z.object({ folderId: z.string(), tabId: z.number() }).nullable())
    .default({}),
});

/**
 * v15 (rekey-lens-sections-by-source-id) re-keys lens sections by account
 * `sourceId` and rewrites the persisted `lensItemBindings` map **keys** and
 * `lensReadState` id **strings**. Both are untyped `Record`/`string[]` shapes,
 * so no value shape changes — `AppStateV15Schema` is a structural alias of v14.
 */
export const AppStateV15Schema = AppStateV14Schema;

/**
 * v16 (add-bitbucket-connector) widens the `LensProvider` enum to include
 * `'bitbucket'` and adds the optional `workspace?` field — both landing in the
 * shared `SourceAccountSchema` (referenced by every version schema from v13 on),
 * so no AppState object shape changes: `AppStateV16Schema` is a structural alias
 * of v15 (and thus v14). The v16 migration is a pure identity pass-through.
 */
export const AppStateV16Schema = AppStateV15Schema;

/**
 * v17 (persist-lens-article-layout): the v16 schema with the lens node's optional
 * `articleLayout?: 'grid' | 'list'` field added (via the current `PinNodeSchema`;
 * v14–v16 stay frozen at `PinNodeV16Schema`, which lacks it). Fully additive —
 * pre-v17 nodes simply lack `articleLayout` and remain valid (resolving to the
 * `grid` default); the v17 migration is an identity pass-through. This is the
 * CURRENT-version schema — the migration runner validates against it.
 */
export const AppStateV17Schema = z.strictObject({
  ...AppStateV14Schema.shape,
  pinnedBySpace: z.record(z.string(), z.array(PinNodeSchema)),
});

export const EnvelopeSchema = z.strictObject({
  schemaVersion: z.number(),
  state: AppStateV17Schema,
});

export type AppStateV6 = z.infer<typeof AppStateV6Schema>;
export type AppStateV7 = z.infer<typeof AppStateV7Schema>;
export type AppStateV8 = z.infer<typeof AppStateV8Schema>;
export type AppStateV10 = z.infer<typeof AppStateV10Schema>;
export type AppStateV11 = z.infer<typeof AppStateV11Schema>;
export type AppStateV12 = z.infer<typeof AppStateV12Schema>;
export type AppStateV13 = z.infer<typeof AppStateV13Schema>;
export type AppStateV14 = z.infer<typeof AppStateV14Schema>;
export type AppStateV15 = z.infer<typeof AppStateV15Schema>;
export type AppStateV16 = z.infer<typeof AppStateV16Schema>;
export type AppStateV17 = z.infer<typeof AppStateV17Schema>;
export type Envelope = z.infer<typeof EnvelopeSchema>;

type AssertEqual<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

const _schemaMatchesAppState: AssertEqual<AppStateV17, AppState> = true;
void _schemaMatchesAppState;

// ── Data-backup: BackupEnvelopeSchema ────────────────────────────────────────
// The portable backup envelope schema (data-backup capability). Strict: an
// unknown top-level key rejects. The `state` slice reuses the portable-subset
// field schemas above (no coerce/default so the backup boundary is clean); the
// window-bound maps are intentionally absent and re-seeded on import.

const PortableAppStateSchema = z.strictObject({
  schemaVersion: z.number(),
  spaces: z.array(SpaceSchema),
  // Connected Accounts travel in the backup so a restored lens's account
  // references resolve (connector-accounts) — tokens are NOT carried (they live
  // in the separate secrets store, never in `AppState`). `.default({})` so a
  // pre-v13 backup with no accounts (migrated forward) parses cleanly.
  sources: z.record(z.string(), SourceAccountSchema).default({}),
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
