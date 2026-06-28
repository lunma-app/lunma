## MODIFIED Requirements

### Requirement: The lens overview filters items by type and scope

The lens overview page SHALL render a **filter bar** between the lens identity and
the first section. The bar SHALL offer **type facets** — one toggle per entity
present in the lens (Changes / Issues / Articles / Other, mapping to the `LensEntity`
values `change` / `ticket` / `article` / `generic`) — and **scope facets** — the
distinct host-qualified `change.repo` values (for Changes), `ticket.project` values
(for Issues), and feed-name values (for Articles). Scope facets SHALL render as toggle
chips when there are five or fewer of a kind, otherwise as a multi-select listbox
(`MultiSelect`) that selects any number of scope values at once and, once the facet
count exceeds the `MultiSelect` search threshold, surfaces an in-popover search box to
filter the options. The overflow control SHALL NOT reduce the axis to a single
selectable value. The bar SHALL render only facets that the lens can offer (no Articles
toggle for a lens with no articles); facet values SHALL be the union of values present
in the held items and values currently selected, so a selection is never stranded by a
transient empty fetch. The bar SHALL render only when the lens offers **type facets**
(more than one entity type); when present, it SHALL show a **clear** control (at the end
of the type-facet row) only while a filter is active. A lens with a single entity type
SHALL NOT render the bar — selecting a scope value there SHALL NOT pop a standalone clear
into view (which reflows the page and reads as a stray control); a scope-only filter is
cleared via the scope control's own clear (the `Chip` row toggles, or the `MultiSelect`'s
in-popover Clear). Every overflow scope picker SHALL carry an accessible name — repos,
projects, **and feeds** (closing the prior gap where the feed picker had none).

Toggling a facet SHALL update the lens filter through the `setLensFilter` command
(persisted, not page-local), and the overview SHALL re-render the narrowed set via
`applyLensFilter`. The filter bar SHALL compose existing `ui/` primitives (`Chip` —
using its shipped `selected`/`onToggle`/`aria-pressed` contract — `MultiSelect`,
`IconButton`, `Divider`) and SHALL NOT re-roll a toggle chip nor a multi-select listbox
inline nor override the `Chip` selected token from the feature. Selected facets SHALL
use the `Chip` selected affordance (which resolves to the lens's owning-Space hue via
the lens-page token scope) and SHALL hold under reduced-motion and WCAG-AA at every
Colour-intensity level.

#### Scenario: Type facets render only for present entities

- **GIVEN** a lens with Changes and Issues but no Articles
- **WHEN** the overview renders
- **THEN** the bar shows Changes and Issues type facets and no Articles facet

#### Scenario: A type facet narrows the overview

- **GIVEN** a lens showing Changes, Issues, and Articles
- **WHEN** the user selects the Issues type facet only
- **THEN** only the Issues section renders and `setLensFilter` is dispatched with `entities: ['ticket']`

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

#### Scenario: The feed overflow picker has an accessible name

- **GIVEN** a lens whose Articles span more than five distinct feeds
- **WHEN** the feed `MultiSelect` renders
- **THEN** it exposes an accessible name (`launcher_lensFilterByFeed`), matching the repo and project pickers

#### Scenario: Clearing resets the lens to everything

- **GIVEN** a lens with an active filter
- **WHEN** the user activates Clear
- **THEN** `setLensFilter` is dispatched with an empty filter and the overview shows every item again

#### Scenario: A selected value absent from the current fetch stays clearable

- **GIVEN** a persisted filter `repos: ['o/gone']` where `o/gone` is absent from the latest items
- **WHEN** the bar renders
- **THEN** an `o/gone` value still renders (selected) so the user can deselect it, and it is not auto-pruned from the persisted filter

### Requirement: Creation and configuration via the pinned-header menu

The `LensEditor.svelte` SHALL be **connection-first**: it SHALL render, top to bottom, a **Name** field; a **connections** picker (the lens's sources, as account assembly — not a URL form, and **not** gated by any kind selector); a derived **"this lens will show …"** preview naming the canonical entities the chosen connections produce (Changes / Articles / a generic label); the lens settings (**Show** max-items and **Refresh** cadence); and a single primary action — **Create** / **Save** — with **Cancel** and the validation hint. There SHALL be **no Kind picker** (the kind-driven provider filter that previously restricted a review lens to github/gitlab is removed with it). The connections picker SHALL be height-bounded and scroll independently while Name stays pinned above and the settings + action stay pinned below.

The connections picker SHALL present **all** of the user's connected sources (accounts and feeds, no provider filtering) as **pickable rows**, composed from the `MultiSelect` primitive in **inline** mode: each row's leading content SHALL be the source's `AccountChip` (provider glyph + name/host + an account's derived status) and a checkbox-square SHALL toggle the source's inclusion in the lens. The picker SHALL surface a **search box** that fuzzily filters the rows by account name **or source type (provider)** once the connected-source count exceeds the `MultiSelect` search threshold — each source contributes a `keywords` entry (its provider/type + host) so typing a type (e.g. "rss", "git") finds sources whose visible name omits it. **Including a source contributes all of its queries** — a non-`rss` account fetches `authored` + `assigned` + `review-requested`; an `rss` feed carries `queries: []` — so the editor SHALL NOT present a per-source filter picker and SHALL NOT require choosing a filter per source. A single **"+ Connect a service"** action SHALL open the shared Service-dropdown connect picker (`ui/ServiceConnectPicker.svelte` — see the `connector-accounts` capability), which mints the source (`createAccount` + optional `setAccountToken`) and returns it to the picker **pre-selected** (an rss feed pre-selected with `queries: []`). The picker's **OPML import** SHALL behave the same way in the editor — bulk: it SHALL find-or-mint an rss account per parsed feed (deduped by normalized base URL, since the rss `sourceKey` is host-derived) and pre-select them all **into the lens being assembled**, NOT spawn a standalone "Feeds" lens (the editor passes the picker an `onImportFeeds` callback — see the `connector-accounts` capability; the standalone-`importOpml` path is the Options Connections manager's). Confirming SHALL be blocked when no source is selected or when a connect flow is incomplete. `createLens`/`updateLens` SHALL carry `sources: LensSourceRef[]` (references, not embedded configs) and SHALL NOT carry `lensKind` (the SW derives it — see `A lens carries a kind`). **Create SHALL open the lens's overview page.** A source change on an existing lens SHALL trigger an immediate refetch of the affected sections only.

#### Scenario: A lens is assembled connection-first without choosing a kind

- **GIVEN** a connected `gitlab.com` account and an `rss` feed
- **WHEN** the user opens "New lens…", ticks both, and presses Create
- **THEN** `createLens` is dispatched with `sources: [{ sourceId: <gitlab>, queries: ['authored', 'assigned', 'review-requested'] }, { sourceId: <feed>, queries: [] }]` and **no `lensKind`**, and the overview opens showing a Changes section and an Articles section

#### Scenario: Including a source contributes all of its queries

- **GIVEN** the editor with a connected `github` account
- **WHEN** the user ticks the account
- **THEN** the lens being assembled references it with `queries: ['authored', 'assigned', 'review-requested']`, and no per-source filter picker is shown for it

#### Scenario: A long source list is searchable by name or type

- **GIVEN** the editor with more connected sources than the `MultiSelect` search threshold
- **WHEN** the picker renders
- **THEN** a search box fuzzily filters the visible source rows by account name, and typing a source type (e.g. "rss") narrows to the sources of that provider via their `keywords`

#### Scenario: The editor shows a derived entity preview

- **GIVEN** the editor with one `github` account and one `rss` feed selected
- **THEN** the "this lens will show …" preview names **Changes** and **Articles** (no Kind picker is present anywhere in the editor)

#### Scenario: Connecting a new service inline during lens creation

- **WHEN** the user picks "+ Connect a service", selects GitHub, enters a host + token, and confirms
- **THEN** the account is minted (`createAccount` with a client-minted id, then `setAccountToken`) and returned to the picker pre-selected, with no navigation to the options page

#### Scenario: Importing OPML in the editor fills the lens being built

- **GIVEN** the user is assembling a new lens and picks "+ Connect a service" → "RSS feed" → "Import OPML" with a file of 3 feed outlines
- **WHEN** the user confirms (the editor's confirm step shows "add to this lens", no Space picker)
- **THEN** an rss `createAccount` is dispatched per distinct feed (deduped by normalized base URL) and each is pre-selected into the editor, so Create dispatches `createLens` with those feeds as `queries: []` sources — and **no `importOpml` is dispatched and no separate "Feeds" lens is created**

#### Scenario: Confirming with no source selected is blocked

- **WHEN** the editor has no source selected
- **THEN** the primary Create/Save action SHALL be disabled

### Requirement: A lens carries an optional view filter

A lens `PinNode` SHALL carry an optional `filter?: LensFilter` field, where
`LensFilter` is `{ entities?: LensEntity[]; repos?: string[]; projects?: string[]; feeds?: string[] }`
and every axis is optional. The field is **additive and backward-compatible**: an
absent `filter`, an empty object, and a filter whose every array is empty are all
equivalent and mean "no narrowing" (identical to a lens that has never been
filtered). The `filter` SHALL persist with the rest of the node configuration and
round-trip losslessly through `reorderPinned` and a SW restart. It is a property of
the lens (global), not of any window.

`applyLensFilter` (in `shared/lens-filter.ts`) SHALL be the single, pure predicate
both surfaces use, so the overview and the sidebar always agree. It operates on
`{ item: LensItem; host: string; feedName?: string }` rows (each surface supplies the
host from its source config and the feed name for an article) so repo facets stay
host-scoped and feed facets match by feed name. A row passes iff **both** axes pass:
- **type:** `entities` empty **or** `entityForItem(item) ∈ entities` (the `Other`
  type maps to the `LensEntity` value `generic`); and
- **scope:** a Change passes iff `repos` empty **or** its host-qualified repo key
  `${host}/${change.repo}` ∈ `repos`; a Ticket passes iff `projects` empty **or**
  `ticket.project ∈ projects` (a project-less ticket therefore fails a non-empty
  `projects` filter and passes when `projects` is empty); an Article passes iff
  `feeds` empty **or** its `feedName ∈ feeds`; Other items carry no repo/project/feed
  and SHALL always pass the scope axis (governed by the type axis alone).

When every axis is empty, `applyLensFilter` SHALL return its input unchanged.
`deriveLensFacets` SHALL emit host-qualified repo keys, distinct feed names, and SHALL
drop `undefined` from the `projects` facet list (project-less tickets contribute no
project facet).

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

#### Scenario: A feed filter narrows Articles only

- **GIVEN** a lens holding Articles from feeds `Lobsters` and `Hacker News`, plus Changes and Issues
- **WHEN** the filter is `{ feeds: ['Lobsters'] }`
- **THEN** only `Lobsters` Articles survive while all Changes and all Issues still pass, and `deriveLensFacets` lists `Lobsters` and `Hacker News` in `feeds`

### Requirement: Creating or enabling a lens requests its host origin

The `LensEditor` SHALL call `requestHostPermissions(unionOfRequiredOrigins(node))` (a helper
that unions `requiredOriginsForConfig` across `resolvedConfigs(node)`; because origins are
query-independent this is equivalently the union over the distinct instances) when it confirms a
create or an edit that changes any instance's `baseUrl` or `source`. A grant proceeds to a normal
first poll for each resolved section. A denial or dismissal SHALL NOT block the operation: the
lens SHALL still be created/updated and affected sections SHALL sit in `needs-access` with the
inline grant affordance.

#### Scenario: Confirming a new multi-instance lens requests union origins

- **WHEN** the user confirms a new lens with a github instance and a gitlab instance
- **THEN** the editor SHALL call `requestHostPermissions(['https://api.github.com/*', 'https://gitlab.com/*'])` from the confirm handler

#### Scenario: Adding a source on an already-granted host requests no new origin

- **GIVEN** an existing lens with a gitlab instance whose origin is already granted
- **WHEN** the user adds a second gitlab account on the **same** host and confirms
- **THEN** the union origin set is unchanged (origins are host-scoped and query-independent), so no new host-permission dialog is shown and the new sections poll immediately

#### Scenario: Denying union host still saves the lens with sections in needs-access

- **GIVEN** the user confirms a new multi-instance lens
- **WHEN** the host-permission dialog is denied or dismissed
- **THEN** the lens SHALL still be created and SHALL render all sections in `needs-access`
