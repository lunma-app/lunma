import { z } from 'zod';
import type { AppState } from './types';

// Pre-release clean baseline (rebrand-to-lunma): the placeholder-era v1→v11
// schema history was collapsed to a single current shape. This IS the only
// persisted schema version, so `CURRENT_SCHEMA_VERSION = 1` and the migration
// list is empty (see `migrations.ts`). Future schema evolution re-introduces an
// `AppStateV2Schema` + a migration the usual append-only way.
export const CURRENT_SCHEMA_VERSION = 1;

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

// Per-pinned-tab domain boundary (pinned-tab-domain-boundary). An ABSENT
// `boundary` on a saved tab means "inherit the global default".
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

// A pinned-tab placement node: a tab node or a single-level folder node. Folder
// `icon`/`color` are plain strings on the record (as on `Space`); the narrow
// `IconName`/`SpaceColor` unions live only at the bus boundary.
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

export const AppStateV1Schema = z.strictObject({
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
});

export const EnvelopeSchema = z.strictObject({
  schemaVersion: z.number(),
  state: AppStateV1Schema,
});

export type AppStateV1 = z.infer<typeof AppStateV1Schema>;
export type Envelope = z.infer<typeof EnvelopeSchema>;

type AssertEqual<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

// `liveTabsById` is ephemeral: required on the runtime `AppState`, optional on
// the persisted schema (stripped before write). Compare the persisted shapes —
// every NON-ephemeral field must still match exactly.
type Persisted<T> = Omit<T, 'liveTabsById'>;
const _schemaMatchesAppState: AssertEqual<Persisted<AppStateV1>, Persisted<AppState>> = true;
void _schemaMatchesAppState;
