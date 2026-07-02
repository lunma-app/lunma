## Context

`spaceInstancesByWindow[windowId][spaceId].tempTabIds` is a manually-ordered,
newest-first array (`sidebar-pinned-tabs`, `spaces-and-tabs`). Two mutators
touch it directly from user gestures: `onTabCreated` (`unshift`s a new tab to
the top) and `reorderTemp` (replaces the order after a drag or a Move
up/down click). Every carousel panel in the sidebar mounts its own
`TempTabs` for a specific Space — active or not — so `renameTempTab` already
carries `spaceId` to know which instance to mutate. `reorderTemp` did not:
it resolved the instance via a private `activeInstance(windowId)` helper
(the window's *active* Space), regardless of which Space's panel actually
built the `tabIds` payload.

`reorderTemp`'s merge step also has to reconcile the dispatched `tabIds`
(a client-side snapshot, possibly stale by the time the command drains
through the coordinator's event queue) against the live `tempTabIds`. The
prior algorithm kept ids present in both, in the requested order, then
pushed any live id the request omitted onto the END — reasonable for "a tab
closed between snapshot and drain" but wrong for "a tab was `unshift`ed to
the FRONT between snapshot and drain," which pushed it to the opposite end
from where it belongs.

## Goals / Non-Goals

**Goals:**
- `reorderTemp` mutates the (window, Space) instance the command actually
  came from, not whatever the window's active Space happens to be.
- A tab that becomes part of `tempTabIds` after the client's drag/move
  snapshot was taken (almost always via `onTabCreated`'s `unshift`) keeps
  its position when a stale `reorderTemp` command drains afterward, instead
  of being relocated.

**Non-Goals:**
- No change to how the sidebar renders the list (still direct array order,
  unchanged) or to `onTabCreated`'s `unshift` semantics.
- No change to `reorderSpaces` or `reorderFavorites`, which have the same
  "append omitted ids" shape but no "a new entry always joins the front"
  invariant to protect — appending is still correct there.
- Not a general "operational-transform" reorder algorithm; the fix is
  scoped to the one invariant this bug actually broke.

## Decisions

**1. Scope by an explicit `spaceId` parameter, mirroring `renameTempTab`.**
Alternative considered: gate the sidebar's Move up/down menu items and drag
zone on the `active` prop, so only the active panel could ever dispatch
`reorderTemp`. Rejected: it would make reordering unreachable from a
background carousel panel entirely (a real interaction loss, not just a
bug fix), whereas passing `spaceId` (data every `TempTabs` instance already
has as a prop) lets every panel reorder correctly regardless of which is
centered.

**2. Replace "filter + append omitted" with in-place slot substitution.**
The new algorithm walks the CURRENT `tempTabIds` array once; at each index
whose id is part of the reorder request, it substitutes the next id from
the requested order (which is exactly the current order's participating
ids, permuted); every other index — an id the request doesn't mention, i.e.
closed since the snapshot or freshly arrived after it — is left untouched
in place. Alternative considered: keep "append omitted ids" but special-case
"if the omitted id was UNSHIFTED after the snapshot, re-prepend it instead"
— rejected as strictly more complex (requires tracking snapshot timestamps
or diffing against a "before" copy) for the same outcome the slot-
substitution gives for free, and the slot-substitution is provably
equivalent to the old algorithm on every case the old tests already
covered (an omitted id already at the tail stays at the tail either way).

**3. No settings toggle, no migration.** This is strictly a bug fix to an
existing, already-shipped ordering invariant — there is no old behavior a
user would want to opt back into, and the persisted `tempTabIds` array
shape is untouched (only the in-memory `reorderTemp` command payload gains
a field).

## Risks / Trade-offs

- [Risk] The `reorderTemp` `SidebarCommand` payload shape change is
  breaking for that one message. → Mitigation: both the sidebar dispatch
  sites and the coordinator handler ship in this same change, so there is
  no version skew window (the SW and the sidebar UI are always the same
  extension build).
- [Risk] A caller could construct a `reorderTemp` payload with a `tabIds`
  list containing ids that belong to a DIFFERENT Space than the given
  `spaceId` (a bug in the caller, not this fix). → Mitigation: unchanged
  from before — the merge only ever reorders ids that are already present
  in the target instance's `tempTabIds`; anything else in the request is
  silently ignored, exactly as the prior "filter to present ids" step did.

## Migration Plan

None — no persisted data shape changes; both ends of the wire message ship
together.
