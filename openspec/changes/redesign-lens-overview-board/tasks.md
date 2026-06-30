## 1. Provider subtitle bug fix (applied)

- [x] 1.1 Type `LensPage.svelte`'s `PROVIDER_NAME` as `Record<LensProvider, string>` incl. `bitbucket`; derive provs as `LensProvider[]` (no cast) so a missing provider is a compile error, not `"… & undefined"`

## 2. EntityBadge primitive

- [ ] 2.1 Confirm the entity glyphs exist in the `Icon` set (pull-request/branch, issue-dot, article); if any is missing, add it to the icon source + regenerate `icon-loaders.generated.ts` (a listed deviation — update design.md if names differ)
- [ ] 2.2 Add `apps/extension/src/ui/EntityBadge.svelte` — prop `entity: 'change' | 'ticket' | 'article'`; renders the entity glyph over the section-dot hue (`change 252 / ticket 295 / article 150`) via `--accent-text-l`/`--accent-fill-a`; tokens only, no hard-coded design values
- [ ] 2.3 Add `apps/extension/catalog/stories/ui/EntityBadge.stories.svelte` covering change/ticket/article (story-parity guard)

## 3. Width-aware board layout

- [ ] 3.1 `LensPage.svelte`: raise `.main` measure cap from `min(94vw, 1080px)` to `min(96vw, 1440px)`
- [ ] 3.2 `OverviewPage.svelte`: make `.overview` a container (`container-type: inline-size`); render Changes + Issues in a `.board` that is single-column by default and two-column at `@container (min-width: ~1040px)` only when **both** are populated; a single populated entity spans full width; Articles + Other always full width
- [ ] 3.3 Preserve section collapse, canonical stacking order on narrow, and all calm pending/error/signed-out/needs-access states

## 4. "Waiting on you" lane

- [ ] 4.1 `overview-vm.ts`: add a pure `waitingOnYou(tagged)` deriving the lane set — review-requested changes, CI-failing authored changes, assigned non-done tickets — ordered + capped (6) with overflow count; reuses `relationOf`/`ciLight`, no new data field
- [ ] 4.2 `OverviewPage.svelte`: render the lane above the board (only when non-empty) with the Space hue glow (`--glow-space-soft`); each row leads with `EntityBadge`, shows title (may clamp 2 lines) + key ref chip, a provider-led meta line, and the right-aligned reason ("review requested" / "CI failing" in `--danger` / "assigned to you"); rows activate via `openLensItem`
- [ ] 4.3 i18n: add lane heading + reason message keys to `messages/en.json`

## 5. Two-row change rows

- [ ] 5.1 `OverviewPage.svelte`: restructure the Changes section row to two lines — line 1 full title (wraps, no truncation) + ticket-ref; line 2 repo label + right-aligned triage cluster (CI light · `ReviewerRail` · `Diffstat`); keep the provider monogram, single `<button>` activation, hollow draft glyph, no review-state pill

## 6. Enriched issue rows

- [ ] 6.1 `OverviewPage.svelte`: two-line issue row — line 1 issue-key aligned to the title line + stripped title; line 2 assignee (`Avatar` + name, hollow-ring Unassigned when `ticket.assignee` absent) · updated-age freshness (warms to `--warning` past 1 week) · right-aligned priority pill; keep status grouping
- [ ] 6.2 Add a `relTime`/staleness helper path for ticket `updatedAt` if not already exposed by `overview-vm`; i18n for "Unassigned" + any freshness string

## 7. Filters per-card; remove entity-type bar

- [ ] 7.1 `OverviewPage.svelte`: render repo scope inside the Changes card, project scope inside Issues, feed scope inside Articles (chips ≤5 → `MultiSelect` overflow, accessible names, union, `setLensFilter` persistence preserved)
- [ ] 7.2 Remove the entity-type filter bar usage from `OverviewPage.svelte` and delete `LensFilterBar.svelte`; leave `LensFilter.entities` + `applyLensFilter` type axis untouched (no migration; sidebar honour-filter unaffected)
- [ ] 7.3 Remove the "incl. CI" trailing label on the Changes header
- [ ] 7.4 i18n: remove now-unused entity-filter + "incl. CI" message keys (keep the scope picker `launcher_lensFilterBy*` keys)

## 8. Quiet feed (List capped, Grid quiet thumbnails)

- [ ] 8.1 `OverviewPage.svelte`: List view = single column capped to a comfortable reading measure (~900px); Grid view unchanged (responsive multi-column)
- [ ] 8.2 Article thumbnails (grid hero + list strip): dimmed + desaturated at rest, restore to full colour on hover/focus; transition guarded by `prefers-reduced-motion`

## 9. Docs

- [ ] 9.1 Update `docs/lenses-vision.md` overview-model section: the board, the "Waiting on you" lane, the two-row change/issue anatomy, List-vs-Grid

## 10. Tests & quality gates

- [ ] 10.1 Update/replace existing `LensFilterBar` / entity-facet vitest coverage (the type-facet scenarios are removed); add coverage for `waitingOnYou` derivation + ordering/cap
- [ ] 10.2 Add component/scenario coverage for the new/modified spec scenarios (board two-column vs single, lane membership + entity badges, two-row change/issue rows, quiet thumbnail at rest→hover, scope-in-card filters)
- [ ] 10.3 Confirm WCAG-AA via the contrast test for the new tokens used (entity badge hues, stale `--warning` age, lane wash) and reduced-motion behaviour
- [ ] 10.4 `pnpm verify` (tsc, biome incl. layer DAG, svelte-check, stylelint token contract, vitest incl. story-parity) green; `pnpm test:e2e` smoke
