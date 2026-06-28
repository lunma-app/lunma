## Why

Users who follow more than five feeds (or repos, or projects) in a lens lost the
ability to filter by more than one at a time. At ≤5 facets the lens overview shows
multi-toggle `Chip`s; past the threshold it fell back to the single-select `Select`,
so a reader with many feeds could pick exactly one feed while a reader with ≤5 repos
kept true multi-toggle. The article/feed filter "sucked" relative to the repo filter
for precisely this reason. This change gives every scope axis a real multi-select past
the threshold — a searchable, multi-toggle listbox — and reuses that same primitive to
turn the new-lens form's long source list into a searchable multi-select. It also
leans into a clearer mental model: **a lens is "all your stuff" from the sources you
pick, narrowed in the overview** — so the form drops per-source query selection (every
chosen source fetches all its queries) and the overview filter does the narrowing.

## What Changes

- Add a shared `MultiSelect` UI primitive: a multi-selectable listbox that mirrors
  `Select`'s visual language (recessed trigger, frosted elevated popover, accent-wash
  rows) with a per-row checkbox-square toggle, a parent-computed trigger summary (the
  count, when wanted, lives in that summary — no separate count pill to duplicate it),
  an accent-tinted "engaged" trigger border while any value is selected, and an
  in-popover header with **Select all** + **Clear** actions (a select-all ⟷ clear
  toggle: Select all picks every enabled option and hides once all are selected; Clear
  empties and hides once none are).
  - **Search**: an in-popover search box (composing the existing `SearchField`
    primitive, `mode="input"`) appears only once the option count exceeds a threshold
    (default 8, configurable). It filters the listbox live with a case-insensitive
    **subsequence (fuzzy) match** over each option's `label` plus an optional per-option
    `keywords` string (non-displayed search text, e.g. a source's provider/type), so a
    query like `hcr` matches `Hacker News` and typing a type finds rows whose label omits
    it; `ArrowDown` from the field moves focus into the list; `Escape` closes.
  - **Modes**: `mode: 'dropdown' | 'inline'`. `dropdown` is trigger + popover (the
    overview filters); `inline` is an always-open list with no trigger (the new-lens
    form).
  - **Custom row content**: an optional per-row `leading` snippet so a row can render a
    plain label (overview) or an `AccountChip` (lens form).
- Lens overview (`OverviewPage.svelte`): the `>5` overflow case for repos / projects /
  feeds renders `MultiSelect` (dropdown mode) instead of `Select`, giving all three
  axes real multi-toggle parity. The feed picker gains the `ariaLabel` it was missing
  (repos / projects already had one).
- New-lens form (`LensEditor.svelte`): the bespoke "Read from" account list is
  recomposed onto `MultiSelect` in inline mode — `AccountChip` as the row `leading` (its
  provider glyph is the row's visible type icon), a search box that fuzzily filters
  sources by name or source type when the list is long. **Per-source query selection is
  removed**: selecting a source includes all of its queries (a git/jira source fetches
  `authored` + `assigned` + `review-requested`; an `rss` source carries no queries), so
  the editor no longer shows per-account filter pills and no longer requires picking a
  filter per source.
- New i18n keys (all 9 locales): `launcher_lensScopeSelected` (`"{count} selected"`),
  `launcher_lensFilterByFeed` (`"Filter by feed"`), `launcher_lensScopeSearch` (overview
  overflow search placeholder), `sidebar_lensSourceSearch` (new-lens source-search
  placeholder), `sidebar_lensNamePlaceholder` (`"Lens"`, the name-field placeholder /
  default name — added once the suggested-name path was removed per D7), and
  `common_selectAll` / `common_deselectAll` (the `MultiSelect` select-all toggle, used by
  both the overview pickers and the new-lens source picker).

## Capabilities

### New Capabilities

<!-- none — MultiSelect is a new primitive under the existing visual-system capability,
     not a new capability. -->

### Modified Capabilities

- `visual-system`: add the shared `MultiSelect` immersive primitive (searchable
  multi-toggle listbox, dropdown + inline presentations, optional `leading` row slot)
  to the cross-surface primitive set, reading tokens and composing `SearchField` rather
  than re-rolling an input.
- `lenses`: the overview scope-facet overflow renders a multi-select past the threshold
  (was single-select `Select`); and the new-lens editor's source picker is a searchable
  multi-select where every selected source contributes all of its queries (per-source
  query selection is removed — a lens is "all your stuff" from its sources, narrowed in
  the overview).

## Impact

- **New files**: `apps/extension/src/ui/MultiSelect.svelte`,
  `apps/extension/catalog/stories/ui/MultiSelect.stories.svelte`,
  `apps/extension/src/ui/MultiSelect.test.ts`,
  `apps/extension/src/ui/MultiSelect.test.harness.svelte`.
- **Modified**: `apps/extension/src/launcher/lenspage/OverviewPage.svelte` (overflow
  rewire), `apps/extension/src/sidebar/LensEditor.svelte` (source-picker recompose +
  drop per-source query selection) and `apps/extension/src/sidebar/LensEditor.test.ts`,
  `apps/extension/messages/*.json` (7 new keys × 9 locales — incl. `common_selectAll`
  and `common_deselectAll` for the select-all toggle), and the paraglide-compiled
  output under `apps/extension/src/shared/paraglide/`.
- **New public surface**: `MultiSelect.svelte` props (`options`, `values`, `onchange`,
  `label`, `mode`, `searchThreshold`, `ariaLabel`, `clearLabel`, `searchPlaceholder`,
  `selectAllLabel`, `leading` snippet, `testid`) and the exported `MultiSelectOption`
  type (`{ value, label, disabled?, keywords? }`). Stable test
  hooks: the trigger / inline-root carries the `testid` (default `multi-select`), each
  row is `data-testid="multi-select-option"` keyed by `data-value=<option.value>`, the
  Select all action `multi-select-all`, the Clear action `multi-select-clear`, and the
  search field `multi-select-search`. The lens-form inline picker keeps the
  `smart-source-list` root testid.
- **Behaviour change (agreed)**: a lens's git/jira sources now always fetch all three
  relation queries; the editor no longer lets you scope a source to a single relation
  (e.g. a review-requested-only lens). `LensFilter`, the filter predicate, the
  `LensSourceRef.queries` schema, and the message bus are unchanged — only the editor's
  query-picking UI is removed and defaulted to the full set.
- **Primitives composed**: `Surface`, `Icon`, `SearchField`, the `scrollFade` action
  (MultiSelect itself); `AccountChip` (the lens-form recompose). **Primitive added**:
  `MultiSelect`. The lens form no longer composes `Chip` for per-source filter pills.
- **Catalog**: one new `MultiSelect` story (satisfies the per-primitive story gate; no
  change to the `component-catalog` requirements).
- **Docs**: no `docs/` file changes — the cross-surface primitive inventory is pinned by
  the `visual-system` spec, not by `docs/`; the import-layer DAG (`ui` imports `shared`
  only) is unchanged. `CLAUDE.md` and `docs/architecture.md` are untouched.
