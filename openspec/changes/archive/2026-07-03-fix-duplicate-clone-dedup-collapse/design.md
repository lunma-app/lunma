## Context

`redirect-chain-tab-dedup` (already archived) widened `tabs.onUpdated`'s
dedup eligibility from "fully untracked" to "tracked but not yet
`status: 'complete'`," using a session-scoped `initial-load-tabs.ts` set
cleared on a tab's first completion. `duplicate-tab-adjacent-placement`
(already archived) tracks a `duplicateTab` clone immediately at creation
(via `insertTempTabAfter`) so it can be placed next to its source. Neither
change anticipated the other: the clone is tracked-but-not-yet-complete
for a real window of time (however brief), which is now exactly the
condition the widened `onUpdated` check targets — and the existing
`excludeTabId` self-exclusion guard only prevents the clone from matching
ITSELF, not from matching its still-open SOURCE (a different tab, at the
same URL, which is precisely what "duplicate" means).

## Goals / Non-Goals

**Goals:**
- A `duplicateTab` clone is never dedup-collapsed, at any point in its
  lifetime — not just at the one `tabs.onCreated` check that already
  excluded it.

**Non-Goals:**
- Not narrowing `redirect-chain-tab-dedup`'s eligibility window in general
  — that fix is still correct and needed for genuine redirect chains; this
  change only carves out the one case (a known, deliberate duplicate) that
  should never have been eligible in the first place.

## Decisions

**1. Clear the clone's `initial-load` mark immediately, right after
placement, rather than adding a second exclusion set or a broader
condition in `tabs.onUpdated`.** The clone is already correctly identified
as "this is a duplicate" at the exact point `duplicateSourceTabId !==
null` is known (`tabs.onCreated`) — reusing the SAME mechanism that already
exempts a completed tab from re-matching (clearing its mark) is simpler
than introducing a parallel "never eligible" set, and reads as "a
duplicate's clone is retroactively treated as if it had already completed
its load" — which is semantically accurate: it has no meaningful "initial
load chain" of its own to protect against duplication within.

## Risks / Trade-offs

- [Risk] None identified beyond the fix's own narrow scope — clearing the
  mark only removes eligibility for the redirect-chain dedup path; it does
  not affect the clone's own tracking, grouping, or placement.

## Migration Plan

None — in-memory tracking only, no persisted-state changes.
