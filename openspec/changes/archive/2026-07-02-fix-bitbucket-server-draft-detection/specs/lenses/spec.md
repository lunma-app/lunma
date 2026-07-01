## MODIFIED Requirements

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
