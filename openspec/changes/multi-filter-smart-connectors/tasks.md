## 1. Types & schema (v9)

- [ ] 1.1 Change `SmartSourceConfig` in `shared/types.ts` to `{ source, baseUrl, queries: SmartQuery[] }`; add `ResolvedSourceConfig` (`{ source, baseUrl, query? }`).
- [ ] 1.2 Update `SmartSourceConfigSchema` in `shared/schemas.ts` (`queries: z.array(SmartQuerySchema)`); update `PinNodeSchema` smart branch.
- [ ] 1.3 Add `AppStateV9Schema` (v8 + new smart-source shape + per-filter `smartItemBindings` keys); bump `CURRENT_SCHEMA_VERSION` to 9.
- [ ] 1.4 Add the append-only `{ toVersion: 9 }` entry to `shared/migrations.ts`: rewrite each smart node's `sources[]` (queue `{…,query}` → `{…,queries:[query]}`, rss → `{…,queries:[]}`) and re-key `smartItemBindings` from `source:host:id` to `source:host:query:id` using each node's migrated instance; drop orphaned bindings.
- [ ] 1.5 Unit-test the v9 migration: queue rewrite, rss empty-queries, binding re-key, orphan drop, no-smart-node passthrough, full v1→v9 chain.

## 2. Engine (identity + fan-out)

- [ ] 2.1 Change `sourceKey(cfg: ResolvedSourceConfig)` in `background/smart-folders.ts` to `${source}:${host}:${query}` (queue) / `${source}:${host}` (rss).
- [ ] 2.2 Add `resolvedConfigs(node): ResolvedSourceConfig[]` expanding `sources[] × queries[]` (single pass for rss); use it in the engine fan-out and origin union.
- [ ] 2.3 Update `startSmartFolderRefresh` to iterate resolved sections, sharing `ConnectorCaches` across one instance's filters within a poll cycle (one me-resolution per instance per cycle).
- [ ] 2.4 Update `SourceConnector` contract + `fetchSmartSectionRuntime` signatures to `ResolvedSourceConfig` (shape-stable; connectors unchanged in body).
- [ ] 2.5 Update `requiredOriginsForConfig` in `shared/connector-origins.ts` to accept `ResolvedSourceConfig`; verify union dedups per instance.

## 3. Handlers & validation

- [ ] 3.1 Update `createSmartFolder` / `updateSmartFolder` handlers: validate non-empty `queries` for queue entries, empty `queries` for rss, per-entry `baseUrl`; throw with ack error otherwise.
- [ ] 3.2 Update `updateSmartFolder` section diffing to add/remove/refetch only the affected resolved sections on a `queries`/`baseUrl`/`source` change.
- [ ] 3.3 Confirm `openSmartItem` / `smartItemBindings` read/write uses the per-filter namespaced id end to end.

## 4. Filter primitive & sidebar editor

- [ ] 4.1 Extend `Chip.svelte` with a `selected`/pressed toggle state (`aria-pressed`, tokenised selected fill `--space-c-soft` + leading check `Icon`, hover/active/focus/disabled per the Visual language section); update its test harness.
- [ ] 4.2 In `SmartFolderEditor.svelte`, replace the single-query control with a per-instance **filter multi-select** composing the selectable `Chip` pills (authored/assigned/review-requested; hidden for rss).
- [ ] 4.3 Change the add-source dedupe to key on `source:host` and **merge** filter selections instead of dropping a colliding add.
- [ ] 4.4 Block Confirm when `sources` empty OR any queue instance has zero filters; update the "per section" label logic to count resolved sections.

## 5. Sidebar render (UI-1 flat)

- [ ] 5.1 In `SmartSectionHeader.svelte`, render the `host · filter` label (filter via the per-source query-label map; `host` only for rss / single-section folders).
- [ ] 5.2 In `SmartFolder.svelte`, render one flat section per resolved section in `sources` × `queries` order; keep single-section folders header-less.
- [ ] 5.3 Update folder badge to sum per-resolved-section attention counts (duplicated item counts per section); `N+` when any section hits `maxItems`.

## 6. Docs & gates

- [ ] 6.1 Update `docs/architecture.md` where it names the smart-folder source/section model (instance vs. resolved section, per-filter sourceKey).
- [ ] 6.2 Add/extend Vitest coverage: identity collision-free for two filters of one instance, badge math, editor merge-on-re-add, per-section gating.
- [ ] 6.3 Run `pnpm verify` (tsc, biome, svelte-check, lint:styles, vitest) and `pnpm test:e2e`; fix to green.
- [ ] 6.4 (Gated — confirm with the user first.) Sweep the pre-existing `AppStateV7Schema`/`AppStateV7` naming drift in `openspec/specs/storage-and-migrations/spec.md` (salvage, `ArchivedTab`, schema-to-type-coherence requirements) to `AppStateV9Schema`/`AppStateV9`, and refresh the smart-node salvage scenarios for the `queries[]`/`rss` shape. If declined, spin out a dedicated `storage-spec-schema-name-sweep` change instead. (Design.md Open Questions.)
