## Context

Five facts about the codebase shape every decision below.

1. **A close is only observable in one place.** A tab can close from the Lunma
   sidebar's `closeTab` command, the Chrome tab strip, `Cmd+W`, or a window
   closing. Only `chrome.tabs.onRemoved` sees all of them. Hooking the sidebar
   command instead would make the feature work in Lunma's own UI and silently not
   work in the tab strip — the same class of "sometimes it works" bug
   `add-tab-provenance` just spent a debugging session on.
2. **`onRemoved` fires after the tab is gone, but the descendants are still live.**
   The removed tab's `LiveTab` is deleted during the handler; the children's
   `provenanceParentTabId` still points at it at the moment the handler runs. So the
   subtree is computable at exactly the point the close is observed — but only
   before the store mutations below run.
3. **Bulk closes already archive-and-restore, but the undo AFFORDANCE is
   sidebar-local.** `clearTempTabs` archives each tab under one shared `archivedAt`,
   and `undoClearTempTabs` restores by resolving each `tabId` to its most recent
   surviving entry. But the toast that offers undo is raised in `sidebar/App.svelte`,
   which knows the tab ids only because it computed them itself before dispatching.
   A worker-initiated close has no such path — nothing tells the sidebar which tabs
   went.
4. **`tabs.onRemoved` splices before anything else.** `ctx.store.onTabRemoved` removes
   the tab id from every `instance.tempTabIds` as its first act, and
   `spaceOwningTab` resolves a Space purely by `tempTabIds.includes(tabId)`. After
   that call the closing tab has no Space.
5. **Handlers MAY await, but `tabs.onRemoved` is currently synchronous.** `Handler`
   is typed `void | Promise<void>` and several handlers await `chrome.*`. What
   handlers avoid is reading settings per event — hence the cached mirrors
   (`ctx.provenanceEnabled()`, `ctx.dedupNewTabNavigations()`) — and `ctx.runSideEffect`
   exists to keep I/O off the drain's critical path.

## Goals / Non-Goals

**Goals:**

- Closing a tab closes its visible indented subtree, from any close affordance.
- The user answers before anything is closed, and the whole batch goes at once.
- A window close, a browser quit, and the cascade's own removals never cascade.
- Off by default, and inert when provenance is off.

**Non-Goals:**

- **No subtree drag/move.** Dragging a parent still moves only its own row.
- **No blocking modal.** The confirmation is a transient prompt in the sidebar, not
  a dialog that interrupts the close — the close has already happened when Lunma
  finds out about it.
- **No new toast component.** The existing toast slot and its generic action are
  reused; only the worker→sidebar request and the command answering it are new.
- **No cross-Space or pinned closing.** Out of scope by spec, not by omission.
- **No "close descendants" one-off menu action.** The setting is the only entry
  point in this change; a per-tab menu item is a separate proposal.

## Decisions

**D1 — Cascade at `tabs.onRemoved`, not at the `closeTab` command.**
It is the only observation point that covers the tab strip and `Cmd+W`. The cost is
that the handler must distinguish a user close from a shutdown and from its own
removals; both are handled by explicit guards (D4, D5). Alternative rejected:
hooking `closeTab` and accepting that tab-strip closes do not cascade — that ships
a setting whose behaviour depends on which affordance the user happened to use,
which is indistinguishable from a bug.

**D2 — Compute the subtree at the very top of the handler, before `onTabRemoved`.**
Not merely before `removeLiveTab` (context fact 4): `onTabRemoved` runs first and
splices the closing tab out of `tempTabIds`, after which `spaceOwningTab` returns
`null` and the cascade could never fire. The batch is therefore resolved as the
handler's first act, while the closing tab still has a Space and its children still
point at it. Collecting lazily per level was rejected: it would produce one batch
stamp per level, breaking single-undo.

**D3 — `collectDescendantTabIds` is pure and lives in `shared/provenance.ts`.**
It takes the live-tab map, the root tab id, and the Space's `tempTabIds`, and
returns the transitive descendant set restricted to that Space's temporary tabs,
with a visited set so a cycle terminates. Pure and `chrome`-free, so it is unit
testable without a browser and sits beside `resolveParentTabId`, which defines the
same lineage from the other direction.

**D4 — `info.isWindowClosing` is a hard skip.**
Chrome sets it on every tab removed because a window is going away. Cascading there
would archive the user's entire session into the archive list as though they had
discarded it — and the 100-entry cap would then evict real archived tabs to make
room. This is the single most destructive failure mode available to this feature,
so it is guarded first, before any other work in the handler.

**D4b — A pruned ancestor prunes its whole subtree.**
Because parents resolve to the nearest LIVE ancestor, a pinned tab P between A and
temp tab D makes D's resolved parent P. P is outside the Space's temp list, so D is
unreachable from A and survives. Exclusion PRUNES the subtree rather than merely
filtering the output list. This is the under-closing direction, consistent with the
transition allow-list failing open: a tab whose lineage runs through something the
cascade may not touch is not confidently part of the subtree.

**D5 — A module-level cascading registry prevents re-entrancy.**
`chrome.tabs.remove` on the batch makes Chrome fire `onRemoved` for each closed
descendant, each of which would otherwise start its own cascade with its own batch
stamp. `background/close-cascade.ts` marks the batch before removal and the handler
skips any tab that is marked; a mark is cleared when that tab's removal arrives.
A mark whose removal never arrives (the `chrome.tabs.remove` rejected, the tab was
already gone) would otherwise leak, so `markCascading` records the batch and
`clearCascading` is also called for the whole batch when the removal call settles —
whichever happens first wins, and clearing twice is a no-op. This mirrors
`background/initial-load-tabs.ts` and `background/handlers/pending-duplicate-tabs.ts`,
which solve the same "Chrome will call you back about something you just did"
problem the same way, down to the test-only reset export — a new pattern would be
gratuitous.

**D6a — Ask, do not act-and-offer-undo.**
The first design closed the batch and raised an undo toast. That is the wrong
default for this feature: the batch's size is not predictable from the tab strip,
so "five tabs vanished, here is undo" makes the user discover the blast radius by
suffering it. The worker instead asks — naming the count and the tab they came
from — and closes nothing until the answer arrives. Dismissal is a refusal.

The prompt is post-hoc by necessity: `tabs.onRemoved` fires after the tab is gone,
so there is nothing left to block. The question is therefore about the tabs that
REMAIN, which is also the more honest question.

The cost is that a cascade needs a surface to ask. When none is listening the
`chrome.runtime` send rejects and the cascade does not happen. Accepted, and
deliberately not softened into a fallback: closing without asking is the exact
behaviour this decision exists to prevent, and "nothing happened" is recoverable by
closing the tabs by hand.

The answer arrives as a `closeChildTabs` command, so the destructive work still runs
on the drain through the single-writer path rather than from the surface.

**D6b — A confirmed batch is re-validated.**
Seconds pass between question and answer. The handler intersects the batch with the
Space's current `tempTabIds` and live tabs, so a tab that has since closed, been
pinned, or moved Spaces is not closed — the user agreed to the subtree they were
shown, not to a list of ids.

**D6 — The directly-closed tab is not archived.**
Only the descendants are. The user closed that tab on purpose, and Chrome's own
reopen-closed-tab covers it. Archiving it would also make undo reopen a tab the user
deliberately dismissed. Alternative rejected: archive it too, for a symmetrical
"restore everything" — it makes the common case (close one tab, undo) resurrect
something the user meant to kill.

**D7 — A second cached mirror, and the chrome I/O goes through `runSideEffect`.**
`ctx.closeChildTabsWithParent()` is pushed by the settings watcher exactly like
`ctx.provenanceEnabled()`. The reason is NOT that a handler cannot await — several
do (context fact 5) — but that `onRemoved` fires on every tab close and a
`chrome.storage.sync` read per close is waste for a feature that is off by default.

The handler's store work (collect, archive, `markDirty`) stays synchronous so the
mutation cannot be lost to a rejected await. The chrome calls it needs —
`tabs.query` for the survivor check, `tabs.create`, `tabs.remove` — go through
`ctx.runSideEffect`, which exists precisely to keep I/O off the drain's critical
path. `tabs.onRemoved` therefore stays a synchronous handler.

This also inherits the bug the provenance mirror just had — a mirror seeded at boot
but never pushed on change is stale for the life of the worker — so the watcher
push and its regression test are tasks here, not an afterthought.

**D7b — The request rides the existing broadcast + toast plumbing.**
The worker broadcasts `CASCADE_CONFIRM` with `{ windowId, spaceId, tabIds, title }`
via `chrome.runtime.sendMessage`, exactly as the dedup flash already does from this
same handler file. `sidebar/App.svelte` listens and raises its EXISTING toast slot
— the one Clear and Clear duplicates use, so a cascade prompt and a clear toast can
never stack — with the action labelled "Close" instead of "Undo". `Toast` already
takes a generic `actionLabel`/`onAction`, so no primitive changes. Alternative
rejected: returning the batch through a bus ack — there is no command to ack, since
the close originated in Chrome, not in the sidebar.

**D8 — `dependsOn` on the declaration, not another special case in `Options.svelte`.**
`Options.svelte` already special-cases `trackTabProvenance` (it must request a
permission from the click gesture). A second bespoke branch would mean the
declaration list no longer describes how the page renders, which is the whole point
of the declarative settings engine. `dependsOn?: keyof Settings` is one optional
field, consumed by one setting today, and it keeps the rendering rule in the data.
Alternative rejected: a `disabled?: (s: Settings) => boolean` predicate — more
general, not needed, and not serialisable into the declaration table.

**D8b — `dependsOn` resolves through the dependency's EFFECTIVE value.**
`Options.svelte` deliberately renders `trackTabProvenance` from the stored value
AND the `webNavigation` grant, because a `true` synced from another device means
nothing on a device that never granted the permission. `dependsOn` therefore reads
the same effective value the dependency's own toggle renders (`toggleValue()`), not
`settings[dependsOn]`. Reading the raw stored value would leave this toggle
interactive on a synced-true/no-grant device, offering a switch for a permanently
inert feature — the exact case the existing code guards against.

**D9 — Disabled means "not written", not "forced off".**
A disabled toggle leaves the stored value alone. Turning provenance off and back on
restores the user's earlier choice instead of silently resetting it. The behaviour
is gated where it happens (the handler checks provenance too), so a stored `true`
under a disabled dependency is inert but preserved. This deliberately differs from
`trackTabProvenance`'s own decline path, which DOES write `false` back — there, the
write records a permission that was actually refused; here nothing was refused.

**Docs:** no `docs/` file changes. No layer boundary, dependency, or release step
moves. The decision log above is the record.

## Visual language

Two surfaces: one settings row in the **Tabs** group, and the sidebar's existing
undo toast. Nothing new is drawn. The work is in making a disabled control read as
*conditional* rather than *broken*, and in not letting a destructive action pass
without a visible way back.

**The settings row.** Composed from the existing `SettingText` + `SegmentedControl`
pairing every other toggle uses, placed directly beneath "Show where tabs came
from" so the dependency reads top-to-bottom before it is stated in words. The
description leads with the consequence ("the tabs you opened from it close too")
and closes with the reassurance ("you can undo this right after") — consequence
first, because that is the half that changes a decision.

**The disabled state, and why the primitive changes.** `SegmentedControl` today
exposes `disabled` per OPTION: it sets `opacity: 0.4` and `cursor: not-allowed` on
`.option`, but `.pill` — the selection background — is a SIBLING of `.option`, so
marking both options disabled dims the labels and leaves the pill at full strength.
That reads as broken, not as conditional. So the primitive gains a control-level
`disabled` prop that dims the pill with the options, and the catalog story gains a
disabled variant. This is the first shipped use of the disabled state anywhere in
the app — nothing else in `src/` passes it, and the story has no case for it — so it
is being designed here, not inherited.

**Motion.** `.option` carries no opacity transition today (only `.pill` transitions
transform/width/height, and `.option-label` transitions colour), so a disabled swap
would snap. The primitive adds `opacity var(--motion-base) var(--ease-standard)` to
both — folded into `.pill`'s EXISTING transition list rather than declared in a
later rule, because `transition` is a shorthand and an equal-specificity rule after
it would replace the transform/width/height list and kill the sliding pill in every
SegmentedControl in the app. Reduced motion needs no per-component media query:
`tokens.css` collapses `--motion-base` to `--motion-fast` under
`prefers-reduced-motion`, which is exactly the "per-component rules don't need
their own override" contract that file states. The primitive had no reduced-motion
guard before this change; it inherits one by using the token. The app's own
`reduceMotion` setting does not reach this control — it gates ambient drifting
motion, not micro-transitions.

**Why it is disabled** is stated in the row's description, not a tooltip. A tooltip
hides the reason behind a hover the user has no cue to attempt, and is unreachable
by touch and keyboard. The description APPENDS `options_desc_requiresSetting`,
naming the setting to enable first, rather than replacing the setting's own copy:
the disabled state is precisely when the user is weighing whether that dependency is
worth enabling, and hiding what the setting does is the worst moment to hide it.

**The undo toast.** The cascade reuses the sidebar's existing single toast slot,
so a cascade toast replaces rather than stacks with a Clear toast, and inherits its
timing and motion unchanged. This is the visible half of the safety argument: the
action is destructive, so the way back must appear without being asked for.

**Colour and contrast.** Nothing here reads a hue or chroma token, so every
Colour-intensity level is satisfied by construction. Contrast is measured, not
assumed: `--text-muted` at 0.4 opacity over the track's `--bg` computes to
**≈2.1:1**, below the 3:1 non-text floor. That is accepted rather than fixed.
WCAG 1.4.3 exempts disabled controls, and the 0.4 value is the app's existing
disabled treatment — diverging here would make this one control's disabled state
look unlike every other, which is a worse outcome than a dim label whose meaning is
carried elsewhere. What carries it is the row description, which stays at full
contrast and now RETAINS the setting's own copy alongside the reason (see below),
so nothing a user needs to make the decision is behind the dimmed control.

Arc's tree-style close takes the subtree with no confirmation and no visible undo.
Lunma deliberately diverges: the same one-gesture close, but archived as a batch
with a toast offering undo, because Lunma's lineage is a lossier signal than Arc's
explicit tab tree and therefore has to be recoverable.

## Apply-time decisions

**A1 — The mirror's regression test moved from `index.test.ts` to the cascade
tests.** Task 3.4 originally placed it beside the provenance-mirror tests, which
observe their mirror through `syncAllTabIdentities` being called. The cascade
mirror has no such observable collaborator: it is private to the coordinator and
read only through the handler context. The options were to add a public getter
purely for the test — public surface the proposal does not list, for no runtime
consumer — or to assert the push behaviourally, by enabling the setting through a
live settings change and checking that a subsequent close cascades. The behavioural
test is strictly stronger (it covers the push AND the read path) and adds nothing to
the API, so the test moved to section 7 and task 3.4 was rewritten to say so.

## Risks / Trade-offs

- **The cascade needs an open sidebar.** With no surface to ask, nothing happens —
  so the feature is inert for a user who keeps the sidebar closed. Accepted: the
  alternative is closing tabs without asking, which is what D6a exists to prevent.
  The prompt naming both the count and the parent is what makes a tab-strip close
  legible without the indented subtree in view.
- **The lineage under-reports.** Tabs opened by means other than a link click are
  roots, so a user may expect a cascade that does not happen. This direction of
  error is the safe one — under-closing, never over-closing — and is why the
  transition allow-list fails open.
- **Archive pressure.** A large cascade writes many archived entries at once and can
  evict older ones through the 100-entry cap. Accepted: it is the same pressure
  `clearTempTabs` already applies, and the cap exists for exactly this.
- **`onRemoved` is hot.** The handler now does work on every tab close. The guards
  are ordered cheapest-first (shutdown flag, then the two mirrors, then the
  re-entrancy set), so the off-by-default path costs one boolean read.
- **Recovery restores tabs, not lineage.** Tabs restored from the archive come back
  with new ids and no provenance token, so the subtree returns FLAT. Accepted:
  recovering the pages is the point, and re-synthesising lineage would mean
  inventing edges the capability's own "never infer a relationship" rule forbids.
- **Ordering with `add-tab-provenance`.** This change cannot archive before that
  one, since it adds requirements to a capability that change introduces. Tracked in
  the proposal; if the ordering slips, `openspec archive` fails loudly rather than
  producing a wrong main spec.
