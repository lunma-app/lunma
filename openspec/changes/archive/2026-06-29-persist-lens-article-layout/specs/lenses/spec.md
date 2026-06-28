## ADDED Requirements

### Requirement: A lens carries an optional article layout

A lens `PinNode` SHALL carry an optional `articleLayout?: 'grid' | 'list'` field
selecting how the overview's Articles entity section renders its cards. The field
is **additive and backward-compatible**: an absent `articleLayout` is equivalent
to `'grid'` (the first-open default, identical to a lens that has never had its
layout changed). The resolved layout SHALL be `node.articleLayout ?? 'grid'`. The
field SHALL persist with the rest of the node configuration and round-trip
losslessly through `reorderPinned` and a SW restart. It is a property of the lens
(global), not of any window.

#### Scenario: A lens persists its article layout across restart

- **WHEN** the SW boots with a persisted lens whose node carries `articleLayout: 'list'`
- **THEN** the node is restored with `articleLayout: 'list'` intact and validates under the current-version schema

#### Scenario: An absent layout resolves to grid

- **GIVEN** a lens node with no `articleLayout` field
- **WHEN** the overview resolves the layout as `node.articleLayout ?? 'grid'`
- **THEN** the Articles section renders as a grid (today's default behaviour)

### Requirement: Setting a lens article layout persists through a bus command

The SW SHALL handle a `setLensArticleLayout` command — payload
`{ spaceId: SpaceId; folderId: FolderId; layout: 'grid' | 'list' }` — by setting
the resolved lens node's `articleLayout`, persisting, and broadcasting the updated
state, mirroring the existing per-lens preference mutations (`setLensFilter`,
`setLensHideRead`). The command requires **no refetch** (a layout change touches
no source). The command SHALL be a no-op (or calm error) when the `folderId` does
not resolve to a lens.

#### Scenario: Dispatching setLensArticleLayout persists and broadcasts

- **WHEN** `setLensArticleLayout` is dispatched with `layout: 'list'` for an existing lens
- **THEN** the node's `articleLayout` is set to `'list'`, the state is persisted, the new state is broadcast to all surfaces, and no source refetch is triggered

#### Scenario: An unknown folder is a no-op

- **WHEN** `setLensArticleLayout` is dispatched with a `folderId` that does not resolve to a lens
- **THEN** no node is changed and the command resolves without error

## MODIFIED Requirements

### Requirement: The Articles entity section renders a magazine

The **Articles** entity section of the overview SHALL render the magazine archetype over the lens's `rss` (article-bucket) resolved sections, merging every feed into one section. It SHALL reuse the existing feed card rendering (`LensPageItem` cards with cover image / generated initial, recessed favicon, title, excerpt, source · age footer) and the existing per-feed reading controls. It SHALL render three section controls: a **layout toggle** (Grid | List) whose state is the lens's **persisted per-lens** `articleLayout` (read as `node.articleLayout ?? 'grid'`, written via the `setLensArticleLayout` bus command so the choice survives overview re-opens, other windows, and SW restarts), plus two **page-local ephemeral** controls (no persistence, no bus command) that do not exist in the current generic feed view: a **feed filter** (chips: "All feeds" + one per feed source, narrowing the rendered articles) and an **unread filter** (toggle showing the unread count, narrowing to unread items). An unread item in List layout SHALL carry a leading accent unread dot. The section SHALL render only when the lens has at least one `rss` source.

#### Scenario: The Articles section merges feeds with magazine cards

- **GIVEN** a lens with three `rss` feeds, all `ok`
- **WHEN** the overview renders
- **THEN** the Articles section shows one merged magazine of cards across the three feeds, with a "Feed" filter chip row, a Grid/List toggle, and an Unread toggle

#### Scenario: The feed filter narrows to one source

- **GIVEN** the Articles section showing three feeds
- **WHEN** the user activates a single feed's filter chip
- **THEN** only that feed's articles render, and no state is persisted

#### Scenario: The layout toggle switches grid and list and persists

- **GIVEN** a lens whose Articles section is showing Grid
- **WHEN** the user switches the layout toggle to List
- **THEN** the same articles re-render as list rows (unread items leading with an accent dot) with no reflow animation, and the lens node's `articleLayout` is persisted as `'list'` via `setLensArticleLayout`

#### Scenario: A persisted layout is restored on re-open

- **GIVEN** a lens whose node carries `articleLayout: 'list'`
- **WHEN** the user re-opens the lens overview (in any window, including after a SW restart)
- **THEN** the Articles section renders as a list immediately, without first flashing the grid default

#### Scenario: The unread filter narrows to unread items

- **GIVEN** the Articles section with 6 articles, 3 unread
- **WHEN** the user activates the Unread toggle (labelled with the count)
- **THEN** only the 3 unread articles render
