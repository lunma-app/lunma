## 1. Schema, types & migration (foundation)

- [x] 1.1 Widen `LensKind` to `'general' | 'review'` in `apps/extension/src/shared/types.ts`.
- [x] 1.2 Add the `ChangeData` interface (author, repo, reviewers[{login,state?}], draft, additions?, deletions?, targetBranch?, updatedAt) and an optional `change?: ChangeData` on `LensItem` in `types.ts`.
- [x] 1.3 Add `lensKind: LensKind` to `ResolvedLensSource` in `types.ts` (the engine stamps it; see D4a).
- [x] 1.4 Add `ChangeDataSchema` and an optional `change` on `LensItemSchema` in `apps/extension/src/shared/schemas.ts` (ephemeral mirror).
- [x] 1.5 Add `AppStateV12Schema` (= V11 with `lensKind: z.enum(['general','review'])`); bump `CURRENT_SCHEMA_VERSION` to `12`; point validation at `AppStateV12Schema`.
- [x] 1.6 Append the additive `{ toVersion: 12 }` identity migration in `apps/extension/src/shared/migrations.ts`.
- [x] 1.7 Update schema/migration tests: v12 identity (a v11 `general` node is structurally unchanged), a `lensKind: 'review'` node validates under `AppStateV12Schema`, the migrations list has eleven entries, and the salvage/round-trip paths cover the widened enum.

## 2. Connector enrichment (Change adapters)

- [x] 2.1 Stamp `lensKind` onto each `ResolvedLensSource` in `resolvedConfigs(node)` (`background/lenses.ts`); thread it through `fetchLensSectionRuntime` unchanged in signature.
- [x] 2.1a Sweep existing `ResolvedLensSource` literal constructions for the now-**required** `lensKind` field (esp. connector test fixtures and the page's local section-expansion copy) so `tsc` stays green — a compile-forced update from task 1.3.
- [x] 2.2 GitHub (`background/connectors/github.ts`): widen `PrDetailSchema` to parse `user.login`, `base.ref`, `base.repo.full_name`, `additions`, `deletions`, `updated_at`, `draft`.
- [x] 2.3 GitHub: when `cfg.lensKind === 'review'`, fetch `GET …/pulls/{n}/reviews`, reduce to the latest non-`COMMENTED` review per reviewer (`APPROVED`→approved, `CHANGES_REQUESTED`→changes), mark requested-reviewers-without-review `pending`, and build `change` (capped at `maxItems`). Leave `general` lenses unenriched (no reviews call, no `change`).
- [x] 2.4 GitLab (`background/connectors/gitlab.ts`): widen `MrSchema`/detail to parse `author.username`, `target_branch`, `updated_at`, `draft`/`work_in_progress`, `reviewers[]`, diff/change stats, project path.
- [x] 2.5 GitLab: when `cfg.lensKind === 'review'`, fetch `GET …/merge_requests/{iid}/approvals`, map `approved_by`→approved / others→pending (and `changes` where the instance exposes review-state), and build `change` (capped at `maxItems`). Leave `general` lenses unenriched.
- [x] 2.6 Connector tests: review-kind enrichment populates `change` (both providers); general-kind makes no extra call and carries no `change`; unknown GitLab verdicts degrade to `pending`; CI tone stays on `status`.

## 3. ui/ primitives (token-driven)

- [x] 3.1 `apps/extension/src/ui/Avatar.svelte` — `{ initials; size?: 'sm'|'md'; ring?: 'approved'|'changes'|'pending'|'none'; title? }`, reading tokens only. + test harness + test.
- [x] 3.2 `apps/extension/src/ui/Diffstat.svelte` — `{ additions?; deletions? }`, mono numerals + proportional two-tone bar; numerals always render (never colour-only). + harness + test.
- [x] 3.3 `apps/extension/src/ui/ReviewerRail.svelte` — `{ reviewers: {initials,state?,title?}[]; max? }`, leading blocking-wins verdict `Icon` + overlapped `Avatar`s + `+N` overflow. Composes `Avatar`. + harness + test.
- [x] 3.4 Stylelint passes for the three primitives (token/primitive contract); none hard-code design values.

## 4. Review Queue page (routing + view + row + filter)

- [x] 4.1 Extract the current generic page body from `LensPage.svelte` into `launcher/lenspage/GeneralLens.svelte` verbatim; `LensPage.svelte` branches on `node.lensKind` (`review` → `ReviewQueue`, else `GeneralLens`). Confirm the existing `LensPage.test.ts` still passes against the generic path.
- [x] 4.2 Fix the `.folderpage` → `.lenspage` CSS-scope regression in `launcher/lenspage/lenspage.css` (page-level rules currently don't apply).
- [x] 4.3 `launcher/lenspage/ReviewQueue.svelte` — relationship lanes (review-requested → "Requested your review", authored → "Authored by you", other queries → own labelled lane), page header with name + triage summary; reuse the calm pending/error/signed-out/needs-access states; mirror state read-only.
- [x] 4.4 `launcher/lenspage/ChangeRow.svelte` — composes CI light (from `status`, draft glyph override), title, `host/owner/repo · @author` subline (host from `baseUrl`, repo from `change.repo`, author disc via `Avatar`), `ReviewerRail`, `Diffstat`, warming age (from `change.updatedAt`). Activation dispatches `openLensItem` with the namespaced id.
- [x] 4.5 `launcher/lenspage/LensFilterBar.svelte` — renders only when `node.sources` spans >1 source; source facets as `Chip`s, repo facets as `Chip`s (≤5) or `Select` (more), repo scoped to active source; page-local ephemeral `$state`; narrows the rendered changes.
- [x] 4.6 Page tests: review lens renders the queue (not the grid); general lens renders the generic page unchanged; a row shows its triage signals; activation reuses `openLensItem`; the toolbar appears only for multi-source lenses and a source chip narrows the queue; reduced-motion holds.

## 5. Editor kind picker

- [x] 5.1 Add a `SegmentedControl` kind picker (General | Review) to `sidebar/LensEditor.svelte`; when `review`, restrict the source-provider picker to `github`/`gitlab`.
- [x] 5.2 Thread `lensKind` through the `createLens`/`updateLens` payloads (currently omitted) and add it to the command payload types in `shared/bus.ts`.
- [x] 5.3 Stamp the supplied `lensKind` in `background/handlers/lenses.ts` (`createLens`/`updateLens`), defaulting to `'general'` when absent (back-compat).
- [x] 5.4 Editor/handler tests: creating a review lens persists `lensKind: 'review'`; review restricts providers; an `updateLens` without `lensKind` preserves `'general'`.

## 6. Docs & artifact sync

- [x] 6.1 Update `docs/lenses-vision.md`: mark Phase 2 (Review lens) shipped in the roadmap; add `repo` to the `ChangeData` definition (the deviation recorded in design D2).
- [x] 6.2 Confirm `proposal.md` / `design.md` / specs match the landed code (names, files, fields); reconcile any implementation-forced rename in the same change.

## 7. Quality gates & exit criteria

- [x] 7.1 `pnpm --filter @lunma/extension verify` is green (tsc, biome incl. layer DAG, svelte-check, stylelint, vitest).
- [x] 7.2 `pnpm verify` at the workspace root is green.
- [x] 7.3 `pnpm test:e2e` passes (the review page opens and renders; the generic page is unaffected).
- [x] 7.4 New `ui/` primitives and the schema/migration changes meet the repo's coverage bar; no `change` data is ever written to disk (verified by a persist-exclusion test).
