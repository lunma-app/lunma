## Context

Every new tab is adopted into `tempTabIds` via `LunmaStore.onTabCreated`,
which `unshift`s it to the top (sidebar-pinned-tabs: newest-first). A
`duplicateTab` clone goes through the exact same `tabs.onCreated` adoption
path as any other new tab — it has no special placement today, only a
special EXCLUSION from the onCreated-time dedup check (via the
pending-duplicate correlation record), so it doesn't get immediately
focus/closed against its own still-open source.

## Goals / Non-Goals

**Goals:**
- A clone lands immediately after its source, matching "duplicate" as a
  user would read it — a copy of this specific tab, adjacent to it.
- Degrade gracefully (top-of-list) if the source is gone by the time the
  clone lands, rather than losing the clone or erroring.

**Non-Goals:**
- Not changing `onTabCreated`'s ordinary newest-first placement for any
  other tab creation path.
- Not adding a setting — this is a straightforward correctness fix to what
  "Duplicate" already promises, not a preference with a legitimate
  opposite.

## Decisions

**1. Track the source tab id on the SAME pending-duplicate record already
used for dedup exclusion, rather than a second correlation set.** The two
concerns (skip dedup for this URL; place the clone after this tab) share
the same lifecycle — both need to survive from `duplicateTab`'s synchronous
`markPendingDuplicateTab` call to the clone's `tabs.onCreated`, and both
are irrelevant once consumed. One record serves both.

**2. Consume the pending record unconditionally (whenever a URL is
present), not gated behind `ctx.dedupNewTabNavigations()` as it
incidentally was before.** The prior code nested `!consumePendingDuplicateTab(...)`
inside the same `&&` chain as the dedup-enablement check, so with
`dedupNewTabNavigations` off, the record was never consumed at all — a
latent bug this change's placement logic would otherwise inherit (a
duplicate would fall back to ordinary top-of-list placement whenever the
user had that setting off, for no principled reason). Hoisting consumption
out fixes both: placement no longer depends on an unrelated setting, and
the record no longer leaks unconsumed until its TTL when that setting is
off.

**3. Fall back to `onTabCreated`'s ordinary unshift when the source id
isn't found in the target instance's `tempTabIds`,** rather than dropping
the clone or throwing. Alternative considered: skip adoption entirely and
log an error. Rejected — the clone is a real, now-open Chrome tab
regardless of what happened to its source; losing track of it would leave
an ungrouped, unlisted tab, worse than a merely-misplaced one.

## Risks / Trade-offs

- [Risk] `consumePendingDuplicateTab`'s return type changes from `boolean`
  to `TabId | null`. → Mitigation: both call sites are in this same change;
  no other caller exists.
- [Risk] Hoisting consumption to run unconditionally (previously
  conditional on `dedupNewTabNavigations()`) is a small behavior change
  outside this change's narrow "placement" framing. → Mitigation: it's a
  strict improvement (see Decision 2) and the only externally-visible
  effect is that placement no longer varies with that setting — which is
  the correct behavior, not a regression.

## Migration Plan

None — no persisted-state or setting changes.
