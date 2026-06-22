## Context

The feed reading queue auto-opens the next unread item when a feed tab is
removed: `tabs.onRemoved` computes `nextUnreadFeedItemAfterClose(tabId)` BEFORE
`onTabRemoved` (so the closing item's binding is still visible) and, if it
returns an item, enqueues `openSmartItem` for it (`chrome-tabs.ts:57-77`).

Separately, the draining model closes consumed tabs: navigating away marks the
deactivated item read (`markConsumedFeedItems`, inside `setActiveTab`) and the
SW closes its now-inactive tab (`onActivated` / open paths →
`closeTab`). That close fires `tabs.onRemoved` too — and the existing
auto-advance fired on it, so a single open cascaded: open → consume+close →
advance → open → consume+close → advance → … draining the whole section. A live
diagnostic confirmed the runaway (`feed-auto-advance-*` opens marking item after
item read).

## Goals / Non-Goals

**Goals:**
- Opening/consuming one feed item never cascades into draining the section.
- Preserve the intended reading flow: manually closing the unread tab you're
  reading still opens the next unread.
- Document the auto-advance behaviour (previously only in code).

**Non-Goals:**
- No change to the consume=close model, the windowing, or `markConsumedFeedItems`.
- No UI/surface change, so no `Visual language` section applies.
- The temporary `[BUG2]` diagnostic is removed here but was never part of any
  shipped behaviour.

## Decisions

- **Discriminator = the closing item's read state.** A consume=close marks the
  item read BEFORE its tab is closed (`markConsumedFeedItems` runs in
  `setActiveTab`, the close is floated after). A manual close of an unread
  reading tab reaches `onTabRemoved` with the item STILL unread (it is marked
  read inside `onTabRemoved`, after the advance is computed). So "closing item
  already in `smartReadState`" cleanly means "this was a consume, do not
  advance." No new flag, set, or plumbing required — the signal already exists.
- **Guard location:** early `return undefined` inside
  `nextUnreadFeedItemAfterClose`, right after the feed-folder check, before any
  section/space resolution. Keeps the whole rule in the one function the
  handler already trusts.

## Risks / Trade-offs

- **Timing dependence:** the fix relies on `markConsumedFeedItems` having run
  (item marked read) before `onTabRemoved` computes the advance. That ordering
  is guaranteed: the consume marks read synchronously in the activation drain,
  and the tab close is a floated side-effect whose `onRemoved` lands on a later
  drain — strictly after. A manual close has no prior consume, so the item is
  unread when `onRemoved` runs. Covered by the regression test.
- **No advance after consume:** intentional — consuming means "I moved on," not
  "open the next one." The reading flow (manual close → next) is unaffected.
