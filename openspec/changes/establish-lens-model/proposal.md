## Why

Today's "smart folders" are the seed of a much bigger idea (`docs/lenses-vision.md`):
typed, content-fitted views — a tickets board, a review queue — that link across
each other. That reinvention starts with a name and a seam. This change renames the
feature to **Lens** end-to-end (the word users see in the menu, the editor, and the
page) and adds a folder-level `lensKind` with a single kind, `general`, that behaves
exactly like today. No behaviour changes: every existing smart folder becomes a
`general` lens, byte-for-byte. It is the smallest plumbing for the named next change
**`review-lens`** (a typed `Change` entity + Review Queue page), which needs the
`lensKind` seam and the Lens vocabulary in place first — doing the rename now avoids
churn-on-churn when typed kinds land.

## What Changes

- **BREAKING (internal) — full `smart` → `lens` rename, no dual vocabulary.** Code,
  types, bus commands, persisted keys, specs, surfaces, and user-facing copy all
  become "Lens"/"Lenses". Identifier map (normative — see `docs/lenses-vision.md`):
  - `PinNode` discriminant `kind: 'smart'` → `kind: 'lens'`.
  - Types: `SmartSourceConfig` → `LensSource`; `ResolvedSourceConfig` →
    `ResolvedLensSource`; `SmartFolderItem` → `LensItem`; `SmartSectionRuntime` →
    `LensSectionRuntime`; `SmartFolderRuntime` → `LensRuntime`; `SmartQuery`,
    `SmartSource` → `LensQuery`, `LensProvider` *(value unions unchanged; only the
    type names rename)*.
  - `AppState` slices: `smartFolders` → `lenses`; `smartItemBindings` →
    `lensItemBindings`; `smartReadState` → `lensReadState`.
  - Bus commands: `createSmartFolder`/`updateSmartFolder`/`deleteSmartFolder` →
    `createLens`/`updateLens`/`deleteLens`; `openSmartItem` → `openLensItem`;
    `markSmartItemRead`/`markSmartItemUnread` → `markLensItemRead`/`markLensItemUnread`;
    `refreshSmartFolder` → `refreshLens`; `openSmartFolderListing` → `openLensListing`;
    `openSmartFolderPage` → `openLensPage`.
  - Surfaces: `SmartFolderEditor.svelte` → `LensEditor.svelte`; `SmartFolder.svelte`
    → `Lens.svelte`; `SmartSectionHeader.svelte` → `LensSectionHeader.svelte`;
    `launcher/folderpage/` (`FolderPage.svelte`, `FolderPageItem.svelte`,
    `folderpage.css`, `index.html`, `main.ts`) → `launcher/lenspage/`
    (`LensPage.svelte`, `LensPageItem.svelte`, `lenspage.css`, …); the manifest +
    `vite.config.ts` rollup input entry for the page updates accordingly.
  - Capability spec `smart-folders` → `lenses`.
  - Other same-family identifiers (surfaced while authoring the spec deltas): `markAllSmartItemsRead` → `markAllLensItemsRead`; `BoundaryController.configureSmartItemBoundary` → `configureLensItemBoundary`; `isFolderPageUrl` → `isLensPageUrl`; the OPML `SmartFolderNode` helper type → `LensNode`; `background/handlers/smart-folders.ts` → `background/handlers/lenses.ts`.
- **New folder-level field `lensKind: LensKind`** on the lens `PinNode`, where
  `LensKind = 'general'` in this change (a closed union widened by later typed-kind
  changes). `general` == today's untyped multi-provider bag; it is the only kind that
  may mix providers. The editor sets `lensKind: 'general'` on create.
- **One schema-version migration** (next version, `storage-and-migrations`): flips
  every `kind: 'smart'` node to `kind: 'lens'` and stamps `lensKind: 'general'`;
  renames persisted top-level keys `smartItemBindings` → `lensItemBindings` and
  `smartReadState` → `lensReadState`. The ephemeral runtime slice
  (`smartFolders` → `lenses`) is stripped before persist, so it needs only the code
  rename, no migration data. Backup envelope (`data-backup`) excludes those machine
  /ephemeral slices already; only their names change.
- **No new user-visible behaviour** beyond the word "Lens" in copy. RSS rich fields
  (`excerpt`/`imageUrl`/`publishedAt`) stay **flat** on `LensItem` (pure rename, no
  restructure) — they fold into an `article` bag in the later `reading-lens` change.
- **Out of scope:** any typed entity/adapter/page, cross-entity links, per-kind
  rendering. Those are named later phases that consume this seam.

## Capabilities

### New Capabilities
- `lenses`: the renamed `smart-folders` capability — every current requirement
  carried over verbatim except for the `smart`→`lens` vocabulary, **plus** a new
  requirement establishing the `lensKind` field and the `general` kind (== today's
  behaviour). This is the capability rename's destination.

### Modified Capabilities
- `smart-folders`: **retired** — all requirements REMOVED (they move to `lenses`).
  On archive this empties/deletes the `smart-folders` living spec.
- `storage-and-migrations`: new schema version migrating `smart`→`lens` (node
  discriminant, `lensKind: 'general'` stamp, persisted-key renames); the
  `SmartSourceConfig`/`smartReadState`/`smartItemBindings`/`markSmartItemRead`
  references in its requirements rename to the Lens identifiers.
- `typed-message-bus`: the smart-folder command names in its requirements rename to
  the Lens command set (`createLens`, `updateLens`, `deleteLens`, `openLensItem`,
  `refreshLens`, …) and the `smartItemBindings`/`smartFolders` references rename.
- `data-backup`: the `smartFolders` ephemeral-slice reference and "smart-folder"
  prose rename to `lenses`/"lens".
- `chrome-event-coordination`: `smartFolders` slice reference + "smart folder" prose
  rename.
- `launcher`: `smartFolders` reference + "smart folder" prose rename (the page-open
  launcher reach lives in a later change; only vocabulary changes here).
- `opml-import-export`: `SmartSourceConfig` reference + "smart folder" prose rename.
- `spaces-and-tabs`: "smart folder" prose rename (pinned-tree node kind wording).
- `visual-system`: "smart-folder" prose rename.
- `marketing-site`: "smart folder" landing-page copy rename to "lens".
- `lunma-bookmark-bindings`: "smart folder" prose rename.

### Removed Capabilities
- `smart-folders` (folded into the Modified list above as a full-REMOVE delta; named
  here for clarity — the capability ceases to exist after archive).

## Impact

- **Code (extension):** `shared/types.ts`, `shared/schemas.ts`, `shared/migrations.ts`,
  `shared/store.svelte.ts`, `shared/bus.ts`, `shared/messages.ts`, `shared/backup.ts`,
  `shared/connectors.ts`/`connector-origins.ts` (identifier refs), the
  `background/smart-folders.ts` engine (→ `background/lenses.ts`) + `background/connectors/*`,
  the sidebar surfaces (`SmartFolder*`, `SmartFolderEditor`, `SmartSectionHeader`, the
  `store-context` projection + `SidebarLocalState` field names), the page surface
  (`launcher/folderpage` → `launcher/lenspage`), and every `*.test.ts`/`*.spec.ts` +
  test harness referencing the old names. `manifest.json` + `vite.config.ts` page entry.
- **New public surface introduced by THIS change:** the `lensKind` field on the lens
  node + the `LensKind` type (value `'general'`); everything else is a 1:1 rename of
  an existing identifier (no other new types/methods/fields).
- **`ui/` primitives:** none added and none re-rolled — `LensEditor`/`LensPage`
  compose exactly the primitives `SmartFolderEditor`/`FolderPage` already compose
  (`Surface`, `Aurora`, `Icon`, `Button`, `Chip`, favicon helpers, …). Pure rename.
- **Docs (lockstep):** updates `docs/architecture.md` (surface list + capability name
  `smart-folders` → `lenses`, `launcher/lenspage`), and `docs/lenses-vision.md`
  (mark phase 1 in-progress). Leaves `docs/tech-stack.md` untouched (no dependency
  change). The capability specs update via this change's deltas on archive.
- **Migration safety:** one forward migration; existing data round-trips into
  `general` lenses with identical behaviour. No new dependencies, no new host
  permissions, no new persisted result state.
