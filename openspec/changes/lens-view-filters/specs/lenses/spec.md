## ADDED Requirements

### Requirement: A lens carries an optional view filter

A lens `PinNode` SHALL carry an optional `filter?: LensFilter` field, where
`LensFilter` is `{ entities?: LensEntity[]; repos?: string[]; projects?: string[] }`
and every axis is optional. The field is **additive and backward-compatible**: an
absent `filter`, an empty object, and a filter whose every array is empty are all
equivalent and mean "no narrowing" (identical to a lens that has never been
filtered). The `filter` SHALL persist with the rest of the node configuration and
round-trip losslessly through `reorderPinned` and a SW restart. It is a property of
the lens (global), not of any window.

`applyLensFilter` (in `shared/lens-filter.ts`) SHALL be the single, pure predicate
both surfaces use, so the overview and the sidebar always agree. It operates on
`{ item: LensItem; host: string }` rows (each surface supplies the host from its
source config) so repo facets stay host-scoped. A row passes iff **both** axes pass:
- **type:** `entities` empty **or** `entityForItem(item) ∈ entities` (the `Other`
  type maps to the `LensEntity` value `generic`); and
- **scope:** a Change passes iff `repos` empty **or** its host-qualified repo key
  `${host}/${change.repo}` ∈ `repos`; a Ticket passes iff `projects` empty **or**
  `ticket.project ∈ projects` (a project-less ticket therefore fails a non-empty
  `projects` filter and passes when `projects` is empty); Article and Other items
  carry no repo/project and SHALL always pass the scope axis (governed by the type
  axis alone).

When every axis is empty, `applyLensFilter` SHALL return its input unchanged.
`deriveLensFacets` SHALL emit host-qualified repo keys and SHALL drop `undefined`
from the `projects` facet list (project-less tickets contribute no project facet).

#### Scenario: A lens persists its view filter across restart

- **WHEN** the SW boots with a persisted lens whose node carries `filter: { entities: ['ticket'], projects: ['Payments'] }`
- **THEN** the node is restored with that `filter` intact and validates under the current-version schema

#### Scenario: An absent filter means show everything

- **GIVEN** a lens node with no `filter` field
- **WHEN** `applyLensFilter(items, node.filter ?? {})` runs
- **THEN** it returns `items` unchanged

#### Scenario: Scope narrows its own entity only

- **GIVEN** a lens holding Changes in `o/a` and `o/b` on `github.com`, Issues in project `Pay`, and Articles
- **WHEN** the filter is `{ repos: ['github.com/o/a'] }`
- **THEN** only `o/a` Changes survive, while all Issues and all Articles still pass (repo scope does not touch tickets or articles)

#### Scenario: Repo facets stay host-scoped

- **GIVEN** a lens with Changes in `o/a` on both `github.com` and an enterprise host `ghe.acme.com`
- **WHEN** the filter is `{ repos: ['github.com/o/a'] }`
- **THEN** only the `github.com` `o/a` Changes survive and the `ghe.acme.com` `o/a` Changes do not (the same slug on two hosts never merges)

#### Scenario: A project-less ticket under a project filter

- **GIVEN** a Ticket with no `project` and a Ticket in project `Pay`
- **WHEN** the filter is `{ projects: ['Pay'] }`
- **THEN** only the `Pay` ticket survives; the project-less ticket is excluded
- **AND WHEN** the filter is `{}` (or `projects` empty), both tickets pass and `deriveLensFacets` lists only `Pay` (no `undefined`) in `projects`

### Requirement: The lens overview filters items by type and scope

The lens overview page SHALL render a **filter bar** between the lens identity and
the first section. The bar SHALL offer **type facets** — one toggle per entity
present in the lens (Changes / Issues / Articles / Other, mapping to the `LensEntity`
values `change` / `ticket` / `article` / `generic`) — and **scope facets** — the
distinct host-qualified `change.repo` values (for Changes) and `ticket.project`
values (for Issues). Scope facets SHALL render as toggle chips when there are five or
fewer of a kind, otherwise as a `Select`. The bar SHALL render only facets that the
lens can offer (no Articles toggle for a lens with no articles); facet values SHALL
be the union of values present in the held items and values currently selected, so a
selection is never stranded by a transient empty fetch. The bar SHALL show a
**clear** control only while a filter is active.

Toggling a facet SHALL update the lens filter through the `setLensFilter` command
(persisted, not page-local), and the overview SHALL re-render the narrowed set via
`applyLensFilter`. The filter bar SHALL compose existing `ui/` primitives (`Chip` —
using its shipped `selected`/`onToggle`/`aria-pressed` contract — `Select`,
`IconButton`, `Divider`) and SHALL NOT re-roll a toggle chip inline nor override the
`Chip` selected token from the feature. Selected facets SHALL use the `Chip` selected
affordance (which resolves to the lens's owning-Space hue via the lens-page token
scope) and SHALL hold under reduced-motion and WCAG-AA at every Colour-intensity
level.

#### Scenario: Type facets render only for present entities

- **GIVEN** a lens with Changes and Issues but no Articles
- **WHEN** the overview renders
- **THEN** the bar shows Changes and Issues type facets and no Articles facet

#### Scenario: A type facet narrows the overview

- **GIVEN** a lens showing Changes, Issues, and Articles
- **WHEN** the user selects the Issues type facet only
- **THEN** only the Issues section renders and `setLensFilter` is dispatched with `entities: ['ticket']`

#### Scenario: Scope facets fall back to a Select past the threshold

- **WHEN** the Changes in a lens span more than five distinct `change.repo` values
- **THEN** the repo scope facet renders as a `Select` rather than a chip row

#### Scenario: Clearing resets the lens to everything

- **GIVEN** a lens with an active filter
- **WHEN** the user activates Clear
- **THEN** `setLensFilter` is dispatched with an empty filter and the overview shows every item again

#### Scenario: A selected value absent from the current fetch stays clearable

- **GIVEN** a persisted filter `repos: ['o/gone']` where `o/gone` is absent from the latest items
- **WHEN** the bar renders
- **THEN** an `o/gone` chip still renders (selected) so the user can deselect it, and it is not auto-pruned from the persisted filter

### Requirement: The sidebar lens listing honours the active filter

The sidebar lens listing SHALL apply the lens's `filter` (via `applyLensFilter`)
to each section's merged live + held items **before** the `ENTITY_RANK` sort and
**before** feed windowing / `maxItems`, so the per-section cap counts only items that
survive the filter. A lens with an active filter SHALL render a quiet **filtered
affordance** in its sidebar section (a funnel glyph / muted indicator) so the
narrowed list reads as intentional rather than as missing data; activating it SHALL
open the lens overview where the filter is authored. An unfiltered lens SHALL render
exactly as before this change (no affordance, no narrowing).

#### Scenario: The sidebar shows only matching rows

- **GIVEN** a lens filtered to `entities: ['change'], repos: ['o/a']`
- **WHEN** the sidebar renders the lens
- **THEN** only `o/a` Change rows appear; Issues, Articles, and other repos' Changes are absent

#### Scenario: The cap counts only surviving items

- **GIVEN** a feed lens with `maxItems: 5` and a filter that excludes most items
- **WHEN** the sidebar windows the section
- **THEN** the cap is applied to the filtered items, not the pre-filter set

#### Scenario: A filtered lens shows the filtered affordance

- **GIVEN** a lens with an active filter
- **WHEN** the sidebar renders it
- **THEN** a quiet filtered affordance appears on the section; an unfiltered lens shows none

### Requirement: Setting a lens filter persists through a bus command

The SW SHALL handle a `setLensFilter` command — payload `{ spaceId: SpaceId; folderId: FolderId; filter: LensFilter }` — by setting the resolved lens node's `filter`, persisting, and broadcasting the updated state, mirroring the existing per-lens preference mutation (`setLensHideRead`). An empty filter SHALL clear the field so persisted state stays canonical. The command SHALL be a no-op (or calm error) when the `folderId` does not resolve to a lens.

#### Scenario: Dispatching setLensFilter persists and broadcasts

- **WHEN** `setLensFilter` is dispatched with `filter: { entities: ['ticket'] }` for an existing lens
- **THEN** the node's `filter` is set, the state is persisted, and the new state is broadcast to all surfaces

#### Scenario: An empty filter clears the field

- **WHEN** `setLensFilter` is dispatched with an empty filter
- **THEN** the node's `filter` is cleared (absent/empty) and the lens shows everything again

## REMOVED Requirements

### Requirement: The review page filters changes by source and repo

**Reason**: Superseded by the general, persisted overview filter. Filtering is no
longer Review-only, no longer limited to source + repo facets, and no longer
page-local ephemeral state — it now covers type + repo + project facets across the
unified overview, persists on the lens node, and is shared with the sidebar.

**Migration**: The source/repo narrowing behaviour is subsumed by the new
requirements "A lens carries an optional view filter", "The lens overview filters
items by type and scope", and "The sidebar lens listing honours the active filter".
Source facets for multi-source lenses are retained as existing behaviour pending a
future `LensFilter.sources` axis; no persisted data migration is required because the
old filter was never persisted.

### Requirement: The review lens renders a Review Queue page

**Reason**: The shipped lens page is a single unified, entity-sectioned overview for
**every** lens kind — there is no longer a separate "Review Queue" archetype distinct
from a generic grid (the `GeneralLens`/Review-Queue page split was removed; only
`LensPage` + `OverviewPage` exist). A `review` lens and a `general` lens render the
same overview; what differs is which entity sections populate.

**Migration**: Review lenses now render the unified overview described by the
MODIFIED "The page renders all resolved sections" and "The page item is a card with
optional content slots" requirements. The Change-entity triage signals previously
specced here (CI light / draft glyph, full title, `host/owner/repo · @author`,
`ReviewerRail`, `Diffstat`, warming age, linked-ticket chip, and the
query-derived relationship lanes) now render in the **Changes section's change rows**
of that overview. Source/repo filtering is covered by the new filter requirements.
Change-entity normalisation ("A review lens normalises its sources into Change
entities" and the github-pr / gitlab-mr adapter requirements) is unchanged.

## MODIFIED Requirements

### Requirement: The page renders all resolved sections

When mirroring a lens, the lens overview page SHALL render the lens's items as a
single inline page grouped by **entity** — not by source section — with one
**collapsible** section per **populated** entity, in the canonical order
**Changes → Issues → Articles → Other** (the `LensEntity` order `change → ticket →
article → generic`). A single source section MAY feed more than one entity section
(e.g. one GitHub section contributes both Changes (PRs) and Issues). Each section
SHALL render a header (its label + an attention/item count) that toggles the section
collapsed/expanded (`aria-expanded`), above its items. The page header SHALL show the
lens identity (name + a provider subline). When the lens has no items the page SHALL
render a single calm empty note — never per-section skeletons. The existing calm
per-section states SHALL be preserved — `pending` → static ghosts; `error` →
last-known items plus a dim "Couldn't reach ⟨host⟩" note; `signed-out` → the
per-source sign-in / "Add a token in Settings → Connectors" affordance; `needs-access`
→ the muted "Lunma needs access to ⟨host⟩" grant prompt invoking
`requestHostPermissions` — and no non-`ok` state SHALL render as a red error card.

#### Scenario: One source section feeds two entity sections in canonical order

- **GIVEN** a lens whose single GitHub section holds a PR and an issue, both `ok`
- **WHEN** the page renders
- **THEN** it shows a Changes section and an Issues section (in that order), the PR under Changes and the issue under Issues

#### Scenario: A section header collapses and expands

- **GIVEN** a lens overview with a populated Changes section
- **WHEN** the user activates the section header
- **THEN** `aria-expanded` toggles and the section's rows hide/show

#### Scenario: An empty lens renders one calm empty note

- **GIVEN** a lens with no items in any entity
- **WHEN** the page renders
- **THEN** it shows a single calm empty note and no section skeletons

### Requirement: The page item is a card with optional content slots

The overview's result units SHALL be **entity-specific**, each composing existing
`ui/` primitives and never re-rolling them or hard-coding design values:
- **Change** rows present, left to right: a CI light (from `status`; a `draft` shows a
  distinct hollow glyph), the full untruncated `title`, a `host/owner/repo · @author`
  subline (host from the source `baseUrl`, `owner/repo` from `change.repo`), a
  `ReviewerRail` (blocking-wins verdict `changes` > `pending` > `approved`), a
  `Diffstat` (`change.additions`/`deletions`), and a relative age (from
  `change.updatedAt`) that warms past a staleness threshold; a linked ticket renders
  as a chip. Change rows MAY be grouped by their source query into labelled lanes
  (e.g. "Authored", "Requested your review").
- **Issue** rows present the ticket `key` + a priority pill and the title (stripped of
  a leading key prefix), grouped by status (the status is the group header, not a
  per-row pill).
- **Article** cards render a hero (a real `imageUrl` loaded with `loading="lazy"` +
  `referrerpolicy="no-referrer"`, else a generated cover — the title initial in the
  display serif over a Space-hue wash, at the same ratio), the full title, a clamped
  excerpt, any `categories` chips, and a meta footer (source · relative `publishedAt`
  · category); each card carries a read toggle, and the Articles section is
  switchable between a magazine **grid** and a compact **list** row.
- **Other** items render a compact row (title + favicon + at most one status dot).

Every unit SHALL show the full `title` — wrapping to as many lines as needed, never
truncated (no ellipsis) — and SHALL render an optional region only when the item
carries that field (absent regions collapse to zero height). This requirement is
descriptive, not prohibitive: connectors MAY populate additional optional `LensItem`
fields additively with no rewrite of this surface and no schema migration (results
are ephemeral).

#### Scenario: A change row shows its triage signals

- **GIVEN** a Change with CI `ok`, two reviewers (one approved, one pending), `+112 −40`, updated 2h ago, and a linked ticket
- **WHEN** its row renders
- **THEN** it shows the CI light, full title, `host/owner/repo · @author`, a reviewer rail with the pending verdict, a `+112 −40` diffstat, a "2h" age, and the linked-ticket chip

#### Scenario: An issue row shows key, priority, and status grouping

- **GIVEN** an Issue `PAY-91` with priority `urgent` under status "To Do"
- **WHEN** the Issues section renders
- **THEN** the row shows `PAY-91` + an `urgent` pill and its title with the key prefix stripped, under a "To do" group header

#### Scenario: An article renders as a grid card switchable to a list row

- **GIVEN** an article carrying `excerpt`, `imageUrl`, `publishedAt`, and `categories`
- **WHEN** the Articles section renders and the user switches to List
- **THEN** it first shows a magazine card (hero, title, clamped excerpt, category chips, read toggle), then a compact list row for the same item

#### Scenario: A title is never truncated

- **WHEN** any unit renders an item whose title exceeds one line
- **THEN** the title wraps and is shown in full (no ellipsis)
