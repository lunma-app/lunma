# Tasks — persist-lens-article-layout

## 1. Schema + migration

- [x] 1.1 Add optional `articleLayout: z.enum(['grid', 'list']).optional()` to the
  lens-node branch of the persisted schema in
  `apps/extension/src/shared/schemas.ts`, and bump `CURRENT_SCHEMA_VERSION` 14 → 15.
- [x] 1.2 Mirror the field into any in-memory `PinNode` / lens-node TypeScript type
  so `node.articleLayout` is `'grid' | 'list' | undefined` (schema-to-type coherence).
- [x] 1.3 Append `{ toVersion: 15, migrate: (raw) => raw }` to `migrations` in
  `apps/extension/src/shared/migrations.ts` (append-only pass-through, after the
  v14 entry).
- [x] 1.4 Tests: a v15 round-trip with `articleLayout: 'list'`; a pre-15 (v14)
  state migrating to 15 with no `articleLayout` (resolves to grid); the migrations
  chain ends with the v15 identity entry.

## 2. Store setter

- [x] 2.1 Add `setLensArticleLayout(folderId: FolderId, layout: 'grid' | 'list'): void`
  to `apps/extension/src/shared/store.svelte.ts`, beside `setLensFilter`
  (resolve node, set `articleLayout`, log+return on unknown lens).
- [x] 2.2 Store test: setting the layout updates the resolved node; unknown
  `folderId` is a no-op.

## 3. Bus command

- [x] 3.1 Add the `setLensArticleLayout` command in
  `apps/extension/src/shared/bus.ts`: the union member
  (`{ kind: 'setLensArticleLayout'; spaceId; folderId; layout: 'grid' | 'list' }`),
  the `strictObject` schema, the command-name list entry, the ack-only/coalesce
  flags, and the `COMMAND_SCHEMAS` registration — mirroring `setLensFilter`.

## 4. Background handler

- [x] 4.1 Handle `setLensArticleLayout` mirroring `setLensFilter` (which lives in
  `apps/extension/src/background/handlers/lenses.ts`, not literally
  `coordinator.ts` — agreed deviation): add the handler (no-op warn on a folderId
  that does not resolve to a lens; otherwise `store.setLensArticleLayout` +
  `markDirty`) and its return-type union member in `handlers/lenses.ts`, add the
  `SidebarVariant<'setLensArticleLayout'>` member in `handlers/context.ts`, and
  register `setLensArticleLayout: {}` in the coalesce-config map in
  `coordinator.ts`, beside `setLensFilter`. No refetch (a layout change touches no
  source).
- [x] 4.2 Coordinator tests mirroring the `setLensFilter` cases: persists +
  broadcasts without a refetch; unknown `folderId` is a no-op.

## 5. UI wiring

- [x] 5.1 In `apps/extension/src/launcher/lenspage/OverviewPage.svelte`: remove
  `let articleView = $state<'grid' | 'list'>('grid')`; derive the active layout
  from the lens node (`$derived(node.articleLayout ?? 'grid')`); on toggle,
  dispatch `setLensArticleLayout` (do not mutate local state).
- [x] 5.2 Thread the `setLensArticleLayout` dispatch from `LensPage` into
  `OverviewPage` the same way `setLensFilter` is already wired (props/callback).
- [x] 5.3 Confirm no `src/ui/*` primitive changed (the existing segmented control
  is reused) — so no catalog story is required.

## 6. Docs (lockstep)

- [x] 6.1 Update the per-lens-preference documentation (where `filter` / `hideRead`
  are described, e.g. `docs/architecture.md`) to list `articleLayout` alongside
  them.

## 7. Quality gates

- [x] 7.1 `pnpm verify` at the workspace root passes (tsc, biome incl. layer DAG,
  svelte-check, stylelint, vitest, catalog gate).
- [x] 7.2 `pnpm test:e2e` smoke passes (or is unaffected).
- [x] 7.3 Manual: set a lens's Articles section to List, re-open the overview (and a
  second window) — it restores List; a fresh lens defaults to grid.
