# smart-folders Specification

## Purpose

Live forge work items inside the pinned section. A smart folder is a third
`PinNode` kind persisting configuration only (`source` — GitLab or GitHub —
instance `baseUrl`, a canned `query`, `refreshMinutes`, `name`/`icon`); its
displayed children are ephemeral connector results held in the broadcast-only
`smartFolders` slice, never persisted. An alarms-driven background engine polls
on a per-folder cadence (plus sidebar-open and post-boot refresh kicks),
dispatching fetches through per-source connector modules behind the
`SourceConnector` contract — GitLab merge requests over the v4 REST API
(per-host PAT, else the browser's session cookies), GitHub pull requests over
the search API (token-only) — resolving failures calmly (`signed-out` /
`error` runtime states, never a red error card). Result rows are link-shaped —
favicon, title, at most one status dot — and activate via the existing
`openUrl` command. Folders are created and edited from the pinned-header menu
with a source picker; per-host tokens are managed in the options Connectors
section.
## Requirements
### Requirement: Smart-folder configuration persists as a pinned-tree node

A smart folder SHALL persist as a third `PinNode` kind in `pinnedBySpace`:
`{ kind: 'smart'; id: FolderId; name: string; icon: string; source: SmartSource; baseUrl: string; query: SmartQuery; refreshMinutes: number }`,
where `SmartQuery` is `'authored' | 'assigned' | 'review-requested'` and
`SmartSource` is `'gitlab' | 'github'` (widened from the v1 `'gitlab'` literal
by the `github-connector` change — the cause of the v2→v3 schema bump). The node
persists **configuration only** — it SHALL NOT carry a `children` field; results
are ephemeral runtime state (see Requirement: Smart-folder results are ephemeral
runtime state). `baseUrl` defaults per source (`https://gitlab.com` /
`https://github.com`) and SHALL be an
absolute http(s) URL: the SW SHALL strip any trailing slash on create/update and
SHALL throw (error ack) when the payload's `baseUrl` does not parse as an
absolute http(s) URL; the per-host PAT lookup key is `new URL(baseUrl).host`
(hostname plus any explicit port), and instances served under a subpath are
supported because every endpoint string-appends to `baseUrl` (the GitHub
connector's API-root derivation is specified in its own requirement).
`refreshMinutes` defaults to `10` with a floor of `5` (the SW SHALL clamp lower
values on create/update); `icon` is minted by the SW on create from the source
connector's `mintedIcon` — `'folder-git-2'` for both shipped sources (a lucide
glyph in the curated `ICON_NAMES` list in `shared/icon-names.ts`, with
`ui/icon-loaders.generated.ts` generated to match; lucide
ships no GitHub brand glyph, and the instance favicon on every result row
carries source identity) — persisted so a later change can expose it; the
editor does not. The smart node orders among pins exactly like
a `folder` node — it reorders by drag as one unit and round-trips `reorderPinned`
losslessly; its full drag/drop semantics (inert "onto" target, temporary-section
rejection) are specified in the `spaces-and-tabs` drag requirement — and its
expand/collapse state rides the existing per-window ephemeral folder-expansion
mechanism, keyed by node id.

#### Scenario: A smart folder survives restart as config only

- **WHEN** the SW boots with a persisted smart node in `pinnedBySpace`
- **THEN** the node is restored with its `source`, `baseUrl`, `query`, and `refreshMinutes` intact
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

### Requirement: Smart-folder results are ephemeral runtime state

Query results SHALL live in a broadcast-only `AppState` slice
`smartFolders: { [folderId]: SmartFolderRuntime }` where `SmartFolderRuntime` is
`{ state: 'pending' | 'ok' | 'signed-out' | 'error'; items: SmartFolderItem[]; fetchedAt: number | null }`
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
fetch lands.

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
`{ source: SmartSource; defaultBaseUrl: string; mintedIcon: string; fetchRuntime(node: Pick<SmartFolderNode, 'baseUrl' | 'query'>, caches?: ConnectorCaches): Promise<SmartFolderRuntime> }`.
`ConnectorCaches` (declared in `connector.ts`; the v1 `MeCache` renamed and
generalized) is a per-poll-cycle scratch map a connector MAY use, holding the
in-flight resolution promise per key (set synchronously before the first
await, so the engine's concurrent fan-out cannot race two same-host folders
into duplicate lookups): `refreshDueSmartFolders` SHALL construct one per
cycle and thread it through `startSmartFolderRefresh(deps, node, caches?)`,
so per-cycle resolutions (GitLab's `/api/v4/user`) happen once per cycle, not
once per folder; a manual/single refresh passes none and the fetch defaults
its own.
`fetchRuntime` SHALL be bounded and non-throwing — every failure shape resolves
to a runtime state, and every network request goes through the exported
`boundedFetch(url, init)` helper in `connector.ts` (the 20 s
`AbortSignal.timeout` wrapper ONLY — response interpretation stays per
connector). The
source-agnostic engine in `apps/extension/src/background/smart-folders.ts`
(scheduling, due-clocks, the in-flight guard, the state-request and post-boot
kicks, the `smartFolders.result` event plumbing) SHALL dispatch fetches through
a closed registry `CONNECTORS: Record<SmartSource, SourceConnector>` holding
exactly the shipped sources (`gitlab`, `github`) — no plug-in mechanism, no
speculative members; its `fetchSmartFolderRuntime(node, caches?)` entry point
widens its node parameter to `Pick<SmartFolderNode, 'source' | 'baseUrl' | 'query'>`
(dispatch needs the discriminant). The GitLab implementation
(`apps/extension/src/background/connectors/gitlab.ts`) is the existing engine
code relocated WITHOUT behaviour change: its fetch/normalize/auth unit tests
relocate alongside (`connectors/gitlab.test.ts`) with assertions unmodified —
only mechanical import-path and entry-point call-site changes are permitted.

#### Scenario: A fetch dispatches through the registry by source

- **WHEN** the engine refreshes a folder whose node carries `source: 'github'`
- **THEN** `CONNECTORS.github.fetchRuntime` performs the fetch and the result event reaches the drain exactly as a GitLab result does

#### Scenario: The GitLab relocation changes no behaviour

- **WHEN** the relocated GitLab connector's pre-existing unit tests run against `connectors/gitlab.ts`
- **THEN** they pass without assertion changes (import paths aside)

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

### Requirement: Smart-folder rendering and the one-glyph restraint

The sidebar SHALL render a smart node as a smart folder, implemented as the
feature component `apps/extension/src/sidebar/SmartFolder.svelte` composed by
`PinnedTabs.svelte`: a folder-style row composing the `ui/FolderRow.svelte`
primitive (extended for the smart row with an optional trailing badge, a
menu-items override, a `busy` flag that spins the glyph during an in-flight
refresh, pass-through forwarding of `RowMenu`'s `panel`/`panelTitle`
drill-in, and an optional **bindable `menuOpen`** pass-through of the kebab
menu's open state — the `SectionHeader` precedent — so a host can dismiss the
menu programmatically on editor confirm; unbound callers keep the prior
internal behavior unchanged. The smart row SHALL NOT re-roll the folder-row
chrome)
with the node's icon in the shared icon column, name in the title column, the
standard disclosure chevron in the leading gutter, and a trailing quiet
item-count badge (`20+` when the 20-item cap is hit), and — when expanded —
one row per result item at the folder-child inset. A result row SHALL be exactly: leading instance favicon, single-line
ellipsized title, and at most **one** trailing status dot painted from the
existing semantic tokens (`ok → --success`, `fail → --danger`,
`warn → --warning`, `pending → --info`) — identical at every tint level. The
full status phrase (pipeline state plus any secondary facts) SHALL live in the
row's `Tooltip` and ARIA label, never as additional visible glyphs or text —
colour SHALL NOT be the only carrier of the status meaning. Result rows are
activate-only: click dispatches the existing `openUrl { url, windowId }`; rows
SHALL NOT drag, reorder, rename, or close. The folder's kebab/right-click menu
SHALL carry **Refresh now**, **Edit…**, **Move up** / **Move down** (the
keyboard-reachable reorder pair every pinned row carries — disabled at the
respective end of the top-level list, dispatching the full-tree
`reorderPinned`), and **Delete** (no two-step confirm — deleting a smart folder
destroys only its own recreatable config and closes no tabs). Under `prefers-reduced-motion` the in-flight refresh indicator SHALL NOT
rotate (a static dimmed treatment) and item-set changes SHALL swap instantly
with an identical end state.

#### Scenario: A populated smart folder renders rows with one glyph each

- **GIVEN** a smart folder whose runtime is `ok` with items carrying `status` tones
- **WHEN** the folder is expanded
- **THEN** each row shows favicon + title + at most one status dot, with the full status text in the tooltip/ARIA label

#### Scenario: Activating a row opens the MR

- **WHEN** the user clicks a result row whose `url` is `https://gitlab.example.com/g/p/-/merge_requests/42`
- **THEN** the sidebar dispatches `openUrl` with that url and the window id
- **AND** no `SavedTab` record is created and no binding occurs

#### Scenario: The count badge reflects the cap honestly

- **WHEN** the runtime holds 20 items (a full page)
- **THEN** the folder badge renders `20+`
- **AND** with 7 items it renders `7`

### Requirement: Calm failure and pending states

A smart folder's non-`ok` runtime states SHALL render quietly, never as a red
error card: `signed-out` → a single muted row whose copy and activation are
**per source** — a GitLab folder renders "Sign in to ⟨host⟩" dispatching
`openUrl` with the folder's `baseUrl` (the next due poll heals after sign-in);
a GitHub folder renders "Add a token in Settings → Connectors" opening the
options page at its Connectors anchor via the sidebar's established options
deep-link (`openOptionsAt('#connectors')` from `sidebar/open-options.ts` —
App.svelte's helper extracted; NOT `openUrl`, whose handler's scheme hardening
deliberately drops non-http(s) URLs and stays untouched — there is no session
to sign in to, the fix is the token);
`error` → the last-known items remain rendered with one
dim note row ("Couldn't reach ⟨host⟩") at the list end; first-fetch `pending`
(no items yet) → three static low-alpha ghost rows (no shimmer, no strobe).
During a reload — including the post-SW-restart refetch, whose boot broadcast
carries an empty runtime slice — the sidebar SHALL keep rendering the folder's
last-shown items from component memory (held in the sidebar only, never
persisted), activatable throughout, with only the refresh indicator marking the
reload; ghost rows render only when nothing has ever been shown, and an honest
`ok`-empty result clears the hold (stale items are never resurrected). No
failure state SHALL produce a rejected command ack, a toast, or a notification.

#### Scenario: Signed-out shows the sign-in row

- **GIVEN** a GitLab folder on `gitlab.example.com` whose runtime is `signed-out`
- **WHEN** the folder is expanded
- **THEN** it renders one "Sign in to gitlab.example.com" row and no ghost/error rows
- **AND** activating it opens the instance via `openUrl`

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

### Requirement: Creation and configuration via the pinned-header menu

The pinned-section header kebab (`RowMenu`) SHALL carry a "New smart folder…"
entry alongside the existing "New folder". Both it and the smart folder's
**Edit…** menu entry SHALL drill their menu in place into a
`apps/extension/src/sidebar/SmartFolderEditor.svelte` panel (`RowMenu`'s
existing `panel`/`panelTitle` drill-in — back-arrow header; Edit… reaches it
through `FolderRow`'s forwarded panel, and the right-click `ContextMenu` path
drills into the same editor component) whose fields are: **source** (a
two-option control, GitLab | GitHub, ABOVE the base-URL field), instance base
URL (text, defaulting per source — `https://gitlab.com` / `https://github.com`
— with a source switch swapping the value whenever it currently equals either
source's canonical default, so an untouched create-mode field and an
on-default edit-mode folder both follow the switch while a custom/self-hosted
URL is never clobbered),
query (a three-option control for
`authored | assigned | review-requested`), refresh cadence (the enum 5 / 10 /
30 / 60 minutes), and name (text, auto-suggested per source from the chosen
query — e.g. `authored` suggests "My merge requests" for GitLab and "My pull
requests" for GitHub). Confirming
dispatches `createSmartFolder` (or `updateSmartFolder`), both carrying the
chosen `source`, and SHALL dismiss the **hosting menu entirely** — the header
kebab's morph in create mode, and the row kebab's `RowMenu` morph or the
right-click `ContextMenu` in edit mode — never merely the drill-in: the
editor's `onDone` contract is that the host closes its menu, with `FolderRow`
exposing its menu-open state as a bindable pass-through for this purpose
(outside-click and Escape dismissal are unchanged). The editor's token hint
is per source — GitLab: an access
token can optionally be added in Settings → Connectors; GitHub: a token is
required ("GitHub needs an access token — add one in Settings → Connectors").
A `baseUrl`, `query`, **or `source`** change on an existing folder SHALL
trigger an immediate refetch.

#### Scenario: Creating a review-requests folder from the header menu

- **WHEN** the user opens the pinned-header kebab, selects "New smart folder…", keeps the defaults, picks `review-requested`, and confirms
- **THEN** the sidebar dispatches `createSmartFolder` with the panel's values (including `source`)
- **AND** the new folder appears in the pinned tree and begins its first fetch

#### Scenario: Confirming the editor dismisses the hosting menu on every path

- **GIVEN** an existing smart folder whose kebab menu is drilled into Edit…
- **WHEN** the user confirms with Save
- **THEN** `updateSmartFolder` is dispatched and the menu closes entirely — no action list remains open
- **AND** confirming via the right-click `ContextMenu` path closes that menu entirely too
- **AND** confirming "Add smart folder" in create mode closes the header kebab's morph (the shipped behavior, unchanged)

#### Scenario: Picking GitHub swaps the defaults

- **WHEN** the user opens "New smart folder…" and switches the source to GitHub without having touched the URL or name fields
- **THEN** the base URL reads `https://github.com` and the suggested name follows GitHub's vocabulary
- **AND** the hint states that GitHub needs an access token in Settings → Connectors

#### Scenario: Editing the query refetches immediately

- **GIVEN** an existing smart folder with `query: 'assigned'`
- **WHEN** the user edits it to `review-requested` and confirms
- **THEN** `updateSmartFolder` is dispatched and the folder refetches without waiting for its cadence

#### Scenario: Editing the source refetches immediately

- **GIVEN** an existing `gitlab` folder
- **WHEN** the user edits its source to GitHub and confirms
- **THEN** `updateSmartFolder` carries `source: 'github'` and the folder refetches without waiting for its cadence

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
