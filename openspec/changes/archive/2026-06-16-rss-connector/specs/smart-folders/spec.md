## MODIFIED Requirements

### Requirement: Smart-folder configuration persists as a pinned-tree node

A smart folder SHALL persist as a third `PinNode` kind in `pinnedBySpace`:
`{ kind: 'smart'; id: FolderId; name: string; icon: string; source: SmartSource; baseUrl: string; query?: SmartQuery; maxItems: number; hideRead: boolean; refreshMinutes: number }`,
where `SmartQuery` is `'authored' | 'assigned' | 'review-requested'` and
`SmartSource` is `'gitlab' | 'github' | 'jira' | 'rss'` (widened from the v1
`'gitlab'` literal by `github-connector`, to three values by `jira-connector`,
and to four by this change — the cause of the v2→v3, v4→v5, and v5→v6 schema
bumps). `query` SHALL be **optional**: queue sources (`gitlab` / `github` /
`jira`) carry one; a **feed source (`rss`) has no canned query and SHALL omit
it**. The node persists **configuration only** — it SHALL NOT carry a `children`
field; results are ephemeral runtime state (see Requirement: Smart-folder results
are ephemeral runtime state). `baseUrl` defaults per source (`https://gitlab.com`
/ `https://github.com` / `https://your-site.atlassian.net` — the Jira default is a
template placeholder the user edits — and an **empty default for `rss`**, since a
feed has no canonical host; the user pastes the feed URL) and SHALL be an absolute
http(s) URL: the SW SHALL strip any trailing slash on create/update and SHALL
throw (error ack) when the payload's `baseUrl` does not parse as an absolute
http(s) URL; for `rss` the `baseUrl` IS the feed URL. The per-host token lookup
key (where a source uses one) is `new URL(baseUrl).host`; instances served under a
subpath are supported because every endpoint string-appends to `baseUrl`.
`refreshMinutes` defaults to `10` with a floor of `5` (the SW SHALL clamp lower
values on create/update); `maxItems` is the per-folder cap — the total result cap
for queue sources, the **unread budget** for the feed source (default `10` in the
editor; migrated nodes default `20`; see Requirement: Smart folders honour a
per-folder maximum item count); `hideRead` is the feed's per-folder read-hiding
state (default `true` — a feed's resting state is the drained unread queue; see
Requirement: Reading folders are a draining unread queue). `icon` is minted by the SW on create from the source connector's
`mintedIcon` — `'folder-git-2'` for both git forges, `'folder-kanban'` for Jira,
and `'rss'` for the feed source (each a lucide glyph in the curated `ICON_NAMES`
list in `shared/icon-names.ts`, with `ui/icon-loaders.generated.ts` generated to
match; the instance favicon on every result row carries source identity) —
persisted so a later change can expose it; the editor does not. The smart node
orders among pins exactly like a `folder` node — it reorders by drag as one unit
and round-trips `reorderPinned` losslessly; its full drag/drop semantics are
specified in the `spaces-and-tabs` drag requirement — and its expand/collapse
state rides the existing per-window ephemeral folder-expansion mechanism, keyed by
node id.

#### Scenario: A smart folder survives restart as config only

- **WHEN** the SW boots with a persisted smart node in `pinnedBySpace`
- **THEN** the node is restored with its `source`, `baseUrl`, `query` (when present), `maxItems`, `hideRead`, and `refreshMinutes` intact
- **AND** no result items are read from storage

#### Scenario: The cadence floor clamps on create

- **WHEN** `createSmartFolder` is dispatched with `refreshMinutes: 1`
- **THEN** the stored node's `refreshMinutes` SHALL be `5`

#### Scenario: baseUrl is normalized and validated

- **WHEN** `createSmartFolder` is dispatched with `baseUrl: 'https://gitlab.example.com/'`
- **THEN** the stored node's `baseUrl` SHALL be `https://gitlab.example.com` (trailing slash stripped)
- **AND** a dispatch whose `baseUrl` does not parse as an absolute http(s) URL SHALL throw, with the ack carrying the error

#### Scenario: A smart folder reorders among pins like a folder

- **WHEN** the user drags a smart folder above a pinned tab and the sidebar dispatches `reorderPinned` with the full post-drop tree
- **THEN** the smart node persists at its new position with all config fields unchanged

#### Scenario: A github node persists and round-trips

- **WHEN** `createSmartFolder` is dispatched with `source: 'github'` and the SW restarts after the node persists
- **THEN** the node is restored with `source: 'github'` intact and validates under the current-version schema

#### Scenario: A jira node persists and mints the kanban icon

- **WHEN** `createSmartFolder` is dispatched with `source: 'jira'` and the SW restarts after the node persists
- **THEN** the node is restored with `source: 'jira'` intact, its `icon` minted `'folder-kanban'`, and validates under the current-version schema

#### Scenario: An rss node persists with no query and mints the rss icon

- **WHEN** `createSmartFolder` is dispatched with `source: 'rss'`, a feed `baseUrl`, a chosen `maxItems`, and no `query`, and the SW restarts after the node persists
- **THEN** the node is restored with `source: 'rss'` intact, **no `query` field**, its `maxItems` and `hideRead: true` (the drained default) set, its `icon` minted `'rss'`, and validates under the current-version schema

### Requirement: Connector implementations conform to the SourceConnector contract

Connector sources SHALL be implemented as modules under
`apps/extension/src/background/connectors/`, each conforming to the
`SourceConnector` interface declared in
`apps/extension/src/background/connectors/connector.ts`:
`{ source: SmartSource; defaultBaseUrl: string; mintedIcon: string; fetchRuntime(node: Pick<SmartFolderNode, 'baseUrl' | 'query' | 'maxItems'>, caches?: ConnectorCaches): Promise<SmartFolderRuntime>; listingUrl(node: Pick<SmartFolderNode, 'baseUrl' | 'query'>): string }`.
`fetchRuntime` SHALL bound its results: the **queue** connectors slice to the
node's `maxItems` (the total cap); the **feed** connector keeps the whole feed
bounded by a `FEED_BUFFER` (200) and leaves the `maxItems` unread budget to the
sidebar (the draining queue — see Requirement: Smart folders honour a per-folder
maximum item count). `listingUrl`
SHALL return the URL that shows the source's full listing in a browser — for the
queue sources their dashboard/search/JQL view, for `rss` the feed channel's own
website link — consumed by "open all in a tab" (see Requirement: Smart folders
open their full listing in a tab).
`ConnectorCaches` (declared in `connector.ts`) is a per-poll-cycle scratch map a
connector MAY use, holding the in-flight resolution promise per key (set
synchronously before the first await, so the engine's concurrent fan-out cannot
race two same-host folders into duplicate lookups): `refreshDueSmartFolders` SHALL
construct one per cycle and thread it through
`startSmartFolderRefresh(deps, node, caches?)`, so per-cycle resolutions happen
once per cycle, not once per folder; a manual/single refresh passes none and the
fetch defaults its own.
`fetchRuntime` SHALL be bounded and non-throwing — every failure shape resolves to
a runtime state, and every network request goes through the exported
`boundedFetch(url, init)` helper in `connector.ts` (the 20 s
`AbortSignal.timeout` wrapper ONLY — response interpretation stays per connector).
The source-agnostic engine in `apps/extension/src/background/smart-folders.ts`
SHALL dispatch fetches through a closed registry
`CONNECTORS: Record<SmartSource, SourceConnector>` holding exactly the shipped
sources (`gitlab`, `github`, `jira`, `rss`) — no plug-in mechanism, no speculative
members; its `fetchSmartFolderRuntime(node, caches?)` entry point widens its node
parameter to `Pick<SmartFolderNode, 'source' | 'baseUrl' | 'query' | 'maxItems'>`
(dispatch needs the discriminant and the cap).

#### Scenario: A fetch dispatches through the registry by source

- **WHEN** the engine refreshes a folder whose node carries `source: 'rss'`
- **THEN** `CONNECTORS.rss.fetchRuntime` performs the fetch and the result event reaches the drain exactly as a GitLab, GitHub, or Jira result does

#### Scenario: The registry holds exactly the four shipped sources

- **WHEN** the `CONNECTORS` registry is inspected
- **THEN** its keys are exactly `gitlab`, `github`, `jira`, and `rss` — no plug-in mechanism, no speculative members

#### Scenario: Every connector resolves a listing URL

- **WHEN** `listingUrl(node)` is called for a node of any source
- **THEN** it returns the source's full-listing URL (the feed website for `rss`; the dashboard/search/JQL view for the queue sources) without performing any network I/O

### Requirement: Smart-folder rendering and the one-glyph restraint

The sidebar SHALL render a smart node as a smart folder, implemented as the
feature component `apps/extension/src/sidebar/SmartFolder.svelte` composed by
`PinnedTabs.svelte`: a folder-style row composing the `ui/FolderRow.svelte`
primitive (extended for the smart row with an optional trailing badge, a
menu-items override, a `busy` flag that spins the glyph during an in-flight
refresh, pass-through forwarding of `RowMenu`'s `panel`/`panelTitle` drill-in, and
an optional **bindable `menuOpen`** pass-through. The smart row SHALL NOT re-roll
the folder-row chrome) with the node's icon in the shared icon column, name in the
title column, the standard disclosure chevron in the leading gutter, and a
trailing quiet count badge, and — when expanded — one row per result item at the
folder-child inset.

The **badge counts what needs the user's attention**: for a **queue** source it is
the item count (`N+` when the folder's `maxItems` cap is hit); for a **feed**
(`rss`) it is the **unread count** (`N+` when more unread than the `maxItems`
budget) and SHALL be **hidden entirely at zero** (the calm "caught up" state). The
badge never renders below zero and never shows a `0`.

A result row SHALL be exactly: leading instance favicon, single-line ellipsized
title, and at most **one** trailing dot. For a **queue** source the dot is the
semantic status painted from the existing tokens (`ok → --success`,
`fail → --danger`, `warn → --warning`, `pending → --info`); for a **feed** the dot
is the **unread mark** in the Space hue, and it clears when the item is read. The
one-glyph restraint holds for both. Colour SHALL NOT be the only carrier of the
unread/read or status meaning — the row's accessible name SHALL state it, and a
**read** feed row additionally recedes (title at `--text-muted`, favicon at reduced
opacity; see Requirement: Reading folders are a draining unread queue).

Result rows SHALL activate like pinned tabs: click dispatches
`openSmartItem { spaceId, folderId, itemId, windowId }` — open-if-dormant,
focus-if-bound (the binding lifecycle is owned by Requirement: Smart-item bindings
give results pinned-tab activation); for a feed source, activating a row does NOT
mark it read — the item drains only when the user moves on (see Requirement:
Reading folders are a draining unread queue). A bound row SHALL take the `TabRow` selection grammar — the
`--space-c-soft` active wash when its bound tab is the window's focused tab — and a
hover ✕ at the trailing slot dispatching the existing `closeTab`. Rows SHALL NOT
drag, reorder, or rename.

The folder's kebab/right-click menu SHALL carry **Refresh now**, **Edit…**,
**Open all in a tab** (every source; see Requirement: Smart folders open their full
listing in a tab), **Move up** / **Move down**, and **Delete** (no two-step
confirm). For a **feed** source the menu SHALL additionally carry **Mark all
read**. Under `prefers-reduced-motion` the in-flight refresh indicator SHALL NOT
rotate and item-set changes (including the unread→read transition and hide-read
collapse) SHALL swap instantly with an identical end state.

A **settled but empty** expanded folder SHALL show a quiet empty-state note
(parity with a normal folder's empty copy), NOT a blank list: "Nothing here right
now." for a queue with no items, "No entries yet." for a feed with no entries, and
"You're all caught up." for a caught-up feed (no unread). The pending-first-fetch
(ghost rows), signed-out (sign-in row), and error ("Couldn't reach …" note) states
own their own copy and SHALL NOT also show the empty note.

#### Scenario: An empty settled folder shows a note, not a blank list

- **GIVEN** a smart folder whose runtime is `ok` with no rows to show
- **WHEN** the folder is expanded
- **THEN** it renders a quiet empty-state note ("Nothing here right now." for a queue, "No entries yet." / "You're all caught up." for a feed), never a blank list

#### Scenario: A populated queue folder renders rows with one status glyph each

- **GIVEN** a `gitlab` smart folder whose runtime is `ok` with items carrying `status` tones
- **WHEN** the folder is expanded
- **THEN** each row shows favicon + title + at most one status dot, with the full status text in the tooltip/ARIA label

#### Scenario: An rss folder renders unread and read rows distinctly

- **GIVEN** an `rss` folder whose runtime is `ok` with some items read and some unread
- **WHEN** the folder is expanded
- **THEN** unread rows show a Space-hued unread dot with full-ink title, read rows show no dot with a `--text-muted` title and a dimmed favicon, and each row's accessible name states unread or read

#### Scenario: The feed badge counts unread and hides at zero

- **GIVEN** an `rss` folder with 3 unread of 20 items
- **WHEN** the folder renders
- **THEN** the badge reads `3`; and when every item is read the badge is absent

#### Scenario: The queue badge reflects the cap honestly

- **WHEN** a queue folder's runtime holds items at its `maxItems` cap
- **THEN** the folder badge renders `<maxItems>+`, and with 7 items it renders `7`

### Requirement: Creation and configuration via the pinned-header menu

The pinned-section header kebab (`RowMenu`) SHALL carry a "New smart folder…"
entry alongside the existing "New folder". Both it and the smart folder's
**Edit…** menu entry SHALL drill their menu in place into a
`apps/extension/src/sidebar/SmartFolderEditor.svelte` panel (`RowMenu`'s existing
`panel`/`panelTitle` drill-in; Edit… reaches it through `FolderRow`'s forwarded
panel, and the right-click `ContextMenu` path drills into the same editor). The
editor's **source picker SHALL be a `Select`** (scaling past four sources — it
SHALL NOT be a fixed-width segmented control), ABOVE the base-URL field. The
editor is **source-adaptive**:

- **base URL** (text), defaulting per source (`https://gitlab.com` /
  `https://github.com` / `https://your-site.atlassian.net` / empty for `rss`),
  with a source switch swapping the value whenever it currently equals any
  source's canonical default (a custom/self-hosted URL is never clobbered); the
  label reads **"Feed URL"** for `rss` and "Instance URL" otherwise.
- **query** (a three-option control whose third slot's label is source-aware —
  "Watching" for Jira, "Review" otherwise) — **shown only for queue sources;
  hidden for `rss`** (a feed has no canned query).
- the `maxItems` `Select` (10 / 20 / 30 / 50) — shown for every source, labelled
  **"Show at most"** for a queue (the total cap) and **"Show up to N unread"** for
  a feed (the unread budget).
- **refresh cadence** (the enum 5 / 10 / 30 / 60 minutes; the editor's default is
  **30** for `rss` and 10 otherwise).
- **name** (text, auto-suggested per source; for `rss` it is not derived from a
  query and stays empty until typed or seeded from the feed title).
- a per-source **hint** — the existing token lines for the queue sources, and for
  `rss` a no-sign-in line ("Public feed — no sign-in needed. Paste the feed URL.").

Confirming dispatches `createSmartFolder` (or `updateSmartFolder`) carrying the
chosen `source`, `maxItems`, and (for queue sources) `query`, and SHALL dismiss the
hosting menu entirely (the `onDone` contract, unchanged). A `baseUrl`, `query`,
`source`, or `maxItems` change on an existing folder SHALL trigger an immediate
refetch.

#### Scenario: Creating a review-requests folder from the header menu

- **WHEN** the user opens the pinned-header kebab, selects "New smart folder…", keeps the GitLab defaults, picks `review-requested`, and confirms
- **THEN** the sidebar dispatches `createSmartFolder` with the panel's values (including `source` and `maxItems`)
- **AND** the new folder appears in the pinned tree and begins its first fetch

#### Scenario: Picking RSS adapts the editor

- **WHEN** the user opens "New smart folder…" and switches the source `Select` to RSS
- **THEN** the base-URL field's label reads "Feed URL", the query control is hidden, the "Show up to N unread" control is shown, the refresh default reads 30 minutes, and the hint states no sign-in is needed
- **AND** confirming dispatches `createSmartFolder` with `source: 'rss'`, the feed URL, the chosen `maxItems`, and no `query`

#### Scenario: Editing maxItems refetches immediately

- **GIVEN** an existing smart folder
- **WHEN** the user changes "Show at most" and confirms
- **THEN** `updateSmartFolder` carries the new `maxItems` and the folder refetches without waiting for its cadence

#### Scenario: Confirming the editor dismisses the hosting menu on every path

- **GIVEN** an existing smart folder whose kebab menu is drilled into Edit…
- **WHEN** the user confirms with Save
- **THEN** `updateSmartFolder` is dispatched and the menu closes entirely — no action list remains open

## ADDED Requirements

### Requirement: The RSS connector fetches and parses public feeds

The `rss` connector (`apps/extension/src/background/connectors/rss.ts`) SHALL
fetch the node's `baseUrl` (the feed URL) via `boundedFetch` with no credentials
and parse the response body as a syndication feed, supporting **RSS 2.0 and Atom**
in one DOM-free streaming pass over the `saxes` SAX parser (the MV3 service worker
has no `DOMParser`). It SHALL normalize each entry onto `SmartFolderItem`
(`{ id, title, url }`, no `status`): `url` from the entry `link` (RSS) or
`link[rel=alternate]`/`link[@href]` (Atom); `id` from `guid`/`id` when present,
**falling back to the entry `url`**. Parsing SHALL be element-wise tolerant — one
malformed entry SHALL NOT cost the rest, and a parser error SHALL keep whatever
parsed cleanly. Results SHALL be sliced to the node's `maxItems`. The connector
SHALL resolve to `pending | ok | error` only — **`signed-out` is impossible** for a
public feed. A network failure, a non-2xx response, an oversized body, or an empty
parse SHALL resolve to the quiet `error` state (last-known items hold, per
Requirement: Calm failure and pending states). `listingUrl` SHALL return the feed
**channel-level** website link (the channel `<link>` / feed `link[rel=alternate]`),
falling back to the feed URL when absent.

#### Scenario: An RSS 2.0 feed normalizes to result rows

- **WHEN** the connector fetches a folder whose feed returns RSS 2.0 with three `<item>`s (one CDATA title, one without a `<guid>`)
- **THEN** the runtime is `ok` with three items, the CDATA title decoded, and the guid-less item's `id` equal to its link

#### Scenario: An Atom feed normalizes to result rows

- **WHEN** the connector fetches a folder whose feed returns Atom `<entry>`s with `<link rel="alternate" href=…>` and `<id>`
- **THEN** the runtime is `ok` with each item's `url` taken from the alternate link and `id` from the entry id

#### Scenario: A feed source never reports signed-out

- **WHEN** any RSS fetch fails (network error, non-2xx, or unparseable body)
- **THEN** the runtime resolves to `error`, never `signed-out`

#### Scenario: Results slice to maxItems

- **WHEN** a feed returns 40 entries and the node's `maxItems` is 20
- **THEN** the runtime holds exactly 20 items

### Requirement: Reading folders are a draining unread queue

A feed (`rss`) folder SHALL be a **draining unread queue**. An item is **unread**
until it is **consumed**; the folder surfaces the newest `maxItems` **unread**
items (see Requirement: Smart folders honour a per-folder maximum item count),
backfilling older unread as items are consumed. An item is **consumed** (marked
**read**) when the user **moves on** from it — NOT when it is merely opened:
opening (`openSmartItem`) binds a tab and keeps the entry in the list (bound,
active, unread); the item is marked read only when its bound tab is **deactivated**
(the user navigates to another tab — per-window, swept in the store's
`setActiveTab`) or **closed** (`onTabRemoved`). **Consume SHALL also close the
tab**: when an entry is consumed by navigating away, its bound (now-inactive) tab
is closed (`chrome.tabs.remove`) so the reading queue leaves no tab trail; the tab
you are actively on is never closed, and an already-read item is never re-closed.
The read set is persisted ids-only and pruned (see the `storage-and-migrations`
capability, Requirement: Smart-folder read-state is persisted and pruned).

The feed's resting state SHALL be **drained** — read rows hidden (the node's
`hideRead` defaults `true`). The sidebar SHALL expose, on a feed folder: a
**"Show recently read"** peek toggled via
`setSmartFolderHideRead { spaceId, folderId, hideRead }` (persisted; `hideRead:
false` reveals read rows in place), and a **"Mark all read"** action via
`markAllSmartItemsRead { spaceId, folderId }` (drains the whole folder). The
`markSmartItemRead { folderId, itemId }` command also exists for an explicit
single mark. Read-state behaviour SHALL apply to **feed sources only**; queue
items carry no read-state.

#### Scenario: Opening an entry keeps it; moving on drains it

- **GIVEN** an unread item in a feed folder
- **WHEN** the user activates its row (opening its tab)
- **THEN** the item is bound and **stays unread** in the list while its tab is the active tab
- **AND WHEN** the user navigates to another tab (its bound tab deactivates) or closes the tab
- **THEN** the item is marked read, its row drains, the next-oldest unread backfills, the unread badge decrements, AND (on the navigate-away path) its bound tab is closed (consume = close — no tab trail)

#### Scenario: The resting state is drained; "Show recently read" reveals

- **GIVEN** a feed folder with read and unread items (`hideRead: true`, the default)
- **THEN** only the unread rows render (the read rows are collapsed)
- **WHEN** the user selects "Show recently read"
- **THEN** `setSmartFolderHideRead` persists `hideRead: false` and the read rows are revealed in place

#### Scenario: Mark all read empties the unread count

- **WHEN** the user selects "Mark all read" on a feed folder
- **THEN** `markAllSmartItemsRead` marks every current item read and the badge becomes absent

### Requirement: Smart folders honour a per-folder maximum item count

Every smart folder SHALL bound its rendered results by the node's `maxItems`,
superseding any previously-fixed per-connector cap (`RESULTS_CAP`); migrated nodes
default to `20`. For a **queue** source `maxItems` is the **total result cap** —
the connector slices its normalized results to it. For the **feed** source it is
the **unread budget** (the editor's "Show up to N unread"): the connector keeps
the whole feed file bounded by a `FEED_BUFFER` (200, NOT sliced to `maxItems`), and
the sidebar surfaces the newest `maxItems` unread, backfilling older unread from
the buffer as items are consumed. The folder badge SHALL read `<maxItems>+` when
the cap/budget is reached (queue: total at the cap; feed: unread over the budget),
so it is never silent.

#### Scenario: The cap drives the connector slice and the badge (queue)

- **GIVEN** a `gitlab` folder with `maxItems: 30` whose source returns 50 results
- **THEN** the runtime holds 30 items and the folder badge reads `30+`

#### Scenario: The budget drives the unread window and the badge (feed)

- **GIVEN** an `rss` folder with `maxItems: 10` whose feed holds 40 unread entries
- **THEN** the connector keeps the whole feed (bounded by the buffer), the sidebar renders the newest 10 unread, and the badge reads `10+`
- **AND** as the user consumes the newest unread, older unread backfill to keep the window full

### Requirement: Smart folders open their full listing in a tab

Every smart folder SHALL offer **"open all in a tab"**, opening the source's full
listing (the connector's `listingUrl`) in a new browser tab via the existing
`openUrl { url, windowId }` command — dispatched by
`openSmartFolderListing { spaceId, folderId, windowId }`. It SHALL be reachable
**both** from a results-footer affordance ("Open all ↗") under an expanded folder
**and** from the folder kebab ("Open all in a tab"), so it is pointer-, keyboard-,
and touch-reachable.

#### Scenario: Open all opens the listing URL

- **WHEN** the user selects "Open all in a tab" on an `rss` folder
- **THEN** the connector's `listingUrl` (the feed's website) opens in a new tab in the active window via `openUrl`

#### Scenario: Queue connectors gain the listing escape hatch

- **WHEN** the user selects "Open all in a tab" on a `gitlab` folder
- **THEN** the GitLab listing view (e.g. the dashboard merge-requests page) opens in a new tab
