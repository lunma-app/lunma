## Context

The lens-overview board (`OverviewPage.svelte`) offers a persisted scope filter per entity card — repos (Changes), projects (Issues), feeds (Articles) — backed by `node.filter: LensFilter` (`{ entities?, repos?, projects?, feeds? }`, all `string[] | undefined`). Filtering is applied by `applyLensFilter` (`shared/lens-filter.ts`), gated by `OverviewPage.svelte`'s `filteredTagged` derived (lines ~163–178), which currently short-circuits to "return everything unfiltered" whenever every axis is `undefined` **or empty** (`!filter.feeds?.length` is true for both).

Today, three code paths all converge on the same stored value for "axis is fully satisfied":
1. A fresh lens with no filter ever set → `filter.feeds` is `undefined`.
2. The user clicks the overflow `MultiSelect`'s "Select all" → `OverviewPage`'s `onchange` handler collapses the result to `[]` (`vals.length >= visFeeds.length ? [] : vals`).
3. The user clicks the same picker's "Clear" → the `MultiSelect` calls `onchange([])`, which the same handler passes through unchanged (still `[]`).

Because (1), (2), and (3) all end up as either `undefined` or `[]`, and `applyLensFilter`/`filteredTagged` treat `undefined` and `[]` identically ("no constraint"), Select all and Clear are behaviorally indistinguishable — both mean "show everything." A separate change (outside this proposal) already fixed the *visual* symptom of this (the popover's checked-state now uses local ephemeral display state so at least the checkboxes give correct feedback for each click); this change fixes the underlying *data semantics* so Clear's outcome actually matches its label.

## Goals / Non-Goals

**Goals:**
- Make Clear on a lens-overview scope filter actually exclude every row on that axis (an empty result for that entity section, same as manually deselecting everything would intuitively suggest).
- Preserve today's "a lens that's never been filtered auto-includes newly-arriving facet values" behavior — this is the `undefined` case and must keep behaving exactly as it does today.
- Keep `LensFilter`'s persisted shape (`string[] | undefined` per axis) unchanged — no schema/migration work.

**Non-Goals:**
- No change to the entity-type filter (`filter.entities`) semantics — out of scope; nothing in the bug report or the proposal touches it, and touching it would widen the blast radius for no user-visible benefit. (It is filtered by the same `applyLensFilter` call, but the overview UI never lets a user set it to `[]` today — there's no entity-type picker on the overview per the existing spec — so this axis has no reachable "explicit empty" state to reinterpret.)
- No change to the separate, page-local, ephemeral Articles-card feed-scope chips (no persistence, not part of `LensFilter`).
- No visual/component changes to `ui/MultiSelect.svelte` or `ui/Chip.svelte` — this is a filtering-logic + feature-component change only.
- No attempt to preserve "Select all, then a brand-new feed arrives later, and it's automatically included" — seed Decision 2 below explains why this narrows, and why that's acceptable.

## Decisions

### Decision 1 — `applyLensFilter`: explicit `[]` excludes, `undefined` doesn't constrain

`hasRepos`/`hasProjects`/`hasFeeds` (currently `(array?.length ?? 0) > 0`) change meaning: instead of gating whether a `Set` is built for that axis, the axis now has three states:
- key absent (`undefined`) → no constraint (identical to today).
- key present, non-empty array → constrain to that set (identical to today).
- key present, `[]` → constrain to the empty set, i.e. exclude every row that reaches that axis's entity check.

Concretely, the current `if (!hasEntities && !hasRepos && !hasProjects && !hasFeeds) return rows;` early-return and the per-entity `if (repoSet) { ... }` guards are restructured to distinguish `undefined` from `[]` explicitly (e.g. `filter.repos !== undefined` rather than `repos?.length`), so a `[]` value still builds a `Set` (empty) and the per-row check `repoSet.has(...)` naturally fails every row, excluding them — no special-cased "explicitly empty" branch needed beyond checking presence-of-key instead of length.

**Alternative considered**: introduce a sentinel (e.g. `null` for "explicit empty") to avoid overloading `[]`/`undefined`. Rejected — it would change `LensFilter`'s type shape (`string[] | undefined | null`), require a Zod schema change, and touch every consumer that destructures `filter.*`, for no benefit over just treating "key present with 0 elements" as a real constraint (which is the conventional interpretation for filter arrays in the rest of the codebase and requires no schema change).

### Decision 2 — `OverviewPage.svelte`: Select all persists the explicit full list, not `[]`

The three `MultiSelect` `onchange` handlers (currently `setFilter({ ...filter, feeds: vals.length >= visFeeds.length ? [] : vals })`) drop the "collapse full selection to `[]`" normalization entirely. Going forward:
- Toggling any subset (including reaching "every currently-known value checked" via Select all or by manually checking the last box) persists exactly the array `MultiSelect` reports.
- Only the dedicated Clear action (`onchange([])` from `MultiSelect`'s own Clear button) produces `[]`, and now `[]` has real, distinct meaning (Decision 1).
- The `filteredTagged` early-return (`!filter.feeds?.length` etc.) changes to check key-presence (`filter.feeds === undefined`) instead of length, so an explicit `[]` no longer takes the "return everything" shortcut — it flows into `applyLensFilter` and is excluded there.

**Trade-off accepted**: today, clicking Select all is indistinguishable from "never filter this axis," so a feed that appears *after* Select all was clicked is still automatically included (both states are `[]`/unfiltered). After this change, Select all persists the explicit list of every value known *at click time*; a feed that arrives later is an unchecked, filtered-out option until the user checks it. This is a narrowing of behavior, but it's the only way to make Select all and Clear distinguishable without a sentinel type change (Decision 1's rejected alternative), and it matches how every other "select all then persist" multi-select in the app already behaves (e.g. the lens editor's source-membership `MultiSelect`, called out in the existing spec at `openspec/specs/lenses/spec.md:1660` as *not* sharing this collapse-to-unfiltered behavior). Users who want "always include every feed, including future ones" keep that by simply never touching the filter (the `undefined` state), which remains the default and is unaffected by this change.

**Alternative considered**: keep the auto-widening behavior for Select all by persisting some marker meaning "explicitly all, but still auto-widen." Rejected as needlessly complex for a lens-overview scope filter where facets change rarely and a user who wants a new feed included can just re-open the picker and check it — not worth a third distinct stored state.

### Decision 3 — No change to `MultiSelect.svelte` itself

The collapse-to-`[]` behavior being removed lives entirely in `OverviewPage.svelte`'s consumption of `MultiSelect`, not in the primitive. `MultiSelect` already just reports whatever selection state the user produces via `onchange`; this change only changes what the *consumer* does with that report. No primitive changes, no catalog story updates required.

## Risks / Trade-offs

- **[Risk] A persisted lens from before this change with `filter.feeds: []` (written by the old "collapse to unfiltered" behavior) will now be interpreted as "show no articles" instead of "show all articles," silently hiding a previously-populated Articles section.** → Mitigation: this is the exact bug being fixed — a user who reaches `[]` today did so via Select all or Clear, both of which they'd now expect to mean "everything"/"nothing" respectively going forward, so their next visit reads correctly for Clear-origin `[]` and incorrectly (temporarily hidden) for old Select-all-origin `[]`. Since the picker's `values` (the separate ephemeral-display fix, already shipped) shows every option checked whenever `filter.<axis>` is falsy-length, a user who lands on this state will see every checkbox already checked with the Articles section empty — an obviously-wrong-looking state that's immediately fixable by clicking Select all again (or Clear then Select all), which will re-persist the current explicit list. No data loss (facets are re-derived live from current items), no migration needed — this is a one-time, self-correcting UX hiccup for the (likely few) lenses that hit an all-selected state via Select all before this change, not a permanent break.
- **[Trade-off] Select all no longer auto-includes future facet values** (Decision 2). Accepted; see Decision 2 rationale.
- **[Risk] Missing a call site.** `filteredTagged`'s early-return and `applyLensFilter`'s internals must change together — if only one is updated, an explicit `[]` could still slip through as "unfiltered" via the early-return, silently preserving the bug for that path. → Mitigation: tests assert the end-to-end behavior through `OverviewPage`'s rendered output (not just `applyLensFilter` in isolation), so a partially-applied fix fails visibly.

## Migration Plan

No schema or persisted-data migration. This is a pure in-memory filtering-logic change:
1. Land the `applyLensFilter` change (Decision 1) with its own unit tests first — it's the lower-level, independently-testable piece.
2. Land the `OverviewPage.svelte` change (Decision 2) against the now-updated `applyLensFilter`, updating/replacing the existing "collapses to the unfiltered state" tests.
3. Update `openspec/specs/lenses/spec.md`'s requirement text and scenarios in the same change (per the deviations policy — spec and code must land together, not sequentially).
4. No rollback complexity beyond a normal revert — no data written by this change is incompatible with the prior code (a `[]` written under the new semantics, if the change were reverted, would simply be re-interpreted as "unfiltered" again, i.e. silently more permissive, not broken).

## Open Questions

None outstanding — the one real ambiguity (whether Select all should keep auto-widening) is resolved in Decision 2 and accepted as a trade-off.

## Addendum — gaps found during manual (browser) verification

Manually driving the fix end-to-end in the running extension (task 4.3, both via an automated headed-Chromium session and the user's own dev profile) surfaced four real gaps this design didn't anticipate, each agreed with the user before fixing and covered by tests. Full rationale in `tasks.md` section 5; summarized here since each is a real design decision, not just a code fix:

- **Decision 4 — `store.svelte.ts`'s `setLensFilter` must use the same absent-vs-`[]` distinction as `applyLensFilter`.** This method — the only real path from the UI's `setFilter` to persisted state — independently normalized "every axis has `.length === 0`" (true for both `undefined` and explicit `[]`) to "delete `node.filter` entirely." Decision 1 only touched `applyLensFilter`'s reading of a filter, not the store's writing of one; without this fix, Clear's `{ feeds: [] }` never survived a save, silently preserving the bug end-to-end. Changed the `isEmpty` check to key-presence, matching Decision 1 exactly.
- **Decision 5 — an entity card's visibility must not be gated on its own filtered count.** `OverviewPage.svelte`'s four entity-card `{#if X.length > 0}` gates predate this change and were never exercised at zero-via-filter before (the old semantics made that impossible). Once Clear can genuinely zero an axis, gating card visibility on the *filtered* count means the card — and the only picker that can undo Clear — vanishes, a dead end with no UI recovery path. This directly contradicts the already-written spec scenario text ("the Articles card render**s** zero Articles," which presumes the card persists). Fixed by adding a `byEntityAll` bucket (from unfiltered `tagged`) purely for the visibility gate, keeping the existing filtered `byEntity` for the card's *contents*.
- **Decision 6 — the scope-picker trigger label must distinguish "unfiltered" from "cleared."** `scopeLabel()` read `filter.<axis> ?? []`, so an absent axis and an explicit `[]` both produced the "All …" label — actively misleading once `[]` means "matches nothing." Added a distinct "None selected" label (`launcher_lensNoneSelected`, all 9 locales) for the explicit-`[]` case.
- **Decision 7 — `MultiSelect`'s dropdown popover must not rely on its container being tall enough to hold it.** A pre-existing latent bug (plain CSS `position: absolute` inside a `.card` with `overflow: hidden`), invisible until Decision 5 let a card render at near-zero height. Rewrote the dropdown-mode popover to portal via `bits-ui`'s `Popover.Root`/`Trigger`/`Portal`/`Content` — the same escape-ancestor-clipping pattern this codebase already uses in `Menu.svelte`/`BottomSheet.svelte` — rather than patching around the symptom (e.g. reserving space in the card). `ui/Select.svelte` has the identical latent pattern but is out of scope (not exercised inside a clipping container today); flagged as a known follow-up, not fixed here.
