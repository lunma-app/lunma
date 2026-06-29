## Context

Lunma's connector system (`connector-accounts` + `lenses` capabilities) ships
four providers behind one `SourceConnector` contract
(`background/connectors/connector.ts`): `fetchRuntime`, `requiredOrigins`,
`listingUrl`, plus the static `source` / `authMethods` / `defaultBaseUrl` /
`mintedIcon`. A closed `CONNECTORS: Record<LensProvider, SourceConnector>`
registry (`background/lenses.ts`) dispatches the source-agnostic engine. GitHub
is the closest template: token-only Bearer auth, `credentials: 'omit'`, a
no-token short-circuit to `signed-out` without a request, a REST-root derivation
(`github.com` → `api.github.com`, else `{base}/api/v3`), and — for a `review`
lens — a `Change` bag built from a follow-up reviews fetch.

This change adds `bitbucket` as the fifth provider. During review we verified the
actual Bitbucket Cloud API against Atlassian's docs and found the assumptions
that seeded this change were wrong: **Cloud is the constrained deployment, not
the easy one.** The endpoints, the workspace requirement, and the
deployment-dependent query set below all follow from that verification.

## Goals / Non-Goals

**Goals:**
- A Bitbucket account (Server/DC or Cloud) feeds a lens with its open PRs,
  normalized into the canonical `Change` entity like github/gitlab.
- Server/DC: full `authored` + `review-requested`, token-only, no identity
  lookup. Cloud: `authored` only, workspace-scoped.
- Bearer access-token auth covering both deployments through one code path.
- Additive, lossless schema widening (v15 → v16): provider enum + an optional
  `workspace?` field on `SourceAccount`.
- Zero new runtime dependency; reuse existing `ui/` primitives (with story
  updates).

**Non-Goals:**
- Cloud `review-requested` — no workspace/user-level endpoint exists; only
  per-repo `q` filtering, which would require enumerating repos (rejected as too
  heavy for the one-fetch-per-section model). Explicit non-goal; revisitable.
- Multi-workspace-in-one-account on Cloud — one account = one workspace; a user
  adds one account per workspace.
- App-password (HTTP Basic) auth — see Decision D2.
- An `assigned` query — Bitbucket PRs have no assignee.
- A bespoke Bitbucket brand glyph — reuse `folder-git-2`.
- OAuth / device-flow auth — tokens only.

## Decisions

### D1 — One provider, two API code paths (not two providers)

`bitbucket` is a single `LensProvider`; the connector branches on
`new URL(cfg.baseUrl).host === 'bitbucket.org'`. The two deployments are **not
API-compatible** (verified — see Context), so the connector carries two
request/normalize paths:

| | Server / Data Center (clean) | Cloud (constrained) |
|---|---|---|
| API root | `{baseUrl}/rest/api/1.0` | `https://api.bitbucket.org/2.0` |
| `authored` | `GET /dashboard/pull-requests?state=OPEN&role=AUTHOR` (self-scoped) | `GET /2.0/workspaces/{workspace}/pullrequests/{uuid}?q=state="OPEN"` |
| `review-requested` | `GET /dashboard/pull-requests?state=OPEN&role=REVIEWER` (self-scoped) | **unsupported** — no ws/user endpoint (only per-repo `q`); see D4 |
| identity lookup | none — dashboard is self-scoped | `GET /2.0/user` → `uuid` (needed for `selected_user`), cached per cycle |
| workspace | n/a | required `workspace` slug on the account (D3) |
| pagination | `start` / `limit` / `isLastPage` | `next` cursor URL |
| reviewers on list? | yes — inline `reviewers[]` | **no** — omitted from the PR collection; one bounded per-PR detail fetch builds the bag (D5) |
| reviewer state | `reviewers[].status` (`APPROVED`/`NEEDS_WORK`/`UNAPPROVED`) + `approved` | `participants[].state` (`approved`/`changes_requested`) + `approved` |
| draft | no draft concept on the listed shape → `false` | PR `draft` flag |

Rationale: the two deployments share identity, auth, `mintedIcon`, entity
(`Change`), and `lensKind` semantics — only the wire format differs. Modelling
them as one provider matches GitHub's single-provider/two-roots precedent and
keeps the account UX a single "Bitbucket". The cost vs GitHub is real: two
genuinely-different normalizers plus Cloud's workspace scoping, identity lookup,
and per-PR reviewer fetch.

**Alternative considered:** two providers (`bitbucket-cloud`,
`bitbucket-server`). Rejected — doubles the enum/UI/glyph/label surface and
splits one identity the user thinks of as "Bitbucket".

### D2 — Bearer access token only; `authMethods: ['pat']`; no session rung

Cloud's API is on `api.bitbucket.org`, a different origin from the `bitbucket.org`
browser session, so a cookie/session rung is impossible (unlike GitLab, whose API
is same-origin). Cloud Repository/Workspace Access Tokens and Server/DC HTTP
access tokens are both sent as `Authorization: Bearer`, so one auth path serves
both. Fetch uses `credentials: 'omit'` and, like GitHub, **short-circuits to
`signed-out` without a network request when no token is present**. The
effective-method derivation (`deriveAuthMethod`) is already generic.

**Alternative considered:** App Passwords (`username:app_password` over HTTP
Basic). Rejected — the current token model is a single opaque Bearer string;
Basic auth needs a username + a distinct header scheme, growing `AuthMethod`, the
secrets shape, and the connect affordance. Explicit non-goal; revisitable.

### D3 — `SourceAccount` gains an optional `workspace?: string` field (agreed deviation)

A Cloud bitbucket PR query is **workspace-scoped** (`GET
/2.0/workspaces/{workspace}/pullrequests/{uuid}`), so a Cloud account must carry
the workspace slug. The current account shape is `{ id, provider, baseUrl,
name? }`; this change adds an **optional** `workspace?: string`:

- **required** when `provider === 'bitbucket'` and host is `bitbucket.org`
  (Cloud); validated at the `createAccount` boundary.
- **absent/ignored** for every other provider and for self-hosted bitbucket
  (Server/DC), whose dashboard endpoint is self-scoped.

One account = one workspace; multi-workspace users add multiple accounts (the
established two-`github.com`-accounts pattern). This is a deviation from the
`connector-accounts` spec's `SourceAccount` shape — **agreed via AskUserQuestion
during review** — and is reflected in this change's `connector-accounts` +
`storage-and-migrations` deltas and `docs/architecture.md`.

**Alternative considered:** encode the workspace in `baseUrl`'s path
(`https://bitbucket.org/{workspace}`). Rejected — `baseUrl` is normalized to an
origin and consumed by `requiredOrigins`/host derivation as a host; smuggling a
path through it would corrupt those derivations. A dedicated field is honest.

### D4 — Deployment-dependent query set

The supported query set depends on the resolved host, not just the provider:

- **Server/DC** bitbucket → `authored` + `review-requested`.
- **Cloud** bitbucket → `authored` only.

The shared `LensQuery` enum (`authored | assigned | review-requested`) is
unchanged — bitbucket supports a host-dependent subset. The editor offers only
the supported queries for the chosen host; the SW rejects a Cloud bitbucket
source carrying `review-requested` at create/update. No query-schema change.

### D5 — Review enrichment (PR → `Change`), with a Cloud per-PR reviewer fetch

`deriveLensKind` treats bitbucket as a git source → `lensKind: 'review'`;
`entityForSource`/`entitiesForSource` map bitbucket → `'change'`. The connector
builds the `Change` bag per the D1 table. Server/DC returns `reviewers[]` inline
on the dashboard list, so no extra call. **Cloud omits reviewers/participants
from the `/pullrequests` collection** (Atlassian: included from the self URL, not
the collection — "it would impact performance too much"), so the Cloud path
issues **one per-PR detail fetch** (`GET …/pullrequests/{id}` or `fields=*`)
**capped at the lens's `maxItems`**, mirroring GitHub's bounded follow-up.
Reviewer states map onto the existing `approved | changes | pending` vocabulary.

### D6 — current-user cache (Cloud only), keyed by `sourceId`

The Cloud `selected_user` path segment needs the caller's `uuid`, resolved once
per poll cycle via `GET /2.0/user` through the existing `ConnectorCaches` map (the
generalized `MeCache`), keyed by **`cfg.sourceId`**, storing the in-flight promise
so two sections of the *same account* don't race into duplicate lookups. Server/DC
needs no lookup.

**Divergence from GitLab — do not "correct" this to `baseUrl`.** GitLab keys its
`/user` cache by `baseUrl` because its lookup is session-bound: one browser user
per host. Bitbucket Cloud is **token-per-account on a single shared host** —
every Cloud account has the identical `baseUrl` `https://bitbucket.org` (D3 keeps
the workspace out of `baseUrl`) but a different token → a different user → a
different `uuid`. A `baseUrl`-keyed cache would hand the first account's `uuid` to
every subsequent `bitbucket.org` account, issuing
`GET /2.0/workspaces/{ws2}/pullrequests/{uuid1}` and returning the wrong/empty set
— defeating the multi-workspace pattern this change exists to enable. Keying by
`sourceId` (1:1 with the token) is therefore required, not optional.

### D7 — `requiredOrigins` / `listingUrl`

`requiredOrigins`: Cloud → `https://api.bitbucket.org/*` (the host actually
fetched, not `bitbucket.org`); Server/DC → the `baseUrl` origin. A malformed
`baseUrl` yields an empty pattern (treated as ungranted), per the contract.
`listingUrl`: Cloud → `https://bitbucket.org/dashboard/pullrequests`; Server/DC →
`{baseUrl}/dashboard`. Both pure, no I/O.

### D8 — Schema v15 → v16, identity migration (rebased onto the prerequisite)

`LensProvider` is a persisted discriminant and `workspace?` is a new persisted
field, so the current schema is bumped (`CURRENT_SCHEMA_VERSION` 15 → 16;
`SCHEMA_VERSION` in `store.svelte.ts` in lockstep). The prerequisite
`rekey-lens-sections-by-source-id` takes the schema to v15; this change appends
v16. Both changes here are additive (old data validates: no bitbucket sources
exist, and `workspace?` is optional), so the v16 migration is a pure identity
pass-through (`(raw) => raw`) that only advances the version for downgrade
detection — precedent: the v2/v4/v6 provider-addition bumps and the v14
lens-view-filters identity migration.

**The widening targets the shared `SourceAccountSchema`.** In code there is ONE
`SourceAccountSchema` (`schemas.ts:137`), referenced by `AppStateV13Schema`
onward via `z.record(z.string(), SourceAccountSchema)`. Adding `'bitbucket'` to
its `provider` enum and the optional `workspace` field to it therefore propagates
to the inferred type of `AppStateV14Schema` (the object the codebase already uses
as the current validator in `backup.ts`/`messages.ts`, and the alias chain
`AppStateV15Schema`/`AppStateV16Schema` re-export). Two consequences, both
intentional and requiring **no extra edit**:
- the **Partial-corruption salvage** requirement (typed `AppStateV14` / using
  `AppStateV14Schema.shape.*`) and the existing `AppStateV14Schema` validators
  (backup, messages) accept the widened account automatically — so this change
  does NOT add a MODIFIED block for partial-corruption, and the
  `AssertEqual<…, AppState>` coherence assertion continues to hold once
  `SourceAccount` in `types.ts` gains `workspace?`;
- the historical `AppStateV13Schema` becomes nominally permissive of `'bitbucket'`
  (it never appears in real v13 data — additive, harmless). This is distinct from
  the **frozen** lens-source enums (`LensSourceSchema`,
  `SmartSourceConfigV8Schema`), which are NOT widened (review finding S1).

**Schema-base note (review finding B1).** The living `storage-and-migrations`
spec is at v13/`AppStateV13Schema`/twelve entries; the codebase progresses
through v14 (`lens-view-filters`, unarchived, whose delta only ADDs a
requirement) and v15 (`rekey-lens-sections-by-source-id`, this change's
prerequisite). To avoid asserting a base that no living spec contains, this
change's `storage-and-migrations` delta **documents the full v13 → v14 → v15 →
v16 chain explicitly**, rather than hand-waving "as previously specified". Only
`SourceAccountSchema.provider` (the current-version enum) and the new optional
`workspace` field are touched; the historical `LensSourceSchema` and
`SmartSourceConfigV8Schema` enums are frozen parse targets and left at four
members (review finding S1).

## Visual language

This change adds no new surface; it widens provider-generic data in existing
primitives and adds one conditional field:

- **Service-dropdown picker** (`ui/ServiceConnectPicker.svelte`): a new
  "Bitbucket" entry (ordered between GitLab and Jira), with the
  `https://bitbucket.org` host placeholder, a **required** Bearer-token field
  (pat-only, framed like GitHub — not GitLab's optional "add a token"), and a
  **conditional `workspace` field** rendered only when the host resolves to
  `bitbucket.org` (Cloud). The conditional field uses the existing `TextInput`
  primitive and the picker's established label/spacing; no new tokens. Its
  show/hide follows the picker's existing field transitions (the 150–250ms
  token tweens already in the primitive).
- **AccountChip** (`ui/AccountChip.svelte`): `PROVIDER_GLYPH['bitbucket'] =
  'folder-git-2'`, matching github/gitlab. Status pip, tones, hover/active/focus,
  and state tweens are inherited — no new values.
- **Lens-page monogram** (`overview-vm.ts` `MONO`) and the **Connections card
  abbreviation** (`options/ConnectionsCard.svelte` `PROVIDER_ABBREV`): both gain
  `'BB'`, consistent with the `GH`/`GL`/`JR` two-letter treatment.

All tokens come from `@lunma/tokens`; reduced-motion and WCAG-AA are unaffected
(no new colour or motion). Per the component-library policy, the
`AccountChip.stories.svelte` and `ServiceConnectPicker.stories.svelte` catalog
stories are updated in this change to show the bitbucket variant (and the Cloud
workspace field).

## Risks / Trade-offs

- **Cloud vs Server/DC API drift** → the two-normalizer split is the main cost
  and bug surface. Mitigation: separate, independently-tested fetch+normalize
  functions; `bitbucket.test.ts` fixtures per deployment; a host-switch with no
  shared response assumptions.
- **Cloud `authored`-only asymmetry** → a Cloud user gets no "review-requested"
  lens. Mitigation: the editor hides the unsupported query and the connect flow
  makes the Cloud limitation explicit; documented as a non-goal with a clear
  upgrade path (per-repo iteration) if demanded later.
- **Cloud per-PR reviewer fetch cost** → up to `maxItems` extra requests per
  refresh. Mitigation: cap at `maxItems` (as GitHub does); each request goes
  through the 20 s `boundedFetch`; failures degrade the single item's `change`
  bag, never the section.
- **DC version variance** (`/rest/api/1.0` shapes shift across releases) →
  target the stable 1.0 dashboard endpoint; tolerate missing optional fields
  (default draft `false`, empty reviewers) rather than throwing. Note: Bitbucket
  DC 8.x+ has drafts, so the conservative `false` default may under-report draft
  status — acceptable for v1.
- **Cloud `uuid` URL encoding** (uuids are brace-wrapped `{…}`) → encode the
  path segment / `q` filter; a malformed/empty uuid resolves to the quiet
  `error` state, never a hang.
- **App-password users excluded** → documented non-goal; `tokenHelpUrl` points
  to Bitbucket's access-token docs.
- **Cookie leakage** → `credentials: 'omit'` on every request.

## Migration Plan

Additive and lossless. Ship after the prerequisite
`rekey-lens-sections-by-source-id` (which takes the schema to v15). Existing
state has no `bitbucket` sources and no `workspace` fields, so the v15→v16
migration is an identity pass-through that only advances the version. No rollback
action needed; a downgrade is detected by the version gate (newer data
quarantines rather than Zod-rejecting).
`docs/architecture.md` is updated in the same change to list bitbucket in the
connector roster and note the Server/DC-vs-Cloud split, Cloud's workspace
scoping, and the authored-only Cloud constraint. `docs/tech-stack.md` is left
untouched (no new dependency).

## Open Questions

None — Server/DC-full + Cloud-authored-only-with-workspace scope, the
`workspace?` field addition, Bearer-token auth, full review enrichment, and the
deployment-dependent query set were all fixed during exploration and review.
