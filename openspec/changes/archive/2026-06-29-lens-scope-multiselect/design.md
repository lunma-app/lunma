## Context

The lens overview (`launcher/lenspage/OverviewPage.svelte`) renders a scope filter per
entity card: repos for Changes, projects for Issues, feeds for Articles. Each axis
renders multi-toggle `Chip`s at ≤5 facets and fell back to the single-select `Select`
primitive past `CHIP_THRESHOLD` (5). The fall-back is a regression in capability: a
reader with many feeds could only narrow to one feed, while a reader with few repos
kept multi-select. The three axes share identical wiring (`toggle*` helpers writing a
string-array slice of `LensFilter` via `setLensFilter`), so the fix is one primitive
applied three times.

The new-lens form (`sidebar/LensEditor.svelte`) has a parallel shape: a "Read from"
list of connected accounts/feeds, each row a checkbox toggle (`toggleAccount`) plus —
for non-`rss` providers — a row of per-account smart-filter `Chip` pills
(`toggleQuery`) choosing which relation queries that source fetches. It is bespoke,
unsearchable, and grows unwieldy as connections accumulate. It is the same "multi-select
a long list" problem — and the per-source query picking is friction the product no
longer wants (see D7): a lens is "all your stuff" from its sources, narrowed later in
the overview.

Constraints: the component-library policy (build primitives, compose features; a new
`src/ui` primitive carries a catalog story and reads `@lunma/tokens`, never hard-coded
values); the one-way import DAG (`ui` imports `shared` only); reduced-motion + WCAG-AA
at every Colour-intensity tier; i18n across 9 locales; no re-rolling of an input
(reuse `SearchField`).

## Goals / Non-Goals

**Goals:**

- Restore real multi-select to every overview scope axis past the chip threshold.
- One primitive (`MultiSelect`) that serves both the overview overflow (dropdown) and
  the new-lens source list (inline, with embedded per-row pills), so the two surfaces
  converge instead of each hand-rolling a list.
- Make long lists navigable with an in-popover search above a threshold.
- Hold the visual + a11y bar: keyboard listbox model, accent-driven selection, frosted
  popover, reduced-motion and contrast guarantees.

**Non-Goals:**

- No *code* change to `LensFilter`, the filter predicate (`applyLensFilter`),
  persistence, or the message bus. The `feeds` axis already exists in code (added by the
  archived `lens-view-filters`); this change only **reconciles the stale `lenses` spec**
  (requirement "A lens carries an optional view filter") to that shipped reality, since
  it is the change that promotes feed scope facets into the overview spec.
- No change to the ≤5 chip path — chips stay the affordance for small facet sets.
- No new filter axis (e.g. `LensFilter.sources`); narrowing stays
  entity/repo/project/feed. The lens-form recompose drops per-source query selection
  (D7) but does not touch the `LensSourceRef.queries` schema.
- Not a generic combobox/typeahead: search filters an already-loaded option list, it
  does not fetch.

## Decisions

**D1 — A new `MultiSelect` primitive, not a `multiple` flag on `Select`.** `Select` is
a clean single-select listbox (selecting closes, one check, a single `value`).
Multi-select inverts three of its invariants (stay open, many checks, `string[]`).
Forking those into one component via a `multiple` branch would tangle both. A sibling
primitive that *reuses Select's visual DNA* (same trigger field, same elevated
`Surface` popover, same accent-wash row) keeps each primitive coherent while the two
read as one family. *Alternative considered:* extend `Select` — rejected for the
branching cost and the risk of regressing the single-select callers.

**D2 — `mode: 'dropdown' | 'inline'`.** The overview wants a compact trigger that opens
a popover; the new-lens form wants the list always visible while you build the lens
(you scan all sources and tune pills at once, so collapsing behind a trigger would hurt
the form's primary task). Both share one listbox core; `mode` only swaps the chrome
(trigger + popover vs. a bordered always-open panel). *Alternative:* two separate
components — rejected; the row model, selection logic, search, and keyboard handling are
identical, and duplicating them invites drift.

**D3 — A single optional `leading` snippet, no embedded `detail`.** The row needs only
one point of customisation: its leading content (a plain label for the overview, an
`AccountChip` for the lens form). Selecting a source no longer reveals per-source pills
(D7), so the earlier "embedded picker" / `detail` slot is unnecessary — dropping it
keeps the primitive lean (no nested-interactive-content concern, no per-row expansion
state). The `leading` snippet receives the option and, when supplied, **stands in for
the plain label** (the label span is suppressed so an `AccountChip` — which already
carries the name — doesn't render the name twice); `option.label` still drives the
search filter and the option's accessible name (`aria-label`). The checkbox-square
toggle and keyboard wiring stay inside the primitive. *Alternative:* a
full `row` snippet owning the toggle — rejected; it would push checkbox semantics and the
listbox keyboard model out of the primitive into every caller.

**D4 — Search composes `SearchField` (`mode="input"`), shown only past a threshold
(`searchThreshold`, default 8).** Reusing the pill primitive honours the no-re-roll
rule and inherits its focus ring + clear affordance. Gating on count keeps short lists
chrome-free. Filtering is a case-insensitive **subsequence (fuzzy) match** over the
option's `label` plus an optional per-option `keywords` string, computed in the primitive;
`ArrowDown` from the field hands focus to the first visible row, `Escape` closes. The
`keywords` field lets a caller fold non-displayed search text into a row — the lens form
sets it to each source's provider/type (and host), so typing a type (e.g. "rss", "git")
or host finds a source whose visible name omits it (user feedback). *Alternative:*
always-show search — rejected as noise on 3-item lists. *Alternative:* substring-only —
rejected; fuzzy + type keyword is what the long source list needs to be navigable.

**D5 — Trigger summary is parent-computed (`label` prop); no separate count pill.**
The "All feeds / one name / N selected" summary needs i18n + the per-axis "All …" string
the caller already owns (`m.launcher_lensAllFeeds()` etc.). Passing a computed `label`
keeps the primitive i18n-free; the new `launcher_lensScopeSelected` key supplies the
`"{count} selected"` case. An accent count pill was originally specified, but since the
parent summary already carries the count in the multi case (e.g. "3 selected"), a pill
just duplicates that number — so it is dropped (user feedback). "Engaged" is instead read
from the trigger's accent-tinted resting border while any value is selected. *Alternative:*
primitive computes the summary — rejected; it would hard-code the noun and pull message
keys into a generic primitive.

**D6 — All three overview axes adopt `MultiSelect`, not just feeds.** The user asked for
feed↔repo parity; the cheapest *correct* parity is to route all three identical overflow
sites through the same primitive. The feed picker also gains the `ariaLabel` it lacked
(`launcher_lensFilterByFeed`), closing a pre-existing a11y gap repos/projects didn't have.

**D7 — A lens is "all your stuff" from its sources; per-source query selection is
removed.** The editor previously made you pick, per git/jira source, which relation
queries to fetch (`authored` / `assigned` / `review-requested`), each becoming its own
section. That is friction at creation and duplicates what the overview filter already
does. This change defaults every selected source to its **full** query set
(`QUERY_ORDER` for non-`rss`, none for `rss`) and removes the per-source pills, the
`toggleQuery`/`queriesById` state, and the "pick a filter per source" confirm gate.
Narrowing moves entirely to the overview filter. *Consequence (accepted with the user):*
a lens always pulls all relation lanes, so you can no longer build a "review-requested
only" lens, and git/jira sources fetch ~3× the sections; the overview groups the lanes
but cannot narrow to one relation (the filter axes are entity/repo/project/feed, not
relation). *Data model unchanged:* `LensSourceRef.queries` stays a non-empty array for
non-`rss` sources — it is simply always the full set now, so no schema or migration
change. *Alternative:* keep query selection behind an "advanced" toggle — rejected as
re-introducing the friction the product is removing.

No decision here implies a `docs/` change: the primitive inventory is pinned by the
`visual-system` spec (updated via this change's delta), and the import-layer DAG and
token contract are unchanged. `docs/architecture.md`, `docs/tech-stack.md`, and
`CLAUDE.md` stay as-is.

## Visual language

The deliberate stance: **this is not a new look — it is `Select` extended to multi**, so
repos and feeds read as one family and the overview stays calm. Boldness is spent in one
place (D-Chanel): the **checkbox-square toggle**.

- **Selection (the signature).** Each row carries an 18px rounded square
  (`--r-xs`) outlined `inset 0 0 0 1.5px var(--border-strong)` when off; on, it fills
  `var(--accent)` with a `--accent-text` check. The row also gets the `--accent-soft`
  wash + `--text` label (matching `Select`'s selected row), so selection reads twice —
  box fill and row tint — for redundancy under low contrast / colour-blindness.
- **Trigger.** Mirrors `Select`/`TextInput`: recessed `--bg`, `1px var(--border)` idle,
  `--border-strong` on hover. Any active selection tints the resting border toward
  accent (`oklch(from var(--accent) l c h / 0.4)`) so "engaged" shows before opening;
  focus/open glides to the accent halo (`0 0 0 3px var(--accent-soft)` + `--bg-elev`).
  The count, when wanted, is carried by the parent-computed summary (e.g. "3 selected"),
  so there is no separate count pill to duplicate it.
- **Popover.** An opaque `elevated` `Surface` (not glass — a dropdown over a form must
  not bleed), `radius="md"`, entering with `select-in`-style `translateY(-4px)` + fade
  over `--motion-fast` `--ease-emphasised`. A header row (live count + a `--accent`
  Clear link) appears only while a selection exists, set off by a `--border-soft`
  hairline. The chevron rotates 180° to accent on open.
- **Search.** The `SearchField` pill sits above the list, inheriting its leading glyph +
  focus ring; no extra chrome.
- **Inline mode (lens form).** Same rows in a bordered always-open panel (no trigger /
  popover). Each row's `leading` is the source's `AccountChip` (provider
  glyph + label + auth status); the checkbox-square marks membership. No per-source pills.
- **Motion + a11y.** All transitions `--motion-fast`/`--motion-base` with token easings;
  `prefers-reduced-motion` removes the popover animation, the chevron rotation, and the
  box fill transition. Full keyboard listbox model (roving `↑/↓`, `Home/End`, `Esc`,
  `Tab` to leave); `role="listbox"` + `aria-multiselectable` + per-row `aria-selected`;
  trigger `aria-haspopup="listbox"` + `aria-expanded`. Accent-on-`--accent-text` and
  accent-soft washes hold WCAG-AA at `subtle | standard | vivid`.

Where Lunma diverges from Arc: Arc's filter menus are flat OS-style checkmark lists; the
checkbox-square + accent wash give a more tactile, on-brand multi-toggle that ties the
control to the active Space's colour.

## Risks / Trade-offs

- **Two presentations in one primitive grow its surface.** → `mode` only swaps chrome;
  the row/selection/search/keyboard core is shared and covered by unit tests, so the
  branch points are few and explicit.
- **Recomposing `LensEditor` changes its DOM + testids.** → The bespoke `account-pick-*`
  rows become `MultiSelect` option rows (`multi-select-option` keyed by `data-value`=
  account id; the inline list root carries `smart-source-list`). `LensEditor.test.ts` is
  updated in the same change to target the new structure; source-selection and
  empty-set-blocks-confirm behaviour are preserved and re-asserted.
- **Removing per-source query selection loses relation scoping (D7).** → Accepted with
  the user: a lens fetches all relation lanes; this is the "all your stuff, narrow in the
  overview" direction. Reversible — the query model and `LensSourceRef.queries` schema are
  intact, so a future change can reintroduce relation picking without a migration.
- **Search focus handoff is fiddly.** → Reuse `Select`'s proven roving model; add only
  the `ArrowDown`-from-field → first-row transition, unit-tested.
- **i18n drift across 9 locales.** → The 4 keys are added to every locale file in this
  change; `pnpm verify` (paraglide compile + typecheck) fails on a missing key.

## Migration Plan

Pure presentation swap, no data/runtime migration. Ship behind no flag: the overflow
path silently upgrades from single- to multi-select (persisted `LensFilter` arrays
already hold multiple values — the predicate always supported it; only the UI gated it).
Rollback is reverting the `OverviewPage`/`LensEditor` wiring to `Select`/the bespoke
list; `MultiSelect` itself is additive and inert if unused.

## Open Questions

None outstanding — `mode`, `searchThreshold` default (8), the `leading`-only slot model,
the all-three-axes scope, and the "lens = all your stuff" simplification (D7, dropping
per-source query selection) were resolved with the user before authoring.
