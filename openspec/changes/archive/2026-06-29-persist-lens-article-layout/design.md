## Context

The lens overview's Articles section (`OverviewPage.svelte`) offers three
page-local controls added by the lens-overview redesign: a **feed filter**, a
**layout toggle** (Grid | List), and an **unread filter**. All three were
specified as ephemeral ("no persistence, no bus command"). Subsequently
`lens-view-filters` (archived, schema v14) made a *different* axis — the lens's
type/scope `filter` — a persisted per-lens property on the lens `PinNode`, with a
`setLensFilter` bus command and SW handler, and established the canonical pattern
for per-lens preferences (alongside the older `hideRead`).

The layout toggle is the odd one out: grid-vs-list is a durable reading
preference (content-shaped), yet it resets on every overview unmount because
`articleView` lives in component-local `$state`. This change moves only the
layout axis onto the established persisted-preference rails. The feed filter and
unread filter remain ephemeral by design — they are momentary "what am I looking
at right now" narrowings, not a saved disposition.

## Goals / Non-Goals

**Goals:**
- The article grid/list choice persists per lens, across overview re-opens, all
  windows, and SW restarts — using the exact `setLensFilter` pattern.
- Additive, backward-compatible: existing persisted states load unchanged and
  behave identically (default grid) until the user toggles.
- Zero new UI: reuse the existing segmented control; only swap its source of
  truth.

**Non-Goals:**
- Persisting the feed filter or the unread filter (they stay page-local).
- Per-window layout (the preference is global to the lens, like `filter`).
- Replacing the existing inline `seg-btn` toggle with a `SegmentedControl`
  primitive (a pre-existing re-roll, out of scope here — not introduced or
  worsened by this change).
- Any change to how articles are fetched or rendered.

## Decisions

**D1 — Persist as an optional field on the lens `PinNode`, not in `settings`.**
Per-lens, not global, mirroring `filter`/`hideRead`. A photo feed and a headline
feed under different lenses keep independent layouts. `settings.ts`
(`chrome.storage.sync`) holds extension-wide prefs (theme, density) and is the
wrong scope. Alternative considered — a single global `articleLayout` setting —
rejected: it cannot express "this lens grid, that lens list," which is the actual
user need.

**D2 — Field shape `articleLayout?: 'grid' | 'list'`, absent ⇒ `grid`.** A
two-value union, not a boolean, so the persisted value reads self-evidently and
matches the existing `'grid' | 'list'` type already in `OverviewPage`. Absent is
the canonical "never set" state and resolves to `grid` at read
(`node.articleLayout ?? 'grid'`), exactly today's default. Any explicit toggle —
including switching back to grid — writes the chosen value, so the field holds the
user's explicit choice; only a never-touched lens has it absent. This keeps
"absent = default" and "present = explicit" cleanly separated.

**D3 — `setLensArticleLayout` bus command, no refetch.** Payload
`{ spaceId, folderId, layout: 'grid' | 'list' }`, handled by the SW exactly like
`setLensFilter`: resolve the lens node, set the field, persist, broadcast. It
joins the no-refetch command set in `coordinator.ts` (`setLensArticleLayout: {}`)
because a layout change touches no source. A non-resolving `folderId` is a calm
no-op. Unlike `filter`, there is no "empty clears the field" case — the value is
always one of two concrete strings; we simply overwrite.

**D4 — Single source of truth in `OverviewPage`.** Drop
`let articleView = $state<'grid' | 'list'>('grid')`. Derive the active layout from
the lens node (`$derived(node.articleLayout ?? 'grid')`) and, on toggle, dispatch
`setLensArticleLayout` (wired through `LensPage`, the same way `setLensFilter` is
already threaded into `OverviewPage`). The broadcast round-trip updates the store,
which re-derives the layout — no local optimistic copy, matching how `filter`
already flows.

## Visual language

No visual change. The grid↔list switch already renders today; this change only
makes the chosen state survive. The existing behaviour is preserved at the high
bar: the Grid/List segmented control keeps its current styling and the
layout transition stays reflow-free (the spec's "no reflow animation" on switch
holds). Because the layout is now restored on open, a lens last left in List
re-opens directly in List rather than flashing grid-then-(nothing) — a small
correctness win for perceived stability. Reduced-motion and WCAG-AA are
unaffected (no new motion, colour, or contrast surface introduced).

## Risks / Trade-offs

- **Spec drift in `storage-and-migrations`** (the base "current version SHALL be
  13" sentence is already stale vs code at 14) → Mitigation: follow the
  `lens-view-filters` precedent and ADD a new v15 requirement rather than editing
  the stale sentence; call the drift out in the proposal so it is not silently
  absorbed. Fixing the base sentence is left to a dedicated reconciliation.
- **Two unarchived sibling changes touch the lens node** (`lens-scope-multiselect`
  is in-flight on this branch) → Mitigation: `articleLayout` is an additive field
  on a different axis from anything `lens-scope-multiselect` edits; no shared
  requirement is modified by both. If `lens-scope-multiselect` archives first, no
  reconciliation is needed; if this archives first, likewise.
- **Migration is a no-op pass-through** → low risk; identical mechanism to the v14
  bump, covered by the same round-trip + pre-version scenarios.

## Migration Plan

1. Land schema + migration (v15 pass-through) and the `articleLayout` field.
2. Land the bus command + SW handler + store setter.
3. Rewire `OverviewPage`/`LensPage` to the persisted field.
Rollback: the field is optional and ignored by older code paths; reverting the
reader change makes the toggle ephemeral again with no data loss (the persisted
field is simply unread). No destructive migration to reverse.

## Open Questions

None.
