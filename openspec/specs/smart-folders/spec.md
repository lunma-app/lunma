# smart-folders Specification

## Purpose

Live forge work items inside the pinned section. A smart folder is a third
`PinNode` kind persisting configuration only (`source` — GitLab, GitHub, or
Jira — instance `baseUrl`, a canned `query`, `refreshMinutes`, `name`/`icon`);
its displayed children are ephemeral connector results held in the broadcast-only
`smartFolders` slice, never persisted. An alarms-driven background engine polls
on a per-folder cadence (plus sidebar-open and post-boot refresh kicks),
dispatching fetches through per-source connector modules behind the
`SourceConnector` contract — GitLab merge requests over the v4 REST API
(per-host PAT, else the browser's session cookies), GitHub pull requests over
the search API (token-only), Jira issues over the GA JQL search API
(session-riding) — resolving failures calmly (`signed-out` /
`error` runtime states, never a red error card). Result rows are link-shaped —
favicon, title, at most one status dot — and activate via the existing
`openUrl` command. Folders are created and edited from the pinned-header menu
with a source picker; per-host tokens are managed in the options Connectors
section.
## Requirements
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

### Requirement: Smart-folder results are ephemeral runtime state

Query results SHALL live in a broadcast-only `AppState` slice
`smartFolders: { [folderId]: SmartFolderRuntime }` where `SmartFolderRuntime` is
`{ state: 'pending' | 'ok' | 'signed-out' | 'error' | 'needs-access'; items: SmartFolderItem[]; fetchedAt: number | null }`
and `SmartFolderItem` is
`{ id: string; title: string; url: string; status?: { tone: 'ok' | 'pending' | 'warn' | 'fail'; label: string } }`.
The slice SHALL never be persisted (the persistence exclusion is specified in the
`storage-and-migrations` capability) and SHALL be written only by the
coordinator drain: the connector performs network I/O outside the drain and
enqueues the internal event
`{ source: 'connector'; kind: 'smartFolders.result'; payload: { folderId, runtime } }`
— `'connector'` is a new `PendingEvent` source member added per the
`chrome-event-coordination` extension rule, with matching handlers-map and
`EventPolicy` entries (no coalescing) in the same change — whose handler calls
the store mutator `setSmartFolderRuntime(folderId, runtime)`, producing one
broadcast per drain. A refresh that begins while items exist SHALL mark the runtime `pending`
**without clearing `items`** (the list never blinks). After a SW restart the
slice is empty, so a smart folder renders its pending state until the first
fetch lands. The `'needs-access'` state means the folder's host origin is not
granted; it is produced without any network request (see "Connector fetches are
gated on a runtime host-permission grant").

#### Scenario: Results arrive through the single-writer drain

- **WHEN** a connector fetch completes for folder `f1`
- **THEN** the connector enqueues a `smartFolders.result` event and the coordinator handler writes the runtime via `setSmartFolderRuntime`
- **AND** exactly one `state-broadcast` carries the updated slice

#### Scenario: A refresh keeps last-known items visible

- **GIVEN** folder `f1`'s runtime is `ok` with 5 items
- **WHEN** a refresh begins
- **THEN** the runtime state becomes `pending` while `items` still holds the 5 items

#### Scenario: A SW restart costs one pending beat

- **WHEN** the SW restarts and the sidebar renders a smart folder before its first fetch completes
- **THEN** the folder renders the pending state (no stale items from disk)

### Requirement: Each connector declares the origins it fetches

The `SourceConnector` contract (`background/connectors/connector.ts`) SHALL
include `requiredOrigins(node): string[]`, returning the host match patterns the
connector actually fetches for that node — NOT necessarily the folder's
`baseUrl` origin. A `github` connector on `github.com` SHALL return
`['https://api.github.com/*']` (it fetches `api.github.com`); on GitHub
Enterprise it SHALL return the `baseUrl` origin. A `gitlab`, `jira`, or `rss`
connector SHALL return the `baseUrl` origin (`originPatternForBaseUrl(node.baseUrl)`).
The host-permission gate and the create/enable request SHALL use this set,
never `node.baseUrl` directly. The derivation itself SHALL live in a single pure
`shared/connector-origins.ts` export, `requiredOriginsForNode(node)`: the
`SourceConnector.requiredOrigins` members delegate to it (so the SW gate keys on
the connector member), and the sidebar/editor surfaces — which cannot import
`background/connectors` under the layer DAG — call it directly. There is exactly
one derivation, so the SW gate and the surface request never drift.

#### Scenario: GitHub declares the api origin it fetches

- **WHEN** `requiredOrigins` is called for a `github` folder on `https://github.com`
- **THEN** it SHALL return `['https://api.github.com/*']`, not `['https://github.com/*']`

#### Scenario: Same-origin connectors declare the baseUrl origin

- **WHEN** `requiredOrigins` is called for a `gitlab`, `jira`, or `rss` folder on `https://host.example.com/path`
- **THEN** it SHALL return `['https://host.example.com/*']`

### Requirement: Connector fetches are gated on a runtime host-permission grant

The smart-folder engine in `background/smart-folders.ts` SHALL check
`hasHostPermissions(connector.requiredOrigins(node))` (from
`shared/permissions.ts`) before dispatching a connector fetch for a folder. When
any required origin is not granted, the engine SHALL resolve the folder to the
`'needs-access'` runtime state **without performing any network request**. This
gate runs **before** the connector's auth short-circuit, so a folder that is both
host-ungranted and token-absent SHALL show `needs-access` (host access takes
precedence over `signed-out`); after the origins are granted, the refetch may
then surface `signed-out`. The gate applies to **all** sources, including RSS.
When `onPermissionsChange` reports that a required origin has been granted,
folders whose required origins are now all granted and that are due (or in
`needs-access`) SHALL refetch; when a required origin is revoked, affected
folders SHALL return to `needs-access`. Connectors SHALL remain bounded and SHALL
never throw on a missing grant.

#### Scenario: An ungranted origin short-circuits to needs-access without a fetch

- **GIVEN** a smart folder on `https://gitlab.example.com` whose required origin is not granted
- **WHEN** a poll for that folder is due
- **THEN** the engine SHALL set the runtime to `needs-access` and SHALL NOT issue a network request

#### Scenario: A GitHub folder gates on the api origin it fetches

- **GIVEN** a `github` folder on `https://github.com` with only `https://github.com/*` granted (not `https://api.github.com/*`)
- **WHEN** a poll is due
- **THEN** the engine SHALL resolve to `needs-access` (the connector's required origin `https://api.github.com/*` is ungranted) and SHALL NOT fetch

#### Scenario: An RSS feed on an ungranted origin shows needs-access

- **GIVEN** an `rss` folder whose feed origin is not granted
- **WHEN** a poll is due
- **THEN** the folder SHALL resolve to `needs-access` (not `error`) without a network request

#### Scenario: needs-access precedes signed-out

- **GIVEN** a token-only `github` folder whose api origin is ungranted AND no token is stored
- **WHEN** a poll is due
- **THEN** the folder SHALL show `needs-access` first, and only after the origin is granted MAY the refetch surface `signed-out`

#### Scenario: Granting the origins triggers a refetch

- **GIVEN** a folder in `needs-access` on `https://gitlab.example.com`
- **WHEN** the user grants `https://gitlab.example.com/*`
- **THEN** `onPermissionsChange` fires and the folder refetches, transitioning `needs-access` → `pending` → `ok`

#### Scenario: Revoking a required origin returns the folder to needs-access

- **GIVEN** a folder in `ok` whose required origin is then revoked via Chrome
- **WHEN** `onPermissionsChange` reports the removal
- **THEN** the engine SHALL set the folder to `needs-access`

### Requirement: Creating or enabling a smart folder requests its host origin

The `SmartFolderEditor` SHALL call
`requestHostPermissions(requiredOriginsForNode(node))` (the shared derivation —
the surface cannot import the connector) when it confirms a create or an edit
that changes the required origins (`createSmartFolder` / `updateSmartFolder`) —
it is an extension-page surface with a user gesture. A
grant proceeds to a normal first poll. A denial or dismissal SHALL NOT block the
operation: the folder SHALL still be created/updated and SHALL sit in
`needs-access` with the inline grant affordance. The user's configuration is
never lost to a permission dialog.

#### Scenario: Confirming a new GitHub folder requests the api origin

- **WHEN** the user confirms "New smart folder…" for `https://github.com`
- **THEN** the editor SHALL call `requestHostPermissions(['https://api.github.com/*'])` from the confirm handler
- **AND** on grant the folder begins its first fetch

#### Scenario: Denying the host still saves the folder

- **GIVEN** the user confirms a new smart folder
- **WHEN** the host-permission dialog is denied or dismissed
- **THEN** the folder SHALL still be created and SHALL render in `needs-access` with a "Grant access" affordance

### Requirement: The needs-access state renders a calm grant prompt

A folder in `needs-access` SHALL render quietly, in the calm non-`ok` family
(never a red error card): a single muted row with a key/lock-open `Icon`, the
copy "Lunma needs access to ⟨host⟩", and a "Grant access" control composed from
the `Button`/`Icon` primitives. Activating it from the sidebar SHALL call
`requestHostPermissions(requiredOriginsForNode(node))` (the shared derivation —
the surface cannot import the connector); on grant the folder transitions to
`pending`. `needs-access` SHALL be visually and behaviourally
distinct from `signed-out` (which concerns auth, not host access) and from
`error`. The grant affordance lives on the smart-folder card and in the editor
(which have the folder `node`); the options Connectors section SHALL remain
token management only.

#### Scenario: A needs-access folder shows the grant row

- **GIVEN** a folder on `https://gitlab.example.com` whose runtime is `needs-access`
- **WHEN** the folder is expanded in the sidebar
- **THEN** it renders one muted "Lunma needs access to gitlab.example.com" row with a "Grant access" control, and no red error card
- **AND** activating it calls `requestHostPermissions(['https://gitlab.example.com/*'])`

### Requirement: The GitLab connector fetches canned queries over REST

The GitLab connector SHALL issue documented v4 REST `GET` requests against the
folder's `baseUrl` (REST, not GraphQL — session-cookie `POST`s would require a
CSRF token, breaking cookie auth): `GET {baseUrl}/api/v4/merge_requests?state=opened&per_page=20`
plus `scope=created_by_me` (`authored`), `scope=assigned_to_me` (`assigned`), or
`scope=all&reviewer_id=<me>` (`review-requested` — `scope=all` is REQUIRED: the
endpoint defaults to `scope=created_by_me`, under which `reviewer_id` filters
only within your own authored MRs), where `<me>` is resolved via
`GET {baseUrl}/api/v4/user` once per poll cycle and cached in-session. Results
SHALL cap at 20 items. Each item maps to `SmartFolderItem` with `id` from the MR's
global id, `title` from the MR title (draft MRs arrive with their `Draft:` prefix
in the title), and `url` from `web_url`. Pipeline status SHALL map onto the
status tones — `success → ok`, `failed → fail`, `running`/`pending`/`created` →
`pending`, `canceled`/`skipped` → `warn` — and an MR without a pipeline carries
no `status` (no glyph); any pipeline status outside that mapped set (e.g.
`manual`, `preparing`, `waiting_for_resource`, `scheduled`) SHALL likewise map
to no `status`. When the list response does not carry a usable pipeline
field, the connector SHALL enrich via bounded per-MR detail requests
(concurrency ≤ 5, listed items only); when it does, enrichment SHALL be skipped
with identical output.

#### Scenario: A review-requested folder lists MRs awaiting my review

- **GIVEN** a smart folder with `query: 'review-requested'` and a signed-in session
- **WHEN** the connector polls
- **THEN** it resolves the current user via `/api/v4/user`, requests `state=opened&scope=all&reviewer_id=<me>&per_page=20`, and the runtime becomes `ok` with one item per returned MR

#### Scenario: Pipeline statuses map to the four tones

- **WHEN** the connector normalizes MRs whose pipelines are `success`, `failed`, and `running`
- **THEN** the items carry `status.tone` `ok`, `fail`, and `pending` respectively
- **AND** an MR with no pipeline yields an item with no `status`
- **AND** an MR whose pipeline status is `manual` (or any other unmapped value) yields an item with no `status`

#### Scenario: Results cap at 20

- **WHEN** the instance returns a full page of 20 MRs
- **THEN** the runtime holds exactly 20 items (and the folder badge renders `20+` — see the rendering requirement)

### Requirement: Connector auth follows the PAT-then-cookies ladder

For a **GitLab** folder's instance host, the connector SHALL authenticate per
request: (1)
when a token for that host exists in the `lunma.connectors` record, send
`Authorization: Bearer <token>` with `credentials: 'omit'`; (2) otherwise fetch
with `credentials: 'include'` so the browser's existing session cookies ride
along (the manifest's `host_permissions: <all_urls>` already exempts these
requests from CORS and SameSite — no manifest change, no `cookies` permission).
The ladder is GitLab-specific: auth is a per-connector strategy on the
`SourceConnector` contract, and the GitHub source is token-only (see
Requirement: GitHub connector auth is token-only).
Tokens SHALL be stored only in `chrome.storage.local` (NEVER `storage.sync`),
SHALL never appear in logs, and SHALL never be included in any state broadcast.
Signed-out detection SHALL be response-shape-based and non-throwing: a `401`, a
redirect landing on a non-JSON document, or any non-JSON body SHALL resolve the
runtime to `state: 'signed-out'`; network errors, timeouts, and 5xx/429 resolve
to `state: 'error'`. Every connector request — any source — SHALL carry a
bounded timeout
(`AbortSignal.timeout`, 20 s) so a hung connection RESOLVES to `error` rather
than wedging the folder in `pending` — an unbounded hang would otherwise block
every later poll behind the in-flight guard. The connector SHALL NOT prompt,
retry-loop, or surface an exception for auth failures.

#### Scenario: A configured PAT wins over cookies

- **GIVEN** a token is stored for host `gitlab.example.com`
- **WHEN** the connector polls a folder on that host
- **THEN** the request carries `Authorization: Bearer <token>` and omits credentials

#### Scenario: No PAT rides the browser session

- **GIVEN** no token is stored for the folder's host
- **WHEN** the GitLab connector polls
- **THEN** the request is sent with `credentials: 'include'` and no Authorization header

#### Scenario: A login redirect resolves to signed-out, calmly

- **WHEN** a cookie-authenticated poll receives a redirect to an HTML sign-in page
- **THEN** the runtime becomes `state: 'signed-out'` with no exception thrown and no error ack anywhere

#### Scenario: A hung connection resolves bounded, never an eternal pending

- **WHEN** a poll's request hangs (e.g. a dropped VPN to a self-hosted instance)
- **THEN** the bounded timeout aborts it and the runtime resolves to `state: 'error'`
- **AND** the folder's in-flight guard clears, so the next due poll retries

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

### Requirement: The GitHub connector fetches canned queries over the search API

The GitHub connector SHALL issue REST `GET` requests against the folder's API
root — `https://api.github.com` when the folder's `baseUrl` host is
`github.com`, else `{baseUrl}/api/v3` (GitHub Enterprise Server's REST root;
the derivation lives in `connectors/github.ts`) —
with `Accept: application/vnd.github+json`. The three canned queries map to
`GET {apiRoot}/search/issues?q=is:pr+is:open+{qualifier}&per_page=20&sort=updated&order=desc&advanced_search=true`
(the `advanced_search` param rides GitHub's issue-search migration — required
on github.com going forward, ignored by GHE versions that predate it) where
the qualifier is `author:@me` (`authored`), `assignee:@me` (`assigned`),
or `review-requested:@me` (`review-requested`) — `@me` resolves server-side
under token auth, so the GitHub connector performs NO me-resolution request.
Results SHALL cap at 20 items. Each item maps to `SmartFolderItem` with `id`
from the item's id, `url` from `html_url`, and `title` from the PR title,
prefixed `Draft: ` when the PR is a draft (GitHub does not bake draft-ness into
the title; the prefix restores at-a-glance parity with GitLab). Check status
SHALL be aggregated per listed PR via bounded enrichment (concurrency ≤ 5,
listed items only, at most two extra requests per PR: the PR detail for
`head.sha`, then that commit's check-runs at `per_page=100` — one page, no
pagination) onto the status tones with the
precedence: any conclusion in `failure`/`timed_out`/`action_required` → `fail`
("Checks failed"); else any run not `completed` → `pending` ("Checks
running"); else any `success` → `ok` ("Checks passed"); else any
`skipped`/`cancelled` → `warn` ("Checks skipped"). Unmapped conclusions
(`neutral`, `stale`, anything GitHub adds later) SHALL be ignored by the
aggregate; when only unmapped conclusions remain, or the PR has zero check
runs, the item carries no `status` (no glyph — absence over guessing).

#### Scenario: A review-requested folder lists PRs awaiting my review

- **GIVEN** a `github` smart folder with `query: 'review-requested'` and a stored token
- **WHEN** the connector polls
- **THEN** it requests `search/issues?q=is:pr+is:open+review-requested:@me&per_page=20&sort=updated&order=desc&advanced_search=true` with no me-resolution call, and the runtime becomes `ok` with one item per returned PR

#### Scenario: GHE derives its API root from baseUrl

- **GIVEN** a folder with `baseUrl: 'https://ghe.example.com'`
- **WHEN** the connector polls
- **THEN** requests go to `https://ghe.example.com/api/v3/search/issues?…`

#### Scenario: Check runs aggregate to one tone

- **WHEN** a PR's check runs hold one `failure` conclusion among successes
- **THEN** its item carries `status.tone: 'fail'` with the label "Checks failed"
- **AND** a PR whose runs are all `completed`/`success` carries `ok`
- **AND** a PR with zero check runs — or only unmapped conclusions (e.g. `stale`, `neutral`) — carries no `status`

#### Scenario: Draft PRs read as drafts

- **WHEN** the connector normalizes a PR whose detail reports `draft: true`
- **THEN** the item's title is prefixed `Draft: `

### Requirement: GitHub connector auth is token-only

The GitHub connector SHALL authenticate exclusively via a per-host token from
the `lunma.connectors` record (`Authorization: Bearer <token>`,
`credentials: 'omit'`) — there is no cookie rung: api.github.com and GHE API
roots ignore browser sessions, and the `@me` search qualifiers require
authentication. When NO token is stored for the folder's host the connector
SHALL resolve `{ state: 'signed-out' }` WITHOUT issuing a request (the request
could only fail; not sending it is rate-limit kind). A `401` (revoked or
malformed token) SHALL also resolve `signed-out`; ANY other non-2xx response —
403 in all its shapes (rate limit, SAML-unauthorized organization,
fine-grained-PAT scope gaps), 5xx — plus
network failures and timeouts resolve `error`. Token hygiene is unchanged:
stored only in `chrome.storage.local`, never logged, never broadcast, never
echoed.

#### Scenario: No token short-circuits to signed-out

- **GIVEN** a `github` folder whose host has no stored token
- **WHEN** the connector polls
- **THEN** the runtime becomes `signed-out` and no network request is made

#### Scenario: A revoked token resolves signed-out, calmly

- **WHEN** a poll with a stored token receives a `401`
- **THEN** the runtime becomes `state: 'signed-out'` with no exception and no error ack anywhere

### Requirement: The Jira connector fetches canned queries over the search/JQL endpoint

The Jira connector (`apps/extension/src/background/connectors/jira.ts`) SHALL
target **Jira Cloud** (`*.atlassian.net`), issuing one REST `GET` per folder per
poll against the GA search endpoint
`GET {baseUrl}/rest/api/3/search/jql?jql={encoded}&fields=summary,status&maxResults=20`
with `Accept: application/json` (the legacy `/rest/api/3/search` is deprecated by
Atlassian and SHALL NOT be used; Jira Server/Data Center `/rest/api/2` is out of
scope for this change). The three canned queries map to JQL — the
`review-requested` slot is **re-skinned per source** to Jira's `watcher` (its
editor label is "Watching"; the `SmartQuery` value remains `'review-requested'`):

- `authored` → `reporter = currentUser() AND statusCategory != Done ORDER BY updated DESC`
- `assigned` → `assignee = currentUser() AND statusCategory != Done ORDER BY updated DESC`
- `review-requested` → `watcher = currentUser() AND statusCategory != Done ORDER BY updated DESC`

`currentUser()` resolves server-side under the session, so the Jira connector
performs **NO me-resolution request** (and uses no `ConnectorCaches`). Results
SHALL cap at 20 items (the badge renders `20+` when the page is full). Each issue
maps to `SmartFolderItem` with `id` from the issue id, `url` set to
`{baseUrl}/browse/{key}`, and `title` set to `{key} {summary}` — the issue key
prefixes the summary (GitHub's `Draft: ` precedent: a per-source normalization
restoring the at-a-glance anchor, since Jira issues are identified by key).
Parsing SHALL be element-wise (one malformed issue never costs the rest of the
list). Status SHALL be taken **inline** from `fields.status.statusCategory.key`
with no enrichment request: `indeterminate` (In Progress) → `pending`
("In progress"); `done` → `ok` ("Done"); `new` (To Do) and any unmapped/absent
key → no `status` (no glyph — absence over guessing). Because every canned JQL
excludes `statusCategory = Done`, the live signal is In Progress vs backlog; the
`done` → `ok` branch is defensive.

#### Scenario: An assigned folder lists my open issues over the GA endpoint

- **GIVEN** a `jira` smart folder with `query: 'assigned'` on a logged-in `*.atlassian.net` site
- **WHEN** the connector polls
- **THEN** it requests `{baseUrl}/rest/api/3/search/jql?jql=assignee%20%3D%20currentUser()%20AND%20statusCategory%20!%3D%20Done%20ORDER%20BY%20updated%20DESC&fields=summary,status&maxResults=20` with no me-resolution call, and the runtime becomes `ok` with one item per returned issue

#### Scenario: The watching slot re-skins review-requested to JQL watcher

- **GIVEN** a `jira` folder whose `query` value is `'review-requested'`
- **WHEN** the connector builds its request
- **THEN** the JQL filters `watcher = currentUser()` (not any review concept), while the persisted `SmartQuery` value stays `'review-requested'`

#### Scenario: An issue row leads with its key and links to browse

- **WHEN** the connector normalizes an issue with `key: 'PROJ-123'` and `fields.summary: 'Fix the export'`
- **THEN** the item's `title` is `PROJ-123 Fix the export` and its `url` is `{baseUrl}/browse/PROJ-123`

#### Scenario: statusCategory maps to one tone, inline

- **WHEN** an issue's `fields.status.statusCategory.key` is `indeterminate`
- **THEN** its item carries `status.tone: 'pending'` with the label "In progress"
- **AND** an issue whose category is `new` carries no `status`
- **AND** no per-item follow-up request is issued to resolve status

### Requirement: Jira connector auth is session-riding only

The Jira connector SHALL authenticate exclusively by riding the browser's
existing `*.atlassian.net` session: every request is sent with
`credentials: 'include'` and **no** `Authorization` header. It SHALL NOT read,
write, or depend on the `lunma.connectors` token record, and there is **no PAT
or Basic-auth rung** (this is the cookie sub-path of the connector-auth strategy,
chosen with no token). The manifest's `host_permissions: <all_urls>` already
exempts these SW fetches from CORS and SameSite (no manifest change, no
`cookies` permission), and the connector issues only GETs, so Jira's write-path
XSRF token (`X-Atlassian-Token`) does not apply. Signed-out detection SHALL be
response-shape-based and non-throwing — ported from the GitLab connector and
kept inside the Jira module (it SHALL NOT leak to other connectors): a `401`, a
redirect landing on a non-JSON (atlassian login) document, or any non-JSON body
SHALL resolve `state: 'signed-out'`; network errors, timeouts, and 5xx/429
resolve `state: 'error'`; any other non-2xx resolves `state: 'error'`. Every
request SHALL carry the bounded timeout via the shared `boundedFetch` helper so
a hung connection resolves to `error` rather than wedging the folder in
`pending`. The connector SHALL NOT prompt, retry-loop, or surface an exception
for auth failures.

#### Scenario: A logged-in poll rides the session cookies

- **GIVEN** a browser logged into the folder's `*.atlassian.net` site and no stored token of any kind
- **WHEN** the Jira connector polls
- **THEN** the request is sent with `credentials: 'include'` and no `Authorization` header
- **AND** `lunma.connectors` is not read

#### Scenario: A login redirect resolves to signed-out, calmly

- **WHEN** a poll receives a `401` or a redirect to a non-JSON atlassian login document
- **THEN** the runtime becomes `state: 'signed-out'` with no exception thrown and no error ack anywhere

#### Scenario: A hung connection resolves bounded, never an eternal pending

- **WHEN** a poll's request hangs
- **THEN** the bounded timeout aborts it and the runtime resolves to `state: 'error'`
- **AND** the folder's in-flight guard clears, so the next due poll retries

### Requirement: Polling and refresh scheduling

The SW SHALL maintain a single repeating alarm (`lunma/smart-folders-poll`)
whose period equals the minimum `refreshMinutes` across all smart folders,
re-registered whenever a smart folder is created, updated, or deleted, and
cleared when no smart folders exist (zero idle cost for non-users). On each
alarm tick the SW SHALL refresh exactly the folders whose
`now - fetchedAt ≥ refreshMinutes` (a `null` `fetchedAt` is always due).
`background/smart-folders.ts` SHALL register its own parallel
`chrome.runtime.onMessage` listener for `'lunma/state-request'` (the sidebar's
boot/open signal) that kicks the same refresh-due check — the pure-read
snapshot handler in `state-snapshot-handler.ts` is NOT modified (see the
`chrome-event-coordination` delta). The SW SHALL also run the refresh-due check
once post-boot: the runtime slice dies with the SW, so after a restart every
smart folder is due (`fetchedAt` gone) and an ALREADY-OPEN sidebar — which
never re-sends its `state-request` — would otherwise show ghosts until the
next alarm tick. `refreshSmartFolder { spaceId, folderId }` SHALL refresh that
folder unconditionally.

#### Scenario: Only due folders refresh on a tick

- **GIVEN** folder A (`refreshMinutes: 5`, last fetched 6 minutes ago) and folder B (`refreshMinutes: 30`, last fetched 10 minutes ago)
- **WHEN** the poll alarm fires
- **THEN** folder A refreshes and folder B does not

#### Scenario: Deleting the last smart folder clears the alarm

- **WHEN** `deleteSmartFolder` removes the only smart node
- **THEN** the `lunma/smart-folders-poll` alarm is cleared

#### Scenario: Opening the sidebar freshens due folders

- **WHEN** a sidebar issues its `state-request` and a smart folder is past its cadence
- **THEN** the parallel refresh-kick listener triggers that folder's refresh
- **AND** the snapshot response itself is served by the unmodified pure-read handler, unblocked

#### Scenario: An SW restart refetches immediately for an open sidebar

- **GIVEN** a sidebar already open while the service worker idles out and restarts
- **WHEN** the SW finishes booting with smart folders in the pinned trees
- **THEN** the post-boot refresh-due check refetches every folder (all are due — the runtime slice was wiped)
- **AND** the open sidebar's results heal within the fetch round-trip, not the alarm cadence

### Requirement: Smart-item bindings give results pinned-tab activation

`smartItemBindings` is typed as `{ [folderId: FolderId]: { [itemId: string]: { [windowId: WindowId]: { tabId: TabId; allowGlob: string } } } }` in `AppState` and persisted at schema v7 (raised by this change from v6). Each slot stores the bound tab id **and** the `pageGlob(itemUrl)` computed at open time so the boundary can be re-armed without the ephemeral runtime slice being populated (design D1).

On `openSmartItem`, after the tab is created and bound via `store.bindSmartItem(folderId, itemId, windowId, tabId, allowGlob)`, the SW SHALL arm the boundary content script on the new tab as a side effect: `ctx.boundary.configureSmartItemBoundary(tabId, allowGlob)`. The `allowGlob` SHALL be `pageGlob(item.url)` — `origin + pathname + '*'` — so every sub-path and query-string variation of the item URL stays in-tab, and any off-prefix click opens a new temp tab instead.

The `tabs.onRemoved` unbind behaviour, the `dropSmartFolderBindings` demote-on-folder-delete behaviour, and the `isBound` tab-created guard are unchanged except that every slot read/write must use the `{ tabId, allowGlob }` shape.

#### Scenario: Opening a dormant smart item arms the boundary

- **GIVEN** a smart folder with a runtime item `{ id: '42', url: 'https://gitlab.example.com/proj/-/merge_requests/42', ... }` in window 100 with no existing binding
- **WHEN** `openSmartItem { folderId, itemId: '42', windowId: 100, spaceId }` is dispatched
- **THEN** a tab opens at the item's URL, joins the Space's Chrome group, and is bound under `smartItemBindings[folderId]['42'][100]` as `{ tabId: <new>, allowGlob: 'https://gitlab.example.com/proj/-/merge_requests/42*' }`
- **AND** the boundary content script SHALL be injected into the tab and configured with `allow: ['https://gitlab.example.com/proj/-/merge_requests/42*']`

#### Scenario: Clicking an off-prefix link in a smart tab opens a temp tab

- **GIVEN** a smart item tab bound to `https://gitlab.example.com/proj/-/merge_requests/42` with allowGlob `https://gitlab.example.com/proj/-/merge_requests/42*`
- **WHEN** the user clicks a link to `https://gitlab.example.com/proj/-/merge_requests/` (the MR list) inside the smart tab
- **THEN** the boundary content script SHALL intercept the click and open the link in a new temp tab
- **AND** the smart item tab SHALL remain on its current URL and stay bound

#### Scenario: In-prefix link navigation stays in the smart tab

- **GIVEN** the same smart item tab
- **WHEN** the user clicks a link to `https://gitlab.example.com/proj/-/merge_requests/42/diffs`
- **THEN** the browser navigates the smart tab to the diffs view (within the `42*` prefix)
- **AND** the smart item tab remains bound

### Requirement: Smart-item boundary re-arms on page load

After any page load in a smart item bound tab (`tabs.onUpdated` with `status: 'complete'`), the SW SHALL re-arm the boundary content script using the slot's stored `allowGlob`. This mirrors the existing saved-tab re-arm path in the `tabs.onUpdated` handler. The re-arm SHALL be floated as a side effect (same as saved tabs) to avoid blocking the drain's persist+broadcast.

If the slot's `allowGlob` is empty (a pre-migration slot that was bound before this change deployed), the re-arm SHALL be skipped for that slot — it degrades to the v1 no-boundary behaviour until the user next opens that item.

#### Scenario: Reloading a smart tab re-arms the boundary

- **GIVEN** a smart item tab whose `allowGlob` is `'https://gitlab.example.com/proj/-/merge_requests/42*'`
- **WHEN** `tabs.onUpdated { status: 'complete' }` fires for that tab
- **THEN** the SW SHALL float `ctx.boundary.configureSmartItemBoundary(tabId, allowGlob)` as a side effect
- **AND** the boundary content script SHALL be (re-)injected and armed with the original allow-set

### Requirement: Boot re-arm covers smart item tabs

`BoundaryController.refreshBoundTabBoundaries` SHALL iterate `store.state.smartItemBindings` in addition to `store.state.tabBindings` and call `configureSmartItemBoundary(tabId, slot.allowGlob)` for every slot whose `allowGlob` is non-empty. This ensures smart item tabs that were open when the SW restarted regain their boundary enforcement on boot without requiring the smart folder runtime to be populated first.

#### Scenario: Boot re-arm covers a smart item tab with a stored glob

- **GIVEN** a persisted `smartItemBindings` slot `{ tabId: 500, allowGlob: 'https://jira.example.com/browse/PROJ-1*' }`
- **WHEN** the SW boots and calls `refreshBoundTabBoundaries`
- **THEN** `configureSmartItemBoundary(500, 'https://jira.example.com/browse/PROJ-1*')` SHALL be called for that slot
- **AND** the smart item tab SHALL have its boundary content script injected and armed

### Requirement: `BoundaryController.configureSmartItemBoundary`

`BoundaryController` SHALL expose a method `configureSmartItemBoundary(tabId: TabId, allowGlob: string): Promise<void>` that:
- Returns immediately (no-op) when `allowGlob` is empty.
- Calls `await injectBoundary(tabId)` to ensure the content script is present.
- Calls `sendBoundaryConfig(tabId, [allowGlob])` to arm the script with the single-pattern allow-set.
- Never throws — a forbidden page or closed receiver is benign, same as `configureBoundary`.

This method is the only new surface on `BoundaryController`; all other boundary methods and the `effectiveBoundaryDefault` logic are unchanged.

#### Scenario: First activation opens a bound, non-temporary tab

- **GIVEN** an expanded smart folder listing item `42` with no binding in window 100
- **WHEN** the user activates the row
- **THEN** a tab opens at the item's URL, joins the Space's Chrome group, and is bound under `smartItemBindings[folderId]['42'][100]`
- **AND** the tab never appears in the Temporary list

#### Scenario: Re-activation focuses instead of reopening

- **GIVEN** item `42` bound to tab 7 in window 100
- **WHEN** the user activates the row again
- **THEN** tab 7 is focused and no new tab is created

#### Scenario: An SW restart keeps the binding

- **GIVEN** item `42` bound to tab 7
- **WHEN** the SW restarts and boot recovery runs while tab 7 is still open
- **THEN** the binding survives (ids persisted) and tab 7 stays out of Temporary

#### Scenario: Deleting the folder demotes bound tabs to Temporary

- **GIVEN** a smart folder with two bound live tabs
- **WHEN** the user deletes the folder
- **THEN** no tab closes, both bindings drop, and both tabs appear in the Temporary list

#### Scenario: Closing the tab unbinds

- **GIVEN** item `42` bound to tab 7
- **WHEN** tab 7 closes (the row's ✕ or Chrome's own close)
- **THEN** the binding drops and the row returns to its plain (or evaporates if held)

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
listing in a tab), **Move up** / **Move down** (the keyboard-reachable reorder pair
every pinned row carries — disabled at the respective end of the top-level list,
dispatching the full-tree `reorderPinned`), and **Delete**, gated behind a
**two-step confirm** that mirrors the folder-row Delete arm: the first activation
SHALL arm the entry into a danger **"Delete — confirm"** and keep the menu open
(`keepOpen`), and only the second activation SHALL dispatch `deleteSmartFolder`.
Closing or Escaping the menu SHALL disarm a pending confirm, so a reopened menu
lands on the unarmed **"Delete"**, never a stale **"Delete — confirm"**. The arm
SHALL be identical across both menu surfaces — the kebab `RowMenu` (via
`FolderRow`) and the right-click `ContextMenu` — because both render the same
`menuItems` source. A confirmed deletion destroys only the folder's own
recreatable config and closes no tabs; its bound tabs demote to Temporary per the
binding requirement. For a **feed** source the menu SHALL additionally carry **Mark
all read**. Under `prefers-reduced-motion` the in-flight refresh indicator SHALL
NOT rotate and item-set changes (including the unread→read transition and hide-read
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

#### Scenario: Deleting a smart folder is a two-step confirm

- **GIVEN** an expanded smart folder's kebab (or right-click) menu is open
- **WHEN** the user activates **Delete** the first time
- **THEN** no `deleteSmartFolder` is dispatched, the entry morphs to a danger **"Delete — confirm"**, and the menu stays open
- **AND** activating **"Delete — confirm"** dispatches `deleteSmartFolder { spaceId, folderId }` once

#### Scenario: Closing the menu disarms a pending Delete

- **GIVEN** the user has armed **Delete** into **"Delete — confirm"**
- **WHEN** the menu is closed or Escaped without confirming
- **THEN** no `deleteSmartFolder` is dispatched
- **AND** reopening the menu shows the unarmed **"Delete"**, not **"Delete — confirm"**

### Requirement: Calm failure and pending states

A smart folder's non-`ok` runtime states SHALL render quietly, never as a red
error card: `signed-out` → a single muted row whose copy and activation are
**per source** — a GitLab **or Jira** folder renders "Sign in to ⟨host⟩"
dispatching `openUrl` with the folder's `baseUrl` (both ride a browser session,
so the next due poll heals after sign-in); a GitHub folder renders "Add a token
in Settings → Connectors" opening the options page at its Connectors anchor via
the sidebar's established options deep-link (`openOptionsAt('#connectors')` from
`sidebar/open-options.ts` — App.svelte's helper; NOT `openUrl`, whose handler's
scheme hardening deliberately drops non-http(s) URLs and stays untouched — there
is no session to sign in to, the fix is the token);
`error` → the last-known items remain rendered with one
dim note row ("Couldn't reach ⟨host⟩") at the list end; first-fetch `pending`
(no items yet) → three static low-alpha ghost rows (no shimmer, no strobe).
During a reload — including the post-SW-restart refetch, whose boot broadcast
carries an empty runtime slice — the sidebar SHALL keep rendering the folder's
last-shown items from component memory (held in the sidebar only, never
persisted), activatable throughout, with only the refresh indicator marking the
reload; ghost rows render only when nothing has ever been shown, and an honest
`ok`-empty result clears the hold (stale items are never resurrected) —
**except items whose smart-item binding is live**: open work holds its row.
An item that drops out of the latest results while its bound tab is open
SHALL keep rendering from component memory (same anatomy, same dot rules)
until its binding drops, at which point the row evaporates on the next
render. No failure state SHALL produce a rejected command ack, a toast, or a
notification.

#### Scenario: Signed-out shows the sign-in row

- **GIVEN** a GitLab folder on `gitlab.example.com` whose runtime is `signed-out`
- **WHEN** the folder is expanded
- **THEN** it renders one "Sign in to gitlab.example.com" row and no ghost/error rows
- **AND** activating it opens the instance via `openUrl`

#### Scenario: A signed-out Jira folder shows the sign-in row

- **GIVEN** a `jira` folder on `acme.atlassian.net` whose runtime is `signed-out`
- **WHEN** the folder is expanded
- **THEN** it renders one "Sign in to acme.atlassian.net" row and activating it opens the instance via `openUrl` (never the token/options path — Jira has no token)

#### Scenario: A token-less GitHub folder points at Connectors

- **GIVEN** a `github` folder whose runtime is `signed-out`
- **WHEN** the folder is expanded
- **THEN** it renders one "Add a token in Settings → Connectors" row
- **AND** activating it opens (or reuses) an options tab at the Connectors section via the sidebar's options deep-link, never via `openUrl`

#### Scenario: Errors keep last-known items

- **GIVEN** a folder whose last poll succeeded with 5 items and whose latest poll failed with a network error
- **WHEN** the folder renders
- **THEN** the 5 items remain with a dim "Couldn't reach ⟨host⟩" note row beneath them

#### Scenario: First fetch shows ghost rows

- **WHEN** a freshly created smart folder renders before its first fetch resolves
- **THEN** it shows three static ghost rows

#### Scenario: A reload never blanks an open sidebar

- **GIVEN** a smart folder rendering 5 items in an open sidebar
- **WHEN** the SW restarts (the boot broadcast carries an empty `smartFolders` slice) and the post-boot refetch begins
- **THEN** the 5 last-shown items remain rendered and activatable, with the refresh indicator spinning
- **AND** no ghost rows appear until/unless the folder has never shown items

#### Scenario: Open work holds its row

- **GIVEN** an item bound to an open tab
- **WHEN** the next `ok` poll no longer lists that item (the PR merged, or the folder's query changed)
- **THEN** the row keeps rendering with its bound treatment
- **AND** when the bound tab closes, the row evaporates on the next render

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

### Requirement: Connectors section in the options page

The options page SHALL render a **Connectors** section managing per-host access
tokens in a dedicated `lunma.connectors` record in `chrome.storage.local`,
accessed only through `apps/extension/src/shared/connectors.ts`
(`readConnectors()` / `setConnectorToken(host, token | null)`). The section is
independent of the sync-backed settings registry and of smart-folder configs
(the options page reads neither `AppState` nor `pinnedBySpace`). It SHALL list
each stored host with a token-set indicator and allow adding a host + token,
replacing, and clearing. The token input SHALL be a password-type field, and a
stored token SHALL never be echoed back into the field (a "Token set — replace?"
affordance renders instead). Setting or clearing a token SHALL take effect on
the next poll without a reload.

#### Scenario: Adding a token for a self-hosted instance

- **WHEN** the user adds host `gitlab.example.com` with a token in the Connectors section
- **THEN** `lunma.connectors` in `chrome.storage.local` holds the token for that host
- **AND** the next poll of any folder on that host authenticates via Bearer header

#### Scenario: A stored token is never echoed

- **GIVEN** a token is stored for a host
- **WHEN** the Connectors section renders
- **THEN** the token value does not appear in the DOM (the row shows a token-set indicator with a replace affordance)

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
