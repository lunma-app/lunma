## 1. Shared types and schema

- [x] 1.1 Add `SmartSourceConfig` type (`{ source: SmartSource; baseUrl: string; query?: SmartQuery }`) to `apps/extension/src/shared/types.ts`; export it
- [x] 1.2 Add `SmartSectionRuntime` type and update `SmartFolderRuntime` to `{ sections: { [sourceKey: string]: SmartSectionRuntime } }` in `shared/types.ts`
- [x] 1.3 Replace the flat `source`/`baseUrl`/`query?` fields on the smart `PinNode` branch in `shared/types.ts` with `sources: SmartSourceConfig[]`
- [x] 1.4 Add `SmartSourceConfigSchema` (Zod) to `shared/schemas.ts`; update the smart `PinNodeSchema` branch to use `z.array(SmartSourceConfigSchema).min(1)`
- [x] 1.5 Add `AppStateV8Schema` to `shared/schemas.ts`; bump `CURRENT_SCHEMA_VERSION` to `8`
- [x] 1.6 Add the v8 migration to `shared/migrations.ts`: wrap each smart node's flat fields into `sources: [{ source, baseUrl, query }]` and re-key `smartItemBindings` item ids with the source namespace (`${source}:${new URL(baseUrl).host}:${nativeId}`); drop orphaned folderId entries
- [x] 1.7 Write unit tests for the v8 migration covering: single-source wrap, binding re-key, orphaned binding drop, empty-bindings pass-through, no-smart-nodes pass-through

## 2. Connector origins and engine

- [x] 2.1 Rename `requiredOriginsForNode` → `requiredOriginsForConfig` in `shared/connector-origins.ts`; update its parameter type to `SmartSourceConfig`; update all callers
- [x] 2.2 Add `sourceKey(cfg: SmartSourceConfig): string` helper in `background/smart-folders.ts` returning `${cfg.source}:${new URL(cfg.baseUrl).host}`
- [x] 2.3 Update `SourceConnector` interface in `background/connectors/connector.ts`: `fetchRuntime(cfg: SmartSourceConfig, maxItems: number, caches?): Promise<SmartSectionRuntime>`; `requiredOrigins(cfg)` and `listingUrl(cfg)` accept `SmartSourceConfig`
- [x] 2.4 Update each connector module (`gitlab.ts`, `github.ts`, `jira.ts`, `rss.ts`) to match the new `SourceConnector` contract; remove references to the full node shape
- [x] 2.5 Add `fetchSmartSectionRuntime(cfg: SmartSourceConfig, maxItems: number, caches?): Promise<SmartSectionRuntime>` to the engine; replace the existing `fetchSmartFolderRuntime` entry point
- [x] 2.6 Update `startSmartFolderRefresh` in `background/smart-folders.ts` to fan out over `node.sources`, deriving `sourceKey` for each, and dispatch each section's result event as `{ folderId, sourceKey, runtime: SmartSectionRuntime }`
- [x] 2.7 Update `refreshDueSmartFolders` and `refreshSmartFolder` to iterate all source entries; update `ConnectorCaches` construction if needed
- [x] 2.8 Update the coordinator's `smartFolders.result` handler to call `store.setSmartSectionRuntime(folderId, sourceKey, runtime)` instead of `setSmartFolderRuntime`
- [x] 2.9 Update `store.ts`: add `setSmartSectionRuntime(folderId, sourceKey, runtime)` mutator; remove `setSmartFolderRuntime`
- [x] 2.10 Update the host-permission gate in the engine to check per-`sourceKey` (partial grants allowed); update `hasHostPermissions` call site

## 3. SW command handlers

- [x] 3.1 Update `createSmartFolder` handler: validate `sources[]` (≥1 entry, each entry's `baseUrl` normalized/validated, queue entries must have `query`); mint `icon` from first-source `mintedIcon` or `'layers'` for mixed kinds
- [x] 3.2 Update `updateSmartFolder` handler: accept new `sources[]` shape; trigger per-section refetch for changed entries; update `requestHostPermissions` call to use union of all sub-source origins
- [x] 3.3 Update `deleteSmartFolder` handler: drop `smartItemBindings[folderId]` entries (already covers all namespaced keys — no change needed in the demote logic, but verify)
- [x] 3.4 Update `openSmartItem` handler: accept `namespacedItemId` (`${sourceKey}:${nativeId}`) as the item id; bind under the namespaced key in `smartItemBindings`

## 4. Sidebar rendering

- [x] 4.1 Create `apps/extension/src/sidebar/SmartSectionHeader.svelte`: renders source icon (`Icon` primitive, `--text-dim`) + host label (`--text-muted`, `--font-size-xs`, 12px height); shown only when the parent folder has ≥ 2 sources
- [x] 4.2 Update `SmartFolder.svelte`: iterate `node.sources` to render per-section (section header when ≥2 sources → section items using existing per-kind row logic); derive section runtime from `smartFolders[folderId].sections[sourceKey]`
- [x] 4.3 Update badge computation in `SmartFolder.svelte` to sum per-section attention counts (queue item count + feed unread count); hide badge at 0; `N+` cap when any section hits its `maxItems`
- [x] 4.4 Update ghost-row trigger in `SmartFolder.svelte`: show per-section ghost rows when a section has never had items (first-ever fetch); overall pending-state guard from prior code adapted to sectioned shape
- [x] 4.5 Update `SmartFolder.svelte` for `hideRead` / "Mark all read" / "Show recently read": apply only to `rss` sections; hide those menu items when no feed sections exist
- [x] 4.6 Update item row dispatch in `SmartFolder.svelte` to produce namespaced `itemId` (`sourceKey + ':' + item.id`) for `openSmartItem`
- [x] 4.7 Update the `needs-access` inline render in `SmartFolder.svelte`: render the grant row inside the relevant section (after section header), not at folder level; pass `requiredOriginsForConfig(cfg)` to the grant handler

## 5. Editor

- [x] 5.1 Update `SmartFolderEditor.svelte`: replace the single source/URL/query form with a sub-source list (source chip + host label + remove `×` button per entry)
- [x] 5.2 Add inline "Add source" form to the editor: source picker → auto-URL default → optional query picker (hidden for rss) → "Add" button; open below the sub-source list
- [x] 5.3 Add "Move up" / "Move down" controls per sub-source entry (keyboard-accessible, matches pinned-row reorder pattern)
- [x] 5.4 Disable the Confirm button when `sources` is empty; update the per-source `baseUrl` default-swap logic to work per-entry
- [x] 5.5 Update `requestHostPermissions` call in the editor to union all sub-source required origins on create/edit

## 6. OPML import / export

- [x] 6.1 Update `importOpml` handler in `apps/extension/src/shared/opml.ts` (or coordinator): build `sources: SmartSourceConfig[]` from valid feed entries; create one folder (name = feed name for 1 feed, "Feeds" for >1); skip and count invalid entries; return `{ imported, skipped }` where `imported` = valid source count
- [x] 6.2 Update `buildOpml` in `shared/opml.ts`: iterate `sources[]` per node; emit one `<outline>` per `source: 'rss'` entry; for multi-source folders use `${node.name} — ${host}` as `text`
- [x] 6.3 Update `FeedSubscriptions.svelte` confirm copy to "Found N feeds — import as one folder into:"; update success Toast copy to "Folder imported with N feeds" / "Folder imported with N feeds (M skipped)"; show error message when `imported === 0`
- [x] 6.4 Update Export button visibility check: present when any smart node has at least one `source: 'rss'` entry in its `sources[]`

## 7. Boundary and boot re-arm

- [x] 7.1 Update `BoundaryController.refreshBoundTabBoundaries`: item ids in `smartItemBindings` are now namespaced — behavior is unchanged (iterate slots, re-arm by `allowGlob`), but verify no code assumes non-namespaced ids
- [x] 7.2 Update `tabs.onUpdated` re-arm path: verify `smartItemBindings` lookup uses the full namespaced key (no change if it already uses the stored key verbatim)

## 8. Tests

- [x] 8.1 Unit tests for `sourceKey` helper: confirm `gitlab:gitlab.com`, `github:api.github.com` (GHE derivation), `rss:feeds.example.com`
- [x] 8.2 Unit tests for the updated connector modules: each `fetchRuntime` accepts `SmartSourceConfig` (not full node); `requiredOrigins` accepts `SmartSourceConfig`
- [x] 8.3 Integration test for the fan-out engine: a two-source folder (gitlab + github) produces two `smartFolders.result` events, each with a `sourceKey`
- [x] 8.4 Integration test for partial needs-access: one source ungranted → that section `needs-access`, other section fetches normally
- [x] 8.5 Unit tests for `importOpml` changes: 3 valid feeds → 1 folder with 3 sources; 2 valid + 1 invalid → 1 folder with 2 sources, `skipped: 1`; all invalid → no folder, `imported: 0`
- [x] 8.6 Unit tests for `buildOpml` changes: single-source rss node → 1 outline; multi-source (rss + gitlab) node → 1 outline (gitlab excluded); multi-source (rss + rss) node → 2 outlines with `host`-qualified `text`
- [x] 8.7 Update existing smart-folder unit tests and snapshots to use the `sources[]` shape

## 9. Verification and docs

- [x] 9.1 Run `pnpm verify` (tsc, biome, svelte-check, stylelint, vitest) — all green
- [ ] 9.2 Manual smoke: create a multi-source folder (gitlab + github), confirm both sections render with correct semantics and section headers
- [ ] 9.3 Manual smoke: import a 3-feed OPML — confirm exactly one folder is created with 3 sections in the pinned tree
- [ ] 9.4 Manual smoke: v7 → v8 migration — load a profile with existing single-source smart folders; confirm post-boot the folders look and behave identically (regression-free)
- [x] 9.5 Update `docs/architecture.md` to note the `sources[]` shape on the smart PinNode
