## Why

Lunma's source/lens surfaces don't yet match the redesign captured in
`Sources Redesign.dc.html`. Today a user manages auth accounts and RSS feeds in
two lopsided Options cards, builds a lens by first picking a *kind* and then
filtering sources, and reads each lens as a single-archetype page (a Review
Queue **or** a generic grid, never both). The redesign — the direct user-visible
value here — collapses that into one **Connections** manager, a
**connection-first** editor (pick what to read; the view follows), and **one
overview per lens that merges its connections by canonical entity** (Changes +
Articles). This change realizes the design for the capabilities that exist
today; it adds **no** new data sources, connectors, or entity types
(CI / Tickets / Inbox / Repos sections remain future work).

**Docs touched by this change:** `docs/lenses-vision.md` (record the
connection-first lens model — kind is derived from the connections, not chosen
up front — and the entity-merged overview); `docs/architecture.md` (the options
surface now composes a single Connections manager; the lens page renders by
canonical entity). **Left untouched:** `docs/tech-stack.md` (no stack or
dependency change).

## What Changes

- **Options → one Connections manager.** The separate `ConnectorsCard`
  (Accounts) and `FeedSubscriptions` (Feeds) cards merge into a single
  **Connections** card with an **Accounts** group and a **Feeds** group, matching
  the design's 620px panel. Each row keeps its identity glyph + name; accounts
  keep their derived status pip and reach subline ("powers …"); feeds gain a real
  **per-feed row** (URL + reach) instead of being managed only in bulk.
- **A Service-dropdown connect picker.** The always-visible per-provider form is
  replaced by a single **+ Connect** affordance opening a **Service** `Select`
  (GitHub / GitLab / Jira / RSS feed) with the provider-appropriate fields
  (host + token for accounts, URL for feeds) — so it scales past four providers.
  OPML import becomes the **bulk feed-add** path inside the feed branch of that
  picker; **Export OPML** stays a small utility on the Feeds group header.
- **Per-feed management surfaces existing commands.** Feed rows expose Rename /
  Copy URL / Remove; account rows expose Replace-token / Rename / Disconnect.
  Rename / Disconnect reuse the existing `renameAccount` / `deleteAccount` bus
  commands (rss is a `SourceAccount` too); Replace-token reuses the existing
  **off-bus** `setAccountToken` storage helper (`shared/connectors.ts`, kept off the
  command bus so the secret never rides a broadcast) — no new bus commands.
- **Connection-first lens editor.** The editor drops the up-front **kind**
  selector. The user names the lens and picks the **connections** it reads from
  (with inline connect for a new one); the sections it will show are **derived**
  from those connections. **Create opens the lens overview.** The tree → editor
  two-step panel matches the design.
- **`lensKind` is derived by the SW, not chosen. BREAKING (bus payload).**
  `createLens` / `updateLens` no longer carry a client-supplied `lensKind`; the
  SW derives it from the source set (any github/gitlab connection ⇒ Change
  enrichment is enabled; otherwise `general`). The node still persists a
  `lensKind` (no schema bump); only the *input* moves. The SW also re-derives
  `lensKind` once on boot for existing lenses, so a pre-existing `general` lens that
  holds a git account renders as enriched Changes — a visible change to that lens
  (confirmed in scope; see `design.md` D9).
- **A lens may mix accounts and feeds.** The github/gitlab-only restriction lived
  in the editor's kind picker (the SW handler already accepts a mixed source set);
  removing the picker lets a single lens hold git accounts **and** rss feeds. Change
  enrichment runs only on the git sections; rss sections always render as Articles.
- **One overview, merged by canonical entity.** The lens page stops branching on
  a single kind. It groups its resolved sections into **entity sections** and
  renders each with the right archetype: **Changes** (git PRs/MRs — review-queue
  rows, repo filter, CI glyph, reviewer rail, diffstat) and **Articles** (rss —
  magazine grid/list, feed filter, unread toggle), merging multiple connections
  of the same entity into one section. Jira / other queue items render in a
  generic list (no new "Tickets" archetype — explicitly out of scope).
- **Sidebar tree stays source-sectioned (scoped).** The pinned-tree lens
  rendering (per-source `host · filter` sections, collapse, bindings) is left
  as-is; the entity-merge lives on the overview page. The sidebar redesign is the
  connection-first editor + the visual pass. (This narrows a literal reading of
  "sidebar … as per design" — see `design.md` D7.)
- **Visual pass to the design.** All three surfaces adopt the design's spacing,
  card treatment, chips, and motion from the shared `@lunma/tokens` recipes; no
  raw values, no new tokens.

No new connectors, providers, entity types, secrets, permissions, dependencies,
or schema version. The connector fetch/auth logic and the runtime slice are
unchanged — only how sources are *assembled* (connection-first), how `lensKind`
is *derived*, and how results are *grouped for rendering* (by entity) move.

## Capabilities

### New Capabilities

<!-- none — this change restructures existing surfaces; no new capability spec -->

### Modified Capabilities

- `lenses`: the editor becomes connection-first (the "select a lens kind" step is
  removed; `lensKind` is derived from the source set); a lens may mix git
  accounts and rss feeds; the full-page view renders **by canonical entity**
  (Changes + Articles) merging connections of the same entity, replacing the
  single-kind page routing (the pinned-tree lens rendering stays source-sectioned).
- `connector-accounts`: the Options Accounts manager becomes a unified
  **Connections** manager (Accounts group + Feeds group); the connect affordance
  becomes a **Service**-dropdown picker; account/feed rows expose their lifecycle
  via per-row menus.
- `opml-import-export`: the Feed-subscriptions card folds into the Connections
  manager's **Feeds** group as a per-feed list; OPML import moves into the connect
  picker's feed branch; Export OPML stays a Feeds-group utility.
- `typed-message-bus`: the `createLens` / `updateLens` payloads drop the
  client-supplied `lensKind` (the SW derives it from the sources); `createLens`
  gains an optional client-minted `id` (mirroring `createAccount`) so the editor
  can open the new lens's overview page; the account lifecycle commands are reused
  for feed rows (rss `SourceAccount`s).

## Impact

- **`apps/extension/src/options/`** — `ConnectorsCard.svelte` +
  `FeedSubscriptions.svelte` → a single `ConnectionsCard.svelte` (Accounts group,
  Feeds group, Service-dropdown connect picker); `Options.svelte` composes the one
  card. OPML export stays; OPML import re-homed into the picker.
- **`apps/extension/src/sidebar/`** — `LensEditor.svelte` becomes connection-first
  (no kind selector; derived sections preview) + visual pass. `Lens.svelte` /
  `LensSectionHeader.svelte` pinned-tree rendering is unchanged (entity-merge is the
  overview page's job — see `design.md` D7).
- **`apps/extension/src/launcher/lenspage/`** — `LensPage.svelte` stops branching
  on `lensKind`; a new `OverviewPage.svelte` (feature component) buckets the lens's
  sources by canonical entity and routes each non-empty bucket to its own renderer:
  **Changes** → `ReviewQueue`/`ChangeRow` (reused), **Articles** → a new
  `ArticlesSection.svelte` feature component (merged magazine reusing `LensPageItem`),
  **Generic** → `GeneralLens` (reused). `ReviewQueue`/`GeneralLens` gain an `embedded`
  prop (OverviewPage owns the page header + collapsible card chrome) and `LensPageItem`
  a `compact` prop (the List layout's hero-less row). `LensFilterBar.svelte` serves the
  Changes filter. (The per-entity-component split + `ArticlesSection.svelte` were
  agreed with the user — see `design.md` D6/D10.)
- **`apps/extension/src/background/`** — `handlers/lenses.ts` derives `lensKind` via
  `deriveLensKind` on create/update (the handler already accepts a mixed source set);
  a one-time boot pass re-derives `lensKind` for existing lens nodes. No connector or
  coordinator contract change.
- **`apps/extension/src/shared/`** — `bus.ts` `createLens`/`updateLens` payloads
  drop `lensKind`; a new entity type `LensEntity` (`'change' | 'article' | 'generic'`)
  with its `entityForSource` derivation helper, and a `deriveLensKind(sources,
  getAccount): LensKind` helper, are added in a DAG-safe shared module (used by the
  editor preview, the page grouping, the create/update handler, and the boot
  re-derivation).
- **`apps/extension/src/ui/`** — composes existing primitives (`SettingsCard`,
  `Surface`, `AccountChip`, `AccountConnectField`, `Chip`, `SegmentedControl`,
  `Select`, `RowMenu`/`Menu`, `Button`, `Icon`, `Diffstat`, `ReviewerRail`,
  `LensPageItem`) and ships **one new primitive**, `ServiceConnectPicker.svelte` —
  the shared Service-dropdown connect picker used by both `ConnectionsCard` (options)
  and `LensEditor` (sidebar); it must live in `ui/` because the import DAG forbids a
  cross-surface component under either surface (same pattern as `AccountConnectField`).
  `ConnectionsCard` and `OverviewPage` are feature components. Any further primitive
  gap will be raised as a deviation before landing.
- **No new dependencies, no manifest/permission change, no schema-version bump.**
