## Why

When you focus a tab that lives in another Space — selecting an open-tab result
in the launcher, clicking a tab in Chrome's tab strip, `Cmd`+number, or any
programmatic activation — Lunma activates the tab but leaves the window showing
the *old* Space: its sidebar and the visible Chrome group don't move, so you land
on a tab whose Space isn't shown. This delivers the Arc invariant users expect —
**the focused tab's Space is always the Space on screen** — closing the
open/temporary-tab gap that `cross-space-tab-switch` deliberately left open
(it scoped itself to pinned saved tabs; design D4 excluded open tabs).

## What Changes

- **Focusing a tab that belongs to another Space switches the window to that
  Space.** Enforced at the single chokepoint `tabs.onActivated` in
  `apps/extension/src/background/handlers/chrome-tabs.ts`: after `setActiveTab`,
  Lunma derives the activated tab's **owning Space in that window** and, when it
  differs from the window's active Space, runs the existing
  `activateSpaceInWindow(ctx, windowId, spaceId)` helper (added by
  `cross-space-tab-switch`, in `handlers/activation.ts`) to switch.
- **Caller-agnostic — fixes every activation path at once.** Because `focusTab`
  (`handlers/temp-tabs.ts`) just calls `chrome.tabs.update({ active: true })`, the
  resulting `onActivated` drives the switch — so the launcher's open-tab result,
  the sidebar's temp-tab click, and a direct Chrome tab-strip click all gain it
  with **no `focusTab` change** and no launcher/surface change.
- **Owning-Space derivation.** A tab's owning Space is the Space whose per-window
  instance lists it (`spaceInstancesByWindow[windowId][spaceId].tempTabIds`), or a
  pinned saved tab bound to it (`tabBindings` → `savedTabs[id].spaceId !== null`),
  resolved by a new pure read helper `spaceOwningTab(state, windowId, tabId)` in
  `handlers/queries.ts`.
- **Global / ungrouped tabs never switch.** A global favorite
  (`savedTabs[id].spaceId === null`) and any ungrouped/untracked tab have **no**
  owning Space → no switch (they are visible across Spaces by design — consistent
  with the favicon-row model and `cross-space-tab-switch` D2). A Lunma home /
  new-tab page tab belongs to the active Space → same Space → no switch.
- **No switch-loop.** `activateSpaceInWindow`'s orchestration activates a tab in
  the *target* Space, which re-fires `onActivated` for a tab now in the active
  Space → owning Space equals active Space → the helper no-ops, so a single
  activation produces a single switch (documented in `design.md`).

## Capabilities

### New Capabilities

<!-- none -->

### Modified Capabilities

- `spaces-and-tabs`: the *Per-window active Space tracking* behaviour gains a
  normative clause — when a tab is activated in a window and that tab has an
  owning Space (a per-window instance lists it, or it is a coupled pinned tab)
  that differs from the window's active Space, Lunma SHALL activate that Space in
  the window (store activation + group orchestration). Tabs with no owning Space
  (global favorites, ungrouped/untracked tabs) and same-Space activations SHALL
  NOT switch.

The `chrome-event-coordination`, `launcher`, and `lunma-bookmark-bindings`
capabilities are **not** modified: the `tabs.onActivated` event shape is
unchanged; the launcher keeps dispatching the same `focusTab`; the switch is
emergent handler behaviour. The `spaces-and-tabs` activation contract is
**reused, not changed** (the handler invokes the existing
`activateSpaceInWindow` sequence).

## Impact

- **Modified handler** — `apps/extension/src/background/handlers/chrome-tabs.ts`:
  `tabs.onActivated` gains the conditional Space switch (reusing
  `activateSpaceInWindow` from `handlers/activation.ts`).
- **New pure helper** — `spaceOwningTab(state, windowId, tabId): SpaceId | null`
  in `apps/extension/src/background/handlers/queries.ts` (pure read over
  `AppState`; no `chrome.*`, no mutation — matches the existing query module's
  contract).
- **No new state, schema, message, permission, dependency, UI surface, or
  primitive.** `activateSpaceInWindow`, `spaceInstancesByWindow`, `tabBindings`,
  and `savedTabs.spaceId` already exist.
- **Tests** — `chrome-tabs`/coordinator `onActivated` handler tests gain
  cross-Space cases (activating a temp tab in another Space switches + the sidebar
  follows; same-Space activation does **not** re-switch; a global favorite /
  ungrouped tab never switches; no switch-loop during orchestration), plus a
  Playwright e2e mirroring `e2e/cross-space-switch.spec.ts` that focuses a
  cross-Space **open** tab from the launcher and asserts the sidebar's
  active-Space chip moves.
- **Docs** — the `openspec/specs/spaces-and-tabs` spec notes the
  activation-time Space switch. No `docs/` change (no layer-DAG, schema, or stack
  change); the active-Space model in `docs/architecture.md` is unchanged in shape.
