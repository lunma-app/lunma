## MODIFIED Requirements

### Requirement: A lens carries a kind

A lens `PinNode` SHALL carry a `lensKind: LensKind` field, where `LensKind` is the closed union `'general' | 'review'` (widened by later typed-kind changes). `general` denotes the untyped, multi-provider aggregator that reproduces the historical behaviour: it MAY mix providers (gitlab/github/jira/rss) in one lens and renders with the generic sectioned sidebar layout and the generic full page. `review` denotes the typed Review lens: its sources are `github` and/or `gitlab` providers only (it MAY mix those two, never `rss`/`jira`), each normalised into the `Change` entity, and it renders the Review Queue page archetype. The editor SHALL stamp the chosen `lensKind` on create (defaulting to `'general'`). A lens migrated from a pre-rename `smart` node SHALL default `lensKind: 'general'`.

#### Scenario: A migrated lens is general

- **WHEN** the SW boots with a lens migrated from a pre-rename smart node
- **THEN** its `lensKind` is `'general'` and it behaves byte-for-byte as before

#### Scenario: The editor stamps the chosen kind on create

- **WHEN** the user creates a lens from the pinned-header menu
- **THEN** `createLens` persists the node with the `lensKind` selected in the editor, defaulting to `'general'` when none is supplied

#### Scenario: The kind union holds general and review

- **WHEN** the `LensKind` union is inspected
- **THEN** its members are exactly `'general'` and `'review'` (further typed kinds arrive in later changes)

### Requirement: Lens items may carry optional rich-content fields

`LensItem` SHALL carry OPTIONAL display-only fields in addition to `id`/`title`/`url`/`status`: `excerpt?: string` (a plain-text summary), `imageUrl?: string` (a thumbnail/hero image URL), `publishedAt?: number` (publication time as epoch ms), and `change?: ChangeData` (the canonical Change entity for review lenses — see "A review lens normalises its sources into Change entities"). They SHALL be present on both the TypeScript interface (`shared/types.ts`) and the ephemeral `LensItemSchema` Zod mirror (`shared/schemas.ts`). They ride the **broadcast-only, never-persisted** `lenses` runtime slice, so they introduce **no schema migration** and the persisted envelope is unchanged. Each field SHALL be **omitted entirely** when absent (an item with none is byte-identical to the prior shape). The sidebar projection SHALL ignore these fields; only the full-page projection renders them.

#### Scenario: Optional fields are omitted when absent

- **WHEN** a connector emits an item with no description, image, date, or change bag
- **THEN** the `LensItem` has no `excerpt`, `imageUrl`, `publishedAt`, or `change` keys, and it round-trips through `LensItemSchema`

#### Scenario: A review change rides the ephemeral slice

- **WHEN** a review-lens connector emits an item carrying `change`
- **THEN** the `change` bag is present on the runtime `LensItem` and validates under `LensItemSchema`
- **AND** when the owning `ok` runtime is persisted, the `lenses` slice is stripped before write, so `change` never reaches disk and needs no migration

### Requirement: Connector implementations conform to the SourceConnector contract

The `SourceConnector` interface in `background/connectors/connector.ts` SHALL remain
**shape-stable**: `fetchRuntime` accepts a **resolved single-query** config (the engine expands `queries[]` before
dispatch; a connector never sees a `queries[]` array) plus `ConnectorCaches?`:
`fetchRuntime(cfg: ResolvedLensSource, maxItems: number, caches?: ConnectorCaches): Promise<LensSectionRuntime>`,
where `ResolvedLensSource` is `{ source: LensProvider; baseUrl: string; query?: LensQuery; lensKind: LensKind }`
(a single optional query, present for queue sources, absent for rss; plus the owning lens's `lensKind`, stamped by `resolvedConfigs` so a connector can gate kind-specific enrichment such as the review-lens `change` bag). `maxItems` is passed
separately. `listingUrl`, `requiredOrigins`, `defaultBaseUrl`, and `mintedIcon` accept the same
resolved config (origins and listing URLs are query-independent for the queue sources).

The engine's `fetchLensSectionRuntime(cfg: ResolvedLensSource, maxItems, caches?)` entry point
dispatches to `CONNECTORS[cfg.source].fetchRuntime(cfg, maxItems, caches)`. The
`resolvedConfigs(node): ResolvedLensSource[]` helper performs the `sources[] × queries[]`
expansion, stamps each resolved config with `node.lensKind`, and is the single derivation used by the engine fan-out, the origin union, and the
editor's section preview.

#### Scenario: A fetch dispatches through the registry by resolved config

- **WHEN** the engine refreshes a section whose resolved config carries `source: 'gitlab', query: 'authored'`
- **THEN** `CONNECTORS.gitlab.fetchRuntime(cfg, maxItems, caches)` performs the fetch with that single query and the result event reaches the drain

#### Scenario: The registry holds exactly the four shipped sources

- **WHEN** the `CONNECTORS` registry is inspected
- **THEN** its keys are exactly `gitlab`, `github`, `jira`, and `rss`

#### Scenario: The resolved config carries the lens kind

- **WHEN** `resolvedConfigs(node)` expands a lens whose `lensKind` is `'review'`
- **THEN** every resolved config it produces carries `lensKind: 'review'`, so the connector can gate `change` enrichment on it

## ADDED Requirements

### Requirement: A review lens normalises its sources into Change entities

A `lensKind: 'review'` lens SHALL accept only `github` and `gitlab` sources, and each result item SHALL carry an optional `change: ChangeData` bag normalised from the provider's PR/MR so that GitHub PRs and GitLab MRs present as one entity. `ChangeData` SHALL be:

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

The CI/pipeline state SHALL remain on `LensItem.status` (the existing tone), NOT duplicated into `ChangeData`. `ChangeData` is ephemeral (it rides the `lenses` runtime slice) and SHALL introduce no persisted-schema change.

#### Scenario: GitHub and GitLab changes share the entity

- **GIVEN** a review lens with a github source and a gitlab source, both `ok`
- **WHEN** the runtime resolves
- **THEN** each item carries a `change` bag of the same `ChangeData` shape regardless of provider, and `status` carries its CI/pipeline tone

#### Scenario: A non-review lens carries no change bag

- **GIVEN** a `general` lens
- **WHEN** its connectors resolve
- **THEN** no item carries a `change` bag and behaviour is byte-for-byte unchanged

### Requirement: The github-pr adapter enriches review changes

For a `review` lens, the GitHub connector SHALL populate each item's `change` from the PR detail it already fetches plus one reviews request, capped at the lens's `maxItems`: `author` from the PR `user.login`; `repo` from `base.repo.full_name`; `targetBranch` from `base.ref`; `additions`/`deletions` and `draft` from the PR detail; `updatedAt` from `updated_at`. It SHALL fetch `GET /repos/{owner}/{repo}/pulls/{number}/reviews`, reduce to the latest non-`COMMENTED` review per reviewer to `state` (`APPROVED` → `approved`, `CHANGES_REQUESTED` → `changes`), and mark requested reviewers with no review `pending`. For a `general` lens the connector SHALL NOT fetch reviews and SHALL NOT populate `change`.

#### Scenario: A review PR is enriched with a Change

- **GIVEN** a review lens with a github source resolving an open PR
- **WHEN** the connector fetches
- **THEN** the item carries `change` with author, repo, target branch, additions/deletions, draft, updatedAt, and per-reviewer states from the reviews response

#### Scenario: General github lenses are not enriched

- **GIVEN** a `general` lens with a github source
- **WHEN** the connector fetches
- **THEN** no reviews request is made and the item carries no `change`

### Requirement: The gitlab-mr adapter enriches review changes

For a `review` lens, the GitLab connector SHALL populate each item's `change` from the MR detail it already fetches plus one approvals request, capped at the lens's `maxItems`: `author` from `author.username`; `repo` from the project path; `targetBranch` from `target_branch`; `additions`/`deletions` from the MR diff/change stats; `draft` from `draft`/`work_in_progress`; `updatedAt` from `updated_at`; `reviewers` from the MR `reviewers`. It SHALL fetch `GET /projects/{id}/merge_requests/{iid}/approvals`, marking reviewers in `approved_by` `approved` and others `pending`; where the instance exposes reviewer review-state, a requested-changes reviewer SHALL be `changes`. For a `general` lens the connector SHALL NOT fetch approvals and SHALL NOT populate `change`.

#### Scenario: A review MR is enriched with a Change

- **GIVEN** a review lens with a gitlab source resolving an open MR
- **WHEN** the connector fetches
- **THEN** the item carries `change` with author, repo, target branch, diff stats, draft, updatedAt, and reviewer states derived from approvals

#### Scenario: Unknown verdicts degrade to pending

- **GIVEN** a gitlab instance that does not expose a reviewer's review-state
- **WHEN** the connector builds `change.reviewers`
- **THEN** that reviewer's `state` is `pending` (never a fabricated verdict)

### Requirement: The review lens renders a Review Queue page

When the full-page surface mirrors a lens whose `lensKind` is `'review'`, it SHALL render the **Review Queue** archetype instead of the generic section grid; for every other kind it SHALL render the generic page unchanged (the existing generic body is extracted verbatim into a `GeneralLens` view). The Review Queue SHALL group changes into **relationship lanes** derived from each source's query: a `review-requested` query feeds a "Requested your review" lane, an `authored` query feeds an "Authored by you" lane, and any other query feeds its own labelled lane; lanes render in that priority order, each as a frosted-glass panel.

Each change SHALL render as a **row** (not a magazine card) presenting, left to right: a CI light (from `status`, with `draft` shown as a distinct hollow glyph), the full untruncated title, a `host/owner/repo` subline (host from the source `baseUrl`, `owner/repo` from `change.repo`) with the author, a `ReviewerRail` (a verdict icon — blocking-wins `changes` > `pending` > `approved` — leading verdict-tinted reviewer `Avatar`s), a `Diffstat` (`change.additions`/`deletions`), and a relative age (from `change.updatedAt`) that warms to `--warning` past a staleness threshold. The page header SHALL carry the lens name and a triage-summary line. Activation SHALL reuse `openLensItem` and the existing per-window bind/focus semantics; the existing calm pending/error/signed-out/needs-access states SHALL be reused; no non-`ok` state SHALL render as a red error card.

#### Scenario: A review lens renders the queue, not the grid

- **GIVEN** a `review` lens with `review-requested` and `authored` github sections, all `ok`
- **WHEN** the page renders
- **THEN** it shows a "Requested your review" lane above an "Authored by you" lane of `Change` rows — not the generic magazine grid

#### Scenario: A general lens still renders the generic page

- **GIVEN** a `general` lens
- **WHEN** the page renders
- **THEN** it renders the generic section grid exactly as before the Review lens existed

#### Scenario: A row shows the change's triage signals

- **GIVEN** a review change with CI `ok`, two reviewers (one approved, one pending), `+112 −40`, updated 2h ago
- **WHEN** its row renders
- **THEN** it shows the CI light, title, `host/owner/repo · @author`, a reviewer rail with the pending verdict icon, a `+112 −40` diffstat, and a "2h" age

#### Scenario: Activation reuses openLensItem

- **WHEN** the user activates a change row in window 100
- **THEN** `openLensItem` is dispatched with the namespaced item id and the existing bind/focus behaviour applies

### Requirement: The review page filters changes by source and repo

The Review Queue SHALL render a filter toolbar **only when the lens spans more than one source**. The toolbar SHALL offer **source facets** as chips (one per `node.sources` entry, identified by provider + host) and **repo facets** (the distinct `change.repo` values) rendered as chips when there are five or fewer, otherwise as a `Select`. Repo facets SHALL be scoped to the active source facet so the same `owner/repo` on two hosts never merges. The active filter SHALL be **page-local ephemeral UI state** — not persisted and dispatching no bus command — and SHALL narrow the changes rendered across the lanes. A single-source lens SHALL render no toolbar.

#### Scenario: The toolbar appears only for multi-source lenses

- **GIVEN** a review lens with one source
- **WHEN** the page renders
- **THEN** no filter toolbar is shown
- **AND GIVEN** a review lens spanning two sources, the toolbar renders source chips

#### Scenario: Selecting a source narrows the queue

- **GIVEN** a review lens spanning github.com and a gitlab host
- **WHEN** the user activates the github.com source chip
- **THEN** only github changes remain across the lanes, and no state is persisted

#### Scenario: Repo facets fall back to a Select past the threshold

- **WHEN** the active source has more than five distinct `change.repo` values
- **THEN** the repo facet renders as a `Select` rather than a chip row

### Requirement: The lens editor selects a lens kind

The lens editor (`LensEditor.svelte`) SHALL present a kind picker (General | Review) composed from an existing `ui/` primitive (`SegmentedControl`). The `createLens` and `updateLens` command payloads SHALL carry the selected `lensKind`, and the handler SHALL stamp it on the node (defaulting to `'general'` when the payload omits it, preserving backward compatibility). When `review` is selected the source picker SHALL restrict the available providers to `github` and `gitlab`.

#### Scenario: Creating a review lens

- **WHEN** the user selects the Review kind and confirms the editor
- **THEN** `createLens` carries `lensKind: 'review'` and the persisted node is stamped `review`

#### Scenario: Review restricts source providers

- **GIVEN** the editor with the Review kind selected
- **WHEN** the user opens the source-provider picker
- **THEN** only `github` and `gitlab` are offered (no `rss`/`jira`)

#### Scenario: Omitted kind defaults to general

- **WHEN** an `updateLens` payload omits `lensKind`
- **THEN** the handler preserves/stamps `'general'` so existing callers are unaffected
