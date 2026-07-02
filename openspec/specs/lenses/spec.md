# lenses Specification

## Purpose
TBD - created by archiving change establish-lens-model. Update Purpose after archive.
## Requirements
### Requirement: Lens configuration persists as a pinned-tree node

A lens SHALL persist as a `PinNode` kind in `pinnedBySpace`:
`{ kind: 'lens'; id: FolderId; name: string; icon: string; lensKind: LensKind; sources: LensSourceRef[]; maxItems: number; hideRead: boolean; refreshMinutes: number }`,
where `LensSourceRef` is `{ sourceId: SourceId; queries: LensQuery[] }`. Each
`LensSourceRef` **references a connected Account** (`AppState.sources[sourceId]` —
see the `connector-accounts` capability) rather than embedding the provider/host;
its `queries` array is the set of canned filters that reference contributes. The
`sources` array SHALL contain at least one entry; the editor SHALL prevent confirming
with an empty list. The provider and `baseUrl` are read from the referenced account at
resolve time; the lens node SHALL NOT carry `provider`/`baseUrl`/`name` on its source
entries (those live on the account).

`LensProvider` (`'gitlab' | 'github' | 'bitbucket' | 'jira' | 'rss'`) and `LensQuery`
(`'authored' | 'assigned' | 'review-requested'`) are the providers and canned queries.
A **queue** account (gitlab/github/bitbucket/jira) reference SHALL carry a **non-empty**
`queries` array; a **feed** account (rss) reference SHALL carry `queries: []`. The SW
SHALL throw on create/update when any `sourceId` does not resolve to an existing
account, when a queue reference's `queries` is empty, when an rss reference's `queries`
is non-empty, or when a **Cloud bitbucket** reference (provider `bitbucket`, account
host `bitbucket.org`) carries `review-requested` (unsupported on Cloud — see Requirement:
The Bitbucket connector fetches canned queries over the Server and Cloud APIs).

The node persists **configuration only** — it SHALL NOT carry a `children` field;
results are ephemeral runtime state. The node orders among pins exactly like a
`folder` node and round-trips `reorderPinned` losslessly.

`icon` is minted by the SW on create from the **first** referenced account's provider
`mintedIcon` when all referenced accounts share the same provider, otherwise the
compound `'layers'`. `refreshMinutes`, `hideRead`, and `maxItems` are unchanged.

#### Scenario: A lens survives restart as config only

- **WHEN** the SW boots with a persisted lens node
- **THEN** the node is restored with its `sources` (each a `{ sourceId, queries }` reference), `lensKind`, `maxItems`, `hideRead`, and `refreshMinutes` intact, and no result items are read from storage

#### Scenario: A lens references one account with two filters

- **WHEN** `createLens` is dispatched with `sources: [{ sourceId: 'acc-1', queries: ['authored', 'review-requested'] }]` and the SW restarts
- **THEN** the node is restored referencing `acc-1` with both filters and validates under the current-version schema

#### Scenario: A reference to a missing account is rejected on create

- **WHEN** `createLens` is dispatched with a `sourceId` absent from `AppState.sources`
- **THEN** the SW SHALL throw and no node SHALL be persisted

#### Scenario: An empty sources array is rejected

- **WHEN** `createLens` is dispatched with `sources: []`
- **THEN** the SW SHALL throw and the ack SHALL carry the error

#### Scenario: A Cloud bitbucket reference rejects review-requested

- **WHEN** `createLens` references a Cloud bitbucket account (host `bitbucket.org`) with `queries: ['review-requested']`
- **THEN** the SW SHALL throw and no node SHALL be persisted
- **AND** the same account with `queries: ['authored']` SHALL be accepted

### Requirement: A lens carries a kind

A lens `PinNode` SHALL carry a `lensKind: LensKind` field, where `LensKind` is the closed union `'general' | 'review'` (widened by later typed-kind changes). `lensKind` is **derived by the SW from the lens's source set**, never chosen in the editor: a lens with **any** `github`, `gitlab`, or `bitbucket` source resolves to `'review'` (enabling Change enrichment on those sections); a lens with **no** git source resolves to `'general'`. A lens MAY freely **mix** providers — git accounts, `jira` accounts, and `rss` feeds in one lens — so a derived-`'review'` lens may also carry feeds (which render as Articles) and jira sources (which render Generic); the git-only restriction on review lenses is removed. The derived `lensKind` gates only the per-section Change enrichment (`github`/`gitlab`/`bitbucket` sections of a `'review'` lens carry the `change` bag; all other sections never do). The editor SHALL NOT present a kind picker. The SW SHALL derive and persist `lensKind` on create/update from the sources, **and once for every existing lens node on boot** (re-deriving from its current sources and persisting any change) so a pre-existing `'general'` lens that holds a git source becomes `'review'` — and renders enriched Changes — without requiring an edit. A lens migrated from a pre-rename `smart` node SHALL default `lensKind: 'general'` before this boot re-derivation runs.

#### Scenario: A feed-only lens derives general

- **WHEN** the SW boots with a lens whose sources are only `rss` feeds
- **THEN** its `lensKind` is `'general'` and it renders only an Articles section

#### Scenario: The SW derives the kind from the source set on create

- **WHEN** the user creates a lens whose sources include a `github` account
- **THEN** the SW stamps `lensKind: 'review'` on the node (no kind was supplied by the editor)
- **AND WHEN** the user creates a lens whose sources are only `rss` feeds, the SW stamps `lensKind: 'general'`

#### Scenario: A bitbucket source derives review

- **WHEN** the user creates a lens whose sources include a `bitbucket` account
- **THEN** the SW stamps `lensKind: 'review'` and the bitbucket section carries the `change` bag

#### Scenario: A pre-existing general+git lens is re-derived to review on boot

- **GIVEN** a persisted lens with `lensKind: 'general'` that holds a `github` source (buildable before this change)
- **WHEN** the SW boots and runs the one-time `lensKind` re-derivation
- **THEN** the node is persisted with `lensKind: 'review'`, and its overview renders an enriched Changes section (CI light, reviewer rail, diffstat) without any edit

#### Scenario: A mixed lens carries both git and feed sources

- **GIVEN** a lens whose sources include a `github` account and two `rss` feeds
- **THEN** its derived `lensKind` is `'review'`, its github section carries the `change` bag, and its rss sections carry none and render as Articles

#### Scenario: The kind union holds general and review

- **WHEN** the `LensKind` union is inspected
- **THEN** its members are exactly `'general'` and `'review'` (further typed kinds arrive in later changes)

### Requirement: Lens results are ephemeral runtime state

Query results SHALL live in a broadcast-only `AppState` slice
`lenses: { [folderId]: LensRuntime }` where `LensRuntime` is
`{ sections: { [sourceKey: string]: LensSectionRuntime } }` and `LensSectionRuntime` is
`{ state: 'pending' | 'ok' | 'signed-out' | 'error' | 'needs-access'; items: LensItem[]; fetchedAt: number | null }`.
`sourceKey` is the **per-account, per-filter** section identity: `${sourceId}:${query}`
for a queue section, and `${sourceId}` for an rss section (no query), where `sourceId`
is the referenced account's id. It is derived from a **resolved single-query config**
produced by expanding a `LensSource` over its `queries[]`, and is the stable identity
key for that section within the lens. Keying by `sourceId` (rather than `source`/`host`)
ensures two accounts on the same host occupy distinct sections.

The slice SHALL never be persisted and SHALL be written only by the coordinator drain: a connector
fetch completes and enqueues the internal event
`{ source: 'connector'; kind: 'lenses.result'; payload: { folderId, sourceKey, runtime: LensSectionRuntime } }`
whose handler calls `store.setLensSectionRuntime(folderId, sourceKey, runtime)`, producing one
broadcast per drain (unchanged broadcast contract). A refresh that begins while items exist SHALL
mark each section's runtime `pending` **without clearing `items`** (no blink). After a SW restart
the slice is empty, so each section renders pending until its first fetch.

#### Scenario: Results arrive through the single-writer drain per section

- **WHEN** a connector fetch completes for lens `f1`, account `acc-1`, source key `acc-1:authored`
- **THEN** the connector enqueues a `lenses.result` event carrying `{ folderId: 'f1', sourceKey: 'acc-1:authored', runtime }` and the coordinator handler writes it via `setLensSectionRuntime`
- **AND** exactly one `state-broadcast` carries the updated section

#### Scenario: Two filters of one instance occupy distinct sections

- **GIVEN** a lens with one instance referencing account `acc-1` `{ source: 'gitlab', baseUrl: 'https://gitlab.com', queries: ['authored', 'review-requested'] }`
- **WHEN** both sections fetch
- **THEN** the runtime holds two sections keyed `acc-1:authored` and `acc-1:review-requested`, neither overwriting the other

#### Scenario: Two same-host accounts occupy distinct sections

- **GIVEN** a lens referencing two `github.com` accounts `acc-work` and `acc-personal`, each carrying `['authored']`
- **WHEN** both sections fetch
- **THEN** the runtime holds two sections keyed `acc-work:authored` and `acc-personal:authored`, neither overwriting the other

#### Scenario: A refresh keeps last-known items visible per section

- **GIVEN** lens `f1`'s section `acc-1:authored` runtime is `ok` with 5 items
- **WHEN** a refresh begins for that lens
- **THEN** the section state becomes `pending` while `items` still holds the 5 items

#### Scenario: A SW restart costs one pending beat per section

- **WHEN** the SW restarts and the sidebar renders a multi-filter lens before its first fetches complete
- **THEN** each section renders the pending state (no stale items from disk)

### Requirement: Each connector declares the origins it fetches

The `SourceConnector` contract (`background/connectors/connector.ts`) SHALL include
`requiredOrigins(cfg: ResolvedLensSource): string[]`, accepting a resolved single-query config,
returning the host match patterns the connector actually fetches for that config. The derivation is
query-independent: `github` on `github.com` returns `['https://api.github.com/*']`;
`bitbucket` on `bitbucket.org` returns `['https://api.bitbucket.org/*']` (the Cloud API
host, distinct from `bitbucket.org`); `gitlab`, `jira`, `rss`, and a self-hosted
`bitbucket` (Server / Data Center, any host other than `bitbucket.org`) return the
`baseUrl` origin.

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

#### Scenario: Bitbucket Cloud declares the api origin it fetches

- **WHEN** `requiredOrigins` is called for a `bitbucket` resolved config on `https://bitbucket.org`
- **THEN** it SHALL return `['https://api.bitbucket.org/*']`, not `['https://bitbucket.org/*']`

#### Scenario: Bitbucket Server declares its baseUrl origin

- **WHEN** `requiredOrigins` is called for a `bitbucket` resolved config on `https://bitbucket.example.com`
- **THEN** it SHALL return `['https://bitbucket.example.com/*']` (Server / Data Center fetches same-origin)

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

- **GIVEN** a lens with sections `[acc-gl:authored, acc-gh:authored]` where `https://api.github.com/*` (account `acc-gh`) is not granted but `https://gitlab.com/*` (account `acc-gl`) is
- **WHEN** a poll is due
- **THEN** the `acc-gh:authored` section resolves to `needs-access` without a network request
- **AND** the `acc-gl:authored` section proceeds to fetch normally

#### Scenario: Granting an instance's origin refetches all its filter sections

- **GIVEN** a lens with a gitlab instance `acc-gl` carrying `['authored', 'review-requested']` (both sections `needs-access`) and a granted github section
- **WHEN** the user grants `https://gitlab.com/*`
- **THEN** both gitlab filter sections (`acc-gl:authored`, `acc-gl:review-requested`) refetch (they share the instance origin) and the github section is unaffected

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

### Requirement: The needs-access state renders a calm grant prompt

A resolved section in `needs-access` SHALL render a single muted "Lunma needs access to ⟨host⟩" row
with a "Grant access" control (composed from `Button`/`Icon` primitives) **inside that section**,
below the section header (when visible). Other sections in the same lens SHALL render normally.
Activating the grant row SHALL call `requestHostPermissions(requiredOriginsForConfig(cfg))` for that
section's `ResolvedLensSource`. The visual treatment (muted, key icon, non-`error` styling) is
unchanged.

#### Scenario: A lens with one granted and one needs-access section renders both

- **GIVEN** a lens with sections `acc-gl:authored` (ok, 5 items) and `acc-gh:authored` (needs-access)
- **WHEN** the lens is expanded
- **THEN** the `acc-gl:authored` section renders its 5 items normally
- **AND** the `acc-gh:authored` section renders one muted "Lunma needs access to api.github.com" row with a "Grant access" control

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

For a **GitLab** account, the connector SHALL authenticate per request: (1) when a
per-source token exists for the resolved config's `sourceId` in the `lunma.connectors`
record, send `Authorization: Bearer <token>` with `credentials: 'omit'`; (2) otherwise
fetch with `credentials: 'include'` so the browser's existing session cookies ride
along. This ladder is the declared `gitlab.authMethods = ['session', 'pat']` in
precedence order (a token always wins); the GitHub source is token-only (see
Requirement: GitHub connector auth is token-only). Tokens SHALL be stored only in
`chrome.storage.local`, keyed by `sourceId`, SHALL never appear in logs, and SHALL
never be included in any state broadcast. Signed-out detection SHALL be
response-shape-based and non-throwing: a `401`, a redirect landing on a non-JSON
document, or any non-JSON body SHALL resolve `state: 'signed-out'`; network errors,
timeouts, and 5xx/429 resolve `state: 'error'`. Every connector request SHALL carry a
bounded timeout (`AbortSignal.timeout`, 20 s). The connector SHALL NOT prompt,
retry-loop, or surface an exception for auth failures.

#### Scenario: A configured PAT wins over cookies

- **GIVEN** a token is stored for the account `acc-1` on `gitlab.example.com`
- **WHEN** the connector polls a lens referencing `acc-1`
- **THEN** the request carries `Authorization: Bearer <token>` (looked up by `sourceId`) and omits credentials

#### Scenario: No PAT rides the browser session

- **GIVEN** no token is stored for the resolved `sourceId`
- **WHEN** the GitLab connector polls
- **THEN** the request is sent with `credentials: 'include'` and no Authorization header

#### Scenario: Two accounts on one host hold distinct tokens

- **GIVEN** two `gitlab.com` accounts where only one has a token
- **WHEN** each is polled
- **THEN** the tokened account authenticates by Bearer and the other rides the session — they do not share a token

### Requirement: Connector implementations conform to the SourceConnector contract

The `SourceConnector` interface in `background/connectors/connector.ts` SHALL remain
**shape-stable** in `fetchRuntime`'s arity:
`fetchRuntime(cfg: ResolvedLensSource, maxItems: number, caches?: ConnectorCaches): Promise<LensSectionRuntime>`,
where `ResolvedLensSource` is
`{ source: LensProvider; baseUrl: string; query?: LensQuery; name?: string; lensKind: LensKind; sourceId: SourceId; workspace?: string }`
(the engine expands `queries[]` before dispatch; `lensKind` from the owning lens;
`sourceId` and `workspace?` from the referenced account — `workspace?` carries the Cloud
bitbucket workspace slug, used by the bitbucket connector). `listingUrl`,
`requiredOrigins`, `defaultBaseUrl`, and `mintedIcon` accept the same resolved config.
The contract SHALL additionally declare `readonly authMethods: AuthMethod[]`
(`AuthMethod = 'session' | 'pat'`) — see the `connector-accounts` capability — so the
engine and surfaces can derive an account's effective method.

The engine's `fetchLensSectionRuntime(cfg, maxItems, caches?)` dispatches to
`CONNECTORS[cfg.source].fetchRuntime(cfg, maxItems, caches)`. The
`resolvedConfigs(node): ResolvedLensSource[]` helper resolves each `LensSourceRef`
against `AppState.sources` and performs the `× queries[]` expansion, stamping
`sourceId`, `lensKind`, `workspace?`, and the account's `source`/`baseUrl`/`name?`; it
is the single derivation used by the engine fan-out, the origin union, and the editor
preview.

#### Scenario: A fetch dispatches through the registry by resolved config

- **WHEN** the engine refreshes a section whose resolved config carries `source: 'gitlab', query: 'authored', sourceId: 'acc-1'`
- **THEN** `CONNECTORS.gitlab.fetchRuntime(cfg, maxItems, caches)` performs the fetch and looks the token up by `cfg.sourceId`

#### Scenario: Each connector declares its auth methods

- **WHEN** the `CONNECTORS` registry is inspected
- **THEN** `github.authMethods` is `['pat']`, `gitlab.authMethods` is `['session', 'pat']`, `bitbucket.authMethods` is `['pat']`, `jira.authMethods` is `['session']`, and `rss.authMethods` is `[]`

#### Scenario: The registry holds exactly the five shipped sources

- **WHEN** the `CONNECTORS` registry is inspected
- **THEN** its keys are exactly `gitlab`, `github`, `bitbucket`, `jira`, and `rss`

#### Scenario: The resolved config carries the lens kind, source id, and workspace

- **WHEN** `resolvedConfigs(node)` expands a lens whose `lensKind` is `'review'` referencing a Cloud bitbucket account `acc-bb` with `workspace: 'acme'`
- **THEN** every resolved config it produces carries `lensKind: 'review'`, `sourceId: 'acc-bb'`, and `workspace: 'acme'`, so the connector can gate `change` enrichment, look up the per-source token, and scope the Cloud query to the workspace

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

The GitHub connector SHALL authenticate exclusively via the **per-source** token for
the resolved config's `sourceId` in the `lunma.connectors` record
(`Authorization: Bearer <token>`, `credentials: 'omit'`) — there is no cookie rung
(`github.authMethods = ['pat']`). When NO token is stored for the resolved `sourceId`
the connector SHALL resolve `{ state: 'signed-out' }` WITHOUT issuing a request. A
`401` (revoked or malformed token) SHALL also resolve `signed-out`; any other non-2xx —
403 in all its shapes, 5xx — plus network failures and timeouts resolve `error`. Token
hygiene is unchanged: stored only in `chrome.storage.local` (keyed by `sourceId`),
never logged, never broadcast, never echoed.

#### Scenario: No token short-circuits to signed-out

- **GIVEN** a `github` account with no stored token for its `sourceId`
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

`lensItemBindings` is typed as `{ [folderId: FolderId]: { [namespacedItemId: string]: { [windowId: WindowId]: { tabId: TabId; allowGlob: string } } } }` in `AppState`, persisted at schema v9. Each `namespacedItemId` SHALL be of the form `${sourceKey}:${nativeId}` where `sourceKey` is the **per-account, per-filter** section key (`${sourceId}:${query}` for queue sections, `${sourceId}` for rss) and `nativeId` is the connector's native item id. This prevents collisions when two filters of the same instance — two instances — or two accounts on the same host produce items with the same native id.

All open/close/bind/unbind behavior, the `dropLensBindings` demote-on-delete behavior, and the `isBound` tab-created guard are unchanged except that every slot read/write uses the per-account namespaced id form. `openLensItem` receives a `namespacedItemId` from the sidebar; the SW uses it as the binding key directly.

#### Scenario: Opening a lens item from a multi-filter section uses the per-filter namespaced id

- **GIVEN** a lens referencing gitlab account `acc-1` carrying filters `['authored', 'review-requested']` and an authored item with native id `42`
- **WHEN** `openLensItem { folderId, itemId: 'acc-1:authored:42', windowId: 100, spaceId }` is dispatched
- **THEN** a tab opens at the item's URL and is bound under `lensItemBindings[folderId]['acc-1:authored:42'][100]`

#### Scenario: The same MR in two filter sections binds independently

- **GIVEN** an MR with native id `42` appearing in both the `authored` and `review-requested` sections of gitlab account `acc-1`
- **WHEN** the row is activated in each section
- **THEN** `lensItemBindings[folderId]` SHALL hold separate keys `'acc-1:authored:42'` and `'acc-1:review-requested:42'`

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

A lens's non-`ok` runtime states SHALL render quietly, never as a red error card.
For `signed-out` the row is **per source and method-aware**: a **session**-capable
account (GitLab or Jira) renders "Sign in to ⟨host⟩" dispatching `openUrl` with the
account's `baseUrl` (the next due poll heals after sign-in), with an optional inline
"add a token" upgrade; a **`pat`-only** account (GitHub) — or any account whose token
has gone bad — renders an **inline "Reconnect ⟨host⟩"** affordance that expands in
place into a password field (the reusable connect affordance — see the
`connector-accounts` capability), writes the token via `setAccountToken(sourceId, …)`,
and dispatches `refreshLens` so the section re-fetches **without navigating to the
options page**. A bad token after refresh SHALL show "That token didn't work — check
it can read pull requests." A `dangling` reference (its account was disconnected)
renders a calm "Account removed — reconnect or pick another" row. `error` → the
last-known items remain with one dim "Couldn't reach ⟨host⟩" note row; first-fetch
`pending` (no items) → three static low-alpha ghost rows. The reload-hold behaviour
(keep last-shown items from sidebar component memory across an SW restart, hold open
work's row) is unchanged. No failure state SHALL produce a rejected command ack, a
toast, or a notification.

#### Scenario: A session-capable signed-out lens shows the sign-in row

- **GIVEN** a GitLab lens whose runtime is `signed-out`
- **WHEN** the lens is expanded
- **THEN** it renders one "Sign in to ⟨host⟩" row (activating it opens the instance via `openUrl`), with an optional inline "add a token"

#### Scenario: A signed-out GitHub lens reconnects inline

- **GIVEN** a `github` lens whose runtime is `signed-out`
- **WHEN** the user opens the inline "Reconnect ⟨host⟩" affordance, enters a token, and confirms
- **THEN** `setAccountToken(sourceId, …)` writes the token AND `refreshLens` is dispatched, and the section re-fetches without opening the options page

#### Scenario: A disconnected account's section is calm

- **GIVEN** a lens section whose referenced account was disconnected
- **WHEN** the lens renders
- **THEN** it shows a calm "Account removed — reconnect or pick another" row, never an error card

### Requirement: Creation and configuration via the pinned-header menu

The `LensEditor.svelte` SHALL be **connection-first**: it SHALL render, top to bottom, a **Name** field; a **connections** picker (the lens's sources, as account assembly — not a URL form, and **not** gated by any kind selector); a derived **"this lens will show …"** preview naming the canonical entities the chosen connections produce (Changes / Articles / a generic label); the lens settings (**Show** max-items and **Refresh** cadence); and a single primary action — **Create** / **Save** — with **Cancel** and the validation hint. There SHALL be **no Kind picker** (the kind-driven provider filter that previously restricted a review lens to github/gitlab is removed with it). The connections picker SHALL be height-bounded and scroll independently while Name stays pinned above and the settings + action stay pinned below.

The connections picker SHALL present **all** of the user's connected sources (accounts and feeds, no provider filtering) as **pickable rows**, composed from the `MultiSelect` primitive in **inline** mode: each row's leading content SHALL be the source's `AccountChip` (provider glyph + name/host + an account's derived status) and a checkbox-square SHALL toggle the source's inclusion in the lens. The picker SHALL surface a **search box** that fuzzily filters the rows by account name **or source type (provider)** once the connected-source count exceeds the `MultiSelect` search threshold — each source contributes a `keywords` entry (its provider/type + host) so typing a type (e.g. "rss", "git") finds sources whose visible name omits it. **Including a source contributes all of its supported queries** — a non-`rss` account fetches every query its provider/deployment supports (a forge or Jira account: `authored` + `assigned` + `review-requested`; a Bitbucket **Server/DC** account: `authored` + `review-requested`; a Bitbucket **Cloud** account: `authored` only — never `assigned`, which Bitbucket has no concept of); an `rss` feed carries `queries: []` — so the editor SHALL NOT present a per-source filter picker and SHALL NOT require choosing a filter per source, and SHALL NOT mint a query its provider rejects (the supported set is derived via `supportedQueriesFor`). A single **"+ Connect a service"** action SHALL open the shared Service-dropdown connect picker (`ui/ServiceConnectPicker.svelte` — see the `connector-accounts` capability), which mints the source (`createAccount` + optional `setAccountToken`) and returns it to the picker **pre-selected** (an rss feed pre-selected with `queries: []`). The picker's **OPML import** SHALL behave the same way in the editor — bulk: it SHALL find-or-mint an rss account per parsed feed (deduped by normalized base URL, since the rss `sourceKey` is host-derived) and pre-select them all **into the lens being assembled**, NOT spawn a standalone "Feeds" lens (the editor passes the picker an `onImportFeeds` callback — see the `connector-accounts` capability; the standalone-`importOpml` path is the Options Connections manager's). Confirming SHALL be blocked when no source is selected or when a connect flow is incomplete. `createLens`/`updateLens` SHALL carry `sources: LensSourceRef[]` (references, not embedded configs) and SHALL NOT carry `lensKind` (the SW derives it — see `A lens carries a kind`). **Create SHALL open the lens's overview page.** A source change on an existing lens SHALL trigger an immediate refetch of the affected sections only.

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

### Requirement: Connectors section in the options page

The options page's prior per-host **Connectors** section (anchor `#connectors`) SHALL be
replaced by the **Accounts** manager, whose full contract — listing accounts with their
reach, connecting / renaming / disconnecting, and the per-source token write keyed by
`sourceId` — is owned by the `connector-accounts` capability (see Requirement: The
options page manages accounts and shows their reach). This requirement retains only the
lens-side guarantee: a token set or cleared for an account in that manager SHALL take
effect on the next poll of any lens referencing that account, without a reload, and the
token value SHALL never be echoed back into the field.

#### Scenario: A token set in the manager applies on the next poll

- **WHEN** the user sets a token for an account in the Accounts manager
- **THEN** the next poll of any lens referencing that account authenticates via the Bearer header (the token resolved by `sourceId`), with no reload
- **AND** the token value never appears in the DOM (a "Token set — replace" affordance renders instead)

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

The canonical `sourceKey(cfg: ResolvedLensSource): string` function SHALL live in
`shared/lens-labels.ts` (importable by the SW, the sidebar, and the overview page under
the layer DAG) and SHALL return `${cfg.sourceId}:${cfg.query}` when `cfg.query` is
present (queue sections) and `${cfg.sourceId}` when it is absent (rss). It SHALL be pure
and SHALL NOT perform I/O. The same derivation SHALL be used by `setLensSectionRuntime`,
`lenses.result` events, and the `lensItemBindings` namespace.

#### Scenario: Source key includes the filter for a queue section

- **WHEN** a gitlab authored section referencing account `acc-1` produces `sourceKey`
- **THEN** the key is `'acc-1:authored'` and is stable across lens name changes and the account's host/name changes

#### Scenario: An rss source key omits the query

- **WHEN** an rss section referencing account `acc-feed` produces `sourceKey`
- **THEN** the key is `'acc-feed'`

#### Scenario: Two same-host accounts derive distinct keys

- **WHEN** two `github.com` accounts `acc-work` and `acc-personal`, both `authored`, produce `sourceKey`
- **THEN** the keys are `'acc-work:authored'` and `'acc-personal:authored'` (distinct, no collision)

### Requirement: Section identity is computed identically across surfaces

A lens section's identity key (`sourceKey`) SHALL be derived by a single
canonical function shared by the service worker, the sidebar, and the overview
page. The service worker is the single writer that drains results keyed by this
identity, so the sidebar and the overview page MUST key sections by the exact
same function — for every source, including a self-hosted GitHub Enterprise or
GitLab instance, and a source whose `baseUrl` is malformed. No surface may
maintain its own variant.

The key SHALL be `` `${sourceId}` `` for a feed-style source (no filter) and
`` `${sourceId}:${query}` `` for a filtered source, where `sourceId` is the
referenced account's id. Because the key is the account id (not host-derived), a
malformed or port-bearing `baseUrl` does not affect section identity, and two
accounts on the same host key distinctly.

#### Scenario: The same source keys identically on every surface

- **WHEN** a lens references one source and the SW, the sidebar, and the overview
  page each derive that section's key
- **THEN** all three produce the same `sourceKey` string

#### Scenario: A self-hosted source on a non-default port keys consistently

- **WHEN** a source's `baseUrl` carries a non-default port (e.g. a self-hosted
  GitLab at `https://git.example.com:8443`)
- **THEN** every surface derives the same `sourceKey` (the account `sourceId`),
  so the section lines up rather than resolving as a distinct or empty section
- **AND** the section's displayed host/name (derived from the account, not the
  key) still includes the port

#### Scenario: A filtered source keys by account and query

- **WHEN** a source carries a `query` (a filter)
- **THEN** its `sourceKey` is `` `${sourceId}:${query}` ``, distinct from the
  same account under a different filter and from a different account under the
  same filter

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
where `sourceKey` is the section's resolved identity (`${sourceId}:${query}` for a queue
section, `${sourceId}` for an rss feed). The state SHALL NEVER be persisted to storage and
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

- **GIVEN** a two-section lens `[acc-1:authored (ok, 5 items), acc-1:review-requested (ok, 3 items)]`, both expanded, in window 100
- **WHEN** the user activates the authored section header
- **THEN** `setLensSectionCollapsed(100, folderId, 'acc-1:authored', true)` is written
- **AND** the authored section header (with its count) still renders while its 5 result rows are hidden
- **AND** the review-requested section continues to render its header and 3 rows

#### Scenario: Collapse is per-window

- **GIVEN** a lens open in window 100 and window 200, with its authored section collapsed in window 100
- **WHEN** window 200 renders the same lens
- **THEN** the authored section is expanded in window 200 (no cross-window collapse)

#### Scenario: Sections default to expanded after a restart

- **GIVEN** a lens whose section was collapsed in window 100
- **WHEN** the SW restarts (the ephemeral collapse state is gone)
- **THEN** every section of the lens renders expanded

#### Scenario: A collapsed busy section still contributes to the lens badge

- **GIVEN** a two-section lens whose collapsed gitlab authored section (`acc-1:authored`) holds 4 items and whose expanded feed section holds 2 unread
- **WHEN** the lens renders
- **THEN** the lens badge reads `6` (collapse does not change the badge)

#### Scenario: Single-section lenses have no per-section collapse

- **GIVEN** a lens with exactly one resolved section
- **WHEN** the lens is expanded
- **THEN** no section header and no collapse control render, and no `collapsedLensSectionsByWindow` entry is created for it

### Requirement: `LensSource` is the per-instance connector unit

The per-**instance** entry on a lens node SHALL be `LensSourceRef`
(`{ sourceId: SourceId; queries: LensQuery[] }`), exported from
`apps/extension/src/shared/types.ts`, referencing a `SourceAccount` rather than
embedding `{ source, baseUrl }`. The per-**section** unit SHALL remain
`ResolvedLensSource`, produced by `resolvedConfigs(node)` which resolves each
reference against `AppState.sources` and expands it over its `queries[]`. A
`ResolvedLensSource` SHALL carry the resolved `source`/`baseUrl`/`name?` (read from the
account), the section's `query?`, the lens's `lensKind`, and the account's `sourceId`
(so the connector can look up the per-source token). `ResolvedLensSource` is the
parameter type for `SourceConnector.fetchRuntime`/`requiredOrigins`/`listingUrl` and
`requiredOriginsForConfig`.

#### Scenario: A reference resolves against its account and expands per filter

- **GIVEN** `AppState.sources['acc-1'] = { id: 'acc-1', provider: 'gitlab', baseUrl: 'https://gitlab.com' }`
- **WHEN** `resolvedConfigs` expands a lens referencing `{ sourceId: 'acc-1', queries: ['authored', 'assigned'] }`
- **THEN** it yields two `ResolvedLensSource`s carrying `source: 'gitlab'`, `baseUrl: 'https://gitlab.com'`, `sourceId: 'acc-1'`, and `query: 'authored'` / `'assigned'` respectively

#### Scenario: A dangling reference yields no section

- **WHEN** `resolvedConfigs` expands a reference whose `sourceId` is absent from `AppState.sources`
- **THEN** it yields no `ResolvedLensSource` for that reference, and the page/sidebar renders a calm "account removed" state for it (never a crash)

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

When mirroring a lens, the lens overview page SHALL render the lens's items grouped by **entity** — not by source section — as a **width-aware board**, with one **collapsible** section per **populated** entity. On a **wide** overview (the content box is wide enough for two readable columns) the **Changes** and **Issues** sections occupy two side-by-side columns when **both** are populated; when only one of the two is populated, that section spans the full width. **Articles** and **Other** always span the full width beneath the Changes/Issues row. On a **narrow** overview every populated section stacks in the canonical order **Changes → Issues → Articles → Other** (the `LensEntity` order `change → ticket → article → generic`). The two-column switch SHALL be driven by a **CSS container query on the overview content box** (not a window media query). A single source section MAY feed more than one entity section (e.g. one GitHub section contributes both Changes (PRs) and Issues). Each section SHALL render a header (its label + an attention/item count) that toggles the section collapsed/expanded (`aria-expanded`), above its items. The page header SHALL show the lens identity (name + a provider subline). When the lens has no items the page SHALL render a single calm empty note — never per-section skeletons. The existing calm per-section states SHALL be preserved — `pending` → static ghosts; `error` → last-known items plus a dim "Couldn't reach ⟨host⟩" note; `signed-out` → the per-source sign-in / "Add a token in Settings → Connectors" affordance; `needs-access` → the muted "Lunma needs access to ⟨host⟩" grant prompt invoking `requestHostPermissions` — and no non-`ok` state SHALL render as a red error card.

#### Scenario: One source section feeds two entity sections in canonical order

- **GIVEN** a lens whose single GitHub section holds a PR and an issue, both `ok`
- **WHEN** the page renders
- **THEN** it shows a Changes section and an Issues section, the PR under Changes and the issue under Issues

#### Scenario: Changes and Issues render side-by-side on a wide overview

- **GIVEN** a lens with populated Changes and Issues and a wide content box
- **WHEN** the page renders
- **THEN** Changes and Issues occupy two side-by-side columns and Articles (if present) spans the full width beneath

#### Scenario: A single populated entity spans the full width

- **GIVEN** a feed-only lens (only Articles populated) at any width, or a review-only lens (only Changes populated) on a wide content box
- **WHEN** the page renders
- **THEN** the single populated section spans the full width (no empty second column)

#### Scenario: A narrow overview stacks sections in canonical order

- **GIVEN** a lens with populated Changes, Issues, and Articles and a narrow content box
- **WHEN** the page renders
- **THEN** the sections stack vertically in the order Changes → Issues → Articles

#### Scenario: A section header collapses and expands

- **GIVEN** a lens overview with a populated Changes section
- **WHEN** the user activates the section header
- **THEN** `aria-expanded` toggles and the section's rows hide/show

#### Scenario: An empty lens renders one calm empty note

- **GIVEN** a lens with no items in any entity
- **WHEN** the page renders
- **THEN** it shows a single calm empty note and no section skeletons

### Requirement: The page item is a card with optional content slots

The overview's result units SHALL be **entity-specific**, each composing existing `ui/` primitives and never re-rolling them or hard-coding design values:
- **Change** rows present in **two lines**: line one is the full `title` with its optional linked-ticket ref chip; line two is the triage line — a `host/owner/repo` repo label (host from the source `baseUrl`, `owner/repo` from `change.repo`) followed by a right-aligned triage cluster of three orthogonal signals: a **CI light** (from `status`; a `draft` shows a distinct hollow glyph), a `ReviewerRail` (blocking-wins verdict `changes` > `pending` > `approved`), and a `Diffstat` (`change.additions`/`deletions`). A relative age (from `change.updatedAt`) that warms past a staleness threshold MAY ride the triage line. Change rows MAY be grouped by their source query into labelled lanes (e.g. "Authored", "Review requests").
- **Issue** rows present in **two lines**: line one is the ticket `key` (aligned to the title line) and the title (stripped of a leading key prefix); line two is the **assignee** (an `Avatar` + display name from `ticket.assignee`, or a hollow-ring "Unassigned" affordance when absent), an **updated-age** freshness cue that warms to `--warning` past a staleness threshold (> 1 week), and a right-aligned priority pill. Issues are grouped by status (the status is the group header).
- **Article** cards render a hero (a real `imageUrl` loaded with `loading="lazy"` + `referrerpolicy="no-referrer"`, else a generated cover — the title initial in the display serif over a Space-hue wash, at the same ratio), the full title, a clamped excerpt, any `categories` chips, and a meta footer (source · relative `publishedAt` · category); each card carries a read toggle. Article **thumbnails SHALL be quiet at rest** — dimmed + desaturated — and SHALL restore to full colour on hover/focus (the transition collapsing to instant under `prefers-reduced-motion`). The Articles section is switchable between a magazine **grid** (responsive multi-column) and a **list** (a full-width single column — the list is not multi-column; the grid is the multi-column browse view).
- **Other** items render a compact row (title + favicon + at most one status dot).

Every unit SHALL show the full `title` — wrapping to as many lines as needed, never truncated (no ellipsis) — and SHALL render an optional region only when the item carries that field (absent regions collapse to zero height). This requirement is descriptive, not prohibitive: connectors MAY populate additional optional `LensItem` fields additively with no rewrite of this surface and no schema migration (results are ephemeral).

#### Scenario: A change row shows its triage signals across two lines

- **GIVEN** a Change with CI `ok`, two reviewers (one approved, one pending), `+112 −40`, updated 2h ago, and a linked ticket
- **WHEN** its row renders
- **THEN** line one shows the full title and the linked-ticket chip, and line two shows the repo label, the CI light, a reviewer rail with the pending verdict, and a `+112 −40` diffstat

#### Scenario: An issue row shows owner and freshness

- **GIVEN** an Issue `PAY-91` with priority `urgent`, assignee "Tina T.", last updated 2 weeks ago, under status "To Do"
- **WHEN** the Issues section renders
- **THEN** line one shows `PAY-91` aligned to the title with the key prefix stripped, and line two shows Tina T.'s avatar + name, an amber "2w" freshness cue, and a right-aligned `urgent` pill, under a "To do" group header

#### Scenario: An unassigned issue shows the hollow affordance

- **GIVEN** an Issue whose `ticket.assignee` is absent
- **WHEN** its row renders
- **THEN** the assignee slot shows a hollow-ring "Unassigned" affordance rather than an avatar

#### Scenario: An article thumbnail is quiet at rest and wakes on hover

- **GIVEN** an article with a bright `imageUrl`
- **WHEN** its card renders at rest, then is hovered
- **THEN** the thumbnail is dimmed + desaturated at rest and restores to full colour on hover (instant under reduced-motion)

#### Scenario: An article renders as a grid card switchable to a list row

- **GIVEN** an article carrying `excerpt`, `imageUrl`, `publishedAt`, and `categories`
- **WHEN** the Articles section renders and the user switches to List
- **THEN** it first shows a magazine card in the responsive grid, then a compact full-width single-column list row for the same item

#### Scenario: A title is never truncated

- **WHEN** any section unit renders an item whose title exceeds one line
- **THEN** the title wraps and is shown in full (no ellipsis)

### Requirement: Page result activation reuses existing open semantics

Activating a result card on the page SHALL dispatch `openLensItem` (the same command the sidebar uses), so a tab is bound/focused per window and feed read-state (consume-on-move-on, auto-advance, mark-read) behaves identically to opening from the sidebar. The page SHALL derive each item's namespaced id (`${sourceKey}:${nativeId}`, i.e. `${sourceId}:${query}:${nativeId}` for a queue item, `${sourceId}:${nativeId}` for a feed item) using the canonical `sourceKey` derivation. The page SHALL NOT introduce a separate activation path or mutate bindings directly.

#### Scenario: Opening a queue item from the page binds a tab

- **GIVEN** the page for lens `f1` with an authored gitlab item (account `acc-1`) native id `42`
- **WHEN** the user activates that card in window 100
- **THEN** `openLensItem { folderId: 'f1', itemId: 'acc-1:authored:42', windowId: 100, spaceId }` is dispatched and the existing bind/focus behavior applies

#### Scenario: Opening a feed item from the page drains it like the sidebar

- **GIVEN** the page for a feed lens with an unread item
- **WHEN** the user activates its card and later moves on from the bound tab
- **THEN** the item is consumed exactly as it would be from the sidebar (read-state and auto-advance unchanged), and the page re-renders from the broadcast

### Requirement: Lens items may carry optional rich-content fields

`LensItem` SHALL carry OPTIONAL display-only fields in addition to `id`/`title`/`url`/`status`: `excerpt?: string` (a plain-text summary), `imageUrl?: string` (a thumbnail/hero image URL), `publishedAt?: number` (publication time as epoch ms), and `change?: ChangeData` (the canonical Change entity for review lenses — see "A review lens normalises its sources into Change entities"). They SHALL be present on both the TypeScript interface (`shared/types.ts`) and the ephemeral `LensItemSchema` Zod mirror (`shared/schemas.ts`). They ride the **broadcast-only, never-persisted** `lenses` runtime slice, so they introduce **no schema migration** and the persisted envelope is unchanged. Each field SHALL be **omitted entirely** when absent (an item with none is byte-identical to the prior shape). The sidebar projection SHALL ignore these fields; only the full-page projection renders them.

#### Scenario: Optional fields are omitted when absent

- **WHEN** a connector emits an item with no description, image, date, or change bag
- **THEN** the `LensItem` has no `excerpt`, `imageUrl`, `publishedAt`, or `change` keys, and it round-trips through `LensItemSchema`

#### Scenario: A review change rides the ephemeral slice

- **WHEN** a review-lens connector emits an item carrying `change`
- **THEN** the `change` bag is present on the runtime `LensItem` and validates under `LensItemSchema`
- **AND** when the owning `ok` runtime is persisted, the `lenses` slice is stripped before write, so `change` never reaches disk and needs no migration

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

### Requirement: A review lens normalises its sources into Change entities

A lens whose derived `lensKind` is `'review'` SHALL normalise each of its **`github`/`gitlab`/`bitbucket`** sections' result items by carrying an optional `change: ChangeData` bag normalised from the provider's PR/MR so that GitHub PRs, GitLab MRs, and Bitbucket PRs present as one entity; the lens MAY also carry `rss` and `jira` sources, which never carry a `change` bag (they render as Articles / Generic). `ChangeData` SHALL be:

```ts
interface ChangeData {
  author: string;                 // PR/MR author login/username
  repo: string;                   // "owner/repo" slug (host comes from the source baseUrl)
  reviewers: { login: string; state?: 'approved' | 'changes' | 'pending' }[];
  draft: boolean;
  additions?: number;
  deletions?: number;
  targetBranch?: string;
  updatedAt: number;              // epoch ms
}
```

The CI/pipeline state SHALL remain on `LensItem.status` (the existing tone), NOT duplicated into `ChangeData`. `ChangeData` is ephemeral (it rides the `lenses` runtime slice) and SHALL introduce no persisted-schema change. For Bitbucket Server / Data Center the reviewers are read inline from the dashboard list; for Bitbucket Cloud, which omits reviewers from the PR collection, the connector populates `reviewers` from a bounded per-PR detail fetch capped at the lens's `maxItems` (see Requirement: The Bitbucket connector fetches canned queries over the Server and Cloud APIs).

#### Scenario: GitHub, GitLab, and Bitbucket changes share the entity

- **GIVEN** a review lens with a github source, a gitlab source, and a bitbucket source, all `ok`
- **WHEN** the runtime resolves
- **THEN** each item carries a `change` bag of the same `ChangeData` shape regardless of provider, and `status` carries its CI/pipeline tone

#### Scenario: Non-git sections of a mixed lens carry no change bag

- **GIVEN** a derived-`'review'` lens that also has an `rss` feed and a `jira` account
- **WHEN** its connectors resolve
- **THEN** the rss and jira items carry no `change` bag, and only the github/gitlab/bitbucket items are enriched

### Requirement: The github-pr adapter enriches review changes

For a `review` lens, the GitHub connector SHALL populate each item's `change` from the PR detail it already fetches plus one reviews request, capped at the lens's `maxItems`: `author` from the PR `user.login`; `repo` from `base.repo.full_name`; `targetBranch` from `base.ref`; `additions`/`deletions` and `draft` from the PR detail; `updatedAt` from `updated_at`. It SHALL fetch `GET /repos/{owner}/{repo}/pulls/{number}/reviews`, reduce to the latest non-`COMMENTED` review per reviewer to `state` (`APPROVED` → `approved`, `CHANGES_REQUESTED` → `changes`), and mark requested reviewers with no review `pending`. Enrichment gates on the resolved section's `lensKind`: because any lens holding a `github` source derives to `'review'` (see `A lens carries a kind`), a github section is always enriched; the connector is never invoked for a `'general'` (git-free) lens, so it makes no reviews request and populates no `change`.

#### Scenario: A review PR is enriched with a Change

- **GIVEN** a review lens with a github source resolving an open PR
- **WHEN** the connector fetches
- **THEN** the item carries `change` with author, repo, target branch, additions/deletions, draft, updatedAt, and per-reviewer states from the reviews response

#### Scenario: A git-free general lens never invokes the github connector

- **GIVEN** a `general` lens whose sources are only `rss` feeds
- **WHEN** the lens resolves
- **THEN** the github connector is not invoked, so no reviews request is made and no item carries a `change`

### Requirement: The gitlab-mr adapter enriches review changes

For a `review` lens, the GitLab connector SHALL populate each item's `change` from the MR detail it already fetches plus one approvals request, capped at the lens's `maxItems`: `author` from `author.username`; `repo` from the project path; `targetBranch` from `target_branch`; `additions`/`deletions` from the MR diff/change stats; `draft` from `draft`/`work_in_progress`; `updatedAt` from `updated_at`; `reviewers` from the MR `reviewers`. It SHALL fetch `GET /projects/{id}/merge_requests/{iid}/approvals`, marking reviewers in `approved_by` `approved` and others `pending`; where the instance exposes reviewer review-state, a requested-changes reviewer SHALL be `changes`. Enrichment gates on the resolved section's `lensKind`: because any lens holding a `gitlab` source derives to `'review'` (see `A lens carries a kind`), a gitlab section is always enriched; the connector is never invoked for a `'general'` (git-free) lens, so it makes no approvals request and populates no `change`.

#### Scenario: A review MR is enriched with a Change

- **GIVEN** a review lens with a gitlab source resolving an open MR
- **WHEN** the connector fetches
- **THEN** the item carries `change` with author, repo, target branch, diff stats, draft, updatedAt, and reviewer states derived from approvals

#### Scenario: Unknown verdicts degrade to pending

- **GIVEN** a gitlab instance that does not expose a reviewer's review-state
- **WHEN** the connector builds `change.reviewers`
- **THEN** that reviewer's `state` is `pending` (never a fabricated verdict)

### Requirement: The Changes entity section renders the Review Queue archetype

The **Changes** entity section of the overview SHALL render the **Review Queue** archetype over the change-bucket resolved sections of the lens (its `github`/`gitlab`/`bitbucket` sections). It SHALL group changes into **relationship lanes** derived from each source's query: a `review-requested` query feeds a "Review requests" lane, an `authored` query feeds an "Authored" lane, and an `assigned` query feeds an "Assigned" lane; empty lanes are dropped and the remaining lanes render in that priority order.

Each change SHALL render as a **two-line row** (not a magazine card): line one presents a **provider monogram** (`GH`/`GL`/`BB`) leading the change title with its optional linked-ticket ref; line two presents a **repo label** (`change.repo`) followed by a right-aligned **triage cluster** of three orthogonal signals — a **CI light** derived from the item `status` tone (with a `draft` change shown as a **distinct hollow glyph** in that locus), a **`ReviewerRail`** (a blocking-wins verdict glyph `changes` > `pending` > `approved` leading verdict-ringed reviewer `Avatar`s, composed from the change's `reviewers`; each reviewer's `state`, absent → `pending`), and a **`Diffstat`** of `change.additions`/`deletions`. The row SHALL NOT render a separate review-state pill: the `ReviewerRail` verdict glyph is the row's single review-state signal, and the per-reviewer `Avatar` rings carry each reviewer's state. The row SHALL re-roll none of the reviewer/diffstat affordances — it composes the `ReviewerRail`, `Avatar`, and `Diffstat` primitives and reads their design tokens only through them. The title SHALL never be truncated. Activation SHALL reuse `openLensItem` and the existing per-window bind/focus semantics; the existing calm pending/error/signed-out/needs-access states SHALL be reused; no non-`ok` state SHALL render as a red error card.

#### Scenario: The Changes section renders lanes of rows

- **GIVEN** a lens with `review-requested` and `authored` github sections, all `ok`
- **WHEN** the overview renders
- **THEN** the Changes section shows a "Review requests" lane above an "Authored" lane of `Change` rows — not magazine cards

#### Scenario: A row shows the change's triage signals on its second line

- **GIVEN** a review change with CI `ok`, two reviewers (one approved, one pending), and `+112 −40`
- **WHEN** its row renders
- **THEN** line one shows the provider monogram and the full title, and line two shows the `change.repo` label, a CI light, a `ReviewerRail` whose leading verdict glyph is `pending` with one approved-ringed and one pending-ringed reviewer `Avatar`, and a `+112 −40` `Diffstat`
- **AND** it renders no separate review-state pill

#### Scenario: A draft change shows a hollow CI light

- **GIVEN** a review change whose `change.draft` is `true`
- **WHEN** its row renders
- **THEN** the CI locus shows a distinct hollow glyph and no state pill

#### Scenario: Activation reuses openLensItem

- **WHEN** the user activates a change row in window 100
- **THEN** `openLensItem` is dispatched with the namespaced item id and the existing bind/focus behaviour applies

### Requirement: The Articles entity section renders a magazine

The **Articles** entity section of the overview SHALL render the magazine archetype over the lens's `rss` (article-bucket) resolved sections, merging every feed into one section. It SHALL render two layouts selected by the persisted per-lens `articleLayout` (read as `node.articleLayout ?? 'grid'`, written via `setLensArticleLayout`): a **Grid** — the responsive **multi-column** magazine of cover/initial cards — and a **List** — a **full-width single column** (the List is deliberately not multi-column; the Grid is the multi-column browse view, so the two do not duplicate). In both layouts article **thumbnails SHALL be quiet at rest** (dimmed + desaturated) and restore to full colour on hover/focus. It SHALL reuse the existing feed card rendering and the existing per-feed reading controls. It SHALL render section controls: the **layout toggle** (Grid | List) plus two **page-local ephemeral** controls (no persistence, no bus command): a **feed scope filter** (chips: "All feeds" + one per feed source, narrowing the rendered articles) living within the Articles card, and an **unread filter** (toggle showing the unread count, narrowing to unread items). An unread item in List layout SHALL carry a leading accent unread dot. The section SHALL render only when the lens has at least one `rss` source.

#### Scenario: The Articles section merges feeds with magazine cards

- **GIVEN** a lens with three `rss` feeds, all `ok`
- **WHEN** the overview renders
- **THEN** the Articles section shows one merged magazine across the three feeds, with an in-card feed filter, a Grid/List toggle, and an Unread toggle

#### Scenario: List is a full-width single column, Grid is multi-column

- **GIVEN** a lens whose Articles section holds many articles on a wide overview
- **WHEN** the user views Grid, then switches to List
- **THEN** Grid renders responsive multi-column cards filling the width, and List renders a full-width single column (not multi-column)

#### Scenario: A thumbnail is quiet at rest and wakes on hover

- **GIVEN** an Articles card or list row with a bright image
- **WHEN** it renders at rest, then is hovered
- **THEN** the thumbnail is dimmed + desaturated at rest and full colour on hover

#### Scenario: The feed filter narrows to one source

- **GIVEN** the Articles section showing three feeds
- **WHEN** the user activates a single feed's filter chip
- **THEN** only that feed's articles render, and no state is persisted

#### Scenario: The unread filter narrows to unread items

- **GIVEN** the Articles section with 6 articles, 3 unread
- **WHEN** the user activates the Unread toggle (labelled with the count)
- **THEN** only the 3 unread articles render

### Requirement: A lens carries an optional view filter

A lens `PinNode` SHALL carry an optional `filter?: LensFilter` field, where
`LensFilter` is `{ entities?: LensEntity[]; repos?: string[]; projects?: string[]; feeds?: string[] }`
and every axis is optional. The field is **additive and backward-compatible**: an
absent `filter` and an empty object (`{}`) are equivalent and mean "no narrowing on
any axis" (identical to a lens that has never been filtered). Per axis, an **absent**
key (the axis was never set) means "no constraint on this axis" — every row passes
that axis regardless of value, including values that appear later. An axis present
as an **explicit empty array** (`[]`) means "matches nothing on this axis" — every
row is excluded by that axis. These two states are no longer equivalent: `{}` (or a
`filter` with no `feeds` key) shows every Article; `{ feeds: [] }` shows none. The
`filter` SHALL persist with the rest of the node configuration and round-trip
losslessly through `reorderPinned` and a SW restart. It is a property of the lens
(global), not of any window.

`applyLensFilter` (in `shared/lens-filter.ts`) SHALL be the single, pure predicate
both surfaces use, so the overview and the sidebar always agree. It operates on
`{ item: LensItem; host: string; feedName?: string }` rows (each surface supplies the
host from its source config and the feed name for an article) so repo facets stay
host-scoped and feed facets match by feed name. A row passes iff **both** axes pass:
- **type:** `entities` absent **or** `entityForItem(item) ∈ entities` (the `Other`
  type maps to the `LensEntity` value `generic`); an explicit `entities: []` excludes
  every item; and
- **scope:** a Change passes iff `repos` is absent **or** its host-qualified repo key
  `${host}/${change.repo}` ∈ `repos` (an explicit `repos: []` excludes every Change);
  a Ticket passes iff `projects` is absent **or** `ticket.project ∈ projects` (a
  project-less ticket therefore fails any non-absent `projects` filter, including an
  explicit `[]`); an Article passes iff `feeds` is absent **or** its `feedName ∈
  feeds` (an explicit `feeds: []` excludes every Article); Other items carry no
  repo/project/feed and SHALL always pass the scope axis (governed by the type axis
  alone).

When every axis is **absent** (the filter is `{}` or a key is simply not set),
`applyLensFilter` SHALL return its input unchanged for that axis. An axis present as
an explicit empty array (`[]`) SHALL exclude every row on that axis rather than
passing them through — it is a real constraint (the empty set), not a synonym for
"no constraint." `deriveLensFacets` SHALL emit host-qualified repo keys, distinct
feed names, and SHALL drop `undefined` from the `projects` facet list (project-less
tickets contribute no project facet); `deriveLensFacets` is unaffected by this change
since it derives facets from items, not from the filter.

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
- **AND WHEN** the filter is `{}` (`projects` absent), both tickets pass and `deriveLensFacets` lists only `Pay` (no `undefined`) in `projects`

#### Scenario: An explicit empty filter excludes every row on that axis

- **GIVEN** a lens holding Changes in `o/a`, Tickets in project `Pay`, and Articles from feed `Lobsters`
- **WHEN** the filter is `{ repos: [] }`
- **THEN** every Change is excluded while all Tickets and all Articles still pass (an explicit empty `repos` constrains only the repo/Change axis)
- **AND WHEN** the filter is instead `{ feeds: [] }`
- **THEN** every Article is excluded while all Changes and all Tickets still pass

#### Scenario: A feed filter narrows Articles only

- **GIVEN** a lens holding Articles from feeds `Lobsters` and `Hacker News`, plus Changes and Issues
- **WHEN** the filter is `{ feeds: ['Lobsters'] }`
- **THEN** only `Lobsters` Articles survive while all Changes and all Issues still pass, and `deriveLensFacets` lists `Lobsters` and `Hacker News` in `feeds`

### Requirement: The lens overview filters items by type and scope

The lens overview SHALL offer **scope filters** placed **inside their owning entity card** (not in a top filter bar): the distinct host-qualified `change.repo` values inside the **Changes** card, the `ticket.project` values inside the **Issues** card, and the feed-name values inside the **Articles** card. The overview SHALL NOT render an entity-**type** filter control — entities are always-visible board sections, and the per-section collapse hides a section. (The `LensFilter.entities` axis and the `applyLensFilter` type predicate remain in the data model for the sidebar and programmatic use; the overview simply authors no entity-type filter.) A scope filter SHALL render **only when its facet has two or more visible values**; with fewer than two, the scope filter SHALL NOT render at all, since a single value offers no filtering choice. Each scope filter with two or more values SHALL render as toggle chips when there are five or fewer of a kind, otherwise as a multi-select listbox (`MultiSelect`) that selects any number of scope values at once and, once the facet count exceeds the `MultiSelect` search threshold, surfaces an in-popover search box. The overflow control SHALL NOT reduce the axis to a single selectable value. Scope facet values SHALL be the union of values present in the held items and values currently selected, so a selection is never stranded by a transient empty fetch. Every overflow scope picker SHALL carry an accessible name — repos, projects, and feeds. In the toggle-chip range (two to five values), each chip's rendered width SHALL be bounded so a long value truncates with an ellipsis, and the chip SHALL carry the untruncated value as its accessible tooltip (e.g. a `title` attribute).

An entity card's **visibility** SHALL be governed by whether the lens holds any items of that entity type **before** scope filtering (i.e. the card renders whenever the type is present in the lens at all), NOT by the current scope filter's result count. A scope filter that narrows a populated card down to zero matching items SHALL still render that card (with a `0` count and an empty body) rather than unmounting it — a scope picker, once opened, MUST remain reachable through every filter state reachable from it (including Clear's zero-match state), so a user is never left without a UI path back to widen the filter.

Toggling a scope facet SHALL update the lens filter through the `setLensFilter` command (persisted, not page-local), and the overview SHALL re-render the narrowed set via `applyLensFilter`. The scope filters SHALL compose existing `ui/` primitives (`Chip` — using its shipped `selected`/`onToggle`/`aria-pressed` contract — and `MultiSelect`) and SHALL NOT re-roll a toggle chip nor a multi-select listbox inline nor override the `Chip` selected token from the feature. Selected facets SHALL use the `Chip` selected affordance (resolving to the lens's owning-Space hue) and SHALL hold under reduced-motion and WCAG-AA at every Colour-intensity level. `MultiSelect`'s dropdown-mode popover SHALL remain fully visible (not clipped) regardless of its owning card's rendered height, including the zero-item case above.

An overflow `MultiSelect`'s **Clear** action SHALL persist that axis as an explicit empty array (`[]`), which — per the updated `applyLensFilter` semantics — excludes every row on that axis: the owning entity card's section renders with zero items for that axis (an Articles card cleared to `feeds: []` shows no Articles, per the card-visibility rule above). This is a change from the axis's never-filtered (absent) state, and is now the axis's most restrictive state, not a synonym for it. The closed trigger's summary label SHALL read distinctly for this state (e.g. "None selected") — NOT the same "All …" label used for the genuinely-unfiltered (absent) state, which would misleadingly imply nothing is excluded. When an overflow `MultiSelect`'s `onchange` reports a selection covering every currently-known value of that axis's facet — whether reached via the `MultiSelect`'s own "Select all" action or by the user manually toggling every option on — the overview SHALL persist that axis as the **explicit list of every currently-known value**, not `[]` and not left absent, so it is visually and behaviorally distinct from Clear (every option renders checked, and the picker's header no longer offers "Select all" since nothing remains to select — only Clear does). This collapse-to-full-list (as opposed to the previous collapse-to-`[]`) applies only to the lens-overview scope filters (repos, projects, feeds); it SHALL NOT be implemented as a change to the shared `MultiSelect` primitive's own `selectAll` behavior, since other `MultiSelect` consumers (e.g. the lens editor's source-membership picker) already use "all selected" as a deliberate, persisted snapshot.

#### Scenario: Scope filters live in their entity card

- **GIVEN** a lens with Changes and Issues
- **WHEN** the overview renders
- **THEN** the repo scope filter renders inside the Changes card and the project scope filter inside the Issues card, and no entity-type filter bar renders

#### Scenario: A single-value facet renders no scope filter

- **GIVEN** a lens whose Changes all share one `change.repo` value
- **WHEN** the overview renders the Changes card
- **THEN** no repo scope filter renders (no chip, no `MultiSelect` trigger) since there is only one value to filter against

#### Scenario: A facet crossing from one to two values shows the filter

- **GIVEN** a lens whose Changes currently share one `change.repo` value and no repo scope filter renders
- **WHEN** a Change from a second repo arrives and the facet count becomes two
- **THEN** the repo scope filter renders as a two-chip toggle row

#### Scenario: Scope facets render a multi-select past the threshold

- **WHEN** the Changes in a lens span more than five distinct `change.repo` values
- **THEN** the repo scope facet renders as a `MultiSelect` (a multi-toggle listbox) rather than a chip row, and not as a single-select control

#### Scenario: A long chip label truncates with a tooltip

- **GIVEN** a lens whose Changes span two distinct `change.repo` values, one of them a long host-qualified path
- **WHEN** the repo scope filter renders as a toggle-chip row
- **THEN** the long value's chip is width-bounded and its rendered text truncates with an ellipsis, and the chip carries the full untruncated value as its tooltip

#### Scenario: The overflow scope picker selects multiple values

- **GIVEN** a lens whose Articles span more than five distinct feeds and an unfiltered (absent) feed axis
- **WHEN** the user opens the feed `MultiSelect` and toggles two feeds on
- **THEN** `setLensFilter` is dispatched with `feeds` holding both feed values, and the overview narrows to items from either feed

#### Scenario: The overflow scope picker offers search for long lists

- **GIVEN** a feed scope picker whose option count exceeds the `MultiSelect` search threshold
- **WHEN** the picker opens
- **THEN** an in-popover search box renders and typing into it narrows the listbox to matching feed names

#### Scenario: Each overflow picker has an accessible name

- **GIVEN** a lens whose Changes, Issues, and Articles each overflow their scope facet
- **WHEN** the pickers render
- **THEN** each exposes an accessible name (repos, projects, and feeds respectively)

#### Scenario: A selected value absent from the current fetch stays clearable

- **GIVEN** a persisted filter `repos: ['o/gone']` where `o/gone` is absent from the latest items, and at least one other repo's Changes currently pass the filter
- **WHEN** the Changes scope filter renders
- **THEN** an `o/gone` value still renders (selected) so the user can deselect it, and it is not auto-pruned from the persisted filter

#### Scenario: Clicking Clear filters the entity card to zero items

- **GIVEN** a lens whose Articles span more than five distinct feeds, currently unfiltered (feed axis absent), so the Articles card shows every Article
- **WHEN** the user opens the feed `MultiSelect` and clicks Clear
- **THEN** `setLensFilter` is dispatched with `feeds: []`, the Articles card renders zero Articles, and every option in the popover renders unchecked

#### Scenario: A cleared card stays mounted and its picker stays reachable

- **GIVEN** the same cleared state as above (`feeds: []`, zero Articles rendered)
- **WHEN** the overview re-renders with the persisted `feeds: []` filter
- **THEN** the Articles card is still present in the DOM (not unmounted), its scope-filter trigger reads a distinct "None selected" label (not "All feeds"), and clicking that trigger reopens a fully visible (un-clipped) popover offering Select all, so the user can widen the filter again without editing the lens directly

#### Scenario: Clicking Select all persists the explicit full value list

- **GIVEN** a lens whose Articles span more than five distinct feeds and an unfiltered (absent) feed axis
- **WHEN** the user opens the feed `MultiSelect` and clicks "Select all"
- **THEN** `setLensFilter` is dispatched with `feeds` holding the explicit list of every currently-known feed (not `[]`), every option renders checked, and the popover header offers Clear but no longer offers "Select all"

#### Scenario: Manually checking every option also persists the explicit full value list

- **GIVEN** a lens whose Changes span exactly six distinct `change.repo` values (rendering the `MultiSelect`) and an unfiltered (absent) repo axis
- **WHEN** the user manually toggles all six repo checkboxes on, one at a time, without using "Select all"
- **THEN** once the sixth is toggled, `setLensFilter` is dispatched with `repos` holding all six values (not `[]`), identical in effect to the "Select all" path

#### Scenario: A value added after selecting all is not retroactively included

- **GIVEN** a lens whose feed filter was set to the explicit list of the five then-known feeds after the user selected all
- **WHEN** a sixth feed's Articles arrive in a later fetch
- **THEN** the sixth feed's Articles do NOT pass the filter until the user opens the picker and checks the new feed (the persisted filter is the explicit five-value list, not an unfiltered `[]`/absent state)

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

### Requirement: The Bitbucket connector fetches canned queries over the Server and Cloud APIs

The Bitbucket connector (`background/connectors/bitbucket.ts`) SHALL support both
Bitbucket Server / Data Center and Bitbucket Cloud under one provider, branching on
`new URL(cfg.baseUrl).host === 'bitbucket.org'`. The two deployments are **not
API-compatible**, so the connector SHALL carry two request/normalize paths with a
**deployment-dependent query set**:

- **Server / Data Center** (the clean case) — the REST root is `{baseUrl}/rest/api/1.0`.
  It SHALL support **both** `authored` and `review-requested` via the self-scoped
  `GET /dashboard/pull-requests?state=OPEN&role=AUTHOR` (`authored`) /
  `role=REVIEWER` (`review-requested`) — no identity lookup is needed. Pagination
  follows `start`/`limit`/`isLastPage`. Reviewers are read inline from each PR's
  `reviewers[]` (`approved` + `status`).
- **Cloud** (the constrained case) — the REST root is `https://api.bitbucket.org/2.0`.
  It SHALL support **`authored` only**: the all-workspaces "list PRs for a user"
  endpoint was removed by Atlassian (2025-02-20, now 404), and its replacement is
  workspace-scoped and authored-only, with no workspace/user-level reviewer endpoint.
  The connector SHALL resolve the caller's `uuid` once per poll cycle via `GET /2.0/user`
  (cached in the `ConnectorCaches` map keyed by **`cfg.sourceId`**, storing the in-flight
  promise — NOT by `baseUrl`, since every Cloud account shares `https://bitbucket.org`
  but carries a distinct token resolving to a distinct user)
  and list open pull requests via
  `GET /2.0/workspaces/{cfg.workspace}/pullrequests/{uuid}?q=state="OPEN"`, following the
  `next` cursor for pagination. Because the Cloud PR collection omits reviewers, the
  connector SHALL issue **one per-PR detail fetch capped at `maxItems`** to populate
  the `reviewers[]` bag (from `participants[]`: `approved` + `state`). A `bitbucket`
  config on `bitbucket.org` carrying `query: 'review-requested'` SHALL NOT occur (the
  SW rejects it at create/update); if one is somehow dispatched the connector SHALL
  resolve to the quiet `error` state without a network request.

Each path SHALL normalise results onto the agnostic `LensItem`/`LensSectionRuntime`
shapes, slice to `maxItems`, and — for a `review` lens (always, since any bitbucket
source derives `'review'`) — populate the `change: ChangeData` bag (see Requirement: A
review lens normalises its sources into Change entities): `author`, `repo`
(`workspace/repo` on Cloud, `project/repo` on Server), `targetBranch`, `draft` (both
deployments read the API's own `draft` boolean field off the PR object already present
in their respective list responses — Server/DC's dashboard endpoint carries `draft` the
same as Cloud's), and `reviewers[]` mapped onto `approved | changes | pending`. On both
paths, the `LensItem` title SHALL be prefixed `Draft: ` when the PR's `draft` is `true`
(matching the GitHub/GitLab precedent — see Requirement: The GitHub connector fetches
canned queries over the search API, "Scenario: Draft PRs read as drafts"), restoring
at-a-glance parity across every source in a mixed lens. The connector SHALL be bounded
(never throws; every failure resolves to a runtime state). `requiredOrigins` SHALL
follow Requirement: Each connector declares the origins it fetches; `listingUrl` SHALL
return `https://bitbucket.org/dashboard/pullrequests` (Cloud) or `{baseUrl}/dashboard`
(Server); `mintedIcon` SHALL be `'folder-git-2'`.

#### Scenario: A Server bitbucket section fetches review-requested PRs

- **GIVEN** a review lens with a `bitbucket` account on `https://bitbucket.example.com` carrying `['review-requested']` and a token
- **WHEN** the connector fetches
- **THEN** it lists `GET {baseUrl}/rest/api/1.0/dashboard/pull-requests?state=OPEN&role=REVIEWER` (no `uuid` lookup) and each item carries a `change` bag with reviewers read inline

#### Scenario: A Cloud bitbucket section fetches authored PRs scoped to the workspace

- **GIVEN** a review lens with a Cloud `bitbucket` account (`workspace: 'acme'`) carrying `['authored']` and a token
- **WHEN** the connector fetches
- **THEN** it resolves the caller `uuid` via `GET /2.0/user`, lists `GET /2.0/workspaces/acme/pullrequests/{uuid}?q=state="OPEN"`, and populates each item's `change.reviewers` from a per-PR detail fetch (capped at `maxItems`)

#### Scenario: Bitbucket's supported queries depend on the deployment

- **WHEN** a bitbucket source on `bitbucket.org` is configured in the editor
- **THEN** only `authored` is offered (no `review-requested`, no `assigned`)
- **AND WHEN** a self-hosted bitbucket source is configured, `authored` and `review-requested` are offered (no `assigned`)

#### Scenario: A Server draft PR reads as a draft

- **GIVEN** a review lens with a Server/DC `bitbucket` account
- **WHEN** the connector normalizes a PR whose dashboard response entry carries `draft: true`
- **THEN** the item's `change.draft` is `true` and its title is prefixed `Draft: `

### Requirement: Bitbucket connector auth is token-only

The Bitbucket connector SHALL authenticate with a per-source Bearer access token only
(`authMethods: ['pat']`): a Cloud Repository/Workspace Access Token or a Server / Data
Center HTTP access token, both sent as `Authorization: Bearer {token}` with
`credentials: 'omit'` (no cookie is sent — the Cloud API on `api.bitbucket.org` does
not ride the `bitbucket.org` session). The token SHALL be looked up by the resolved
account's `sourceId` (not by host). When no token exists for the account, every query
SHALL short-circuit to `signed-out` **without a network request**.

#### Scenario: No token short-circuits to signed-out without a request

- **GIVEN** a `bitbucket` account with no token stored for its `sourceId`
- **WHEN** the connector resolves any section
- **THEN** it SHALL resolve to `signed-out` and make no network request

#### Scenario: The token rides as a Bearer header with omitted credentials

- **GIVEN** a `bitbucket` account with a token stored for its `sourceId`
- **WHEN** the connector fetches
- **THEN** the request SHALL carry `Authorization: Bearer {token}` and `credentials: 'omit'`, and the token SHALL be looked up by `cfg.sourceId`

### Requirement: The overview surfaces a cross-entity "Waiting on you" lane

The lens overview page SHALL render a **"Waiting on you" lane** above the entity sections (between the lens identity and the board) whenever it has at least one actionable item, surfacing the items that need the user's action **across entities** in one place. Lane membership SHALL be derived from the existing per-item signals — no new persisted field and no connector change:
- a **Change** whose source query resolves to the `waiting` relation (`relationOf(query) === 'waiting'`, i.e. `review-requested`) — reason **"review requested"**;
- a **Change** whose relation is `authored` and whose CI tone is `failing` (`ciLight().tone === 'failing'`) — reason **"CI failing"** (rendered in `--danger`);
- a **Ticket** whose source query is `assigned` and whose status is not done — reason **"assigned to you"**.

Items SHALL be ordered review-requested → CI-failing → assigned and capped (default 6) with an overflow count in the lane header. A lane item SHALL remain in its home entity section (the lane is a focus overlay, not a move). Each lane row SHALL lead with an **entity badge** (see "The lane row distinguishes entity type with a badge"), show the title (which MAY clamp to two lines as a compact summary) with the ticket/MR key as a ref chip, carry a meta line leading with the provider name, and show its reason right-aligned. The lane SHALL carry the active Space's hue glow and SHALL hold under reduced-motion and WCAG-AA at every Colour-intensity level. Activating a lane row SHALL reuse `openLensItem` (the same activation path as the sections).

#### Scenario: The lane surfaces a review-requested change

- **GIVEN** a lens with a change surfaced by a `review-requested` query
- **WHEN** the overview renders
- **THEN** the "Waiting on you" lane shows that change with the reason "review requested" and the change also still appears in its Changes section

#### Scenario: The lane surfaces an assigned ticket and a CI-failing authored change

- **GIVEN** a lens with a ticket from an `assigned` query (status To Do) and an `authored` change whose CI tone is `failing`
- **WHEN** the overview renders
- **THEN** the lane shows the CI-failing change (reason "CI failing", in the danger tone) and the assigned ticket (reason "assigned to you")

#### Scenario: No actionable items hides the lane

- **GIVEN** a lens whose items are all authored changes with passing CI and no assigned tickets
- **WHEN** the overview renders
- **THEN** no "Waiting on you" lane renders

#### Scenario: Activating a lane row reuses openLensItem

- **WHEN** the user activates a lane row in window 100
- **THEN** `openLensItem` is dispatched with the item's namespaced id and the existing bind/focus behaviour applies

### Requirement: The lane row distinguishes entity type with a badge

The overview SHALL provide a `ui/` primitive **`EntityBadge`** (`apps/extension/src/ui/EntityBadge.svelte`) that renders, for an `entity` of `change | ticket | article`, a distinct **glyph** (a pull-request/branch mark for `change`, an issue-dot for `ticket`, an article mark for `article`) over the entity's **section-dot hue** (`change → 252`, `ticket → 295`, `article → 150`) composed through the theme-aware accent-pill tokens (`--accent-text-l` / `--accent-fill-a`). The "Waiting on you" lane SHALL use `EntityBadge` as each row's leading element so a PR and a ticket are distinguishable **immediately by shape and by colour** (the shape carries the meaning so the distinction survives colour-blindness). The badge SHALL hard-code no design values (it reads tokens only) and SHALL carry a catalog story. Glyphs SHALL come from the shared `Icon` set.

#### Scenario: A change lane row and a ticket lane row read as different entities

- **GIVEN** a "Waiting on you" lane holding one review-requested change and one assigned ticket
- **WHEN** the lane renders
- **THEN** the change row leads with the pull-request glyph on the change-blue (`252`) badge and the ticket row leads with the issue-dot glyph on the ticket-purple (`295`) badge

#### Scenario: EntityBadge carries a catalog story

- **WHEN** the catalog story-parity guard runs
- **THEN** a story exists at `apps/extension/catalog/stories/ui/EntityBadge.stories.svelte` covering the `change`, `ticket`, and `article` entities

