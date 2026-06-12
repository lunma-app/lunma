## ADDED Requirements

### Requirement: Smart-folder configuration persists as a pinned-tree node

A smart folder SHALL persist as a third `PinNode` kind in `pinnedBySpace`:
`{ kind: 'smart'; id: FolderId; name: string; icon: string; source: 'gitlab'; baseUrl: string; query: SmartQuery; refreshMinutes: number }`,
where `SmartQuery` is `'authored' | 'assigned' | 'review-requested'`. The node
persists **configuration only** — it SHALL NOT carry a `children` field; results
are ephemeral runtime state (see Requirement: Smart-folder results are ephemeral
runtime state). `baseUrl` defaults to `https://gitlab.com` and SHALL be an
absolute http(s) URL: the SW SHALL strip any trailing slash on create/update and
SHALL throw (error ack) when the payload's `baseUrl` does not parse as an
absolute http(s) URL; the per-host PAT lookup key is `new URL(baseUrl).host`
(hostname plus any explicit port), and instances served under a subpath are
supported because every endpoint string-appends to `baseUrl`. `refreshMinutes`
defaults to `10` with a floor of `5` (the SW SHALL clamp lower values on
create/update); `source` is `'gitlab'` in v1 (the only admitted value); `icon` is
minted by the SW as `'folder-git-2'` on create — a lucide glyph this change adds
to the curated `ICON_NAMES` list in `shared/icon-names.ts` (with
`ui/icon-loaders.generated.ts` regenerated) — persisted so a later change can
expose it; the v1 editor does not. The smart node orders among pins exactly like
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

For a folder's instance host, the connector SHALL authenticate per request: (1)
when a token for that host exists in the `lunma.connectors` record, send
`Authorization: Bearer <token>` with `credentials: 'omit'`; (2) otherwise fetch
with `credentials: 'include'` so the browser's existing session cookies ride
along (the manifest's `host_permissions: <all_urls>` already exempts these
requests from CORS and SameSite — no manifest change, no `cookies` permission).
Tokens SHALL be stored only in `chrome.storage.local` (NEVER `storage.sync`),
SHALL never appear in logs, and SHALL never be included in any state broadcast.
Signed-out detection SHALL be response-shape-based and non-throwing: a `401`, a
redirect landing on a non-JSON document, or any non-JSON body SHALL resolve the
runtime to `state: 'signed-out'`; network errors, timeouts, and 5xx/429 resolve
to `state: 'error'`. Every connector request SHALL carry a bounded timeout
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
- **WHEN** the connector polls
- **THEN** the request is sent with `credentials: 'include'` and no Authorization header

#### Scenario: A login redirect resolves to signed-out, calmly

- **WHEN** a cookie-authenticated poll receives a redirect to an HTML sign-in page
- **THEN** the runtime becomes `state: 'signed-out'` with no exception thrown and no error ack anywhere

#### Scenario: A hung connection resolves bounded, never an eternal pending

- **WHEN** a poll's request hangs (e.g. a dropped VPN to a self-hosted instance)
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

### Requirement: Smart-folder rendering and the one-glyph restraint

The sidebar SHALL render a smart node as a smart folder, implemented as the
feature component `apps/extension/src/sidebar/SmartFolder.svelte` composed by
`PinnedTabs.svelte`: a folder-style row composing the `ui/FolderRow.svelte`
primitive (extended in this change with an optional trailing badge, a
menu-items override, a `busy` flag that spins the glyph during an in-flight
refresh, and pass-through forwarding of `RowMenu`'s `panel`/`panelTitle`
drill-in — the smart row SHALL NOT re-roll the folder-row chrome)
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
error card: `signed-out` → a single muted row "Sign in to ⟨host⟩" whose
activation dispatches `openUrl` with the folder's `baseUrl` (the next due poll
heals after sign-in); `error` → the last-known items remain rendered with one
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

- **GIVEN** a folder on `gitlab.example.com` whose runtime is `signed-out`
- **WHEN** the folder is expanded
- **THEN** it renders one "Sign in to gitlab.example.com" row and no ghost/error rows
- **AND** activating it opens the instance via `openUrl`

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
drills into the same editor component) whose fields are: instance base
URL (text, default `https://gitlab.com`), query (a three-option control for
`authored | assigned | review-requested`), refresh cadence (the enum 5 / 10 /
30 / 60 minutes), and name (text, auto-suggested from the chosen query). The
source is fixed to GitLab in v1 and SHALL NOT render as a choice. Confirming
dispatches `createSmartFolder` (or `updateSmartFolder`); the editor SHALL hint
that an access token can optionally be added in Settings → Connectors. A
`baseUrl` or `query` change on an existing folder SHALL trigger an immediate
refetch.

#### Scenario: Creating a review-requests folder from the header menu

- **WHEN** the user opens the pinned-header kebab, selects "New smart folder…", keeps the defaults, picks `review-requested`, and confirms
- **THEN** the sidebar dispatches `createSmartFolder` with the panel's values
- **AND** the new folder appears in the pinned tree and begins its first fetch

#### Scenario: Editing the query refetches immediately

- **GIVEN** an existing smart folder with `query: 'assigned'`
- **WHEN** the user edits it to `review-requested` and confirms
- **THEN** `updateSmartFolder` is dispatched and the folder refetches without waiting for its cadence

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
