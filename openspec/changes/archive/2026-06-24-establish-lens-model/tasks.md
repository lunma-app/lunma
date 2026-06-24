# Tasks — establish-lens-model

The rename is mechanical and identifier-wide; the safety net is the full gate
(`pnpm verify` + `pnpm test:e2e`). Work top-to-bottom — each section keeps the
build compiling before the next. No behaviour changes: every existing smart
folder becomes a `general` lens, byte-for-byte.

## 1. Types, schemas, migration (`shared/`)

- [x] 1.1 `shared/types.ts`: rename the `PinNode` smart branch to `kind: 'lens'` and add `lensKind: LensKind` (`type LensKind = 'general'`); rename `SmartSourceConfig`→`LensSource`, `ResolvedSourceConfig`→`ResolvedLensSource`, `SmartFolderItem`→`LensItem`, `SmartSectionRuntime`→`LensSectionRuntime`, `SmartFolderRuntime`→`LensRuntime`, `SmartSource`→`LensProvider`, `SmartQuery`→`LensQuery` (value unions unchanged). Rename the `AppState` slices `smartFolders`→`lenses`, `smartItemBindings`→`lensItemBindings`, `smartReadState`→`lensReadState`. Keep RSS rich fields (`excerpt`/`imageUrl`/`publishedAt`) flat on `LensItem`.
- [x] 1.2 `shared/schemas.ts`: rename `SmartSourceConfigSchema`→`LensSourceSchema`, `SmartFolderItemSchema`→`LensItemSchema`, `SmartFolderRuntimeSchema`→`LensRuntimeSchema`, `SmartReadStateSchema`→`LensReadStateSchema`; rename the current-version schema to `AppStateV11Schema` (lens branch: `kind: z.literal('lens')` + `lensKind: z.enum(['general'])` + `LensSourceSchema` entries; key renames; ephemeral `lenses` slice with `.default({})`). Update the `Persisted<T>`/`AssertEqual` coherence assertion to compare `z.infer<typeof AppStateV11Schema>` with `AppState`.
- [x] 1.3 `shared/migrations.ts`: bump `CURRENT_SCHEMA_VERSION` to `11`; append `{ toVersion: 11 }` — for each `PinNode` `kind === 'smart'` set `kind = 'lens'` + `lensKind = 'general'`, and rename top-level keys `smartItemBindings`→`lensItemBindings`, `smartReadState`→`lensReadState` (provider/query values + `queries[]` untouched).
- [x] 1.4 Migration tests (`shared/migrations.test.ts` or sibling): a v10 envelope with a `smart` node + `smartItemBindings`/`smartReadState` migrates to a `lens` node (`lensKind: 'general'`) with renamed keys; idempotence; provider/query values unchanged; validates under `AppStateV11Schema`.
- [x] 1.5 `shared/backup.ts` + backup tests: the exclusion list (`smartFolders`→`lenses`, `smartItemBindings`→`lensItemBindings`) renames; `PortableAppState` references unchanged in shape.

## 2. Store, bus, messages (`shared/`)

- [x] 2.1 `shared/store.svelte.ts`: rename the slices and methods — `addLens`, `updateLens`, `deleteLens`, `setLensSectionRuntime`, `setLensRuntime`, `dropLensBindings`, `pruneLensReadState`, `markLensItemRead`, `markLensItemUnread`, `markAllLensItemsRead`, `setLensSectionCollapsed`, `setLensSectionRevealRead`, and the `SidebarLocalState` fields `collapsedLensSectionsByWindow`/`revealedReadLensSectionsByWindow`.
- [x] 2.2 `shared/bus.ts`: rename the command kinds + Zod schemas — `createLens`, `updateLens`, `deleteLens`, `refreshLens`, `openLensItem`, `markLensItemRead`/`markLensItemUnread`, `openLensListing`, `openLensPage`; the `PinNode` mirror's `smart`→`lens` member.
- [x] 2.3 `shared/messages.ts`: the `lenses.result` connector event; any `smartFolders` references.

## 3. Background engine + connectors

- [x] 3.1 Rename `background/smart-folders.ts`→`background/lenses.ts` and `background/handlers/smart-folders.ts`→`background/handlers/lenses.ts`; rename internal symbols (`fetchLensSectionRuntime`, `startLensRefresh`, `resolvedConfigs`, `sourceKey`, `CONNECTORS`) and the alarm `lunma/smart-folders-poll`→`lunma/lenses-poll`. Update all importers.
- [x] 3.2 Connectors (`background/connectors/*`): rename `ResolvedSourceConfig`→`ResolvedLensSource` and `SmartFolderItem`→`LensItem` references; `requiredOriginsForConfig` unchanged in behaviour.
- [x] 3.3 Coordinator: the `source: 'connector'` `lenses.result` event member + drain handler.
- [x] 3.4 Boundary controller: `configureSmartItemBoundary`→`configureLensItemBoundary`; the smart-item re-arm paths (`tabs.onUpdated`, boot `refreshBoundTabBoundaries`) read `lensItemBindings`.

## 4. Sidebar surfaces

- [x] 4.1 Rename `sidebar/SmartFolder.svelte`→`Lens.svelte`, `SmartFolderEditor.svelte`→`LensEditor.svelte`, `SmartSectionHeader.svelte`→`LensSectionHeader.svelte` (+ their `.test.ts`/harness siblings). Update `PinnedTabs.svelte`/`FolderRow.svelte` importers and the `node.kind === 'lens'` branch.
- [x] 4.2 `sidebar/store-context.svelte.ts`: project the renamed slices/fields (`lenses`, `collapsedLensSectionsByWindow`, `revealedReadLensSectionsByWindow`).
- [x] 4.3 Editor stamps `lensKind: 'general'` on create (`createLens` payload).

## 5. Lens page surface (`launcher/lenspage`)

- [x] 5.1 Rename `launcher/folderpage/`→`launcher/lenspage/`: `FolderPage.svelte`→`LensPage.svelte`, `FolderPageItem.svelte`→`LensPageItem.svelte`, `folderpage.css`→`lenspage.css`, `index.html`, `main.ts` (+ tests). Rename `isFolderPageUrl`→`isLensPageUrl`.
- [x] 5.2 `manifest.json` + `vite.config.ts`: rename the rollup input key `folderpage`→`lenspage` and the page path; confirm the page is reachable at `…/launcher/lenspage/index.html`. The `openLensPage` command targets the new URL.

## 6. Launcher search + OPML

- [x] 6.1 `launcher/shared/providers/*`: the lens-items provider reads `state.lenses`; the result `source: 'smart'`→`'lens'` (and the `LauncherResult` source union member + `sourceBadgeLabel`); dedup/ranking weight strings updated. Update launcher tests.
- [x] 6.2 `shared/opml.ts`: `SmartFolderNode`→`LensNode`, `SmartSourceConfig`→`LensSource`; `buildOpml`/`importOpml` unchanged in behaviour. Update opml tests + options Feed-subscriptions card.

## 7. Tests, harnesses, e2e

- [x] 7.1 Rename all remaining `*.test.ts` identifiers + `*.test.harness.svelte` to the lens names.
- [x] 7.2 e2e: rename `e2e/smart-folder-page.spec.ts`→`e2e/lens-page.spec.ts` and `e2e/smart-folder-bindings.spec.ts`→`e2e/lens-bindings.spec.ts` (+ their internal selectors/copy assertions for "Lens").

## 8. Marketing site (`apps/site`)

- [x] 8.1 Rename "smart folder(s)"→"lens"/"lenses" in the features copy (`Chapters.svelte`/`FromArc.svelte`/etc.), `seo.ts` title/description, and the `/privacy` page copy ("connects a lens to a service"). Keep voice; run the `lunma-voice` tell-hunter pass on changed copy.
- [x] 8.2 Confirm `apps/site` verify (WCAG-AA contrast test + static prerender build) stays green.

## 9. Docs (lockstep)

- [x] 9.1 `docs/architecture.md`: rename the surface (`launcher/lenspage`), the capability (`smart-folders`→`lenses`), and the layer-map/surface-list wording.
- [x] 9.2 `docs/lenses-vision.md`: mark phase 1 (`establish-lens-model`) in-progress in the roadmap/decisions log.
- [x] 9.3 Known limitation: the `opml-import-export` living spec's `## Purpose` keeps "RSS smart-folder subscriptions" (a delta cannot edit `## Purpose`). Decide: accept until a Purpose-touching mechanism exists, or open a tiny follow-up. Record the decision here.
- [x] 9.4 Spec fix (pre-apply): launcher delta extended with MODIFIED deltas for "Acting on a launcher result" and "Launcher Space scope" (both had `smart`/`smart-folder` references that would have survived archive). `chrome-event-coordination` delta's stale `AppStateV5Schema` reference corrected to `AppStateV11Schema`.

## 10. Verify & finalize

- [x] 10.1 `pnpm verify` at the workspace root — green (tsc, biome incl. the layer DAG + cross-app guard, svelte-check, lint:styles, vitest across both apps).
- [x] 10.2 `pnpm test:e2e` — green.
- [x] 10.3 `openspec validate establish-lens-model --strict` — green; then archive (applies the capability rename: creates `lenses`, retires `smart-folders`, plus the 10 cross-capability deltas).
