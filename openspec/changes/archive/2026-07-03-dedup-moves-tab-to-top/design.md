## Context

`tab-dedup` has three focus-instead-of-create paths that all resolve to the
same primitive: find an existing tab at the target URL (`findTabInActiveSpace`,
current window + active Space, exact match), focus it, and — for the two
onCreated/navigation paths — close the new tab that would have duplicated
it. None of the three currently touch `tempTabIds` order; the focused tab
stays wherever it already was.

## Goals / Non-Goals

**Goals:**
- Give users the option (default on) to have a dedup-focused temp tab jump
  to the top of Temporary, matching where a brand-new tab lands.
- Apply consistently across all three dedup paths (`openUrl`, onCreated-time,
  navigation) — a user shouldn't get different behavior depending on which
  gesture triggered the dedup.

**Non-Goals:**
- No change to dedup's matching scope (still current window + active Space,
  exact URL) — this only affects what happens to `tempTabIds` order AFTER a
  match is found.
- No promotion for a matched PINNED/bound tab — it has no `tempTabIds`
  position; "move to top of Temporary" has no meaning for it.

## Decisions

**1. One shared setting, not per-path.** Alternative considered: separate
toggles for launcher-dedup vs. onCreated vs. navigation promotion.
Rejected as needless surface area — a user thinking about "should the tab
I switched to jump to the top" has one mental model regardless of how the
switch was triggered; `dedupNewTabNavigations` already establishes the
precedent of one setting covering multiple related code paths differently
gated (it gates onCreated + navigation dedup but not `openUrl`, which stays
always-on) — `dedupMovesTabToTop`, by contrast, has no reason to exempt any
path, since all three dedup successes are "the same tab got reused."

**2. Reuse `promoteTempTab` (unshift-after-splice) rather than special-casing
inside `reorderTemp`.** A dedup-focus promotion has nothing to do with a
user-issued manual reorder command — it is a store-internal reaction to a
focus decision the coordinator made, not a client-dispatched command. A
dedicated method keeps the two concerns (user-driven reorder vs.
system-driven promotion) separate and independently testable.

**3. `ctx.markDirty()` is required on this path, unlike the surrounding
focus/close.** The existing dedup focus/close sequences deliberately skip
`markDirty` because `tabs.onActivated`/`tabs.onRemoved` reconcile that part
of state on their own (documented in `chrome-tabs.ts`). Promotion mutates
`tempTabIds` directly — nothing else reconciles that — so each call site
calls `ctx.markDirty()` right after `promoteTempTab`, scoped narrowly so the
existing "no markDirty on the focus/close itself" comment stays accurate.

## Risks / Trade-offs

- [Risk] A user who deliberately relies on stable Temporary ordering (e.g.
  a fixed mental map of "row 3 is always my Jira tab") could be surprised
  by it jumping to the top on a dedup-focus. → Mitigation: the setting
  defaults on for "smart by default" consistency with `dedupNewTabNavigations`,
  but ships off-capable from day one, not as a follow-up.
- [Risk] Promoting on every dedup-focus could feel noisy if a user
  frequently dedup-focuses the same tab (e.g. a pinned dashboard reopened
  from many places) — but pinned/bound tabs are explicitly excluded from
  promotion, so this only affects temp tabs, where "recently touched moves
  to the top" is the list's whole existing model (`onTabCreated`/`restoreTempTab`
  both already unshift).

## Migration Plan

None — new setting key resolves to its default via the existing per-field
`.catch(default)` read path; no persisted-state shape changes.
