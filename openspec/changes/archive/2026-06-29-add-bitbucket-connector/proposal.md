## Why

Users who live in Bitbucket today cannot pull their pull requests into a Lunma
lens — the connector system ships GitHub, GitLab, Jira, and RSS, but a Bitbucket
team has no way to see "my open PRs" in their workspace. This change adds
**Bitbucket as a fifth connector provider**, so a Bitbucket user gets the same
review-lens experience (Change rows, approval status, draft state, refresh,
open-all) the git forges already deliver. It covers both **Bitbucket Server /
Data Center** (self-hosted) and **Bitbucket Cloud** (`bitbucket.org`) — the two
deployments are not API-compatible, so the connector carries two
request/normalize paths under one provider.

This is direct, user-visible value (shape (a) of the user-value policy): a
requested provider extending a shipping feature. It is not plumbing for a future
change.

**Depends on `rekey-lens-sections-by-source-id`.** That prerequisite re-keys lens
sections by account `sourceId`, so a user with several Bitbucket Cloud accounts
(one per workspace, all on `bitbucket.org`) gets a distinct section per account
instead of a `sourceKey` collision. This change assumes it has landed (it takes
schema v15; this change takes v16).

## What Changes

- Add `'bitbucket'` to the `LensProvider` union and every enum/map keyed by it.
- New SW connector `background/connectors/bitbucket.ts` implementing the
  `SourceConnector` contract, registered in the `CONNECTORS` map. It fetches pull
  requests from **two non-compatible APIs**, switched on
  `new URL(baseUrl).host === 'bitbucket.org'`:
  - **Server / Data Center** (the clean case) → `{baseUrl}/rest/api/1.0/...`
    (same-origin with `baseUrl`). Supports **both** `authored` and
    `review-requested` via the user-scoped `dashboard/pull-requests` endpoint
    (`role=AUTHOR|REVIEWER`), token-only, no extra identity lookup.
  - **Cloud** (the constrained case) → `https://api.bitbucket.org/2.0/...` (a
    host distinct from `bitbucket.org`, so `requiredOrigins` targets
    `api.bitbucket.org`). The all-workspaces "list PRs for a user" endpoint was
    **removed by Atlassian on 2025-02-20** (now 404); the supported replacement
    `GET /2.0/workspaces/{workspace}/pullrequests/{selected_user}` is
    **workspace-scoped and authored-only** — there is no workspace/user-level
    "review-requested" endpoint (only per-repo `q` filtering). So **Cloud
    supports `authored` only** and requires a **workspace** identifier.
- **Account model gains `workspace?: string`** (a new optional field on
  `SourceAccount`) — required for a Cloud bitbucket account (the workspace slug
  whose PRs it reads), absent for every other provider and for Server/DC. One
  account = one workspace; a user in several workspaces adds several accounts
  (mirroring the existing two-`github.com`-accounts pattern). **This is an
  agreed addition to the account shape** (see design.md / the connector-accounts
  spec).
- **Deployment-dependent query set:** a Server/DC bitbucket source offers
  `authored` + `review-requested`; a Cloud bitbucket source offers `authored`
  only. The shared `LensQuery` enum is unchanged (`assigned` stays unsupported —
  Bitbucket has no assignee).
- **Auth:** token-only, `authMethods: ['pat']`. Cloud's API is not same-origin
  with the `bitbucket.org` session, so there is no `session` rung; a missing
  token short-circuits to `signed-out` without a request (the GitHub model).
  Cloud Repository/Workspace Access Tokens and Server/DC HTTP access tokens are
  both `Authorization: Bearer`, so one auth path serves both deployments.
- **Full review provider:** a bitbucket source counts as a git source, so a lens
  holding one derives `lensKind: 'review'` and its PRs normalize into the
  canonical `Change` entity (draft/status + a reviewer-approval bag), like
  github/gitlab. Server/DC returns reviewers inline on the dashboard list; Cloud
  omits reviewers from the PR collection, so the Cloud path issues one bounded
  per-PR detail fetch (capped at `maxItems`) to populate the reviewer bag.
- **Schema:** bump `CURRENT_SCHEMA_VERSION` 15 → 16 (the prerequisite takes it to
  15). Widening `LensProvider` and adding the optional `workspace?` field are both
  additive; the v16 migration is an identity pass-through (precedent: the v2/v4/v6
  provider-addition bumps).
- The shared **Service-dropdown connect picker** gains a "Bitbucket" option
  with a **conditional `workspace` field** shown only when the host is
  `bitbucket.org` (Cloud); `AccountChip` reuses the `folder-git-2` glyph (lucide
  ships no Bitbucket brand glyph, matching the github/gitlab treatment).

No new `ui/` primitive. The change edits the existing `AccountChip.svelte`
(`PROVIDER_GLYPH`) and `ServiceConnectPicker.svelte` (`SERVICE_OPTIONS` + the
conditional workspace field) primitives; per the component-library policy, their
catalog stories are updated in the same change.

## Capabilities

### New Capabilities

_None._ Bitbucket is a new provider within the existing connector/lens
capabilities, not a new capability.

### Modified Capabilities

- `connector-accounts`: the provider set, `authMethods` declarations, and
  `ACCOUNT_PROVIDERS` gain `bitbucket` (an Account, not a Feed); `SourceAccount`
  gains an optional `workspace?` field; the Service-dropdown picker offers
  Bitbucket with a conditional workspace field for Cloud.
- `lenses`: `LensProvider` widens to include `bitbucket`; the git-source →
  `lensKind: 'review'` derivation and PR → `Change` normalization include
  bitbucket; `requiredOrigins` covers Cloud (`api.bitbucket.org`) and Server/DC
  (`baseUrl` origin); the bitbucket query set is deployment-dependent
  (Server/DC: `authored` + `review-requested`; Cloud: `authored`).
- `storage-and-migrations`: `CURRENT_SCHEMA_VERSION` 15 → 16 (and the
  versioned-envelope version-of-record) with an additive v15→v16 identity
  migration; the shared `SourceAccountSchema` gains `'bitbucket'` and the optional
  `workspace?` field (so `AppStateV16Schema` is an alias — see design D8).
- `runtime-permissions`: a Cloud bitbucket account requires the
  `https://api.bitbucket.org/*` origin; a Server/DC account requires its
  `baseUrl` origin (via the `https://*/*` fallback).

## Impact

- **Docs:** updates `docs/architecture.md` (the connector roster + the
  Cloud/Server API-shape note, including Cloud's workspace-scoped authored-only
  constraint). Leaves `docs/tech-stack.md` untouched (no new dependency, no
  stack change).
- **New files:** `background/connectors/bitbucket.ts`,
  `background/connectors/bitbucket.test.ts`,
  `catalog/stories/ui/ServiceConnectPicker.stories.svelte` (only if a story file
  does not already exist — otherwise updated). No new public type: `bitbucket`
  is a new member of existing unions, and `workspace?` is a new optional field on
  the existing `SourceAccount` type.
- **Modified shared code:** `shared/types.ts` (`LensProvider`; `SourceAccount`
  gains `workspace?: string`), `shared/bus.ts` (`LensProviderSchema`;
  `createAccount` payload carries optional `workspace?`), `shared/schemas.ts`
  (`SourceAccountSchema.provider` enum + new optional `workspace` field;
  `AppStateV16Schema`; `CURRENT_SCHEMA_VERSION` 15 → 16 — the historical
  `LensSourceSchema`/`SmartSourceConfigV8Schema` enums are frozen and left
  untouched), `shared/store.svelte.ts` (`SCHEMA_VERSION`),
  `shared/migrations.ts` (v16 identity entry), `shared/auth-method.ts`
  (`PROVIDER_AUTH_METHODS`), `shared/account-ui.ts` (`PROVIDERS`,
  `ACCOUNT_PROVIDERS`, `PROVIDER_LABEL`, `DEFAULT_BASE_URL`, `tokenHelpUrl`),
  `shared/lens-entity.ts` (`entityForSource`, `entitiesForSource`,
  `deriveLensKind` — all `if`-chains, not exhaustive switches), `shared/lens-labels.ts`
  (`ICON_BY_SOURCE`, `filterLabel`), `shared/connector-origins.ts`.
- **Modified SW:** `background/lenses.ts` (import + `CONNECTORS` registration).
- **Modified UI primitives:** `ui/ServiceConnectPicker.svelte` (`SERVICE_OPTIONS`
  + token placeholder + conditional workspace field), `ui/AccountChip.svelte`
  (`PROVIDER_GLYPH`), plus their catalog stories.
- **Modified UI feature code (provider data maps):**
  `launcher/lenspage/overview-vm.ts` (`MONO`),
  `options/ConnectionsCard.svelte` (`PROVIDER_ABBREV` — `Record<LensProvider>`,
  fails `tsc` without a `bitbucket` entry).
- **Tests:** `background/lenses.test.ts` (registry parity — five keys),
  `shared/lens-labels.test.ts` (provider coverage for `ICON_BY_SOURCE`/`filterLabel`),
  `shared/bus.test.ts` (the existing out-of-vocabulary rejection test switches to
  a still-invalid provider, plus a new `bitbucket`-accepted case), and a new
  `background/connectors/bitbucket.test.ts` covering Server/DC + Cloud
  fetch / normalize / auth.
- **No new runtime dependency.** The dominant implementation cost is the dual
  Server-DC / Cloud API surface inside one connector (called out in design.md),
  Cloud's workspace scoping, and Cloud's per-PR reviewer fetch — unlike GitHub's
  Enterprise support, which is a single REST-root swap.
