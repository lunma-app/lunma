## MODIFIED Requirements

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

`LensProvider` (`'gitlab' | 'github' | 'jira' | 'rss'`) and `LensQuery`
(`'authored' | 'assigned' | 'review-requested'`) are unchanged. A **queue** account
(gitlab/github/jira) reference SHALL carry a **non-empty** `queries` array; a **feed**
account (rss) reference SHALL carry `queries: []`. The SW SHALL throw on create/update
when any `sourceId` does not resolve to an existing account, when a queue reference's
`queries` is empty, or when an rss reference's `queries` is non-empty.

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

### Requirement: Connector implementations conform to the SourceConnector contract

The `SourceConnector` interface in `background/connectors/connector.ts` SHALL remain
**shape-stable** in `fetchRuntime`'s arity:
`fetchRuntime(cfg: ResolvedLensSource, maxItems: number, caches?: ConnectorCaches): Promise<LensSectionRuntime>`,
where `ResolvedLensSource` is
`{ source: LensProvider; baseUrl: string; query?: LensQuery; name?: string; lensKind: LensKind; sourceId: SourceId }`
(the engine expands `queries[]` before dispatch; `lensKind` from the owning lens;
`sourceId` from the referenced account, used for the per-source token lookup).
`listingUrl`, `requiredOrigins`, `defaultBaseUrl`, and `mintedIcon` accept the same
resolved config. The contract SHALL additionally declare
`readonly authMethods: AuthMethod[]` (`AuthMethod = 'session' | 'pat'`) — see the
`connector-accounts` capability — so the engine and surfaces can derive an account's
effective method.

The engine's `fetchLensSectionRuntime(cfg, maxItems, caches?)` dispatches to
`CONNECTORS[cfg.source].fetchRuntime(cfg, maxItems, caches)`. The
`resolvedConfigs(node): ResolvedLensSource[]` helper resolves each `LensSourceRef`
against `AppState.sources` and performs the `× queries[]` expansion, stamping
`sourceId`, `lensKind`, and the account's `source`/`baseUrl`/`name?`; it is the single
derivation used by the engine fan-out, the origin union, and the editor preview.

#### Scenario: A fetch dispatches through the registry by resolved config

- **WHEN** the engine refreshes a section whose resolved config carries `source: 'gitlab', query: 'authored', sourceId: 'acc-1'`
- **THEN** `CONNECTORS.gitlab.fetchRuntime(cfg, maxItems, caches)` performs the fetch and looks the token up by `cfg.sourceId`

#### Scenario: Each connector declares its auth methods

- **WHEN** the `CONNECTORS` registry is inspected
- **THEN** `github.authMethods` is `['pat']`, `gitlab.authMethods` is `['session', 'pat']`, `jira.authMethods` is `['session']`, and `rss.authMethods` is `[]`

#### Scenario: The registry holds exactly the four shipped sources

- **WHEN** the `CONNECTORS` registry is inspected
- **THEN** its keys are exactly `gitlab`, `github`, `jira`, and `rss`

#### Scenario: The resolved config carries the lens kind and source id

- **WHEN** `resolvedConfigs(node)` expands a lens whose `lensKind` is `'review'` referencing account `acc-1`
- **THEN** every resolved config it produces carries `lensKind: 'review'` and `sourceId: 'acc-1'`, so the connector can gate `change` enrichment and look up the per-source token

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

The `LensEditor.svelte` SHALL render, top to bottom: a **Name** field; a **Kind**
picker (per the `A lens carries a kind` requirement); a **Sources** list that is
**account assembly** (not a URL form); the lens settings (**Show** max-items and
**Refresh** cadence); and a single primary action — **Create** / **Save** — with
**Cancel** and the validation hint. The Sources list SHALL be height-bounded and
scroll independently while Name/Kind stay pinned above and the settings + action stay
pinned below.

The Sources list SHALL present the user's **connected accounts** (filtered to the
kind's allowed providers — e.g. a `review` lens shows only github/gitlab accounts) as
**pickable rows**: each row shows the account identity (provider glyph + name/host) and
its derived status, a checkbox to include it, and — once included — the per-reference
**filter multi-select** (authored / assigned / review-requested; hidden for an rss
account). A **"+ Connect an account"** action SHALL append a connect flow that captures an
**Account** provider (auth providers only — github/gitlab/jira) + `baseUrl` and the
inline connect affordance (method-aware: required token for a `pat`-only provider,
optional for a session-capable one), mints the account (client-minted id via
`createAccount` + optional `setAccountToken`), and returns it to the picker
pre-selected. A `general` lens SHALL also offer **"+ Add a feed"** — a URL-only flow
(no provider, no token) that mints an rss **Feed** (`createAccount` with `provider:
'rss'`) and returns it pre-selected (`queries: []`); a `review` lens SHALL NOT offer
it (auth accounts only). RSS is added as a Feed, never via "Connect an account". Confirming SHALL be blocked when no account is
selected, when a selected queue account has zero filters, or when a connect flow is
incomplete. `createLens`/`updateLens` SHALL carry `sources: LensSourceRef[]`
(references, not embedded configs). A reference or filter change on an existing lens
SHALL trigger an immediate refetch of the affected sections only.

#### Scenario: A lens is assembled from a connected account

- **GIVEN** a connected `gitlab.com` account
- **WHEN** the user opens "New lens…", ticks that account, selects "Authored" and "Reviewing", and presses Create
- **THEN** `createLens` is dispatched with `sources: [{ sourceId: <that account>, queries: ['authored', 'review-requested'] }]` and the lens appears with two sections

#### Scenario: Connecting a new account inline during lens creation

- **WHEN** the user picks "+ Connect an account", enters a GitHub host + token, and confirms
- **THEN** the account is minted (`createAccount` with a client-minted id, then `setAccountToken`) and returned to the picker pre-selected, with no navigation to the options page

#### Scenario: Confirming with no account selected is blocked

- **WHEN** the editor has no account selected
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

## REMOVED Requirements

### Requirement: A lens source may carry a display name

**Reason**: A display name is no longer a property of a per-lens source entry — it
belongs to the first-class **Account** (`SourceAccount.name`), shared across every lens
that references that account. The lens reference (`LensSourceRef`) carries only
`{ sourceId, queries }` and inherits the account's name for its section label.

**Migration**: The `v12 → v13` migration carries each embedded source's `name` onto the
`SourceAccount` it mints (see the `connector-accounts` capability and
`storage-and-migrations`). The editor's per-source **Name** field becomes the
account's name, edited via the Accounts manager (rename) or the inline connect flow;
section labels read `account.name || host` exactly as before.
