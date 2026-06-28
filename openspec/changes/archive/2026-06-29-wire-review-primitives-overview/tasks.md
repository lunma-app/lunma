## 1. View-model helpers (overview-vm.ts)

- [x] 1.1 Add `initialsOf(login: string): string` — 1–2 uppercase initials from a login/username.
- [x] 1.2 Add `reviewersForRail(change: ChangeData)` mapping each reviewer to `{ initials, state?, title }` (state passes through; title = login) for `ReviewerRail`.
- [x] 1.3 Add `ciLight(item: LensItem)` returning the CI glyph for the status tone, or a distinct hollow glyph (label "Draft") when `change.draft`; replaces `ciCircle`.
- [x] 1.4 Remove `reviewerHue`, `ciCircle`, `changeState`; simplify `changeMeta` to return the `repo` subline only.

## 2. Changes row (OverviewPage.svelte)

- [x] 2.1 Compose `ReviewerRail` (reviewers via `reviewersForRail`) in place of the inline `.reviewers`/`.avatar` markup.
- [x] 2.2 Compose `Diffstat` (`change.additions`/`deletions`) in place of the diffstat text; subline shows `changeMeta` (repo) only.
- [x] 2.3 Replace the trailing CI glyph with `ciLight` (draft → hollow glyph).
- [x] 2.4 Remove the row's state `<Pill>` and the `changeState` import; keep the `Pill` import for the Issues section.
- [x] 2.5 Delete the now-dead scoped CSS (`.reviewers`, `.avatar`, `.avatar.stacked`, `.ci`) and update imports.

## 3. Tests

- [x] 3.1 Update `overview-vm.test.ts`: drop `reviewerHue`/`ciCircle`/`changeState` cases; cover `initialsOf`, `reviewersForRail`, `ciLight` (incl. draft), and `changeMeta` (repo only).
- [x] 3.2 Update `OverviewPage.test.ts`: assert `reviewer-rail` + `diffstat` render in a change row, draft → hollow CI light, and no `verdict` pill renders.

## 4. Verify

- [x] 4.1 `pnpm --filter @lunma/extension verify` green (tsc, biome incl. layer DAG, svelte-check, stylelint, vitest).
- [x] 4.2 Confirm `ReviewerRail`/`Avatar`/`Diffstat` are no longer orphaned (composed by `OverviewPage`).
