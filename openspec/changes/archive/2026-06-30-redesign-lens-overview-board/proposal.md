## Why

The full-tab lens overview (`launcher/lenspage/`) renders as a vertical stack of equal-weight cards (Changes, then Issues, then Articles) capped at `min(94vw, 1080px)`. On a wide monitor this leaves large dark voids either side and a long vertical scroll, every entity reads at the same priority, change-row titles truncate early, and an issue row shows neither who owns it nor how stale it is. This change turns the overview into a **width-aware triage board**: the single most actionable bucket ("Waiting on you") leads, Changes and Issues sit side-by-side filling the canvas, rows carry the metadata you triage on, and the feed stays quiet. Direct user-visible value — faster daily triage of reviews + tickets + feeds, validated against the running app in a Chrome prototype with the maintainer.

It also folds in an already-applied root-cause fix: the lens-page provider subtitle printed "GitLab, Jira & **undefined**" because its local `PROVIDER_NAME` map omitted `bitbucket`; it is now typed `Record<LensProvider, string>` so a missing provider fails the typecheck.

## What Changes

- **Width-aware board.** Raise the page measure cap to `min(96vw, 1440px)`. On wide viewports Changes and Issues render as two side-by-side columns (each keeping its ≤~640px reading measure); Articles span full width beneath. Narrow viewports collapse back to the current single stack. Collapsible-section behaviour is preserved.
- **"Waiting on you" lane** (signature). A new lane pinned above the section cards aggregates the most actionable items **across entities** — review-requested-of-you / CI-failing changes and assigned-to-you issues — carrying the active Space's hue glow (`--glow-space-soft`). Each lane row leads with an **entity badge** (a pull-request/branch glyph tinted change-blue `252` vs an issue-dot glyph tinted ticket-purple `295`) so PRs and tickets separate at a glance by shape **and** colour (colour-blind safe); provider name moves into the meta line, the ticket key shows as a ref chip, and a right-aligned reason ("review requested" / "CI failing" in `--danger` / "assigned to you") explains why it's surfaced.
- **Two-row change rows.** A change row stacks to two lines: the title (clamped to 2 lines) on its own full-width line, and the triage cluster (repo · CI light · `ReviewerRail` · `Diffstat`) on a second line — ending the early title truncation in the narrower board column.
- **Enriched issue rows.** Issue rows go two-line, adding the assignee (avatar + name; a hollow ring for Unassigned) and an updated-age freshness cue (stale > 1 week renders in `--warning` amber); the priority pill is right-aligned and the leading issue-key aligns to the title line.
- **Filters stay per-card.** Keep repo scope inside the Changes card, project scope inside Issues, feed scope inside Articles (chips ≤ 5, "All …" `MultiSelect` past that). **BREAKING (spec behaviour):** **remove** the entity-type filter bar (Changes/Issues/Articles toggles) — redundant once entities are always-visible columns/sections; hiding a section is served by the existing per-card collapse. Remove the "incl. CI" trailing label on the Changes header.
- **Quiet feed.** Article thumbnails dim + desaturate at rest and restore to full colour on hover/focus (keeps "a quiet magazine" calm despite loud feed images). The **List** view stays a single column capped to a comfortable reading measure (it does not become multi-column — that is what **Grid** already is); **Grid** keeps its existing responsive multi-column cards. Denser list rows.

## Capabilities

### New Capabilities
<!-- none — the board, lane, and row changes are rendering behaviour within the existing lenses capability -->

### Modified Capabilities
- `lenses`: the full-page lens overview's rendering and filtering requirements change — the page lays out as a width-aware board with a cross-entity "Waiting on you" lane; change/issue rows gain a two-line layout with reviewer/CI/assignee/freshness metadata; the lane introduces an entity-type badge; the type+scope filter requirement drops the entity-type dimension and keeps scope (repos/projects/feeds) per-card; the Articles List view is a capped single column (Grid unchanged); article thumbnails are quiet-at-rest.

## Impact

- **Code:** `apps/extension/src/launcher/lenspage/LensPage.svelte` (measure cap, lane data derivation, provider subtitle fix — applied), `OverviewPage.svelte` (board layout, lane, two-row change/issue rows, per-card scope only, quiet/capped articles), `LensFilterBar.svelte` (entity-type bar removed; component retired or reduced — confirm at design). Lane "waiting on you" derivation reads existing `change.relation` / ticket assignment + CI tone already present on items; no connector/data-layer change.
- **Primitives:** composes existing `src/ui/` primitives — `Chip`, `Diffstat`, `ReviewerRail`, `Avatar`, `Icon`, `MultiSelect`, `Surface`, `Tooltip`. **New primitive:** `src/ui/EntityBadge.svelte` (entity-type glyph + section-dot hue), with its catalog story `apps/extension/catalog/stories/ui/EntityBadge.stories.svelte` (story-parity guard). The lane, board, and two-row rows are OverviewPage feature composition.
- **Docs:** updates `docs/lenses-vision.md` (the overview model: board + lane + row anatomy). Leaves `docs/architecture.md`, `docs/tech-stack.md` untouched (no layer/stack change). An ADR for "board over stack" is optional and decided at design.
- **i18n:** new message keys for the lane heading + reasons and the assignee/freshness/unassigned strings; remove the now-unused entity-filter + "incl. CI" keys.
- **Gates:** `pnpm verify` (tsc, biome incl. layer DAG, svelte-check, stylelint token contract, vitest incl. story-parity), WCAG-AA contrast test, reduced-motion. No new dependencies.
