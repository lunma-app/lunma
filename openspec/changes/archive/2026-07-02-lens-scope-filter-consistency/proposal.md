## Why

Lens overview scope filters (the repo/project/feed chip row above Changes, Issues, and Articles) currently render whenever there's at least one facet value, even a single one — this puts a lone, often-long value (e.g. a full `github.com/org/repo` path) on screen as a chip that can't meaningfully filter anything, since there's nothing else to toggle against. It reads as visual noise and, on long values, breaks the row's compactness. Separately, the `>5` overflow `MultiSelect` can reach an "everything shown" state two different ways that silently diverge over time: leaving the filter untouched (`values: []`, dynamic — always includes future new values) versus clicking "Select all" (which snapshots every *currently known* value into an explicit list, so a value added later is silently excluded even though the trigger still implies "all"). This change removes the single-value noise (hiding the row below 2 values), fixes the chip row's unbounded-width problem for the 2–5 range, and collapses the two "everything shown" states into one, so the filter looks and behaves consistently across Changes, Issues, and Articles regardless of facet count, label length, or how the user arrived at "show everything." Docs updated: none beyond the `lenses` spec delta below — no `docs/` file describes this behavior at this level of detail.

## What Changes

- Scope-filter row (repos for Changes, projects for Issues, feeds for Articles) now renders only when there are **2 or more** visible facet values, not "1 or more" as today. A single value carries no filtering choice, so the row is omitted entirely.
- Chips in the 2–5 count range (still rendered as a toggle-chip row, below the `MultiSelect` overflow threshold) get a bounded width with ellipsis truncation and a native `title` tooltip carrying the full value, so a long repo/project/feed name no longer stretches the row.
- When the `>5` `MultiSelect`'s `onchange` reports a selection covering every currently-known facet value for that axis, `OverviewPage.svelte` collapses the stored filter back to `[]` instead of persisting the explicit snapshot — so "Select all" and "never filtered" are the same state, and both stay dynamically inclusive of values that appear later. This is scoped to `OverviewPage.svelte`'s `onchange` handlers, NOT a change to `MultiSelect.svelte`'s shared `selectAll()`: `LensEditor.svelte` also uses `MultiSelect` but with the opposite semantic (empty = no lens members chosen, not "all sources included"), so `selectAll()` populating an explicit list is correct there and must not change.
- The `>5` chip-vs-`MultiSelect` render threshold itself is unchanged.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `lenses`: the scope-filter requirement changes from "renders as toggle chips whenever 1–5 facet values are present" to "renders only when 2–5 facet values are present (hidden below 2), with bounded/truncated chip width in that range"; and gains a requirement that selecting every known value in the `>5` `MultiSelect` collapses the stored filter to the same empty/"all" state as never filtering, rather than persisting an explicit snapshot.

## Impact

- `apps/extension/src/launcher/lenspage/OverviewPage.svelte`: the three `{#if visX.length > 0}` scope-filter guards become `{#if visX.length > 1}` (repos, projects, feeds); new CSS on the chip-row wrapper (or per-chip) bounding chip width (~14–16rem) with truncation; `title={value}` added on each scope chip; the three `MultiSelect onchange` handlers (repos/projects/feeds) gain a full-selection check that collapses to `[]`.
- No new files, no new `src/ui/` primitives, no changes to `MultiSelect.svelte` or `Chip.svelte` — composes the existing primitives already used here.
- `openspec/specs/lenses/spec.md`: scope-filter scenario section (~line 1654–1693) gets a delta reflecting the 2-value floor, the truncation behavior, and the collapsed "all" state.
