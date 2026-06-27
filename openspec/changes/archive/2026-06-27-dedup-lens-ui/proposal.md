## Why

A lens's **section identity** is currently computed by three independently
maintained copies of `sourceKey`, and they have **drifted apart**: the service
worker (`background/lenses.ts`) and the sidebar (`sidebar/Lens.svelte`) key a
section on `` `${source}:${new URL(baseUrl).host}` `` (port-bearing, throws on a
malformed URL), while the overview page (`launcher/lenspage/overview-vm.ts`) keys
it on `` `${source}:${hostOf(baseUrl)}` `` (port-stripped, degrades to `''`). For
a self-hosted GitHub Enterprise or GitLab instance reachable on a non-default
port, the overview page therefore computes a *different* section key than the SW
that drains results into it and the sidebar that renders the same lens — a
cross-surface inconsistency a user with a self-hosted source can hit today
(sections failing to line up, per-section collapse state not matching). This is
the user-visible value: the sidebar and the overview agree on what a section
*is*, on every host.

The same three surfaces also re-implement other pure lens helpers — `hostOf`
(overview-vm re-declares what `shared/label-for.ts` already exports), the
source→icon map, and the filter/relation→label maps — each a separate place to
drift. This change consolidates the duplicated **pure logic** into one
DAG-safe home so the surfaces cannot diverge again.

Scope note (re-scoped from a reference attempt): an earlier local commit
(`save/lens-page-review-cards`, `a0124ee`) attempted a much broader lens-UI
de-duplication — extracting shared presentational primitives (`LensItem`,
`LensStateRows`, `ReadingControls`, `Card`, `StatusPill`). That commit was built
against the *old single-kind lens page* that `sources-redesign` has since
replaced with the entity-merged `OverviewPage`. On the current structure the
two surfaces' **rendering** has legitimately diverged (sidebar compact rows vs
`ChangeRow`/article tiles), and the calm per-section states + reading controls
now live only in the sidebar — they are **not duplicated**, so they are
deliberately out of scope. Only the pure-logic duplication remains, and that is
what this change addresses.

This change builds on `sources-redesign` (implemented in code; pending archive)
and touches none of its in-flight artifacts.

## What Changes

- **New `apps/extension/src/shared/lens-labels.ts`** — the single home for the
  duplicated pure lens helpers, importing only from `shared/` (DAG-safe, so the
  SW, sidebar, and launcher can all import it):
  - `sourceKey(cfg): string` — the canonical section-identity key. **BREAKING
    (internal): the divergence is resolved in favour of the SW/sidebar
    definition** (`` `${source}:${new URL(baseUrl).host}` ``, port-bearing), since
    the SW is the single writer that drains results keyed by it — the overview
    page MUST match the writer, not the other way round. The malformed-URL case
    is handled once, here.
  - `ICON_BY_SOURCE` + a `sourceIcon(source)` accessor — the source→lucide-icon
    map (today inline in `sidebar/LensSectionHeader.svelte`).
  - `filterLabel(source, query)` — the source/filter→label text (today in
    `sidebar/LensSectionHeader.svelte`).
  - Re-export `hostOf` from `shared/label-for.ts` (or have callers import it
    directly) so `overview-vm.ts` stops re-declaring it.
- **Rewire the three surfaces to import from `shared/lens-labels.ts`** and delete
  their local copies, behaviour-preserving apart from the `sourceKey` fix:
  - `background/lenses.ts` — drop its local `sourceKey`, import the shared one
    (identical body, no behaviour change).
  - `sidebar/Lens.svelte` + `sidebar/LensSectionHeader.svelte` — drop local
    `sourceKey`, `ICON_BY_SOURCE`, `filterLabel`; import the shared ones.
  - `launcher/lenspage/overview-vm.ts` — drop local `sourceKey` + `hostOf`;
    import the shared ones (this is where the observable section-key fix lands).
- **No change** to the relation labels/order (`Relation`, `RELATION_ORDER`,
  `relationFor`) that are genuinely overview-only, nor to any presentational
  component, calm state, reading control, or item-row layout. No schema change,
  no migration (section keys are ephemeral runtime state).

## Capabilities

### New Capabilities
<!-- none — this consolidates implementation of an existing capability; no new cohesive spec area -->

### Modified Capabilities

- `lenses`: add a requirement that **section identity is computed identically
  across the service worker, the sidebar, and the overview page** (one canonical
  `sourceKey`), so a lens's sections line up on every surface — including a
  self-hosted source reachable on a non-default port. This is the spec-level
  guarantee behind consolidating the three drifted copies.

## Impact

- **New file:** `apps/extension/src/shared/lens-labels.ts` (+ `lens-labels.test.ts`
  covering `sourceKey` parity for cloud, self-hosted-with-port, and malformed-URL
  inputs; `sourceIcon`/`filterLabel` mapping).
- **Edited:** `apps/extension/src/background/lenses.ts`,
  `apps/extension/src/sidebar/Lens.svelte`,
  `apps/extension/src/sidebar/LensSectionHeader.svelte`,
  `apps/extension/src/launcher/lenspage/overview-vm.ts` — each drops a local copy
  and imports the shared helper. Existing tests for these
  (`LensSectionHeader.test.ts`, `overview-vm.test.ts`, `background/lenses.test.ts`,
  `sidebar/Lens.test.ts`) are updated where they asserted the local helpers.
- **`ui/` primitives:** none added — this change ships **no** new UI primitive
  and re-rolls none; all consolidation is pure TS in `shared/`. (The component-
  library policy is satisfied vacuously: no feature component or surface changes
  shape.)
- **Architecture / DAG:** no new import edge — `shared/` is already importable by
  `background/`, `sidebar/`, and `launcher/`. `docs/architecture.md` and
  `docs/tech-stack.md` are **left untouched** (no layer or stack change).
- **Behaviour:** the only observable change is the overview page now agreeing
  with the SW/sidebar on section identity for self-hosted ports / malformed URLs;
  every other surface is byte-for-byte equivalent.
- **No new dependencies, no manifest/permission change, no schema-version bump.**
