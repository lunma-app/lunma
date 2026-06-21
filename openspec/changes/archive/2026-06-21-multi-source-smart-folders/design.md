## Context

Today's smart node is a leaf with a flat connector triple: `source`, `baseUrl`,
`query?`. The connector engine, runtime slice, item bindings, editor, and OPML
pipeline are all built around exactly one source per folder. The goal is to widen
that to `sources: SmartSourceConfig[]` while keeping single-source folders
regression-free (they look and behave identically to today — only the storage shape
changes).

The constraint driving design choices throughout: Phase 2 (`merged-smart-folder-layout`)
will want to sort across sections; Phase 3 (`nested-pinned-folders`) will want
folder-in-folder. Neither can land until this change's `sources[]` foundation is live.

**Current state files:**
- `apps/extension/src/shared/types.ts` — `PinNode` smart branch, `SmartFolderRuntime`
- `apps/extension/src/shared/schemas.ts` — `CURRENT_SCHEMA_VERSION = 7`, `PinNodeSchema`
- `apps/extension/src/background/smart-folders.ts` — engine, alarm, per-folder fetch
- `apps/extension/src/background/connectors/connector.ts` — `SourceConnector`, `boundedFetch`
- `apps/extension/src/shared/connector-origins.ts` — `requiredOriginsForNode`
- `apps/extension/src/sidebar/SmartFolder.svelte`, `SmartFolderEditor.svelte`
- `apps/extension/src/shared/opml.ts`, `apps/extension/src/options/FeedSubscriptions.svelte`

## Goals / Non-Goals

**Goals:**
- Replace `source`/`baseUrl`/`query?` on the smart node with `sources: SmartSourceConfig[]`
- Fan out the connector engine per sub-source; produce per-section runtime
- Per-section host-permission gate (partial grants allowed)
- Namespace `smartItemBindings` itemId by sourceKey (prevent cross-source collisions)
- Sectioned render in `SmartFolder.svelte` (one section per sub-source)
- Editor gains sub-source add/remove/reorder list
- `importOpml` creates one multi-source RSS folder with N sources
- Schema v7 → v8 + migration wrapping existing nodes

**Non-Goals:**
- Merged / interleaved list (requires item `sortKey` / `publishedAt` — Phase 2)
- Folder-in-folder nesting or recursive drag/drop (Phase 3)
- Mixing semantics in a *merged* single list — allowed in Phase 1 but always sectioned
- Per-section `refreshMinutes` or `hideRead` (these stay folder-level in Phase 1)

## Decisions

### D1: `sources: SmartSourceConfig[]` replaces the flat source triple

**Chosen shape:**
```ts
type SmartSourceConfig = {
  source: SmartSource;
  baseUrl: string;
  query?: SmartQuery;
};

// smart PinNode:
{
  kind: 'smart';
  id: FolderId;
  name: string;
  icon: string;
  sources: SmartSourceConfig[];   // ← replaces source/baseUrl/query?
  maxItems: number;
  hideRead: boolean;
  refreshMinutes: number;
}
```

**Rejected alternatives:**
- A `multi` kind wrapping individual `smart` nodes — adds an extra nesting layer in the
  pinned tree type without structural benefit; single-kind is simpler.
- Keeping root-level `source` + adding an optional `sources[]` — dual-path logic at
  every call site, harder to migrate cleanly.

### D2: Section identity key = `${source}:${new URL(baseUrl).host}`

Each section is keyed by `sourceKey: string` derived from its `SmartSourceConfig`.
Used in the runtime map, in `smartItemBindings`, and in the editor list.

```ts
function sourceKey(cfg: SmartSourceConfig): string {
  return `${cfg.source}:${new URL(cfg.baseUrl).host}`;
}
// 'gitlab:gitlab.com', 'github:api.github.com', 'rss:hn.algolia.com'
```

**Why not array index?** Fragile to reordering in the editor — a reorder would silently
re-key every section's runtime and stale the bindings.

**Why not UUID per entry?** Would require persisting the UUID on each `SmartSourceConfig`,
widening the schema further and complicating the migration.

**Collision handling:** Two entries with the same `(source, host)` are structurally
identical — the editor SHALL prevent adding a duplicate (same `sourceKey`). If a duplicate
somehow lands in storage it resolves to the same section (last-write wins in the runtime).

### D3: `maxItems` applies per-section (not a folder-level total)

Each section shows up to `node.maxItems` rows (queue cap) or up to `node.maxItems` unread
rows (feed budget). The folder total can be up to `N × maxItems` across sections.

**Rejected alternative: folder-level total, split evenly.** Hard to implement fairly
(queue sources return at most 20 from the API; feed sources have variable unread). Phase 2
can introduce a folder-level `totalCap` for the merged layout if desired.

**UX note:** Users set `maxItems` per folder in the editor. With multiple sections, the
doc hint reads "per section". Default `maxItems: 10` for new multi-source folders.

### D4: OPML import always creates a NEW folder with N sources

`importOpml { spaceId, feeds }` creates **one** RSS smart folder named "Feeds" (or the
channel title when only one feed) with one `SmartSourceConfig` per parsed entry.

**Rejected alternative: merge into an existing folder.** Ambiguous: which folder? What
if it already has sources from that host? Creating new is unambiguous, reversible, and
the existing editor allows post-import cleanup.

**Naming:** When `feeds.length === 1`, the folder name is the feed's `name`; when > 1,
it is `"Feeds"` (the user can rename in editor). The OPML-imported folder uses the same
`maxItems: 10` / `refreshMinutes: 30` defaults as today's per-feed folders.

### D5: Migration derives `sourceKey` to re-key existing `smartItemBindings`

The v7 → v8 migration:
1. Wraps each `smart` node's `(source, baseUrl, query?)` into `sources: [{ source, baseUrl, query }]`.
2. For each `smartItemBindings[folderId]`, finds the corresponding migrated node's `sources[0]`,
   derives its `sourceKey`, and renames every itemId from `nativeId` to `${sourceKey}:${nativeId}`.
   — If no matching node is found (orphaned binding), the folderId entry is **dropped** (already
   the correct behaviour — orphaned bindings are pruned).

**Rejected alternative: drop all bindings.** Simpler but would cause all smart-item bound tabs to
silently lose their pin-tab treatment after the upgrade, which is surprising.

**Why migration can read pinned nodes:** `runMigrations` receives the full raw state object; the
pinned tree is available as `raw.pinnedBySpace`.

### D6: Section headers shown only when folder has ≥ 2 sources

A single-source folder renders identically to today (no section header, no regression).
A multi-source folder renders a micro-header row before each section's items.

**Section header anatomy:**
- Source icon (Lucide glyph matching the source connector's `mintedIcon`) at the favicon column
  width, in `--text-dim`
- Host label (`new URL(cfg.baseUrl).host`) in `--text-muted`, `--font-size-xs`
- `12px` height, `4px` top padding — visually a divider, not a full row
- Not interactive (no expand/collapse; sections are always visible when parent is open)
- Inherits the folder's child inset

### D7: `SmartFolderRuntime` becomes a sectioned map

```ts
type SmartSectionRuntime = {
  state: 'pending' | 'ok' | 'signed-out' | 'error' | 'needs-access';
  items: SmartFolderItem[];
  fetchedAt: number | null;
};

type SmartFolderRuntime = {
  sections: { [sourceKey: string]: SmartSectionRuntime };
};
```

The folder's roll-up `state` (for the top-level spinner, ghost rows on first-ever open)
is derived by the sidebar from the section states: `pending` if any section is `pending`
and no section is `ok`; `ok` if all sections are `ok` (or the folder has been fetched at
least once); `error` if all sections are `error`/`signed-out`/`needs-access`. The badge
sums per-section attention counts.

**Why no top-level roll-up stored in the runtime?** Avoids double-broadcasting; the sidebar
derives what it needs from `sections`. The pending-ghost-rows trigger is the absence of any
`ok` section with items in the folder's component memory.

## Visual language

**Existing surface** — SmartFolder is a sidebar feature component. This change adds
a sectioned layout within an expanded folder; no new surfaces ship.

**Section headers** (when ≥ 2 sources):
- `12px` height, `4px` vertical padding; exact same leading inset as child rows.
- Source icon: `16×16` from the `Icon` primitive, `color: var(--text-dim)`.
- Host label: `--font-size-xs` (`11px`), `color: var(--text-muted)`, single line, truncated.
- No border, no background — reads as a quiet divider above the section's rows.
- Rendered via a new `SmartSectionHeader.svelte` component (composed of `Icon`, no
  new primitives needed).

**Motion:** The parent expand/collapse motion (`FolderRow`) is unchanged. Section headers
appear instantly with the parent expansion (no additional stagger). Items within each
section follow the existing item enter/exit timing (`--motion-fast`, 120ms). Under
`prefers-reduced-motion` no changes — sections are not individually animated.

**Partial needs-access state:** A section in `needs-access` renders the existing calm
grant row inline, inside its section, with the section header above it. Other sections
below still render normally. No new visual tokens needed.

**Badge:** Sums per-section attention counts (integer addition). The `N+` cap triggers
when ANY section has hit its `maxItems` cap. Colour and placement unchanged.

**Editor sub-source list:**
- Each entry: source chip (coloured pill using `--space-c-soft` of the source) + host
  label + remove `×` button.
- Add button below the list: `+ Add source` ghost `Button` (existing primitive).
- Reorder via `Move up` / `Move down` on each entry (matching the existing pinned-row
  keyboard-reachable pattern).
- Empty folder is valid in the editor (user is mid-adding-sources), but confirming with
  zero sources is blocked (disabled Confirm button).

## Risks / Trade-offs

**sourceKey stability** — If the user changes a section's `baseUrl` host in the editor,
the `sourceKey` changes, and existing `smartItemBindings` for that section become orphaned
(tabs silently lose their pin-tab treatment). Mitigation: when the editor saves a `baseUrl`
change, the SW's `updateSmartFolder` handler drops all bindings for the old `sourceKey`
in that folder (matching `deleteSmartFolder` demote behaviour). Bindings re-establish on
next open.

**Migration complexity** — The v7 → v8 migration reads the pinned tree to remap bindings.
This is more complex than prior pass-through migrations. Mitigation: unit-tested with a
synthetic raw state; migration is pure (no I/O) and synchronous.

**Per-section `maxItems` means a folder can show more rows than today** — A 3-section
folder with `maxItems: 20` can show up to 60 rows. Mitigation: default for new multi-source
folders is `maxItems: 10`; the editor shows "per section" in the label.

**Mixed-kind sections (queue + feed in one folder)** — Allowed but complex to render
cleanly (two different row glyphs, one `hideRead` toggle affecting only feed sections).
Mitigation: `hideRead` and "Mark all read" actions in the folder menu apply only to
feed sections; queue sections are unaffected and the menu items are absent when the folder
contains no feed sections.

## Migration Plan

**Deploy (automatic at SW boot):**
1. Version gate detects `schemaVersion: 7` → runs v8 migration.
2. Migration wraps each `smart` PinNode: `{ source, baseUrl, query } → { sources: [{ source, baseUrl, query }] }`.
3. Migration re-keys each `smartItemBindings` entry as described in D5.
4. Validates against `AppStateV8Schema`.
5. Writes back `{ schemaVersion: 8, state }`.

**Rollback:** No automatic rollback (Chrome extension MV3, no rollback mechanism).
A downgrade to the pre-v8 build would fail the version gate (future version > current)
and quarantine — which is the existing behaviour for any downgrade.

**No data loss:** Smart folder configurations and item bindings are preserved; behaviour
for existing single-source folders is identical.

## Open Questions

_Resolved before tasks are written:_
- Q1: Should the editor allow reordering of sources? **Yes** — via Move up / Move down,
  same pattern as the pinned row keyboard reorder. sourceKey is index-independent.
- Q2: What is the folder name default when `importOpml` creates a multi-feed folder?
  **"Feeds"** for >1 feeds; the feed's own `name` for exactly 1 feed.
- Q3: Does `refreshSmartFolder { folderId }` trigger all sections or a specific one?
  **All sections** (it is a folder-level manual refresh).
