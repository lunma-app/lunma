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

## ADDED Requirements

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
(`workspace/repo` on Cloud, `project/repo` on Server), `targetBranch`, `draft` (Cloud
`draft` flag; Server's listed shape has no draft → `false`), and `reviewers[]` mapped
onto `approved | changes | pending`. The connector SHALL be bounded (never throws;
every failure resolves to a runtime state). `requiredOrigins` SHALL follow Requirement:
Each connector declares the origins it fetches; `listingUrl` SHALL return
`https://bitbucket.org/dashboard/pullrequests` (Cloud) or `{baseUrl}/dashboard`
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
