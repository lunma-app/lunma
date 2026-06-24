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

A `LensSource` becomes `{ provider, baseUrl, filters }`. The lens's `kind`
**plus** each source's `provider` selects the adapter; `filters` are the
kind-specific canned queries:

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
interface ChangeData       { author: string; reviewers: { login: string; state?: 'approved'|'changes'|'pending' }[]; draft: boolean; additions?: number; deletions?: number; targetBranch?: string; updatedAt: number }
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
lands.

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
| 2 | **Review lens, end-to-end** — `Change` entity + `github-pr`/`gitlab-mr` adapters enriched + **Review Queue page** *(run `/frontend-design`)* | First typed lens; proves entity→adapter→page registry. |
| 3 | **Tickets lens, end-to-end** — `Ticket` entity + `jira`(exists)/`github-issues`/`gitlab-issues` adapters + **Board page** *(run `/frontend-design`)* | Second kind validates the registry generalises. |
| 4 | **Cross-entity refs, L0** — extract typed refs, render as chips linking to URLs | "This PR closes PROJ-123" becomes a click. |
| 5 | **Cross-folder resolution, L1** — chip deep-links to the entity in another lens + hover preview | The felt ticket↔PR link. |
| … | `ci` / `inbox` / `repos` lenses, then L2 graph | Each its own slice. |

## Decisions log

| Decision | Choice |
|---|---|
| Container name | **Lens** (full rename, no dual vocabulary) |
| Where `kind` lives | folder-level field `lensKind` on the `lens` PinNode |
| Flagship first | **Review** (both adapters already exist; opens linking) |
| "Source code" | **split** into `repos` + `ci`; dropped as a literal kind |
| Mixed folders | typed lenses single-kind; **`general` preserves today's bag**; existing → `general` |
| Entity model | base `LensItem` + typed `data` bag per kind (no union churn) |
| Linking | typed `refs` from phase 2; render L0 → L1 → L2 over later phases |
| Frontend design | run `/frontend-design` per typed page at its phase, not all six up front |
| `collapsible-smart-folder-sections` | already implemented — out of scope, untouched |
| OPML import/export field naming | `buildOpml` / `parseOpml` in `shared/opml.ts` operate on `LensNode` (the `kind: 'lens'` PinNode shape) — the XML format is unchanged (still `type="rss"` OPML 1.0); only the TypeScript type alias was renamed. No user-visible change. |
