## Why

A feed section can show its unread badge (e.g. "9") while rendering **zero**
unread rows. The render window (`feedWindowForSection`) sliced the first
`maxItems` items by **position** when the unread count was below `maxItems` — so
once you read the newest `maxItems` items (read rows sit first in feed order),
the window was entirely those read rows and every older unread item fell outside
it. The badge counted them (true unread) but they never appeared. User value:
unread feed items always render — the count and the list agree.

## What Changes

- `feedWindowForSection` spans through the newest `maxItems` **unread** items
  (all of them when there are fewer), not the first `maxItems` by position, so
  trailing unread behind a run of read rows still render — while still covering
  at least the first `maxItems` rows so read rows stay available for the
  "Show recently read" peek.
- The `smart-folders` per-section-maximum requirement gains a scenario for the
  fewer-unread-than-budget / read-newest case (the previously uncovered path).

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `smart-folders`: the "Smart folders honour a per-folder maximum item count"
  requirement gains a scenario asserting that all unread render when fewer than
  `maxItems` unread sit behind read rows (the feed budget is over unread, not a
  positional slice).

## Impact

- `apps/extension/src/sidebar/SmartFolder.svelte` — `feedWindowForSection`
  cutoff is the max of "through the unread budget" and "the first `maxItems`
  rows".
- `apps/extension/src/sidebar/SmartFolder.test.ts` — regression test: read the
  newest items, fewer unread than budget → the unread still render.
- Docs: no `docs/` file covers feed windowing; none change. The `smart-folders`
  spec is updated (see Modified Capabilities).
- No new public types, files, surfaces, or `src/ui` primitives; no dependency
  changes.
