## Context

See [proposal.md](proposal.md) — Why.

The Temporary divider already carries a Clear button plus a kebab `Menu` holding
one item, Clear duplicates (`apps/extension/src/sidebar/App.svelte`, the `{#if
temps > 0}` divider branch). That menu is the slot this change fills. Four
existing facts shape the design:

1. **`reorderTemp` already accepts a full explicit order.** The drag-and-drop
   path computes an order in the sidebar and dispatches it
   (`TempTabs.svelte:204`); `store.reorderTemp` merges it subset-safely, leaving
   ids the caller omitted in their current slot (`store.svelte.ts:623-637`).
2. **`hostOf(url)` exists** in `shared/label-for.ts` and already degrades an
   unparseable URL to `''`.
3. **The toast slot is single and hard-wired.** `clearedToast` is
   `{ message, tabIds }` and its Undo always calls `onUndoClear`
   (`App.svelte:422-441, 759-769`). Two producers share it today (Clear and
   Clear duplicates) only because both undo the same way.
4. **Clear duplicates duplicates its selection rule.** The SW computes the batch
   authoritatively; the sidebar recomputes it locally, once for the disabled
   state (`hasDuplicateTempTabsFor`) and once for the toast count
   (`onClearDuplicateTemp`). That is the established pattern here, not an
   accident — the ack is `void`, so no count comes back over the bus.

## Goals / Non-Goals

**Goals:**

- One click turns an interleaved Temporary list into same-site clusters.
- The action is non-destructive and reversible.
- The clustering rule is deterministic, stable, and idempotent.

**Non-Goals:**

- Real Chrome tab groups per site. A Space instance owns exactly one `groupId`
  and Chrome has no nested groups — sub-grouping inside a Space is not
  expressible without breaking the Space→group model.
- Touching Chrome's tab-strip order. This reorders Lunma's list only; no
  `chrome.tabs.move` is introduced.
- Registrable-domain (eTLD+1) clustering. That needs a public-suffix list, i.e. a
  new dependency, which the stack policy requires proposing separately.
- Persisting a "grouped" mode. Grouping is a one-shot command, not a sort order
  the list stays in — a later-created tab still lands on top, per the existing
  "new tabs land at the top" invariant.
- Fixing the reorder-reliability defect. Tracked separately (see Risks).

## Decisions

**D1 — A dedicated `groupTempTabsBySite` command, not a client-computed
`reorderTemp`.**
The sidebar could compute the clustered order itself and dispatch the existing
`reorderTemp`, adding zero bus surface — the drag path already works exactly that
way. Rejected for the *forward* action: the clustering rule is behaviour worth
specifying and testing at the coordinator, and Group by site is a sibling of
Clear duplicates in the same menu, which puts its rule in the SW. A client-side
computation would make the rule untestable through the coordinator harness and
would drift from its sibling.

**D2 — Undo reuses `reorderTemp` rather than a new `undoGroupTempTabs`.**
`reorderTemp` already takes a full explicit order and already tolerates ids that
closed in between. An undo command would be a strictly weaker duplicate of it.
The sidebar captures the pre-group order locally before dispatching — the same
local-capture pattern Clear uses for its `tabId`s, and for the same reason (the
ack is `void`).

**D3 — Cluster on exact hostname via `hostOf`.**
Alternatives: strip a leading `www.` (rejected — it makes the rule
*almost* predictable, which is worse than plainly predictable; `www.` is rare on
the app surfaces a Temporary list actually accumulates), or eTLD+1 (rejected per
Non-Goals). Exact hostname needs no new code and no dependency, and a user who
wants `mail.` and `docs.` together can drag them together — the manual order
survives, since grouping is one-shot.

**D4 — Hostless tabs cluster under `''` in first-appearance position.**
Alternatives: drop them from the reorder (rejected — they would appear to
teleport as everything else moved around them) or pin them to the end (rejected —
a fixed edge is a second rule to learn). Treating `''` as an ordinary key keeps
one rule.

**D5 — Stable, first-appearance cluster order.**
Alternatives: alphabetical by hostname, or largest-cluster-first. Both discard
the user's existing arrangement wholesale; first-appearance preserves as much of
it as clustering allows, and makes the operation idempotent, which is what lets
the item be meaningfully disabled when it would do nothing.

**D6 — Generalize the toast slot to `{ message, onUndo }`.**
Today's `{ message, tabIds }` hard-codes the undo *action*. A third producer that
undoes differently forces either a second toast state (two toasts can then race
into the same fixed position) or a discriminated union. Replacing `tabIds` with a
closure is smaller than either and removes the coupling. Clear and Clear
duplicates keep their behaviour — they pass `() => onUndoClear(tabIds)`.

**D7 — The disabled predicate recomputes the clustering rule in the sidebar.**
This mirrors `hasDuplicateTempTabsFor` (fact 4 above): the rule exists twice, in
the SW for the mutation and in the sidebar for the affordance. Rejected
alternative: broadcasting a `canGroup` flag in state — that puts a derived,
per-Space UI concern into persisted-shaped state for one menu item. The shared
helper — `clusterIdsByHost(orderedIds, urlOf)` in a new
`apps/extension/src/shared/cluster-by-host.ts` — is a pure function both sides
call, so the duplication is a second call site, not a second implementation. It
lives in `shared/` because both `background/` and `sidebar/` may import that
layer, and neither may import the other.

**D8 — Fix the hard-coded `actionLabel="Undo"` in the same change.**
`App.svelte:763` passes an English literal, which the `i18n` capability forbids
("UI message strings SHALL live in per-locale catalog files"). This change
rewrites that exact call site, so leaving the literal in place would mean
knowingly re-committing a spec violation. Adds `sidebar_undo`. Recorded here
because it is scope beyond "add Group by site" — declared, not silent.

**D9 — The store method returns `boolean`, and a missing instance is a silent
no-op.**
Two coupled choices, both forced by how the coordinator works. (a) Broadcast is
gated solely on `markDirty` (`coordinator.ts:504-531`), so a `void` store method
would give the handler no way to skip the broadcast on an already-clustered list
— the mutation returns whether it changed anything. (b) For a Space with no
instance in the window, the alternatives were throwing (producing an `{ error }`
ack) or returning silently. Chosen: silent, acked `'ok'`. `clearDuplicateTempTabs`
and `store.reorderTemp` both already return without throwing there, and an absent
instance is a transient state — a Space whose window has not materialised it yet
— not a caller error. Throwing would make this action the odd one out among its
siblings for a condition the user cannot cause.

**D10 — Toast N counts the reordered set, not the tabs that moved.**
"Grouped 7 tabs by site" where N is every live temporary tab in the Space, not
just those whose index changed. Counting movers reads as an undercount ("Grouped
3 tabs" after tidying a list of 8), and counting hostnames answers a question
nobody asked. The chosen basis is also the list the disabled predicate already
builds, so no second traversal exists to disagree with the first.

**D11 — `groupTempTabsBySite` on the store, `clusterIdsByHost` in `shared/`.**
The store method takes the command's name so the command → handler → store chain
reads with one noun. The pure helper keeps "Host" because it names the mechanism
it implements — hostname keying — and has no notion of the user-facing "site"
action; it would be equally correct for any caller wanting hostname clusters.

**D12 — Group exactly what the list renders.**
The first implementation filtered the movable set by `liveTabsById[id]?.windowId
=== windowId`, while `TempTabs` renders every id carrying a live-tab record with
no window check. Any rendered row failing the stricter test was shown but never
moved, acting as an immovable pivot that split a site's cluster around it — the
reported "What's new stuck in the middle". The rendered set is the user's mental
model of "the list", so grouping now uses the render predicate. Alternative
considered: tighten `TempTabs` to filter by window instead. Rejected — that
changes what an existing surface displays, which is well outside a menu action's
remit, and would hide rows rather than order them.

**D13 — Browser pages are one cluster, pinned last.**
`chrome://whats-new/`, `chrome://extensions/` and the new-tab page each carry a
distinct hostname (`whats-new`, `extensions`, an extension id), so keying them by
host scattered singleton clusters between the real sites — grouping "by site"
that visibly failed to group. They are not sites. Everything that is not an
`http:`/`https:` page — including an unparseable or missing URL — now shares one
cluster placed after every site cluster. Alternatives: keep them in place as one
block (rejected — the block can still land mid-list, which is the complaint), or
leave them as separate hosts (rejected — that is the bug). This supersedes the
earlier rule that hostless tabs cluster at their first-appearance position.

**Docs.** No `docs/` file enumerates sidebar menu items, bus command kinds, or
message keys — all three are specified under `openspec/specs/`, which this change
updates. [docs/architecture.md](../../../docs/architecture.md) and
[docs/tech-stack.md](../../../docs/tech-stack.md) are deliberately untouched.

## Visual language

No new surface and no new primitive — the change adds one `MenuItem` to an
existing `Menu` and one message to an existing `Toast`. Both primitives carry
the system's motion, colour, and focus treatment already; nothing here overrides
them.

- **Hierarchy.** Group by site sits *after* Clear duplicates in the menu.
  Destructive-but-narrow (closes rows) reads before non-destructive (moves rows),
  matching the divider's existing left-to-right order where the broadest
  destructive action, Clear, is the outermost affordance.
- **Icon.** None. Clear duplicates carries no icon today, and giving one to only
  the new item would make the older item read as degraded. The menu stays a plain
  two-item list; adding icons to both is a separate visual decision, not this
  change's to make.
- **Interaction feedback.** Hover, active, focus-visible and the disabled state
  are `Menu`'s own tokens, unchanged. The disabled state is the one deliberate
  choice: the item stays visible and dimmed rather than disappearing, so the menu
  does not change height between openings — the same rule Clear duplicates
  follows.
- **Motion.** Rows animate to their clustered positions through the `flip`
  transition `TempTabs.svelte` already applies to its keyed `{#each}`, at the
  shared `reorderFlipMs` duration used by drag-reorder. Reusing it means a
  grouped reorder and a dragged reorder settle identically. Reduced-motion is
  honoured by that existing transition; no new motion is introduced.
- **Colour.** None introduced. The toast uses the existing `Toast` surface.

Arc's sidebar has no equivalent one-shot tidy action — its Spaces stay in manual
order. The deliberate divergence is that Lunma's Temporary list is machine-filled
(tabs arrive by navigation, not by choice), so it earns a bulk tidy affordance
that a hand-curated list would not.

## Risks / Trade-offs

- **Undo routes through `reorderTemp`, which a separate open investigation
  suggests can silently fail to commit** (`dispatch` swallows every bus
  rejection, `shared/bus.ts:1159`) → Not mitigated here, deliberately. The defect
  predates this change and affects drag-reorder identically; folding a
  reliability fix into a feature change would entangle two unrelated reviews. It
  is called out in the proposal's Impact so the coupling is visible.
- **The clustering rule lives in two places** (SW mutation, sidebar disabled
  state) → Mitigated by extracting one pure helper both call, so the duplication
  is a second *call site*, not a second *implementation*.
- **A grouped list does not stay grouped** — the next new tab lands on top, off
  its cluster → Accepted. The alternative is a persisted sort mode that fights
  the "new tabs land at the top" invariant the whole Temporary list is built on.
- **Exact-hostname clustering surprises someone expecting `mail.` and `docs.` to
  merge** → Accepted per D3; the escape hatch is a manual drag, which survives
  because grouping is one-shot.
