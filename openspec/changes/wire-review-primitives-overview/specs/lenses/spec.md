## MODIFIED Requirements

### Requirement: The Changes entity section renders the Review Queue archetype

The **Changes** entity section of the overview SHALL render the **Review Queue** archetype over the change-bucket resolved sections of the lens (its `github`/`gitlab` sections). It SHALL group changes into **relationship lanes** derived from each source's query: a `review-requested` query feeds a "Review requests" lane, an `authored` query feeds an "Authored" lane, and an `assigned` query feeds an "Assigned" lane; empty lanes are dropped and the remaining lanes render in that priority order.

Each change SHALL render as a **row** (not a magazine card) presenting, left to right: a **provider monogram** (`GH`/`GL`); the change title with its optional linked-ticket ref; a **repo subline** (`change.repo`); then a trailing **triage cluster** of three orthogonal signals — a **CI light** derived from the item `status` tone (with a `draft` change shown as a **distinct hollow glyph** in that locus), a **`ReviewerRail`** (a blocking-wins verdict glyph `changes` > `pending` > `approved` leading verdict-ringed reviewer `Avatar`s, composed from the change's `reviewers`; each reviewer's `state`, absent → `pending`), and a **`Diffstat`** of `change.additions`/`deletions`. The row SHALL NOT render a separate review-state pill: the `ReviewerRail` verdict glyph is the row's single review-state signal, and the per-reviewer `Avatar` rings carry each reviewer's state. The row SHALL re-roll none of the reviewer/diffstat affordances — it composes the `ReviewerRail`, `Avatar`, and `Diffstat` primitives and reads their design tokens only through them. Activation SHALL reuse `openLensItem` and the existing per-window bind/focus semantics; the existing calm pending/error/signed-out/needs-access states SHALL be reused; no non-`ok` state SHALL render as a red error card.

#### Scenario: The Changes section renders lanes of rows

- **GIVEN** a lens with `review-requested` and `authored` github sections, all `ok`
- **WHEN** the overview renders
- **THEN** the Changes section shows a "Review requests" lane above an "Authored" lane of `Change` rows — not magazine cards

#### Scenario: A row shows the change's triage signals

- **GIVEN** a review change with CI `ok`, two reviewers (one approved, one pending), and `+112 −40`
- **WHEN** its row renders
- **THEN** it shows the provider monogram, the title, the `change.repo` subline, a CI light, a `ReviewerRail` whose leading verdict glyph is `pending` with one approved-ringed and one pending-ringed reviewer `Avatar`, and a `+112 −40` `Diffstat`
- **AND** it renders no separate review-state pill

#### Scenario: A draft change shows a hollow CI light

- **GIVEN** a review change whose `change.draft` is `true`
- **WHEN** its row renders
- **THEN** the CI locus shows a distinct hollow glyph and no state pill

#### Scenario: Activation reuses openLensItem

- **WHEN** the user activates a change row in window 100
- **THEN** `openLensItem` is dispatched with the namespaced item id and the existing bind/focus behaviour applies
