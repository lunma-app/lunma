## Context

`feedWindowForSection` (sidebar/SmartFolder.svelte) decides which feed items are
in the DOM. Read rows are kept mounted-but-collapsed (the "Show recently read"
peek); the visible set is the unread ones. Its cutoff was:

```
unreadCount >= maxItems ? unreadPositions[maxItems-1] + 1 : min(secItems.length, maxItems)
```

The `>= maxItems` branch is position-correct (covers the newest `maxItems`
unread plus interspersed read). The `< maxItems` branch sliced the first
`maxItems` by POSITION — fine when unread sit first, but when the newest items
are read (you read them) and the unread are older, the first `maxItems` rows are
all read and every unread falls outside the window. The badge (computed over all
items) still counted them, so the section showed a count with an empty list.

## Goals / Non-Goals

**Goals:**
- Every unread item the badge counts renders.
- Preserve the read peek (trailing read rows stay in the window).
- No change for the already-correct cases (unread ≥ budget; unread first).

**Non-Goals:**
- No change to the badge, the consume/drain model, or `hideRead`.
- No UI/surface addition, so no `Visual language` section applies.

## Decisions

- **Cutoff = `max(throughUnreadBudget, peekCutoff)`** where
  `throughUnreadBudget = unreadPositions[min(unreadCount, maxItems) - 1] + 1`
  (spans the newest `maxItems` unread, all when fewer) and
  `peekCutoff = min(secItems.length, maxItems)` (the old bound, retained for the
  read peek). The max satisfies both: all unread render AND read context stays.
- **No-unread case** keeps `peekCutoff` alone — show the first `maxItems` read
  rows for the peek / "all caught up".
- Verified against every existing windowing test (unread-first, drain+backfill,
  show-read) plus the new read-newest regression — all green.

## Risks / Trade-offs

- **DOM size:** when many read rows precede few unread, the window can exceed
  `maxItems` rows (it must, to reach the unread). Read rows are collapsed/inert,
  and the feed buffer is bounded (`FEED_BUFFER` ≤ 200), so the cost is small and
  the alternative (hiding counted unread) is a correctness bug.
