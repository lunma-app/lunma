## 1. Row visibility threshold

- [x] 1.1 In `OverviewPage.svelte`, change the Changes repo scope-filter guard from `{#if visRepos.length > 0}` to `{#if visRepos.length > 1}`.
- [x] 1.2 Change the Issues project scope-filter guard from `{#if visProjects.length > 0}` to `{#if visProjects.length > 1}`.
- [x] 1.3 Change the Articles feed scope-filter guard from `{#if visFeeds.length > 0}` to `{#if visFeeds.length > 1}`.

## 2. Chip width containment (2–5 range)

- [x] 2.1 Add a CSS rule bounding chip width (~14–16rem) with ellipsis truncation, scoped to the scope-filter chip row in `OverviewPage.svelte` (not `Chip.svelte`).
- [x] 2.2 Add `title={repo}` / `title={project}` / `title={feed}` to the repo/project/feed `Chip` instances in the toggle-chip branch (the `visX.length <= CHIP_THRESHOLD` branch) so the full value is available on hover.

## 3. Tests

- [x] 3.1 Add/update a test asserting the scope-filter row does not render when a facet has exactly 1 visible value (repo, project, or feed — at least one case).
- [x] 3.2 Add/update a test asserting the scope-filter row renders as a 2-chip toggle row when a facet has exactly 2 visible values.
- [x] 3.3 Keep existing `>5` `MultiSelect` overflow tests passing unchanged.

## 4. Verification

- [x] 4.1 Run `pnpm --filter @lunma/extension verify` and fix any failures introduced by this change.
- [x] 4.2 Manually sanity-check in the dev build: a lens with 1 repo (no filter shown), a lens with 2 repos where one has a long name (chip truncates, tooltip shows full value on hover), and a lens with >5 feeds (unchanged `MultiSelect` behavior).

## 5. Collapse "select all" to the unfiltered state (overflow `MultiSelect` only)

- [x] 5.1 In `OverviewPage.svelte`, update the repo `MultiSelect`'s `onchange` handler: if the incoming `vals.length >= visRepos.length`, dispatch `setFilter({ ...filter, repos: [] })` instead of `{ ...filter, repos: vals }`.
- [x] 5.2 Apply the same collapse to the project `MultiSelect`'s `onchange` (against `visProjects`).
- [x] 5.3 Apply the same collapse to the feed `MultiSelect`'s `onchange` (against `visFeeds`).
- [x] 5.4 Do NOT modify `MultiSelect.svelte`'s `selectAll()` — confirm `LensEditor.svelte`'s `MultiSelect` usage (source-membership picker) is untouched and its own "Select all" still populates an explicit list.
- [x] 5.5 Add/update tests: clicking "Select all" in the repo/project/feed overflow picker results in `setLensFilter` called with that axis as `[]`, not an explicit list of every value (at least one axis covered end-to-end; note the other two share the same handler shape).
- [x] 5.6 Add/update a test: manually toggling every checkbox on (without using the "Select all" button) also results in the axis collapsing to `[]` once the last one is toggled.
- [x] 5.7 Add/update a test: after a collapse to `[]`, a newly-arriving value for that axis passes the filter with no further user action (i.e. re-run `applyLensFilter`/the overview's narrowed set includes the new value).
- [x] 5.8 Re-run `pnpm --filter @lunma/extension verify` after this section and fix any failures.
