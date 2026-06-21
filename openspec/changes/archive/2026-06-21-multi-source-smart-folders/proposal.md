## Why

A smart folder today is wired to exactly one connector source: one `source`, one
`baseUrl`, one optional `query`. That makes two user workflows impossible — (1) a
single "Reviews" folder that watches GitLab MRs _and_ GitHub PRs together, and (2)
an OPML import that produces one tidy "Feeds" folder instead of N sibling folders
cluttering the pinned section (the current `importOpml` calls `createSmartFolder`
once per feed). This change replaces the per-node source trio with a `sources:
SmartSourceConfig[]` list so one smart folder can aggregate many connectors, rendered
as per-source sections that each keep their own kind semantics.

**Roadmap note.** This is Phase 1 of 3:
- **Phase 2 — `merged-smart-folder-layout`** (follow-on): interleaved single-list
  layout requiring an item `sortKey` / `publishedAt` field and same-kind dedup.
- **Phase 3 — `nested-pinned-folders`** (follow-on): true folder-in-folder nesting,
  recursive drag/drop, and depth caps — builds on the `sources[]` foundation.

## What Changes

- **`PinNode` smart shape** — replaces `source: SmartSource`, `baseUrl: string`,
  `query?: SmartQuery` with `sources: SmartSourceConfig[]` where `SmartSourceConfig`
  is `{ source: SmartSource; baseUrl: string; query?: SmartQuery }`. Folder-level
  fields (`name`, `icon`, `maxItems`, `refreshMinutes`, `hideRead`) are unchanged.
  The node remains a leaf (no `children` field); there is no folder-in-folder
  nesting in this phase.
- **Schema v7 → v8 + migration** — every existing single-source smart node is
  wrapped as `sources: [{ source, baseUrl, query }]`. Zero behaviour change for
  existing one-source folders.
- **Connector engine fan-out** — `background/smart-folders.ts` fans out per
  sub-source entry. The folder's runtime slice becomes `SmartFolderRuntime`
  → `{ sections: { [sourceKey: string]: SmartSectionRuntime }; state: RollUpState }`.
  `requiredOrigins` is the union across all sub-source entries; the host-permission
  gate resolves per section (partial grants are allowed — GitLab granted, GitHub
  not → only the GitHub section shows `needs-access`).
- **`smartItemBindings` namespacing** — `itemId` is namespaced as `<sourceKey>:<nativeId>`
  within a folder so ids from different connectors never collide. Schema v8 persists
  the namespaced ids.
- **Sectioned rendering** — `SmartFolder.svelte` renders one collapsible section
  per sub-source. Each section keeps its own kind semantics: queue (gitlab / github /
  jira) → status dots + per-section cap; feed (rss) → unread mark + draining
  read-state. The one-glyph restraint holds per row. The folder badge sums
  per-section attention counts (item counts for queue sections, unread counts for
  feed sections).
- **Editor** — `SmartFolderEditor.svelte` gains an add/remove/reorder list of
  sub-sources, each with its own source picker, URL field, and (for queue sources)
  query picker. Creating a new folder with no sub-sources is blocked (≥1 required).
- **OPML import** — `importOpml` produces **one** RSS smart folder with N feed
  `SmartSourceConfig` entries instead of N sibling folders. Export serialises each
  sub-source entry as one `<outline>`.
- **`docs/architecture.md`** — updated to note the `sources[]` shape.
- **Untouched `docs/` files** — `docs/tech-stack.md`, all other docs.

## Capabilities

### New Capabilities
_None — no new capability spec is required; all changes fall within existing
capability boundaries._

### Modified Capabilities
- `smart-folders`: Requirements change for the smart node shape (`sources[]`
  replaces the flat source trio), the runtime slice (sectioned), the needs-access
  gate (per-section partial grants), smart-item binding namespacing, rendering
  (sectioned layout + per-section semantics), badge (summed), and editor (sub-source
  list). The `SmartQuery` and `SmartSource` types and the four connector modules
  are unchanged.
- `storage-and-migrations`: Schema version bumps v7 → v8; the migration wraps
  existing single-source smart nodes; `smartItemBindings` value shape widens to
  carry the namespaced id.
- `opml-import-export`: `importOpml` creates one folder with N sources (not N
  folders); `buildOpml` walks the sources list.

## Impact

**Code:**
- `apps/extension/src/shared/types.ts` — `PinNode` smart shape, new
  `SmartSourceConfig` type, `SmartSectionRuntime`, `SmartFolderRuntime` (revised).
- `apps/extension/src/shared/schemas.ts` — `PinNodeSchema` smart branch, schema v8
  + migration.
- `apps/extension/src/background/smart-folders.ts` — fan-out engine, per-section
  runtime, union host-permission gate.
- `apps/extension/src/background/connectors/` — `requiredOrigins` contracts
  unchanged; `fetchSmartFolderRuntime` entry point widens to `SmartSourceConfig`.
- `apps/extension/src/shared/connector-origins.ts` — `requiredOriginsForNode`
  accepts `SmartSourceConfig` (not the full node).
- `apps/extension/src/sidebar/SmartFolder.svelte` — sectioned layout.
- `apps/extension/src/sidebar/SmartFolderEditor.svelte` — sub-source list.
- `apps/extension/src/shared/opml.ts` — `importOpml` / `buildOpml` revised.
- `apps/extension/src/options/FeedSubscriptions.svelte` — import flow revised.

**`src/ui/` primitives used:**
- Existing: `FolderRow`, `Button`, `Select`, `TextInput`, `Icon`, `ContextMenu`,
  `RowMenu`.
- No new primitives required.

**Dependencies:** No new npm packages. `saxes` (already used by the RSS connector
and OPML utilities) unchanged.

**Breaking:** Schema v7 → v8 is a migration (backward-compatible boot); no
extension-store data is lost. The `SmartFolderRuntime` type shape changes — any
consumer reading `runtime.state` / `runtime.items` directly must be updated to
the sectioned shape.
