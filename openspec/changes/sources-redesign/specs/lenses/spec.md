## MODIFIED Requirements

### Requirement: A lens carries a kind

A lens `PinNode` SHALL carry a `lensKind: LensKind` field, where `LensKind` is the closed union `'general' | 'review'` (widened by later typed-kind changes). `lensKind` is **derived by the SW from the lens's source set**, never chosen in the editor: a lens with **any** `github` or `gitlab` source resolves to `'review'` (enabling Change enrichment on those sections); a lens with **no** git source resolves to `'general'`. A lens MAY freely **mix** providers — git accounts, `jira` accounts, and `rss` feeds in one lens — so a derived-`'review'` lens may also carry feeds (which render as Articles) and jira sources (which render Generic); the git-only restriction on review lenses is removed. The derived `lensKind` gates only the per-section Change enrichment (`github`/`gitlab` sections of a `'review'` lens carry the `change` bag; all other sections never do). The editor SHALL NOT present a kind picker. The SW SHALL derive and persist `lensKind` on create/update from the sources, **and once for every existing lens node on boot** (re-deriving from its current sources and persisting any change) so a pre-existing `'general'` lens that holds a git source becomes `'review'` — and renders enriched Changes — without requiring an edit. A lens migrated from a pre-rename `smart` node SHALL default `lensKind: 'general'` before this boot re-derivation runs.

#### Scenario: A feed-only lens derives general

- **WHEN** the SW boots with a lens whose sources are only `rss` feeds
- **THEN** its `lensKind` is `'general'` and it renders only an Articles section

#### Scenario: The SW derives the kind from the source set on create

- **WHEN** the user creates a lens whose sources include a `github` account
- **THEN** the SW stamps `lensKind: 'review'` on the node (no kind was supplied by the editor)
- **AND WHEN** the user creates a lens whose sources are only `rss` feeds, the SW stamps `lensKind: 'general'`

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

### Requirement: Creation and configuration via the pinned-header menu

The `LensEditor.svelte` SHALL be **connection-first**: it SHALL render, top to bottom, a **Name** field; a **connections** picker (the lens's sources, as account assembly — not a URL form, and **not** gated by any kind selector); a derived **"this lens will show …"** preview naming the canonical entities the chosen connections produce (Changes / Articles / a generic label); the lens settings (**Show** max-items and **Refresh** cadence); and a single primary action — **Create** / **Save** — with **Cancel** and the validation hint. There SHALL be **no Kind picker** (the kind-driven provider filter that previously restricted a review lens to github/gitlab is removed with it). The connections picker SHALL be height-bounded and scroll independently while Name stays pinned above and the settings + action stay pinned below.

The connections picker SHALL present **all** of the user's connected sources (accounts and feeds, no provider filtering) as **pickable rows**: each row shows the source identity (provider glyph + name/host), an account's derived status, a checkbox to include it, and — once an **account** is included — the per-reference **filter multi-select** (authored / assigned / review-requested; hidden for an rss feed). A single **"+ Connect a service"** action SHALL open the shared Service-dropdown connect picker (`ui/ServiceConnectPicker.svelte` — see the `connector-accounts` capability), which mints the source (`createAccount` + optional `setAccountToken`) and returns it to the picker **pre-selected** (an rss feed pre-selected with `queries: []`). The picker's **OPML import** SHALL behave the same way in the editor — bulk: it SHALL find-or-mint an rss account per parsed feed (deduped by normalized base URL, since the rss `sourceKey` is host-derived) and pre-select them all **into the lens being assembled**, NOT spawn a standalone "Feeds" lens (the editor passes the picker an `onImportFeeds` callback — see the `connector-accounts` capability; the standalone-`importOpml` path is the Options Connections manager's). Confirming SHALL be blocked when no source is selected, when a selected queue account has zero filters, or when a connect flow is incomplete. `createLens`/`updateLens` SHALL carry `sources: LensSourceRef[]` (references, not embedded configs) and SHALL NOT carry `lensKind` (the SW derives it — see `A lens carries a kind`). **Create SHALL open the lens's overview page.** A reference or filter change on an existing lens SHALL trigger an immediate refetch of the affected sections only.

#### Scenario: A lens is assembled connection-first without choosing a kind

- **GIVEN** a connected `gitlab.com` account and an `rss` feed
- **WHEN** the user opens "New lens…", ticks both, selects "Authored" on the account, and presses Create
- **THEN** `createLens` is dispatched with `sources: [{ sourceId: <gitlab>, queries: ['authored'] }, { sourceId: <feed>, queries: [] }]` and **no `lensKind`**, and the overview opens showing a Changes section and an Articles section

#### Scenario: The editor shows a derived entity preview

- **GIVEN** the editor with one `github` account and one `rss` feed selected
- **THEN** the "this lens will show …" preview names **Changes** and **Articles** (no Kind picker is present anywhere in the editor)

#### Scenario: Connecting a new service inline during lens creation

- **WHEN** the user picks "+ Connect a service", selects GitHub, enters a host + token, and confirms
- **THEN** the account is minted (`createAccount` with a client-minted id, then `setAccountToken`) and returned to the picker pre-selected, with no navigation to the options page

#### Scenario: Importing OPML in the editor fills the lens being built

- **GIVEN** the user is assembling a new lens and picks "+ Connect a service" → "RSS feed" → "Import OPML" with a file of 3 feed outlines
- **WHEN** the user confirms (the editor's confirm step shows "add to this lens", no Space picker)
- **THEN** an rss `createAccount` is dispatched per distinct feed (deduped by normalized base URL) and each is pre-selected into the editor, so Create dispatches `createLens` with those feeds as `queries: []` sources — and **no `importOpml` is dispatched and no separate "Feeds" lens is created**

#### Scenario: Confirming with no source selected is blocked

- **WHEN** the editor has no source selected
- **THEN** the primary Create/Save action SHALL be disabled

### Requirement: A review lens normalises its sources into Change entities

A lens whose derived `lensKind` is `'review'` SHALL normalise each of its **`github`/`gitlab`** sections' result items by carrying an optional `change: ChangeData` bag normalised from the provider's PR/MR so that GitHub PRs and GitLab MRs present as one entity; the lens MAY also carry `rss` and `jira` sources, which never carry a `change` bag (they render as Articles / Generic). `ChangeData` SHALL be:

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
- **THEN** each git item carries a `change` bag of the same `ChangeData` shape regardless of provider, and `status` carries its CI/pipeline tone

#### Scenario: Non-git sections of a mixed lens carry no change bag

- **GIVEN** a derived-`'review'` lens that also has an `rss` feed and a `jira` account
- **WHEN** its connectors resolve
- **THEN** the rss and jira items carry no `change` bag, and only the github/gitlab items are enriched

### Requirement: The github-pr adapter enriches review changes

For a `review` lens, the GitHub connector SHALL populate each item's `change` from the PR detail it already fetches plus one reviews request, capped at the lens's `maxItems`: `author` from the PR `user.login`; `repo` from `base.repo.full_name`; `targetBranch` from `base.ref`; `additions`/`deletions` and `draft` from the PR detail; `updatedAt` from `updated_at`. It SHALL fetch `GET /repos/{owner}/{repo}/pulls/{number}/reviews`, reduce to the latest non-`COMMENTED` review per reviewer to `state` (`APPROVED` → `approved`, `CHANGES_REQUESTED` → `changes`), and mark requested reviewers with no review `pending`. Enrichment gates on the resolved section's `lensKind`: because any lens holding a `github` source derives to `'review'` (see `A lens carries a kind`), a github section is always enriched; the connector is never invoked for a `'general'` (git-free) lens, so it makes no reviews request and populates no `change`.

#### Scenario: A review PR is enriched with a Change

- **GIVEN** a review lens with a github source resolving an open PR
- **WHEN** the connector fetches
- **THEN** the item carries `change` with author, repo, target branch, additions/deletions, draft, updatedAt, and per-reviewer states from the reviews response

#### Scenario: A git-free general lens never invokes the github connector

- **GIVEN** a `general` lens whose sources are only `rss` feeds
- **WHEN** the lens resolves
- **THEN** the github connector is not invoked, so no reviews request is made and no item carries a `change`

### Requirement: The gitlab-mr adapter enriches review changes

For a `review` lens, the GitLab connector SHALL populate each item's `change` from the MR detail it already fetches plus one approvals request, capped at the lens's `maxItems`: `author` from `author.username`; `repo` from the project path; `targetBranch` from `target_branch`; `additions`/`deletions` from the MR diff/change stats; `draft` from `draft`/`work_in_progress`; `updatedAt` from `updated_at`; `reviewers` from the MR `reviewers`. It SHALL fetch `GET /projects/{id}/merge_requests/{iid}/approvals`, marking reviewers in `approved_by` `approved` and others `pending`; where the instance exposes reviewer review-state, a requested-changes reviewer SHALL be `changes`. Enrichment gates on the resolved section's `lensKind`: because any lens holding a `gitlab` source derives to `'review'` (see `A lens carries a kind`), a gitlab section is always enriched; the connector is never invoked for a `'general'` (git-free) lens, so it makes no approvals request and populates no `change`.

#### Scenario: A review MR is enriched with a Change

- **GIVEN** a review lens with a gitlab source resolving an open MR
- **WHEN** the connector fetches
- **THEN** the item carries `change` with author, repo, target branch, diff stats, draft, updatedAt, and reviewer states derived from approvals

#### Scenario: Unknown verdicts degrade to pending

- **GIVEN** a gitlab instance that does not expose a reviewer's review-state
- **WHEN** the connector builds `change.reviewers`
- **THEN** that reviewer's `state` is `pending` (never a fabricated verdict)

### Requirement: The page renders all resolved sections

When mirroring a lens, the page SHALL render **every** resolved section of that lens, **grouped by canonical entity** rather than per source. Each resolved section's entity SHALL be derived by `entityForSource(cfg.source)` (`github`/`gitlab` → `change`, `rss` → `article`, any other queue provider e.g. `jira` → `generic`). The page SHALL render one **entity section** per non-empty bucket, in the canonical order **Changes → Articles → Generic**, merging every connection of the same entity into that one section:

- the **Changes** section SHALL render the Review Queue archetype over the change-bucket sections (see `The Changes entity section renders the Review Queue archetype`);
- the **Articles** section SHALL render the magazine archetype over the article-bucket sections (see `The Articles entity section renders a magazine`);
- the **Generic** section SHALL render the existing per-source glass panels (`Surface variant="glass"`, source-icon header + item cards) for any remaining queue sections.

The page SHALL reuse the existing per-section calm states unchanged: `pending` → static ghost cards; `error` → last-known cards plus a dim "Couldn't reach ⟨host⟩" note; `signed-out` → the per-source sign-in / "Add a token in Settings → Connectors" affordance; `needs-access` → the muted "Lunma needs access to ⟨host⟩" grant prompt invoking `requestHostPermissions`. The page SHALL show the lens-level attention sum in its page header. No non-`ok` state SHALL render as a red error card.

#### Scenario: A mixed lens renders one section per entity

- **GIVEN** lens `f1` with a gitlab instance carrying `['authored', 'review-requested']` and one rss feed, all `ok`
- **WHEN** the page renders
- **THEN** it shows a **Changes** section (the gitlab changes across both filters) above an **Articles** section (the feed) — not three per-source panels

#### Scenario: A pure-feed lens shows only Articles

- **GIVEN** a lens whose only sources are `rss` feeds
- **WHEN** the page renders
- **THEN** it shows a single **Articles** section and no Changes or Generic section

#### Scenario: Per-section calm states render on the page

- **GIVEN** lens `f1` with one github section `signed-out` and one gitlab section `ok`, both in the Changes bucket
- **WHEN** the page renders
- **THEN** the Changes section shows the "Add a token in Settings → Connectors" affordance for the github source and the gitlab changes — neither as a red error card

### Requirement: The review page filters changes by source and repo

The **Changes** entity section SHALL render a filter toolbar **only when the change bucket spans more than one source**. The toolbar SHALL offer **source facets** as chips (one per change-bucket source entry, identified by provider + host) and **repo facets** (the distinct `change.repo` values) rendered as chips when there are five or fewer, otherwise as a `Select`. Repo facets SHALL be scoped to the active source facet so the same `owner/repo` on two hosts never merges. The active filter SHALL be **page-local ephemeral UI state** — not persisted and dispatching no bus command — and SHALL narrow the changes rendered across the lanes. A single-source change bucket SHALL render no toolbar. The Articles section's filters (see its requirement) are independent of this toolbar.

#### Scenario: The toolbar appears only for multi-source change buckets

- **GIVEN** a lens whose change bucket has one source
- **WHEN** the overview renders
- **THEN** the Changes section shows no filter toolbar
- **AND GIVEN** a lens whose change bucket spans two sources, the toolbar renders source chips

#### Scenario: Selecting a source narrows the Changes section

- **GIVEN** a lens whose change bucket spans github.com and a gitlab host
- **WHEN** the user activates the github.com source chip
- **THEN** only github changes remain across the lanes, the Articles section is unaffected, and no state is persisted

#### Scenario: Repo facets fall back to a Select past the threshold

- **WHEN** the active source has more than five distinct `change.repo` values
- **THEN** the repo facet renders as a `Select` rather than a chip row

## ADDED Requirements

### Requirement: The Changes entity section renders the Review Queue archetype

The **Changes** entity section of the overview SHALL render the **Review Queue** archetype over the change-bucket resolved sections of the lens (its `github`/`gitlab` sections). It SHALL group changes into **relationship lanes** derived from each source's query: a `review-requested` query feeds a "Requested your review" lane, an `authored` query feeds an "Authored by you" lane, and any other query feeds its own labelled lane; lanes render in that priority order, each as a frosted-glass panel.

Each change SHALL render as a **row** (not a magazine card) presenting, left to right: a CI light (from `status`, with `draft` shown as a distinct hollow glyph), the full untruncated title, a `host/owner/repo` subline (host from the source `baseUrl`, `owner/repo` from `change.repo`) with the author, a `ReviewerRail` (a verdict icon — blocking-wins `changes` > `pending` > `approved` — leading verdict-tinted reviewer `Avatar`s), a `Diffstat` (`change.additions`/`deletions`), and a relative age (from `change.updatedAt`) that warms to `--warning` past a staleness threshold. Activation SHALL reuse `openLensItem` and the existing per-window bind/focus semantics; the existing calm pending/error/signed-out/needs-access states SHALL be reused; no non-`ok` state SHALL render as a red error card.

#### Scenario: The Changes section renders lanes of rows

- **GIVEN** a lens with `review-requested` and `authored` github sections, all `ok`
- **WHEN** the overview renders
- **THEN** the Changes section shows a "Requested your review" lane above an "Authored by you" lane of `Change` rows — not magazine cards

#### Scenario: A row shows the change's triage signals

- **GIVEN** a review change with CI `ok`, two reviewers (one approved, one pending), `+112 −40`, updated 2h ago
- **WHEN** its row renders
- **THEN** it shows the CI light, title, `host/owner/repo · @author`, a reviewer rail with the pending verdict icon, a `+112 −40` diffstat, and a "2h" age

#### Scenario: Activation reuses openLensItem

- **WHEN** the user activates a change row in window 100
- **THEN** `openLensItem` is dispatched with the namespaced item id and the existing bind/focus behaviour applies

### Requirement: The Articles entity section renders a magazine

The **Articles** entity section of the overview SHALL render the magazine archetype over the lens's `rss` (article-bucket) resolved sections, merging every feed into one section. It SHALL reuse the existing feed card rendering (`LensPageItem` cards with cover image / generated initial, recessed favicon, title, excerpt, source · age footer) and the existing per-feed reading controls. It SHALL ADD page-local ephemeral controls (no persistence, no bus command) that do not exist in the current generic feed view: a **feed filter** (chips: "All feeds" + one per feed source, narrowing the rendered articles), a **layout toggle** (`SegmentedControl`: Grid | List), and an **unread filter** (toggle showing the unread count, narrowing to unread items). An unread item in List layout SHALL carry a leading accent unread dot. The section SHALL render only when the lens has at least one `rss` source.

#### Scenario: The Articles section merges feeds with magazine cards

- **GIVEN** a lens with three `rss` feeds, all `ok`
- **WHEN** the overview renders
- **THEN** the Articles section shows one merged magazine of cards across the three feeds, with a "Feed" filter chip row, a Grid/List toggle, and an Unread toggle

#### Scenario: The feed filter narrows to one source

- **GIVEN** the Articles section showing three feeds
- **WHEN** the user activates a single feed's filter chip
- **THEN** only that feed's articles render, and no state is persisted

#### Scenario: The layout toggle switches grid and list

- **WHEN** the user switches the layout toggle from Grid to List
- **THEN** the same articles re-render as list rows (unread items leading with an accent dot), with no reflow animation

#### Scenario: The unread filter narrows to unread items

- **GIVEN** the Articles section with 6 articles, 3 unread
- **WHEN** the user activates the Unread toggle (labelled with the count)
- **THEN** only the 3 unread articles render

## REMOVED Requirements

### Requirement: The lens editor selects a lens kind

**Reason**: The editor is now connection-first (no kind picker); `lensKind` is derived by the SW from the source set, not selected by the user. See the modified `A lens carries a kind` and `Creation and configuration via the pinned-header menu` requirements.

**Migration**: No change to the persisted field's shape. The SW derives and persists `lensKind` from the sources on create/update **and once for every existing lens node on boot** (see `A lens carries a kind`), so a pre-existing `'general'` lens holding a git source becomes `'review'` and renders enriched Changes without an edit. Overview rendering no longer reads the stored kind — the page derives each section's entity via `entityForSource` — so the persisted field remains only to gate per-section Change enrichment. The `createLens`/`updateLens` payloads drop the `lensKind` field (see the `typed-message-bus` capability).

### Requirement: The review lens renders a Review Queue page

**Reason**: The full-page surface no longer branches on a single `lensKind`; it always renders the entity-grouped overview (see the modified `The page renders all resolved sections`), folding each lens's resolved sections into Changes → Articles → Generic entity sections. Single-archetype-per-page routing (review ⇒ queue, else ⇒ generic grid) no longer exists.

**Migration**: No data migration — the overview folds resolved sections at render time. The queue rendering is preserved by the new `The Changes entity section renders the Review Queue archetype`, the feed grid by `The Articles entity section renders a magazine`, and the prior generic grid survives as the **Generic** entity section for any non-git/non-feed (e.g. jira) sources. A pure-review lens shows only the Changes section (identical queue rows); a feed-only lens shows only Articles.
