# connector-accounts Specification

## Purpose
TBD - created by archiving change decouple-source-accounts. Update Purpose after archive.
## Requirements
### Requirement: A connected Account is a first-class persisted entity

Lunma SHALL persist connected **Accounts** as a top-level `AppState.sources` map,
`{ [id: SourceId]: SourceAccount }`, where
`SourceAccount = { id: SourceId; provider: LensProvider; baseUrl: string; name?: string }`
and `SourceId = string`. The `SourceAccount` SHALL carry **no secret** — the access
token lives only in the separate secrets store (see Requirement: Per-source tokens
are kept out of broadcast) — so the account record is safe to include in `AppState`
and the state broadcast. A lens references accounts by `id` (see the `lenses`
capability), making the lens↔source relationship many-to-many: one account MAY feed
many lenses and one lens MAY reference many accounts.

`baseUrl` SHALL be a normalized absolute http(s) URL (trailing slash stripped),
validated at the create/update boundary. Two accounts MAY share a `baseUrl`/host
(e.g. a personal and a work `github.com`); they are distinguished by `id`.

#### Scenario: An account persists and round-trips

- **WHEN** an account `{ id: 'acc-1', provider: 'github', baseUrl: 'https://github.com', name: 'Work' }` is stored and the SW restarts
- **THEN** `AppState.sources['acc-1']` is restored intact and validates under the current-version schema
- **AND** the record carries no token field

#### Scenario: Two accounts may share a host

- **WHEN** two accounts both carry `baseUrl: 'https://github.com'` with distinct ids
- **THEN** both persist and are addressable independently by `id`

### Requirement: Per-source tokens are kept out of broadcast

Connector access tokens SHALL be stored in the `lunma.connectors` record in
`chrome.storage.local` keyed by **`sourceId`** (`{ [sourceId: SourceId]: string }`),
read via `readAccountTokens()` and written via
`setAccountToken(sourceId: SourceId, token: string | null)` in
`apps/extension/src/shared/connectors.ts`. Tokens SHALL NEVER be stored in
`chrome.storage.sync`, SHALL NEVER appear in `AppState` or any state broadcast, SHALL
NEVER be logged, and SHALL NEVER be echoed back to a surface (a surface reads only
token *presence* for an account, never the value). Any surface MAY call
`setAccountToken` directly (it is a `shared/` helper, DAG-legal for every surface, as
the Options page already does) — the token write does NOT go through the message bus.

#### Scenario: A token is keyed by source, not host

- **WHEN** `setAccountToken('acc-1', 'ghp-x')` is called for one of two `github.com` accounts
- **THEN** only `acc-1`'s token is set; the other `github.com` account remains tokenless

#### Scenario: A token never reaches a broadcast or a log

- **WHEN** the SW broadcasts `AppState` after a token is set
- **THEN** the broadcast carries no token material and `AppState.sources` exposes none
- **AND** no log line contains the token value

### Requirement: Providers declare their auth methods; the effective method is derived

The `SourceConnector` contract SHALL declare `readonly authMethods: AuthMethod[]`,
where `type AuthMethod = 'session' | 'pat'`. The shipped declarations SHALL be:
`github: ['pat']`, `gitlab: ['session', 'pat']`, `jira: ['session']`, `rss: []`.

The **effective auth method** for an account SHALL be **derived** (never stored on the
account) by this precedence:
1. the provider declares no methods (`rss`) → `public` (no auth, always ready);
2. a per-source token exists for the account → `pat` (a token always wins);
3. the provider declares `session` → `session` (rides the browser sign-in — the
   **zero-config default**, requiring no token to start);
4. otherwise (the provider is `pat`-only with no token) → `needs-token`.

The connector SHALL apply the same precedence at fetch time, and a surface SHALL
compute the same value from `connector.authMethods` plus token-presence to render the
account's status. A session-capable account (gitlab/jira) SHALL therefore be usable
the moment it is added, with no token step.

The derived **method** maps to the account's display **status** (the `AccountChip`
vocabulary) as: `pat` → `connected`; `session` → `browser-session`; `public` →
`public`; `needs-token` → `needs-token`. A runtime `signed-out` (a poll that failed to
authenticate) overrides the config-time status to `signed-out`, surfacing the reconnect
affordance. This mapping is the single source of truth shared by the connector, the
status derivation, and the `AccountChip`.

#### Scenario: A GitLab account is ready with no token

- **GIVEN** a new `gitlab` account with no token
- **WHEN** its effective method is derived
- **THEN** it SHALL be `session` and the account renders as ready (browser session), with no token requested

#### Scenario: A GitHub account with no token needs one

- **GIVEN** a new `github` account with no token
- **WHEN** its effective method is derived
- **THEN** it SHALL be `needs-token` (no `session` method to fall back on)

#### Scenario: A token always wins over session

- **GIVEN** a `gitlab` account that has a token
- **WHEN** the connector authenticates
- **THEN** it SHALL send the token (`pat`), not ride the browser session

#### Scenario: An RSS account needs no auth

- **GIVEN** an `rss` account
- **WHEN** its effective method is derived
- **THEN** it SHALL be `public` and never request a token

### Requirement: Account lifecycle is mutated over the bus with client-minted ids

Because `AppState.sources` is single-writer state, account create/rename/delete SHALL
be driven by the message bus commands `createAccount`, `renameAccount`, and
`deleteAccount`. The `createAccount` payload SHALL carry a **client-minted**
`id: SourceId` (a UUID generated on the surface), the `provider`, the `baseUrl`, and
an optional `name`; the SW SHALL validate the `baseUrl` and reject a duplicate `id`.
Client-minting lets a surface reference the new account's id inline (e.g. in a
following `createLens`) without awaiting a value through the `void` ack.

Setting the account's token is a separate direct `setAccountToken` write (not a bus
command — the token is not `AppState`). Disconnecting an account SHALL both
`deleteAccount` (entity) and `setAccountToken(id, null)` (secret).

#### Scenario: Creating an account persists the entity

- **WHEN** `createAccount` is dispatched with `{ id: 'acc-1', provider: 'github', baseUrl: 'https://github.com/' }`
- **THEN** `AppState.sources['acc-1']` SHALL be stored with `baseUrl` normalized to `https://github.com`
- **AND** a dispatch whose `id` already exists SHALL be rejected with an error ack

#### Scenario: Disconnecting clears the entity and the secret

- **WHEN** the user disconnects account `acc-1`
- **THEN** `deleteAccount` removes `AppState.sources['acc-1']` AND `setAccountToken('acc-1', null)` clears its token

### Requirement: The inline connect affordance is reusable and method-aware

A reusable connect affordance SHALL let a user provide an account's token in place,
without navigating to the options page. It SHALL reuse a `ui/` primitive composing
`TextInput type="password"` and SHALL appear in the shared **Service-dropdown connect
picker** (used by both the lens editor and the Connections manager — see `Connecting a
service is a single Service-dropdown picker`), and in a lens's `signed-out` section (as
an inline "Reconnect {host}"). It SHALL be **method-aware**: for a `session`-capable
provider the token field SHALL be framed as an optional upgrade ("add a token"); for a
`pat`-only provider the token SHALL be required to reach a ready state. The affordance
SHALL request a token only when the derived status is `needs-token`, or when a
session-capable account has resolved to `signed-out` at runtime. On a successful
write from a `signed-out` lens section, the surface SHALL dispatch `refreshLens` so the
section re-fetches without navigation. A stored token SHALL render as a
"Token set · Replace" control and SHALL NOT echo the value.

#### Scenario: Reconnecting a signed-out section fills it in place

- **GIVEN** a GitHub lens section in `state: 'signed-out'`
- **WHEN** the user enters a token in the inline reconnect affordance and confirms
- **THEN** `setAccountToken` writes the token AND `refreshLens` is dispatched
- **AND** the section re-fetches and renders its rows without any navigation

#### Scenario: A session-capable account shows no required field

- **GIVEN** a `gitlab` account being added
- **WHEN** the connect affordance renders
- **THEN** the token field is an optional "add a token" upgrade, not a required step

### Requirement: A Source is an Account or a Feed

A lens **Source** SHALL be one of two KINDS, persisted uniformly as `SourceAccount` in
`AppState.sources` and referenced uniformly by `LensSourceRef`, but **presented and
managed distinctly within one Connections surface**:

- an **Account** — a connected identity with derived auth: `github`, `gitlab`, or
  `jira` (`ACCOUNT_PROVIDERS`). Managed in the **Accounts** group of the Options
  **Connections** manager; added via the shared Service-dropdown connect picker.
- a **Feed** — a public RSS subscription (`rss`): a URL with no auth. Managed in the
  **Feeds** group of the Options **Connections** manager (per-feed rows, plus OPML
  import/export — see the `opml-import-export` capability); added via the same connect
  picker (RSS feed branch).

A single lens MAY include both Accounts and Feeds (see the `lenses` capability). The
shared `isFeedProvider(provider)` (`provider === 'rss'`) is the single discriminator,
and decides which group a source renders in. The `AccountChip` renders an auth status
only for Accounts; a Feed shows just its provider glyph + identity (no status pip).

#### Scenario: Accounts and feeds render in their respective groups

- **WHEN** the Connections manager renders
- **THEN** github/gitlab/jira sources SHALL appear in the **Accounts** group and rss sources in the **Feeds** group — never the reverse

### Requirement: The options page manages accounts and shows their reach

The options page SHALL present a single **Connections** manager (anchor `#connectors`,
retained so existing deep-links resolve) composed of an **Accounts** group and a
**Feeds** group, replacing the prior separate Connectors and Feed-subscriptions cards.
The Accounts group SHALL list every connected **Account** (auth providers — rss is in
the Feeds group) with its provider, host/name, derived status, and its **reach**; the
Feeds group SHALL list every **Feed** with its name, URL, and reach. **Reach** SHALL be
the count of distinct lens nodes — across **every** `pinnedBySpace[*]` (all Spaces, not
the active one) — whose `sources[].sourceId` includes the source's id; computing reach
requires the options page to read `pinnedBySpace`. A single **"+ Connect"** affordance
SHALL open the shared Service-dropdown connect picker. Each row SHALL expose its
lifecycle via a per-row `⋯` menu: for an Account, replace/add token, rename, and
disconnect; for a Feed, rename, copy URL, and remove (rename/remove reuse the existing
`renameAccount`/`deleteAccount` lifecycle, since a Feed is a `SourceAccount`).
Disconnecting or removing a source whose reach is greater than zero SHALL warn the user
before proceeding. The token value SHALL never be displayed.

#### Scenario: The Accounts group lists accounts with reach

- **GIVEN** an account referenced by three lenses
- **WHEN** the Connections manager renders
- **THEN** the account row shows its identity, derived status, and "feeds 3 lenses" in the Accounts group

#### Scenario: The Feeds group lists per-feed rows

- **GIVEN** two connected rss feeds
- **WHEN** the Connections manager renders
- **THEN** the Feeds group shows one row per feed with its name, URL, and reach, each with a `⋯` menu offering Rename / Copy URL / Remove

#### Scenario: Disconnecting an in-use source warns first

- **WHEN** the user disconnects an account (or removes a feed) that still feeds at least one lens
- **THEN** a warning SHALL be shown before it proceeds

### Requirement: A v12→v13 migration extracts accounts and re-keys tokens

The schema migration to version 13 SHALL, for every lens node's embedded
`sources: LensSource[]`, mint one `SourceAccount` per distinct `(provider, baseUrl)`
pair across all lenses (de-duplicated), move any source `name` onto the account, add
them to `AppState.sources`, and rewrite each lens's `sources` to
`LensSourceRef[]` (`{ sourceId, queries }`). Because the secrets store lives under a
separate, unversioned `chrome.storage.local` key, a one-time boot step
`reconcileAccountSecrets` SHALL move each legacy **host**-keyed token in
`lunma.connectors` onto the `sourceId` of the account whose `baseUrl` derives to that
host (using the **same** host derivation the connectors use — `new URL(baseUrl).host`).
For the **zero-match** case — a legacy host token for which no account exists (a token
the user added in Options for a host they never built a lens on, so the migration minted
no account) — the step SHALL **leave the entry under its host key untouched** (never
drop a token); such an orphan binds to an account the next time one is created on that
host. For the **multi-match** case — were two accounts ever to derive to the same host
(not produced by this migration, which mints exactly one account per host, but possible
for hand-seeded data) — the step SHALL assign the legacy token to the **first** matching
account by stable id order and leave the rest tokenless. A key already equal to a known
`sourceId` SHALL be left as-is. The reconcile SHALL be idempotent and SHALL log at
`debug` without token material.

#### Scenario: An embedded source becomes an account a lens references

- **GIVEN** a v12 lens with `sources: [{ source: 'github', baseUrl: 'https://github.com', queries: ['authored'] }]`
- **WHEN** the v13 migration runs
- **THEN** `AppState.sources` gains a `github`/`github.com` account and the lens's source becomes `{ sourceId: <that id>, queries: ['authored'] }`

#### Scenario: A host-keyed token re-keys onto its account

- **GIVEN** a legacy `lunma.connectors` record `{ 'github.com': 'ghp-x' }` and a v13 account on `github.com` with id `acc-1`
- **WHEN** `reconcileAccountSecrets` runs at boot
- **THEN** the secrets record becomes `{ 'acc-1': 'ghp-x' }` and the `github.com` host key is removed
- **AND** running it again is a no-op

#### Scenario: An orphaned host token is left untouched

- **GIVEN** a legacy `lunma.connectors` record `{ 'ghe.example.com': 'ghp-y' }` for a host no lens (and thus no minted account) references
- **WHEN** `reconcileAccountSecrets` runs
- **THEN** the `ghe.example.com` token is left under its host key (never dropped), and binds to an account the next time one is created on that host

### Requirement: Connecting a service is a single Service-dropdown picker

Connecting a new source SHALL be a single **Service-dropdown picker**
(`apps/extension/src/ui/ServiceConnectPicker.svelte`, a cross-surface `ui/`
primitive), shared by the Options Connections manager and the lens editor. It SHALL present a **Service** `Select`
whose options are `GitHub`, `GitLab`, `Jira`, and `RSS feed`, and SHALL show the
provider-appropriate fields for the chosen service: for an account service, a host field
(with the per-provider placeholder) and the method-aware inline connect affordance
(token required for a `pat`-only provider, optional for a session-capable one); for the
RSS feed service, a feed-URL field only (no host, no token). Committing SHALL mint the
source via `createAccount` (client-minted id) and, for an account with a token, write it
via `setAccountToken`. The RSS feed branch SHALL additionally offer **OPML import** as
the bulk feed-add path (see the `opml-import-export` capability), in one of two host-set
**modes**: when the host passes target `spaces` (the Options Connections manager) the
confirm step picks a Space and dispatches `importOpml` (one standalone feed-folder lens);
when the host passes an **`onImportFeeds`** callback (the lens editor) the confirm step
hands the valid parsed feeds to that callback — to add them **into the lens being
assembled** — instead of dispatching `importOpml`, so no separate lens is spawned.
`onImportFeeds` takes precedence over the `spaces` path; when neither is given the RSS
branch hides the OPML option. The picker SHALL replace the prior always-visible
per-provider connect form.

#### Scenario: Selecting a service shows its fields

- **WHEN** the user opens the connect picker and selects "GitLab"
- **THEN** a host field and an optional "add a token" field are shown (session-capable), and committing mints a gitlab `SourceAccount`
- **AND WHEN** the user instead selects "RSS feed", only a feed-URL field is shown, with an "Import OPML" bulk option

#### Scenario: The picker is shared by editor and manager

- **WHEN** the user opens "+ Connect a service" in the lens editor or "+ Connect" in the Connections manager
- **THEN** both surfaces present the same Service-dropdown picker and mint sources via the same `createAccount`/`setAccountToken` path

#### Scenario: OPML import mode follows the host surface

- **WHEN** the user chooses "Import OPML" in the Connections manager (host passed `spaces`) and confirms
- **THEN** the confirm step picks a target Space and dispatches `importOpml` (one standalone feed-folder lens)
- **AND WHEN** the user chooses "Import OPML" in the lens editor (host passed `onImportFeeds`) and confirms
- **THEN** the confirm step shows no Space picker and calls `onImportFeeds` with the valid feeds — adding them into the lens being assembled — and does NOT dispatch `importOpml`

