## MODIFIED Requirements

### Requirement: A connected Account is a first-class persisted entity

Lunma SHALL persist connected **Accounts** as a top-level `AppState.sources` map,
`{ [id: SourceId]: SourceAccount }`, where
`SourceAccount = { id: SourceId; provider: LensProvider; baseUrl: string; name?: string; workspace?: string }`
and `SourceId = string`. The `SourceAccount` SHALL carry **no secret** — the access
token lives only in the separate secrets store (see Requirement: Per-source tokens
are kept out of broadcast) — so the account record is safe to include in `AppState`
and the state broadcast. A lens references accounts by `id` (see the `lenses`
capability), making the lens↔source relationship many-to-many: one account MAY feed
many lenses and one lens MAY reference many accounts.

`baseUrl` SHALL be a normalized absolute http(s) URL (trailing slash stripped),
validated at the create/update boundary. Two accounts MAY share a `baseUrl`/host
(e.g. a personal and a work `github.com`); they are distinguished by `id`.

The optional `workspace?: string` field carries a Bitbucket Cloud **workspace slug**.
It SHALL be **required** when `provider === 'bitbucket'` and the `baseUrl` host is
`bitbucket.org` (a Cloud bitbucket PR query is workspace-scoped — see the `lenses`
capability), **absent** for every other provider and for a self-hosted (Server / Data
Center) bitbucket account, and validated at the create/update boundary. One account
binds to exactly one workspace; a user in several Cloud workspaces adds several
accounts.

#### Scenario: An account persists and round-trips

- **WHEN** an account `{ id: 'acc-1', provider: 'github', baseUrl: 'https://github.com', name: 'Work' }` is stored and the SW restarts
- **THEN** `AppState.sources['acc-1']` is restored intact and validates under the current-version schema
- **AND** the record carries no token field

#### Scenario: A Cloud bitbucket account carries a workspace

- **WHEN** an account `{ id: 'acc-bb', provider: 'bitbucket', baseUrl: 'https://bitbucket.org', workspace: 'acme' }` is stored and the SW restarts
- **THEN** `AppState.sources['acc-bb']` is restored with `workspace: 'acme'` intact
- **AND** a Cloud bitbucket account created **without** a `workspace` SHALL be rejected at the create boundary

#### Scenario: Two accounts may share a host

- **WHEN** two accounts both carry `baseUrl: 'https://github.com'` with distinct ids
- **THEN** both persist and are addressable independently by `id`

### Requirement: Account lifecycle is mutated over the bus with client-minted ids

Because `AppState.sources` is single-writer state, account create/rename/delete SHALL
be driven by the message bus commands `createAccount`, `renameAccount`, and
`deleteAccount`. The `createAccount` payload SHALL carry a **client-minted**
`id: SourceId` (a UUID generated on the surface), the `provider`, the `baseUrl`, an
optional `name`, and an optional `workspace` (the Cloud bitbucket workspace slug); the
SW SHALL validate the `baseUrl`, reject a duplicate `id`, and reject a Cloud bitbucket
payload missing `workspace`. Client-minting lets a surface reference the new account's
id inline (e.g. in a following `createLens`) without awaiting a value through the `void`
ack.

Setting the account's token is a separate direct `setAccountToken` write (not a bus
command — the token is not `AppState`). Disconnecting an account SHALL both
`deleteAccount` (entity) and `setAccountToken(id, null)` (secret).

#### Scenario: Creating an account persists the entity

- **WHEN** `createAccount` is dispatched with `{ id: 'acc-1', provider: 'github', baseUrl: 'https://github.com/' }`
- **THEN** `AppState.sources['acc-1']` SHALL be stored with `baseUrl` normalized to `https://github.com`
- **AND** a dispatch whose `id` already exists SHALL be rejected with an error ack

#### Scenario: Creating a Cloud bitbucket account requires a workspace

- **WHEN** `createAccount` is dispatched with `{ id: 'acc-bb', provider: 'bitbucket', baseUrl: 'https://bitbucket.org' }` and no `workspace`
- **THEN** the SW SHALL reject it with an error ack
- **AND WHEN** the same payload carries `workspace: 'acme'`, the account SHALL persist

#### Scenario: Disconnecting clears the entity and the secret

- **WHEN** the user disconnects account `acc-1`
- **THEN** `deleteAccount` removes `AppState.sources['acc-1']` AND `setAccountToken('acc-1', null)` clears its token

### Requirement: Providers declare their auth methods; the effective method is derived

The `SourceConnector` contract SHALL declare `readonly authMethods: AuthMethod[]`,
where `type AuthMethod = 'session' | 'pat'`. The shipped declarations SHALL be:
`github: ['pat']`, `gitlab: ['session', 'pat']`, `bitbucket: ['pat']`,
`jira: ['session']`, `rss: []`.

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
the moment it is added, with no token step. `bitbucket`, declaring only `['pat']`, has
no `session` rung — its Cloud API lives on `api.bitbucket.org`, a host distinct from
the `bitbucket.org` browser session, so a cookie ride is impossible; it therefore
behaves like `github` (a missing token resolves to `needs-token`).

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

#### Scenario: A Bitbucket account with no token needs one

- **GIVEN** a new `bitbucket` account with no token
- **WHEN** its effective method is derived
- **THEN** it SHALL be `needs-token` (`bitbucket.authMethods` is `['pat']`, no `session` rung)

#### Scenario: A token always wins over session

- **GIVEN** a `gitlab` account that has a token
- **WHEN** the connector authenticates
- **THEN** it SHALL send the token (`pat`), not ride the browser session

#### Scenario: An RSS account needs no auth

- **GIVEN** an `rss` account
- **WHEN** its effective method is derived
- **THEN** it SHALL be `public` and never request a token

### Requirement: A Source is an Account or a Feed

A lens **Source** SHALL be one of two KINDS, persisted uniformly as `SourceAccount` in
`AppState.sources` and referenced uniformly by `LensSourceRef`, but **presented and
managed distinctly within one Connections surface**:

- an **Account** — a connected identity with derived auth: `github`, `gitlab`,
  `bitbucket`, or `jira` (`ACCOUNT_PROVIDERS`). Managed in the **Accounts** group of
  the Options **Connections** manager; added via the shared Service-dropdown connect
  picker.
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
- **THEN** github/gitlab/bitbucket/jira sources SHALL appear in the **Accounts** group and rss sources in the **Feeds** group — never the reverse

### Requirement: Connecting a service is a single Service-dropdown picker

Connecting a new source SHALL be a single **Service-dropdown picker**
(`apps/extension/src/ui/ServiceConnectPicker.svelte`, a cross-surface `ui/`
primitive), shared by the Options Connections manager and the lens editor. It SHALL
present a **Service** `Select` whose options are `GitHub`, `GitLab`, `Bitbucket`,
`Jira`, and `RSS feed` (in that order), and SHALL show the provider-appropriate fields
for the chosen service: for an account service, a host field (with the per-provider
placeholder) and the method-aware inline connect affordance (token required for a
`pat`-only provider — `github` and `bitbucket` — optional for a session-capable one);
for the RSS feed service, a feed-URL field only (no host, no token). When the chosen
service is `Bitbucket` **and** the host field resolves to `bitbucket.org` (Cloud), the
picker SHALL additionally show a **required `workspace` field** (the Cloud workspace
slug); for a self-hosted bitbucket host the workspace field SHALL be hidden.
Committing SHALL mint the source via `createAccount` (client-minted id, carrying
`workspace` for a Cloud bitbucket account) and, for an account with a token, write it
via `setAccountToken`. The RSS feed branch SHALL additionally offer **OPML import** as
the bulk feed-add path (see the `opml-import-export` capability), in one of two host-set
**modes**: when the host passes target `spaces` (the Options Connections manager) the
confirm step picks a Space and dispatches `importOpml` (one standalone feed-folder
lens); when the host passes an **`onImportFeeds`** callback (the lens editor) the
confirm step hands the valid parsed feeds to that callback — to add them **into the lens
being assembled** — instead of dispatching `importOpml`, so no separate lens is spawned.
`onImportFeeds` takes precedence over the `spaces` path; when neither is given the RSS
branch hides the OPML option. The picker SHALL replace the prior always-visible
per-provider connect form.

#### Scenario: Selecting a service shows its fields

- **WHEN** the user opens the connect picker and selects "GitLab"
- **THEN** a host field and an optional "add a token" field are shown (session-capable), and committing mints a gitlab `SourceAccount`
- **AND WHEN** the user instead selects "RSS feed", only a feed-URL field is shown, with an "Import OPML" bulk option

#### Scenario: Selecting Bitbucket Cloud shows a required token and workspace field

- **WHEN** the user selects "Bitbucket" and the host field is `https://bitbucket.org`
- **THEN** a **required** Bearer-token field and a **required** `workspace` field are shown (pat-only, framed like GitHub), and committing mints a `bitbucket` `SourceAccount` carrying the `workspace`

#### Scenario: Selecting self-hosted Bitbucket hides the workspace field

- **WHEN** the user selects "Bitbucket" and the host field is a self-hosted URL (not `bitbucket.org`)
- **THEN** only a host field and a required token field are shown (no `workspace` field), and committing mints a `bitbucket` `SourceAccount` with no `workspace`

#### Scenario: The picker is shared by editor and manager

- **WHEN** the user opens "+ Connect a service" in the lens editor or "+ Connect" in the Connections manager
- **THEN** both surfaces present the same Service-dropdown picker and mint sources via the same `createAccount`/`setAccountToken` path

#### Scenario: OPML import mode follows the host surface

- **WHEN** the user chooses "Import OPML" in the Connections manager (host passed `spaces`) and confirms
- **THEN** the confirm step picks a target Space and dispatches `importOpml` (one standalone feed-folder lens)
- **AND WHEN** the user chooses "Import OPML" in the lens editor (host passed `onImportFeeds`) and confirms
- **THEN** the confirm step shows no Space picker and calls `onImportFeeds` with the valid feeds — adding them into the lens being assembled — and does NOT dispatch `importOpml`
