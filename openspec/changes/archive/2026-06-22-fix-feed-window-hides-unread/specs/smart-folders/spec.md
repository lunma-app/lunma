## MODIFIED Requirements

### Requirement: Smart folders honour a per-folder maximum item count

`maxItems` is a folder-level field applied per **resolved section**: each section SHALL show up to
`maxItems` rows (queue cap) or up to `maxItems` unread rows (feed budget). The total visible rows
across all sections can be up to `S × maxItems` where S is the number of resolved sections
(instances × filters, plus feeds). The folder badge sums per-section attention counts; the `N+`
cap triggers when any section has hit its `maxItems` cap. Migrated nodes default `maxItems: 20`
(unchanged). The editor label reads "per section" when the folder has ≥ 2 resolved sections.

The feed budget is over **unread** items, NOT a positional slice: a section's render window SHALL
span through the newest `maxItems` unread items (all of them when fewer than `maxItems`), so every
unread item the badge counts renders even when read rows sit ahead of it in feed order (you read
the newest items). The window SHALL also cover at least the first `maxItems` rows so read rows
remain present for the "Show recently read" peek.

#### Scenario: The cap applies per resolved section

- **GIVEN** a folder with `maxItems: 10`, a gitlab instance with filters `['authored', 'review-requested']` returning 15 and 12 items, and an rss section with 20 unread
- **THEN** the authored section renders 10 items (capped), the reviewing section renders 10 items (capped), and the rss section renders 10 unread (budget)
- **AND** the badge reads `30+` (a section hit cap)

#### Scenario: Unread behind a run of read rows still render

- **GIVEN** a feed section with `maxItems: 3` whose newest 3 items are read and whose 2 older items are unread (`hideRead: true`)
- **THEN** both unread items render (the window spans past the leading read rows), the badge reads `2`, and the read rows stay available under "Show recently read"
- **AND** the section never shows the badge count with an empty list

#### Scenario: Single-section folder cap is unchanged

- **GIVEN** a folder with exactly one resolved section and `maxItems: 20` returning 25 items
- **THEN** the section renders 20 items and the badge reads `20+`
