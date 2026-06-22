## MODIFIED Requirements

### Requirement: Creation and configuration via the pinned-header menu

The `SmartFolderEditor.svelte` SHALL render, top to bottom: a **Name** field; a
**Sources** list of in-place editable **source cards**; the folder settings
(**Show** maximum-items and **Refresh** cadence `Select`s); and a single primary
action — **Create** (new) or **Save** (edit) — with a **Cancel** ghost beside it
and the validation hint read alongside them. There is no separate inline
"add-source" sub-form and no second confirm button.

The **Sources list SHALL be height-bounded and scroll independently**
(`overflow-y: auto`) while **Name** stays pinned above it and the folder settings
+ primary action stay pinned below — so the primary **Create / Save** action is
reachable regardless of how many sources the list holds (e.g. after an OPML
import of many feeds). The list SHALL never push the action out of the panel.

Each **source card** SHALL present a **persistent header row** that is identical
whether the card is collapsed or expanded: a disclosure chevron (rotated when
expanded), the source glyph, the host identity (and, when collapsed, a queue
filter summary), then the card's reorder + remove controls. When **expanded**, a
**body** SHALL appear **beneath** that header carrying the source `Select` (which
changes the card's type), the per-source URL field (labelled "Feed URL" for rss,
"Instance URL" for a queue source), and — for a queue source — the **filter
multi-select** (selectable chips for authored / assigned / review-requested,
hidden for rss). The header never swaps shape between states; expanding reveals
the body in place. Editing a card SHALL mutate the folder's `sources` directly
(no intermediate Add step); the existing source-adaptive behaviour (URL label,
filters hidden for rss, hint line, refresh default, name auto-suggest) applies
per card. On create, the list SHALL seed one default card so a single-source
folder is fill-and-create. An `+ Add source` ghost `Button` below the list SHALL
append another card.

Cards SHALL be **reorderable**: each card carries a **grip handle** supporting
pointer **drag-and-drop** (with a drop indicator) AND keyboard reorder (focus the
handle, **Arrow Up / Arrow Down** move the card) — there are no separate move
up/down buttons. A card SHALL carry a remove `×` control hidden when only one
card remains.

A card SHALL be **collapsible to its header row alone** via the disclosure
chevron; an **incomplete** card (invalid URL, queue with no filters, or an
unresolved OPML card) SHALL NOT be collapsible (it stays expanded so it can be
fixed); a **newly added** card SHALL open expanded; **OPML-imported** feed cards
SHALL land **collapsed**.

**OPML** SHALL be a selectable source type on a card: choosing it shows a file
picker (no URL/filter fields); selecting a file SHALL parse the OPML and
**expand** that card into one `rss` card per discovered feed (deduplicated by
`source:host`), reporting how many were imported.

Editing a card so its `source:host` matches another card SHALL **merge** the
filter selections into the existing instance rather than creating a duplicate
(queue filters union in `QUERY_ORDER`; rss has no filter axis). Confirming SHALL
be blocked when the source list is empty, when any queue card has zero filters
selected, or when any card is otherwise incomplete (invalid URL, or an OPML card
with no file chosen). A `baseUrl`, `source`, or `queries` change on an existing
folder's card triggers an immediate refetch of the affected sections only
(`updateSmartFolder` carries the full new `sources[]`; the engine diffs resolved
sections to find added/removed/changed ones).

#### Scenario: The card header is identical collapsed and expanded

- **GIVEN** a source card
- **THEN** its header row (disclosure chevron + source glyph + host identity + controls) is present whether collapsed or expanded
- **AND** expanding reveals the body (Source select + URL + filters) beneath that same header — the header is not replaced by the Source select

#### Scenario: Reordering by grip — drag or arrow keys

- **GIVEN** a folder with two or more source cards
- **WHEN** the user drags a card's grip handle onto another position (or focuses the grip and presses Arrow Up / Arrow Down)
- **THEN** the card moves to the new position in `sources` and keyboard focus stays on the moved card's grip

#### Scenario: Creating a multi-filter folder from the header menu

- **WHEN** the user opens "New smart folder…", the seeded GitLab card is shown, the user ticks "Authored" and "Reviewing", and presses Create
- **THEN** `createSmartFolder` is dispatched with `sources: [{ source: 'gitlab', baseUrl: 'https://gitlab.com', queries: ['authored', 'review-requested'] }]`
- **AND** the folder appears with two sections, each pending its first fetch

#### Scenario: A single-source folder needs no separate Add step

- **WHEN** the user opens "New smart folder…" and the seeded card is valid (default GitLab + a filter)
- **THEN** the primary action is enabled immediately — there is no inner "Add source" button to press first

#### Scenario: The action stays reachable with many sources

- **GIVEN** an OPML import has produced many feed cards
- **THEN** the Sources list scrolls within a bounded height and the Create / Save action remains visible and reachable (it is never pushed out of the panel)

#### Scenario: Imported feed cards land collapsed; a card expands on demand

- **WHEN** an OPML import expands into several feed cards
- **THEN** those cards render collapsed (header row only)
- **AND WHEN** the user activates one card's disclosure chevron
- **THEN** its body expands beneath the header

#### Scenario: An incomplete card cannot be collapsed

- **GIVEN** a card that is incomplete (e.g. a queue card with no filters, or an invalid URL)
- **THEN** it stays expanded (its disclosure chevron is disabled) so it can be fixed, and the primary action is disabled

#### Scenario: Confirming a queue card with no filters is blocked

- **GIVEN** a card for a gitlab instance with no filters ticked
- **THEN** the primary Create/Save action SHALL be disabled

#### Scenario: Editing a card to an existing instance merges filters

- **GIVEN** a folder already holding `{ source: 'gitlab', baseUrl: 'https://gitlab.com', queries: ['authored'] }`
- **WHEN** the user adds a GitLab card on the same host with "Reviewing" ticked
- **THEN** the instances merge to a single `{ source: 'gitlab', baseUrl: 'https://gitlab.com', queries: ['authored', 'review-requested'] }` (not a second entry)

#### Scenario: An OPML card imports and expands into feed cards

- **WHEN** the user sets a card's source to "OPML file" and chooses a file with three valid feeds
- **THEN** that card is replaced by three `rss` cards (deduplicated by `source:host`) and the import count is reported

#### Scenario: Removing a filter from an existing folder updates it immediately

- **GIVEN** a folder with a gitlab card carrying `['authored', 'review-requested']`; the user unticks "Reviewing" and presses Save
- **THEN** `updateSmartFolder` carries the instance with `queries: ['authored']` and the folder's runtime drops the `gitlab:gitlab.com:review-requested` section
