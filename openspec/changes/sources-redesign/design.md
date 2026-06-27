## Context

The `decouple-source-accounts` change (now archived) made a connected **Account**
a first-class `SourceAccount` in `AppState.sources`, lenses reference sources by
`LensSourceRef { sourceId, queries }`, tokens are keyed by `sourceId`, and `rss`
is a `SourceAccount` flagged a **Feed** by `isFeedProvider`. That data contract is
**fixed** here — this change is presentation + assembly, not a re-model.

Current surfaces (verified in the working tree):

- **Options** composes two cards: `ConnectorsCard.svelte` (the Accounts manager —
  rows with glyph, derived status pip, reach, `⋯` menu, an always-visible connect
  form) and `FeedSubscriptions.svelte` (Export-OPML only; no per-feed list).
- **Sidebar** `LensEditor.svelte` is **kind-first**: a `SegmentedControl`
  (`general | review`) gates which providers the picker shows, then Name, source
  picker with per-account filter chips, inline connect / add-feed, settings, and
  Create/Save. `Lens.svelte` renders a multi-section lens grouped **by source**
  (`host · filter` headers via `LensSectionHeader.svelte`).
- **Lens page** `LensPage.svelte` branches on `node.lensKind`: `review` →
  `ReviewQueue.svelte` (relationship lanes, repo/source filter, `ChangeRow` with
  CI light + reviewer rail + diffstat); else → `GeneralLens.svelte` (per-source
  sections, feed grid via `LensPageItem`, queue rows). **One archetype per page —
  never merged.**

The design (`Sources Redesign.dc.html`) shows the end state for **three** surfaces:
a 620px **Connections** manager (Accounts + Feeds groups, Service-dropdown connect),
a 380px **connection-first** side-panel editor (tree step → editor step, no kind
picker, "Create opens the overview"), and a 720px **overview** that merges a lens's
connections **by canonical entity** into Changes + Articles sections. The design
also depicts entities that do **not** exist in code (CI / Tickets / Inbox / Repos)
and seven lens "kinds"; per the agreed scope those are **out** — we build only the
Change and Article entities the connectors already emit.

## Goals / Non-Goals

**Goals:**

- Realize the design's **structure** for the three surfaces with the capabilities
  that ship today.
- One **Connections** manager (Accounts group + Feeds group + Service-dropdown
  connect picker; per-feed rows; OPML as the bulk feed-add path).
- A **connection-first** editor: name + connections; `lensKind` derived; Create
  opens the overview.
- A single **overview** that groups a lens's resolved sections by canonical entity
  (**Changes**, **Articles**) and renders each with the existing archetype, merging
  multiple connections of the same entity.
- Hit the visual bar from the shared `@lunma/tokens` recipes; reduced-motion +
  WCAG-AA hold.

**Non-Goals:**

- **No** new entity types or page archetypes (CI / Tickets / Inbox / Repos).
- **No** new connectors, providers, data sources, secrets, permissions, or
  dependencies.
- **No** schema-version bump; the `SourceAccount` / `LensSourceRef` / token
  contract is untouched.
- **No** change to connector fetch/auth logic or the ephemeral runtime slice.
- The top "Overview / New lens / Connections" nav in the `.dc.html` is **prototype
  chrome**, not extension UI; the real entry points (Space header `⋯`, lens row
  `⋯`, Options) are unchanged.
- **Re-grouping the pinned-tree lens rendering by entity is out of scope** (see D7);
  the tree keeps its per-source sections and the entity-merge lives on the overview
  page. This deliberately narrows "sidebar … as per design".

## Decisions

### D1 — One `ConnectionsCard.svelte` replaces both Options cards

`ConnectorsCard.svelte` and `FeedSubscriptions.svelte` are removed; a new feature
component `ConnectionsCard.svelte` composes `SettingsCard` and renders two grouped
sections: **Accounts** (github/gitlab/jira `SourceAccount`s — `AccountChip` glyph,
name, derived status pip, reach "powers …" line, `RowMenu`) and **Feeds** (rss
`SourceAccount`s — glyph, name, URL + reach line, `RowMenu`). `Options.svelte`
composes the single card at the Connectors anchor (`id="connectors"` is retained so
the sidebar's existing `openOptionsAt('#connectors')` signed-out deep-link still
resolves).

*Alternative considered:* keep two cards, restyle only. Rejected — the design's
whole point (and the handoff's core complaint) is the lopsided Accounts/Feeds split;
restyle-only cannot match the design.

### D2 — A Service-dropdown connect picker (reuse, don't re-roll)

The always-visible connect form is replaced by a `+ Connect` `Button` that reveals
a picker: a **Service** `Select` (`GitHub | GitLab | Jira | RSS feed`) driving the
fields — host + a **method-aware token** field for accounts (a password
`TextInput`, optional for a session-capable provider, required for a `pat`-only
one), a URL `TextInput` for feeds. (The token uses a password `TextInput` + the
single `Connect` commit rather than the standalone `AccountConnectField` primitive,
because `AccountConnectField`'s Connect button disables on an empty token — it
cannot commit a session-capable account *without* a token, which the picker must;
this matches the prior add-form pattern and the normative "optional for
session-capable" behaviour. `AccountConnectField` stays the inline reconnect/replace
affordance on the lens page + the Connections rows.) The picker is the **same component** used by the editor's
inline "Connect a service" beat, so connect lives in one place: it ships as
`apps/extension/src/ui/ServiceConnectPicker.svelte` (the one new `ui/` primitive this
change adds — see D10), imported by both `ConnectionsCard` (options) and `LensEditor`
(sidebar). OPML import is the feed branch's secondary action ("Have a lot? Import an
OPML file") in two host-set modes: the Connections manager (hosted with `spaces`) keeps
the existing `parseOpml` → `importOpml` standalone-feed-folder-lens path; the lens editor
(hosted with an `onImportFeeds` callback, no `spaces`) instead find-or-mints an rss
account per parsed feed (deduped by normalized base URL — `normalizeBaseUrl`, lifted to
`shared/account-ui` so editor + SW agree) and pre-selects them INTO the lens being built,
so building a lens with feeds never spawns a separate "Feeds" lens.

### D3 — Per-feed rows reuse the account lifecycle (no new commands)

Because rss is a `SourceAccount`, feed Rename / Remove map directly onto the
existing `renameAccount` / `deleteAccount` bus commands; "Copy URL" is local. This
makes Feeds a real per-feed manager (the handoff's gap) **without** new bus surface
or storage. Export OPML stays via `buildOpml`, keyed on a referenced rss account.

### D4 — Connection-first editor; SW derives `lensKind`

The editor removes the `general | review` `SegmentedControl`. Flow: Name →
**connections** picker (checkable rows over all `SourceAccount`s, inline connect) →
a derived **"this lens will show …"** section preview → settings → Create. On
confirm it dispatches `createLens`/`updateLens` **without** `lensKind`; the SW's
`handlers/lenses.ts` derives it via a shared `deriveLensKind(sources, getAccount):
LensKind` helper: **any github/gitlab source ⇒ `'review'`** (so `resolvedConfigs`
stamps `lensKind:'review'` and the git connectors run Change enrichment), **else
`'general'`**. The same helper runs **once on SW boot over every existing lens node**,
persisting any change (see D9), so pre-existing lenses gain a correct derived kind
without an edit. The node still persists `lensKind` — no schema change — only the
input moves off the wire.

*Alternative considered:* a new `'overview'`/`'mixed'` lens kind. Rejected — adds a
kind the scope excludes, and the entity grouping is a *rendering* concern that does
not need a new persisted kind.

**Create opens the overview (agreed with the user).** The editor needs the new
lens's id to open its overview page, but `createLens`'s ack returns no id. Rather
than a bespoke id-returning ack, `createLens` gains an **optional client-minted
`id`** — exactly the established `createAccount` pattern — so the editor mints the
id, dispatches `createLens` with it, then dispatches `openLensPage` for that id in
the sidebar's window. This keeps the dispatch fire-and-forget and race-free (the
editor owns the id; command ordering guarantees the node exists before
`openLensPage` runs). The SW still mints when no id is sent. (See the
`typed-message-bus` capability.)

### D5 — Canonical entity is derived from the source, in a DAG-safe helper

Add `entityForSource(provider): LensEntity` where
`LensEntity = 'change' | 'article' | 'generic'` — `github`/`gitlab` → `'change'`,
`rss` → `'article'`, `jira` (and any other queue provider) → `'generic'`. It lives
in a shared, layer-safe module (alongside `shared/connector-origins.ts`) so both the
editor preview (`sidebar`) and the page grouping (`launcher`) import it without
crossing the import DAG. Entity is **not persisted** — it is derived at render time,
so no migration and no runtime-slice change.

### D6 — `OverviewPage.svelte` groups resolved sections by entity

`LensPage.svelte` stops branching on `lensKind` and always renders
`OverviewPage.svelte`. `OverviewPage` buckets each of the lens's account refs by
`entityForSource(account.provider)`, and renders one **entity section** per
non-empty bucket, in canonical order **Changes → Articles → Generic**. Each entity
section is a collapsible `Surface variant="glass"` card whose header carries an
entity dot + title + count pill, and whose body **delegates to that entity's
dedicated renderer** over a sub-node filtered to the bucket's refs (agreed with the
user: "each type should have its own component; the routing is straightforward"):

- **Changes** — `ReviewQueue.svelte` (reused; CI light, reviewer rail, diffstat, age
  warming) with its `LensFilterBar` **repo + source** filter, fed by the
  change-bucket sub-node only.
- **Articles** — a dedicated **`ArticlesSection.svelte`** feature component (NEW —
  see D10) that **merges** the lens's `rss` sections into one magazine, reusing the
  `LensPageItem` feed card, and **adds** page-local controls that do not exist in the
  generic page today (a Grid/List `SegmentedControl`, feed-source filter chips, and
  an unread toggle with count). `LensPageItem` gains a `compact` prop so the List
  layout renders a feed entry as a hero-less row (unread items still lead with the
  accent dot).
- **Generic** — `GeneralLens.svelte` (reused) renders jira/other queue sections as
  the existing per-source glass panels (no new archetype).

`ReviewQueue` and `GeneralLens` gain an `embedded` prop that suppresses their own
page header (`OverviewPage` owns the page header + the collapsible card chrome);
their lanes/panels/filter-bar/calm states are otherwise unchanged. Per-section
`sourceKey` identity, item bindings, and runtime states are unchanged — grouping is
purely a render-time fold over the same resolved sections, so calm-failure /
needs-access / ghost states keep working per section.

*Alternative considered:* a third `OverviewPage` only for "mixed" lenses, leaving
`ReviewQueue`/`GeneralLens` as standalone pages. Rejected — two rendering paths for
the same data drift; one entity-grouped page subsumes both (a pure-review lens shows
just the Changes section; a pure-feed lens shows just Articles, identical to today).

### D7 — Sidebar scope: connection-first editor + restyle; tree stays source-sectioned

The sidebar redesign is the **connection-first `LensEditor`** (D4) plus a visual
pass. The **pinned-tree lens rendering** (`Lens.svelte` / `LensSectionHeader.svelte`
— per-resolved-section headers `host · filter`, per-section collapse, per-section
item bindings, badge sum) is **left as-is**. Re-grouping the tree by entity would
collide with the intricate, well-specified per-source section / collapse / binding
model (`Lens rendering and the one-glyph restraint`, `Multi-source lens sections
are individually collapsible`, `Lens item bindings …`) for secondary benefit; the
design's entity-merge belongs on the **overview page** (D6), which is the surface
that exists to show it. The `.dc.html` "tree step" entity labels are therefore
approximated by the unchanged source sections in the tree, and realized fully on the
overview. **This narrows a literal reading of "sidebar … as per design" and is
called out for review.**

### D8 — Mixed account + feed lenses; Change enrichment stays per git section

The SW create/update handler already accepts a mixed source set — `validateSourceRefs`
only enforces the per-source `queries` rule (rss ⇒ empty, queue ⇒ non-empty),
independent of provider/kind; there is **no** github/gitlab-only guard in the handler.
The git-only restriction on review lenses lived **client-side in the editor's kind
picker** (`LensEditor`'s `REVIEW_PROVIDERS` / `allowedProviders` / the prune on
kind-switch), and disappears when the kind picker is removed (D4). So a lens may hold
git accounts **and** rss feeds (and jira) with no handler change. Change enrichment is
gated per resolved section by `cfg.lensKind === 'review'` (which any git-bearing lens
derives), so rss/jira sections are untouched. This is what lets one "Backend" lens
show Changes **and** Articles.

### D9 — Backward compatibility (no schema migration; one boot re-derivation)

No persisted-shape migration. On SW boot, `deriveLensKind` runs once over every
existing lens node, persisting any change (D4). Three cases:

- a stored `'review'` lens (git sources) → stays `'review'`; renders exactly its
  current Review Queue, now as the **Changes** section;
- a stored `'general'` **feed-only** lens → stays `'general'`; renders exactly its
  current Articles grid;
- a stored `'general'` lens that **contains a git account** (buildable today —
  renders as a generic grid) → is re-derived to `'review'` on boot and **changes
  appearance**: its git items now render as the enriched Changes/Review-Queue view.
  This is intentional (the design has no lightweight git list) and is the one case
  that is **not** byte-stable — confirmed in scope with the user. The boot
  re-derivation (rather than waiting for an edit) avoids a degraded interim where the
  page would show review-queue rows without enrichment, since enrichment gates on the
  now-corrected `lensKind`.

### D10 — One new `ui/` primitive: `ServiceConnectPicker`

`ConnectionsCard`, `OverviewPage`, and `ArticlesSection` are **feature** components
composing existing primitives. The change ships **one** new `ui/` primitive —
`ui/ServiceConnectPicker.svelte` (D2) — because the connect picker is used by both
`options/ConnectionsCard` and `sidebar/LensEditor`, and the import DAG forbids a
cross-surface component living under either surface; `ui/` is its only valid home (the
same pattern as the existing cross-surface `AccountConnectField`). It is proven by use
in both surfaces in this change.

**Agreed deviation (D6 routing).** Implementation surfaced that the overview reads
cleanest when each entity routes to its **own** renderer (confirmed with the user via
AskUserQuestion). So in `launcher/lenspage/` the change also adds the feature
component **`ArticlesSection.svelte`** (the merged Articles magazine; lives beside its
sibling renderers `ReviewQueue`/`GeneralLens`, not in `ui/`, since it is launcher-only)
and gives `ReviewQueue`/`GeneralLens` an `embedded` prop and `LensPageItem` a `compact`
prop. These are launcher-local feature additions, not `ui/` primitives, so the
"one new `ui/` primitive" rule still holds.

## Risks / Trade-offs

- **Scope drift toward the north-star** (building CI/Tickets/Inbox) → the specs and
  `entityForSource` cap entities at `change | article | generic`; anything else is a
  separate, named future change.
- **Two rendering paths collapse into one `OverviewPage`** — a regression could hit
  both review and feed lenses at once → keep `ReviewQueue`/`GeneralLens` rendering
  *logic* reused (not rewritten), add overview-grouping tests, and assert pure-review
  and pure-feed lenses render byte-stable against current snapshots.
- **`lensKind` derivation surprises a user** who wanted a feed-only lens but added a
  git account → the derived section preview in the editor shows exactly which
  entities will appear before Create, so the outcome is visible up front.
- **Layer-DAG violation** importing entity logic across surfaces → `entityForSource`
  ships in a `shared/` module (like `connector-origins.ts`); `biome check` gates it.
- **Jira reads as second-class** in a generic bucket → acceptable interim; a real
  Tickets entity is explicitly future work and called out in the spec.
- **A pre-existing `general` lens containing a git account changes appearance**
  (generic grid → enriched Changes) on the first boot after deploy → confirmed in
  scope with the user; mitigated by the one-time boot `deriveLensKind` pass (D9) so it
  lands enriched rather than as a degraded interim, and carried as a backward-compat
  spec scenario.

## Migration Plan

No data migration (no schema bump). Rollout is code-only:

1. Land `entityForSource` + `deriveLensKind` (create/update + the one-time boot
   re-derivation, D9) — behavior-neutral except a pre-existing `general`+git lens
   flips to enriched Changes on first boot.
2. Land `OverviewPage` + sidebar entity grouping behind the existing rendering reuse.
3. Land the `ConnectionsCard` (remove the two old cards) + connection-first editor.
4. `pnpm verify` green; update `docs/lenses-vision.md` + `docs/architecture.md` in
   the same change.

Rollback is a straight git revert — no persisted state changes shape, so reverting
restores the kind-first editor / two-card Options with no data loss.

## Open Questions

- None blocking. Confirmed in scope: connection-first editor, merged Connections
  manager, entity-merged overview (Changes + Articles only). CI/Tickets/Inbox/Repos
  and extra kinds are deferred.

## Visual language

All three surfaces draw exclusively from `@lunma/tokens` (frosted-glass panels,
neutral surface ramp for the global Options infrastructure, Space-hue tint for the
Space-scoped sidebar editor, Instrument Serif for headings/wordmark + Mona Sans for
body, 150–250ms tweens). Reduced-motion collapses every transition to instant and
WCAG-AA holds at every Colour-intensity level.

- **Connections manager** sits on the **neutral** surface ramp (global infra, no
  Space hue): one frosted card with an Instrument-Serif "Connections" heading and a
  **`+ Connect` action in the heading's top-right** (toggling to **Close** while the
  picker is open — matched to the comp, not a bottom button). Below the lead copy,
  two labelled groups divided by hairlines: **ACCOUNTS** (with a right-aligned
  "sign-in identities, reused everywhere" descriptor) and **FEEDS** (with a
  right-aligned **Export OPML** utility, shown only when a lens references an rss
  account). Each row leads with a rounded **identity tile** (provider mark / rss
  glyph), a **bold name** + status pip & word inline, and a reach subline
  **"Used in N lens(es) · powers ⟨entity⟩"** (the entity is the in-scope
  Changes/Articles/Other the source feeds — the comp's Review/CI/Repos/Tickets/Inbox
  are north-star sections out of this change's scope). The `⋯` is a **floating
  `Menu` popover** (Replace/Add token · Rename · Disconnect for accounts; Rename ·
  Copy URL · Remove for feeds); the chosen action opens an inline editor **below the
  row**. `+ Connect` reveals the shared picker as a **bordered panel** below the
  heading: a labelled **Service** select, then stacked full-width host + (method-aware)
  token fields, a footer note ("Tokens stay on this machine, never shown again."),
  and a primary **Connect** — no inline name field (rename lives in the row menu).
  (This replaces the design's earlier `RowMenu` `⋯` + always-visible connect form —
  the redesign comp uses a floating menu + a top-right reveal; the `RowMenu`/`Menu`
  swap and the row anatomy were matched to the comp and are recorded here.)
- **Connection-first editor** is **Space-scoped** (carries the active Space's hue
  glow/aurora, as today): the tree → editor step uses the existing panel morph; the
  connections picker rows use the selected/idle card treatment from the design
  (accent ring + filled check when on); the derived "will show …" preview uses
  entity-coloured chips; Create is the primary accent button.
- **Overview** renders entity sections as frosted cards with a collapse chevron, an
  entity dot (Changes = blue ramp, Articles = green ramp), title, count pill, and a
  provider summary; Changes reuses the review-queue row anatomy (CI dot, reviewer
  rail, diffstat, age warming), Articles the magazine grid/list cards with recessed
  favicons and an accent unread dot. Hierarchy leads with the item title; per-item
  favicons stay recessed at rest.
- **Motion:** section collapse and the connect-picker reveal use the 150–250ms
  token tweens; the article grid↔list switch is an instant layout swap (no reflow
  animation) to stay calm.
