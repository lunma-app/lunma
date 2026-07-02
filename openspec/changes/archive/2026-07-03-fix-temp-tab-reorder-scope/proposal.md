## Why

Users reported that a newly opened temporary tab does not reliably land at
the top of the Temporary list, and that manually reordering temporary tabs
sometimes appears to do nothing. Both are the same root cause and both are
directly user-felt: `reorderTemp` (dispatched by drag-and-drop and by the
context menu's Move up/Move down actions) always mutated the window's
*active* Space's instance instead of the Space that actually issued the
command, and its "the caller doesn't know about this id" merge fallback
appended any such id to the END of `tempTabIds` — including a tab that
`onTabCreated` had just `unshift`ed to the top moments earlier, if a
still-in-flight reorder command (dispatched from a now-stale client
snapshot) drained afterward. This visibly broke the sidebar-pinned-tabs
invariant "new tabs land at the top of Temporary."

## What Changes

- `reorderTemp` now takes an explicit `spaceId` (mirroring the existing
  `renameTempTab(windowId, spaceId, tabId, newName)` pattern) instead of
  resolving the window's *active* Space via a private `activeInstance`
  helper. Every carousel panel renders its own `TempTabs` for a specific
  Space, active or not, and dispatches `reorderTemp` for that Space — the
  handler must honor it instead of guessing via window activity.
- `reorderTemp`'s merge algorithm changes from "keep ids present in both the
  request and the current order, in the requested order, then push any
  current id the caller omitted onto the end" to a stable slot-substitution:
  walk the CURRENT order in place, and only at the slots whose id the
  request is reordering, substitute in the next id from the requested
  order — every other slot (a tab closed since the client's snapshot, or a
  brand-new tab `unshift`ed to the top after the snapshot was taken but
  before the command drained) keeps its existing position untouched. This
  is what actually fixes "a new tab doesn't stay on top."
- The `reorderTemp` `SidebarCommand` payload gains a required `spaceId`
  field (**BREAKING** for that one internal wire-message shape; both ends —
  sidebar dispatch and the coordinator handler — ship together in this
  change, so there is no compatibility window to bridge).
- No user-facing setting, no new UI surface, no new primitive.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `spaces-and-tabs`: the "Manual temporary tab ordering" requirement's
  `reorderTemp` payload example gains `spaceId`; the requirement gains an
  explicit statement that a reorder is scoped to the Space that issued it,
  not the window's active Space; a new scenario documents that a tab
  arriving after the client's drag/move snapshot keeps its position instead
  of being pushed to the end.
- `typed-message-bus`: the `reorderTemp` `SidebarCommand` variant's payload
  shape gains `spaceId: SpaceId`.

## Impact

- Code: `apps/extension/src/shared/store.svelte.ts` (`reorderTemp`, deleted
  the now-dead private `activeInstance` helper), `apps/extension/src/shared/bus.ts`
  (`reorderTemp` type + Zod schema), `apps/extension/src/background/handlers/temp-tabs.ts`
  (`reorderTemp` handler), `apps/extension/src/sidebar/TempTabs.svelte` (both
  `reorderTemp` dispatch sites: drag-drop and Move up/down).
- Tests: `apps/extension/src/shared/store.tabs.test.ts`,
  `apps/extension/src/sidebar/TempTabs.test.ts`, `apps/extension/src/shared/bus.test.ts`,
  `apps/extension/src/background/coordinator.handlers.test.ts`.
- `docs/`: no narrative doc changes — `docs/architecture.md` and
  `docs/tech-stack.md` describe layers and stack choices, neither of which
  this change touches; the wire-message contract this change updates lives
  entirely in the OpenSpec specs above.
- No new dependencies, no migration (the persisted `tempTabIds` array shape
  is unchanged — only the in-memory command payload and its handling
  change).
