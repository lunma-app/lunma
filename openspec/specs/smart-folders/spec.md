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
`{ kind: 'smart'; id: FolderId; name: string; icon: string; sources: SmartSourceConfig[]; maxItems: number; hideRead: boolean; refreshMinutes: number }`,
where `SmartSourceConfig` is `{ source: SmartSource; baseUrl: string; query?: SmartQuery }`.
The `sources` array SHALL contain at least one entry; the editor SHALL prevent confirming
with an empty list. The flat `source`, `baseUrl`, and `query?` fields on the smart node
are **removed** and replaced by `sources`.

`SmartSource` (`'gitlab' | 'github' | 'jira' | 'rss'`) and `SmartQuery`
(`'authored' | 'assigned' | 'review-requested'`) are unchanged. The same per-source
rules for `baseUrl` (normalized, trailing slash stripped, absolute http(s) only), `query`
(optional for feed sources, required for queue sources), and defaults per source apply to
each `SmartSourceConfig` entry, enforced by the SW's create/update handlers. The SW SHALL
throw when any entry's `baseUrl` does not parse as an absolute http(s) URL, or when a
`query` entry is omitted for a queue source.

The node persists **configuration only** — it SHALL NOT carry a `children` field; results
are ephemeral runtime state (see Requirement: Smart-folder results are ephemeral sectioned
runtime state). The node orders among pins exactly like a `folder` node and round-trips
`reorderPinned` losslessly; drag/drop and expand/collapse semantics are unchanged.

`icon` is minted by the SW on create from the **first** source entry's connector
`mintedIcon` when all sources share the same connector kind, otherwise from a new compound
icon: `'layers'` (a lucide glyph in the curated `ICON_NAMES` list). `refreshMinutes` and
`hideRead` are unchanged folder-level fields. `maxItems` applies per section (see
Requirement: Smart folders honour a per-folder maximum item count).

#### Scenario: A smart folder survives restart as config only

- **WHEN** the SW boots with a persisted smart node in `pinnedBySpace`
- **THEN** the node is restored with its `sources`, `maxItems`, `hideRead`, and `refreshMinutes` intact
- **AND** no result items are read from storage

#### Scenario: A multi-source folder persists with two sources

- **WHEN** `createSmartFolder` is dispatched with `sources: [{ source: 'gitlab', baseUrl: 'https://gitlab.com', query: 'authored' }, { source: 'github', baseUrl: 'https://github.com', query: 'authored' }]` and the SW restarts
- **THEN** the node is restored with both sources intact and validates under the current-version schema

#### Scenario: baseUrl is normalized and validated per entry

- **WHEN** `createSmartFolder` is dispatched with a sources entry whose `baseUrl` is `'https://gitlab.example.com/'`
- **THEN** the stored entry's `baseUrl` SHALL be `https://gitlab.example.com` (trailing slash stripped)
- **AND** a dispatch with any entry's `baseUrl` not parsing as an absolute http(s) URL SHALL throw, with the ack carrying the error

#### Scenario: A queue source entry without query is rejected

- **WHEN** `createSmartFolder` is dispatched with a `gitlab` sources entry that omits `query`
- **THEN** the SW SHALL throw and the ack SHALL carry the error
- **AND** no node SHALL be persisted

#### Scenario: A feed source entry omits query

- **WHEN** `createSmartFolder` is dispatched with an `rss` sources entry that omits `query`
- **THEN** the stored entry SHALL have no `query` field
- **AND** the node is restored with `source: 'rss'` intact after a SW restart

#### Scenario: An empty sources array is rejected

- **WHEN** `createSmartFolder` is dispatched with `sources: []`
- **THEN** the SW SHALL throw and the ack SHALL carry the error

#### Scenario: A smart folder reorders among pins like a folder

- **WHEN** the user drags a smart folder above a pinned tab and the sidebar dispatches `reorderPinned` with the full post-drop tree
- **THEN** the smart node persists at its new position with all config fields unchanged

### Requirement: Smart-folder results are ephemeral runtime state

Query results SHALL live in a broadcast-only `AppState` slice
`smartFolders: { [folderId]: SmartFolderRuntime }` where `SmartFolderRuntime` is
`{ sections: { [sourceKey: string]: SmartSectionRuntime } }` and `SmartSectionRuntime` is
`{ state: 'pending' | 'ok' | 'signed-out' | 'error' | 'needs-access'; items: SmartFolderItem[]; fetchedAt: number | null }`.
`sourceKey` is derived as `${source}:${new URL(baseUrl).host}` from a `SmartSourceConfig`
entry and is the stable identity key for that section within the folder.

The slice SHALL never be persisted and SHALL be written only by the coordinator drain: a
connector fetch completes and enqueues the internal event
`{ source: 'connector'; kind: 'smartFolders.result'; payload: { folderId, sourceKey, runtime: SmartSectionRuntime } }`
whose handler calls `store.setSmartSectionRuntime(folderId, sourceKey, runtime)`, producing
one broadcast per drain (unchanged broadcast contract). A refresh that begins while items
exist SHALL mark each section's runtime `pending` **without clearing `items`** (no blink).
After a SW restart the slice is empty, so each section renders pending until its first fetch.

#### Scenario: Results arrive through the single-writer drain per section

- **WHEN** a connector fetch completes for folder `f1`, source key `gitlab:gitlab.com`
- **THEN** the connector enqueues a `smartFolders.result` event carrying `{ folderId: 'f1', sourceKey: 'gitlab:gitlab.com', runtime }` and the coordinator handler writes it via `setSmartSectionRuntime`
- **AND** exactly one `state-broadcast` carries the updated section

#### Scenario: A refresh keeps last-known items visible per section

- **GIVEN** folder `f1`'s section `gitlab:gitlab.com` runtime is `ok` with 5 items
- **WHEN** a refresh begins for that folder
- **THEN** the section state becomes `pending` while `items` still holds the 5 items

#### Scenario: A SW restart costs one pending beat per section

- **WHEN** the SW restarts and the sidebar renders a multi-source smart folder before its first fetches complete
- **THEN** each section renders the pending state (no stale items from disk)

### Requirement: Each connector declares the origins it fetches

The `SourceConnector` contract (`background/connectors/connector.ts`) SHALL include
`requiredOrigins(cfg: SmartSourceConfig): string[]`, accepting a `SmartSourceConfig` (not
a full node), returning the host match patterns the connector actually fetches for that
config entry. The per-config derivation is unchanged: `github` on `github.com` returns
`['https://api.github.com/*']`; `gitlab`, `jira`, and `rss` return the `baseUrl` origin.

The shared utility `requiredOriginsForConfig(cfg: SmartSourceConfig): string[]` (renamed
from `requiredOriginsForNode` in `shared/connector-origins.ts`) returns the same result
and is the single derivation used by both the SW gate (via `SourceConnector.requiredOrigins`)
and the sidebar/editor (which cannot import `background/connectors` under the layer DAG).

For a multi-source folder, the engine computes the **union** of `requiredOriginsForConfig`
across all `sources[]` entries as the folder-level origin set, used only for the initial
`requestHostPermissions` call on create/edit. The per-section gate uses the per-config
result (see Requirement: Connector fetches are gated on a runtime host-permission grant).

#### Scenario: GitHub declares the api origin it fetches

- **WHEN** `requiredOrigins` is called for a `github` config on `https://github.com`
- **THEN** it SHALL return `['https://api.github.com/*']`, not `['https://github.com/*']`

#### Scenario: Same-origin connectors declare the baseUrl origin

- **WHEN** `requiredOrigins` is called for a `gitlab`, `jira`, or `rss` config on `https://host.example.com/path`
- **THEN** it SHALL return `['https://host.example.com/*']`

#### Scenario: requiredOriginsForConfig is the sole derivation (no drift)

- **WHEN** the SW gate and the sidebar editor both resolve required origins for the same SmartSourceConfig
- **THEN** they SHALL use `requiredOriginsForConfig` from `shared/connector-origins.ts` and produce identical results

### Requirement: Connector fetches are gated on a runtime host-permission grant

The smart-folder engine SHALL check `hasHostPermissions(requiredOriginsForConfig(cfg))`
**per section** (per `SmartSourceConfig` entry) before dispatching a connector fetch. When
any required origin for a section is not granted, that section SHALL resolve to
`'needs-access'` **without performing any network request**. Other sections whose origins
ARE granted SHALL proceed to fetch normally — partial grants are explicitly supported.

The `onPermissionsChange` behavior, refetch-on-grant, and return-to-needs-access-on-revoke
rules from the original requirement apply per-section. A folder whose ALL sections are in
`needs-access` has no granted sections; a folder where SOME sections are granted and some
are not shows mixed states in the sectioned render.

#### Scenario: A section on an ungranted origin shows needs-access while other sections fetch

- **GIVEN** a folder with sources `[gitlab:gitlab.com, github:github.com]` where `https://api.github.com/*` is not granted but `https://gitlab.com/*` is
- **WHEN** a poll is due
- **THEN** the `github:github.com` section resolves to `needs-access` without a network request
- **AND** the `gitlab:gitlab.com` section proceeds to fetch normally

#### Scenario: Granting one section's origin triggers only that section's refetch

- **GIVEN** a multi-source folder with `gitlab:gitlab.com` in `ok` and `github:github.com` in `needs-access`
- **WHEN** the user grants `https://api.github.com/*`
- **THEN** only the `github:github.com` section refetches (the gitlab section is unaffected)

### Requirement: Creating or enabling a smart folder requests its host origin

The `SmartFolderEditor` SHALL call
`requestHostPermissions(unionOfRequiredOrigins(node.sources))` (a helper that unions
`requiredOriginsForConfig` across all `sources[]` entries) when it confirms a create or an
edit that changes any source entry's `baseUrl`. A grant proceeds to a normal first poll
for each section. A denial or dismissal SHALL NOT block the operation: the folder SHALL
still be created/updated and affected sections SHALL sit in `needs-access` with the inline
grant affordance.

#### Scenario: Confirming a new multi-source folder requests union origins

- **WHEN** the user confirms a new folder with `sources: [github, gitlab]`
- **THEN** the editor SHALL call `requestHostPermissions(['https://api.github.com/*', 'https://gitlab.com/*'])` from the confirm handler

#### Scenario: Denying union host still saves the folder with sections in needs-access

- **GIVEN** the user confirms a new multi-source folder
- **WHEN** the host-permission dialog is denied or dismissed
- **THEN** the folder SHALL still be created and SHALL render all sections in `needs-access`

### Requirement: The needs-access state renders a calm grant prompt

A section in `needs-access` SHALL render a single muted "Lunma needs access to ⟨host⟩"
row with a "Grant access" control (composed from `Button`/`Icon` primitives) **inside
that section**, below the section header (when visible). Other sections in the same folder
SHALL render normally. Activating the grant row SHALL call
`requestHostPermissions(requiredOriginsForConfig(cfg))` for that section's config. The
visual treatment (muted, key icon, non-`error` styling) is unchanged.

#### Scenario: A folder with one granted and one needs-access section renders both

- **GIVEN** a folder with sections `gitlab:gitlab.com` (ok, 5 items) and `github:github.com` (needs-access)
- **WHEN** the folder is expanded
- **THEN** the `gitlab:gitlab.com` section renders its 5 items normally
- **AND** the `github:github.com` section renders one muted "Lunma needs access to api.github.com" row with a "Grant access" control

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

The `SourceConnector` interface in `background/connectors/connector.ts` SHALL be updated:
`fetchRuntime` accepts `SmartSourceConfig` (not a full node) plus `ConnectorCaches?`:
`fetchRuntime(cfg: SmartSourceConfig, maxItems: number, caches?: ConnectorCaches): Promise<SmartSectionRuntime>`.
`maxItems` is passed separately (it is a folder-level field, not per-config).
`listingUrl` accepts `SmartSourceConfig` (unchanged semantics).
`requiredOrigins` accepts `SmartSourceConfig` (updated from full node — see Requirement: Each
connector declares the origins it fetches for a SmartSourceConfig).
`defaultBaseUrl` and `mintedIcon` are unchanged.

The engine's `fetchSmartSectionRuntime(cfg: SmartSourceConfig, maxItems: number, caches?)` entry
point dispatches to `CONNECTORS[cfg.source].fetchRuntime(cfg, maxItems, caches)`.

#### Scenario: A fetch dispatches through the registry by source config

- **WHEN** the engine refreshes a section whose config carries `source: 'rss'`
- **THEN** `CONNECTORS.rss.fetchRuntime(cfg, maxItems, caches)` performs the fetch and the result event reaches the drain

#### Scenario: The registry holds exactly the four shipped sources

- **WHEN** the `CONNECTORS` registry is inspected
- **THEN** its keys are exactly `gitlab`, `github`, `jira`, and `rss`

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

The single repeating alarm (`lunma/smart-folders-poll`) and cadence logic SHALL remain
unchanged. On each tick, the engine fans out per `SmartSourceConfig` entry across all due
folders, fetching each section independently. `startSmartFolderRefresh(deps, node, caches?)` SHALL
iterate `node.sources`, derive each `sourceKey`, and call
`fetchSmartSectionRuntime(cfg, node.maxItems, caches)` for each entry in parallel (bounded
by the existing concurrency model). `refreshSmartFolder { spaceId, folderId }` SHALL
unconditionally refresh ALL sections of that folder.

#### Scenario: Only due folders refresh on a tick

- **GIVEN** folder A (`refreshMinutes: 5`, last fetched 6 minutes ago) with 2 sources, and folder B (`refreshMinutes: 30`, last fetched 10 minutes ago)
- **WHEN** the poll alarm fires
- **THEN** both of folder A's sections refresh and folder B's sections do not

### Requirement: Smart-item bindings give results pinned-tab activation

`smartItemBindings` is typed as `{ [folderId: FolderId]: { [namespacedItemId: string]: { [windowId: WindowId]: { tabId: TabId; allowGlob: string } } } }` in `AppState`, persisted at schema v8 (raised from v7 by this change). Each `namespacedItemId` SHALL be of the form `${sourceKey}:${nativeId}` where `sourceKey` is derived from the section's `SmartSourceConfig` and `nativeId` is the connector's native item id. This prevents collisions when two sources produce items with the same native id.

All open/close/bind/unbind behavior, the `dropSmartFolderBindings` demote-on-delete behavior, and the `isBound` tab-created guard are unchanged except that every slot read/write uses the namespaced id form. `openSmartItem` receives a `namespacedItemId` from the sidebar; the SW uses it as the binding key directly.

#### Scenario: Opening a smart item from a multi-source folder uses namespaced id

- **GIVEN** a folder with sources `[gitlab:gitlab.com, github:github.com]` and a gitlab item with native id `42`
- **WHEN** `openSmartItem { folderId, itemId: 'gitlab:gitlab.com:42', windowId: 100, spaceId }` is dispatched
- **THEN** a tab opens at the item's URL and is bound under `smartItemBindings[folderId]['gitlab:gitlab.com:42'][100]`

#### Scenario: Items from two sources with the same native id do not collide

- **GIVEN** a gitlab item `{ id: '42', ... }` and a jira item `{ id: '42', ... }` in the same folder
- **WHEN** both items are bound
- **THEN** `smartItemBindings[folderId]` SHALL hold separate keys `'gitlab:gitlab.com:42'` and `'jira:acme.atlassian.net:42'`

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

The sidebar SHALL render a smart folder with a sectioned layout when it has ≥ 2 sources.
A single-source folder renders identically to today (no section headers, no collapse
control, no visual change).

When expanded with ≥ 2 sources, the folder SHALL render, for each `SmartSourceConfig`
entry in `node.sources` order: (a) a **section header** row (a leading disclosure chevron
in `--text-dim` + source icon in `--text-dim` + host label in `--text-muted`,
`--font-size-xs`, 12px height) followed by (b) the section's **body** — its result rows
using the existing per-kind rules (queue → status dots; feed → unread marks), plus the
section's ghost/empty/error/sign-in/needs-access rows and feed reading-controls. Section
headers SHALL be implemented as `SmartSectionHeader.svelte` (composed of the `Icon`
primitive only — no new primitives).

The section header SHALL be an **interactive disclosure control** (a `<button>`, not an
`aria-hidden` divider): activating it toggles that section's collapsed state (see
Requirement: Multi-source smart-folder sections are individually collapsible). It SHALL
carry `aria-expanded` reflecting the section's collapsed state and an accessible label
naming the host, the count, and the toggle action. When a section is **collapsed**, the
folder SHALL render the section header (including its count) and hide the section body;
when expanded, the body renders normally.

The section header and its result rows SHALL stay at the same indentation — the disclosure
affordance SHALL NOT introduce an additional nesting indent (the layout is flat: collapse
is signalled by chevron state, not indent depth).

The folder badge SHALL sum per-section attention counts: `Σ (item count for queue sections)
+ Σ (unread count for feed sections)`, **independent of any section's collapsed state**.
The `N+` cap triggers when any section has hit its `maxItems` cap. The badge never shows 0
(hidden when sum is 0). For a single-source folder the badge is identical to today.

Empty-state notes, ghost rows (first-fetch), signed-out/error/needs-access states, and
the "open work holds its row" behavior apply per section. A section in `pending`
(first-ever fetch) renders three static ghost rows.

#### Scenario: A single-source folder renders identically to before this change

- **GIVEN** a smart folder with exactly one source entry
- **WHEN** the folder is expanded
- **THEN** no section header and no collapse control are rendered and the layout is visually identical to the pre-change behavior

#### Scenario: A two-source folder renders sectioned

- **GIVEN** a smart folder with sources `[gitlab:gitlab.com, github:github.com]`, each `ok` with items
- **WHEN** the folder is expanded
- **THEN** the folder renders: section header "gitlab.com" → gitlab items → section header "api.github.com" → github items

#### Scenario: The folder badge sums per-section attention counts regardless of collapse

- **GIVEN** a folder with a queue section (7 items) and a feed section (3 unread of 10), with the feed section collapsed
- **WHEN** the folder renders
- **THEN** the badge reads `10` (the collapsed section still contributes)

#### Scenario: A section header is a disclosure control

- **GIVEN** a two-source folder, expanded
- **WHEN** the gitlab section header renders
- **THEN** it is a button carrying `aria-expanded` and an accessible label naming the host, count, and toggle action — not an `aria-hidden` divider

#### Scenario: A section in needs-access renders inline while other sections render normally

- **GIVEN** a folder with sections `gitlab:ok:5items` and `github:needs-access`, both expanded
- **WHEN** the folder is expanded
- **THEN** the gitlab section renders its 5 items; the github section renders one "Lunma needs access to api.github.com" row

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

The `SmartFolderEditor.svelte` SHALL render a sub-source list: each entry shows a source
chip (small coloured pill: source icon + label, `--space-c-soft` background), a host/URL
label, and a remove `×` button. Below the list, an `+ Add source` ghost `Button` opens
an inline add-source panel (source picker → auto-URL → optional query picker → Add confirm).
Entries can be reordered via `Move up` / `Move down` controls (accessible from keyboard,
same pattern as pinned-row reorder).

The source `Select` and per-source URL/query fields from the existing editor are moved into
the per-entry form and the inline add-source panel. The existing source-adaptive behavior
(label "Feed URL" vs "Instance URL", query control hidden for rss, hint line, refresh
default) applies per-entry.

Confirming is blocked when `sources` is empty. A `baseUrl` or `source` change on an
existing entry triggers an immediate refetch of that section only (`updateSmartFolder`
carries the full new `sources[]`; the engine diffs to find changed entries).

#### Scenario: Creating a multi-source folder from the header menu

- **WHEN** the user opens "New smart folder…", adds a GitLab source and a GitHub source, and confirms
- **THEN** `createSmartFolder` is dispatched with `sources: [{ source: 'gitlab', ... }, { source: 'github', ... }]`
- **AND** the folder appears with two sections, each pending its first fetch

#### Scenario: Confirming with no sources is blocked

- **GIVEN** the editor is open with all sources removed
- **THEN** the Confirm button SHALL be disabled

#### Scenario: Removing a source from an existing folder updates it immediately

- **GIVEN** a folder with 3 sources; the user removes the second and confirms
- **THEN** `updateSmartFolder` carries `sources: [first, third]` and the folder's runtime drops the removed section

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

`maxItems` is a folder-level field applied per section: each section SHALL show up to
`maxItems` rows (queue cap) or up to `maxItems` unread rows (feed budget). The total visible
rows across all sections can be up to `N × maxItems` where N is the number of sources. The
folder badge SHALL sum per-section attention counts; the `N+` cap triggers when any section
has hit its `maxItems` cap. Migrated nodes default `maxItems: 20` (unchanged). The editor
label reads "per section" when the folder has ≥ 2 sources.

#### Scenario: The cap applies per section

- **GIVEN** a folder with `maxItems: 10`, a gitlab section returning 15 items, and an rss section with 20 unread
- **THEN** the gitlab section renders 10 items (capped) and the rss section renders 10 unread (budget)
- **AND** the badge reads `20+` (any section hit cap)

#### Scenario: Single-source folder cap is unchanged

- **GIVEN** a folder with exactly one source and `maxItems: 20` returning 25 items
- **THEN** the section renders 20 items and the badge reads `20+`

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

### Requirement: `SmartSourceConfig` is the per-section connector unit

`SmartSourceConfig` (`{ source: SmartSource; baseUrl: string; query?: SmartQuery }`) SHALL be
exported from `apps/extension/src/shared/types.ts` as the per-entry type for `sources[]`
on a smart `PinNode`. It SHALL also be the parameter type for `SourceConnector.fetchRuntime`,
`SourceConnector.requiredOrigins`, `SourceConnector.listingUrl`, and `requiredOriginsForConfig`
in `shared/connector-origins.ts`.

#### Scenario: SmartSourceConfig round-trips through the schema

- **WHEN** a `SmartSourceConfig` `{ source: 'rss', baseUrl: 'https://feeds.example.com/rss' }` is persisted and loaded
- **THEN** it SHALL parse cleanly under `SmartSourceConfigSchema` with no `query` field

### Requirement: Source key derivation is pure and stable

`sourceKey(cfg: SmartSourceConfig): string` in `background/smart-folders.ts` SHALL return
`${cfg.source}:${new URL(cfg.baseUrl).host}`. It SHALL be pure and SHALL NOT perform I/O.
The same derivation SHALL be used by `setSmartSectionRuntime`, `smartFolders.result` events,
and the `smartItemBindings` namespace.

#### Scenario: Source key is stable across renames

- **WHEN** a gitlab source on `https://gitlab.example.com` produces `sourceKey`
- **THEN** the key is `'gitlab:gitlab.example.com'` and is stable across folder name changes

### Requirement: `hideRead` and feed menu actions apply only to feed sections

`hideRead` and the "Mark all read" / "Show recently read" folder menu actions SHALL apply
only to sections whose `SmartSourceConfig` has `source: 'rss'`. Queue sections (gitlab /
github / jira) are unaffected. When a folder has NO feed sections, the "Mark all read"
and "Show recently read" menu items SHALL be absent from the folder menu.

#### Scenario: Mark all read on a mixed folder marks only feed sections

- **GIVEN** a folder with a gitlab section (4 items) and an rss section (6 unread)
- **WHEN** the user selects "Mark all read"
- **THEN** the rss section's items are all marked read (badge drops to 0 for that section)
- **AND** the gitlab section is unaffected

### Requirement: Multi-source smart-folder sections are individually collapsible

On a smart folder with ≥ 2 sources, each section SHALL be individually collapsible from its
section header, independent of the other sections and of the folder-level expand/collapse.
This applies to **multi-source folders only**; single-source folders have no section header
and therefore no per-section collapse.

A section's collapsed state SHALL be stored as **sidebar-local, per-window, ephemeral**
state on `SidebarLocalState`:
`collapsedSmartSectionsByWindow?: { [windowId: WindowId]: { [folderId: FolderId]: { [sourceKey: string]: boolean } } }`,
where `sourceKey` is the section's `${source}:${host}` identity. The state SHALL NEVER be
persisted to storage and SHALL NEVER be broadcast (it is augmented onto the store like
`expandedFoldersByWindow`). The mutator `setSmartSectionCollapsed(windowId, folderId,
sourceKey, collapsed): void` SHALL write it. An **absent** entry means **expanded**: a
section defaults to expanded, and after an SW restart or sidebar reopen all sections render
expanded.

Collapse state SHALL be **per-window**: the same folder's section MAY be collapsed in one
window and expanded in another, with no cross-window write.

When a section is collapsed, the folder SHALL render the section header (with its
attention count) and SHALL NOT render that section's body (result rows, ghost rows,
sign-in/needs-access rows, empty/error notes, feed reading-controls). The chevron SHALL
reflect the collapsed state (`aria-expanded={!collapsed}`). Collapsing a section SHALL NOT
affect the folder-level badge, polling, runtime, bindings, or any other section.

The disclosure SHALL respect `prefers-reduced-motion: reduce`: the chevron rotation and the
section-body entrance animation SHALL be disabled under reduced motion.

#### Scenario: Collapsing a section hides its body and keeps its header

- **GIVEN** a two-source folder `[gitlab:gitlab.com (ok, 5 items), github:github.com (ok, 3 items)]`, both expanded, in window 100
- **WHEN** the user activates the gitlab section header
- **THEN** `setSmartSectionCollapsed(100, folderId, 'gitlab:gitlab.com', true)` is written
- **AND** the gitlab section header (with its count) still renders while its 5 result rows are hidden
- **AND** the github section continues to render its header and 3 rows

#### Scenario: Collapse is per-window

- **GIVEN** a folder open in window 100 and window 200, with its gitlab section collapsed in window 100
- **WHEN** window 200 renders the same folder
- **THEN** the gitlab section is expanded in window 200 (no cross-window collapse)

#### Scenario: Sections default to expanded after a restart

- **GIVEN** a section was collapsed in window 100 before the SW restarted
- **WHEN** the sidebar re-renders the folder after restart
- **THEN** the section renders expanded (the ephemeral collapse state was not persisted)

#### Scenario: A collapsed busy section still contributes to the folder badge

- **GIVEN** a two-source folder whose collapsed gitlab section holds 4 items and whose expanded feed section holds 2 unread
- **WHEN** the folder renders
- **THEN** the folder badge reads `6` (collapse does not change the badge)

#### Scenario: Single-source folders have no per-section collapse

- **GIVEN** a smart folder with exactly one source
- **WHEN** the folder is expanded
- **THEN** no section header and no collapse control render, and no `collapsedSmartSectionsByWindow` entry is created for it

