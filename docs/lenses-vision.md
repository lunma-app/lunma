# Lenses — north-star

> **Status: forward-looking.** This is the agreed target for reinventing
> "smart folders" as **Lenses**. It is a roadmap, not a description of shipped
> behaviour — each phase below lands as its own OpenSpec change, and the living
> specs under `openspec/specs/` remain the source of truth for what exists.
> When a phase ships, its reality moves into the specs and this doc's roadmap
> shrinks accordingly.

## The idea in one move

Today a "smart folder" is an **untyped bag**: the *type* lives on each source
(`gitlab | github | jira | rss`), the folder mixes them freely, and everything
flattens to one generic row. The page can only ever be a generic card grid.

A **Lens** inverts that. The **type lives on the folder** (its `kind`), and
sources become **adapters** that normalise *into one canonical entity*. The
page is then a function of the entity — a board for tickets, a review queue for
changes, a magazine for reading.

```
TODAY  — type on the source, folder is a bag, page is generic
  folder ─┬ gitlab(authored,reviewing) → row
          ├ jira(assigned)             → row
          └ rss(feed)                  → row     ▶  one generic card grid

LENS   — type on the folder, sources adapt into one entity, page fits it
  Review lens (kind = review)
    ├ github-pr ┐
    ├ gitlab-mr ┼─▶ Change[]  ─▶  Review Queue page
    └ …         ┘                 │
                                  └ Change.refs ─▶ Issue in your Tickets lens
```

The payoff falls out of the structure:

- **A page that fits** — a kanban is trivial over a canonical `Ticket`,
  impossible over a generic row. The page is chosen by `kind`.
- **Sources merge for free** — Jira + Linear + GitHub Issues all become
  `Ticket[]`; the board never asks where a card came from.
- **Cross-entity links become data** — entities carry typed references
  (`Change.refs → Ticket`), so "this PR closes PROJ-123" is a chip, not text.

### What shipped: connection-first, kind derived, one entity-merged overview

The `sources-redesign` change established the connection-first model; the
`lens-overview` redesign then widened the entity set to four (`Change`, **`Ticket`**,
`Article`, and the untyped `generic` fallback), landing roadmap **#3 (Tickets)** +
**#4 (refs L0)** below in part:

- **Connection-first, not kind-first.** The editor has **no kind picker**. The user
  names the lens and picks the **connections** it reads from (all sources, accounts
  and feeds alike); a derived preview names the entities those connections produce
  (`entitiesForSource` — a git source previews **Changes + Issues**).
  `lensKind` is **derived by the SW** from the source set — any `github`/`gitlab`
  source ⇒ `'review'`, else `'general'` — never chosen, and never sent on the bus.
  A lens may freely **mix** providers (git + rss + jira). The kind survives only to
  gate per-section Change enrichment; the SW re-derives it once on boot for existing
  lenses. (`shared/lens-entity.ts` holds `deriveLensKind` + `entityForSource` +
  `entitiesForSource` + `entityForItem`.)
- **One overview, merged by canonical entity — PER ITEM.** The full-page view no
  longer routes on a single `kind`, and bucketing moved from *sources* to *items*:
  `OverviewPage` flattens the lens's OK sections into a tagged item list and buckets
  each item by `entityForItem` (its populated typed bag, NOT its provider) — so ONE
  github section yields both `Change` rows (PRs) and `Ticket` rows (issues). It renders
  one section card per non-empty bucket, in canonical order
  **Changes → Issues → Reading → Other**: a Review-Queue-style Changes list (each row a
  synthesized CI verdict + an inline linked-ticket chip from `refs[0]`), an Issues
  board merging Jira + git issues by `statusCategory`, a feed magazine for Reading, the
  generic per-source rows for the rest. `LensPage` is a **single-lens** page (the side
  panel is the lens nav — no second in-page rail); it tints `--lens-h` to the lens's
  Space hue. So "the page is chosen by `kind`" (below)
  is realised as "the page merges by *entity*, per item", with `kind` reduced to the
  enrichment gate. **`entityForSource`** survives as the source-level hint (editor
  preview, jira → `ticket`); **`entityForItem`** is the overview router.
- **The overview is a width-aware board, not a stack (`redesign-lens-overview-board`).**
  The single-lens page (`min(96vw, 1440px)`) leads with a **"Waiting on you" lane** —
  a cross-entity actionable set (review-requested changes, CI-failing authored changes,
  assigned non-done tickets), derived purely from the query axis + CI tone
  (`waitingOnYou` in `overview-vm`), carrying the Space hue glow. Each lane row leads
  with an `EntityBadge` (a `ui/` primitive: pull-request glyph on change-blue 252 vs
  issue-dot on ticket-purple 295 — shape + colour, colour-blind safe). Beneath it,
  **Changes and Issues render side-by-side as two columns when both are populated** (a
  CSS container query; a single populated entity spans full width), with Articles and
  Other full-width below. **Change and Issue rows are two-line**: the full title (never
  truncated) on its own line, then a triage/owner line — for Changes the repo + CI light
  + `ReviewerRail` + `Diffstat`; for Issues the assignee (`Avatar` + name, or a hollow
  "Unassigned") + an updated-age freshness cue that warms to `--warning` past a week +
  the priority pill. Scope filters (repos/projects/feeds) live **inside their owning
  entity card** — there is no entity-type filter bar (the always-visible columns plus
  per-card collapse make it redundant; `LensFilter.entities` stays in the model,
  unused by the overview). Articles keep both views: **Grid** (responsive multi-column)
  and **List** (a single column capped to a reading measure — List is not multi-column,
  Grid is); thumbnails are quiet (dimmed + desaturated) at rest and wake to full colour
  on hover/focus.

## Naming

"Lens" replaces "smart" **everywhere** — there is no dual vocabulary. The full
rename is part of phase 1:

| Today | Lens |
|---|---|
| `PinNode` `kind: 'smart'` | `kind: 'lens'` |
| `SmartSourceConfig` | `LensSource` |
| `ResolvedSourceConfig` | `ResolvedLensSource` |
| `SmartFolderItem` | `LensItem` |
| `SmartSectionRuntime` / `SmartFolderRuntime` | `LensSectionRuntime` / `LensRuntime` |
| `AppState.smartFolders` | `AppState.lenses` |
| `AppState.smartItemBindings` | `AppState.lensItemBindings` |
| `AppState.smartReadState` | `AppState.lensReadState` |
| `createSmartFolder` / `updateSmartFolder` / `openSmartItem` / … | `createLens` / `updateLens` / `openLensItem` / … |
| `SmartFolderEditor.svelte` | `LensEditor.svelte` |
| `launcher/folderpage` (`FolderPage.svelte`) | `launcher/lenspage` (`LensPage.svelte`) |
| capability `smart-folders` | capability `lenses` |

The user-facing word is **Lens** (plural **Lenses**); a Lens has a **kind**.

## The registry: kind → entity → adapters → page

A Lens `kind` binds three things. This is the spine of the architecture: a small
registry keyed by `kind`, plus a per-`(kind, provider)` adapter table.

| kind | canonical entity | adapters (MV3-reachable) | page archetype |
|---|---|---|---|
| `reading` | `Article` | rss / atom | Magazine *(exists today)* |
| `review` | `Change` (PR/MR) | github-pr, gitlab-mr | Review Queue |
| `tickets` | `Ticket` (issue) | jira *(exists)*, github-issues, gitlab-issues, linear(?) | Board / standup |
| `ci` | `Run` | gitlab-pipelines, github-actions | Status wall |
| `inbox` | `Notification` | github-notifications, gitlab-todos | Triage inbox |
| `repos` | `Repo` | github, gitlab | Activity cards |
| `general` | `LensItem` (base only) | any provider (mixed) | the generic page *(today's behaviour)* |

`general` is **today's untyped bag preserved as one kind** — every existing
folder migrates into it losslessly. Typed lenses are single-kind by
construction (a board needs all-tickets); `general` is the only kind that mixes
providers. There is no "source code" kind — that was two entities (a `Repo` and
a `Run`) wearing one trench coat.

### Provider × kind (the target source model)

A source's identity is a first-class **Account** (`decouple-source-accounts`): a
persisted, broadcast-safe `SourceAccount = { id, provider, baseUrl, name? }` in
`AppState.sources`, configured once and reused across lenses. A lens no longer
embeds the host on each entry — it **references** accounts:
`LensSourceRef = { sourceId, filters }` (the persisted `queries`). The
relationship is many-to-many (`Source 1—* ref *—1 Lens`): one account feeds
`review-requested` in one lens and `authored` in another, and one host may hold
two accounts (personal + work). The token lives only in the separate
`lunma.connectors` secrets store, keyed by `sourceId` (never on the account, never
broadcast). The lens's `kind` **plus** the referenced account's `provider` selects
the adapter; `filters` are the kind-specific canned queries:

```
                provider
                github      gitlab      jira/atlassian   rss
kind  review    PR adapter  MR adapter  —                —
      tickets   issues      issues      issues(exists)   —
      ci        actions     pipelines   —                —
      inbox     notifs      todos       —                —
      repos     repos       repos       —                —
      reading   —           —           —                feed(exists)
```

Today's `SmartSource` conflates provider + what (`github` *means* "github PRs").
The migration of `source → provider` and `query → kind-specific filter` happens
**inside each kind's phase**, not in the rename — phase 1 keeps today's source
semantics verbatim under `kind: 'general'`.

## Entity model

Keep the base item; add a **typed data bag** per kind (the pattern already shipped
for RSS's optional `excerpt`/`imageUrl`/`publishedAt`). No discriminated-union
churn through the runtime slice, bindings, or schema — the lens's `kind` tells
the page which bag to read. The bags ride the **ephemeral** runtime slice, so
they need **no schema migration**.

```ts
interface LensItem {
  id: string;        // namespaced sectionKey:nativeId (binding key)
  title: string;
  url: string;
  status?: { tone: 'ok' | 'pending' | 'warn' | 'fail'; label: string };

  // exactly one bag populated, by the lens kind (none for general):
  article?:      ArticleData;       // reading
  change?:       ChangeData;        // review
  ticket?:       TicketData;        // tickets
  run?:          RunData;           // ci
  notification?: NotificationData;  // inbox
  repo?:         RepoData;          // repos

  refs?: EntityRef[];               // cross-entity references (L0+)
}

interface ArticleData      { excerpt?: string; imageUrl?: string; publishedAt?: number }
interface ChangeData       { author: string; repo: string; reviewers: { login: string; state?: 'approved'|'changes'|'pending' }[]; draft: boolean; additions?: number; deletions?: number; targetBranch?: string; updatedAt: number }
interface TicketData       { key: string; statusCategory: 'todo'|'in-progress'|'done'; statusLabel: string; assignee?: string; priority?: 'low'|'med'|'high'|'urgent'; labels?: string[]; project?: string; updatedAt: number }
interface RunData          { ref: string; commit?: string; durationMs?: number; triggeredBy?: string }
interface NotificationData { reason: string; context: string; unread: boolean; updatedAt: number }
interface RepoData         { lastActivity: number; openChanges?: number; openTickets?: number; defaultBranch?: string }

interface EntityRef {
  kind: 'ticket' | 'change' | 'run';  // the referenced entity's kind
  key: string;                         // e.g. 'PROJ-123' or a normalised url-key
  url: string;                         // canonical url (L0 target)
  label: string;                       // display
  // L1 resolution against other lenses' runtime is computed at render, not stored.
}
```

Phase 1's rename leaves `excerpt`/`imageUrl`/`publishedAt` **flat** (pure
rename, no restructure); they fold into `article` when the Reading lens phase
lands. The `lens-overview` redesign added a fourth flat article field —
`genre?: string` (the feed `<category>`) — under that same staging, and shipped
the `ticket?: TicketData` bag + `refs?: EntityRef[]` (L0) ahead of their phases
(see "What shipped" above). All ride the ephemeral runtime slice — no migration.

## Cross-entity links — staged

```
L0  extract refs, render as chips        PR body "Closes PROJ-123" → chip → opens the Jira URL
    (no cross-folder awareness)          cheap; works even if PROJ-123 is in no lens

L1  resolve refs to entities you         chip notices PROJ-123 lives in your Tickets lens →
    already hold in another lens         deep-links there, hover-previews the ticket card

L2  true entity graph (on-demand fetch)  open a ticket, see its PRs + CI even if not in a lens
```

Entities carry typed `refs` from phase 2; rendering climbs L0 → L1 → L2 over
later phases.

## Roadmap (decide once, build in slices)

Each row is its own OpenSpec change delivering user-visible value (or the
smallest plumbing for the *named* next phase — Lunma's no-stranded-infra rule).

| # | Change | Delivers |
|---|---|---|
| 1 | **Establish the Lens model** — full `smart → lens` rename + `lensKind` field + `general` kind + one schema migration *(in progress — `establish-lens-model` change)* | Clean foundation; existing folders become `general` lenses, zero behaviour change. Plumbing for #2. |
| 2 | **Review lens, end-to-end** — `Change` entity + `github-pr`/`gitlab-mr` adapters enriched + **Review Queue page** *(shipped — `review-lens` change)* | First typed lens; proves entity→adapter→page registry. |
| 3 | **Tickets lens, end-to-end** — `Ticket` entity + `jira`/`github-issues`/`gitlab-issues` adapters + **Board page** *(largely landed — `lens-overview`: `TicketData` bag, all three adapters, the Issues board; deferred: GitHub/GitLab in-progress lane + GitHub issue priority, which have no native source)* | Second kind validates the registry generalises. |
| 4 | **Cross-entity refs, L0** — extract typed refs, render as chips linking to URLs *(landed — `lens-overview`: PR/MR linked-ticket chip from title/body; L1/L2 still ahead)* | "This PR closes PROJ-123" becomes a click. |
| 5 | **Cross-folder resolution, L1** — chip deep-links to the entity in another lens + hover preview | The felt ticket↔PR link. |
| … | `ci` / `inbox` / `repos` lenses, then L2 graph | Each its own slice. |

## Decisions log

| Decision | Choice |
|---|---|
| Container name | **Lens** (full rename, no dual vocabulary) |
| Where `kind` lives | folder-level field `lensKind` on the `lens` PinNode |
| Flagship first | **Review** (both adapters already exist; opens linking) |
| "Source code" | **split** into `repos` + `ci`; dropped as a literal kind |
| Mixed folders | superseded by connection-first: any lens mixes providers; the overview merges by *entity* per item, so a git-derived lens surfaces **both** Changes (PRs) and Issues (its issues). `general` still preserves today's bag; existing → `general`. |
| Entity model | base `LensItem` + typed `data` bag, derived **per item** by `entityForItem` (`change`/`ticket`/`article`/`generic`) — not per source. No union churn; all bags ephemeral. |
| Linking | typed `refs` on `LensItem`; L0 (extract + chip) landed in `lens-overview`; L1 → L2 over later phases |
| Frontend design | run `/frontend-design` per typed page at its phase, not all six up front |
| `collapsible-smart-folder-sections` | already implemented — out of scope, untouched |
| OPML import/export field naming | `buildOpml` / `parseOpml` in `shared/opml.ts` operate on `LensNode` (the `kind: 'lens'` PinNode shape) — the XML format is unchanged (still `type="rss"` OPML 1.0); only the TypeScript type alias was renamed. No user-visible change. |
