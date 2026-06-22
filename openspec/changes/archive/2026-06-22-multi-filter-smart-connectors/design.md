## Context

The `2026-06-21-multi-source-smart-folders` change (archived) introduced
`sources: SmartSourceConfig[]` on a smart `PinNode`, letting one folder hold several
connector instances, each rendered as a section keyed by
`sourceKey(cfg) = ${source}:${new URL(baseUrl).host}`. That key intentionally excludes the
canned `query`, with the in-code rationale "two configs with the same source + host always
land in the same section regardless of query" (`background/smart-folders.ts:48-54`). The
editor enforces it as a hard dedupe (`SmartFolderEditor.svelte:228`).

The unintended consequence: a connector instance is permitted exactly one filter per folder.
A user wanting GitLab **authored** and GitLab **review-requested** side by side in one folder
cannot build it — the second entry collides and is silently dropped. The filter axis
(`authored | assigned | review-requested`) is a first-class dimension of "what work needs me"
that the model collapses away.

This change makes the filter a real identity axis. It is a breaking persisted-schema change
(v8 → v9) plus a render/editor refresh. The full picture (current vs. target identity, the
flat-vs-two-level model) was worked out in an explore session and is captured in the proposal.

## Goals / Non-Goals

**Goals:**
- One smart folder can hold multiple filters of the same connector instance, each as its own
  section (GitLab authored + GitLab reviewing + GitHub authored in one folder).
- The filter stops masquerading as a source: the editor authors filters as a per-instance
  multi-select, not as duplicate "source rows".
- Identity, runtime, bindings, gating, and render all key on a single derivation that now
  includes the filter, with no drift between SW and sidebar.
- Existing persisted folders migrate losslessly to the new shape.

**Non-Goals:**
- Nested / grouped render (the UI-2 "connector group → filter sub-sections" option was
  considered and rejected for this change — flat UI-1 only).
- Folder-level filter "lens" that re-slices all connectors at once (UI-3) — out of scope.
- Free-form / custom queries. The canned `SmartQuery` set is unchanged.
- Cross-section dedup of an item that matches two filters (see Decision 4).
- Any change to connector auth ladders, polling cadence, or the read-queue (rss) semantics.

## Decisions

### D1 — Two-level model: a connector instance owns a set of filters

`SmartSourceConfig` becomes `{ source: SmartSource; baseUrl: string; queries: SmartQuery[] }`.
One entry per connector **instance** (source+host). Queue sources carry a non-empty `queries`;
rss carries `queries: []` (rss has no filter axis — its feed URL is the selector).

*Alternative considered (DM-A): keep `sources[]` flat and just fold `query` into `sourceKey`
(`source:host:query`).* Rejected as the primary model because it bakes "one source row per
filter" into the editor — the exact conflation the user is reacting against. We adopt DM-A's
*key* derivation (D2) but author it from the cleaner two-level config (D1), so the editor reads
"add GitLab, tick the filters."

### D2 — Section identity = instance × filter; the engine expands before dispatch

`sourceKey` is computed from a **resolved single-query cfg** and becomes
`${source}:${host}:${query}` for queue sections, `${source}:${host}` for rss (no query). The
poll fan-out (`startSmartFolderRefresh`) iterates `node.sources`, then for each entry iterates
its `queries[]` (or a single rss pass), producing per-filter resolved cfgs
`{ source, baseUrl, query }` that are the unit of `fetchRuntime`, `setSmartSectionRuntime`, and
the `smartItemBindings` namespace.

This keeps the `SourceConnector.fetchRuntime(cfg, maxItems, caches?)` contract **shape-stable**:
a connector still receives exactly one resolved filter per call and never sees `queries[]`. The
expansion is the engine's job. `sourceKey(cfg)` therefore takes a resolved single-query cfg, and
a small helper `resolvedConfigs(node): ResolvedSourceConfig[]` performs the `sources[] × queries[]`
expansion used by the engine, the origin union, and the editor's section preview.

### D3 — UI-1 flat render: `host · filter` section headers

Each resolved section renders flat (no nesting). `SmartSectionHeader.svelte` composes the source
`Icon` + a header label that is `host` when the folder has one section, else `host · filter`
(e.g. `gitlab.com · authored`). A folder with exactly one resolved section renders identically to
today (no header). The filter label reuses the editor's query labels ("Authored", "Assigned",
"Reviewing"/"Watching" per source).

### D4 — Overlap is honest; no cross-section dedup

An item that matches two filters (authored **and** review-requested) appears in both sections.
Buckets are honest — each section is "the answer to that filter." The folder badge sums
per-section attention counts, so such an item counts once per section it appears in. *Alternative:
dedup across a connector's sections.* Rejected: it muddies "this section = this filter," requires
a merge identity across queries, and surprises the user who deliberately added both filters.

### D5 — Fetch granularity: independent per-section, shared per-connector caches

Each resolved section fetches independently (GitLab authored+assigned+reviewing = 3 requests per
poll), under the existing bounded concurrency. To avoid N me-resolution calls, `ConnectorCaches`
(the `/user` resolution etc.) is shared across a connector instance's filters **within one poll
cycle**, so `<me>` is resolved once per (instance, poll) and reused by that instance's filter
fetches. Independent sections preserve independent `signed-out` / `error` / `needs-access` states
per filter — the calm-failure model is unchanged, just finer-grained.

### D6 — Editor: per-instance card with a filter multi-select

The per-entry form becomes one card per connector instance: source chip + host/URL + a filter
multi-select (checkboxes authored / assigned / review-requested; hidden for rss). The "Add source"
dedupe now keys on `source:host` (one card per instance) and **merges** filter selections rather
than dropping a colliding add. Confirm is blocked when `sources` is empty OR any queue instance
has zero filters ticked. A filter add/remove on an existing instance triggers a refetch of only
the affected sections.

## Visual language

This change touches two surfaces — the `SmartFolderEditor` (new filter multi-select) and the
expanded smart folder (new `host · filter` section headers). Both inherit the existing immersive
substrate (aurora backdrop, frosted-glass panels, the active Space hue); nothing here introduces a
new colour or motion family — it extends two existing ones.

- **Filter pills (`Chip` selected state).** Resting pills sit at the chip's normal muted treatment;
  a **selected** pill fills with `--space-c-soft` (the same Space-hue soft fill the source chip
  already uses) with `--text` label and a leading check `Icon`, so "ticked" reads at a glance
  without a separate checkbox column. State matrix on the toggle: hover lifts background one step;
  `:active` uses the standard `--press-scale`; focus shows the shared focus-ring geometry;
  `disabled` (e.g. a filter not applicable to a source) drops to `--text-dim` with no press. Toggling
  is a 150ms `--ease-standard` background/opacity tween — no layout shift, no strobe. `aria-pressed`
  carries the selected state for AT; the group is labelled "Filters".
- **Section headers (`host · filter`).** Reuse the established section-header treatment: source
  `Icon` in `--text-dim`, label in `--text-muted` at `--font-size-xs`, 12px row. The `·` separator is
  a literal middot in the muted colour — no new token. Single-section folders render no header
  (unchanged), so the visual delta only appears once a folder genuinely has ≥2 sections.
- **Section add/remove motion.** When a filter is toggled on/off and the editor is confirmed, the
  added/removed section animates with the existing folder-child enter/leave tween (150–250ms,
  `--ease-standard`) rather than popping — consistent with how pinned children animate today.
- **Merge-on-re-add affordance.** Re-adding an instance that already exists merges filters silently
  (no error, no duplicate card); the affected instance card's newly-ticked pills animate to selected
  so the merge is visible feedback rather than a no-op.
- **Reduced-motion + WCAG-AA.** Under `prefers-reduced-motion` all tweens above collapse to instant
  state changes (no opacity/scale animation). The selected-pill fill (`--space-c-soft` + `--text`)
  and the muted header text both hold AA contrast at every Colour-intensity level (subtle | standard
  | vivid), as the underlying tokens already guarantee.

## Risks / Trade-offs

- [Persisted v8 nodes in the wild fail to load under the v9 schema] → a real v8→v9 migration
  rewrites every smart node's `sources[]` from `{source,baseUrl,query?}` to
  `{source,baseUrl,queries}` (queue → `[query]`, rss → `[]`); covered by a round-trip migration
  test and the corruption-quarantine fallback if a node is malformed.
- [More requests per poll for multi-filter instances] → bounded by existing concurrency; shared
  per-connector caches (D5) keep me-resolution at one call per instance per poll; cadence floor
  unchanged.
- [`smartItemBindings` keys change because `sourceKey` gains the filter axis] → the v8 migration
  already namespaced bindings as `${sourceKey}:${nativeId}`; the v9 migration re-derives the
  finer key for existing bindings (an authored-only folder's bindings move from `source:host:id`
  to `source:host:authored:id`). Orphaned bindings are pruned, as in v8.
- [Header noise when several sections share a host] → `host · filter` disambiguates; single-section
  folders are unaffected (no header).

## Migration Plan

1. Land types/schemas: `SmartSourceConfig` with `queries`, `SmartSourceConfigSchema`,
   `AppStateV9Schema`, and the append-only `{ toVersion: 9 }` migration.
2. v9 migration transforms each `smart` node's `sources[]` entries (queue `{…,query}` →
   `{…,queries:[query]}`, rss `{…}` → `{…,queries:[]}`) and re-keys `smartItemBindings` from
   `source:host:id` to the resolved `source:host:query:id` form using each node's migrated
   `sources`. Orphaned bindings dropped.
3. Engine: `sourceKey` on resolved cfg, `resolvedConfigs(node)` expansion, fan-out over filters,
   shared per-connector caches per poll.
4. Sidebar: editor filter multi-select; `SmartSectionHeader` `host · filter` label.
5. Update `docs/architecture.md` source/section description. Run `pnpm verify`.

**Rollback:** the migration is append-only; a user who downgrades keeps a v9 envelope that the
older v8 code would quarantine (no data loss — the quarantine record holds the raw bytes). No
partial-write risk since the envelope write-back is atomic.

### D7 — Filter control: toggle chips (`Chip.svelte` gains a selected state)

`src/ui/` has no checkbox/toggle primitive (closest are `Select.svelte`, single-select
`SegmentedControl.svelte`, and the display-only `Chip.svelte`). Rather than hand-roll a checkbox in
the feature component (forbidden by the component-library policy) or stretch `SegmentedControl`'s
single-active semantics, the filter multi-select composes **selectable filter pills**: `Chip.svelte`
gains a `selected`/pressed state (`aria-pressed`, a tokenised selected treatment). This reuses the
editor's existing chip language (the source pill is already a `Chip`) and is compact for the narrow
sidebar. *Alternatives:* a new `Checkbox` primitive (more conventional/reusable but a larger new
state matrix to specify) and a multi-select `SegmentedControl` (visually unified but muddies its
single-select uses elsewhere) — both rejected.

### D8 — Per-source filter labels reuse the existing label map

Section headers render the filter via the per-source query-label map that already exists (live
`smart-folders` spec: Jira re-skins `review-requested` to "Watching"; GitLab/GitHub render
"Reviewing"). No new label surface is introduced — the header simply reads the same label the editor
shows. Jira `review-requested` headers therefore read `host · Watching`.

## Open Questions

- **Storage-spec schema-name drift (pre-existing).** The live `storage-and-migrations` spec names
  `AppStateV7Schema` / `AppStateV7` as "the current-version schema" in the salvage, `ArchivedTab`,
  and schema-to-type-coherence requirements (`storage spec.md:90, 113, 209, 261, 300`), even though
  the version constant is already `8` — drift the v8 multi-source change introduced and did not
  sweep. This change correctly validates the migration runner against `AppStateV9Schema` (storage
  delta) but **deliberately defers** renaming the salvage/`ArchivedTab`/coherence requirements, to
  avoid half-rewriting six large unrelated requirements and risking a fresh `V9`-vs-`V7` split mid-
  requirement. The full sweep (`AppStateV7Schema` → `AppStateV9Schema` across those requirements,
  plus refreshing the smart-node salvage scenarios for the `queries[]`/`rss` shape) is tracked as
  task 6.4 and gated on explicit user signoff at apply time; if declined there, it becomes a
  dedicated `storage-spec-schema-name-sweep` change.
