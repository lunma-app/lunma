## Context

Tab activation runs through one coordinator handler — `tabs.onActivated` in
`apps/extension/src/background/handlers/chrome-tabs.ts`:

```ts
'tabs.onActivated': (ctx, event) => {
  const { activeInfo } = event.payload;
  const consumed = ctx.store.setActiveTab(activeInfo.windowId, activeInfo.tabId);
  for (const tabId of consumed) ctx.runSideEffect(() => closeTab(tabId));
  ctx.markDirty();
},
```

It updates which tab is active but never touches the window's **active Space**
(`activeSpaceByWindow[windowId]`), which governs which Chrome group is shown and
which Space the sidebar renders. So focusing a tab that lives in another Space
(its live tab sits in that Space's Chrome group / its per-window instance) leaves
the window on the old Space — the tab is active but its Space isn't shown.

Every focus path funnels through this one event: the launcher's open-tab result
and the sidebar's temp-tab click both call `focusTab`
(`handlers/temp-tabs.ts`), which is just `chrome.tabs.update({ active: true })` →
`tabs.onActivated`; a Chrome tab-strip click or `Cmd`+number fires it directly.
So `onActivated` is the single correct chokepoint.

`cross-space-tab-switch` already extracted the reusable switch sequence into
`activateSpaceInWindow(ctx, windowId, spaceId)` (`handlers/activation.ts`):
capture the outgoing Space, `store.activateSpace`, then
`groups.orchestrateActivation(..., preserveFavoriteFocus=true)`. It **no-ops when
`spaceId` is already the window's active Space**, so callers can invoke it
unconditionally. This change reuses it.

## Goals / Non-Goals

**Goals:**

- Activating a tab whose owning Space is not the window's active Space SHALL
  switch the window to that Space, so the focused tab's Space is always shown.
- Cover **every** activation path by enforcing it in `tabs.onActivated` (launcher,
  sidebar, Chrome tab strip, keyboard, programmatic) with no per-surface change.
- Reuse the existing activation sequence (`activateSpaceInWindow`) — no
  re-implementation of group show/hide; no new state/schema/message/permission.

**Non-Goals:**

- No switch for a tab with **no owning Space**: a global favorite
  (`savedTabs[id].spaceId === null`) or any ungrouped/untracked tab (they are
  global/visible everywhere by design).
- No change to the launcher, `focusTab`, or any surface — the switch is emergent.
- No new active-Space *concept*; the `spaces-and-tabs` activation contract is
  reused as-is.
- No change to `setActiveTab` / the feed-consume behaviour already in
  `onActivated`.

## Decisions

### D1 — Enforce in `tabs.onActivated`, reuse `activateSpaceInWindow`

After the existing `setActiveTab` + feed-consume, derive the activated tab's
owning Space and, if it differs from the active Space, `await
activateSpaceInWindow(ctx, windowId, activeInfo.tabId's space)`. The handler
becomes `async`. `markDirty` already fires; the switch's store mutation is
covered by it.

Alternatives rejected:
- **Fix only `focusTab`** — would miss Chrome tab-strip clicks and keyboard
  activation, so the "always visible" invariant wouldn't hold. The launcher path
  is a strict subset of `onActivated`.
- **Re-dispatch `activateSpace`** — handlers must not enqueue commands mid-drain
  (re-entrancy); `activateSpaceInWindow` is the direct `ctx`-call sequence the
  command handler itself runs.

### D2 — Owning-Space derivation: `spaceOwningTab(state, windowId, tabId)`

A new pure read helper in `handlers/queries.ts` (matching that module's
no-`chrome.*`, no-mutation contract). Resolution order, all from store state:

1. The Space whose **per-window instance** lists the tab:
   `spaceInstancesByWindow[windowId][spaceId].tempTabIds.includes(tabId)`.
2. Else, a **coupled pinned tab** bound to it: some `tabBindings[savedId][windowId]
   === tabId` with `savedTabs[savedId].spaceId !== null` → that `spaceId`.
3. Else `null` — no owning Space (ungrouped/untracked tab, or a global favorite
   whose binding resolves to `spaceId === null`, which step 2 excludes).

Deriving from store state (not `chrome.tabGroups`) keeps the handler synchronous
up to the switch decision and authoritative to Lunma's model; `findSpaceIdByGroupId`
remains available but is not needed because the instance/binding lookup already
answers it.

### D3 — Global favorites and home tabs never switch

A global favorite is ungrouped and bound with `spaceId === null` → step 2 excludes
it, step 1 never lists it → `null` → no switch (it stays visible across Spaces,
consistent with the favicon-row model and `cross-space-tab-switch` D2). A Lunma
home / new-tab page tab is grouped into the **active** Space → `spaceOwningTab`
returns the active Space → `activateSpaceInWindow` no-ops. The extension's own
sidebar/options pages are not tracked tabs → `null` → no switch.

### D4 — No switch-loop; single switch per activation

`activateSpaceInWindow` → `orchestrateActivation` activates a focus tab **in the
target Space** to move focus into the shown group. That fires a second
`onActivated` whose tab now belongs to the **active** Space, so `spaceOwningTab`
returns the active Space and `activateSpaceInWindow` no-ops (its idempotent guard).
One user activation ⇒ one switch ⇒ terminates. Same-Space activations (the common
case — clicking another tab in the current Space) hit the guard immediately and
pay nothing.

### D5 — Per-window only

`onActivated` carries `activeInfo.windowId`; the derivation and switch are scoped
to that window. Another window's active Space is untouched (per-window active
Space tracking is unchanged).

## Visual language

No new visuals. A focus-driven switch reuses the **existing** Space-switch
transition the sidebar already plays on an external activation: the carousel
glides to the new Space's panel (the 150–250ms compositor tween) and the immersive
aurora/glow wash travels with it — identical to a chip click or a cross-window
activation (`App.svelte`'s reconcile effect already follows
`activeSpaceByWindow`). Reduced-motion and WCAG-AA are inherited from that path.
The only behavioural change a user sees is that focusing a cross-Space tab now
*triggers* that familiar switch instead of stranding them on the wrong Space.

## Risks / Trade-offs

- **Extra orchestration on cross-Space activation could add visible work/flicker**
  → Mitigation: gated to different-Space only (D2/D4 guard); it reuses the exact
  path a manual switch runs, so the cost/visuals match an ordinary switch — which
  is the intended UX.
- **A spurious switch on an untracked/global tab** → Mitigation: `spaceOwningTab`
  returns `null` for anything not owned by a Space (favorites, home tabs,
  extension pages, untracked tabs), so only genuinely Space-owned tabs switch.
- **Switch-loop / double-drain** → Mitigation: D4 — the re-fired `onActivated`
  lands on a tab now in the active Space, so the idempotent helper no-ops; one
  switch per activation. Covered by a dedicated test.
- **`onActivated` is hot** → Mitigation: the added work on the common same-Space
  path is one `spaceOwningTab` store lookup + an equality check; the async switch
  runs only when crossing Spaces.

## Migration Plan

Pure behavioural change — no schema, storage, or message version bump, nothing to
migrate. Rollback is reverting the handler change; no persisted state is affected.

## Open Questions

- None blocking.
