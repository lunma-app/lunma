# Review lens — design

## Context

Phase 1 (`establish-lens-model`, archived) renamed smart folders to lenses and
introduced `lensKind`, but with a single member: `'general'` — today's untyped,
multi-provider aggregator that renders as a generic magazine/queue card grid.
The connectors (`apps/extension/src/background/connectors/{github,gitlab}.ts`)
fetch PRs/MRs but **drop** almost everything a reviewer needs: they build a
`LensItem` of just `id/title/url/status` (`github.ts:270-280`,
`gitlab.ts:264-272`), discarding author, reviewers, draft, diff size, target
branch, and update time even when the response already carries them.

This change is Phase 2 of [docs/lenses-vision.md](../../../docs/lenses-vision.md)
— the **Review lens**, the flagship typed lens. It is the first proof of the
vision's spine: a lens `kind` binds a canonical **entity** (`Change`), a set of
**adapters** (github-pr, gitlab-mr) that normalise into it, and a **page
archetype** (the Review Queue) chosen by kind. Getting this seam right is what
lets Phase 3 (`tickets-lens`) drop in a second kind without reworking the
runtime, the bus, or the schema.

Key existing constraints this design plugs into (all verified against the code):
- **Ephemeral runtime slice.** Results live in `AppState.lenses[id].sections`
  keyed by `sourceKey` (`lenses.ts:53-56`), broadcast-only, never persisted
  (`storage-and-migrations` spec). The `Change` entity rides this slice → no
  migration for the entity itself.
- **The page already holds the kind.** `LensPage.svelte:79-91` resolves the
  full `LensNode` (`located.node`) from state, so `node.lensKind` is in hand at
  render with no URL change. `openLensPage` carries only `folderId`
  (`handlers/lenses.ts:381-426`).
- **Connectors already do a per-item detail fetch** for enrichment
  (`github.ts:184-207` `enrich`, `gitlab.ts:250-262`), so most `ChangeData`
  fields cost no *additional* request — only per-reviewer verdicts do.
- **`LensItem.status`** is already the CI/pipeline tone (`ok|pending|warn|fail`)
  both connectors populate — it becomes the row's CI light unchanged.
- The persisted `lensKind` enum lives in `AppStateV11Schema`
  (`schemas.ts:156`); widening it bumps the schema version (storage contract).

## Goals / Non-Goals

**Goals:**
- A `review` lens kind, creatable from the editor, end-to-end.
- A `Change` entity (`ChangeData`) populated by enriched github-pr / gitlab-mr
  adapters, riding the ephemeral slice.
- A Review Queue page archetype routed by `lensKind`, leaving `general` lenses
  byte-for-byte unchanged.
- A source + repo filter on the review page (page-local, ephemeral).
- Three token-consuming `ui/` primitives: `Avatar`, `Diffstat`, `ReviewerRail`.
- An additive v11 → v12 schema migration for the widened enum.
- Fix the pre-existing `.folderpage` → `.lenspage` CSS-scope regression in
  `lenspage.css` (the page-level rules don't currently apply).

**Non-Goals:**
- Other typed kinds (`tickets`, `ci`, `inbox`, `repos`) — later phases.
- Cross-entity refs / links (L0–L2) — Phase 4 (`cross-entity-refs`).
- A general provider×kind adapter *registry abstraction*. This change builds the
  **seam** (kind → entity → page) concretely for one kind; the generalised
  registry is extracted when the second kind (`tickets`) needs it, per the
  no-speculative-infrastructure rule.
- A launcher result that opens the review page — deferred `lens-page-launcher`.
- `rss` / `jira` providers inside a review lens (a review lens is github/gitlab
  only).

## Decisions

### D1 — Entity as an optional bag on `LensItem`, not a union
`LensItem` gains `change?: ChangeData` (optional, omitted when absent), exactly
as rss added `excerpt/imageUrl/publishedAt`. The lens's `kind` tells the page
which bag to read.
*Alternative:* a discriminated union of item types. Rejected — it churns the
runtime slice, bindings, and Zod schema for zero benefit; the vision explicitly
chose the bag (`docs/lenses-vision.md` "Entity model").

### D2 — `ChangeData` shape (extends the vision by one field: `repo`)
```ts
interface ChangeData {
  author: string;                 // login/username
  repo: string;                   // "owner/repo" — NEW, see note
  reviewers: { login: string; state?: 'approved' | 'changes' | 'pending' }[];
  draft: boolean;
  additions?: number;
  deletions?: number;
  targetBranch?: string;
  updatedAt: number;              // epoch ms
}
```
**Deviation recorded:** the vision's `ChangeData` (`docs/lenses-vision.md:136`)
has **no `repo`**. The repo filter the user chose (source + repo facets) needs
per-change repo identity, and the row subline shows `host/owner/repo`. `host`
derives from the section's `baseUrl` (already known), but `owner/repo` does not
exist anywhere today, so `repo` is added to the entity. Because `ChangeData` is
ephemeral, this is **not** a schema change — but it **is** a change to a
docs-named type, so `docs/lenses-vision.md`'s `ChangeData` definition is updated
in this change (mandatory doc-sync).
*Alternative:* derive repo from each item's `url` by string-parsing. Rejected —
fragile across GitHub/GitLab URL shapes and self-hosted paths; the connectors
already parse the repo (`github.ts` `base.repo.full_name`, gitlab `project_id`).

### D3 — Page routing by kind, inside the existing page (no new entrypoint)
`LensPage.svelte` keeps the shell (aurora, hearth, Space-hue scope, state
mirror, `located`/`missing`, tab title) and branches on the resolved node:
`{#if node.lensKind === 'review'}<ReviewQueue …/>{:else}<GeneralLens …/>{/if}`.
The current generic section-grid body moves into `GeneralLens.svelte` (a verbatim
extraction — the existing requirements and tests guard it); `ReviewQueue.svelte`
is the new archetype. The URL, `openLensPage` dedupe, Temporary-exclusion, and
entry points are all unchanged.
*Alternative:* a separate `launcher/reviewpage/` entrypoint. Rejected —
duplicates the boot/state-mirror/backoff plumbing and would force `openLensPage`
to pick a URL by kind (it currently dedupes on one path); the `lenses` spec pins
`lenspage/` as *the* full-page surface.

### D4 — Adapter enrichment: widen the existing detail fetch + one verdict call
Both connectors already fetch per-item detail; we widen the parsed schema and
add **one** verdict request per change:
- **GitHub** (`github.ts`): widen `PrDetailSchema` to parse `user.login`,
  `base.ref`, `additions`, `deletions`, `updated_at`, `draft`,
  `base.repo.full_name`. Add `GET /repos/{owner}/{repo}/pulls/{n}/reviews` →
  reduce to the latest non-`COMMENTED` review per reviewer → `state`. Requested
  reviewers with no review → `pending`.
- **GitLab** (`gitlab.ts`): widen `MrSchema`/detail to parse `author.username`,
  `target_branch`, `updated_at`, `draft`/`work_in_progress`, `reviewers[]`,
  `changes_count`/diff stats, project path. Add `GET …/merge_requests/{iid}/
  approvals` → `approved_by` ⇒ `approved`; other reviewers ⇒ `pending`.
- Enrichment is **capped at `maxItems`** and runs through the connectors'
  existing bounded per-item fan-out, so it scales with what the page shows, not
  the whole result set.
*Alternative:* GitHub GraphQL (one round-trip for reviews+diff). Rejected for now
— adds a second API surface and auth path; the REST enrich path already exists
and the per-change cost is bounded.

### D4a — The connector learns the lens kind via `ResolvedLensSource`
To gate enrichment (so a `general` lens with a github source pays no extra
verdict call), the connector must know the lens kind. `ResolvedLensSource` —
today `{ source; baseUrl; query? }` — gains a `lensKind: LensKind` field, stamped
by `resolvedConfigs(node)` from the node; `fetchRuntime`'s *signature* stays
shape-stable (`(cfg, maxItems, caches?)`), only the `cfg` type widens. A connector
enriches `change` (and makes the verdict call) only when `cfg.lensKind ===
'review'`.
*Alternative:* a new `fetchRuntime` parameter. Rejected — the contract pins the
signature shape-stable; carrying it on the already-threaded resolved config is
less invasive and keeps the single `resolvedConfigs` derivation authoritative.
*Recorded as a deviation:* the `lenses` connector-contract requirement is
MODIFIED to add `lensKind` to `ResolvedLensSource`.

### D5 — Verdict fidelity differs by provider (degrade gracefully)
GitHub yields the full `approved | changes | pending`. GitLab reliably yields
`approved | pending` from approvals; `changes` is only emitted where the instance
exposes reviewer review-state. Where unknown, a reviewer is `pending`. The rail
never invents a verdict; the leading verdict icon is computed **blocking-wins**
(`changes` > `pending` > `approved`) at render, never stored.

### D6 — CI light reuses `LensItem.status`
The row's leftmost CI light is the existing `status` tone — no new field. `draft`
overrides it visually (a hollow/half glyph) but `status` still carries the
pipeline/check tone.

### D7 — The filter is page-local ephemeral UI state
Like the page's existing reading controls (`revealedRead`, `limits` in
`LensPage.svelte`), the active source/repo filter is component `$state`, not
persisted and not a bus command. Source facets derive from `node.sources`
(`provider` + `host`); repo facets derive from the resolved items' `change.repo`.
The toolbar renders **only when `node.sources` spans more than one source**.
Repo facets render as `Chip`s when ≤ 5 distinct repos, else a `Select`. A repo
facet is scoped to the active source facet (so `lunma/lunma` on github vs gitlab
don't collide).

### D8 — Three token-consuming primitives
- `Avatar` — `{ initials: string; size?: 'sm'|'md'; ring?: 'approved'|'changes'|'pending'|'none'; title?: string }`. An initials disc; `ring` tints via `--success/--danger/--text-dim`.
- `Diffstat` — `{ additions?: number; deletions?: number }`. Mono `+N −N` (`--success`/`--danger`) over a proportional two-tone bar; bar reads `--surface-3` track. When **both** are absent it renders nothing (collapses) — a change with no known diff size shows no diffstat rather than `+0 −0`; a present-but-zero side renders its `0`.
- `ReviewerRail` — `{ reviewers: {initials,state,title}[]; max?: number }`. A leading verdict `Icon` + overlapped `Avatar`s (ring=state), `+N` overflow.
All read tokens only (visual-system token-consumption requirement); the row's
author disc composes `Avatar` too.
*Alternative:* bake discs into `ReviewerRail`. Rejected — author + reviewers
share the disc; a primitive prevents drift (component-library policy).

### D9 — Editor gains a kind picker; payloads carry `lensKind`
`LensEditor.svelte` adds a `SegmentedControl` (General | Review) at the top.
`createLens`/`updateLens` payloads — which **today omit `lensKind`**
(`LensEditor.svelte:495-501`) — gain it; the handler stamps the chosen kind
instead of hard-coding `'general'` (`handlers/lenses.ts:113`), defaulting to
`'general'` when absent (back-comat). When kind = `review`, the source picker
restricts providers to github/gitlab.
*Alternative:* a separate `ReviewLensEditor`. Rejected — one kind-aware editor.

### D10 — Schema v11 → v12, additive identity migration
`CURRENT_SCHEMA_VERSION` → `12`; `AppStateV12Schema` = `AppStateV11Schema` with
`lensKind: z.enum(['general','review'])`. A `{ toVersion: 12 }` migration returns
its input unchanged (the payload is structurally identical; only the allowed enum
widens — existing nodes are already valid). Mirrors the v10 additive `name`
migration. `createLens`/`updateLens` accept `lensKind`.

### D11 — Fix `.folderpage` → `.lenspage` CSS regression in passing
`lenspage.css` scopes every page-level rule under `.folderpage`, but the
component renders `class="lenspage"` — so the stage/header/sections/hearth/
entrance rules don't apply on the live page (a regression from the Phase-1
rename; e2e missed it because it asserts testids, not computed styles). This
change touches `lenspage.css` for the review archetype, so it fixes the scope in
the same edit. Recorded as a bundled bugfix, not silent.

## Risks / Trade-offs

- **API rate limits from verdict fetches** → capped at `maxItems` (default 20),
  reusing the bounded per-item fan-out; verdict calls are core-API (GitHub
  5000/hr), comfortably within budget for typical lens sizes and `refreshMinutes`
  ≥ 5 floor.
- **GitLab `changes` verdict may be absent** on some instances → the rail shows
  `pending` rather than a wrong verdict; the leading icon stays honest (D5).
- **Refactor risk extracting `GeneralLens.svelte`** → the extraction is verbatim;
  the existing `lenses` page requirements + `LensPage.test.ts` guard byte-for-byte
  behaviour for `general`.
- **Forward-only migration** → a user who *downgrades* the extension after v12 is
  written hits v11's enum rejecting `'review'` (standard quarantine/salvage path
  — the review node is dropped, others survive). Accepted; downgrade is not a
  supported path.
- **Two-host repo collision** (`lunma/lunma` on github and gitlab) → repo facets
  are scoped under the active source facet (D7), so they never merge.

## Migration Plan

1. Land types + `AppStateV12Schema` + the `{ toVersion: 12 }` identity migration
   + `CURRENT_SCHEMA_VERSION = 12` together (schema and migration in lockstep).
2. On first boot after update, a v11 envelope migrates to v12 (identity) and is
   written back as `{ schemaVersion: 12, state }`; v12 envelopes no-op.
3. No data rewrite, no rollback step — the migration is additive. Existing lenses
   remain `general` and unchanged.

## Open Questions

- The repo-facet chip/`Select` threshold (5) is a tuned default, adjustable
  during implementation if the toolbar feels cramped earlier.
- GitLab reviewer review-state availability varies by instance version; the
  `changes` verdict there is best-effort (D5) — no blocker.

## Visual language

The review page inherits the lens atmosphere unchanged — aurora backdrop, low
hearth bloom, the owning Space's hue scope, frosted-glass lane panels — because a
lens's *kind* changes the page, not its identity. Boldness is spent in one place
(the diffstat); everything else stays disciplined.

- **Motion.** Lane panels reuse the existing staggered rise (`fp-panel-rise`,
  `--motion-base` ≈ 220ms, `--ease-emphasised`, `55ms × index` stagger). Rows do
  **not** animate on mount (a queue must read instantly); row hover is a
  `--motion-fast` background fill only — no lift (the lift was removed from the
  prototype as too playful for triage). Filter-chip active/hover transitions are
  `--motion-fast` `--ease-standard`. The age "warming" is a static colour step,
  not motion. All collapse under `prefers-reduced-motion` (panels: no rise).
- **Colour.** CI light and diff/verdict are the only saturated colour, always
  paired with text so nothing is colour-only (WCAG-AA): diffstat shows `+N −N`
  numerals beside the bar; verdicts pair `--success/--danger/--text-dim` with a
  glyph (`✓` / `!` / `◷`). The active source chip and the head glyph use the
  Space hue (`--space-c` / `--space-c-soft`). Age warms `--text-faint` →
  `--warning` past a staleness threshold. Everything else is the neutral
  `--text-*` ramp on `--surface`/glass.
- **Interaction feedback.** Row: hover → `--surface-2`; focus-visible → the
  standard `--focus-color` ring; active (bound tab open) → `--space-c-soft`
  background, matching the existing card's active treatment. Chips: hover →
  `--surface-3`; active → Space-hue tint + ring. Disabled/empty: when a lane has
  no changes it shows a calm note, never an error card. Loading: first-fetch
  ghosts reuse the page's existing static placeholders.
- **Hierarchy.** Instrument Serif lens name + a triage-summary thesis line lead;
  then quiet uppercase lane labels; then rows. Within a row the title (Mona Sans
  medium) leads, the `host/owner/repo · @author` subline recedes (mono, dim), and
  the right cluster (reviewer rail · diffstat · age) sits in **fixed columns** so
  the diffstat and age align top-to-bottom — a flight-board rhythm that turns
  scope-of-work into a scannable shape. Mona Sans for UI, `--font-mono` for the
  repo path / diff numerals / age (alignment + code-review vernacular).

Arc's vertical workspace informs the immersive atmosphere; Lunma diverges by
making the page a function of the lens **kind** — a reviewer's queue is a triage
console, not a browse grid.
