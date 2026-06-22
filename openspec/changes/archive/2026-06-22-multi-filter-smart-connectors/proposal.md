## Why

A smart folder can hold one section per connector instance, but not two **filters**
of the same instance. Today the section identity is `sourceKey(cfg) = ${source}:${host}`
(`background/smart-folders.ts:52`), which deliberately drops `query`, and the editor
enforces it as a silent dedupe (`SmartFolderEditor.svelte:228` refuses a second entry
whose source+host collides). So a user who wants one folder showing their GitLab
**authored** MRs *and* their GitLab **review-requested** MRs cannot build it — the second
filter collapses onto the first. The canned filter (`authored | assigned | review-requested`)
is a real identity axis the model pretends doesn't exist: a filter is being modelled as if
it were a whole new source.

This change delivers a directly user-visible improvement: a single smart folder can mix
multiple filters of the same connector instance (and across instances), each as its own
section — the natural "everything that needs me" workspace pin that the multi-source model
was reaching for but couldn't express.

## What Changes

- **BREAKING (persisted schema v8 → v9).** `SmartSourceConfig` changes from
  `{ source, baseUrl, query? }` to `{ source, baseUrl, queries: SmartQuery[] }` — one entry
  per connector **instance** (source+host), `queries` is the set of canned filters for that
  instance. Queue sources (gitlab/github/jira) carry a non-empty `queries`; feed sources
  (rss) carry an empty `queries` (rss has no filter axis). A v8→v9 migration rewrites
  `{source, baseUrl, query}` → `{source, baseUrl, queries: [query]}` and rss
  `{source, baseUrl}` → `{source, baseUrl, queries: []}`.
- Section identity gains the filter axis: `sourceKey` becomes `${source}:${host}:${query}`
  for queue sections and `${source}:${host}` for rss (no query). A new per-section type
  `ResolvedSourceConfig` (`{ source, baseUrl, query? }`) is the unit a connector fetches; the
  engine expands each `SmartSourceConfig` over its `queries[]` into `ResolvedSourceConfig`s via a
  new `resolvedConfigs(node): ResolvedSourceConfig[]` helper, one per filter (fetch/runtime/binding
  unit). `smartItemBindings` (already namespaced `${sourceKey}:${nativeId}`) inherits the finer key.
- **UI-1 flat render.** Each expanded (connector, filter) pair renders as a flat section
  whose header reads `host · filter` (e.g. `gitlab.com · authored`, `gitlab.com · reviewing`,
  `github.com · authored`). No nesting. A folder with exactly one section renders identically
  to today (no header).
- **Editor.** The per-entry form becomes one card per connector instance with a multi-select
  of filters (checkboxes: authored / assigned / review-requested; hidden for rss). Adding
  GitLab once and ticking two filters yields two sections — replacing today's
  one-row-per-filter dedupe wall.
- The connector `SourceConnector.fetchRuntime(cfg, …)` contract is unchanged in shape but its
  parameter type narrows to `ResolvedSourceConfig`; the engine's `fetchSmartSectionRuntime` and
  `sourceKey` likewise take `ResolvedSourceConfig`. The engine expands `queries[]` to single-query
  per-section cfgs **before** dispatch, so a connector still receives one resolved filter per call.
- **New primitive:** `Chip.svelte` gains a `selected`/pressed toggle state (`aria-pressed`), so the
  editor's filter multi-select composes selectable filter pills rather than hand-rolling a checkbox.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `smart-folders`: `SmartSourceConfig` gains `queries: SmartQuery[]` (replacing `query?`);
  `sourceKey` gains the per-filter axis; results are sectioned per (instance × filter); the
  editor authors filters as a per-instance multi-select; per-section gating, rendering, badge
  math, and the `smartItemBindings` namespace all key on the finer `sourceKey`.
- `storage-and-migrations`: a v8 → v9 migration rewrites every smart node's `sources[]`
  entries from the `query?` shape to the `queries[]` shape (queue → `[query]`, rss → `[]`).

## Impact

- **Types/schemas:** `shared/types.ts` (`SmartSourceConfig` reshaped; new `ResolvedSourceConfig`),
  `shared/schemas.ts` (`SmartSourceConfigSchema`, `PinNodeSchema`, `AppStateV9Schema`),
  `shared/migrations.ts` (the `{ toVersion: 9 }` migration).
- **Engine:** `background/smart-folders.ts` (`sourceKey(cfg: ResolvedSourceConfig)`, new
  `resolvedConfigs(node)` helper, `fetchSmartSectionRuntime(cfg: ResolvedSourceConfig, …)`, the
  per-folder fan-out that expands `queries[]`), `background/handlers/smart-folders.ts`
  (create/update validation of `queries`).
- **Connector contract:** `background/connectors/connector.ts` — `SourceConnector.fetchRuntime`,
  `listingUrl`, `requiredOrigins` narrow to `ResolvedSourceConfig`.
- **Sidebar:** `SmartFolderEditor.svelte` (per-instance filter multi-select),
  `SmartFolder.svelte` + `SmartSectionHeader.svelte` (the `host · filter` header label).
- **Connector origins:** `shared/connector-origins.ts` — `requiredOriginsForConfig(cfg: ResolvedSourceConfig)`
  (origins are query-independent, so the union logic is unchanged).
- **UI primitives composed:** `Button`, `Icon`, the existing `SmartSectionHeader` (composed of
  `Icon`). **Primitive change:** `Chip.svelte` gains a `selected`/pressed toggle state (the editor
  composes selectable filter pills) — no brand-new primitive file.
- **Docs:** updates `docs/architecture.md` where it names the source/section model. Leaves
  `docs/tech-stack.md` untouched (no stack change).
- **Migration risk:** persisted v8 smart nodes in the wild — covered by the v8→v9 migration
  and a round-trip test.
