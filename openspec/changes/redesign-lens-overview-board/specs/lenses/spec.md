## ADDED Requirements

### Requirement: The overview surfaces a cross-entity "Waiting on you" lane

The lens overview page SHALL render a **"Waiting on you" lane** above the entity sections (between the lens identity and the board) whenever it has at least one actionable item, surfacing the items that need the user's action **across entities** in one place. Lane membership SHALL be derived from the existing per-item signals — no new persisted field and no connector change:
- a **Change** whose source query resolves to the `waiting` relation (`relationOf(query) === 'waiting'`, i.e. `review-requested`) — reason **"review requested"**;
- a **Change** whose relation is `authored` and whose CI tone is `failing` (`ciLight().tone === 'failing'`) — reason **"CI failing"** (rendered in `--danger`);
- a **Ticket** whose source query is `assigned` and whose status is not done — reason **"assigned to you"**.

Items SHALL be ordered review-requested → CI-failing → assigned and capped (default 6) with an overflow count in the lane header. A lane item SHALL remain in its home entity section (the lane is a focus overlay, not a move). Each lane row SHALL lead with an **entity badge** (see "The lane row distinguishes entity type with a badge"), show the title (which MAY clamp to two lines as a compact summary) with the ticket/MR key as a ref chip, carry a meta line leading with the provider name, and show its reason right-aligned. The lane SHALL carry the active Space's hue glow and SHALL hold under reduced-motion and WCAG-AA at every Colour-intensity level. Activating a lane row SHALL reuse `openLensItem` (the same activation path as the sections).

#### Scenario: The lane surfaces a review-requested change

- **GIVEN** a lens with a change surfaced by a `review-requested` query
- **WHEN** the overview renders
- **THEN** the "Waiting on you" lane shows that change with the reason "review requested" and the change also still appears in its Changes section

#### Scenario: The lane surfaces an assigned ticket and a CI-failing authored change

- **GIVEN** a lens with a ticket from an `assigned` query (status To Do) and an `authored` change whose CI tone is `failing`
- **WHEN** the overview renders
- **THEN** the lane shows the CI-failing change (reason "CI failing", in the danger tone) and the assigned ticket (reason "assigned to you")

#### Scenario: No actionable items hides the lane

- **GIVEN** a lens whose items are all authored changes with passing CI and no assigned tickets
- **WHEN** the overview renders
- **THEN** no "Waiting on you" lane renders

#### Scenario: Activating a lane row reuses openLensItem

- **WHEN** the user activates a lane row in window 100
- **THEN** `openLensItem` is dispatched with the item's namespaced id and the existing bind/focus behaviour applies

### Requirement: The lane row distinguishes entity type with a badge

The overview SHALL provide a `ui/` primitive **`EntityBadge`** (`apps/extension/src/ui/EntityBadge.svelte`) that renders, for an `entity` of `change | ticket | article`, a distinct **glyph** (a pull-request/branch mark for `change`, an issue-dot for `ticket`, an article mark for `article`) over the entity's **section-dot hue** (`change → 252`, `ticket → 295`, `article → 150`) composed through the theme-aware accent-pill tokens (`--accent-text-l` / `--accent-fill-a`). The "Waiting on you" lane SHALL use `EntityBadge` as each row's leading element so a PR and a ticket are distinguishable **immediately by shape and by colour** (the shape carries the meaning so the distinction survives colour-blindness). The badge SHALL hard-code no design values (it reads tokens only) and SHALL carry a catalog story. Glyphs SHALL come from the shared `Icon` set.

#### Scenario: A change lane row and a ticket lane row read as different entities

- **GIVEN** a "Waiting on you" lane holding one review-requested change and one assigned ticket
- **WHEN** the lane renders
- **THEN** the change row leads with the pull-request glyph on the change-blue (`252`) badge and the ticket row leads with the issue-dot glyph on the ticket-purple (`295`) badge

#### Scenario: EntityBadge carries a catalog story

- **WHEN** the catalog story-parity guard runs
- **THEN** a story exists at `apps/extension/catalog/stories/ui/EntityBadge.stories.svelte` covering the `change`, `ticket`, and `article` entities

## MODIFIED Requirements

### Requirement: The page renders all resolved sections

When mirroring a lens, the lens overview page SHALL render the lens's items grouped by **entity** — not by source section — as a **width-aware board**, with one **collapsible** section per **populated** entity. On a **wide** overview (the content box is wide enough for two readable columns) the **Changes** and **Issues** sections occupy two side-by-side columns when **both** are populated; when only one of the two is populated, that section spans the full width. **Articles** and **Other** always span the full width beneath the Changes/Issues row. On a **narrow** overview every populated section stacks in the canonical order **Changes → Issues → Articles → Other** (the `LensEntity` order `change → ticket → article → generic`). The two-column switch SHALL be driven by a **CSS container query on the overview content box** (not a window media query). A single source section MAY feed more than one entity section (e.g. one GitHub section contributes both Changes (PRs) and Issues). Each section SHALL render a header (its label + an attention/item count) that toggles the section collapsed/expanded (`aria-expanded`), above its items. The page header SHALL show the lens identity (name + a provider subline). When the lens has no items the page SHALL render a single calm empty note — never per-section skeletons. The existing calm per-section states SHALL be preserved — `pending` → static ghosts; `error` → last-known items plus a dim "Couldn't reach ⟨host⟩" note; `signed-out` → the per-source sign-in / "Add a token in Settings → Connectors" affordance; `needs-access` → the muted "Lunma needs access to ⟨host⟩" grant prompt invoking `requestHostPermissions` — and no non-`ok` state SHALL render as a red error card.

#### Scenario: One source section feeds two entity sections in canonical order

- **GIVEN** a lens whose single GitHub section holds a PR and an issue, both `ok`
- **WHEN** the page renders
- **THEN** it shows a Changes section and an Issues section, the PR under Changes and the issue under Issues

#### Scenario: Changes and Issues render side-by-side on a wide overview

- **GIVEN** a lens with populated Changes and Issues and a wide content box
- **WHEN** the page renders
- **THEN** Changes and Issues occupy two side-by-side columns and Articles (if present) spans the full width beneath

#### Scenario: A single populated entity spans the full width

- **GIVEN** a feed-only lens (only Articles populated) at any width, or a review-only lens (only Changes populated) on a wide content box
- **WHEN** the page renders
- **THEN** the single populated section spans the full width (no empty second column)

#### Scenario: A narrow overview stacks sections in canonical order

- **GIVEN** a lens with populated Changes, Issues, and Articles and a narrow content box
- **WHEN** the page renders
- **THEN** the sections stack vertically in the order Changes → Issues → Articles

#### Scenario: A section header collapses and expands

- **GIVEN** a lens overview with a populated Changes section
- **WHEN** the user activates the section header
- **THEN** `aria-expanded` toggles and the section's rows hide/show

#### Scenario: An empty lens renders one calm empty note

- **GIVEN** a lens with no items in any entity
- **WHEN** the page renders
- **THEN** it shows a single calm empty note and no section skeletons

### Requirement: The page item is a card with optional content slots

The overview's result units SHALL be **entity-specific**, each composing existing `ui/` primitives and never re-rolling them or hard-coding design values:
- **Change** rows present in **two lines**: line one is the full `title` with its optional linked-ticket ref chip; line two is the triage line — a `host/owner/repo` repo label (host from the source `baseUrl`, `owner/repo` from `change.repo`) followed by a right-aligned triage cluster of three orthogonal signals: a **CI light** (from `status`; a `draft` shows a distinct hollow glyph), a `ReviewerRail` (blocking-wins verdict `changes` > `pending` > `approved`), and a `Diffstat` (`change.additions`/`deletions`). A relative age (from `change.updatedAt`) that warms past a staleness threshold MAY ride the triage line. Change rows MAY be grouped by their source query into labelled lanes (e.g. "Authored", "Review requests").
- **Issue** rows present in **two lines**: line one is the ticket `key` (aligned to the title line) and the title (stripped of a leading key prefix); line two is the **assignee** (an `Avatar` + display name from `ticket.assignee`, or a hollow-ring "Unassigned" affordance when absent), an **updated-age** freshness cue that warms to `--warning` past a staleness threshold (> 1 week), and a right-aligned priority pill. Issues are grouped by status (the status is the group header).
- **Article** cards render a hero (a real `imageUrl` loaded with `loading="lazy"` + `referrerpolicy="no-referrer"`, else a generated cover — the title initial in the display serif over a Space-hue wash, at the same ratio), the full title, a clamped excerpt, any `categories` chips, and a meta footer (source · relative `publishedAt` · category); each card carries a read toggle. Article **thumbnails SHALL be quiet at rest** — dimmed + desaturated — and SHALL restore to full colour on hover/focus (the transition collapsing to instant under `prefers-reduced-motion`). The Articles section is switchable between a magazine **grid** (responsive multi-column) and a **list** (a full-width single column — the list is not multi-column; the grid is the multi-column browse view).
- **Other** items render a compact row (title + favicon + at most one status dot).

Every unit SHALL show the full `title` — wrapping to as many lines as needed, never truncated (no ellipsis) — and SHALL render an optional region only when the item carries that field (absent regions collapse to zero height). This requirement is descriptive, not prohibitive: connectors MAY populate additional optional `LensItem` fields additively with no rewrite of this surface and no schema migration (results are ephemeral).

#### Scenario: A change row shows its triage signals across two lines

- **GIVEN** a Change with CI `ok`, two reviewers (one approved, one pending), `+112 −40`, updated 2h ago, and a linked ticket
- **WHEN** its row renders
- **THEN** line one shows the full title and the linked-ticket chip, and line two shows the repo label, the CI light, a reviewer rail with the pending verdict, and a `+112 −40` diffstat

#### Scenario: An issue row shows owner and freshness

- **GIVEN** an Issue `PAY-91` with priority `urgent`, assignee "Tina T.", last updated 2 weeks ago, under status "To Do"
- **WHEN** the Issues section renders
- **THEN** line one shows `PAY-91` aligned to the title with the key prefix stripped, and line two shows Tina T.'s avatar + name, an amber "2w" freshness cue, and a right-aligned `urgent` pill, under a "To do" group header

#### Scenario: An unassigned issue shows the hollow affordance

- **GIVEN** an Issue whose `ticket.assignee` is absent
- **WHEN** its row renders
- **THEN** the assignee slot shows a hollow-ring "Unassigned" affordance rather than an avatar

#### Scenario: An article thumbnail is quiet at rest and wakes on hover

- **GIVEN** an article with a bright `imageUrl`
- **WHEN** its card renders at rest, then is hovered
- **THEN** the thumbnail is dimmed + desaturated at rest and restores to full colour on hover (instant under reduced-motion)

#### Scenario: An article renders as a grid card switchable to a list row

- **GIVEN** an article carrying `excerpt`, `imageUrl`, `publishedAt`, and `categories`
- **WHEN** the Articles section renders and the user switches to List
- **THEN** it first shows a magazine card in the responsive grid, then a compact full-width single-column list row for the same item

#### Scenario: A title is never truncated

- **WHEN** any section unit renders an item whose title exceeds one line
- **THEN** the title wraps and is shown in full (no ellipsis)

### Requirement: The Changes entity section renders the Review Queue archetype

The **Changes** entity section of the overview SHALL render the **Review Queue** archetype over the change-bucket resolved sections of the lens (its `github`/`gitlab`/`bitbucket` sections). It SHALL group changes into **relationship lanes** derived from each source's query: a `review-requested` query feeds a "Review requests" lane, an `authored` query feeds an "Authored" lane, and an `assigned` query feeds an "Assigned" lane; empty lanes are dropped and the remaining lanes render in that priority order.

Each change SHALL render as a **two-line row** (not a magazine card): line one presents a **provider monogram** (`GH`/`GL`/`BB`) leading the change title with its optional linked-ticket ref; line two presents a **repo label** (`change.repo`) followed by a right-aligned **triage cluster** of three orthogonal signals — a **CI light** derived from the item `status` tone (with a `draft` change shown as a **distinct hollow glyph** in that locus), a **`ReviewerRail`** (a blocking-wins verdict glyph `changes` > `pending` > `approved` leading verdict-ringed reviewer `Avatar`s, composed from the change's `reviewers`; each reviewer's `state`, absent → `pending`), and a **`Diffstat`** of `change.additions`/`deletions`. The row SHALL NOT render a separate review-state pill: the `ReviewerRail` verdict glyph is the row's single review-state signal, and the per-reviewer `Avatar` rings carry each reviewer's state. The row SHALL re-roll none of the reviewer/diffstat affordances — it composes the `ReviewerRail`, `Avatar`, and `Diffstat` primitives and reads their design tokens only through them. The title SHALL never be truncated. Activation SHALL reuse `openLensItem` and the existing per-window bind/focus semantics; the existing calm pending/error/signed-out/needs-access states SHALL be reused; no non-`ok` state SHALL render as a red error card.

#### Scenario: The Changes section renders lanes of rows

- **GIVEN** a lens with `review-requested` and `authored` github sections, all `ok`
- **WHEN** the overview renders
- **THEN** the Changes section shows a "Review requests" lane above an "Authored" lane of `Change` rows — not magazine cards

#### Scenario: A row shows the change's triage signals on its second line

- **GIVEN** a review change with CI `ok`, two reviewers (one approved, one pending), and `+112 −40`
- **WHEN** its row renders
- **THEN** line one shows the provider monogram and the full title, and line two shows the `change.repo` label, a CI light, a `ReviewerRail` whose leading verdict glyph is `pending` with one approved-ringed and one pending-ringed reviewer `Avatar`, and a `+112 −40` `Diffstat`
- **AND** it renders no separate review-state pill

#### Scenario: A draft change shows a hollow CI light

- **GIVEN** a review change whose `change.draft` is `true`
- **WHEN** its row renders
- **THEN** the CI locus shows a distinct hollow glyph and no state pill

#### Scenario: Activation reuses openLensItem

- **WHEN** the user activates a change row in window 100
- **THEN** `openLensItem` is dispatched with the namespaced item id and the existing bind/focus behaviour applies

### Requirement: The Articles entity section renders a magazine

The **Articles** entity section of the overview SHALL render the magazine archetype over the lens's `rss` (article-bucket) resolved sections, merging every feed into one section. It SHALL render two layouts selected by the persisted per-lens `articleLayout` (read as `node.articleLayout ?? 'grid'`, written via `setLensArticleLayout`): a **Grid** — the responsive **multi-column** magazine of cover/initial cards — and a **List** — a **full-width single column** (the List is deliberately not multi-column; the Grid is the multi-column browse view, so the two do not duplicate). In both layouts article **thumbnails SHALL be quiet at rest** (dimmed + desaturated) and restore to full colour on hover/focus. It SHALL reuse the existing feed card rendering and the existing per-feed reading controls. It SHALL render section controls: the **layout toggle** (Grid | List) plus two **page-local ephemeral** controls (no persistence, no bus command): a **feed scope filter** (chips: "All feeds" + one per feed source, narrowing the rendered articles) living within the Articles card, and an **unread filter** (toggle showing the unread count, narrowing to unread items). An unread item in List layout SHALL carry a leading accent unread dot. The section SHALL render only when the lens has at least one `rss` source.

#### Scenario: The Articles section merges feeds with magazine cards

- **GIVEN** a lens with three `rss` feeds, all `ok`
- **WHEN** the overview renders
- **THEN** the Articles section shows one merged magazine across the three feeds, with an in-card feed filter, a Grid/List toggle, and an Unread toggle

#### Scenario: List is a full-width single column, Grid is multi-column

- **GIVEN** a lens whose Articles section holds many articles on a wide overview
- **WHEN** the user views Grid, then switches to List
- **THEN** Grid renders responsive multi-column cards filling the width, and List renders a full-width single column (not multi-column)

#### Scenario: A thumbnail is quiet at rest and wakes on hover

- **GIVEN** an Articles card or list row with a bright image
- **WHEN** it renders at rest, then is hovered
- **THEN** the thumbnail is dimmed + desaturated at rest and full colour on hover

#### Scenario: The feed filter narrows to one source

- **GIVEN** the Articles section showing three feeds
- **WHEN** the user activates a single feed's filter chip
- **THEN** only that feed's articles render, and no state is persisted

#### Scenario: The unread filter narrows to unread items

- **GIVEN** the Articles section with 6 articles, 3 unread
- **WHEN** the user activates the Unread toggle (labelled with the count)
- **THEN** only the 3 unread articles render

### Requirement: The lens overview filters items by scope, per entity card

The lens overview SHALL offer **scope filters** placed **inside their owning entity card** (not in a top filter bar): the distinct host-qualified `change.repo` values inside the **Changes** card, the `ticket.project` values inside the **Issues** card, and the feed-name values inside the **Articles** card. The overview SHALL NOT render an entity-**type** filter control — entities are always-visible board sections, and the per-section collapse hides a section. (The `LensFilter.entities` axis and the `applyLensFilter` type predicate remain in the data model for the sidebar and programmatic use; the overview simply authors no entity-type filter.) Each scope filter SHALL render as toggle chips when there are five or fewer of a kind, otherwise as a multi-select listbox (`MultiSelect`) that selects any number of scope values at once and, once the facet count exceeds the `MultiSelect` search threshold, surfaces an in-popover search box. The overflow control SHALL NOT reduce the axis to a single selectable value. Scope facet values SHALL be the union of values present in the held items and values currently selected, so a selection is never stranded by a transient empty fetch. Every overflow scope picker SHALL carry an accessible name — repos, projects, and feeds.

Toggling a scope facet SHALL update the lens filter through the `setLensFilter` command (persisted, not page-local), and the overview SHALL re-render the narrowed set via `applyLensFilter`. The scope filters SHALL compose existing `ui/` primitives (`Chip` — using its shipped `selected`/`onToggle`/`aria-pressed` contract — and `MultiSelect`) and SHALL NOT re-roll a toggle chip nor a multi-select listbox inline nor override the `Chip` selected token from the feature. Selected facets SHALL use the `Chip` selected affordance (resolving to the lens's owning-Space hue) and SHALL hold under reduced-motion and WCAG-AA at every Colour-intensity level. Clearing a scope axis is done via the scope control's own clear (the `Chip` row toggles, or the `MultiSelect`'s in-popover Clear).

#### Scenario: Scope filters live in their entity card

- **GIVEN** a lens with Changes and Issues
- **WHEN** the overview renders
- **THEN** the repo scope filter renders inside the Changes card and the project scope filter inside the Issues card, and no entity-type filter bar renders

#### Scenario: Scope facets render a multi-select past the threshold

- **WHEN** the Changes in a lens span more than five distinct `change.repo` values
- **THEN** the repo scope facet renders as a `MultiSelect` (a multi-toggle listbox) rather than a chip row, and not as a single-select control

#### Scenario: The overflow scope picker selects multiple values

- **GIVEN** a lens whose Articles span more than five distinct feeds and an empty filter
- **WHEN** the user opens the feed `MultiSelect` and toggles two feeds on
- **THEN** `setLensFilter` is dispatched with `feeds` holding both feed values, and the overview narrows to items from either feed

#### Scenario: The overflow scope picker offers search for long lists

- **GIVEN** a feed scope picker whose option count exceeds the `MultiSelect` search threshold
- **WHEN** the picker opens
- **THEN** an in-popover search box renders and typing into it narrows the listbox to matching feed names

#### Scenario: Each overflow picker has an accessible name

- **GIVEN** a lens whose Changes, Issues, and Articles each overflow their scope facet
- **WHEN** the pickers render
- **THEN** each exposes an accessible name (repos, projects, and feeds respectively)

#### Scenario: A selected value absent from the current fetch stays clearable

- **GIVEN** a persisted filter `repos: ['o/gone']` where `o/gone` is absent from the latest items
- **WHEN** the Changes scope filter renders
- **THEN** an `o/gone` value still renders (selected) so the user can deselect it, and it is not auto-pruned from the persisted filter
