# Plan — Multi-source smart folders (Phase 1 of 3)

## Context

Today the pinned tree is flat and single-level (`apps/extension/src/shared/types.ts:156`):
`folder.children` holds `SavedTabId[]` only (never nested folders), and a `smart`
node is a leaf wired to **exactly one** connector source + one query + one baseUrl.

That makes two real workflows impossible:
1. **One folder aggregating multiple sources** — e.g. GitLab MRs *and* GitHub PRs
   in a single review folder.
2. **Tidy grouping of many feeds** — an OPML import creates one `rss` smart folder
   *per feed* (`importOpml` calls `createSmartFolder` per entry), so a 30-feed OPML
   becomes 30 sibling folders cluttering the pinned section.

Exploration settled on a unifying model: **aggregation vs nesting is a *layout* of a
container of sources, not two data models.** A `sectioned` layout gives the
"one folder, many sources" feel while keeping each section's kind semantics intact —
which sidesteps the spec's pervasive queue-vs-feed dichotomy (status dots + caps vs
unread + draining read-state). A `merged` interleaved list and true folder-in-folder
nesting are higher-cost follow-ons.

## Decision: one change now, not three

Create **only the Phase 1 change**. Phase 2 (merged layout) and Phase 3 (nesting)
are proposed later, each against the post-archive `smart-folders` spec — because
OpenSpec deltas apply to the living spec, and all three phases `MODIFY` overlapping
requirements. The 3-phase roadmap is recorded in Phase 1's proposal so the
forward-looking `sources[]` shape is justified (named upcoming consumers).

```
 Phase 1  multi-source smart folder, SECTIONED      ← THIS CHANGE
            change: multi-source-smart-folders
 Phase 2  MERGED layout (item sortKey, dedup,        ← later, vs post-P1 spec
            unified same-kind read/status)
            change: merged-smart-folder-layout
 Phase 3  true folder nesting (recursive DnD, depth) ← later, vs post-P2 spec
            change: nested-pinned-folders
```

## Phase 1 proposal — `multi-source-smart-folders`

### Why (user value)
A single smart folder can watch several sources at once, rendered as sections.
GitLab MRs + GitHub PRs live in one "Reviews" folder; an OPML import lands as one
"Feeds" folder with N feed sections instead of N sibling folders. Named upcoming
consumers: Phase 2 (merged layout) and Phase 3 (nesting) build on this `sources[]`
foundation.

### What changes (scope)
- **Data model** (`shared/types.ts`, `shared/schemas.ts`): the `smart` node holds
  `sources: SmartSourceConfig[]` (each `{ source, baseUrl, query? }`) instead of the
  flat `source`/`baseUrl`/`query` trio. Folder-level keeps `name`, `icon`,
  `maxItems`, `refreshMinutes`, `hideRead`. Schema bump (v7 → v8) + migration that
  wraps every existing single-source node as `sources: [<that source>]` (no
  behaviour change for current folders).
- **Connector engine** (`background/smart-folders.ts`, `CONNECTORS` registry): fan
  out per sub-source, produce a **per-source runtime**; the folder's runtime becomes
  a map of sections. `requiredOrigins` is the **union** across sub-sources; the
  needs-access gate resolves **per section** (partial grants allowed — GitLab granted,
  GitHub not).
- **Bindings** (`smartItemBindings`, boundary scripts): namespace `itemId` by source
  within a folder (native ids can collide across sources).
- **Rendering** (`sidebar/SmartFolder.svelte`, `PinnedTabs.svelte`, `ui/FolderRow`):
  sectioned layout — one section per source, each keeping its own kind semantics
  (queue → status dots + cap; feed → unread + draining). One-glyph restraint holds
  per row. Folder badge = sum of per-section attention counts.
- **Editor** (`sidebar/SmartFolderEditor.svelte`): add/remove/list of sub-sources,
  each with its own source / baseUrl / query.
- **OPML import** (`opml-import-export`): `importOpml` creates **one** `rss` folder
  with N feed sources (target-space picker unchanged); export walks the sources list.

### Out of scope (deferred)
- Merged/interleaved single list and the item `sortKey` it requires → Phase 2.
- Mixing semantics in a *merged* list (read-state vs status, badge meaning) → Phase 2.
  (Mixed sources ARE allowed in Phase 1, but render **sectioned**, so the dichotomy
  is preserved.)
- Folder-in-folder nesting, recursive drag/drop, depth caps → Phase 3.

### Specs touched
`smart-folders` (heavy), `storage-and-migrations` (schema v8 + migration + bindings
shape), `opml-import-export` (one-folder import/export). Possibly
`spaces-and-tabs` only if the pinned-tree composition wording needs a sections note
(likely not — no nesting in P1).

### Open design points (resolve in design.md)
- Per-section cap vs one folder-level `maxItems` applied per section.
- Runtime slice shape: `smartFolders[folderId]` → per-source sub-runtimes + a folder
  roll-up state for the badge/needs-access summary.
- Editor UX for an empty folder vs a multi-section folder.

## Verification (Phase 1)
- `pnpm verify` at root (tsc, biome incl. layer DAG, svelte-check, stylelint, vitest).
- Migration unit test: a v7 single-source node loads as a one-section folder,
  unchanged behaviour.
- Connector test: a two-source folder (gitlab + github) fans out, renders two
  sections, and a partial host grant shows one section in `needs-access` while the
  other fetches.
- OPML import test: a 3-feed OPML yields **one** folder with 3 sections.
- `pnpm test:e2e` smoke for the sectioned render + editor add/remove.

## Next step
On approval, run `/openspec-propose` for `multi-source-smart-folders` to author
proposal.md, design.md, the spec deltas, and tasks.md.
