## Why

A review lens's **Changes** row is the surface a reviewer scans to triage "what
needs me." Today it hand-rolls its reviewer avatars and CI glyph inline and
prints the diffstat as plain text — so the review signals read flat, the disc and
verdict styling can drift from the rest of the app, and the row violates the
component-library policy (it re-rolls a primitive and reaches past primitives
straight to design tokens). The `review-lens` change already shipped the three
primitives built for exactly this row — `ReviewerRail`, `Avatar`, `Diffstat` —
but the later "single-page lens overview" redesign (2026-06-27) landed without
composing them, orphaning all three. This change wires them into the row so the
reviewer sees a proper blocking-wins verdict, per-reviewer state rings, and a
proportional diff bar, and removes a redundant signal so the row reads cleaner.

It also closes a spec↔code drift: the `lenses` spec's "Review Queue archetype"
requirement still describes the pre-redesign row. That redesign is the agreed
source of truth, so this change updates the requirement to match the row it
actually ships.

## What Changes

- Compose `ReviewerRail` (which composes `Avatar`) for the Changes row's
  reviewers, replacing the hand-rolled `.reviewers`/`.avatar` markup and the
  `reviewerHue` colouring. The rail renders the blocking-wins verdict glyph
  (`changes` > `pending` > `approved`) leading the verdict-ringed reviewer discs.
- Compose `Diffstat` for the change's `additions`/`deletions`, replacing the
  `+N −N` text baked into the row subline.
- **Drop the row's state `Pill`** (`open`/`changes`/`approved`/`draft`). Its
  review-state signal is now carried by the `ReviewerRail` verdict glyph, so
  keeping it duplicates the signal and crowds the row. (The `Pill` primitive
  stays — the Issues section still uses it for priority.)
- Show **`draft` as a distinct hollow CI-light glyph** in the CI locus (matching
  the spec), since the dropped pill previously carried the `draft` label.
- **MODIFIED** `lenses` spec: rewrite the "Review Queue archetype" requirement's
  row-composition paragraph + its triage-signals scenario to match the shipped
  single-page redesign (relation-lane labels, repo subline, no age/author/host
  columns) and to name the composed primitives.

Out of scope (pre-existing redesign drift, NOT introduced or reconciled here):
the `lenses` filter requirement still describes source+repo facets while the
redesign ships a repo-only filter, and the redesign drops the warming-age /
`host/owner/repo · @author` columns the old archetype described. Flagged for a
follow-up drift-reconciliation change; this change touches only the row
composition it actually changes.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `lenses`: the "The Changes entity section renders the Review Queue archetype"
  requirement changes its row composition — the row composes `ReviewerRail` +
  `Diffstat` + a draft-aware CI light, and no longer renders a state pill.

## Impact

- **Code**
  - `apps/extension/src/launcher/lenspage/OverviewPage.svelte` — Changes row
    markup + scoped styles (remove `.reviewers`, `.avatar`, `.ci` rules; compose
    the primitives; drop the row `Pill`).
  - `apps/extension/src/launcher/lenspage/overview-vm.ts` — ADD `initialsOf`,
    `reviewersForRail`, `ciLight` (draft-aware); REMOVE `reviewerHue`,
    `ciCircle`, `changeState`; simplify `changeMeta` to the repo subline (drop
    the diffstat text now owned by the `Diffstat` component).
  - Tests: `overview-vm.test.ts`, `OverviewPage.test.ts`.
- **Primitives composed**: `ReviewerRail`, `Avatar` (via the rail), `Diffstat`
  (all existing `src/ui/` primitives). **New primitives**: none.
- **Docs**: none. The row composition lives in the `lenses` spec, not under
  `docs/`; `docs/architecture.md`/`docs/tech-stack.md` are unaffected.
- **Dependencies / schema / message bus**: none. `ChangeData` is unchanged and
  ephemeral; no persisted-schema or bus change.
