# lenses Specification

## Purpose
TBD - created by archiving change establish-lens-model. Update Purpose after archive.
## Requirements
### Requirement: Lens configuration persists as a pinned-tree node

A lens SHALL persist as a third `PinNode` kind in `pinnedBySpace`:
`{ kind: 'lens'; id: FolderId; name: string; icon: string; sources: LensSource[]; maxItems: number; hideRead: boolean; refreshMinutes: number }`,
where `LensSource` is `{ source: LensProvider; baseUrl: string; queries: LensQuery[] }`.
Each `LensSource` entry is one connector **instance** (source + host); its `queries`
array is the set of canned filters that instance contributes. The `sources` array SHALL contain
at least one entry; the editor SHALL prevent confirming with an empty list. The flat `source`,
`baseUrl`, and `query?` fields on the lens node remain **removed** (they were removed in the
multi-source change); the per-entry `query?` field is replaced by `queries`.

`LensProvider` (`'gitlab' | 'github' | 'jira' | 'rss'`) and `LensQuery`
(`'authored' | 'assigned' | 'review-requested'`) are unchanged. A **queue** source
(gitlab/github/jira) entry SHALL carry a **non-empty** `queries` array (at least one filter);
a **feed** source (rss) entry SHALL carry `queries: []` (rss has no filter axis). The same
per-source rules for `baseUrl` (normalized, trailing slash stripped, absolute http(s) only) and
defaults per source apply to each entry, enforced by the SW's create/update handlers. The SW
SHALL throw when any entry's `baseUrl` does not parse as an absolute http(s) URL, or when a queue
source entry's `queries` is empty, or when an rss entry's `queries` is non-empty.

The node persists **configuration only** — it SHALL NOT carry a `children` field; results are
ephemeral runtime state (see Requirement: Lens results are ephemeral sectioned runtime
state). The node orders among pins exactly like a `folder` node and round-trips `reorderPinned`
losslessly; drag/drop and expand/collapse semantics are unchanged.

`icon` is minted by the SW on create from the **first** source entry's connector `mintedIcon`
when all sources share the same connector kind, otherwise from the compound icon `'layers'` (a
lucide glyph in the curated `ICON_NAMES` list). The number of filters does not affect icon
minting — icon keys on connector kinds only. `refreshMinutes` and `hideRead` are unchanged
lens-level fields. `maxItems` applies per section (see Requirement: Lenses honour a
per-lens maximum item count).

#### Scenario: A lens survives restart as config only

- **WHEN** the SW boots with a persisted lens node in `pinnedBySpace`
- **THEN** the node is restored with its `sources` (each carrying `queries`), `maxItems`, `hideRead`, and `refreshMinutes` intact
- **AND** no result items are read from storage

#### Scenario: A multi-filter instance persists with two queries

- **WHEN** `createLens` is dispatched with `sources: [{ source: 'gitlab', baseUrl: 'https://gitlab.com', queries: ['authored', 'review-requested'] }]` and the SW restarts
- **THEN** the node is restored with the single instance carrying both filters intact and validates under the current-version schema

#### Scenario: A multi-instance lens persists with two connectors

- **WHEN** `createLens` is dispatched with `sources: [{ source: 'gitlab', baseUrl: 'https://gitlab.com', queries: ['authored'] }, { source: 'github', baseUrl: 'https://github.com', queries: ['authored'] }]` and the SW restarts
- **THEN** the node is restored with both instances intact and validates under the current-version schema

#### Scenario: baseUrl is normalized and validated per entry

- **WHEN** `createLens` is dispatched with a sources entry whose `baseUrl` is `'https://gitlab.example.com/'`
- **THEN** the stored entry's `baseUrl` SHALL be `https://gitlab.example.com` (trailing slash stripped)
- **AND** a dispatch with any entry's `baseUrl` not parsing as an absolute http(s) URL SHALL throw, with the ack carrying the error

#### Scenario: A queue instance with an empty queries array is rejected

- **WHEN** `createLens` is dispatched with a `gitlab` sources entry whose `queries` is `[]`
- **THEN** the SW SHALL throw and the ack SHALL carry the error
- **AND** no node SHALL be persisted

#### Scenario: A feed entry carries an empty queries array

- **WHEN** `createLens` is dispatched with an `rss` sources entry with `queries: []`
- **THEN** the stored entry SHALL have `queries: []`
- **AND** the node is restored with `source: 'rss'` intact after a SW restart

#### Scenario: An empty sources array is rejected

- **WHEN** `createLens` is dispatched with `sources: []`
- **THEN** the SW SHALL throw and the ack SHALL carry the error

#### Scenario: A lens reorders among pins like a lens

- **WHEN** the user drags a lens above a pinned tab and the sidebar dispatches `reorderPinned` with the full post-drop tree
- **THEN** the lens node persists at its new position with all config fields unchanged

### Requirement: A lens carries a kind

A lens `PinNode` SHALL carry a `lensKind: LensKind` field, where `LensKind` is the closed union `'general'` (widened by later typed-kind changes). `general` denotes the untyped, multi-provider aggregator that reproduces the historical behaviour: it MAY mix providers (gitlab/github/jira/rss) in one lens and renders with the generic sectioned sidebar layout and the generic full page. The editor SHALL stamp `lensKind: 'general'` on create. A lens migrated from a pre-rename `smart` node SHALL default `lensKind: 'general'`.

#### Scenario: A migrated lens is general

- **WHEN** the SW boots with a lens migrated from a pre-rename smart node
- **THEN** its `lensKind` is `'general'` and it behaves byte-for-byte as before

#### Scenario: The editor stamps general on create

- **WHEN** the user creates a lens from the pinned-header menu
- **THEN** `createLens` persists the node with `lensKind: 'general'`

#### Scenario: General is the only kind in this version

- **WHEN** the `LensKind` union is inspected
- **THEN** its only member is `'general'` (typed kinds arrive in later changes)

### Requirement: Lens results are ephemeral runtime state

Query results SHALL live in a broadcast-only `AppState` slice
`lenses: { [folderId]: LensRuntime }` where `LensRuntime` is
`{ sections: { [sourceKey: string]: LensSectionRuntime } }` and `LensSectionRuntime` is
`{ state: 'pending' | 'ok' | 'signed-out' | 'error' | 'needs-access'; items: LensItem[]; fetchedAt: number | null }`.
`sourceKey` is the **per-filter** section identity: `${source}:${new URL(baseUrl).host}:${query}`
for a queue section, and `${source}:${new URL(baseUrl).host}` for an rss section (no query). It is
derived from a **resolved single-query config** produced by expanding a `LensSource` over
its `queries[]`, and is the stable identity key for that section within the lens.

The slice SHALL never be persisted and SHALL be written only by the coordinator drain: a connector
fetch completes and enqueues the internal event
`{ source: 'connector'; kind: 'lenses.result'; payload: { folderId, sourceKey, runtime: LensSectionRuntime } }`
whose handler calls `store.setLensSectionRuntime(folderId, sourceKey, runtime)`, producing one
broadcast per drain (unchanged broadcast contract). A refresh that begins while items exist SHALL
mark each section's runtime `pending` **without clearing `items`** (no blink). After a SW restart
the slice is empty, so each section renders pending until its first fetch.

#### Scenario: Results arrive through the single-writer drain per section

- **WHEN** a connector fetch completes for lens `f1`, source key `gitlab:gitlab.com:authored`
- **THEN** the connector enqueues a `lenses.result` event carrying `{ folderId: 'f1', sourceKey: 'gitlab:gitlab.com:authored', runtime }` and the coordinator handler writes it via `setLensSectionRuntime`
- **AND** exactly one `state-broadcast` carries the updated section

#### Scenario: Two filters of one instance occupy distinct sections

- **GIVEN** a lens with one instance `{ source: 'gitlab', baseUrl: 'https://gitlab.com', queries: ['authored', 'review-requested'] }`
- **WHEN** both sections fetch
- **THEN** the runtime holds two sections keyed `gitlab:gitlab.com:authored` and `gitlab:gitlab.com:review-requested`, neither overwriting the other

#### Scenario: A refresh keeps last-known items visible per section

- **GIVEN** lens `f1`'s section `gitlab:gitlab.com:authored` runtime is `ok` with 5 items
- **WHEN** a refresh begins for that lens
- **THEN** the section state becomes `pending` while `items` still holds the 5 items

#### Scenario: A SW restart costs one pending beat per section

- **WHEN** the SW restarts and the sidebar renders a multi-filter lens before its first fetches complete
- **THEN** each section renders the pending state (no stale items from disk)

### Requirement: Each connector declares the origins it fetches

The `SourceConnector` contract (`background/connectors/connector.ts`) SHALL include
`requiredOrigins(cfg: ResolvedLensSource): string[]`, accepting a resolved single-query config,
returning the host match patterns the connector actually fetches for that config. The derivation is
query-independent: `github` on `github.com` returns `['https://api.github.com/*']`; `gitlab`,
`jira`, and `rss` return the `baseUrl` origin.

The shared utility `requiredOriginsForConfig(cfg: ResolvedLensSource): string[]` in
`shared/connector-origins.ts` returns the same result and is the single derivation used by both the
SW gate (via `SourceConnector.requiredOrigins`) and the sidebar/editor (which cannot import
`background/connectors` under the layer DAG).

For a lens, the engine computes the **union** of `requiredOriginsForConfig` across all resolved
sections as the lens-level origin set, used only for the initial `requestHostPermissions` call on
create/edit. Because origins are query-independent, the union is equivalently computed once per
instance (the filters of one instance share an origin). The per-section gate uses the per-config
result (see Requirement: Connector fetches are gated on a runtime host-permission grant).

#### Scenario: GitHub declares the api origin it fetches

- **WHEN** `requiredOrigins` is called for a `github` resolved config on `https://github.com`
- **THEN** it SHALL return `['https://api.github.com/*']`, not `['https://github.com/*']`

#### Scenario: Two filters of one instance share one origin

- **WHEN** the union is computed for a gitlab instance carrying `['authored', 'assigned']` on `https://gitlab.com`
- **THEN** the union contains `https://gitlab.com/*` once (filters do not multiply origins)

### Requirement: Connector fetches are gated on a runtime host-permission grant

The lens engine SHALL check `hasHostPermissions(requiredOriginsForConfig(cfg))`
**per resolved section** (per `ResolvedLensSource`, i.e. per instance × filter, or a single
rss section) before dispatching a connector fetch. When any required origin for a section is not
granted, that section SHALL resolve to `'needs-access'` **without performing any network request**.
Other sections whose origins ARE granted SHALL proceed to fetch normally — partial grants are
explicitly supported. Because origins are query-independent, all filter sections of one instance
share the same grant state.

The `onPermissionsChange` behavior, refetch-on-grant, and return-to-needs-access-on-revoke rules
from the original requirement apply per resolved section. A lens whose ALL sections are in
`needs-access` has no granted sections; a lens where SOME sections are granted and some are not
shows mixed states in the sectioned render.

#### Scenario: A section on an ungranted origin shows needs-access while other sections fetch

- **GIVEN** a lens with sections `[gitlab:gitlab.com:authored, github:github.com:authored]` where `https://api.github.com/*` is not granted but `https://gitlab.com/*` is
- **WHEN** a poll is due
- **THEN** the `github:github.com:authored` section resolves to `needs-access` without a network request
- **AND** the `gitlab:gitlab.com:authored` section proceeds to fetch normally

#### Scenario: Granting an instance's origin refetches all its filter sections

- **GIVEN** a lens with a gitlab instance carrying `['authored', 'review-requested']` (both sections `needs-access`) and a granted github section
- **WHEN** the user grants `https://gitlab.com/*`
- **THEN** both gitlab filter sections refetch (they share the instance origin) and the github section is unaffected

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

#### Scenario: Adding a second filter to a granted instance requests no new origin

- **GIVEN** an existing lens whose gitlab instance (origin already granted) carries `['authored']`
- **WHEN** the user adds the `review-requested` filter and confirms
- **THEN** the union origin set is unchanged, so no new host-permission dialog is shown and the new section polls immediately

#### Scenario: Denying union host still saves the lens with sections in needs-access

- **GIVEN** the user confirms a new multi-instance lens
- **WHEN** the host-permission dialog is denied or dismissed
- **THEN** the lens SHALL still be created and SHALL render all sections in `needs-access`

### Requirement: The needs-access state renders a calm grant prompt

A resolved section in `needs-access` SHALL render a single muted "Lunma needs access to ⟨host⟩" row
with a "Grant access" control (composed from `Button`/`Icon` primitives) **inside that section**,
below the section header (when visible). Other sections in the same lens SHALL render normally.
Activating the grant row SHALL call `requestHostPermissions(requiredOriginsForConfig(cfg))` for that
section's `ResolvedLensSource`. The visual treatment (muted, key icon, non-`error` styling) is
unchanged.

#### Scenario: A lens with one granted and one needs-access section renders both

- **GIVEN** a lens with sections `gitlab:gitlab.com:authored` (ok, 5 items) and `github:github.com:authored` (needs-access)
- **WHEN** the lens is expanded
- **THEN** the `gitlab:gitlab.com:authored` section renders its 5 items normally
- **AND** the `github:github.com:authored` section renders one muted "Lunma needs access to api.github.com" row with a "Grant access" control

### Requirement: The GitLab connector fetches canned queries over REST

The GitLab connector SHALL issue documented v4 REST `GET` requests against the
lens's `baseUrl` (REST, not GraphQL — session-cookie `POST`s would require a
CSRF token, breaking cookie auth): `GET {baseUrl}/api/v4/merge_requests?state=opened&per_page=20`
plus `scope=created_by_me` (`authored`), `scope=assigned_to_me` (`assigned`), or
`scope=all&reviewer_id=<me>` (`review-requested` — `scope=all` is REQUIRED: the
endpoint defaults to `scope=created_by_me`, under which `reviewer_id` filters
only within your own authored MRs), where `<me>` is resolved via
`GET {baseUrl}/api/v4/user` once per poll cycle and cached in-session. Results
SHALL cap at 20 items. Each item maps to `LensItem` with `id` from the MR's
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

#### Scenario: A review-requested lens lists MRs awaiting my review

- **GIVEN** a lens with `query: 'review-requested'` and a signed-in session
- **WHEN** the connector polls
- **THEN** it resolves the current user via `/api/v4/user`, requests `state=opened&scope=all&reviewer_id=<me>&per_page=20`, and the runtime becomes `ok` with one item per returned MR

#### Scenario: Pipeline statuses map to the four tones

- **WHEN** the connector normalizes MRs whose pipelines are `success`, `failed`, and `running`
- **THEN** the items carry `status.tone` `ok`, `fail`, and `pending` respectively
- **AND** an MR with no pipeline yields an item with no `status`
- **AND** an MR whose pipeline status is `manual` (or any other unmapped value) yields an item with no `status`

#### Scenario: Results cap at 20

- **WHEN** the instance returns a full page of 20 MRs
- **THEN** the runtime holds exactly 20 items (and the lens badge renders `20+` — see the rendering requirement)

### Requirement: Connector auth follows the PAT-then-cookies ladder

For a **GitLab** lens's instance host, the connector SHALL authenticate per
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
than wedging the lens in `pending` — an unbounded hang would otherwise block
every later poll behind the in-flight guard. The connector SHALL NOT prompt,
retry-loop, or surface an exception for auth failures.

#### Scenario: A configured PAT wins over cookies

- **GIVEN** a token is stored for host `gitlab.example.com`
- **WHEN** the connector polls a lens on that host
- **THEN** the request carries `Authorization: Bearer <token>` and omits credentials

#### Scenario: No PAT rides the browser session

- **GIVEN** no token is stored for the lens's host
- **WHEN** the GitLab connector polls
- **THEN** the request is sent with `credentials: 'include'` and no Authorization header

#### Scenario: A login redirect resolves to signed-out, calmly

- **WHEN** a cookie-authenticated poll receives a redirect to an HTML sign-in page
- **THEN** the runtime becomes `state: 'signed-out'` with no exception thrown and no error ack anywhere

#### Scenario: A hung connection resolves bounded, never an eternal pending

- **WHEN** a poll's request hangs (e.g. a dropped VPN to a self-hosted instance)
- **THEN** the bounded timeout aborts it and the runtime resolves to `state: 'error'`
- **AND** the lens's in-flight guard clears, so the next due poll retries

### Requirement: Connector implementations conform to the SourceConnector contract

The `SourceConnector` interface in `background/connectors/connector.ts` SHALL remain
**shape-stable**: `fetchRuntime` accepts a **resolved single-query** config (the engine expands `queries[]` before
dispatch; a connector never sees a `queries[]` array) plus `ConnectorCaches?`:
`fetchRuntime(cfg: ResolvedLensSource, maxItems: number, caches?: ConnectorCaches): Promise<LensSectionRuntime>`,
where `ResolvedLensSource` is `{ source: LensProvider; baseUrl: string; query?: LensQuery }`
(a single optional query, present for queue sources, absent for rss). `maxItems` is passed
separately. `listingUrl`, `requiredOrigins`, `defaultBaseUrl`, and `mintedIcon` accept the same
resolved config (origins and listing URLs are query-independent for the queue sources).

The engine's `fetchLensSectionRuntime(cfg: ResolvedLensSource, maxItems, caches?)` entry point
dispatches to `CONNECTORS[cfg.source].fetchRuntime(cfg, maxItems, caches)`. The
`resolvedConfigs(node): ResolvedLensSource[]` helper performs the `sources[] × queries[]`
expansion and is the single derivation used by the engine fan-out, the origin union, and the
editor's section preview.

#### Scenario: A fetch dispatches through the registry by resolved config

- **WHEN** the engine refreshes a section whose resolved config carries `source: 'gitlab', query: 'authored'`
- **THEN** `CONNECTORS.gitlab.fetchRuntime(cfg, maxItems, caches)` performs the fetch with that single query and the result event reaches the drain

#### Scenario: The registry holds exactly the four shipped sources

- **WHEN** the `CONNECTORS` registry is inspected
- **THEN** its keys are exactly `gitlab`, `github`, `jira`, and `rss`

### Requirement: The GitHub connector fetches canned queries over the search API

The GitHub connector SHALL issue REST `GET` requests against the lens's API
root — `https://api.github.com` when the lens's `baseUrl` host is
`github.com`, else `{baseUrl}/api/v3` (GitHub Enterprise Server's REST root;
the derivation lives in `connectors/github.ts`) —
with `Accept: application/vnd.github+json`. The three canned queries map to
`GET {apiRoot}/search/issues?q=is:pr+is:open+{qualifier}&per_page=20&sort=updated&order=desc&advanced_search=true`
(the `advanced_search` param rides GitHub's issue-search migration — required
on github.com going forward, ignored by GHE versions that predate it) where
the qualifier is `author:@me` (`authored`), `assignee:@me` (`assigned`),
or `review-requested:@me` (`review-requested`) — `@me` resolves server-side
under token auth, so the GitHub connector performs NO me-resolution request.
Results SHALL cap at 20 items. Each item maps to `LensItem` with `id`
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

#### Scenario: A review-requested lens lists PRs awaiting my review

- **GIVEN** a `github` lens with `query: 'review-requested'` and a stored token
- **WHEN** the connector polls
- **THEN** it requests `search/issues?q=is:pr+is:open+review-requested:@me&per_page=20&sort=updated&order=desc&advanced_search=true` with no me-resolution call, and the runtime becomes `ok` with one item per returned PR

#### Scenario: GHE derives its API root from baseUrl

- **GIVEN** a lens with `baseUrl: 'https://ghe.example.com'`
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
authentication. When NO token is stored for the lens's host the connector
SHALL resolve `{ state: 'signed-out' }` WITHOUT issuing a request (the request
could only fail; not sending it is rate-limit kind). A `401` (revoked or
malformed token) SHALL also resolve `signed-out`; ANY other non-2xx response —
403 in all its shapes (rate limit, SAML-unauthorized organization,
fine-grained-PAT scope gaps), 5xx — plus
network failures and timeouts resolve `error`. Token hygiene is unchanged:
stored only in `chrome.storage.local`, never logged, never broadcast, never
echoed.

#### Scenario: No token short-circuits to signed-out

- **GIVEN** a `github` lens whose host has no stored token
- **WHEN** the connector polls
- **THEN** the runtime becomes `signed-out` and no network request is made

#### Scenario: A revoked token resolves signed-out, calmly

- **WHEN** a poll with a stored token receives a `401`
- **THEN** the runtime becomes `state: 'signed-out'` with no exception and no error ack anywhere

### Requirement: The Jira connector fetches canned queries over the search/JQL endpoint

The Jira connector (`apps/extension/src/background/connectors/jira.ts`) SHALL
target **Jira Cloud** (`*.atlassian.net`), issuing one REST `GET` per lens per
poll against the GA search endpoint
`GET {baseUrl}/rest/api/3/search/jql?jql={encoded}&fields=summary,status&maxResults=20`
with `Accept: application/json` (the legacy `/rest/api/3/search` is deprecated by
Atlassian and SHALL NOT be used; Jira Server/Data Center `/rest/api/2` is out of
scope for this change). The three canned queries map to JQL — the
`review-requested` slot is **re-skinned per source** to Jira's `watcher` (its
editor label is "Watching"; the `LensQuery` value remains `'review-requested'`):

- `authored` → `reporter = currentUser() AND statusCategory != Done ORDER BY updated DESC`
- `assigned` → `assignee = currentUser() AND statusCategory != Done ORDER BY updated DESC`
- `review-requested` → `watcher = currentUser() AND statusCategory != Done ORDER BY updated DESC`

`currentUser()` resolves server-side under the session, so the Jira connector
performs **NO me-resolution request** (and uses no `ConnectorCaches`). Results
SHALL cap at 20 items (the badge renders `20+` when the page is full). Each issue
maps to `LensItem` with `id` from the issue id, `url` set to
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

#### Scenario: An assigned lens lists my open issues over the GA endpoint

- **GIVEN** a `jira` lens with `query: 'assigned'` on a logged-in `*.atlassian.net` site
- **WHEN** the connector polls
- **THEN** it requests `{baseUrl}/rest/api/3/search/jql?jql=assignee%20%3D%20currentUser()%20AND%20statusCategory%20!%3D%20Done%20ORDER%20BY%20updated%20DESC&fields=summary,status&maxResults=20` with no me-resolution call, and the runtime becomes `ok` with one item per returned issue

#### Scenario: The watching slot re-skins review-requested to JQL watcher

- **GIVEN** a `jira` lens whose `query` value is `'review-requested'`
- **WHEN** the connector builds its request
- **THEN** the JQL filters `watcher = currentUser()` (not any review concept), while the persisted `LensQuery` value stays `'review-requested'`

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
a hung connection resolves to `error` rather than wedging the lens in
`pending`. The connector SHALL NOT prompt, retry-loop, or surface an exception
for auth failures.

#### Scenario: A logged-in poll rides the session cookies

- **GIVEN** a browser logged into the lens's `*.atlassian.net` site and no stored token of any kind
- **WHEN** the Jira connector polls
- **THEN** the request is sent with `credentials: 'include'` and no `Authorization` header
- **AND** `lunma.connectors` is not read

#### Scenario: A login redirect resolves to signed-out, calmly

- **WHEN** a poll receives a `401` or a redirect to a non-JSON atlassian login document
- **THEN** the runtime becomes `state: 'signed-out'` with no exception thrown and no error ack anywhere

#### Scenario: A hung connection resolves bounded, never an eternal pending

- **WHEN** a poll's request hangs
- **THEN** the bounded timeout aborts it and the runtime resolves to `state: 'error'`
- **AND** the lens's in-flight guard clears, so the next due poll retries

### Requirement: Polling and refresh scheduling

On each tick the engine SHALL fan out per **resolved section** (one per `LensSource` entry
for each of its `queries`, or a single section for an rss entry) across all due lenses, fetching
each section independently; the single repeating alarm (`lunma/lenses-poll`) and cadence
logic are unchanged. `startLensRefresh(deps, node, caches?)` SHALL iterate `node.sources`, expand
each entry over its `queries[]` into resolved single-query configs (a single pass for rss), derive
each `sourceKey`, and call `fetchLensSectionRuntime(cfg, node.maxItems, caches)` for each resolved
config in parallel (bounded by the existing concurrency model). Within one poll cycle, the engine
SHALL share `ConnectorCaches` across the filters of the same connector instance so per-instance
me-resolution (e.g. `/api/v4/user`) is performed at most once per instance per cycle.
`refreshLens { spaceId, folderId }` SHALL unconditionally refresh ALL resolved sections of
that lens.

#### Scenario: Only due lenses refresh on a tick

- **GIVEN** lens A (`refreshMinutes: 5`, last fetched 6 minutes ago) with one gitlab instance carrying two filters, and lens B (`refreshMinutes: 30`, last fetched 10 minutes ago)
- **WHEN** the poll alarm fires
- **THEN** both of lens A's filter sections refresh and lens B's sections do not

#### Scenario: One me-resolution per instance per cycle

- **GIVEN** a gitlab instance carrying filters `['authored', 'assigned', 'review-requested']`
- **WHEN** the engine refreshes all three sections in one poll cycle
- **THEN** `/api/v4/user` is resolved once and reused across the three filter fetches (shared `ConnectorCaches`)

### Requirement: Lens item bindings give results pinned-tab activation

`lensItemBindings` is typed as `{ [folderId: FolderId]: { [namespacedItemId: string]: { [windowId: WindowId]: { tabId: TabId; allowGlob: string } } } }` in `AppState`, persisted at schema v9 (raised from v8 by this change). Each `namespacedItemId` SHALL be of the form `${sourceKey}:${nativeId}` where `sourceKey` is the **per-filter** section key (`${source}:${host}:${query}` for queue sections, `${source}:${host}` for rss) and `nativeId` is the connector's native item id. This prevents collisions when two filters of the same instance — or two instances — produce items with the same native id.

All open/close/bind/unbind behavior, the `dropLensBindings` demote-on-delete behavior, and the `isBound` tab-created guard are unchanged except that every slot read/write uses the per-filter namespaced id form. `openLensItem` receives a `namespacedItemId` from the sidebar; the SW uses it as the binding key directly.

#### Scenario: Opening a lens item from a multi-filter section uses the per-filter namespaced id

- **GIVEN** a lens with one gitlab instance carrying filters `['authored', 'review-requested']` and an authored item with native id `42`
- **WHEN** `openLensItem { folderId, itemId: 'gitlab:gitlab.com:authored:42', windowId: 100, spaceId }` is dispatched
- **THEN** a tab opens at the item's URL and is bound under `lensItemBindings[folderId]['gitlab:gitlab.com:authored:42'][100]`

#### Scenario: The same MR in two filter sections binds independently

- **GIVEN** an MR with native id `42` appearing in both the `authored` and `review-requested` sections of one gitlab instance
- **WHEN** the row is activated in each section
- **THEN** `lensItemBindings[folderId]` SHALL hold separate keys `'gitlab:gitlab.com:authored:42'` and `'gitlab:gitlab.com:review-requested:42'`

### Requirement: Lens item boundary re-arms on page load

After any page load in a lens item bound tab (`tabs.onUpdated` with `status: 'complete'`), the SW SHALL re-arm the boundary content script using the slot's stored `allowGlob`. This mirrors the existing saved-tab re-arm path in the `tabs.onUpdated` handler. The re-arm SHALL be floated as a side effect (same as saved tabs) to avoid blocking the drain's persist+broadcast.

If the slot's `allowGlob` is empty (a pre-migration slot that was bound before this change deployed), the re-arm SHALL be skipped for that slot — it degrades to the v1 no-boundary behaviour until the user next opens that item.

#### Scenario: Reloading a lens tab re-arms the boundary

- **GIVEN** a lens item tab whose `allowGlob` is `'https://gitlab.example.com/proj/-/merge_requests/42*'`
- **WHEN** `tabs.onUpdated { status: 'complete' }` fires for that tab
- **THEN** the SW SHALL float `ctx.boundary.configureLensItemBoundary(tabId, allowGlob)` as a side effect
- **AND** the boundary content script SHALL be (re-)injected and armed with the original allow-set

### Requirement: Boot re-arm covers lens item tabs

`BoundaryController.refreshBoundTabBoundaries` SHALL iterate `store.state.lensItemBindings` in addition to `store.state.tabBindings` and call `configureLensItemBoundary(tabId, slot.allowGlob)` for every slot whose `allowGlob` is non-empty. This ensures lens item tabs that were open when the SW restarted regain their boundary enforcement on boot without requiring the lens runtime to be populated first.

#### Scenario: Boot re-arm covers a lens item tab with a stored glob

- **GIVEN** a persisted `lensItemBindings` slot `{ tabId: 500, allowGlob: 'https://jira.example.com/browse/PROJ-1*' }`
- **WHEN** the SW boots and calls `refreshBoundTabBoundaries`
- **THEN** `configureLensItemBoundary(500, 'https://jira.example.com/browse/PROJ-1*')` SHALL be called for that slot
- **AND** the lens item tab SHALL have its boundary content script injected and armed

### Requirement: `BoundaryController.configureLensItemBoundary`

`BoundaryController` SHALL expose a method `configureLensItemBoundary(tabId: TabId, allowGlob: string): Promise<void>` that:
- Returns immediately (no-op) when `allowGlob` is empty.
- Calls `await injectBoundary(tabId)` to ensure the content script is present.
- Calls `sendBoundaryConfig(tabId, [allowGlob])` to arm the script with the single-pattern allow-set.
- Never throws — a forbidden page or closed receiver is benign, same as `configureBoundary`.

This method is the only new surface on `BoundaryController`; all other boundary methods and the `effectiveBoundaryDefault` logic are unchanged.

#### Scenario: First activation opens a bound, non-temporary tab

- **GIVEN** an expanded lens listing item `42` with no binding in window 100
- **WHEN** the user activates the row
- **THEN** a tab opens at the item's URL, joins the Space's Chrome group, and is bound under `lensItemBindings[folderId]['42'][100]`
- **AND** the tab never appears in the Temporary list

#### Scenario: Re-activation focuses instead of reopening

- **GIVEN** item `42` bound to tab 7 in window 100
- **WHEN** the user activates the row again
- **THEN** tab 7 is focused and no new tab is created

#### Scenario: An SW restart keeps the binding

- **GIVEN** item `42` bound to tab 7
- **WHEN** the SW restarts and boot recovery runs while tab 7 is still open
- **THEN** the binding survives (ids persisted) and tab 7 stays out of Temporary

#### Scenario: Deleting the lens demotes bound tabs to Temporary

- **GIVEN** a lens with two bound live tabs
- **WHEN** the user deletes the lens
- **THEN** no tab closes, both bindings drop, and both tabs appear in the Temporary list

#### Scenario: Closing the tab unbinds

- **GIVEN** item `42` bound to tab 7
- **WHEN** tab 7 closes (the row's ✕ or Chrome's own close)
- **THEN** the binding drops and the row returns to its plain (or evaporates if held)

### Requirement: Lens rendering and the one-glyph restraint

The sidebar SHALL render a lens with a sectioned layout when it has ≥ 2 **resolved
sections** (counting each filter of each instance plus each rss feed). A lens with exactly one
resolved section renders identically to today (no section headers, no collapse control, no visual
change).

When expanded with ≥ 2 resolved sections, the lens SHALL render, in `node.sources` order and
within each entry in `queries` order: (a) a **section header** row — a single **16px disclosure
slot** showing the section's source icon (`rss` / git / kanban) in `--text-dim` **at rest**, which
crossfades to a rotating `chevron-right` on the header's `:hover` / `:focus-visible` (one slot, NOT
a separate chevron and icon), followed by a label in `--text-dim`, `--text-xs`, `--weight-medium`,
at a compact (~24px) height, with a hairline separator above every section header except the first —
followed by (b) the section's **body** — its result rows using the existing per-kind rules
(queue → status dots; feed → unread marks), plus the section's ghost/empty/error/sign-in/needs-access
rows and feed reading-controls. The header label SHALL be `host · filter` for a queue section (e.g.
`gitlab.com · authored`, the filter using the per-source query label) and `host` for an rss section.
Section headers SHALL be implemented as `LensSectionHeader.svelte` (composed of the `Icon` primitive
only — no new primitives). Per-item favicons SHALL be recessed at rest (reduced opacity, full on row
hover/active) so the item title leads. The crossfade and chevron rotation SHALL collapse to instant
under `prefers-reduced-motion: reduce`, and all header colours SHALL come from the `--text-*` ramp so
WCAG-AA holds at every Colour intensity.

The section header SHALL be an **interactive disclosure control** (a `<button>`, not an
`aria-hidden` divider): activating it toggles that section's collapsed state (see Requirement:
Multi-source lens sections are individually collapsible). It SHALL carry `aria-expanded`
reflecting the section's collapsed state and an accessible label naming the section (host and
filter), the count, and the toggle action. When a section is **collapsed**, the lens SHALL render
the section header (including its count) and hide the section body; when expanded, the body renders
normally.

The section header and its result rows SHALL stay at the same indentation — the disclosure
affordance SHALL NOT introduce an additional nesting indent (the layout is flat: collapse is
signalled by the section body's presence and the on-hover chevron, not indent depth).

The lens badge SHALL sum per-section attention counts: `Σ (item count for queue sections)
+ Σ (unread count for feed sections)`, counting each resolved section independently (an item
appearing in two filter sections counts in each) and **independent of any section's collapsed
state**. The `N+` cap triggers when any section has hit its `maxItems` cap. The badge never shows 0
(hidden when sum is 0). For a single-section lens the badge is identical to today.

Empty-state notes, ghost rows (first-fetch), signed-out/error/needs-access states, and the "open
work holds its row" behavior apply per resolved section. A section in `pending` (first-ever fetch)
renders three static ghost rows.

#### Scenario: A single-section lens renders identically to before this change

- **GIVEN** a lens with exactly one resolved section (one instance, one filter)
- **WHEN** the lens is expanded
- **THEN** no section header and no collapse control are rendered and the layout is visually identical to the pre-change behavior

#### Scenario: A two-filter instance renders sectioned with host · filter headers

- **GIVEN** a lens with one instance `{ source: 'gitlab', baseUrl: 'https://gitlab.com', queries: ['authored', 'review-requested'] }`, each section `ok` with items
- **WHEN** the lens is expanded
- **THEN** the lens renders: section header "gitlab.com · authored" → authored items → section header "gitlab.com · reviewing" → review-requested items

#### Scenario: The section header is a single disclosure slot

- **GIVEN** a two-source lens, expanded
- **WHEN** a section header renders
- **THEN** it presents ONE 16px leading slot — the source icon at rest — not a separate chevron plus source icon
- **AND** the chevron is revealed (crossfaded in, rotated to reflect expanded state) on the header's hover / keyboard focus

#### Scenario: The lens badge sums per-section attention counts regardless of collapse

- **GIVEN** a lens with a gitlab authored section (7 items) and a gitlab reviewing section (3 items), with the reviewing section collapsed
- **WHEN** the lens renders
- **THEN** the badge reads `10` (the collapsed section still contributes)

#### Scenario: A section header is a disclosure control

- **GIVEN** a two-source lens, expanded
- **WHEN** the gitlab section header renders
- **THEN** it is a button carrying `aria-expanded` and an accessible label naming the host, count, and toggle action — not an `aria-hidden` divider

### Requirement: Calm failure and pending states

A lens's non-`ok` runtime states SHALL render quietly, never as a red
error card: `signed-out` → a single muted row whose copy and activation are
**per source** — a GitLab **or Jira** lens renders "Sign in to ⟨host⟩"
dispatching `openUrl` with the lens's `baseUrl` (both ride a browser session,
so the next due poll heals after sign-in); a GitHub lens renders "Add a token
in Settings → Connectors" opening the options page at its Connectors anchor via
the sidebar's established options deep-link (`openOptionsAt('#connectors')` from
`sidebar/open-options.ts` — App.svelte's helper; NOT `openUrl`, whose handler's
scheme hardening deliberately drops non-http(s) URLs and stays untouched — there
is no session to sign in to, the fix is the token);
`error` → the last-known items remain rendered with one
dim note row ("Couldn't reach ⟨host⟩") at the list end; first-fetch `pending`
(no items yet) → three static low-alpha ghost rows (no shimmer, no strobe).
During a reload — including the post-SW-restart refetch, whose boot broadcast
carries an empty runtime slice — the sidebar SHALL keep rendering the lens's
last-shown items from component memory (held in the sidebar only, never
persisted), activatable throughout, with only the refresh indicator marking the
reload; ghost rows render only when nothing has ever been shown, and an honest
`ok`-empty result clears the hold (stale items are never resurrected) —
**except items whose lens item binding is live**: open work holds its row.
An item that drops out of the latest results while its bound tab is open
SHALL keep rendering from component memory (same anatomy, same dot rules)
until its binding drops, at which point the row evaporates on the next
render. No failure state SHALL produce a rejected command ack, a toast, or a
notification.

#### Scenario: Signed-out shows the sign-in row

- **GIVEN** a GitLab lens on `gitlab.example.com` whose runtime is `signed-out`
- **WHEN** the lens is expanded
- **THEN** it renders one "Sign in to gitlab.example.com" row and no ghost/error rows
- **AND** activating it opens the instance via `openUrl`

#### Scenario: A signed-out Jira lens shows the sign-in row

- **GIVEN** a `jira` lens on `acme.atlassian.net` whose runtime is `signed-out`
- **WHEN** the lens is expanded
- **THEN** it renders one "Sign in to acme.atlassian.net" row and activating it opens the instance via `openUrl` (never the token/options path — Jira has no token)

#### Scenario: A token-less GitHub lens points at Connectors

- **GIVEN** a `github` lens whose runtime is `signed-out`
- **WHEN** the lens is expanded
- **THEN** it renders one "Add a token in Settings → Connectors" row
- **AND** activating it opens (or reuses) an options tab at the Connectors section via the sidebar's options deep-link, never via `openUrl`

#### Scenario: Errors keep last-known items

- **GIVEN** a lens whose last poll succeeded with 5 items and whose latest poll failed with a network error
- **WHEN** the lens renders
- **THEN** the 5 items remain with a dim "Couldn't reach ⟨host⟩" note row beneath them

#### Scenario: First fetch shows ghost rows

- **WHEN** a freshly created lens renders before its first fetch resolves
- **THEN** it shows three static ghost rows

#### Scenario: A reload never blanks an open sidebar

- **GIVEN** a lens rendering 5 items in an open sidebar
- **WHEN** the SW restarts (the boot broadcast carries an empty `lenses` slice) and the post-boot refetch begins
- **THEN** the 5 last-shown items remain rendered and activatable, with the refresh indicator spinning
- **AND** no ghost rows appear until/unless the lens has never shown items

#### Scenario: Open work holds its row

- **GIVEN** an item bound to an open tab
- **WHEN** the next `ok` poll no longer lists that item (the PR merged, or the lens's query changed)
- **THEN** the row keeps rendering with its bound treatment
- **AND** when the bound tab closes, the row evaporates on the next render

### Requirement: Creation and configuration via the pinned-header menu

The `LensEditor.svelte` SHALL render, top to bottom: a **Name** field; a
**Sources** list of in-place editable **source cards**; the lens settings
(**Show** maximum-items and **Refresh** cadence `Select`s); and a single primary
action — **Create** (new) or **Save** (edit) — with a **Cancel** ghost beside it
and the validation hint read alongside them. There is no separate inline
"add-source" sub-form and no second confirm button.

The **Sources list SHALL be height-bounded and scroll independently**
(`overflow-y: auto`) while **Name** stays pinned above it and the lens settings
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
the body in place. Editing a card SHALL mutate the lens's `sources` directly
(no intermediate Add step); the existing source-adaptive behaviour (URL label,
filters hidden for rss, hint line, refresh default, name auto-suggest) applies
per card. On create, the list SHALL seed one default card so a single-source
lens is fill-and-create. An `+ Add source` ghost `Button` below the list SHALL
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
lens's card triggers an immediate refetch of the affected sections only
(`updateLens` carries the full new `sources[]`; the engine diffs resolved
sections to find added/removed/changed ones).

#### Scenario: The card header is identical collapsed and expanded

- **GIVEN** a source card
- **THEN** its header row (disclosure chevron + source glyph + host identity + controls) is present whether collapsed or expanded
- **AND** expanding reveals the body (Source select + URL + filters) beneath that same header — the header is not replaced by the Source select

#### Scenario: Reordering by grip — drag or arrow keys

- **GIVEN** a lens with two or more source cards
- **WHEN** the user drags a card's grip handle onto another position (or focuses the grip and presses Arrow Up / Arrow Down)
- **THEN** the card moves to the new position in `sources` and keyboard focus stays on the moved card's grip

#### Scenario: Creating a multi-filter lens from the header menu

- **WHEN** the user opens "New lens…", the seeded GitLab card is shown, the user ticks "Authored" and "Reviewing", and presses Create
- **THEN** `createLens` is dispatched with `sources: [{ source: 'gitlab', baseUrl: 'https://gitlab.com', queries: ['authored', 'review-requested'] }]`
- **AND** the lens appears with two sections, each pending its first fetch

#### Scenario: A single-source lens needs no separate Add step

- **WHEN** the user opens "New lens…" and the seeded card is valid (default GitLab + a filter)
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

- **GIVEN** a lens already holding `{ source: 'gitlab', baseUrl: 'https://gitlab.com', queries: ['authored'] }`
- **WHEN** the user adds a GitLab card on the same host with "Reviewing" ticked
- **THEN** the instances merge to a single `{ source: 'gitlab', baseUrl: 'https://gitlab.com', queries: ['authored', 'review-requested'] }` (not a second entry)

#### Scenario: An OPML card imports and expands into feed cards

- **WHEN** the user sets a card's source to "OPML file" and chooses a file with three valid feeds
- **THEN** that card is replaced by three `rss` cards (deduplicated by `source:host`) and the import count is reported

#### Scenario: Removing a filter from an existing lens updates it immediately

- **GIVEN** a lens with a gitlab card carrying `['authored', 'review-requested']`; the user unticks "Reviewing" and presses Save
- **THEN** `updateLens` carries the instance with `queries: ['authored']` and the lens's runtime drops the `gitlab:gitlab.com:review-requested` section

### Requirement: Connectors section in the options page

The options page SHALL render a **Connectors** section managing per-host access
tokens in a dedicated `lunma.connectors` record in `chrome.storage.local`,
accessed only through `apps/extension/src/shared/connectors.ts`
(`readConnectors()` / `setConnectorToken(host, token | null)`). The section is
independent of the sync-backed settings registry and of lens configs
(the options page reads neither `AppState` nor `pinnedBySpace`). It SHALL list
each stored host with a token-set indicator and allow adding a host + token,
replacing, and clearing. The token input SHALL be a password-type field, and a
stored token SHALL never be echoed back into the field (a "Token set — replace?"
affordance renders instead). Setting or clearing a token SHALL take effect on
the next poll without a reload.

#### Scenario: Adding a token for a self-hosted instance

- **WHEN** the user adds host `gitlab.example.com` with a token in the Connectors section
- **THEN** `lunma.connectors` in `chrome.storage.local` holds the token for that host
- **AND** the next poll of any lens on that host authenticates via Bearer header

#### Scenario: A stored token is never echoed

- **GIVEN** a token is stored for a host
- **WHEN** the Connectors section renders
- **THEN** the token value does not appear in the DOM (the row shows a token-set indicator with a replace affordance)

### Requirement: The RSS connector fetches and parses public feeds

The `rss` connector (`apps/extension/src/background/connectors/rss.ts`) SHALL
fetch the node's `baseUrl` (the feed URL) via `boundedFetch` with no credentials
and parse the response body as a syndication feed, supporting **RSS 2.0 and Atom**
in one DOM-free streaming pass over the `saxes` SAX parser (the MV3 service worker
has no `DOMParser`). It SHALL normalize each entry onto `LensItem`
(no `status`): `url` from the entry `link` (RSS) or
`link[rel=alternate]`/`link[@href]` (Atom); `id` from `guid`/`id` when present,
**falling back to the entry `url`**.

The connector SHALL also populate the OPTIONAL rich-content fields from the SAME
response (no additional network request): `excerpt` from `<description>` /
`<summary>` (else `<content:encoded>` / Atom `<content>`), reduced to clamped
plain text (tags stripped via bounded regex — no `DOMParser` — entities decoded,
clamped to ~280 chars); `imageUrl` from `media:content[medium=image]` /
`media:thumbnail` / an image `enclosure`, falling back to the first inline
`<img src>` in the description HTML; and `publishedAt` from `pubDate` (RSS) or
`published`/`updated` (Atom), parsed to epoch ms (`published`/`pubDate`
authoritative over `updated`), omitted when unparseable. Each rich field SHALL be
omitted when empty or absent.

Parsing SHALL be element-wise tolerant — one
malformed entry SHALL NOT cost the rest, and a parser error SHALL keep whatever
parsed cleanly. Results SHALL be sliced to the node's `maxItems`. The connector
SHALL resolve to `pending | ok | error` only — **`signed-out` is impossible** for a
public feed. A network failure, a non-2xx response, an oversized body, or an empty
parse SHALL resolve to the quiet `error` state (last-known items hold, per
Requirement: Calm failure and pending states). `listingUrl` SHALL return the feed
**channel-level** website link (the channel `<link>` / feed `link[rel=alternate]`),
falling back to the feed URL when absent.

#### Scenario: An RSS 2.0 feed normalizes to result rows

- **WHEN** the connector fetches a lens whose feed returns RSS 2.0 with three `<item>`s (one CDATA title, one without a `<guid>`)
- **THEN** the runtime is `ok` with three items, the CDATA title decoded, and the guid-less item's `id` equal to its link

#### Scenario: An Atom feed normalizes to result rows

- **WHEN** the connector fetches a lens whose feed returns Atom `<entry>`s with `<link rel="alternate" href=…>` and `<id>`
- **THEN** the runtime is `ok` with each item's `url` taken from the alternate link and `id` from the entry id

#### Scenario: A feed source never reports signed-out

- **WHEN** any RSS fetch fails (network error, non-2xx, or unparseable body)
- **THEN** the runtime resolves to `error`, never `signed-out`

#### Scenario: Results slice to maxItems

- **WHEN** a feed returns 40 entries and the node's `maxItems` is 20
- **THEN** the runtime holds exactly 20 items

#### Scenario: An entry's description, image, and date are parsed into rich fields

- **WHEN** the connector parses an `<item>` with a `<description>` containing HTML, a `media:content` image, and a `pubDate`
- **THEN** the item carries `excerpt` (plain text, tags stripped), `imageUrl` (the media URL), and `publishedAt` (the pubDate as epoch ms)

#### Scenario: The image falls back to the first inline image

- **WHEN** an entry has no media/enclosure image but its description HTML contains an `<img src=…>`
- **THEN** the item's `imageUrl` is that inline image URL

#### Scenario: An unparseable date is omitted

- **WHEN** an entry's date text does not parse
- **THEN** the item carries no `publishedAt` (never `NaN`)

### Requirement: Reading lenses are a draining unread queue

A feed (`rss`) lens SHALL be a **draining unread queue**. An item is **unread**
until it is **consumed**; the lens surfaces the newest `maxItems` **unread**
items (see Requirement: Lenses honour a per-lens maximum item count),
backfilling older unread as items are consumed. An item is **consumed** (marked
**read**) when the user **moves on** from it — NOT when it is merely opened:
opening (`openLensItem`) binds a tab and keeps the entry in the list (bound,
active, unread); the item is marked read only when its bound tab is **deactivated**
(the user navigates to another tab — per-window, swept in the store's
`setActiveTab`) or **closed** (`onTabRemoved`). **Consume SHALL also close the
tab**: when an entry is consumed by navigating away, its bound (now-inactive) tab
is closed (`chrome.tabs.remove`) so the reading queue leaves no tab trail; the tab
you are actively on is never closed, and an already-read item is never re-closed.
The read set is persisted ids-only and pruned (see the `storage-and-migrations`
capability, Requirement: Lens read-state is persisted and pruned).

**Auto-advance** keeps the reading flow going: when the user **manually closes**
the tab of the UNREAD item they are reading (`onTabRemoved` for an item still
unread at close time), the queue SHALL open the next unread, unbound item in the
**same section** (`nextUnreadFeedItemAfterClose` → `openLensItem`). Auto-advance
SHALL NOT fire for a **consume=close**: when an item is consumed by navigating
away, the store marks it read BEFORE the SW closes its tab, so an
already-read closing item is the signal that the close is a drain, not a manual
close — advancing there would chase the consume into a runaway drain (consume →
open next → consume → …, emptying the whole section). `nextUnreadFeedItemAfterClose`
therefore SHALL return nothing when the closing item is already read.

The feed's resting state SHALL be **drained** — read rows hidden (the node's
`hideRead` defaults `true`, the persisted lens-level resting preference). The
**"Show recently read"** peek SHALL be **per resolved feed section** and
**sidebar-local, per-window** (`setLensSectionRevealRead`, keyed by
`windowId → folderId → sourceKey`, never persisted/broadcast — mirroring the
per-section collapse state): revealing one feed's read rows in one window leaves
every other feed and window drained, and the peek resets on reload. The lens's
`hideRead` default still governs a section unless this window has revealed it.
The sidebar SHALL also expose a lens-level **"Mark all read"** action via
`markAllLensItemsRead { spaceId, folderId }` (drains the whole lens); the
`markLensItemRead { folderId, itemId }` command also exists for an explicit
single mark. Read-state behaviour SHALL apply to **feed sources only**; queue
items carry no read-state.

#### Scenario: Opening an entry keeps it; moving on drains it

- **GIVEN** an unread item in a feed lens
- **WHEN** the user activates its row (opening its tab)
- **THEN** the item is bound and **stays unread** in the list while its tab is the active tab
- **AND WHEN** the user navigates to another tab (its bound tab deactivates) or closes the tab
- **THEN** the item is marked read, its row drains, the next-oldest unread backfills, the unread badge decrements, AND (on the navigate-away path) its bound tab is closed (consume = close — no tab trail)

#### Scenario: Manually closing the reading tab advances to the next unread

- **GIVEN** an UNREAD feed item whose tab is open and active
- **WHEN** the user closes that tab themselves (it is still unread at close time)
- **THEN** the queue opens the next unread, unbound item in the same section

#### Scenario: A consume=close does NOT auto-advance (no runaway drain)

- **GIVEN** a feed item that was consumed by navigating away (marked read, then its now-inactive tab closed by the SW)
- **WHEN** `onTabRemoved` fires for that already-read tab
- **THEN** `nextUnreadFeedItemAfterClose` returns nothing and no next item is opened — so consuming one item never cascades into draining the section

#### Scenario: The resting state is drained; per-section "Show recently read" reveals only that feed

- **GIVEN** a lens with two feed sections, each holding read and unread items (`hideRead: true`, the default)
- **THEN** only the unread rows of each section render (the read rows are collapsed)
- **WHEN** the user selects "Show recently read" on the FIRST section
- **THEN** `setLensSectionRevealRead` records the reveal for that window + lens + section key, the first section's read rows are revealed in place, and the second section stays drained

#### Scenario: Mark all read empties the unread count

- **WHEN** the user selects "Mark all read" on a feed lens
- **THEN** `markAllLensItemsRead` marks every current item read and the badge becomes absent

### Requirement: Lenses honour a per-lens maximum item count

`maxItems` is a lens-level field applied per **resolved section**: each section SHALL show up to
`maxItems` rows (queue cap) or up to `maxItems` unread rows (feed budget). The total visible rows
across all sections can be up to `S × maxItems` where S is the number of resolved sections
(instances × filters, plus feeds). The lens badge sums per-section attention counts; the `N+`
cap triggers when any section has hit its `maxItems` cap. Migrated nodes default `maxItems: 20`
(unchanged). The editor label reads "per section" when the lens has ≥ 2 resolved sections.

The feed budget is over **unread** items, NOT a positional slice: a section's render window SHALL
span through the newest `maxItems` unread items (all of them when fewer than `maxItems`), so every
unread item the badge counts renders even when read rows sit ahead of it in feed order (you read
the newest items). The window SHALL also cover at least the first `maxItems` rows so read rows
remain present for the "Show recently read" peek.

#### Scenario: The cap applies per resolved section

- **GIVEN** a lens with `maxItems: 10`, a gitlab instance with filters `['authored', 'review-requested']` returning 15 and 12 items, and an rss section with 20 unread
- **THEN** the authored section renders 10 items (capped), the reviewing section renders 10 items (capped), and the rss section renders 10 unread (budget)
- **AND** the badge reads `30+` (a section hit cap)

#### Scenario: Unread behind a run of read rows still render

- **GIVEN** a feed section with `maxItems: 3` whose newest 3 items are read and whose 2 older items are unread (`hideRead: true`)
- **THEN** both unread items render (the window spans past the leading read rows), the badge reads `2`, and the read rows stay available under "Show recently read"
- **AND** the section never shows the badge count with an empty list

#### Scenario: Single-section lens cap is unchanged

- **GIVEN** a lens with exactly one resolved section and `maxItems: 20` returning 25 items
- **THEN** the section renders 20 items and the badge reads `20+`

### Requirement: Lenses open their full listing in a tab

Every lens SHALL offer **"open all in a tab"**, opening the source's full
listing (the connector's `listingUrl`) in a new browser tab via the existing
`openUrl { url, windowId }` command — dispatched by
`openLensListing { spaceId, folderId, windowId }`. It SHALL be reachable
**both** from a results-footer affordance ("Open all ↗") under an expanded lens
**and** from the lens kebab ("Open all in a tab"), so it is pointer-, keyboard-,
and touch-reachable.

#### Scenario: Open all opens the listing URL

- **WHEN** the user selects "Open all in a tab" on an `rss` lens
- **THEN** the connector's `listingUrl` (the feed's website) opens in a new tab in the active window via `openUrl`

#### Scenario: Queue connectors gain the listing escape hatch

- **WHEN** the user selects "Open all in a tab" on a `gitlab` lens
- **THEN** the GitLab listing view (e.g. the dashboard merge-requests page) opens in a new tab

### Requirement: Source key derivation is pure and stable

`sourceKey(cfg: ResolvedLensSource): string` in `background/lenses.ts` SHALL return
`${cfg.source}:${new URL(cfg.baseUrl).host}:${cfg.query}` when `cfg.query` is present (queue
sections), and `${cfg.source}:${new URL(cfg.baseUrl).host}` when it is absent (rss). It SHALL be
pure and SHALL NOT perform I/O. The same derivation SHALL be used by `setLensSectionRuntime`,
`lenses.result` events, and the `lensItemBindings` namespace.

#### Scenario: Source key includes the filter for a queue section

- **WHEN** a gitlab authored section on `https://gitlab.example.com` produces `sourceKey`
- **THEN** the key is `'gitlab:gitlab.example.com:authored'` and is stable across lens name changes

#### Scenario: An rss source key omits the query

- **WHEN** an rss section on `https://feeds.example.com/rss` produces `sourceKey`
- **THEN** the key is `'rss:feeds.example.com'`

### Requirement: `hideRead` and feed menu actions apply only to feed sections

`hideRead` and the "Mark all read" / "Show recently read" lens menu actions SHALL apply
only to sections whose `LensSource` has `source: 'rss'`. Queue sections (gitlab /
github / jira) are unaffected. When a lens has NO feed sections, the "Mark all read"
and "Show recently read" menu items SHALL be absent from the lens menu.

#### Scenario: Mark all read on a mixed lens marks only feed sections

- **GIVEN** a lens with a gitlab section (4 items) and an rss section (6 unread)
- **WHEN** the user selects "Mark all read"
- **THEN** the rss section's items are all marked read (badge drops to 0 for that section)
- **AND** the gitlab section is unaffected

### Requirement: Multi-source lens sections are individually collapsible

On a lens with ≥ 2 **resolved sections**, each section SHALL be individually collapsible
from its section header, independent of the other sections and of the lens-level expand/collapse.
This applies to **multi-section lenses only**; a lens with a single resolved section has no
section header and therefore no per-section collapse.

A section's collapsed state SHALL be stored as **sidebar-local, per-window, ephemeral** state on
`SidebarLocalState`:
`collapsedLensSectionsByWindow?: { [windowId: WindowId]: { [folderId: FolderId]: { [sourceKey: string]: boolean } } }`,
where `sourceKey` is the section's resolved identity (`${source}:${host}:${query}` for a queue
section, `${source}:${host}` for an rss feed). The state SHALL NEVER be persisted to storage and
SHALL NEVER be broadcast (it is augmented onto the store like `expandedFoldersByWindow`). The
mutator `setLensSectionCollapsed(windowId, folderId, sourceKey, collapsed): void` SHALL write it.
An **absent** entry means **expanded**: a section defaults to expanded, and after an SW restart or
sidebar reopen all sections render expanded.

Collapse state SHALL be **per-window**: the same lens's section MAY be collapsed in one window
and expanded in another, with no cross-window write.

When a section is collapsed, the lens SHALL render the section header (with its attention count)
and SHALL NOT render that section's body (result rows, ghost rows, sign-in/needs-access rows,
empty/error notes, feed reading-controls). The chevron SHALL reflect the collapsed state
(`aria-expanded={!collapsed}`). Collapsing a section SHALL NOT affect the lens-level badge,
polling, runtime, bindings, or any other section.

The disclosure SHALL respect `prefers-reduced-motion: reduce`: the chevron rotation and the
section-body entrance animation SHALL be disabled under reduced motion.

#### Scenario: Collapsing a section hides its body and keeps its header

- **GIVEN** a two-section lens `[gitlab:gitlab.com:authored (ok, 5 items), gitlab:gitlab.com:review-requested (ok, 3 items)]`, both expanded, in window 100
- **WHEN** the user activates the authored section header
- **THEN** `setLensSectionCollapsed(100, folderId, 'gitlab:gitlab.com:authored', true)` is written
- **AND** the authored section header (with its count) still renders while its 5 result rows are hidden
- **AND** the review-requested section continues to render its header and 3 rows

#### Scenario: Collapse is per-window

- **GIVEN** a lens open in window 100 and window 200, with its authored section collapsed in window 100
- **WHEN** window 200 renders the same lens
- **THEN** the authored section is expanded in window 200 (no cross-window collapse)

#### Scenario: Sections default to expanded after a restart

- **GIVEN** a section was collapsed in window 100 before the SW restarted
- **WHEN** the sidebar re-renders the lens after restart
- **THEN** the section renders expanded (the ephemeral collapse state was not persisted)

#### Scenario: A collapsed busy section still contributes to the lens badge

- **GIVEN** a two-section lens whose collapsed gitlab authored section holds 4 items and whose expanded feed section holds 2 unread
- **WHEN** the lens renders
- **THEN** the lens badge reads `6` (collapse does not change the badge)

#### Scenario: Single-section lenses have no per-section collapse

- **GIVEN** a lens with exactly one resolved section
- **WHEN** the lens is expanded
- **THEN** no section header and no collapse control render, and no `collapsedLensSectionsByWindow` entry is created for it

### Requirement: `LensSource` is the per-instance connector unit

`LensSource` (`{ source: LensProvider; baseUrl: string; queries: LensQuery[] }`) SHALL be
exported from `apps/extension/src/shared/types.ts` as the per-**instance** entry type for
`sources[]` on a lens `PinNode`. The per-**section** unit SHALL be `ResolvedLensSource`
(`{ source: LensProvider; baseUrl: string; query?: LensQuery }`), produced by expanding a
`LensSource` over its `queries[]`. `ResolvedLensSource` is the parameter type for
`SourceConnector.fetchRuntime`, `SourceConnector.requiredOrigins`, `SourceConnector.listingUrl`,
and `requiredOriginsForConfig` in `shared/connector-origins.ts`.

#### Scenario: LensSource round-trips through the schema

- **WHEN** a `LensSource` `{ source: 'rss', baseUrl: 'https://feeds.example.com/rss', queries: [] }` is persisted and loaded
- **THEN** it SHALL parse cleanly under `LensSourceSchema` with an empty `queries`

#### Scenario: A queue LensSource expands to one ResolvedLensSource per filter

- **WHEN** `resolvedConfigs` expands `{ source: 'gitlab', baseUrl: 'https://gitlab.com', queries: ['authored', 'assigned'] }`
- **THEN** it yields two `ResolvedLensSource`s `{ source: 'gitlab', baseUrl: 'https://gitlab.com', query: 'authored' }` and `{ …, query: 'assigned' }`

### Requirement: A lens source may carry a display name

A `LensSource` MAY carry an OPTIONAL `name: string`, which SHALL be
**display-only**: it SHALL NOT participate in the section identity key
(`sourceKey` stays `source:host[:query]`), the duplicate-`source:host` merge, the
connector fetch, or `lensItemBindings`. It is persisted as part of the source config (see the
`storage-and-migrations` capability — `LensSource` schema + the v10
additive migration).

When a source carries a non-empty `name`, that name SHALL **label its resolved
section(s)** in the sidebar in place of the host: a feed (`rss`) section reads
`name`, and a queue section reads `name · filter` (the filter axis is preserved).
When `name` is absent or blank, the section label is unchanged (`host`, or
`host · filter`) — overriding the default host label specified in "Requirement:
Lens rendering and the one-glyph restraint".

The `LensEditor` SHALL expose a per-source **Name** field (optional;
placeholder shows the host) in each source card's body, and the card's header
identity SHALL prefer the `name` when set. Confirming SHALL carry the trimmed
`name`, omitting it entirely when blank (an unnamed source persists as
`{ source, baseUrl, queries }` with no `name` key). The `createLens` /
`updateLens` command source schema SHALL accept the optional `name`.

#### Scenario: A named source labels its section

- **GIVEN** a feed source `{ source: 'rss', baseUrl: 'https://www.theguardian.com/world/rss', name: 'World news' }`
- **WHEN** the lens renders its section header
- **THEN** the header reads `World news` (not `www.theguardian.com`)

#### Scenario: A named queue source keeps the filter axis

- **GIVEN** a queue source `{ source: 'gitlab', baseUrl: 'https://gitlab.com', queries: ['authored', 'review-requested'], name: 'Work' }`
- **WHEN** the lens renders
- **THEN** its two section headers read `Work · authored` and `Work · reviewing`

#### Scenario: An unnamed source is unchanged

- **GIVEN** a source with no `name` (or a blank one)
- **THEN** its section label is the host (`host`, or `host · filter`) exactly as before, and confirming the editor persists no `name` key

#### Scenario: The editor exposes a per-source Name field

- **WHEN** a source card is expanded in the editor
- **THEN** it shows an optional Name field (placeholder = the host) whose value persists as the source's `name` on Create/Save

### Requirement: A lens has a full-page view

A lens SHALL have a dedicated full-page surface that is a **second read-only projection** of the `lenses` runtime slice (the first being the sidebar). The page SHALL live at `apps/extension/src/launcher/lenspage/` (`index.html`, `main.ts`, `LensPage.svelte`, `lenspage.css`) and SHALL be registered as a build entrypoint via `build.rollupOptions.input` (keyed `lenspage`) in `apps/extension/vite.config.ts`, so it is reachable at `chrome-extension://<id>/src/launcher/lenspage/index.html`.

The page SHALL be registered **without** using `chrome_url_overrides` (that slot is the new-tab page and is left unchanged) and SHALL NOT be added to `web_accessible_resources` (the extension opens its own page directly; WAR would needlessly expose a state-mirroring page to all web origins). The target lens SHALL be carried as the `folderId` query parameter on the page URL. The page SHALL resolve **its own** `windowId` at boot via `getCurrentWindowId()` (as `newtab` does) rather than reading it from the URL, so a page tab dragged to another window mirrors the correct window's state.

`LensPage.svelte` SHALL mirror SW state read-only exactly as `NewTab.svelte` does: an `initialState` snapshot requested with backoff at boot, then `liveState` from `onStateBroadcast`, and the active Space's `tint` applied to `data-tint`. The page SHALL NEVER write to or mutate `AppState`; all actions go through the existing message bus.

#### Scenario: The page loads for a lens at its extension URL

- **WHEN** a tab navigates to `chrome-extension://<id>/src/launcher/lenspage/index.html?folderId=f1`
- **THEN** `LensPage.svelte` mounts, resolves its own `windowId` via `getCurrentWindowId()`, requests a state snapshot, and renders lens `f1` from `appState.lenses['f1']`

#### Scenario: The page tracks live broadcasts read-only

- **GIVEN** an open lens page mirroring lens `f1`
- **WHEN** a `state-broadcast` updates `f1`'s sections
- **THEN** the page re-renders from the new state and never writes back to `AppState`

### Requirement: Opening the lens page reuses a per-window tab

A new command `openLensPage { spaceId, folderId, windowId }` SHALL open or focus the lens's page tab **per window**, handled beside `openLensItem` in `background/handlers/lenses.ts`. The handler SHALL:
- compute the page URL `chrome.runtime.getURL('src/launcher/lenspage/index.html') + '?folderId=' + folderId`;
- **dedupe by query**: query the window's tabs and, when one already shows the lens-page path with a matching `folderId` query param, focus it via `chrome.tabs.update(tabId, { active: true })` (NO new tab);
- otherwise create the tab via `chrome.tabs.create({ url, windowId })` and add it to the Space's Chrome group (the same grouping `openLensItem` performs).

There SHALL be **no persisted binding** for the page tab and **no schema migration** — the open tab is its own registry, so reuse self-heals across SW restarts. The command SHALL NOT dispatch `openUrl` (whose scheme hardening drops the `chrome-extension://` URL by design and is unchanged).

#### Scenario: Reopening focuses the existing page tab

- **GIVEN** lens `f1`'s page is already open in window 100
- **WHEN** `openLensPage { folderId: 'f1', windowId: 100 }` is dispatched
- **THEN** the existing page tab is focused via `chrome.tabs.update` and no second tab is created

#### Scenario: First open creates a grouped page tab

- **GIVEN** lens `f1` has no page tab in window 100
- **WHEN** `openLensPage { folderId: 'f1', windowId: 100 }` is dispatched
- **THEN** a tab is created at the lens-page URL with `?folderId=f1` and joins the active Space's Chrome group

#### Scenario: Reuse survives a service-worker restart

- **GIVEN** lens `f1`'s page tab is open in window 100 and the SW restarts (no persisted binding exists)
- **WHEN** `openLensPage { folderId: 'f1', windowId: 100 }` is dispatched after boot
- **THEN** the tab query finds the still-open page tab and focuses it rather than creating a duplicate

### Requirement: The lens page is a managed view, not a Temporary tab

The lens-page tab SHALL be treated like the new-tab **home** page, not a browsing tab: it is grouped with its Space but **never adopted into the Space's Temporary list** (the user summons it from the lens; it is not a tab to accumulate). The `tabs.onCreated` and `tabs.onUpdated` handlers SHALL recognize the lens-page URL via `isLensPageUrl` (`shared/new-tab.ts`, mirroring `isNewTabUrl`) and skip Temporary adoption for it, exactly as they do for a home tab. Because `openLensPage` already groups the tab into the lens's Space, `tabs.onCreated` SHALL NOT regroup it into the (possibly different) active Space.

The page SHALL set the **browser tab title** to the lens's name (e.g. `Feeds · Lunma`) via `<svelte:head>`, so the tab strip reads the lens name rather than a static fallback.

#### Scenario: A lens-page tab is not listed as Temporary

- **WHEN** a lens-page tab is created (`tabs.onCreated` with the lens-page URL)
- **THEN** it is NOT added to the active Space's `tempTabIds`
- **AND** a later `tabs.onUpdated` for that tab does not adopt it into Temporary either

#### Scenario: The tab title is the lens name

- **GIVEN** the page resolves lens `f1` named "Feeds"
- **WHEN** it renders
- **THEN** the document title is `Feeds · Lunma`

### Requirement: Lens page entry points

The page SHALL be reachable from the sidebar in two ways, both dispatching `openLensPage`:

1. **Header menu** — the lens's kebab menu SHALL carry an `"Open as page"` item (`id: 'open-page'`, icon `external-link`), beside `"Open all in a tab"`.
2. **Header "open as page" icon** — the lens header SHALL present a hover/focus-revealed icon button (composed from the `IconButton` primitive, icon `maximize-2`, with an accessible label) that opens the page. `FolderRow` SHALL accept an **optional** `onOpenPage` callback (+ `openPageLabel`): when present (lenses) the icon renders in the trailing cluster; when absent (every regular folder) no icon renders.

The lens header's **row body and disclosure chevron keep their normal expand/collapse behavior** — activating the row (or the chevron) toggles the lens open/closed exactly like any lens; only the "open as page" icon and the kebab item open the page. (An earlier draft split the header so the body opened the page; that was reverted as too surprising — body-click on a lens should expand it.)

A launcher result that opens the page is **out of scope** for this change; it is the deferred follow-up `lens-page-launcher`, which will dispatch the `openLensPage` command this change introduces.

#### Scenario: The kebab menu opens the page

- **WHEN** the user selects `"Open as page"` from a lens's kebab menu in window 100
- **THEN** `openLensPage { spaceId, folderId, windowId: 100 }` is dispatched

#### Scenario: The header icon opens the page; the body toggles expand

- **GIVEN** a lens in the sidebar
- **WHEN** the user activates the row body (or its chevron)
- **THEN** the lens's sidebar expand/collapse toggles and no page opens
- **AND WHEN** the user activates the header's "open as page" icon
- **THEN** `openLensPage` is dispatched and the sidebar expand state is unchanged

#### Scenario: Regular lenses show no open-as-page icon

- **GIVEN** a regular (non-lens) folder whose `FolderRow` receives no `onOpenPage`
- **WHEN** its header renders
- **THEN** no open-as-page icon is present and the whole header toggles expand/collapse exactly as before

### Requirement: The page renders all resolved sections

When mirroring a lens, the page SHALL render **every** resolved section of that lens (one per source × filter, plus each rss feed) in `node.sources` order and, within each entry, `queries` order — the same order the sidebar uses. Each section SHALL render as a frosted-glass panel (`Surface variant="glass"`) carrying a section header (source icon + the section label + the section's attention count) above a responsive grid of item cards.

Section labels SHALL reuse the existing derivation: a named source's `name` (`name`, or `name · filter`) else `host` (or `host · filter`) for a queue section, and `name` else `host` for an rss section. The page SHALL reuse the existing per-kind row semantics — queue sections show at most one status dot per item; feed sections show unread marks — and the existing calm per-section states: `pending` → static ghost cards; `error` → last-known cards plus a dim "Couldn't reach ⟨host⟩" note; `signed-out` → the per-source sign-in / "Add a token in Settings → Connectors" affordance; `needs-access` → the muted "Lunma needs access to ⟨host⟩" grant prompt invoking `requestHostPermissions`. The page SHALL show the lens-level attention sum in its page header. No non-`ok` state SHALL render as a red error card.

#### Scenario: A multi-section lens lays out every section

- **GIVEN** lens `f1` with a gitlab instance carrying `['authored', 'review-requested']` and one rss feed, all `ok`
- **WHEN** the page renders
- **THEN** it shows three glass section panels — `authored`, `reviewing`, and the feed — each with its header, attention count, and item cards, in sources/queries order

#### Scenario: Per-section calm states render on the page

- **GIVEN** lens `f1` with one section `signed-out` (github) and one section `ok` (gitlab)
- **WHEN** the page renders
- **THEN** the github panel shows the "Add a token in Settings → Connectors" affordance and the gitlab panel shows its item cards — neither as a red error card

### Requirement: The page item is a card with optional content slots

The page's result unit SHALL be a card feature component (`LensPageItem`, local to `lenspage/`) whose layout reserves regions for richer content (a hero image, an excerpt, and a date/meta footer) and renders each region **only when the item carries that field**. A card SHALL always show the item `title` and favicon (recessed at rest, full on hover/active) and at most one `status` dot. The card SHALL show the **full title** — wrapping to as many lines as needed, **never truncated** (no ellipsis); the favicon and status dot top-align with the title's first line. An absent optional region collapses to zero height, so an item with no optional fields (e.g. a queue item) reads as a clean, compact card, never a skeleton with blank boxes.

This requirement is **descriptive, not prohibitive**: it describes what the card renders given the optional fields present on `LensItem` and SHALL NOT forbid connectors from carrying additional optional item fields in a future change. In this change the **RSS connector** populates `excerpt`, `imageUrl`, and `publishedAt` (see "The RSS connector fetches and parses public feeds"); queue connectors leave them absent. A future change MAY fill the same slots for queue items (e.g. diff stat, CI detail) additively, with no rewrite of this surface and no schema migration (results are ephemeral). `LensPageItem` is a feature component composing existing `ui/` primitives (`Icon`, `Favicon`, `Surface`); it SHALL NOT re-roll primitives or hard-code design values.

Every **feed** card SHALL lead with a hero of one fixed aspect ratio so titles align across the magazine grid row: a real hero image when the entry carries an `imageUrl` (loaded with `loading="lazy"` and `referrerpolicy="no-referrer"` — no referrer leaked to the publisher; the residual IP-on-load cost is accepted, see design D8), otherwise a **generated cover** — the title's first letter/character set in the display serif over a soft Space-hue wash, at the same ratio. Below the hero: title, excerpt (clamped), then a footer carrying the relative publication date. **Queue** cards have no hero and render compact. Feed sections SHALL render their cards as a full-width responsive magazine grid; queue sections render compact cards.

#### Scenario: A queue card renders compact, full-title, no empty regions

- **GIVEN** a `LensItem` `{ id, title, url, status }` with no optional content fields
- **WHEN** `LensPageItem` renders it
- **THEN** it shows the full (wrapping, untruncated) title, a recessed favicon, and the single status dot, with no empty content regions

#### Scenario: A feed card renders a magazine card with hero, excerpt, and date

- **GIVEN** a feed `LensItem` carrying `excerpt`, `imageUrl`, and `publishedAt`
- **WHEN** `LensPageItem` renders it
- **THEN** the hero image renders (with `loading="lazy"` and `referrerpolicy="no-referrer"`), the full title, the clamped excerpt, and a relative date label — and the feed section uses the magazine grid

#### Scenario: A cover-less feed card renders a generated cover

- **GIVEN** a feed `LensItem` with no `imageUrl`
- **WHEN** `LensPageItem` renders it
- **THEN** it renders a generated cover (the title's initial in the display serif over a Space-hue wash) at the same ratio as a real hero, so its title aligns with image cards in the same row
- **AND** a queue item renders no hero at all

#### Scenario: The title is never truncated

- **WHEN** a card renders an item whose title is long enough to exceed one line
- **THEN** the title wraps to multiple lines and is shown in full (no ellipsis)

### Requirement: Page result activation reuses existing open semantics

Activating a result card on the page SHALL dispatch `openLensItem` (the same command the sidebar uses), so a tab is bound/focused per window and feed read-state (consume-on-move-on, auto-advance, mark-read) behaves identically to opening from the sidebar. The page SHALL derive each item's namespaced id (`${sourceKey}:${nativeId}`) using the existing `sourceKey` derivation. The page SHALL NOT introduce a separate activation path or mutate bindings directly.

#### Scenario: Opening a queue item from the page binds a tab

- **GIVEN** the page for lens `f1` with an authored gitlab item native id `42`
- **WHEN** the user activates that card in window 100
- **THEN** `openLensItem { folderId: 'f1', itemId: 'gitlab:gitlab.com:authored:42', windowId: 100, spaceId }` is dispatched and the existing bind/focus behavior applies

#### Scenario: Opening a feed item from the page drains it like the sidebar

- **GIVEN** the page for a feed lens with an unread item
- **WHEN** the user activates its card and later moves on from the bound tab
- **THEN** the item is consumed exactly as it would be from the sidebar (read-state and auto-advance unchanged), and the page re-renders from the broadcast

### Requirement: Lens items may carry optional rich-content fields

`LensItem` SHALL carry three OPTIONAL display-only fields in addition to `id`/`title`/`url`/`status`: `excerpt?: string` (a plain-text summary), `imageUrl?: string` (a thumbnail/hero image URL), and `publishedAt?: number` (publication time as epoch ms). They SHALL be present on both the TypeScript interface (`shared/types.ts`) and the ephemeral `LensItemSchema` Zod mirror (`shared/schemas.ts`). They ride the **broadcast-only, never-persisted** `lenses` runtime slice, so they introduce **no schema migration** and the persisted envelope is unchanged. Each field SHALL be **omitted entirely** when absent (an item with none is byte-identical to the prior shape). The sidebar projection SHALL ignore these fields; only the full-page projection renders them.

#### Scenario: Optional fields are omitted when absent

- **WHEN** a connector emits an item with no description, image, or date
- **THEN** the `LensItem` has no `excerpt`, `imageUrl`, or `publishedAt` keys, and it round-trips through `LensItemSchema`

#### Scenario: The fields never reach disk

- **WHEN** an `ok` runtime carrying items with `excerpt`/`imageUrl`/`publishedAt` is persisted
- **THEN** the persisted envelope carries no `lenses` slice (it is stripped before persist), so no migration is needed for the new fields

### Requirement: The lens page offers per-feed reading controls

The page SHALL provide reading controls for each **feed** section (queue sections have none):

- **Just-read items linger; prior reads drain.** Marking an item read SHALL NOT hide it immediately. An item read **while the page is open** (the "lingering" set) SHALL stay in place, rendered with the read treatment (dimmed), with its undo control — so the read action is reversible and never yanks content out from under the reader. An item read **before this page session** ("drained") SHALL be hidden at rest. The open→read transition is detected by diffing the broadcast read set; the lingering set is **page-local + ephemeral** (resets on reload — which is the drain boundary). The next reopen makes this session's reads drained.
- **Clear read.** When a section has lingering reads, the page SHALL show a **"Clear read"** control that drains that section's lingering items now (otherwise they drain on the next reopen).
- **Show / hide read.** When a section holds **drained** reads, the page SHALL show a **"Show N read"** control that reveals them in place; activating it again **"Hide read"** re-drains them. N is the count of drained reads in the section buffer.
- **Layout animation.** As entries are added or removed (Clear read, a refresh bringing new items, Show more), the surviving cards SHALL animate to their new positions (a FLIP reposition) so the grid re-settles smoothly rather than jumping. Cards SHALL NOT use an out-`transition`: a leave transition would keep a destroyed card's DOM (and its `Favicon`, which holds `$derived`) alive through the outro, and reading that derived post-teardown trips Svelte's `derived_inert` warning. The motion SHALL collapse to instant under `prefers-reduced-motion`.
- **Show more.** The page's feed display window SHALL default to a page-appropriate count that is **independent of the lens's `maxItems`** (the sidebar budget), so the magazine grid fills out rather than inheriting the cramped sidebar cap. When more items remain in the buffer beyond the current window, a **"Show more"** control SHALL extend it by the same page increment. Queue sections are not paged (the connector already capped them).
- **Toggle read/unread per item.** Each feed card SHALL expose a hover/focus-revealed control that marks the item **read** (when unread) or **unread** (when read), dispatching `markLensItemRead` / `markLensItemUnread` `{ folderId, itemId }`. The control is a sibling of the card's activation button (never nested). `markLensItemUnread` is a new command added by this change; it removes the id from the lens's `lensReadState` set (lens-keyed; no refetch), mirroring `markLensItemRead`.

#### Scenario: Prior reads are drained; revealing shows them

- **GIVEN** a feed section with two unread and one item read before this session
- **WHEN** the page renders the section
- **THEN** only the two unread cards render and a "Show 1 read" control is present
- **AND WHEN** the user activates it
- **THEN** all three cards render and the control reads "Hide read"

#### Scenario: An item read while the page is open lingers, then Clear read drains it

- **GIVEN** an unread feed item shown on the open page
- **WHEN** it becomes read (a broadcast marks it read) while the page stays open
- **THEN** its card stays visible with the read treatment (it does not vanish) and a "Clear read" control appears
- **AND WHEN** the user activates "Clear read"
- **THEN** the lingering card drains (animating out) and only the still-unread cards remain

#### Scenario: The page window exceeds the sidebar budget and pages with Show more

- **GIVEN** a feed lens with `maxItems: 10` whose buffer holds 30 unread items
- **WHEN** the page renders the section
- **THEN** it renders the page default window (more than 10) and a "Show more" control
- **AND WHEN** the user activates "Show more"
- **THEN** the section renders more items (up to the buffer)

#### Scenario: A per-item toggle marks read, then unread

- **GIVEN** a feed card for an unread item
- **WHEN** the user activates its read toggle
- **THEN** `markLensItemRead { folderId, itemId }` is dispatched
- **AND WHEN** the user activates the toggle on a read item
- **THEN** `markLensItemUnread { folderId, itemId }` is dispatched and the id leaves the read set

### Requirement: Feed auto-advance is suppressed for items opened from the page

The feed reading queue's **auto-advance** (closing the tab of an unread feed item opens the next unread item in the same section) is a sidebar reading-flow affordance: it keeps the reader moving when the sidebar is their only reading surface. An item opened **from the lens page** SHALL NOT auto-advance on close — closing it SHALL return to the page (Chrome's natural focus). An item opened from the **sidebar** SHALL auto-advance exactly as before, **regardless of whether the lens page also happens to be open**.

The discriminator SHALL be the item's **open origin**, not whether the page is open: `openLensItem` carries an optional `fromPage` flag (set by the page, absent for sidebar opens); when set, the SW records the bound tab id in an SW-session set (`background/page-opened-tabs.ts`, in-memory, not persisted). `tabs.onRemoved` SHALL suppress auto-advance when the closing tab is in that set, and SHALL forget the tab id on close. (The service worker cannot observe sidebar visibility or lens-expanded state — both are sidebar-local, never broadcast — so origin tracking, not an "is the page open" proxy, is the correct signal.) All other auto-advance rules (consume=close never advances; only an unread manual close advances) are unchanged.

#### Scenario: A sidebar-opened item auto-advances on close

- **GIVEN** a feed section with unread items, the reading tab opened from the sidebar (no `fromPage`)
- **WHEN** the user closes that unread tab
- **THEN** the next unread item in the section opens (auto-advance) — even if the lens page is also open

#### Scenario: A page-opened item does not auto-advance on close

- **GIVEN** a feed item whose tab was opened from the page (`openLensItem { fromPage: true }`)
- **WHEN** the user closes that tab
- **THEN** no next item opens — focus returns toward the page

