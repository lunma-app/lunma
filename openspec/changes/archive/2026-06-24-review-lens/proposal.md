# Review lens — the first typed lens, end-to-end

## Why

A reviewer whose pull/merge requests are scattered across GitHub and a GitLab
instance today sees them as an undifferentiated card grid — the same magazine
layout RSS articles get — with none of the signal that drives a triage decision:
who is blocking, how large the change is, how stale it has gone. The **Review
lens** makes a `lensKind: 'review'` lens answer *"what should I review next, and
what shape is it in?"* at a glance — every source merged into one ordered queue,
each change rendered as a triage row (CI state · title · repo · author · review
verdict + reviewer rail · a diffstat · a warming age). This is the flagship
typed lens (Phase 2 of [docs/lenses-vision.md](../../../docs/lenses-vision.md))
and it proves the `kind → entity → adapter → page` registry that the Tickets
lens (Phase 3, `tickets-lens`) reuses wholesale.

A `frontend-design` prototype wired to the real `@lunma/tokens` is preserved in
this change under `design-assets/` (`review-queue.html`,
`review-queue-repo.html`, and screenshots) and is the visual target.

**Docs touched by this change:** `docs/lenses-vision.md` (mark Phase 2 shipped;
its roadmap row's reality moves into the `lenses` spec). **Left untouched:**
`docs/architecture.md` and `docs/tech-stack.md` (no layer or stack change — the
new primitives live in `ui/`, the new page sub-view in `launcher/lenspage/`,
both within the existing DAG).

## What Changes

- **`review` lens kind.** Widen `LensKind` from `'general'` to
  `'general' | 'review'`. A `review` lens is typed: its sources are GitHub
  and/or GitLab providers that **all normalise into one `Change` entity**, so a
  review lens MAY mix those two providers (unlike other typed kinds) but never
  mixes in rss/jira. `general` is unchanged.
- **`Change` entity.** Add a `ChangeData` bag and an optional `change?:
  ChangeData` field on `LensItem` (and its `LensItemSchema` Zod mirror). Like
  the rss `excerpt`/`imageUrl`/`publishedAt` fields, it rides the **ephemeral,
  never-persisted** `lenses` runtime slice — the entity itself needs **no
  migration**. This is exactly the additive queue-item enrichment the existing
  "page item is a card with optional content slots" requirement anticipates.
- **Schema bump 11 → 12.** The *persisted* `lensKind` enum on the `PinNode`
  widens from `'general'` to `'general' | 'review'`, so `CURRENT_SCHEMA_VERSION`
  goes 11 → 12 with an **additive identity migration** (existing nodes keep
  `'general'`; the payload is structurally unchanged apart from the bumped
  version, like the v10 `name` migration). Only the persisted enum drives the
  bump; the ephemeral `Change` entity does not.
- **Enriched adapters.** The GitHub and GitLab connectors populate `change` for
  review-kind lenses. `author`, `draft`, `targetBranch`, `updatedAt`, and
  `additions`/`deletions` come from the search/list response or the per-item
  detail fetch the connectors **already perform**; **per-reviewer verdicts** (the
  rail's colour — GitHub reviews / GitLab approvals) add **one extra API call per
  change per refresh, capped at the lens's `maxItems`**.
- **Review Queue page archetype.** The lens full-page surface routes by
  `lensKind`: a `review` lens renders a **triage queue** (two relationship lanes
  — *Requested your review* / *Authored by you* — of `Change` rows) instead of
  the generic magazine grid; `general` lenses render exactly as today.
- **Source + repo filter.** The review page carries a filter toolbar — source
  facets as chips (always), repo facets as chips (≤ ~5) or a `Select` (more) —
  rendered **only when the lens spans more than one source**.
- **New `ui/` primitives.** `Avatar` (an initials disc with size + optional
  verdict/status ring), `Diffstat` (mono `+N −N` + proportional two-tone bar),
  and `ReviewerRail` (a verdict icon leading verdict-tinted `Avatar`s). The row's
  author disc composes `Avatar` too.
- **Editor kind picker.** The lens editor gains a kind selector so a user can
  create a `review` lens (today every lens is stamped `general`).

No breaking changes: persisted state is untouched (the entity is ephemeral),
`general` lenses and the existing page are byte-for-byte unchanged.

## Capabilities

### New Capabilities

<!-- none — this extends the existing lenses capability rather than introducing a
     new cohesive area. -->

### Modified Capabilities

- `lenses`: the `LensKind` union gains `'review'`; `LensItem` gains the optional
  `change` field; the GitHub/GitLab connectors enrich `change`; the full-page
  surface renders a Review Queue archetype by kind; a source/repo filter is added
  to the review page; the editor exposes a kind picker.
- `storage-and-migrations`: `CURRENT_SCHEMA_VERSION` 11 → 12; a new additive
  `{ toVersion: 12 }` identity migration; the current-version schema becomes
  `AppStateV12Schema` (v11 with the widened `lensKind` enum).
- `visual-system`: three new shared primitives (`Avatar`, `Diffstat`,
  `ReviewerRail`) enter the `ui/` component library and must consume tokens, not
  literals (governed by the token-consumption requirement).

## Impact

- **`apps/extension/src/shared/`** — `types.ts` (`LensKind`, `ChangeData`,
  `LensItem.change`), `schemas.ts` (`LensItemSchema`, the lens-node `lensKind`
  enum, `CURRENT_SCHEMA_VERSION` 11 → 12, `AppStateV12Schema`),
  `migrations.ts` (the additive `{ toVersion: 12 }` entry).
- **`apps/extension/src/background/`** — the GitHub + GitLab connectors (enrich
  `change`, incl. the per-change verdict fetch); no coordinator/bus contract
  change (results still drain through `lenses.result`).
- **`apps/extension/src/launcher/lenspage/`** — kind-based routing in
  `LensPage.svelte`; the generic body extracted verbatim into a new
  `GeneralLens.svelte`; the new review archetype `ReviewQueue.svelte` and its
  feature components `ChangeRow.svelte` + `LensFilterBar.svelte`; `lenspage.css`
  (note: a pre-existing `.folderpage` → `.lenspage` CSS-scope regression is fixed
  here in passing).
- **`apps/extension/src/ui/`** — new `Avatar` + `Diffstat` + `ReviewerRail`
  primitives (+ tests, harnesses).
- **Lens editor** — a kind picker composing an existing primitive
  (`SegmentedControl` or `Select`).
- **`docs/lenses-vision.md`** — Phase 2 marked shipped.
- **No new dependencies; no `manifest`/permission change** (the review providers
  are the already-declared GitHub/GitLab origins).
